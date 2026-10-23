"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopOrganizer", {
  scan: () => ipcRenderer.invoke("desktop:scan"),
  organize: (selectedPaths) => ipcRenderer.invoke("desktop:organize", selectedPaths),
  getUndoStatus: () => ipcRenderer.invoke("desktop:undo-status"),
  undo: () => ipcRenderer.invoke("desktop:undo"),
  getHistory: () => ipcRenderer.invoke("history:list"),
  rollbackHistory: (runId) => ipcRenderer.invoke("history:rollback", runId),
  getManualUndoStatus: () => ipcRenderer.invoke("manual:undo-status"),
  undoManualCategory: () => ipcRenderer.invoke("manual:undo"),
  assignPreviewCategory: (sourcePath, category) =>
    ipcRenderer.invoke("manual:assign-preview", sourcePath, category),
  onManualStatusChanged: (callback) => {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on("manual:status-changed", listener);
    return () => ipcRenderer.removeListener("manual:status-changed", listener);
  },
  getFloatingSettings: () => ipcRenderer.invoke("floating:get-settings"),
  setFloatingTint: (tint) => ipcRenderer.invoke("floating:set-tint", tint),
  setFloatingCustomTint: (color) => ipcRenderer.invoke("floating:set-custom-tint", color),
  setFloatingFrosted: (frosted) => ipcRenderer.invoke("floating:set-frosted", frosted),
  setFloatingSmartTheme: (payload) =>
    ipcRenderer.invoke("floating:set-smart-theme", payload),
  setFollowWallpaperBrightness: (enabled) =>
    ipcRenderer.invoke("floating:set-follow-wallpaper", enabled),
  setPerformanceMode: (enabled) =>
    ipcRenderer.invoke("floating:set-performance-mode", enabled),
  setDepth3d: (enabled) =>
    ipcRenderer.invoke("floating:set-depth3d", enabled),
  setMusicVisualizer: (enabled) =>
    ipcRenderer.invoke("floating:set-music-visualizer", enabled),
  getPomodoroHeatmap: (range) =>
    ipcRenderer.invoke("pomodoro:get-heatmap", range),
  setUiBackground: (payload) =>
    ipcRenderer.invoke("floating:set-ui-background", payload),
  pickUiBackground: () =>
    ipcRenderer.invoke("floating:pick-ui-background"),
  clearUiBackground: () =>
    ipcRenderer.invoke("floating:clear-ui-background"),
  setFloatingCollapseMode: (mode) =>
    ipcRenderer.invoke("floating:set-collapse-mode", mode),
  setAllFloatingVisible: (visible) => ipcRenderer.invoke("floating:set-all-visible", visible),
  setPrivacyMode: (enabled) => ipcRenderer.invoke("floating:set-privacy", Boolean(enabled)),
  setFloatingCategoryRemoved: (categoryKey, removed) =>
    ipcRenderer.invoke("floating:set-category-removed", categoryKey, removed),
  setFloatingCategoryGrid: (categoryKey, rows, cols) =>
    ipcRenderer.invoke("floating:set-category-grid", categoryKey, rows, cols),
  resetFloatingCategorySize: (categoryKey) =>
    ipcRenderer.invoke("floating:reset-category-size", categoryKey),
  resetFloatingCategoryPosition: (categoryKey) =>
    ipcRenderer.invoke("floating:reset-category-position", categoryKey),
  setFloatingWidgetSize: (widgetKey, width, height) =>
    ipcRenderer.invoke("floating:set-widget-size", widgetKey, width, height),
  resetFloatingWidgetSize: (widgetKey) =>
    ipcRenderer.invoke("floating:reset-widget-size", widgetKey),
  resetFloatingWidgetPosition: (widgetKey) =>
    ipcRenderer.invoke("floating:reset-widget-position", widgetKey),
  resetDesktopLayout: () => ipcRenderer.invoke("floating:reset-layout"),
  exportLayout: () => ipcRenderer.invoke("layout:export"),
  importLayout: () => ipcRenderer.invoke("layout:import"),
  importIconPack: () => ipcRenderer.invoke("icons:import-pack"),
  resetAllData: () => ipcRenderer.invoke("app:reset-all-data"),
  setFloatingWidgetEnabled: (widgetKey, enabled) =>
    ipcRenderer.invoke("floating:set-widget-enabled", widgetKey, enabled),
  setFloatingWidgetLocked: (widgetKey, locked) =>
    ipcRenderer.invoke("floating:set-widget-locked", widgetKey, locked),
  setClockSettings: (settings) => ipcRenderer.invoke("clock:set-settings", settings),
  renameFloatingCategory: (categoryKey, name) =>
    ipcRenderer.invoke("floating:rename-category", categoryKey, name),
  renameFloatingWidget: (widgetKey, name) =>
    ipcRenderer.invoke("floating:rename-widget", widgetKey, name),
  pickFloatingWidgetBackground: (widgetKey) =>
    ipcRenderer.invoke("floating:pick-widget-background", widgetKey),
  clearFloatingWidgetBackground: (widgetKey) =>
    ipcRenderer.invoke("floating:clear-widget-background", widgetKey),
  setFloatingWidgetBingBackground: (widgetKey, refresh) =>
    ipcRenderer.invoke("floating:set-bing-background", widgetKey, Boolean(refresh)),
  onFloatingSettingsChanged: (callback) => {
    const listener = (_event, settings) => callback(settings);
    ipcRenderer.on("floating:settings-changed", listener);
    return () => ipcRenderer.removeListener("floating:settings-changed", listener);
  },
  onTogglePrivacy: (callback) => {
    const listener = (_event, payload) => callback(payload || {});
    ipcRenderer.on("toggle-privacy", listener);
    return () => ipcRenderer.removeListener("toggle-privacy", listener);
  },
  getAppPaths: () => ipcRenderer.invoke("app:get-paths"),
  openAppPath: (target) => ipcRenderer.invoke("app:open-path", target),
  getNeteaseInstallInfo: () =>
    ipcRenderer.invoke("app:get-netease-install-info"),
  openNeteaseInstallDir: () =>
    ipcRenderer.invoke("app:open-netease-install-dir"),
  openMusicAdapterLink: (kind) =>
    ipcRenderer.invoke("app:open-music-adapter-link", kind),
  listNotes: () => ipcRenderer.invoke("notes:list"),
  copyNote: (id) => ipcRenderer.invoke("notes:copy", id),
  updateNote: (id, text) => ipcRenderer.invoke("notes:update", { id, text }),
  renameNote: (id, title) => ipcRenderer.invoke("notes:rename", { id, title }),
  deleteNote: (id) => ipcRenderer.invoke("notes:delete", id),
  revealNote: (filePath) => ipcRenderer.invoke("notes:reveal", filePath),
  openNotesFolder: () => ipcRenderer.invoke("notes:open-folder"),
  saveClipboardNote: () => ipcRenderer.invoke("notes:save-clipboard"),
  getShellIntegration: () => ipcRenderer.invoke("shell:get-integration"),
  setShellIntegration: (enabled) =>
    ipcRenderer.invoke("shell:set-integration", Boolean(enabled)),
  onTrayQuickOrganize: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("ui:tray-quick-organize", listener);
    return () => ipcRenderer.removeListener("ui:tray-quick-organize", listener);
  },
  onFocusSearch: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("ui:focus-search", listener);
    return () => ipcRenderer.removeListener("ui:focus-search", listener);
  },
  onNotesChanged: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("notes:changed", listener);
    return () => ipcRenderer.removeListener("notes:changed", listener);
  },
  onShowNotesHistory: (callback) => {
    const listener = (_event, payload) => callback(payload || {});
    ipcRenderer.on("notes:show-history", listener);
    return () => ipcRenderer.removeListener("notes:show-history", listener);
  },
  onOpenComponentSettings: (callback) => {
    const listener = (_event, payload) => callback(payload || {});
    ipcRenderer.on("ui:open-component-settings", listener);
    return () => ipcRenderer.removeListener("ui:open-component-settings", listener);
  },
  getAccentColor: () => ipcRenderer.invoke("theme:get-accent-color"),
  getAchievements: () => ipcRenderer.invoke("achievements:get"),
  recordAchievementEvent: (type, payload) =>
    ipcRenderer.invoke("achievements:record", type, payload),
  getAboutInfo: () => ipcRenderer.invoke("app:get-about-info"),
  checkForUpdates: () => ipcRenderer.invoke("app:check-updates"),
  openAboutLink: (target) => ipcRenderer.invoke("app:open-about-link", target),
  getShortcuts: () => ipcRenderer.invoke("shortcuts:get"),
  setShortcutRecording: (recording) =>
    ipcRenderer.invoke("shortcuts:set-recording", Boolean(recording)),
  setShortcut: (action, accelerator) =>
    ipcRenderer.invoke("shortcuts:set", { action, accelerator }),
  resetShortcuts: () => ipcRenderer.invoke("shortcuts:reset"),
  onAchievementsChanged: (callback) => {
    const listener = (_event, payload) => callback(payload || {});
    ipcRenderer.on("achievements:changed", listener);
    return () => ipcRenderer.removeListener("achievements:changed", listener);
  },
  onShowHome: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("ui:show-home", listener);
    return () => ipcRenderer.removeListener("ui:show-home", listener);
  },
  getStartupNotice: () => ipcRenderer.invoke("app:get-startup-notice"),
  startOnboarding: () => ipcRenderer.invoke("onboarding:start"),
  getOnboardingStatus: () => ipcRenderer.invoke("onboarding:get-status"),
  setLocalePreference: (preference) =>
    ipcRenderer.send("i18n:set-locale", String(preference || "")),
  getLocaleInfo: () => ipcRenderer.invoke("i18n:get-locale"),
  openExternal: (url) => ipcRenderer.invoke("app:open-external", url),
  // ---- 待办管理页 ----
  listTodos: () => ipcRenderer.invoke("app:list-todos"),
  addTodo: (payload) => ipcRenderer.invoke("app:add-todo", payload),
  toggleTodo: (id, done) => ipcRenderer.invoke("app:toggle-todo", { id, done }),
  updateTodo: (payload) => ipcRenderer.invoke("app:update-todo", payload),
  deleteTodo: (id) => ipcRenderer.invoke("app:delete-todo", id),
  exportTodosCsv: (ids) => ipcRenderer.invoke("app:export-todos-csv", ids),
  importTodosCsv: () => ipcRenderer.invoke("app:import-todos-csv"),
  onTodosChanged: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("app:todos-changed", listener);
    return () => ipcRenderer.removeListener("app:todos-changed", listener);
  },
  onOpenTodoManager: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("app:open-todo-manager", listener);
    return () => ipcRenderer.removeListener("app:open-todo-manager", listener);
  }
});
