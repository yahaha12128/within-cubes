"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const icoPath = path.join(root, "build", "icon.ico");
const builderConfigPath = path.join(root, "electron-builder.yml");

test("build/icon.ico 是包含 16px 与 256px 图层的有效 ICO", () => {
  const ico = fs.readFileSync(icoPath);

  assert.equal(ico.readUInt16LE(0), 0); // reserved
  assert.equal(ico.readUInt16LE(2), 1); // 1 = icon

  const count = ico.readUInt16LE(4);
  assert.ok(count >= 5, `expected multiple sizes, got ${count}`);

  const sizes = [];

  for (let index = 0; index < count; index += 1) {
    const base = 6 + index * 16;
    const width = ico[base] === 0 ? 256 : ico[base];
    const height = ico[base + 1] === 0 ? 256 : ico[base + 1];
    const bytes = ico.readUInt32LE(base + 8);
    const offset = ico.readUInt32LE(base + 12);

    assert.equal(width, height);
    assert.ok(bytes > 0);
    assert.ok(offset + bytes <= ico.length);

    // PNG signature inside the ICO entry.
    assert.deepEqual(
      [...ico.subarray(offset, offset + 8)],
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    );

    sizes.push(width);
  }

  assert.ok(sizes.includes(16));
  assert.ok(sizes.includes(256));
});

test("electron-builder 为 exe、安装器和快捷方式指定同一图标", () => {
  const config = fs.readFileSync(builderConfigPath, "utf8");

  assert.match(config, /win:[\s\S]*?icon:\s*build\/icon\.ico/);
  assert.match(config, /installerIcon:\s*build\/icon\.ico/);
  assert.match(config, /uninstallerIcon:\s*build\/icon\.ico/);
  assert.match(config, /- from:\s*build\/icon\.ico\s*\n\s*to:\s*icon\.ico/);
});
