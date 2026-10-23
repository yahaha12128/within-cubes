"use strict";

const path = require("node:path");
const { CATEGORY_KEYS, classifyFileName } = require("./categories");
const { getFileType } = require("./file-types");

const GROUP_MIN_WIDTH = 300;
const GROUP_MIN_HEIGHT = 240;
const GROUP_MAX_WIDTH = 2000;
const GROUP_MAX_HEIGHT = 2000;
const GROUP_DEFAULT_WIDTH = 380;
const GROUP_DEFAULT_HEIGHT = 340;
const GROUP_NAME_MAX_LENGTH = 40;
const MAX_GROUPS = 20;
const MAX_ADDED_FILES = 1000;

const TYPE_TO_CATEGORY = {
  folder: "folders",
  shortcut: "apps",
  installer: "apps",
  image: "media",
  audio: "media",
  video: "media",
  archive: "archives",
  document: "documents",
  code: "documents",
  other: "documents"
};

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeGroupId(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return /^[A-Za-z0-9_-]{1,80}$/.test(trimmed) ? trimmed : "";
}

function normalizeGroupName(value) {
  if (typeof value !== "string") return "";
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return Array.from(cleaned).slice(0, GROUP_NAME_MAX_LENGTH).join("");
}

function normalizeCoordinate(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function normalizeGroupKeys(value) {
  if (!Array.isArray(value)) return [];

  const keys = [];
  const seen = new Set();

  for (const key of value) {
    if (typeof key !== "string" || !CATEGORY_KEYS.includes(key)) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    keys.push(key);
  }

  return keys;
}

function normalizeAddedFiles(value) {
  if (!Array.isArray(value)) return [];

  const files = [];
  const seen = new Set();

  for (const item of value.slice(0, MAX_ADDED_FILES)) {
    const source = item && typeof item === "object" ? item : { path: item };
    if (typeof source.path !== "string" || !source.path.trim()) continue;

    const filePath = source.path.trim();
    const key = filePath.toLowerCase();

    if (seen.has(key)) continue;
    seen.add(key);

    files.push({
      path: filePath,
      name: typeof source.name === "string" && source.name.trim()
        ? source.name.trim()
        : path.basename(filePath),
      kind: source.kind === "folder" ? "folder" : "file"
    });
  }

  return files;
}

function normalizeGroup(data) {
  if (!data || typeof data !== "object") return null;

  const id = normalizeGroupId(data.id);
  const keys = normalizeGroupKeys(data.keys);

  if (!id || keys.length < 2) return null;

  const width = Math.round(Number(data.width));
  const height = Math.round(Number(data.height));
  const activeKey = keys.includes(data.activeKey) ? data.activeKey : keys[0];

  return {
    id,
    keys,
    x: normalizeCoordinate(data.x),
    y: normalizeCoordinate(data.y),
    width: Number.isFinite(width)
      ? clamp(width, GROUP_MIN_WIDTH, GROUP_MAX_WIDTH)
      : GROUP_DEFAULT_WIDTH,
    height: Number.isFinite(height)
      ? clamp(height, GROUP_MIN_HEIGHT, GROUP_MAX_HEIGHT)
      : GROUP_DEFAULT_HEIGHT,
    locked: Boolean(data.locked),
    name: normalizeGroupName(data.name),
    activeKey,
    addedFiles: normalizeAddedFiles(data.addedFiles)
  };
}

function normalizeGroups(value) {
  if (!Array.isArray(value)) return [];

  const groups = [];
  const usedIds = new Set();
  const usedKeys = new Set();

  for (const item of value.slice(0, MAX_GROUPS)) {
    const group = normalizeGroup(item);

    if (!group) continue;
    if (usedIds.has(group.id)) continue;
    if (group.keys.some((key) => usedKeys.has(key))) continue;

    usedIds.add(group.id);
    group.keys.forEach((key) => usedKeys.add(key));
    groups.push(group);
  }

  return groups;
}

function getGroupedCategoryKeys(groups) {
  const keys = new Set();

  for (const group of Array.isArray(groups) ? groups : []) {
    if (!group || !Array.isArray(group.keys) || group.keys.length < 2) continue;
    group.keys.forEach((key) => keys.add(key));
  }

  return keys;
}

function findGroupForCategory(groups, categoryKey) {
  if (!categoryKey) return null;

  for (const group of Array.isArray(groups) ? groups : []) {
    if (group && Array.isArray(group.keys) && group.keys.includes(categoryKey)) {
      return group;
    }
  }

  return null;
}

// 把一个文件名（或文件夹）映射到应用固定的五个分类之一。
// 支持的后缀沿用 categories.js；代码等未登记后缀归入文档。
function groupCategoryForFile(fileName, kind = "file") {
  if (kind === "folder") return "folders";

  const classification = classifyFileName(fileName);

  if (classification.category) return classification.category;

  const type = getFileType(fileName);
  return TYPE_TO_CATEGORY[type] || "documents";
}

// 拖入标签组时优先按类型匹配组内标签；组内没有对应分类时落到当前标签。
function chooseGroupCategory(groupKeys, fileName, kind, fallbackKey) {
  const keys = Array.isArray(groupKeys) ? groupKeys : [];
  if (keys.length === 0) return null;

  const category = groupCategoryForFile(fileName, kind);

  if (keys.includes(category)) return category;
  if (fallbackKey && keys.includes(fallbackKey)) return fallbackKey;
  return keys[0];
}

module.exports = {
  GROUP_MIN_WIDTH,
  GROUP_MIN_HEIGHT,
  GROUP_MAX_WIDTH,
  GROUP_MAX_HEIGHT,
  GROUP_DEFAULT_WIDTH,
  GROUP_DEFAULT_HEIGHT,
  GROUP_NAME_MAX_LENGTH,
  MAX_GROUPS,
  MAX_ADDED_FILES,
  normalizeGroupId,
  normalizeGroupName,
  normalizeGroupKeys,
  normalizeAddedFiles,
  normalizeGroup,
  normalizeGroups,
  getGroupedCategoryKeys,
  findGroupForCategory,
  groupCategoryForFile,
  chooseGroupCategory
};
