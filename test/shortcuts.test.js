"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  DEFAULT_SHORTCUTS,
  displayAccelerator,
  normalizeAccelerator,
  normalizeShortcutSettings,
  validateShortcutMap
} = require("../src/shortcuts");

test("快捷键会规范化为 Electron accelerator", () => {
  assert.equal(normalizeAccelerator("Ctrl+Alt+S"), "Control+Alt+S");
  assert.equal(normalizeAccelerator("alt + control + f"), "Control+Alt+F");
  assert.equal(normalizeAccelerator("Shift+Ctrl+F5"), "Control+Shift+F5");
  assert.equal(normalizeAccelerator("Win+Alt+D"), "Alt+Super+D");
  assert.equal(displayAccelerator("Control+Alt+S"), "Ctrl+Alt+S");
});

test("快捷键必须包含修饰键和有效主键", () => {
  assert.equal(normalizeAccelerator("S"), "");
  assert.equal(normalizeAccelerator("Ctrl+"), "");
  assert.equal(normalizeAccelerator("Ctrl+Alt+Unknown"), "");
  assert.equal(normalizeAccelerator("Ctrl+Escape"), "");
  assert.equal(normalizeAccelerator("Ctrl+Alt+S"), "Control+Alt+S");
});

test("缺失的快捷键设置会回退到默认值，重复组合会被拒绝", () => {
  const defaults = normalizeShortcutSettings(null);
  assert.deepEqual(defaults, DEFAULT_SHORTCUTS);
  assert.equal(defaults.privacy, "Control+Alt+V");
  assert.equal(defaults.dashboard, "Control+Alt+B");

  assert.deepEqual(
    validateShortcutMap({
      search: "Ctrl+Alt+S",
      focus: "Ctrl+Alt+F",
      privacy: "Ctrl+Alt+V",
      dashboard: "Ctrl+Alt+B"
    }).ok,
    true
  );

  assert.equal(
    validateShortcutMap({
      search: "Ctrl+Alt+S",
      focus: "Ctrl+Alt+S",
      privacy: "Ctrl+Alt+V",
      dashboard: "Ctrl+Alt+B"
    }).ok,
    false
  );

  assert.equal(
    validateShortcutMap({
      search: "Ctrl+Alt+S",
      focus: "Ctrl+Alt+F",
      privacy: "Ctrl+Alt+V",
      dashboard: "Ctrl+Alt+V"
    }).ok,
    false
  );
});
