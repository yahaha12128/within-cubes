"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { CATEGORY_KEYS } = require("./categories");
const { normalizePathKey } = require("./manual-categories");

const ORGANIZED_VERSION = 1;
const VALID_CATEGORIES = new Set(CATEGORY_KEYS);
const VALID_KINDS = new Set(["file", "folder"]);

function createEmptyOrganizedItems(desktopPath = null) {
  return {
    version: ORGANIZED_VERSION,
    desktopPath: desktopPath ? path.resolve(desktopPath) : null,
    items: {}
  };
}

function isUnderDesktop(filePath, desktopPath) {
  const resolvedDesktop = path.resolve(desktopPath);
  const resolvedFile = path.resolve(filePath);

  return resolvedFile === resolvedDesktop ||
    resolvedFile.startsWith(resolvedDesktop + path.sep);
}

function normalizeItem(rawItem, desktopPath) {
  if (!rawItem || typeof rawItem.path !== "string") return null;

  const itemPath = path.resolve(rawItem.path);

  if (!VALID_CATEGORIES.has(rawItem.category)) return null;
  if (!VALID_KINDS.has(rawItem.kind)) return null;
  if (desktopPath && !isUnderDesktop(itemPath, desktopPath)) return null;

  const originalPath = typeof rawItem.originalPath === "string"
    ? path.resolve(rawItem.originalPath)
    : itemPath;

  if (desktopPath && !isUnderDesktop(originalPath, desktopPath)) return null;

  return {
    path: itemPath,
    originalPath,
    category: rawItem.category,
    kind: rawItem.kind,
    runId: typeof rawItem.runId === "string" ? rawItem.runId : null,
    organizedAt: typeof rawItem.organizedAt === "string"
      ? rawItem.organizedAt
      : new Date(0).toISOString(),
    hiddenBefore: rawItem.hiddenBefore === true,
    source: rawItem.source === "legacy" ? "legacy" : "organize"
  };
}

function normalizeOrganizedItems(data, { desktopPath } = {}) {
  const resolvedDesktop = desktopPath
    ? path.resolve(desktopPath)
    : data && typeof data.desktopPath === "string"
      ? path.resolve(data.desktopPath)
      : null;
  const state = createEmptyOrganizedItems(resolvedDesktop);

  if (!data || typeof data !== "object" || !data.items) {
    return state;
  }

  const entries = Array.isArray(data.items)
    ? data.items
    : Object.values(data.items);

  for (const entry of entries) {
    const normalized = normalizeItem(entry, resolvedDesktop);
    if (!normalized) continue;
    state.items[normalizePathKey(normalized.path)] = normalized;
  }

  return state;
}

async function readStateFile(filePath, desktopPath) {
  const raw = await fs.readFile(filePath, "utf8");
  return normalizeOrganizedItems(JSON.parse(raw), { desktopPath });
}

async function loadOrganizedItems(filePath, { desktopPath } = {}) {
  try {
    return await readStateFile(filePath, desktopPath);
  } catch (error) {
    try {
      return await readStateFile(`${filePath}.bak`, desktopPath);
    } catch (backupError) {
      return createEmptyOrganizedItems(desktopPath);
    }
  }
}

async function saveOrganizedItems(filePath, state) {
  const normalized = normalizeOrganizedItems(state, {
    desktopPath: state && state.desktopPath ? state.desktopPath : undefined
  });
  const directory = path.dirname(filePath);
  const temporaryPath = `${filePath}.tmp`;

  await fs.mkdir(directory, { recursive: true });

  try {
    await fs.copyFile(filePath, `${filePath}.bak`);
  } catch (error) {
    // 首次保存或备份失败时继续写主文件
  }

  await fs.writeFile(temporaryPath, JSON.stringify(normalized, null, 2), "utf8");
  await fs.rename(temporaryPath, filePath);
}

function getOrganizedItem(state, filePath) {
  if (!state || !state.items) return null;
  return state.items[normalizePathKey(filePath)] || null;
}

function hasOrganizedItem(state, filePath) {
  return getOrganizedItem(state, filePath) !== null;
}

function upsertOrganizedItem(state, item) {
  if (!state || !state.items) return null;

  const normalized = normalizeItem(item, state.desktopPath);
  if (!normalized) return null;

  state.items[normalizePathKey(normalized.path)] = normalized;
  return normalized;
}

function removeOrganizedItem(state, filePath) {
  if (!state || !state.items) return false;

  const key = normalizePathKey(filePath);
  if (!(key in state.items)) return false;

  delete state.items[key];
  return true;
}

function listOrganizedItems(state) {
  if (!state || !state.items) return [];
  return Object.values(state.items);
}

function getOrganizedItemsByRun(state, runId) {
  return listOrganizedItems(state).filter((item) => item.runId === runId);
}

module.exports = {
  ORGANIZED_VERSION,
  createEmptyOrganizedItems,
  getOrganizedItem,
  getOrganizedItemsByRun,
  hasOrganizedItem,
  isUnderDesktop,
  listOrganizedItems,
  loadOrganizedItems,
  normalizeItem,
  normalizeOrganizedItems,
  removeOrganizedItem,
  saveOrganizedItems,
  upsertOrganizedItem
};
