"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const {
  formatTimestamp,
  makeLogFileName,
  makeRollbackLogFileName,
  makeAssignLogFileName,
  writeOrganizeLog,
  writeRollbackLog,
  writeAssignLog
} = require("../src/logger");

async function makeTempDir(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "within-cubes-log-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

test("日志文件名与时间戳格式包含毫秒", () => {
  const date = new Date(2026, 9, 18, 12, 34, 56, 789);

  assert.equal(makeLogFileName(date), "organize-20261018-123456-789.log");
  assert.equal(formatTimestamp(date), "2026-10-18 12:34:56.789");
});

test("整理日志记录归属分类而不是移动路径", async (t) => {
  const workspace = await makeTempDir(t);
  const logDir = path.join(workspace, "logs");
  const report = {
    startedAt: new Date(2026, 9, 18, 12, 0, 0, 0).toISOString(),
    finishedAt: new Date(2026, 9, 18, 12, 0, 1, 500).toISOString(),
    assigned: 1,
    skipped: 1,
    errors: [{ name: "bad.txt", message: "EPERM" }],
    items: [
      {
        status: "assigned",
        name: "report.txt",
        path: "C:\\Desktop\\report.txt",
        category: "documents",
        categoryLabel: "文档",
        timestamp: new Date(2026, 9, 18, 12, 0, 0, 120).toISOString()
      },
      {
        status: "skipped",
        name: "gone.png",
        path: "C:\\Desktop\\gone.png",
        reason: "文件已不存在",
        timestamp: new Date(2026, 9, 18, 12, 0, 0, 240).toISOString()
      },
      {
        status: "error",
        name: "bad.txt",
        path: "C:\\Desktop\\bad.txt",
        message: "EPERM",
        timestamp: new Date(2026, 9, 18, 12, 0, 0, 360).toISOString()
      }
    ]
  };

  const logPath = await writeOrganizeLog({
    logDir,
    report,
    desktopPath: "C:\\Desktop"
  });

  assert.equal(path.dirname(logPath), logDir);
  assert.equal(path.basename(logPath), "organize-20261018-120000-000.log");

  const content = await fs.readFile(logPath, "utf8");
  assert.ok(content.includes("桌面整理归属日志"));
  assert.ok(content.includes("开始时间: 2026-10-18 12:00:00.000"));
  assert.ok(content.includes("结束时间: 2026-10-18 12:00:01.500"));
  assert.ok(content.includes("桌面目录: C:\\Desktop"));
  assert.ok(content.includes("整理方式: 仅登记归属，不移动任何文件"));
  assert.ok(content.includes("结果: 登记归属 1 个，跳过 1 个，失败 1 个"));
  assert.ok(content.includes(
    "[2026-10-18 12:00:00.120] 归属 \"C:\\Desktop\\report.txt\" -> \"文档\""
  ));
  assert.ok(content.includes("[2026-10-18 12:00:00.240] 跳过 \"C:\\Desktop\\gone.png\"（文件已不存在）"));
  assert.ok(content.includes("[2026-10-18 12:00:00.360] 失败 \"C:\\Desktop\\bad.txt\"（EPERM）"));
  assert.equal(content.includes("移动 \""), false);
});

test("回档日志记录解除归属、跳过与失败明细", async (t) => {
  const workspace = await makeTempDir(t);
  const logDir = path.join(workspace, "logs");
  const rollback = {
    createdAt: new Date(2026, 9, 18, 14, 0, 0, 0).toISOString(),
    targetRunCreatedAt: new Date(2026, 9, 18, 13, 0, 0, 0).toISOString(),
    runCount: 2,
    removed: 1,
    skipped: 1,
    errors: 1,
    items: [
      {
        status: "unassigned",
        path: "C:\\Desktop\\a.txt",
        name: "a.txt",
        category: "documents",
        categoryLabel: "文档",
        timestamp: new Date(2026, 9, 18, 14, 0, 0, 100).toISOString()
      },
      {
        status: "skipped",
        path: "C:\\Desktop\\b.txt",
        name: "b.txt",
        reason: "归属记录已不存在",
        timestamp: new Date(2026, 9, 18, 14, 0, 0, 200).toISOString()
      },
      {
        status: "error",
        path: "C:\\Desktop\\c.txt",
        name: "c.txt",
        message: "EPERM",
        timestamp: new Date(2026, 9, 18, 14, 0, 0, 300).toISOString()
      }
    ]
  };

  const logPath = await writeRollbackLog({ logDir, rollback });

  assert.equal(makeRollbackLogFileName(new Date(2026, 9, 18, 14, 0, 0, 0)), "rollback-20261018-140000-000.log");
  assert.equal(path.basename(logPath), "rollback-20261018-140000-000.log");

  const content = await fs.readFile(logPath, "utf8");
  assert.ok(content.includes("桌面整理回档日志"));
  assert.ok(content.includes("回档方式: 仅删除归属记录，不移动任何文件"));
  assert.ok(content.includes("结果: 解除归属 1 个，跳过 1 个，失败 1 个"));
  assert.ok(content.includes(
    "[2026-10-18 14:00:00.100] 解除归属 \"C:\\Desktop\\a.txt\"（文档）"
  ));
  assert.ok(content.includes(
    "[2026-10-18 14:00:00.200] 跳过 \"C:\\Desktop\\b.txt\"（归属记录已不存在）"
  ));
});

test("分类归属调整日志记录文件名、原分类、新分类和时间", async (t) => {
  const workspace = await makeTempDir(t);
  const logDir = path.join(workspace, "logs");
  const at = new Date(2026, 9, 18, 16, 0, 0, 123);

  assert.equal(makeAssignLogFileName(at), "assign-20261018-160000-123.log");
  assert.equal(makeAssignLogFileName(at, "undo"), "assign-undo-20261018-160000-123.log");
  assert.equal(makeAssignLogFileName(at, "unassign"), "assign-unassign-20261018-160000-123.log");

  const logPath = await writeAssignLog({
    logDir,
    entry: {
      action: "assign",
      at: at.toISOString(),
      path: "C:\\Desktop\\report.txt",
      name: "report.txt",
      fromCategory: "documents",
      toCategory: "media",
      fromLabel: "文档",
      toLabel: "图片或音频等多媒体"
    }
  });

  assert.equal(path.basename(logPath), "assign-20261018-160000-123.log");

  const content = await fs.readFile(logPath, "utf8");
  assert.ok(content.includes("桌面整理分类归属调整日志"));
  assert.ok(content.includes("操作时间: 2026-10-18 16:00:00.123"));
  assert.ok(content.includes("操作类型: 调整分类"));
  assert.ok(content.includes("原分类: 文档"));
  assert.ok(content.includes("新分类: 图片或音频等多媒体"));
});

test("移出分类会写入未整理目标", async (t) => {
  const workspace = await makeTempDir(t);
  const logDir = path.join(workspace, "logs");
  const at = new Date(2026, 9, 18, 16, 5, 0, 456);

  const logPath = await writeAssignLog({
    logDir,
    entry: {
      action: "unassign",
      at: at.toISOString(),
      path: "C:\\Desktop/photo.png",
      name: "photo.png",
      fromCategory: "media",
      toCategory: null,
      fromLabel: "图片或音频等多媒体",
      toLabel: null
    }
  });

  assert.equal(path.basename(logPath), "assign-unassign-20261018-160500-456.log");

  const content = await fs.readFile(logPath, "utf8");
  assert.ok(content.includes("操作类型: 移出分类"));
  assert.ok(content.includes("新分类: 未整理"));
});

test("没有归属记录时也会生成说明日志", async (t) => {
  const workspace = await makeTempDir(t);
  const logPath = await writeOrganizeLog({
    logDir: path.join(workspace, "logs"),
    report: {
      startedAt: new Date(2026, 9, 18, 13, 0, 0, 0).toISOString(),
      finishedAt: new Date(2026, 9, 18, 13, 0, 0, 1).toISOString(),
      assigned: 0,
      skipped: 0,
      errors: [],
      items: []
    },
    desktopPath: "C:\\Desktop"
  });

  const content = await fs.readFile(logPath, "utf8");
  assert.ok(content.includes("（没有归属记录）"));
});

test("无效报告不会生成日志", async (t) => {
  const workspace = await makeTempDir(t);

  await assert.rejects(
    () => writeOrganizeLog({
      logDir: path.join(workspace, "logs"),
      report: null,
      desktopPath: "C:\\Desktop"
    }),
    /整理报告无效/
  );
});
