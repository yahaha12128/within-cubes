"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const {
  createEmptyAchievementState,
  loadAchievementDefinitions,
  normalizeAchievementState,
  recordAchievementEvent
} = require("../src/achievements");
const {
  ACHIEVEMENT_ICONS,
  ICON_MARKUP,
  getAchievementIcon
} = require("../src/achievement-icons");

const definitionsPath = path.join(__dirname, "..", "achievements.json");

test("成就字典固定为 81 条，难度与神秘数量符合要求", async () => {
  const definitions = await loadAchievementDefinitions(definitionsPath);
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };

  assert.equal(definitions.length, 81);
  assert.equal(new Set(definitions.map((item) => item.id)).size, 81);
  assert.equal(new Set(definitions.map((item) => item.name)).size, 81);

  for (const item of definitions) {
    counts[item.difficulty] += 1;
    assert.ok(item.name);
    assert.ok(item.description);
    assert.equal(item.isSecret, item.difficulty === 4);
  }

  assert.deepEqual(counts, { 1: 18, 2: 27, 3: 18, 4: 18 });
});

test("每个成就都映射了独立的 Lucide SVG 图标", () => {
  const ids = Object.keys(ACHIEVEMENT_ICONS);

  assert.equal(ids.length, 81);
  assert.equal(new Set(Object.values(ACHIEVEMENT_ICONS)).size, 81);

  for (const id of ids) {
    const icon = getAchievementIcon(id);
    assert.ok(icon.name);
    assert.match(icon.markup, /<(path|circle|rect|line|polyline|polygon)/);
    assert.ok(ICON_MARKUP[icon.name]);
  }
});

test("基础事件会解锁对应成就且不会重复", () => {
  let state = createEmptyAchievementState();
  const definitions = [
    { id: "ach-001", name: "初来乍到", difficulty: 1, description: "", isSecret: false },
    { id: "ach-002", name: "初次体检", difficulty: 1, description: "", isSecret: false },
    { id: "ach-003", name: "收纳新手", difficulty: 1, description: "", isSecret: false }
  ];

  const first = recordAchievementEvent(definitions, state, "app-open", {}, new Date("2026-10-20T10:00:00"));
  state = first.state;
  assert.deepEqual(first.unlocked.map((item) => item.id), ["ach-001"]);

  const second = recordAchievementEvent(definitions, state, "app-open", {}, new Date("2026-10-20T10:01:00"));
  state = second.state;
  assert.deepEqual(second.unlocked, []);

  state = recordAchievementEvent(definitions, state, "scan", {}, new Date("2026-10-20T10:02:00")).state;
  state = recordAchievementEvent(definitions, state, "organize", { count: 3 }, new Date("2026-10-20T10:03:00")).state;
  assert.equal(state.counters.scans, 1);
  assert.equal(state.counters.organizedFiles, 3);
  assert.ok(state.unlocked["ach-002"]);
  assert.ok(state.unlocked["ach-003"]);
});

test("累计数据、单日数据和连续使用会推进成就", () => {
  const definitions = [
    { id: "ach-023", name: "渐入佳境", difficulty: 2, description: "", isSecret: false },
    { id: "ach-033", name: "小试牛刀", difficulty: 2, description: "", isSecret: false },
    { id: "ach-035", name: "效率爆发", difficulty: 2, description: "", isSecret: false },
    { id: "ach-043", name: "大扫除", difficulty: 2, description: "", isSecret: false }
  ];
  let state = normalizeAchievementState({
    activeDays: ["2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21"],
    counters: { focusMinutes: 590, organizedFiles: 47 },
    daily: {
      "2026-10-22": { organizedFiles: 47 }
    }
  });

  const now = new Date("2026-10-22T12:00:00");
  for (let index = 0; index < 5; index += 1) {
    state = recordAchievementEvent(
      definitions,
      state,
      "pomodoro-complete",
      { minutes: 2 },
      now
    ).state;
  }
  state = recordAchievementEvent(
    definitions,
    state,
    "organize",
    { count: 3 },
    now
  ).state;

  assert.ok(state.unlocked["ach-023"]);
  assert.ok(state.unlocked["ach-033"]);
  assert.ok(state.unlocked["ach-035"]);
  assert.ok(state.unlocked["ach-043"]);
});

test("重置数据后完成新手引导会解锁隐藏成就", () => {
  const definitions = [
    { id: "ach-080", name: "再来一次", difficulty: 4, description: "", isSecret: true }
  ];
  let state = createEmptyAchievementState();
  state = recordAchievementEvent(definitions, state, "reset-performed", {}, new Date("2026-10-20T10:00:00")).state;
  assert.equal(state.unlocked["ach-080"], undefined);
  state = recordAchievementEvent(definitions, state, "onboarding-completed", {}, new Date("2026-10-20T10:01:00")).state;
  assert.ok(state.unlocked["ach-080"]);
});

test("全部 80 个成就达成后解锁最终成就", () => {
  const definitions = [
    { id: "ach-081", name: "你就是光", difficulty: 4, description: "", isSecret: true }
  ];
  const unlocked = {};
  for (let index = 1; index <= 80; index += 1) {
    unlocked[`ach-${String(index).padStart(3, "0")}`] = "2026-10-20T10:00:00.000Z";
  }

  const state = normalizeAchievementState({ unlocked });
  const result = recordAchievementEvent(definitions, state, "app-open", {}, new Date("2026-10-20T10:00:00"));
  assert.ok(result.state.unlocked["ach-081"]);
});
