"use strict";

const { execFile } = require("node:child_process");
const fs = require("node:fs/promises");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);

const FILE_ATTRIBUTE_HIDDEN = 0x2;
const FILE_ATTRIBUTE_NORMAL = 0x80;
const INVALID_FILE_ATTRIBUTES = 0xffffffff;

let native = null;

function loadNative() {
  if (native !== null) return native;

  if (process.platform !== "win32") {
    native = { available: false, reason: "仅支持 Windows" };
    return native;
  }

  try {
    const koffi = require("koffi");
    const kernel32 = koffi.load("kernel32.dll");

    native = {
      available: true,
      GetFileAttributesW: kernel32.func(
        "uint32_t GetFileAttributesW(str16 lpFileName)"
      ),
      SetFileAttributesW: kernel32.func(
        "bool SetFileAttributesW(str16 lpFileName, uint32_t dwFileAttributes)"
      ),
      GetLastError: kernel32.func("uint32_t GetLastError()")
    };
  } catch (error) {
    native = {
      available: false,
      reason: error && error.message ? error.message : String(error),
      error
    };
  }

  return native;
}

function errorMessage(error) {
  if (!error) return "未知错误";
  if (error.code === "ENOENT") return "文件或文件夹不存在";
  if (error.code) return `${error.code}: ${error.message}`;
  return error.message || String(error);
}

async function getNativeAttributes(filePath) {
  const api = loadNative();
  if (!api.available) throw new Error(`无法加载 Win32 文件属性接口：${api.reason}`);

  const attributes = api.GetFileAttributesW(filePath);
  if (attributes === INVALID_FILE_ATTRIBUTES) {
    const code = api.GetLastError();
    throw new Error(`无法读取文件属性（Win32 错误 ${code}）：${filePath}`);
  }

  return attributes;
}

async function getAttribAttributes(filePath) {
  const { stdout } = await execFileAsync("attrib", [filePath], {
    windowsHide: true
  });
  const line = String(stdout).split(/\r?\n/).find((item) => item.trim());
  if (!line) throw new Error(`无法读取文件属性：${filePath}`);

  const flags = line.trim().split(/\s+/)[0];
  let attributes = 0;
  if (flags.includes("H")) attributes |= FILE_ATTRIBUTE_HIDDEN;
  return attributes;
}

async function getAttributes(filePath) {
  const api = loadNative();

  if (api.available) {
    return getNativeAttributes(filePath);
  }

  return getAttribAttributes(filePath);
}

function withHidden(attributes) {
  if ((attributes & ~FILE_ATTRIBUTE_NORMAL) === 0) {
    return FILE_ATTRIBUTE_HIDDEN;
  }

  return attributes | FILE_ATTRIBUTE_HIDDEN;
}

function withoutHidden(attributes) {
  const next = attributes & ~FILE_ATTRIBUTE_HIDDEN;
  return next === 0 ? FILE_ATTRIBUTE_NORMAL : next;
}

async function setNativeAttributes(filePath, attributes) {
  const api = loadNative();
  if (!api.available) throw new Error(`无法加载 Win32 文件属性接口：${api.reason}`);

  if (!api.SetFileAttributesW(filePath, attributes)) {
    const code = api.GetLastError();
    throw new Error(`无法设置文件属性（Win32 错误 ${code}）：${filePath}`);
  }
}

async function setAttribAttributes(filePath, hidden) {
  await execFileAsync("attrib", [hidden ? "+H" : "-H", filePath], {
    windowsHide: true
  });
}

async function setAttributes(filePath, attributes, hidden) {
  const api = loadNative();

  if (api.available) {
    await setNativeAttributes(filePath, attributes);
    return;
  }

  await setAttribAttributes(filePath, hidden);
}

async function statItem(filePath) {
  const stat = await fs.lstat(filePath);

  if (!stat.isFile() && !stat.isDirectory()) {
    throw new Error(`不是普通文件或文件夹：${filePath}`);
  }

  return stat;
}

async function isHidden(filePath) {
  try {
    await statItem(filePath);
    const attributes = await getAttributes(filePath);
    return (attributes & FILE_ATTRIBUTE_HIDDEN) !== 0;
  } catch (error) {
    return false;
  }
}

async function hideItem(filePath) {
  try {
    const stat = await statItem(filePath);
    const attributes = await getAttributes(filePath);
    const hiddenBefore = (attributes & FILE_ATTRIBUTE_HIDDEN) !== 0;

    if (hiddenBefore) {
      return {
        ok: true,
        changed: false,
        hiddenBefore: true,
        kind: stat.isDirectory() ? "folder" : "file"
      };
    }

    await setAttributes(filePath, withHidden(attributes), true);

    return {
      ok: true,
      changed: true,
      hiddenBefore: false,
      kind: stat.isDirectory() ? "folder" : "file"
    };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

async function restoreItem(filePath, hiddenBefore) {
  try {
    const stat = await statItem(filePath);

    if (hiddenBefore) {
      return {
        ok: true,
        changed: false,
        hiddenBefore: true,
        kind: stat.isDirectory() ? "folder" : "file"
      };
    }

    const attributes = await getAttributes(filePath);

    if ((attributes & FILE_ATTRIBUTE_HIDDEN) === 0) {
      return {
        ok: true,
        changed: false,
        hiddenBefore: false,
        kind: stat.isDirectory() ? "folder" : "file"
      };
    }

    await setAttributes(filePath, withoutHidden(attributes), false);

    return {
      ok: true,
      changed: true,
      hiddenBefore: false,
      kind: stat.isDirectory() ? "folder" : "file"
    };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

module.exports = {
  FILE_ATTRIBUTE_HIDDEN,
  FILE_ATTRIBUTE_NORMAL,
  errorMessage,
  getAttributes,
  hideItem,
  isHidden,
  restoreItem
};
