"use strict";

const {
  normalizeTodoText,
  normalizeTodoDate,
  normalizeTodoTime,
  createTodo,
  normalizeWidgetData,
  MAX_TODO_ITEMS
} = require("./widget-data");

// Excel 打开 UTF-8 CSV 时靠 BOM 识别编码，缺了它中文会变乱码。
const UTF8_BOM = "\uFEFF";

const CSV_COLUMNS = ["text", "done", "dueDate", "dueTime", "createdAt"];

function escapeCsvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

/**
 * 按 ids 筛选要导出的待办，并保持 ids 的顺序
 * （调用方传入的是当前 Tab 列表的显示顺序，导出文件和眼睛看到的一致）。
 * ids 不是数组时返回全部（旧调用方式 / 命令行导出），空数组则返回空列表。
 */
function selectTodosForExport(todos, ids) {
  const list = Array.isArray(todos) ? todos.filter(Boolean) : [];
  if (!Array.isArray(ids)) return list;

  const byId = new Map(list.map((todo) => [String(todo.id), todo]));
  const picked = [];
  for (const id of ids) {
    const todo = byId.get(String(id));
    if (todo) picked.push(todo);
  }

  return picked;
}

/**
 * 把待办列表序列化成 UTF-8（带 BOM）的 CSV 文本。
 * 列顺序固定为 text,done,dueDate,dueTime,createdAt，导入时能原样还原。
 */
function todosToCsv(todos) {
  const rows = [CSV_COLUMNS.join(",")];

  for (const todo of Array.isArray(todos) ? todos : []) {
    if (!todo) continue;
    rows.push(
      [
        escapeCsvCell(todo.text),
        todo.done ? "1" : "0",
        escapeCsvCell(todo.dueDate || ""),
        escapeCsvCell(todo.dueTime || ""),
        escapeCsvCell(todo.createdAt || "")
      ].join(",")
    );
  }

  return `${UTF8_BOM}${rows.join("\r\n")}\r\n`;
}

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (quoted) {
      if (char === '"') {
        if (line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
      continue;
    }

    if (char === ",") {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}

function normalizeCsvText(text) {
  return typeof text === "string" ? text.replace(/^\uFEFF/, "") : "";
}

function parseTruthyFlag(value) {
  const flag = String(value || "").trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes" || flag === "y" ||
    flag === "是" || flag === "已完成";
}

/**
 * 解析 CSV 文本为待办数组。兼容两种格式：
 * 1) 本应用导出的标准格式（带表头 text,done,dueDate,dueTime,createdAt）
 * 2) 只有一列的纯文本列表（每行一条待办），方便从别处随手粘过来的清单
 */
function parseTodosCsv(rawText, { existing = [] } = {}) {
  const text = normalizeCsvText(rawText);
  if (!text.trim()) return { todos: [], skipped: 0, detectedHeader: false };

  const lines = text.split(/\r\n|\r|\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) return { todos: [], skipped: 0, detectedHeader: false };

  const firstCells = splitCsvLine(lines[0]).map((cell) => cell.trim().toLowerCase());
  const detectedHeader = firstCells.includes("text") || firstCells.includes("内容") ||
    firstCells.includes("待办");
  const headerCells = detectedHeader ? firstCells : null;
  const bodyLines = detectedHeader ? lines.slice(1) : lines;

  const takenIds = new Set(
    (Array.isArray(existing) ? existing : []).map((todo) => todo && todo.id).filter(Boolean)
  );
  const takenTexts = new Set(
    (Array.isArray(existing) ? existing : [])
      .map((todo) => (todo && todo.text ? normalizeTodoText(todo.text) : ""))
      .filter(Boolean)
  );

  const todos = [];
  let skipped = 0;

  for (const line of bodyLines) {
    if (todos.length >= MAX_TODO_ITEMS) {
      skipped += 1;
      continue;
    }

    const cells = splitCsvLine(line).map((cell) => cell.trim());
    const pick = (name, fallbackIndex) => {
      if (!headerCells) return cells[fallbackIndex] || "";
      const index = headerCells.indexOf(name);
      return index >= 0 ? cells[index] || "" : "";
    };

    const text = normalizeTodoText(pick("text", 0));
    if (!text) {
      skipped += 1;
      continue;
    }
    if (takenTexts.has(text)) {
      skipped += 1;
      continue;
    }

    const doneRaw = pick("done", 1);
    const dueDate = normalizeTodoDate(pick("duedate", 2));
    const dueTime = normalizeTodoTime(pick("duetime", 3));
    const createdAtRaw = pick("createdat", 4);
    const parsedCreatedAt = createdAtRaw ? Date.parse(createdAtRaw) : NaN;

    const todo = createTodo(text, { dueDate, dueTime });
    if (!todo || takenIds.has(todo.id)) {
      skipped += 1;
      continue;
    }

    todo.done = parseTruthyFlag(doneRaw);
    if (!Number.isNaN(parsedCreatedAt)) {
      todo.createdAt = new Date(parsedCreatedAt).toISOString();
    }

    takenIds.add(todo.id);
    takenTexts.add(text);
    todos.push(todo);

    if (todos.length >= MAX_TODO_ITEMS) break;
  }

  return {
    todos: normalizeWidgetData({ todos }).todos,
    skipped,
    detectedHeader
  };
}

module.exports = {
  UTF8_BOM,
  CSV_COLUMNS,
  selectTodosForExport,
  todosToCsv,
  parseTodosCsv
};
