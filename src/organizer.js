"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const {
  CATEGORY_DEFS,
  classifyFileName
} = require("./categories");
const { getAssignment } = require("./category-map");

const LEGACY_DIR_NAME = "桌面整理";
const IGNORED_NAMES = new Set(["desktop.ini", "thumbs.db"]);

function isIgnoredFile(name) {
  const lower = String(name || "").toLowerCase();
  return String(name || "").startsWith(".") ||
    String(name || "").startsWith("~$") ||
    IGNORED_NAMES.has(lower);
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

async function scanDesktop(desktopPath) {
  const resolvedDesktop = path.resolve(desktopPath);
  const entries = await fs.readdir(resolvedDesktop, { withFileTypes: true });
  const groups = new Map(CATEGORY_DEFS.map((category) => [category.key, []]));
  const skipped = [];

  for (const entry of entries) {
    if (entry.name === LEGACY_DIR_NAME) continue;
    if (isIgnoredFile(entry.name)) continue;

    if (entry.isDirectory()) {
      groups.get("folders").push({
        name: entry.name,
        sourcePath: path.join(resolvedDesktop, entry.name),
        extension: "",
        kind: "folder"
      });
      continue;
    }

    if (!entry.isFile()) continue;

    const classification = classifyFileName(entry.name);

    if (!classification.category) {
      skipped.push({
        name: entry.name,
        sourcePath: path.join(resolvedDesktop, entry.name),
        extension: path.extname(entry.name).toLowerCase(),
        reason: classification.reason
      });
      continue;
    }

    groups.get(classification.category).push({
      name: entry.name,
      sourcePath: path.join(resolvedDesktop, entry.name),
      extension: path.extname(entry.name).toLowerCase(),
      kind: "file"
    });
  }

  const collator = new Intl.Collator("zh-CN", { numeric: true, sensitivity: "base" });
  skipped.sort((left, right) => collator.compare(left.name, right.name));

  const categories = CATEGORY_DEFS.map((definition) => {
    const files = groups.get(definition.key);

    files.sort((left, right) => collator.compare(left.name, right.name));

    return {
      key: definition.key,
      label: definition.label,
      dirName: definition.dirName,
      files
    };
  });

  return {
    desktopPath: resolvedDesktop,
    categories,
    skipped,
    totalFiles: categories.reduce((total, category) => total + category.files.length, 0)
  };
}

// 扫描预览只展示尚未整理的文件；category-map 中已有归属的记录
// 已经在分类小组件里，不应再次出现在“扫描桌面”的结果里。
function filterOrganizedFiles(plan, categoryMap) {
  if (!plan || !Array.isArray(plan.categories) || !categoryMap) {
    return plan;
  }

  const categories = plan.categories.map((category) => ({
    ...category,
    files: Array.isArray(category.files)
      ? category.files.filter((file) => !getAssignment(categoryMap, file.sourcePath))
      : []
  }));

  return {
    ...plan,
    categories,
    totalFiles: categories.reduce(
      (total, category) => total + category.files.length,
      0
    )
  };
}

module.exports = {
  LEGACY_DIR_NAME,
  CATEGORY_DEFS,
  isIgnoredFile,
  scanDesktop,
  filterOrganizedFiles,
  getAvailablePath
};
