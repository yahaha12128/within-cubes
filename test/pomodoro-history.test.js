"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeSession,
  normalizeHistory,
  addFocusSession,
  buildFocusHeatmap,
  normalizeHeatmapRange,
  localDateKey
} = require("../src/pomodoro-history");

test("专注记录会校验时间、时长和目标名称", () => {
  const at = new Date(2026, 9, 21, 21, 30, 0);
  const session = normalizeSession({
    completedAt: at.toISOString(),
    minutes: 45.4,
    target: "report.pdf"
  });

  assert.equal(session.minutes, 45);
  assert.equal(session.target, "report.pdf");
  assert.equal(session.completedAt, at.toISOString());
  assert.equal(normalizeSession({ completedAt: "bad", minutes: 20 }), null);
  assert.equal(normalizeSession({ completedAt: at.toISOString(), minutes: 0 }), null);
});

test("新增专注记录会保留在历史中并可归一化", () => {
  const at = new Date(2026, 9, 21, 10, 0, 0);
  const { history, session } = addFocusSession(
    normalizeHistory({ sessions: [] }),
    { minutes: 25, target: "设计稿", completedAt: at.toISOString() }
  );

  assert.ok(session);
  assert.equal(history.sessions.length, 1);
  assert.equal(history.sessions[0].minutes, 25);
  assert.equal(normalizeHistory(history).sessions.length, 1);
});

test("热力图按本地日期聚合，并补齐无记录的日期", () => {
  const now = new Date(2026, 9, 21, 22, 0, 0);
  const sessions = [
    { minutes: 25, completedAt: new Date(2026, 9, 21, 9, 0, 0).toISOString() },
    { minutes: 45, completedAt: new Date(2026, 9, 21, 15, 0, 0).toISOString() },
    { minutes: 30, completedAt: new Date(2026, 9, 20, 20, 0, 0).toISOString() }
  ];
  const heatmap = buildFocusHeatmap(sessions, 7, now);

  assert.equal(heatmap.range, 7);
  assert.equal(heatmap.days.length, 7);
  assert.equal(heatmap.maxMinutes, 70);
  assert.equal(heatmap.totalMinutes, 100);
  assert.equal(heatmap.totalSessions, 3);
  assert.deepEqual(heatmap.days.at(-1), {
    date: "2026-10-21",
    minutes: 70,
    sessions: 2
  });
  assert.deepEqual(heatmap.days.at(-2), {
    date: "2026-10-20",
    minutes: 30,
    sessions: 1
  });
  assert.equal(heatmap.days[0].minutes, 0);
  assert.equal(localDateKey(now), "2026-10-21");
});

test("热力图范围只接受 7 天、1 月和半年", () => {
  assert.equal(normalizeHeatmapRange(7), 7);
  assert.equal(normalizeHeatmapRange(30), 30);
  assert.equal(normalizeHeatmapRange("182"), 182);
  assert.equal(normalizeHeatmapRange(90), 7);
  assert.equal(normalizeHeatmapRange("bad"), 7);
});
