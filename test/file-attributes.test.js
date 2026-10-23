"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const {
  hideItem,
  isHidden,
  restoreItem
} = require("../src/file-attributes");

const windowsOnly = { skip: process.platform !== "win32" };

async function makeTempDir(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "within-cubes-attrs-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

test("隐藏和恢复普通文件", windowsOnly, async (t) => {
  const directory = await makeTempDir(t);
  const filePath = path.join(directory, "中文 report.txt");
  await fs.writeFile(filePath, "content");

  assert.equal(await isHidden(filePath), false);

  const hidden = await hideItem(filePath);
  assert.equal(hidden.ok, true);
  assert.equal(hidden.changed, true);
  assert.equal(hidden.hiddenBefore, false);
  assert.equal(await isHidden(filePath), true);

  const restored = await restoreItem(filePath, false);
  assert.equal(restored.ok, true);
  assert.equal(restored.changed, true);
  assert.equal(await isHidden(filePath), false);
});

test("已经隐藏的文件再次隐藏会返回 hiddenBefore", windowsOnly, async (t) => {
  const directory = await makeTempDir(t);
  const filePath = path.join(directory, "hidden.txt");
  await fs.writeFile(filePath, "content");

  await hideItem(filePath);

  const again = await hideItem(filePath);
  assert.equal(again.ok, true);
  assert.equal(again.changed, false);
  assert.equal(again.hiddenBefore, true);

  const restored = await restoreItem(filePath, true);
  assert.equal(restored.ok, true);
  assert.equal(restored.changed, false);
  assert.equal(await isHidden(filePath), true);

  await restoreItem(filePath, false);
});

test("隐藏和恢复文件夹", windowsOnly, async (t) => {
  const directory = await makeTempDir(t);
  const folderPath = path.join(directory, "子文件夹");
  await fs.mkdir(folderPath);

  await hideItem(folderPath);
  assert.equal(await isHidden(folderPath), true);

  await restoreItem(folderPath, false);
  assert.equal(await isHidden(folderPath), false);
});

test("不存在的路径返回明确错误", windowsOnly, async (t) => {
  const directory = await makeTempDir(t);
  const result = await hideItem(path.join(directory, "missing.txt"));

  assert.equal(result.ok, false);
  assert.equal(result.error, "文件或文件夹不存在");
});
