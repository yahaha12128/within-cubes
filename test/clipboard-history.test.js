"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const {
  MAX_CLIPBOARD_ENTRIES,
  createEmptyClipboardHistory,
  normalizeClipboardHistory,
  addClipboardEntry,
  removeClipboardEntry,
  loadClipboardHistory,
  saveClipboardHistory
} = require("../src/clipboard-history");

async function makeTempDir(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "within-cubes-clipboard-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

test("剪贴板历史只保留最近 10 条并丢弃最旧记录", () => {
  let history = createEmptyClipboardHistory();

  for (let index = 0; index < MAX_CLIPBOARD_ENTRIES + 4; index += 1) {
    const result = addClipboardEntry(history, `内容 ${index}`, {
      at: new Date(Date.UTC(2026, 9, 20, 8, index))
    });
    history = { ...history, entries: result.entries };
  }

  assert.equal(history.entries.length, MAX_CLIPBOARD_ENTRIES);
  assert.equal(history.entries[0].text, `内容 ${MAX_CLIPBOARD_ENTRIES + 3}`);
  assert.equal(history.entries.at(-1).text, "内容 4");
  assert.ok(!history.entries.some((entry) => entry.text === "内容 3"));
});

test("重复复制同一内容会去重并移动到最前面", () => {
  let history = createEmptyClipboardHistory();

  for (const text of ["第一条", "第二条", "第三条"]) {
    const result = addClipboardEntry(history, text);
    history = { ...history, entries: result.entries };
  }

  const result = addClipboardEntry(history, "第二条");
  assert.equal(result.changed, true);
  assert.deepEqual(
    result.entries.map((entry) => entry.text),
    ["第二条", "第三条", "第一条"]
  );
  assert.equal(result.entries.length, 3);
});

test("空白内容和缺失记录不会产生变化", () => {
  let history = createEmptyClipboardHistory();
  const blank = addClipboardEntry(history, "   \n  ");

  assert.equal(blank.changed, false);
  assert.equal(blank.entries.length, 0);

  const added = addClipboardEntry(history, "有效内容");
  history = { ...history, entries: added.entries };
  const missing = removeClipboardEntry(history, "not-an-id");

  assert.equal(missing.changed, false);
  assert.equal(missing.entries.length, 1);
});

test("剪贴板历史能删除指定记录并持久化到 json", async (t) => {
  const root = await makeTempDir(t);
  const filePath = path.join(root, "clipboard-history.json");
  let history = createEmptyClipboardHistory();

  for (const text of ["甲", "乙", "丙"]) {
    const result = addClipboardEntry(history, text);
    history = { ...history, entries: result.entries };
  }

  const removed = removeClipboardEntry(history, history.entries[1].id);
  assert.equal(removed.changed, true);
  history = { ...history, entries: removed.entries };

  await saveClipboardHistory(filePath, history);
  const loaded = await loadClipboardHistory(filePath);

  assert.deepEqual(
    loaded.entries.map((entry) => entry.text),
    ["丙", "甲"]
  );
});

test("损坏或缺失的剪贴板文件回退为空历史", async (t) => {
  const root = await makeTempDir(t);
  const missing = await loadClipboardHistory(path.join(root, "missing.json"));
  assert.deepEqual(missing, createEmptyClipboardHistory());

  const brokenPath = path.join(root, "broken.json");
  await fs.writeFile(brokenPath, "{not-json", "utf8");
  assert.deepEqual(await loadClipboardHistory(brokenPath), createEmptyClipboardHistory());
});

test("读取历史时会去重、过滤空内容并截断到 10 条", () => {
  const normalized = normalizeClipboardHistory({
    entries: [
      { id: "a", text: "一", copiedAt: "2026-10-20T08:00:00.000Z" },
      { id: "b", text: "一", copiedAt: "2026-10-20T09:00:00.000Z" },
      { id: "c", text: "   ", copiedAt: "2026-10-20T09:00:00.000Z" },
      ...Array.from({ length: 12 }, (_value, index) => ({
        id: `x${index}`,
        text: `额外 ${index}`,
        copiedAt: "2026-10-20T10:00:00.000Z"
      }))
    ]
  });

  assert.equal(normalized.entries.length, MAX_CLIPBOARD_ENTRIES);
  assert.equal(normalized.entries[0].text, "一");
  assert.equal(
    normalized.entries.filter((entry) => entry.text === "一").length,
    1
  );
});
