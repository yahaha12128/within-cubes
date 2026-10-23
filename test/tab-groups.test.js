"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  GROUP_MIN_WIDTH,
  GROUP_MIN_HEIGHT,
  GROUP_DEFAULT_WIDTH,
  GROUP_DEFAULT_HEIGHT,
  normalizeGroup,
  normalizeGroups,
  getGroupedCategoryKeys,
  findGroupForCategory,
  groupCategoryForFile,
  chooseGroupCategory
} = require("../src/tab-groups");
const { normalizeConfig, createDefaultConfig } = require("../src/floating-config");

test("标签组至少需要两个合法分类，非法键会被丢弃", () => {
  assert.equal(normalizeGroup({ id: "g1", keys: ["folders"] }), null);
  assert.equal(
    normalizeGroup({ id: "g1", keys: ["folders", "not-a-category"] }),
    null
  );
  assert.equal(normalizeGroup({ keys: ["folders", "documents"] }), null);

  const group = normalizeGroup({
    id: "group-1",
    keys: ["folders", "documents", "documents", "bogus"],
    width: 10,
    height: 99999,
    activeKey: "bogus",
    name: " 文件与文档 ",
    locked: 1,
    addedFiles: [{ path: "C:\\Desktop\\a.txt", kind: "file" }]
  });

  assert.equal(group.id, "group-1");
  assert.deepEqual(group.keys, ["folders", "documents"]);
  assert.equal(group.width, GROUP_MIN_WIDTH);
  assert.equal(group.height, 2000);
  assert.equal(group.activeKey, "folders");
  assert.equal(group.name, "文件与文档");
  assert.equal(group.locked, true);
  assert.equal(group.addedFiles[0].name, "a.txt");
});

test("标签组配置会补齐默认尺寸并去重", () => {
  assert.deepEqual(createDefaultConfig().groups, []);

  const groups = normalizeGroups([
    { id: "g1", keys: ["folders", "documents"] },
    { id: "g1", keys: ["media", "archives"] },
    { id: "g2", keys: ["documents", "media"] },
    { id: "g3", keys: ["media", "archives"] }
  ]);

  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].keys, ["folders", "documents"]);
  assert.deepEqual(groups[1].keys, ["media", "archives"]);
  assert.equal(groups[0].width, GROUP_DEFAULT_WIDTH);
  assert.equal(groups[0].height, GROUP_DEFAULT_HEIGHT);

  const normalized = normalizeConfig({
    groups: [
      {
        id: "group-a",
        keys: ["folders", "documents"],
        x: 12.6,
        y: "bad",
        width: 500,
        height: 400,
        activeKey: "documents"
      }
    ]
  });

  assert.equal(normalized.groups.length, 1);
  assert.equal(normalized.groups[0].x, 13);
  assert.equal(normalized.groups[0].y, null);
  assert.equal(normalized.groups[0].activeKey, "documents");
  assert.deepEqual(
    [...getGroupedCategoryKeys(normalized.groups)].sort(),
    ["documents", "folders"]
  );
  assert.equal(
    findGroupForCategory(normalized.groups, "documents").id,
    "group-a"
  );
  assert.equal(findGroupForCategory(normalized.groups, "media"), null);
});

test("标签组按文件类型归类，组内无匹配时退回当前标签", () => {
  assert.equal(groupCategoryForFile("photo.png"), "media");
  assert.equal(groupCategoryForFile("report.pdf"), "documents");
  assert.equal(groupCategoryForFile("main.js"), "documents");
  assert.equal(groupCategoryForFile("setup.exe"), "apps");
  assert.equal(groupCategoryForFile("assets.zip"), "archives");
  assert.equal(groupCategoryForFile("新建文件夹", "folder"), "folders");

  const keys = ["folders", "documents", "archives"];

  assert.equal(chooseGroupCategory(keys, "report.pdf", "file", "folders"), "documents");
  assert.equal(chooseGroupCategory(keys, "assets.zip", "file", "folders"), "archives");
  assert.equal(chooseGroupCategory(keys, "photo.png", "file", "folders"), "folders");
  assert.equal(chooseGroupCategory(keys, "photo.png", "file", "archives"), "archives");
  assert.equal(chooseGroupCategory([], "photo.png", "file", "folders"), null);
});

test("标签组尺寸的最小值保证标签栏和内容可操作", () => {
  assert.ok(GROUP_MIN_WIDTH >= 280);
  assert.ok(GROUP_MIN_HEIGHT >= 220);
  assert.ok(GROUP_DEFAULT_WIDTH >= GROUP_MIN_WIDTH);
  assert.ok(GROUP_DEFAULT_HEIGHT >= GROUP_MIN_HEIGHT);
});
