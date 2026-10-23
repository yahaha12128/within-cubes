"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { selectTodosForExport, todosToCsv, parseTodosCsv } = require("../src/todo-csv");
const {
  normalizeTodoTime,
  sortTodosBySchedule,
  normalizeWidgetData
} = require("../src/widget-data");

test("导出的 CSV 以 UTF-8 BOM 开头，Excel 打开才不会乱码", () => {
  const csv = todosToCsv([
    { id: "a", text: "买牛奶", done: false, createdAt: "2026-01-01T00:00:00.000Z", dueDate: "2026-01-02", dueTime: "09:30" }
  ]);

  assert.ok(csv.startsWith("\uFEFF"), "缺少 UTF-8 BOM");
  assert.ok(csv.includes("text,done,dueDate,dueTime,createdAt"));
  assert.ok(csv.includes("买牛奶"));
});

test("CSV 单元格里的逗号与引号会被正确转义", () => {
  const csv = todosToCsv([
    { id: "a", text: '买 "有机" 牛奶, 鸡蛋', done: true, createdAt: "", dueDate: "", dueTime: "" }
  ]);

  const parsed = parseTodosCsv(csv);
  assert.equal(parsed.todos.length, 1);
  assert.equal(parsed.todos[0].text, '买 "有机" 牛奶, 鸡蛋');
  assert.equal(parsed.todos[0].done, true);
});

test("导出再导入可以原样还原待办", () => {
  const source = [
    { id: "1", text: "写周报", done: false, createdAt: "2026-03-01T08:00:00.000Z", dueDate: "2026-03-05", dueTime: "18:00" },
    { id: "2", text: "交房租", done: true, createdAt: "2026-03-02T08:00:00.000Z", dueDate: "2026-03-10", dueTime: "" }
  ];

  const parsed = parseTodosCsv(todosToCsv(source));

  assert.equal(parsed.todos.length, 2);
  assert.equal(parsed.todos[0].text, "写周报");
  assert.equal(parsed.todos[0].dueDate, "2026-03-05");
  assert.equal(parsed.todos[0].dueTime, "18:00");
  assert.equal(parsed.todos[1].done, true);
});

test("纯文本清单（无表头）也能导入", () => {
  const parsed = parseTodosCsv("买牛奶\n遛狗\n");

  assert.equal(parsed.detectedHeader, false);
  assert.equal(parsed.todos.length, 2);
  assert.deepEqual(parsed.todos.map((todo) => todo.text), ["买牛奶", "遛狗"]);
});

test("导入时按内容跳过重复项", () => {
  const existing = [{ id: "x", text: "买牛奶", done: false, createdAt: "", dueDate: "", dueTime: "" }];
  const parsed = parseTodosCsv("买牛奶\n遛狗", { existing });

  assert.deepEqual(parsed.todos.map((todo) => todo.text), ["遛狗"]);
  assert.equal(parsed.skipped, 1);
});

test("时间归一：非法值一律变空，合法值补齐前导零", () => {
  assert.equal(normalizeTodoTime("9:30"), "09:30");
  assert.equal(normalizeTodoTime("09:30"), "09:30");
  assert.equal(normalizeTodoTime("24:00"), "");
  assert.equal(normalizeTodoTime("12:60"), "");
  assert.equal(normalizeTodoTime("abc"), "");
  assert.equal(normalizeTodoTime(undefined), "");
});

test("排序：有日期的在前，同日期按时间，都没日期的垫底", () => {
  const todos = normalizeWidgetData({
    todos: [
      { id: "1", text: "无日期", createdAt: "2026-01-01T00:00:00.000Z", dueDate: "", dueTime: "" },
      { id: "2", text: "三号晚上", createdAt: "2026-01-01T00:00:00.000Z", dueDate: "2026-05-03", dueTime: "20:00" },
      { id: "3", text: "三号早上", createdAt: "2026-01-01T00:00:00.000Z", dueDate: "2026-05-03", dueTime: "08:00" },
      { id: "4", text: "二号", createdAt: "2026-01-01T00:00:00.000Z", dueDate: "2026-05-02", dueTime: "" }
    ]
  }).todos;

  const order = sortTodosBySchedule(todos).map((todo) => todo.id);
  assert.deepEqual(order, ["4", "3", "2", "1"]);
});

test("勾选导出：只保留被勾选 id 对应的待办", () => {
  const todos = [
    { id: "a", text: "买牛奶" },
    { id: "b", text: "写周报" },
    { id: "c", text: "交房租" }
  ];

  const picked = selectTodosForExport(todos, ["b", "c"]);
  assert.deepEqual(picked.map((todo) => todo.id), ["b", "c"]);
});

test("导出当前列表：顺序跟传入的 ids 一致（和眼睛看到的列表同序）", () => {
  const todos = [
    { id: "a", text: "买牛奶" },
    { id: "b", text: "写周报" },
    { id: "c", text: "交房租" }
  ];

  const picked = selectTodosForExport(todos, ["c", "a"]);
  assert.deepEqual(picked.map((todo) => todo.id), ["c", "a"]);
});

test("勾选导出：空数组表示一条都没勾，不应该回退成全部", () => {
  const todos = [{ id: "a", text: "买牛奶" }];
  assert.deepEqual(selectTodosForExport(todos, []), []);
});

test("勾选导出：未传 ids 时保留全部（兼容旧调用）", () => {
  const todos = [{ id: "a", text: "买牛奶" }, { id: "b", text: "写周报" }];
  assert.equal(selectTodosForExport(todos, null).length, 2);
  assert.equal(selectTodosForExport(todos, undefined).length, 2);
});

test("勾选导出：id 类型不一致也能匹配", () => {
  const todos = [{ id: "12", text: "数字 id" }];
  assert.equal(selectTodosForExport(todos, [12]).length, 1);
});
