"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  GWL_EXSTYLE,
  GWL_STYLE,
  WS_CHILD,
  WS_POPUP,
  WS_EX_TRANSPARENT,
  attachToDesktop,
  findWorkerW
} = require("./win32");

function makeFindApi(options = {}) {
  const progman = options.progman === undefined ? 100 : options.progman;
  let workers = options.workers ? [...options.workers] : [];
  const defViews = new Map(options.defViews || []);
  let progmanDefView = options.progmanDefView || 0;
  const sent = [];

  return {
    available: true,
    calls: { sent },
    FindWindowW(className, windowName) {
      assert.equal(className, "Progman");
      assert.equal(windowName, null);
      return progman;
    },
    FindWindowExW(parent, after, className) {
      if (className === "WorkerW" && parent === 0) {
        return workers.find((handle) => handle > after) || 0;
      }

      if (className === "SHELLDLL_DefView" && parent === progman) {
        return progmanDefView;
      }

      if (className === "SHELLDLL_DefView") {
        return defViews.get(parent) || 0;
      }

      return 0;
    },
    SendMessageW(hwnd, msg, wParam, lParam) {
      sent.push({ hwnd, msg, wParam, lParam });
      if (options.onSend) {
        const next = options.onSend({ hwnd, msg, wParam, lParam });
        if (next) {
          if (next.progman !== undefined) progman = next.progman;
          if (next.workers) workers = next.workers;
          if (next.progmanDefView !== undefined) {
            progmanDefView = next.progmanDefView;
          }
          if (next.defViews) {
            for (const [handle, defView] of next.defViews) {
              defViews.set(handle, defView);
            }
          }
        }
      }
      return 0;
    },
    IsWindowVisible() {
      return true;
    }
  };
}

test("findWorkerW prefers a top-level WorkerW containing SHELLDLL_DefView", () => {
  const api = makeFindApi({
    progman: 0x100,
    workers: [0x200, 0x300, 0x400],
    defViews: [
      [0x300, 0x301]
    ],
    progmanDefView: 0x101
  });

  const result = findWorkerW(api);

  assert.equal(result.host, 0x300);
  assert.equal(result.hostClass, "WorkerW");
  assert.equal(result.defView, 0x301);
  assert.equal(result.spawned, false);
});

test("findWorkerW falls back to Progman when it directly hosts the icon view", () => {
  const api = makeFindApi({
    progman: 0x100,
    workers: [0x200],
    progmanDefView: 0x101
  });

  const result = findWorkerW(api);

  assert.equal(result.host, 0x100);
  assert.equal(result.hostClass, "Progman");
  assert.equal(result.defView, 0x101);
});

test("findWorkerW sends 0x052C and rescans when no host exists", () => {
  const api = makeFindApi({
    progman: 0x100,
    onSend({ hwnd, msg }) {
      assert.equal(hwnd, 0x100);
      assert.equal(msg, 0x052c);
      return {
        workers: [0x200],
        defViews: [[0x200, 0x201]]
      };
    }
  });

  const result = findWorkerW(api);

  assert.equal(api.calls.sent.length, 1);
  assert.equal(result.host, 0x200);
  assert.equal(result.spawned, true);
});

test("findWorkerW fails clearly when no SHELLDLL_DefView can be found", () => {
  const api = makeFindApi({
    progman: 0x100,
    workers: [0x200]
  });

  assert.throws(
    () => findWorkerW(api),
    /SHELLDLL_DefView was not found/
  );
});

function makeAttachApi() {
  const state = {
    hwnd: 0x500,
    parent: 0,
    style: (WS_POPUP | 0x10000000) >>> 0,
    exStyle: (WS_EX_TRANSPARENT | 0x00080000 | 0x00040000) >>> 0,
    positions: []
  };

  const api = {
    available: true,
    state,
    IsWindow: (hwnd) => hwnd === 0x500 || hwnd === 0x100,
    IsWindowVisible: () => true,
    GetParent: () => state.parent,
    GetWindow: () => 0,
    GetAncestor: () => state.hwnd,
    GetWindowLongPtrW(_hwnd, index) {
      if (index === GWL_STYLE) return state.style | 0;
      if (index === GWL_EXSTYLE) return state.exStyle | 0;
      return 0;
    },
    SetWindowLongPtrW(_hwnd, index, value) {
      if (index === GWL_STYLE) state.style = value >>> 0;
      if (index === GWL_EXSTYLE) state.exStyle = value >>> 0;
      return 0;
    },
    SetParent(_hwnd, parent) {
      const previous = state.parent;
      state.parent = parent;
      return previous;
    },
    GetWindowRect(hwnd, rect) {
      if (hwnd === 0x100) {
        rect[0] = 0;
        rect[1] = 0;
        rect[2] = 1920;
        rect[3] = 1080;
      } else {
        rect[0] = 160;
        rect[1] = 160;
        rect[2] = 680;
        rect[3] = 620;
      }
      return true;
    },
    GetClientRect(_hwnd, rect) {
      rect[0] = 0;
      rect[1] = 0;
      rect[2] = 1920;
      rect[3] = 1080;
      return true;
    },
    ScreenToClient(_hwnd, point) {
      // Treat the host client origin as the screen origin for this fixture.
      return true;
    },
    SetWindowPos(hwnd, after, x, y, width, height, flags) {
      state.positions.push({ hwnd, after, x, y, width, height, flags });
      return true;
    },
    GetClassNameA(_hwnd, buffer) {
      const name = "TestWindow";
      buffer.write(name, 0, "ascii");
      return name.length;
    }
  };

  return api;
}

test("attachToDesktop converts the HWND to a clickable WS_CHILD", () => {
  const api = makeAttachApi();
  const result = attachToDesktop(api, 0x500, 0x100);

  assert.equal(api.state.parent, 0x100);
  assert.equal((api.state.style & WS_CHILD) !== 0, true);
  assert.equal((api.state.style & WS_POPUP) !== 0, false);
  assert.equal((api.state.exStyle & WS_EX_TRANSPARENT) !== 0, false);
  assert.equal((api.state.exStyle & 0x00080000) !== 0, true);
  assert.equal(api.state.positions.length, 1);
  assert.equal(api.state.positions[0].after, 0);
  assert.equal(api.state.positions[0].x, 160);
  assert.equal(api.state.positions[0].y, 160);
  assert.equal(result.after.parent, "0x100");
  assert.equal(result.after.isChildStyle, true);
  assert.equal(result.after.isClickThroughStyle, false);
});

test("attachToDesktop reports a SetParent failure instead of lying", () => {
  const api = makeAttachApi();
  api.SetParent = () => 0;
  api.GetParent = () => 0;

  assert.throws(
    () => attachToDesktop(api, 0x500, 0x100),
    /SetParent failed/
  );
});
