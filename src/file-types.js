"use strict";

const path = require("node:path");

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
  ".tif",
  ".tiff",
  ".ico",
  ".heic",
  ".heif",
  ".avif"
]);

const DOCUMENT_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
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

const INSTALLER_EXTENSIONS = new Set([
  ".exe",
  ".msi",
  ".msix",
  ".msixbundle",
  ".appx",
  ".appxbundle",
  ".apk",
  ".dmg",
  ".pkg"
]);

const AUDIO_EXTENSIONS = new Set([
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
  ".midi"
]);

const VIDEO_EXTENSIONS = new Set([
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

const CODE_EXTENSIONS = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".json",
  ".html",
  ".htm",
  ".css",
  ".scss",
  ".less",
  ".py",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".cs",
  ".go",
  ".rs",
  ".rb",
  ".php",
  ".sh",
  ".ps1",
  ".bat",
  ".cmd",
  ".yml",
  ".yaml",
  ".toml",
  ".xml",
  ".sql"
]);

const SHORTCUT_EXTENSIONS = new Set([".lnk", ".url", ".appref-ms"]);

const SYSTEM_ICON_EXTENSIONS = new Set([
  ...IMAGE_EXTENSIONS,
  ".lnk",
  ".url",
  ".appref-ms",
  ".exe"
]);

const TYPE_ORDER = [
  "folder",
  "image",
  "document",
  "archive",
  "installer",
  "audio",
  "video",
  "code",
  "shortcut",
  "other",
  "system"
];

function getExtension(fileName) {
  return path.extname(String(fileName || "")).toLowerCase();
}

function getFileType(fileName) {
  const extension = getExtension(fileName);

  if (SHORTCUT_EXTENSIONS.has(extension)) return "shortcut";
  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  if (DOCUMENT_EXTENSIONS.has(extension)) return "document";
  if (ARCHIVE_EXTENSIONS.has(extension)) return "archive";
  if (INSTALLER_EXTENSIONS.has(extension)) return "installer";
  if (AUDIO_EXTENSIONS.has(extension)) return "audio";
  if (VIDEO_EXTENSIONS.has(extension)) return "video";
  if (CODE_EXTENSIONS.has(extension)) return "code";
  return "other";
}

function usesSystemIcon(fileName) {
  return SYSTEM_ICON_EXTENSIONS.has(getExtension(fileName));
}

function getTypeRank(type) {
  const index = TYPE_ORDER.indexOf(type);
  return index === -1 ? TYPE_ORDER.length : index;
}

module.exports = {
  IMAGE_EXTENSIONS,
  DOCUMENT_EXTENSIONS,
  ARCHIVE_EXTENSIONS,
  INSTALLER_EXTENSIONS,
  AUDIO_EXTENSIONS,
  VIDEO_EXTENSIONS,
  CODE_EXTENSIONS,
  SHORTCUT_EXTENSIONS,
  TYPE_ORDER,
  getExtension,
  getFileType,
  usesSystemIcon,
  getTypeRank
};
