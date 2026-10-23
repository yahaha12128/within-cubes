"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { undoRuns } = require("../src/undo");
const {
  createEmptyCategoryMap,
  setAssignment,
  getAssignment
} = require("../src/category-map");

function buildRun(id, items) {
  return {
    id,
    createdAt: new Date().toISOString(),
    status: "active",
    items
  };
}

test("撤销整理只删除该批次写入的归属记录", async () => {
  const state = createEmptyCategoryMap();
  const run = buildRun("run-1", [
    { name: "photo.png", path: "C:\\Desktop\\photo.png", category: "media" },
    { name: "report.pdf", path: "C:\\Desktop\\report.pdf", category: "documents" }
  ]);

  setAssignment(state, {
    path: "C:\\Desktop\\photo.png",
    category: "media",
    kind: "file",
    runId: "run-1",
    source: "organize"
  });
  setAssignment(state, {
    path: "C:\\Desktop\\report.pdf",
    category: "documents",
    kind: "file",
    runId: "run-1",
    source: "organize"
  });

  const report = await undoRuns(state, [run]);

  assert.equal(report.removed, 2);
  assert.equal(report.skipped, 0);
  assert.equal(getAssignment(state, "C:\\Desktop\\photo.png"), null);
  assert.equal(getAssignment(state, "C:\\Desktop\\report.pdf"), null);
  assert.deepEqual(
    report.items.map((item) => item.status),
    ["unassigned", "unassigned"]
  );
});

test("手动调整覆盖后的文件不会被旧整理批次撤销", async () => {
  const state = createEmptyCategoryMap();
  const run = buildRun("run-1", [
    { name: "photo.png", path: "C:\\Desktop\\photo.png", category: "media" }
  ]);

  setAssignment(state, {
    path: "C:\\Desktop\\photo.png",
    category: "documents",
    kind: "file",
    source: "manual"
  });

  const report = await undoRuns(state, [run]);

  assert.equal(report.removed, 0);
  assert.equal(report.skipped, 1);
  assert.match(report.items[0].reason, /覆盖/);
  assert.equal(getAssignment(state, "C:\\Desktop\\photo.png").category, "documents");
});

test("已被后续整理接管的文件在撤销旧批次时跳过", async () => {
  const state = createEmptyCategoryMap();
  const run = buildRun("run-1", [
    { name: "photo.png", path: "C:\\Desktop\\photo.png", category: "media" }
  ]);

  setAssignment(state, {
    path: "C:\\Desktop\\photo.png",
    category: "media",
    kind: "file",
    runId: "run-2",
    source: "organize"
  });

  const report = await undoRuns(state, [run]);

  assert.equal(report.removed, 0);
  assert.equal(report.skipped, 1);
  assert.equal(getAssignment(state, "C:\\Desktop\\photo.png").runId, "run-2");
});

test("不存在的归属记录会被跳过", async () => {
  const state = createEmptyCategoryMap();
  const run = buildRun("run-1", [
    { name: "missing.txt", path: "C:\\Desktop\\missing.txt", category: "documents" }
  ]);

  const report = await undoRuns(state, [run]);

  assert.equal(report.removed, 0);
  assert.equal(report.skipped, 1);
  assert.equal(report.items[0].reason, "归属记录已不存在");
});

test("没有归属记录时返回空报告", async () => {
  const state = createEmptyCategoryMap();
  const report = await undoRuns(state, []);

  assert.equal(report.removed, 0);
  assert.equal(report.skipped, 0);
  assert.deepEqual(report.items, []);
});
