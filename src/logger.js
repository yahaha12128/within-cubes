"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const pad = (value, length = 2) => String(value).padStart(length, "0");

function toDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatTimestamp(value) {
  const date = toDate(value);

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`
  ].join(" ");
}

function makeLogFileName(value) {
  const date = toDate(value);

  return [
    "organize-",
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`,
    "-",
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`,
    "-",
    pad(date.getMilliseconds(), 3),
    ".log"
  ].join("");
}

function formatItem(item) {
  const time = formatTimestamp(item.timestamp);
  const itemPath = item.path || item.sourcePath || "";

  if (item.status === "assigned") {
    return `[${time}] 归属 "${itemPath}" -> "${item.categoryLabel || item.category || ""}"`;
  }

  if (item.status === "skipped") {
    return `[${time}] 跳过 "${itemPath}"（${item.reason || "已跳过"}）`;
  }

  return `[${time}] 失败 "${itemPath}"（${item.message || "未知错误"}）`;
}

function makeRollbackLogFileName(value) {
  const date = toDate(value);

  return [
    "rollback-",
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`,
    "-",
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`,
    "-",
    pad(date.getMilliseconds(), 3),
    ".log"
  ].join("");
}

function formatRollbackItem(item) {
  const time = formatTimestamp(item.timestamp);
  const itemPath = item.path || item.from || "";

  if (item.status === "unassigned") {
    return `[${time}] 解除归属 "${itemPath}"（${item.categoryLabel || item.category || "未整理"}）`;
  }

  if (item.status === "skipped") {
    return `[${time}] 跳过 "${itemPath}"（${item.reason || "已跳过"}）`;
  }

  return `[${time}] 失败 "${itemPath}"（${item.message || "未知错误"}）`;
}

async function writeOrganizeLog({ logDir, report, desktopPath }) {
  if (!report || !Array.isArray(report.items)) {
    throw new Error("整理报告无效，无法生成日志。");
  }

  await fs.mkdir(logDir, { recursive: true });

  const startedAt = toDate(report.startedAt);
  const finishedAt = toDate(report.finishedAt || Date.now());
  const logPath = path.join(logDir, makeLogFileName(startedAt));
  const lines = [
    "桌面整理归属日志",
    `开始时间: ${formatTimestamp(startedAt)}`,
    `结束时间: ${formatTimestamp(finishedAt)}`,
    `桌面目录: ${desktopPath}`,
    "整理方式: 仅登记归属，不移动任何文件",
    `结果: 登记归属 ${report.assigned || 0} 个，跳过 ${report.skipped || 0} 个，失败 ${report.errors.length} 个`,
    ""
  ];

  if (report.items.length === 0) {
    lines.push("（没有归属记录）");
  } else {
    report.items.forEach((item) => {
      lines.push(formatItem(item));
    });
  }

  lines.push("");
  await fs.writeFile(logPath, lines.join("\r\n"), "utf8");

  return logPath;
}

function makeAssignLogFileName(value, action = "assign") {
  const date = toDate(value);
  const prefix = action === "undo"
    ? "assign-undo-"
    : action === "unassign"
      ? "assign-unassign-"
      : "assign-";

  return [
    prefix,
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`,
    "-",
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`,
    "-",
    pad(date.getMilliseconds(), 3),
    ".log"
  ].join("");
}

async function writeAssignLog({ logDir, entry }) {
  if (!entry || typeof entry.path !== "string" || !entry.path) {
    throw new Error("分类归属调整记录无效，无法生成日志。");
  }

  await fs.mkdir(logDir, { recursive: true });

  const at = toDate(entry.at);
  const action = entry.action === "undo"
    ? "undo"
    : entry.action === "unassign"
      ? "unassign"
      : "assign";
  const actionLabel = action === "undo"
    ? "撤销调整"
    : action === "unassign"
      ? "移出分类"
      : "调整分类";
  const logPath = path.join(logDir, makeAssignLogFileName(at, action));
  const lines = [
    "桌面整理分类归属调整日志",
    `操作时间: ${formatTimestamp(at)}`,
    `操作类型: ${actionLabel}`,
    `文件名: ${entry.name || path.basename(entry.path)}`,
    `文件路径: ${entry.path}`,
    `原分类: ${entry.fromLabel || entry.fromCategory || "未整理"}`,
    `新分类: ${entry.toLabel || entry.toCategory || "未整理"}`,
    ""
  ];

  await fs.writeFile(logPath, lines.join("\r\n"), "utf8");

  return logPath;
}

async function writeRollbackLog({ logDir, rollback }) {
  if (!rollback || !Array.isArray(rollback.items)) {
    throw new Error("回档报告无效，无法生成日志。");
  }

  await fs.mkdir(logDir, { recursive: true });

  const createdAt = toDate(rollback.createdAt);
  const logPath = path.join(logDir, makeRollbackLogFileName(createdAt));
  const lines = [
    "桌面整理回档日志",
    `操作时间: ${formatTimestamp(createdAt)}`,
    `回档目标: ${formatTimestamp(rollback.targetRunCreatedAt)}`,
    `涉及整理次数: ${rollback.runCount || 0}`,
    "回档方式: 仅删除归属记录，不移动任何文件",
    `结果: 解除归属 ${rollback.removed || 0} 个，跳过 ${rollback.skipped || 0} 个，失败 ${rollback.errors || 0} 个`,
    ""
  ];

  if (rollback.items.length === 0) {
    lines.push("（没有归属记录变化）");
  } else {
    rollback.items.forEach((item) => {
      lines.push(formatRollbackItem(item));
    });
  }

  lines.push("");
  await fs.writeFile(logPath, lines.join("\r\n"), "utf8");

  return logPath;
}

module.exports = {
  formatTimestamp,
  makeLogFileName,
  makeRollbackLogFileName,
  makeAssignLogFileName,
  writeOrganizeLog,
  writeRollbackLog,
  writeAssignLog
};
