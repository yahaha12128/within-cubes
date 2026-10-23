"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { CATEGORY_KEYS } = require("./categories");

const HISTORY_VERSION = 3;
const MAX_RUNS = 10;
const MAX_LEGACY_RUNS = 200;
const MAX_ROLLBACKS = 200;
const RUN_STATUSES = new Set(["active", "undone", "rolledBack", "empty"]);
const CATEGORY_SET = new Set(CATEGORY_KEYS);

function createEmptyHistory() {
  return {
    version: HISTORY_VERSION,
    runs: [],
    rollbacks: []
  };
}

function normalizeRunItem(item) {
  if (!item || typeof item.path !== "string") return null;

  const filePath = item.path.trim();
  if (!filePath) return null;

  return {
    ...item,
    name: typeof item.name === "string" && item.name.trim()
      ? item.name.trim()
      : path.basename(filePath),
    path: filePath,
    category: CATEGORY_SET.has(item.category) ? item.category : null,
    kind: item.kind === "folder" ? "folder" : "file",
    runId: typeof item.runId === "string" && item.runId ? item.runId : null,
    timestamp: typeof item.timestamp === "string"
      ? item.timestamp
      : new Date(0).toISOString()
  };
}

function normalizeMove(move) {
  if (!move || typeof move.sourcePath !== "string") return null;

  return {
    name: typeof move.name === "string" ? move.name : path.basename(move.sourcePath),
    sourcePath: move.sourcePath,
    destinationPath: typeof move.destinationPath === "string"
      ? move.destinationPath
      : null,
    timestamp: typeof move.timestamp === "string"
      ? move.timestamp
      : new Date(0).toISOString()
  };
}

function normalizeHistory(data, { maxRuns = MAX_RUNS } = {}) {
  const history = createEmptyHistory();

  if (!data || typeof data !== "object") {
    return history;
  }

  if (Array.isArray(data.runs)) {
    let runs = data.runs
      .filter((run) => {
        return run &&
          typeof run.id === "string" &&
          (Array.isArray(run.moves) || Array.isArray(run.items));
      })
      .map((run) => {
        const moves = Array.isArray(run.moves)
          ? run.moves.map(normalizeMove).filter(Boolean)
          : [];
        const items = Array.isArray(run.items)
          ? run.items.map(normalizeRunItem).filter(Boolean)
          : [];
        const itemCount = Number.isFinite(run.itemCount)
          ? run.itemCount
          : items.length;

        return {
          ...run,
          createdAt: run.createdAt || new Date(0).toISOString(),
          moves,
          items,
          itemCount,
          movedCount: Number.isFinite(run.movedCount)
            ? run.movedCount
            : itemCount,
          status: RUN_STATUSES.has(run.status) ? run.status : "active"
        };
      });

    if (Number.isFinite(maxRuns)) {
      runs = runs.slice(-maxRuns);
    }

    history.runs = runs;
  }

  if (Array.isArray(data.rollbacks)) {
    history.rollbacks = data.rollbacks.slice(-MAX_ROLLBACKS);
  }

  return history;
}

async function loadHistory(historyPath, { maxRuns = MAX_RUNS } = {}) {
  try {
    const raw = await fs.readFile(historyPath, "utf8");
    return normalizeHistory(JSON.parse(raw), { maxRuns });
  } catch (error) {
    return createEmptyHistory();
  }
}

async function saveHistory(historyPath, history, { maxRuns = MAX_RUNS } = {}) {
  const normalized = normalizeHistory(history, { maxRuns });
  const directory = path.dirname(historyPath);
  const temporaryPath = `${historyPath}.tmp`;

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(temporaryPath, JSON.stringify(normalized, null, 2), "utf8");
  await fs.rename(temporaryPath, historyPath);

  return normalized;
}

function createRunId() {
  return `run-${crypto.randomUUID()}`;
}

function createRollbackId() {
  return `rollback-${crypto.randomUUID()}`;
}

function getRunItems(run) {
  return run && Array.isArray(run.items) ? run.items : [];
}

function getLatestActiveRun(history) {
  for (let index = history.runs.length - 1; index >= 0; index -= 1) {
    const run = history.runs[index];
    const itemCount = getRunItems(run).length;

    if (run.status === "active" && itemCount > 0) {
      return run;
    }
  }

  return null;
}

module.exports = {
  HISTORY_VERSION,
  MAX_LEGACY_RUNS,
  MAX_RUNS,
  MAX_ROLLBACKS,
  RUN_STATUSES,
  createEmptyHistory,
  normalizeHistory,
  loadHistory,
  saveHistory,
  createRunId,
  createRollbackId,
  getLatestActiveRun,
  getRunItems
};
