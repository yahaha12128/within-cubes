"use strict";

// Win32 desktop-layer primitives for the WorkerW feasibility demo.
//
// This module is intentionally standalone: it is not imported by the
// production app. It uses koffi, already present in the project dependencies.

const GWL_STYLE = -16;
const GWL_EXSTYLE = -20;
const GW_OWNER = 4;
const GA_ROOT = 2;

const WS_POPUP = 0x80000000;
const WS_CHILD = 0x40000000;
const WS_VISIBLE = 0x10000000;

const WS_EX_TRANSPARENT = 0x00000020;
const WS_EX_TOOLWINDOW = 0x00000080;
const WS_EX_APPWINDOW = 0x00040000;

const WM_SPAWN_WORKER = 0x052c;

const SWP_NOSIZE = 0x0001;
const SWP_NOACTIVATE = 0x0010;
const SWP_FRAMECHANGED = 0x0020;
const SWP_SHOWWINDOW = 0x0040;
const HWND_TOP = 0;

const MAX_TOP_LEVEL_SCAN = 512;

let native = null;

function toNumber(value) {
  if (typeof value === "bigint") {
    return value >= 0n && value <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(value)
      : null;
  }

  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.trunc(value);
  }

  return null;
}

function normalizeHandle(value) {
  const handle = toNumber(value);
  return handle !== null && handle > 0 ? handle : null;
}

function hex(value) {
  const handle = normalizeHandle(value);
  return handle === null ? "0x0" : `0x${handle.toString(16).toUpperCase()}`;
}

function loadNative() {
  if (native !== null) return native;

  if (process.platform !== "win32") {
    native = {
      available: false,
      reason: `WorkerW demo requires Windows, current platform: ${process.platform}`
    };
    return native;
  }

  try {
    const koffi = require("koffi");
    const user32 = koffi.load("user32.dll");

    native = {
      available: true,
      FindWindowW: user32.func(
        "uintptr_t FindWindowW(str16 lpClassName, str16 lpWindowName)"
      ),
      FindWindowExW: user32.func(
        "uintptr_t FindWindowExW(uintptr_t hWndParent, uintptr_t hWndChildAfter, str16 lpszClass, str16 lpszWindow)"
      ),
      SendMessageW: user32.func(
        "intptr_t SendMessageW(uintptr_t hWnd, uint32_t Msg, uintptr_t wParam, intptr_t lParam)"
      ),
      SetParent: user32.func(
        "uintptr_t SetParent(uintptr_t hWndChild, uintptr_t hWndNewParent)"
      ),
      GetParent: user32.func("uintptr_t GetParent(uintptr_t hWnd)"),
      GetAncestor: user32.func(
        "uintptr_t GetAncestor(uintptr_t hwnd, uint32_t gaFlags)"
      ),
      GetWindow: user32.func(
        "uintptr_t GetWindow(uintptr_t hWnd, uint32_t uCmd)"
      ),
      IsWindow: user32.func("bool IsWindow(uintptr_t hWnd)"),
      IsWindowVisible: user32.func("bool IsWindowVisible(uintptr_t hWnd)"),
      GetWindowLongPtrW: user32.func(
        "intptr_t GetWindowLongPtrW(uintptr_t hWnd, int nIndex)"
      ),
      SetWindowLongPtrW: user32.func(
        "intptr_t SetWindowLongPtrW(uintptr_t hWnd, int nIndex, intptr_t dwNewLong)"
      ),
      GetWindowRect: user32.func(
        "bool GetWindowRect(uintptr_t hWnd, _Out_ int *lpRect)"
      ),
      GetClientRect: user32.func(
        "bool GetClientRect(uintptr_t hWnd, _Out_ int *lpRect)"
      ),
      ScreenToClient: user32.func(
        "bool ScreenToClient(uintptr_t hWnd, _Inout_ int *lpPoint)"
      ),
      ClientToScreen: user32.func(
        "bool ClientToScreen(uintptr_t hWnd, _Inout_ int *lpPoint)"
      ),
      SetWindowPos: user32.func(
        "bool SetWindowPos(uintptr_t hWnd, uintptr_t hWndInsertAfter, int X, int Y, int cx, int cy, uint32_t uFlags)"
      ),
      GetClassNameA: user32.func(
        "int GetClassNameA(uintptr_t hWnd, _Out_ char *lpClassName, int nMaxCount)"
      )
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

function getClassName(api, hwnd) {
  const handle = normalizeHandle(hwnd);
  if (handle === null) return "";

  const buffer = Buffer.alloc(256);
  const length = api.GetClassNameA(handle, buffer, buffer.length);
  if (!length || length < 0) return "";

  return buffer.toString("ascii", 0, Math.min(length, buffer.length));
}

function discoverWorkerWWalk(api) {
  const workers = [];
  let after = 0;

  for (let index = 0; index < MAX_TOP_LEVEL_SCAN; index += 1) {
    const worker = normalizeHandle(
      api.FindWindowExW(0, after, "WorkerW", null)
    );

    if (worker === null) break;

    const defView = normalizeHandle(
      api.FindWindowExW(worker, 0, "SHELLDLL_DefView", null)
    );

    workers.push({
      hwnd: worker,
      defView,
      className: "WorkerW",
      visible: Boolean(api.IsWindowVisible(worker))
    });
    after = worker;
  }

  return workers;
}

// Find the desktop window that hosts SHELLDLL_DefView.
//
// Preference order:
//   1. A top-level WorkerW containing SHELLDLL_DefView. This is the icon
//      host on Windows 10/11 configurations where Explorer splits Progman.
//   2. Progman itself when SHELLDLL_DefView is its child (the classic layout).
//
// If neither exists, send Explorer's undocumented 0x052C message once to ask
// it to create the WorkerW, then scan again.
function findWorkerW(api = loadNative()) {
  if (!api.available) {
    throw new Error(api.reason || "Win32 API is unavailable");
  }

  const find = () => {
    const progman = normalizeHandle(api.FindWindowW("Progman", null));
    const workers = discoverWorkerWWalk(api);
    const workerHost = workers.find((entry) => entry.defView !== null) || null;
    const progmanDefView = progman === null
      ? null
      : normalizeHandle(
        api.FindWindowExW(progman, 0, "SHELLDLL_DefView", null)
      );

    return {
      progman,
      workers,
      progmanDefView,
      host: workerHost || (
        progmanDefView === null
          ? null
          : {
            hwnd: progman,
            defView: progmanDefView,
            className: "Progman",
            visible: Boolean(api.IsWindowVisible(progman))
          }
      )
    };
  };

  let result = find();
  let spawned = false;

  if (result.host === null && result.progman !== null) {
    api.SendMessageW(result.progman, WM_SPAWN_WORKER, 0, 0);
    spawned = true;
    result = find();
  }

  if (result.host === null) {
    throw new Error(
      "SHELLDLL_DefView was not found under Progman or any top-level WorkerW"
    );
  }

  return {
    progman: result.progman,
    host: result.host.hwnd,
    hostClass: result.host.className,
    hostVisible: result.host.visible,
    defView: result.host.defView,
    workers: result.workers,
    spawned
  };
}

function readWindowDiagnostics(api, hwnd) {
  const handle = normalizeHandle(hwnd);
  if (handle === null || !api.IsWindow(handle)) {
    return {
      valid: false,
      hwnd: hex(handle),
      reason: "invalid HWND"
    };
  }

  const parent = normalizeHandle(api.GetParent(handle));
  const owner = normalizeHandle(api.GetWindow(handle, GW_OWNER));
  const root = normalizeHandle(api.GetAncestor(handle, GA_ROOT));
  const style = Number(api.GetWindowLongPtrW(handle, GWL_STYLE)) >>> 0;
  const exStyle = Number(api.GetWindowLongPtrW(handle, GWL_EXSTYLE)) >>> 0;
  const rect = [0, 0, 0, 0];
  const hasRect = Boolean(api.GetWindowRect(handle, rect));

  return {
    valid: true,
    hwnd: hex(handle),
    className: getClassName(api, handle),
    parent: parent === null ? "0x0" : hex(parent),
    parentClass: parent === null ? "" : getClassName(api, parent),
    owner: owner === null ? "0x0" : hex(owner),
    ownerClass: owner === null ? "" : getClassName(api, owner),
    root: root === null ? "0x0" : hex(root),
    rootClass: root === null ? "" : getClassName(api, root),
    visible: Boolean(api.IsWindowVisible(handle)),
    isChildStyle: (style & WS_CHILD) !== 0,
    isPopupStyle: (style & WS_POPUP) !== 0,
    isLayered: (exStyle & 0x00080000) !== 0,
    isClickThroughStyle: (exStyle & WS_EX_TRANSPARENT) !== 0,
    style: `0x${style.toString(16).toUpperCase()}`,
    exStyle: `0x${exStyle.toString(16).toUpperCase()}`,
    rect: hasRect
      ? {
        left: rect[0],
        top: rect[1],
        width: rect[2] - rect[0],
        height: rect[3] - rect[1]
      }
      : null
  };
}

function getWindowRect(api, hwnd) {
  const handle = normalizeHandle(hwnd);
  if (handle === null) return null;

  const rect = [0, 0, 0, 0];
  if (!api.GetWindowRect(handle, rect)) return null;

  return {
    left: rect[0],
    top: rect[1],
    right: rect[2],
    bottom: rect[3],
    width: rect[2] - rect[0],
    height: rect[3] - rect[1]
  };
}

function getClientRect(api, hwnd) {
  const handle = normalizeHandle(hwnd);
  if (handle === null) return null;

  const rect = [0, 0, 0, 0];
  if (!api.GetClientRect(handle, rect)) return null;

  return {
    width: rect[2] - rect[0],
    height: rect[3] - rect[1]
  };
}

// Reparent the Electron HWND into the desktop host and turn it into a real
// Win32 child. Keeping WS_POPUP and WS_CHILD on the same window is invalid, so
// WS_POPUP is cleared explicitly.
//
// We deliberately remove WS_EX_TRANSPARENT: that extended style makes the
// whole window click-through. Mouse input must reach Chromium for HTML buttons
// to work.
function attachToDesktop(api, hwnd, host, options = {}) {
  const handle = normalizeHandle(hwnd);
  const hostHandle = normalizeHandle(host);

  if (!api.available) {
    throw new Error(api.reason || "Win32 API is unavailable");
  }
  if (handle === null || !api.IsWindow(handle)) {
    throw new Error("Invalid Electron HWND");
  }
  if (hostHandle === null || !api.IsWindow(hostHandle)) {
    throw new Error("Invalid WorkerW/Progman HWND");
  }

  const before = readWindowDiagnostics(api, handle);
  const beforeRect = getWindowRect(api, handle);
  const style = Number(api.GetWindowLongPtrW(handle, GWL_STYLE)) >>> 0;
  const exStyle = Number(api.GetWindowLongPtrW(handle, GWL_EXSTYLE)) >>> 0;

  const childStyle = (
    (style & ~WS_POPUP) |
    WS_CHILD |
    WS_VISIBLE
  ) >>> 0;
  const childExStyle = (
    (exStyle | WS_EX_TOOLWINDOW) &
    ~WS_EX_APPWINDOW &
    ~WS_EX_TRANSPARENT
  ) >>> 0;

  // Style first, then reparent: Explorer never sees a popup window inside its
  // WorkerW child tree.
  api.SetWindowLongPtrW(handle, GWL_STYLE, childStyle | 0);
  api.SetWindowLongPtrW(handle, GWL_EXSTYLE, childExStyle | 0);

  const previousParent = normalizeHandle(api.SetParent(handle, hostHandle));
  const parent = normalizeHandle(api.GetParent(handle));

  if (parent !== hostHandle) {
    throw new Error(
      `SetParent failed: expected parent ${hex(hostHandle)}, got ${hex(parent)}`
    );
  }

  let x = options.x;
  let y = options.y;

  if (beforeRect !== null) {
    if (typeof x !== "number" || typeof y !== "number") {
      const point = [beforeRect.left, beforeRect.top];
      if (!api.ScreenToClient(hostHandle, point)) {
        throw new Error("ScreenToClient failed while positioning the demo");
      }
      x = point[0];
      y = point[1];
    }
  } else if (typeof x !== "number" || typeof y !== "number") {
    x = 0;
    y = 0;
  }

  const width = beforeRect === null ? 480 : beforeRect.width;
  const height = beforeRect === null ? 320 : beforeRect.height;

  const positioned = Boolean(
    api.SetWindowPos(
      handle,
      HWND_TOP,
      Math.round(x),
      Math.round(y),
      width,
      height,
      SWP_NOACTIVATE | SWP_FRAMECHANGED | SWP_SHOWWINDOW
    )
  );

  if (!positioned) {
    throw new Error("SetWindowPos failed after SetParent");
  }

  const after = readWindowDiagnostics(api, handle);

  return {
    previousParent: previousParent === null ? "0x0" : hex(previousParent),
    host: hex(hostHandle),
    hostClass: getClassName(api, hostHandle),
    hostRect: getWindowRect(api, hostHandle),
    hostClientRect: getClientRect(api, hostHandle),
    before,
    after,
    usingAbsolutePosition: typeof options.x === "number" && typeof options.y === "number"
  };
}

function reapplyZOrder(api, hwnd) {
  const handle = normalizeHandle(hwnd);
  if (handle === null) return false;

  const rect = getWindowRect(api, handle);
  if (rect === null) return false;

  const parent = normalizeHandle(api.GetParent(handle));
  if (parent === null) return false;

  const point = [rect.left, rect.top];
  if (!api.ScreenToClient(parent, point)) return false;

  return Boolean(
    api.SetWindowPos(
      handle,
      HWND_TOP,
      point[0],
      point[1],
      rect.width,
      rect.height,
      SWP_NOACTIVATE | SWP_SHOWWINDOW
    )
  );
}

function getNativeWindowHandle(win) {
  if (!win || win.isDestroyed()) return null;

  try {
    const buffer = win.getNativeWindowHandle();
    if (!Buffer.isBuffer(buffer) || buffer.length < 4) return null;

    // Electron returns the pointer-sized HWND in native byte order. HWNDs on
    // Windows are pointer-sized, but current Windows user handles fit in the
    // lower 32 bits. Match the project's existing helper.
    const handle = buffer.readUInt32LE(0);
    return handle > 0 ? handle : null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  GWL_EXSTYLE,
  GWL_STYLE,
  WS_CHILD,
  WS_EX_TRANSPARENT,
  WS_POPUP,
  attachToDesktop,
  findWorkerW,
  getClassName,
  getNativeWindowHandle,
  getWindowRect,
  hex,
  loadNative,
  readWindowDiagnostics,
  reapplyZOrder
};
