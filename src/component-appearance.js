"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { CATEGORY_KEYS } = require("./categories");
const { WIDGET_DEFS } = require("./floating-config");

const COMPONENT_APPEARANCE_VERSION = 1;
const ACCENT_COLORS = [
  "#2f6b4f",
  "#3f6f8e",
  "#6a5b86",
  "#8a4f38",
  "#9a7437",
  "#a33a32",
  "#d97706",
  "#0f766e"
];
const ACCENT_SET = new Set(ACCENT_COLORS);
const CATEGORY_SET = new Set(CATEGORY_KEYS);
const WIDGET_SET = new Set(WIDGET_DEFS.map((widget) => widget.key));

function isValidTarget(kind, key) {
  if (kind === "category") return CATEGORY_SET.has(key);
  if (kind === "widget") return WIDGET_SET.has(key);
  return false;
}

function storeKey(kind, key) {
  return `${kind}:${key}`;
}

function normalizeAccentColor(value) {
  if (typeof value !== "string") return "";
  const color = value.trim().toLowerCase();
  return ACCENT_SET.has(color) ? color : "";
}

function createEmptyComponentAppearance() {
  return {
    version: COMPONENT_APPEARANCE_VERSION,
    accents: {}
  };
}

function normalizeComponentAppearance(data) {
  const state = createEmptyComponentAppearance();
  const source = data && typeof data === "object" ? data : {};
  const accents = source.accents && typeof source.accents === "object"
    ? source.accents
    : {};

  for (const [rawKey, rawColor] of Object.entries(accents)) {
    const [kind, key] = rawKey.split(":");
    if (!isValidTarget(kind, key)) continue;

    const color = normalizeAccentColor(rawColor);
    if (!color) continue;

    state.accents[storeKey(kind, key)] = color;
  }

  return state;
}

async function loadComponentAppearance(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return normalizeComponentAppearance(JSON.parse(raw));
  } catch (error) {
    return createEmptyComponentAppearance();
  }
}

async function saveComponentAppearance(filePath, data) {
  const normalized = normalizeComponentAppearance(data);
  const directory = path.dirname(filePath);
  const temporaryPath = `${filePath}.tmp`;

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(temporaryPath, JSON.stringify(normalized, null, 2), "utf8");
  await fs.rename(temporaryPath, filePath);

  return normalized;
}

function getComponentAccent(state, kind, key) {
  if (!state || !state.accents || !isValidTarget(kind, key)) return "";
  return state.accents[storeKey(kind, key)] || "";
}

function setComponentAccent(state, kind, key, color) {
  if (!state || !state.accents || !isValidTarget(kind, key)) {
    return { changed: false, color: "" };
  }

  const id = storeKey(kind, key);
  const previous = state.accents[id] || "";
  const next = normalizeAccentColor(color);

  if (!next) {
    if (!previous) return { changed: false, color: "" };
    delete state.accents[id];
    return { changed: true, color: "", previous };
  }

  if (previous === next) return { changed: false, color: next };

  state.accents[id] = next;
  return { changed: true, color: next, previous };
}

module.exports = {
  COMPONENT_APPEARANCE_VERSION,
  ACCENT_COLORS,
  normalizeAccentColor,
  createEmptyComponentAppearance,
  normalizeComponentAppearance,
  loadComponentAppearance,
  saveComponentAppearance,
  getComponentAccent,
  setComponentAccent
};
