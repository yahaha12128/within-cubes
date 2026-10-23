"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { normalizeNotesText } = require("./widget-data");

const NOTE_EXTENSION = ".md";
const MAX_NOTE_TITLE_LENGTH = 60;
const MAX_NOTE_LIST_TITLE_LENGTH = 15;
const MAX_NOTE_PREVIEW_LENGTH = 160;

function pad(value, length = 2) {
  return String(value).padStart(length, "0");
}

function formatFileStamp(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("") + "-" + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join("") + "-" + pad(date.getMilliseconds(), 3);
}

function noteTitle(text) {
  const firstLine = String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean) || "无标题随手记";

  return Array.from(firstLine).slice(0, MAX_NOTE_TITLE_LENGTH).join("");
}

function noteListTitle(text) {
  const firstLine = String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) return "无标题随手记";

  return Array.from(firstLine).slice(0, MAX_NOTE_LIST_TITLE_LENGTH).join("");
}

function notePreview(text) {
  const lines = String(text || "").split("\n");
  const titleIndex = lines.findIndex((line) => line.trim());

  if (titleIndex !== -1) {
    lines.splice(titleIndex, 1);
  }

  const flat = lines.join(" ").replace(/\s+/g, " ").trim();

  if (!flat) {
    return Array.from(String(text || "").replace(/\s+/g, " ").trim())
      .slice(0, MAX_NOTE_PREVIEW_LENGTH)
      .join("");
  }

  return Array.from(flat).slice(0, MAX_NOTE_PREVIEW_LENGTH).join("");
}

function noteRecord(fileName, filePath, text, savedAt) {
  return {
    id: fileName,
    name: fileName,
    title: noteTitle(text),
    listTitle: noteListTitle(text),
    preview: notePreview(text),
    text,
    savedAt: savedAt.toISOString(),
    path: filePath
  };
}

function assertNotesDirectory(directory) {
  if (typeof directory !== "string" || !directory.trim()) {
    throw new Error("随手记保存目录无效。");
  }

  return path.resolve(directory);
}

async function saveNoteEntry(directory, input, { at = new Date() } = {}) {
  const root = assertNotesDirectory(directory);
  const text = normalizeNotesText(input);

  if (!text.trim()) {
    return { ok: false, error: "没有可保存的内容。" };
  }

  await fs.mkdir(root, { recursive: true });

  const when = at instanceof Date && !Number.isNaN(at.getTime())
    ? at
    : new Date();
  const fileName = `${formatFileStamp(when)}-${randomUUID().slice(0, 8)}${NOTE_EXTENSION}`;
  const filePath = path.join(root, fileName);

  await fs.writeFile(filePath, text, "utf8");

  return {
    ok: true,
    entry: noteRecord(fileName, filePath, text, when)
  };
}

async function listNoteEntries(directory, { limit } = {}) {
  let root;

  try {
    root = assertNotesDirectory(directory);
  } catch (error) {
    return [];
  }

  let names;

  try {
    names = await fs.readdir(root);
  } catch (error) {
    return [];
  }

  // Note history is user-driven and intentionally unbounded: no automatic
  // cleanup and no implicit cap. A caller may still ask for the newest few
  // entries (the desktop card does), but the full history is always available.
  const parsedLimit = Number(limit);
  const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.max(1, Math.round(parsedLimit))
    : null;
  const candidates = [];

  for (const name of names) {
    if (!/\.(md|txt)$/i.test(name)) continue;

    const filePath = path.join(root, name);

    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) continue;
      candidates.push({ name, filePath, mtime: stat.mtime });
    } catch (error) {
      // A file disappearing between readdir and stat is not fatal.
    }
  }

  // Filenames start with a stable timestamp. Sort by name so editing or
  // overwriting an entry never changes its position in history.
  candidates.sort((left, right) => right.name.localeCompare(left.name, "zh-CN"));

  const entries = [];

  const selected = safeLimit === null
    ? candidates
    : candidates.slice(0, safeLimit);

  for (const candidate of selected) {
    try {
      const text = normalizeNotesText(await fs.readFile(candidate.filePath, "utf8"));
      entries.push(noteRecord(
        candidate.name,
        candidate.filePath,
        text,
        candidate.mtime
      ));
    } catch (error) {
      // Skip unreadable entries instead of failing the whole history.
    }
  }

  return entries;
}

function isSafeNoteId(value) {
  return typeof value === "string" &&
    value.length > 0 &&
    value === path.basename(value) &&
    /\.(md|txt)$/i.test(value);
}

async function updateNoteEntry(directory, id, input) {
  const root = assertNotesDirectory(directory);

  if (!isSafeNoteId(id)) {
    return { ok: false, error: "随手记记录无效。" };
  }

  const text = normalizeNotesText(input);

  if (!text.trim()) {
    return { ok: false, error: "没有可保存的内容。" };
  }

  const filePath = path.join(root, id);

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) throw new Error("not-a-file");
    await fs.writeFile(filePath, text, "utf8");
    const nextStat = await fs.stat(filePath);
    return {
      ok: true,
      entry: noteRecord(id, filePath, text, nextStat.mtime)
    };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return { ok: false, error: "这条随手记已经不存在。" };
    }
    return { ok: false, error: error.message || "无法保存随手记。" };
  }
}

async function renameNoteTitle(directory, id, titleInput) {
  const root = assertNotesDirectory(directory);

  if (!isSafeNoteId(id)) {
    return { ok: false, error: "随手记记录无效。" };
  }

  const title = Array.from(String(titleInput || "").replace(/[\r\n]+/g, " ").trim())
    .slice(0, MAX_NOTE_TITLE_LENGTH)
    .join("");

  if (!title) {
    return { ok: false, error: "标题不能为空。" };
  }

  const filePath = path.join(root, id);

  try {
    const text = normalizeNotesText(await fs.readFile(filePath, "utf8"));
    const lines = text.split("\n");
    const titleIndex = lines.findIndex((line) => line.trim());

    if (titleIndex === -1) {
      lines.push(title);
    } else {
      lines[titleIndex] = title;
    }

    const nextText = lines.join("\n");
    await fs.writeFile(filePath, nextText, "utf8");
    const stat = await fs.stat(filePath);

    return {
      ok: true,
      entry: noteRecord(id, filePath, nextText, stat.mtime)
    };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return { ok: false, error: "这条随手记已经不存在。" };
    }
    return { ok: false, error: error.message || "无法重命名随手记。" };
  }
}
async function deleteNoteEntry(directory, id) {
  const root = assertNotesDirectory(directory);

  if (!isSafeNoteId(id)) {
    return { ok: false, error: "随手记记录无效。" };
  }

  try {
    await fs.unlink(path.join(root, id));
    return { ok: true };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return { ok: false, error: "这条随手记已经不存在。" };
    }

    return { ok: false, error: error.message || "删除随手记失败。" };
  }
}

function getNotesDirectory(userDataDir) {
  return path.join(path.resolve(userDataDir), "notes");
}

module.exports = {
  NOTE_EXTENSION,
  MAX_NOTE_TITLE_LENGTH,
  MAX_NOTE_LIST_TITLE_LENGTH,
  MAX_NOTE_PREVIEW_LENGTH,
  getNotesDirectory,
  noteTitle,
  noteListTitle,
  notePreview,
  saveNoteEntry,
  listNoteEntries,
  updateNoteEntry,
  renameNoteTitle,
  deleteNoteEntry
};
