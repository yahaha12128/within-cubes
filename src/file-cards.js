"use strict";

const path = require("node:path");
const { pathToFileURL } = require("node:url");

const TYPE_LABELS = {
  folder: "文件夹",
  image: "图片",
  document: "文档",
  archive: "压缩包",
  installer: "安装包",
  audio: "音频",
  video: "视频",
  code: "代码",
  shortcut: "快捷方式",
  other: "文件"
};

function formatFileSize(size) {
  const bytes = Math.max(0, Number(size) || 0);

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getTypeLabel(file) {
  return TYPE_LABELS[file && file.type] || TYPE_LABELS.other;
}

function getTodoAction(file) {
  if (!file) return "处理";

  switch (file.type) {
    case "folder":
      return "打开文件夹";
    case "image":
      return "查看图片";
    case "audio":
    case "video":
      return "查看音视频";
    case "document":
      return "处理文档";
    case "archive":
      return "整理压缩包";
    case "code":
      return "处理代码";
    case "installer":
    case "shortcut":
      return "检查应用";
    default:
      return "处理文件";
  }
}

function buildTodoText(file) {
  const name = String((file && file.name) || "").trim() || "未命名文件";
  const text = `${getTodoAction(file)}「${name}」`;

  return Array.from(text)
    .slice(0, 200)
    .join("");
}

function buildNoteFromFiles(files, at = new Date()) {
  const list = Array.isArray(files) ? files.filter(Boolean) : [];

  if (list.length === 0) {
    return "";
  }

  const first = list[0];
  const lines = [
    `文件卡片：${first.name}`,
    "",
    `> ${formatDate(at)} · ${list.length} 个文件`,
    ""
  ];

  for (const file of list) {
    const name = String(file.name || path.basename(file.path || ""));
    const typeLabel = getTypeLabel(file);
    const size = file.kind === "folder" ? "—" : formatFileSize(file.size);

    lines.push(`## ${name}`);
    lines.push("");

    if (file.type === "image" && file.path) {
      lines.push(`![${name}](${pathToFileURL(file.path).href})`);
      lines.push("");
    }

    lines.push(`- 类型：${typeLabel}`);
    lines.push(`- 大小：${size}`);

    if (file.path) {
      lines.push(`- 位置：\`${file.path}\``);
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

module.exports = {
  TYPE_LABELS,
  formatFileSize,
  getTypeLabel,
  buildTodoText,
  buildNoteFromFiles
};
