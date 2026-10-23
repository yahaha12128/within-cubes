"use strict";

// Minimal Win32 bridge for embedding a BrowserWindow into the Explorer
// desktop. This is deliberately isolated from the rest of the app so the
// unsupported shell-window trick can be replaced or disabled independently.
//
// The visual result is a regular WS_CHILD window inside the WorkerW that also
// hosts SHELLDLL_DefView. Because its top-level ancestor is the desktop, it is
// painted above the wallpaper and below normal application windows, and is not
// part of the Win+D window set.

const GWL_STYLE = -16;
const GWL_EXSTYLE = -20;

const WS_POPUP = 0x80000000;
const WS_CHILD = 0x40000000;
const WS_VISIBLE = 0x10000000;
const WS_CLIPSIBLINGS = 0x04000000;

const WS_EX_TRANSPARENT = 0x00000020;
const WS_EX_TOOLWINDOW = 0x00000080;
const WS_EX_APPWINDOW = 0x00040000;

const WM_SPAWN_WORKER = 0x052c;

const SWP_NOACTIVATE = 0x0010;
const SWP_FRAMECHANGED = 0x0020;
const SWP_SHOWWINDOW = 0x0040;
const SWP_NOZORDER = 0x0004;
const HWND_TOP = 0;

const SW_HIDE = 0;
const SW_SHOW = 5;

const MAX_TOP_LEVEL_SCAN = 512;

let native = null;

function normalizeHandle(value) {
  if (typeof value === "bigint") {
    return value > 0n && value <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(value)
      : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? Math.trunc(value) : null;
  }

  return null;
}

function handleHex(value) {
  const handle = normalizeHandle(value);
  return handle === null ? "0x0" : `0x${handle.toString(16).toUpperCase()}`;
}

function loadNative() {
  if (native !== null) return native;

  if (process.platform !== "win32") {
    native = {
      available: false,
      reason: `WorkerW embedding requires Windows, current platform: ${process.platform}`
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
      IsWindow: user32.func("bool IsWindow(uintptr_t hWnd)"),
      IsWindowVisible: user32.func("bool IsWindowVisible(uintptr_t hWnd)"),
      ShowWindow: user32.func("bool ShowWindow(uintptr_t hWnd, int nCmdShow)"),
      GetWindowLongPtrW: user32.func(
        "intptr_t GetWindowLongPtrW(uintptr_t hWnd, int nIndex)"
      ),
      SetWindowLongPtrW: user32.func(
        "intptr_t SetWindowLongPtrW(uintptr_t hWnd, int nIndex, intptr_t dwNewLong)"
      ),
      GetWindowRect: user32.func(
        "bool GetWindowRect(uintptr_t hWnd, _Out_ int *lpRect)"
      ),
      ScreenToClient: user32.func(
        "bool ScreenToClient(uintptr_t hWnd, _Inout_ int *lpPoint)"
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

// A WS_CHILD window is positioned in its parent's *client* space, while every
// caller here thinks in screen pixels. Once the layer is reparented under the
// desktop host that difference matters: the host spans the whole virtual
// desktop, which starts above/left of the primary work area on multi-monitor
// setups. Passing screen coordinates straight to SetWindowPos/BrowserWindow
// bounds therefore shifts the window by the host origin — 324px too high on a
// desktop whose secondary display sits above the primary.
function toParentClientRect(hwnd, rect, api = loadNative()) {
  const handle = normalizeHandle(hwnd);
  if (handle === null || !api || !api.available || !api.IsWindow(handle)) {
    return null;
  }

  const next = {
    x: Math.round(Number(rect.x) || 0),
    y: Math.round(Number(rect.y) || 0),
    width: Math.max(1, Math.round(Number(rect.width) || 1)),
    height: Math.max(1, Math.round(Number(rect.height) || 1))
  };

  const parent = normalizeHandle(api.GetParent(handle));
  if (parent === null) return next;

  const point = [next.x, next.y];
  if (!api.ScreenToClient(parent, point)) return null;

  next.x = point[0];
  next.y = point[1];
  return next;
}

function getWindowScreenRect(hwnd, api = loadNative()) {
  if (!api || !api.available) return null;

  const handle = normalizeHandle(hwnd);
  if (handle === null || !api.IsWindow(handle)) return null;

  const rect = getWindowRect(api, handle);
  if (!rect) return null;

  return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
}

// Position a (possibly reparented) window at an exact screen rect.
function setWindowScreenRect(hwnd, rect, api = loadNative()) {
  if (!api || !api.available) return false;

  const handle = normalizeHandle(hwnd);
  if (handle === null || !api.IsWindow(handle)) return false;

  const target = toParentClientRect(handle, rect, api);
  if (!target) return false;

  return Boolean(api.SetWindowPos(
    handle,
    0,
    target.x,
    target.y,
    target.width,
    target.height,
    SWP_NOACTIVATE | SWP_NOZORDER | SWP_FRAMECHANGED
  ));
}

function discoverWorkers(api) {
  const workers = [];
  let after = 0;

  for (let index = 0; index < MAX_TOP_LEVEL_SCAN; index += 1) {
    const worker = normalizeHandle(
      api.FindWindowExW(0, after, "WorkerW", null)
    );

    if (worker === null) break;

    workers.push({
      hwnd: worker,
      defView: normalizeHandle(
        api.FindWindowExW(worker, 0, "SHELLDLL_DefView", null)
      )
    });
    after = worker;
  }

  return workers;
}

function discoverHost(api) {
  const progman = normalizeHandle(api.FindWindowW("Progman", null));
  const workers = discoverWorkers(api);
  const workerHost = workers.find((entry) => entry.defView !== null);
  const progmanDefView = progman === null
    ? null
    : normalizeHandle(api.FindWindowExW(progman, 0, "SHELLDLL_DefView", null));

  if (workerHost) {
    return {
      progman,
      workers,
      host: workerHost.hwnd,
      hostClass: "WorkerW",
      defView: workerHost.defView,
      spawned: false
    };
  }

  if (progman !== null && progmanDefView !== null) {
    return {
      progman,
      workers,
      host: progman,
      hostClass: "Progman",
      defView: progmanDefView,
      spawned: false
    };
  }

  return {
    progman,
    workers,
    host: null,
    hostClass: "",
    defView: null,
    spawned: false
  };
}

function findDesktopHost(api = loadNative()) {
  if (!api.available) {
    throw new Error(api.reason || "Win32 API is unavailable");
  }

  let result = discoverHost(api);

  if (result.host === null && result.progman !== null) {
    // Ask Explorer to create the WorkerW that hosts the desktop behind icons.
    // Only done when no suitable host exists.
    api.SendMessageW(result.progman, WM_SPAWN_WORKER, 0, 0);
    result = discoverHost(api);
    result.spawned = true;
  }

  if (result.host === null) {
    throw new Error(
      "SHELLDLL_DefView was not found under Progman or any top-level WorkerW"
    );
  }

  return result;
}

function makeChildStyle(api, hwnd) {
  const style = Number(api.GetWindowLongPtrW(hwnd, GWL_STYLE)) >>> 0;
  const exStyle = Number(api.GetWindowLongPtrW(hwnd, GWL_EXSTYLE)) >>> 0;
  const childStyle = (
    (style & ~WS_POPUP) |
    WS_CHILD |
    WS_VISIBLE |
    WS_CLIPSIBLINGS
  ) >>> 0;
  const childExStyle = (
    (exStyle | WS_EX_TOOLWINDOW) &
    ~WS_EX_APPWINDOW &
    ~WS_EX_TRANSPARENT
  ) >>> 0;

  api.SetWindowLongPtrW(hwnd, GWL_STYLE, childStyle | 0);
  api.SetWindowLongPtrW(hwnd, GWL_EXSTYLE, childExStyle | 0);

  return {
    beforeStyle: `0x${style.toString(16).toUpperCase()}`,
    beforeExStyle: `0x${exStyle.toString(16).toUpperCase()}`,
    style: `0x${childStyle.toString(16).toUpperCase()}`,
    exStyle: `0x${childExStyle.toString(16).toUpperCase()}`
  };
}

function readAttachment(api, hwnd) {
  const handle = normalizeHandle(hwnd);
  if (handle === null || !api.IsWindow(handle)) {
    return { valid: false, hwnd: handleHex(handle), parent: null };
  }

  const parent = normalizeHandle(api.GetParent(handle));
  const style = Number(api.GetWindowLongPtrW(handle, GWL_STYLE)) >>> 0;
  const exStyle = Number(api.GetWindowLongPtrW(handle, GWL_EXSTYLE)) >>> 0;

  return {
    valid: true,
    hwnd: handleHex(handle),
    visible: Boolean(api.IsWindowVisible(handle)),
    parent: parent === null ? null : handleHex(parent),
    parentRaw: parent,
    parentClass: parent === null ? "" : getClassName(api, parent),
    isChildStyle: (style & WS_CHILD) !== 0,
    isPopupStyle: (style & WS_POPUP) !== 0,
    isLayered: (exStyle & 0x00080000) !== 0,
    isClickThroughStyle: (exStyle & WS_EX_TRANSPARENT) !== 0,
    style: `0x${style.toString(16).toUpperCase()}`,
    exStyle: `0x${exStyle.toString(16).toUpperCase()}`,
    rect: getWindowRect(api, handle)
  };
}

function isUsableShellHost(api, hwnd) {
  const handle = normalizeHandle(hwnd);
  if (handle === null || !api.IsWindow(handle)) return false;

  const className = getClassName(api, handle);
  if (className !== "WorkerW" && className !== "Progman") return false;

  return normalizeHandle(
    api.FindWindowExW(handle, 0, "SHELLDLL_DefView", null)
  ) !== null;
}

// Attach the window to the current desktop host. This is safe to call on a
// timer: when the HWND is already a child of the correct WorkerW it only
// verifies and reports state, without reparenting or touching z-order.
function attachWindowToDesktop(hwnd, api = loadNative()) {
  const handle = normalizeHandle(hwnd);
  if (handle === null || !api.IsWindow(handle)) {
    throw new Error("Invalid Electron HWND");
  }

  const discovery = findDesktopHost(api);
  const currentParent = normalizeHandle(api.GetParent(handle));
  const alreadyAttached = currentParent === discovery.host &&
    isUsableShellHost(api, currentParent);
  let styleInfo = null;

  if (!alreadyAttached) {
    const beforeRect = getWindowRect(api, handle);
    styleInfo = makeChildStyle(api, handle);
    api.SetParent(handle, discovery.host);

    const parent = normalizeHandle(api.GetParent(handle));
    if (parent !== discovery.host) {
      throw new Error(
        `SetParent failed: expected ${handleHex(discovery.host)}, got ${handleHex(parent)}`
      );
    }

    if (beforeRect !== null) {
      const point = [beforeRect.left, beforeRect.top];
      if (!api.ScreenToClient(discovery.host, point)) {
        throw new Error("ScreenToClient failed after SetParent");
      }

      const positioned = Boolean(api.SetWindowPos(
        handle,
        HWND_TOP,
        point[0],
        point[1],
        beforeRect.width,
        beforeRect.height,
        SWP_NOACTIVATE | SWP_FRAMECHANGED | SWP_SHOWWINDOW
      ));

      if (!positioned) {
        throw new Error("SetWindowPos failed after SetParent");
      }
    }
  }

  return {
    ok: true,
    alreadyAttached,
    host: handleHex(discovery.host),
    hostClass: discovery.hostClass,
    defView: handleHex(discovery.defView),
    spawnedByUs: discovery.spawned,
    style: styleInfo,
    attachment: readAttachment(api, handle)
  };
}

function isAttachedToUsableHost(hwnd, api = loadNative()) {
  if (!api.available) return false;
  const handle = normalizeHandle(hwnd);
  if (handle === null || !api.IsWindow(handle)) return false;
  const parent = normalizeHandle(api.GetParent(handle));
  return isUsableShellHost(api, parent);
}

// The native desktop icons live in a SysListView32 below SHELLDLL_DefView.
// Hiding that one child keeps Explorer's wallpaper, background clicks and
// shell integration intact while the desktop layer draws the icons instead.
function findDesktopIconListView(api = loadNative()) {
  if (!api.available) {
    return {
      ok: false,
      reason: api.reason || "Win32 API is unavailable",
      defView: null,
      listView: null
    };
  }

  const discovery = discoverHost(api);

  if (discovery.defView === null) {
    return {
      ok: false,
      reason: "SHELLDLL_DefView was not found",
      defView: null,
      listView: null
    };
  }

  const listView = normalizeHandle(
    api.FindWindowExW(discovery.defView, 0, "SysListView32", null)
  );

  if (listView === null) {
    return {
      ok: false,
      reason: "SysListView32 was not found under SHELLDLL_DefView",
      defView: discovery.defView,
      listView: null
    };
  }

  return {
    ok: true,
    defView: discovery.defView,
    listView
  };
}

function getDesktopIconState(api = loadNative()) {
  const found = findDesktopIconListView(api);

  if (!found.ok) {
    return {
      ok: false,
      reason: found.reason,
      defView: found.defView === null ? null : handleHex(found.defView),
      listView: null,
      visible: null
    };
  }

  return {
    ok: true,
    defView: handleHex(found.defView),
    listView: handleHex(found.listView),
    visible: Boolean(api.IsWindowVisible(found.listView))
  };
}

function setDesktopIconsVisible(visible, api = loadNative()) {
  const found = findDesktopIconListView(api);

  if (!found.ok) {
    return {
      ok: false,
      reason: found.reason,
      changed: false,
      defView: found.defView === null ? null : handleHex(found.defView),
      listView: null,
      visible: null
    };
  }

  const next = Boolean(visible);
  const wasVisible = Boolean(api.IsWindowVisible(found.listView));
  let changed = false;

  if (wasVisible !== next) {
    // Only call into the shell when the state actually differs; Explorer may
    // briefly re-show the list view after desktop refreshes.
    api.ShowWindow(found.listView, next ? SW_SHOW : SW_HIDE);
    changed = true;
  }

  return {
    ok: true,
    changed,
    defView: handleHex(found.defView),
    listView: handleHex(found.listView),
    wasVisible,
    visible: Boolean(api.IsWindowVisible(found.listView))
  };
}

module.exports = {
  attachWindowToDesktop,
  findDesktopHost,
  getDesktopIconState,
  getWindowScreenRect,
  handleHex,
  isAttachedToUsableHost,
  loadNative,
  readAttachment,
  setDesktopIconsVisible,
  setWindowScreenRect,
  toParentClientRect
};
