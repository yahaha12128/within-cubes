"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getSmartThemeState,
  getSolarTermForDate,
  getHolidayForDate,
  normalizeSmartThemeSettings
} = require("../src/smart-theme");

test("智能主题按早晨、下午、夜间切换时段色", () => {
  const morning = getSmartThemeState(
    new Date(2026, 9, 21, 8, 0, 0),
    { enabled: true, timeRhythm: true, seasonal: false }
  );
  const afternoon = getSmartThemeState(
    new Date(2026, 9, 21, 14, 0, 0),
    { enabled: true, timeRhythm: true, seasonal: false }
  );
  const evening = getSmartThemeState(
    new Date(2026, 9, 21, 18, 30, 0),
    { enabled: true, timeRhythm: true, seasonal: false }
  );
  const night = getSmartThemeState(
    new Date(2026, 9, 21, 22, 0, 0),
    { enabled: true, timeRhythm: true, seasonal: false }
  );

  assert.equal(morning.period.key, "morning");
  assert.equal(morning.color, "#4f9d75");
  assert.equal(afternoon.period.key, "afternoon");
  assert.equal(afternoon.color, "#d9822b");
  assert.equal(evening.period.key, "evening");
  assert.equal(evening.color, "#e07a35");
  assert.equal(night.period.key, "night");
  assert.equal(night.color, "#7b6cc4");
  assert.equal(morning.source, "time");
});

test("二十四节气使用本地公式匹配常见日期", () => {
  assert.equal(getSolarTermForDate(new Date(2026, 1, 4)).name, "立春");
  assert.equal(getSolarTermForDate(new Date(2026, 3, 5)).name, "清明");
  assert.equal(getSolarTermForDate(new Date(2026, 6, 23)).name, "大暑");
  assert.equal(getSolarTermForDate(new Date(2026, 9, 23)).name, "霜降");
  assert.equal(getSolarTermForDate(new Date(2026, 11, 22)).name, "冬至");
  assert.equal(getSolarTermForDate(new Date(2026, 9, 22)), null);
});

test("本地节日表覆盖春节、端午、中秋和固定节假日", () => {
  assert.equal(getHolidayForDate(new Date(2026, 1, 17)).name, "春节");
  assert.equal(getHolidayForDate(new Date(2026, 5, 19)).name, "端午节");
  assert.equal(getHolidayForDate(new Date(2026, 8, 25)).name, "中秋节");
  assert.equal(getHolidayForDate(new Date(2026, 9, 1)).name, "国庆节");
  assert.equal(getHolidayForDate(new Date(2026, 0, 1)).name, "元旦");
  assert.equal(getHolidayForDate(new Date(2026, 9, 21)), null);
});

test("节日/节气优先于时间节律，关闭智能感知后不再输出颜色", () => {
  const festival = getSmartThemeState(
    new Date(2026, 1, 17, 9, 0, 0),
    { enabled: true, timeRhythm: true, seasonal: true }
  );

  assert.equal(festival.source, "holiday");
  assert.equal(festival.label.includes("春节"), true);
  assert.equal(festival.color, "#d6342c");

  const disabled = getSmartThemeState(
    new Date(2026, 1, 17, 9, 0, 0),
    { enabled: false, timeRhythm: true, seasonal: true }
  );

  assert.equal(disabled.source, "none");
  assert.equal(disabled.color, null);
  assert.equal(disabled.label, "智能感知已关闭");
});

test("智能主题设置只保留布尔字段并补齐默认值", () => {
  assert.deepEqual(normalizeSmartThemeSettings({ enabled: 1, timeRhythm: 0 }), {
    enabled: true,
    timeRhythm: false,
    seasonal: true
  });

  assert.deepEqual(normalizeSmartThemeSettings(null), {
    enabled: false,
    timeRhythm: true,
    seasonal: true
  });
});
