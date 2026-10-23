"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { rollbackRuns } = require("../src/rollback");
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

test("回档会删除目标批次及之后所有批次的归属记录", async () => {
  const state = createEmptyCategoryMap();
  const older = buildRun("run-1", [
    { name: "a.txt", path: "C:\\Desktop/a.txt", category: "documents" }
  ]);
  const target = buildRun("run-2", [
    { name: "b.png", path: "C:\\Desktop/b.png", category: "media" }
  ]);
  const later = buildRun("run-3", [
    { name: "c.zip", path: "C:\\Desktop/c.zip", category: "archives" }
  ]);

  for (const [runId, filePath, category] of [
    ["run-1", "C:\\Desktop/a.txt", "documents"],
    ["run-2", "C:\\Desktop/b.png", "media"],
    ["run-3", "C:\\Desktop/c.zip", "archives"]
  ]) {
    setAssignment(state, {
      path: filePath,
      category,
      kind: "file",
      runId,
      source: "organize"
    });
  }

  const report = await rollbackRuns(state, [target, later]);

  assert.equal(report.removed, 2);
  assert.equal(report.skipped, 0);
  assert.equal(report.items.length, 2);
  assert.equal(getAssignment(state, "C:\\Desktop/a.txt").runId, "run-1");
  assert.equal(getAssignment(state, "C:\\Desktop/b.png"), null);
  assert.equal(getAssignment(state, "C:\\Desktop/c.zip"), null);
});

test("回档会保留手动调整的归属", async () => {
  const state = createEmptyCategoryMap();
  const target = buildRun("run-2", [
    { name: "b.png", path: "C:\\Desktop/b.png", category: "media" }
  ]);

  setAssignment(state, {
    path: "C:\\Desktop/b.png",
    category: "documents",
    kind: "file",
    source: "manual"
  });

  const report = await rollbackRuns(state, [target]);

  assert.equal(report.removed, 0);
  assert.equal(report.skipped, 1);
  assert.equal(getAssignment(state, "C:\\Desktop/b.png").category, "documents");
});

test("空批次返回空报告", async () => {
  const state = createEmptyCategoryMap();
  const report = await rollbackRuns(state, []);

  assert.equal(report.removed, 0);
  assert.equal(report.skipped, 0);
  assert.deepEqual(report.items, []);
});
