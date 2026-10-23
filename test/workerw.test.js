"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getWindowScreenRect,
  setWindowScreenRect,
  toParentClientRect
} = require("../src/workerw");

// 多屏桌面：副屏挂在主屏上方，WorkerW 客户区原点因此是 (0, -324)。
const HOST_ORIGIN = { x: 0, y: -324 };

function makeApi(overrides = {}) {
  return {
    available: true,
    IsWindow: () => true,
    GetParent: () => 0x1234,
    ScreenToClient: (hwnd, point) => {
      point[0] -= HOST_ORIGIN.x;
      point[1] -= HOST_ORIGIN.y;
      return true;
    },
    GetWindowRect: (hwnd, rect) => {
      rect[0] = HOST_ORIGIN.x;
      rect[1] = HOST_ORIGIN.y;
      rect[2] = HOST_ORIGIN.x + 3640;
      rect[3] = HOST_ORIGIN.y + 1890;
      return true;
    },
    SetWindowPos: () => true,
    ...overrides
  };
}

test("未挂载到 WorkerW 时坐标就是屏幕坐标", () => {
  const api = makeApi({ GetParent: () => 0 });

  assert.deepEqual(
    toParentClientRect(0x1234, { x: 0, y: -324, width: 3640, height: 1890 }, api),
    { x: 0, y: -324, width: 3640, height: 1890 }
  );
});

test("已挂载时把屏幕矩形换算成父窗口客户区坐标", () => {
  const api = makeApi();

  // 期望窗口落在屏幕 (0,-324)；宿主原点也在 (0,-324)，所以客户区坐标是 (0,0)。
  // 直接写屏幕坐标会让整层上移 324px，这正是导入布局后组件飞出屏幕的原因。
  assert.deepEqual(
    toParentClientRect(0x1234, { x: 0, y: -324, width: 3640, height: 1890 }, api),
    { x: 0, y: 0, width: 3640, height: 1890 }
  );
});

test("客户区坐标随宿主原点偏移，不会丢失相对位置", () => {
  const api = makeApi();

  assert.deepEqual(
    toParentClientRect(0x1234, { x: 1924, y: 20, width: 300, height: 294 }, api),
    { x: 1924, y: 344, width: 300, height: 294 }
  );
});

test("句柄无效或原生模块不可用时不做坐标换算", () => {
  assert.equal(
    toParentClientRect(0, { x: 0, y: 0, width: 100, height: 100 }, makeApi()),
    null
  );
  assert.equal(
    toParentClientRect(0x1234, { x: 0, y: 0, width: 100, height: 100 }, makeApi({ available: false })),
    null
  );
});

test("SetWindowScreenRect 写入的是父窗口客户区坐标", () => {
  const calls = [];
  const api = makeApi({
    SetWindowPos: (...args) => {
      calls.push(args);
      return true;
    }
  });

  assert.equal(
    setWindowScreenRect(0x1234, { x: 0, y: -324, width: 3640, height: 1890 }, api),
    true
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0][2], 0);
  assert.equal(calls[0][3], 0);
  assert.equal(calls[0][4], 3640);
  assert.equal(calls[0][5], 1890);
});

test("GetWindowScreenRect 返回屏幕坐标，可用于检测图层漂移", () => {
  assert.deepEqual(
    getWindowScreenRect(0x1234, makeApi()),
    { x: 0, y: -324, width: 3640, height: 1890 }
  );
  assert.equal(getWindowScreenRect(0, makeApi()), null);
});
