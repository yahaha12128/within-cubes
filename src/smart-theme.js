"use strict";

// Smart rhythm theme. Everything is local: time-of-day periods, the 24 solar
// terms (computed with the standard 21st-century formula) and the main Chinese
// festival ranges for 2025-2027.

const TIME_PERIODS = [
  { key: "morning", label: "晨间", start: 5, end: 11, color: "#4f9d75" },
  { key: "afternoon", label: "午后", start: 11, end: 17, color: "#d9822b" },
  { key: "evening", label: "傍晚", start: 17, end: 21, color: "#e07a35" },
  { key: "night", label: "夜间", start: 21, end: 5, color: "#7b6cc4" }
];

// C is the per-term constant for the 21st century. Terms in January and
// February use the previous-leap-year correction.
const SOLAR_TERMS = [
  { key: "xiaohan", name: "小寒", month: 1, c: 5.4055, special: true, color: "#6b8fb5" },
  { key: "dahan", name: "大寒", month: 1, c: 20.12, special: true, color: "#5b6f9e" },
  { key: "lichun", name: "立春", month: 2, c: 3.87, special: true, color: "#7fb069" },
  { key: "yushui", name: "雨水", month: 2, c: 18.73, special: true, color: "#68a6a1" },
  { key: "jingzhe", name: "惊蛰", month: 3, c: 5.63, color: "#8a9a4a" },
  { key: "chunfen", name: "春分", month: 3, c: 20.646, color: "#6fae7a" },
  { key: "qingming", name: "清明", month: 4, c: 4.81, color: "#8fb68c" },
  { key: "guyu", name: "谷雨", month: 4, c: 20.1, color: "#5f9e78" },
  { key: "lixia", name: "立夏", month: 5, c: 5.52, color: "#7cae58" },
  { key: "xiaoman", name: "小满", month: 5, c: 21.04, color: "#9bbf4f" },
  { key: "mangzhong", name: "芒种", month: 6, c: 5.678, color: "#b0a53c" },
  { key: "xiazhi", name: "夏至", month: 6, c: 21.37, color: "#e0a33a" },
  { key: "xiaoshu", name: "小暑", month: 7, c: 7.108, color: "#e07a35" },
  { key: "dashu", name: "大暑", month: 7, c: 22.83, color: "#e2553d" },
  { key: "liqiu", name: "立秋", month: 8, c: 7.5, color: "#c98a45" },
  { key: "chushu", name: "处暑", month: 8, c: 23.13, color: "#b8743b" },
  { key: "bailu", name: "白露", month: 9, c: 7.646, color: "#b9a98a" },
  { key: "qiufen", name: "秋分", month: 9, c: 23.042, color: "#c9a34a" },
  { key: "hanlu", name: "寒露", month: 10, c: 8.318, color: "#b58a3c" },
  { key: "shuangjiang", name: "霜降", month: 10, c: 23.438, color: "#d6a63b" },
  { key: "lidong", name: "立冬", month: 11, c: 7.438, color: "#8a7f6a" },
  { key: "xiaoxue", name: "小雪", month: 11, c: 22.36, color: "#8fa0a8" },
  { key: "daxue", name: "大雪", month: 12, c: 7.18, color: "#7c93a8" },
  { key: "dongzhi", name: "冬至", month: 12, c: 21.94, color: "#6f7f9e" }
];

// Multi-day holiday ranges (local dates). Lunar festival dates are listed for
// 2025-2027 so the feature works offline without a calendar API.
const HOLIDAY_RANGES = [
  { name: "春节", start: "2025-01-28", end: "2025-02-04", color: "#d6342c" },
  { name: "端午节", start: "2025-05-31", end: "2025-06-02", color: "#4f9d75" },
  { name: "中秋节", start: "2025-10-06", end: "2025-10-08", color: "#d6a63b" },
  { name: "春节", start: "2026-02-16", end: "2026-02-22", color: "#d6342c" },
  { name: "端午节", start: "2026-06-19", end: "2026-06-21", color: "#4f9d75" },
  { name: "中秋节", start: "2026-09-25", end: "2026-09-27", color: "#d6a63b" },
  { name: "春节", start: "2027-02-05", end: "2027-02-11", color: "#d6342c" },
  { name: "端午节", start: "2027-06-09", end: "2027-06-11", color: "#4f9d75" },
  { name: "中秋节", start: "2027-09-15", end: "2027-09-17", color: "#d6a63b" }
];

const FIXED_HOLIDAY_RANGES = [
  { name: "元旦", startMonth: 1, startDay: 1, endMonth: 1, endDay: 1, color: "#c94c4c" },
  { name: "劳动节", startMonth: 5, startDay: 1, endMonth: 5, endDay: 5, color: "#d9822b" },
  { name: "国庆节", startMonth: 10, startDay: 1, endMonth: 10, endDay: 7, color: "#c0392b" }
];

const DEFAULT_SMART_THEME = {
  enabled: false,
  timeRhythm: true,
  seasonal: true
};

function pad2(value) {
  return String(value).padStart(2, "0");
}

function dateKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function isHexColor(value) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function getInkColor(color) {
  if (!isHexColor(color)) return "#ffffff";

  const value = parseInt(color.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;

  return luminance > 0.62 ? "#1d241f" : "#ffffff";
}

function normalizeSmartThemeSettings(data) {
  const source = data && typeof data === "object" ? data : {};

  return {
    enabled: source.enabled === undefined
      ? DEFAULT_SMART_THEME.enabled
      : Boolean(source.enabled),
    timeRhythm: source.timeRhythm === undefined
      ? DEFAULT_SMART_THEME.timeRhythm
      : Boolean(source.timeRhythm),
    seasonal: source.seasonal === undefined
      ? DEFAULT_SMART_THEME.seasonal
      : Boolean(source.seasonal)
  };
}

function getTimePeriod(date) {
  const hour = date.getHours();

  return TIME_PERIODS.find((period) => (
    period.start < period.end
      ? hour >= period.start && hour < period.end
      : hour >= period.start || hour < period.end
  )) || TIME_PERIODS[0];
}

function getSolarTermDay(year, term) {
  const shortYear = year % 100;
  const leapYears = Math.floor(
    (term.special ? shortYear - 1 : shortYear) / 4
  );
  const day = Math.floor(shortYear * 0.2422 + term.c) - leapYears;

  return Math.max(1, Math.min(31, day));
}

function getSolarTermForDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  for (const term of SOLAR_TERMS) {
    if (term.month !== month) continue;
    if (getSolarTermDay(year, term) !== day) continue;

    return {
      key: term.key,
      name: term.name,
      color: term.color,
      label: `${term.name} · 节气`
    };
  }

  return null;
}

function getFixedHolidayForDate(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  for (const holiday of FIXED_HOLIDAY_RANGES) {
    const inRange = holiday.startMonth === holiday.endMonth
      ? month === holiday.startMonth && day >= holiday.startDay && day <= holiday.endDay
      : (month === holiday.startMonth && day >= holiday.startDay) ||
        (month === holiday.endMonth && day <= holiday.endDay);

    if (inRange) {
      return {
        key: `holiday-${holiday.name}`,
        name: holiday.name,
        color: holiday.color,
        label: `${holiday.name} · 节日`
      };
    }
  }

  return null;
}

function getHolidayForDate(date) {
  const key = dateKey(date);

  for (const holiday of HOLIDAY_RANGES) {
    if (key >= holiday.start && key <= holiday.end) {
      return {
        key: `holiday-${holiday.name}`,
        name: holiday.name,
        color: holiday.color,
        label: `${holiday.name} · 节日`
      };
    }
  }

  return getFixedHolidayForDate(date);
}

function getSmartThemeState(date = new Date(), smartTheme = DEFAULT_SMART_THEME) {
  const config = normalizeSmartThemeSettings(smartTheme);
  const period = getTimePeriod(date);
  const holiday = config.seasonal ? getHolidayForDate(date) : null;
  const solarTerm = config.seasonal ? getSolarTermForDate(date) : null;
  let source = "none";
  let label = "已关闭";
  let color = null;

  if (holiday) {
    source = "holiday";
    label = holiday.label;
    color = holiday.color;
  } else if (solarTerm) {
    source = "solar-term";
    label = solarTerm.label;
    color = solarTerm.color;
  } else if (config.timeRhythm) {
    source = "time";
    label = `${period.label} · 时段`;
    color = period.color;
  }

  if (!config.enabled) {
    source = "none";
    label = "智能感知已关闭";
    color = null;
  }

  return {
    enabled: config.enabled,
    timeRhythm: config.timeRhythm,
    seasonal: config.seasonal,
    source,
    label,
    color,
    ink: getInkColor(color),
    period: {
      key: period.key,
      label: period.label,
      color: period.color
    },
    holiday,
    solarTerm,
    dateKey: dateKey(date)
  };
}

function getSmartThemeSignature(state) {
  return [
    state.enabled ? "1" : "0",
    state.source,
    state.label,
    state.color || ""
  ].join("|");
}

module.exports = {
  DEFAULT_SMART_THEME,
  TIME_PERIODS,
  SOLAR_TERMS,
  HOLIDAY_RANGES,
  FIXED_HOLIDAY_RANGES,
  normalizeSmartThemeSettings,
  getTimePeriod,
  getSolarTermForDate,
  getHolidayForDate,
  getSmartThemeState,
  getSmartThemeSignature,
  getInkColor
};
