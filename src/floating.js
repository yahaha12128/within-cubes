"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const {
  CATEGORY_DEFS,
  getCategoryDef
} = require("./categories");
const { getFileType, usesSystemIcon } = require("./file-types");
const {
  getAssignment,
  listAssignments,
  normalizePathKey
} = require("./category-map");
const { buildSystemIconItems } = require("./system-icons");

const CELL_WIDTH = 88;
const CELL_HEIGHT = 96;
const GRID_GAP = 8;
const GRID_PADDING = 10;
const DRAGBAR_HEIGHT = 40;
const TOOLBAR_HEIGHT = 34;

const DEFAULT_ROWS = 2;
const DEFAULT_COLS = 3;
const MIN_ROWS = 1;
const MAX_ROWS = 8;
const MIN_COLS = 1;
const MAX_COLS = 8;

// 1×1 时窗口只有 108px 宽，标题和三个操作按钮会被裁掉；
// 这里给一个最小像素兜底，同时仍能通过拖拽换算回 1 列。
const MIN_CATEGORY_WINDOW_WIDTH = 150;
const MIN_CATEGORY_WINDOW_HEIGHT = 200;

// 小组件最小尺寸 = 默认 3 列 × 2 行的像素尺寸。
const MIN_WIDGET_WIDTH =
  DEFAULT_COLS * CELL_WIDTH + (DEFAULT_COLS - 1) * GRID_GAP + GRID_PADDING * 2;
const MIN_WIDGET_HEIGHT =
  DRAGBAR_HEIGHT +
  TOOLBAR_HEIGHT +
  DEFAULT_ROWS * CELL_HEIGHT +
  (DEFAULT_ROWS - 1) * GRID_GAP +
  GRID_PADDING * 2;

const LEGACY_DIR_NAME = "桌面整理";
const IGNORED_NAMES = new Set(["desktop.ini", "thumbs.db"]);

function isIgnoredName(name) {
  const value = String(name || "");
  const lower = value.toLowerCase();

  return value.startsWith(".") ||
    value.startsWith("~$") ||
    IGNORED_NAMES.has(lower);
}

function computeContentSize(rows, cols) {
  const width = cols * CELL_WIDTH + (cols - 1) * GRID_GAP + GRID_PADDING * 2;
  const gridHeight = rows * CELL_HEIGHT + (rows - 1) * GRID_GAP + GRID_PADDING * 2;
  const height = DRAGBAR_HEIGHT + TOOLBAR_HEIGHT + gridHeight;

  return { width, height, gridHeight };
}

// Components use the same cell grid as category cards, but without category
// chrome (drag bar + toolbar). This keeps their initial sizes comparable.
function computeWidgetSizeFromGrid(cols, rows) {
  const safeCols = Math.max(1, Math.round(Number(cols) || 1));
  const safeRows = Math.max(1, Math.round(Number(rows) || 1));

  return {
    width:
      safeCols * CELL_WIDTH +
      (safeCols - 1) * GRID_GAP +
      GRID_PADDING * 2,
    height:
      safeRows * CELL_HEIGHT +
      (safeRows - 1) * GRID_GAP +
      GRID_PADDING * 2
  };
}

// Widget window size for a given grid: the grid itself plus the drag bar and
// toolbar chrome that every widget renders above its body.
function computeWidgetWindowSizeFromGrid(cols, rows) {
  const grid = computeWidgetSizeFromGrid(cols, rows);

  return {
    width: grid.width,
    height: grid.height + DRAGBAR_HEIGHT + TOOLBAR_HEIGHT
  };
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function computeCategoryWindowSize(rows, cols) {
  const size = computeContentSize(rows, cols);

  return {
    width: Math.max(MIN_CATEGORY_WINDOW_WIDTH, size.width),
    height: Math.max(MIN_CATEGORY_WINDOW_HEIGHT, size.height),
    gridHeight: size.gridHeight
  };
}

function getGridSizeFromWindow(width, height) {
  const numericWidth = Number(width);
  const numericHeight = Number(height);
  const cols = Number.isFinite(numericWidth)
    ? clamp(Math.round((numericWidth - 12) / 96), MIN_COLS, MAX_COLS)
    : DEFAULT_COLS;
  const rows = Number.isFinite(numericHeight)
    ? clamp(Math.round((numericHeight - 86) / 104), MIN_ROWS, MAX_ROWS)
    : DEFAULT_ROWS;

  return { rows, cols };
}

function fileKey(name, sourcePath) {
  return `${name}\u0000${sourcePath}`;
}

async function scanDesktopEntries(desktopPath) {
  const root = path.resolve(desktopPath);
  const entries = await fs.readdir(root, { withFileTypes: true });
  const items = [];

  for (const entry of entries) {
    if (entry.name === LEGACY_DIR_NAME) continue;
    if (isIgnoredName(entry.name)) continue;

    const fullPath = path.join(root, entry.name);
    let stats = null;

    try {
      stats = await fs.stat(fullPath);
    } catch (error) {
      // Metadata is optional; sorting falls back to name when unavailable.
    }

    if (entry.isDirectory()) {
      items.push({
        name: entry.name,
        path: fullPath,
        extension: "",
        kind: "folder",
        mtimeMs: stats ? stats.mtimeMs : 0,
        atimeMs: stats ? stats.atimeMs : 0,
        size: 0
      });
      continue;
    }

    if (!entry.isFile()) continue;

    items.push({
      name: entry.name,
      path: fullPath,
      extension: path.extname(entry.name).toLowerCase(),
      kind: "file",
      mtimeMs: stats ? stats.mtimeMs : 0,
      atimeMs: stats ? stats.atimeMs : 0,
      size: stats ? stats.size : 0
    });
  }

  return { desktopPath: root, items };
}

async function scanFolderEntries(folderPath) {
  const root = path.resolve(folderPath);
  const entries = await fs.readdir(root, { withFileTypes: true });
  const items = [];

  for (const entry of entries) {
    if (isIgnoredName(entry.name)) continue;

    const fullPath = path.join(root, entry.name);
    let stats = null;

    try {
      stats = await fs.stat(fullPath);
    } catch (error) {
      // Metadata is optional; sorting falls back to name when unavailable.
    }

    if (entry.isDirectory()) {
      items.push({
        name: entry.name,
        path: fullPath,
        extension: "",
        kind: "folder",
        mtimeMs: stats ? stats.mtimeMs : 0,
        atimeMs: stats ? stats.atimeMs : 0,
        size: 0
      });
      continue;
    }

    if (!entry.isFile()) continue;

    items.push({
      name: entry.name,
      path: fullPath,
      extension: path.extname(entry.name).toLowerCase(),
      kind: "file",
      mtimeMs: stats ? stats.mtimeMs : 0,
      atimeMs: stats ? stats.atimeMs : 0,
      size: stats ? stats.size : 0
    });
  }

  return { folderPath: root, items };
}

async function scanFloatingCategories(desktopPath, { categoryMap } = {}) {
  const result = new Map(CATEGORY_DEFS.map((category) => [category.key, []]));
  const systemIcons = buildSystemIconItems();
  const stale = [];
  const unassignedItems = [];
  let scan;

  try {
    scan = await scanDesktopEntries(desktopPath);
  } catch (error) {
    // 桌面读取失败时仍保留系统图标入口。
    return {
      itemsByCategory: result,
      unassignedItems,
      stale,
      desktopPath: path.resolve(desktopPath)
    };
  }

  const present = new Set();

  for (const item of scan.items) {
    present.add(normalizePathKey(item.path));

    const assignment = categoryMap
      ? getAssignment(categoryMap, item.path)
      : null;
    const file = {
      name: item.name,
      path: item.path,
      sourcePath: item.path,
      extension: item.extension,
      kind: item.kind,
      type: item.kind === "folder" ? "folder" : getFileType(item.name),
      iconMode: item.kind === "folder"
        ? "type"
        : usesSystemIcon(item.name)
          ? "system"
          : "type",
      mtimeMs: Number(item.mtimeMs) || 0,
      atimeMs: Number(item.atimeMs) || 0,
      size: Number(item.size) || 0
    };

    if (!assignment || !getCategoryDef(assignment.category)) {
      unassignedItems.push(file);
      continue;
    }

    result.get(assignment.category).push(file);
  }

  // 系统虚拟图标与普通应用图标共用同一个分类网格，
  // 但不出现在 category-map 里，因此不会参与 stale 清理。
  result.get("apps").push(...systemIcons);

  for (const assignment of listAssignments(categoryMap)) {
    if (!present.has(normalizePathKey(assignment.path))) {
      stale.push(assignment);
    }
  }

  return {
    itemsByCategory: result,
    unassignedItems,
    stale,
    desktopPath: scan.desktopPath
  };
}

function sortDecoratedFiles(files, mode, collator) {
  const list = files.slice();

  if (mode === "time") {
    list.sort((left, right) => {
      const timeDiff = (Number(right.mtimeMs) || 0) - (Number(left.mtimeMs) || 0);
      return timeDiff !== 0 ? timeDiff : collator.compare(left.name, right.name);
    });
  } else if (mode === "size") {
    list.sort((left, right) => {
      const sizeDiff = (Number(right.size) || 0) - (Number(left.size) || 0);
      return sizeDiff !== 0 ? sizeDiff : collator.compare(left.name, right.name);
    });
  } else {
    list.sort((left, right) => collator.compare(left.name, right.name));
  }

  return list;
}

function buildFloatingState({ files, orderKeys, sortMode = "custom" }) {
  const collator = new Intl.Collator("zh-CN", { numeric: true, sensitivity: "base" });

  const decorated = files.map((file) => {
    const sourcePath = file.sourcePath || file.path;

    return {
      ...file,
      sourcePath,
      key: fileKey(file.name, sourcePath)
    };
  });

  const byKey = new Map(decorated.map((file) => [file.key, file]));
  const savedKeys = Array.isArray(orderKeys) ? orderKeys : [];
  const savedSet = new Set(savedKeys);
  const seen = new Set();
  const orderedKeys = [];
  const mode = ["name", "time", "size", "custom"].includes(sortMode)
    ? sortMode
    : "custom";

  // Automatic modes always re-evaluate against current file metadata. Manual
  // drags switch the category to "custom" and are preserved below.
  if (mode !== "custom") {
    const sorted = sortDecoratedFiles(decorated, mode, collator);
    return {
      files: sorted,
      orderKeys: sorted.map((file) => file.key),
      total: sorted.length
    };
  }

  // 系统图标首次出现时置顶；一旦用户拖动过，其 key 已写入 orderKeys，
  // 后续刷新就完全按保存顺序排列。
  for (const file of decorated) {
    if (file.pinToStart && !savedSet.has(file.key) && !seen.has(file.key)) {
      seen.add(file.key);
      orderedKeys.push(file.key);
    }
  }

  for (const key of savedKeys) {
    if (byKey.has(key) && !seen.has(key)) {
      seen.add(key);
      orderedKeys.push(key);
    }
  }

  const newFiles = decorated
    .filter((file) => !seen.has(file.key))
    .sort((left, right) => collator.compare(left.name, right.name));

  for (const file of newFiles) {
    if (seen.has(file.key)) continue;
    seen.add(file.key);
    orderedKeys.push(file.key);
  }

  return {
    files: orderedKeys.map((key) => byKey.get(key)).filter(Boolean),
    orderKeys: orderedKeys,
    total: orderedKeys.length
  };
}

module.exports = {
  CELL_WIDTH,
  CELL_HEIGHT,
  GRID_GAP,
  GRID_PADDING,
  DRAGBAR_HEIGHT,
  TOOLBAR_HEIGHT,
  DEFAULT_ROWS,
  DEFAULT_COLS,
  MIN_ROWS,
  MAX_ROWS,
  MIN_COLS,
  MAX_COLS,
  MIN_CATEGORY_WINDOW_WIDTH,
  MIN_CATEGORY_WINDOW_HEIGHT,
  MIN_WIDGET_WIDTH,
  MIN_WIDGET_HEIGHT,
  LEGACY_DIR_NAME,
  isIgnoredName,
  computeContentSize,
  computeCategoryWindowSize,
  computeWidgetSizeFromGrid,
  computeWidgetWindowSizeFromGrid,
  getGridSizeFromWindow,
  fileKey,
  scanDesktopEntries,
  scanFolderEntries,
  scanFloatingCategories,
  buildFloatingState,
  sortDecoratedFiles
};
