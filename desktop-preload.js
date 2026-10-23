"use strict";

const { contextBridge, ipcRenderer, webUtils } = require("electron");

let externalDropHandler = null;

contextBridge.exposeInMainWorld("desktopLayer", {
  getState: () => ipcRenderer.invoke("desktop-layer:get-state"),
  getIconPack: () => ipcRenderer.invoke("icons:get-pack"),
  // 全屏层没有自己的语言设置入口，语言偏好由主进程统一下发。
  getLocaleInfo: () => ipcRenderer.invoke("i18n:get-locale"),
  onLocaleChanged: (callback) => {
    const listener = (_event, payload) => callback(payload || {});
    ipcRenderer.on("i18n:locale-changed", listener);
    return () => ipcRenderer.removeListener("i18n:locale-changed", listener);
  },
  onIconPackChanged: (callback) => {
    const listener = (_event, pack) => callback(pack);
    ipcRenderer.on("desktop-layer:icon-pack", listener);
    return () => ipcRenderer.removeListener("desktop-layer:icon-pack", listener);
  },
  onState: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on("desktop-layer:state", listener);
    return () => ipcRenderer.removeListener("desktop-layer:state", listener);
  },
  onFilesChanged: (callback) => {
    const listener = (_event, payload) => callback(payload || {});
    ipcRenderer.on("desktop-layer:files-changed", listener);
    return () => ipcRenderer.removeListener("desktop-layer:files-changed", listener);
  },
  setMousePassthrough: (ignore) => {
    ipcRenderer.send("desktop-layer:mouse-passthrough", Boolean(ignore));
  },
  setDesktopIconRects: (rects) => {
    ipcRenderer.send("desktop-layer:desktop-icon-rects", rects);
  },
  debugHitTest: (point) =>
    ipcRenderer.invoke("desktop-layer:debug-hit-test", point),
  setInteractionActive: (active) => {
    ipcRenderer.send("desktop-layer:interaction-active", Boolean(active));
  },
  setFocusMode: (active) => {
    ipcRenderer.send("desktop-layer:focus-mode", Boolean(active));
  },
  setMenuOpen: (open) => {
    ipcRenderer.send("desktop-layer:menu-open", Boolean(open));
  },
  setPosition: (kind, key, x, y) =>
    ipcRenderer.invoke("desktop-layer:set-position", { kind, key, x, y }),
  resizeComponent: (kind, key, width, height, x, y) =>
    ipcRenderer.invoke("desktop-layer:resize", { kind, key, width, height, x, y }),
  focusInput: () => ipcRenderer.invoke("desktop-layer:focus-input"),
  releaseInput: () => ipcRenderer.send("desktop-layer:release-input"),
  setCategoryCollapsed: (categoryKey, collapsed) =>
    ipcRenderer.invoke("desktop-layer:set-collapsed", categoryKey, Boolean(collapsed)),
  toggleCategoryLock: (categoryKey) =>
    ipcRenderer.invoke("desktop-layer:toggle-lock", categoryKey),
  resetCategoryGrid: (categoryKey) =>
    ipcRenderer.invoke("desktop-layer:reset-grid", categoryKey),
  closeCategory: (categoryKey) =>
    ipcRenderer.invoke("desktop-layer:close-category", categoryKey),
  toggleWidgetLock: (widgetKey) =>
    ipcRenderer.invoke("desktop-layer:toggle-widget-lock", widgetKey),
  closeWidget: (widgetKey) =>
    ipcRenderer.invoke("desktop-layer:close-widget", widgetKey),
  openComponentSettings: (kind, key) =>
    ipcRenderer.invoke("desktop-layer:open-component-settings", { kind, key }),
  renameCategory: (categoryKey, name) =>
    ipcRenderer.invoke("desktop-layer:rename-category", categoryKey, name),
  mergeCategories: (sourceKey, targetKey) =>
    ipcRenderer.invoke("desktop-layer:merge-categories", {
      sourceKey,
      targetKey
    }),
  splitGroup: (groupId) =>
    ipcRenderer.invoke("desktop-layer:split-group", groupId),
  setGroupActive: (groupId, categoryKey) =>
    ipcRenderer.invoke("desktop-layer:set-group-active", {
      groupId,
      categoryKey
    }),
  toggleGroupLock: (groupId) =>
    ipcRenderer.invoke("desktop-layer:toggle-group-lock", groupId),
  recordGroupFiles: (groupId, items) =>
    ipcRenderer.invoke("desktop-layer:record-group-files", { groupId, items }),
  analyzePomodoroDrop: (paths) =>
    ipcRenderer.invoke("desktop-layer:analyze-pomodoro-drop", { paths }),
  recordPomodoroSession: (payload) =>
    ipcRenderer.invoke("desktop-layer:record-pomodoro-session", payload),
  ingestDroppedFiles: (target, paths) =>
    ipcRenderer.invoke("desktop-layer:ingest-dropped-files", { target, paths }),
  searchFiles: (query) =>
    ipcRenderer.invoke("desktop-layer:search-files", query),
  importCalendarTodos: () =>
    ipcRenderer.invoke("desktop-layer:import-calendar-todos"),
  exportOpenTodos: () =>
    ipcRenderer.invoke("desktop-layer:export-open-todos"),
  saveCategoryOrder: (categoryKey, keys) =>
    ipcRenderer.invoke("desktop-layer:save-order", { categoryKey, keys }),
  moveCategoryFile: (fromCategory, toCategory, filePath) =>
    ipcRenderer.invoke("desktop-layer:move-file", {
      fromCategory,
      toCategory,
      filePath
    }),
  setCategorySort: (categoryKey, mode) =>
    ipcRenderer.invoke("desktop-layer:set-sort", {
      categoryKey,
      mode
    }),
  openFile: (categoryKey, filePath) =>
    ipcRenderer.invoke("desktop-layer:open-file", { categoryKey, filePath }),
  openWith: (categoryKey, filePath) =>
    ipcRenderer.invoke("desktop-layer:open-with", { categoryKey, filePath }),
  openFolderWindow: (categoryKey, filePath) =>
    ipcRenderer.invoke("desktop-layer:open-folder-window", { categoryKey, filePath }),
  pinQuickAccess: (categoryKey, filePath) =>
    ipcRenderer.invoke("desktop-layer:pin-quick-access", { categoryKey, filePath }),
  runAsAdministrator: (categoryKey, filePath) =>
    ipcRenderer.invoke("desktop-layer:run-as-admin", { categoryKey, filePath }),
  showFileProperties: (categoryKey, filePath) =>
    ipcRenderer.invoke("desktop-layer:show-properties", { categoryKey, filePath }),
  copyFilePathsText: (paths) =>
    ipcRenderer.invoke("desktop-layer:copy-file-paths", paths),
  setFileClipboard: (paths, operation) =>
    ipcRenderer.invoke("desktop-layer:set-file-clipboard", { paths, operation }),
  renameFile: (categoryKey, filePath, name) =>
    ipcRenderer.invoke("desktop-layer:rename-file", {
      categoryKey,
      filePath,
      name
    }),
  trashFiles: (paths) =>
    ipcRenderer.invoke("desktop-layer:trash-files", paths),
  pasteFiles: (categoryKey) =>
    ipcRenderer.invoke("desktop-layer:paste-files", categoryKey),
  moveFilesIntoFolder: (folderPath, paths) =>
    ipcRenderer.invoke("desktop-layer:move-files-into-folder", {
      folderPath,
      paths
    }),
  startFileDrag: (paths, iconDataUrl) =>
    ipcRenderer.send("desktop-layer:start-file-drag", {
      paths,
      iconDataUrl
    }),
  getSystemIcon: (categoryKey, filePath) =>
    ipcRenderer.invoke("desktop-layer:get-icon", { categoryKey, filePath }),
  refreshCategory: (categoryKey) =>
    ipcRenderer.invoke("desktop-layer:refresh-category", categoryKey),
  clearCategoryRecords: (categoryKey) =>
    ipcRenderer.invoke("desktop-layer:clear-category-records", categoryKey),
  mapCategoryFolder: (categoryKey) =>
    ipcRenderer.invoke("desktop-layer:map-category-folder", categoryKey),
  unmapCategoryFolder: (categoryKey) =>
    ipcRenderer.invoke("desktop-layer:unmap-category-folder", categoryKey),
  setComponentAccent: (kind, key, color) =>
    ipcRenderer.invoke("desktop-layer:set-accent", { kind, key, color }),
  setClockText: (text) =>
    ipcRenderer.invoke("desktop-layer:set-clock-text", text),
  clearCompletedTodos: () =>
    ipcRenderer.invoke("desktop-layer:clear-completed-todos"),
  pickWidgetBackground: (widgetKey) =>
    ipcRenderer.invoke("desktop-layer:pick-widget-background", widgetKey),
  clearWidgetBackground: (widgetKey) =>
    ipcRenderer.invoke("desktop-layer:clear-widget-background", widgetKey),
  setBingBackground: (widgetKey, refresh) =>
    ipcRenderer.invoke("desktop-layer:set-bing-background", { widgetKey, refresh: Boolean(refresh) }),
  revealFile: (categoryKey, filePath) =>
    ipcRenderer.invoke("desktop-layer:reveal-file", { categoryKey, filePath }),
  setFileColorTag: (categoryKey, filePath, color) =>
    ipcRenderer.invoke("desktop-layer:set-file-tag", { categoryKey, filePath, color }),
  openQuickFile: (filePath) =>
    ipcRenderer.invoke("desktop-layer:open-quick-file", filePath),
  addQuickFiles: (paths) =>
    ipcRenderer.invoke("desktop-layer:add-quick-files", paths),
  removeQuickFile: (filePath) =>
    ipcRenderer.invoke("desktop-layer:remove-quick-file", filePath),
  clearQuickFiles: () => ipcRenderer.invoke("desktop-layer:clear-quick-files"),
  getNoteEntries: (limit) =>
    ipcRenderer.invoke("desktop-layer:get-note-entries", limit),
  copyNoteEntry: (id) =>
    ipcRenderer.invoke("notes:copy", id),
  recordAchievementEvent: (type, payload) =>
    ipcRenderer.invoke("achievements:record", type, payload),
  onAchievementUnlocked: (callback) => {
    const listener = (_event, payload) => callback(payload || {});
    ipcRenderer.on("achievement:unlocked", listener);
    return () => ipcRenderer.removeListener("achievement:unlocked", listener);
  },
  onShortcutFocus: (callback) => {
    const listener = (_event, active) => callback(Boolean(active));
    ipcRenderer.on("desktop-layer:shortcut-focus", listener);
    return () => ipcRenderer.removeListener("desktop-layer:shortcut-focus", listener);
  },
  onPrivacy: (callback) => {
    const listener = (_event, payload) => callback(payload || {});
    ipcRenderer.on("desktop-layer:privacy", listener);
    return () => ipcRenderer.removeListener("desktop-layer:privacy", listener);
  },
  onTogglePrivacy: (callback) => {
    const listener = (_event, payload) => callback(payload || {});
    ipcRenderer.on("toggle-privacy", listener);
    return () => ipcRenderer.removeListener("toggle-privacy", listener);
  },
  updateNoteEntry: (id, text) =>
    ipcRenderer.invoke("notes:update", { id, text }),
  renameNoteEntry: (id, title) =>
    ipcRenderer.invoke("notes:rename", { id, title }),
  saveNoteEntry: (text) =>
    ipcRenderer.invoke("desktop-layer:save-note", text),
  openNotesHistory: () =>
    ipcRenderer.invoke("desktop-layer:open-notes-history"),
  copyClipboardEntry: (id) =>
    ipcRenderer.invoke("desktop-layer:copy-clipboard-entry", id),
  deleteClipboardEntry: (id) =>
    ipcRenderer.invoke("desktop-layer:delete-clipboard-entry", id),
  getWidgetData: () => ipcRenderer.invoke("desktop-layer:get-widget-data"),
  saveNotes: (text) => ipcRenderer.invoke("desktop-layer:save-notes", text),
  // 传字符串或 { text, dueDate, dueTime } 都可以，主进程两种都兼容。
  addTodo: (payload) => ipcRenderer.invoke("desktop-layer:add-todo", payload),
  toggleTodo: (id, done) =>
    ipcRenderer.invoke("desktop-layer:toggle-todo", { id, done }),
  setTodoDueDate: (id, dueDate) =>
    ipcRenderer.invoke("desktop-layer:set-todo-due-date", { id, dueDate }),
  deleteTodo: (id) => ipcRenderer.invoke("desktop-layer:delete-todo", id),
  openTodoManager: () => ipcRenderer.invoke("desktop-layer:open-todo-manager"),
  onTodosChanged: (callback) => {
    const listener = (_event, payload) => callback(payload || {});
    ipcRenderer.on("desktop-layer:todos-changed", listener);
    return () => ipcRenderer.removeListener("desktop-layer:todos-changed", listener);
  },
  getMusicSession: () => ipcRenderer.invoke("desktop-layer:get-music-session"),
  controlMusic: (command) =>
    ipcRenderer.invoke("desktop-layer:music-control", command),
  onMusicUpdate: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("desktop-layer:music-update", listener);
    return () => ipcRenderer.removeListener("desktop-layer:music-update", listener);
  },
  onOnboardingStart: (callback) => {
    const listener = (_event, payload) => callback(payload || {});
    ipcRenderer.on("onboarding:start", listener);
    return () => ipcRenderer.removeListener("onboarding:start", listener);
  },
  notifyOnboardingReady: () => {
    ipcRenderer.send("desktop-layer:onboarding-ready");
  },
  reportOnboardingStep: (step) => {
    ipcRenderer.send("desktop-layer:onboarding-step", Number(step));
  },
  finishOnboarding: (payload) =>
    ipcRenderer.invoke("desktop-layer:onboarding-finish", payload || {}),
  prepareOnboardingWidget: (widgetKey) =>
    ipcRenderer.invoke("desktop-layer:prepare-onboarding-widget", widgetKey),
  onExternalDropResult: (callback) => {
    externalDropHandler = typeof callback === "function" ? callback : null;
  },
  onNotesUpdated: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("desktop-layer:notes-updated", listener);
    return () => ipcRenderer.removeListener("desktop-layer:notes-updated", listener);
  },
  onToast: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("desktop-layer:toast", listener);
    return () => ipcRenderer.removeListener("desktop-layer:toast", listener);
  }
});

function isFileDrag(event) {
  return Boolean(
    event.dataTransfer &&
    Array.from(event.dataTransfer.types || []).includes("Files")
  );
}

// Explorer → desktop-layer category. This has to run in the preload because a
// sandboxed renderer cannot resolve disk paths from File objects.
window.addEventListener("dragover", (event) => {
  if (!isFileDrag(event)) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
}, true);

window.addEventListener("drop", async (event) => {
  if (!isFileDrag(event)) return;

  const files = Array.from(event.dataTransfer.files || []);
  const paths = [];

  for (const file of files) {
    try {
      const filePath = webUtils.getPathForFile(file);
      if (filePath) paths.push(filePath);
    } catch (error) {
      // Skip files whose native path cannot be resolved.
    }
  }

  if (paths.length === 0) return;

  event.preventDefault();
  event.stopPropagation();

  const target = document.elementFromPoint(event.clientX, event.clientY);
  const folderTarget = target && target.closest
    ? target.closest('[data-file-kind="folder"][data-file-path]')
    : null;

  // Dropping onto a folder item takes precedence over assigning the file to
  // the surrounding category: execute a real filesystem move instead.
  if (folderTarget && folderTarget.dataset.filePath) {
    try {
      const result = await ipcRenderer.invoke("desktop-layer:move-files-into-folder", {
        folderPath: folderTarget.dataset.filePath,
        paths
      });

      if (externalDropHandler) {
        externalDropHandler({
          ok: Boolean(result && result.ok),
          count: result && Array.isArray(result.moved) ? result.moved.length : 0,
          error: result && !result.ok
            ? result.error ||
              (result.errors && result.errors[0] && result.errors[0].error) ||
              "无法将文件移动到文件夹"
            : null
        });
      }
    } catch (error) {
      if (externalDropHandler) {
        externalDropHandler({
          ok: false,
          count: 0,
          error: "无法将文件移动到文件夹"
        });
      }
    }

    return;
  }

  const pomodoroTarget = target && target.closest
    ? target.closest(".pomodoro-widget[data-widget-key='pomodoro']")
    : null;

  // A drop on the pomodoro is analyzed by the main process (type + size) and
  // never becomes a category assignment. The layer turns the result into a
  // frozen focus target or a red "too large" bounce.
  if (pomodoroTarget) {
    let analysis = null;

    try {
      analysis = await ipcRenderer.invoke("desktop-layer:analyze-pomodoro-drop", {
        paths
      });
    } catch (error) {
      analysis = { ok: false, error: "无法分析文件。" };
    }

    if (externalDropHandler) {
      externalDropHandler({ pomodoro: true, analysis });
    }

    return;
  }

  const transferWidget = target && target.closest
    ? target.closest(
      ".note-widget[data-widget-key='notes'], .todo-widget[data-widget-key='todo'], .search-widget[data-widget-key='search']"
    )
    : null;

  if (transferWidget) {
    const transferTarget = transferWidget.dataset.widgetKey === "notes"
      ? "notes"
      : transferWidget.dataset.widgetKey === "todo"
        ? "todo"
        : "search";
    let result = null;

    try {
      result = await ipcRenderer.invoke("desktop-layer:ingest-dropped-files", {
        target: transferTarget,
        paths
      });
    } catch (error) {
      result = {
        ok: false,
        target: transferTarget,
        count: 0,
        error: String(error)
      };
    }

    if (externalDropHandler) {
      externalDropHandler({ transfer: transferTarget, ...result });
    }

    return;
  }

  const groupTarget = target && target.closest
    ? target.closest(".tab-group-widget[data-group-key]")
    : null;  if (groupTarget && groupTarget.dataset.groupKey) {
    let result = null;

    try {
      result = await ipcRenderer.invoke(
        "desktop-layer:assign-dropped-files-to-group",
        { groupId: groupTarget.dataset.groupKey, paths }
      );
    } catch (error) {
      result = { ok: false, error: String(error), count: 0 };
    }

    if (externalDropHandler) {
      externalDropHandler({ group: true, ...result });
    }

    return;
  }

  const category = target && target.closest
    ? target.closest(".category-widget[data-category-key]")
    : null;
  const quickWidget = target && target.closest
    ? target.closest(".quick-widget[data-widget-key='quick']")
    : null;
  const categoryKey = category ? category.dataset.categoryKey : "";

  if (!categoryKey && !quickWidget) {
    if (externalDropHandler) {
      externalDropHandler({
        ok: false,
        count: 0,
        error: "请把文件放到分类或快速收纳组件里。"
      });
    }
    return;
  }

  let result = null;

  try {
    result = categoryKey
      ? await ipcRenderer.invoke(
        "desktop-layer:assign-dropped-files",
        { categoryKey, paths }
      )
      : await ipcRenderer.invoke("desktop-layer:add-quick-files", paths);
  } catch (error) {
    result = { ok: false, count: 0, error: String(error) };
  }

  if (externalDropHandler) {
    externalDropHandler(quickWidget ? { ...result, quick: true } : result);
  }
}, true);
