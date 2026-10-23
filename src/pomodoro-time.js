"use strict";

const path = require("node:path");
const {
  AUDIO_EXTENSIONS,
  VIDEO_EXTENSIONS,
  IMAGE_EXTENSIONS,
  CODE_EXTENSIONS
} = require("./file-types");

const MB = 1024 * 1024;

// 「文本/代码」的文件大小上限是 50MB，其余类型统一 2GB。
// 超限时不接受拖入，由桌面层把文件弹回并在番茄钟上给出红色提示。
const TEXT_SIZE_LIMIT_BYTES = 50 * MB;
const OTHER_SIZE_LIMIT_BYTES = 2 * 1024 * MB;

const POMODORO_CAPS = Object.freeze({
  text: 45,
  document: 90,
  design: 60,
  media: 120,
  unknown: 30
});

const POMODORO_GROUP_LABELS = Object.freeze({
  text: "文本/代码",
  document: "文档/表格",
  design: "图片/设计",
  media: "音视频",
  unknown: "无法评估"
});

const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".markdown",
  ".rst",
  ".log",
  ".tex",
  ".org",
  ...CODE_EXTENSIONS
]);

// 视觉设计稿即使也属于图片，也归入「图片/设计」，不再算作文档。
const DESIGN_EXTENSIONS = new Set([
  ...IMAGE_EXTENSIONS,
  ".psd",
  ".psb",
  ".ai",
  ".sketch",
  ".fig",
  ".xd",
  ".indd",
  ".idml",
  ".blend",
  ".cdr",
  ".eps",
  ".afdesign",
  ".afphoto"
]);

const DOCUMENT_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".docm",
  ".xls",
  ".xlsx",
  ".xlsm",
  ".csv",
  ".tsv",
  ".ppt",
  ".pptx",
  ".pptm",
  ".rtf",
  ".odt",
  ".ods",
  ".odp",
  ".epub",
  ".mobi",
  ".pages",
  ".numbers",
  ".key",
  ".one"
]);

const MEDIA_EXTENSIONS = new Set([
  ...AUDIO_EXTENSIONS,
  ...VIDEO_EXTENSIONS
]);

function getExtension(fileName) {
  return path.extname(String(fileName || "")).toLowerCase();
}

function classifyPomodoroGroup(fileName, kind = "file") {
  if (kind === "folder") return "unknown";

  const extension = getExtension(fileName);

  if (TEXT_EXTENSIONS.has(extension)) return "text";
  if (DOCUMENT_EXTENSIONS.has(extension)) return "document";
  if (DESIGN_EXTENSIONS.has(extension)) return "design";
  if (MEDIA_EXTENSIONS.has(extension)) return "media";

  return "unknown";
}

function getPomodoroLimitBytes(group) {
  return group === "text" ? TEXT_SIZE_LIMIT_BYTES : OTHER_SIZE_LIMIT_BYTES;
}

function formatSizeLimit(bytes) {
  return bytes >= 1024 * MB
    ? `${Math.round(bytes / (1024 * MB))} GB`
    : `${Math.round(bytes / MB)} MB`;
}

// 根绝文件类型和大小给出一个可复现的专注时长估算：
// - 文本/代码：按体积读取，基础 5 分钟，每 64KB 增加 1 分钟；
// - 文档/表格：基础 10 分钟，每 MB 增加 3 分钟；
// - 图片/设计：基础 10 分钟，每 MB 增加 2 分钟；
// - 音视频：基础 15 分钟，每 4MB 增加 1 分钟；
// - 无法评估：固定 30 分钟。
// 所有结果都落在对应类型的封顶值以内，最小 5 分钟。
function estimatePomodoroMinutes(group, size) {
  const bytes = Math.max(0, Number(size) || 0);
  const kilobytes = bytes / 1024;
  const megabytes = bytes / MB;
  let raw = 30;

  if (group === "text") {
    raw = 5 + Math.ceil(kilobytes / 64);
  } else if (group === "document") {
    raw = 10 + Math.ceil(megabytes * 3);
  } else if (group === "design") {
    raw = 10 + Math.ceil(megabytes * 2);
  } else if (group === "media") {
    raw = 15 + Math.ceil(megabytes / 4);
  }

  const cap = POMODORO_CAPS[group] || POMODORO_CAPS.unknown;
  return Math.max(5, Math.min(cap, Math.ceil(raw)));
}

function analyzePomodoroFile({
  name,
  kind = "file",
  size = 0
} = {}) {
  const safeName = path.basename(String(name || ""));
  const group = classifyPomodoroGroup(safeName, kind);
  const bytes = Math.max(0, Number(size) || 0);
  const limitBytes = getPomodoroLimitBytes(group);
  const accepted = bytes <= limitBytes;
  const minutes = estimatePomodoroMinutes(group, bytes);

  return {
    ok: true,
    accepted,
    group,
    groupLabel: POMODORO_GROUP_LABELS[group],
    capMinutes: POMODORO_CAPS[group],
    minutes,
    size: bytes,
    limitBytes,
    limitLabel: formatSizeLimit(limitBytes),
    reason: accepted ? null : "too-large",
    message: accepted ? "" : "文件过大"
  };
}

module.exports = {
  TEXT_SIZE_LIMIT_BYTES,
  OTHER_SIZE_LIMIT_BYTES,
  POMODORO_CAPS,
  POMODORO_GROUP_LABELS,
  TEXT_EXTENSIONS,
  DOCUMENT_EXTENSIONS,
  DESIGN_EXTENSIONS,
  MEDIA_EXTENSIONS,
  classifyPomodoroGroup,
  getPomodoroLimitBytes,
  formatSizeLimit,
  estimatePomodoroMinutes,
  analyzePomodoroFile
};
