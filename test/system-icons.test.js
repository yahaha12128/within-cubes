"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  SYSTEM_ICON_PATH_PREFIX,
  SYSTEM_ICON_DEFS,
  SYSTEM_TARGETS,
  getSystemIconPath,
  buildSystemIconItems,
  findSystemIconDefinitionByPath,
  getSystemIconTarget
} = require("../src/system-icons");

test("系统图标固定为回收站、此电脑、控制面板和网络", () => {
  assert.deepEqual(
    SYSTEM_ICON_DEFS.map((definition) => definition.name),
    ["回收站", "此电脑", "控制面板", "网络"]
  );
  assert.deepEqual(
    SYSTEM_ICON_DEFS.map((definition) => definition.targetKey),
    ["recycleBin", "computer", "controlPanel", "network"]
  );
  assert.equal(SYSTEM_TARGETS.recycleBin, "shell:RecycleBinFolder");
  assert.equal(SYSTEM_TARGETS.computer, "shell:MyComputerFolder");
  assert.equal(SYSTEM_TARGETS.controlPanel, "shell:ControlPanelFolder");
  assert.equal(SYSTEM_TARGETS.network, "shell:NetworkPlacesFolder");
});

test("虚拟条目带有 isSystemIcon 标记且没有物理路径", () => {
  const items = buildSystemIconItems();

  assert.equal(items.length, 4);

  for (const item of items) {
    assert.equal(item.isSystemIcon, true);
    assert.equal(item.kind, "system");
    assert.equal(item.type, "system");
    assert.equal(item.iconMode, "virtual");
    assert.equal(item.pinToStart, true);
    assert.match(item.path, new RegExp(`^${SYSTEM_ICON_PATH_PREFIX}`));
    assert.equal(item.path, item.sourcePath);
    assert.equal(item.shellTarget, SYSTEM_TARGETS[item.systemTargetKey]);
  }

  assert.equal(getSystemIconPath("recycleBin"), "system-icon:recycleBin");
  assert.equal(new Set(items.map((item) => item.path)).size, items.length);
});

test("只识别系统虚拟路径，物理路径返回 null", () => {
  const definition = findSystemIconDefinitionByPath("system-icon:recycleBin");

  assert.equal(definition.targetKey, "recycleBin");
  assert.equal(getSystemIconTarget("system-icon:network"), "shell:NetworkPlacesFolder");
  assert.equal(getSystemIconTarget("system-icon:missing"), null);
  assert.equal(getSystemIconTarget("C:\\Users\\Public\\Desktop\\report.pdf"), null);
  assert.equal(getSystemIconTarget(null), null);
});
