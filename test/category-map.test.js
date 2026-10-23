"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const {
  createEmptyCategoryMap,
  normalizeCategoryMap,
  loadCategoryMap,
  saveCategoryMap,
  getAssignment,
  getCategory,
  listAssignments,
  setAssignment,
  removeAssignment,
  removeAssignmentsByRun,
  removeAssignmentsByCategory,
  undoManualAssignment,
  getManualUndoStatus
} = require("../src/category-map");

async function makeTempDir(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "within-cubes-map-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

test("整理写入归属记录并支持按批次删除", () => {
  const state = createEmptyCategoryMap("C:\\Desktop");
  const filePath = "C:\\Desktop\\report.pdf";

  const first = setAssignment(state, {
    path: filePath,
    name: "report.pdf",
    category: "documents",
    kind: "file",
    runId: "run-1",
    source: "organize"
  });

  assert.equal(first.changed, true);
  assert.equal(getCategory(state, filePath), "documents");
  assert.equal(getAssignment(state, filePath).runId, "run-1");
  assert.equal(getManualUndoStatus(state).available, false);

  const second = setAssignment(state, {
    path: filePath,
    name: "report.pdf",
    category: "documents",
    kind: "file",
    runId: "run-2",
    source: "organize"
  });

  assert.equal(second.changed, true);
  assert.equal(getAssignment(state, filePath).runId, "run-2");

  const removed = removeAssignmentsByRun(state, "run-1");
  assert.equal(removed.length, 0);
  assert.equal(getAssignment(state, filePath).runId, "run-2");

  const removedLatest = removeAssignmentsByRun(state, "run-2");
  assert.equal(removedLatest.length, 1);
  assert.equal(getAssignment(state, filePath), null);
});

test("手动调整只改归属并可通过撤销栈恢复", () => {
  const state = createEmptyCategoryMap("C:\\Desktop");
  const filePath = "C:\\Desktop/photo.png";

  setAssignment(state, {
    path: filePath,
    name: "photo.png",
    category: "media",
    kind: "file",
    runId: "run-1",
    source: "organize"
  });

  const manual = setAssignment(state, {
    path: filePath,
    name: "photo.png",
    category: "documents",
    kind: "file",
    source: "manual"
  });

  assert.equal(manual.changed, true);
  assert.equal(getCategory(state, filePath), "documents");
  assert.equal(getAssignment(state, filePath).source, "manual");
  assert.equal(getAssignment(state, filePath).runId, null);
  assert.equal(getManualUndoStatus(state).available, true);

  const sameCategory = setAssignment(state, {
    path: filePath,
    name: "photo.png",
    category: "documents",
    kind: "file",
    source: "manual"
  });

  assert.equal(sameCategory.changed, false);

  const undone = undoManualAssignment(state);
  assert.equal(undone.changed, true);
  assert.equal(getCategory(state, filePath), "media");
  assert.equal(getAssignment(state, filePath).runId, "run-1");
});

test("手动撤销在没有历史归属时删除记录", () => {
  const state = createEmptyCategoryMap("C:\\Desktop");
  const filePath = "C:\\Desktop/photo.png";

  setAssignment(state, {
    path: filePath,
    name: "photo.png",
    category: "media",
    kind: "file",
    source: "manual"
  });

  const undone = undoManualAssignment(state);

  assert.equal(undone.changed, true);
  assert.equal(undone.assignedCategory, null);
  assert.equal(getAssignment(state, filePath), null);
});

test("删除分类会清掉该分类的全部归属", () => {
  const state = createEmptyCategoryMap("C:\\Desktop");

  setAssignment(state, {
    path: "C:\\Desktop/a.txt",
    category: "documents",
    kind: "file",
    source: "organize",
    runId: "run-1"
  });
  setAssignment(state, {
    path: "C:\\Desktop/b.txt",
    category: "documents",
    kind: "file",
    source: "manual"
  });
  setAssignment(state, {
    path: "C:\\Desktop/c.png",
    category: "media",
    kind: "file",
    source: "organize",
    runId: "run-1"
  });

  const removed = removeAssignmentsByCategory(state, "documents");

  assert.equal(removed.length, 2);
  assert.deepEqual(listAssignments(state).map((item) => item.category), ["media"]);
  assert.equal(removeAssignment(state, "C:\\Desktop/missing.txt").removed, false);
});

test("归属记录会规范化并持久化", async (t) => {
  const directory = await makeTempDir(t);
  const statePath = path.join(directory, "category-map.json");
  const state = normalizeCategoryMap({
    version: 99,
    assignments: {
      key: {
        path: "C:\\Desktop/report.pdf",
        name: "report.pdf",
        category: "documents",
        kind: "file",
        runId: "run-9",
        source: "organize",
        updatedAt: "2026-10-20T00:00:00.000Z"
      },
      bad: {
        path: "C:\\Desktop/bad.xyz",
        category: "unknown"
      }
    },
    undoStack: [
      {
        path: "C:\\Desktop/report.pdf",
        fromCategory: "documents",
        toCategory: "media"
      }
    ],
    meta: { manualImported: true }
  }, { desktopPath: "C:\\Desktop" });

  assert.equal(listAssignments(state).length, 1);
  assert.equal(state.meta.manualImported, true);
  assert.equal(getManualUndoStatus(state).available, true);

  await saveCategoryMap(statePath, state);
  const loaded = await loadCategoryMap(statePath, { desktopPath: "C:\\Desktop" });

  assert.equal(getCategory(loaded, "C:\\Desktop\\report.pdf"), "documents");
  assert.equal(getAssignment(loaded, "C:\\Desktop\\report.pdf").runId, "run-9");
  assert.equal(loaded.meta.manualImported, true);
});
