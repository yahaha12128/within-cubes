"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const WIDGET_DATA_VERSION = 1;
const MAX_NOTES_LENGTH = 50000;
const MAX_TODO_ITEMS = 200;
const MAX_TODO_TEXT_LENGTH = 200;

function normalizeNotesText(value) {
  if (typeof value !== "string") return "";
  const normalized = value.replace(/\r\n?/g, "\n");
  return Array.from(normalized).slice(0, MAX_NOTES_LENGTH).join("");
}

function normalizeTodoText(value) {
  if (typeof value !== "string") return "";
  return Array.from(
    value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim()
  ).slice(0, MAX_TODO_TEXT_LENGTH).join("");
}

function normalizeTodoId(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 80);
}

function normalizeTodoDate(value) {
  if (typeof value !== "string") return "";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return "";


  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return "";
  }

  return `${match[1]}-${match[2]}-${match[3]}`;
}

/**
 * 待办的可选时间（HH:mm 或 HH:mm:ss），用于「未完成」列表的排序与展示。
 * 非法值一律归一为空字符串，表示「不限时间」。
 */
function normalizeTodoTime(value) {
  if (typeof value !== "string") return "";

  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) return "";

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour > 23 || minute > 59) return "";

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * 排序权重：有日期的排在前面，同日期按时间排，都没有时间的排最后，
 * 最后用创建时间兜底，保证列表顺序稳定不会随机跳动。
 */
function getTodoSortWeight(todo) {
  const datePart = todo && todo.dueDate ? todo.dueDate : "9999-99-99";
  const timePart = todo && todo.dueTime ? todo.dueTime : "99:99";
  const created = todo && typeof todo.createdAt === "string" ? todo.createdAt : "";
  return `${datePart} ${timePart} ${created}`;
}

function sortTodosBySchedule(todos) {
  return [...(Array.isArray(todos) ? todos : [])].sort((left, right) => {
    const weight = getTodoSortWeight(left).localeCompare(getTodoSortWeight(right));
    if (weight !== 0) return weight;
    return String(left && left.text || "").localeCompare(String(right && right.text || ""));
  });
}

function normalizeTodo(value) {
  const source = value && typeof value === "object" ? value : {};
  const text = normalizeTodoText(source.text);
  const id = normalizeTodoId(source.id);

  if (!text || !id) return null;

  const createdAt = typeof source.createdAt === "string" && source.createdAt
    ? source.createdAt
    : new Date(0).toISOString();

  return {
    id,
    text,
    done: Boolean(source.done),
    createdAt,
    dueDate: normalizeTodoDate(source.dueDate),
    dueTime: normalizeTodoTime(source.dueTime)
  };
}

function normalizeWidgetData(data) {
  const source = data && typeof data === "object" ? data : {};
  const todos = [];
  const seen = new Set();
  const sourceTodos = Array.isArray(source.todos) ? source.todos : [];

  for (const value of sourceTodos) {
    if (todos.length >= MAX_TODO_ITEMS) break;
    const todo = normalizeTodo(value);
    if (!todo || seen.has(todo.id)) continue;
    seen.add(todo.id);
    todos.push(todo);
  }

  return {
    version: WIDGET_DATA_VERSION,
    notes: {
      text: normalizeNotesText(source.notes && source.notes.text)
    },
    todos
  };
}

function createDefaultWidgetData() {
  return normalizeWidgetData(null);
}

function createTodo(text, { dueDate = "", dueTime = "" } = {}) {
  const normalized = normalizeTodoText(text);
  if (!normalized) return null;

  return {
    id: randomUUID(),
    text: normalized,
    done: false,
    createdAt: new Date().toISOString(),
    dueDate: normalizeTodoDate(dueDate),
    dueTime: normalizeTodoTime(dueTime)
  };
}

async function loadWidgetData(dataPath) {
  try {
    const raw = await fs.readFile(dataPath, "utf8");
    return normalizeWidgetData(JSON.parse(raw));
  } catch (error) {
    return createDefaultWidgetData();
  }
}

async function saveWidgetData(dataPath, data) {
  const normalized = normalizeWidgetData(data);
  const directory = path.dirname(dataPath);
  const temporaryPath = `${dataPath}.tmp`;

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(temporaryPath, JSON.stringify(normalized, null, 2), "utf8");
  await fs.rename(temporaryPath, dataPath);

  return normalized;
}

module.exports = {
  WIDGET_DATA_VERSION,
  MAX_NOTES_LENGTH,
  MAX_TODO_ITEMS,
  MAX_TODO_TEXT_LENGTH,
  normalizeNotesText,
  normalizeTodoText,
  normalizeTodoDate,
  normalizeTodoTime,
  getTodoSortWeight,
  sortTodosBySchedule,
  normalizeWidgetData,
  createDefaultWidgetData,
  createTodo,
  loadWidgetData,
  saveWidgetData
};
