"use strict";

const path = require("node:path");

const CATEGORY_DEFS = [
  {
    key: "folders",
    label: "文件夹",
    dirName: "文件夹"
  },
  {
    key: "apps",
    label: "应用图标或快捷方式",
    dirName: "应用"
  },
  {
    key: "documents",
    label: "文档",
    dirName: "文档"
  },
  {
    key: "media",
    label: "图片或音频等多媒体",
    dirName: "多媒体"
  },
  {
    key: "archives",
    label: "压缩包",
    dirName: "压缩包"
  }
];

const CATEGORY_KEYS = CATEGORY_DEFS.map((category) => category.key);
const CATEGORY_BY_KEY = new Map(CATEGORY_DEFS.map((category) => [category.key, category]));

const APP_EXTENSIONS = new Set([
  ".exe",
  ".lnk",
  ".url",
  ".appref-ms",
  ".msi",
  ".msix",
  ".msixbundle",
  ".appx",
  ".appxbundle",
  ".apk",
  ".dmg",
  ".pkg"
]);

const DOCUMENT_EXTENSIONS = new Set([
  ".doc",
  ".docx",
  ".pdf",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".md",
  ".rtf",
  ".csv",
  ".odt",
  ".ods",
  ".odp",
  ".epub",
  ".mobi",
  ".pages",
  ".numbers",
  ".key"
]);

const MEDIA_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
  ".tif",
  ".tiff",
  ".ico",
  ".heic",
  ".heif",
  ".avif",
  ".mp3",
  ".wav",
  ".flac",
  ".aac",
  ".ogg",
  ".m4a",
  ".wma",
  ".opus",
  ".aiff",
  ".mid",
  ".midi",
  ".mp4",
  ".mkv",
  ".avi",
  ".mov",
  ".wmv",
  ".webm",
  ".flv",
  ".m4v",
  ".mpeg",
  ".mpg",
  ".ts",
  ".3gp"
]);

const ARCHIVE_EXTENSIONS = new Set([
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
  ".bz2",
  ".xz",
  ".tgz",
  ".cab",
  ".iso"
]);

const EXTENSION_TO_CATEGORY = new Map();

APP_EXTENSIONS.forEach((extension) => EXTENSION_TO_CATEGORY.set(extension, "apps"));
DOCUMENT_EXTENSIONS.forEach((extension) => EXTENSION_TO_CATEGORY.set(extension, "documents"));
MEDIA_EXTENSIONS.forEach((extension) => EXTENSION_TO_CATEGORY.set(extension, "media"));
ARCHIVE_EXTENSIONS.forEach((extension) => EXTENSION_TO_CATEGORY.set(extension, "archives"));

function getExtension(fileName) {
  return path.extname(String(fileName || "")).toLowerCase();
}

function classifyFileName(fileName) {
  const extension = getExtension(fileName);

  if (!extension) {
    return {
      category: null,
      reason: "没有扩展名"
    };
  }

  const category = EXTENSION_TO_CATEGORY.get(extension);

  if (!category) {
    return {
      category: null,
      reason: `扩展名 ${extension} 不在支持列表`
    };
  }

  return {
    category,
    reason: null
  };
}

function classifyDirectory() {
  return { category: "folders", reason: null };
}

function getCategoryDef(key) {
  return CATEGORY_BY_KEY.get(key) || null;
}

function isSupportedCategory(key) {
  return CATEGORY_BY_KEY.has(key);
}

module.exports = {
  CATEGORY_DEFS,
  CATEGORY_KEYS,
  APP_EXTENSIONS,
  DOCUMENT_EXTENSIONS,
  MEDIA_EXTENSIONS,
  ARCHIVE_EXTENSIONS,
  getExtension,
  classifyFileName,
  classifyDirectory,
  getCategoryDef,
  isSupportedCategory
};
