"use strict";

const HWND_BOTTOM = 1;
const SWP_NOSIZE = 0x0001;
const SWP_NOMOVE = 0x0002;
const SWP_NOACTIVATE = 0x0010;
const BOTTOM_FLAGS = SWP_NOSIZE | SWP_NOMOVE | SWP_NOACTIVATE;
const VK_LBUTTON = 0x01;
const VK_SHIFT = 0x10;
const VK_CONTROL = 0x11;
const VK_MENU = 0x12;
const VK_V = 0x56;

const SHELL_WINDOW_CLASSES = new Set([
  "Progman",
  "WorkerW",
  "SHELLDLL_DefView",
  "SysListView32",
  "Shell_TrayWnd",
  "Shell_SecondaryTrayWnd",
  "DV2ControlHost"
]);

let native = null;
let embeddedFocusAttachments = [];

function loadNative() {
  if (native !== null) return native;

  if (process.platform !== "win32") {
    native = { available: false, reason: "not-windows" };
    return native;
  }

  try {
    const koffi = require("koffi");
    const user32 = koffi.load("user32.dll");
    const kernel32 = koffi.load("kernel32.dll");

    native = {
      available: true,
      SetWindowPos: user32.func(
        "bool SetWindowPos(uintptr_t hWnd, uintptr_t hWndInsertAfter, int X, int Y, int cx, int cy, uint32_t uFlags)"
      ),
      GetForegroundWindow: user32.func("uintptr_t GetForegroundWindow()"),
      GetWindowRect: user32.func(
        "bool GetWindowRect(uintptr_t hWnd, _Out_ int *lpRect)"
      ),
      GetClassNameA: user32.func(
        "int GetClassNameA(uintptr_t hWnd, _Out_ char *lpClassName, int nMaxCount)"
      ),
      GetDpiForWindow: user32.func("uint32_t GetDpiForWindow(uintptr_t hWnd)"),
      IsWindowVisible: user32.func("bool IsWindowVisible(uintptr_t hWnd)"),
      GetAsyncKeyState: user32.func("int GetAsyncKeyState(int vKey)"),
      GetCursorPos: user32.func("bool GetCursorPos(_Out_ int *lpPoint)"),
      WindowFromPoint: user32.func("uintptr_t WindowFromPoint(int x, int y)"),
      GetWindowThreadProcessId: user32.func(
        "uint32_t GetWindowThreadProcessId(uintptr_t hWnd, _Out_ uint32_t *lpdwProcessId)"
      ),
      AttachThreadInput: user32.func(
        "bool AttachThreadInput(uint32_t idAttach, uint32_t idAttachTo, bool fAttach)"
      ),
      SetActiveWindow: user32.func("uintptr_t SetActiveWindow(uintptr_t hWnd)"),
      SetFocus: user32.func("uintptr_t SetFocus(uintptr_t hWnd)"),
      GetFocus: user32.func("uintptr_t GetFocus()"),
      GetCurrentThreadId: kernel32.func("uint32_t GetCurrentThreadId()")
    };
  } catch (error) {
    console.warn("[window-layer] 无法加载 Win32 接口:", error.message);
    native = { available: false, reason: error.message, error };
  }

  return native;
}

function normalizeHandle(value) {
  if (typeof value === "bigint") {
    return value > 0n && value <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(value)
      : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? Math.trunc(value) : null;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
}

function getNativeWindowHandle(win) {
  if (!win || win.isDestroyed()) return null;

  try {
    const buffer = win.getNativeWindowHandle();

    if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
      return null;
    }

    // Windows 的 HWND 值在 64 位进程中也只占低 32 位。
    const handle = buffer.readUInt32LE(0);
    return handle > 0 ? handle : null;
  } catch (error) {
    return null;
  }
}

function isNativeAvailable() {
  return loadNative().available === true;
}

function moveWindowToBottom(win) {
  const api = loadNative();

  if (!api.available) return false;

  const hwnd = getNativeWindowHandle(win);
  if (hwnd === null) return false;

  try {
    return Boolean(
      api.SetWindowPos(
        hwnd,
        HWND_BOTTOM,
        0,
        0,
        0,
        0,
        BOTTOM_FLAGS
      )
    );
  } catch (error) {
    return false;
  }
}

function getForegroundWindowInfo() {
  const api = loadNative();

  if (!api.available) return null;

  try {
    const hwnd = normalizeHandle(api.GetForegroundWindow());
    if (hwnd === null) return null;

    if (!api.IsWindowVisible(hwnd)) return null;

    const rect = [0, 0, 0, 0];
    if (!api.GetWindowRect(hwnd, rect)) return null;

    const width = rect[2] - rect[0];
    const height = rect[3] - rect[1];

    if (width <= 0 || height <= 0) return null;

    const classBuffer = Buffer.alloc(256);
    const classLength = api.GetClassNameA(hwnd, classBuffer, 256);
    const className = classLength > 0
      ? classBuffer.toString("ascii", 0, Math.min(classLength, 256))
      : "";

    return {
      hwnd,
      className,
      dpi: api.GetDpiForWindow(hwnd) || 96,
      rect: {
        x: rect[0],
        y: rect[1],
        width,
        height
      }
    };
  } catch (error) {
    return null;
  }
}

function isShellWindowClass(className) {
  return SHELL_WINDOW_CLASSES.has(className);
}

function getCursorWindowInfo() {
  const api = loadNative();

  if (!api.available) return null;

  try {
    const point = [0, 0];
    if (!api.GetCursorPos(point)) return null;

    const hwnd = normalizeHandle(api.WindowFromPoint(point[0], point[1]));
    if (hwnd === null) return null;

    const classBuffer = Buffer.alloc(256);
    const classLength = api.GetClassNameA(hwnd, classBuffer, 256);
    const className = classLength > 0
      ? classBuffer.toString("ascii", 0, Math.min(classLength, 256))
      : "";
    const processId = [0];

    try {
      api.GetWindowThreadProcessId(hwnd, processId);
    } catch (error) {
      // Keep the class-only result; callers that need the owner treat 0 as
      // unknown.
    }

    return {
      hwnd,
      className,
      processId: Number(processId[0]) || 0,
      point: { x: point[0], y: point[1] }
    };
  } catch (error) {
    return null;
  }
}

function getWindowThreadId(api, hwnd) {
  const processId = [0];

  try {
    return Number(api.GetWindowThreadProcessId(hwnd, processId)) || 0;
  } catch (error) {
    return 0;
  }
}

// The desktop layer is a WS_CHILD of Explorer's WorkerW. A click gives the
// renderer DOM focus, but Windows still sends keyboard input to Explorer's
// foreground queue. While a text control is focused we attach the Electron
// thread to the foreground thread and move native focus to the layer.
function focusEmbeddedWindow(win) {
  const api = loadNative();

  if (!api.available) return { ok: false, reason: "native-unavailable" };

  const hwnd = getNativeWindowHandle(win);
  const foreground = hwnd === null
    ? null
    : normalizeHandle(api.GetForegroundWindow());

  if (hwnd === null || foreground === null) {
    return { ok: false, reason: "window-unavailable" };
  }

  releaseEmbeddedWindowFocus();

  const foregroundThread = getWindowThreadId(api, foreground);
  const targetThread = getWindowThreadId(api, hwnd);
  const currentThread = Number(api.GetCurrentThreadId()) || 0;

  if (!foregroundThread || !targetThread || !currentThread) {
    return { ok: false, reason: "thread-unavailable" };
  }

  const attachments = [];

  for (const threadId of [foregroundThread, targetThread]) {
    if (threadId === currentThread) continue;

    try {
      if (api.AttachThreadInput(currentThread, threadId, true)) {
        attachments.push(threadId);
      }
    } catch (error) {
      // Continue; SetFocus may still work when Electron owns the UI thread.
    }
  }

  let activeWindow = null;
  let focus = null;

  try {
    activeWindow = api.SetActiveWindow(hwnd);
    api.SetFocus(hwnd);
    focus = api.GetFocus();
  } catch (error) {
    for (const threadId of attachments) {
      try {
        api.AttachThreadInput(currentThread, threadId, false);
      } catch (detachError) {
        // Ignore a failed rollback.
      }
    }

    return { ok: false, reason: error.message || "focus-failed" };
  }

  embeddedFocusAttachments = attachments.map((threadId) => ({
    currentThread,
    threadId
  }));

  return {
    ok: true,
    hwnd,
    foregroundThread,
    targetThread,
    currentThread,
    activeWindow,
    focus,
    attachments: attachments.slice()
  };
}

function releaseEmbeddedWindowFocus() {
  if (embeddedFocusAttachments.length === 0) return;

  const api = loadNative();
  const attachments = embeddedFocusAttachments;
  embeddedFocusAttachments = [];

  if (!api.available) return;

  for (const { currentThread, threadId } of attachments) {
    try {
      api.AttachThreadInput(currentThread, threadId, false);
    } catch (error) {
      // The input queues may already have been detached after Explorer restarted.
    }
  }
}

// 返回鼠标左键是否按下；原生接口不可用时返回 null，由调用方决定如何降级。
function isPrimaryButtonDown() {
  const api = loadNative();

  if (!api.available) return null;

  try {
    return (api.GetAsyncKeyState(VK_LBUTTON) & 0x8000) !== 0;
  } catch (error) {
    return null;
  }
}

// Ctrl+Alt+V 的系统级兜底检测。RegisterHotKey 可能被其他应用抢占，
// 但 GetAsyncKeyState 仍然能读到按键的实时状态。
function isPrivacyShortcutDown() {
  const api = loadNative();

  if (!api.available) return false;

  try {
    const control = (api.GetAsyncKeyState(VK_CONTROL) & 0x8000) !== 0;
    const alt = (api.GetAsyncKeyState(VK_MENU) & 0x8000) !== 0;
    const shift = (api.GetAsyncKeyState(VK_SHIFT) & 0x8000) !== 0;
    const v = (api.GetAsyncKeyState(VK_V) & 0x8000) !== 0;

    return control && alt && !shift && v;
  } catch (error) {
    return false;
  }
}

module.exports = {
  focusEmbeddedWindow,
  getCursorWindowInfo,
  getForegroundWindowInfo,
  getNativeWindowHandle,
  isNativeAvailable,
  isPrimaryButtonDown,
  isPrivacyShortcutDown,
  isShellWindowClass,
  moveWindowToBottom,
  releaseEmbeddedWindowFocus
};
