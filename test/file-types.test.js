"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getFileType,
  usesSystemIcon,
  getTypeRank,
  TYPE_ORDER
} = require("../src/file-types");

test("按扩展名映射文件类型", () => {
  assert.equal(getFileType("photo.PNG"), "image");
  assert.equal(getFileType("report.pdf"), "document");
  assert.equal(getFileType("backup.7z"), "archive");
  assert.equal(getFileType("setup.exe"), "installer");
  assert.equal(getFileType("song.mp3"), "audio");
  assert.equal(getFileType("movie.mp4"), "video");
  assert.equal(getFileType("app.js"), "code");
  assert.equal(getFileType("shortcut.lnk"), "shortcut");
  assert.equal(getFileType("unknown.xyz"), "other");
  assert.equal(getFileType("no-extension"), "other");
});

test("快捷方式、可执行文件和图片使用系统图标", () => {
  assert.equal(usesSystemIcon("photo.webp"), true);
  assert.equal(usesSystemIcon("tool.exe"), true);
  assert.equal(usesSystemIcon("link.lnk"), true);
  assert.equal(usesSystemIcon("site.url"), true);
  assert.equal(usesSystemIcon("deploy.appref-ms"), true);
  assert.equal(usesSystemIcon("report.pdf"), false);
  assert.equal(usesSystemIcon("archive.zip"), false);
  assert.equal(usesSystemIcon("song.mp3"), false);
});

test("ClickOnce 快捷方式归为快捷方式类型", () => {
  assert.equal(getFileType("deploy.appref-ms"), "shortcut");
  assert.equal(getFileType("site.url"), "shortcut");
});

test("类型排序顺序稳定", () => {
  assert.deepEqual(TYPE_ORDER, [
    "folder",
    "image",
    "document",
    "archive",
    "installer",
    "audio",
    "video",
    "code",
    "shortcut",
    "other",
    "system"
  ]);
  assert.ok(getTypeRank("folder") < getTypeRank("image"));
  assert.ok(getTypeRank("image") < getTypeRank("document"));
  assert.ok(getTypeRank("document") < getTypeRank("archive"));
  assert.ok(getTypeRank("other") < getTypeRank("system"));
  assert.ok(getTypeRank("unknown") > getTypeRank("other"));
});
