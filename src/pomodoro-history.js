"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const HISTORY_VERSION = 1;
const MAX_SESSIONS = 10000;
const MAX_TARGET_LENGTH = 120;
const VALID_RANGES = new Set([7, 30, 182]);

function pad(value) {
  return String(value).padStart(2, "0");
}

function localDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function normalizeSession(value) {
  if (!value || typeof value !== "object") return null;

  const completedAt = new Date(value.completedAt);
  if (Number.isNaN(completedAt.getTime())) return null;

  const minutes = Math.round(Number(value.minutes));
  if (!Number.isFinite(minutes) || minutes <= 0) return null;

  const startedAtRaw = new Date(value.startedAt);
  const startedAt = Number.isNaN(startedAtRaw.getTime())
    ? new Date(completedAt.getTime() - minutes * 60 * 1000)
    : startedAtRaw;

  return {
    id: typeof value.id === "string" && value.id
      ? value.id
      : `focus-${randomUUID()}`,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    minutes: Math.max(1, Math.min(240, minutes)),
    target: typeof value.target === "string"
      ? Array.from(value.target).slice(0, MAX_TARGET_LENGTH).join("")
      : ""
  };
}

function createEmptyHistory() {
  return {
    version: HISTORY_VERSION,
    sessions: []
  };
}

function normalizeHistory(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.sessions)) {
    return createEmptyHistory();
  }

  const sessions = data.sessions
    .map(normalizeSession)
    .filter(Boolean)
    .sort((left, right) => (
      new Date(left.completedAt).getTime() - new Date(right.completedAt).getTime()
    ))
    .slice(-MAX_SESSIONS);

  return {
    version: HISTORY_VERSION,
    sessions
  };
}

async function loadPomodoroHistory(historyPath) {
  try {
    const raw = await fs.readFile(historyPath, "utf8");
    return normalizeHistory(JSON.parse(raw));
  } catch (error) {
    return createEmptyHistory();
  }
}

async function savePomodoroHistory(historyPath, history) {
  const normalized = normalizeHistory(history);
  const directory = path.dirname(historyPath);
  const temporaryPath = `${historyPath}.tmp`;

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(temporaryPath, JSON.stringify(normalized, null, 2), "utf8");
  await fs.rename(temporaryPath, historyPath);

  return normalized;
}

function addFocusSession(history, input, now = new Date()) {
  const target = normalizeHistory(history);
  const session = normalizeSession({
    ...input,
    completedAt: input && input.completedAt ? input.completedAt : now.toISOString()
  });

  if (!session) return { history: target, session: null };

  target.sessions.push(session);

  if (target.sessions.length > MAX_SESSIONS) {
    target.sessions = target.sessions.slice(-MAX_SESSIONS);
  }

  return { history: target, session };
}

function normalizeHeatmapRange(value) {
  const range = Math.round(Number(value));
  return VALID_RANGES.has(range) ? range : 7;
}

function buildFocusHeatmap(sessions, range = 7, now = new Date()) {
  const daysCount = normalizeHeatmapRange(range);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - daysCount + 1);
  const buckets = new Map();
  const startTime = start.getTime();

  for (const session of Array.isArray(sessions) ? sessions : []) {
    const completed = new Date(session.completedAt);
    if (Number.isNaN(completed.getTime())) continue;
    if (completed.getTime() < startTime) continue;

    const key = localDateKey(completed);
    const current = buckets.get(key) || { minutes: 0, sessions: 0 };
    current.minutes += Math.max(0, Number(session.minutes) || 0);
    current.sessions += 1;
    buckets.set(key, current);
  }

  const days = [];
  let totalMinutes = 0;
  let totalSessions = 0;
  let maxMinutes = 0;

  for (let index = 0; index < daysCount; index += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    const key = localDateKey(date);
    const bucket = buckets.get(key) || { minutes: 0, sessions: 0 };

    totalMinutes += bucket.minutes;
    totalSessions += bucket.sessions;
    maxMinutes = Math.max(maxMinutes, bucket.minutes);
    days.push({
      date: key,
      minutes: bucket.minutes,
      sessions: bucket.sessions
    });
  }

  return {
    range: daysCount,
    days,
    totalMinutes,
    totalSessions,
    maxMinutes
  };
}

module.exports = {
  HISTORY_VERSION,
  MAX_SESSIONS,
  VALID_RANGES,
  localDateKey,
  normalizeSession,
  createEmptyHistory,
  normalizeHistory,
  loadPomodoroHistory,
  savePomodoroHistory,
  addFocusSession,
  normalizeHeatmapRange,
  buildFocusHeatmap
};
