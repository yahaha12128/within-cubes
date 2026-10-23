"use strict";

const { execFile, spawn } = require("node:child_process");
const crypto = require("node:crypto");
const fsNative = require("node:fs");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL, fileURLToPath } = require("node:url");
const { promisify } = require("node:util");
const {
  app,
  BrowserWindow,
  Menu,
  clipboard,
  dialog,
  globalShortcut,
  ipcMain,
  nativeImage,
  nativeTheme,
  net,
  Notification,
  screen,
  shell,
  systemPreferences,
  Tray
} = require("electron");
const { scanDesktop, filterOrganizedFiles } = require("./src/organizer");
const { writeOrganizeLog, writeRollbackLog, writeAssignLog } = require("./src/logger");
const { rollbackRuns } = require("./src/rollback");
const {
  CATEGORY_DEFS,
  CATEGORY_KEYS,
  getCategoryDef
} = require("./src/categories");
const {
  computeContentSize,
  computeCategoryWindowSize,
  getGridSizeFromWindow,
  scanFloatingCategories,
  scanFolderEntries,
  buildFloatingState,
  fileKey,
  DEFAULT_ROWS,
  DEFAULT_COLS,
  MIN_ROWS,
  MAX_ROWS,
  MIN_COLS,
  MAX_COLS,
  MIN_CATEGORY_WINDOW_WIDTH,
  MIN_CATEGORY_WINDOW_HEIGHT,
  MIN_WIDGET_WIDTH,
  MIN_WIDGET_HEIGHT,
  DRAGBAR_HEIGHT
} = require("./src/floating");
const { getFileType, usesSystemIcon } = require("./src/file-types");
const {
  CLOCK_DATE_FORMATS,
  CLOCK_TIME_FORMATS,
  COLLAPSE_MODES,
  DEFAULT_COLLAPSE_MODE,
  SORT_MODES,
  DEFAULT_SORT_MODE,
  DEFAULT_CUSTOM_TINT,
  MAX_CLOCK_TEXT_LENGTH,
  TINTS,
  UI_BACKGROUND_TYPES,
  WIDGET_DEFS,
  WIDGET_GRID_GAP,
  loadFloatingConfig,
  normalizeClockSettings,
  normalizeConfig,
  normalizeCustomTint,
  normalizeName,
  normalizeUiBackground,
  saveFloatingConfig
} = require("./src/floating-config");
const {
  getSmartThemeState,
  getSmartThemeSignature,
  normalizeSmartThemeSettings
} = require("./src/smart-theme");
const {
  loadHistory,
  saveHistory,
  createRunId,
  createRollbackId,
  getLatestActiveRun,
  MAX_RUNS,
  MAX_ROLLBACKS
} = require("./src/history");
const {
  createEmptyCategoryMap,
  loadCategoryMap,
  saveCategoryMap,
  normalizePathKey,
  getAssignment,
  getCategory,
  listAssignments,
  setAssignment,
  removeAssignment,
  removeAssignmentsByCategory,
  undoManualAssignment,
  getManualUndoStatus
} = require("./src/category-map");
const {
  focusEmbeddedWindow,
  getCursorWindowInfo,
  getForegroundWindowInfo,
  getNativeWindowHandle,
  isNativeAvailable,
  isPrimaryButtonDown,
  isPrivacyShortcutDown,
  isShellWindowClass,
  moveWindowToBottom,
  releaseEmbeddedWindowFocus
} = require("./src/window-layer");
const {
  attachWindowToDesktop,
  getDesktopIconState,
  getWindowScreenRect,
  setDesktopIconsVisible,
  setWindowScreenRect,
  toParentClientRect
} = require("./src/workerw");
const {
  resolveBackupDir,
  inspectLegacyFolder,
  runLegacyMigration,
  writeMigrationMarker
} = require("./src/legacy-migration");
const { computeSnap, SNAP_THRESHOLD } = require("./src/snap");
const {
  MAX_TODO_ITEMS,
  normalizeNotesText,
  normalizeTodoText,
  normalizeTodoDate,
  normalizeTodoTime,
  sortTodosBySchedule,
  normalizeWidgetData,
  createDefaultWidgetData,
  createTodo,
  loadWidgetData,
  saveWidgetData
} = require("./src/widget-data");
const { selectTodosForExport, todosToCsv, parseTodosCsv } = require("./src/todo-csv");
const { MediaSessionWatcher } = require("./src/media-session");
const {
  createEmptyAchievementState,
  loadAchievementDefinitions,
  loadAchievementState,
  saveAchievementState,
  recordAchievementEvent,
  buildAchievementSnapshot
} = require("./src/achievements");
const { getAchievementIcon } = require("./src/achievement-icons");
const {
  SHORTCUT_ACTIONS,
  DEFAULT_SHORTCUTS,
  displayAccelerator,
  normalizeAccelerator,
  normalizeShortcutSettings,
  validateShortcutMap,
  getShortcutActions
} = require("./src/shortcuts");
const { getSystemIconTarget } = require("./src/system-icons");
const {
  getNotesDirectory,
  saveNoteEntry,
  listNoteEntries,
  updateNoteEntry,
  renameNoteTitle,
  deleteNoteEntry
} = require("./src/note-store");
const {
  MAX_CLIPBOARD_ENTRIES,
  createEmptyClipboardHistory,
  addClipboardEntry,
  removeClipboardEntry,
  loadClipboardHistory,
  saveClipboardHistory
} = require("./src/clipboard-history");
const {
  loadFileTags,
  saveFileTags,
  getFileTag,
  setFileTag,
  FILE_COLOR_TAGS
} = require("./src/file-tags");
const {
  loadCategoryMappings,
  saveCategoryMappings,
  getMappedFolder,
  setMappedFolder
} = require("./src/category-mappings");
const {
  loadQuickAccess,
  saveQuickAccess,
  addQuickFile,
  removeQuickFile,
  clearQuickFiles,
  MAX_QUICK_FILES
} = require("./src/quick-access");
const {
  ACCENT_COLORS,
  loadComponentAppearance,
  saveComponentAppearance,
  getComponentAccent,
  setComponentAccent
} = require("./src/component-appearance");
const {
  GROUP_MIN_WIDTH,
  GROUP_MIN_HEIGHT,
  GROUP_MAX_WIDTH,
  GROUP_MAX_HEIGHT,
  findGroupForCategory,
  chooseGroupCategory,
  groupCategoryForFile
} = require("./src/tab-groups");
const { analyzePomodoroFile } = require("./src/pomodoro-time");
const { isTimeCapsule } = require("./src/time-capsule");
const {
  loadPomodoroHistory,
  savePomodoroHistory,
  addFocusSession,
  buildFocusHeatmap,
  normalizeHeatmapRange,
  createEmptyHistory
} = require("./src/pomodoro-history");
const { buildNoteFromFiles, buildTodoText } = require("./src/file-cards");
const { readSystemCalendar } = require("./src/system-calendar");

const execFileAsync = promisify(execFile);

/* ------------------------------------------------------------------
 * 全局异常兜底
 * 打包后没有控制台，异常必须落到文件里，并且主动提醒用户重启。
 * 这里只做「记录 + 通知」，不退出进程，尽量让用户还有机会保存手头的事。
 * ------------------------------------------------------------------ */

const CRASH_LOG_MAX_BYTES = 1024 * 1024; // 单文件上限 1MB，超了轮转成 .1
const CRASH_NOTIFY_INTERVAL = 30 * 1000; // 30 秒内只弹一次，避免刷屏
let lastCrashNotifyAt = 0;

/** 日志目录候选：开发用项目 logs/，打包/权限不足时退到 userData，最后退到临时目录。 */
function getCrashLogDirs() {
  const dirs = [];

  try {
    dirs.push(getLogDir());
  } catch (_error) {
    // getLogDir 依赖 __dirname，极端情况下可能不可用
  }

  try {
    dirs.push(path.join(app.getPath("userData"), "logs"));
  } catch (_error) {
    // app 尚未就绪时忽略
  }

  dirs.push(path.join(os.tmpdir(), "within-cubes-logs"));
  return Array.from(new Set(dirs));
}

function formatCrashEntry(kind, error) {
  const stamp = new Date().toISOString();
  const detail =
    error instanceof Error
      ? error.stack || `${error.name}: ${error.message}`
      : String(error);

  return `[${stamp}] ${kind}\n${detail}\n\n`;
}

/** 同步写入崩溃日志（异步 API 在异常路径里可能来不及执行）。 */
function writeCrashLog(kind, error) {
  const entry = formatCrashEntry(kind, error);

  for (const dir of getCrashLogDirs()) {
    try {
      fsNative.mkdirSync(dir, { recursive: true });

      const logPath = path.join(dir, "crash.log");
      if (fsNative.existsSync(logPath) && fsNative.statSync(logPath).size > CRASH_LOG_MAX_BYTES) {
        try {
          fsNative.renameSync(logPath, `${logPath}.1`);
        } catch (_error) {
          // 轮转失败就直接往后追加，别因为清理动作把日志丢了
        }
      }

      fsNative.appendFileSync(logPath, entry, "utf8");
      return logPath;
    } catch (_error) {
      // 换下一个候选目录
    }
  }

  return "";
}

function notifyCrash(logPath) {
  const now = Date.now();
  if (now - lastCrashNotifyAt < CRASH_NOTIFY_INTERVAL) return;
  lastCrashNotifyAt = now;

  try {
    if (typeof Notification !== "function" || !Notification.isSupported()) return;

    new Notification({
      title: "方寸格遇到了一点问题",
      body: logPath
        ? `错误已记录到 ${path.basename(logPath)}，建议重启应用。`
        : "程序内部出现了异常，建议重启应用。",
      silent: true
    }).show();
  } catch (_error) {
    // 通知失败不影响日志
  }
}

function reportFatalError(kind, error) {
  console.error(`[crash] ${kind}:`, error);

  const logPath = writeCrashLog(kind, error);
  notifyCrash(logPath);
}

process.on("uncaughtException", (error) => {
  reportFatalError("uncaughtException", error);
});

process.on("unhandledRejection", (reason) => {
  reportFatalError("unhandledRejection", reason);
});

app.commandLine.appendSwitch("wm-window-animations-disabled");
app.setName("方寸格");
// Windows 任务栏、开始菜单和通知都按这个 AppUserModelID 归组，
// 只有显式设置后，打包后的快捷方式才会稳定显示应用图标。
app.setAppUserModelId("com.within.cubes");

if (app.isPackaged && !process.env.WINDOWS_MEDIA_SESSIONS_BACKEND) {
  const packagedMediaBackend = path.join(
    process.resourcesPath,
    "windows-media-sessions-backend.exe"
  );

  if (fsNative.existsSync(packagedMediaBackend)) {
    process.env.WINDOWS_MEDIA_SESSIONS_BACKEND = packagedMediaBackend;
  }
}

// Keep existing settings when the app was previously named desktop-organizer.
if (!process.env.ORGANIZER_USER_DATA_DIR) {
  try {
    const currentUserDataDir = app.getPath("userData");
    const legacyUserDataDir = path.join(
      path.dirname(currentUserDataDir),
      "desktop-organizer"
    );

    if (
      currentUserDataDir !== legacyUserDataDir &&
      !fsNative.existsSync(currentUserDataDir) &&
      fsNative.existsSync(legacyUserDataDir)
    ) {
      fsNative.cpSync(legacyUserDataDir, currentUserDataDir, {
        recursive: true
      });
    }
  } catch (error) {
    console.warn("[app] 迁移旧用户数据失败:", error.message || error);
  }
}

if (process.env.ORGANIZER_USER_DATA_DIR) {
  const userDataDir = path.resolve(process.env.ORGANIZER_USER_DATA_DIR);
  require("node:fs").mkdirSync(userDataDir, { recursive: true });
  app.setPath("userData", userDataDir);
}

const CLIPBOARD_NOTE_FLAG = "--clipboard-to-note";
let clipboardNotePending = process.argv.includes(CLIPBOARD_NOTE_FLAG);
const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    if (Array.isArray(argv) && argv.includes(CLIPBOARD_NOTE_FLAG)) {
      clipboardNotePending = true;

      if (app.isReady()) {
        saveClipboardAsNote().catch(() => {});
      }

      return;
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      focusMainWindow();
    }
  });
}

let mainWindow = null;
let spotlightWindow = null;
let spotlightReady = false;
let spotlightPendingShow = false;
let spotlightSearchRecorded = false;
let appTray = null;
let pendingPlan = null;
let rollbackInProgress = false;
let floatingConfig = null;
let widgetData = createDefaultWidgetData();
let pomodoroHistory = createEmptyHistory();
let pomodoroHistorySaveQueue = Promise.resolve();
let fileTags = null;
let categoryMappings = null;
let quickAccess = null;
let componentAppearance = null;
let clipboardHistory = createEmptyClipboardHistory();
let clipboardHistorySaveQueue = Promise.resolve();
let clipboardWatcherTimer = null;
let clipboardWatcherActive = false;
let clipboardWatcherToken = 0;
let clipboardPollBusy = false;
let clipboardLastText = null;
let isQuitting = false;
let nativeMaterialAvailable = false;
let floatingConfigSaveQueue = Promise.resolve();
let widgetDataSaveQueue = Promise.resolve();
let fileTagsSaveQueue = Promise.resolve();
let categoryMappingsSaveQueue = Promise.resolve();
let quickAccessSaveQueue = Promise.resolve();
let componentAppearanceSaveQueue = Promise.resolve();
let quitCleanupStarted = false;
let startupNotice = null;
let wallpaperThemeCache = null;
let iconPackCache = null;
const ICON_PACK_TYPES = [
  "folder", "image", "document", "archive", "installer",
  "audio", "video", "code", "shortcut", "other"
];
let wallpaperThemeCacheAt = 0;
let categoryMap = null;
let categoryMapSaveQueue = Promise.resolve();
let manualOperationQueue = Promise.resolve();
let floatingDrag = null;
let floatingDragTarget = null;
let floatingDragTimer = null;
let fullscreenDisplayId = null;
let fullscreenPollTimer = null;
let guideWindow = null;
let guideWindowReady = false;
let guidePayload = { vertical: [], horizontal: [] };
let guidePayloadSignature = "";
let guideHideTimer = null;
let displayTopologyTimer = null;
let snapSuppressUntil = 0;
const snapMoveTimes = new WeakMap();
const snapAppliedAt = new WeakMap();
const snapReleaseTimers = new Map();

const FULLSCREEN_AREA_RATIO = 0.95;
const SNAP_DRAG_MEMORY_MS = 30000;
const fullscreenHiddenByDisplay = new Map();
const fullscreenRestoreTimers = new Map();

const floatingWindows = new Map();
const floatingWindowCategories = new Map();
const floatingCategoryData = new Map();
const pendingFloatingShows = new Set();
const floatingShowTimers = new Map();
const floatingMoveTimers = new Map();
const floatingResizeTimers = new Map();
const floatingResizeIgnoreUntil = new Map();
const collapsedCategories = new Set();
const floatingIconCache = new Map();
const shortcutIconDiskCache = new Map();
const SHORTCUT_ICON_CACHE_LIMIT = 120;
let shortcutIconCacheSaveTimer = null;
let shortcutIconDiskCacheLoaded = false;
let shortcutIconDiskCacheLoadPromise = null;
let shortcutIconExtractionCount = 0;
const shortcutIconExtractionWaiters = [];

const widgetWindows = new Map();
const widgetWindowKeys = new Map();
const pendingWidgetShows = new Set();
const widgetShowTimers = new Map();
const widgetMoveTimers = new Map();
const widgetResizeTimers = new Map();
const widgetResizeIgnoreUntil = new Map();
const WIDGET_BY_KEY = new Map(WIDGET_DEFS.map((widget) => [widget.key, widget]));
let mediaSessionWatcher = null;

let achievementDefinitions = [];
let achievementState = createEmptyAchievementState();
let achievementStateLoaded = false;
let achievementSaveQueue = Promise.resolve();
const pendingAchievementToasts = [];
let shortcutSettings = { ...DEFAULT_SHORTCUTS };
let shortcutRegistration = {};
let shortcutRecordingSuspended = false;
let globalFocusShortcutActive = false;
let shortcutFullscreenActive = false;
let shortcutFullscreenTimer = null;
let shortcutRetryTimer = null;
let privacyShortcutPollTimer = null;
let privacyShortcutWasDown = false;
let privacyRevision = 0;
let achievementPomodoroRunning = false;

// The single transparent desktop layer replaces all independent floating
// BrowserWindows. Its renderer is the only place where categories, the clock
// and the music widget are displayed.
let desktopLayerWindow = null;
let desktopLayerReady = false;
let desktopLayerAttached = false;
let desktopLayerBounds = null;
let desktopLayerVisible = true;
let privacyModeActive = false;
let desktopLayerMouseIgnored = false;
let desktopLayerInteractionActive = false;
let desktopLayerInteractionStartedAt = 0;
let desktopLayerPointerTimer = null;
let desktopLayerWatchdogTimer = null;
let desktopLayerRecreateTimer = null;
let desktopLayerAttachBusy = false;
let desktopLayerAttachErrorLogged = false;
let desktopLayerRevision = 0;
let desktopLayerLastState = null;
let desktopLayerHostInfo = null;
let desktopLayerFocusActive = false;
let desktopLayerMenuOpen = false;
let desktopLayerTourActive = false;
let desktopLayerOutsideInteractiveSince = 0;
let desktopIconRects = [];
const ONBOARDING_STEP_COUNT = 8;
let onboardingState = {
  version: 1,
  completed: false,
  step: 0,
  completedAt: null,
  updatedAt: null
};
let onboardingSaveQueue = Promise.resolve();
let onboardingActive = false;
let onboardingRendererReady = false;
let onboardingPendingStart = null;
let onboardingMainWindowWasVisible = false;
let onboardingPreviewWidgetKeys = new Set();
let desktopIconsHidden = false;
let desktopIconsLastError = "";
let nativeDesktopIconsInitiallyVisible = true;
let desktopUnassignedItems = [];
let desktopUnassignedByPath = new Map();
let desktopWatchHandle = null;
let desktopWatchTimer = null;
let desktopWatchRefreshBusy = false;
let desktopWatchRefreshPending = false;
let desktopWatchPollTimer = null;
let desktopWatchSignature = "";
let desktopWatchPollErrorLogged = false;
let bingImageCursor = 0;
let smartThemeWatcherTimer = null;
let smartThemeLastSignature = "";
const dismissedCategoryKeys = new Set();

function getDesktopPath() {
  return process.env.ORGANIZER_DESKTOP_DIR
    ? path.resolve(process.env.ORGANIZER_DESKTOP_DIR)
    : app.getPath("desktop");
}

// 开发时直接读取 build/icon.ico；打包后由 electron-builder 的
// extraResources 复制到 resources/icon.ico。
function getAppIconPath() {
  const candidates = [];

  if (app.isPackaged) {
    candidates.push(path.join(process.resourcesPath, "icon.ico"));
  }

  candidates.push(path.join(__dirname, "build", "icon.ico"));

  for (const candidate of candidates) {
    try {
      if (fsNative.existsSync(candidate)) return candidate;
    } catch (error) {
      // 保持回退到 Electron 默认图标。
    }
  }

  return "";
}

function getWindowIconOption() {
  const iconPath = getAppIconPath();
  return iconPath ? { icon: iconPath } : {};
}

function readWindowsWallpaperPath() {
  if (process.platform !== "win32") return "";

  try {
    const koffi = require("koffi");
    const user32 = koffi.load("user32.dll");
    const getWallpaper = user32.func(
      "bool SystemParametersInfoW(uint32_t uiAction, uint32_t uiParam, void *pvParam, uint32_t fWinIni)"
    );
    const buffer = Buffer.alloc(1040);
    const ok = getWallpaper(0x0073, 260, buffer, 0);

    if (!ok) return "";

    return buffer.toString("utf16le").replace(/\u0000.*$/s, "").trim();
  } catch (error) {
    return "";
  }
}

function getWallpaperThemeInfo() {
  const now = Date.now();

  if (wallpaperThemeCache && now - wallpaperThemeCacheAt < 15000) {
    return wallpaperThemeCache;
  }

  const wallpaperPath = readWindowsWallpaperPath();

  if (!wallpaperPath) {
    wallpaperThemeCache = { isDark: nativeTheme.shouldUseDarkColors, brightness: null };
    wallpaperThemeCacheAt = now;
    return wallpaperThemeCache;
  }

  try {
    const image = nativeImage.createFromPath(wallpaperPath);

    if (image.isEmpty()) {
      wallpaperThemeCache = { isDark: nativeTheme.shouldUseDarkColors, brightness: null };
      wallpaperThemeCacheAt = now;
      return wallpaperThemeCache;
    }

    const size = image.getSize();
    const bitmap = image.toBitmap();
    const pixelCount = size.width * size.height;

    if (!bitmap || bitmap.length < 4 || pixelCount <= 0) {
      wallpaperThemeCache = { isDark: nativeTheme.shouldUseDarkColors, brightness: null };
      wallpaperThemeCacheAt = now;
      return wallpaperThemeCache;
    }

    const stride = Math.max(1, Math.floor(pixelCount / 12000));
    let luminance = 0;
    let samples = 0;

    for (let pixel = 0; pixel < pixelCount; pixel += stride) {
      const index = pixel * 4;
      const blue = bitmap[index] || 0;
      const green = bitmap[index + 1] || 0;
      const red = bitmap[index + 2] || 0;
      luminance += 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      samples += 1;
    }

    const average = samples > 0 ? luminance / samples : 0;
    wallpaperThemeCache = {
      isDark: average < 132,
      brightness: Math.round(average)
    };
    wallpaperThemeCacheAt = now;
    return wallpaperThemeCache;
  } catch (error) {
    wallpaperThemeCache = { isDark: nativeTheme.shouldUseDarkColors, brightness: null };
    wallpaperThemeCacheAt = now;
    return wallpaperThemeCache;
  }
}

function getLogDir() {
  return process.env.ORGANIZER_LOG_DIR
    ? path.resolve(process.env.ORGANIZER_LOG_DIR)
    : path.join(__dirname, "logs");
}

function focusMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
  }

  if (!mainWindow || mainWindow.isDestroyed()) return null;

  if (mainWindow.isMinimized()) mainWindow.restore();
  if (!mainWindow.isVisible()) mainWindow.show();
  mainWindow.focus();

  return mainWindow;
}

function sendToMainWindow(channel, payload) {
  const win = focusMainWindow();
  if (!win || win.webContents.isDestroyed()) return;

  const send = () => {
    if (!win.isDestroyed() && !win.webContents.isDestroyed()) {
      win.webContents.send(channel, payload);
    }
  };

  if (win.webContents.isLoadingMainFrame()) {
    win.webContents.once("did-finish-load", send);
  } else {
    send();
  }
}

function notifyNotesChanged() {
  if (
    desktopLayerReady &&
    desktopLayerWindow &&
    !desktopLayerWindow.isDestroyed() &&
    !desktopLayerWindow.webContents.isDestroyed()
  ) {
    desktopLayerWindow.webContents.send("desktop-layer:notes-updated");
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("notes:changed");
  }
}

function notifyDesktopLayerToast(message, { error = false } = {}) {
  if (
    desktopLayerReady &&
    desktopLayerWindow &&
    !desktopLayerWindow.isDestroyed() &&
    !desktopLayerWindow.webContents.isDestroyed()
  ) {
    desktopLayerWindow.webContents.send("desktop-layer:toast", {
      message,
      error: Boolean(error)
    });
  }
}

function getPrivacyPayload() {
  return {
    active: privacyModeActive,
    privacyActive: privacyModeActive,
    revision: privacyRevision
  };
}

function sendDesktopLayerPrivacy() {
  if (
    desktopLayerReady &&
    desktopLayerWindow &&
    !desktopLayerWindow.isDestroyed() &&
    !desktopLayerWindow.webContents.isDestroyed()
  ) {
    desktopLayerWindow.webContents.send("desktop-layer:privacy", getPrivacyPayload());
  }
}

// 显式广播 toggle-privacy，确保桌面层与主窗口都能独立响应快捷键，
// 不依赖 floating:settings-changed 或状态快照的时序。
function sendPrivacyToggleEvent() {
  const payload = getPrivacyPayload();
  const targets = [
    ["desktop-layer", desktopLayerWindow],
    ["main", mainWindow]
  ];
  let delivered = 0;

  for (const [name, win] of targets) {
    if (!win || win.isDestroyed() || win.webContents.isDestroyed()) {
      console.log(`[privacy] toggle-privacy -> ${name}: skipped (window unavailable)`);
      continue;
    }

    win.webContents.send("toggle-privacy", payload);
    delivered += 1;
    console.log(
      `[privacy] toggle-privacy -> ${name}: sent (active=${privacyModeActive}, revision=${privacyRevision})`
    );
  }

  if (delivered === 0) {
    console.log(`[privacy] toggle-privacy -> no window (active=${privacyModeActive})`);
  }
}

function setPrivacyMode(active) {
  const next = Boolean(active);
  if (privacyModeActive === next) return;

  privacyModeActive = next;
  privacyRevision += 1;

  if (next) {
    recordAchievement("privacy-toggle", {
      active: true,
      focusRunning: achievementPomodoroRunning
    });
  }

  console.log(
    `[privacy] setPrivacyMode -> active=${privacyModeActive}, revision=${privacyRevision}`
  );
  sendDesktopLayerPrivacy();
  sendPrivacyToggleEvent();
  sendDesktopLayerState();
  notifyFloatingSettingsChanged();
  rebuildTrayMenu();
  notifyDesktopLayerToast(
    next
      ? "访客防窥已开启，所有文件名与图标已全局模糊"
      : "访客防窥已关闭，桌面内容已恢复"
  );
}

function getHistoryPath() {
  return path.join(app.getPath("userData"), "history.json");
}

function getFloatingConfigPath() {
  return path.join(app.getPath("userData"), "floating.json");
}

function getManualCategoriesPath() {
  return path.join(app.getPath("userData"), "manual-categories.json");
}

function getCategoryMapPath() {
  return path.join(app.getPath("userData"), "category-map.json");
}

function getWidgetDataPath() {
  return path.join(app.getPath("userData"), "widget-data.json");
}

function getPomodoroHistoryPath() {
  return path.join(app.getPath("userData"), "pomodoro-history.json");
}

function getAchievementStatePath() {
  return path.join(app.getPath("userData"), "achievements-state.json");
}

function getShortcutsPath() {
  return path.join(app.getPath("userData"), "shortcuts.json");
}

function getAchievementDefinitionsPath() {
  return path.join(__dirname, "achievements.json");
}

/* ---------- 界面语言偏好 ----------
 * 主窗口的 localStorage 只对它自己可靠（file:// 下分区不一定共享），
 * 所以语言偏好统一存在主进程，由它下发给全屏桌面层。
 */
const SUPPORTED_UI_LOCALES = ["zh-CN", "zh-TW", "en", "ja", "fr", "ru"];
let uiLocalePreference = "system";
let uiLocalePreferenceStored = false;

function getLocaleConfigPath() {
  return path.join(app.getPath("userData"), "ui-locale.json");
}

function normalizeLocalePreference(value) {
  return value === "system" || SUPPORTED_UI_LOCALES.includes(value)
    ? value
    : "system";
}

function loadLocalePreference() {
  try {
    const raw = fsNative.readFileSync(getLocaleConfigPath(), "utf8");
    const parsed = JSON.parse(raw);
    uiLocalePreference = normalizeLocalePreference(parsed && parsed.preference);
    uiLocalePreferenceStored = true;
  } catch (error) {
    // 首次启动没有这个文件，保持“跟随系统”。
    uiLocalePreference = "system";
    uiLocalePreferenceStored = false;
  }
}

function saveLocalePreference(preference) {
  try {
    return fs.writeFile(
      getLocaleConfigPath(),
      JSON.stringify({ preference, updatedAt: new Date().toISOString() }, null, 2),
      "utf8"
    );
  } catch (error) {
    return Promise.resolve();
  }
}

function getLocalePayload() {
  return {
    preference: uiLocalePreference,
    systemLocale: app.getLocale(),
    stored: uiLocalePreferenceStored
  };
}

function broadcastLocale() {
  const payload = getLocalePayload();
  const targets = [desktopLayerWindow, mainWindow];

  for (const win of targets) {
    if (!win || win.isDestroyed() || win.webContents.isDestroyed()) continue;
    win.webContents.send("i18n:locale-changed", payload);
  }
}

function registerLocaleIpc() {
  ipcMain.handle("i18n:get-locale", () => getLocalePayload());

  ipcMain.on("i18n:set-locale", (_event, preference) => {
    const next = normalizeLocalePreference(String(preference || ""));
    uiLocalePreferenceStored = true;
    if (next === uiLocalePreference) return;

    uiLocalePreference = next;
    saveLocalePreference(next);
    broadcastLocale();
  });
}

function notifyAchievementsChanged() {
  if (
    !mainWindow ||
    mainWindow.isDestroyed() ||
    mainWindow.webContents.isDestroyed() ||
    mainWindow.webContents.isLoadingMainFrame()
  ) {
    return;
  }

  const snapshot = buildAchievementSnapshot(
    achievementDefinitions,
    achievementState,
    getAchievementIcon
  );
  mainWindow.webContents.send("achievements:changed", {
    total: snapshot.total,
    unlockedCount: snapshot.unlockedCount
  });
}

function pushAchievementToast(definition, unlockedAt) {
  const payload = {
    ...definition,
    unlockedAt,
    icon: getAchievementIcon(definition.id)
  };

  if (
    desktopLayerReady &&
    desktopLayerWindow &&
    !desktopLayerWindow.isDestroyed() &&
    !desktopLayerWindow.webContents.isDestroyed()
  ) {
    desktopLayerWindow.webContents.send("achievement:unlocked", payload);
    return;
  }

  pendingAchievementToasts.push(payload);
}

function flushAchievementToasts() {
  if (
    !desktopLayerReady ||
    !desktopLayerWindow ||
    desktopLayerWindow.isDestroyed() ||
    desktopLayerWindow.webContents.isDestroyed()
  ) {
    return;
  }

  while (pendingAchievementToasts.length > 0) {
    desktopLayerWindow.webContents.send(
      "achievement:unlocked",
      pendingAchievementToasts.shift()
    );
  }
}

function scheduleAchievementSave() {
  if (!achievementStateLoaded) return;

  const snapshot = JSON.parse(JSON.stringify(achievementState));
  const write = () => saveAchievementState(getAchievementStatePath(), snapshot);
  const task = achievementSaveQueue.then(write, write);
  achievementSaveQueue = task.catch(() => {});
}

function recordAchievement(type, payload = {}, now = new Date()) {
  if (!achievementStateLoaded || achievementDefinitions.length === 0) {
    return [];
  }

  const result = recordAchievementEvent(
    achievementDefinitions,
    achievementState,
    type,
    payload,
    now
  );

  achievementState = result.state;
  scheduleAchievementSave();

  for (const definition of result.unlocked) {
    pushAchievementToast(
      definition,
      achievementState.unlocked[definition.id] || now.toISOString()
    );
  }

  if (result.unlocked.length > 0) {
    notifyAchievementsChanged();
  }

  return result.unlocked;
}

async function initializeAchievements() {
  try {
    achievementDefinitions = await loadAchievementDefinitions(
      getAchievementDefinitionsPath()
    );
    achievementState = await loadAchievementState(getAchievementStatePath());
    achievementStateLoaded = true;
  } catch (error) {
    achievementDefinitions = [];
    achievementStateLoaded = false;
    console.error("[achievements] 无法加载成就定义:", error.message || error);
    return;
  }

  recordAchievement("app-open");
}

async function loadShortcutPreferences() {
  try {
    const raw = await fs.readFile(getShortcutsPath(), "utf8");
    shortcutSettings = normalizeShortcutSettings(JSON.parse(raw));
  } catch (error) {
    shortcutSettings = normalizeShortcutSettings(null);
  }
}

function persistShortcutPreferences() {
  return fs.writeFile(
    getShortcutsPath(),
    JSON.stringify(shortcutSettings, null, 2),
    "utf8"
  ).catch(() => {});
}

function handleGlobalShortcut(action) {
  recordAchievement("shortcut-used");

  if (action === "search") {
    showSpotlight();
    return;
  }

  if (action === "dashboard") {
    focusMainWindow();
    sendToMainWindow("ui:show-home");
    return;
  }

  if (action === "focus") {
    globalFocusShortcutActive = !globalFocusShortcutActive;

    if (
      desktopLayerReady &&
      desktopLayerWindow &&
      !desktopLayerWindow.isDestroyed() &&
      !desktopLayerWindow.webContents.isDestroyed()
    ) {
      desktopLayerWindow.webContents.send(
        "desktop-layer:shortcut-focus",
        globalFocusShortcutActive
      );
    }
    return;
  }

  if (action === "privacy") {
    if (!floatingConfig) return;
    setPrivacyMode(!privacyModeActive);
  }
}

function stopPrivacyShortcutFallback() {
  if (privacyShortcutPollTimer) {
    clearInterval(privacyShortcutPollTimer);
    privacyShortcutPollTimer = null;
  }

  privacyShortcutWasDown = false;
}

// RegisterHotKey 会被其他应用全局抢占（例如另一款音乐/游戏工具）。
// 当默认防窥快捷键注册失败时，用 GetAsyncKeyState 轮询兜底，保证防窥键仍然生效。
// 这仅在用户仍使用默认组合键时启用，自定义快捷键不会误触发。
function startPrivacyShortcutFallback() {
  if (privacyShortcutPollTimer || process.platform !== "win32") return;
  if (!isNativeAvailable()) return;

  const configured = normalizeShortcutSettings(shortcutSettings).privacy;

  if (configured !== DEFAULT_SHORTCUTS.privacy) return;

  console.log(
    `[shortcuts] ${displayAccelerator(DEFAULT_SHORTCUTS.privacy)} 已被其他程序占用，已启用轮询兜底`
  );

  privacyShortcutPollTimer = setInterval(() => {
    if (
      isQuitting ||
      shortcutRecordingSuspended ||
      shortcutFullscreenActive ||
      !floatingConfig
    ) {
      privacyShortcutWasDown = false;
      return;
    }

    if (shortcutRegistration.privacy === true) {
      stopPrivacyShortcutFallback();
      return;
    }

    const down = isPrivacyShortcutDown();

    if (down && !privacyShortcutWasDown) {
      setPrivacyMode(!privacyModeActive);
    }

    privacyShortcutWasDown = down;
  }, 70);

  if (typeof privacyShortcutPollTimer.unref === "function") {
    privacyShortcutPollTimer.unref();
  }
}

function stopShortcutRetry() {
  if (shortcutRetryTimer) {
    clearInterval(shortcutRetryTimer);
    shortcutRetryTimer = null;
  }
}

// 被占用的快捷键不会永远被占用：每隔 10 秒重试一次，
// 其他应用退出后即可自动恢复。
function startShortcutRetry() {
  if (shortcutRetryTimer) return;

  shortcutRetryTimer = setInterval(() => {
    if (isQuitting || shortcutRecordingSuspended || shortcutFullscreenActive) return;

    const unresolved = SHORTCUT_ACTIONS.filter(
      (action) => shortcutRegistration[action.id] !== true
    );

    if (unresolved.length === 0) {
      stopShortcutRetry();
      return;
    }

    // 只补注册失败的键，避免每 10 秒重注册一次正常快捷键。
    let recovered = false;

    for (const action of unresolved) {
      const accelerator = shortcutSettings[action.id];

      if (!accelerator) continue;

      let registered = false;

      try {
        registered = globalShortcut.register(
          accelerator,
          () => handleGlobalShortcut(action.id)
        );
      } catch (error) {
        registered = false;
      }

      shortcutRegistration[action.id] = registered;

      if (registered) recovered = true;
    }

    if (recovered) syncShortcutRecovery(shortcutRegistration);
  }, 10000);

  if (typeof shortcutRetryTimer.unref === "function") {
    shortcutRetryTimer.unref();
  }
}

function syncShortcutRecovery(registrations) {
  if (registrations.privacy === true) {
    stopPrivacyShortcutFallback();
  } else if (!shortcutRecordingSuspended && !shortcutFullscreenActive) {
    startPrivacyShortcutFallback();
  } else {
    stopPrivacyShortcutFallback();
  }

  const unresolved = SHORTCUT_ACTIONS.some(
    (action) => registrations[action.id] !== true
  );

  if (unresolved && !shortcutRecordingSuspended && !shortcutFullscreenActive) {
    startShortcutRetry();
  } else {
    stopShortcutRetry();
  }
}

function registerGlobalShortcutPreferences() {
  if (shortcutRecordingSuspended) {
    stopPrivacyShortcutFallback();
    stopShortcutRetry();
    return {};
  }

  if (shortcutFullscreenActive) {
    globalShortcut.unregisterAll();
    shortcutRegistration = {};
    stopPrivacyShortcutFallback();
    stopShortcutRetry();
    return {};
  }

  globalShortcut.unregisterAll();
  const registrations = {};

  for (const action of SHORTCUT_ACTIONS) {
    const accelerator = shortcutSettings[action.id];

    if (!accelerator) {
      registrations[action.id] = false;
      continue;
    }

    try {
      registrations[action.id] = globalShortcut.register(
        accelerator,
        () => handleGlobalShortcut(action.id)
      );
    } catch (error) {
      registrations[action.id] = false;
    }
  }

  shortcutRegistration = registrations;
  syncShortcutRecovery(registrations);
  return registrations;
}

function getShortcutState() {
  return {
    ok: true,
    actions: getShortcutActions(shortcutSettings, shortcutRegistration),
    recording: shortcutRecordingSuspended,
    suspendedByFullscreen: shortcutFullscreenActive
  };
}

function updateShortcutFullscreenState() {
  if (!isNativeAvailable()) return;

  let active = false;

  try {
    active = getForegroundFullscreenDisplayId() !== null;
  } catch (error) {
    active = false;
  }

  if (active === shortcutFullscreenActive) return;
  shortcutFullscreenActive = active;

  if (shortcutRecordingSuspended) {
    if (active) globalShortcut.unregisterAll();
    return;
  }

  if (active) {
    globalShortcut.unregisterAll();
    shortcutRegistration = {};
  } else {
    registerGlobalShortcutPreferences();
  }
}

function startShortcutFullscreenWatcher() {
  if (shortcutFullscreenTimer) return;

  updateShortcutFullscreenState();
  shortcutFullscreenTimer = setInterval(updateShortcutFullscreenState, 1000);
  if (typeof shortcutFullscreenTimer.unref === "function") {
    shortcutFullscreenTimer.unref();
  }
}

function stopShortcutFullscreenWatcher() {
  if (shortcutFullscreenTimer) {
    clearInterval(shortcutFullscreenTimer);
    shortcutFullscreenTimer = null;
  }
}

function getNotesDir() {
  return getNotesDirectory(app.getPath("userData"));
}

function getFileTagsPath() {
  return path.join(app.getPath("userData"), "file-tags.json");
}

function getCategoryMappingsPath() {
  return path.join(app.getPath("userData"), "category-mappings.json");
}

function getQuickAccessPath() {
  return path.join(app.getPath("userData"), "quick-access.json");
}

function getClipboardHistoryPath() {
  return path.join(app.getPath("userData"), "clipboard-history.json");
}

function getDesktopIconsStatePath() {
  return path.join(app.getPath("userData"), "desktop-icons-state.json");
}

function getIconPackRoot() {
  return path.join(app.getPath("userData"), "icon-packs", "active");
}

function getSessionStatePath() {
  return path.join(app.getPath("userData"), "session-state.json");
}

function getComponentAppearancePath() {
  return path.join(app.getPath("userData"), "component-appearance.json");
}

function getBackgroundsDir() {
  return path.join(app.getPath("userData"), "backgrounds");
}

function getOnboardingStatePath() {
  return path.join(app.getPath("userData"), "onboarding.json");
}

function getIconCachePath() {
  return path.join(app.getPath("userData"), "icon-cache.json");
}

function normalizeOnboardingState(data) {
  const source = data && typeof data === "object" ? data : {};
  const parsedStep = Number(source.step);

  return {
    version: 1,
    completed: source.completed === true,
    step: Number.isInteger(parsedStep)
      ? Math.max(0, Math.min(ONBOARDING_STEP_COUNT - 1, parsedStep))
      : 0,
    completedAt: typeof source.completedAt === "string"
      ? source.completedAt
      : null,
    updatedAt: typeof source.updatedAt === "string"
      ? source.updatedAt
      : null
  };
}

async function loadOnboardingState() {
  try {
    const raw = await fs.readFile(getOnboardingStatePath(), "utf8");
    return normalizeOnboardingState(JSON.parse(raw));
  } catch (error) {
    return normalizeOnboardingState(null);
  }
}

function persistOnboardingState() {
  const snapshot = JSON.parse(JSON.stringify(onboardingState));
  const targetPath = getOnboardingStatePath();

  onboardingSaveQueue = onboardingSaveQueue
    .catch(() => {})
    .then(async () => {
      const temporaryPath = `${targetPath}.tmp`;
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(
        temporaryPath,
        JSON.stringify(snapshot, null, 2),
        "utf8"
      );
      await fs.rename(temporaryPath, targetPath);
      return snapshot;
    })
    .catch((error) => {
      console.warn("[onboarding] 无法保存引导状态:", error.message || error);
      return null;
    });

  return onboardingSaveQueue;
}

// Electron's clipboard module is synchronous on older versions and returns
// promises on newer ones; support both shapes so the component keeps working
// across Electron upgrades.
async function readClipboardText() {
  try {
    const value = clipboard.readText();
    const text = value && typeof value.then === "function"
      ? await value
      : value;
    return typeof text === "string" ? text : "";
  } catch (error) {
    return "";
  }
}

async function writeClipboardText(text) {
  try {
    const result = clipboard.writeText(String(text));
    if (result && typeof result.then === "function") {
      await result;
    }
    return true;
  } catch (error) {
    return false;
  }
}

function clipboardEntriesForRenderer() {
  return clipboardHistory.entries.map((entry) => ({
    id: entry.id,
    text: entry.text,
    copiedAt: entry.copiedAt
  }));
}

function persistClipboardHistory() {
  const snapshot = {
    version: clipboardHistory.version,
    entries: clipboardHistory.entries.map((entry) => ({ ...entry }))
  };

  clipboardHistorySaveQueue = clipboardHistorySaveQueue
    .catch(() => {})
    .then(() => saveClipboardHistory(getClipboardHistoryPath(), snapshot))
    .catch((error) => {
      console.warn("[clipboard] 保存剪贴板历史失败:", error.message || error);
    });

  return clipboardHistorySaveQueue;
}

function recordClipboardText(text) {
  const result = addClipboardEntry(clipboardHistory, text);

  if (!result.changed) {
    clipboardHistory = {
      ...clipboardHistory,
      entries: result.entries
    };
    return false;
  }

  clipboardHistory = {
    ...clipboardHistory,
    entries: result.entries
  };
  persistClipboardHistory();
  sendDesktopLayerState();
  return true;
}

async function pollClipboard() {
  if (clipboardPollBusy) return;
  clipboardPollBusy = true;

  try {
    const text = await readClipboardText();

    if (!clipboardWatcherActive) return;
    if (!text.trim()) return;
    if (text === clipboardLastText) return;

    clipboardLastText = text;
    recordClipboardText(text);
  } finally {
    clipboardPollBusy = false;
  }
}

function startClipboardWatcher() {
  if (clipboardWatcherActive) return;

  clipboardWatcherActive = true;
  const token = ++clipboardWatcherToken;

  // Seed the comparison with the current clipboard so enabling the component
  // does not immediately record content copied before it was turned on.
  readClipboardText().then((text) => {
    if (
      !clipboardWatcherActive ||
      token !== clipboardWatcherToken ||
      clipboardWatcherTimer !== null
    ) {
      return;
    }

    clipboardLastText = text;
    // Reading text only: images and file lists are not part of this component.
    clipboardWatcherTimer = setInterval(pollClipboard, 800);
  });
}

function stopClipboardWatcher() {
  clipboardWatcherActive = false;
  clipboardWatcherToken += 1;

  if (clipboardWatcherTimer !== null) {
    clearInterval(clipboardWatcherTimer);
    clipboardWatcherTimer = null;
  }

  clipboardLastText = null;
}

const SHELL_MENU_KEY = "HKCU\\Software\\Classes\\Directory\\Background\\shell\\DesktopOrganizerClipboardNote";
const SHELL_MENU_COMMAND_KEY = `${SHELL_MENU_KEY}\\command`;

function getClipboardShellCommand() {
  if (app.isPackaged) {
    return `"${process.execPath}" ${CLIPBOARD_NOTE_FLAG}`;
  }

  return `"${process.execPath}" "${app.getAppPath()}" ${CLIPBOARD_NOTE_FLAG}`;
}

async function getShellIntegrationStatus() {
  if (process.platform !== "win32") {
    return { ok: true, supported: false, enabled: false };
  }

  try {
    await execFileAsync("reg.exe", ["QUERY", SHELL_MENU_KEY, "/ve"], {
      windowsHide: true
    });
    return { ok: true, supported: true, enabled: true };
  } catch (error) {
    return { ok: true, supported: true, enabled: false };
  }
}

async function setShellIntegrationEnabled(enabled) {
  if (process.platform !== "win32") {
    return { ok: false, supported: false, error: "仅支持 Windows。" };
  }

  try {
    if (enabled) {
      await execFileAsync("reg.exe", [
        "ADD",
        SHELL_MENU_KEY,
        "/ve",
        "/t",
        "REG_SZ",
        "/d",
        "将剪贴板内容生成为随手记卡片",
        "/f"
      ], { windowsHide: true });

      await execFileAsync("reg.exe", [
        "ADD",
        SHELL_MENU_COMMAND_KEY,
        "/ve",
        "/t",
        "REG_SZ",
        "/d",
        getClipboardShellCommand(),
        "/f"
      ], { windowsHide: true });
    } else {
      await execFileAsync("reg.exe", ["DELETE", SHELL_MENU_KEY, "/f"], {
        windowsHide: true
      }).catch(() => {});
    }

    return { ...(await getShellIntegrationStatus()), ok: true };
  } catch (error) {
    return {
      ok: false,
      supported: true,
      enabled: false,
      error: error.message || "无法更新桌面右键菜单。"
    };
  }
}

async function readHistory() {
  return loadHistory(getHistoryPath());
}

async function writeHistory(history) {
  await saveHistory(getHistoryPath(), history);
}

async function writeLogWithFallback(writer) {
  try {
    const logPath = await writer(getLogDir());
    return { logPath, logError: null };
  } catch (primaryError) {
    try {
      const logPath = await writer(path.join(app.getPath("userData"), "logs"));
      return { logPath, logError: null };
    } catch (fallbackError) {
      return {
        logPath: null,
        logError: fallbackError.message || primaryError.message || "日志写入失败。"
      };
    }
  }
}

async function writeOrganizeLogFor(plan, report) {
  return writeLogWithFallback((logDir) => writeOrganizeLog({
    logDir,
    report,
    desktopPath: plan.desktopPath
  }));
}

async function writeRollbackLogFor(rollback) {
  return writeLogWithFallback((logDir) => writeRollbackLog({ logDir, rollback }));
}

function buildRun(plan, report, logPath, runId) {
  const items = report.items
    .filter((item) => item.status === "assigned")
    .map((item) => ({
      name: item.name,
      path: item.path,
      category: item.category,
      kind: item.kind,
      timestamp: item.timestamp
    }));

  return {
    id: runId || createRunId(),
    createdAt: report.startedAt,
    status: items.length > 0 ? "active" : "empty",
    itemCount: items.length,
    movedCount: 0,
    desktopPath: plan.desktopPath,
    logPath: logPath || null,
    moves: [],
    items
  };
}

function buildRollbackRecord({ targetRun, affectedRuns, report, logPath }) {
  return {
    id: createRollbackId(),
    createdAt: new Date().toISOString(),
    targetRunId: targetRun.id,
    targetRunCreatedAt: targetRun.createdAt,
    runIds: affectedRuns.map((run) => run.id),
    runCount: affectedRuns.length,
    removed: report.removed,
    skipped: report.skipped,
    errors: report.errors.length,
    items: report.items,
    logPath: logPath || null
  };
}

async function executeRollback({ targetRun, affectedRuns, status }) {
  const report = await rollbackRuns(categoryMap, affectedRuns);
  const rollback = {
    createdAt: new Date().toISOString(),
    targetRunCreatedAt: targetRun.createdAt,
    runCount: affectedRuns.length,
    removed: report.removed,
    skipped: report.skipped,
    errors: report.errors.length,
    items: report.items
  };
  const logResult = await writeRollbackLogFor(rollback);
  let saveError = null;

  try {
    await persistCategoryMap();
  } catch (error) {
    saveError = error.message || "归属记录保存失败。";
  }

  let historyError = null;

  try {
    const history = await readHistory();
    const affectedIds = new Set(affectedRuns.map((run) => run.id));

    history.runs.forEach((run) => {
      if (affectedIds.has(run.id)) {
        run.status = status;
      }
    });

    history.rollbacks.push(buildRollbackRecord({
      targetRun,
      affectedRuns,
      report,
      logPath: logResult.logPath
    }));

    if (history.rollbacks.length > MAX_ROLLBACKS) {
      history.rollbacks = history.rollbacks.slice(-MAX_ROLLBACKS);
    }

    await writeHistory(history);
  } catch (error) {
    historyError = error.message || "历史记录保存失败。";
  }

  try {
    await refreshFloatingData(undefined, { show: false });
  } catch (error) {
    // 悬浮窗刷新失败不影响回档结果
  }

  return {
    ok: true,
    report,
    ...logResult,
    saveError,
    historyError
  };
}

function detectNativeMaterialAvailable() {
  if (process.platform !== "win32") return false;
  const parts = os.release().split(".");
  const build = Number(parts[2] || 0);
  return build >= 22621;
}

function getCategoryConfig(categoryKey) {
  if (!floatingConfig) return null;
  return floatingConfig.categories[categoryKey] || null;
}

function getTabGroups() {
  if (!floatingConfig) return [];
  return Array.isArray(floatingConfig.groups) ? floatingConfig.groups : [];
}

function getTabGroupById(groupId) {
  if (typeof groupId !== "string" || !groupId) return null;
  return getTabGroups().find((group) => group.id === groupId) || null;
}

function getTabGroupForCategory(categoryKey) {
  return findGroupForCategory(getTabGroups(), categoryKey);
}

function isCategoryGrouped(categoryKey) {
  const group = getTabGroupForCategory(categoryKey);

  if (!group) return false;

  return group.keys.filter((key) => {
    const config = getCategoryConfig(key);
    return Boolean(config && !config.removed);
  }).length >= 2;
}

function getGroupedCategoryKeysOnDesktop() {
  const keys = new Set();

  for (const group of getTabGroups()) {
    if (!group || !Array.isArray(group.keys)) continue;

    const visibleKeys = group.keys.filter((key) => {
      const config = getCategoryConfig(key);
      return Boolean(config && !config.removed);
    });

    if (visibleKeys.length >= 2) {
      visibleKeys.forEach((key) => keys.add(key));
    }
  }

  return keys;
}

function detachCategoryFromTabGroups(categoryKey) {
  if (!floatingConfig || !Array.isArray(floatingConfig.groups)) return false;

  let changed = false;
  const groups = [];

  for (const group of floatingConfig.groups) {
    if (!group || !Array.isArray(group.keys) || !group.keys.includes(categoryKey)) {
      groups.push(group);
      continue;
    }

    changed = true;
    const keys = group.keys.filter((key) => key !== categoryKey);

    // A tab group needs at least two tabs; removing the last partner simply
    // returns the surviving category to its own card.
    if (keys.length < 2) continue;

    group.keys = keys;

    if (!keys.includes(group.activeKey)) {
      group.activeKey = keys[0];
    }

    groups.push(group);
  }

  floatingConfig.groups = groups;
  return changed;
}

function getCategoryDisplayName(categoryKey) {
  const config = getCategoryConfig(categoryKey);
  const definition = getCategoryDef(categoryKey);

  return (config && config.name) || (definition ? definition.label : "整理分类");
}

function getWidgetDisplayName(widgetKey) {
  const config = getWidgetConfig(widgetKey);
  const definition = WIDGET_BY_KEY.get(widgetKey);

  return (config && config.name) || (definition ? definition.label : "小组件");
}

function getWidgetBackgroundUrl(config) {
  if (!config || !config.backgroundImage) return null;

  try {
    return pathToFileURL(config.backgroundImage).href;
  } catch (error) {
    return null;
  }
}

function getCategoryData(categoryKey) {
  return floatingCategoryData.get(categoryKey) || {
    files: [],
    orderKeys: [],
    total: 0
  };
}

// The WorkerW desktop host spans the entire virtual desktop, so a single
// child layer can cover every monitor. Using the union of work areas lets a
// component be dragged continuously across display boundaries instead of
// being trapped on the display where it started.
function getVirtualDesktopBounds() {
  const displays = screen.getAllDisplays();

  if (displays.length === 0) {
    return { ...screen.getPrimaryDisplay().workArea };
  }

  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;

  for (const display of displays) {
    const area = display.workArea;
    left = Math.min(left, area.x);
    top = Math.min(top, area.y);
    right = Math.max(right, area.x + area.width);
    bottom = Math.max(bottom, area.y + area.height);
  }

  return {
    x: left,
    y: top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top)
  };
}

function getDesktopLayerOverlayBounds() {
  return desktopLayerBounds
    ? { ...desktopLayerBounds }
    : getVirtualDesktopBounds();
}

// The desktop layer lives under WorkerW, i.e. it is a WS_CHILD window from that
// moment on. Child windows are positioned in their parent's *client* space while
// everything above thinks in screen pixels, and the WorkerW client origin is the
// top-left of the whole virtual desktop — which is (0, -324) on a setup whose
// secondary display sits above the primary. Writing screen coordinates straight
// into `setBounds` therefore moved the entire layer 324px up, taking the top row
// of components off-screen while every stored coordinate still looked correct.
function applyDesktopLayerWindowGeometry(bounds) {
  const win = desktopLayerWindow;
  if (!win || win.isDestroyed()) return false;

  const target = {
    x: Math.round(bounds.x),
    y: Math.round(bounds.y),
    width: Math.max(1, Math.round(bounds.width)),
    height: Math.max(1, Math.round(bounds.height))
  };

  const hwnd = desktopLayerAttached ? getNativeWindowHandle(win) : null;

  if (hwnd !== null) {
    // Win32 first: it is the authoritative result. Then hand Electron the same
    // rect expressed in the parent's client space so its cached bounds stay
    // truthful instead of disagreeing with the actual window.
    setWindowScreenRect(hwnd, target);
    const clientRect = toParentClientRect(hwnd, target);
    if (clientRect) {
      win.setBounds(clientRect);
      return true;
    }
  }

  win.setBounds(target);
  return true;
}

// Self-healing guard. `applyDesktopLayerWindowGeometry` is only called on a few
// paths, but a single displaced layer makes every component unreachable, so the
// geometry is verified against the real window rect and repaired in place.
function ensureDesktopLayerGeometry() {
  const win = desktopLayerWindow;
  if (!win || win.isDestroyed()) return false;

  const expected = getVirtualDesktopBounds();
  const previous = desktopLayerBounds;
  const boundsChanged = !previous ||
    previous.x !== expected.x ||
    previous.y !== expected.y ||
    previous.width !== expected.width ||
    previous.height !== expected.height;

  if (boundsChanged) desktopLayerBounds = expected;

  if (!desktopLayerAttached) {
    if (boundsChanged) applyDesktopLayerWindowGeometry(expected);
    return boundsChanged;
  }

  const hwnd = getNativeWindowHandle(win);
  const actual = hwnd === null ? null : getWindowScreenRect(hwnd);
  const drifted = Boolean(actual) && (
    Math.abs(actual.x - expected.x) > 1 ||
    Math.abs(actual.y - expected.y) > 1 ||
    Math.abs(actual.width - expected.width) > 1 ||
    Math.abs(actual.height - expected.height) > 1
  );

  if (!boundsChanged && !drifted) return false;

  const repaired = applyDesktopLayerWindowGeometry(expected);

  if (drifted && process.env.ORGANIZER_LAYOUT_DEBUG) {
    console.log(
      `[layout-debug] layer drift repaired: actual=(${actual.x},${actual.y}) ` +
      `${actual.width}x${actual.height} expected=(${expected.x},${expected.y}) ` +
      `${expected.width}x${expected.height}`
    );
  }

  if (repaired) sendDesktopLayerState();
  return repaired;
}

// Screen-space fallback used by the layout importer: a .zc file may come from a
// machine with a different monitor setup, so coordinates can point at a screen
// that no longer exists. A component must keep a usable slice of itself on some
// connected work area, otherwise it is pulled back into the primary work area.
const LAYOUT_MIN_VISIBLE_PIXELS = 48;

function getConnectedWorkAreas() {
  return screen.getAllDisplays().map((display) => display.workArea);
}

function countVisiblePixels(rect, area) {
  return {
    width: Math.max(
      0,
      Math.min(rect.x + rect.width, area.x + area.width) - Math.max(rect.x, area.x)
    ),
    height: Math.max(
      0,
      Math.min(rect.y + rect.height, area.y + area.height) - Math.max(rect.y, area.y)
    )
  };
}

function isRectReachable(rect) {
  return getConnectedWorkAreas().some((area) => {
    const visible = countVisiblePixels(rect, area);
    return visible.width >= Math.min(LAYOUT_MIN_VISIBLE_PIXELS, rect.width) &&
      visible.height >= Math.min(LAYOUT_MIN_VISIBLE_PIXELS, rect.height);
  });
}

// Returns the corrected top-left, or null when the rect is already reachable.
function rescueRectIntoWorkArea(rect) {
  if (isRectReachable(rect)) return null;

  const area = screen.getPrimaryDisplay().workArea;
  const width = Math.min(rect.width, area.width);
  const height = Math.min(rect.height, area.height);
  const maxX = area.x + area.width - width;
  const maxY = area.y + area.height - height;

  return {
    x: Math.round(Math.max(area.x, Math.min(rect.x, maxX))),
    y: Math.round(Math.max(area.y, Math.min(rect.y, maxY)))
  };
}

// Applies the rescue rule to every component in the freshly imported layout.
// When nothing at all is reachable the file came from an incompatible setup, and
// rebuilding the standard grid is safer than stacking everything on one edge.
function sanitizeImportedLayoutPositions() {
  if (!floatingConfig) return { moved: 0, total: 0, rebuilt: false };

  const pending = [];
  let total = 0;

  for (const definition of WIDGET_DEFS) {
    const config = getWidgetConfig(definition.key);
    if (!config) continue;
    if (!Number.isFinite(config.x) || !Number.isFinite(config.y)) continue;

    total += 1;
    pending.push({
      config,
      rect: {
        x: Math.round(config.x),
        y: Math.round(config.y),
        width: Math.max(MIN_WIDGET_WIDTH, Math.round(Number(config.width) || definition.defaultWidth)),
        height: Math.max(MIN_WIDGET_HEIGHT, Math.round(Number(config.height) || definition.defaultHeight))
      }
    });
  }

  for (const key of CATEGORY_KEYS) {
    const config = getCategoryConfig(key);
    if (!config) continue;
    if (!Number.isFinite(config.x) || !Number.isFinite(config.y)) continue;

    const size = computeCategoryWindowSize(
      config.rows || DEFAULT_ROWS,
      config.cols || DEFAULT_COLS
    );
    total += 1;
    pending.push({
      config,
      rect: { x: Math.round(config.x), y: Math.round(config.y), width: size.width, height: size.height }
    });
  }

  const rescues = pending
    .map((entry) => ({ entry, next: rescueRectIntoWorkArea(entry.rect) }))
    .filter((item) => item.next);

  if (total > 0 && rescues.length === total) {
    floatingConfig.autoLayoutVersion = 0;
    floatingConfig.widgetRailVersion = 1;
    applyWidgetGridLayout();
    applyInitialCategoryAutoLayout();
    return { moved: total, total, rebuilt: true };
  }

  // Clamping several components into the same corner would stack them on top of
  // each other, so each rescued card is dropped in the first free slot of the
  // primary work area instead of just being pinned to its edge.
  const area = screen.getPrimaryDisplay().workArea;
  const occupied = pending
    .filter((entry) => !rescues.some((item) => item.entry === entry))
    .map((entry) => entry.rect);

  for (const item of rescues) {
    const width = Math.min(item.entry.rect.width, area.width);
    const height = Math.min(item.entry.rect.height, area.height);
    const stepX = Math.max(80, width + 16);
    const stepY = Math.max(80, height + 16);
    const maxX = area.x + area.width - width;
    const maxY = area.y + area.height - height;

    let spot = null;

    for (let y = area.y; y <= maxY && !spot; y += stepY) {
      for (let x = area.x; x <= maxX; x += stepX) {
        const clash = occupied.some((box) => (
          x < box.x + box.width &&
          x + width > box.x &&
          y < box.y + box.height &&
          y + height > box.y
        ));
        if (!clash) {
          spot = { x: Math.round(x), y: Math.round(y) };
          break;
        }
      }
    }

    const next = spot || item.next;
    occupied.push({ x: next.x, y: next.y, width, height });
    item.entry.config.x = next.x;
    item.entry.config.y = next.y;
  }

  return { moved: rescues.length, total, rebuilt: false };
}

function isDesktopLayerSender(event) {
  return Boolean(
    event &&
    desktopLayerWindow &&
    !desktopLayerWindow.isDestroyed() &&
    event.sender === desktopLayerWindow.webContents
  );
}

function isCategoryEligibleOnDesktop(categoryKey) {
  const config = getCategoryConfig(categoryKey);
  return Boolean(
    config &&
    !config.removed &&
    !dismissedCategoryKeys.has(categoryKey)
  );
}

function isWidgetEligibleOnDesktop(widgetKey) {
  const config = getWidgetConfig(widgetKey);
  return Boolean(
    config &&
    (config.enabled || onboardingPreviewWidgetKeys.has(widgetKey))
  );
}

function isCategoryShownOnDesktop(categoryKey) {
  return desktopLayerVisible &&
    isCategoryEligibleOnDesktop(categoryKey) &&
    !isCategoryGrouped(categoryKey);
}

function isWidgetShownOnDesktop(widgetKey) {
  return desktopLayerVisible && isWidgetEligibleOnDesktop(widgetKey);
}

function clampBoundsToDesktopLayer(bounds) {
  const overlay = getDesktopLayerOverlayBounds();
  const maxX = Math.max(overlay.x, overlay.x + overlay.width - bounds.width);
  const maxY = Math.max(overlay.y, overlay.y + overlay.height - bounds.height);

  return {
    ...bounds,
    x: Math.round(Math.max(overlay.x, Math.min(bounds.x, maxX))),
    y: Math.round(Math.max(overlay.y, Math.min(bounds.y, maxY)))
  };
}

function getDesktopCategoryItem(categoryKey) {
  if (!isCategoryEligibleOnDesktop(categoryKey)) return null;

  const rendererState = getCategoryRendererState(categoryKey);
  const config = getCategoryConfig(categoryKey);
  if (!rendererState || !config) return null;

  const collapsed = collapsedCategories.has(categoryKey);
  const size = computeCategoryWindowSize(config.rows, config.cols);
  const height = collapsed ? DRAGBAR_HEIGHT : size.height;
  const bounds = clampBoundsToDesktopLayer(
    getInitialCategoryBounds(categoryKey, size.width, height)
  );

  return {
    ...rendererState,
    key: categoryKey,
    label: rendererState.categoryLabel,
    x: bounds.x,
    y: bounds.y,
    width: size.width,
    height,
    minWidth: MIN_CATEGORY_WINDOW_WIDTH,
    minHeight: MIN_CATEGORY_WINDOW_HEIGHT,
    collapsed
  };
}

function getDesktopGroupItem(group) {
  if (!group || !Array.isArray(group.keys) || group.keys.length < 2) return null;

  const tabs = group.keys
    .map((key) => {
      const rendererState = getCategoryRendererState(key);
      const config = getCategoryConfig(key);

      if (!rendererState || !config || config.removed) return null;

      return {
        key,
        label: rendererState.categoryLabel,
        defaultLabel: rendererState.defaultCategoryLabel,
        files: rendererState.files,
        total: rendererState.files.length,
        sortMode: rendererState.sortMode,
        mappedFolder: rendererState.mappedFolder,
        accentColor: rendererState.accentColor
      };
    })
    .filter(Boolean);

  if (tabs.length < 2) return null;

  const width = Math.max(
    GROUP_MIN_WIDTH,
    Math.min(GROUP_MAX_WIDTH, Math.round(Number(group.width) || GROUP_MIN_WIDTH))
  );
  const height = Math.max(
    GROUP_MIN_HEIGHT,
    Math.min(GROUP_MAX_HEIGHT, Math.round(Number(group.height) || GROUP_MIN_HEIGHT))
  );
  const fallback = getVirtualDesktopBounds();
  const bounds = clampBoundsToDesktopLayer({
    x: Number.isFinite(Number(group.x))
      ? Math.round(Number(group.x))
      : fallback.x + 64,
    y: Number.isFinite(Number(group.y))
      ? Math.round(Number(group.y))
      : fallback.y + 64,
    width,
    height
  });

  return {
    key: group.id,
    id: group.id,
    kind: "group",
    label: group.name || "标签组",
    x: bounds.x,
    y: bounds.y,
    width,
    height,
    minWidth: GROUP_MIN_WIDTH,
    minHeight: GROUP_MIN_HEIGHT,
    locked: Boolean(group.locked),
    activeKey: tabs.some((tab) => tab.key === group.activeKey)
      ? group.activeKey
      : tabs[0].key,
    tabs
  };
}

function getDesktopWidgetItem(widgetKey) {
  if (!isWidgetEligibleOnDesktop(widgetKey)) return null;

  const rendererState = getWidgetRendererState(widgetKey);
  const config = getWidgetConfig(widgetKey);
  const definition = WIDGET_BY_KEY.get(widgetKey);
  if (!rendererState || !config || !definition) return null;

  const width = Math.max(
    MIN_WIDGET_WIDTH,
    Math.min(2000, Math.round(Number(config.width) || definition.defaultWidth))
  );
  const height = Math.max(
    MIN_WIDGET_HEIGHT,
    Math.min(2000, Math.round(Number(config.height) || definition.defaultHeight))
  );
  const bounds = clampBoundsToDesktopLayer(
    getWidgetInitialBounds(widgetKey, width, height)
  );

  return {
    ...rendererState,
    key: widgetKey,
    x: bounds.x,
    y: bounds.y,
    width,
    height,
    minWidth: MIN_WIDGET_WIDTH,
    minHeight: MIN_WIDGET_HEIGHT,
    enabled: true
  };
}

function buildDesktopLayerState() {
  const overlay = getDesktopLayerOverlayBounds();
  const groupedCategoryKeys = getGroupedCategoryKeysOnDesktop();
  const categories = desktopLayerVisible
    ? CATEGORY_KEYS
      .filter((key) => !groupedCategoryKeys.has(key))
      .map((key) => getDesktopCategoryItem(key))
      .filter(Boolean)
    : [];
  const groups = desktopLayerVisible
    ? getTabGroups().map((group) => getDesktopGroupItem(group)).filter(Boolean)
    : [];
  const widgets = desktopLayerVisible
    ? WIDGET_DEFS.map((definition) => getDesktopWidgetItem(definition.key))
      .filter(Boolean)
    : [];

  desktopLayerRevision += 1;
  desktopLayerLastState = {
    ok: true,
    revision: desktopLayerRevision,
    overlay,
    componentsVisible: desktopLayerVisible,
    privacyActive: privacyModeActive,
    privacyRevision,
    settings: {
      tint: floatingConfig ? floatingConfig.tint : "system",
      customTint: floatingConfig ? floatingConfig.customTint : DEFAULT_CUSTOM_TINT,
      frosted: floatingConfig ? Boolean(floatingConfig.frosted) : true,
      material: getMaterialMode(),
      collapseMode: floatingConfig && floatingConfig.collapseMode
        ? floatingConfig.collapseMode
        : DEFAULT_COLLAPSE_MODE,
      followWallpaperBrightness: Boolean(
        floatingConfig && floatingConfig.followWallpaperBrightness
      ),
      wallpaperDark: Boolean(
        floatingConfig &&
        floatingConfig.followWallpaperBrightness &&
        getWallpaperThemeInfo().isDark
      ),
      performanceMode: Boolean(floatingConfig && floatingConfig.performanceMode),
      depth3d: Boolean(floatingConfig && floatingConfig.depth3d),
      musicVisualizer: floatingConfig && floatingConfig.musicVisualizer === undefined
        ? true
        : Boolean(floatingConfig && floatingConfig.musicVisualizer)
    },
    displays: screen.getAllDisplays().map((display) => ({
      id: String(display.id),
      x: display.workArea.x,
      y: display.workArea.y,
      width: display.workArea.width,
      height: display.workArea.height,
      primary: display.id === screen.getPrimaryDisplay().id
    })),
    categories,
    groups,
    widgets,
    desktopItems: desktopUnassignedItems
  };

  return desktopLayerLastState;
}

function readDesktopIconsMarker() {
  try {
    const raw = fsNative.readFileSync(getDesktopIconsStatePath(), "utf8");
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function writeDesktopIconsMarker(wasVisible) {
  try {
    fsNative.mkdirSync(path.dirname(getDesktopIconsStatePath()), {
      recursive: true
    });
    fsNative.writeFileSync(
      getDesktopIconsStatePath(),
      JSON.stringify({
        hiddenByUs: true,
        wasVisible: Boolean(wasVisible),
        at: new Date().toISOString()
      }, null, 2),
      "utf8"
    );
  } catch (error) {
    // Best effort; recovery also falls back to showing icons.
  }
}

function clearDesktopIconsMarker() {
  try {
    fsNative.unlinkSync(getDesktopIconsStatePath());
  } catch (error) {
    // No marker is the normal case.
  }
}

function recoverDesktopIconsAfterCrash() {
  const marker = readDesktopIconsMarker();

  if (!marker || marker.hiddenByUs !== true) return;

  // A marker means a previous run hid the icons but never got to restore them.
  const result = setDesktopIconsVisible(marker.wasVisible !== false);

  if (result.ok) {
    clearDesktopIconsMarker();
  }
}

function captureNativeDesktopIconsState() {
  const state = getDesktopIconState();
  nativeDesktopIconsInitiallyVisible = state.ok
    ? Boolean(state.visible)
    : true;
  desktopIconsHidden = state.ok ? state.visible === false : false;
}

function restoreNativeDesktopIcons() {
  const result = setDesktopIconsVisible(nativeDesktopIconsInitiallyVisible);

  if (!result.ok) {
    return result;
  }

  clearDesktopIconsMarker();
  desktopIconsHidden = result.visible === false;
  return result;
}

function syncNativeDesktopIcons() {
  const shouldHide = Boolean(
    desktopLayerAttached &&
    desktopLayerVisible &&
    !isQuitting
  );

  if (!shouldHide) {
    return restoreNativeDesktopIcons();
  }

  const result = setDesktopIconsVisible(false);

  if (!result.ok) {
    desktopIconsHidden = false;
    const reason = result.reason || "unknown";
    if (reason !== desktopIconsLastError) {
      desktopIconsLastError = reason;
      console.warn("[desktop-layer] 无法切换原生桌面图标:", reason);
    }
    return result;
  }

  desktopIconsLastError = "";
  const wasHidden = desktopIconsHidden;
  desktopIconsHidden = result.visible === false;

  if (result.changed && result.wasVisible) {
    // Remember the pre-hide state so a crash cannot leave the user without
    // native icons on the next launch.
    writeDesktopIconsMarker(result.wasVisible);
  }

  if (result.changed || wasHidden !== desktopIconsHidden) {
    console.log(
      "[desktop-layer] native desktop icons",
      desktopIconsHidden ? "hidden" : "visible",
      result.listView || ""
    );
  }

  return result;
}

// fs.watch 在 Windows 上偶尔会漏事件（OneDrive 重定向、被安全软件短暂锁住的
// 新建文件等）。轮询目录签名是兜底：即使原生监听丢了事件，2 秒内也会刷新。
function readDesktopDirectorySignature() {
  try {
    const root = getDesktopPath();
    const entries = fsNative.readdirSync(root, { withFileTypes: true });
    const parts = [];

    for (const entry of entries) {
      let stat = null;

      try {
        stat = fsNative.statSync(path.join(root, entry.name));
      } catch (error) {
        // 文件可能刚刚被改名或删除，下次轮询会重新计算。
      }

      parts.push([
        entry.name,
        entry.isDirectory() ? "d" : "f",
        stat ? Math.round(stat.mtimeMs) : 0,
        stat ? stat.size : 0
      ].join("\u0000"));
    }

    parts.sort();
    return parts.join("\u0001");
  } catch (error) {
    return null;
  }
}

function stopDesktopWatchPolling() {
  if (desktopWatchPollTimer) {
    clearInterval(desktopWatchPollTimer);
    desktopWatchPollTimer = null;
  }

  desktopWatchSignature = "";
  desktopWatchPollErrorLogged = false;
}

function startDesktopWatchPolling() {
  stopDesktopWatchPolling();
  desktopWatchSignature = readDesktopDirectorySignature() || "";

  desktopWatchPollTimer = setInterval(() => {
    if (isQuitting) return;

    const signature = readDesktopDirectorySignature();

    if (signature === null) {
      if (!desktopWatchPollErrorLogged) {
        desktopWatchPollErrorLogged = true;
        console.warn("[desktop-watch] 无法读取桌面目录，稍后继续重试");
      }
      return;
    }

    desktopWatchPollErrorLogged = false;

    if (signature === desktopWatchSignature) return;

    desktopWatchSignature = signature;
    scheduleDesktopWatchRefresh();
  }, 2000);

  if (typeof desktopWatchPollTimer.unref === "function") {
    desktopWatchPollTimer.unref();
  }
}

function stopDesktopWatcher() {
  if (desktopWatchTimer !== null) {
    clearTimeout(desktopWatchTimer);
    desktopWatchTimer = null;
  }

  if (desktopWatchHandle) {
    try {
      desktopWatchHandle.close();
    } catch (error) {
      // The watcher may already be closed by Node.
    }
    desktopWatchHandle = null;
  }

  stopDesktopWatchPolling();
  desktopWatchRefreshPending = false;
}

function scheduleDesktopWatchRefresh() {
  if (isQuitting) return;
  if (desktopWatchTimer !== null) {
    clearTimeout(desktopWatchTimer);
  }

  desktopWatchTimer = setTimeout(() => {
    desktopWatchTimer = null;
    refreshDesktopAfterFileChange();
  }, 180);
}

async function refreshDesktopAfterFileChange() {
  if (desktopWatchRefreshBusy) {
    desktopWatchRefreshPending = true;
    return;
  }

  desktopWatchRefreshBusy = true;

  try {
    await refreshFloatingData();
  } catch (error) {
    console.warn("[desktop-watch] 刷新桌面文件失败:", error.message || error);
  } finally {
    // Even if the full-state broadcast failed halfway through, tell the layer
    // to pull a fresh snapshot. This closes the watch → IPC → redraw loop for
    // files created after startup.
    sendDesktopLayerFilesChanged("watch");
    desktopWatchRefreshBusy = false;

    if (desktopWatchRefreshPending) {
      desktopWatchRefreshPending = false;
      scheduleDesktopWatchRefresh();
    }
  }
}

function startDesktopWatcher() {
  stopDesktopWatcher();

  try {
    desktopWatchHandle = fsNative.watch(
      getDesktopPath(),
      { persistent: false },
      () => scheduleDesktopWatchRefresh()
    );
    desktopWatchHandle.on("error", (error) => {
      console.warn("[desktop-watch] 监听桌面目录失败:", error.message || error);
    });
  } catch (error) {
    console.warn("[desktop-watch] 无法监听桌面目录:", error.message || error);
    desktopWatchHandle = null;
  }

  // 无论原生监听是否成功，都启动轻量轮询兜底。
  startDesktopWatchPolling();
}

function sendDesktopLayerState() {
  const state = buildDesktopLayerState();

  if (
    desktopLayerReady &&
    desktopLayerWindow &&
    !desktopLayerWindow.isDestroyed() &&
    !desktopLayerWindow.webContents.isDestroyed()
  ) {
    desktopLayerWindow.webContents.send("desktop-layer:state", state);
  }

  return state;
}

function sendDesktopLayerFilesChanged(reason) {
  if (
    !desktopLayerReady ||
    !desktopLayerWindow ||
    desktopLayerWindow.isDestroyed() ||
    desktopLayerWindow.webContents.isDestroyed()
  ) {
    return;
  }

  try {
    desktopLayerWindow.webContents.send("desktop-layer:files-changed", {
      reason: reason || "watch",
      revision: desktopLayerRevision,
      count: desktopUnassignedItems.length,
      at: Date.now()
    });
  } catch (error) {
    // The full state push remains the fallback if the nudge cannot be sent.
  }
}

function sendDesktopLayerMusic(payload) {
  if (
    !desktopLayerReady ||
    !desktopLayerWindow ||
    desktopLayerWindow.isDestroyed() ||
    desktopLayerWindow.webContents.isDestroyed()
  ) {
    return;
  }

  desktopLayerWindow.webContents.send("desktop-layer:music-update", payload);
}

// 音乐组件既可能挂在桌面层，也可能是一个独立的小组件窗口。
// 所有 SMTC 更新都必须同时广播到这两处，否则独立窗口只会停留在首次快照。
function broadcastMusicUpdate(payload) {
  sendDesktopLayerMusic(payload);

  const win = widgetWindows.get("music");

  if (
    !win ||
    win.isDestroyed() ||
    win.webContents.isDestroyed()
  ) {
    return;
  }

  win.webContents.send("widget:music-update", payload);
}

function applyDesktopLayerMouseIgnore(ignore, { force = false } = {}) {
  if (!desktopLayerWindow || desktopLayerWindow.isDestroyed()) return;

  const next =
    desktopLayerTourActive ||
    desktopLayerInteractionActive ||
    desktopLayerMenuOpen
      ? false
      : Boolean(ignore);

  if (!force && next === desktopLayerMouseIgnored) return;

  try {
    desktopLayerWindow.setIgnoreMouseEvents(next, { forward: true });
    desktopLayerMouseIgnored = next;

    if (process.env.ORGANIZER_DEBUG_PASSTHROUGH) {
      console.log(`[passthrough] ignore=${next} at ${Date.now()}`);
    }
  } catch (error) {
    // The window may have just been destroyed by an Explorer restart.
  }
}

function isCursorOverDesktopSurface() {
  const info = getCursorWindowInfo();

  if (!info || !info.className) return true;

  // While the layer is click-through WindowFromPoint resolves to Explorer's
  // DefView/list view. Once interactive it resolves to our Electron child.
  // Any other window means a normal application is on top, so the layer must
  // stay passive behind it. Matching the process ID also avoids confusing
  // another Chromium/Electron application with our desktop layer.
  if (isShellWindowClass(info.className)) return true;
  if (!info.className.startsWith("Chrome_")) return false;
  return info.processId === process.pid;
}

function isCursorOverDesktopLayerInteractive(point) {
  const state = desktopLayerLastState;

  if (!state || state.componentsVisible !== true) return false;

  if (desktopLayerFocusActive) {
    const pomodoro = state.widgets.find((item) => item.key === "pomodoro");

    return Boolean(
      pomodoro &&
      point.x >= pomodoro.x &&
      point.x < pomodoro.x + pomodoro.width &&
      point.y >= pomodoro.y &&
      point.y < pomodoro.y + pomodoro.height
    );
  }

  const items = [
    ...state.categories,
    ...(Array.isArray(state.groups) ? state.groups : []),
    ...state.widgets
  ];
  const overWidget = items.some((item) => (
    point.x >= item.x &&
    point.x < item.x + item.width &&
    point.y >= item.y &&
    point.y < item.y + item.height
  ));

  if (overWidget) return true;

  const overlay = state.overlay || { x: 0, y: 0 };
  const x = point.x - overlay.x;
  const y = point.y - overlay.y;

  return desktopIconRects.some((rect) => (
    x >= rect.x &&
    x < rect.x + rect.width &&
    y >= rect.y &&
    y < rect.y + rect.height
  ));
}

function updateDesktopLayerPointerMode() {
  if (
    !desktopLayerAttached ||
    !desktopLayerReady ||
    !desktopLayerWindow ||
    desktopLayerWindow.isDestroyed()
  ) {
    return;
  }

  if (desktopLayerMenuOpen || desktopLayerTourActive) {
    desktopLayerOutsideInteractiveSince = 0;
    applyDesktopLayerMouseIgnore(false);
    return;
  }

  if (desktopLayerInteractionActive) {
    // Safety net for a drag that loses its pointerup outside the layer (for
    // example when crossing onto a second monitor). If the primary button has
    // been released for a while, stop forcing the whole layer interactive.
    const heldFor = Date.now() - desktopLayerInteractionStartedAt;
    const buttonDown = isPrimaryButtonDown();

    if (
      desktopLayerInteractionStartedAt > 0 &&
      heldFor > 750 &&
      buttonDown === false
    ) {
      desktopLayerInteractionActive = false;
      desktopLayerInteractionStartedAt = 0;
    } else {
      desktopLayerOutsideInteractiveSince = 0;
      applyDesktopLayerMouseIgnore(false);
      return;
    }
  }

  let point;

  try {
    point = screen.getCursorScreenPoint();
  } catch (error) {
    return;
  }

  const overInteractive =
    isCursorOverDesktopLayerInteractive(point) &&
    isCursorOverDesktopSurface();

  if (overInteractive) {
    desktopLayerOutsideInteractiveSince = 0;
    applyDesktopLayerMouseIgnore(false);
    return;
  }

  // Hysteresis: do not return to click-through immediately when the pointer
  // crosses a small gap between two adjacent components. This is what keeps
  // the desktop from flickering during normal mouse movement.
  if (desktopLayerOutsideInteractiveSince === 0) {
    desktopLayerOutsideInteractiveSince = Date.now();
    return;
  }

  if (Date.now() - desktopLayerOutsideInteractiveSince >= 160) {
    releaseEmbeddedWindowFocus();
    applyDesktopLayerMouseIgnore(true);
  }
}

function startDesktopLayerPointerWatcher() {
  if (desktopLayerPointerTimer !== null) return;

  // 60 ms keeps entry responsive, but setIgnoreMouseEvents is only called when
  // the interactive/passive state actually changes.
  desktopLayerPointerTimer = setInterval(updateDesktopLayerPointerMode, 60);
}

function stopDesktopLayerPointerWatcher() {
  if (desktopLayerPointerTimer === null) return;
  clearInterval(desktopLayerPointerTimer);
  desktopLayerPointerTimer = null;
}

function scheduleDesktopLayerRecreate(delay = 900) {
  if (isQuitting || desktopLayerRecreateTimer !== null) return;

  desktopLayerRecreateTimer = setTimeout(() => {
    desktopLayerRecreateTimer = null;

    if (isQuitting) return;

    if (!desktopLayerWindow || desktopLayerWindow.isDestroyed()) {
      createDesktopLayerWindow();
    }
  }, delay);

  if (typeof desktopLayerRecreateTimer.unref === "function") {
    desktopLayerRecreateTimer.unref();
  }
}

async function handleDisplayTopologyChanged() {
  if (!floatingConfig || isQuitting) return;

  desktopLayerBounds = getVirtualDesktopBounds();

  if (desktopLayerWindow && !desktopLayerWindow.isDestroyed()) {
    // Never write screen coordinates straight into a reparented child window —
    // that is what pushed the whole layer off the top of the screen.
    applyDesktopLayerWindowGeometry(desktopLayerBounds);
    attachDesktopLayerWindow();
    ensureDesktopLayerGeometry();
  }

  let changed = false;

  for (const key of CATEGORY_KEYS) {
    const config = getCategoryConfig(key);
    if (!config || config.x === null || config.y === null) continue;

    const size = computeCategoryWindowSize(config.rows, config.cols);
    const bounds = clampBoundsToDesktopLayer({
      x: config.x,
      y: config.y,
      width: size.width,
      height: collapsedCategories.has(key) ? DRAGBAR_HEIGHT : size.height
    });

    if (bounds.x !== config.x || bounds.y !== config.y) {
      config.x = bounds.x;
      config.y = bounds.y;
      changed = true;
    }
  }

  for (const definition of WIDGET_DEFS) {
    const config = getWidgetConfig(definition.key);
    if (!config || config.x === null || config.y === null) continue;

    const bounds = clampBoundsToDesktopLayer({
      x: config.x,
      y: config.y,
      width: config.width,
      height: config.height
    });

    if (bounds.x !== config.x || bounds.y !== config.y) {
      config.x = bounds.x;
      config.y = bounds.y;
      changed = true;
    }
  }

  if (changed) {
    await persistFloatingConfig();
    notifyFloatingSettingsChanged();
  }

  sendDesktopLayerState();
  updateDesktopLayerPointerMode();
}

function scheduleDisplayTopologyCheck() {
  clearTimeout(displayTopologyTimer);
  displayTopologyTimer = setTimeout(() => {
    displayTopologyTimer = null;
    handleDisplayTopologyChanged().catch(() => {});
  }, 180);
}

function createDesktopLayerWindow() {
  if (desktopLayerWindow && !desktopLayerWindow.isDestroyed()) {
    return desktopLayerWindow;
  }

  desktopLayerBounds = getVirtualDesktopBounds();
  const bounds = desktopLayerBounds;
  const win = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    useContentSize: true,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    show: false,
    focusable: true,
    title: "桌面组件",
    ...getWindowIconOption(),
    webPreferences: {
      preload: path.join(__dirname, "desktop-preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false
    }
  });

  desktopLayerWindow = win;
  desktopLayerReady = false;
  desktopLayerAttached = false;
  desktopLayerHostInfo = null;
  desktopLayerAttachErrorLogged = false;
  desktopLayerMouseIgnored = false;
  desktopLayerOutsideInteractiveSince = 0;
  desktopLayerTourActive = false;
  onboardingRendererReady = false;
  desktopIconRects = [];

  win.setMenuBarVisibility(false);
  win.setBackgroundColor("#00000000");
  win.setIgnoreMouseEvents(true, { forward: true });
  desktopLayerMouseIgnored = true;

  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event) => event.preventDefault());

  win.webContents.on("did-finish-load", () => {
    if (win !== desktopLayerWindow || win.isDestroyed()) return;
    desktopLayerReady = true;
    desktopLayerInteractionActive = false;
    desktopLayerInteractionStartedAt = 0;
    desktopLayerFocusActive = false;
    desktopLayerMenuOpen = false;
    onboardingRendererReady = false;
    desktopLayerOutsideInteractiveSince = 0;
    sendDesktopLayerState();
    // 桌面层重载/重建后补发一次防窥状态，避免快捷键后的状态丢失。
    win.webContents.send("toggle-privacy", getPrivacyPayload());
    updateDesktopLayerPointerMode();
    flushAchievementToasts();

    if (globalFocusShortcutActive) {
      win.webContents.send("desktop-layer:shortcut-focus", true);
    }
  });

  win.webContents.on("render-process-gone", (_event, details) => {
    console.warn("[desktop-layer] renderer gone:", details);
    releaseEmbeddedWindowFocus();
    desktopLayerReady = false;
    desktopLayerAttached = false;
    desktopLayerInteractionActive = false;
    desktopLayerInteractionStartedAt = 0;
    desktopLayerFocusActive = false;
    desktopLayerMenuOpen = false;
    onboardingRendererReady = false;
    desktopLayerOutsideInteractiveSince = 0;

    if (onboardingActive) {
      onboardingPreviewWidgetKeys.clear();
      clearOnboardingRuntime({ restoreWindow: !isQuitting });
    }

    applyDesktopLayerMouseIgnore(true, { force: true });

    if (!isQuitting && !win.isDestroyed()) {
      win.reload();
    }
  });

  win.once("ready-to-show", () => {
    if (win !== desktopLayerWindow || win.isDestroyed()) return;
    setTimeout(() => attachDesktopLayerWindow(), 120);
  });

  win.on("closed", () => {
    if (desktopLayerWindow !== win) return;
    const wasQuitting = isQuitting;
    releaseEmbeddedWindowFocus();
    desktopLayerWindow = null;
    desktopLayerReady = false;
    desktopLayerAttached = false;
    desktopLayerInteractionActive = false;
    desktopLayerInteractionStartedAt = 0;
    desktopLayerFocusActive = false;
    desktopLayerMenuOpen = false;
    onboardingRendererReady = false;
    desktopLayerHostInfo = null;
    desktopLayerLastState = null;
    desktopLayerOutsideInteractiveSince = 0;
    desktopIconRects = [];
    stopDesktopLayerPointerWatcher();

    if (onboardingActive) {
      onboardingPreviewWidgetKeys.clear();
      clearOnboardingRuntime({ restoreWindow: !wasQuitting });
    }

    if (!wasQuitting) {
      restoreNativeDesktopIcons();
      scheduleDesktopLayerRecreate();
    }
  });

  win.loadFile(path.join(__dirname, "renderer", "desktop-layer.html"))
    .catch((error) => {
      console.warn("[desktop-layer] loadFile failed:", error.message);
    });

  return win;
}

function waitForDesktopLayerOnboarding(timeout = 6000) {
  return new Promise((resolve) => {
    const startedAt = Date.now();

    const check = () => {
      if (
        desktopLayerReady &&
        desktopLayerAttached &&
        onboardingRendererReady &&
        desktopLayerWindow &&
        !desktopLayerWindow.isDestroyed()
      ) {
        resolve(true);
        return;
      }

      if (Date.now() - startedAt >= timeout || isQuitting) {
        resolve(false);
        return;
      }

      setTimeout(check, 90);
    };

    check();
  });
}

function flushPendingOnboardingStart() {
  if (
    !onboardingPendingStart ||
    !onboardingRendererReady ||
    !desktopLayerReady ||
    !desktopLayerWindow ||
    desktopLayerWindow.isDestroyed()
  ) {
    return false;
  }

  const payload = onboardingPendingStart;
  onboardingPendingStart = null;
  desktopLayerTourActive = true;
  desktopLayerOutsideInteractiveSince = 0;
  applyDesktopLayerMouseIgnore(false, { force: true });

  try {
    desktopLayerWindow.webContents.send("onboarding:start", payload);
    return true;
  } catch (error) {
    desktopLayerTourActive = false;
    return false;
  }
}

function restoreMainWindowAfterOnboarding() {
  const shouldRestore = onboardingMainWindowWasVisible;
  onboardingMainWindowWasVisible = false;

  if (!shouldRestore || isQuitting) return;

  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
  }
}

function clearOnboardingRuntime({ restoreWindow = false } = {}) {
  onboardingActive = false;
  onboardingPendingStart = null;
  desktopLayerTourActive = false;
  onboardingPreviewWidgetKeys.clear();

  if (restoreWindow) {
    restoreMainWindowAfterOnboarding();
  } else {
    onboardingMainWindowWasVisible = false;
  }
}

async function startOnboardingTour({ source = "settings", step = 0 } = {}) {
  if (onboardingActive) {
    return { ok: true, active: true };
  }

  if (!onboardingState) {
    onboardingState = await loadOnboardingState();
  }

  if (!desktopLayerWindow || desktopLayerWindow.isDestroyed()) {
    createDesktopLayerWindow();
  }

  const ready = await waitForDesktopLayerOnboarding();

  if (!ready || isQuitting) {
    return {
      ok: false,
      error: "桌面引导层尚未就绪，请稍后重试。"
    };
  }

  if (source === "settings") {
    onboardingState = normalizeOnboardingState({
      ...onboardingState,
      completed: false,
      step: 0,
      completedAt: null,
      updatedAt: new Date().toISOString()
    });
    await persistOnboardingState();
  }

  const savedStep = Number.isInteger(Number(onboardingState.step))
    ? Math.max(0, Math.min(ONBOARDING_STEP_COUNT - 1, Number(onboardingState.step)))
    : 0;
  const nextStep = source === "settings"
    ? 0
    : Math.max(0, Math.min(ONBOARDING_STEP_COUNT - 1, Number(step) || savedStep));

  onboardingActive = true;
  onboardingMainWindowWasVisible = Boolean(
    mainWindow &&
    !mainWindow.isDestroyed() &&
    mainWindow.isVisible()
  );

  if (
    onboardingMainWindowWasVisible &&
    mainWindow &&
    !mainWindow.isDestroyed()
  ) {
    mainWindow.hide();
  }

  onboardingPendingStart = {
    step: nextStep,
    total: ONBOARDING_STEP_COUNT,
    source
  };

  if (!flushPendingOnboardingStart()) {
    clearOnboardingRuntime({ restoreWindow: true });
    return {
      ok: false,
      error: "无法显示桌面引导，请稍后重试。"
    };
  }

  return { ok: true, step: nextStep };
}

async function finishOnboardingTour(payload = {}) {
  const completed = payload.completed !== false;
  const finishedStep = Number.isFinite(Number(payload.step))
    ? Math.max(0, Math.min(ONBOARDING_STEP_COUNT - 1, Math.round(Number(payload.step))))
    : onboardingState.step;
  const now = new Date().toISOString();

  onboardingState = normalizeOnboardingState({
    ...onboardingState,
    completed,
    step: completed ? 0 : finishedStep,
    completedAt: completed ? now : null,
    updatedAt: now
  });

  onboardingActive = false;
  onboardingPendingStart = null;
  desktopLayerTourActive = false;
  desktopLayerInteractionActive = false;
  desktopLayerInteractionStartedAt = 0;
  onboardingPreviewWidgetKeys.clear();

  await persistOnboardingState();

  if (completed) {
    recordAchievement("onboarding-completed", { source: payload.source || "" });
  }

  sendDesktopLayerState();
  desktopLayerOutsideInteractiveSince = 0;
  updateDesktopLayerPointerMode();
  restoreMainWindowAfterOnboarding();

  return { ok: true, completed, step: onboardingState.step };
}

async function maybeStartInitialOnboarding() {
  if (isQuitting || onboardingActive || !onboardingState) return;
  if (onboardingState.completed) return;

  const ready = await waitForDesktopLayerOnboarding(8000);

  if (!ready || isQuitting || onboardingState.completed) return;

  await startOnboardingTour({
    source: "launch",
    step: onboardingState.step
  });
}

function attachDesktopLayerWindow() {
  if (
    desktopLayerAttachBusy ||
    !desktopLayerWindow ||
    desktopLayerWindow.isDestroyed()
  ) {
    return false;
  }

  desktopLayerAttachBusy = true;

  try {
    const hwnd = getNativeWindowHandle(desktopLayerWindow);
    if (hwnd === null) {
      throw new Error("Electron HWND is unavailable");
    }

    const wasAttached = desktopLayerAttached;
    const result = attachWindowToDesktop(hwnd);
    desktopLayerAttached = true;
    desktopLayerHostInfo = {
      host: result.host,
      hostClass: result.hostClass,
      defView: result.defView
    };

    if (!wasAttached || !result.alreadyAttached) {
      console.log(
        "[desktop-layer] attached:",
        result.hostClass,
        result.host,
        "defView:", result.defView
      );

      desktopLayerWindow.showInactive();
      desktopLayerMouseIgnored = false;
      applyDesktopLayerMouseIgnore(true, { force: true });
      sendDesktopLayerState();
    }

    desktopLayerAttachErrorLogged = false;
    syncNativeDesktopIcons();
    startDesktopLayerPointerWatcher();
    startDesktopLayerWatchdog();

    return true;
  } catch (error) {
    desktopLayerAttached = false;

    if (desktopIconsHidden) {
      // Never leave the user with a desktop that has neither native icons nor
      // a working desktop layer.
      restoreNativeDesktopIcons();
    }

    if (!desktopLayerAttachErrorLogged) {
      console.warn(
        "[desktop-layer] attach failed:",
        error && error.message ? error.message : error
      );
      desktopLayerAttachErrorLogged = true;
    }

    if (!desktopLayerHostInfo && desktopLayerWindow.isVisible()) {
      desktopLayerWindow.hide();
    }

    return false;
  } finally {
    desktopLayerAttachBusy = false;
  }
}

function startDesktopLayerWatchdog() {
  if (desktopLayerWatchdogTimer !== null) return;

  desktopLayerWatchdogTimer = setInterval(() => {
    if (isQuitting) return;

    if (!desktopLayerWindow || desktopLayerWindow.isDestroyed()) {
      scheduleDesktopLayerRecreate();
      return;
    }

    // Re-derive the host every tick. attachWindowToDesktop is a no-op when the
    // child is already under the current WorkerW and reattaches automatically
    // after Explorer rebuilds it.
    attachDesktopLayerWindow();

    // Then verify the layer still sits exactly on the union of work areas: a
    // reparent or a topology change can displace it, which hides the top row of
    // components even though every stored coordinate is still correct.
    ensureDesktopLayerGeometry();
  }, 3000);
}

function stopDesktopLayerMaintenance() {
  stopDesktopLayerPointerWatcher();

  if (desktopLayerWatchdogTimer !== null) {
    clearInterval(desktopLayerWatchdogTimer);
    desktopLayerWatchdogTimer = null;
  }

  if (desktopLayerRecreateTimer !== null) {
    clearTimeout(desktopLayerRecreateTimer);
    desktopLayerRecreateTimer = null;
  }
}

function persistFloatingConfig() {
  if (!floatingConfig) return Promise.resolve();

  const snapshot = JSON.parse(JSON.stringify(floatingConfig));

  floatingConfigSaveQueue = floatingConfigSaveQueue
    .then(() => saveFloatingConfig(getFloatingConfigPath(), snapshot))
    .catch(() => {});

  return floatingConfigSaveQueue;
}

function persistWidgetData() {
  const snapshot = normalizeWidgetData(widgetData);
  const write = () => saveWidgetData(getWidgetDataPath(), snapshot);
  const task = widgetDataSaveQueue.then(write, write);

  widgetDataSaveQueue = task.catch(() => {});
  return task;
}

function persistPomodoroHistory() {
  const snapshot = JSON.parse(JSON.stringify(pomodoroHistory));
  const write = () => savePomodoroHistory(getPomodoroHistoryPath(), snapshot);
  const task = pomodoroHistorySaveQueue.then(write, write);

  pomodoroHistorySaveQueue = task.catch(() => {});
  return task;
}

function persistFileTags() {
  if (!fileTags) return Promise.resolve();

  const snapshot = JSON.parse(JSON.stringify(fileTags));
  const write = () => saveFileTags(getFileTagsPath(), snapshot);
  const task = fileTagsSaveQueue.then(write, write);

  fileTagsSaveQueue = task.catch(() => {});
  return task;
}

function persistCategoryMappings() {
  if (!categoryMappings) return Promise.resolve();

  const snapshot = JSON.parse(JSON.stringify(categoryMappings));
  const write = () => saveCategoryMappings(getCategoryMappingsPath(), snapshot);
  const task = categoryMappingsSaveQueue.then(write, write);

  categoryMappingsSaveQueue = task.catch(() => {});
  return task;
}

function persistQuickAccess() {
  if (!quickAccess) return Promise.resolve();

  const snapshot = JSON.parse(JSON.stringify(quickAccess));
  const write = () => saveQuickAccess(getQuickAccessPath(), snapshot);
  const task = quickAccessSaveQueue.then(write, write);

  quickAccessSaveQueue = task.catch(() => {});
  return task;
}

function persistComponentAppearance() {
  if (!componentAppearance) return Promise.resolve();

  const snapshot = JSON.parse(JSON.stringify(componentAppearance));
  const write = () => saveComponentAppearance(getComponentAppearancePath(), snapshot);
  const task = componentAppearanceSaveQueue.then(write, write);

  componentAppearanceSaveQueue = task.catch(() => {});
  return task;
}

function persistCategoryMap() {
  if (!categoryMap) return Promise.resolve();

  const snapshot = JSON.parse(JSON.stringify(categoryMap));
  const write = async () => {
    categoryMap = await saveCategoryMap(getCategoryMapPath(), snapshot);
  };
  const task = categoryMapSaveQueue.then(write, write);

  categoryMapSaveQueue = task.catch(() => {});

  return task;
}

function enqueueManualOperation(operation) {
  const result = manualOperationQueue.then(operation, operation);
  manualOperationQueue = result.catch(() => {});
  return result;
}

function getCategoryLabel(categoryKey) {
  const definition = getCategoryDef(categoryKey);
  return definition ? definition.label : categoryKey;
}

function getManualStatus() {
  const status = getManualUndoStatus(categoryMap);
  const last = status.last;

  return {
    ok: true,
    available: status.available,
    last: last
      ? {
          ...last,
          fromLabel: getCategoryLabel(last.fromCategory),
          toLabel: getCategoryLabel(last.toCategory)
        }
      : null
  };
}

function notifyManualStatusChanged() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("manual:status-changed", getManualStatus());
}

async function writeAssignLogWithFallback(entry) {
  return writeLogWithFallback((logDir) => writeAssignLog({ logDir, entry }));
}

function buildAssignLogEntry({ action, at, path: filePath, name, fromCategory, toCategory }) {
  return {
    action,
    at,
    path: filePath,
    name,
    fromCategory,
    toCategory,
    fromLabel: getCategoryLabel(fromCategory),
    toLabel: getCategoryLabel(toCategory)
  };
}

function applyManualAssignmentsToPlan(plan) {
  if (!plan || !Array.isArray(plan.categories)) return plan;

  for (const category of plan.categories) {
    for (const file of category.files) {
      const assignment = getAssignment(categoryMap, file.sourcePath);
      file.assignedCategory = assignment ? assignment.category : null;
      file.isOrganized = Boolean(assignment);
    }
  }

  return plan;
}

function findPendingPlanFile(sourcePath) {
  if (!pendingPlan || typeof sourcePath !== "string") return null;

  const key = normalizePathKey(sourcePath);

  for (const category of pendingPlan.categories) {
    const file = category.files.find(
      (item) => normalizePathKey(item.sourcePath) === key
    );

    if (file) return { file, category };
  }

  return null;
}

async function applyManualAssignment({
  filePath,
  name,
  kind = "file",
  fromCategory,
  toCategory,
  refreshFloating = false
}) {
  const at = new Date();
  const result = setAssignment(categoryMap, {
    path: filePath,
    name,
    category: toCategory,
    kind,
    runId: null,
    source: "manual",
    fromCategory,
    at
  });

  if (!result.changed) {
    return { ok: true, changed: false, status: getManualStatus() };
  }

  let saveError = null;

  try {
    await persistCategoryMap();
  } catch (error) {
    saveError = error.message || "分类归属记录保存失败。";
  }

  const log = await writeAssignLogWithFallback(buildAssignLogEntry({
    action: "assign",
    at,
    path: filePath,
    name,
    fromCategory,
    toCategory
  }));

  if (refreshFloating) {
    try {
      await refreshFloatingData(undefined, { show: false });
    } catch (error) {
      // 悬浮窗刷新失败不影响归属记录
    }
  }

  notifyManualStatusChanged();

  return {
    ok: true,
    changed: true,
    path: filePath,
    name,
    fromCategory,
    toCategory,
    assignedCategory: toCategory,
    status: getManualStatus(),
    saveError,
    logPath: log.logPath,
    logError: log.logError
  };
}

function getMaterialMode() {
  if (!floatingConfig || !floatingConfig.frosted) return "off";
  return nativeMaterialAvailable ? "native" : "css";
}

function applyWindowMaterial(win) {
  if (!win || win.isDestroyed()) return;
  if (typeof win.setBackgroundMaterial !== "function") return;

  // Windows 10 不支持系统材质；不要调用 setBackgroundMaterial("none")，
  // 否则可能干扰透明窗口，直接交给 CSS backdrop-filter 回退。
  if (!nativeMaterialAvailable) return;

  if (!floatingConfig || !floatingConfig.frosted) {
    try {
      win.setBackgroundMaterial("none");
    } catch (error) {
      // 忽略
    }
    return;
  }

  try {
    win.setBackgroundMaterial("acrylic");
  } catch (error) {
    nativeMaterialAvailable = false;
    for (const windowMap of [floatingWindows, widgetWindows]) {
      for (const existing of windowMap.values()) {
        if (existing && !existing.isDestroyed()) {
          try {
            existing.setBackgroundMaterial("none");
          } catch (materialError) {
            // ignore
          }
        }
      }
    }
    sendAllFloatingUpdates();
    notifyFloatingSettingsChanged();
  }
}

function getSmartThemeConfig() {
  return normalizeSmartThemeSettings(floatingConfig && floatingConfig.smartTheme);
}

function getCurrentSmartThemeState() {
  return getSmartThemeState(new Date(), getSmartThemeConfig());
}

function getEffectiveComponentAccent(kind, key) {
  const custom = getComponentAccent(componentAppearance, kind, key);

  if (custom) return custom;

  const state = getCurrentSmartThemeState();
  return state.enabled && state.color ? state.color : "";
}

function getUiBackground() {
  return normalizeUiBackground(floatingConfig && floatingConfig.uiBackground);
}

function getUiBackgroundUrl() {
  const background = getUiBackground();

  if (background.type !== "image" || !background.imagePath) return null;

  try {
    return pathToFileURL(background.imagePath).href;
  } catch (error) {
    return null;
  }
}

function getCategoryRendererState(categoryKey) {
  const definition = getCategoryDef(categoryKey);
  const config = getCategoryConfig(categoryKey);
  const data = getCategoryData(categoryKey);

  if (!definition || !config) return null;

  return {
    ok: true,
    categoryKey,
    categoryLabel: getCategoryDisplayName(categoryKey),
    defaultCategoryLabel: definition.label,
    files: data.files,
    rows: config.rows,
    cols: config.cols,
    locked: config.locked,
    tint: floatingConfig.tint,
    customTint: floatingConfig.customTint,
    frosted: Boolean(floatingConfig.frosted),
    material: getMaterialMode(),
    collapseMode: floatingConfig.collapseMode || DEFAULT_COLLAPSE_MODE,
    collapsed: collapsedCategories.has(categoryKey),
    total: data.files.length,
    sortMode: config.sortMode || DEFAULT_SORT_MODE,
    mappedFolder: getMappedFolder(categoryMappings, categoryKey),
    accentColor: getEffectiveComponentAccent("category", categoryKey)
  };
}

function getFloatingSettings() {
  const groupedCategoryKeys = getGroupedCategoryKeysOnDesktop();
  const categories = CATEGORY_DEFS.map((definition) => {
    const config = getCategoryConfig(definition.key);
    const data = getCategoryData(definition.key);
    const size = computeCategoryWindowSize(
      config ? config.rows : DEFAULT_ROWS,
      config ? config.cols : DEFAULT_COLS
    );

    return {
      key: definition.key,
      label: getCategoryDisplayName(definition.key),
      defaultLabel: definition.label,
      name: config ? config.name : "",
      removed: Boolean(config && config.removed),
      locked: Boolean(config && config.locked),
      rows: config ? config.rows : DEFAULT_ROWS,
      cols: config ? config.cols : DEFAULT_COLS,
      width: size.width,
      height: size.height,
      itemCount: data.files.length,
      mappedFolder: getMappedFolder(categoryMappings, definition.key),
      grouped: groupedCategoryKeys.has(definition.key),
      visible: isCategoryShownOnDesktop(definition.key)
    };
  });

  const widgets = WIDGET_DEFS.map((definition) => {
    const config = getWidgetConfig(definition.key);
    const clockSettings = definition.key === "clock"
      ? normalizeClockSettings(config || {})
      : null;

    return {
      key: definition.key,
      label: getWidgetDisplayName(definition.key),
      defaultLabel: definition.label,
      name: config ? config.name : "",
      enabled: Boolean(config && config.enabled),
      locked: Boolean(config && config.locked),
      width: config ? config.width : definition.defaultWidth,
      height: config ? config.height : definition.defaultHeight,
      minWidth: MIN_WIDGET_WIDTH,
      minHeight: MIN_WIDGET_HEIGHT,
      defaultWidth: definition.defaultWidth,
      defaultHeight: definition.defaultHeight,
      defaultCols: definition.defaultCols,
      defaultRows: definition.defaultRows,
      hasBackground: Boolean(config && config.backgroundImage),
      backgroundName: config && config.backgroundImage
        ? path.basename(config.backgroundImage)
        : "",
      backgroundIsBing: isBingBackground(config),
      visible: isWidgetShownOnDesktop(definition.key),
      ...(clockSettings || {})
    };
  });

  const categoryVisibleCount = categories.filter((category) => category.visible).length;
  const widgetVisibleCount = widgets.filter((widget) => widget.visible).length;
  const groupVisibleCount = desktopLayerVisible
    ? getTabGroups().filter((group) => Boolean(getDesktopGroupItem(group))).length
    : 0;

  return {
    ok: true,
    tint: floatingConfig ? floatingConfig.tint : "system",
    customTint: floatingConfig ? floatingConfig.customTint : DEFAULT_CUSTOM_TINT,
    frosted: floatingConfig ? Boolean(floatingConfig.frosted) : true,
    collapseMode: floatingConfig && floatingConfig.collapseMode
      ? floatingConfig.collapseMode
      : DEFAULT_COLLAPSE_MODE,
    followWallpaperBrightness: Boolean(
      floatingConfig && floatingConfig.followWallpaperBrightness
    ),
    performanceMode: Boolean(floatingConfig && floatingConfig.performanceMode),
    depth3d: Boolean(floatingConfig && floatingConfig.depth3d),
    musicVisualizer: floatingConfig && floatingConfig.musicVisualizer === undefined
      ? true
      : Boolean(floatingConfig && floatingConfig.musicVisualizer),
    wallpaperTheme: getWallpaperThemeInfo(),
    material: getMaterialMode(),
    nativeAvailable: nativeMaterialAvailable,
    smartTheme: getSmartThemeConfig(),
    smartThemeState: getCurrentSmartThemeState(),
    uiBackground: {
      ...getUiBackground(),
      url: getUiBackgroundUrl()
    },
    clockOptions: {
      timeFormats: CLOCK_TIME_FORMATS,
      dateFormats: CLOCK_DATE_FORMATS,
      maxTextLength: MAX_CLOCK_TEXT_LENGTH
    },
    categories,
    widgets,
    privacyActive: privacyModeActive,
    visibleCount: categoryVisibleCount + widgetVisibleCount + groupVisibleCount,
    categoryVisibleCount,
    widgetVisibleCount,
    groupVisibleCount
  };
}

function notifyFloatingSettingsChanged() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("floating:settings-changed", getFloatingSettings());
}

function startSmartThemeWatcher() {
  if (smartThemeWatcherTimer !== null) return;

  smartThemeLastSignature = getSmartThemeSignature(getCurrentSmartThemeState());

  smartThemeWatcherTimer = setInterval(() => {
    const state = getCurrentSmartThemeState();
    const signature = getSmartThemeSignature(state);

    if (signature === smartThemeLastSignature) return;

    smartThemeLastSignature = signature;
    sendDesktopLayerState();
    notifyFloatingSettingsChanged();
  }, 60 * 1000);
}

function stopSmartThemeWatcher() {
  if (smartThemeWatcherTimer === null) return;
  clearInterval(smartThemeWatcherTimer);
  smartThemeWatcherTimer = null;
}

function sendFloatingUpdate() {
  sendDesktopLayerState();
}

function sendAllFloatingUpdates() {
  sendDesktopLayerState();
}

function getCategoryKeyForWebContents(contents) {
  if (!contents) return null;
  return floatingWindowCategories.get(contents.id) || null;
}

function clampFloatingBounds({ x, y, width, height }) {
  const area = getVirtualDesktopBounds();

  return {
    x: Math.max(area.x, Math.min(x, area.x + area.width - width)),
    y: Math.max(area.y, Math.min(y, area.y + area.height - height)),
    width,
    height
  };
}

function emptyGuidePayload() {
  return { vertical: [], horizontal: [] };
}

function isSnappableWindow(win) {
  return Boolean(win && !win.isDestroyed() && win.isVisible());
}

function getSnapWindowConfig(kind, key) {
  return kind === "category" ? getCategoryConfig(key) : getWidgetConfig(key);
}

function collectSnapTargets(excludeWindow) {
  const targets = [];

  for (const key of CATEGORY_KEYS) {
    const config = getCategoryConfig(key);
    const target = floatingWindows.get(key);

    if (
      !config ||
      config.locked ||
      !target ||
      target === excludeWindow ||
      !isSnappableWindow(target)
    ) {
      continue;
    }

    targets.push(target.getBounds());
  }

  for (const [key, target] of widgetWindows) {
    const config = getWidgetConfig(key);

    if (
      !config ||
      config.locked ||
      !target ||
      target === excludeWindow ||
      !isSnappableWindow(target)
    ) {
      continue;
    }

    targets.push(target.getBounds());
  }

  return targets;
}

function getSnapResultForWindow(win) {
  const bounds = win.getBounds();
  const display = screen.getDisplayMatching(bounds);
  const result = computeSnap({
    bounds,
    workArea: display.workArea,
    targets: collectSnapTargets(win),
    threshold: SNAP_THRESHOLD
  });

  return { bounds, display, result };
}

function createGuideWindow() {
  if (guideWindow && !guideWindow.isDestroyed()) return guideWindow;

  const display = screen.getPrimaryDisplay();

  guideWindow = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    focusable: false,
    alwaysOnTop: true,
    title: "对齐辅助线",
    ...getWindowIconOption(),
    webPreferences: {
      preload: path.join(__dirname, "guides-preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  guideWindowReady = false;
  guideWindow.setIgnoreMouseEvents(true, { forward: true });
  if (typeof guideWindow.setFocusable === "function") {
    guideWindow.setFocusable(false);
  }
  guideWindow.setAlwaysOnTop(true, "screen-saver");
  guideWindow.loadFile(path.join(__dirname, "renderer", "guides.html"));
  guideWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  guideWindow.webContents.on("will-navigate", (event) => event.preventDefault());
  guideWindow.webContents.on("did-finish-load", () => {
    guideWindowReady = true;
    if (guideWindow && !guideWindow.isDestroyed()) {
      guideWindow.webContents.send("guides:update", guidePayload);
    }
  });
  guideWindow.on("closed", () => {
    guideWindow = null;
    guideWindowReady = false;
  });

  return guideWindow;
}

function ensureGuideWindow(display) {
  const win = createGuideWindow();
  const bounds = win.getBounds();
  const target = display.bounds;

  if (
    bounds.x !== target.x ||
    bounds.y !== target.y ||
    bounds.width !== target.width ||
    bounds.height !== target.height
  ) {
    win.setBounds(target);
  }

  return win;
}

function localizeGuideLines(result, display) {
  const originX = display.bounds.x;
  const originY = display.bounds.y;
  const maxX = display.bounds.width;
  const maxY = display.bounds.height;
  const clampX = (value) => Math.max(0, Math.min(maxX, Math.round(value - originX)));
  const clampY = (value) => Math.max(0, Math.min(maxY, Math.round(value - originY)));

  return {
    vertical: result.verticalLines
      .map((line) => ({
        x: clampX(line.x),
        y1: clampY(line.y1),
        y2: clampY(line.y2)
      }))
      .filter((line) => line.y2 > line.y1),
    horizontal: result.horizontalLines
      .map((line) => ({
        y: clampY(line.y),
        x1: clampX(line.x1),
        x2: clampX(line.x2)
      }))
      .filter((line) => line.x2 > line.x1)
  };
}

function hideGuideOverlay() {
  if (guideHideTimer) {
    clearTimeout(guideHideTimer);
    guideHideTimer = null;
  }

  const empty = emptyGuidePayload();
  const signature = JSON.stringify(empty);

  if (signature !== guidePayloadSignature) {
    guidePayloadSignature = signature;
    guidePayload = empty;

    if (guideWindow && !guideWindow.isDestroyed() && guideWindowReady) {
      guideWindow.webContents.send("guides:update", guidePayload);
    }
  }

  if (guideWindow && !guideWindow.isDestroyed() && guideWindow.isVisible()) {
    guideWindow.hide();
  }
}

function scheduleGuideHide() {
  if (guideHideTimer) clearTimeout(guideHideTimer);

  guideHideTimer = setTimeout(() => {
    guideHideTimer = null;
    hideGuideOverlay();
  }, 2500);
}

function showGuideOverlay(display, payload) {
  const win = ensureGuideWindow(display);
  const signature = JSON.stringify(payload);

  if (signature !== guidePayloadSignature) {
    guidePayloadSignature = signature;
    guidePayload = payload;

    if (guideWindowReady && win && !win.isDestroyed()) {
      win.webContents.send("guides:update", payload);
    }
  }

  if (win && !win.isDestroyed() && !win.isVisible()) {
    win.showInactive();
  }

  scheduleGuideHide();
}

function suppressSnapFeedback(duration = 400) {
  snapSuppressUntil = Date.now() + duration;
  hideGuideOverlay();
}

function handleWindowMove(kind, key, win) {
  if (!isSnappableWindow(win)) {
    hideGuideOverlay();
    return;
  }

  const config = getSnapWindowConfig(kind, key);

  if (!config || config.locked) {
    hideGuideOverlay();
    return;
  }

  if (Date.now() < snapSuppressUntil) return;

  // 只在用户拖动窗口时显示对齐线，避免程序化移动时闪一下。
  if (isPrimaryButtonDown() === false) {
    hideGuideOverlay();
    return;
  }

  const { display, result } = getSnapResultForWindow(win);

  if (result.verticalLines.length === 0 && result.horizontalLines.length === 0) {
    hideGuideOverlay();
    return;
  }

  snapMoveTimes.set(win, Date.now());
  showGuideOverlay(display, localizeGuideLines(result, display));
}

function applySnapOnRelease(kind, key, win) {
  clearTimeout(snapReleaseTimers.get(win));
  snapReleaseTimers.delete(win);
  hideGuideOverlay();

  if (!isSnappableWindow(win)) return;

  const config = getSnapWindowConfig(kind, key);
  if (!config || config.locked) return;
  if (Date.now() < snapSuppressUntil) return;
  if (Date.now() - (snapAppliedAt.get(win) || 0) < 600) return;

  const lastMove = snapMoveTimes.get(win) || 0;
  snapMoveTimes.delete(win);

  // 只有确实发生过拖动才吸附，避免窗口尺寸变化等事件误触发。
  if (Date.now() - lastMove > SNAP_DRAG_MEMORY_MS) return;

  const { bounds, result } = getSnapResultForWindow(win);

  if (result.x === bounds.x && result.y === bounds.y) return;

  snapSuppressUntil = Date.now() + 300;
  snapAppliedAt.set(win, Date.now());
  win.setBounds({
    x: result.x,
    y: result.y,
    width: bounds.width,
    height: bounds.height
  });

  if (kind === "category") {
    scheduleFloatingPositionSave(key);
  } else {
    scheduleWidgetPositionSave(key);
  }
}

function scheduleSnapWhenReleased(kind, key, win) {
  clearTimeout(snapReleaseTimers.get(win));

  snapReleaseTimers.set(win, setTimeout(() => {
    snapReleaseTimers.delete(win);

    if (!win || win.isDestroyed()) return;

    if (isPrimaryButtonDown() === true) {
      scheduleSnapWhenReleased(kind, key, win);
      return;
    }

    applySnapOnRelease(kind, key, win);
  }, 120));
}

function handleWindowMoved(kind, key, win) {
  recordAchievement("layout-move", { kind, key });
  const primaryDown = isPrimaryButtonDown();
  const lastMove = snapMoveTimes.get(win) || 0;

  if (primaryDown === true && Date.now() - lastMove <= SNAP_DRAG_MEMORY_MS) {
    // 少数情况下 moved 会在拖动过程中触发，等鼠标松开后再吸附。
    scheduleSnapWhenReleased(kind, key, win);
    return;
  }

  hideGuideOverlay();
  applySnapOnRelease(kind, key, win);
}

function initializeCollapsedCategoriesForMode() {
  collapsedCategories.clear();

  if (
    floatingConfig &&
    floatingConfig.collapseMode === "hover"
  ) {
    for (const key of CATEGORY_KEYS) {
      collapsedCategories.add(key);
    }
  }
}

function applyInitialCategoryAutoLayout() {
  if (!floatingConfig) return false;

  const area = screen.getPrimaryDisplay().workArea;
  const margin = 100;
  const gap = 40;
  const maxColumns = 3;
  const occupied = [];
  let changed = false;

  // Keep the auto layout clear of desktop widgets which are already enabled.
  for (const definition of WIDGET_DEFS) {
    const config = getWidgetConfig(definition.key);
    if (!config || !config.enabled) continue;

    const width = Math.max(MIN_WIDGET_WIDTH, Math.min(2000, config.width));
    const height = Math.max(MIN_WIDGET_HEIGHT, Math.min(2000, config.height));
    occupied.push(getWidgetInitialBounds(definition.key, width, height));
  }

  const intersects = (candidate) => occupied.some((box) => (
    candidate.x < box.x + box.width &&
    candidate.x + candidate.width > box.x &&
    candidate.y < box.y + box.height &&
    candidate.y + candidate.height > box.y
  ));

  if (process.env.ORGANIZER_LAYOUT_DEBUG) {
    console.log("[layout-debug] workArea:", JSON.stringify(area));
    occupied.forEach((b, i) => {
      console.log(`[layout-debug] occupied[${i}]: x=${b.x} y=${b.y} w=${b.width} h=${b.height}`);
    });
  }

  let slot = 0;
  const maxSlots = 24;

  for (const key of CATEGORY_KEYS) {
    const config = getCategoryConfig(key);
    if (!config) continue;

    const size = computeCategoryWindowSize(
      config.rows || DEFAULT_ROWS,
      config.cols || DEFAULT_COLS
    );
    let nextX = area.x + margin;
    let nextY = area.y + margin;

    for (let attempt = 0; attempt < maxSlots; attempt += 1) {
      const column = slot % maxColumns;
      const row = Math.floor(slot / maxColumns);
      nextX = area.x + margin + column * (size.width + gap);
      nextY = area.y + margin + row * (size.height + gap);
      const candidate = {
        x: nextX,
        y: nextY,
        width: size.width,
        height: size.height
      };

      if (
        !intersects(candidate) &&
        nextX + size.width <= area.x + area.width - margin &&
        nextY + size.height <= area.y + area.height - margin
      ) {
        break;
      }

      slot += 1;
    }

    const safeX = Math.round(Math.max(
      area.x + margin,
      Math.min(nextX, area.x + area.width - margin - size.width)
    ));
    const safeY = Math.round(Math.max(
      area.y + margin,
      Math.min(nextY, area.y + area.height - margin - size.height)
    ));

    if (config.x !== safeX || config.y !== safeY) {
      config.x = safeX;
      config.y = safeY;
      changed = true;
    }

    occupied.push({ x: safeX, y: safeY, width: size.width, height: size.height });
    slot += 1;
  }

  floatingConfig.autoLayoutVersion = 1;
  return true;
}

// Right-hand component grid.
//
// Every component is exactly one cell: W x H, where W/H are the pomodoro's
// minimum usable size (MIN_WIDGET_WIDTH / MIN_WIDGET_HEIGHT). The clock spans
// two columns, so it is 2W + Gap wide and H tall. Gap is the fixed gutter used
// both inside the clock's width and between every pair of cells.
const WIDGET_GRID_EDGE = 20;
const WIDGET_GRID_MIN_SCALE = 0.35;

function getWidgetGridSpan(definition) {
  return definition && definition.gridSpan === 2 ? 2 : 1;
}

// Places every component on the grid, column-major from the right edge:
// fill a column top-to-bottom, then open the next column to its left. A
// spanning component only takes a slot when consecutive columns are free at
// that row, so two components can never share a cell.
function planWidgetGrid(area, cellWidth, cellHeight, gap) {
  const margin = WIDGET_GRID_EDGE;
  const left = Math.round(area.x);
  const top = Math.round(area.y);
  const right = left + Math.round(area.width);
  const bottom = top + Math.round(area.height);

  const usableHeight = Math.max(1, bottom - top - margin * 2);
  const rowsPerColumn = Math.max(
    1,
    Math.floor((usableHeight + gap) / (cellHeight + gap))
  );

  // Right edge of grid column `index`, counting from the display's right margin.
  const columnRight = (index) => right - margin - index * (cellWidth + gap);
  const rowTop = (index) => top + margin + index * (cellHeight + gap);

  const columns = [];
  const placed = [];

  const isFree = (columnIndex, row) => {
    const occupancy = columns[columnIndex];
    return !occupancy || !occupancy.has(row);
  };

  for (const definition of WIDGET_DEFS) {
    const span = getWidgetGridSpan(definition);
    let target = null;

    for (let column = 0; column <= columns.length && !target; column += 1) {
      for (let row = 0; row < rowsPerColumn; row += 1) {
        let free = true;

        for (let offset = 0; offset < span; offset += 1) {
          if (!isFree(column + offset, row)) {
            free = false;
            break;
          }
        }

        if (free) {
          target = { column, row };
          break;
        }
      }
    }

    // The grid always grows by opening a new column, so a slot is guaranteed.
    if (!target) continue;

    for (let offset = 0; offset < span; offset += 1) {
      const index = target.column + offset;
      if (!columns[index]) columns[index] = new Set();
      columns[index].add(target.row);
    }

    const width = span === 1
      ? cellWidth
      : span * cellWidth + (span - 1) * gap;

    placed.push({
      definition,
      width,
      height: cellHeight,
      x: columnRight(target.column) - width,
      y: rowTop(target.row),
      column: target.column,
      row: target.row,
      span
    });
  }

  const columnCount = Math.max(1, columns.length);

  return {
    placed,
    columns: columnCount,
    cellWidth,
    cellHeight,
    gap,
    neededWidth: columnCount * cellWidth + (columnCount - 1) * gap
  };
}

// Strict grid sizing for the first-run layout and the reset action. On a normal
// display the exact W x H grid is used. Only when it physically cannot fit the
// usable width do we fall back to a uniformly scaled grid — scaling keeps the
// clock at exactly 2W + Gap so the layout stays regular and overlap-free.
function computeWidgetGridLayout(area) {
  const baseWidth = MIN_WIDGET_WIDTH;
  const baseHeight = MIN_WIDGET_HEIGHT;
  const gap = WIDGET_GRID_GAP;
  const usableWidth = Math.max(
    1,
    Math.round(area.width) - WIDGET_GRID_EDGE * 2
  );

  let layout = planWidgetGrid(area, baseWidth, baseHeight, gap);
  let scale = 1;

  if (layout.neededWidth > usableWidth) {
    let low = WIDGET_GRID_MIN_SCALE;
    let high = 1;
    let best = null;

    for (let attempt = 0; attempt < 18; attempt += 1) {
      const mid = (low + high) / 2;
      const candidate = planWidgetGrid(
        area,
        Math.max(1, Math.round(baseWidth * mid)),
        Math.max(1, Math.round(baseHeight * mid)),
        Math.max(1, Math.round(gap * mid))
      );

      if (candidate.neededWidth <= usableWidth) {
        low = mid;
        best = { layout: candidate, scale: mid };
      } else {
        high = mid;
      }
    }

    if (best) {
      layout = best.layout;
      scale = best.scale;
    } else {
      scale = low;
      layout = planWidgetGrid(
        area,
        Math.max(1, Math.round(baseWidth * low)),
        Math.max(1, Math.round(baseHeight * low)),
        Math.max(1, Math.round(gap * low))
      );
    }
  }

  return { ...layout, scale };
}

// Writes the computed grid onto every component config.
function applyWidgetGridLayout() {
  if (!floatingConfig) return false;

  const area = screen.getPrimaryDisplay().workArea;
  const layout = computeWidgetGridLayout(area);

  for (const entry of layout.placed) {
    const config = getWidgetConfig(entry.definition.key);
    if (!config) continue;

    config.locked = false;
    config.width = Math.max(1, Math.round(entry.width));
    config.height = Math.max(1, Math.round(entry.height));
    // The default formula is only applied on first run and on reset, so the
    // result is by definition not a user size.
    config.sizeCustomized = false;
    config.x = Math.round(entry.x);
    config.y = Math.round(entry.y);
  }

  if (process.env.ORGANIZER_LAYOUT_DEBUG) {
    console.log(
      `[layout-debug] grid: widgets=${layout.placed.length} columns=${layout.columns} ` +
      `cell=${layout.cellWidth}x${layout.cellHeight} gap=${layout.gap} ` +
      `scale=${layout.scale.toFixed(2)} neededWidth=${layout.neededWidth} ` +
      `workArea=${Math.round(area.width)}x${Math.round(area.height)} ` +
      `origin=(${Math.round(area.x)},${Math.round(area.y)})`
    );
    layout.placed.forEach((entry) => {
      console.log(
        `[layout-debug]   ${entry.definition.key}: x=${Math.round(entry.x)} ` +
        `y=${Math.round(entry.y)} w=${Math.round(entry.width)} ` +
        `h=${Math.round(entry.height)} col=${entry.column} row=${entry.row}`
      );
    });
  }

  return true;
}

// First-run layout: every component starts enabled with the strict default
// size (clock 2W + Gap wide, everything else W x H) and is parked on the grid
// hugging the right edge of the primary work area.
function applyInitialWidgetRailLayout() {
  if (!floatingConfig) return false;
  if ((Number(floatingConfig.widgetRailVersion) || 0) >= 1) return false;

  for (const definition of WIDGET_DEFS) {
    const config = getWidgetConfig(definition.key);
    if (!config) continue;

    config.enabled = true;
    config.locked = false;
    config.width = definition.defaultWidth;
    config.height = definition.defaultHeight;
  }

  applyWidgetGridLayout();
  floatingConfig.widgetRailVersion = 1;
  return true;
}

function getDefaultCategoryBounds(categoryKey, width, height) {
  const index = Math.max(0, CATEGORY_KEYS.indexOf(categoryKey));
  const area = screen.getPrimaryDisplay().workArea;
  const defaultSize = computeContentSize(DEFAULT_ROWS, DEFAULT_COLS);
  const slotWidth = defaultSize.width + 16;
  const slotHeight = defaultSize.height + 16;
  const column = index % 2;
  const row = Math.floor(index / 2);

  return clampFloatingBounds({
    x: area.x + area.width - width - 24 - column * slotWidth,
    y: area.y + area.height - height - 24 - row * slotHeight,
    width,
    height
  });
}

function getInitialCategoryBounds(categoryKey, width, height) {
  const config = getCategoryConfig(categoryKey);

  if (!config || config.x === null || config.y === null) {
    return getDefaultCategoryBounds(categoryKey, width, height);
  }

  return clampFloatingBounds({
    x: config.x,
    y: config.y,
    width,
    height
  });
}

function scheduleFloatingPositionSave(categoryKey) {
  const win = floatingWindows.get(categoryKey);
  const config = getCategoryConfig(categoryKey);
  if (!win || win.isDestroyed() || !config) return;

  clearTimeout(floatingMoveTimers.get(categoryKey));
  floatingMoveTimers.set(categoryKey, setTimeout(() => {
    const currentWindow = floatingWindows.get(categoryKey);
    const currentConfig = getCategoryConfig(categoryKey);
    if (!currentWindow || currentWindow.isDestroyed() || !currentConfig) return;

    const bounds = currentWindow.getBounds();
    currentConfig.x = bounds.x;
    currentConfig.y = bounds.y;
    persistFloatingConfig();
  }, 250));
}

function toMappedFolderItem(item, folderPath) {
  return {
    name: item.name,
    path: item.path,
    sourcePath: item.path,
    extension: item.extension,
    kind: item.kind,
    type: item.kind === "folder" ? "folder" : getFileType(item.name),
    iconMode: item.kind === "folder"
      ? "type"
      : usesSystemIcon(item.name)
        ? "system"
        : "type",
    mtimeMs: Number(item.mtimeMs) || 0,
    atimeMs: Number(item.atimeMs) || 0,
    size: Number(item.size) || 0,
    external: true,
    mappedFolder: folderPath
  };
}

async function appendMappedFolderItems(itemsByCategory) {
  for (const key of CATEGORY_KEYS) {
    const folderPath = getMappedFolder(categoryMappings, key);
    if (!folderPath) continue;

    try {
      const scan = await scanFolderEntries(folderPath);
      const items = itemsByCategory.get(key) || [];
      itemsByCategory.set(
        key,
        items.concat(scan.items.map((item) => toMappedFolderItem(item, folderPath)))
      );
    } catch (error) {
      // A moved or inaccessible mapping leaves the category empty without
      // discarding the saved mapping; the user can remap it from the menu.
    }
  }
}

async function pruneMissingQuickFiles() {
  if (!quickAccess || !Array.isArray(quickAccess.files)) return;

  let changed = false;
  const kept = [];

  for (const file of quickAccess.files) {
    try {
      const stat = await fs.stat(file.path);
      if (
        !stat.isFile() &&
        !stat.isDirectory()
      ) {
        throw new Error("不是普通文件或文件夹");
      }

      kept.push(file);
    } catch (error) {
      changed = true;
    }
  }

  if (changed) {
    quickAccess.files = kept;

    try {
      await persistQuickAccess();
    } catch (error) {
      // Keep the pruned in-memory state; it will be retried next refresh.
    }
  }
}

async function refreshFloatingData(_targetRoot, { show = false } = {}) {
  if (!floatingConfig) return;

  let scan = null;

  try {
    scan = await scanFloatingCategories(getDesktopPath(), { categoryMap });
  } catch (error) {
    scan = {
      itemsByCategory: new Map(CATEGORY_KEYS.map((key) => [key, []])),
      unassignedItems: [],
      stale: []
    };
  }

  const desktopCollator = new Intl.Collator("zh-CN", {
    numeric: true,
    sensitivity: "base"
  });
  const unassignedItems = (Array.isArray(scan.unassignedItems)
    ? scan.unassignedItems
    : [])
    .map((item) => ({
      ...item,
      key: fileKey(item.name, item.path),
      colorTag: getFileTag(fileTags, item.path),
      timeCapsule: isTimeCapsule(item)
    }))
    .sort((left, right) => desktopCollator.compare(left.name, right.name));

  desktopUnassignedItems = unassignedItems;
  desktopUnassignedByPath = new Map(
    unassignedItems.map((item) => [item.path, item])
  );

  const itemsByCategory = scan.itemsByCategory;
  await appendMappedFolderItems(itemsByCategory);
  await pruneMissingQuickFiles();

  if (Array.isArray(scan.stale) && scan.stale.length > 0 && categoryMap) {
    for (const assignment of scan.stale) {
      removeAssignment(categoryMap, assignment.path);
    }

    try {
      await persistCategoryMap();
    } catch (error) {
      // 失效归属清理失败时保留内存状态，下次刷新继续尝试
    }
  }

  let orderChanged = false;

  for (const key of CATEGORY_KEYS) {
    const config = getCategoryConfig(key);
    if (!config) continue;

    const items = itemsByCategory.get(key) || [];
    const state = buildFloatingState({
      files: items,
      orderKeys: config.orderKeys,
      sortMode: config.sortMode || DEFAULT_SORT_MODE
    });

    if (JSON.stringify(state.orderKeys) !== JSON.stringify(config.orderKeys)) {
      config.orderKeys = state.orderKeys;
      orderChanged = true;
    }

    for (const file of state.files) {
      file.colorTag = getFileTag(fileTags, file.path);
      file.timeCapsule = isTimeCapsule(file);
    }

    floatingCategoryData.set(key, state);
  }

  if (orderChanged) {
    await persistFloatingConfig();
  }

  const validPaths = new Set();
  for (const data of floatingCategoryData.values()) {
    for (const file of data.files) {
      validPaths.add(file.path);
    }
  }
  for (const item of desktopUnassignedItems) {
    validPaths.add(item.path);
  }
  for (const iconPath of floatingIconCache.keys()) {
    if (!validPaths.has(iconPath)) {
      floatingIconCache.delete(iconPath);
    }
  }

  // The full-desktop renderer derives every category from this data. There is
  // no per-category BrowserWindow left to create, show or hide.
  sendDesktopLayerState();
  notifyFloatingSettingsChanged();
}

function createFloatingWindow(categoryKey, show) {
  const definition = getCategoryDef(categoryKey);
  const config = getCategoryConfig(categoryKey);

  if (!definition || !config) return null;

  const existing = floatingWindows.get(categoryKey);
  if (existing && !existing.isDestroyed()) return existing;

  const size = computeCategoryWindowSize(config.rows, config.cols);
  const initialCollapsed =
    Boolean(floatingConfig) && floatingConfig.collapseMode === "hover";
  const width = size.width;
  const height = initialCollapsed ? DRAGBAR_HEIGHT : size.height;
  const bounds = getInitialCategoryBounds(categoryKey, width, height);
  const win = new BrowserWindow({
    width,
    height,
    x: bounds.x,
    y: bounds.y,
    minWidth: MIN_CATEGORY_WINDOW_WIDTH,
    minHeight: initialCollapsed ? DRAGBAR_HEIGHT : MIN_CATEGORY_WINDOW_HEIGHT,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    resizable: !initialCollapsed,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    title: getCategoryDisplayName(categoryKey),
    ...getWindowIconOption(),
    webPreferences: {
      preload: path.join(__dirname, "floating-preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  floatingResizeIgnoreUntil.set(categoryKey, Date.now() + 700);

  if (initialCollapsed) {
    collapsedCategories.add(categoryKey);
  } else {
    collapsedCategories.delete(categoryKey);
  }

  win.setBackgroundColor("#00000000");

  const webContentsId = win.webContents.id;
  floatingWindows.set(categoryKey, win);
  floatingWindowCategories.set(webContentsId, categoryKey);

  if (typeof win.setMovable === "function") {
    win.setMovable(!config.locked);
  }
  if (typeof win.setResizable === "function") {
    win.setResizable(!config.locked && !initialCollapsed);
  }

  applyWindowMaterial(win);
  win.loadFile(path.join(__dirname, "renderer", "floating.html"));
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event) => event.preventDefault());
  win.webContents.on("did-finish-load", () => sendFloatingUpdate(categoryKey));
  win.on("blur", () => moveWindowToBottom(win));
  win.on("move", () => handleWindowMove("category", categoryKey, win));
  win.on("moved", () => {
    handleWindowMoved("category", categoryKey, win);
    scheduleFloatingPositionSave(categoryKey);
  });
  win.on("resize", () => scheduleCategoryResizeFromWindow(categoryKey));
  win.on("close", (event) => {
    if (isQuitting) return;

    event.preventDefault();
    closeCategoryWidget(categoryKey).catch(() => {});
  });
  win.on("closed", () => {
    if (floatingDrag && floatingDrag.sourceCategory === categoryKey) {
      stopFloatingDrag();
    }

    clearTimeout(snapReleaseTimers.get(win));
    snapReleaseTimers.delete(win);
    floatingWindows.delete(categoryKey);
    floatingWindowCategories.delete(webContentsId);
    pendingFloatingShows.delete(categoryKey);
    clearTimeout(floatingShowTimers.get(categoryKey));
    clearTimeout(floatingMoveTimers.get(categoryKey));
    clearTimeout(floatingResizeTimers.get(categoryKey));
    floatingShowTimers.delete(categoryKey);
    floatingMoveTimers.delete(categoryKey);
    floatingResizeTimers.delete(categoryKey);
    floatingResizeIgnoreUntil.delete(categoryKey);
    collapsedCategories.delete(categoryKey);
    notifyFloatingSettingsChanged();
  });

  config.x = bounds.x;
  config.y = bounds.y;
  persistFloatingConfig();

  if (show) {
    pendingFloatingShows.add(categoryKey);
    clearTimeout(floatingShowTimers.get(categoryKey));
    floatingShowTimers.set(categoryKey, setTimeout(() => {
      if (!pendingFloatingShows.has(categoryKey)) return;
      pendingFloatingShows.delete(categoryKey);

      const displayId = getCategoryWindowDisplayId(categoryKey);

      if (isDisplayFullscreen(displayId)) {
        getHiddenEntry(displayId, true).categories.add(categoryKey);
        return;
      }

      const currentWindow = floatingWindows.get(categoryKey);
      if (currentWindow && !currentWindow.isDestroyed()) {
        currentWindow.showInactive();
        moveWindowToBottom(currentWindow);
        notifyFloatingSettingsChanged();
      }
    }, 1500));
  }

  return win;
}

function showFloatingWindow(categoryKey) {
  const config = getCategoryConfig(categoryKey);
  if (!config || config.removed) return;

  dismissedCategoryKeys.delete(categoryKey);
  sendDesktopLayerState();
  notifyFloatingSettingsChanged();
}

function setCategoryWindowCollapsed(categoryKey, collapsed) {
  const win = floatingWindows.get(categoryKey);
  const config = getCategoryConfig(categoryKey);
  if (!win || win.isDestroyed() || !config) return null;

  const nextCollapsed = Boolean(collapsed);
  const size = computeCategoryWindowSize(config.rows, config.cols);
  const height = nextCollapsed ? DRAGBAR_HEIGHT : size.height;

  if (nextCollapsed) {
    collapsedCategories.add(categoryKey);
  } else {
    collapsedCategories.delete(categoryKey);
  }

  floatingResizeIgnoreUntil.set(categoryKey, Date.now() + 600);

  if (nextCollapsed) {
    try {
      win.setMinimumSize(MIN_CATEGORY_WINDOW_WIDTH, DRAGBAR_HEIGHT);
      win.setResizable(false);
    } catch (error) {
      // 忽略窗口能力差异
    }
  }

  const current = win.getBounds();
  const bounds = clampFloatingBounds({
    x: current.x,
    y: current.y,
    width: size.width,
    height
  });

  suppressSnapFeedback();
  win.setBounds(bounds);

  if (!nextCollapsed) {
    try {
      win.setMinimumSize(MIN_CATEGORY_WINDOW_WIDTH, MIN_CATEGORY_WINDOW_HEIGHT);
      win.setResizable(!config.locked);
    } catch (error) {
      // 忽略窗口能力差异
    }
  }

  return { collapsed: nextCollapsed, bounds };
}

function resizeFloatingWindow(categoryKey) {
  const win = floatingWindows.get(categoryKey);
  const config = getCategoryConfig(categoryKey);
  if (!win || win.isDestroyed() || !config) return;

  const size = computeCategoryWindowSize(config.rows, config.cols);
  const width = size.width;
  const height = collapsedCategories.has(categoryKey) ? DRAGBAR_HEIGHT : size.height;
  const current = win.getBounds();
  const bounds = clampFloatingBounds({
    x: current.x,
    y: current.y,
    width,
    height
  });

  floatingResizeIgnoreUntil.set(categoryKey, Date.now() + 450);
  suppressSnapFeedback();
  win.setBounds(bounds);
  config.x = bounds.x;
  config.y = bounds.y;
  persistFloatingConfig();
  sendFloatingUpdate(categoryKey);
  notifyFloatingSettingsChanged();
}

function scheduleCategoryResizeFromWindow(categoryKey) {
  const win = floatingWindows.get(categoryKey);
  const config = getCategoryConfig(categoryKey);
  if (!win || win.isDestroyed() || !config || config.locked) return;
  if (collapsedCategories.has(categoryKey)) return;
  if (Date.now() < (floatingResizeIgnoreUntil.get(categoryKey) || 0)) return;

  clearTimeout(floatingResizeTimers.get(categoryKey));
  floatingResizeTimers.set(categoryKey, setTimeout(() => {
    const currentWindow = floatingWindows.get(categoryKey);
    const currentConfig = getCategoryConfig(categoryKey);
    if (!currentWindow || currentWindow.isDestroyed() || !currentConfig || currentConfig.locked) {
      return;
    }

    if (collapsedCategories.has(categoryKey)) return;

    const [width, height] = currentWindow.getContentSize();
    const { rows, cols } = getGridSizeFromWindow(width, height);
    const size = computeCategoryWindowSize(rows, cols);

    currentConfig.rows = rows;
    currentConfig.cols = cols;

    const current = currentWindow.getBounds();
    const bounds = clampFloatingBounds({
      x: current.x,
      y: current.y,
      width: size.width,
      height: size.height
    });

    floatingResizeIgnoreUntil.set(categoryKey, Date.now() + 450);
    suppressSnapFeedback();
    currentWindow.setBounds(bounds);
    currentConfig.x = bounds.x;
    currentConfig.y = bounds.y;
    persistFloatingConfig();
    sendFloatingUpdate(categoryKey);
    notifyFloatingSettingsChanged();
  }, 220));
}

function findFloatingFile(categoryKey, filePath) {
  if (typeof filePath !== "string") return null;
  return getCategoryData(categoryKey).files.find((file) => file.path === filePath) || null;
}

function isPointInsideBounds(point, bounds) {
  return point.x >= bounds.x &&
    point.x < bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y < bounds.y + bounds.height;
}

function isCursorOverOwnWindow() {
  const point = screen.getCursorScreenPoint();
  const windows = [
    mainWindow,
    ...floatingWindows.values(),
    ...widgetWindows.values()
  ];

  for (const win of windows) {
    if (!win || win.isDestroyed() || !win.isVisible()) continue;
    if (isPointInsideBounds(point, win.getBounds())) return true;
  }

  return false;
}

function isCursorOverDesktop() {
  if (isCursorOverOwnWindow()) return false;

  const info = getCursorWindowInfo();

  if (info && info.className) {
    return isShellWindowClass(info.className);
  }

  // 原生接口不可用时按约定降级：拖出所有小组件边界即视为拖到桌面。
  return true;
}

function findFloatingDropTarget(sourceCategory) {
  if (!floatingDrag) return null;

  const point = screen.getCursorScreenPoint();
  const sourceWindow = floatingWindows.get(sourceCategory);

  if (
    sourceWindow &&
    !sourceWindow.isDestroyed() &&
    sourceWindow.isVisible() &&
    isPointInsideBounds(point, sourceWindow.getBounds())
  ) {
    return null;
  }

  for (const key of CATEGORY_KEYS) {
    if (key === sourceCategory) continue;

    const config = getCategoryConfig(key);
    if (!config || config.removed) continue;

    const win = floatingWindows.get(key);
    if (!win || win.isDestroyed() || !win.isVisible()) continue;

    if (isPointInsideBounds(point, win.getBounds())) {
      return key;
    }
  }

  return null;
}

function setFloatingDragTarget(targetCategory) {
  if (targetCategory === floatingDragTarget) return;

  if (floatingDragTarget) {
    const previous = floatingWindows.get(floatingDragTarget);
    if (previous && !previous.isDestroyed() && !previous.webContents.isDestroyed()) {
      previous.webContents.send("floating:drag-target", { active: false });
    }
  }

  floatingDragTarget = targetCategory;

  if (targetCategory) {
    const win = floatingWindows.get(targetCategory);
    if (win && !win.isDestroyed() && !win.webContents.isDestroyed()) {
      win.webContents.send("floating:drag-target", {
        active: true,
        sourceCategory: floatingDrag ? floatingDrag.sourceCategory : null
      });
    }
  }
}

function updateFloatingDragTarget() {
  if (!floatingDrag) return;

  if (Date.now() - floatingDrag.startedAt > 60000) {
    stopFloatingDrag();
    return;
  }

  setFloatingDragTarget(findFloatingDropTarget(floatingDrag.sourceCategory));
}

function stopFloatingDrag({ clearTarget = true } = {}) {
  if (floatingDragTimer) {
    clearInterval(floatingDragTimer);
    floatingDragTimer = null;
  }

  if (clearTarget) {
    setFloatingDragTarget(null);
  }

  floatingDrag = null;
}

function startFloatingDrag(categoryKey, filePath) {
  stopFloatingDrag();

  const file = findFloatingFile(categoryKey, filePath);
  if (!file) {
    return { ok: false, error: "文件已不在当前分类中。" };
  }

  if (file.isSystemIcon) {
    return { ok: false, error: "系统图标不能拖出分类。" };
  }

  floatingDrag = {
    sourceCategory: categoryKey,
    filePath,
    name: file.name,
    sourcePath: file.sourcePath,
    startedAt: Date.now()
  };
  floatingDragTimer = setInterval(updateFloatingDragTarget, 90);
  updateFloatingDragTarget();

  return { ok: true };
}

function getOwnNativeWindowHandles() {
  const handles = new Set();
  const windows = [
    mainWindow,
    guideWindow,
    spotlightWindow,
    desktopLayerWindow,
    ...floatingWindows.values(),
    ...widgetWindows.values()
  ];

  for (const win of windows) {
    if (!win || win.isDestroyed()) continue;
    const handle = getNativeWindowHandle(win);
    if (handle !== null) handles.add(handle);
  }

  return handles;
}

function getForegroundFullscreenDisplayId() {
  if (!isNativeAvailable()) return null;

  const info = getForegroundWindowInfo();
  if (!info) return null;
  if (isShellWindowClass(info.className)) return null;
  if (getOwnNativeWindowHandles().has(info.hwnd)) return null;

  const scale = info.dpi > 0 ? info.dpi / 96 : 1;
  const dipRect = {
    x: info.rect.x / scale,
    y: info.rect.y / scale,
    width: info.rect.width / scale,
    height: info.rect.height / scale
  };
  const displays = screen.getAllDisplays();
  const display = screen.getDisplayMatching(dipRect);

  if (!display || !displays.some((item) => item.id === display.id)) {
    return null;
  }

  const screenArea = display.bounds.width * display.bounds.height;
  if (screenArea <= 0) return null;

  const windowArea = dipRect.width * dipRect.height;
  return windowArea / screenArea >= FULLSCREEN_AREA_RATIO ? display.id : null;
}

function getHiddenEntry(displayId, create = false) {
  let entry = fullscreenHiddenByDisplay.get(displayId);

  if (!entry && create) {
    entry = { categories: new Set(), widgets: new Set() };
    fullscreenHiddenByDisplay.set(displayId, entry);
  }

  return entry || null;
}

function hasHiddenKeys(entry) {
  return Boolean(entry && (entry.categories.size > 0 || entry.widgets.size > 0));
}

function isDisplayFullscreen(displayId) {
  return displayId !== null && displayId === fullscreenDisplayId;
}

function forgetFullscreenCategory(categoryKey) {
  for (const [displayId, entry] of fullscreenHiddenByDisplay) {
    entry.categories.delete(categoryKey);

    if (!hasHiddenKeys(entry)) {
      fullscreenHiddenByDisplay.delete(displayId);
    }
  }
}

function forgetFullscreenWidget(widgetKey) {
  for (const [displayId, entry] of fullscreenHiddenByDisplay) {
    entry.widgets.delete(widgetKey);

    if (!hasHiddenKeys(entry)) {
      fullscreenHiddenByDisplay.delete(displayId);
    }
  }
}

function getCategoryWindowDisplayId(categoryKey) {
  const win = floatingWindows.get(categoryKey);

  if (win && !win.isDestroyed()) {
    return screen.getDisplayMatching(win.getBounds()).id;
  }

  const config = getCategoryConfig(categoryKey);
  if (!config) return null;

  const size = computeCategoryWindowSize(config.rows, config.cols);
  const bounds = getInitialCategoryBounds(categoryKey, size.width, size.height);
  return screen.getDisplayMatching(bounds).id;
}

function getWidgetWindowDisplayId(widgetKey) {
  const win = widgetWindows.get(widgetKey);

  if (win && !win.isDestroyed()) {
    return screen.getDisplayMatching(win.getBounds()).id;
  }

  const config = getWidgetConfig(widgetKey);
  if (!config) return null;

  const width = Math.max(MIN_WIDGET_WIDTH, Math.min(2000, config.width));
  const height = Math.max(MIN_WIDGET_HEIGHT, Math.min(2000, config.height));
  const bounds = getWidgetInitialBounds(widgetKey, width, height);
  return screen.getDisplayMatching(bounds).id;
}

function hideWindowsOnDisplay(displayId) {
  if (
    floatingDrag &&
    getCategoryWindowDisplayId(floatingDrag.sourceCategory) === displayId
  ) {
    stopFloatingDrag();
  }

  let changed = false;
  const entry = getHiddenEntry(displayId, true);

  for (const key of CATEGORY_KEYS) {
    if (getCategoryWindowDisplayId(key) !== displayId) continue;

    const win = floatingWindows.get(key);
    const pending = pendingFloatingShows.has(key) ||
      Boolean(floatingShowTimers.get(key));

    if (pending || (win && !win.isDestroyed() && win.isVisible())) {
      entry.categories.add(key);
      changed = true;
    }

    pendingFloatingShows.delete(key);
    clearTimeout(floatingShowTimers.get(key));
    floatingShowTimers.delete(key);

    if (win && !win.isDestroyed() && win.isVisible()) {
      win.hide();
      changed = true;
    }
  }

  for (const definition of WIDGET_DEFS) {
    const key = definition.key;
    if (getWidgetWindowDisplayId(key) !== displayId) continue;

    const win = widgetWindows.get(key);
    const pending = pendingWidgetShows.has(key) ||
      Boolean(widgetShowTimers.get(key));

    if (pending || (win && !win.isDestroyed() && win.isVisible())) {
      entry.widgets.add(key);
      changed = true;
    }

    pendingWidgetShows.delete(key);
    clearTimeout(widgetShowTimers.get(key));
    widgetShowTimers.delete(key);

    if (win && !win.isDestroyed() && win.isVisible()) {
      win.hide();
      changed = true;
    }
  }

  if (!hasHiddenKeys(entry)) {
    fullscreenHiddenByDisplay.delete(displayId);
  }

  if (changed) {
    notifyFloatingSettingsChanged();
  }
}

function scheduleRestoreDisplay(displayId) {
  if (fullscreenRestoreTimers.has(displayId)) return;

  const timer = setTimeout(() => {
    fullscreenRestoreTimers.delete(displayId);

    if (fullscreenDisplayId === displayId) return;

    const entry = fullscreenHiddenByDisplay.get(displayId);
    if (!entry) return;

    fullscreenHiddenByDisplay.delete(displayId);

    for (const key of entry.categories) {
      showFloatingWindow(key);
    }

    for (const key of entry.widgets) {
      showWidgetWindow(key);
    }

    notifyFloatingSettingsChanged();
  }, 150);

  fullscreenRestoreTimers.set(displayId, timer);
}

function cancelRestoreDisplay(displayId) {
  const timer = fullscreenRestoreTimers.get(displayId);
  if (timer) {
    clearTimeout(timer);
    fullscreenRestoreTimers.delete(displayId);
  }
}

function updateFullscreenState() {
  if (!isNativeAvailable()) return;

  let nextDisplayId = null;

  try {
    nextDisplayId = getForegroundFullscreenDisplayId();
  } catch (error) {
    nextDisplayId = null;
  }

  if (nextDisplayId === fullscreenDisplayId) {
    if (nextDisplayId !== null) {
      hideWindowsOnDisplay(nextDisplayId);
    }
    return;
  }

  const previousDisplayId = fullscreenDisplayId;
  fullscreenDisplayId = nextDisplayId;

  if (previousDisplayId !== null) {
    scheduleRestoreDisplay(previousDisplayId);
  }

  if (nextDisplayId !== null) {
    cancelRestoreDisplay(nextDisplayId);
    hideWindowsOnDisplay(nextDisplayId);
  }
}

function hasFloatingWindowsToManage() {
  if (fullscreenDisplayId !== null) return true;
  if (fullscreenHiddenByDisplay.size > 0) return true;
  if (fullscreenRestoreTimers.size > 0) return true;
  if (pendingFloatingShows.size > 0 || pendingWidgetShows.size > 0) {
    return true;
  }
  if (floatingShowTimers.size > 0 || widgetShowTimers.size > 0) {
    return true;
  }

  for (const win of floatingWindows.values()) {
    if (win && !win.isDestroyed() && win.isVisible()) return true;
  }

  for (const win of widgetWindows.values()) {
    if (win && !win.isDestroyed() && win.isVisible()) return true;
  }

  return false;
}

function startFullscreenWatcher() {
  if (!isNativeAvailable()) return;

  if (hasFloatingWindowsToManage()) {
    updateFullscreenState();
  }

  fullscreenPollTimer = setInterval(() => {
    if (!hasFloatingWindowsToManage()) return;
    updateFullscreenState();
  }, 1000);
}

async function finishFloatingDrag({ canceled = false } = {}) {
  if (!floatingDrag) {
    return { ok: true, changed: false, status: getManualStatus() };
  }

  const drag = floatingDrag;
  const targetCategory = canceled ? null : findFloatingDropTarget(drag.sourceCategory);
  const droppedOnDesktop = !canceled &&
    !targetCategory &&
    isCursorOverDesktop();

  stopFloatingDrag();

  if (
    (!targetCategory && !droppedOnDesktop) ||
    targetCategory === drag.sourceCategory
  ) {
    return { ok: true, changed: false, status: getManualStatus() };
  }

  return enqueueManualOperation(async () => {
    const file = findFloatingFile(drag.sourceCategory, drag.filePath);

    if (!file) {
      return {
        ok: false,
        error: "文件已不在源分类中。",
        status: getManualStatus()
      };
    }

    if (droppedOnDesktop) {
      const assignment = getAssignment(categoryMap, file.sourcePath);

      if (!assignment) {
        return { ok: true, changed: false, status: getManualStatus() };
      }

      removeAssignment(categoryMap, file.sourcePath);

      let saveError = null;

      try {
        await persistCategoryMap();
      } catch (error) {
        saveError = error.message || "归属记录保存失败。";
      }

      const at = new Date();
      const log = await writeAssignLogWithFallback(buildAssignLogEntry({
        action: "unassign",
        at,
        path: file.sourcePath,
        name: file.name,
        fromCategory: assignment.category,
        toCategory: null
      }));

      try {
        await refreshFloatingData(undefined, { show: false });
      } catch (error) {
        // 悬浮窗刷新失败不影响归属记录
      }

      const sourceWindow = floatingWindows.get(drag.sourceCategory);
      if (sourceWindow && !sourceWindow.isDestroyed()) {
        sourceWindow.webContents.send(
          "floating:toast",
          `「${file.name}」已移出分类，文件仍在桌面`
        );
      }

      return {
        ok: true,
        changed: true,
        path: file.sourcePath,
        name: file.name,
        fromCategory: assignment.category,
        toCategory: null,
        saveError,
        logPath: log.logPath,
        logError: log.logError,
        status: getManualStatus()
      };
    }

    return applyManualAssignment({
      filePath: file.sourcePath,
      name: file.name,
      kind: file.kind,
      fromCategory: drag.sourceCategory,
      toCategory: targetCategory,
      refreshFloating: true
    });
  });
}

function setAllFloatingVisible(visible) {
  desktopLayerVisible = Boolean(visible);

  // When the user hides every component, restore Explorer's own icons instead
  // of leaving an empty desktop.
  syncNativeDesktopIcons();

  if (desktopLayerVisible) {
    dismissedCategoryKeys.clear();
  } else {
    for (const timer of fullscreenRestoreTimers.values()) {
      clearTimeout(timer);
    }
    fullscreenRestoreTimers.clear();
    fullscreenHiddenByDisplay.clear();
  }

  if (desktopLayerVisible) {
    const musicConfig = getWidgetConfig("music");
    if (musicConfig && musicConfig.enabled) {
      getMediaSessionWatcher().start();
    }
  }

  sendDesktopLayerState();
  updateDesktopLayerPointerMode();
  notifyFloatingSettingsChanged();
}

function getWidgetConfig(widgetKey) {
  if (!floatingConfig || !floatingConfig.widgets) return null;
  return floatingConfig.widgets[widgetKey] || null;
}

function quickFileItems() {
  if (!quickAccess) return [];

  return quickAccess.files.map((file) => {
    const type = file.kind === "folder" ? "folder" : getFileType(file.name);

    return {
      name: file.name,
      path: file.path,
      sourcePath: file.path,
      extension: file.kind === "folder" ? "" : path.extname(file.name).toLowerCase(),
      kind: file.kind,
      type,
      iconMode: file.kind === "folder"
        ? "type"
        : usesSystemIcon(file.name)
          ? "system"
          : "type",
      key: fileKey(file.name, file.path),
      addedAt: file.addedAt,
      colorTag: getFileTag(fileTags, file.path)
    };
  });
}

function isBingBackground(config) {
  if (!config || typeof config.backgroundImage !== "string") return false;

  const target = path.resolve(config.backgroundImage);
  const root = path.resolve(getBackgroundsDir());
  return target.toLowerCase().startsWith(`${root.toLowerCase()}${path.sep}`) &&
    path.basename(target).toLowerCase().startsWith("bing-");
}

function getWidgetRendererState(widgetKey) {
  const definition = WIDGET_BY_KEY.get(widgetKey);
  const config = getWidgetConfig(widgetKey);

  if (!definition || !config) return null;

  const state = {
    ok: true,
    widgetKey,
    label: getWidgetDisplayName(widgetKey),
    defaultLabel: definition.label,
    locked: Boolean(config.locked),
    tint: floatingConfig.tint,
    customTint: floatingConfig.customTint,
    frosted: Boolean(floatingConfig.frosted),
    material: getMaterialMode(),
    backgroundImageUrl: getWidgetBackgroundUrl(config),
    backgroundIsBing: isBingBackground(config),
    accentColor: getEffectiveComponentAccent("widget", widgetKey)
  };

  if (widgetKey === "clock") {
    Object.assign(state, normalizeClockSettings(config));
  }

  if (widgetKey === "quick") {
    state.files = quickFileItems();
  }

  if (widgetKey === "clipboard") {
    state.clipboardEntries = clipboardEntriesForRenderer();
    state.maxClipboardEntries = MAX_CLIPBOARD_ENTRIES;
  }

  return state;
}

function sendWidgetUpdate() {
  sendDesktopLayerState();
}

function getMediaSessionWatcher() {
  if (!mediaSessionWatcher) {
    mediaSessionWatcher = new MediaSessionWatcher({
      onChange: (payload) => {
        broadcastMusicUpdate(payload);
      }
    });
  }

  return mediaSessionWatcher;
}

function getWidgetKeyForWebContents(contents) {
  if (!contents) return null;
  return widgetWindowKeys.get(contents.id) || null;
}

function getDefaultWidgetBounds(widgetKey, width, height) {
  const area = screen.getPrimaryDisplay().workArea;
  const edge = 24;
  let x;
  let y;

  if (widgetKey === "clock") {
    x = area.x + area.width - width - edge;
    y = area.y + 48;
  } else if (widgetKey === "notes") {
    x = area.x + edge;
    y = area.y + 48;
  } else if (widgetKey === "todo") {
    x = area.x + Math.round((area.width - width) / 2) - width - edge;
    y = area.y + area.height - height - edge;
  } else if (widgetKey === "calendar") {
    x = area.x + Math.round((area.width - width) / 2);
    y = area.y + Math.round((area.height - height) / 2);
  } else if (widgetKey === "pomodoro") {
    x = area.x + edge;
    y = area.y + Math.round((area.height - height) / 2);
  } else if (widgetKey === "clipboard") {
    x = area.x + area.width - width - edge;
    y = area.y + Math.round((area.height - height) / 2);
  } else if (widgetKey === "quick") {
    x = area.x + Math.round((area.width - width) / 2);
    y = area.y + area.height - height - 48;
  } else {
    x = area.x + edge;
    y = area.y + area.height - height - edge;
  }

  return clampFloatingBounds({ x, y, width, height });
}

function getWidgetInitialBounds(widgetKey, width, height) {
  const config = getWidgetConfig(widgetKey);
  let x = config ? config.x : null;
  let y = config ? config.y : null;

  if (x === null || y === null) {
    const defaults = getDefaultWidgetBounds(widgetKey, width, height);
    x = defaults.x;
    y = defaults.y;
  }

  return clampFloatingBounds({ x, y, width, height });
}

function createWidgetWindow(widgetKey, show) {
  const definition = WIDGET_BY_KEY.get(widgetKey);
  const config = getWidgetConfig(widgetKey);

  if (!definition || !config) return null;

  const existing = widgetWindows.get(widgetKey);
  if (existing && !existing.isDestroyed()) return existing;

  const width = Math.max(MIN_WIDGET_WIDTH, Math.min(2000, config.width));
  const height = Math.max(MIN_WIDGET_HEIGHT, Math.min(2000, config.height));
  const bounds = getWidgetInitialBounds(widgetKey, width, height);
  const win = new BrowserWindow({
    width,
    height,
    x: bounds.x,
    y: bounds.y,
    minWidth: MIN_WIDGET_WIDTH,
    minHeight: MIN_WIDGET_HEIGHT,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    resizable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    title: getWidgetDisplayName(widgetKey),
    ...getWindowIconOption(),
    webPreferences: {
      preload: path.join(__dirname, "widget-preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.setBackgroundColor("#00000000");

  const webContentsId = win.webContents.id;
  widgetWindows.set(widgetKey, win);
  widgetWindowKeys.set(webContentsId, widgetKey);

  if (widgetKey === "music") {
    getMediaSessionWatcher().start();
  }

  if (typeof win.setMovable === "function") {
    win.setMovable(!config.locked);
  }
  if (typeof win.setResizable === "function") {
    win.setResizable(!config.locked);
  }

  applyWindowMaterial(win);
  win.loadFile(path.join(__dirname, "renderer", "widget.html"));
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event) => event.preventDefault());
  win.webContents.on("did-finish-load", () => sendWidgetUpdate(widgetKey));
  win.on("blur", () => moveWindowToBottom(win));
  win.on("move", () => handleWindowMove("widget", widgetKey, win));
  win.on("moved", () => {
    handleWindowMoved("widget", widgetKey, win);
    scheduleWidgetPositionSave(widgetKey);
  });
  win.on("resize", () => scheduleWidgetResizeSave(widgetKey));
  win.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      disableWidgetFromUser(widgetKey);
    }
  });
  win.on("closed", () => {
    clearTimeout(snapReleaseTimers.get(win));
    snapReleaseTimers.delete(win);
    widgetWindows.delete(widgetKey);
    widgetWindowKeys.delete(webContentsId);
    pendingWidgetShows.delete(widgetKey);
    clearTimeout(widgetShowTimers.get(widgetKey));
    clearTimeout(widgetMoveTimers.get(widgetKey));
    clearTimeout(widgetResizeTimers.get(widgetKey));
    widgetShowTimers.delete(widgetKey);
    widgetMoveTimers.delete(widgetKey);
    widgetResizeTimers.delete(widgetKey);
    widgetResizeIgnoreUntil.delete(widgetKey);
    notifyFloatingSettingsChanged();
  });

  config.x = bounds.x;
  config.y = bounds.y;
  config.width = width;
  config.height = height;
  persistFloatingConfig();

  if (show) {
    pendingWidgetShows.add(widgetKey);
    clearTimeout(widgetShowTimers.get(widgetKey));
    widgetShowTimers.set(widgetKey, setTimeout(() => {
      if (!pendingWidgetShows.has(widgetKey)) return;
      pendingWidgetShows.delete(widgetKey);

      const displayId = getWidgetWindowDisplayId(widgetKey);

      if (isDisplayFullscreen(displayId)) {
        getHiddenEntry(displayId, true).widgets.add(widgetKey);
        return;
      }

      const currentWindow = widgetWindows.get(widgetKey);
      if (currentWindow && !currentWindow.isDestroyed()) {
        currentWindow.showInactive();
        moveWindowToBottom(currentWindow);
        notifyFloatingSettingsChanged();
      }
    }, 1500));
  }

  return win;
}

function showWidgetWindow(widgetKey) {
  const config = getWidgetConfig(widgetKey);
  if (!config || !config.enabled) return;

  if (widgetKey === "music") {
    getMediaSessionWatcher().start();
  }

  sendDesktopLayerState();
  notifyFloatingSettingsChanged();
}

function hideWidgetWindow(widgetKey) {
  pendingWidgetShows.delete(widgetKey);
  clearTimeout(widgetShowTimers.get(widgetKey));
  widgetShowTimers.delete(widgetKey);
  sendDesktopLayerState();
  notifyFloatingSettingsChanged();
}

function disableWidgetFromUser(widgetKey) {
  const config = getWidgetConfig(widgetKey);
  if (config) {
    config.enabled = false;
    persistFloatingConfig();
  }
  forgetFullscreenWidget(widgetKey);
  hideWidgetWindow(widgetKey);
}

function scheduleWidgetPositionSave(widgetKey) {
  const win = widgetWindows.get(widgetKey);
  const config = getWidgetConfig(widgetKey);
  if (!win || win.isDestroyed() || !config) return;

  clearTimeout(widgetMoveTimers.get(widgetKey));
  widgetMoveTimers.set(widgetKey, setTimeout(() => {
    const currentWindow = widgetWindows.get(widgetKey);
    const currentConfig = getWidgetConfig(widgetKey);
    if (!currentWindow || currentWindow.isDestroyed() || !currentConfig) return;

    const bounds = currentWindow.getBounds();
    currentConfig.x = bounds.x;
    currentConfig.y = bounds.y;
    persistFloatingConfig();
  }, 250));
}

function scheduleWidgetResizeSave(widgetKey) {
  const win = widgetWindows.get(widgetKey);
  const config = getWidgetConfig(widgetKey);
  if (!win || win.isDestroyed() || !config) return;

  clearTimeout(widgetResizeTimers.get(widgetKey));
  widgetResizeTimers.set(widgetKey, setTimeout(() => {
    const currentWindow = widgetWindows.get(widgetKey);
    const currentConfig = getWidgetConfig(widgetKey);
    if (!currentWindow || currentWindow.isDestroyed() || !currentConfig) return;

    const [width, height] = currentWindow.getContentSize();
    const nextWidth = Math.max(MIN_WIDGET_WIDTH, width);
    const nextHeight = Math.max(MIN_WIDGET_HEIGHT, height);

    // Only a real change means the user resized the window. Programmatic
    // setBounds calls that keep the same size must not mark the size as custom.
    if (
      nextWidth !== currentConfig.width ||
      nextHeight !== currentConfig.height
    ) {
      currentConfig.width = nextWidth;
      currentConfig.height = nextHeight;
      currentConfig.sizeCustomized = true;
    }

    persistFloatingConfig();
    notifyFloatingSettingsChanged();
  }, 250));
}

function initializeWidgets() {
  const musicConfig = getWidgetConfig("music");
  if (
    (musicConfig && musicConfig.enabled) ||
    (floatingConfig && floatingConfig.musicVisualizer !== false)
  ) {
    getMediaSessionWatcher().start();
  }

  const clipboardConfig = getWidgetConfig("clipboard");
  if (clipboardConfig && clipboardConfig.enabled) {
    startClipboardWatcher();
  }
}

async function pruneMissingWidgetBackgrounds() {
  if (!floatingConfig) return;

  let changed = false;

  for (const definition of WIDGET_DEFS) {
    const config = getWidgetConfig(definition.key);
    if (!config || !config.backgroundImage) continue;

    try {
      const stat = await fs.stat(config.backgroundImage);
      if (!stat.isFile()) {
        throw new Error("背景图片不是文件");
      }
    } catch (error) {
      config.backgroundImage = null;
      changed = true;
    }
  }

  if (changed) {
    await persistFloatingConfig();
  }
}

function iconMimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".svg") return "image/svg+xml";
  if (extension === ".webp") return "image/webp";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  return "image/png";
}

async function readIconAsDataUrl(filePath) {
  const buffer = await fs.readFile(filePath);
  return `data:${iconMimeType(filePath)};base64,${buffer.toString("base64")}`;
}

async function loadIconPack(force = false) {
  if (iconPackCache && !force) return iconPackCache;

  const root = getIconPackRoot();
  const manifestPath = path.join(root, "manifest.json");
  const icons = {};
  let name = "";

  try {
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    name = typeof manifest.name === "string" ? manifest.name : "";
    const files = manifest.icons && typeof manifest.icons === "object"
      ? manifest.icons
      : {};

    for (const type of ICON_PACK_TYPES) {
      const fileName = files[type];

      if (typeof fileName !== "string" || path.basename(fileName) !== fileName) {
        continue;
      }

      const filePath = path.join(root, fileName);

      try {
        icons[type] = await readIconAsDataUrl(filePath);
      } catch (error) {
        // Ignore individual missing assets.
      }
    }
  } catch (error) {
    iconPackCache = { name: "", icons: {} };
    return iconPackCache;
  }

  iconPackCache = { name, icons };
  return iconPackCache;
}

async function importIconPack() {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "选择图标包文件夹",
    properties: ["openDirectory"]
  });

  if (result.canceled || !result.filePaths[0]) {
    return { ok: true, canceled: true };
  }

  const sourceDir = result.filePaths[0];
  let manifest = null;

  try {
    manifest = JSON.parse(await fs.readFile(path.join(sourceDir, "manifest.json"), "utf8"));
  } catch (error) {
    manifest = null;
  }

  const mapping = {};
  const name = manifest && typeof manifest.name === "string"
    ? manifest.name.trim().slice(0, 60)
    : path.basename(sourceDir);
  const sourceMapping = manifest && manifest.icons && typeof manifest.icons === "object"
    ? manifest.icons
    : {};

  for (const type of ICON_PACK_TYPES) {
    let fileName = sourceMapping[type];

    if (typeof fileName !== "string") {
      const candidates = [".svg", ".png", ".webp", ".jpg", ".jpeg"];

      for (const extension of candidates) {
        try {
          await fs.access(path.join(sourceDir, `${type}${extension}`));
          fileName = `${type}${extension}`;
          break;
        } catch (error) {
          // Try next extension.
        }
      }
    }

    if (typeof fileName !== "string") continue;

    const sourcePath = path.resolve(sourceDir, fileName);
    const relative = path.relative(sourceDir, sourcePath);

    if (relative.startsWith("..") || path.isAbsolute(relative)) continue;
    if (!/\.(svg|png|webp|jpe?g)$/i.test(sourcePath)) continue;
    mapping[type] = path.basename(sourcePath);
  }

  if (Object.keys(mapping).length === 0) {
    return {
      ok: false,
      error: "没有找到图标文件。请放入以类型命名的 SVG/PNG（如 folder.svg）。"
    };
  }

  const targetRoot = getIconPackRoot();
  await fs.rm(targetRoot, { recursive: true, force: true });
  await fs.mkdir(targetRoot, { recursive: true });

  for (const [type, fileName] of Object.entries(mapping)) {
    await fs.copyFile(path.join(sourceDir, fileName), path.join(targetRoot, fileName));
  }

  await fs.writeFile(
    path.join(targetRoot, "manifest.json"),
    JSON.stringify({ name, icons: mapping }, null, 2),
    "utf8"
  );

  iconPackCache = null;
  const pack = await loadIconPack(true);
  notifyIconPackChanged(pack);
  return { ok: true, name, count: Object.keys(mapping).length, icons: pack.icons };
}

function notifyIconPackChanged(pack) {
  if (!desktopLayerWindow || desktopLayerWindow.isDestroyed()) return;
  desktopLayerWindow.webContents.send("desktop-layer:icon-pack", pack);
}

function createTrayIcon() {
  const iconPath = getAppIconPath();

  if (iconPath) {
    // 直接把 .ico 路径交给 Tray，让 Windows 从多尺寸图层里挑 16/20/24px，
    // 比先转成单张 NativeImage 再缩放更清晰。
    try {
      const image = nativeImage.createFromPath(iconPath);

      if (!image.isEmpty()) return iconPath;
    } catch (error) {
      // 回退到代码绘制的简易图标。
    }
  }

  const size = 16;
  const buffer = Buffer.alloc(size * size * 4);
  const accent = [124, 161, 143, 255];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const border = x === 0 || y === 0 || x === size - 1 || y === size - 1;
      const cross = x >= 4 && x <= 11 && y >= 7 && y <= 8 ||
        y >= 4 && y <= 11 && x >= 7 && x <= 8;
      const color = border ? [52, 76, 63, 255] : cross ? [255, 255, 255, 255] : accent;
      buffer[index] = color[0];
      buffer[index + 1] = color[1];
      buffer[index + 2] = color[2];
      buffer[index + 3] = color[3];
    }
  }

  try {
    return nativeImage.createFromBitmap(buffer, { width: size, height: size });
  } catch (error) {
    return nativeImage.createFromPath(process.execPath);
  }
}

function getPrivacyTrayLabel() {
  const accelerator = shortcutSettings && shortcutSettings.privacy
    ? displayAccelerator(shortcutSettings.privacy)
    : "";

  return accelerator
    ? `访客防窥（${accelerator}）`
    : "访客防窥";
}

function rebuildTrayMenu() {
  if (
    !appTray ||
    (typeof appTray.isDestroyed === "function" && appTray.isDestroyed())
  ) {
    return;
  }

  const visibleCount = getFloatingSettings().visibleCount || 0;
  const menu = Menu.buildFromTemplate([
    {
      label: "显示主窗口",
      click: () => focusMainWindow()
    },
    { type: "separator" },
    {
      label: "快速整理",
      click: () => {
        focusMainWindow();
        sendToMainWindow("ui:tray-quick-organize");
      }
    },
    {
      label: visibleCount > 0 ? "专注（隐藏桌面组件）" : "专注（恢复桌面组件）",
      click: async () => {
        const current = getFloatingSettings().visibleCount || 0;
        await setAllFloatingVisible(current === 0);
        rebuildTrayMenu();
      }
    },
    {
      label: "呼出搜索",
      click: () => showSpotlight()
    },
    { type: "separator" },
    {
      label: getPrivacyTrayLabel(),
      type: "checkbox",
      checked: privacyModeActive,
      click: () => setPrivacyMode(!privacyModeActive)
    },
    { type: "separator" },
    {
      label: "退出方寸格",
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  appTray.setContextMenu(menu);
  appTray.setToolTip("方寸格 · 桌面整理");
}

function createTray() {
  if (appTray || isQuitting) return;

  try {
    appTray = new Tray(createTrayIcon());
  } catch (error) {
    console.warn("[tray] 无法创建托盘图标:", error.message || error);
    return;
  }

  appTray.on("click", () => focusMainWindow());
  appTray.on("right-click", () => rebuildTrayMenu());
  rebuildTrayMenu();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 760,
    minWidth: 720,
    minHeight: 540,
    title: "方寸格",
    ...getWindowIconOption(),
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#202020" : "#f3f3f3",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
  mainWindow.webContents.on("did-finish-load", () => {
    if (!mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isDestroyed()) {
      return;
    }
    // 主窗口可能晚于快捷键加载完成，加载完成后补发当前防窥状态。
    mainWindow.webContents.send("toggle-privacy", getPrivacyPayload());
  });
  mainWindow.once("ready-to-show", () => {
    if (onboardingActive) {
      onboardingMainWindowWasVisible = true;
      return;
    }

    mainWindow.show();
  });
  mainWindow.on("close", (event) => {
    if (isQuitting) return;
    event.preventDefault();
    mainWindow.hide();
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event) => event.preventDefault());
  mainWindow.on("closed", () => {
    mainWindow = null;

    if (!isQuitting && process.platform !== "darwin") {
      app.quit();
    }
  });
}

function getDesktopLayerFile(categoryKey, filePath) {
  if (categoryKey === "desktop") {
    if (typeof filePath !== "string") return null;
    return desktopUnassignedByPath.get(filePath) || null;
  }

  if (!CATEGORY_KEYS.includes(categoryKey)) return null;
  const config = getCategoryConfig(categoryKey);
  if (!config) return null;
  return findFloatingFile(categoryKey, filePath);
}

async function resolveDesktopLayerIcon(categoryKey, filePath) {
  const file = getDesktopLayerFile(categoryKey, filePath);

  if (!file || file.iconMode !== "system") {
    return { ok: false, error: "not-system-icon" };
  }

  if (floatingIconCache.has(file.path)) {
    return { ok: true, dataUrl: floatingIconCache.get(file.path) };
  }

  if (!path.isAbsolute(file.path)) {
    return { ok: false, error: "not-absolute" };
  }

  try {
    await fs.access(file.path);
  } catch (error) {
    return { ok: false, error: "missing" };
  }

  try {
    const dataUrl = await resolveFileIconDataUrl(file.path);

    if (!dataUrl) {
      return { ok: false, error: "empty-icon", empty: true };
    }

    return { ok: true, dataUrl };
  } catch (error) {
    return { ok: false, error: error.message, empty: false };
  }
}

async function openDesktopLayerFile(categoryKey, filePath) {
  const file = getDesktopLayerFile(categoryKey, filePath);

  if (!file) {
    return { ok: false, error: "文件不在当前分类中。" };
  }

  if (file.isSystemIcon) {
    const target = getSystemIconTarget(file.path);

    if (!target) {
      return { ok: false, error: "未知的系统入口。" };
    }

    try {
      openSystemTarget(target);
      return { ok: true, target };
    } catch (error) {
      return { ok: false, error: error.message || "无法打开系统位置。" };
    }
  }

  try {
    const error = await shell.openPath(file.path);
    return error ? { ok: false, error } : { ok: true };
  } catch (error) {
    return { ok: false, error: error.message || "无法打开文件。" };
  }
}

function getWindowsPowerShellPath() {
  return path.join(
    process.env.SystemRoot || "C:\\Windows",
    "System32",
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe"
  );
}

async function resolveDesktopMenuFile(categoryKey, filePath) {
  const file = getAnyDesktopFile(categoryKey, filePath);

  if (!file || file.isSystemIcon) return null;

  const realPath = file.sourcePath || file.path;

  if (typeof realPath !== "string" || !path.isAbsolute(realPath)) {
    return null;
  }

  try {
    await fs.access(realPath);
  } catch (error) {
    return null;
  }

  return { file, path: realPath };
}

async function resolveDesktopMenuPaths(rawPaths) {
  const paths = [];
  const seen = new Set();

  for (const rawPath of Array.isArray(rawPaths) ? rawPaths : []) {
    if (typeof rawPath !== "string" || !path.isAbsolute(rawPath)) continue;

    let file = findKnownDesktopFileByPath(rawPath);

    if (!file && quickAccess && Array.isArray(quickAccess.files)) {
      file = quickAccess.files.find((item) => (
        normalizePathKey(item.path) === normalizePathKey(rawPath)
      )) || null;
    }

    if (!file || file.isSystemIcon) continue;

    const realPath = file.sourcePath || file.path || rawPath;
    const key = normalizePathKey(realPath);

    if (seen.has(key)) continue;

    try {
      await fs.access(realPath);
    } catch (error) {
      continue;
    }

    seen.add(key);
    paths.push(realPath);
  }

  return paths;
}

async function openFolderInNewWindow(folderPath) {
  return new Promise((resolve) => {
    try {
      const child = spawn("explorer.exe", [`/n,${folderPath}`], {
        detached: true,
        stdio: "ignore"
      });

      child.on("error", (error) => {
        resolve({ ok: false, error: error.message || "无法打开资源管理器。" });
      });
      child.unref();

      // explorer.exe often hands off to an existing process and exits. Give
      // spawn a chance to report an immediate launch error.
      setTimeout(() => resolve({ ok: true }), 180);
    } catch (error) {
      resolve({ ok: false, error: error.message || "无法打开资源管理器。" });
    }
  });
}

async function runFileShellAction(action, filePath) {
  const scriptPath = path.join(__dirname, "src", "file-shell-actions.ps1");

  try {
    await execFileAsync(
      getWindowsPowerShellPath(),
      [
        "-NoProfile",
        "-NonInteractive",
        "-STA",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        scriptPath,
        "-Action",
        action,
        "-FilePath",
        filePath
      ],
      {
        windowsHide: true,
        timeout: 25000,
        maxBuffer: 1024 * 1024,
        encoding: "utf8"
      }
    );

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error.code === "ETIMEDOUT"
        ? "系统操作超时。"
        : "系统没有完成该操作。"
    };
  }
}

async function openFileWithDialog(filePath) {
  return new Promise((resolve) => {
    try {
      const child = spawn(
        "rundll32.exe",
        ["shell32.dll,OpenAs_RunDLL", filePath],
        { detached: true, stdio: "ignore" }
      );

      child.on("error", (error) => {
        resolve({
          ok: false,
          error: error.message || "无法打开「打开方式」窗口。"
        });
      });
      child.unref();
      setTimeout(() => resolve({ ok: true }), 160);
    } catch (error) {
      resolve({
        ok: false,
        error: error.message || "无法打开「打开方式」窗口。"
      });
    }
  });
}

async function copyDesktopFilePathsToClipboard(paths) {
  const safePaths = await resolveDesktopMenuPaths(paths);

  if (safePaths.length === 0) {
    return { ok: false, error: "没有可复制的文件路径。" };
  }

  const text = safePaths.join("\r\n");

  if (!(await writeClipboardText(text))) {
    return { ok: false, error: "无法写入剪贴板。" };
  }

  clipboardLastText = text;
  return { ok: true, count: safePaths.length, paths: safePaths };
}

async function setDesktopFileClipboard(paths, operation) {
  const safePaths = await resolveDesktopMenuPaths(paths);

  if (safePaths.length === 0) {
    return { ok: false, error: "没有可操作的文件。" };
  }

  const isCut = operation === "cut";
  const payload = Buffer.from(JSON.stringify(safePaths), "utf8").toString("base64");
  const scriptPath = path.join(__dirname, "src", "clipboard-files.ps1");
  const args = [
    "-NoProfile",
    "-NonInteractive",
    "-STA",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    scriptPath,
    "-Payload",
    payload
  ];

  if (isCut) args.push("-Cut");

  try {
    await execFileAsync(
      getWindowsPowerShellPath(),
      args,
      {
        windowsHide: true,
        timeout: 20000,
        maxBuffer: 1024 * 1024,
        encoding: "utf8"
      }
    );
  } catch (error) {
    return {
      ok: false,
      error: error.code === "ETIMEDOUT"
        ? "写入文件剪贴板超时。"
        : "无法写入文件剪贴板。"
    };
  }

  clipboardLastText = safePaths.join("\r\n");
  return {
    ok: true,
    count: safePaths.length,
    paths: safePaths,
    operation: isCut ? "cut" : "copy"
  };
}

function findKnownDesktopFileByPath(filePath) {
  if (typeof filePath !== "string" || !filePath.trim()) return null;
  const key = normalizePathKey(filePath);

  for (const data of floatingCategoryData.values()) {
    const file = data.files.find((item) => (
      normalizePathKey(item.sourcePath || item.path) === key
    ));

    if (file) return file;
  }

  const desktopFile = desktopUnassignedByPath.get(filePath);
  if (desktopFile) return desktopFile;

  return null;
}

function isValidFileName(name) {
  if (typeof name !== "string") return false;
  const trimmed = name.trim();
  if (!trimmed || trimmed === "." || trimmed === "..") return false;
  if (trimmed.length > 240) return false;
  return !/[\\/:*?"<>|\u0000-\u001f]/.test(trimmed);
}

async function uniqueCopyPath(directory, fileName) {
  const parsed = path.parse(fileName);
  const extension = parsed.ext;
  const base = parsed.name;

  for (let index = 2; index < 1000; index += 1) {
    const candidate = path.join(directory, `${base} (${index})${extension}`);

    try {
      await fs.access(candidate);
    } catch (error) {
      return candidate;
    }
  }

  throw new Error("无法生成不冲突的文件名。");
}

async function askCopyConflict(fileName) {
  const parent = mainWindow && !mainWindow.isDestroyed()
    ? mainWindow
    : null;
  const options = {
    type: "question",
    title: "同名文件冲突",
    message: `目标位置已经存在「${fileName}」`,
    detail: "本次复制中的所有同名冲突都会使用同一个选择。",
    buttons: ["保留两者", "替换", "跳过"],
    defaultId: 0,
    cancelId: 2,
    noLink: true
  };
  const result = parent
    ? await dialog.showMessageBox(parent, options)
    : await dialog.showMessageBox(options);

  return ["keep", "replace", "skip"][result.response] || "skip";
}

async function readClipboardBuffer(format) {
  try {
    const value = clipboard.readBuffer(format);
    return value && typeof value.then === "function" ? await value : value;
  } catch (error) {
    return null;
  }
}

async function readClipboardFormat(format) {
  try {
    const value = clipboard.read(format);
    return value && typeof value.then === "function" ? await value : value;
  } catch (error) {
    return null;
  }
}

async function readClipboardFilePaths() {
  const paths = [];
  const seen = new Set();

  const addPath = (value) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();

    if (!trimmed) return;

    let target = trimmed;

    if (target.startsWith("file://")) {
      try {
        target = fileURLToPath(target);
      } catch (error) {
        return;
      }
    }

    if (!path.isAbsolute(target) || !fsNative.existsSync(target)) return;

    const key = normalizePathKey(target);
    if (seen.has(key)) return;

    seen.add(key);
    paths.push(target);
  };

  const fileNameW = await readClipboardBuffer("FileNameW");

  if (fileNameW && Buffer.isBuffer(fileNameW)) {
    const text = fileNameW.toString("utf16le");
    text.split("\u0000").forEach(addPath);
  }

  const uriList = await readClipboardFormat("text/uri-list");

  if (typeof uriList === "string") {
    uriList.split(/\r?\n/).forEach((line) => {
      if (line.trim() && !line.trim().startsWith("#")) addPath(line);
    });
  }

  const text = await readClipboardText();

  if (paths.length === 0 && text) {
    text.split(/\r?\n/).forEach(addPath);
  }

  return paths;
}

async function copyFilesIntoDirectory(paths, targetDirectory, {
  assignCategory = null
} = {}) {
  const targetDir = path.resolve(targetDirectory);
  await fs.mkdir(targetDir, { recursive: true });

  const copied = [];
  const skipped = [];
  const errors = [];
  let conflictChoice = null;
  let assignmentChanged = false;

  for (const sourcePath of paths) {
    let stat;

    try {
      stat = await fs.stat(sourcePath);
    } catch (error) {
      errors.push({ path: sourcePath, error: "源文件已不存在。" });
      continue;
    }

    const sourceName = path.basename(sourcePath);
    let targetPath = path.join(targetDir, sourceName);

    if (normalizePathKey(sourcePath) === normalizePathKey(targetPath)) {
      skipped.push({ path: sourcePath, reason: "目标位置与源文件相同。" });
      continue;
    }

    let exists = false;

    try {
      await fs.access(targetPath);
      exists = true;
    } catch (error) {
      exists = false;
    }

    if (exists) {
      if (!conflictChoice) {
        conflictChoice = await askCopyConflict(sourceName);
      }

      if (conflictChoice === "skip") {
        skipped.push({ path: sourcePath, reason: "同名文件已跳过。" });
        continue;
      }

      if (conflictChoice === "replace") {
        try {
          await fs.rm(targetPath, { recursive: true, force: true });
        } catch (error) {
          errors.push({ path: sourcePath, error: "无法替换同名文件。" });
          continue;
        }
      } else {
        try {
          targetPath = await uniqueCopyPath(targetDir, sourceName);
        } catch (error) {
          errors.push({ path: sourcePath, error: error.message });
          continue;
        }
      }
    }

    try {
      await fs.cp(sourcePath, targetPath, {
        recursive: true,
        force: false,
        errorOnExist: true
      });
    } catch (error) {
      errors.push({ path: sourcePath, error: error.message || "复制失败。" });
      continue;
    }

    const isDirectory = stat.isDirectory();
    const name = path.basename(targetPath);
    copied.push({
      path: targetPath,
      sourcePath,
      name,
      kind: isDirectory ? "folder" : "file"
    });

    if (assignCategory && categoryMap) {
      const result = setAssignment(categoryMap, {
        path: targetPath,
        name,
        category: assignCategory,
        kind: isDirectory ? "folder" : "file",
        runId: null,
        source: "manual",
        fromCategory: null,
        at: new Date()
      });

      if (result.changed) assignmentChanged = true;
    }
  }

  if (assignmentChanged) {
    try {
      await persistCategoryMap();
    } catch (error) {
      // Copied files are already on disk; assignment persistence is retried on
      // the next refresh.
    }
  }

  try {
    await refreshFloatingData(undefined, { show: false });
  } catch (error) {
    // The copied files are still valid even if a category refresh fails.
  }

  return { ok: true, copied, skipped, errors, targetDir };
}

async function pasteClipboardFiles(categoryKey) {
  const paths = await readClipboardFilePaths();

  if (paths.length === 0) {
    return { ok: false, error: "剪贴板中没有可复制的文件路径。" };
  }

  const isCategory = CATEGORY_KEYS.includes(categoryKey) &&
    Boolean(getCategoryConfig(categoryKey));
  const mappedFolder = isCategory
    ? getMappedFolder(categoryMappings, categoryKey)
    : null;
  const targetDir = mappedFolder || getDesktopPath();
  const assignCategory = isCategory && !mappedFolder ? categoryKey : null;

  return copyFilesIntoDirectory(paths, targetDir, { assignCategory });
}

async function renameDesktopLayerFile(categoryKey, filePath, nextName) {
  const file = getAnyDesktopFile(categoryKey, filePath);

  if (!file) {
    return { ok: false, error: "文件已不在当前组件中。" };
  }

  if (file.isSystemIcon) {
    return { ok: false, error: "系统图标不能重命名。" };
  }

  if (!isValidFileName(nextName)) {
    return { ok: false, error: "文件名包含非法字符。" };
  }

  const oldName = file.name;
  const name = nextName.trim();

  if (name === oldName) {
    return { ok: true, unchanged: true, path: file.path, name };
  }

  const oldPath = file.sourcePath || file.path;
  const nextPath = path.join(path.dirname(oldPath), name);

  try {
    await fs.access(nextPath);
    return { ok: false, error: "同名文件或文件夹已经存在。" };
  } catch (error) {
    // The destination is free.
  }

  try {
    await fs.rename(oldPath, nextPath);
  } catch (error) {
    return { ok: false, error: error.message || "无法重命名文件。" };
  }

  if (categoryMap) {
    const assignment = getAssignment(categoryMap, oldPath);

    if (assignment) {
      delete categoryMap.assignments[normalizePathKey(oldPath)];
      categoryMap.assignments[normalizePathKey(nextPath)] = {
        ...assignment,
        path: nextPath,
        name
      };
      await persistCategoryMap().catch(() => {});
    }
  }

  const colorTag = getFileTag(fileTags, oldPath);

  if (colorTag) {
    setFileTag(fileTags, nextPath, colorTag);
    setFileTag(fileTags, oldPath, "");
    await persistFileTags().catch(() => {});
  }

  if (quickAccess) {
    const quickFile = quickAccess.files.find((item) => (
      normalizePathKey(item.path) === normalizePathKey(oldPath)
    ));

    if (quickFile) {
      quickFile.path = nextPath;
      quickFile.name = name;
      await persistQuickAccess().catch(() => {});
    }
  }

  const oldKey = fileKey(oldName, oldPath);
  const nextKey = fileKey(name, nextPath);
  let orderChanged = false;

  for (const key of CATEGORY_KEYS) {
    const config = getCategoryConfig(key);
    if (!config || !Array.isArray(config.orderKeys)) continue;

    if (config.orderKeys.includes(oldKey)) {
      config.orderKeys = config.orderKeys.map((itemKey) => (
        itemKey === oldKey ? nextKey : itemKey
      ));
      orderChanged = true;
    }
  }

  if (orderChanged) await persistFloatingConfig();

  try {
    await refreshFloatingData(undefined, { show: false });
  } catch (error) {
    // The rename itself is already durable.
  }

  return { ok: true, path: nextPath, name };
}

async function trashDesktopLayerFiles(paths) {
  const removed = [];
  const skipped = [];
  const errors = [];
  let categoryChanged = false;
  let tagsChanged = false;
  let quickChanged = false;

  for (const filePath of paths) {
    const file = findKnownDesktopFileByPath(filePath);

    if (!file || file.isSystemIcon) {
      skipped.push({ path: filePath, reason: "文件不可删除。" });
      continue;
    }

    const realPath = file.sourcePath || file.path;

    try {
      await shell.trashItem(realPath);
    } catch (error) {
      errors.push({ path: realPath, error: error.message || "无法移入回收站。" });
      continue;
    }

    removed.push(realPath);

    if (categoryMap && removeAssignment(categoryMap, realPath).removed) {
      categoryChanged = true;
    }

    if (getFileTag(fileTags, realPath)) {
      setFileTag(fileTags, realPath, "");
      tagsChanged = true;
    }

    if (quickAccess) {
      const before = quickAccess.files.length;
      quickAccess.files = quickAccess.files.filter((item) => (
        normalizePathKey(item.path) !== normalizePathKey(realPath)
      ));

      if (quickAccess.files.length !== before) quickChanged = true;
    }
  }

  if (categoryChanged) await persistCategoryMap().catch(() => {});
  if (tagsChanged) await persistFileTags().catch(() => {});
  if (quickChanged) await persistQuickAccess().catch(() => {});

  try {
    await refreshFloatingData(undefined, { show: false });
  } catch (error) {
    // The files are already in the recycle bin.
  }

  if (removed.length > 0) {
    recordAchievement("recycle-files", { count: removed.length });
  }

  return { ok: true, removed, skipped, errors };
}

async function resetDesktopLayerLayout() {
  const parent = mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
  const options = {
    type: "question",
    title: "重置桌面布局",
    message: "将所有组件恢复到默认位置与大小？",
    detail: "不会删除文件或归属记录。隐藏的分类会重新显示。",
    buttons: ["重置布局", "取消"],
    defaultId: 0,
    cancelId: 1,
    noLink: true
  };
  const answer = parent
    ? await dialog.showMessageBox(parent, options)
    : await dialog.showMessageBox(options);

  if (answer.response !== 0) {
    return { ok: true, canceled: true, settings: getFloatingSettings() };
  }

  // 1) Widgets first: drop every cached coordinate, force the strict grid sizes
  //    (clock 2W + Gap wide, everything else W x H) and re-place them on the
  //    right-hand grid. The category pass below avoids whatever bounds the
  //    widgets now occupy, so the order matters.
  for (const definition of WIDGET_DEFS) {
    const config = getWidgetConfig(definition.key);
    if (!config) continue;

    config.locked = false;
    config.x = null;
    config.y = null;
    config.width = definition.defaultWidth;
    config.height = definition.defaultHeight;
  }

  applyWidgetGridLayout();

  // 2) Categories: drop the old coordinates, then re-lay them out to the left of
  //    the freshly placed widgets.
  for (const key of CATEGORY_KEYS) {
    const config = getCategoryConfig(key);
    if (!config) continue;

    config.removed = false;
    config.locked = false;
    config.rows = DEFAULT_ROWS;
    config.cols = DEFAULT_COLS;
    config.x = null;
    config.y = null;
  }

  if (floatingConfig) {
    floatingConfig.groups = [];
    floatingConfig.autoLayoutVersion = 0;
    applyInitialCategoryAutoLayout();
    // Pin the rail version so the one-shot first-run layout does not re-shuffle
    // this result on the next launch.
    floatingConfig.widgetRailVersion = 1;
  }

  dismissedCategoryKeys.clear();
  initializeCollapsedCategoriesForMode();
  desktopLayerVisible = true;

  // Re-seat the transparent layer itself. A layer displaced by an earlier
  // topology change makes a correct reset look broken: every component keeps its
  // new coordinates but the whole surface is drawn too high.
  desktopLayerBounds = getVirtualDesktopBounds();
  applyDesktopLayerWindowGeometry(desktopLayerBounds);

  await persistFloatingConfig();
  syncNativeDesktopIcons();
  sendDesktopLayerState();
  updateDesktopLayerPointerMode();
  notifyFloatingSettingsChanged();

  return { ok: true, canceled: false, settings: getFloatingSettings() };
}

async function assignFilesToDesktopCategory(categoryKey, paths) {
  const config = getCategoryConfig(categoryKey);

  if (!config || config.removed) {
    return { ok: false, error: "分类组件无效。", categoryKey };
  }

  if (!categoryMap) {
    return { ok: false, error: "归属记录尚未初始化。", categoryKey };
  }

  if (!Array.isArray(paths) || paths.length === 0) {
    return { ok: false, error: "没有可登记的文件。", categoryKey };
  }

  const desktopPath = path.resolve(getDesktopPath());
  const mappedFolder = getMappedFolder(categoryMappings, categoryKey);
  const mappedPath = mappedFolder ? path.resolve(mappedFolder) : null;
  const targetDir = mappedPath || desktopPath;
  const localPaths = [];
  const externalPaths = [];
  const assigned = [];
  const skipped = [];

  for (const rawPath of paths.slice(0, 100)) {
    if (typeof rawPath !== "string" || !rawPath) continue;

    const filePath = path.resolve(rawPath);
    const parent = path.dirname(filePath);

    if (parent === desktopPath) {
      localPaths.push(filePath);
    } else if (mappedPath && parent === mappedPath) {
      skipped.push({ path: filePath, reason: "文件已经在该分类的映射文件夹中。" });
    } else {
      externalPaths.push(filePath);
    }
  }

  let copyResult = { copied: [], skipped: [], errors: [] };

  if (externalPaths.length > 0) {
    copyResult = await copyFilesIntoDirectory(externalPaths, targetDir, {
      assignCategory: mappedPath ? null : categoryKey
    });
    skipped.push(...copyResult.skipped);
  }

  for (const filePath of localPaths) {
    let stat;

    try {
      stat = await fs.lstat(filePath);
    } catch (error) {
      skipped.push({ path: filePath, reason: "文件已不存在" });
      continue;
    }

    const kind = stat.isDirectory()
      ? "folder"
      : stat.isFile()
        ? "file"
        : null;

    if (!kind) {
      skipped.push({ path: filePath, reason: "不是普通文件或文件夹" });
      continue;
    }

    const result = setAssignment(categoryMap, {
      path: filePath,
      name: path.basename(filePath),
      category: categoryKey,
      kind,
      runId: null,
      source: "drag",
      at: new Date()
    });

    if (result.changed) {
      assigned.push({ path: filePath, name: path.basename(filePath), kind });
    } else {
      skipped.push({ path: filePath, reason: "归属未变化" });
    }
  }

  let saveError = null;

  if (assigned.length > 0) {
    try {
      await persistCategoryMap();
    } catch (error) {
      saveError = error.message || "归属记录保存失败。";
    }

    try {
      await refreshFloatingData(undefined, { show: false });
    } catch (error) {
      // Keep the assignment result even if refreshing fails.
    }
  }

  const copiedCount = copyResult.copied.length;
  const count = assigned.length + copiedCount;
  const errors = copyResult.errors || [];

  return {
    ok: true,
    categoryKey,
    changed: count > 0,
    count,
    assigned: [
      ...assigned,
      ...copyResult.copied.map((item) => ({
        path: item.path,
        name: item.name,
        kind: item.kind
      }))
    ],
    skipped,
    errors,
    saveError,
    error: count === 0 && (skipped.length > 0 || errors.length > 0)
      ? (errors[0] && errors[0].error) || skipped[0].reason
      : null
  };
}

async function unassignDesktopLayerFileFromCategory(fromCategory, filePath) {
  if (!fromCategory || fromCategory === "desktop") {
    return { ok: true, changed: false, status: getManualStatus() };
  }

  const fromConfig = getCategoryConfig(fromCategory);

  if (!fromConfig || fromConfig.removed) {
    return { ok: false, error: "来源分类组件无效。", status: getManualStatus() };
  }

  const file = findFloatingFile(fromCategory, filePath);

  if (!file) {
    return { ok: false, error: "文件已不在当前分类中。", status: getManualStatus() };
  }

  if (file.isSystemIcon) {
    return { ok: false, error: "系统图标不能拖出到桌面。", status: getManualStatus() };
  }

  if (file.external) {
    return {
      ok: false,
      error: "映射文件夹中的文件不能拖出到桌面。",
      status: getManualStatus()
    };
  }

  const assignmentPath = file.sourcePath || file.path;
  const assignment = getAssignment(categoryMap, assignmentPath);

  if (!assignment) {
    return { ok: true, changed: false, status: getManualStatus() };
  }

  return enqueueManualOperation(async () => {
    removeAssignment(categoryMap, assignmentPath);

    let saveError = null;

    try {
      await persistCategoryMap();
    } catch (error) {
      saveError = error.message || "归属记录保存失败。";
    }

    const at = new Date();
    const log = await writeAssignLogWithFallback(buildAssignLogEntry({
      action: "unassign",
      at,
      path: assignmentPath,
      name: file.name,
      fromCategory: assignment.category,
      toCategory: null
    }));

    try {
      await refreshFloatingData(undefined, { show: false });
    } catch (error) {
      // 归属记录已经更新，界面刷新失败不影响拖出结果。
    }

    return {
      ok: true,
      changed: true,
      path: assignmentPath,
      name: file.name,
      fromCategory: assignment.category,
      toCategory: null,
      saveError,
      logPath: log.logPath,
      logError: log.logError,
      status: getManualStatus()
    };
  });
}

async function moveFileBetweenDesktopCategories({
  fromCategory,
  toCategory,
  filePath
}) {
  if (toCategory === "desktop") {
    return unassignDesktopLayerFileFromCategory(fromCategory, filePath);
  }

  const toConfig = getCategoryConfig(toCategory);

  if (!toConfig || toConfig.removed) {
    return { ok: false, error: "目标分类组件无效。" };
  }

  if (fromCategory === "desktop") {
    const desktopFile = desktopUnassignedByPath.get(filePath);

    if (!desktopFile) {
      return { ok: false, error: "文件已不在桌面未整理区域中。" };
    }

    return applyManualAssignment({
      filePath: desktopFile.path,
      name: desktopFile.name,
      kind: desktopFile.kind,
      fromCategory: "desktop",
      toCategory,
      refreshFloating: true
    });
  }

  const fromConfig = getCategoryConfig(fromCategory);

  if (!fromConfig || fromConfig.removed) {
    return { ok: false, error: "来源分类组件无效。" };
  }

  if (fromCategory === toCategory) {
    return { ok: true, changed: false, status: getManualStatus() };
  }

  const file = findFloatingFile(fromCategory, filePath);

  if (!file) {
    return { ok: false, error: "文件已不在当前分类中。" };
  }

  if (file.isSystemIcon) {
    return { ok: false, error: "系统图标不能移入其他分类。" };
  }

  if (file.external) {
    return { ok: false, error: "映射文件夹中的文件不能移入分类。" };
  }

  return applyManualAssignment({
    filePath: file.sourcePath,
    name: file.name,
    kind: file.kind,
    fromCategory,
    toCategory,
    refreshFloating: true
  });
}

function allVisibleGridsShareName() {
  if (!floatingConfig) return false;

  const names = CATEGORY_KEYS
    .filter((key) => {
      const config = getCategoryConfig(key);
      return config && !config.removed;
    })
    .map((key) => getCategoryDisplayName(key))
    .filter(Boolean);

  for (const group of getTabGroups()) {
    if (!group || !Array.isArray(group.keys) || group.keys.length < 2) continue;
    names.push(String(group.name || "标签组").trim());
  }

  if (names.length < 2) return false;
  const first = names[0].trim().toLowerCase();
  return Boolean(first) && names.every(
    (name) => String(name).trim().toLowerCase() === first
  );
}

async function mergeTabGroupCategories({ sourceKey, targetKey }) {
  if (!floatingConfig) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const sourceConfig = getCategoryConfig(sourceKey);

  if (!sourceConfig || sourceConfig.removed) {
    return { ok: false, error: "要合并的分类无效。" };
  }

  if (sourceKey === targetKey) {
    return { ok: false, error: "不能把分类合并到自己。" };
  }

  if (isCategoryGrouped(sourceKey)) {
    return { ok: false, error: "这个分类已经在标签组里了。" };
  }

  let group = getTabGroupById(targetKey);
  let targetCategoryKey = null;
  let createdNow = false;
  const targetIsGroup = Boolean(group);

  if (!group) {
    const targetConfig = getCategoryConfig(targetKey);

    if (!targetConfig || targetConfig.removed) {
      return { ok: false, error: "目标标签不存在。" };
    }

    targetCategoryKey = targetKey;
    group = getTabGroupForCategory(targetKey);

    if (!group) {
      // 新建组时继承目标分类的位置，并给标签栏和内容区预留额外高度。
      const targetItem = getDesktopCategoryItem(targetKey);
      const targetSize = computeCategoryWindowSize(
        targetConfig.rows,
        targetConfig.cols
      );

      group = {
        id: crypto.randomUUID(),
        keys: [targetKey],
        x: targetItem ? targetItem.x : null,
        y: targetItem ? targetItem.y : null,
        width: Math.max(GROUP_MIN_WIDTH, targetSize.width),
        height: Math.max(340, targetSize.height + 36),
        locked: false,
        name: "",
        activeKey: targetKey,
        addedFiles: []
      };

      floatingConfig.groups.push(group);
      createdNow = true;
    }
  }

  if (!targetIsGroup && (!Array.isArray(group.keys) || !group.keys.includes(targetKey))) {
    return { ok: false, error: "目标标签组无效。" };
  }

  if (group.keys.includes(sourceKey)) {
    return { ok: false, error: "这两个分类已经在同一个标签组里了。" };
  }

  group.keys.push(sourceKey);

  if (targetCategoryKey) {
    group.activeKey = targetCategoryKey;
  }

  await persistFloatingConfig();
  const state = sendDesktopLayerState();
  notifyFloatingSettingsChanged();

  if (createdNow) {
    recordAchievement("group-created", { groupId: group.id });
  }

  return {
    ok: true,
    groupId: group.id,
    keys: [...group.keys],
    state
  };
}

async function splitTabGroup(groupId) {
  const group = getTabGroupById(groupId);

  if (!group) {
    return { ok: false, error: "标签组不存在。" };
  }

  let reassigned = 0;

  if (categoryMap) {
    for (const record of Array.isArray(group.addedFiles) ? group.addedFiles : []) {
      const assignment = getAssignment(categoryMap, record.path);

      if (!assignment) continue;
      // 映射文件夹里的文件归属由文件夹本身决定，拆分时不做归属改写。
      if (getMappedFolder(categoryMappings, assignment.category)) continue;

      const name = record.name || path.basename(record.path);
      const kind = record.kind || assignment.kind || "file";
      const targetCategory = groupCategoryForFile(name, kind);
      const targetConfig = getCategoryConfig(targetCategory);

      if (!targetConfig || targetConfig.removed) continue;
      if (targetCategory === assignment.category) continue;

      const result = setAssignment(categoryMap, {
        path: record.path,
        name,
        category: targetCategory,
        kind,
        runId: null,
        source: "tab-split",
        fromCategory: assignment.category,
        at: new Date()
      });

      if (result.changed) reassigned += 1;
    }

    if (reassigned > 0) {
      try {
        await persistCategoryMap();
      } catch (error) {
        // 归属已经更新到内存，下一次刷新会继续尝试保存。
      }
    }
  }

  floatingConfig.groups = getTabGroups().filter((item) => item.id !== groupId);
  await persistFloatingConfig();

  if (reassigned > 0) {
    try {
      await refreshFloatingData(undefined, { show: false });
    } catch (error) {
      sendDesktopLayerState();
    }
  } else {
    sendDesktopLayerState();
    updateDesktopLayerPointerMode();
  }

  notifyFloatingSettingsChanged();
  recordAchievement("group-split", { groupId });

  return {
    ok: true,
    groupId,
    keys: [...group.keys],
    reassigned
  };
}

async function assignFilesToTabGroup(groupId, rawPaths) {
  const group = getTabGroupById(groupId);

  if (!group) {
    return { ok: false, error: "标签组不存在。" };
  }

  if (!Array.isArray(rawPaths) || rawPaths.length === 0) {
    return { ok: false, error: "没有可加入的文件。" };
  }

  const buckets = new Map();
  const preSkipped = [];
  const groupKeys = group.keys.filter((key) => {
    const config = getCategoryConfig(key);
    return Boolean(config && !config.removed);
  });

  if (groupKeys.length < 2) {
    return { ok: false, error: "标签组没有可用的分类。" };
  }

  for (const rawPath of rawPaths.slice(0, 50)) {
    if (typeof rawPath !== "string" || !rawPath.trim()) continue;

    const filePath = path.resolve(rawPath);
    let stat = null;

    try {
      stat = await fs.stat(filePath);
    } catch (error) {
      preSkipped.push({ path: filePath, reason: "文件已不存在" });
      continue;
    }

    const kind = stat.isDirectory()
      ? "folder"
      : stat.isFile()
        ? "file"
        : null;

    if (!kind) {
      preSkipped.push({ path: filePath, reason: "不是普通文件或文件夹" });
      continue;
    }

    const categoryKey = chooseGroupCategory(
      groupKeys,
      path.basename(filePath),
      kind,
      group.activeKey
    );

    if (!categoryKey) {
      preSkipped.push({ path: filePath, reason: "标签组没有可用分类" });
      continue;
    }

    const list = buckets.get(categoryKey) || [];
    list.push(filePath);
    buckets.set(categoryKey, list);
  }

  let count = 0;
  let primaryCategory = "";
  const skipped = [...preSkipped];
  const errors = [];
  const assignedFiles = [];

  for (const [categoryKey, paths] of buckets) {
    const result = await assignFilesToDesktopCategory(categoryKey, paths);

    if (result && result.count > 0) {
      count += result.count;
      if (!primaryCategory) primaryCategory = categoryKey;
    }

    if (result && Array.isArray(result.skipped)) {
      skipped.push(...result.skipped);
    }
    if (result && Array.isArray(result.errors)) {
      errors.push(...result.errors);
    }
    if (result && Array.isArray(result.assigned)) {
      for (const item of result.assigned) {
        assignedFiles.push({
          path: item.path,
          name: item.name,
          kind: item.kind === "folder" ? "folder" : "file"
        });
      }
    }
  }

  if (assignedFiles.length > 0) {
    const existing = new Map(
      (Array.isArray(group.addedFiles) ? group.addedFiles : [])
        .map((item) => [String(item.path).toLowerCase(), item])
    );

    for (const item of assignedFiles) {
      const key = item.path.toLowerCase();
      if (!existing.has(key)) {
        existing.set(key, item);
        group.addedFiles.push(item);
      }
    }
  }

  if (primaryCategory) {
    group.activeKey = primaryCategory;
  }

  if (count > 0) {
    await persistFloatingConfig();

    try {
      await refreshFloatingData(undefined, { show: false });
    } catch (error) {
      sendDesktopLayerState();
    }

    notifyFloatingSettingsChanged();
  }

  return {
    ok: true,
    group: true,
    groupId,
    count,
    categoryKey: primaryCategory,
    skipped,
    errors,
    error: count === 0
      ? (errors[0] && errors[0].error) ||
        (skipped[0] && skipped[0].reason) ||
        "没有文件加入标签组。"
      : null
  };
}

function getDesktopCategoryLayoutSize(categoryKey) {
  const config = getCategoryConfig(categoryKey);
  if (!config) return null;

  const collapsed = collapsedCategories.has(categoryKey);
  const size = computeCategoryWindowSize(config.rows, config.cols);

  return {
    width: size.width,
    height: collapsed ? DRAGBAR_HEIGHT : size.height
  };
}

function getDesktopGroupLayoutSize(group) {
  if (!group) return null;

  return {
    width: Math.max(
      GROUP_MIN_WIDTH,
      Math.min(GROUP_MAX_WIDTH, Math.round(Number(group.width) || GROUP_MIN_WIDTH))
    ),
    height: Math.max(
      GROUP_MIN_HEIGHT,
      Math.min(GROUP_MAX_HEIGHT, Math.round(Number(group.height) || GROUP_MIN_HEIGHT))
    )
  };
}

function getDesktopWidgetLayoutSize(widgetKey) {
  const config = getWidgetConfig(widgetKey);
  const definition = WIDGET_BY_KEY.get(widgetKey);
  if (!config || !definition) return null;

  return {
    width: Math.max(
      MIN_WIDGET_WIDTH,
      Math.min(2000, Math.round(Number(config.width) || definition.defaultWidth))
    ),
    height: Math.max(
      MIN_WIDGET_HEIGHT,
      Math.min(2000, Math.round(Number(config.height) || definition.defaultHeight))
    )
  };
}

function getWidgetDisplayLabel(widgetKey) {
  const definition = WIDGET_BY_KEY.get(widgetKey);
  return getWidgetDisplayName(widgetKey) || (definition ? definition.label : widgetKey);
}

async function fetchRemoteResource(url, options) {
  try {
    return await globalThis.fetch(url, options);
  } catch (nodeError) {
    try {
      // Chromium's network stack knows about system proxies, while Node's
      // fetch is more resilient to Bing closing idle keep-alive sockets.
      return await net.fetch(url, options);
    } catch (chromiumError) {
      throw nodeError;
    }
  }
}

async function fetchBingWallpaperImage() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetchRemoteResource(
      "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=zh-CN",
      {
        cache: "no-store",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Bing 返回 ${response.status}`);
    }

    const payload = await response.json();
    const images = payload && Array.isArray(payload.images)
      ? payload.images.filter((image) => image && (image.url || image.urlbase))
      : [];

    if (images.length === 0) {
      throw new Error("Bing 暂未返回壁纸");
    }

    return { images, controller, timeout };
  } catch (error) {
    clearTimeout(timeout);
    controller.abort();
    throw error;
  }
}

async function pruneBingBackgrounds(directory, keep = 12) {
  try {
    const root = path.resolve(directory).toLowerCase();
    const referenced = new Set();

    for (const definition of WIDGET_DEFS) {
      const config = getWidgetConfig(definition.key);
      if (!config || !config.backgroundImage) continue;
      referenced.add(path.resolve(config.backgroundImage).toLowerCase());
    }

    const names = await fs.readdir(directory);
    const bingFiles = names
      .filter((name) => /^bing-.*\.jpg$/i.test(name))
      .sort((left, right) => right.localeCompare(left));
    const removable = bingFiles.filter(
      (name) => !referenced.has(path.join(root, name).toLowerCase())
    );

    for (const name of removable.slice(keep)) {
      await fs.unlink(path.join(directory, name)).catch(() => {});
    }
  } catch (error) {
    // Cache cleanup is best-effort.
  }
}

async function applyBingWallpaper(widgetKey, { refresh = false } = {}) {
  const config = getWidgetConfig(widgetKey);
  const definition = WIDGET_BY_KEY.get(widgetKey);

  if (!config || !definition) {
    return { ok: false, error: "未知小组件。" };
  }

  let request;

  try {
    request = await fetchBingWallpaperImage();
  } catch (error) {
    console.warn("[bing] 获取壁纸列表失败:", error && error.message ? error.message : error);
    return { ok: false, error: "无法获取 Bing 壁纸，请检查网络连接。" };
  }

  try {
    const { images, controller, timeout } = request;
    let index = 0;

    if (refresh) {
      bingImageCursor = (bingImageCursor + 1) % images.length;
      index = bingImageCursor;
    }

    const image = images[index];
    const rawUrl = image.url ||
      (image.urlbase
        ? `${image.urlbase}_1920x1080.jpg`
        : "");

    if (!rawUrl) {
      throw new Error("Bing 壁纸地址为空");
    }

    const imageUrl = rawUrl.startsWith("http")
      ? rawUrl
      : `https://www.bing.com${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;

    const response = await fetchRemoteResource(imageUrl, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`壁纸下载失败：${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length < 1024) {
      throw new Error("Bing 壁纸内容为空");
    }

    if (buffer.length > 30 * 1024 * 1024) {
      throw new Error("Bing 壁纸文件过大");
    }

    clearTimeout(timeout);

    const backgroundsDir = getBackgroundsDir();
    await fs.mkdir(backgroundsDir, { recursive: true });

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = path.join(
      backgroundsDir,
      `bing-${stamp}-${index}-${Date.now()}.jpg`
    );

    await fs.writeFile(filePath, buffer);
    await pruneBingBackgrounds(backgroundsDir);

    config.backgroundImage = filePath;
    await persistFloatingConfig();
    sendDesktopLayerState();
    notifyFloatingSettingsChanged();

    return {
      ok: true,
      settings: getFloatingSettings(),
      backgroundName: path.basename(filePath),
      title: image.title || ""
    };
  } catch (error) {
    console.warn("[bing] 下载壁纸失败:", error && error.message ? error.message : error);

    try {
      request.controller.abort();
      clearTimeout(request.timeout);
    } catch (abortError) {
      // ignore
    }

    return { ok: false, error: "无法获取 Bing 壁纸，请稍后再试。" };
  }
}

async function getNoteEntries(limit = 5) {
  return listNoteEntries(getNotesDir(), { limit });
}

function normalizeNoteLimit(value, fallback = 5) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return parsed;
}

async function saveManualNote(input, { clearDraft = false } = {}) {
  const saved = await saveNoteEntry(getNotesDir(), input);

  if (!saved.ok) return saved;

  widgetData.notes.text = clearDraft ? "" : saved.entry.text;

  try {
    await persistWidgetData();
  } catch (error) {
    // The note file is already durable; the draft is best-effort.
  }

  notifyNotesChanged();
  recordAchievement("note-saved", { count: 1 });

  return {
    ok: true,
    entry: saved.entry,
    entries: await getNoteEntries(20),
    savedAt: saved.entry.savedAt
  };
}

async function saveClipboardAsNote() {
  const text = await readClipboardText();

  if (!text.trim()) {
    notifyDesktopLayerToast("剪贴板中没有可保存的文字。", { error: true });
    return { ok: false, error: "剪贴板中没有可保存的文字。" };
  }

  const result = await saveManualNote(text);

  if (result.ok) {
    recordAchievement("clipboard-note", { count: 1 });
    notifyDesktopLayerToast("剪贴板内容已保存为随手记。");
  } else {
    notifyDesktopLayerToast(result.error || "无法保存随手记。", { error: true });
  }

  return result;
}

function validateComponentKey(kind, key) {
  if (kind === "category") {
    return Boolean(getCategoryConfig(key));
  }

  if (kind === "widget") {
    return Boolean(getWidgetConfig(key));
  }

  return false;
}

function getAnyDesktopFile(categoryKey, filePath) {
  if (categoryKey === "quick") {
    return quickAccess && Array.isArray(quickAccess.files)
      ? quickAccess.files.find((file) => file.path === filePath) || null
      : null;
  }

  return getDesktopLayerFile(categoryKey, filePath);
}

ipcMain.handle("desktop-layer:get-state", (event) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  return buildDesktopLayerState();
});

ipcMain.on("desktop-layer:onboarding-ready", (event) => {
  if (!isDesktopLayerSender(event)) return;

  onboardingRendererReady = true;

  if (onboardingActive) {
    flushPendingOnboardingStart();
  }
});

ipcMain.on("desktop-layer:onboarding-step", (event, step) => {
  if (!isDesktopLayerSender(event) || !onboardingActive) return;

  const parsed = Math.round(Number(step));

  if (!Number.isFinite(parsed) || parsed < 0 || parsed >= ONBOARDING_STEP_COUNT) {
    return;
  }

  onboardingState = normalizeOnboardingState({
    ...onboardingState,
    step: parsed,
    updatedAt: new Date().toISOString()
  });
  persistOnboardingState();
});

ipcMain.handle("desktop-layer:prepare-onboarding-widget", (event, widgetKey) => {
  if (!isDesktopLayerSender(event) || !onboardingActive) {
    return { ok: false, error: "引导尚未开始。" };
  }

  const config = getWidgetConfig(widgetKey);

  if (!config) {
    return { ok: false, error: "组件不存在。" };
  }

  onboardingPreviewWidgetKeys.add(widgetKey);
  sendDesktopLayerState();

  return { ok: true, preview: !config.enabled };
});

ipcMain.handle("desktop-layer:onboarding-finish", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  if (!onboardingActive) {
    return { ok: true, alreadyFinished: true };
  }

  return finishOnboardingTour(payload || {});
});

ipcMain.on("desktop-layer:mouse-passthrough", (event, ignore) => {
  if (!isDesktopLayerSender(event)) return;

  // The renderer can force the layer interactive for drags; the main-process
  // cursor watcher restores click-through once the pointer leaves.
  if (Boolean(ignore)) {
    updateDesktopLayerPointerMode();
  } else {
    desktopLayerOutsideInteractiveSince = 0;
    applyDesktopLayerMouseIgnore(false);
  }
});

ipcMain.on("desktop-layer:desktop-icon-rects", (event, rects) => {
  if (!isDesktopLayerSender(event) || !Array.isArray(rects)) return;

  desktopIconRects = rects
    .slice(0, 2000)
    .map((rect) => ({
      x: Math.round(Number(rect && rect.x)),
      y: Math.round(Number(rect && rect.y)),
      width: Math.max(0, Math.round(Number(rect && rect.width))),
      height: Math.max(0, Math.round(Number(rect && rect.height)))
    }))
    .filter((rect) => (
      Number.isFinite(rect.x) &&
      Number.isFinite(rect.y) &&
      rect.width > 0 &&
      rect.height > 0
    ));
});

ipcMain.on("desktop-layer:interaction-active", (event, active) => {
  if (!isDesktopLayerSender(event)) return;

  const next = Boolean(active);

  if (next && !desktopLayerInteractionActive) {
    desktopLayerInteractionStartedAt = Date.now();
  } else if (!next) {
    desktopLayerInteractionStartedAt = 0;
  }

  desktopLayerInteractionActive = next;

  if (desktopLayerInteractionActive) {
    desktopLayerOutsideInteractiveSince = 0;
    applyDesktopLayerMouseIgnore(false);
  } else {
    updateDesktopLayerPointerMode();
  }
});

ipcMain.handle("desktop-layer:debug-hit-test", (event, point) => {
  if (!isDesktopLayerSender(event) || !process.env.ORGANIZER_DEBUG_PASSTHROUGH) {
    return { ok: false };
  }

  const x = Number(point && point.x);
  const y = Number(point && point.y);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return { ok: false, error: "bad-point" };
  }

  return {
    ok: true,
    overInteractive: isCursorOverDesktopLayerInteractive({ x, y }),
    overSurface: isCursorOverDesktopSurface(),
    ignored: desktopLayerMouseIgnored,
    hasState: Boolean(desktopLayerLastState),
    iconRects: desktopIconRects.length,
    mainPid: process.pid,
    cursorInfo: getCursorWindowInfo()
  };
});

ipcMain.handle("desktop-layer:set-position", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const kind = payload && payload.kind;
  const key = payload && payload.key;
  const x = Number(payload && payload.x);
  const y = Number(payload && payload.y);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return { ok: false, error: "位置无效。" };
  }

  let config;
  let size;

  if (kind === "category") {
    config = getCategoryConfig(key);
    size = getDesktopCategoryLayoutSize(key);
  } else if (kind === "group") {
    config = getTabGroupById(key);
    size = getDesktopGroupLayoutSize(config);
  } else if (kind === "widget") {
    config = getWidgetConfig(key);
    size = getDesktopWidgetLayoutSize(key);
  }

  if (!config || !size) {
    return { ok: false, error: "组件不存在。" };
  }

  if (config.locked) {
    return { ok: false, error: "组件已锁定。" };
  }

  const bounds = clampFloatingBounds({
    x: Math.round(x),
    y: Math.round(y),
    width: size.width,
    height: size.height
  });

  config.x = bounds.x;
  config.y = bounds.y;
  await persistFloatingConfig();
  sendDesktopLayerState();
  notifyFloatingSettingsChanged();

  return { ok: true, bounds };
});

ipcMain.handle("desktop-layer:focus-input", (event) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, reason: "not-desktop-layer" };
  }

  if (!desktopLayerWindow || desktopLayerWindow.isDestroyed()) {
    return { ok: false, reason: "window-destroyed" };
  }

  const result = focusEmbeddedWindow(desktopLayerWindow);

  try {
    desktopLayerWindow.webContents.focus();
  } catch (error) {
    // Native focus is the important part; webContents may already be focused.
  }

  return result;
});

ipcMain.on("desktop-layer:release-input", (event) => {
  if (!isDesktopLayerSender(event)) return;
  releaseEmbeddedWindowFocus();
});

ipcMain.on("desktop-layer:focus-mode", (event, active) => {
  if (!isDesktopLayerSender(event)) return;

  desktopLayerFocusActive = Boolean(active);
  updateDesktopLayerPointerMode();
});

ipcMain.on("desktop-layer:menu-open", (event, active) => {
  if (!isDesktopLayerSender(event)) return;

  desktopLayerMenuOpen = Boolean(active);

  if (desktopLayerMenuOpen) {
    desktopLayerOutsideInteractiveSince = 0;
    applyDesktopLayerMouseIgnore(false);
  } else {
    updateDesktopLayerPointerMode();
  }
});

ipcMain.handle("desktop-layer:resize", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const kind = payload && payload.kind;
  const key = payload && payload.key;
  const nextWidth = Number(payload && payload.width);
  const nextHeight = Number(payload && payload.height);
  const requestedX = Number(payload && payload.x);
  const requestedY = Number(payload && payload.y);
  const hasPosition = Number.isFinite(requestedX) && Number.isFinite(requestedY);

  if (!Number.isFinite(nextWidth) || !Number.isFinite(nextHeight)) {
    return { ok: false, error: "组件尺寸无效。" };
  }

  if (kind === "category") {
    const config = getCategoryConfig(key);
    if (!config) {
      return { ok: false, error: "分类组件不存在。" };
    }
    if (config.locked) {
      return { ok: false, error: "组件已锁定。" };
    }
    if (collapsedCategories.has(key)) {
      return { ok: false, error: "请先展开分类组件。" };
    }

    const grid = getGridSizeFromWindow(
      Math.max(MIN_CATEGORY_WINDOW_WIDTH, Math.min(2000, nextWidth)),
      Math.max(MIN_CATEGORY_WINDOW_HEIGHT, Math.min(2000, nextHeight))
    );
    config.rows = grid.rows;
    config.cols = grid.cols;

    const size = computeCategoryWindowSize(config.rows, config.cols);
    const bounds = hasPosition
      ? clampBoundsToDesktopLayer({
        x: Math.round(requestedX),
        y: Math.round(requestedY),
        width: size.width,
        height: size.height
      })
      : getInitialCategoryBounds(key, size.width, size.height);
    config.x = bounds.x;
    config.y = bounds.y;

    await persistFloatingConfig();
    sendDesktopLayerState();
    updateDesktopLayerPointerMode();
    notifyFloatingSettingsChanged();

    return {
      ok: true,
      width: size.width,
      height: size.height,
      bounds,
      rows: config.rows,
      cols: config.cols
    };
  }

  if (kind === "group") {
    const config = getTabGroupById(key);

    if (!config) {
      return { ok: false, error: "标签组不存在。" };
    }
    if (config.locked) {
      return { ok: false, error: "组件已锁定。" };
    }

    const width = Math.max(
      GROUP_MIN_WIDTH,
      Math.min(GROUP_MAX_WIDTH, Math.round(nextWidth))
    );
    const height = Math.max(
      GROUP_MIN_HEIGHT,
      Math.min(GROUP_MAX_HEIGHT, Math.round(nextHeight))
    );

    config.width = width;
    config.height = height;

    const bounds = hasPosition
      ? clampBoundsToDesktopLayer({
        x: Math.round(requestedX),
        y: Math.round(requestedY),
        width,
        height
      })
      : clampBoundsToDesktopLayer({
        x: config.x === null ? getVirtualDesktopBounds().x + 64 : config.x,
        y: config.y === null ? getVirtualDesktopBounds().y + 64 : config.y,
        width,
        height
      });
    config.x = bounds.x;
    config.y = bounds.y;

    await persistFloatingConfig();
    sendDesktopLayerState();
    updateDesktopLayerPointerMode();
    notifyFloatingSettingsChanged();

    return {
      ok: true,
      width,
      height,
      bounds,
      minWidth: GROUP_MIN_WIDTH,
      minHeight: GROUP_MIN_HEIGHT
    };
  }

  if (kind === "widget") {
    const config = getWidgetConfig(key);
    const definition = WIDGET_BY_KEY.get(key);

    if (!config || !definition) {
      return { ok: false, error: "未知小组件。" };
    }
    if (config.locked) {
      return { ok: false, error: "组件已锁定。" };
    }

    const width = Math.max(
      MIN_WIDGET_WIDTH,
      Math.min(2000, Math.round(nextWidth))
    );
    const height = Math.max(
      MIN_WIDGET_HEIGHT,
      Math.min(2000, Math.round(nextHeight))
    );

    config.width = width;
    config.height = height;
    // The user just dragged the resize handle: this size wins over the default
    // formula from now on and is persisted below.
    config.sizeCustomized = true;

    const bounds = hasPosition
      ? clampBoundsToDesktopLayer({
        x: Math.round(requestedX),
        y: Math.round(requestedY),
        width,
        height
      })
      : getWidgetInitialBounds(key, width, height);
    config.x = bounds.x;
    config.y = bounds.y;

    await persistFloatingConfig();
    sendDesktopLayerState();
    updateDesktopLayerPointerMode();
    notifyFloatingSettingsChanged();

    return {
      ok: true,
      width,
      height,
      bounds,
      minWidth: MIN_WIDGET_WIDTH,
      minHeight: MIN_WIDGET_HEIGHT
    };
  }

  return { ok: false, error: "未知组件类型。" };
});

ipcMain.handle("desktop-layer:set-collapsed", async (event, categoryKey, collapsed) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const config = getCategoryConfig(categoryKey);
  if (!config) {
    return { ok: false, error: "分类组件不存在。" };
  }

  if (collapsed) {
    collapsedCategories.add(categoryKey);
  } else {
    collapsedCategories.delete(categoryKey);
  }

  sendDesktopLayerState();
  notifyFloatingSettingsChanged();
  return { ok: true, collapsed: Boolean(collapsed) };
});

ipcMain.handle("desktop-layer:toggle-lock", async (event, categoryKey) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const config = getCategoryConfig(categoryKey);
  if (!config) {
    return { ok: false, error: "分类组件不存在。" };
  }

  config.locked = !config.locked;
  await persistFloatingConfig();

  if (config.locked) {
    clearTimeout(floatingResizeTimers.get(categoryKey));
    floatingResizeTimers.delete(categoryKey);
  }

  sendDesktopLayerState();
  notifyFloatingSettingsChanged();
  return { ok: true, locked: config.locked, state: buildDesktopLayerState() };
});

ipcMain.handle("desktop-layer:reset-grid", async (event, categoryKey) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const config = getCategoryConfig(categoryKey);
  if (!config) {
    return { ok: false, error: "分类组件不存在。" };
  }

  config.rows = DEFAULT_ROWS;
  config.cols = DEFAULT_COLS;
  await persistFloatingConfig();
  sendDesktopLayerState();
  notifyFloatingSettingsChanged();
  return { ok: true, state: buildDesktopLayerState() };
});

ipcMain.handle("desktop-layer:close-category", async (event, categoryKey) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const config = getCategoryConfig(categoryKey);
  if (!config) {
    return { ok: false, error: "分类组件不存在。" };
  }

  dismissedCategoryKeys.add(categoryKey);
  sendDesktopLayerState();
  updateDesktopLayerPointerMode();
  notifyFloatingSettingsChanged();
  return { ok: true };
});

ipcMain.handle("desktop-layer:rename-category", async (event, categoryKey, name) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const config = getCategoryConfig(categoryKey);
  if (!config) {
    return { ok: false, error: "分类组件不存在。" };
  }

  config.name = normalizeName(name);
  await persistFloatingConfig();
  sendDesktopLayerState();
  notifyFloatingSettingsChanged();
  recordAchievement("rename", { key: `category:${categoryKey}` });
  if (allVisibleGridsShareName()) {
    recordAchievement("all-grids-same");
  }
  return { ok: true, state: buildDesktopLayerState() };
});

ipcMain.handle("desktop-layer:merge-categories", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  return mergeTabGroupCategories({
    sourceKey: payload && payload.sourceKey,
    targetKey: payload && payload.targetKey
  });
});

ipcMain.handle("desktop-layer:split-group", async (event, groupId) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  return splitTabGroup(groupId);
});

ipcMain.handle("desktop-layer:set-group-active", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const group = getTabGroupById(payload && payload.groupId);
  const categoryKey = payload && payload.categoryKey;

  if (!group) {
    return { ok: false, error: "标签组不存在。" };
  }

  if (!Array.isArray(group.keys) || !group.keys.includes(categoryKey)) {
    return { ok: false, error: "标签不在这个组里。" };
  }

  group.activeKey = categoryKey;
  await persistFloatingConfig();
  return { ok: true, activeKey: categoryKey };
});

ipcMain.handle("desktop-layer:toggle-group-lock", async (event, groupId) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const group = getTabGroupById(groupId);

  if (!group) {
    return { ok: false, error: "标签组不存在。" };
  }

  group.locked = !group.locked;
  await persistFloatingConfig();
  sendDesktopLayerState();
  notifyFloatingSettingsChanged();

  return {
    ok: true,
    locked: group.locked,
    state: buildDesktopLayerState()
  };
});

ipcMain.handle("desktop-layer:assign-dropped-files-to-group", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  return assignFilesToTabGroup(
    payload && payload.groupId,
    payload && payload.paths
  );
});

ipcMain.handle("desktop-layer:record-group-files", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const group = getTabGroupById(payload && payload.groupId);
  const items = payload && Array.isArray(payload.items) ? payload.items : [];

  if (!group) {
    return { ok: false, error: "标签组不存在。" };
  }

  const existing = new Set(
    (Array.isArray(group.addedFiles) ? group.addedFiles : [])
      .map((item) => String(item.path).toLowerCase())
  );
  let added = 0;

  for (const item of items.slice(0, 100)) {
    if (!item || typeof item.path !== "string" || !item.path.trim()) continue;

    const key = item.path.trim().toLowerCase();
    if (existing.has(key)) continue;

    existing.add(key);
    group.addedFiles.push({
      path: item.path.trim(),
      name: typeof item.name === "string" && item.name.trim()
        ? item.name.trim()
        : path.basename(item.path),
      kind: item.kind === "folder" ? "folder" : "file"
    });
    added += 1;
  }

  if (added > 0) {
    await persistFloatingConfig();
  }

  return { ok: true, added };
});

ipcMain.handle("desktop-layer:record-pomodoro-session", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const result = addFocusSession(pomodoroHistory, payload || {});

  if (!result.session) {
    return { ok: false, error: "专注记录无效。" };
  }

  pomodoroHistory = result.history;
  achievementPomodoroRunning = false;
  recordAchievement("pomodoro-complete", {
    minutes: result.session.minutes,
    withDepthAndMusic: Boolean(
      floatingConfig &&
      floatingConfig.depth3d &&
      floatingConfig.musicVisualizer !== false
    ),
    privacyActive: privacyModeActive
  });

  try {
    await persistPomodoroHistory();
  } catch (error) {
    // Keep the in-memory record; the next completion retries the write.
  }

  return { ok: true, session: { ...result.session } };
});

ipcMain.handle("pomodoro:get-heatmap", (event, range) => {
  const fromMainWindow = Boolean(
    mainWindow &&
    !mainWindow.isDestroyed() &&
    event.sender === mainWindow.webContents
  );

  if (!fromMainWindow) {
    return { ok: false, error: "设置页未初始化。" };
  }

  return {
    ok: true,
    ...buildFocusHeatmap(
      pomodoroHistory.sessions,
      normalizeHeatmapRange(range)
    )
  };
});

async function readDropFileDescriptors(paths) {
  const descriptors = [];
  const skipped = [];

  for (const rawPath of (Array.isArray(paths) ? paths : []).slice(0, 50)) {
    if (typeof rawPath !== "string" || !rawPath.trim()) continue;

    const filePath = path.resolve(rawPath);
    let stat = null;

    try {
      stat = await fs.stat(filePath);
    } catch (error) {
      skipped.push({ path: filePath, reason: "文件已不存在" });
      continue;
    }

    const kind = stat.isDirectory()
      ? "folder"
      : stat.isFile()
        ? "file"
        : null;

    if (!kind) {
      skipped.push({ path: filePath, reason: "不是普通文件或文件夹" });
      continue;
    }

    descriptors.push({
      name: path.basename(filePath),
      path: filePath,
      kind,
      type: kind === "folder" ? "folder" : getFileType(path.basename(filePath)),
      extension: kind === "folder" ? "" : path.extname(filePath).toLowerCase(),
      size: kind === "folder" ? 0 : stat.size,
      mtimeMs: stat.mtimeMs,
      atimeMs: stat.atimeMs
    });
  }

  return { descriptors, skipped };
}

async function ingestDroppedFiles(target, paths) {
  const { descriptors, skipped } = await readDropFileDescriptors(paths);

  if (descriptors.length === 0) {
    return {
      ok: false,
      target,
      count: 0,
      error: skipped[0] ? skipped[0].reason : "没有可处理的文件。"
    };
  }

  if (target === "search") {
    return {
      ok: true,
      target,
      count: descriptors.length,
      files: descriptors,
      skipped
    };
  }

  if (target === "todo") {
    let added = 0;
    const todos = Array.isArray(widgetData.todos) ? widgetData.todos.slice() : [];
    const existing = new Set(todos.map((todo) => todo.text));
    const labels = [];

    for (const file of descriptors) {
      if (todos.length >= MAX_TODO_ITEMS) break;

      const text = buildTodoText(file);
      if (!text || existing.has(text)) continue;

      const todo = createTodo(text);
      if (!todo) continue;

      existing.add(text);
      todos.push(todo);
      labels.push(text);
      added += 1;
    }

    if (added > 0) {
      widgetData.todos = normalizeWidgetData({
        ...widgetData,
        todos
      }).todos;

      try {
        await persistWidgetData();
        if (added > 0) {
          recordAchievement("todo-added", { count: added });
        }
      } catch (error) {
        // Keep the in-memory tasks and retry on the next save.
      }
    }

    return {
      ok: true,
      target,
      count: added,
      added,
      labels,
      todos: widgetData.todos.map((todo) => ({ ...todo })),
      skipped,
      error: added === 0 ? "这些文件已经在待办里了。" : null
    };
  }

  if (target === "notes") {
    const text = buildNoteFromFiles(descriptors, new Date());
    const result = await saveNoteEntry(getNotesDir(), text);

    if (!result || !result.ok) {
      return {
        ok: false,
        target,
        count: 0,
        error: result && result.error ? result.error : "无法生成随手记。"
      };
    }

    notifyNotesChanged();
    recordAchievement("note-saved", { count: 1 });

    return {
      ok: true,
      target,
      count: descriptors.length,
      note: result.entry,
      skipped
    };
  }

  return { ok: false, target, error: "未知的拖拽目标。" };
}

ipcMain.handle("desktop-layer:ingest-dropped-files", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  return ingestDroppedFiles(
    payload && payload.target,
    payload && payload.paths
  );
});

function localDateKey(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatCalendarTodoText(event) {
  const date = new Date(event.start);
  const pad = (value) => String(value).padStart(2, "0");
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const time = event.allDay
    ? ""
    : ` ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const location = event.location ? ` @${event.location}` : "";

  return Array.from(`[${month}-${day}${time}] ${event.title}${location}`)
    .slice(0, 200)
    .join("");
}

ipcMain.handle("desktop-layer:import-calendar-todos", async (event) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const calendar = await readSystemCalendar({ days: 7 });

  if (!calendar.ok) {
    return { ok: false, error: calendar.error };
  }

  const todos = Array.isArray(widgetData.todos) ? widgetData.todos.slice() : [];
  const existing = new Set(todos.map((todo) => todo.text));
  const labels = [];

  for (const calendarEvent of calendar.events) {
    if (todos.length >= MAX_TODO_ITEMS) break;

    const text = formatCalendarTodoText(calendarEvent);
    if (existing.has(text)) continue;

    const todo = createTodo(text, {
      dueDate: localDateKey(new Date(calendarEvent.start))
    });
    if (!todo) continue;

    existing.add(text);
    todos.push(todo);
    labels.push(text);
  }

  if (labels.length > 0) {
    widgetData.todos = normalizeWidgetData({
      ...widgetData,
      todos
    }).todos;

    try {
      await persistWidgetData();
      recordAchievement("todo-added", { count: labels.length });
    } catch (error) {
      // Keep the imported tasks in memory for the current session.
    }
  }

  return {
    ok: true,
    imported: labels.length,
    labels,
    source: calendar.source,
    sourceLabel: calendar.sourceLabel,
    todos: widgetData.todos.map((todo) => ({ ...todo }))
  };
});

ipcMain.handle("desktop-layer:export-open-todos", async (event) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const openTodos = (Array.isArray(widgetData.todos) ? widgetData.todos : [])
    .filter((todo) => !todo.done)
    .map((todo) => String(todo.text || "").trim())
    .filter(Boolean);

  if (openTodos.length === 0) {
    return { ok: false, error: "没有未完成的待办。" };
  }

  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const desktopPath = path.resolve(getDesktopPath());
  let filePath = path.join(desktopPath, `未完成待办-${stamp}.txt`);
  let suffix = 1;

  while (true) {
    try {
      await fs.access(filePath);
      filePath = path.join(desktopPath, `未完成待办-${stamp}-${suffix}.txt`);
      suffix += 1;
    } catch (error) {
      break;
    }
  }

  const content = [
    `未完成待办 · ${now.toLocaleString("zh-CN")}`,
    `共 ${openTodos.length} 项`,
    "",
    ...openTodos.map((text, index) => `${index + 1}. ${text}`),
    ""
  ].join("\r\n");

  try {
    await fs.writeFile(filePath, `﻿${content}`, "utf8");
  } catch (error) {
    return { ok: false, error: error.message || "无法写入待办文件。" };
  }

  return {
    ok: true,
    count: openTodos.length,
    path: filePath
  };
});

function searchDesktopFiles(query) {
  const raw = String(query || "").trim().toLocaleLowerCase();
  if (!raw) return { ok: true, results: [] };

  const collator = new Intl.Collator("zh-CN", {
    numeric: true,
    sensitivity: "base"
  });
  const results = [];
  const seen = new Set();

  const pushResult = (file, categoryKey, categoryLabel) => {
    if (!file || !file.path || file.isSystemIcon) return;

    const key = String(file.path).toLowerCase();
    if (seen.has(key)) return;

    const haystack = `${file.name} ${file.path}`.toLocaleLowerCase();
    if (!haystack.includes(raw)) return;

    seen.add(key);
    results.push({
      name: file.name,
      path: file.path,
      type: file.type || "other",
      kind: file.kind || "file",
      categoryKey,
      categoryLabel,
      external: Boolean(file.external)
    });
  };

  for (const categoryKey of CATEGORY_KEYS) {
    const data = getCategoryData(categoryKey);
    const label = getCategoryDisplayName(categoryKey);

    for (const file of data.files) {
      pushResult(file, categoryKey, label);
    }
  }

  for (const file of desktopUnassignedItems) {
    pushResult(file, "desktop", "未整理");
  }

  if (quickAccess && Array.isArray(quickAccess.files)) {
    for (const file of quickAccess.files) {
      pushResult(
        {
          name: file.name,
          path: file.path,
          type: file.kind === "folder" ? "folder" : getFileType(file.name),
          kind: file.kind || "file"
        },
        "quick",
        "快速收纳"
      );
    }
  }

  results.sort((left, right) => {
    const leftStarts = left.name.toLocaleLowerCase().startsWith(raw);
    const rightStarts = right.name.toLocaleLowerCase().startsWith(raw);

    if (leftStarts !== rightStarts) return leftStarts ? -1 : 1;
    return collator.compare(left.name, right.name);
  });

  return { ok: true, results: results.slice(0, 30) };
}

ipcMain.handle("desktop-layer:search-files", (event, query) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  return searchDesktopFiles(query);
});

function isSpotlightSender(event) {
  return Boolean(
    event &&
    spotlightWindow &&
    !spotlightWindow.isDestroyed() &&
    event.sender === spotlightWindow.webContents
  );
}

function getSpotlightBounds(height = 132) {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const width = Math.min(680, Math.max(360, display.workArea.width - 48));
  const nextHeight = Math.max(132, Math.min(560, Math.round(Number(height) || 132)));
  return {
    x: Math.round(display.workArea.x + (display.workArea.width - width) / 2),
    y: Math.round(display.workArea.y + Math.max(80, (display.workArea.height - nextHeight) / 2 - 42)),
    width,
    height: nextHeight
  };
}

function createSpotlightWindow() {
  if (spotlightWindow && !spotlightWindow.isDestroyed()) {
    return spotlightWindow;
  }

  const bounds = getSpotlightBounds(132);
  const win = new BrowserWindow({
    ...bounds,
    minWidth: 360,
    minHeight: 132,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    title: "方寸格搜索",
    ...getWindowIconOption(),
    webPreferences: {
      preload: path.join(__dirname, "spotlight-preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  spotlightWindow = win;
  spotlightReady = false;
  win.setMenuBarVisibility(false);
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event) => event.preventDefault());
  win.webContents.on("did-finish-load", () => {
    spotlightReady = true;

    if (spotlightPendingShow) {
      spotlightPendingShow = false;
      showSpotlight();
    }
  });
  win.on("blur", () => {
    if (!isQuitting && spotlightWindow === win) {
      hideSpotlight();
    }
  });
  win.on("closed", () => {
    spotlightWindow = null;
    spotlightReady = false;
    spotlightPendingShow = false;
  });
  win.loadFile(path.join(__dirname, "renderer", "spotlight.html"));

  return win;
}

function showSpotlight() {
  const win = createSpotlightWindow();

  if (!spotlightReady) {
    spotlightPendingShow = true;
    return;
  }

  spotlightPendingShow = false;
  spotlightSearchRecorded = false;
  win.setBounds(getSpotlightBounds(132));
  win.show();
  win.focus();
  win.webContents.send("spotlight:reset");
}

function hideSpotlight() {
  if (spotlightWindow && !spotlightWindow.isDestroyed()) {
    spotlightWindow.hide();
  }
}

ipcMain.handle("spotlight:search", (event, query) => {
  if (!isSpotlightSender(event)) {
    return { ok: false, error: "搜索窗口未初始化。" };
  }

  const value = String(query || "").trim();
  if (value && !spotlightSearchRecorded) {
    spotlightSearchRecorded = true;
    recordAchievement("search-used");
  }

  return searchDesktopFiles(value);
});

ipcMain.handle("spotlight:open-result", async (event, payload) => {
  if (!isSpotlightSender(event)) {
    return { ok: false, error: "搜索窗口未初始化。" };
  }

  const filePath = payload && payload.path;
  const query = String(payload && payload.query || "").trim();
  const normalizedQuery = query.toLocaleLowerCase();

  if (["bug", "作弊", "admin"].includes(normalizedQuery)) {
    recordAchievement("search-secret-query", { query });
  }

  if (typeof filePath !== "string" || !filePath.trim()) {
    return { ok: false, error: "搜索结果无效。" };
  }

  try {
    const error = await shell.openPath(filePath);
    if (error) return { ok: false, error };
    hideSpotlight();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message || "无法打开文件。" };
  }
});

ipcMain.handle("spotlight:submit-query", (event, query) => {
  if (!isSpotlightSender(event)) {
    return { ok: false, error: "搜索窗口未初始化。" };
  }

  const value = String(query || "").trim();
  const normalized = value.toLocaleLowerCase();

  if (["bug", "作弊", "admin"].includes(normalized)) {
    recordAchievement("search-secret-query", { query: value });
  }

  return { ok: true };
});

ipcMain.handle("spotlight:resize", (event, height) => {
  if (!isSpotlightSender(event)) {
    return { ok: false, error: "搜索窗口未初始化。" };
  }

  if (spotlightWindow && !spotlightWindow.isDestroyed()) {
    spotlightWindow.setBounds(getSpotlightBounds(height));
  }

  return { ok: true };
});

ipcMain.handle("spotlight:hide", (event) => {
  if (!isSpotlightSender(event)) {
    return { ok: false, error: "搜索窗口未初始化。" };
  }

  hideSpotlight();
  return { ok: true };
});

ipcMain.handle("desktop-layer:analyze-pomodoro-drop", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const paths = payload && Array.isArray(payload.paths) ? payload.paths : [];
  const rawPath = paths.find((item) => typeof item === "string" && item.trim());

  if (!rawPath) {
    return { ok: false, error: "没有可分析的文件。" };
  }

  const filePath = path.resolve(rawPath);
  let stat = null;

  try {
    stat = await fs.stat(filePath);
  } catch (error) {
    return { ok: false, error: "文件已不存在。" };
  }

  const kind = stat.isDirectory()
    ? "folder"
    : stat.isFile()
      ? "file"
      : null;

  if (!kind) {
    return { ok: false, error: "无法评估这个文件。" };
  }

  return {
    ok: true,
    path: filePath,
    name: path.basename(filePath),
    kind,
    ...analyzePomodoroFile({
      name: path.basename(filePath),
      kind,
      size: stat.size
    })
  };
});

ipcMain.handle("desktop-layer:save-order", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const categoryKey = payload && payload.categoryKey;
  const keys = payload && payload.keys;
  const config = getCategoryConfig(categoryKey);

  if (!config) {
    return { ok: false, error: "分类组件不存在。" };
  }

  if (!Array.isArray(keys)) {
    return { ok: false, error: "排序数据无效。" };
  }

  const data = getCategoryData(categoryKey);
  const validKeys = new Set(data.files.map((file) => file.key));
  const orderedKeys = [];
  const seen = new Set();

  for (const key of keys) {
    if (typeof key === "string" && validKeys.has(key) && !seen.has(key)) {
      orderedKeys.push(key);
      seen.add(key);
    }
  }

  for (const file of data.files) {
    if (!seen.has(file.key)) {
      orderedKeys.push(file.key);
      seen.add(file.key);
    }
  }

  config.orderKeys = orderedKeys;
  config.sortMode = "custom";
  const byKey = new Map(data.files.map((file) => [file.key, file]));
  data.files = orderedKeys.map((key) => byKey.get(key)).filter(Boolean);

  await persistFloatingConfig();
  sendDesktopLayerState();
  notifyFloatingSettingsChanged();
  return { ok: true };
});

ipcMain.handle("desktop-layer:set-sort", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const categoryKey = payload && payload.categoryKey;
  const mode = payload && payload.mode;
  const config = getCategoryConfig(categoryKey);

  if (!config) {
    return { ok: false, error: "分类组件不存在。" };
  }

  if (!SORT_MODES.includes(mode) || mode === "custom") {
    return { ok: false, error: "排序方式无效。" };
  }

  const state = buildFloatingState({
    files: getCategoryData(categoryKey).files,
    orderKeys: config.orderKeys,
    sortMode: mode
  });

  config.sortMode = mode;
  config.orderKeys = state.orderKeys;
  floatingCategoryData.set(categoryKey, state);
  await persistFloatingConfig();
  sendDesktopLayerState();
  notifyFloatingSettingsChanged();
  recordAchievement("custom-sort", { mode, categoryKey });
  return { ok: true, mode, orderKeys: state.orderKeys };
});

ipcMain.handle("desktop-layer:move-file", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  return moveFileBetweenDesktopCategories(payload || {});
});

async function moveDesktopLayerFilesIntoFolder(folderPath, paths) {
  if (typeof folderPath !== "string" || !path.isAbsolute(folderPath)) {
    return { ok: false, error: "目标文件夹无效。" };
  }

  let targetStat = null;

  try {
    targetStat = await fs.stat(folderPath);
  } catch (error) {
    return { ok: false, error: "目标文件夹不存在。" };
  }

  if (!targetStat.isDirectory()) {
    return { ok: false, error: "目标不是文件夹。" };
  }

  const safePaths = [...new Set((Array.isArray(paths) ? paths : []).filter((item) => (
    typeof item === "string" &&
    path.isAbsolute(item) &&
    normalizePathKey(item) !== normalizePathKey(folderPath)
  )))];

  if (safePaths.length === 0) {
    return { ok: true, moved: [], errors: [] };
  }

  const moved = [];
  const errors = [];

  for (const sourcePath of safePaths) {
    const relative = path.relative(sourcePath, folderPath);

    if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
      errors.push({ path: sourcePath, error: "不能把文件夹移动到自身内部。" });
      continue;
    }

    const name = path.basename(sourcePath);
    const destination = path.join(folderPath, name);

    try {
      await fs.access(destination);
      errors.push({ path: sourcePath, error: `目标文件夹中已存在「${name}」。` });
      continue;
    } catch (error) {
      // Destination is free.
    }

    try {
      await fs.rename(sourcePath, destination);
      moved.push({ from: sourcePath, to: destination, name });
    } catch (error) {
      errors.push({ path: sourcePath, error: error.message || "文件移动失败。" });
    }
  }

  let categoryChanged = false;

  if (moved.length > 0) {
    for (const item of moved) {
      if (categoryMap && removeAssignment(categoryMap, item.from).removed) {
        categoryChanged = true;
      }

      if (quickAccess) {
        quickAccess.files = quickAccess.files.filter((entry) => (
          normalizePathKey(entry.path) !== normalizePathKey(item.from)
        ));
      }
    }

    if (categoryChanged) {
      await persistCategoryMap().catch(() => {});
    }

    await persistQuickAccess().catch(() => {});
    await writeAssignLogWithFallback(buildAssignLogEntry({
      action: "unassign",
      at: new Date(),
      path: moved.map((item) => item.from).join(", "),
      name: moved.map((item) => item.name).join("、"),
      fromCategory: "desktop-layer",
      toCategory: null
    })).catch(() => {});

    await refreshFloatingData(undefined, { show: false }).catch(() => {});
  }

  return { ok: errors.length === 0, moved, errors };
}

ipcMain.handle("desktop-layer:move-files-into-folder", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  return moveDesktopLayerFilesIntoFolder(
    payload && payload.folderPath,
    payload && payload.paths
  );
});

ipcMain.handle("desktop-layer:open-file", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  return openDesktopLayerFile(payload && payload.categoryKey, payload && payload.filePath);
});

ipcMain.handle("desktop-layer:open-with", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const target = await resolveDesktopMenuFile(
    payload && payload.categoryKey,
    payload && payload.filePath
  );

  if (!target) {
    return { ok: false, error: "文件已不在当前组件中。" };
  }

  return openFileWithDialog(target.path);
});

ipcMain.handle("desktop-layer:open-folder-window", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const target = await resolveDesktopMenuFile(
    payload && payload.categoryKey,
    payload && payload.filePath
  );

  if (!target) {
    return { ok: false, error: "文件夹已不在当前组件中。" };
  }

  try {
    const stat = await fs.stat(target.path);

    if (!stat.isDirectory()) {
      return { ok: false, error: "目标不是文件夹。" };
    }
  } catch (error) {
    return { ok: false, error: "文件夹不存在。" };
  }

  return openFolderInNewWindow(target.path);
});

ipcMain.handle("desktop-layer:pin-quick-access", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const target = await resolveDesktopMenuFile(
    payload && payload.categoryKey,
    payload && payload.filePath
  );

  if (!target) {
    return { ok: false, error: "文件夹已不在当前组件中。" };
  }

  try {
    const stat = await fs.stat(target.path);

    if (!stat.isDirectory()) {
      return { ok: false, error: "只有文件夹可以固定到快速访问。" };
    }
  } catch (error) {
    return { ok: false, error: "文件夹不存在。" };
  }

  return runFileShellAction("pinQuickAccess", target.path);
});

ipcMain.handle("desktop-layer:run-as-admin", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const target = await resolveDesktopMenuFile(
    payload && payload.categoryKey,
    payload && payload.filePath
  );

  if (!target) {
    return { ok: false, error: "程序已不在当前组件中。" };
  }

  if (path.extname(target.path).toLowerCase() !== ".exe") {
    return { ok: false, error: "只有 .exe 程序可以以管理员身份运行。" };
  }

  return runFileShellAction("runas", target.path);
});

ipcMain.handle("desktop-layer:show-properties", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const target = await resolveDesktopMenuFile(
    payload && payload.categoryKey,
    payload && payload.filePath
  );

  if (!target) {
    return { ok: false, error: "文件已不在当前组件中。" };
  }

  return runFileShellAction("properties", target.path);
});

ipcMain.handle("desktop-layer:copy-file-paths", async (event, paths) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  return copyDesktopFilePathsToClipboard(paths);
});

ipcMain.handle("desktop-layer:set-file-clipboard", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const operation = payload && payload.operation === "cut" ? "cut" : "copy";
  const paths = payload && Array.isArray(payload.paths) ? payload.paths : [];

  return setDesktopFileClipboard(paths, operation);
});

ipcMain.handle("desktop-layer:get-icon", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  return resolveDesktopLayerIcon(
    payload && payload.categoryKey,
    payload && payload.filePath
  );
});

ipcMain.handle("desktop-layer:rename-file", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const categoryKey = payload && payload.categoryKey;
  const filePath = payload && payload.filePath;
  const name = payload && payload.name;

  if (typeof filePath !== "string" || typeof name !== "string") {
    return { ok: false, error: "重命名参数无效。" };
  }

  return renameDesktopLayerFile(categoryKey, filePath, name);
});

ipcMain.handle("desktop-layer:trash-files", async (event, paths) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  if (!Array.isArray(paths)) {
    return { ok: false, error: "删除参数无效。" };
  }

  return trashDesktopLayerFiles(paths);
});

ipcMain.handle("desktop-layer:paste-files", async (event, categoryKey) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  return pasteClipboardFiles(
    typeof categoryKey === "string" ? categoryKey : "desktop"
  );
});

function createFallbackDragIcon() {
  const size = 40;
  const buffer = Buffer.alloc(size * size * 4);
  const radius = 9;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = Math.max(radius - x, 0, x - (size - 1 - radius));
      const dy = Math.max(radius - y, 0, y - (size - 1 - radius));
      const outside = Math.hypot(dx, dy) > radius;

      if (outside) continue;

      const index = (y * size + x) * 4;
      // NativeImage bitmaps on Windows use BGRA byte order.
      buffer[index] = 172;
      buffer[index + 1] = 156;
      buffer[index + 2] = 126;
      buffer[index + 3] = 178;
    }
  }

  try {
    return nativeImage.createFromBitmap(buffer, {
      width: size,
      height: size,
      scaleFactor: 1
    });
  } catch (error) {
    return nativeImage.createEmpty();
  }
}

ipcMain.on("desktop-layer:start-file-drag", (event, payload) => {
  if (!isDesktopLayerSender(event)) return;

  const paths = Array.isArray(payload && payload.paths)
    ? payload.paths
    : [];
  const safePaths = [...new Set(paths.filter((filePath) => (
    typeof filePath === "string" &&
    path.isAbsolute(filePath) &&
    fsNative.existsSync(filePath)
  )))].slice(0, 50);

  if (safePaths.length === 0) return;

  let icon = null;
  const iconDataUrl = payload && payload.iconDataUrl;

  if (
    typeof iconDataUrl === "string" &&
    /^data:image\/(?:png|jpe?g|webp);base64,/i.test(iconDataUrl)
  ) {
    try {
      icon = nativeImage.createFromDataURL(iconDataUrl);
      if (icon.isEmpty()) icon = null;
    } catch (error) {
      icon = null;
    }
  }

  if (!icon) icon = createFallbackDragIcon();

  try {
    event.sender.startDrag({
      files: safePaths,
      icon
    });
  } catch (error) {
    try {
      event.sender.startDrag({
        file: safePaths[0],
        icon
      });
    } catch (fallbackError) {
      console.warn("[desktop-layer] startDrag failed:", fallbackError.message);
    }
  }
});

ipcMain.handle("desktop-layer:assign-dropped-files", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  return assignFilesToDesktopCategory(
    payload && payload.categoryKey,
    payload && payload.paths
  );
});

ipcMain.handle("desktop-layer:get-widget-data", (event) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  return {
    ok: true,
    notesText: widgetData.notes.text,
    todos: widgetData.todos.map((todo) => ({ ...todo }))
  };
});

ipcMain.handle("desktop-layer:save-notes", async (event, input) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  if (typeof input !== "string") {
    return { ok: false, error: "随手记内容无效。" };
  }

  widgetData.notes.text = normalizeNotesText(input);

  try {
    await persistWidgetData();
    return {
      ok: true,
      savedAt: new Date().toISOString(),
      length: widgetData.notes.text.length
    };
  } catch (error) {
    return { ok: false, error: error.message || "随手记保存失败。" };
  }
});

ipcMain.handle("desktop-layer:add-todo", async (event, input) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  // 兼容两种调用：直接传字符串，或传 { text, dueDate, dueTime }。
  const payload = input && typeof input === "object" ? input : { text: input };
  const text = normalizeTodoText(payload.text);
  if (!text) {
    return { ok: false, error: "请输入待办内容。" };
  }
  if (widgetData.todos.length >= MAX_TODO_ITEMS) {
    return { ok: false, error: `最多保存 ${MAX_TODO_ITEMS} 条待办。` };
  }

  const todo = createTodo(text, {
    dueDate: normalizeTodoDate(payload.dueDate),
    dueTime: normalizeTodoTime(payload.dueTime)
  });
  if (!todo) {
    return { ok: false, error: "请输入待办内容。" };
  }

  widgetData.todos = normalizeWidgetData({
    ...widgetData,
    todos: [...widgetData.todos, todo]
  }).todos;

  try {
    await persistWidgetData();
    recordAchievement("todo-added", { count: 1 });
    notifyTodosChanged();
    return {
      ok: true,
      todos: widgetData.todos.map((item) => ({ ...item })),
      todo: { ...todo }
    };
  } catch (error) {
    return { ok: false, error: error.message || "待办保存失败。" };
  }
});

ipcMain.handle("desktop-layer:toggle-todo", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const id = payload && typeof payload.id === "string" ? payload.id : "";
  const done = Boolean(payload && payload.done);
  const todo = widgetData.todos.find((item) => item.id === id);

  if (!todo) {
    return { ok: false, error: "待办不存在。" };
  }

  todo.done = done;

  try {
    await persistWidgetData();
    if (done) {
      recordAchievement("todo-completed", { count: 1 });
    }
    notifyTodosChanged();
    return {
      ok: true,
      todos: widgetData.todos.map((item) => ({ ...item }))
    };
  } catch (error) {
    return { ok: false, error: error.message || "待办保存失败。" };
  }
});

ipcMain.handle("desktop-layer:set-todo-due-date", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const id = payload && typeof payload.id === "string" ? payload.id : "";
  const dueDate = normalizeTodoDate(payload && payload.dueDate);
  const todo = widgetData.todos.find((item) => item.id === id);

  if (!todo) {
    return { ok: false, error: "待办不存在。" };
  }

  if (payload && payload.dueDate && !dueDate) {
    return { ok: false, error: "日期格式无效。" };
  }

  todo.dueDate = dueDate;

  try {
    await persistWidgetData();
    notifyTodosChanged();
    return {
      ok: true,
      todos: widgetData.todos.map((item) => ({ ...item }))
    };
  } catch (error) {
    return { ok: false, error: error.message || "待办保存失败。" };
  }
});

ipcMain.handle("desktop-layer:delete-todo", async (event, id) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const todoId = typeof id === "string" ? id : "";
  const next = widgetData.todos.filter((todo) => todo.id !== todoId);

  if (next.length === widgetData.todos.length) {
    return { ok: false, error: "待办不存在。" };
  }

  widgetData.todos = next;

  try {
    await persistWidgetData();
    notifyTodosChanged();
    return {
      ok: true,
      todos: widgetData.todos.map((todo) => ({ ...todo }))
    };
  } catch (error) {
    return { ok: false, error: error.message || "待办保存失败。" };
  }
});

/* ---------- 待办：主界面管理页专用通道 ----------
   桌面层的 desktop-layer:* 通道带 isDesktopLayerSender 校验，主窗口调不到，
   这里另开一组 app:todo-* 通道给「待办管理页」用，读写的是同一份 widgetData。 */

function getTodoSnapshot() {
  return widgetData.todos.map((todo) => ({ ...todo }));
}

function notifyTodosChanged() {
  if (
    desktopLayerReady &&
    desktopLayerWindow &&
    !desktopLayerWindow.isDestroyed() &&
    !desktopLayerWindow.webContents.isDestroyed()
  ) {
    desktopLayerWindow.webContents.send("desktop-layer:todos-changed", {
      todos: getTodoSnapshot()
    });
  }

  if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send("app:todos-changed", { todos: getTodoSnapshot() });
  }
}

ipcMain.handle("app:list-todos", () => ({ ok: true, todos: getTodoSnapshot() }));

ipcMain.handle("app:add-todo", async (_event, input) => {
  const payload = input && typeof input === "object" ? input : { text: input };
  const text = normalizeTodoText(payload.text);

  if (!text) return { ok: false, error: "请输入待办内容。" };
  if (widgetData.todos.length >= MAX_TODO_ITEMS) {
    return { ok: false, error: `最多保存 ${MAX_TODO_ITEMS} 条待办。` };
  }

  const todo = createTodo(text, {
    dueDate: normalizeTodoDate(payload.dueDate),
    dueTime: normalizeTodoTime(payload.dueTime)
  });
  if (!todo) return { ok: false, error: "请输入待办内容。" };

  widgetData.todos = normalizeWidgetData({
    ...widgetData,
    todos: [...widgetData.todos, todo]
  }).todos;

  try {
    await persistWidgetData();
    recordAchievement("todo-added", { count: 1 });
    notifyTodosChanged();
    return { ok: true, todos: getTodoSnapshot(), todo: { ...todo } };
  } catch (error) {
    return { ok: false, error: error.message || "待办保存失败。" };
  }
});

ipcMain.handle("app:toggle-todo", async (_event, payload) => {
  const id = payload && typeof payload.id === "string" ? payload.id : "";
  const done = Boolean(payload && payload.done);
  const todo = widgetData.todos.find((item) => item.id === id);

  if (!todo) return { ok: false, error: "待办不存在。" };

  todo.done = done;

  try {
    await persistWidgetData();
    if (done) recordAchievement("todo-completed", { count: 1 });
    notifyTodosChanged();
    return { ok: true, todos: getTodoSnapshot() };
  } catch (error) {
    return { ok: false, error: error.message || "待办保存失败。" };
  }
});

/** 编辑待办：内容、日期、时间均可单独更新，没传的字段保持原值。 */
ipcMain.handle("app:update-todo", async (_event, payload) => {
  const id = payload && typeof payload.id === "string" ? payload.id : "";
  const todo = widgetData.todos.find((item) => item.id === id);

  if (!todo) return { ok: false, error: "待办不存在。" };

  if (payload && Object.prototype.hasOwnProperty.call(payload, "text")) {
    const text = normalizeTodoText(payload.text);
    if (!text) return { ok: false, error: "待办内容不能为空。" };
    todo.text = text;
  }
  if (payload && Object.prototype.hasOwnProperty.call(payload, "dueDate")) {
    const dueDate = normalizeTodoDate(payload.dueDate);
    if (payload.dueDate && !dueDate) return { ok: false, error: "日期格式无效。" };
    todo.dueDate = dueDate;
  }
  if (payload && Object.prototype.hasOwnProperty.call(payload, "dueTime")) {
    const dueTime = normalizeTodoTime(payload.dueTime);
    if (payload.dueTime && !dueTime) return { ok: false, error: "时间格式无效。" };
    todo.dueTime = dueTime;
  }

  try {
    await persistWidgetData();
    notifyTodosChanged();
    return { ok: true, todos: getTodoSnapshot() };
  } catch (error) {
    return { ok: false, error: error.message || "待办保存失败。" };
  }
});

ipcMain.handle("app:delete-todo", async (_event, id) => {
  const todoId = typeof id === "string" ? id : "";
  const next = widgetData.todos.filter((todo) => todo.id !== todoId);

  if (next.length === widgetData.todos.length) {
    return { ok: false, error: "待办不存在。" };
  }

  widgetData.todos = next;

  try {
    await persistWidgetData();
    notifyTodosChanged();
    return { ok: true, todos: getTodoSnapshot() };
  } catch (error) {
    return { ok: false, error: error.message || "待办保存失败。" };
  }
});

/** 导出 CSV：ids 是当前 Tab 列表的全部条目（未传 ids 时才回退到全部），写入 UTF-8（带 BOM）。 */
ipcMain.handle("app:export-todos-csv", async (event, ids) => {
  try {
    const selected = Array.isArray(ids) ? ids.map((id) => String(id)) : null;
    const source = selectTodosForExport(widgetData.todos, selected);

    if (source.length === 0) {
      return { ok: false, error: "没有可导出的待办。" };
    }

    const stamp = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    const defaultName =
      `方寸格-待办-${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}.csv`;

    const dialogTarget = BrowserWindow.getFocusedWindow() ||
      (mainWindow && !mainWindow.isDestroyed() ? mainWindow : null);
    const result = await (dialogTarget
      ? dialog.showSaveDialog(dialogTarget, {
          title: "导出待办为 CSV",
          defaultPath: defaultName,
          filters: [{ name: "CSV 表格", extensions: ["csv"] }]
        })
      : dialog.showSaveDialog({
          title: "导出待办为 CSV",
          defaultPath: defaultName,
          filters: [{ name: "CSV 表格", extensions: ["csv"] }]
        }));

    if (result.canceled || !result.filePath) {
      return { ok: false, canceled: true };
    }

    await fsNative.promises.writeFile(
      result.filePath,
      todosToCsv(source),
      "utf8"
    );

    return { ok: true, filePath: result.filePath, count: source.length };
  } catch (error) {
    return { ok: false, error: error.message || "导出失败。" };
  }
});

/** 导入 CSV：选择文件 → 解析 → 与现有待办合并（按内容去重）→ 全窗口同步。 */
ipcMain.handle("app:import-todos-csv", async () => {
  try {
    const dialogTarget = BrowserWindow.getFocusedWindow() ||
      (mainWindow && !mainWindow.isDestroyed() ? mainWindow : null);
    const picked = await (dialogTarget
      ? dialog.showOpenDialog(dialogTarget, {
          title: "导入待办 CSV",
          filters: [
            { name: "CSV 表格", extensions: ["csv"] },
            { name: "文本文件", extensions: ["txt"] }
          ],
          properties: ["openFile"]
        })
      : dialog.showOpenDialog({
          title: "导入待办 CSV",
          filters: [
            { name: "CSV 表格", extensions: ["csv"] },
            { name: "文本文件", extensions: ["txt"] }
          ],
          properties: ["openFile"]
        }));

    if (picked.canceled || !picked.filePaths || picked.filePaths.length === 0) {
      return { ok: false, canceled: true };
    }

    const raw = await fsNative.promises.readFile(
      picked.filePaths[0],
      "utf8"
    );
    const parsed = parseTodosCsv(raw, { existing: widgetData.todos });

    if (parsed.todos.length === 0) {
      return { ok: false, error: "没有解析到可导入的待办。" };
    }

    widgetData.todos = normalizeWidgetData({
      ...widgetData,
      todos: [...widgetData.todos, ...parsed.todos]
    }).todos;

    await persistWidgetData();
    if (parsed.todos.length > 0) {
      recordAchievement("todo-added", { count: parsed.todos.length });
    }
    notifyTodosChanged();

    return {
      ok: true,
      added: parsed.todos.length,
      skipped: parsed.skipped,
      todos: getTodoSnapshot()
    };
  } catch (error) {
    return { ok: false, error: error.message || "导入失败。" };
  }
});

/** 桌面组件第二页的「查看全部待办与历史」按钮：唤起主界面并直达待办管理页。 */
ipcMain.handle("desktop-layer:open-todo-manager", (event) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const win = focusMainWindow();
  if (win && !win.webContents.isDestroyed()) {
    const send = () => {
      if (!win.isDestroyed() && !win.webContents.isDestroyed()) {
        win.webContents.send("app:open-todo-manager");
      }
    };

    if (win.webContents.isLoadingMainFrame()) {
      win.webContents.once("did-finish-load", send);
    } else {
      send();
    }
  }

  return { ok: true };
});

ipcMain.handle("desktop-layer:get-music-session", async (event) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  getMediaSessionWatcher().start();
  return getMediaSessionWatcher().getSnapshot();
});

ipcMain.handle("desktop-layer:music-control", async (event, command) => {
  if (!isDesktopLayerSender(event)) {
    return {
      ok: false,
      supported: false,
      message: "桌面层未初始化。"
    };
  }

  return getMediaSessionWatcher().control(command);
});

ipcMain.handle("desktop-layer:open-component-settings", (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const kind = payload && payload.kind;
  const key = payload && payload.key;

  if (!validateComponentKey(kind, key)) {
    return { ok: false, error: "组件不存在。" };
  }

  sendToMainWindow("ui:open-component-settings", { kind, key });
  return { ok: true };
});

ipcMain.handle("desktop-layer:toggle-widget-lock", async (event, widgetKey) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const config = getWidgetConfig(widgetKey);
  if (!config) {
    return { ok: false, error: "未知小组件。" };
  }

  config.locked = !config.locked;
  await persistFloatingConfig();
  sendDesktopLayerState();
  notifyFloatingSettingsChanged();

  return { ok: true, locked: config.locked };
});

ipcMain.handle("desktop-layer:close-widget", async (event, widgetKey) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const config = getWidgetConfig(widgetKey);
  if (!config) {
    return { ok: false, error: "未知小组件。" };
  }

  config.enabled = false;
  forgetFullscreenWidget(widgetKey);
  await persistFloatingConfig();
  sendDesktopLayerState();
  updateDesktopLayerPointerMode();
  notifyFloatingSettingsChanged();

  return { ok: true };
});

ipcMain.handle("desktop-layer:set-accent", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const kind = payload && payload.kind;
  const key = payload && payload.key;
  const color = payload && payload.color;

  if (!validateComponentKey(kind, key)) {
    return { ok: false, error: "组件不存在。" };
  }

  const result = setComponentAccent(componentAppearance, kind, key, color);

  if (result.changed) {
    await persistComponentAppearance();
    sendDesktopLayerState();
  }

  return { ok: true, color: result.color, colors: ACCENT_COLORS };
});

ipcMain.handle("desktop-layer:refresh-category", async (event, categoryKey) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  if (!getCategoryConfig(categoryKey)) {
    return { ok: false, error: "分类组件不存在。" };
  }

  await refreshFloatingData(undefined, { show: false });
  return { ok: true };
});

ipcMain.handle("desktop-layer:clear-category-records", async (event, categoryKey) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const config = getCategoryConfig(categoryKey);
  if (!config || !categoryMap) {
    return { ok: false, error: "分类组件不存在。" };
  }

  const count = listAssignments(categoryMap)
    .filter((assignment) => assignment.category === categoryKey)
    .length;

  if (count === 0) {
    return { ok: true, canceled: false, removed: 0, settings: getFloatingSettings() };
  }

  const options = {
    type: "warning",
    title: "清空分类记录",
    message: `确定清空「${getCategoryDisplayName(categoryKey)}」的 ${count} 条归属记录吗？`,
    detail: "桌面文件不会被移动、复制或删除，只会回到「未整理」状态。映射文件夹中的文件也不受影响。",
    buttons: ["清空记录", "取消"],
    defaultId: 1,
    cancelId: 1,
    noLink: true
  };
  const choice = await dialog.showMessageBox(options);

  if (choice.response !== 0) {
    return { ok: true, canceled: true, removed: 0, settings: getFloatingSettings() };
  }

  const removed = removeAssignmentsByCategory(categoryMap, categoryKey);

  try {
    await persistCategoryMap();
  } catch (error) {
    // Keep the in-memory clear; the next save retries.
  }

  await refreshFloatingData(undefined, { show: false });

  return {
    ok: true,
    canceled: false,
    removed: removed.length,
    settings: getFloatingSettings()
  };
});

ipcMain.handle("desktop-layer:map-category-folder", async (event, categoryKey) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  if (!getCategoryConfig(categoryKey)) {
    return { ok: false, error: "分类组件不存在。" };
  }

  const parentWindow = BrowserWindow.fromWebContents(event.sender);
  const options = {
    title: `为「${getCategoryDisplayName(categoryKey)}」映射本地文件夹`,
    buttonLabel: "映射此文件夹",
    properties: ["openDirectory"]
  };
  const result = parentWindow && !parentWindow.isDestroyed()
    ? await dialog.showOpenDialog(parentWindow, options).catch(() => null)
    : await dialog.showOpenDialog(options).catch(() => null);

  if (!result || result.canceled || !Array.isArray(result.filePaths) || result.filePaths.length === 0) {
    return { ok: true, canceled: true, settings: getFloatingSettings() };
  }

  const folderPath = result.filePaths[0];

  try {
    const stat = await fs.stat(folderPath);
    if (!stat.isDirectory()) throw new Error("不是文件夹");
  } catch (error) {
    return { ok: false, error: "所选路径不是可访问的文件夹。" };
  }

  setMappedFolder(categoryMappings, categoryKey, folderPath);
  await persistCategoryMappings();
  await refreshFloatingData(undefined, { show: false });
  recordAchievement("folder-mapping", { categoryKey });

  return {
    ok: true,
    canceled: false,
    folder: folderPath,
    settings: getFloatingSettings()
  };
});

ipcMain.handle("desktop-layer:unmap-category-folder", async (event, categoryKey) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  if (!getCategoryConfig(categoryKey)) {
    return { ok: false, error: "分类组件不存在。" };
  }

  setMappedFolder(categoryMappings, categoryKey, null);
  await persistCategoryMappings();
  await refreshFloatingData(undefined, { show: false });

  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("desktop-layer:set-clock-text", async (event, text) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const config = getWidgetConfig("clock");
  if (!config) {
    return { ok: false, error: "时钟尚未初始化。" };
  }

  const next = normalizeClockSettings({ ...config, customText: text });
  config.customText = next.customText;
  await persistFloatingConfig();
  sendDesktopLayerState();
  notifyFloatingSettingsChanged();

  return { ok: true, customText: config.customText };
});

ipcMain.handle("desktop-layer:clear-completed-todos", async (event) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const completed = widgetData.todos.filter((todo) => todo.done).length;

  if (completed > 0) {
    widgetData.todos = widgetData.todos.filter((todo) => !todo.done);

    try {
      await persistWidgetData();
    } catch (error) {
      return { ok: false, error: "已完成的待办保存失败。" };
    }
  }

  return {
    ok: true,
    removed: completed,
    todos: widgetData.todos.map((todo) => ({ ...todo }))
  };
});

ipcMain.handle("desktop-layer:pick-widget-background", async (event, widgetKey) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const config = getWidgetConfig(widgetKey);
  const definition = WIDGET_BY_KEY.get(widgetKey);

  if (!config || !definition) {
    return { ok: false, error: "未知小组件。" };
  }

  const parentWindow = BrowserWindow.fromWebContents(event.sender);
  const options = {
    title: `为「${getWidgetDisplayLabel(widgetKey)}」选择背景图片`,
    properties: ["openFile"],
    filters: [
      {
        name: "图片",
        extensions: ["png", "jpg", "jpeg", "webp", "gif", "bmp", "avif"]
      }
    ]
  };
  const result = parentWindow && !parentWindow.isDestroyed()
    ? await dialog.showOpenDialog(parentWindow, options).catch(() => null)
    : await dialog.showOpenDialog(options).catch(() => null);

  if (!result || result.canceled || !Array.isArray(result.filePaths) || result.filePaths.length === 0) {
    return { ok: true, canceled: true, settings: getFloatingSettings() };
  }

  config.backgroundImage = result.filePaths[0];
  await persistFloatingConfig();
  sendDesktopLayerState();
  notifyFloatingSettingsChanged();
  recordAchievement("custom-background");

  return { ok: true, canceled: false, settings: getFloatingSettings() };
});

ipcMain.handle("desktop-layer:clear-widget-background", async (event, widgetKey) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const config = getWidgetConfig(widgetKey);
  if (!config) {
    return { ok: false, error: "未知小组件。" };
  }

  config.backgroundImage = null;
  await persistFloatingConfig();
  sendDesktopLayerState();
  notifyFloatingSettingsChanged();

  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("desktop-layer:set-bing-background", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const widgetKey = payload && payload.widgetKey;
  const refresh = Boolean(payload && payload.refresh);

  if (!getWidgetConfig(widgetKey)) {
    return { ok: false, error: "未知小组件。" };
  }

  const result = await applyBingWallpaper(widgetKey, { refresh });

  if (result && result.ok) {
    recordAchievement("custom-background");
  }

  return result;
});

ipcMain.handle("desktop-layer:reveal-file", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const categoryKey = payload && payload.categoryKey;
  const filePath = payload && payload.filePath;
  const file = getAnyDesktopFile(categoryKey, filePath);

  if (!file) {
    return { ok: false, error: "文件已不在当前组件中。" };
  }

  if (categoryKey !== "quick" && file.isSystemIcon) {
    const target = getSystemIconTarget(file.path);

    if (!target) {
      return { ok: false, error: "未知的系统入口。" };
    }

    openSystemTarget(target);
    return { ok: true };
  }

  let revealPath = file.path;

  // "Open file location" on a shortcut means the target application's
  // location, matching Explorer's behaviour.
  if (
    process.platform === "win32" &&
    path.extname(file.path).toLowerCase() === ".lnk"
  ) {
    try {
      const details = shell.readShortcutLink(file.path);
      const target = details && typeof details.target === "string"
        ? details.target
        : "";

      if (target && path.isAbsolute(target)) {
        await fs.access(target);
        revealPath = target;
      }
    } catch (error) {
      // Fall back to revealing the shortcut itself.
    }
  }

  shell.showItemInFolder(revealPath);
  return { ok: true };
});

ipcMain.handle("desktop-layer:set-file-tag", async (event, payload) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const categoryKey = payload && payload.categoryKey;
  const filePath = payload && payload.filePath;
  const color = typeof (payload && payload.color) === "string"
    ? payload.color
    : "";

  if (color && !FILE_COLOR_TAGS.includes(color)) {
    return { ok: false, error: "颜色角标无效。" };
  }

  const file = getAnyDesktopFile(categoryKey, filePath);
  if (!file) {
    return { ok: false, error: "文件已不在当前组件中。" };
  }

  if (categoryKey !== "quick" && file.isSystemIcon) {
    return { ok: false, error: "系统图标不能添加颜色角标。" };
  }

  setFileTag(fileTags, file.path, color);
  await persistFileTags();

  if (color) {
    recordAchievement("color-tags", { paths: [file.path] });
  }

  for (const data of floatingCategoryData.values()) {
    for (const item of data.files) {
      item.colorTag = getFileTag(fileTags, item.path);
    }
  }

  sendDesktopLayerState();

  return { ok: true, color: getFileTag(fileTags, file.path) };
});

ipcMain.handle("desktop-layer:open-quick-file", async (event, filePath) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const file = quickAccess && Array.isArray(quickAccess.files)
    ? quickAccess.files.find((item) => item.path === filePath)
    : null;

  if (!file) {
    return { ok: false, error: "文件已不在快速收纳中。" };
  }

  try {
    const error = await shell.openPath(file.path);
    return error ? { ok: false, error } : { ok: true };
  } catch (error) {
    return { ok: false, error: error.message || "无法打开文件。" };
  }
});

ipcMain.handle("desktop-layer:add-quick-files", async (event, paths) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  if (!Array.isArray(paths) || paths.length === 0) {
    return { ok: false, error: "没有可加入的文件。", count: 0 };
  }

  let count = 0;
  const skipped = [];

  for (const rawPath of paths.slice(0, MAX_QUICK_FILES)) {
    if (typeof rawPath !== "string" || !rawPath.trim()) continue;

    const filePath = path.resolve(rawPath);
    let stat;

    try {
      stat = await fs.lstat(filePath);
    } catch (error) {
      skipped.push({ path: filePath, reason: "文件已不存在" });
      continue;
    }

    const kind = stat.isDirectory()
      ? "folder"
      : stat.isFile()
        ? "file"
        : null;

    if (!kind) {
      skipped.push({ path: filePath, reason: "不是普通文件或文件夹" });
      continue;
    }

    const result = addQuickFile(quickAccess, {
      path: filePath,
      name: path.basename(filePath),
      kind,
      addedAt: new Date()
    });

    if (result.changed) {
      count += 1;
    } else {
      skipped.push({ path: filePath, reason: result.error || "已在快速收纳中" });
    }
  }

  if (count > 0) {
    await persistQuickAccess();
    sendDesktopLayerState();
    notifyFloatingSettingsChanged();
  }

  return {
    ok: true,
    count,
    skipped,
    files: quickFileItems(),
    settings: getFloatingSettings()
  };
});

ipcMain.handle("desktop-layer:remove-quick-file", async (event, filePath) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const result = removeQuickFile(quickAccess, filePath);

  if (result.changed) {
    await persistQuickAccess();
    sendDesktopLayerState();
    notifyFloatingSettingsChanged();
  }

  return {
    ok: true,
    removed: result.changed,
    files: quickFileItems(),
    settings: getFloatingSettings()
  };
});

ipcMain.handle("desktop-layer:clear-quick-files", async (event) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const count = Array.isArray(quickAccess.files) ? quickAccess.files.length : 0;

  if (count === 0) {
    return { ok: true, removed: 0, files: [], settings: getFloatingSettings() };
  }

  clearQuickFiles(quickAccess);
  await persistQuickAccess();
  sendDesktopLayerState();
  notifyFloatingSettingsChanged();

  return {
    ok: true,
    removed: count,
    files: [],
    settings: getFloatingSettings()
  };
});

ipcMain.handle("desktop-layer:get-note-entries", async (event, limit) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  return {
    ok: true,
    notesDir: getNotesDir(),
    entries: await getNoteEntries(normalizeNoteLimit(limit, 5))
  };
});

ipcMain.handle("desktop-layer:save-note", async (event, input) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  if (typeof input !== "string") {
    return { ok: false, error: "随手记内容无效。" };
  }

  return saveManualNote(input, { clearDraft: true });
});

ipcMain.handle("desktop-layer:open-notes-history", async (event) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  sendToMainWindow("notes:show-history", {});
  return { ok: true };
});

ipcMain.handle("desktop-layer:copy-clipboard-entry", async (event, id) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const entryId = typeof id === "string" ? id : "";
  const entry = clipboardHistory.entries.find((item) => item.id === entryId);

  if (!entry) {
    return { ok: false, error: "这条剪贴板记录已经不存在。" };
  }

  if (!(await writeClipboardText(entry.text))) {
    return { ok: false, error: "无法写入剪贴板。" };
  }

  // The watcher must not treat this programmatic write as a new copy or move
  // the clicked row back to the top.
  clipboardLastText = entry.text;
  recordAchievement("clipboard-copy", { count: 1 });

  return {
    ok: true,
    entries: clipboardEntriesForRenderer()
  };
});

ipcMain.handle("desktop-layer:delete-clipboard-entry", async (event, id) => {
  if (!isDesktopLayerSender(event)) {
    return { ok: false, error: "桌面层未初始化。" };
  }

  const result = removeClipboardEntry(clipboardHistory, id);

  if (!result.changed) {
    return { ok: false, error: "这条剪贴板记录已经不存在。" };
  }

  clipboardHistory = {
    ...clipboardHistory,
    entries: result.entries
  };
  await persistClipboardHistory();
  sendDesktopLayerState();

  return {
    ok: true,
    entries: clipboardEntriesForRenderer()
  };
});

ipcMain.handle("floating:set-bing-background", async (event, widgetKey, refresh) => {
  if (!getWidgetConfig(widgetKey)) {
    return { ok: false, error: "未知小组件。" };
  }

  const result = await applyBingWallpaper(widgetKey, {
    refresh: Boolean(refresh)
  });

  if (result && result.ok) {
    recordAchievement("custom-background");
  }

  return result;
});

ipcMain.handle("notes:list", async () => {
  return {
    ok: true,
    notesDir: getNotesDir(),
    entries: await listNoteEntries(getNotesDir())
  };
});

ipcMain.handle("notes:copy", async (event, id) => {
  const entries = await listNoteEntries(getNotesDir());
  const entry = entries.find((item) => item.id === id);

  if (!entry) {
    return { ok: false, error: "这条随手记已经不存在。" };
  }

  const copied = await writeClipboardText(entry.text);

  return copied
    ? { ok: true }
    : { ok: false, error: "无法写入剪贴板。" };
});

ipcMain.handle("notes:delete", async (event, id) => {
  const result = await deleteNoteEntry(getNotesDir(), id);

  if (result.ok) {
    notifyNotesChanged();
  }

  return result;
});

ipcMain.handle("notes:update", async (event, payload) => {
  const id = payload && payload.id;
  const text = payload && payload.text;
  const result = await updateNoteEntry(getNotesDir(), id, text);

  if (result.ok) {
    notifyNotesChanged();
  }

  return result;
});

ipcMain.handle("notes:rename", async (event, payload) => {
  const result = await renameNoteTitle(
    getNotesDir(),
    payload && payload.id,
    payload && payload.title
  );

  if (result.ok) {
    notifyNotesChanged();
  }

  return result;
});

ipcMain.handle("notes:open-folder", async () => {
  const notesDir = getNotesDir();

  try {
    await fs.mkdir(notesDir, { recursive: true });
    const error = await shell.openPath(notesDir);
    return error ? { ok: false, error } : { ok: true };
  } catch (error) {
    return { ok: false, error: error.message || "无法打开随手记文件夹。" };
  }
});

ipcMain.handle("notes:reveal", (event, filePath) => {
  if (typeof filePath !== "string" || !filePath) {
    return { ok: false, error: "随手记路径无效。" };
  }

  const root = path.resolve(getNotesDir());
  const target = path.resolve(filePath);

  if (!target.toLowerCase().startsWith(`${root.toLowerCase()}${path.sep}`)) {
    return { ok: false, error: "随手记路径不在保存目录中。" };
  }

  shell.showItemInFolder(target);
  return { ok: true };
});

ipcMain.handle("notes:save-clipboard", async () => {
  return saveClipboardAsNote();
});

ipcMain.handle("icons:get-pack", async () => {
  return { ok: true, ...(await loadIconPack()) };
});

ipcMain.handle("icons:import-pack", async () => {
  try {
    const result = await importIconPack();
    if (result && result.ok) {
      recordAchievement("icon-pack-import");
    }
    return result;
  } catch (error) {
    return { ok: false, error: error.message || "无法导入图标包。" };
  }
});

ipcMain.handle("layout:export", async () => {
  if (!floatingConfig) {
    return { ok: false, error: "桌面布局尚未初始化。" };
  }

  const result = await dialog.showSaveDialog(mainWindow, {
    title: "导出桌面布局",
    defaultPath: path.join(getDesktopPath(), "方寸格布局.zc"),
    filters: [{ name: "方寸格布局包", extensions: ["zc"] }]
  });

  if (result.canceled || !result.filePath) {
    return { ok: true, canceled: true };
  }

  try {
    const payload = {
      format: "within-cubes-layout",
      version: 1,
      exportedAt: new Date().toISOString(),
      layout: JSON.parse(JSON.stringify(floatingConfig))
    };
    await fs.writeFile(result.filePath, JSON.stringify(payload, null, 2), "utf8");
    recordAchievement("layout-export");
    return { ok: true, filePath: result.filePath };
  } catch (error) {
    return { ok: false, error: error.message || "无法导出布局。" };
  }
});

ipcMain.handle("layout:import", async () => {
  const pick = await dialog.showOpenDialog(mainWindow, {
    title: "导入桌面布局",
    properties: ["openFile"],
    filters: [{ name: "方寸格布局包", extensions: ["zc", "json"] }]
  });

  if (pick.canceled || !pick.filePaths[0]) {
    return { ok: true, canceled: true };
  }

  try {
    const raw = await fs.readFile(pick.filePaths[0], "utf8");
    const parsed = JSON.parse(raw);
    const layout = parsed && parsed.layout
      ? parsed.layout
      : parsed && parsed.floating
        ? parsed.floating
        : parsed;

    if (!layout || typeof layout !== "object") {
      return { ok: false, error: "布局文件格式无效。" };
    }

    const confirmed = await dialog.showMessageBox(mainWindow, {
      type: "warning",
      title: "导入桌面布局",
      message: "导入会替换当前的组件位置、尺寸与主题设置。",
      detail: "文件归属、随手记和桌面文件不会被修改。",
      buttons: ["导入", "取消"],
      defaultId: 0,
      cancelId: 1
    });

    if (confirmed.response !== 0) {
      return { ok: true, canceled: true };
    }

    floatingConfig = normalizeConfig(layout);
    // A .zc exported on another machine (or before a monitor was unplugged) can
    // carry coordinates that no longer land on any connected screen. Pull those
    // components back before the state is rendered.
    const rescue = sanitizeImportedLayoutPositions();
    initializeCollapsedCategoriesForMode();
    await persistFloatingConfig();
    await handleDisplayTopologyChanged();
    sendDesktopLayerState();
    notifyFloatingSettingsChanged();
    return { ok: true, settings: getFloatingSettings(), rescue };
  } catch (error) {
    return { ok: false, error: error.message || "无法导入布局。" };
  }
});

ipcMain.handle("app:reset-all-data", async () => {
  const first = await dialog.showMessageBox(mainWindow, {
    type: "warning",
    title: "重置所有数据",
    message: "这会清空桌面布局、文件归类、随手记、剪贴板历史和全部设置。",
    detail: "桌面上的实际文件不会被删除。此操作不可撤销。",
    buttons: ["继续", "取消"],
    defaultId: 1,
    cancelId: 1
  });

  if (first.response !== 0) {
    return { ok: true, canceled: true };
  }

  const second = await dialog.showMessageBox(mainWindow, {
    type: "warning",
    title: "再次确认",
    message: "确定要永久删除所有方寸格数据并重启吗？",
    detail: "所有分类归属、组件布局、主题、随手记与历史记录都将被清除。",
    buttons: ["永久删除并重启", "取消"],
    defaultId: 1,
    cancelId: 1
  });

  if (second.response !== 0) {
    return { ok: true, canceled: true };
  }

  const files = [
    getHistoryPath(),
    getFloatingConfigPath(),
    getManualCategoriesPath(),
    getCategoryMapPath(),
    getWidgetDataPath(),
    getFileTagsPath(),
    getCategoryMappingsPath(),
    getQuickAccessPath(),
    getClipboardHistoryPath(),
    getComponentAppearancePath(),
    getDesktopIconsStatePath(),
    getSessionStatePath(),
    getOnboardingStatePath(),
    getIconCachePath(),
    getShortcutsPath()
  ];

  if (shortcutIconCacheSaveTimer !== null) {
    clearTimeout(shortcutIconCacheSaveTimer);
    shortcutIconCacheSaveTimer = null;
  }

  for (const filePath of files) {
    await fs.rm(filePath, { force: true }).catch(() => {});
    await fs.rm(`${filePath}.bak`, { force: true }).catch(() => {});
    await fs.rm(`${filePath}.tmp`, { force: true }).catch(() => {});
  }

  await fs.rm(getNotesDir(), { recursive: true, force: true }).catch(() => {});
  await fs.rm(getBackgroundsDir(), { recursive: true, force: true }).catch(() => {});
  await fs.rm(path.join(app.getPath("userData"), "icon-packs"), {
    recursive: true,
    force: true
  }).catch(() => {});
  await fs.rm(getLogDir(), { recursive: true, force: true }).catch(() => {});

  recordAchievement("reset-performed");
  achievementState.resetPending = true;
  scheduleAchievementSave();
  await achievementSaveQueue.catch(() => {});

  try {
    await mainWindow.webContents.session.clearStorageData({
      storages: ["localstorage", "indexdb", "websql", "cookies"]
    });
  } catch (error) {
    // Relaunch still resets the filesystem-backed data.
  }

  isQuitting = true;
  stopShortcutFullscreenWatcher();
  stopPrivacyShortcutFallback();
  stopShortcutRetry();
  globalShortcut.unregisterAll();
  restoreNativeDesktopIcons();
  setTimeout(() => {
    app.relaunch();
    app.exit(0);
  }, 150);

  return { ok: true, reset: true };
});

const MUSIC_ADAPTER_LINKS = Object.freeze({
  betterncm: "https://github.com/std-microblock/BetterNCM-Installer/releases/latest",
  infllink: "https://github.com/apoint123/inflink-rs/releases/latest"
});

const NETEASE_REGISTRY_KEYS = [
  "HKCU\\Software\\Netease\\CloudMusic",
  "HKLM\\SOFTWARE\\Netease\\CloudMusic",
  "HKLM\\SOFTWARE\\WOW6432Node\\Netease\\CloudMusic"
];

function isMainWindowSender(event) {
  return Boolean(
    event &&
    mainWindow &&
    !mainWindow.isDestroyed() &&
    event.sender === mainWindow.webContents
  );
}

function expandWindowsEnvironment(value) {
  return String(value || "").replace(/%([^%]+)%/g, (match, name) => (
    process.env[name] || match
  ));
}

async function isNeteaseInstallDir(candidate) {
  if (typeof candidate !== "string" || !candidate.trim()) return false;

  const directory = path.normalize(
    expandWindowsEnvironment(candidate.trim().replace(/^"(.*)"$/, "$1"))
  );

  try {
    const stat = await fs.stat(directory);
    if (!stat.isDirectory()) return false;

    await fs.access(path.join(directory, "cloudmusic.exe"));
    return true;
  } catch (error) {
    return false;
  }
}

async function readNeteaseInstallDirFromRegistry() {
  for (const key of NETEASE_REGISTRY_KEYS) {
    try {
      const { stdout } = await execFileAsync(
        "reg.exe",
        ["query", key, "/s"],
        {
          windowsHide: true,
          timeout: 2500,
          maxBuffer: 512 * 1024
        }
      );
      const match = /^\s*(?:InstallPath|install_dir|InstallDir)\s+REG_(?:EXPAND_)?SZ\s+(.+?)\s*$/im.exec(stdout);

      if (match && match[1]) {
        return match[1].trim().replace(/^"(.*)"$/, "$1");
      }
    } catch (error) {
      // 未安装或当前用户无权读取时继续尝试下一个位置。
    }
  }

  return "";
}

async function findNeteaseInstallDir() {
  const registryDir = await readNeteaseInstallDirFromRegistry();

  if (await isNeteaseInstallDir(registryDir)) {
    return path.normalize(
      expandWindowsEnvironment(registryDir.replace(/^"(.*)"$/, "$1"))
    );
  }

  const candidates = [
    path.join(process.env.ProgramFiles || "", "Netease", "CloudMusic"),
    path.join(process.env["ProgramFiles(x86)"] || "", "Netease", "CloudMusic"),
    path.join(process.env.LOCALAPPDATA || "", "Netease", "CloudMusic"),
    path.join(process.env.LOCALAPPDATA || "", "Programs", "Netease", "CloudMusic")
  ];

  for (const candidate of candidates) {
    if (await isNeteaseInstallDir(candidate)) {
      return path.normalize(candidate);
    }
  }

  return "";
}

ipcMain.handle("app:get-netease-install-info", async (event) => {
  if (!isMainWindowSender(event)) {
    return { ok: false, installed: false, error: "设置页未初始化。" };
  }

  const installDir = await findNeteaseInstallDir();

  return {
    ok: true,
    installed: Boolean(installDir),
    path: installDir
  };
});

ipcMain.handle("app:open-netease-install-dir", async (event) => {
  if (!isMainWindowSender(event)) {
    return { ok: false, error: "设置页未初始化。" };
  }

  const installDir = await findNeteaseInstallDir();

  if (!installDir) {
    return {
      ok: false,
      error: "未找到网易云音乐安装目录，请先安装桌面版客户端。"
    };
  }

  try {
    const error = await shell.openPath(installDir);
    return error ? { ok: false, path: installDir, error } : {
      ok: true,
      path: installDir
    };
  } catch (error) {
    return {
      ok: false,
      path: installDir,
      error: error.message || "无法打开安装目录。"
    };
  }
});

/** 通用外部链接打开：只放行 http(s)，避免被拿来跑 file:// 或自定义协议。 */
ipcMain.handle("app:open-external", async (event, rawUrl) => {
  if (!isMainWindowSender(event)) {
    return { ok: false, error: "设置页未初始化。" };
  }

  let target;
  try {
    target = new URL(String(rawUrl || ""));
  } catch (error) {
    return { ok: false, error: "链接格式无效。" };
  }

  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return { ok: false, error: "只支持打开 http(s) 链接。" };
  }

  try {
    await shell.openExternal(target.toString());
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message || "无法打开链接。" };
  }
});

ipcMain.handle("app:open-music-adapter-link", async (event, kind) => {
  if (!isMainWindowSender(event)) {
    return { ok: false, error: "设置页未初始化。" };
  }

  const url = typeof kind === "string" ? MUSIC_ADAPTER_LINKS[kind] : "";

  if (!url) {
    return { ok: false, error: "未知的下载地址。" };
  }

  try {
    await shell.openExternal(url);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message || "无法打开下载页面。" };
  }
});

const RENDERER_ACHIEVEMENT_EVENTS = new Set([
  "about-view",
  "aligned-components",
  "component-toggle",
  "external-drag",
  "grid-copy-paste",
  "layout-move",
  "pomodoro-running",
  "pomodoro-start",
  "preview-used",
  "privacy-toggle",
  "search-secret-query",
  "search-used",
  "time-capsule-restore",
  "custom-sort",
  "color-tags"
]);

ipcMain.handle("achievements:get", (event) => {
  if (!isMainWindowSender(event)) {
    return { ok: false, error: "主界面未初始化。" };
  }

  return {
    ok: true,
    ...buildAchievementSnapshot(
      achievementDefinitions,
      achievementState,
      getAchievementIcon
    )
  };
});

ipcMain.handle("achievements:record", (event, type, payload) => {
  const allowedSender = Boolean(
    isMainWindowSender(event) || isDesktopLayerSender(event)
  );

  if (!allowedSender || !RENDERER_ACHIEVEMENT_EVENTS.has(type)) {
    return { ok: false, error: "成就事件无效。" };
  }

  if (type === "pomodoro-start") {
    achievementPomodoroRunning = payload
      ? payload.running !== false
      : true;
  }

  if (type === "pomodoro-running") {
    achievementPomodoroRunning = Boolean(payload && payload.running);
    return { ok: true, unlocked: [] };
  }

  const unlocked = recordAchievement(
    type,
    payload && typeof payload === "object" ? payload : {}
  );

  return {
    ok: true,
    unlocked: unlocked.map((item) => ({
      id: item.id,
      name: item.name,
      difficulty: item.difficulty
    }))
  };
});

const PROJECT_GITHUB_URL = "https://github.com/yourname/within-cubes";

function getGithubRepoSlug() {
  const explicit = String(process.env.WITHIN_CUBES_GITHUB_REPO || "").trim();

  if (explicit) {
    return explicit
      .replace(/^https?:\/\/github\.com\//i, "")
      .replace(/\.git$/i, "")
      .replace(/^\/+|\/+$/g, "");
  }

  const match = /github\.com[/:]([^/#?]+)\/([^/#?]+)/i.exec(PROJECT_GITHUB_URL);
  return match
    ? `${match[1]}/${match[2].replace(/\.git$/i, "")}`
    : "";
}

function compareVersions(left, right) {
  const a = String(left || "").replace(/^v/i, "").split(/[.+-]/);
  const b = String(right || "").replace(/^v/i, "").split(/[.+-]/);

  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const leftPart = Number.parseInt(a[index] || "0", 10) || 0;
    const rightPart = Number.parseInt(b[index] || "0", 10) || 0;
    if (leftPart !== rightPart) return leftPart > rightPart ? 1 : -1;
  }

  return 0;
}

ipcMain.handle("app:get-about-info", (event) => {
  if (!isMainWindowSender(event)) {
    return { ok: false, error: "主界面未初始化。" };
  }

  return {
    ok: true,
    version: app.getVersion(),
    electron: process.versions.electron || "",
    chrome: process.versions.chrome || "",
    node: process.versions.node || "",
    platform: `${process.platform} ${os.arch()}`,
    githubUrl: PROJECT_GITHUB_URL,
    githubRepo: getGithubRepoSlug(),
    updateSourceConfigured: Boolean(
      getGithubRepoSlug() || process.env.WITHIN_CUBES_UPDATE_URL
    )
  };
});

ipcMain.handle("app:check-updates", async (event) => {
  if (!isMainWindowSender(event)) {
    return { ok: false, error: "主界面未初始化。" };
  }

  const currentVersion = app.getVersion();
  const repoSlug = getGithubRepoSlug();
  const feedUrl = process.env.WITHIN_CUBES_UPDATE_URL || "";

  if (!repoSlug && !feedUrl) {
    return {
      ok: true,
      currentVersion,
      latestVersion: currentVersion,
      hasUpdate: false,
      message: "尚未配置 GitHub 仓库或在线更新源。"
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    let latestVersion = "";
    let releaseUrl = "";
    let notes = "";

    if (repoSlug) {
      const response = await fetchRemoteResource(
        `https://api.github.com/repos/${repoSlug}/releases/latest`,
        {
          cache: "no-store",
          signal: controller.signal,
          headers: {
            "Accept": "application/vnd.github+json",
            "User-Agent": "within-cubes",
            "X-GitHub-Api-Version": "2022-11-28"
          }
        }
      );

      if (response.status === 404) {
        throw new Error(`GitHub 仓库 ${repoSlug} 暂无 Release。`);
      }

      if (!response.ok) {
        throw new Error(`GitHub API 返回 ${response.status}`);
      }

      const payload = await response.json();
      latestVersion = String(
        payload && (payload.tag_name || payload.name) || ""
      ).trim();
      releaseUrl = typeof payload.html_url === "string" ? payload.html_url : "";
      notes = typeof payload.body === "string" ? payload.body.slice(0, 4000) : "";
    } else {
      const response = await fetchRemoteResource(feedUrl, {
        cache: "no-store",
        signal: controller.signal,
        headers: { "Accept": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`更新服务返回 ${response.status}`);
      }

      const payload = await response.json();
      latestVersion = String(
        payload && (payload.version || payload.latestVersion) || ""
      ).trim();
      releaseUrl = typeof payload.url === "string" ? payload.url : "";
      notes = typeof payload.notes === "string" ? payload.notes : "";
    }

    if (!latestVersion) {
      throw new Error("更新信息缺少版本号。");
    }

    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;
    return {
      ok: true,
      currentVersion,
      latestVersion,
      hasUpdate,
      url: releaseUrl,
      notes,
      message: hasUpdate
        ? `发现新版本 v${latestVersion.replace(/^v/i, "")}。`
        : "当前已是最新版本。"
    };
  } catch (error) {
    return {
      ok: false,
      currentVersion,
      error: error.name === "AbortError"
        ? "检查更新超时，请稍后再试。"
        : error.message || "无法检查更新。"
    };
  } finally {
    clearTimeout(timeout);
  }
});

ipcMain.handle("app:open-about-link", async (event, target) => {
  if (!isMainWindowSender(event)) {
    return { ok: false, error: "主界面未初始化。" };
  }

  if (!["github", "feedback"].includes(target)) {
    return { ok: false, error: "未知的链接。" };
  }

  try {
    await shell.openExternal(PROJECT_GITHUB_URL);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message || "无法打开链接。" };
  }
});

ipcMain.handle("shortcuts:get", (event) => {
  if (!isMainWindowSender(event)) {
    return { ok: false, error: "设置页未初始化。" };
  }

  return getShortcutState();
});

ipcMain.handle("shortcuts:set-recording", (event, recording) => {
  if (!isMainWindowSender(event)) {
    return { ok: false, error: "设置页未初始化。" };
  }

  shortcutRecordingSuspended = Boolean(recording);

  if (shortcutRecordingSuspended) {
    globalShortcut.unregisterAll();
  } else {
    registerGlobalShortcutPreferences();
  }

  return getShortcutState();
});

ipcMain.handle("shortcuts:set", async (event, payload) => {
  if (!isMainWindowSender(event)) {
    return { ok: false, error: "设置页未初始化。" };
  }

  const action = payload && payload.action;
  const accelerator = normalizeAccelerator(payload && payload.accelerator);

  if (!SHORTCUT_ACTIONS.some((item) => item.id === action)) {
    return { ok: false, error: "未知的快捷键操作。" };
  }

  if (!accelerator) {
    return {
      ok: false,
      error: "请录制包含 Ctrl、Alt、Shift 或 Win 的组合键。"
    };
  }

  const candidate = { ...shortcutSettings, [action]: accelerator };
  const validation = validateShortcutMap(candidate);

  if (!validation.ok) {
    return validation;
  }

  const previous = { ...shortcutSettings };
  shortcutSettings = validation.shortcuts;
  shortcutRecordingSuspended = false;
  const registrations = registerGlobalShortcutPreferences();

  if (registrations[action] !== true) {
    shortcutSettings = previous;
    registerGlobalShortcutPreferences();
    return {
      ok: false,
      error: "该快捷键无法注册，可能已被其他应用占用。"
    };
  }

  const unresolved = SHORTCUT_ACTIONS.filter(
    (item) => registrations[item.id] !== true
  );
  await persistShortcutPreferences();
  return {
    ...getShortcutState(),
    warning: unresolved.length > 0
      ? `${unresolved.map((item) => item.label).join("、")}的快捷键仍被其他应用占用。`
      : ""
  };
});

ipcMain.handle("shortcuts:reset", async (event) => {
  if (!isMainWindowSender(event)) {
    return { ok: false, error: "设置页未初始化。" };
  }

  shortcutSettings = { ...DEFAULT_SHORTCUTS };
  shortcutRecordingSuspended = false;
  const registrations = registerGlobalShortcutPreferences();
  const unresolved = SHORTCUT_ACTIONS.filter(
    (item) => registrations[item.id] !== true
  );

  await persistShortcutPreferences();

  return {
    ...getShortcutState(),
    warning: unresolved.length > 0
      ? `${unresolved.map((item) => item.label).join("、")}的快捷键被其他应用占用。`
      : ""
  };
});

ipcMain.handle("app:get-paths", () => {
  return {
    ok: true,
    userData: app.getPath("userData"),
    notes: getNotesDir(),
    appPath: app.getAppPath(),
    desktop: getDesktopPath(),
    logs: getLogDir()
  };
});

ipcMain.handle("shell:get-integration", async () => {
  return getShellIntegrationStatus();
});

ipcMain.handle("shell:set-integration", async (event, enabled) => {
  return setShellIntegrationEnabled(Boolean(enabled));
});

ipcMain.handle("app:open-path", async (event, target) => {
  const paths = {
    userData: app.getPath("userData"),
    notes: getNotesDir(),
    appPath: app.getAppPath(),
    desktop: getDesktopPath(),
    logs: getLogDir()
  };

  if (typeof target !== "string" || !Object.prototype.hasOwnProperty.call(paths, target)) {
    return { ok: false, error: "路径类型无效。" };
  }

  try {
    if (target === "userData" || target === "notes") {
      await fs.mkdir(paths[target], { recursive: true });
    }

    const error = await shell.openPath(paths[target]);
    return error ? { ok: false, error } : { ok: true };
  } catch (error) {
    return { ok: false, error: error.message || "无法打开文件夹。" };
  }
});

ipcMain.handle("desktop:scan", async () => {
  try {
    const plan = await scanDesktop(getDesktopPath());
    // 已有归属记录的文件已经出现在分类小组件里，扫描预览只展示未整理文件。
    pendingPlan = applyManualAssignmentsToPlan(
      filterOrganizedFiles(plan, categoryMap)
    );
    recordAchievement("scan", { count: pendingPlan.totalFiles || 0 });
    recordAchievement("desktop-clean-check", {
      count: pendingPlan.totalFiles || 0
    });
    return { ok: true, plan: pendingPlan };
  } catch (error) {
    pendingPlan = null;
    return { ok: false, error: error.message || "无法读取桌面目录。" };
  }
});

ipcMain.handle("desktop:organize", async (event, selectedPaths) => {
  if (!pendingPlan || pendingPlan.totalFiles === 0) {
    return { ok: false, error: "请先扫描桌面，再确认整理。" };
  }

  if (!Array.isArray(selectedPaths) || selectedPaths.length === 0) {
    return { ok: false, error: "请至少勾选一个文件。" };
  }

  const selectedSet = new Set(selectedPaths.filter((item) => typeof item === "string"));
  const categories = pendingPlan.categories
    .map((category) => ({
      ...category,
      files: category.files.filter((file) => selectedSet.has(file.sourcePath))
    }))
    .filter((category) => category.files.length > 0);

  if (categories.length === 0) {
    return { ok: false, error: "所选文件已不在待整理列表中，请重新扫描。" };
  }

  const plan = {
    ...pendingPlan,
    categories,
    skipped: Array.isArray(pendingPlan.skipped) ? pendingPlan.skipped : [],
    totalFiles: categories.reduce((total, category) => total + category.files.length, 0)
  };
  pendingPlan = null;

  try {
    if (!categoryMap) {
      return { ok: false, error: "归属记录尚未初始化。" };
    }

    const runId = createRunId();
    const desktopPath = path.resolve(plan.desktopPath);
    const report = {
      startedAt: new Date().toISOString(),
      finishedAt: null,
      assigned: 0,
      skipped: 0,
      errors: [],
      items: [],
      categories: []
    };
    const categoryCounts = new Map();
    const addItem = (item) => {
      report.items.push({ timestamp: new Date().toISOString(), ...item });
    };

    for (const category of plan.categories) {
      for (const file of category.files) {
        const sourcePath = path.resolve(file.sourcePath);

        if (path.dirname(sourcePath) !== desktopPath) {
          report.skipped += 1;
          addItem({
            status: "skipped",
            name: file.name,
            path: sourcePath,
            category: category.key,
            reason: "文件不在桌面根目录"
          });
          continue;
        }

        let stat;

        try {
          stat = await fs.lstat(sourcePath);
        } catch (error) {
          report.skipped += 1;
          addItem({
            status: "skipped",
            name: file.name,
            path: sourcePath,
            category: category.key,
            reason: error.code === "ENOENT" ? "文件已不存在" : "无法读取文件"
          });
          continue;
        }

        const kind = stat.isDirectory()
          ? "folder"
          : stat.isFile()
            ? "file"
            : null;

        if (!kind) {
          report.skipped += 1;
          addItem({
            status: "skipped",
            name: file.name,
            path: sourcePath,
            category: category.key,
            reason: "不是普通文件或文件夹"
          });
          continue;
        }

        const targetCategory =
          CATEGORY_KEYS.includes(file.assignedCategory)
            ? file.assignedCategory
            : category.key;

        try {
          const result = setAssignment(categoryMap, {
            path: sourcePath,
            name: file.name,
            category: targetCategory,
            kind,
            runId,
            source: "organize",
            at: report.startedAt
          });

          if (!result.changed) {
            report.skipped += 1;
            addItem({
              status: "skipped",
              name: file.name,
              path: sourcePath,
              category: targetCategory,
              reason: "归属未变化"
            });
            continue;
          }

          report.assigned += 1;
          categoryCounts.set(
            targetCategory,
            (categoryCounts.get(targetCategory) || 0) + 1
          );
          addItem({
            status: "assigned",
            name: file.name,
            path: sourcePath,
            category: targetCategory,
            categoryLabel: getCategoryLabel(targetCategory),
            kind
          });
        } catch (error) {
          report.errors.push({
            name: file.name,
            message: error.message || "归属登记失败"
          });
          addItem({
            status: "error",
            name: file.name,
            path: sourcePath,
            category: targetCategory,
            message: error.message || "归属登记失败"
          });
        }
      }
    }

    if (Array.isArray(plan.skipped)) {
      plan.skipped.forEach((item) => {
        if (!item || typeof item.sourcePath !== "string") return;
        report.skipped += 1;
        addItem({
          status: "skipped",
          name: item.name,
          path: item.sourcePath,
          category: null,
          reason: item.reason || "类型不支持，已跳过"
        });
      });
    }

    report.finishedAt = new Date().toISOString();
    report.categories = [...categoryCounts.entries()].map(([key, count]) => ({
      key,
      label: getCategoryLabel(key),
      assigned: count
    }));

    let saveError = null;

    try {
      await persistCategoryMap();
    } catch (error) {
      saveError = error.message || "归属记录保存失败。";
    }

    const logResult = await writeOrganizeLogFor(plan, report);

    let historyError = null;

    try {
      const history = await readHistory();
      history.runs.push(buildRun(plan, report, logResult.logPath, runId));

      if (history.runs.length > MAX_RUNS) {
        history.runs = history.runs.slice(-MAX_RUNS);
      }

      await writeHistory(history);
    } catch (error) {
      historyError = error.message || "历史记录保存失败。";
    }

    try {
      await refreshFloatingData(undefined, { show: report.assigned > 0 });
    } catch (error) {
      // 悬浮窗刷新失败不影响整理结果
    }

    recordAchievement("organize", { count: report.assigned });

    return {
      ok: true,
      report,
      ...logResult,
      saveError,
      historyError
    };
  } catch (error) {
    return { ok: false, error: error.message || "整理失败。" };
  }
});

ipcMain.handle("desktop:undo-status", async () => {
  try {
    const history = await readHistory();
    const run = getLatestActiveRun(history);

    if (!run) {
      return { ok: true, available: false, count: 0, runAt: null };
    }

    const count = Array.isArray(run.items) ? run.items.length : 0;

    return {
      ok: true,
      available: count > 0,
      count,
      runAt: count > 0 ? run.createdAt : null
    };
  } catch (error) {
    return { ok: true, available: false, count: 0, runAt: null };
  }
});

ipcMain.handle("desktop:undo", async () => {
  if (rollbackInProgress) {
    return { ok: false, error: "正在执行回档，请稍候。" };
  }

  rollbackInProgress = true;

  try {
    const history = await readHistory();
    const run = getLatestActiveRun(history);

    if (!run) {
      return { ok: false, error: "没有可撤销的整理记录。" };
    }

    return await executeRollback({
      targetRun: run,
      affectedRuns: [run],
      status: "undone"
    });
  } catch (error) {
    return { ok: false, error: error.message || "撤销失败。" };
  } finally {
    rollbackInProgress = false;
  }
});

ipcMain.handle("history:list", async () => {
  try {
    const history = await readHistory();
    const runs = history.runs
      .slice()
      .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))
      .map((run) => ({
        id: run.id,
        createdAt: run.createdAt,
        itemCount: Array.isArray(run.items) ? run.items.length : 0,
        status: run.status
      }));

    return { ok: true, runs };
  } catch (error) {
    return { ok: false, error: error.message || "无法读取历史记录。" };
  }
});

ipcMain.handle("history:rollback", async (event, runId) => {
  if (rollbackInProgress) {
    return { ok: false, error: "正在执行回档，请稍候。" };
  }

  if (typeof runId !== "string" || runId.length === 0) {
    return { ok: false, error: "回档记录无效。" };
  }

  rollbackInProgress = true;

  try {
    const history = await readHistory();
    const index = history.runs.findIndex((run) => run.id === runId);

    if (index === -1) {
      return { ok: false, error: "找不到该整理记录。" };
    }

    const targetRun = history.runs[index];
    const affectedRuns = history.runs.slice(index);

    return await executeRollback({
      targetRun,
      affectedRuns,
      status: "rolledBack"
    });
  } catch (error) {
    return { ok: false, error: error.message || "回档失败。" };
  } finally {
    rollbackInProgress = false;
  }
});

ipcMain.handle("manual:undo-status", () => getManualStatus());

ipcMain.handle("manual:assign-preview", async (event, sourcePath, toCategory) => {
  return enqueueManualOperation(async () => {
    if (!pendingPlan) {
      return { ok: false, error: "请先扫描桌面，再调整分类归属。" };
    }

    if (!CATEGORY_KEYS.includes(toCategory)) {
      return { ok: false, error: "目标分类无效。" };
    }

    const found = findPendingPlanFile(sourcePath);

    if (!found) {
      return { ok: false, error: "文件已不在待整理列表中，请重新扫描。" };
    }

    const fromCategory = CATEGORY_KEYS.includes(found.file.assignedCategory)
      ? found.file.assignedCategory
      : found.category.key;

    if (fromCategory === toCategory) {
      return { ok: true, changed: false, status: getManualStatus() };
    }

    const result = await applyManualAssignment({
      filePath: found.file.sourcePath,
      name: found.file.name,
      kind: found.file.kind,
      fromCategory,
      toCategory,
      refreshFloating: true
    });

    if (result.changed) {
      found.file.assignedCategory = toCategory;
      found.file.isOrganized = true;
    }

    return result;
  });
});

ipcMain.handle("manual:undo", async () => {
  return enqueueManualOperation(async () => {
    if (!categoryMap) {
      return {
        ok: false,
        error: "分类归属记录尚未初始化。",
        status: getManualStatus()
      };
    }

    const at = new Date();
    const result = undoManualAssignment(categoryMap, { at });

    if (!result.changed) {
      return {
        ok: false,
        error: result.error || "没有可撤销的分类调整。",
        status: getManualStatus()
      };
    }

    let saveError = null;

    try {
      await persistCategoryMap();
    } catch (error) {
      saveError = error.message || "分类归属记录保存失败。";
    }

    const log = await writeAssignLogWithFallback(buildAssignLogEntry({
      action: "undo",
      at,
      path: result.record.path,
      name: result.record.name,
      fromCategory: result.record.toCategory,
      toCategory: result.restoredCategory
    }));

    const planFile = findPendingPlanFile(result.record.path);
    if (planFile) {
      planFile.file.assignedCategory = result.assignedCategory;
    }

    try {
      await refreshFloatingData(undefined, { show: false });

      if (result.assignedCategory) {
        showFloatingWindow(result.assignedCategory);
      }
    } catch (error) {
      // 悬浮窗刷新失败不影响撤销结果
    }

    notifyManualStatusChanged();

    return {
      ok: true,
      changed: true,
      name: result.record.name,
      path: result.record.path,
      assignedCategory: result.assignedCategory,
      fromCategory: result.record.toCategory,
      restoredCategory: result.restoredCategory,
      status: getManualStatus(),
      saveError,
      logPath: log.logPath,
      logError: log.logError
    };
  });
});

ipcMain.handle("floating:assign-dropped-files", async (event, paths) => {
  const categoryKey = getCategoryKeyForWebContents(event.sender);
  const config = categoryKey ? getCategoryConfig(categoryKey) : null;

  if (!categoryKey || !config || config.removed) {
    return { ok: false, error: "分类窗口无效。" };
  }

  if (!categoryMap) {
    return { ok: false, error: "归属记录尚未初始化。" };
  }

  if (!Array.isArray(paths) || paths.length === 0) {
    return { ok: false, error: "没有可登记的文件。" };
  }

  const desktopPath = path.resolve(getDesktopPath());
  const assigned = [];
  const skipped = [];

  for (const rawPath of paths.slice(0, 100)) {
    if (typeof rawPath !== "string" || !rawPath) continue;

    const filePath = path.resolve(rawPath);

    if (path.dirname(filePath) !== desktopPath) {
      skipped.push({ path: filePath, reason: "文件不在桌面根目录" });
      continue;
    }

    let stat;

    try {
      stat = await fs.lstat(filePath);
    } catch (error) {
      skipped.push({ path: filePath, reason: "文件已不存在" });
      continue;
    }

    const kind = stat.isDirectory()
      ? "folder"
      : stat.isFile()
        ? "file"
        : null;

    if (!kind) {
      skipped.push({ path: filePath, reason: "不是普通文件或文件夹" });
      continue;
    }

    const result = setAssignment(categoryMap, {
      path: filePath,
      name: path.basename(filePath),
      category: categoryKey,
      kind,
      runId: null,
      source: "drag",
      at: new Date()
    });

    if (result.changed) {
      assigned.push({ path: filePath, name: path.basename(filePath), kind });
    } else {
      skipped.push({ path: filePath, reason: "归属未变化" });
    }
  }

  let saveError = null;

  if (assigned.length > 0) {
    try {
      await persistCategoryMap();
    } catch (error) {
      saveError = error.message || "归属记录保存失败。";
    }

    try {
      await refreshFloatingData(undefined, { show: false });
    } catch (error) {
      // 悬浮窗刷新失败不影响归属记录
    }
  }

  const result = {
    ok: true,
    changed: assigned.length > 0,
    count: assigned.length,
    assigned,
    skipped,
    saveError,
    error: assigned.length === 0 && skipped.length > 0
      ? skipped[0].reason
      : null
  };

  if (!event.sender.isDestroyed()) {
    event.sender.send("floating:external-drop-result", result);
  }

  return result;
});

function openSystemTarget(target) {
  // explorer.exe 打开 shell: 位置时经常返回非 0 退出码，
  // 这里只启动进程并立即返回，不把退出码当作失败。
  const child = spawn("explorer.exe", [target], {
    detached: true,
    stdio: "ignore"
  });

  child.on("error", () => {});
  child.unref();
}

ipcMain.handle("floating:get-settings", () => getFloatingSettings());

ipcMain.handle("floating:set-collapsed", (event, collapsed) => {
  const categoryKey = getCategoryKeyForWebContents(event.sender);

  if (!categoryKey) {
    return { ok: false, error: "分类无效。" };
  }

  const result = setCategoryWindowCollapsed(categoryKey, Boolean(collapsed));

  if (!result) {
    return { ok: false, error: "小组件尚未初始化。" };
  }

  return { ok: true, collapsed: result.collapsed };
});

ipcMain.handle("floating:set-collapse-mode", async (event, mode) => {
  if (!floatingConfig || !COLLAPSE_MODES.includes(mode)) {
    return { ok: false, error: "折叠方式无效。" };
  }

  floatingConfig.collapseMode = mode;
  await persistFloatingConfig();

  for (const key of CATEGORY_KEYS) {
    if (mode === "hover") {
      collapsedCategories.add(key);
    } else {
      collapsedCategories.delete(key);
    }
  }

  sendDesktopLayerState();
  notifyFloatingSettingsChanged();

  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:set-tint", async (event, tint) => {
  if (!floatingConfig || !TINTS.has(tint)) {
    return { ok: false, error: "颜色设置无效。" };
  }

  floatingConfig.tint = tint;
  await persistFloatingConfig();
  sendAllFloatingUpdates();
  notifyFloatingSettingsChanged();
  recordAchievement("tint-change", { tint });

  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:set-custom-tint", async (event, color) => {
  if (!floatingConfig) {
    return { ok: false, error: "小组件尚未初始化。" };
  }

  if (!/^#[0-9a-f]{6}$/i.test(String(color || "").trim())) {
    return { ok: false, error: "颜色值无效。" };
  }

  const normalized = normalizeCustomTint(color);

  floatingConfig.customTint = normalized;
  floatingConfig.tint = "custom";
  await persistFloatingConfig();
  sendAllFloatingUpdates();
  notifyFloatingSettingsChanged();
  recordAchievement("tint-change", { tint: normalized });

  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:set-frosted", async (event, frosted) => {
  if (!floatingConfig) {
    return { ok: false, error: "小组件尚未初始化。" };
  }

  floatingConfig.frosted = Boolean(frosted);
  await persistFloatingConfig();

  for (const windowMap of [floatingWindows, widgetWindows]) {
    for (const win of windowMap.values()) {
      if (win && !win.isDestroyed()) {
        applyWindowMaterial(win);
      }
    }
  }

  sendAllFloatingUpdates();
  notifyFloatingSettingsChanged();

  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:set-follow-wallpaper", async (event, enabled) => {
  if (!floatingConfig) {
    return { ok: false, error: "设置尚未初始化。" };
  }

  floatingConfig.followWallpaperBrightness = Boolean(enabled);
  await persistFloatingConfig();
  sendDesktopLayerState();
  notifyFloatingSettingsChanged();
  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:set-performance-mode", async (event, enabled) => {
  if (!floatingConfig) {
    return { ok: false, error: "设置尚未初始化。" };
  }

  floatingConfig.performanceMode = Boolean(enabled);
  await persistFloatingConfig();
  sendDesktopLayerState();
  notifyFloatingSettingsChanged();
  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:set-depth3d", async (event, enabled) => {
  if (!floatingConfig) {
    return { ok: false, error: "设置尚未初始化。" };
  }

  floatingConfig.depth3d = Boolean(enabled);
  await persistFloatingConfig();
  sendDesktopLayerState();
  notifyFloatingSettingsChanged();
  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:set-music-visualizer", async (event, enabled) => {
  if (!floatingConfig) {
    return { ok: false, error: "设置尚未初始化。" };
  }

  floatingConfig.musicVisualizer = Boolean(enabled);

  if (floatingConfig.musicVisualizer) {
    getMediaSessionWatcher().start();
  }

  await persistFloatingConfig();
  sendDesktopLayerState();
  notifyFloatingSettingsChanged();
  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:set-smart-theme", async (event, payload) => {
  if (!floatingConfig) {
    return { ok: false, error: "小组件尚未初始化。" };
  }

  floatingConfig.smartTheme = normalizeSmartThemeSettings(payload);
  smartThemeLastSignature = getSmartThemeSignature(getCurrentSmartThemeState());
  await persistFloatingConfig();
  sendDesktopLayerState();
  notifyFloatingSettingsChanged();

  if (floatingConfig.smartTheme.enabled) {
    recordAchievement("smart-theme-applied");
  }

  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:set-ui-background", async (event, payload) => {
  if (!floatingConfig) {
    return { ok: false, error: "小组件尚未初始化。" };
  }

  const source = payload && typeof payload === "object" ? payload : {};
  const current = getUiBackground();
  const next = normalizeUiBackground({
    ...current,
    ...source,
    type: UI_BACKGROUND_TYPES.has(source.type) ? source.type : current.type
  });

  floatingConfig.uiBackground = next;
  await persistFloatingConfig();
  notifyFloatingSettingsChanged();

  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:pick-ui-background", async () => {
  if (!floatingConfig || !mainWindow || mainWindow.isDestroyed()) {
    return { ok: false, error: "主窗口尚未初始化。" };
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    title: "选择主界面背景图片",
    properties: ["openFile"],
    filters: [
      {
        name: "图片",
        extensions: ["png", "jpg", "jpeg", "webp", "bmp", "gif"]
      }
    ]
  });

  if (result.canceled || !result.filePaths[0]) {
    return {
      ok: true,
      canceled: true,
      settings: getFloatingSettings()
    };
  }

  floatingConfig.uiBackground = normalizeUiBackground({
    ...getUiBackground(),
    type: "image",
    imagePath: result.filePaths[0]
  });
  await persistFloatingConfig();
  notifyFloatingSettingsChanged();

  return {
    ok: true,
    canceled: false,
    settings: getFloatingSettings()
  };
});

ipcMain.handle("floating:clear-ui-background", async () => {
  if (!floatingConfig) {
    return { ok: false, error: "小组件尚未初始化。" };
  }

  floatingConfig.uiBackground = normalizeUiBackground({
    ...getUiBackground(),
    type: "solid",
    imagePath: null
  });
  await persistFloatingConfig();
  notifyFloatingSettingsChanged();

  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:set-all-visible", async (event, visible) => {
  if (!floatingConfig) {
    return { ok: false, error: "小组件尚未初始化。" };
  }

  setAllFloatingVisible(Boolean(visible));
  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:set-privacy", async (event, active) => {
  if (!floatingConfig) {
    return { ok: false, error: "小组件尚未初始化。" };
  }

  setPrivacyMode(Boolean(active));
  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:reset-layout", async () => {
  if (!floatingConfig) {
    return { ok: false, error: "小组件尚未初始化。" };
  }

  return resetDesktopLayerLayout();
});

async function closeCategoryWidget(categoryKey) {
  const config = getCategoryConfig(categoryKey);

  if (!config) {
    return { ok: false, error: "分类无效。" };
  }

  dismissedCategoryKeys.add(categoryKey);
  forgetFullscreenCategory(categoryKey);
  pendingFloatingShows.delete(categoryKey);
  clearTimeout(floatingShowTimers.get(categoryKey));
  floatingShowTimers.delete(categoryKey);

  sendDesktopLayerState();
  updateDesktopLayerPointerMode();
  notifyFloatingSettingsChanged();
  return { ok: true, canceled: false, settings: getFloatingSettings() };
}

ipcMain.handle("floating:set-category-removed", async (event, categoryKey, removed) => {
  const config = getCategoryConfig(categoryKey);
  const definition = getCategoryDef(categoryKey);

  if (!config || !definition) {
    return { ok: false, error: "分类无效。" };
  }

  const shouldRemove = Boolean(removed);

  if (shouldRemove) {
    detachCategoryFromTabGroups(categoryKey);

    const assignments = categoryMap
      ? listAssignments(categoryMap).filter((item) => item.category === categoryKey)
      : [];

    if (assignments.length > 0) {
      const parentWindow = BrowserWindow.fromWebContents(event.sender);
      const options = {
        type: "warning",
        title: "删除分类组件",
        message: `删除「${getCategoryDisplayName(categoryKey)}」会同时删除 ${assignments.length} 条归属记录`,
        detail: "文件不会被移动或删除，只会回到「未整理」状态。重新添加该分类后，需要再次整理才会出现在小组件里。",
        buttons: ["删除组件", "取消"],
        defaultId: 1,
        cancelId: 1
      };
      const choice = parentWindow && !parentWindow.isDestroyed()
        ? await dialog.showMessageBox(parentWindow, options)
        : await dialog.showMessageBox(options);

      if (choice.response !== 0) {
        return {
          ok: true,
          canceled: true,
          settings: getFloatingSettings()
        };
      }
    }

    if (categoryMap) {
      removeAssignmentsByCategory(categoryMap, categoryKey);

      try {
        await persistCategoryMap();
      } catch (error) {
        // 归属记录保存失败时仍继续关闭组件，内存状态已更新
      }
    }
  }

  config.removed = shouldRemove;

  if (config.removed) {
    forgetFullscreenCategory(categoryKey);
    pendingFloatingShows.delete(categoryKey);
    clearTimeout(floatingShowTimers.get(categoryKey));
    floatingShowTimers.delete(categoryKey);
  } else {
    dismissedCategoryKeys.delete(categoryKey);
  }

  await persistFloatingConfig();
  sendDesktopLayerState();
  updateDesktopLayerPointerMode();
  notifyFloatingSettingsChanged();

  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:set-widget-locked", async (event, widgetKey, locked) => {
  const config = getWidgetConfig(widgetKey);
  const definition = WIDGET_BY_KEY.get(widgetKey);

  if (!config || !definition) {
    return { ok: false, error: "未知小组件。" };
  }

  config.locked = Boolean(locked);
  await persistFloatingConfig();

  const win = widgetWindows.get(widgetKey);
  if (win && !win.isDestroyed()) {
    if (typeof win.setMovable === "function") {
      win.setMovable(!config.locked);
    }
    if (typeof win.setResizable === "function") {
      win.setResizable(!config.locked);
    }
  }

  sendWidgetUpdate(widgetKey);
  notifyFloatingSettingsChanged();

  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:set-widget-enabled", async (event, widgetKey, enabled) => {
  const config = getWidgetConfig(widgetKey);
  if (!config) {
    return { ok: false, error: "未知小工具。" };
  }

  config.enabled = Boolean(enabled);

  if (config.enabled && widgetKey === "music") {
    getMediaSessionWatcher().start();
  }

  if (widgetKey === "clipboard") {
    if (config.enabled) {
      startClipboardWatcher();
    } else {
      stopClipboardWatcher();
    }
  }

  if (!config.enabled) {
    forgetFullscreenWidget(widgetKey);
  }

  await persistFloatingConfig();
  sendDesktopLayerState();
  updateDesktopLayerPointerMode();
  notifyFloatingSettingsChanged();

  if (config.enabled) {
    recordAchievement("component-enabled", { key: widgetKey });
  }

  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:rename-category", async (event, categoryKey, name) => {
  const config = getCategoryConfig(categoryKey);
  const definition = getCategoryDef(categoryKey);

  if (!config || !definition) {
    return { ok: false, error: "分类无效。" };
  }

  config.name = normalizeName(name);
  await persistFloatingConfig();
  recordAchievement("rename", { key: `category:${categoryKey}` });
  if (allVisibleGridsShareName()) {
    recordAchievement("all-grids-same");
  }

  const win = floatingWindows.get(categoryKey);
  if (win && !win.isDestroyed()) {
    win.setTitle(getCategoryDisplayName(categoryKey));
    sendFloatingUpdate(categoryKey);
  }

  notifyFloatingSettingsChanged();
  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:rename-widget", async (event, widgetKey, name) => {
  const config = getWidgetConfig(widgetKey);
  const definition = WIDGET_BY_KEY.get(widgetKey);

  if (!config || !definition) {
    return { ok: false, error: "未知小工具。" };
  }

  config.name = normalizeName(name);
  await persistFloatingConfig();
  recordAchievement("rename", { key: `widget:${widgetKey}` });

  const win = widgetWindows.get(widgetKey);
  if (win && !win.isDestroyed()) {
    win.setTitle(getWidgetDisplayName(widgetKey));
    sendWidgetUpdate(widgetKey);
  }

  notifyFloatingSettingsChanged();
  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:pick-widget-background", async (event, widgetKey) => {
  const config = getWidgetConfig(widgetKey);
  const definition = WIDGET_BY_KEY.get(widgetKey);

  if (!config || !definition) {
    return { ok: false, error: "未知小工具。" };
  }

  const parentWindow = BrowserWindow.fromWebContents(event.sender);
  const options = {
    title: `为「${getWidgetDisplayName(widgetKey)}」选择背景图片`,
    properties: ["openFile"],
    filters: [
      {
        name: "图片",
        extensions: ["png", "jpg", "jpeg", "webp", "gif", "bmp", "avif"]
      }
    ]
  };

  const picker = parentWindow && !parentWindow.isDestroyed()
    ? dialog.showOpenDialog(parentWindow, options)
    : dialog.showOpenDialog(options);
  const result = await picker.catch(() => null);

  if (!result || result.canceled || !Array.isArray(result.filePaths) || result.filePaths.length === 0) {
    return { ok: true, canceled: true, settings: getFloatingSettings() };
  }

  config.backgroundImage = result.filePaths[0];
  await persistFloatingConfig();
  sendWidgetUpdate(widgetKey);
  notifyFloatingSettingsChanged();
  recordAchievement("custom-background");

  return { ok: true, canceled: false, settings: getFloatingSettings() };
});

ipcMain.handle("floating:clear-widget-background", async (event, widgetKey) => {
  const config = getWidgetConfig(widgetKey);

  if (!config) {
    return { ok: false, error: "未知小工具。" };
  }

  config.backgroundImage = null;
  await persistFloatingConfig();
  sendWidgetUpdate(widgetKey);
  notifyFloatingSettingsChanged();

  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:get-data", (event) => {
  const categoryKey = getCategoryKeyForWebContents(event.sender);
  if (!categoryKey) return { ok: false };

  return getCategoryRendererState(categoryKey);
});

ipcMain.handle("floating:drag-start", (event, filePath) => {
  const categoryKey = getCategoryKeyForWebContents(event.sender);
  if (!categoryKey) {
    return { ok: false, error: "未知分类窗口。" };
  }

  return startFloatingDrag(categoryKey, filePath);
});

ipcMain.handle("floating:drag-end", async (event, options) => {
  const categoryKey = getCategoryKeyForWebContents(event.sender);

  if (
    !categoryKey ||
    !floatingDrag ||
    floatingDrag.sourceCategory !== categoryKey
  ) {
    return { ok: true, changed: false, status: getManualStatus() };
  }

  return finishFloatingDrag({
    canceled: Boolean(options && options.canceled)
  });
});

ipcMain.handle("widget:get-data", (event) => {
  const widgetKey = getWidgetKeyForWebContents(event.sender);
  if (!widgetKey) return { ok: false };

  return getWidgetRendererState(widgetKey);
});

ipcMain.handle("widget:toggle-lock", async (event) => {
  const widgetKey = getWidgetKeyForWebContents(event.sender);
  const config = widgetKey ? getWidgetConfig(widgetKey) : null;

  if (!config) {
    return { ok: false, error: "小工具尚未初始化。" };
  }

  config.locked = !config.locked;
  await persistFloatingConfig();

  const win = widgetWindows.get(widgetKey);
  if (win && !win.isDestroyed()) {
    if (typeof win.setMovable === "function") {
      win.setMovable(!config.locked);
    }
    if (typeof win.setResizable === "function") {
      win.setResizable(!config.locked);
    }
  }

  sendWidgetUpdate(widgetKey);
  notifyFloatingSettingsChanged();

  return { ok: true, state: getWidgetRendererState(widgetKey) };
});

ipcMain.handle("widget:rename", async (event, name) => {
  const widgetKey = getWidgetKeyForWebContents(event.sender);
  const config = widgetKey ? getWidgetConfig(widgetKey) : null;

  if (!config) {
    return { ok: false, error: "小工具尚未初始化。" };
  }

  config.name = normalizeName(name);
  await persistFloatingConfig();

  const win = widgetWindows.get(widgetKey);
  if (win && !win.isDestroyed()) {
    win.setTitle(getWidgetDisplayName(widgetKey));
  }

  sendWidgetUpdate(widgetKey);
  notifyFloatingSettingsChanged();

  return { ok: true, state: getWidgetRendererState(widgetKey) };
});

ipcMain.handle("clock:set-settings", async (event, input) => {
  const config = getWidgetConfig("clock");

  if (!config) {
    return { ok: false, error: "时钟尚未初始化。" };
  }

  const next = normalizeClockSettings({
    timeFormat: input && input.timeFormat !== undefined
      ? input.timeFormat
      : config.timeFormat,
    dateFormat: input && input.dateFormat !== undefined
      ? input.dateFormat
      : config.dateFormat,
    customText: input && input.customText !== undefined
      ? input.customText
      : config.customText
  });

  config.timeFormat = next.timeFormat;
  config.dateFormat = next.dateFormat;
  config.customText = next.customText;

  await persistFloatingConfig();
  sendWidgetUpdate("clock");
  notifyFloatingSettingsChanged();

  return {
    ok: true,
    settings: getFloatingSettings(),
    state: getWidgetRendererState("clock")
  };
});

ipcMain.handle("widget:close", (event) => {
  const widgetKey = getWidgetKeyForWebContents(event.sender);
  if (widgetKey) {
    disableWidgetFromUser(widgetKey);
  }
  return { ok: true };
});

ipcMain.handle("widget:get-music-session", async (event) => {
  const widgetKey = getWidgetKeyForWebContents(event.sender);
  if (widgetKey !== "music") {
    return { ok: false, error: "不是音乐播放器窗口。" };
  }

  return getMediaSessionWatcher().getSnapshot();
});

ipcMain.handle("widget:music-control", async (event, command) => {
  const widgetKey = getWidgetKeyForWebContents(event.sender);
  if (widgetKey !== "music") {
    return {
      ok: false,
      supported: false,
      message: "不是音乐播放器窗口。"
    };
  }

  return getMediaSessionWatcher().control(command);
});

ipcMain.on("widget:ready", (event) => {
  const widgetKey = getWidgetKeyForWebContents(event.sender);
  if (!widgetKey) return;

  if (pendingWidgetShows.has(widgetKey)) {
    pendingWidgetShows.delete(widgetKey);
    clearTimeout(widgetShowTimers.get(widgetKey));
    widgetShowTimers.delete(widgetKey);

    const displayId = getWidgetWindowDisplayId(widgetKey);

    if (isDisplayFullscreen(displayId)) {
      getHiddenEntry(displayId, true).widgets.add(widgetKey);
      return;
    }

    const win = widgetWindows.get(widgetKey);
    if (win && !win.isDestroyed()) {
      win.showInactive();
      moveWindowToBottom(win);
      notifyFloatingSettingsChanged();
    }
  }
});

function shortcutIconCacheKey(filePath) {
  return path.resolve(filePath).toLowerCase();
}

function isValidIconDataUrl(value) {
  return (
    typeof value === "string" &&
    /^data:image\/png;base64,[a-z0-9+/=]+$/i.test(value)
  );
}

async function ensureShortcutIconCacheLoaded() {
  if (shortcutIconDiskCacheLoaded) return;

  if (!shortcutIconDiskCacheLoadPromise) {
    shortcutIconDiskCacheLoadPromise = (async () => {
      try {
        const raw = await fs.readFile(getIconCachePath(), "utf8");
        const data = JSON.parse(raw);
        const entries = data && data.entries && typeof data.entries === "object"
          ? data.entries
          : {};

        for (const [key, entry] of Object.entries(entries)) {
          if (
            !entry ||
            typeof entry !== "object" ||
            !Number.isFinite(Number(entry.mtimeMs)) ||
            !isValidIconDataUrl(entry.dataUrl)
          ) {
            continue;
          }

          shortcutIconDiskCache.set(key, {
            mtimeMs: Number(entry.mtimeMs),
            target: typeof entry.target === "string" ? entry.target : "",
            dataUrl: entry.dataUrl,
            cachedAt: Number(entry.cachedAt) || 0
          });
        }
      } catch (error) {
        // A missing or damaged cache simply starts empty.
      } finally {
        shortcutIconDiskCacheLoaded = true;
      }
    })();
  }

  await shortcutIconDiskCacheLoadPromise;
}

function getCachedShortcutIcon(filePath, mtimeMs) {
  const key = shortcutIconCacheKey(filePath);
  const entry = shortcutIconDiskCache.get(key);

  if (!entry) return null;

  if (Math.abs(entry.mtimeMs - Number(mtimeMs)) > 1) {
    shortcutIconDiskCache.delete(key);
    scheduleShortcutIconCacheSave();
    return null;
  }

  return isValidIconDataUrl(entry.dataUrl) ? entry.dataUrl : null;
}

function setCachedShortcutIcon(filePath, mtimeMs, target, dataUrl) {
  if (!isValidIconDataUrl(dataUrl)) return;

  const key = shortcutIconCacheKey(filePath);
  shortcutIconDiskCache.set(key, {
    mtimeMs: Number(mtimeMs) || 0,
    target: typeof target === "string" ? target : "",
    dataUrl,
    cachedAt: Date.now()
  });

  if (shortcutIconDiskCache.size > SHORTCUT_ICON_CACHE_LIMIT) {
    const oldest = [...shortcutIconDiskCache.entries()]
      .sort((left, right) => (
        (left[1].cachedAt || 0) - (right[1].cachedAt || 0)
      ))
      .slice(0, shortcutIconDiskCache.size - SHORTCUT_ICON_CACHE_LIMIT);

    for (const [oldKey] of oldest) {
      shortcutIconDiskCache.delete(oldKey);
    }
  }

  scheduleShortcutIconCacheSave();
}

function scheduleShortcutIconCacheSave() {
  if (shortcutIconCacheSaveTimer !== null) {
    clearTimeout(shortcutIconCacheSaveTimer);
  }

  shortcutIconCacheSaveTimer = setTimeout(() => {
    shortcutIconCacheSaveTimer = null;
    saveShortcutIconCache().catch((error) => {
      console.warn("[icon-cache] 保存快捷方式图标失败:", error.message || error);
    });
  }, 400);
}

async function saveShortcutIconCache() {
  const entries = {};

  for (const [key, entry] of shortcutIconDiskCache) {
    entries[key] = {
      mtimeMs: entry.mtimeMs,
      target: entry.target,
      dataUrl: entry.dataUrl,
      cachedAt: entry.cachedAt
    };
  }

  const targetPath = getIconCachePath();
  const temporaryPath = `${targetPath}.tmp`;
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(
    temporaryPath,
    JSON.stringify({ version: 1, entries }, null, 2),
    "utf8"
  );
  await fs.rename(temporaryPath, targetPath);
}

function normalizeExtractedIconDataUrl(base64) {
  const value = String(base64 || "").replace(/\s+/g, "");

  if (!value || value.length > 4 * 1024 * 1024) return null;

  let image;

  try {
    image = nativeImage.createFromDataURL(`data:image/png;base64,${value}`);
  } catch (error) {
    return null;
  }

  if (image.isEmpty()) return null;

  const size = image.getSize();
  if (!size.width || !size.height) return null;

  if (size.width !== 128 || size.height !== 128) {
    image = image.resize({ width: 128, height: 128, quality: "best" });
  }

  const dataUrl = image.toDataURL();
  return isValidIconDataUrl(dataUrl) ? dataUrl : null;
}

async function withShortcutIconExtractionSlot(task) {
  if (shortcutIconExtractionCount >= 3) {
    await new Promise((resolve) => {
      shortcutIconExtractionWaiters.push(resolve);
    });
  }

  shortcutIconExtractionCount += 1;

  try {
    return await task();
  } finally {
    shortcutIconExtractionCount = Math.max(0, shortcutIconExtractionCount - 1);
    const next = shortcutIconExtractionWaiters.shift();
    if (next) next();
  }
}

async function extractShortcutIconWithPowerShell(shortcutPath, details) {
  if (process.platform !== "win32") return null;

  const scriptPath = path.join(__dirname, "src", "extract-file-icon.ps1");
  const powershell = getWindowsPowerShellPath();
  const target = details && typeof details.target === "string"
    ? details.target
    : "";
  const iconPath = details && typeof details.icon === "string"
    ? details.icon
    : "";
  const iconIndex = details && Number.isFinite(Number(details.iconIndex))
    ? Math.max(0, Math.round(Number(details.iconIndex)))
    : 0;

  return withShortcutIconExtractionSlot(async () => {
    try {
      const { stdout } = await execFileAsync(
        powershell,
        [
          "-NoProfile",
          "-NonInteractive",
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          scriptPath,
          "-TargetPath",
          target,
          "-IconPath",
          iconPath,
          "-IconIndex",
          String(iconIndex),
          "-ShortcutPath",
          shortcutPath
        ],
        {
          windowsHide: true,
          timeout: 20000,
          maxBuffer: 6 * 1024 * 1024,
          encoding: "utf8"
        }
      );

      return normalizeExtractedIconDataUrl(stdout);
    } catch (error) {
      return null;
    }
  });
}

async function readFileIconDataUrl(filePath) {
  const icon = await app.getFileIcon(filePath, { size: "large" });

  if (icon.isEmpty()) {
    return null;
  }

  // The layer renders at 32px CSS but high-DPI screens need more physical
  // pixels. Keep a NativeImage-backed data URL at 96px for crisp rendering.
  const size = icon.getSize();
  const target = Math.max(96, Number(size.width) || 0);
  const highDpiIcon = target > Math.max(size.width, size.height)
    ? icon.resize({ width: target, height: target, quality: "best" })
    : icon;

  return highDpiIcon.toDataURL() || null;
}

async function resolveFileIconDataUrl(filePath) {
  if (floatingIconCache.has(filePath)) {
    return floatingIconCache.get(filePath);
  }

  const isShortcut =
    process.platform === "win32" &&
    path.extname(filePath).toLowerCase() === ".lnk";

  if (!isShortcut) {
    const dataUrl = await readFileIconDataUrl(filePath);

    if (dataUrl) {
      floatingIconCache.set(filePath, dataUrl);
    }

    return dataUrl;
  }

  await ensureShortcutIconCacheLoaded();

  let stat = null;

  try {
    stat = await fs.stat(filePath);
  } catch (error) {
    stat = null;
  }

  if (stat) {
    const cached = getCachedShortcutIcon(filePath, stat.mtimeMs);

    if (cached) {
      floatingIconCache.set(filePath, cached);
      return cached;
    }
  }

  let details = null;

  try {
    details = shell.readShortcutLink(filePath);
  } catch (error) {
    details = null;
  }

  const target = details && typeof details.target === "string"
    ? details.target
    : "";

  // Electron may return a valid-looking generic file icon for some installers
  // even when the shortcut target has a real embedded icon. Keep the normal
  // lookup as the first result and then let Windows' icon extractor validate
  // and replace it.
  let electronTargetIcon = null;

  if (target) {
    try {
      await fs.access(target);
      electronTargetIcon = await readFileIconDataUrl(target);
    } catch (error) {
      electronTargetIcon = null;
    }
  }

  const extractedIcon = await extractShortcutIconWithPowerShell(
    filePath,
    details
  );
  let dataUrl = extractedIcon || electronTargetIcon;

  if (!dataUrl) {
    try {
      dataUrl = await readFileIconDataUrl(filePath);
    } catch (error) {
      dataUrl = null;
    }
  }

  if (!dataUrl) return null;

  floatingIconCache.set(filePath, dataUrl);

  if (stat) {
    setCachedShortcutIcon(filePath, stat.mtimeMs, target, dataUrl);
  }

  return dataUrl;
}

ipcMain.handle("floating:get-icon", async (event, filePath) => {
  const categoryKey = getCategoryKeyForWebContents(event.sender);
  const file = categoryKey ? findFloatingFile(categoryKey, filePath) : null;

  if (!file || file.iconMode !== "system") {
    return { ok: false, error: "not-system-icon" };
  }

  if (floatingIconCache.has(file.path)) {
    return { ok: true, dataUrl: floatingIconCache.get(file.path) };
  }

  if (!path.isAbsolute(file.path)) {
    console.warn("[floating-icon] 路径不是绝对路径:", file.path);
    return { ok: false, error: "not-absolute" };
  }

  try {
    await fs.access(file.path);
  } catch (error) {
    console.warn("[floating-icon] 文件不存在:", file.path);
    return { ok: false, error: "missing" };
  }

  try {
    const dataUrl = await resolveFileIconDataUrl(file.path);

    if (!dataUrl) {
      console.warn("[floating-icon] NativeImage 为空:", file.path);
      return { ok: false, error: "empty-icon", empty: true };
    }

    return { ok: true, dataUrl };
  } catch (error) {
    console.warn("[floating-icon] getFileIcon 失败:", file.path, error.message);
    return { ok: false, error: error.message, empty: false };
  }
});

ipcMain.handle("floating:open-file", async (event, filePath) => {
  const categoryKey = getCategoryKeyForWebContents(event.sender);
  const file = categoryKey ? findFloatingFile(categoryKey, filePath) : null;

  if (!file) {
    return { ok: false, error: "文件不在当前分类中。" };
  }

  if (file.isSystemIcon) {
    const target = getSystemIconTarget(file.path);

    if (!target) {
      return { ok: false, error: "未知的系统入口。" };
    }

    try {
      openSystemTarget(target);
      return { ok: true, target };
    } catch (error) {
      return { ok: false, error: error.message || "无法打开系统位置。" };
    }
  }

  try {
    const error = await shell.openPath(file.path);
    return error ? { ok: false, error } : { ok: true };
  } catch (error) {
    return { ok: false, error: error.message || "无法打开文件。" };
  }
});

ipcMain.handle("floating:context-menu", (event, filePath) => {
  const categoryKey = getCategoryKeyForWebContents(event.sender);
  const file = categoryKey ? findFloatingFile(categoryKey, filePath) : null;

  if (!file) {
    return { ok: false, error: "文件不在当前分类中。" };
  }

  const win = BrowserWindow.fromWebContents(event.sender);
  const template = [];

  if (file.isSystemIcon) {
    const target = getSystemIconTarget(file.path);

    if (!target) {
      return { ok: false, error: "未知的系统入口。" };
    }

    template.push({
      label: `打开${file.name}`,
      click: () => openSystemTarget(target)
    });
  } else {
    template.push({
      label: "打开所在文件夹",
      click: () => shell.showItemInFolder(file.path)
    });
  }

  const menu = Menu.buildFromTemplate(template);

  menu.popup(win ? { window: win } : {});
  return { ok: true };
});

ipcMain.handle("floating:rename", async (event, name) => {
  const categoryKey = getCategoryKeyForWebContents(event.sender);
  const config = categoryKey ? getCategoryConfig(categoryKey) : null;

  if (!config) {
    return { ok: false, error: "小组件尚未初始化。" };
  }

  config.name = normalizeName(name);
  await persistFloatingConfig();

  const win = floatingWindows.get(categoryKey);
  if (win && !win.isDestroyed()) {
    win.setTitle(getCategoryDisplayName(categoryKey));
  }

  sendFloatingUpdate(categoryKey);
  notifyFloatingSettingsChanged();

  return { ok: true, state: getCategoryRendererState(categoryKey) };
});

ipcMain.handle("floating:reset-grid", async (event) => {
  const categoryKey = getCategoryKeyForWebContents(event.sender);
  const config = categoryKey ? getCategoryConfig(categoryKey) : null;

  if (!config) {
    return { ok: false, error: "小组件尚未初始化。" };
  }

  config.rows = DEFAULT_ROWS;
  config.cols = DEFAULT_COLS;
  await persistFloatingConfig();
  resizeFloatingWindow(categoryKey);

  return { ok: true, state: getCategoryRendererState(categoryKey) };
});

ipcMain.handle("floating:set-category-grid", async (event, categoryKey, rows, cols) => {
  const config = getCategoryConfig(categoryKey);
  const definition = getCategoryDef(categoryKey);

  if (!config || !definition) {
    return { ok: false, error: "分类无效。" };
  }

  const nextRows = Number(rows);
  const nextCols = Number(cols);

  if (!Number.isInteger(nextRows) || nextRows < MIN_ROWS || nextRows > MAX_ROWS) {
    return { ok: false, error: `行数需在 ${MIN_ROWS}–${MAX_ROWS} 之间。` };
  }

  if (!Number.isInteger(nextCols) || nextCols < MIN_COLS || nextCols > MAX_COLS) {
    return { ok: false, error: `列数需在 ${MIN_COLS}–${MAX_COLS} 之间。` };
  }

  config.rows = nextRows;
  config.cols = nextCols;
  await persistFloatingConfig();
  sendDesktopLayerState();
  updateDesktopLayerPointerMode();
  notifyFloatingSettingsChanged();

  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:reset-category-size", async (event, categoryKey) => {
  const config = getCategoryConfig(categoryKey);
  const definition = getCategoryDef(categoryKey);

  if (!config || !definition) {
    return { ok: false, error: "分类无效。" };
  }

  config.rows = DEFAULT_ROWS;
  config.cols = DEFAULT_COLS;
  await persistFloatingConfig();
  sendDesktopLayerState();
  updateDesktopLayerPointerMode();
  notifyFloatingSettingsChanged();

  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:reset-category-position", async (event, categoryKey) => {
  const config = getCategoryConfig(categoryKey);
  const definition = getCategoryDef(categoryKey);

  if (!config || !definition) {
    return { ok: false, error: "分类无效。" };
  }

  const size = computeCategoryWindowSize(config.rows, config.cols);
  const height = collapsedCategories.has(categoryKey)
    ? DRAGBAR_HEIGHT
    : size.height;
  const bounds = getDefaultCategoryBounds(categoryKey, size.width, height);

  config.x = bounds.x;
  config.y = bounds.y;
  await persistFloatingConfig();
  sendDesktopLayerState();
  updateDesktopLayerPointerMode();
  notifyFloatingSettingsChanged();

  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:set-widget-size", async (event, widgetKey, width, height) => {
  const config = getWidgetConfig(widgetKey);
  const definition = WIDGET_BY_KEY.get(widgetKey);

  if (!config || !definition) {
    return { ok: false, error: "未知小组件。" };
  }

  const nextWidth = Number(width);
  const nextHeight = Number(height);

  if (!Number.isFinite(nextWidth) || !Number.isFinite(nextHeight)) {
    return { ok: false, error: "窗口尺寸无效。" };
  }

  const safeWidth = Math.max(
    MIN_WIDGET_WIDTH,
    Math.min(2000, Math.round(nextWidth))
  );
  const safeHeight = Math.max(
    MIN_WIDGET_HEIGHT,
    Math.min(2000, Math.round(nextHeight))
  );

  config.width = safeWidth;
  config.height = safeHeight;
  // Explicit user resize from the widget window: keep it across restarts.
  config.sizeCustomized = true;

  const bounds = getWidgetInitialBounds(widgetKey, safeWidth, safeHeight);
  config.x = bounds.x;
  config.y = bounds.y;

  await persistFloatingConfig();
  sendDesktopLayerState();
  updateDesktopLayerPointerMode();
  notifyFloatingSettingsChanged();

  return {
    ok: true,
    state: getWidgetRendererState(widgetKey),
    settings: getFloatingSettings()
  };
});

ipcMain.handle("floating:reset-widget-size", async (event, widgetKey) => {
  const config = getWidgetConfig(widgetKey);
  const definition = WIDGET_BY_KEY.get(widgetKey);

  if (!config || !definition) {
    return { ok: false, error: "未知小组件。" };
  }

  config.width = definition.defaultWidth;
  config.height = definition.defaultHeight;
  config.sizeCustomized = false;

  const bounds = getWidgetInitialBounds(
    widgetKey,
    definition.defaultWidth,
    definition.defaultHeight
  );
  config.x = bounds.x;
  config.y = bounds.y;

  await persistFloatingConfig();
  sendDesktopLayerState();
  updateDesktopLayerPointerMode();
  notifyFloatingSettingsChanged();

  return {
    ok: true,
    state: getWidgetRendererState(widgetKey),
    settings: getFloatingSettings()
  };
});

ipcMain.handle("floating:reset-widget-position", async (event, widgetKey) => {
  const config = getWidgetConfig(widgetKey);
  const definition = WIDGET_BY_KEY.get(widgetKey);

  if (!config || !definition) {
    return { ok: false, error: "未知小组件。" };
  }

  const bounds = getDefaultWidgetBounds(widgetKey, config.width, config.height);

  config.x = bounds.x;
  config.y = bounds.y;
  await persistFloatingConfig();
  sendDesktopLayerState();
  updateDesktopLayerPointerMode();
  notifyFloatingSettingsChanged();

  return { ok: true, settings: getFloatingSettings() };
});

ipcMain.handle("floating:toggle-lock", async (event) => {
  const categoryKey = getCategoryKeyForWebContents(event.sender);
  const config = categoryKey ? getCategoryConfig(categoryKey) : null;
  const win = categoryKey ? floatingWindows.get(categoryKey) : null;

  if (!config) {
    return { ok: false, error: "小组件尚未初始化。" };
  }

  config.locked = !config.locked;
  await persistFloatingConfig();

  if (win && !win.isDestroyed()) {
    if (typeof win.setMovable === "function") {
      win.setMovable(!config.locked);
    }
    if (typeof win.setResizable === "function") {
      win.setResizable(!config.locked);
    }
  }

  if (config.locked) {
    clearTimeout(floatingResizeTimers.get(categoryKey));
    floatingResizeTimers.delete(categoryKey);
  }

  notifyFloatingSettingsChanged();
  sendFloatingUpdate(categoryKey);
  return { ok: true, state: getCategoryRendererState(categoryKey) };
});

ipcMain.handle("floating:close", async (event) => {
  const categoryKey = getCategoryKeyForWebContents(event.sender);

  if (!categoryKey) {
    return { ok: false, error: "分类无效。" };
  }

  return closeCategoryWidget(categoryKey);
});

ipcMain.handle("theme:get-accent-color", () => {
  try {
    const raw = systemPreferences.getAccentColor();
    const hex = String(raw || "").replace(/^#/, "").slice(0, 6);

    if (!/^[0-9a-f]{6}$/i.test(hex)) return null;

    return `#${hex.toLowerCase()}`;
  } catch (error) {
    return null;
  }
});

ipcMain.handle("app:get-startup-notice", () => {
  const notice = startupNotice;
  startupNotice = null;
  return { ok: true, notice };
});

ipcMain.handle("onboarding:get-status", (event) => {
  if (
    !mainWindow ||
    mainWindow.isDestroyed() ||
    event.sender !== mainWindow.webContents
  ) {
    return { ok: false, error: "请求来源无效。" };
  }

  return {
    ok: true,
    completed: Boolean(onboardingState.completed),
    step: onboardingState.step
  };
});

ipcMain.handle("onboarding:start", (event) => {
  if (
    !mainWindow ||
    mainWindow.isDestroyed() ||
    event.sender !== mainWindow.webContents
  ) {
    return { ok: false, error: "请求来源无效。" };
  }

  return startOnboardingTour({ source: "settings", step: 0 });
});

ipcMain.handle("floating:save-order", async (event, keys) => {
  const categoryKey = getCategoryKeyForWebContents(event.sender);
  const config = categoryKey ? getCategoryConfig(categoryKey) : null;

  if (!config) {
    return { ok: false, error: "小组件尚未初始化。" };
  }

  if (!Array.isArray(keys)) {
    return { ok: false, error: "排序数据无效。" };
  }

  const data = getCategoryData(categoryKey);
  const validKeys = new Set(data.files.map((file) => file.key));
  const orderedKeys = [];
  const seen = new Set();

  for (const key of keys) {
    if (typeof key === "string" && validKeys.has(key) && !seen.has(key)) {
      orderedKeys.push(key);
      seen.add(key);
    }
  }

  for (const file of data.files) {
    if (!seen.has(file.key)) {
      orderedKeys.push(file.key);
      seen.add(file.key);
    }
  }

  config.orderKeys = orderedKeys;
  config.sortMode = "custom";
  await persistFloatingConfig();

  const byKey = new Map(data.files.map((file) => [file.key, file]));
  data.files = orderedKeys.map((key) => byKey.get(key)).filter(Boolean);

  return { ok: true };
});

ipcMain.on("floating:ready", (event) => {
  const categoryKey = getCategoryKeyForWebContents(event.sender);
  if (!categoryKey) return;

  if (pendingFloatingShows.has(categoryKey)) {
    pendingFloatingShows.delete(categoryKey);
    clearTimeout(floatingShowTimers.get(categoryKey));
    floatingShowTimers.delete(categoryKey);

    const displayId = getCategoryWindowDisplayId(categoryKey);

    if (isDisplayFullscreen(displayId)) {
      getHiddenEntry(displayId, true).categories.add(categoryKey);
      return;
    }

    const win = floatingWindows.get(categoryKey);
    if (win && !win.isDestroyed()) {
      win.showInactive();
      moveWindowToBottom(win);
      notifyFloatingSettingsChanged();
    }
  }
});

async function importLegacyManualAssignments() {
  if (!categoryMap) return false;
  if (categoryMap.meta && categoryMap.meta.manualImported) return false;

  let raw = null;

  try {
    raw = JSON.parse(await fs.readFile(getManualCategoriesPath(), "utf8"));
  } catch (error) {
    raw = null;
  }

  const desktopPath = path.resolve(getDesktopPath());
  const assignments = raw && raw.assignments && typeof raw.assignments === "object"
    ? Object.values(raw.assignments)
    : [];
  let changed = false;

  for (const item of assignments) {
    if (
      !item ||
      typeof item.path !== "string" ||
      !CATEGORY_KEYS.includes(item.category)
    ) {
      continue;
    }

    const filePath = path.resolve(item.path);

    if (path.dirname(filePath) !== desktopPath) continue;

    let stat;

    try {
      stat = await fs.lstat(filePath);
    } catch (error) {
      continue;
    }

    const kind = stat.isDirectory()
      ? "folder"
      : stat.isFile()
        ? "file"
        : null;

    if (!kind) continue;

    const result = setAssignment(categoryMap, {
      path: filePath,
      name: path.basename(filePath),
      category: item.category,
      kind,
      runId: null,
      source: "manual",
      at: item.updatedAt || new Date()
    });

    if (result.changed) changed = true;
  }

  categoryMap.meta.manualImported = true;

  try {
    await persistCategoryMap();
  } catch (error) {
    // 导入失败不阻塞启动，下次启动继续尝试
  }

  return changed;
}

async function runLegacyMigrationWithBackup(backupDir) {
  const userDataDir = app.getPath("userData");
  const history = await readHistory();
  const stateFiles = [
    getHistoryPath(),
    getFloatingConfigPath(),
    getManualCategoriesPath(),
    getCategoryMapPath()
  ];

  try {
    const result = await runLegacyMigration({
      desktopPath: getDesktopPath(),
      userDataDir,
      stateFiles,
      categoryMap,
      history,
      backupDir
    });

    if (result.categoryMap) {
      categoryMap = result.categoryMap;
    }

    if (result.status === "done") {
      await persistCategoryMap();
      await writeHistory(history);
      await writeMigrationMarker(userDataDir, {
        version: 1,
        status: "done",
        finishedAt: new Date().toISOString(),
        desktopPath: getDesktopPath(),
        backupDir: result.backup && result.backup.backupDir
          ? result.backup.backupDir
          : backupDir,
        restored: result.report ? result.report.restored : 0,
        errors: result.report ? result.report.errors.length : 0
      });

      await refreshFloatingData(undefined, { show: true });
      await importLegacyManualAssignments();

      const report = result.report || { restored: 0, errors: [], unclassified: [] };
      const detailLines = [
        `备份位置：${result.backup.backupDir}`,
        `移回桌面：${report.restored} 个`,
        `备份校验：${result.backup.verified ? "通过" : "未通过"}`
      ];

      if (report.errors.length > 0) {
        detailLines.push(`失败：${report.errors.length} 个（详见日志目录）`);
      }

      if (Array.isArray(report.unclassified) && report.unclassified.length > 0) {
        detailLines.push(`未能判断分类：${report.unclassified.length} 个`);
      }

      await dialog.showMessageBox(mainWindow, {
        type: report.errors.length > 0 ? "warning" : "info",
        title: "旧整理目录迁移完成",
        message: "旧整理目录中的文件已移回桌面并登记归属。",
        detail: detailLines.join("\n"),
        buttons: ["知道了"]
      });
    } else if (result.status === "not-needed") {
      await importLegacyManualAssignments();
    }

    return result;
  } catch (error) {
    await dialog.showMessageBox(mainWindow, {
      type: "error",
      title: "旧整理目录迁移失败",
      message: "迁移没有继续执行。",
      detail: `${error.message || error}\n\n已尝试备份到：\n${backupDir}\n\n请检查备份目录和桌面文件后再试。`,
      buttons: ["知道了"]
    });

    return { status: "failed", error: error.message || String(error) };
  }
}

async function maybeOfferLegacyMigration() {
  if (!mainWindow || mainWindow.isDestroyed()) return { status: "no-window" };

  const desktopPath = getDesktopPath();
  const info = await inspectLegacyFolder(desktopPath);

  if (!info.exists) {
    await importLegacyManualAssignments();
    return { status: "not-needed" };
  }

  if (info.empty) {
    return runLegacyMigrationWithBackup(
      await resolveBackupDir(app.getPath("userData"))
    );
  }

  const backupDir = await resolveBackupDir(app.getPath("userData"));
  const choice = await dialog.showMessageBox(mainWindow, {
    type: "question",
    title: "旧整理目录迁移",
    message: `检测到「桌面整理」目录中还有 ${info.fileCount} 个文件`,
    detail: [
      "新版本不再移动文件，文件需要回到桌面根目录并登记归属。",
      "",
      "迁移前会完整备份到：",
      backupDir,
      "",
      "备份通过校验后才会移动文件。是否现在迁移？"
    ].join("\n"),
    buttons: ["立即迁移", "稍后"],
    defaultId: 0,
    cancelId: 1,
    noLink: true
  });

  if (choice.response !== 0) {
    return { status: "declined" };
  }

  return runLegacyMigrationWithBackup(backupDir);
}

function beginSessionTracking() {
  let recovered = false;

  try {
    const raw = fsNative.readFileSync(getSessionStatePath(), "utf8");
    const previous = JSON.parse(raw);
    recovered = Boolean(previous && previous.cleanExit === false);
  } catch (error) {
    recovered = false;
  }

  try {
    fsNative.mkdirSync(path.dirname(getSessionStatePath()), { recursive: true });
    fsNative.writeFileSync(
      getSessionStatePath(),
      JSON.stringify({
        cleanExit: false,
        startedAt: new Date().toISOString()
      }, null, 2),
      "utf8"
    );
  } catch (error) {
    // Session tracking is best effort.
  }

  return recovered;
}

function finishSessionTracking() {
  try {
    fsNative.writeFileSync(
      getSessionStatePath(),
      JSON.stringify({
        cleanExit: true,
        finishedAt: new Date().toISOString()
      }, null, 2),
      "utf8"
    );
  } catch (error) {
    // Best effort.
  }
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  loadLocalePreference();
  registerLocaleIpc();
  const recoveredFromCrash = beginSessionTracking();
  // Recover a previous interrupted run before recording this run's baseline.
  recoverDesktopIconsAfterCrash();
  captureNativeDesktopIconsState();
  floatingConfig = await loadFloatingConfig(getFloatingConfigPath());
  onboardingState = await loadOnboardingState();
  await ensureShortcutIconCacheLoaded();

  // Park components on the right first: the category layout below avoids
  // whatever bounds the components occupy, so it has to see the final rails.
  applyInitialWidgetRailLayout();

  if ((Number(floatingConfig.autoLayoutVersion) || 0) < 1) {
    applyInitialCategoryAutoLayout();
  }

  initializeCollapsedCategoriesForMode();
  await persistFloatingConfig();
  widgetData = await loadWidgetData(getWidgetDataPath());
  pomodoroHistory = await loadPomodoroHistory(getPomodoroHistoryPath());
  fileTags = await loadFileTags(getFileTagsPath());
  categoryMappings = await loadCategoryMappings(getCategoryMappingsPath());
  quickAccess = await loadQuickAccess(getQuickAccessPath());
  clipboardHistory = await loadClipboardHistory(getClipboardHistoryPath());
  componentAppearance = await loadComponentAppearance(getComponentAppearancePath());
  categoryMap = await loadCategoryMap(getCategoryMapPath(), {
    desktopPath: getDesktopPath()
  }).catch(() => createEmptyCategoryMap(getDesktopPath()));
  nativeMaterialAvailable = detectNativeMaterialAvailable();

  await initializeAchievements();
  await loadShortcutPreferences();
  const startupRegistrations = registerGlobalShortcutPreferences();
  const startupShortcutFailures = SHORTCUT_ACTIONS.filter(
    (action) => startupRegistrations[action.id] !== true
  );

  if (startupShortcutFailures.length > 0) {
    console.warn(
      "[shortcuts] 部分快捷键注册失败:",
      startupShortcutFailures.map((action) => action.label).join("、")
    );
  }
  startShortcutFullscreenWatcher();

  for (const definition of WIDGET_DEFS) {
    const widgetConfig = getWidgetConfig(definition.key);
    if (widgetConfig && widgetConfig.enabled) {
      recordAchievement("component-enabled", { key: definition.key });
    }
  }

  try {
    await fs.mkdir(getNotesDir(), { recursive: true });
  } catch (error) {
    // 随手记首次保存时会再次尝试创建目录
  }

  try {
    await pruneMissingWidgetBackgrounds();
  } catch (error) {
    // 背景图片失效清理失败时保留配置，窗口加载时会自行回退
  }

  try {
    await refreshFloatingData(undefined, { show: true });
  } catch (error) {
    // 启动扫描失败时保持空数据
  }

  createWindow();
  createTray();
  initializeWidgets();
  createDesktopLayerWindow();
  if (recoveredFromCrash) {
    startupNotice = "检测到上次异常退出，已恢复最近保存的桌面布局。";
    setTimeout(() => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      dialog.showMessageBox(mainWindow, {
        type: "info",
        title: "布局已恢复",
        message: "检测到上次异常退出，已自动恢复最近保存的桌面布局。",
        buttons: ["知道了"]
      }).catch(() => {});
    }, 900);
  }
  screen.on("display-added", scheduleDisplayTopologyCheck);
  screen.on("display-removed", scheduleDisplayTopologyCheck);
  screen.on("display-metrics-changed", scheduleDisplayTopologyCheck);
  startDesktopLayerWatchdog();
  startDesktopWatcher();
  startSmartThemeWatcher();

  setTimeout(() => {
    maybeStartInitialOnboarding().catch((error) => {
      console.warn("[onboarding] 无法启动新手引导:", error.message || error);
    });
  }, 1400);

  if (clipboardNotePending) {
    clipboardNotePending = false;
    setTimeout(() => {
      saveClipboardAsNote().catch(() => {});
    }, 1200);
  }

  setTimeout(() => {
    maybeOfferLegacyMigration().catch((error) => {
      console.warn("[migration] 旧整理目录检查失败:", error.message);
    });
  }, 900);

  nativeTheme.on("updated", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setBackgroundColor(
        nativeTheme.shouldUseDarkColors ? "#202020" : "#f3f3f3"
      );
    }
  });

  app.on("activate", () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  if (quitCleanupStarted) return;
  quitCleanupStarted = true;
  isQuitting = true;

  finishSessionTracking();
  releaseEmbeddedWindowFocus();
  stopShortcutFullscreenWatcher();
  stopPrivacyShortcutFallback();
  stopShortcutRetry();
  globalShortcut.unregisterAll();

  // Always hand the native desktop icons back to Explorer on a graceful exit.
  restoreNativeDesktopIcons();
  stopDesktopWatcher();
  stopSmartThemeWatcher();

  if (mediaSessionWatcher) {
    mediaSessionWatcher.dispose();
    mediaSessionWatcher = null;
  }

  stopClipboardWatcher();

  for (const timer of floatingShowTimers.values()) clearTimeout(timer);
  for (const timer of floatingMoveTimers.values()) clearTimeout(timer);

  if (guideHideTimer) {
    clearTimeout(guideHideTimer);
    guideHideTimer = null;
  }

  for (const timer of snapReleaseTimers.values()) clearTimeout(timer);
  snapReleaseTimers.clear();

  if (floatingDragTimer) {
    clearInterval(floatingDragTimer);
    floatingDragTimer = null;
  }

  if (fullscreenPollTimer) {
    clearInterval(fullscreenPollTimer);
    fullscreenPollTimer = null;
  }

  desktopLayerInteractionActive = false;
  desktopLayerInteractionStartedAt = 0;
  stopDesktopLayerMaintenance();

  for (const timer of fullscreenRestoreTimers.values()) {
    clearTimeout(timer);
  }
  fullscreenRestoreTimers.clear();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
