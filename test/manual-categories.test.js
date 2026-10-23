"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const {
  createEmptyManualCategories,
  normalizeManualCategories,
  loadManualCategories,
  saveManualCategories,
  normalizePathKey,
  getManualAssignment,
  getManualCategory,
  setManualCategory,
  undoManualCategory,
  getManualUndoStatus
} = require("../src/manual-categories");

async function makeTempDir(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "within-cubes-manual-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

function assign(state, filePath, fromCategory, toCategory, name = path.basename(filePath)) {
  return setManualCategory(state, {
    path: filePath,
    name,
    fromCategory,
    toCategory,
    at: new Date("2026-10-18T08:00:00.000Z")
  });
}

test("分类归属记录默认没有调整也没有可撤销项", () => {
  const state = createEmptyManualCategories();

  assert.deepEqual(state, {
    version: 1,
    assignments: {},
    undoStack: []
  });
  assert.equal(getManualUndoStatus(state).available, false);
  assert.equal(getManualCategory(state, "C:\\Desktop\\a.txt"), null);
});

test("手动调整按文件路径记录，撤销后删除记录", () => {
  const state = createEmptyManualCategories();
  const filePath = path.resolve("desktop", "report.txt");

  const result = assign(state, filePath, "documents", "media");

  assert.equal(result.changed, true);
  assert.equal(getManualCategory(state, filePath), "media");
  if (process.platform === "win32") {
    assert.equal(getManualCategory(state, filePath.toUpperCase()), "media");
  }
  assert.equal(getManualUndoStatus(state).available, true);
  assert.equal(getManualUndoStatus(state).last.name, "report.txt");
  assert.equal(getManualUndoStatus(state).last.fromCategory, "documents");
  assert.equal(getManualUndoStatus(state).last.toCategory, "media");

  const undo = undoManualCategory(state, { at: new Date("2026-10-18T09:00:00.000Z") });

  assert.equal(undo.changed, true);
  assert.equal(undo.assignedCategory, null);
  assert.equal(undo.restoredCategory, "documents");
  assert.equal(getManualCategory(state, filePath), null);
  assert.equal(getManualUndoStatus(state).available, false);
});

test("连续调整同一文件后，撤销恢复上一次的手动分类", () => {
  const state = createEmptyManualCategories();
  const filePath = path.resolve("desktop", "photo.png");

  assign(state, filePath, "media", "documents");
  assign(state, filePath, "documents", "apps");

  assert.equal(getManualCategory(state, filePath), "apps");

  const undo = undoManualCategory(state);

  assert.equal(undo.assignedCategory, "documents");
  assert.equal(getManualCategory(state, filePath), "documents");
  assert.equal(getManualUndoStatus(state).available, true);

  const secondUndo = undoManualCategory(state);

  assert.equal(secondUndo.assignedCategory, null);
  assert.equal(getManualCategory(state, filePath), null);
});

test("撤销始终针对最近一次手动调整", () => {
  const state = createEmptyManualCategories();
  const first = path.resolve("desktop", "a.txt");
  const second = path.resolve("desktop", "b.txt");

  assign(state, first, "documents", "media");
  assign(state, second, "documents", "apps");

  const undo = undoManualCategory(state);

  assert.equal(undo.record.path, second);
  assert.equal(getManualCategory(state, second), null);
  assert.equal(getManualCategory(state, first), "media");
  assert.equal(getManualUndoStatus(state).last.path, first);
});

test("相同分类不产生调整记录", () => {
  const state = createEmptyManualCategories();
  const result = assign(state, path.resolve("desktop", "a.txt"), "media", "media");

  assert.equal(result.changed, false);
  assert.equal(getManualUndoStatus(state).available, false);
});

test("配置加载会丢弃非法分类和损坏的撤销记录", () => {
  const validPath = path.resolve("desktop", "keep.txt");

  const normalized = normalizeManualCategories({
    assignments: {
      bad1: { path: validPath, category: "unknown" },
      bad2: { path: "", category: "media" },
      good: { path: validPath, category: "media", updatedAt: "2026-10-18T08:00:00.000Z" }
    },
    undoStack: [
      {
        path: validPath,
        name: "keep.txt",
        fromCategory: "documents",
        toCategory: "media",
        at: "2026-10-18T08:00:00.000Z",
        previousAssignment: { path: validPath, category: "documents" }
      },
      { path: validPath, fromCategory: "bad", toCategory: "media" }
    ]
  });

  assert.equal(getManualCategory(normalized, validPath), "media");
  assert.equal(normalized.undoStack.length, 1);
  assert.equal(normalized.undoStack[0].fromCategory, "documents");
  assert.equal(normalized.undoStack[0].previousAssignment.category, "documents");
});

test("分类归属与撤销栈可保存并重新读取", async (t) => {
  const directory = await makeTempDir(t);
  const configPath = path.join(directory, "manual-categories.json");
  const state = createEmptyManualCategories();
  const filePath = path.resolve("desktop", "archive.zip");

  assign(state, filePath, "archives", "documents", "archive.zip");
  await saveManualCategories(configPath, state);

  const loaded = await loadManualCategories(configPath);

  assert.equal(getManualCategory(loaded, filePath), "documents");
  assert.equal(getManualUndoStatus(loaded).available, true);
  assert.equal(getManualUndoStatus(loaded).last.name, "archive.zip");
  assert.equal(getManualUndoStatus(loaded).last.fromCategory, "archives");
  assert.equal(getManualUndoStatus(loaded).last.toCategory, "documents");

  const undo = undoManualCategory(loaded);
  assert.equal(undo.assignedCategory, null);
  assert.equal(getManualCategory(loaded, filePath), null);
});

test("损坏或缺失的存储文件回退为空记录", async (t) => {
  const directory = await makeTempDir(t);

  assert.deepEqual(
    await loadManualCategories(path.join(directory, "missing.json")),
    createEmptyManualCategories()
  );

  const brokenPath = path.join(directory, "broken.json");
  await fs.writeFile(brokenPath, "{not-json", "utf8");

  assert.deepEqual(
    await loadManualCategories(brokenPath),
    createEmptyManualCategories()
  );
});

test("Windows 下路径键不区分大小写", () => {
  if (process.platform !== "win32") return;

  const upper = path.resolve("C:\\Temp\\Folder\\File.txt");
  const lower = path.resolve("c:\\temp\\folder\\file.txt");

  assert.equal(normalizePathKey(upper), normalizePathKey(lower));
});

test("查询手动记录返回包含路径和更新时间的赋值", () => {
  const state = createEmptyManualCategories();
  const filePath = path.resolve("desktop", "notes.md");

  assign(state, filePath, "documents", "media");
  const assignment = getManualAssignment(state, filePath);

  assert.equal(assignment.path, filePath);
  assert.equal(assignment.category, "media");
  assert.equal(assignment.updatedAt, "2026-10-18T08:00:00.000Z");
});
