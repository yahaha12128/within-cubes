"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const QUICK_ACCESS_VERSION = 1;
const MAX_QUICK_FILES = 100;

function normalizePathKey(value) {
  const resolved = path.resolve(String(value));
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function normalizeKind(value) {
  return value === "folder" ? "folder" : "file";
}

function normalizeQuickFile(value) {
  if (!value || typeof value !== "object") return null;

  const rawPath = typeof value.path === "string" ? value.path.trim() : "";
  if (!rawPath) return null;

  const filePath = path.resolve(rawPath);
  const name = typeof value.name === "string" && value.name.trim()
    ? value.name.trim()
    : path.basename(filePath);
  const addedAt = typeof value.addedAt === "string" && !Number.isNaN(Date.parse(value.addedAt))
    ? new Date(value.addedAt).toISOString()
    : new Date(0).toISOString();

  return {
    path: filePath,
    name,
    kind: normalizeKind(value.kind),
    addedAt
  };
}

function createEmptyQuickAccess() {
  return {
    version: QUICK_ACCESS_VERSION,
    files: []
  };
}

function normalizeQuickAccess(data) {
  const source = data && typeof data === "object" ? data : {};
  const files = [];
  const seen = new Set();
  const values = Array.isArray(source.files) ? source.files : [];

  for (const value of values) {
    if (files.length >= MAX_QUICK_FILES) break;
    const file = normalizeQuickFile(value);
    if (!file) continue;

    const key = normalizePathKey(file.path);
    if (seen.has(key)) continue;

    seen.add(key);
    files.push(file);
  }

  return {
    version: QUICK_ACCESS_VERSION,
    files
  };
}

async function loadQuickAccess(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return normalizeQuickAccess(JSON.parse(raw));
  } catch (error) {
    return createEmptyQuickAccess();
  }
}

async function saveQuickAccess(filePath, data) {
  const normalized = normalizeQuickAccess(data);
  const directory = path.dirname(filePath);
  const temporaryPath = `${filePath}.tmp`;

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(temporaryPath, JSON.stringify(normalized, null, 2), "utf8");
  await fs.rename(temporaryPath, filePath);

  return normalized;
}

function addQuickFile(state, { path: filePath, name, kind = "file", addedAt = new Date() }) {
  if (!state || !Array.isArray(state.files)) {
    return { changed: false, error: "快速收纳尚未初始化。" };
  }

  if (typeof filePath !== "string" || !filePath.trim()) {
    return { changed: false, error: "文件路径无效。" };
  }

  if (state.files.length >= MAX_QUICK_FILES) {
    return { changed: false, error: `快速收纳最多保存 ${MAX_QUICK_FILES} 项。` };
  }

  const key = normalizePathKey(filePath);

  if (state.files.some((file) => normalizePathKey(file.path) === key)) {
    return { changed: false, error: "这个文件已经在快速收纳里了。" };
  }

  const when = addedAt instanceof Date && !Number.isNaN(addedAt.getTime())
    ? addedAt.toISOString()
    : new Date().toISOString();

  const item = {
    path: path.resolve(filePath.trim()),
    name: typeof name === "string" && name.trim()
      ? name.trim()
      : path.basename(filePath),
    kind: normalizeKind(kind),
    addedAt: when
  };

  state.files.push(item);

  return { changed: true, item };
}

function removeQuickFile(state, filePath) {
  if (!state || !Array.isArray(state.files) || typeof filePath !== "string") {
    return { changed: false };
  }

  const key = normalizePathKey(filePath);
  const index = state.files.findIndex(
    (file) => normalizePathKey(file.path) === key
  );

  if (index === -1) return { changed: false };

  const [removed] = state.files.splice(index, 1);
  return { changed: true, item: removed };
}

function clearQuickFiles(state) {
  if (!state || !Array.isArray(state.files)) return { changed: false, count: 0 };

  const count = state.files.length;
  state.files = [];
  return { changed: count > 0, count };
}

module.exports = {
  QUICK_ACCESS_VERSION,
  MAX_QUICK_FILES,
  normalizeQuickFile,
  createEmptyQuickAccess,
  normalizeQuickAccess,
  loadQuickAccess,
  saveQuickAccess,
  addQuickFile,
  removeQuickFile,
  clearQuickFiles
};
