"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { CATEGORY_KEYS, classifyFileName } = require("./categories");
const {
  DEFAULT_ROWS,
  DEFAULT_COLS,
  MIN_ROWS,
  MAX_ROWS,
  MIN_COLS,
  MAX_COLS,
  MIN_WIDGET_WIDTH,
  MIN_WIDGET_HEIGHT,
  computeWidgetSizeFromGrid
} = require("./floating");
const {
  DEFAULT_SMART_THEME,
  normalizeSmartThemeSettings
} = require("./smart-theme");
const { normalizeGroups } = require("./tab-groups");

// Schema additions (tab groups) are backward compatible, so the version is
// kept at 9 to avoid re-running the widget-size migration for existing users.
const CONFIG_VERSION = 9;
const MAX_NAME_LENGTH = 40;
const DEFAULT_CUSTOM_TINT = "#2f6b4f";
const TINTS = new Set(["transparent", "white", "black", "system", "custom"]);
const UI_BACKGROUND_TYPES = new Set(["solid", "gradient", "image"]);
const DEFAULT_UI_BACKGROUND = {
  type: "solid",
  color: "#f2f4ef",
  gradientStart: "#edf4ee",
  gradientEnd: "#e4edf6",
  imagePath: null
};
const COLLAPSE_MODES = ["double-click", "hover"];
const DEFAULT_COLLAPSE_MODE = "double-click";
const SORT_MODES = ["name", "time", "size", "custom"];
const DEFAULT_SORT_MODE = "name";

const CLOCK_TIME_FORMATS = ["hh/mm/ss", "hh/mm", "hh"];
const CLOCK_DATE_FORMATS = ["yyyy/mm/dd", "yyyy-mm-dd", "mm/dd", "yyyy"];
const DEFAULT_CLOCK_TIME_FORMAT = "hh/mm/ss";
const DEFAULT_CLOCK_DATE_FORMAT = "yyyy/mm/dd";
const DEFAULT_CLOCK_TEXT = "祝你开心！";
const MAX_CLOCK_TEXT_LENGTH = 1000;

// Strict component grid.
//
// W = MIN_WIDGET_WIDTH and H = MIN_WIDGET_HEIGHT are the smallest usable
// component size — the pomodoro at its minimum 3x3 grid. Every component is
// exactly one cell (W x H). The clock spans two columns, so it measures
// 2W + Gap wide while staying H tall.
//
// Gap is the fixed gutter: it is baked into the clock's double width and is
// also the space used between grid cells when the rails are laid out.
const WIDGET_GRID_GAP = 16;
const WIDGET_CELL_WIDTH = MIN_WIDGET_WIDTH;
const WIDGET_CELL_HEIGHT = MIN_WIDGET_HEIGHT;

const WIDGET_DEFAULT_SIZE = Object.freeze({
  width: WIDGET_CELL_WIDTH,
  height: WIDGET_CELL_HEIGHT
});
const CLOCK_DEFAULT_SIZE = Object.freeze({
  width: WIDGET_CELL_WIDTH * 2 + WIDGET_GRID_GAP,
  height: WIDGET_CELL_HEIGHT
});

// Whole-cell equivalents, kept for callers that snap bounds to the grid.
const WIDGET_DEFAULT_COLS = 3;
const WIDGET_DEFAULT_ROWS = 3;
const CLOCK_DEFAULT_COLS = 6;
const CLOCK_DEFAULT_ROWS = 3;
const CLIPBOARD_DEFAULT_COLS = 3;
const CLIPBOARD_DEFAULT_ROWS = 3;

const WIDGET_DEFS = [
  {
    key: "clock",
    label: "时钟",
    defaultCols: CLOCK_DEFAULT_COLS,
    defaultRows: CLOCK_DEFAULT_ROWS,
    // Spans two grid columns: 2W + Gap wide, one row tall.
    gridSpan: 2,
    defaultWidth: CLOCK_DEFAULT_SIZE.width,
    defaultHeight: CLOCK_DEFAULT_SIZE.height
  },
  {
    key: "music",
    label: "音乐播放器",
    defaultCols: WIDGET_DEFAULT_COLS,
    defaultRows: WIDGET_DEFAULT_ROWS,
    defaultWidth: WIDGET_DEFAULT_SIZE.width,
    defaultHeight: WIDGET_DEFAULT_SIZE.height
  },
  {
    key: "notes",
    label: "随手记",
    defaultCols: WIDGET_DEFAULT_COLS,
    defaultRows: WIDGET_DEFAULT_ROWS,
    defaultWidth: WIDGET_DEFAULT_SIZE.width,
    defaultHeight: WIDGET_DEFAULT_SIZE.height
  },
  {
    key: "todo",
    label: "任务待办",
    defaultCols: WIDGET_DEFAULT_COLS,
    defaultRows: WIDGET_DEFAULT_ROWS,
    defaultWidth: WIDGET_DEFAULT_SIZE.width,
    defaultHeight: WIDGET_DEFAULT_SIZE.height
  },
  {
    key: "calendar",
    label: "日历",
    defaultCols: WIDGET_DEFAULT_COLS,
    defaultRows: WIDGET_DEFAULT_ROWS,
    defaultWidth: WIDGET_DEFAULT_SIZE.width,
    defaultHeight: WIDGET_DEFAULT_SIZE.height
  },
  {
    key: "pomodoro",
    label: "番茄钟",
    defaultCols: WIDGET_DEFAULT_COLS,
    defaultRows: WIDGET_DEFAULT_ROWS,
    defaultWidth: WIDGET_DEFAULT_SIZE.width,
    defaultHeight: WIDGET_DEFAULT_SIZE.height
  },
  {
    key: "quick",
    label: "快速收纳",
    defaultCols: WIDGET_DEFAULT_COLS,
    defaultRows: WIDGET_DEFAULT_ROWS,
    defaultWidth: WIDGET_DEFAULT_SIZE.width,
    defaultHeight: WIDGET_DEFAULT_SIZE.height
  },
  {
    key: "clipboard",
    label: "剪贴板历史",
    defaultCols: CLIPBOARD_DEFAULT_COLS,
    defaultRows: CLIPBOARD_DEFAULT_ROWS,
    defaultWidth: WIDGET_DEFAULT_SIZE.width,
    defaultHeight: WIDGET_DEFAULT_SIZE.height
  },
  {
    key: "search",
    label: "快速搜索",
    defaultCols: WIDGET_DEFAULT_COLS,
    defaultRows: WIDGET_DEFAULT_ROWS,
    defaultWidth: WIDGET_DEFAULT_SIZE.width,
    defaultHeight: WIDGET_DEFAULT_SIZE.height
  }
];

const WIDGET_BY_KEY = new Map(WIDGET_DEFS.map((widget) => [widget.key, widget]));

// Sizes written by config v8 and earlier. During upgrade only components still
// using an old default are resized; custom layouts keep their chosen size.
const LEGACY_WIDGET_DEFAULT_SIZES = {
  clock: { width: 340, height: 294 },
  music: { width: 380, height: 320 },
  notes: { width: 360, height: 300 },
  todo: { width: 380, height: 360 },
  calendar: { width: 380, height: 380 }
  // pomodoro is introduced in v9 and has no legacy size.
};


function normalizeHexColor(value, fallback) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed.toLowerCase() : fallback;
}

function normalizeUiBackground(value) {
  const source = value && typeof value === "object" ? value : {};
  const type = UI_BACKGROUND_TYPES.has(source.type)
    ? source.type
    : DEFAULT_UI_BACKGROUND.type;
  const imagePath = typeof source.imagePath === "string" &&
    source.imagePath.trim()
    ? source.imagePath.trim()
    : null;

  return {
    type: type === "image" && !imagePath ? "solid" : type,
    color: normalizeHexColor(source.color, DEFAULT_UI_BACKGROUND.color),
    gradientStart: normalizeHexColor(
      source.gradientStart,
      DEFAULT_UI_BACKGROUND.gradientStart
    ),
    gradientEnd: normalizeHexColor(
      source.gradientEnd,
      DEFAULT_UI_BACKGROUND.gradientEnd
    ),
    imagePath
  };
}

function normalizeGridValue(value, minimum, maximum, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    return fallback;
  }
  return parsed;
}

function normalizeCoordinate(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function normalizeName(value) {
  if (typeof value !== "string") return "";
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return Array.from(cleaned).slice(0, MAX_NAME_LENGTH).join("");
}

function normalizeBackgroundImage(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeCustomTint(value) {
  if (typeof value !== "string") return DEFAULT_CUSTOM_TINT;
  const trimmed = value.trim();
  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed.toLowerCase() : DEFAULT_CUSTOM_TINT;
}

function normalizeClockText(value) {
  if (typeof value !== "string") return DEFAULT_CLOCK_TEXT;
  const normalized = value.replace(/\r\n?/g, "\n");
  return Array.from(normalized).slice(0, MAX_CLOCK_TEXT_LENGTH).join("");
}

function createClockSettings() {
  return {
    timeFormat: DEFAULT_CLOCK_TIME_FORMAT,
    dateFormat: DEFAULT_CLOCK_DATE_FORMAT,
    customText: DEFAULT_CLOCK_TEXT
  };
}

function normalizeClockSettings(data) {
  const source = data && typeof data === "object" ? data : {};

  return {
    timeFormat: CLOCK_TIME_FORMATS.includes(source.timeFormat)
      ? source.timeFormat
      : DEFAULT_CLOCK_TIME_FORMAT,
    dateFormat: CLOCK_DATE_FORMATS.includes(source.dateFormat)
      ? source.dateFormat
      : DEFAULT_CLOCK_DATE_FORMAT,
    customText: normalizeClockText(source.customText)
  };
}

function createCategoryConfig() {
  return {
    removed: false,
    locked: false,
    rows: DEFAULT_ROWS,
    cols: DEFAULT_COLS,
    x: null,
    y: null,
    name: "",
    sortMode: DEFAULT_SORT_MODE,
    orderKeys: []
  };
}

function createWidgetConfig(key) {
  const definition = WIDGET_BY_KEY.get(key);
  const config = {
    enabled: false,
    locked: false,
    x: null,
    y: null,
    // Default grid size. Only the first run and "reset layout" may write this;
    // once the user drags a resize handle, sizeCustomized flips to true and the
    // stored width/height become authoritative for every later launch.
    width: definition ? definition.defaultWidth : MIN_WIDGET_WIDTH,
    height: definition ? definition.defaultHeight : MIN_WIDGET_HEIGHT,
    sizeCustomized: false,
    name: "",
    backgroundImage: null
  };

  if (key === "clock") {
    Object.assign(config, createClockSettings());
  }

  return config;
}

function createDefaultConfig() {
  return {
    version: CONFIG_VERSION,
    tint: "system",
    customTint: DEFAULT_CUSTOM_TINT,
    frosted: true,
    collapseMode: DEFAULT_COLLAPSE_MODE,
    smartTheme: { ...DEFAULT_SMART_THEME },
    uiBackground: { ...DEFAULT_UI_BACKGROUND },
    followWallpaperBrightness: false,
    performanceMode: false,
    depth3d: true,
    depth3dDefaultOn: true,
    musicVisualizer: true,
    autoLayoutVersion: 0,
    widgetRailVersion: 0,
    groups: [],
    categories: Object.fromEntries(
      CATEGORY_KEYS.map((key) => [key, createCategoryConfig()])
    ),
    widgets: Object.fromEntries(
      WIDGET_DEFS.map((widget) => [widget.key, createWidgetConfig(widget.key)])
    )
  };
}

/**
 * 3D 景深「默认开启」。
 * - 全新配置 / 缺字段 → 直接 true。
 * - 带 depth3dDefaultOn 标记的旧配置，说明用户的选择已经被记录过，尊重其选择。
 * - 没带标记的旧配置（默认值翻转之前写的）→ 强制 true，把默认值钉死在开启。
 * 保存时永远写回 depth3dDefaultOn: true，保证「用户显式关掉」之后不会被反复重置。
 */
function resolveDepth3d(data) {
  if (data && typeof data === "object" && data.depth3dDefaultOn === true) {
    return data.depth3d !== false;
  }

  return true;
}

function normalizeWidgetConfig(data, key, { migrateDefaultSize = false } = {}) {
  const fallback = createWidgetConfig(key);
  const source = data && typeof data === "object" ? data : {};
  let width = toFiniteNumber(source.width, fallback.width);
  let height = toFiniteNumber(source.height, fallback.height);
  const legacySize = LEGACY_WIDGET_DEFAULT_SIZES[key];
  const hasExplicitSize =
    Number.isFinite(Number(source.width)) &&
    Number.isFinite(Number(source.height));
  const usesLegacyDefault = Boolean(
    legacySize &&
    Math.round(width) === legacySize.width &&
    Math.round(height) === legacySize.height
  );

  // A size the user dragged is owned by the user. `sizeCustomized` records that
  // explicitly so a later schema migration can never restore the default formula
  // over it. Older configs predate the flag, so infer it from the stored values:
  // anything that is neither the current default nor a known legacy default must
  // have been resized by hand.
  const sizeCustomized = source.sizeCustomized === undefined
    ? hasExplicitSize &&
      !usesLegacyDefault &&
      (Math.round(width) !== fallback.width ||
        Math.round(height) !== fallback.height)
    : Boolean(source.sizeCustomized);

  if (
    migrateDefaultSize &&
    !sizeCustomized &&
    (!hasExplicitSize || usesLegacyDefault)
  ) {
    width = fallback.width;
    height = fallback.height;
  }

  const normalized = {
    enabled: source.enabled === undefined
      ? fallback.enabled
      : Boolean(source.enabled),
    locked: Boolean(source.locked),
    x: normalizeCoordinate(source.x),
    y: normalizeCoordinate(source.y),
    width: Math.round(Math.max(MIN_WIDGET_WIDTH, Math.min(2000, width))),
    height: Math.round(Math.max(MIN_WIDGET_HEIGHT, Math.min(2000, height))),
    sizeCustomized,
    name: normalizeName(source.name),
    backgroundImage: normalizeBackgroundImage(source.backgroundImage)
  };

  if (key === "clock") {
    Object.assign(normalized, normalizeClockSettings(source));
  }

  return normalized;
}

function toFiniteNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeCategoryConfig(data) {
  const fallback = createCategoryConfig();
  const source = data && typeof data === "object" ? data : {};

  return {
    removed: Boolean(source.removed),
    locked: Boolean(source.locked),
    rows: normalizeGridValue(source.rows, MIN_ROWS, MAX_ROWS, DEFAULT_ROWS),
    cols: normalizeGridValue(source.cols, MIN_COLS, MAX_COLS, DEFAULT_COLS),
    x: normalizeCoordinate(source.x),
    y: normalizeCoordinate(source.y),
    name: normalizeName(source.name),
    sortMode: SORT_MODES.includes(source.sortMode)
      ? source.sortMode
      : DEFAULT_SORT_MODE,
    orderKeys: Array.isArray(source.orderKeys)
      ? source.orderKeys.filter((key) => typeof key === "string")
      : []
  };
}

function normalizeConfig(data) {
  const fallback = createDefaultConfig();

  if (!data || typeof data !== "object") {
    return fallback;
  }

  const hasCategories =
    data.categories &&
    typeof data.categories === "object" &&
    Object.keys(data.categories).length > 0;
  const sourceVersion = Number.isFinite(Number(data.version))
    ? Number(data.version)
    : 0;
  const migrateDefaultSizes = sourceVersion < CONFIG_VERSION;
  const categories = {};

  for (const key of CATEGORY_KEYS) {
    categories[key] = normalizeCategoryConfig(
      data.categories && data.categories[key]
    );
  }

  // 旧版只有一个悬浮窗，orderKeys 在根级；按文件名分派到新的分类配置。
  if (!hasCategories && Array.isArray(data.orderKeys)) {
    const seen = new Set();

    for (const orderKey of data.orderKeys) {
      if (typeof orderKey !== "string" || seen.has(orderKey)) continue;

      const name = orderKey.split("\u0000")[0];
      const classification = classifyFileName(name);

      if (classification.category && categories[classification.category]) {
        categories[classification.category].orderKeys.push(orderKey);
        seen.add(orderKey);
      }
    }
  }

  return {
    version: CONFIG_VERSION,
    tint: TINTS.has(data.tint) ? data.tint : "system",
    customTint: normalizeCustomTint(data.customTint),
    frosted: data.frosted === undefined ? true : Boolean(data.frosted),
    collapseMode: COLLAPSE_MODES.includes(data.collapseMode)
      ? data.collapseMode
      : DEFAULT_COLLAPSE_MODE,
    smartTheme: normalizeSmartThemeSettings(data.smartTheme),
    uiBackground: normalizeUiBackground(data.uiBackground),
    followWallpaperBrightness: Boolean(data.followWallpaperBrightness),
    performanceMode: Boolean(data.performanceMode),
    depth3d: resolveDepth3d(data),
    depth3dDefaultOn: true,
    musicVisualizer: data.musicVisualizer === undefined
      ? true
      : Boolean(data.musicVisualizer),
    autoLayoutVersion: Number.isInteger(Number(data.autoLayoutVersion))
      ? Math.max(0, Number(data.autoLayoutVersion))
      : 0,
    widgetRailVersion: Number.isInteger(Number(data.widgetRailVersion))
      ? Math.max(0, Number(data.widgetRailVersion))
      : 0,
    groups: normalizeGroups(data.groups),
    categories,
    widgets: Object.fromEntries(
      WIDGET_DEFS.map((widget) => [
        widget.key,
        normalizeWidgetConfig(
          data.widgets && data.widgets[widget.key],
          widget.key,
          { migrateDefaultSize: migrateDefaultSizes }
        )
      ])
    )
  };
}

async function loadFloatingConfig(configPath) {
  try {
    const raw = await fs.readFile(configPath, "utf8");
    return normalizeConfig(JSON.parse(raw));
  } catch (error) {
    return createDefaultConfig();
  }
}

async function saveFloatingConfig(configPath, config) {
  const normalized = normalizeConfig(config);
  const directory = path.dirname(configPath);
  const temporaryPath = `${configPath}.tmp`;

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(temporaryPath, JSON.stringify(normalized, null, 2), "utf8");
  await fs.rename(temporaryPath, configPath);

  return normalized;
}

module.exports = {
  CONFIG_VERSION,
  MAX_NAME_LENGTH,
  DEFAULT_CUSTOM_TINT,
  DEFAULT_UI_BACKGROUND,
  UI_BACKGROUND_TYPES,
  normalizeUiBackground,
  CLOCK_TIME_FORMATS,
  CLOCK_DATE_FORMATS,
  DEFAULT_CLOCK_TIME_FORMAT,
  DEFAULT_CLOCK_DATE_FORMAT,
  DEFAULT_CLOCK_TEXT,
  MAX_CLOCK_TEXT_LENGTH,
  TINTS,
  COLLAPSE_MODES,
  DEFAULT_COLLAPSE_MODE,
  SORT_MODES,
  DEFAULT_SORT_MODE,
  CLOCK_DEFAULT_COLS,
  CLOCK_DEFAULT_ROWS,
  WIDGET_DEFAULT_COLS,
  WIDGET_DEFAULT_ROWS,
  WIDGET_GRID_GAP,
  WIDGET_CELL_WIDTH,
  WIDGET_CELL_HEIGHT,
  WIDGET_DEFS,
  createDefaultConfig,
  createCategoryConfig,
  createWidgetConfig,
  createClockSettings,
  normalizeClockText,
  normalizeClockSettings,
  normalizeName,
  normalizeBackgroundImage,
  normalizeCustomTint,
  normalizeConfig,
  loadFloatingConfig,
  saveFloatingConfig
};
