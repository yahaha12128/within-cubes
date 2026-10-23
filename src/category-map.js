"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { CATEGORY_KEYS } = require("./categories");

const CATEGORY_MAP_VERSION = 1;
const MAX_UNDO_RECORDS = 200;
const CATEGORY_SET = new Set(CATEGORY_KEYS);
const SOURCES = new Set(["organize", "manual", "drag", "migration", "legacy"]);

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

function normalizeKind(value) {
  return value === "folder" ? "folder" : "file";
}

function normalizeSource(value, fallback = "manual") {
  return SOURCES.has(value) ? value : fallback;
}

function normalizeAssignment(value) {
  if (!value || typeof value !== "object") return null;

  const filePath = typeof value.path === "string" ? value.path.trim() : "";
  const category = isCategoryKey(value.category) ? value.category : null;

  if (!filePath || !category) return null;

  return {
    path: filePath,
    name: typeof value.name === "string" && value.name.trim()
      ? value.name.trim()
      : path.basename(filePath),
    category,
    kind: normalizeKind(value.kind),
    runId: typeof value.runId === "string" && value.runId ? value.runId : null,
    source: normalizeSource(value.source),
    updatedAt: normalizeTimestamp(value.updatedAt)
  };
}

function normalizeUndoRecord(value) {
  if (!value || typeof value !== "object") return null;

  const filePath = typeof value.path === "string" ? value.path.trim() : "";
  const fromCategory = isCategoryKey(value.fromCategory) ? value.fromCategory : null;
  const toCategory = isCategoryKey(value.toCategory) ? value.toCategory : null;

  if (!filePath || !fromCategory || !toCategory) return null;

  const previousAssignment = value.previousAssignment
    ? normalizeAssignment(value.previousAssignment)
    : null;

  return {
    id: typeof value.id === "string" && value.id
      ? value.id
      : `manual-${crypto.randomUUID()}`,
    at: normalizeTimestamp(value.at, new Date().toISOString()),
    path: filePath,
    name: typeof value.name === "string" && value.name.trim()
      ? value.name.trim()
      : path.basename(filePath),
    fromCategory,
    toCategory,
    previousAssignment
  };
}

function createEmptyCategoryMap(desktopPath = null) {
  return {
    version: CATEGORY_MAP_VERSION,
    desktopPath: desktopPath ? path.resolve(desktopPath) : null,
    assignments: {},
    undoStack: [],
    meta: {
      manualImported: false
    }
  };
}

function normalizeCategoryMap(data, { desktopPath } = {}) {
  const resolvedDesktop = desktopPath
    ? path.resolve(desktopPath)
    : data && typeof data.desktopPath === "string"
      ? path.resolve(data.desktopPath)
      : null;
  const state = createEmptyCategoryMap(resolvedDesktop);

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

  if (data.meta && typeof data.meta === "object") {
    state.meta.manualImported = data.meta.manualImported === true;
  }

  return state;
}

async function loadCategoryMap(statePath, options = {}) {
  try {
    const raw = await fs.readFile(statePath, "utf8");
    return normalizeCategoryMap(JSON.parse(raw), options);
  } catch (error) {
    return createEmptyCategoryMap(options.desktopPath || null);
  }
}

async function saveCategoryMap(statePath, state) {
  const normalized = normalizeCategoryMap(state, {
    desktopPath: state && state.desktopPath ? state.desktopPath : undefined
  });
  const directory = path.dirname(statePath);
  const temporaryPath = `${statePath}.tmp`;

  await fs.mkdir(directory, { recursive: true });

  try {
    await fs.copyFile(statePath, `${statePath}.bak`);
  } catch (error) {
    // 首次保存或备份失败时继续写主文件
  }

  await fs.writeFile(temporaryPath, JSON.stringify(normalized, null, 2), "utf8");
  await fs.rename(temporaryPath, statePath);

  return normalized;
}

function getAssignment(state, filePath) {
  if (!state || !state.assignments || typeof filePath !== "string") return null;
  return state.assignments[normalizePathKey(filePath)] || null;
}

function getCategory(state, filePath) {
  const assignment = getAssignment(state, filePath);
  return assignment ? assignment.category : null;
}

function listAssignments(state) {
  if (!state || !state.assignments) return [];
  return Object.values(state.assignments);
}

function setAssignment(state, {
  path: filePath,
  name,
  category,
  kind = "file",
  runId = null,
  source = "manual",
  fromCategory = null,
  at = new Date()
}) {
  if (!state || !state.assignments) {
    return { changed: false, error: "归属记录尚未初始化。" };
  }

  if (!isCategoryKey(category)) {
    return { changed: false, error: "目标分类无效。" };
  }

  if (typeof filePath !== "string" || filePath.trim() === "") {
    return { changed: false, error: "文件路径无效。" };
  }

  const trimmedPath = filePath.trim();
  const key = normalizePathKey(trimmedPath);
  const normalizedSource = normalizeSource(source);
  const normalizedRunId = typeof runId === "string" && runId ? runId : null;
  const atIso = normalizeTimestamp(
    at instanceof Date ? at.toISOString() : at,
    new Date().toISOString()
  );
  const existing = state.assignments[key] || null;

  if (
    existing &&
    existing.category === category &&
    existing.kind === normalizeKind(kind) &&
    existing.runId === normalizedRunId &&
    existing.source === normalizedSource
  ) {
    return { changed: false, assignment: { ...existing } };
  }

  const next = {
    path: trimmedPath,
    name: typeof name === "string" && name.trim()
      ? name.trim()
      : path.basename(trimmedPath),
    category,
    kind: normalizeKind(kind),
    runId: normalizedRunId,
    source: normalizedSource,
    updatedAt: atIso
  };

  if (normalizedSource === "manual") {
    if (existing && existing.category === category) {
      return { changed: false, assignment: { ...existing } };
    }

    const previousAssignment = existing ? { ...existing } : null;
    const previousCategory = existing
      ? existing.category
      : isCategoryKey(fromCategory)
        ? fromCategory
        : category;

    state.undoStack.push({
      id: `manual-${crypto.randomUUID()}`,
      at: atIso,
      path: trimmedPath,
      name: next.name,
      fromCategory: previousCategory,
      toCategory: category,
      previousAssignment
    });

    if (state.undoStack.length > MAX_UNDO_RECORDS) {
      state.undoStack = state.undoStack.slice(-MAX_UNDO_RECORDS);
    }

    state.assignments[key] = next;

    return {
      changed: true,
      assignment: { ...next },
      record: { ...state.undoStack[state.undoStack.length - 1] }
    };
  }

  state.assignments[key] = next;

  return {
    changed: true,
    assignment: { ...next }
  };
}

function removeAssignment(state, filePath, { runId = null } = {}) {
  if (!state || !state.assignments || typeof filePath !== "string") {
    return { removed: false, assignment: null };
  }

  const key = normalizePathKey(filePath);
  const existing = state.assignments[key] || null;

  if (!existing) {
    return { removed: false, assignment: null };
  }

  if (runId !== null && existing.runId !== runId) {
    return { removed: false, assignment: { ...existing } };
  }

  delete state.assignments[key];

  return { removed: true, assignment: { ...existing } };
}

function removeAssignmentsByRun(state, runId) {
  const removed = [];

  if (!state || !state.assignments || typeof runId !== "string") {
    return removed;
  }

  for (const [key, assignment] of Object.entries(state.assignments)) {
    if (assignment.runId !== runId) continue;
    removed.push({ ...assignment });
    delete state.assignments[key];
  }

  return removed;
}

function removeAssignmentsByCategory(state, category) {
  const removed = [];

  if (!state || !state.assignments || !isCategoryKey(category)) {
    return removed;
  }

  for (const [key, assignment] of Object.entries(state.assignments)) {
    if (assignment.category !== category) continue;
    removed.push({ ...assignment });
    delete state.assignments[key];
  }

  return removed;
}

function undoManualAssignment(state, { at = new Date() } = {}) {
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
    const restored = {
      ...record.previousAssignment,
      updatedAt: atIso
    };

    state.assignments[key] = restored;

    return {
      changed: true,
      record,
      assignedCategory: restored.category,
      restoredCategory: restored.category,
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
  CATEGORY_MAP_VERSION,
  MAX_UNDO_RECORDS,
  createEmptyCategoryMap,
  normalizeCategoryMap,
  loadCategoryMap,
  saveCategoryMap,
  normalizePathKey,
  getAssignment,
  getCategory,
  listAssignments,
  setAssignment,
  removeAssignment,
  removeAssignmentsByRun,
  removeAssignmentsByCategory,
  undoManualAssignment,
  getManualUndoStatus
};
