"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const {
  getNotesDirectory,
  noteListTitle,
  saveNoteEntry,
  listNoteEntries,
  updateNoteEntry,
  renameNoteTitle,
  deleteNoteEntry
} = require("../src/note-store");
const {
  normalizeFileTags,
  getFileTag,
  setFileTag,
  loadFileTags,
  saveFileTags
} = require("../src/file-tags");
const {
  createEmptyCategoryMappings,
  normalizeCategoryMappings,
  getMappedFolder,
  setMappedFolder
} = require("../src/category-mappings");
const {
  createEmptyQuickAccess,
  addQuickFile,
  removeQuickFile,
  clearQuickFiles,
  normalizeQuickAccess,
  loadQuickAccess,
  saveQuickAccess
} = require("../src/quick-access");
const {
  normalizeComponentAppearance,
  getComponentAccent,
  setComponentAccent
} = require("../src/component-appearance");

async function makeTempDir(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "within-cubes-additions-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

test("随手记保存到独立目录，并能按时间倒序列出与删除", async (t) => {
  const root = await makeTempDir(t);
  const notesDir = getNotesDirectory(root);

  const first = await saveNoteEntry(notesDir, "第一条\n正文", {
    at: new Date("2026-10-20T08:00:00.000Z")
  });
  const second = await saveNoteEntry(notesDir, "第二条", {
    at: new Date("2026-10-20T09:00:00.000Z")
  });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(path.dirname(first.entry.path), path.resolve(notesDir));

  await fs.utimes(
    first.entry.path,
    new Date("2026-10-20T08:00:00.000Z"),
    new Date("2026-10-20T08:00:00.000Z")
  );
  await fs.utimes(
    second.entry.path,
    new Date("2026-10-20T09:00:00.000Z"),
    new Date("2026-10-20T09:00:00.000Z")
  );

  const entries = await listNoteEntries(notesDir, { limit: 5 });
  assert.equal(entries.length, 2);
  assert.equal(entries[0].text, "第二条");
  assert.equal(entries[1].title, "第一条");

  const deleted = await deleteNoteEntry(notesDir, entries[0].id);
  assert.equal(deleted.ok, true);
  assert.equal((await listNoteEntries(notesDir)).length, 1);

  const invalid = await deleteNoteEntry(notesDir, "../outside.md");
  assert.equal(invalid.ok, false);
});

test("未填写标题时列表标题取正文前 15 个字", async (t) => {
  const root = await makeTempDir(t);
  const notesDir = getNotesDirectory(root);
  const body = "这是一段没有单独填写标题的随手记正文，列表只显示前十五个字";
  const result = await saveNoteEntry(notesDir, body, {
    at: new Date("2026-10-22T08:00:00.000Z")
  });

  assert.equal(result.ok, true);
  assert.equal(result.entry.title, body);
  assert.equal(
    result.entry.listTitle,
    Array.from(body).slice(0, 15).join("")
  );
  assert.equal(noteListTitle(""), "无标题随手记");

  const entries = await listNoteEntries(notesDir);
  assert.equal(entries[0].listTitle, result.entry.listTitle);
});

test("随手记拒绝空内容", async (t) => {
  const root = await makeTempDir(t);
  const result = await saveNoteEntry(getNotesDirectory(root), "   \n ");
  assert.equal(result.ok, false);
});

test("随手记历史不设数量上限，列表默认返回全部记录", async (t) => {
  const root = await makeTempDir(t);
  const notesDir = getNotesDirectory(root);

  for (let index = 0; index < 25; index += 1) {
    const when = new Date(Date.UTC(2026, 9, 20, 8, 0, index));
    const result = await saveNoteEntry(notesDir, `第 ${index} 条`, {
      at: when
    });
    assert.equal(result.ok, true);
    // saveNoteEntry stamps the filename from `at`, but the filesystem mtime is
    // "now"; pin it so the newest-first ordering is deterministic.
    await fs.utimes(result.entry.path, when, when);
  }

  const all = await listNoteEntries(notesDir);
  assert.equal(all.length, 25);

  const newestFive = await listNoteEntries(notesDir, { limit: 5 });
  assert.equal(newestFive.length, 5);
  assert.equal(newestFive[0].text, "第 24 条");
});

test("文件颜色角标会规范化路径和颜色并持久化", async (t) => {
  const root = await makeTempDir(t);
  const store = normalizeFileTags({
    tags: {
      "C:\\Desk\\a.txt": "red",
      "C:\\Desk\\b.txt": "not-a-color"
    }
  });

  assert.equal(getFileTag(store, "C:\\Desk\\a.txt"), "red");
  assert.equal(getFileTag(store, "C:\\Desk\\b.txt"), "");

  setFileTag(store, "C:\\Desk\\c.txt", "blue");
  assert.equal(getFileTag(store, "C:\\Desk\\c.txt"), "blue");

  const filePath = path.join(root, "file-tags.json");
  await saveFileTags(filePath, store);
  const loaded = await loadFileTags(filePath);
  assert.equal(getFileTag(loaded, "C:\\Desk\\c.txt"), "blue");

  setFileTag(loaded, "C:\\Desk\\c.txt", "");
  assert.equal(getFileTag(loaded, "C:\\Desk\\c.txt"), "");
});

test("分类文件夹映射校验分类键并持久化路径", () => {
  const store = createEmptyCategoryMappings();
  assert.equal(getMappedFolder(store, "documents"), null);

  setMappedFolder(store, "documents", "C:\\Notes");
  assert.equal(
    getMappedFolder(store, "documents"),
    path.resolve("C:\\Notes")
  );
  assert.equal(getMappedFolder(store, "unknown"), null);

  const normalized = normalizeCategoryMappings({
    categories: {
      media: "D:\\壁纸",
      archives: 42
    }
  });
  assert.equal(
    getMappedFolder(normalized, "media"),
    path.resolve("D:\\壁纸")
  );
  assert.equal(getMappedFolder(normalized, "archives"), null);
});

test("快速收纳只保留有效文件、去重并支持移除和清空", async (t) => {
  const root = await makeTempDir(t);
  const store = createEmptyQuickAccess();

  const added = addQuickFile(store, {
    path: path.join(root, "a.txt"),
    name: "a.txt",
    kind: "file"
  });
  assert.equal(added.changed, true);

  const duplicate = addQuickFile(store, {
    path: path.join(root, "a.txt"),
    name: "a.txt",
    kind: "file"
  });
  assert.equal(duplicate.changed, false);

  addQuickFile(store, {
    path: path.join(root, "folder"),
    name: "folder",
    kind: "folder"
  });
  assert.equal(store.files.length, 2);

  const filePath = path.join(root, "quick-access.json");
  await saveQuickAccess(filePath, store);
  const loaded = await loadQuickAccess(filePath);
  assert.equal(loaded.files.length, 2);
  assert.equal(loaded.files[1].kind, "folder");

  removeQuickFile(loaded, path.join(root, "a.txt"));
  assert.equal(loaded.files.length, 1);
  clearQuickFiles(loaded);
  assert.equal(normalizeQuickAccess(loaded).files.length, 0);
});

test("组件强调色只接受调色板中的颜色并支持恢复默认", () => {
  const store = normalizeComponentAppearance({
    accents: {
      "category:folders": "#3F6F8E",
      "widget:clock": "#bad",
      "unknown:thing": "#2f6b4f"
    }
  });

  assert.equal(getComponentAccent(store, "category", "folders"), "#3f6f8e");
  assert.equal(getComponentAccent(store, "widget", "clock"), "");

  setComponentAccent(store, "widget", "notes", "#a33a32");
  assert.equal(getComponentAccent(store, "widget", "notes"), "#a33a32");
  setComponentAccent(store, "widget", "notes", "");
  assert.equal(getComponentAccent(store, "widget", "notes"), "");
});

test("随手记可在原文件上覆盖并重命名标题而保持文件名不变", async (t) => {
  const root = await makeTempDir(t);
  const notesDir = getNotesDirectory(root);
  const saved = await saveNoteEntry(notesDir, "旧标题\n旧内容", {
    at: new Date("2026-10-20T08:00:00.000Z")
  });

  const updated = await updateNoteEntry(notesDir, saved.entry.id, "新标题\n新内容");
  assert.equal(updated.ok, true);
  assert.equal(updated.entry.id, saved.entry.id);
  assert.equal(updated.entry.text, "新标题\n新内容");

  const renamed = await renameNoteTitle(notesDir, saved.entry.id, "另一个标题");
  assert.equal(renamed.ok, true);
  assert.equal(renamed.entry.id, saved.entry.id);
  assert.equal(renamed.entry.title, "另一个标题");

  const entries = await listNoteEntries(notesDir);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].id, saved.entry.id);
});
