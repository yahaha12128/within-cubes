"use strict";

// 系统虚拟图标没有物理路径，不写入 category-map；
// 它们固定出现在“应用图标或快捷方式”分类里，排序由 floating.json 的
// categories.apps.orderKeys 持久化。
const SYSTEM_ICON_PATH_PREFIX = "system-icon:";

const SYSTEM_ICON_DEFS = [
  {
    targetKey: "recycleBin",
    name: "回收站",
    glyph: "♻️",
    shellTarget: "shell:RecycleBinFolder"
  },
  {
    targetKey: "computer",
    name: "此电脑",
    glyph: "🖥️",
    shellTarget: "shell:MyComputerFolder"
  },
  {
    targetKey: "controlPanel",
    name: "控制面板",
    glyph: "⚙️",
    shellTarget: "shell:ControlPanelFolder"
  },
  {
    targetKey: "network",
    name: "网络",
    glyph: "🌐",
    shellTarget: "shell:NetworkPlacesFolder"
  }
];

const SYSTEM_TARGETS = Object.fromEntries(
  SYSTEM_ICON_DEFS.map((definition) => [
    definition.targetKey,
    definition.shellTarget
  ])
);

function getSystemIconPath(targetKey) {
  return `${SYSTEM_ICON_PATH_PREFIX}${targetKey}`;
}

function buildSystemIconItems() {
  return SYSTEM_ICON_DEFS.map((definition) => ({
    name: definition.name,
    path: getSystemIconPath(definition.targetKey),
    sourcePath: getSystemIconPath(definition.targetKey),
    extension: "",
    kind: "system",
    type: "system",
    iconMode: "virtual",
    icon: definition.glyph,
    isSystemIcon: true,
    // 首次合并到应用分类时排在已有应用图标前面，避免被长列表埋没；
    // 用户拖动后排序键会写入 orderKeys，之后完全按保存顺序显示。
    pinToStart: true,
    systemTargetKey: definition.targetKey,
    shellTarget: definition.shellTarget
  }));
}

function findSystemIconDefinitionByPath(filePath) {
  if (
    typeof filePath !== "string" ||
    !filePath.startsWith(SYSTEM_ICON_PATH_PREFIX)
  ) {
    return null;
  }

  const targetKey = filePath.slice(SYSTEM_ICON_PATH_PREFIX.length);
  return SYSTEM_ICON_DEFS.find((definition) => definition.targetKey === targetKey) || null;
}

function getSystemIconTarget(filePath) {
  const definition = findSystemIconDefinitionByPath(filePath);
  return definition ? definition.shellTarget : null;
}

module.exports = {
  SYSTEM_ICON_PATH_PREFIX,
  SYSTEM_ICON_DEFS,
  SYSTEM_TARGETS,
  getSystemIconPath,
  buildSystemIconItems,
  findSystemIconDefinitionByPath,
  getSystemIconTarget
};
