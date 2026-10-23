"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { CATEGORY_KEYS } = require("./categories");

const CATEGORY_MAPPINGS_VERSION = 1;
const CATEGORY_KEY_SET = new Set(CATEGORY_KEYS);

function createEmptyCategoryMappings() {
  return {
    version: CATEGORY_MAPPINGS_VERSION,
    categories: Object.fromEntries(CATEGORY_KEYS.map((key) => [key, null]))
  };
}

function normalizeCategoryMappings(data) {
  const state = createEmptyCategoryMappings();
  const source = data && typeof data === "object" ? data : {};
  const categories = source.categories && typeof source.categories === "object"
    ? source.categories
    : {};

  for (const key of CATEGORY_KEYS) {
    const value = categories[key];

    if (typeof value === "string" && value.trim()) {
      state.categories[key] = path.resolve(value.trim());
    }
  }

  return state;
}

async function loadCategoryMappings(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return normalizeCategoryMappings(JSON.parse(raw));
  } catch (error) {
    return createEmptyCategoryMappings();
  }
}

async function saveCategoryMappings(filePath, data) {
  const normalized = normalizeCategoryMappings(data);
  const directory = path.dirname(filePath);
  const temporaryPath = `${filePath}.tmp`;

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(temporaryPath, JSON.stringify(normalized, null, 2), "utf8");
  await fs.rename(temporaryPath, filePath);

  return normalized;
}

function getMappedFolder(state, categoryKey) {
  if (!state || !state.categories || !CATEGORY_KEY_SET.has(categoryKey)) {
    return null;
  }

  return state.categories[categoryKey] || null;
}

function setMappedFolder(state, categoryKey, folderPath) {
  if (!state || !state.categories || !CATEGORY_KEY_SET.has(categoryKey)) {
    return { changed: false, folder: null };
  }

  const previous = state.categories[categoryKey] || null;
  const folder = typeof folderPath === "string" && folderPath.trim()
    ? path.resolve(folderPath.trim())
    : null;

  if (previous === folder) {
    return { changed: false, folder: previous };
  }

  state.categories[categoryKey] = folder;
  return { changed: true, folder, previous };
}

module.exports = {
  CATEGORY_MAPPINGS_VERSION,
  createEmptyCategoryMappings,
  normalizeCategoryMappings,
  loadCategoryMappings,
  saveCategoryMappings,
  getMappedFolder,
  setMappedFolder
};
