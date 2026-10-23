"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const {
  MAX_NOTES_LENGTH,
  MAX_TODO_ITEMS,
  MAX_TODO_TEXT_LENGTH,
  normalizeNotesText,
  normalizeTodoText,
  normalizeTodoDate,
  normalizeWidgetData,
  createDefaultWidgetData,
  createTodo,
  loadWidgetData,
  saveWidgetData
} = require("../src/widget-data");

async function makeTempDir(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "within-cubes-widget-data-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

test("随手记默认数据为空且会统一换行、限制长度", () => {
  assert.deepEqual(createDefaultWidgetData(), {
    version: 1,
    notes: { text: "" },
    todos: []
  });

  assert.equal(normalizeNotesText("第一行\r\n第二行\r第三行"), "第一行\n第二行\n第三行");
  assert.equal(normalizeNotesText(42), "");
  assert.equal(
    normalizeNotesText("字".repeat(MAX_NOTES_LENGTH + 8)).length,
    MAX_NOTES_LENGTH
  );
});

test("待办文本会清理控制字符、压缩空白并限制长度", () => {
  assert.equal(normalizeTodoText("  买\u0000 牛奶  "), "买 牛奶");
  assert.equal(normalizeTodoText("标题\n第二行"), "标题 第二行");
  assert.equal(normalizeTodoText(null), "");
  assert.equal(
    normalizeTodoText("字".repeat(MAX_TODO_TEXT_LENGTH + 8)).length,
    MAX_TODO_TEXT_LENGTH
  );
});

test("待办日期只接受真实存在的本地日期", () => {
  assert.equal(normalizeTodoDate("2026-10-22"), "2026-10-22");
  assert.equal(normalizeTodoDate(" 2026-02-28 "), "2026-02-28");
  assert.equal(normalizeTodoDate("2026-02-30"), "");
  assert.equal(normalizeTodoDate("2026-13-01"), "");
  assert.equal(normalizeTodoDate("10/22/2026"), "");
  assert.equal(normalizeTodoDate(null), "");

  const todo = createTodo("带日期的待办", { dueDate: "2026-10-22" });
  assert.equal(todo.dueDate, "2026-10-22");
});

test("组件数据会过滤非法待办、去重并限制条目数量", () => {
  const sourceTodos = [
    { id: "a", text: "第一条", done: false, createdAt: "2026-01-01T00:00:00.000Z" },
    { id: "a", text: "重复 ID", done: true },
    { id: "", text: "缺少 ID" },
    { id: "b", text: "   ", done: false },
    { id: "c", text: "已完成", done: 1 }
  ];

  for (let index = 0; index < MAX_TODO_ITEMS + 5; index += 1) {
    sourceTodos.push({
      id: `extra-${index}`,
      text: `额外任务 ${index}`,
      done: false
    });
  }

  const normalized = normalizeWidgetData({
    notes: { text: "  便签  " },
    todos: sourceTodos
  });

  assert.equal(normalized.version, 1);
  assert.equal(normalized.notes.text, "  便签  ");
  assert.equal(normalized.todos.length, MAX_TODO_ITEMS);
  assert.equal(normalized.todos[0].id, "a");
  assert.equal(normalized.todos[0].text, "第一条");
  assert.equal(normalized.todos[0].done, false);
  assert.equal(normalized.todos[1].id, "c");
  assert.equal(normalized.todos[1].done, true);
  assert.equal(
    new Set(normalized.todos.map((todo) => todo.id)).size,
    normalized.todos.length
  );
});

test("新建待办生成唯一 ID、当前时间和未完成状态", () => {
  const first = createTodo("  写阶段三说明  ");
  const second = createTodo("整理截图");

  assert.ok(first);
  assert.ok(second);
  assert.notEqual(first.id, second.id);
  assert.equal(first.text, "写阶段三说明");
  assert.equal(first.done, false);
  assert.match(first.createdAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(createTodo("   "), null);
});

test("组件数据可保存并重新读取", async (t) => {
  const directory = await makeTempDir(t);
  const dataPath = path.join(directory, "widget-data.json");
  const todo = createTodo("检查持久化", { dueDate: "2026-10-22" });

  const saved = await saveWidgetData(dataPath, {
    notes: { text: "桌面便签\r\n第二行" },
    todos: [todo]
  });
  const loaded = await loadWidgetData(dataPath);

  assert.deepEqual(loaded, saved);
  assert.equal(loaded.notes.text, "桌面便签\n第二行");
  assert.deepEqual(loaded.todos, [todo]);
  assert.equal(loaded.todos[0].dueDate, "2026-10-22");
});

test("缺失或损坏的组件数据回退为空数据", async (t) => {
  const directory = await makeTempDir(t);

  assert.deepEqual(
    await loadWidgetData(path.join(directory, "missing.json")),
    createDefaultWidgetData()
  );

  const brokenPath = path.join(directory, "broken.json");
  await fs.writeFile(brokenPath, "{broken", "utf8");
  assert.deepEqual(await loadWidgetData(brokenPath), createDefaultWidgetData());
});
