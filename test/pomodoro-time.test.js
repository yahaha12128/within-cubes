"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  TEXT_SIZE_LIMIT_BYTES,
  OTHER_SIZE_LIMIT_BYTES,
  POMODORO_CAPS,
  classifyPomodoroGroup,
  estimatePomodoroMinutes,
  analyzePomodoroFile,
  formatSizeLimit
} = require("../src/pomodoro-time");

test("番茄钟按扩展名区分文本、文档、设计、音视频和无法评估", () => {
  assert.equal(classifyPomodoroGroup("notes.txt"), "text");
  assert.equal(classifyPomodoroGroup("main.js"), "text");
  assert.equal(classifyPomodoroGroup("README.md"), "text");
  assert.equal(classifyPomodoroGroup("report.docx"), "document");
  assert.equal(classifyPomodoroGroup("budget.xlsx"), "document");
  assert.equal(classifyPomodoroGroup("slides.pptx"), "document");
  assert.equal(classifyPomodoroGroup("photo.png"), "design");
  assert.equal(classifyPomodoroGroup("mockup.psd"), "design");
  assert.equal(classifyPomodoroGroup("track.flac"), "media");
  assert.equal(classifyPomodoroGroup("clip.mp4"), "media");
  assert.equal(classifyPomodoroGroup("bundle.zip"), "unknown");
  assert.equal(classifyPomodoroGroup("安装包.exe"), "unknown");
  assert.equal(classifyPomodoroGroup("资料文件夹", "folder"), "unknown");
});

test("番茄钟估算时长永远不超过各类型封顶值", () => {
  assert.deepEqual(POMODORO_CAPS, {
    text: 45,
    document: 90,
    design: 60,
    media: 120,
    unknown: 30
  });

  assert.equal(estimatePomodoroMinutes("text", 0), 5);
  assert.equal(estimatePomodoroMinutes("text", 1024 * 1024), 21);
  assert.equal(
    estimatePomodoroMinutes("text", TEXT_SIZE_LIMIT_BYTES - 1),
    45
  );

  assert.equal(estimatePomodoroMinutes("document", 1024 * 1024), 13);
  assert.equal(
    estimatePomodoroMinutes("document", OTHER_SIZE_LIMIT_BYTES),
    90
  );

  assert.equal(estimatePomodoroMinutes("design", 10 * 1024 * 1024), 30);
  assert.equal(estimatePomodoroMinutes("design", 1024 * 1024 * 1024), 60);

  assert.equal(estimatePomodoroMinutes("media", 100 * 1024 * 1024), 40);
  assert.equal(estimatePomodoroMinutes("media", OTHER_SIZE_LIMIT_BYTES), 120);

  assert.equal(estimatePomodoroMinutes("unknown", 0), 30);
  assert.equal(estimatePomodoroMinutes("unknown", 10 * 1024 * 1024), 30);
});

test("文本上限 50MB，其他类型上限 2GB，边界值可接受", () => {
  const textAtLimit = analyzePomodoroFile({
    name: "big.txt",
    kind: "file",
    size: TEXT_SIZE_LIMIT_BYTES
  });
  assert.equal(textAtLimit.accepted, true);
  assert.equal(textAtLimit.minutes, 45);
  assert.equal(textAtLimit.limitLabel, "50 MB");

  const textTooLarge = analyzePomodoroFile({
    name: "too-big.txt",
    kind: "file",
    size: TEXT_SIZE_LIMIT_BYTES + 1
  });
  assert.equal(textTooLarge.accepted, false);
  assert.equal(textTooLarge.reason, "too-large");
  assert.equal(textTooLarge.message, "文件过大");

  const videoAtLimit = analyzePomodoroFile({
    name: "movie.mp4",
    kind: "file",
    size: OTHER_SIZE_LIMIT_BYTES
  });
  assert.equal(videoAtLimit.accepted, true);
  assert.equal(videoAtLimit.limitLabel, "2 GB");
  assert.equal(videoAtLimit.minutes, 120);

  const archiveTooLarge = analyzePomodoroFile({
    name: "backup.zip",
    kind: "file",
    size: OTHER_SIZE_LIMIT_BYTES + 1
  });
  assert.equal(archiveTooLarge.accepted, false);
  assert.equal(archiveTooLarge.group, "unknown");
  assert.equal(archiveTooLarge.minutes, 30);
});

test("无法评估的文件返回固定 30 分钟建议", () => {
  const result = analyzePomodoroFile({
    name: "未知格式.xyz",
    kind: "file",
    size: 1024
  });

  assert.equal(result.group, "unknown");
  assert.equal(result.groupLabel, "无法评估");
  assert.equal(result.minutes, 30);
  assert.equal(result.capMinutes, 30);
  assert.equal(result.accepted, true);
});

test("文件大小上限使用便于阅读的标签", () => {
  assert.equal(formatSizeLimit(TEXT_SIZE_LIMIT_BYTES), "50 MB");
  assert.equal(formatSizeLimit(OTHER_SIZE_LIMIT_BYTES), "2 GB");
});
