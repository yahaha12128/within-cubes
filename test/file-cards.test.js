"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  formatFileSize,
  buildTodoText,
  buildNoteFromFiles
} = require("../src/file-cards");

test("文件卡片按类型生成待办文案", () => {
  assert.equal(buildTodoText({ name: "报告.pdf", type: "document" }), "处理文档「报告.pdf」");
  assert.equal(buildTodoText({ name: "照片.png", type: "image" }), "查看图片「照片.png」");
  assert.equal(buildTodoText({ name: "项目", type: "folder" }), "打开文件夹「项目」");
  assert.equal(buildTodoText({ name: "素材.zip", type: "archive" }), "整理压缩包「素材.zip」");
  assert.equal(buildTodoText({ name: "主程序.exe", type: "installer" }), "检查应用「主程序.exe」");
  assert.equal(buildTodoText({ name: "未知.xyz", type: "other" }), "处理文件「未知.xyz」");
});

test("文件卡片会生成包含标题、元信息和图片链接的随手记", () => {
  const at = new Date(2026, 9, 21, 20, 15, 0);
  const text = buildNoteFromFiles([
    {
      name: "效果图.png",
      path: "C:\\Users\\me\\Desktop\\效果图.png",
      type: "image",
      kind: "file",
      size: 1536
    },
    {
      name: "方案.docx",
      path: "C:\\Users\\me\\Desktop\\方案.docx",
      type: "document",
      kind: "file",
      size: 2 * 1024 * 1024
    }
  ], at);

  assert.match(text, /^文件卡片：效果图\.png/);
  assert.match(text, /2026-10-21 20:15 · 2 个文件/);
  assert.match(text, /!\[效果图\.png\]\(file:\/\/\/C:\/Users\/me\/Desktop\//);
  assert.match(text, /- 类型：图片/);
  assert.match(text, /- 大小：1\.5 KB/);
  assert.match(text, /- 类型：文档/);
  assert.match(text, /- 大小：2\.0 MB/);
  assert.match(text, /- 位置：`C:\\Users\\me\\Desktop\\方案\.docx`/);
});

test("文件大小格式化覆盖 B、KB、MB、GB", () => {
  assert.equal(formatFileSize(512), "512 B");
  assert.equal(formatFileSize(1536), "1.5 KB");
  assert.equal(formatFileSize(2 * 1024 * 1024), "2.0 MB");
  assert.equal(formatFileSize(3 * 1024 * 1024 * 1024), "3.00 GB");
});
