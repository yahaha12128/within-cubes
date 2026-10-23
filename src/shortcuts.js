"use strict";

const SHORTCUT_ACTIONS = [
  {
    id: "search",
    label: "呼出搜索",
    description: "在屏幕中央打开 Spotlight 全局搜索"
  },
  {
    id: "focus",
    label: "专注模式",
    description: "切换桌面专注遮罩，隐藏其他组件干扰"
  },
  {
    id: "privacy",
    label: "访客防窥",
    description: "一键模糊桌面所有文件名与图标，开启或关闭访客防窥模式"
  },
  {
    id: "dashboard",
    label: "打开仪表盘",
    description: "呼出方寸格主界面并回到仪表盘"
  }
];

const DEFAULT_SHORTCUTS = Object.freeze({
  search: "Control+Alt+S",
  focus: "Control+Alt+F",
  privacy: "Control+Alt+V",
  dashboard: "Control+Alt+B"
});

const MODIFIER_ORDER = ["Control", "Alt", "Shift", "Super"];
const MODIFIER_ALIASES = new Map([
  ["ctrl", "Control"],
  ["control", "Control"],
  ["alt", "Alt"],
  ["option", "Alt"],
  ["shift", "Shift"],
  ["super", "Super"],
  ["meta", "Super"],
  ["win", "Super"]
]);
const NAMED_KEYS = new Map([
  ["space", "Space"],
  ["tab", "Tab"],
  ["enter", "Enter"],
  ["return", "Enter"],
  ["backspace", "Backspace"],
  ["delete", "Delete"],
  ["insert", "Insert"],
  ["home", "Home"],
  ["end", "End"],
  ["pageup", "PageUp"],
  ["pagedown", "PageDown"],
  ["arrowup", "Up"],
  ["arrowdown", "Down"],
  ["arrowleft", "Left"],
  ["arrowright", "Right"],
  ["up", "Up"],
  ["down", "Down"],
  ["left", "Left"],
  ["right", "Right"]
]);

function normalizeKeyToken(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (/^f(?:[1-9]|1\d|2[0-4])$/i.test(raw)) {
    return raw.toUpperCase();
  }

  if (/^[a-z0-9]$/i.test(raw)) {
    return raw.toUpperCase();
  }

  return NAMED_KEYS.get(raw.toLowerCase()) || "";
}

function normalizeAccelerator(value) {
  if (typeof value !== "string" || !value.trim()) return "";

  const tokens = value
    .split("+")
    .map((token) => token.trim())
    .filter(Boolean);
  const modifiers = new Set();
  let key = "";

  for (const token of tokens) {
    const modifier = MODIFIER_ALIASES.get(token.toLowerCase());
    if (modifier) {
      modifiers.add(modifier);
      continue;
    }

    if (key) return "";
    key = normalizeKeyToken(token);
    if (!key) return "";
  }

  if (!key || modifiers.size === 0) return "";

  return [
    ...MODIFIER_ORDER.filter((modifier) => modifiers.has(modifier)),
    key
  ].join("+");
}

function displayAccelerator(value) {
  return normalizeAccelerator(value)
    .replace(/^Control\+/, "Ctrl+")
    .replace(/^Alt\+/, "Alt+")
    .replace(/^Shift\+/, "Shift+")
    .replace(/^Super\+/, "Win+");
}

function normalizeShortcutSettings(data) {
  const source = data && typeof data === "object" ? data : {};
  const shortcuts = {};

  for (const action of SHORTCUT_ACTIONS) {
    const normalized = normalizeAccelerator(source[action.id]);
    shortcuts[action.id] = normalized || DEFAULT_SHORTCUTS[action.id];
  }

  return shortcuts;
}

function validateShortcutMap(shortcuts) {
  const normalized = normalizeShortcutSettings(shortcuts);
  const owners = new Map();

  for (const action of SHORTCUT_ACTIONS) {
    const accelerator = normalized[action.id];
    if (owners.has(accelerator)) {
      return {
        ok: false,
        error: `快捷键 ${displayAccelerator(accelerator)} 被多个操作占用。`
      };
    }
    owners.set(accelerator, action.id);
  }

  return { ok: true, shortcuts: normalized };
}

function getShortcutActions(shortcuts, registration = {}) {
  const normalized = normalizeShortcutSettings(shortcuts);

  return SHORTCUT_ACTIONS.map((action) => ({
    ...action,
    accelerator: normalized[action.id],
    display: displayAccelerator(normalized[action.id]),
    registered: registration[action.id] !== false
  }));
}

module.exports = {
  SHORTCUT_ACTIONS,
  DEFAULT_SHORTCUTS,
  normalizeAccelerator,
  displayAccelerator,
  normalizeShortcutSettings,
  validateShortcutMap,
  getShortcutActions
};
