"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const CLIPBOARD_HISTORY_VERSION = 1;
const MAX_CLIPBOARD_ENTRIES = 10;

function normalizeClipboardText(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n?/g, "\n");
}

function normalizeCopiedAt(value) {
  if (typeof value !== "string" || !value.trim()) return new Date().toISOString();

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizeClipboardEntries(value) {
  const source = Array.isArray(value) ? value : [];
  const seen = new Set();
  const entries = [];

  for (const item of source) {
    if (!item || typeof item !== "object") continue;

    const text = normalizeClipboardText(item.text);

    // Empty clipboard text is never worth a history row, and an exact
    // duplicate is represented by the newest occurrence only.
    if (!text.trim() || seen.has(text)) continue;

    seen.add(text);
    entries.push({
      id: typeof item.id === "string" && item.id.trim()
        ? item.id.trim()
        : randomUUID(),
      text,
      copiedAt: normalizeCopiedAt(item.copiedAt)
    });

    if (entries.length >= MAX_CLIPBOARD_ENTRIES) break;
  }

  return entries;
}

function createEmptyClipboardHistory() {
  return {
    version: CLIPBOARD_HISTORY_VERSION,
    entries: []
  };
}

function normalizeClipboardHistory(data) {
  const source = data && typeof data === "object" ? data : {};

  return {
    version: CLIPBOARD_HISTORY_VERSION,
    entries: normalizeClipboardEntries(source.entries)
  };
}

function addClipboardEntry(history, text, { at = new Date() } = {}) {
  const content = normalizeClipboardText(text);
  const entries = normalizeClipboardEntries(history && history.entries);

  if (!content.trim()) {
    return { changed: false, entries };
  }

  const existing = entries.find((entry) => entry.text === content);
  const changed = !entries.some(
    (entry, index) => index === 0 && entry.text === content
  );

  const next = entries.filter((entry) => entry.text !== content);
  next.unshift({
    id: existing ? existing.id : randomUUID(),
    text: content,
    copiedAt: normalizeCopiedAt(
      at instanceof Date && !Number.isNaN(at.getTime())
        ? at.toISOString()
        : new Date().toISOString()
    )
  });

  return {
    changed,
    entries: next.slice(0, MAX_CLIPBOARD_ENTRIES)
  };
}

function removeClipboardEntry(history, id) {
  const entries = normalizeClipboardEntries(history && history.entries);
  const next = entries.filter((entry) => entry.id !== id);

  return {
    changed: next.length !== entries.length,
    entries: next
  };
}

async function loadClipboardHistory(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return normalizeClipboardHistory(JSON.parse(raw));
  } catch (error) {
    return createEmptyClipboardHistory();
  }
}

async function saveClipboardHistory(filePath, history) {
  const normalized = normalizeClipboardHistory(history);
  const directory = path.dirname(filePath);
  const temporaryPath = `${filePath}.tmp`;

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(temporaryPath, JSON.stringify(normalized, null, 2), "utf8");
  await fs.rename(temporaryPath, filePath);

  return normalized;
}

module.exports = {
  CLIPBOARD_HISTORY_VERSION,
  MAX_CLIPBOARD_ENTRIES,
  normalizeClipboardText,
  normalizeClipboardEntries,
  createEmptyClipboardHistory,
  normalizeClipboardHistory,
  addClipboardEntry,
  removeClipboardEntry,
  loadClipboardHistory,
  saveClipboardHistory
};
