"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { SNAP_THRESHOLD, computeSnap } = require("../src/snap");

const WORK_AREA = { x: 0, y: 0, width: 1920, height: 1040 };

function snap(bounds, targets = [], options = {}) {
  return computeSnap({
    bounds,
    workArea: WORK_AREA,
    targets,
    ...options
  });
}

test("默认吸附阈值为 8–12 像素之间的 10 像素", () => {
  assert.equal(SNAP_THRESHOLD, 10);
});

test("左边缘接近其他窗口时吸附并显示竖向对齐线", () => {
  const result = snap(
    { x: 104, y: 200, width: 300, height: 294 },
    [{ x: 100, y: 140, width: 300, height: 294 }]
  );

  assert.equal(result.x, 100);
  assert.equal(result.y, 200);
  assert.equal(result.snappedX, true);
  assert.equal(result.snappedY, false);
  assert.deepEqual(result.verticalLines, [{ x: 100, y1: 134, y2: 500 }]);
  assert.deepEqual(result.horizontalLines, []);
});

test("右边缘接近其他窗口时按宽度差吸附", () => {
  const result = snap(
    { x: 100, y: 200, width: 300, height: 294 },
    [{ x: 200, y: 500, width: 210, height: 294 }]
  );

  assert.equal(result.x, 110);
  assert.equal(result.snappedX, true);
  assert.deepEqual(result.verticalLines, [{ x: 410, y1: 194, y2: 800 }]);
});

test("水平中心接近其他窗口中心时吸附", () => {
  const result = snap(
    { x: 246, y: 200, width: 300, height: 294 },
    [{ x: 300, y: 500, width: 200, height: 294 }]
  );

  assert.equal(result.x, 250);
  assert.equal(result.snappedX, true);
  assert.deepEqual(result.verticalLines, [{ x: 400, y1: 194, y2: 800 }]);
});

test("上边缘接近其他窗口时吸附并显示横向对齐线", () => {
  const result = snap(
    { x: 600, y: 96, width: 300, height: 294 },
    [{ x: 100, y: 100, width: 300, height: 294 }]
  );

  assert.equal(result.y, 100);
  assert.equal(result.snappedY, true);
  assert.deepEqual(result.horizontalLines, [{ y: 100, x1: 94, x2: 906 }]);
});

test("超过阈值时不吸附", () => {
  const result = snap(
    { x: 111, y: 200, width: 100, height: 294 },
    [{ x: 100, y: 700, width: 100, height: 294 }]
  );

  assert.equal(result.x, 111);
  assert.equal(result.snappedX, false);
  assert.deepEqual(result.verticalLines, []);
});

test("靠近屏幕四边时吸附到工作区边缘", () => {
  const left = snap({ x: 7, y: 200, width: 300, height: 294 });
  assert.equal(left.x, 0);
  assert.deepEqual(left.verticalLines, [{ x: 0, y1: 0, y2: 1040 }]);

  const right = snap({ x: 1614, y: 200, width: 300, height: 294 });
  assert.equal(right.x, 1620);
  assert.deepEqual(right.verticalLines, [{ x: 1920, y1: 0, y2: 1040 }]);

  const top = snap({ x: 400, y: 5, width: 300, height: 294 });
  assert.equal(top.y, 0);
  assert.deepEqual(top.horizontalLines, [{ y: 0, x1: 0, x2: 1920 }]);

  const bottom = snap({ x: 400, y: 740, width: 300, height: 294 });
  assert.equal(bottom.y, 746);
  assert.deepEqual(bottom.horizontalLines, [{ y: 1040, x1: 0, x2: 1920 }]);
});

test("同样接近时优先对齐其他窗口而不是屏幕边缘", () => {
  const result = snap(
    { x: 7, y: 200, width: 300, height: 294 },
    [{ x: 3, y: 700, width: 300, height: 294 }]
  );

  assert.equal(result.x, 3);
  assert.deepEqual(result.verticalLines, [{ x: 3, y1: 194, y2: 1000 }]);
});

test("同时满足横竖对齐时两个方向都吸附", () => {
  const result = snap(
    { x: 104, y: 96, width: 300, height: 294 },
    [{ x: 100, y: 100, width: 300, height: 294 }]
  );

  assert.equal(result.x, 100);
  assert.equal(result.y, 100);
  assert.equal(result.snappedX, true);
  assert.equal(result.snappedY, true);
  assert.equal(result.verticalLines.length, 1);
  assert.equal(result.horizontalLines.length, 1);
});

test("没有参考窗口且远离屏幕边缘时保持原位置", () => {
  const result = snap({ x: 600, y: 400, width: 300, height: 294 });

  assert.deepEqual(result, {
    x: 600,
    y: 400,
    snappedX: false,
    snappedY: false,
    verticalLines: [],
    horizontalLines: []
  });
});

test("无效的参考窗口会被忽略", () => {
  const result = snap(
    { x: 600, y: 400, width: 300, height: 294 },
    [null, { width: 0 }, { x: 100 }]
  );

  assert.equal(result.snappedX, false);
  assert.equal(result.snappedY, false);
});
