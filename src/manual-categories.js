"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { CATEGORY_KEYS } = require("./categories");

const MANUAL_CATEGORY_VERSION = 1;
const MAX_UNDO_RECORDS = 200;
const CATEGORY_SET = new Set(CATEGORY_KEYS);

function isCategoryKey(value) {
  return typeof value === "string" && CATEGORY_SET.has(value);
}

function normalizePathKey(value) {
  const resolved = path.resolve(String(value));
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function normalizeTimestamp(value, fallback = new Date(0).toISOString()) {
  if (typeof value !== "string") return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function createEmptyManualCategories() {
  return {
    version: MANUAL_CATEGORY_VERSION,
    assignments: {},
    undoStack: []
  };
}

function normalizeAssignment(value) {
  if (!value || typeof value !== "object") return null;

  const filePath = typeof value.path === "string" ? value.path.trim() : "";
  const category = isCategoryKey(value.category) ? value.category : null;

  if (!filePath || !category) return null;

  return {
    path: filePath,
    category,
    updatedAt: normalizeTimestamp(value.updatedAt)
  };
}

function normalizeUndoRecord(value) {
  if (!value || typeof value !== "object") return null;

  const filePath = typeof value.path === "string" ? value.path.trim() : "";
  const fromCategory = isCategoryKey(value.fromCategory) ? value.fromCategory : null;
  const toCategory = isCategoryKey(value.toCategory) ? value.toCategory : null;

  if (!filePath || !fromCategory || !toCategory) return null;

  return {
    id: typeof value.id === "string" && value.id
      ? value.id
      : `manual-${crypto.randomUUID()}`,
    at: normalizeTimestamp(value.at, new Date().toISOString()),
    path: filePath,
    name: typeof value.name === "string" && value.name
      ? value.name
      : path.basename(filePath),
    fromCategory,
    toCategory,
    previousAssignment: value.previousAssignment
      ? normalizeAssignment(value.previousAssignment)
      : null
  };
}

function normalizeManualCategories(data) {
  const state = createEmptyManualCategories();

  if (!data || typeof data !== "object") {
    return state;
  }

  if (data.assignments && typeof data.assignments === "object") {
    for (const value of Object.values(data.assignments)) {
      const assignment = normalizeAssignment(value);
      if (!assignment) continue;
      state.assignments[normalizePathKey(assignment.path)] = assignment;
    }
  }

  if (Array.isArray(data.undoStack)) {
    state.undoStack = data.undoStack
      .map(normalizeUndoRecord)
      .filter(Boolean)
      .slice(-MAX_UNDO_RECORDS);
  }

  return state;
}

async function loadManualCategories(statePath) {
  try {
    const raw = await fs.readFile(statePath, "utf8");
    return normalizeManualCategories(JSON.parse(raw));
  } catch (error) {
    return createEmptyManualCategories();
  }
}

async function saveManualCategories(statePath, state) {
  const normalized = normalizeManualCategories(state);
  const directory = path.dirname(statePath);
  const temporaryPath = `${statePath}.tmp`;

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(temporaryPath, JSON.stringify(normalized, null, 2), "utf8");
  await fs.rename(temporaryPath, statePath);

  return normalized;
}

function getManualAssignment(state, filePath) {
  if (!state || !state.assignments || typeof filePath !== "string") return null;
  return state.assignments[normalizePathKey(filePath)] || null;
}

function getManualCategory(state, filePath) {
  const assignment = getManualAssignment(state, filePath);
  return assignment ? assignment.category : null;
}

function setManualCategory(state, {
  path: filePath,
  name,
  fromCategory,
  toCategory,
  at = new Date()
}) {
  if (!state || !isCategoryKey(toCategory) || !isCategoryKey(fromCategory)) {
    return { changed: false, error: "分类调整参数无效。" };
  }

  if (typeof filePath !== "string" || filePath.trim() === "") {
    return { changed: false, error: "文件路径无效。" };
  }

  if (fromCategory === toCategory) {
    return { changed: false };
  }

  const trimmedPath = filePath.trim();
  const key = normalizePathKey(trimmedPath);
  const atIso = normalizeTimestamp(
    at instanceof Date ? at.toISOString() : at,
    new Date().toISOString()
  );
  const existing = state.assignments[key] || null;
  const previousAssignment = existing ? { ...existing } : null;

  state.assignments[key] = {
    path: trimmedPath,
    category: toCategory,
    updatedAt: atIso
  };

  const record = {
    id: `manual-${crypto.randomUUID()}`,
    at: atIso,
    path: trimmedPath,
    name: typeof name === "string" && name.trim()
      ? name.trim()
      : path.basename(trimmedPath),
    fromCategory,
    toCategory,
    previousAssignment
  };

  state.undoStack.push(record);

  if (state.undoStack.length > MAX_UNDO_RECORDS) {
    state.undoStack = state.undoStack.slice(-MAX_UNDO_RECORDS);
  }

  return {
    changed: true,
    record,
    assignment: { ...state.assignments[key] }
  };
}

function undoManualCategory(state, { at = new Date() } = {}) {
  if (!state || !Array.isArray(state.undoStack) || state.undoStack.length === 0) {
    return { changed: false, error: "没有可撤销的分类调整。" };
  }

  const record = state.undoStack.pop();
  const key = normalizePathKey(record.path);
  const atIso = normalizeTimestamp(
    at instanceof Date ? at.toISOString() : at,
    new Date().toISOString()
  );

  if (record.previousAssignment) {
    state.assignments[key] = {
      ...record.previousAssignment,
      updatedAt: atIso
    };

    return {
      changed: true,
      record,
      assignedCategory: record.previousAssignment.category,
      restoredCategory: record.previousAssignment.category,
      at: atIso
    };
  }

  delete state.assignments[key];

  return {
    changed: true,
    record,
    assignedCategory: null,
    restoredCategory: record.fromCategory,
    at: atIso
  };
}

function getManualUndoStatus(state) {
  const stack = state && Array.isArray(state.undoStack) ? state.undoStack : [];
  const last = stack.length > 0 ? stack[stack.length - 1] : null;

  return {
    available: Boolean(last),
    last: last
      ? {
          id: last.id,
          at: last.at,
          path: last.path,
          name: last.name,
          fromCategory: last.fromCategory,
          toCategory: last.toCategory
        }
      : null
  };
}

module.exports = {
  MANUAL_CATEGORY_VERSION,
  MAX_UNDO_RECORDS,
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
};
