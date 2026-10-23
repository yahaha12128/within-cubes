"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const ACHIEVEMENT_STATE_VERSION = 1;
const MAX_DAY_HISTORY = 4500;

const COUNTER_KEYS = [
  "appOpens",
  "scans",
  "organizedRuns",
  "organizedFiles",
  "tagGroupsCreated",
  "tagGroupSplits",
  "groupMaxFiles",
  "pomodoroStarts",
  "focusSessions",
  "focusMinutes",
  "longestPomodoroMinutes",
  "todosAdded",
  "todosCompleted",
  "notesSaved",
  "clipboardCopies",
  "customBackgrounds",
  "tintChanges",
  "privacyUses",
  "layoutMoves",
  "searchUses",
  "recycleFiles",
  "folderMappings",
  "aboutViews",
  "iconPackImports",
  "layoutExports",
  "externalDrops",
  "clipboardNotes",
  "gridCopyPaste",
  "timeCapsuleRestores",
  "shortcuts",
  "smartThemeApplications",
  "previewUses",
  "customSortUses",
  "privacyFocusMinutes",
  "depthFocusMinutes",
  "fileBounces",
  "nativeIconlessPercent"
];

function pad(value) {
  return String(value).padStart(2, "0");
}

function dateKey(date) {
  const value = date instanceof Date ? date : new Date(date);
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function dateNumber(key) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ""));
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86400000;
}

function toPositiveNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function uniqueStrings(value, limit = 1000) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const result = [];
  for (const item of value) {
    if (typeof item !== "string" || !item || seen.has(item)) continue;
    seen.add(item);
    result.push(item);
    if (result.length >= limit) break;
  }
  return result;
}

function normalizeDaily(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};

  const result = {};
  const keys = Object.keys(data)
    .filter((key) => dateNumber(key) !== null)
    .sort()
    .slice(-MAX_DAY_HISTORY);

  for (const key of keys) {
    const source = data[key] && typeof data[key] === "object" ? data[key] : {};
    result[key] = {
      organizedFiles: toPositiveNumber(source.organizedFiles),
      focusMinutes: toPositiveNumber(source.focusMinutes),
      focusSessions: toPositiveNumber(source.focusSessions),
      privacyToggles: toPositiveNumber(source.privacyToggles),
      cleanDesktop: Boolean(source.cleanDesktop)
    };
  }

  return result;
}

function normalizeSecret(data) {
  const source = data && typeof data === "object" ? data : {};
  return {
    clockBack: Boolean(source.clockBack),
    clockForward: Boolean(source.clockForward),
    pendingClockBack: Boolean(source.pendingClockBack),
    systemRecycleDragged: Boolean(source.systemRecycleDragged),
    searchEgg: Boolean(source.searchEgg),
    rapidToggle: Boolean(source.rapidToggle),
    rapidPrivacy: Boolean(source.rapidPrivacy),
    allGridsSame: Boolean(source.allGridsSame),
    rainbowOrder: Boolean(source.rainbowOrder),
    alignedComponents: Boolean(source.alignedComponents),
    blackMinimal: Boolean(source.blackMinimal),
    clockMusicGroup: Boolean(source.clockMusicGroup),
    halfOffscreen: Boolean(source.halfOffscreen),
    minimalistFocus: Boolean(source.minimalistFocus),
    nightPomodoro: Boolean(source.nightPomodoro),
    resetAndOnboarding: Boolean(source.resetAndOnboarding),
    renameTarget: typeof source.renameTarget === "string"
      ? source.renameTarget
      : "",
    renameStreak: toPositiveNumber(source.renameStreak),
    lastRenameAt: typeof source.lastRenameAt === "string"
      ? source.lastRenameAt
      : "",
    rapidToggleKey: typeof source.rapidToggleKey === "string"
      ? source.rapidToggleKey
      : "",
    rapidToggleStartedAt: toPositiveNumber(source.rapidToggleStartedAt),
    rapidToggleCount: toPositiveNumber(source.rapidToggleCount),
    privacyToggleTimes: Array.isArray(source.privacyToggleTimes)
      ? source.privacyToggleTimes
          .map((value) => Number(value))
          .filter(Number.isFinite)
          .slice(-40)
      : []
  };
}

function createEmptyAchievementState(now = new Date()) {
  return {
    version: ACHIEVEMENT_STATE_VERSION,
    createdAt: now.toISOString(),
    lastEventAt: "",
    resetPending: false,
    unlocked: {},
    activeDays: [],
    daily: {},
    counters: Object.fromEntries(COUNTER_KEYS.map((key) => [key, 0])),
    uniqueTagGroups: [],
    enabledWidgetKinds: [],
    colorTaggedPaths: [],
    secret: normalizeSecret(null)
  };
}

function normalizeAchievementState(data, now = new Date()) {
  const fallback = createEmptyAchievementState(now);
  const source = data && typeof data === "object" ? data : {};
  const counters = source.counters && typeof source.counters === "object"
    ? source.counters
    : {};

  const activeDays = uniqueStrings(source.activeDays)
    .filter((key) => dateNumber(key) !== null)
    .sort()
    .slice(-MAX_DAY_HISTORY);

  const unlocked = {};
  if (source.unlocked && typeof source.unlocked === "object") {
    for (const [id, value] of Object.entries(source.unlocked)) {
      if (typeof id === "string" && typeof value === "string" && value) {
        unlocked[id] = value;
      }
    }
  }

  return {
    version: ACHIEVEMENT_STATE_VERSION,
    createdAt: typeof source.createdAt === "string"
      ? source.createdAt
      : fallback.createdAt,
    lastEventAt: typeof source.lastEventAt === "string"
      ? source.lastEventAt
      : "",
    resetPending: Boolean(source.resetPending),
    unlocked,
    activeDays,
    daily: normalizeDaily(source.daily),
    counters: Object.fromEntries(COUNTER_KEYS.map((key) => [
      key,
      toPositiveNumber(counters[key])
    ])),
    uniqueTagGroups: uniqueStrings(source.uniqueTagGroups, 200),
    enabledWidgetKinds: uniqueStrings(source.enabledWidgetKinds, 100),
    colorTaggedPaths: uniqueStrings(source.colorTaggedPaths, 1000),
    secret: normalizeSecret(source.secret)
  };
}

function addActiveDay(state, now) {
  const key = dateKey(now);
  if (!state.activeDays.includes(key)) {
    state.activeDays.push(key);
    state.activeDays.sort();
    if (state.activeDays.length > MAX_DAY_HISTORY) {
      state.activeDays = state.activeDays.slice(-MAX_DAY_HISTORY);
    }
  }
  return key;
}

function ensureDaily(state, key) {
  if (!state.daily[key]) {
    state.daily[key] = {
      organizedFiles: 0,
      focusMinutes: 0,
      focusSessions: 0,
      privacyToggles: 0,
      cleanDesktop: false
    };
  }
  return state.daily[key];
}

function getUseStreak(activeDays) {
  const values = activeDays
    .map(dateNumber)
    .filter((value) => value !== null)
    .sort((left, right) => left - right);
  let best = 0;
  let current = 0;
  let previous = null;

  for (const value of values) {
    current = previous !== null && value === previous + 1 ? current + 1 : 1;
    best = Math.max(best, current);
    previous = value;
  }

  return best;
}

function getDailyStreak(daily, predicate) {
  const values = Object.keys(daily)
    .filter((key) => predicate(daily[key] || {}))
    .map(dateNumber)
    .filter((value) => value !== null)
    .sort((left, right) => left - right);
  let best = 0;
  let current = 0;
  let previous = null;

  for (const value of values) {
    current = previous !== null && value === previous + 1 ? current + 1 : 1;
    best = Math.max(best, current);
    previous = value;
  }

  return best;
}

function getMaxDaily(daily, key) {
  return Object.values(daily).reduce(
    (maximum, day) => Math.max(maximum, toPositiveNumber(day && day[key])),
    0
  );
}

function getConditionMap(state) {
  const counters = state.counters;
  const daily = state.daily;
  const secret = state.secret;
  const useStreak = getUseStreak(state.activeDays);
  const focusDayStreak = getDailyStreak(
    daily,
    (day) => toPositiveNumber(day.focusSessions) >= 8
  );
  const cleanDayStreak = getDailyStreak(
    daily,
    (day) => Boolean(day.cleanDesktop)
  );
  const maxDailyOrganized = getMaxDaily(daily, "organizedFiles");
  const maxDailyFocusMinutes = getMaxDaily(daily, "focusMinutes");
  const maxDailyFocusSessions = getMaxDaily(daily, "focusSessions");

  return {
    "ach-001": () => counters.appOpens >= 1,
    "ach-002": () => counters.scans >= 1,
    "ach-003": () => counters.organizedRuns >= 1,
    "ach-004": () => counters.tagGroupsCreated >= 1,
    "ach-005": () => counters.pomodoroStarts >= 1,
    "ach-006": () => counters.focusSessions >= 1,
    "ach-007": () => counters.todosAdded >= 1,
    "ach-008": () => counters.todosCompleted >= 1,
    "ach-009": () => counters.notesSaved >= 1,
    "ach-010": () => counters.clipboardCopies >= 1,
    "ach-011": () => counters.customBackgrounds >= 1,
    "ach-012": () => counters.tintChanges >= 1,
    "ach-013": () => counters.privacyUses >= 1,
    "ach-014": () => counters.layoutMoves >= 1,
    "ach-015": () => counters.searchUses >= 1,
    "ach-016": () => counters.recycleFiles >= 1,
    "ach-017": () => counters.folderMappings >= 1,
    "ach-018": () => counters.aboutViews >= 1,
    "ach-019": () => counters.organizedFiles >= 100,
    "ach-020": () => counters.organizedFiles >= 500,
    "ach-021": () => counters.organizedFiles >= 1000,
    "ach-022": () => counters.organizedFiles >= 5000,
    "ach-023": () => counters.focusMinutes >= 10 * 60,
    "ach-024": () => counters.focusMinutes >= 50 * 60,
    "ach-025": () => counters.focusMinutes >= 100 * 60,
    "ach-026": () => state.uniqueTagGroups.length >= 5,
    "ach-027": () => counters.tagGroupSplits >= 10,
    "ach-028": () => counters.todosAdded >= 50,
    "ach-029": () => counters.todosCompleted >= 50,
    "ach-030": () => counters.notesSaved >= 20,
    "ach-031": () => counters.privacyUses >= 10,
    "ach-032": () => counters.smartThemeApplications >= 20,
    "ach-033": () => useStreak >= 7,
    "ach-034": () => useStreak >= 30,
    "ach-035": () => maxDailyFocusSessions >= 5,
    "ach-036": () => counters.longestPomodoroMinutes > 90,
    "ach-037": () => counters.shortcuts >= 100,
    "ach-038": () => counters.iconPackImports >= 1,
    "ach-039": () => counters.layoutExports >= 1,
    "ach-040": () => counters.externalDrops >= 10,
    "ach-041": () => counters.clipboardNotes >= 10,
    "ach-042": () => counters.gridCopyPaste >= 50,
    "ach-043": () => maxDailyOrganized >= 50,
    "ach-044": () => state.enabledWidgetKinds.length >= 5,
    "ach-045": () => counters.timeCapsuleRestores >= 10,
    "ach-046": () => useStreak >= 1000,
    "ach-047": () => useStreak >= 1825,
    "ach-048": () => counters.organizedFiles >= 50000,
    "ach-049": () => counters.focusMinutes >= 1000 * 60,
    "ach-050": () => counters.focusMinutes >= 5000 * 60,
    "ach-051": () => maxDailyFocusMinutes >= 16 * 60,
    "ach-052": () => focusDayStreak >= 100,
    "ach-053": () => counters.groupMaxFiles > 500,
    "ach-054": () => cleanDayStreak >= 365,
    "ach-055": () => counters.shortcuts >= 100000,
    "ach-056": () => counters.recycleFiles >= 10000,
    "ach-057": () => (
      state.colorTaggedPaths.length >= 100 &&
      counters.customSortUses >= 1
    ),
    "ach-058": () => counters.depthFocusMinutes >= 100 * 60,
    "ach-059": () => counters.previewUses >= 10000,
    "ach-060": () => counters.layoutExports >= 100,
    "ach-061": () => counters.privacyFocusMinutes >= 100 * 60,
    "ach-062": () => counters.nativeIconlessPercent >= 99,
    "ach-063": () => counters.folderMappings > 50,
    "ach-064": () => secret.clockBack,
    "ach-065": () => secret.clockForward,
    "ach-066": () => secret.systemRecycleDragged,
    "ach-067": () => secret.searchEgg,
    "ach-068": () => secret.rapidToggle,
    "ach-069": () => counters.fileBounces >= 10,
    "ach-070": () => secret.rapidPrivacy,
    "ach-071": () => secret.renameStreak >= 10,
    "ach-072": () => secret.allGridsSame,
    "ach-073": () => secret.rainbowOrder,
    "ach-074": () => secret.alignedComponents,
    "ach-075": () => secret.blackMinimal,
    "ach-076": () => secret.clockMusicGroup,
    "ach-077": () => secret.halfOffscreen,
    "ach-078": () => secret.minimalistFocus,
    "ach-079": () => secret.nightPomodoro,
    "ach-080": () => secret.resetAndOnboarding,
    "ach-081": () => Object.keys(state.unlocked).length >= 80
  };
}

function updateStateFromEvent(state, type, payload, now, today) {
  const counters = state.counters;
  const daily = ensureDaily(state, today);
  const secret = state.secret;
  const amount = Math.max(0, Math.round(toPositiveNumber(
    payload && payload.count !== undefined ? payload.count : 1
  )));

  switch (type) {
    case "app-open":
      counters.appOpens += 1;
      break;
    case "clock-back":
      secret.pendingClockBack = true;
      break;
    case "scan":
      counters.scans += Math.max(1, amount);
      break;
    case "organize":
      counters.organizedRuns += 1;
      counters.organizedFiles += amount;
      daily.organizedFiles += amount;
      if (secret.pendingClockBack) {
        secret.clockBack = true;
        secret.pendingClockBack = false;
      }
      break;
    case "group-created":
      counters.tagGroupsCreated += 1;
      if (payload && typeof payload.groupId === "string" && payload.groupId) {
        if (!state.uniqueTagGroups.includes(payload.groupId)) {
          state.uniqueTagGroups.push(payload.groupId);
        }
      }
      break;
    case "group-split":
      counters.tagGroupSplits += 1;
      break;
    case "group-files":
      counters.groupMaxFiles = Math.max(
        counters.groupMaxFiles,
        toPositiveNumber(payload && payload.count)
      );
      break;
    case "pomodoro-start": {
      counters.pomodoroStarts += 1;
      secret.nightPomodoro = secret.nightPomodoro ||
        (now.getHours() === 3);
      break;
    }
    case "pomodoro-complete": {
      const minutes = Math.max(0, Math.round(toPositiveNumber(payload && payload.minutes)));
      counters.focusSessions += 1;
      counters.focusMinutes += minutes;
      counters.longestPomodoroMinutes = Math.max(
        counters.longestPomodoroMinutes,
        minutes
      );
      daily.focusSessions += 1;
      daily.focusMinutes += minutes;
      if (payload && payload.withDepthAndMusic) {
        counters.depthFocusMinutes += minutes;
      }
      if (payload && payload.privacyActive) {
        counters.privacyFocusMinutes += minutes;
      }
      break;
    }
    case "todo-added":
      counters.todosAdded += Math.max(1, amount);
      break;
    case "todo-completed":
      counters.todosCompleted += Math.max(1, amount);
      break;
    case "note-saved":
      counters.notesSaved += Math.max(1, amount);
      if (
        state.lastEventAt &&
        now.getTime() - new Date(state.lastEventAt).getTime() > 24 * 60 * 60 * 1000
      ) {
        secret.clockForward = true;
      }
      break;
    case "clipboard-copy":
      counters.clipboardCopies += 1;
      break;
    case "custom-background":
      counters.customBackgrounds += 1;
      break;
    case "tint-change":
      counters.tintChanges += 1;
      break;
    case "privacy-toggle":
      if (!payload || payload.active !== false) {
        counters.privacyUses += 1;
        daily.privacyToggles += 1;
        const timestamp = now.getTime();
        secret.privacyToggleTimes.push(timestamp);
        secret.privacyToggleTimes = secret.privacyToggleTimes
          .filter((value) => timestamp - value <= 60000)
          .slice(-30);
        if (
          payload &&
          payload.focusRunning &&
          secret.privacyToggleTimes.length >= 10
        ) {
          secret.rapidPrivacy = true;
        }
      }
      break;
    case "layout-move":
      counters.layoutMoves += 1;
      break;
    case "search-used":
      counters.searchUses += 1;
      break;
    case "search-secret-query":
      secret.searchEgg = true;
      break;
    case "recycle-files":
      counters.recycleFiles += Math.max(1, amount);
      break;
    case "folder-mapping":
      counters.folderMappings += 1;
      break;
    case "about-view":
      counters.aboutViews += 1;
      break;
    case "icon-pack-import":
      counters.iconPackImports += 1;
      break;
    case "layout-export":
      counters.layoutExports += 1;
      break;
    case "external-drag":
      counters.externalDrops += Math.max(1, amount);
      break;
    case "clipboard-note":
      counters.clipboardNotes += 1;
      break;
    case "grid-copy-paste":
      counters.gridCopyPaste += Math.max(1, amount);
      break;
    case "time-capsule-restore":
      counters.timeCapsuleRestores += 1;
      break;
    case "shortcut-used":
      counters.shortcuts += Math.max(1, amount);
      break;
    case "smart-theme-applied":
      counters.smartThemeApplications += 1;
      break;
    case "component-enabled":
      if (payload && typeof payload.key === "string" &&
          payload.key && !state.enabledWidgetKinds.includes(payload.key)) {
        state.enabledWidgetKinds.push(payload.key);
      }
      break;
    case "component-toggle": {
      const key = payload && typeof payload.key === "string" ? payload.key : "";
      if (!key) break;
      if (
        secret.rapidToggleKey === key &&
        now.getTime() - secret.rapidToggleStartedAt <= 10000
      ) {
        secret.rapidToggleCount += 1;
      } else {
        secret.rapidToggleKey = key;
        secret.rapidToggleStartedAt = now.getTime();
        secret.rapidToggleCount = 1;
      }
      if (secret.rapidToggleCount >= 20) secret.rapidToggle = true;
      break;
    }
    case "rename": {
      const key = payload && typeof payload.key === "string" ? payload.key : "";
      if (!key) break;
      const lastAt = secret.lastRenameAt
        ? new Date(secret.lastRenameAt).getTime()
        : 0;
      if (secret.renameTarget === key && now.getTime() - lastAt <= 30 * 60000) {
        secret.renameStreak += 1;
      } else {
        secret.renameTarget = key;
        secret.renameStreak = 1;
      }
      secret.lastRenameAt = now.toISOString();
      break;
    }
    case "all-grids-same":
      secret.allGridsSame = true;
      break;
    case "rainbow-order":
      secret.rainbowOrder = true;
      break;
    case "aligned-components":
      if (toPositiveNumber(payload && payload.count) >= 5) {
        secret.alignedComponents = true;
      }
      break;
    case "black-minimal":
      secret.blackMinimal = true;
      break;
    case "clock-music-group":
      secret.clockMusicGroup = true;
      break;
    case "half-offscreen":
      secret.halfOffscreen = true;
      break;
    case "minimalist-focus":
      secret.minimalistFocus = true;
      break;
    case "system-recycle-dragged":
      secret.systemRecycleDragged = true;
      break;
    case "file-bounce":
      counters.fileBounces += 1;
      break;
    case "desktop-clean-check":
      daily.cleanDesktop = toPositiveNumber(payload && payload.count) === 0;
      break;
    case "custom-sort":
      counters.customSortUses += 1;
      break;
    case "color-tags":
      for (const filePath of uniqueStrings(payload && payload.paths, 1000)) {
        if (!state.colorTaggedPaths.includes(filePath)) {
          state.colorTaggedPaths.push(filePath);
        }
      }
      state.colorTaggedPaths = state.colorTaggedPaths.slice(-1000);
      break;
    case "native-iconless-percent":
      counters.nativeIconlessPercent = Math.max(
        counters.nativeIconlessPercent,
        Math.min(100, toPositiveNumber(payload && payload.percent))
      );
      break;
    case "preview-used":
      counters.previewUses += Math.max(1, amount);
      break;
    case "reset-performed":
      secret.resetAndOnboarding = false;
      state.resetPending = true;
      break;
    case "onboarding-completed":
      if (state.resetPending) secret.resetAndOnboarding = true;
      break;
    default:
      break;
  }
}

function loadAchievementDefinitions(filePath) {
  return fs.readFile(filePath, "utf8").then((raw) => {
    const parsed = JSON.parse(raw);
    const definitions = Array.isArray(parsed) ? parsed : parsed.achievements;

    if (!Array.isArray(definitions) || definitions.length !== 81) {
      throw new Error("achievements.json 必须包含 81 个成就。");
    }

    return definitions.map((entry, index) => ({
      id: typeof entry.id === "string" && entry.id
        ? entry.id
        : `ach-${String(index + 1).padStart(3, "0")}`,
      name: String(entry.name || ""),
      difficulty: Math.max(1, Math.min(4, Number(entry.difficulty) || 1)),
      description: String(entry.description || ""),
      isSecret: Boolean(entry.isSecret)
    }));
  });
}

function loadAchievementState(filePath, now = new Date()) {
  return fs.readFile(filePath, "utf8")
    .then((raw) => normalizeAchievementState(JSON.parse(raw), now))
    .catch(() => createEmptyAchievementState(now));
}

async function saveAchievementState(filePath, state, now = new Date()) {
  const normalized = normalizeAchievementState(state, now);
  const directory = path.dirname(filePath);
  const temporaryPath = `${filePath}.tmp`;

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(
    temporaryPath,
    JSON.stringify(normalized, null, 2),
    "utf8"
  );
  await fs.rename(temporaryPath, filePath);
  return normalized;
}

function recordAchievementEvent(
  definitions,
  state,
  type,
  payload = {},
  now = new Date()
) {
  const normalized = normalizeAchievementState(state, now);
  const previousEventAt = normalized.lastEventAt
    ? new Date(normalized.lastEventAt)
    : null;

  if (
    previousEventAt &&
    now.getTime() < previousEventAt.getTime() - 5 * 60 * 1000
  ) {
    normalized.secret.pendingClockBack = true;
  }

  const today = addActiveDay(normalized, now);
  updateStateFromEvent(normalized, type, payload || {}, now, today);
  normalized.lastEventAt = now.toISOString();

  const conditions = getConditionMap(normalized);
  const unlocked = [];

  for (const definition of definitions) {
    if (normalized.unlocked[definition.id]) continue;
    const condition = conditions[definition.id];
    if (typeof condition === "function" && condition()) {
      normalized.unlocked[definition.id] = now.toISOString();
      unlocked.push(definition);
    }
  }

  return {
    state: normalized,
    unlocked
  };
}

function buildAchievementSnapshot(definitions, state, iconResolver) {
  const normalized = normalizeAchievementState(state);
  return {
    total: definitions.length,
    unlockedCount: definitions.filter((item) => normalized.unlocked[item.id]).length,
    achievements: definitions.map((definition) => ({
      ...definition,
      unlocked: Boolean(normalized.unlocked[definition.id]),
      unlockedAt: normalized.unlocked[definition.id] || "",
      icon: typeof iconResolver === "function"
        ? iconResolver(definition.id)
        : null
    }))
  };
}

module.exports = {
  ACHIEVEMENT_STATE_VERSION,
  COUNTER_KEYS,
  createEmptyAchievementState,
  normalizeAchievementState,
  loadAchievementDefinitions,
  loadAchievementState,
  saveAchievementState,
  recordAchievementEvent,
  buildAchievementSnapshot,
  getUseStreak
};
