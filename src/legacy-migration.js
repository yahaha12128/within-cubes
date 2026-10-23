"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { classifyFileName } = require("./categories");
const { createRunId } = require("./history");
const {
  normalizePathKey,
  setAssignment
} = require("./category-map");

const LEGACY_DIR_NAME = "桌面整理";
const LEGACY_DIRS = [
  { dirName: "文件夹", fallbackCategory: "folders" },
  { dirName: "应用", fallbackCategory: "apps" },
  { dirName: "文档", fallbackCategory: "documents" },
  { dirName: "多媒体", fallbackCategory: "media" },
  { dirName: "压缩包", fallbackCategory: "archives" },
  { dirName: "图片", fallbackCategory: "media" },
  { dirName: "安装包", fallbackCategory: "apps" },
  { dirName: "其他", fallbackCategory: "documents" }
];

const IGNORED_NAMES = new Set(["desktop.ini", "thumbs.db"]);

const MIGRATION_MARKER_NAME = "migration-reference-state.json";

function isIgnoredName(name) {
  const lower = String(name || "").toLowerCase();
  return String(name || "").startsWith(".") || lower === "desktop.ini" || lower === "thumbs.db";
}

function pad(value, length = 2) {
  return String(value).padStart(length, "0");
}

function timestampForPath(date = new Date()) {
  return [
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`,
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
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

async function getAvailablePath(targetDir, fileName) {
  const parsed = path.parse(fileName);
  let candidate = path.join(targetDir, fileName);
  let index = 1;

  while (await pathExists(candidate)) {
    candidate = path.join(targetDir, `${parsed.name}(${index})${parsed.ext}`);
    index += 1;
  }

  return candidate;
}

async function listFilesRecursive(root) {
  const results = [];

  async function walk(directory, relativeDir) {
    let entries;

    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch (error) {
      return;
    }

    for (const entry of entries) {
      const relativePath = relativeDir
        ? path.join(relativeDir, entry.name)
        : entry.name;
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath, relativePath);
      } else if (entry.isFile()) {
        let size = 0;

        try {
          size = (await fs.stat(fullPath)).size;
        } catch (error) {
          size = -1;
        }

        results.push({ relativePath, size });
      }
    }
  }

  await walk(root, "");
  results.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  return results;
}

async function inspectLegacyFolder(desktopPath) {
  const resolvedDesktop = path.resolve(desktopPath);
  const legacyRoot = path.join(resolvedDesktop, LEGACY_DIR_NAME);

  if (!(await pathExists(legacyRoot))) {
    return {
      exists: false,
      empty: true,
      legacyRoot,
      desktopPath: resolvedDesktop,
      fileCount: 0,
      entryCount: 0
    };
  }

  const files = await listFilesRecursive(legacyRoot);
  let entryCount = 0;

  try {
    entryCount = (await fs.readdir(legacyRoot)).length;
  } catch (error) {
    entryCount = 0;
  }

  return {
    exists: true,
    empty: files.length === 0,
    legacyRoot,
    desktopPath: resolvedDesktop,
    fileCount: files.length,
    entryCount
  };
}

function buildBackupDir(userDataDir, date = new Date()) {
  const base = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-reference-model`;
  const backupRoot = path.join(userDataDir, "migration-backup");
  return path.join(backupRoot, base);
}

async function resolveBackupDir(userDataDir, date = new Date()) {
  const base = buildBackupDir(userDataDir, date);
  let candidate = base;
  let index = 2;

  while (await pathExists(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }

  return candidate;
}

async function copyStateFiles(stateFiles, backupDir) {
  const stateDir = path.join(backupDir, "state");
  const copied = [];

  await fs.mkdir(stateDir, { recursive: true });

  for (const filePath of Array.isArray(stateFiles) ? stateFiles : []) {
    if (typeof filePath !== "string" || !filePath) continue;

    try {
      if (!(await pathExists(filePath))) continue;
      const destination = path.join(stateDir, path.basename(filePath));
      await fs.copyFile(filePath, destination);
      copied.push({ from: filePath, to: destination });
    } catch (error) {
      throw new Error(`状态文件备份失败：${filePath}（${error.message || error}）`);
    }
  }

  return copied;
}

async function backupLegacyFolder({ legacyRoot, backupDir, stateFiles = [], now = new Date() }) {
  await fs.mkdir(backupDir, { recursive: true });

  const backupLegacyRoot = path.join(backupDir, LEGACY_DIR_NAME);

  await fs.cp(legacyRoot, backupLegacyRoot, {
    recursive: true,
    force: true
  });

  // 校验备份完整性：相对路径、文件数量、每个文件大小都必须一致。
  const sourceFiles = await listFilesRecursive(legacyRoot);
  const backupFiles = await listFilesRecursive(backupLegacyRoot);

  if (sourceFiles.length !== backupFiles.length) {
    throw new Error(
      `备份校验失败：源目录 ${sourceFiles.length} 个文件，备份中只有 ${backupFiles.length} 个。`
    );
  }

  const backupByPath = new Map(
    backupFiles.map((file) => [file.relativePath, file])
  );

  for (const file of sourceFiles) {
    const copied = backupByPath.get(file.relativePath);

    if (!copied || copied.size !== file.size) {
      throw new Error(`备份校验失败：${file.relativePath}`);
    }
  }

  const copiedStateFiles = await copyStateFiles(stateFiles, backupDir);
  const manifestPath = path.join(backupDir, "manifest.json");
  const manifest = {
    version: 1,
    createdAt: now.toISOString(),
    legacyRoot,
    backupDir,
    files: sourceFiles,
    stateFiles: copiedStateFiles
  };

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  return {
    backupDir,
    legacyRoot,
    backupLegacyRoot,
    manifestPath,
    fileCount: sourceFiles.length,
    stateFiles: copiedStateFiles,
    verified: true
  };
}

async function inventoryLegacy(legacyRoot) {
  const entries = [];
  let topEntries = [];

  try {
    topEntries = await fs.readdir(legacyRoot, { withFileTypes: true });
  } catch (error) {
    return entries;
  }

  for (const topEntry of topEntries) {
    if (isIgnoredName(topEntry.name)) continue;

    const definition = LEGACY_DIRS.find((item) => item.dirName === topEntry.name);

    if (topEntry.isDirectory() && definition) {
      let children = [];

      try {
        children = await fs.readdir(path.join(legacyRoot, topEntry.name), {
          withFileTypes: true
        });
      } catch (error) {
        children = [];
      }

      for (const child of children) {
        if (isIgnoredName(child.name)) continue;
        if (!child.isDirectory() && !child.isFile()) continue;

        entries.push({
          currentPath: path.join(legacyRoot, topEntry.name, child.name),
          name: child.name,
          kind: child.isDirectory() ? "folder" : "file",
          fallbackCategory: definition.fallbackCategory
        });
      }
      continue;
    }

    if (!topEntry.isDirectory() && !topEntry.isFile()) continue;

    entries.push({
      currentPath: path.join(legacyRoot, topEntry.name),
      name: topEntry.name,
      kind: topEntry.isDirectory() ? "folder" : "file",
      fallbackCategory: null
    });
  }

  return entries;
}

function buildHistoryMaps(history) {
  const destinationMap = new Map();

  for (const run of Array.isArray(history && history.runs) ? history.runs : []) {
    for (const move of Array.isArray(run.moves) ? run.moves : []) {
      if (
        !move ||
        typeof move.destinationPath !== "string" ||
        typeof move.sourcePath !== "string"
      ) {
        continue;
      }

      destinationMap.set(normalizePathKey(move.destinationPath), { move, run });
    }
  }

  return destinationMap;
}

function resolveCategory(entry) {
  if (entry.kind === "folder") return "folders";

  const classification = classifyFileName(entry.name);
  if (classification.category) return classification.category;

  return entry.fallbackCategory || null;
}

function buildHistoryItem({ name, filePath, category, kind, runId, at }) {
  return {
    name,
    path: filePath,
    category,
    kind,
    runId: runId || null,
    timestamp: at
  };
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
        leftovers.push({ directory, files: remaining });
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
        leftovers.push({ directory: legacyRoot, files: remaining });
      }
    }
  }

  return leftovers;
}

async function migrateLegacyFolder({
  desktopPath,
  legacyRoot,
  history,
  categoryMap,
  now = new Date()
}) {
  const resolvedDesktop = path.resolve(desktopPath);
  const syntheticRunId = createRunId();
  const destinationMap = buildHistoryMaps(history);
  const inventory = await inventoryLegacy(legacyRoot);
  const itemsByRun = new Map();
  const restored = [];
  const skipped = [];
  const errors = [];
  const unclassified = [];

  const addRunItem = (runId, item) => {
    if (!itemsByRun.has(runId)) {
      itemsByRun.set(runId, []);
    }
    itemsByRun.get(runId).push(item);
  };

  for (const entry of inventory) {
    const destinationHit = destinationMap.get(
      normalizePathKey(entry.currentPath)
    );
    let preferredPath = null;

    if (destinationHit) {
      const sourcePath = path.resolve(destinationHit.move.sourcePath);

      if (path.dirname(sourcePath) === resolvedDesktop) {
        preferredPath = sourcePath;
      }
    }

    if (!preferredPath) {
      preferredPath = path.join(resolvedDesktop, entry.name);
    }

    let targetPath = preferredPath;

    if (await pathExists(targetPath)) {
      targetPath = await getAvailablePath(resolvedDesktop, path.basename(preferredPath));
    }

    try {
      await fs.rename(entry.currentPath, targetPath);
    } catch (error) {
      errors.push({
        path: entry.currentPath,
        targetPath,
        message: error.code ? `${error.code}: ${error.message}` : error.message
      });
      continue;
    }

    const category = resolveCategory(entry);

    if (!category) {
      unclassified.push({ path: targetPath, name: entry.name });
      restored.push({ from: entry.currentPath, to: targetPath, category: null });
      continue;
    }

    const runId = destinationHit ? destinationHit.run.id : syntheticRunId;
    const result = setAssignment(categoryMap, {
      path: targetPath,
      name: path.basename(targetPath),
      category,
      kind: entry.kind,
      runId,
      source: "migration",
      at: now
    });

    if (result.changed) {
      addRunItem(runId, buildHistoryItem({
        name: path.basename(targetPath),
        filePath: targetPath,
        category,
        kind: entry.kind,
        runId,
        at: now.toISOString()
      }));
    }

    restored.push({ from: entry.currentPath, to: targetPath, category });
  }

  for (const run of Array.isArray(history && history.runs) ? history.runs : []) {
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
    run.itemCount = run.items.length;
  }

  const syntheticItems = itemsByRun.get(syntheticRunId) || [];

  if (syntheticItems.length > 0 && history) {
    history.runs.push({
      id: syntheticRunId,
      createdAt: now.toISOString(),
      status: "active",
      itemCount: syntheticItems.length,
      movedCount: syntheticItems.length,
      desktopPath: resolvedDesktop,
      logPath: null,
      moves: [],
      items: syntheticItems,
      source: "migration"
    });

    if (Array.isArray(history.runs)) {
      const limit = 10;
      if (history.runs.length > limit) {
        history.runs = history.runs.slice(-limit);
      }
    }
  }

  const leftover = await removeEmptyLegacyDirs(legacyRoot);

  return {
    restored: restored.length,
    skipped,
    errors,
    unclassified,
    leftover,
    restoredItems: restored,
    syntheticRunId,
    itemCount: restored.filter((item) => item.category).length
  };
}

async function runLegacyMigration({
  desktopPath,
  userDataDir,
  stateFiles = [],
  categoryMap,
  history,
  backupDir = null,
  now = new Date()
}) {
  const resolvedDesktop = path.resolve(desktopPath);
  const legacyRoot = path.join(resolvedDesktop, LEGACY_DIR_NAME);
  const info = await inspectLegacyFolder(resolvedDesktop);

  if (!info.exists) {
    return {
      status: "not-needed",
      reason: "no-legacy-folder",
      legacyRoot,
      categoryMap,
      history
    };
  }

  if (info.empty) {
    const leftover = await removeEmptyLegacyDirs(legacyRoot);

    return {
      status: "not-needed",
      reason: "empty-legacy-folder",
      legacyRoot,
      leftover,
      categoryMap,
      history
    };
  }

  const targetBackupDir = backupDir || await resolveBackupDir(userDataDir, now);
  const backup = await backupLegacyFolder({
    legacyRoot,
    backupDir: targetBackupDir,
    stateFiles,
    now
  });

  if (!backup.verified) {
    throw new Error("备份未通过校验，已停止迁移。");
  }

  const report = await migrateLegacyFolder({
    desktopPath: resolvedDesktop,
    legacyRoot,
    history,
    categoryMap,
    now
  });

  return {
    status: "done",
    backup,
    report,
    categoryMap,
    history
  };
}

function getMigrationMarkerPath(userDataDir) {
  return path.join(userDataDir, MIGRATION_MARKER_NAME);
}

async function readMigrationMarker(userDataDir) {
  try {
    const raw = await fs.readFile(getMigrationMarkerPath(userDataDir), "utf8");
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

async function writeMigrationMarker(userDataDir, state) {
  const markerPath = getMigrationMarkerPath(userDataDir);
  const temporaryPath = `${markerPath}.tmp`;

  await fs.mkdir(path.dirname(markerPath), { recursive: true });
  await fs.writeFile(temporaryPath, JSON.stringify(state, null, 2), "utf8");
  await fs.rename(temporaryPath, markerPath);

  return markerPath;
}

module.exports = {
  LEGACY_DIR_NAME,
  LEGACY_DIRS,
  MIGRATION_MARKER_NAME,
  buildBackupDir,
  resolveBackupDir,
  backupLegacyFolder,
  inspectLegacyFolder,
  inventoryLegacy,
  listFilesRecursive,
  migrateLegacyFolder,
  runLegacyMigration,
  getMigrationMarkerPath,
  readMigrationMarker,
  writeMigrationMarker
};
