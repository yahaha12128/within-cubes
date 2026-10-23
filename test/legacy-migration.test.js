"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const {
  inspectLegacyFolder,
  runLegacyMigration
} = require("../src/legacy-migration");
const { createEmptyCategoryMap, getAssignment } = require("../src/category-map");

async function makeTempDir(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "within-cubes-legacy-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

async function writeFile(directory, name, content = name) {
  const target = path.join(directory, name);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content);
  return target;
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch (error) {
    return false;
  }
}

function buildHistory(desktop, moves) {
  return {
    version: 3,
    runs: [
      {
        id: "run-test",
        createdAt: new Date("2026-10-20T00:00:00.000Z").toISOString(),
        status: "active",
        items: [],
        moves
      }
    ],
    rollbacks: []
  };
}

test("迁移前先备份并校验，再把旧文件移回桌面并登记归属", async (t) => {
  const desktop = await makeTempDir(t);
  const userData = await makeTempDir(t);
  const legacyFile = await writeFile(
    desktop,
    path.join("桌面整理", "文档", "report.txt"),
    "report"
  );
  const historyNote = await writeFile(userData, "history.json", "old-history");
  const backupDir = path.join(userData, "migration-backup", "20261020-reference-model");
  const history = buildHistory(desktop, [
    {
      name: "report.txt",
      sourcePath: path.join(desktop, "report.txt"),
      destinationPath: legacyFile
    }
  ]);
  const categoryMap = createEmptyCategoryMap(desktop);

  const result = await runLegacyMigration({
    desktopPath: desktop,
    userDataDir: userData,
    stateFiles: [historyNote],
    categoryMap,
    history,
    backupDir
  });

  assert.equal(result.status, "done");
  assert.equal(result.backup.verified, true);
  assert.equal(await pathExists(path.join(backupDir, "桌面整理", "文档", "report.txt")), true);
  assert.equal(await pathExists(path.join(backupDir, "manifest.json")), true);
  assert.equal(
    await fs.readFile(path.join(backupDir, "state", "history.json"), "utf8"),
    "old-history"
  );

  assert.equal(await fs.readFile(path.join(desktop, "report.txt"), "utf8"), "report");
  assert.equal(await pathExists(path.join(desktop, "桌面整理")), false);

  const assignment = getAssignment(categoryMap, path.join(desktop, "report.txt"));
  assert.ok(assignment);
  assert.equal(assignment.category, "documents");
  assert.equal(assignment.runId, "run-test");
  assert.equal(assignment.source, "migration");

  assert.equal(history.runs[0].moves.length, 0);
  assert.equal(history.runs[0].items.length, 1);
  assert.equal(history.runs[0].items[0].category, "documents");
});

test("原位置已有同名文件时迁移为带序号的新名字", async (t) => {
  const desktop = await makeTempDir(t);
  const userData = await makeTempDir(t);
  await writeFile(desktop, "report.txt", "existing");
  const legacyFile = await writeFile(
    desktop,
    path.join("桌面整理", "文档", "report.txt"),
    "legacy"
  );
  const history = buildHistory(desktop, [
    {
      name: "report.txt",
      sourcePath: path.join(desktop, "report.txt"),
      destinationPath: legacyFile
    }
  ]);
  const categoryMap = createEmptyCategoryMap(desktop);

  const result = await runLegacyMigration({
    desktopPath: desktop,
    userDataDir: userData,
    stateFiles: [],
    categoryMap,
    history,
    backupDir: path.join(userData, "backup")
  });

  assert.equal(result.status, "done");
  assert.equal(await fs.readFile(path.join(desktop, "report.txt"), "utf8"), "existing");
  assert.equal(await fs.readFile(path.join(desktop, "report(1).txt"), "utf8"), "legacy");
  assert.equal(
    getAssignment(categoryMap, path.join(desktop, "report(1).txt")).category,
    "documents"
  );
});

test("空旧目录会直接清理，不需要迁移", async (t) => {
  const desktop = await makeTempDir(t);
  const userData = await makeTempDir(t);
  await fs.mkdir(path.join(desktop, "桌面整理", "文档"), { recursive: true });
  const categoryMap = createEmptyCategoryMap(desktop);
  const history = { version: 3, runs: [], rollbacks: [] };

  const result = await runLegacyMigration({
    desktopPath: desktop,
    userDataDir: userData,
    stateFiles: [],
    categoryMap,
    history,
    backupDir: path.join(userData, "backup")
  });

  assert.equal(result.status, "not-needed");
  assert.equal(result.reason, "empty-legacy-folder");
  assert.equal(await pathExists(path.join(desktop, "桌面整理")), false);
});

test("没有旧目录时返回 not-needed", async (t) => {
  const desktop = await makeTempDir(t);
  const userData = await makeTempDir(t);
  const info = await inspectLegacyFolder(desktop);

  assert.equal(info.exists, false);

  const result = await runLegacyMigration({
    desktopPath: desktop,
    userDataDir: userData,
    stateFiles: [],
    categoryMap: createEmptyCategoryMap(desktop),
    history: { version: 3, runs: [], rollbacks: [] },
    backupDir: path.join(userData, "backup")
  });

  assert.equal(result.status, "not-needed");
  assert.equal(result.reason, "no-legacy-folder");
});
