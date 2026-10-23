"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const { isHidden, restoreItem } = require("../src/file-attributes");
const { loadHistory } = require("../src/history");
const { loadOrganizedItems } = require("../src/organized-items");
const { migrateLegacyOrganizeFolder } = require("../src/migration");

const windowsOnly = { skip: process.platform !== "win32" };

async function makeTempDir(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "within-cubes-migration-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

async function writeFile(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

function createFloatingConfig(backgroundImage) {
  return {
    version: 6,
    tint: "system",
    customTint: "#2f6b4f",
    frosted: true,
    categories: {},
    widgets: {
      clock: {
        enabled: false,
        backgroundImage
      },
      music: {
        enabled: false,
        backgroundImage: null
      }
    }
  };
}

test("迁移会备份旧目录、恢复并隐藏文件、改写历史与背景路径", windowsOnly, async (t) => {
  const desktop = await makeTempDir(t);
  const userData = await makeTempDir(t);
  const legacyRoot = path.join(desktop, "桌面整理");
  const legacyFile = path.join(legacyRoot, "文档", "report.txt");
  const sourcePath = path.join(desktop, "report.txt");
  const historyPath = path.join(userData, "history.json");
  const floatingConfigPath = path.join(userData, "floating.json");
  const manualCategoriesPath = path.join(userData, "manual-categories.json");
  const organizedItemsPath = path.join(userData, "organized-items.json");

  await writeFile(legacyFile, "report-content");
  await writeJson(historyPath, {
    version: 1,
    runs: [
      {
        id: "run-1",
        createdAt: new Date().toISOString(),
        status: "active",
        movedCount: 1,
        desktopPath: desktop,
        targetRoot: legacyRoot,
        moves: [
          {
            name: "report.txt",
            sourcePath,
            destinationPath: legacyFile,
            timestamp: new Date().toISOString()
          }
        ]
      }
    ],
    rollbacks: []
  });
  await writeJson(manualCategoriesPath, {
    version: 1,
    assignments: {},
    undoStack: []
  });

  const floatingConfig = createFloatingConfig(legacyFile);
  await writeJson(floatingConfigPath, floatingConfig);

  const result = await migrateLegacyOrganizeFolder({
    desktopPath: desktop,
    userDataDir: userData,
    historyPath,
    floatingConfigPath,
    manualCategoriesPath,
    organizedItemsPath,
    floatingConfig
  });

  assert.equal(result.status, "done");
  assert.equal(result.report.restored, 1);
  assert.equal(result.report.conflicts.length, 0);
  assert.equal(result.report.duplicates.length, 0);

  assert.equal(await fs.readFile(sourcePath, "utf8"), "report-content");
  assert.equal(await isHidden(sourcePath), true);
  await assert.rejects(fs.access(legacyRoot));

  const registry = await loadOrganizedItems(organizedItemsPath, {
    desktopPath: desktop
  });
  const items = Object.values(registry.items);
  assert.equal(items.length, 1);
  assert.equal(items[0].path, sourcePath);
  assert.equal(items[0].category, "documents");
  assert.equal(items[0].hiddenBefore, false);

  const history = await loadHistory(historyPath, { maxRuns: Infinity });
  assert.equal(history.runs.length, 1);
  assert.equal(history.runs[0].items.length, 1);
  assert.equal(history.runs[0].moves.length, 0);
  assert.equal(history.runs[0].items[0].path, sourcePath);

  assert.equal(floatingConfig.widgets.clock.backgroundImage, sourcePath);
  assert.equal(result.floatingChanged, true);

  await fs.access(path.join(result.report.backupDir, "桌面整理", "文档", "report.txt"));

  const second = await migrateLegacyOrganizeFolder({
    desktopPath: desktop,
    userDataDir: userData,
    historyPath,
    floatingConfigPath,
    manualCategoriesPath,
    organizedItemsPath,
    floatingConfig
  });

  assert.equal(second.status, "already-done");

  await restoreItem(sourcePath, false);
});

test("同一原路径的多个旧文件只恢复最新记录，旧文件保留并报告", windowsOnly, async (t) => {
  const desktop = await makeTempDir(t);
  const userData = await makeTempDir(t);
  const legacyRoot = path.join(desktop, "桌面整理");
  const legacyOld = path.join(legacyRoot, "文档", "a.txt");
  const legacyNew = path.join(legacyRoot, "文档", "a(1).txt");
  const sourcePath = path.join(desktop, "a.txt");
  const historyPath = path.join(userData, "history.json");
  const floatingConfigPath = path.join(userData, "floating.json");
  const manualCategoriesPath = path.join(userData, "manual-categories.json");
  const organizedItemsPath = path.join(userData, "organized-items.json");

  await writeFile(legacyOld, "old");
  await writeFile(legacyNew, "new");
  await writeJson(historyPath, {
    version: 1,
    runs: [
      {
        id: "run-old",
        createdAt: new Date(2026, 0, 1).toISOString(),
        status: "rolledBack",
        movedCount: 1,
        desktopPath: desktop,
        targetRoot: legacyRoot,
        moves: [
          {
            name: "a.txt",
            sourcePath,
            destinationPath: legacyOld,
            timestamp: new Date(2026, 0, 1).toISOString()
          }
        ]
      },
      {
        id: "run-new",
        createdAt: new Date(2026, 0, 2).toISOString(),
        status: "active",
        movedCount: 1,
        desktopPath: desktop,
        targetRoot: legacyRoot,
        moves: [
          {
            name: "a.txt",
            sourcePath,
            destinationPath: legacyNew,
            timestamp: new Date(2026, 0, 2).toISOString()
          }
        ]
      }
    ],
    rollbacks: []
  });
  await writeJson(manualCategoriesPath, {
    version: 1,
    assignments: {},
    undoStack: []
  });
  await writeJson(floatingConfigPath, createFloatingConfig(null));

  const result = await migrateLegacyOrganizeFolder({
    desktopPath: desktop,
    userDataDir: userData,
    historyPath,
    floatingConfigPath,
    manualCategoriesPath,
    organizedItemsPath,
    floatingConfig: createFloatingConfig(null)
  });

  assert.equal(result.status, "done");
  assert.equal(result.report.restored, 1);
  assert.equal(result.report.duplicates.length, 1);
  assert.equal(await fs.readFile(sourcePath, "utf8"), "new");
  assert.equal(await isHidden(sourcePath), true);
  assert.equal(await fs.readFile(legacyOld, "utf8"), "old");

  const history = await loadHistory(historyPath, { maxRuns: Infinity });
  const oldRun = history.runs.find((run) => run.id === "run-old");
  const newRun = history.runs.find((run) => run.id === "run-new");

  assert.equal(oldRun.items.length, 0);
  assert.equal(newRun.items.length, 1);

  await restoreItem(sourcePath, false);
});
