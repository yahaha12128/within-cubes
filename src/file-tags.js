"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const FILE_TAGS_VERSION = 1;
const FILE_COLOR_TAGS = ["red", "yellow", "blue", "green", "purple", "orange"];
const FILE_COLOR_SET = new Set(FILE_COLOR_TAGS);

function normalizePathKey(value) {
  const resolved = path.resolve(String(value));
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function normalizeFileColorTag(value) {
  const tag = typeof value === "string" ? value.trim().toLowerCase() : "";
  return FILE_COLOR_SET.has(tag) ? tag : "";
}

function createEmptyFileTags() {
  return {
    version: FILE_TAGS_VERSION,
    tags: {}
  };
}

function normalizeFileTags(data) {
  const state = createEmptyFileTags();
  const source = data && typeof data === "object" ? data : {};
  const tags = source.tags && typeof source.tags === "object" ? source.tags : {};

  for (const [rawPath, rawTag] of Object.entries(tags)) {
    if (typeof rawPath !== "string" || !rawPath.trim()) continue;
    const tag = normalizeFileColorTag(rawTag);
    if (!tag) continue;
    state.tags[normalizePathKey(rawPath)] = tag;
  }

  return state;
}

async function loadFileTags(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return normalizeFileTags(JSON.parse(raw));
  } catch (error) {
    return createEmptyFileTags();
  }
}

async function saveFileTags(filePath, data) {
  const normalized = normalizeFileTags(data);
  const directory = path.dirname(filePath);
  const temporaryPath = `${filePath}.tmp`;

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(temporaryPath, JSON.stringify(normalized, null, 2), "utf8");
  await fs.rename(temporaryPath, filePath);

  return normalized;
}

function getFileTag(state, filePath) {
  if (!state || !state.tags || typeof filePath !== "string") return "";
  return state.tags[normalizePathKey(filePath)] || "";
}

function setFileTag(state, filePath, color) {
  if (!state || !state.tags || typeof filePath !== "string" || !filePath.trim()) {
    return { changed: false, tag: "" };
  }

  const key = normalizePathKey(filePath);
  const tag = normalizeFileColorTag(color);
  const previous = state.tags[key] || "";

  if (!tag) {
    if (!previous) return { changed: false, tag: "" };
    delete state.tags[key];
    return { changed: true, tag: "", previous };
  }

  if (previous === tag) return { changed: false, tag };

  state.tags[key] = tag;
  return { changed: true, tag, previous };
}

module.exports = {
  FILE_TAGS_VERSION,
  FILE_COLOR_TAGS,
  normalizeFileColorTag,
  createEmptyFileTags,
  normalizeFileTags,
  loadFileTags,
  saveFileTags,
  getFileTag,
  setFileTag
};
