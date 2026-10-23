"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { classifyFileName } = require("./categories");
const { hideItem } = require("./file-attributes");
const {
  MAX_RUNS,
  createRunId,
  loadHistory,
  saveHistory
} = require("./history");
const { normalizePathKey } = require("./manual-categories");
const {
  loadOrganizedItems,
  saveOrganizedItems,
  upsertOrganizedItem
} = require("./organized-items");

const MIGRATION_VERSION = 1;
const ORGANIZE_DIR_NAME = "桌面整理";

const LEGACY_DIRS = [
  { dirName: "文件夹", mode: "folders", fallbackCategory: "folders" },
  { dirName: "应用", mode: "files", fallbackCategory: "apps" },
  { dirName: "文档", mode: "files", fallbackCategory: "documents" },
  { dirName: "多媒体", mode: "files", fallbackCategory: "media" },
  { dirName: "压缩包", mode: "files", fallbackCategory: "archives" },
  { dirName: "图片", mode: "files", fallbackCategory: "media" },
  { dirName: "安装包", mode: "files", fallbackCategory: "apps" },
  { dirName: "其他", mode: "files", fallbackCategory: "documents" }
];

function pad(value, length = 2) {
  return String(value).padStart(length, "0");
}

function timestampForPath(date = new Date()) {
  return [
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`,
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`,
    pad(date.getMilliseconds(), 3)
  ].join("-");
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch (error) {
    return false;
  }
}

async function readJsonFile(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    return null;
  }
}

async function writeJsonFile(filePath, data) {
  const directory = path.dirname(filePath);
  const temporaryPath = `${filePath}.tmp`;

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(temporaryPath, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(temporaryPath, filePath);
}

function buildHistoryMaps(history) {
  const destinationMap = new Map();
  const sourceLatestMap = new Map();

  for (const run of history.runs) {
    for (const move of run.moves || []) {
      if (
        !move ||
        typeof move.destinationPath !== "string" ||
        typeof move.sourcePath !== "string"
      ) {
        continue;
      }

      const destinationKey = normalizePathKey(move.destinationPath);
      const sourceKey = normalizePathKey(move.sourcePath);

      destinationMap.set(destinationKey, { move, run });
      sourceLatestMap.set(sourceKey, { move, run, destinationKey });
    }
  }

  return { destinationMap, sourceLatestMap };
}

async function inventoryLegacy(legacyRoot) {
  const entries = [];

  for (const definition of LEGACY_DIRS) {
    const directory = path.join(legacyRoot, definition.dirName);
    let dirents;

    try {
      dirents = await fs.readdir(directory, { withFileTypes: true });
    } catch (error) {
      continue;
    }

    for (const dirent of dirents) {
      if (definition.mode === "folders" && !dirent.isDirectory()) continue;
      if (definition.mode === "files" && !dirent.isFile()) continue;

      entries.push({
        definition,
        fullPath: path.join(directory, dirent.name),
        name: dirent.name,
        isDirectory: dirent.isDirectory()
      });
    }
  }

  let rootEntries = [];

  try {
    rootEntries = await fs.readdir(legacyRoot, { withFileTypes: true });
  } catch (error) {
    rootEntries = [];
  }

  for (const dirent of rootEntries) {
    if (dirent.isDirectory()) continue;

    entries.push({
      definition: null,
      fullPath: path.join(legacyRoot, dirent.name),
      name: dirent.name,
      isDirectory: false
    });
  }

  return entries;
}

function resolveCategory(entry) {
  if (entry.isDirectory) return "folders";

  const classification = classifyFileName(entry.name);
  if (classification.category) return classification.category;

  return entry.definition ? entry.definition.fallbackCategory : null;
}

function buildRegistryItem({
  filePath,
  originalPath,
  category,
  kind,
  runId,
  hiddenBefore
}) {
  return {
    path: filePath,
    originalPath: originalPath || filePath,
    category,
    kind,
    runId: runId || null,
    organizedAt: new Date().toISOString(),
    hiddenBefore: hiddenBefore === true,
    source: "migration"
  };
}

function buildHistoryItem({
  name,
  filePath,
  originalPath,
  category,
  kind,
  hiddenBefore
}) {
  return {
    name,
    path: filePath,
    originalPath: originalPath || filePath,
    category,
    kind,
    hiddenBefore: hiddenBefore === true,
    timestamp: new Date().toISOString()
  };
}

async function copyBackupFile(filePath, backupDir) {
  if (!(await pathExists(filePath))) return false;
  await fs.copyFile(filePath, path.join(backupDir, path.basename(filePath)));
  return true;
}

async function createBackup({
  legacyRoot,
  backupDir,
  historyPath,
  floatingConfigPath,
  manualCategoriesPath,
  organizedItemsPath
}) {
  await fs.mkdir(backupDir, { recursive: true });
  await fs.cp(legacyRoot, path.join(backupDir, ORGANIZE_DIR_NAME), {
    recursive: true,
    force: true
  });

  for (const filePath of [
    historyPath,
    floatingConfigPath,
    manualCategoriesPath,
    organizedItemsPath
  ]) {
    await copyBackupFile(filePath, backupDir);
  }
}

async function removeEmptyLegacyDirs(legacyRoot) {
  const leftovers = [];

  for (const definition of LEGACY_DIRS) {
    const directory = path.join(legacyRoot, definition.dirName);

    try {
      await fs.rmdir(directory);
    } catch (error) {
      if (error.code === "ENOENT") continue;

      let remaining = [];

      try {
        remaining = await fs.readdir(directory);
      } catch (readError) {
        remaining = [];
      }

      if (remaining.length > 0) {
        leftovers.push({
          directory,
          files: remaining
        });
      }
    }
  }

  try {
    await fs.rmdir(legacyRoot);
  } catch (error) {
    if (error.code !== "ENOENT") {
      let remaining = [];

      try {
        remaining = await fs.readdir(legacyRoot);
      } catch (readError) {
        remaining = [];
      }

      if (remaining.length > 0) {
        leftovers.push({
          directory: legacyRoot,
          files: remaining
        });
      }
    }
  }

  return leftovers;
}

function updateFloatingBackgrounds(floatingConfig, restoredPathMap) {
  const changes = [];

  if (!floatingConfig || !floatingConfig.widgets) {
    return changes;
  }

  for (const widgetKey of Object.keys(floatingConfig.widgets)) {
    const widget = floatingConfig.widgets[widgetKey];

    if (!widget || typeof widget.backgroundImage !== "string") continue;

    const oldPath = widget.backgroundImage;
    const newPath = restoredPathMap.get(normalizePathKey(oldPath));

    if (newPath && newPath !== oldPath) {
      widget.backgroundImage = newPath;
      changes.push({ widgetKey, from: oldPath, to: newPath });
    }
  }

  return changes;
}

async function migrateLegacyOrganizeFolder({
  desktopPath,
  userDataDir,
  historyPath,
  floatingConfigPath,
  manualCategoriesPath,
  organizedItemsPath,
  floatingConfig = null,
  force = false
}) {
  const resolvedDesktop = path.resolve(desktopPath);
  const legacyRoot = path.join(resolvedDesktop, ORGANIZE_DIR_NAME);
  const backupRoot = path.join(userDataDir, "migration-backup");
  const markerPath = path.join(userDataDir, "migration-state.json");
  const reportPath = path.join(userDataDir, "migration-report.json");
  const existingMarker = await readJsonFile(markerPath);

  if (existingMarker && existingMarker.status === "done") {
    return { status: "already-done", state: existingMarker };
  }

  if (
    existingMarker &&
    (existingMarker.status === "failed" || existingMarker.status === "running") &&
    !force
  ) {
    return { status: "blocked", state: existingMarker };
  }

  if (!(await pathExists(legacyRoot))) {
    const state = {
      version: MIGRATION_VERSION,
      status: "done",
      reason: "no-legacy-folder",
      finishedAt: new Date().toISOString()
    };

    await writeJsonFile(markerPath, state);
    return { status: "not-needed", state };
  }

  const legacyEntries = await fs.readdir(legacyRoot, { withFileTypes: true });

  if (legacyEntries.length === 0) {
    await fs.rmdir(legacyRoot).catch(() => {});
    const state = {
      version: MIGRATION_VERSION,
      status: "done",
      reason: "empty-legacy-folder",
      finishedAt: new Date().toISOString()
    };

    await writeJsonFile(markerPath, state);
    return { status: "not-needed", state };
  }

  const startedAt = new Date().toISOString();
  const backupDir = path.join(backupRoot, timestampForPath());

  await writeJsonFile(markerPath, {
    version: MIGRATION_VERSION,
    status: "running",
    startedAt,
    backupDir
  });

  try {
    await createBackup({
      legacyRoot,
      backupDir,
      historyPath,
      floatingConfigPath,
      manualCategoriesPath,
      organizedItemsPath
    });
  } catch (error) {
    const state = {
      version: MIGRATION_VERSION,
      status: "failed",
      stage: "backup",
      startedAt,
      finishedAt: new Date().toISOString(),
      backupDir,
      error: error.message || String(error)
    };

    await writeJsonFile(markerPath, state);
    return { status: "failed", state, error: state.error };
  }

  const history = await loadHistory(historyPath, { maxRuns: Infinity });
  const { destinationMap, sourceLatestMap } = buildHistoryMaps(history);
  const organizedItems = await loadOrganizedItems(organizedItemsPath, {
    desktopPath: resolvedDesktop
  });
  const inventory = await inventoryLegacy(legacyRoot);
  const itemsByRun = new Map();
  const syntheticRunId = createRunId();
  const restoredPathMap = new Map();
  const restored = [];
  const conflicts = [];
  const duplicates = [];
  const unmapped = [];
  const errors = [];
  const unclassified = [];

  const addRunItem = (runId, item) => {
    const ownerId = runId || syntheticRunId;

    if (!itemsByRun.has(ownerId)) {
      itemsByRun.set(ownerId, []);
    }

    itemsByRun.get(ownerId).push(item);
  };

  for (const entry of inventory) {
    const destinationKey = normalizePathKey(entry.fullPath);
    const destinationHit = destinationMap.get(destinationKey);

    if (!destinationHit) {
      const category = resolveCategory(entry);
      if (!category) {
        unclassified.push({ path: entry.fullPath, reason: "无法判断分类" });
        unmapped.push({ path: entry.fullPath, reason: "没有历史移动记录且无法分类" });
        continue;
      }

      const hideResult = await hideItem(entry.fullPath);
      if (!hideResult.ok) {
        errors.push({ path: entry.fullPath, message: hideResult.error });
      }

      const item = buildRegistryItem({
        filePath: entry.fullPath,
        originalPath: entry.fullPath,
        category,
        kind: entry.isDirectory ? "folder" : "file",
        runId: syntheticRunId,
        hiddenBefore: hideResult.ok ? hideResult.hiddenBefore : false
      });

      const registryItem = upsertOrganizedItem(organizedItems, item);
      if (registryItem) {
        addRunItem(syntheticRunId, buildHistoryItem({
          name: entry.name,
          filePath: registryItem.path,
          originalPath: registryItem.originalPath,
          category,
          kind: registryItem.kind,
          hiddenBefore: registryItem.hiddenBefore
        }));
      }

      unmapped.push({ path: entry.fullPath, reason: "没有历史移动记录，已登记为 legacy" });
      continue;
    }

    const { move, run } = destinationHit;
    const sourceKey = normalizePathKey(move.sourcePath);
    const latest = sourceLatestMap.get(sourceKey);

    if (latest && latest.destinationKey !== destinationKey) {
      duplicates.push({
        path: entry.fullPath,
        sourcePath: move.sourcePath,
        reason: "同一原路径有更新的整理记录"
      });
      continue;
    }

    const sourcePath = path.resolve(move.sourcePath);

    if (normalizePathKey(path.dirname(sourcePath)) !== normalizePathKey(resolvedDesktop)) {
      conflicts.push({
        path: entry.fullPath,
        sourcePath,
        reason: "原路径不在桌面根目录"
      });
      continue;
    }

    if (await pathExists(sourcePath)) {
      conflicts.push({
        path: entry.fullPath,
        sourcePath,
        reason: "原位置已有同名文件或文件夹"
      });
      continue;
    }

    try {
      await fs.rename(entry.fullPath, sourcePath);
    } catch (error) {
      errors.push({
        path: entry.fullPath,
        sourcePath,
        message: error.code ? `${error.code}: ${error.message}` : error.message
      });
      continue;
    }

    const category = resolveCategory(entry);

    if (!category) {
      unclassified.push({ path: sourcePath, reason: "无法判断分类" });
      continue;
    }

    const hideResult = await hideItem(sourcePath);
    if (!hideResult.ok) {
      errors.push({ path: sourcePath, message: hideResult.error });
    }

    const item = buildRegistryItem({
      filePath: sourcePath,
      originalPath: sourcePath,
      category,
      kind: entry.isDirectory ? "folder" : "file",
      runId: run.id,
      hiddenBefore: hideResult.ok ? hideResult.hiddenBefore : false
    });

    const registryItem = upsertOrganizedItem(organizedItems, item);
    if (registryItem) {
      addRunItem(run.id, buildHistoryItem({
        name: entry.name,
        filePath: registryItem.path,
        originalPath: registryItem.originalPath,
        category,
        kind: registryItem.kind,
        hiddenBefore: registryItem.hiddenBefore
      }));
    }

    restoredPathMap.set(destinationKey, sourcePath);
    restored.push({ from: entry.fullPath, to: sourcePath, runId: run.id });
  }

  // 冲突项留在原处，仍登记为小组件项，保证用户还能看到它们。
  for (const conflict of conflicts) {
    const entry = inventory.find((item) => item.fullPath === conflict.path);
    if (!entry) continue;

    const category = resolveCategory(entry);
    if (!category) {
      unclassified.push({ path: conflict.path, reason: "无法判断分类" });
      continue;
    }

    const destinationHit = destinationMap.get(normalizePathKey(conflict.path));
    const run = destinationHit ? destinationHit.run : null;
    const hideResult = await hideItem(conflict.path);

    if (!hideResult.ok) {
      errors.push({ path: conflict.path, message: hideResult.error });
    }

    const item = buildRegistryItem({
      filePath: conflict.path,
      originalPath: conflict.sourcePath,
      category,
      kind: entry.isDirectory ? "folder" : "file",
      runId: run ? run.id : syntheticRunId,
      hiddenBefore: hideResult.ok ? hideResult.hiddenBefore : false
    });

    const registryItem = upsertOrganizedItem(organizedItems, item);
    if (registryItem) {
      addRunItem(run ? run.id : syntheticRunId, buildHistoryItem({
        name: entry.name,
        filePath: registryItem.path,
        originalPath: registryItem.originalPath,
        category,
        kind: registryItem.kind,
        hiddenBefore: registryItem.hiddenBefore
      }));
    }
  }

  const backgroundChanges = updateFloatingBackgrounds(
    floatingConfig,
    restoredPathMap
  );

  const now = new Date().toISOString();

  for (const run of history.runs) {
    const existingItems = Array.isArray(run.items) ? run.items : [];
    const migratedItems = itemsByRun.get(run.id) || [];
    const merged = new Map();

    for (const item of [...existingItems, ...migratedItems]) {
      if (item && typeof item.path === "string") {
        merged.set(normalizePathKey(item.path), item);
      }
    }

    run.items = [...merged.values()];
    run.moves = [];
    run.movedCount = run.items.length;
  }

  const syntheticItems = itemsByRun.get(syntheticRunId) || [];

  if (syntheticItems.length > 0) {
    history.runs.push({
      id: syntheticRunId,
      createdAt: now,
      status: "active",
      movedCount: syntheticItems.length,
      desktopPath: resolvedDesktop,
      targetRoot: legacyRoot,
      logPath: null,
      moves: [],
      items: syntheticItems,
      source: "migration"
    });
  }

  const savedHistory = await saveHistory(historyPath, history, {
    maxRuns: MAX_RUNS
  });
  await saveOrganizedItems(organizedItemsPath, organizedItems);

  const leftover = await removeEmptyLegacyDirs(legacyRoot);
  const finishedAt = new Date().toISOString();
  const report = {
    version: MIGRATION_VERSION,
    status: "done",
    startedAt,
    finishedAt,
    desktopPath: resolvedDesktop,
    legacyRoot,
    backupDir,
    restored: restored.length,
    conflicts,
    duplicates,
    unmapped,
    unclassified,
    errors,
    leftover,
    historyRuns: savedHistory.runs.length,
    registryItems: Object.keys(organizedItems.items).length,
    backgroundChanges
  };

  await writeJsonFile(reportPath, report);
  await writeJsonFile(markerPath, {
    version: MIGRATION_VERSION,
    status: "done",
    startedAt,
    finishedAt,
    backupDir,
    reportPath,
    restored: restored.length,
    conflicts: conflicts.length,
    duplicates: duplicates.length,
    unmapped: unmapped.length,
    errors: errors.length
  });

  return {
    status: "done",
    state: { status: "done", backupDir, reportPath },
    report,
    organizedItems,
    floatingChanged: backgroundChanges.length > 0
  };
}

module.exports = {
  LEGACY_DIRS,
  migrateLegacyOrganizeFolder
};
