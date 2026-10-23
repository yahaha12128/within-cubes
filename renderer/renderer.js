"use strict";

(() => {
  const api = window.desktopOrganizer;

  const CATEGORY_META = {
    folders: { icon: "folder", label: "文件夹" },
    apps: { icon: "app", label: "应用图标或快捷方式" },
    documents: { icon: "document", label: "文档" },
    media: { icon: "image", label: "图片或音频等多媒体" },
    archives: { icon: "archive", label: "压缩包" }
  };

  const LIGHT_UI_PALETTE = {
    bg: "#f3f3f3",
    surface: "#ffffff",
    card: "#ffffff",
    cardBorder: "#e5e5e5",
    ink: "#1b1b1b",
    ink2: "#3c3c3c",
    muted: "#6e6e6e",
    line: "#ececec",
    controlBg: "#fbfbfb",
    controlBorder: "#d6d6d6",
    hover: "#f0f0f0",
    navActive: "#e8e8e8",
    shadow: "0 2px 6px rgba(0, 0, 0, 0.05)"
  };
  const DARK_UI_PALETTE = {
    bg: "#202020",
    surface: "#272727",
    card: "#2b2b2b",
    cardBorder: "#383838",
    ink: "#f4f4f4",
    ink2: "#d6d6d6",
    muted: "#a2a2a2",
    line: "#3a3a3a",
    controlBg: "#323232",
    controlBorder: "#4a4a4a",
    hover: "#343434",
    navActive: "#3a3a3a",
    shadow: "0 2px 8px rgba(0, 0, 0, 0.3)"
  };

  const CUSTOM_TINT_PALETTE = [
    "#2f6b4f",
    "#3f6f8e",
    "#6a5b86",
    "#8a4f38",
    "#9a7437",
    "#496a52",
    "#a33a32",
    "#445148",
    "#7b5a4b",
    "#2f4f5f"
  ];

  const elements = {
    scanButton: document.querySelector("#scanButton"),
    scanButtonLabel: document.querySelector("#scanButtonLabel"),
    historyButton: document.querySelector("#historyButton"),
    undoButton: document.querySelector("#undoButton"),
    undoButtonLabel: document.querySelector("#undoButtonLabel"),
    manualUndoButton: document.querySelector("#manualUndoButton"),
    manualUndoButtonLabel: document.querySelector("#manualUndoButtonLabel"),
    historyModal: document.querySelector("#historyModal"),
    closeHistoryButton: document.querySelector("#closeHistoryButton"),
    historyList: document.querySelector("#historyList"),
    historyResult: document.querySelector("#historyResult"),
    navHome: document.querySelector("#navHome"),
    navOrganize: document.querySelector("#navOrganize"),
    navComponents: document.querySelector("#navComponents"),
    navGlobalSettings: document.querySelector("#navGlobalSettings"),
    navSettings: document.querySelector("#navSettings"),
    navAbout: document.querySelector("#navAbout"),
    pageHome: document.querySelector("#pageHome"),
    pageAchievements: document.querySelector("#pageAchievements"),
    pageOrganize: document.querySelector("#pageOrganize"),
    pagePersonalize: document.querySelector("#pagePersonalize"),
    pageWidgets: document.querySelector("#pageWidgets"),
    pageSettings: document.querySelector("#pageSettings"),
    pageAbout: document.querySelector("#pageAbout"),
    appFolderPath: document.querySelector("#appFolderPath"),
    appProgramPath: document.querySelector("#appProgramPath"),
    notesFolderPath: document.querySelector("#notesFolderPath"),
    desktopFolderPath: document.querySelector("#desktopFolderPath"),
    resetDesktopLayoutButton: document.querySelector("#resetDesktopLayoutButton"),
    exportLayoutButton: document.querySelector("#exportLayoutButton"),
    importLayoutButton: document.querySelector("#importLayoutButton"),
    importIconPackButton: document.querySelector("#importIconPackButton"),
    replayOnboardingButton: document.querySelector("#replayOnboardingButton"),
    resetAllDataButton: document.querySelector("#resetAllDataButton"),
    clipboardNoteButton: document.querySelector("#clipboardNoteButton"),
    toggleShellIntegrationButton: document.querySelector("#toggleShellIntegrationButton"),
    shellIntegrationNote: document.querySelector("#shellIntegrationNote"),
    personalizeOverview: document.querySelector("#personalizeOverview"),
    personalizeDetail: document.querySelector("#personalizeDetail"),
    personalizeDetailContent: document.querySelector("#personalizeDetailContent"),
    personalizeCardList: document.querySelector("#personalizeCardList"),
    personalizeBack: document.querySelector("#personalizeBack"),
    personalizeDetailTitle: document.querySelector("#personalizeDetailTitle"),
    filterDisabledComponents: document.querySelector("#filterDisabledComponents"),
    componentFilterCount: document.querySelector("#componentFilterCount"),
    componentFilterEmpty: document.querySelector("#componentFilterEmpty"),
    floatingVisibleSummary: document.querySelector("#floatingVisibleSummary"),
    toggleAllFloatingButton: document.querySelector("#toggleAllFloatingButton"),
    tintOptions: document.querySelector("#tintOptions"),
    tintPalette: document.querySelector("#tintPalette"),
    frostModeNote: document.querySelector("#frostModeNote"),
    toggleFrostButton: document.querySelector("#toggleFrostButton"),
    toggleWallpaperBrightnessButton: document.querySelector("#toggleWallpaperBrightnessButton"),
    togglePerformanceModeButton: document.querySelector("#togglePerformanceModeButton"),
    toggleDepth3dButton: document.querySelector("#toggleDepth3dButton"),
    toggleMusicVisualizerButton: document.querySelector("#toggleMusicVisualizerButton"),
    focusChartRanges: document.querySelector("#focusChartRanges"),
    focusChartPeriod: document.querySelector("#focusChartPeriod"),
    focusChartSubtitle: document.querySelector("#focusChartSubtitle"),
    focusChartBars: document.querySelector("#focusChartBars"),
    focusChartYAxis: document.querySelector("#focusChartYAxis"),
    focusChartPlot: document.querySelector("#focusChartPlot"),
    focusChartTooltip: document.querySelector("#focusChartTooltip"),
    focusChartTooltipValue: document.querySelector("#focusChartTooltipValue"),
    focusChartTooltipMeta: document.querySelector("#focusChartTooltipMeta"),
    focusChartTotal: document.querySelector("#focusChartTotal"),
    focusChartSessions: document.querySelector("#focusChartSessions"),
    focusChartAverage: document.querySelector("#focusChartAverage"),
    focusChartEmpty: document.querySelector("#focusChartEmpty"),
    focusChartTable: document.querySelector("#focusChartTable"),
    neteaseAdapterButton: document.querySelector("#neteaseAdapterButton"),
    neteaseAdapterModal: document.querySelector("#neteaseAdapterModal"),
    neteaseAdapterCloseButton: document.querySelector("#neteaseAdapterCloseButton"),
    neteaseAdapterDoneButton: document.querySelector("#neteaseAdapterDoneButton"),
    neteaseAdapterStatus: document.querySelector("#neteaseAdapterStatus"),
    neteaseInstallPath: document.querySelector("#neteaseInstallPath"),
    openNeteaseDirButton: document.querySelector("#openNeteaseDirButton"),
    dashboardAchievementCard: document.querySelector("#dashboardAchievementCard"),
    dashboardAchievementCount: document.querySelector("#dashboardAchievementCount"),
    dashboardAchievementMeta: document.querySelector("#dashboardAchievementMeta"),
    dashboardAchievementProgressBar: document.querySelector("#dashboardAchievementProgressBar"),
    openAchievementsPageButton: document.querySelector("#openAchievementsPageButton"),
    openAchievementsButton: document.querySelector("#openAchievementsButton"),
    achievementsProgressText: document.querySelector("#achievementsProgressText"),
    achievementsBackLink: document.querySelector("#achievementsBackLink"),
    achievementsHeroValue: document.querySelector("#achievementsHeroValue"),
    achievementsSummary: document.querySelector("#achievementsSummary"),
    achievementFilters: document.querySelector("#achievementFilters"),
    achievementFilterCount: document.querySelector("#achievementFilterCount"),
    achievementsProgressBar: document.querySelector("#achievementsProgressBar"),
    achievementsGrid: document.querySelector("#achievementsGrid"),
    achievementsFooterNote: document.querySelector("#achievementsFooterNote"),
    resetShortcutsButton: document.querySelector("#resetShortcutsButton"),
    shortcutList: document.querySelector("#shortcutList"),
    shortcutRecordingNote: document.querySelector("#shortcutRecordingNote"),
    pageShortcuts: document.querySelector("#pageShortcuts"),
    openShortcutsButton: document.querySelector("#openShortcutsButton"),
    shortcutSummaryText: document.querySelector("#shortcutSummaryText"),
    shortcutsBackLink: document.querySelector("#shortcutsBackLink"),
    aboutOverview: document.querySelector("#aboutOverview"),
    aboutDetail: document.querySelector("#aboutDetail"),
    aboutFeatures: document.querySelector("#aboutFeatures"),
    aboutBackLink: document.querySelector("#aboutBackLink"),
    aboutBreadcrumbCurrent: document.querySelector("#aboutBreadcrumbCurrent"),
    aboutDetailList: document.querySelector("#aboutDetailList"),
    aboutVersion: document.querySelector("#aboutVersion"),
    noteReaderModal: document.querySelector("#noteReaderModal"),
    noteReaderTitle: document.querySelector("#noteReaderTitle"),
    noteReaderMeta: document.querySelector("#noteReaderMeta"),
    noteReaderContent: document.querySelector("#noteReaderContent"),
    noteReaderClose: document.querySelector("#noteReaderClose"),
    noteReaderCopy: document.querySelector("#noteReaderCopy"),
    noteReaderEdit: document.querySelector("#noteReaderEdit"),
    noteReaderDone: document.querySelector("#noteReaderDone"),
    noteEditorModal: document.querySelector("#noteEditorModal"),
    noteEditorClose: document.querySelector("#noteEditorClose"),
    noteEditorTitleInput: document.querySelector("#noteEditorTitleInput"),
    noteEditorBodyInput: document.querySelector("#noteEditorBodyInput"),
    noteEditorCancel: document.querySelector("#noteEditorCancel"),
    noteEditorSave: document.querySelector("#noteEditorSave"),
    renameDialog: document.querySelector("#renameDialog"),
    renameTitle: document.querySelector("#renameTitle"),
    renameSubtitle: document.querySelector("#renameSubtitle"),
    renameInput: document.querySelector("#renameInput"),
    renameCancelButton: document.querySelector("#renameCancelButton"),
    renameConfirmButton: document.querySelector("#renameConfirmButton"),
    scanModal: document.querySelector("#scanModal"),
    scanModalList: document.querySelector("#scanModalList"),
    scanModalMeta: document.querySelector("#scanModalMeta"),
    scanModalNote: document.querySelector("#scanModalNote"),
    scanModalClose: document.querySelector("#scanModalClose"),
    scanCancelButton: document.querySelector("#scanCancelButton"),
    scanConfirmButton: document.querySelector("#scanConfirmButton"),
    globalToast: document.querySelector("#globalToast"),
    emptyState: document.querySelector("#emptyState"),
    emptyTitle: document.querySelector("#emptyTitle"),
    emptyText: document.querySelector("#emptyText"),
    skippedNotice: document.querySelector("#skippedNotice"),
    rescanButton: document.querySelector("#rescanButton"),
    organizeButton: document.querySelector("#organizeButton"),
    selectionSummary: document.querySelector("#selectionSummary"),
    toggleAllButton: document.querySelector("#toggleAllButton"),
    categoryGrid: document.querySelector("#categoryGrid"),
    actionBar: document.querySelector("#actionBar"),
    results: document.querySelector("#results"),
    summaryTitle: document.querySelector("#summaryTitle"),
    summaryNote: document.querySelector("#summaryNote"),
    content: document.querySelector(".content"),
    pageTitle: document.querySelector("#pageTitle"),
    pageSubtitle: document.querySelector("#pageSubtitle"),
    settingsSearch: document.querySelector("#settingsSearch"),
    languageSelect: document.querySelector("#languageSelect"),
    searchClearButton: document.querySelector("#searchClearButton"),
    searchEmpty: document.querySelector("#searchEmpty"),
    sidebar: document.querySelector("#sidebar"),
    sidebarToggle: document.querySelector("#sidebarToggle"),
    widgetSubtabs: document.querySelector("#widgetSubtabs"),
    collapseModeHost: document.querySelector("#collapseModeHost"),
    toggleSmartThemeButton: document.querySelector("#toggleSmartThemeButton"),
    toggleSmartTimeButton: document.querySelector("#toggleSmartTimeButton"),
    toggleSmartSeasonButton: document.querySelector("#toggleSmartSeasonButton"),
    smartThemePanel: document.querySelector("#smartThemePanel"),
    smartThemeSwatch: document.querySelector("#smartThemeSwatch"),
    smartThemeTitle: document.querySelector("#smartThemeTitle"),
    smartThemeDetail: document.querySelector("#smartThemeDetail"),
    tintLockedNote: document.querySelector("#tintLockedNote"),
    uiBackgroundTypes: document.querySelector("#uiBackgroundTypes"),
    uiBgSolidRow: document.querySelector("#uiBgSolidRow"),
    uiBgSolidColor: document.querySelector("#uiBgSolidColor"),
    uiBgSolidValue: document.querySelector("#uiBgSolidValue"),
    uiBgGradientRow: document.querySelector("#uiBgGradientRow"),
    uiBgGradientStart: document.querySelector("#uiBgGradientStart"),
    uiBgGradientEnd: document.querySelector("#uiBgGradientEnd"),
    uiBgGradientPresets: document.querySelector("#uiBgGradientPresets"),
    uiBackgroundBlock: document.querySelector(".ui-background-block"),
    uiBackgroundLockedNote: document.querySelector("#uiBackgroundLockedNote"),
    uiBgImageRow: document.querySelector("#uiBgImageRow"),
    uiBgPreview: document.querySelector("#uiBgPreview"),
    uiBgImageName: document.querySelector("#uiBgImageName"),
    uiBgPickButton: document.querySelector("#uiBgPickButton"),
    uiBgClearButton: document.querySelector("#uiBgClearButton"),
    dashClockValue: document.querySelector("#dashClockValue"),
    dashClockMeta: document.querySelector("#dashClockMeta"),
    dashFocusValue: document.querySelector("#dashFocusValue"),
    dashFocusMeta: document.querySelector("#dashFocusMeta"),
    dashTodoValue: document.querySelector("#dashTodoValue"),
    dashTodoMeta: document.querySelector("#dashTodoMeta"),
    dashTodoCard: document.querySelector("#dashTodoCard"),
    dashRecentCount: document.querySelector("#dashRecentCount"),
    dashRecentList: document.querySelector("#dashRecentList"),
    dashPrivacyValue: document.querySelector("#dashPrivacyValue"),
    dashPrivacyCard: document.querySelector("#dashPrivacyCard"),
    dashPrivacyMeta: document.querySelector("#dashPrivacyMeta"),
    // 待办管理现在是「组件库 → 任务待办」的下钻页，DOM 由 JS 构建，
    // 这些引用在 createTodoManagerSection() 里被重新赋值。
    todoManagerList: null,
    todoManagerEmpty: null,
    todoManagerMeta: null,
    todoTabCount: null,
    importTodoCsvButton: null,
    exportTodoCsvButton: null,
    todoTabs: [],
    aboutDonateCard: document.querySelector("#aboutDonateCard"),
    donateModal: document.querySelector("#donateModal"),
    closeDonateButton: document.querySelector("#closeDonateButton"),
    donateWechatImage: document.querySelector("#wechatDonateImage"),
    donateAlipayImage: document.querySelector("#alipayDonateImage"),
    donateAfdianButton: document.querySelector("#donateAfdianButton"),
    donateGithubButton: document.querySelector("#donateGithubButton"),
    donateBilibiliButton: document.querySelector("#donateBilibiliButton")
  };

  const PAGE_META = {
    home: {
      title: "仪表盘",
      subtitle: "专注、待办与桌面组件状态。"
    },
    organize: {
      title: "桌面整理",
      subtitle: "扫描桌面文件，确认后登记分类归属。"
    },
    personalize: {
      title: "组件库",
      subtitle: "打开组件，并调整它在桌面上的显示方式。"
    },
    widgets: {
      title: "全局设置",
      subtitle: "外观、节律与桌面层显示。"
    },
    achievements: {
      title: "成就图鉴",
      subtitle: "查看解锁进度与全部 81 个成就。"
    },
    settings: {
      title: "设置",
      subtitle: "管理保存路径、桌面布局与快捷入口。"
    },
    shortcuts: {
      title: "全局快捷键",
      subtitle: "管理在任何窗口下都能触发的按键组合。"
    },
    about: {
      title: "关于",
      subtitle: "产品信息、版本、开源生态与反馈。"
    }
  };

  const CATEGORY_ICON_NAMES = {
    folders: "folder",
    apps: "app",
    documents: "document",
    media: "image",
    archives: "archive"
  };

  const WIDGET_ICON_NAMES = {
    clock: "clock",
    music: "music",
    notes: "note",
    todo: "todo",
    calendar: "calendar",
    pomodoro: "timer",
    quick: "folder",
    clipboard: "clipboard",
    search: "search"
  };

  const WIDGET_TONES = {
    clock: "blue",
    music: "purple",
    notes: "yellow",
    todo: "green",
    calendar: "peach",
    pomodoro: "pink",
    quick: "teal",
    clipboard: "purple",
    search: "blue"
  };

  const CATEGORY_TONES = {
    folders: "yellow",
    apps: "peach",
    documents: "blue",
    media: "pink",
    archives: "green"
  };

  const ICON_TONES = {
    clock: "blue",
    timer: "pink",
    music: "purple",
    note: "yellow",
    notes: "yellow",
    todo: "green",
    calendar: "peach",
    folder: "yellow",
    clipboard: "purple",
    search: "blue",
    eye: "teal",
    "eye-off": "pink",
    layout: "blue",
    document: "blue",
    image: "yellow",
    blur: "purple",
    palette: "blue",
    sparkles: "purple",
    "chevron-down": "blue",
    window: "purple",
    reset: "peach",
    undo: "peach",
    scan: "blue",
    inbox: "yellow",
    sliders: "green",
    settings: "peach",
    widgets: "purple"
  };

  const PERSONALIZE_META = {
    clock: {
      icon: "clock",
      kicker: "时间",
      description: "查看时间、日期、星期，可自定义格式与一句文字。",
      detail: "调整时间格式、日期格式和自定义文字，让时钟更符合你的习惯。"
    },
    music: {
      icon: "music",
      kicker: "媒体",
      description: "显示当前播放的歌名、歌手与进度，并提供播放控制。",
      detail: "读取 Windows 媒体会话；可调整大小、位置和背景图片。"
    },
    notes: {
      icon: "note",
      kicker: "便签",
      description: "写下内容并保存到本机，翻页即可查看最近 5 条记录。",
      detail: "草稿会自动保留；点击「保存」写入随手记历史，第二页可翻看最近 5 条。"
    },
    todo: {
      icon: "todo",
      kicker: "效率",
      description: "记录小任务，支持添加、勾选完成和删除。",
      detail: "在桌面卡片中管理待办，也可以在这里查看全部、编辑或勾选导出。"
    },
    calendar: {
      icon: "calendar",
      kicker: "日期",
      description: "显示当月日历并高亮今天，安静地做一块桌面日历。",
      detail: "自动显示当月日期并高亮今天；纯展示组件，不需要额外设置。"
    },
    pomodoro: {
      icon: "timer",
      kicker: "专注",
      description: "25 分钟专注、5 分钟休息，一个轻量的桌面番茄钟。",
      detail: "在桌面卡片上开始、暂停或重置专注计时；完成后自动切到休息阶段。"
    },
    quick: {
      icon: "folder",
      kicker: "中转",
      description: "把零散文件临时收进一个独立组件，不移动原文件。",
      detail: "从桌面或其他分类把文件拖入快速收纳；点击可打开原文件，移除时不会影响原位置。"
    },
    clipboard: {
      icon: "clipboard",
      kicker: "剪贴板",
      description: "自动记录最近复制的文字，点击即可重新复制。",
      detail: "开启后监听系统剪贴板并自动去重，只保留最近 10 条文字记录；点击记录可重新复制，右键可删除。"
    },
    search: {
      icon: "search",
      kicker: "检索",
      description: "搜索桌面、分类和快速收纳中的文件，拖入文件自动填入名称。",
      detail: "输入关键词即时搜索所有已登记文件；把文件拖进搜索框会自动填入文件名并展示结果。"
    }
  };

  const SVG_NS = "http://www.w3.org/2000/svg";

  const pages = {
    home: elements.pageHome,
    achievements: elements.pageAchievements,
    organize: elements.pageOrganize,
    personalize: elements.pagePersonalize,
    widgets: elements.pageWidgets,
    settings: elements.pageSettings,
    shortcuts: elements.pageShortcuts,
    about: elements.pageAbout
  };

  const navItems = {
    home: elements.navHome,
    organize: elements.navOrganize,
    personalize: elements.navComponents,
    widgets: elements.navGlobalSettings,
    settings: elements.navSettings,
    about: elements.navAbout
  };

  let currentPlan = null;
  let selectedPaths = new Set();
  let fileCheckboxes = [];
  let scanning = false;
  let organizing = false;
  let undoing = false;
  let undoStatus = { available: false, count: 0, runAt: null };
  let manualUndoStatus = { available: false, last: null };
  let manualBusy = false;
  let previewDrag = null;
  let undoArmed = false;
  let undoTimer = null;
  let historyRuns = [];
  let historyArmedRunId = null;
  let historyTimer = null;
  let rollbackInProgress = false;
  let lastHistoryFocus = null;
  let currentPage = "home";
  let floatingSettings = null;
  let renameTarget = null;
  let lastRenameFocus = null;
  let toastHideTimer = null;
  let toastExitTimer = null;
  let toastDeadline = 0;
  let toastRemaining = 0;
  let toastPaused = false;
  let searchQuery = "";
  let sidebarHoverSuppressed = false;
  let collapseModeControl = null;
  let activeSubtabSection = "";
  let personalizeDetailKey = null;
  let personalizeDetailKind = "widget";
  let showOnlyDisabledComponents = false;
  let lastPersonalizeFocus = null;
  let pendingNotesHistoryFocus = false;
  let activeNoteEditor = null;
  let activeNoteReader = null;
  let noteReaderLastFocus = null;
  let notesEditorRequestToken = 0;
  let achievementsData = null;
  let achievementFilter = "all";
  let shortcutState = null;
  let shortcutRecordingAction = "";
  let shortcutRecordingButton = null;
  let searchAchievementRecorded = false;
  let aboutAchievementRecorded = false;
  let aboutInfo = null;
  let aboutCurrentPanel = "";
  let notesHistoryRequestToken = 0;
  let settingsPathsLoading = false;
  let shellIntegrationLoading = false;
  let lastAppliedSmartAccent = null;
  const RECENT_ORGANIZED_KEY = "within-cubes.recent-organized";
  let recentOrganized = readRecentOrganized();

  const TOAST_DURATION = 2000;
  const TOAST_EXIT_DURATION = 260;

  function clearToastTimers() {
    clearTimeout(toastHideTimer);
    clearTimeout(toastExitTimer);
    toastHideTimer = null;
    toastExitTimer = null;
  }

  function hideToast() {
    const toast = elements.globalToast;
    if (!toast || toast.hidden) return;

    clearTimeout(toastHideTimer);
    toastHideTimer = null;
    toastPaused = false;
    toast.classList.remove("is-visible");
    toast.classList.add("is-leaving");

    clearTimeout(toastExitTimer);
    toastExitTimer = setTimeout(() => {
      toastExitTimer = null;
      toast.className = "global-toast";
      toast.textContent = "";
      toast.hidden = true;
    }, TOAST_EXIT_DURATION);
  }

  function startToastCountdown(duration = TOAST_DURATION) {
    clearTimeout(toastHideTimer);
    toastPaused = false;
    toastRemaining = duration;
    toastDeadline = Date.now() + duration;
    toastHideTimer = setTimeout(() => {
      toastHideTimer = null;
      hideToast();
    }, duration);
  }

  function setStatus(message, tone = "info") {
    const toast = elements.globalToast;
    if (!toast) return;

    clearToastTimers();
    const wasVisible = toast.classList.contains("is-visible");

    toast.className = `global-toast is-${tone}${wasVisible ? " is-visible" : ""}`;
    toast.textContent = message;
    toast.hidden = false;

    if (!wasVisible) {
      void toast.offsetWidth;
      requestAnimationFrame(() => {
        if (!toast.hidden) toast.classList.add("is-visible");
      });
    }

    if (toast.matches(":hover")) {
      toastPaused = true;
      toastRemaining = TOAST_DURATION;
      toastDeadline = Date.now() + TOAST_DURATION;
    } else {
      startToastCountdown();
    }
  }

  function clearStatus() {
    clearToastTimers();
    toastPaused = false;
    if (!elements.globalToast) return;
    elements.globalToast.className = "global-toast";
    elements.globalToast.textContent = "";
    elements.globalToast.hidden = true;
  }

  if (elements.globalToast) {
    elements.globalToast.addEventListener("mouseenter", () => {
      if (toastHideTimer === null) return;
      clearTimeout(toastHideTimer);
      toastHideTimer = null;
      toastPaused = true;
      toastRemaining = Math.max(0, toastDeadline - Date.now());
    });

    elements.globalToast.addEventListener("mouseleave", () => {
      if (!toastPaused) return;
      toastPaused = false;
      if (toastRemaining <= 0) {
        hideToast();
      } else {
        startToastCountdown(toastRemaining);
      }
    });
  }

  function createIcon(name, className = "icon settings-icon") {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");

    const use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", `#i-${name}`);
    svg.append(use);

    return svg;
  }

  function createSwitch({ checked, label, onChange }) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "switch";
    button.setAttribute("role", "switch");
    button.setAttribute("aria-checked", String(Boolean(checked)));
    button.setAttribute("aria-label", label);
    button.title = label;

    const thumb = document.createElement("span");
    thumb.className = "switch-thumb";
    button.append(thumb);

    button.addEventListener("click", () => {
      const next = button.getAttribute("aria-checked") !== "true";
      button.setAttribute("aria-checked", String(next));
      onChange(next);
    });

    return button;
  }

  function getAccentInk(color) {
    const match = /^#?([0-9a-f]{6})$/i.exec(String(color || ""));
    if (!match) return "#ffffff";

    const value = parseInt(match[1], 16);
    const red = (value >> 16) & 0xff;
    const green = (value >> 8) & 0xff;
    const blue = value & 0xff;
    const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;

    return luminance > 0.62 ? "#1b1b1b" : "#ffffff";
  }

  function parseHexColor(value) {
    const match = /^#?([0-9a-f]{6})$/i.exec(String(value || ""));
    if (!match) return null;

    const parsed = parseInt(match[1], 16);
    return {
      r: (parsed >> 16) & 0xff,
      g: (parsed >> 8) & 0xff,
      b: parsed & 0xff
    };
  }

  function isDarkHexColor(value) {
    const rgb = parseHexColor(value);
    if (!rgb) return false;

    return (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255 < 0.46;
  }

  function mixHexColors(left, right, rightWeight) {
    const a = parseHexColor(left);
    const b = parseHexColor(right);
    if (!a || !b) return left;

    const weight = Math.max(0, Math.min(1, Number(rightWeight) || 0));
    const channel = (start, end) => Math.round(start * (1 - weight) + end * weight);
    const value = (channel(a.r, b.r) << 16) |
      (channel(a.g, b.g) << 8) |
      channel(a.b, b.b);

    return `#${value.toString(16).padStart(6, "0")}`;
  }

  function rgbaFromHex(value, alpha) {
    const rgb = parseHexColor(value);
    if (!rgb) return `rgba(243, 243, 243, ${alpha})`;

    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  async function refreshSystemAccent() {
    if (lastAppliedSmartAccent) return;
    if (!api || typeof api.getAccentColor !== "function") return;

    try {
      const color = await api.getAccentColor();

      if (typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color)) {
        document.documentElement.style.setProperty("--system-accent", color);
        document.documentElement.style.setProperty(
          "--system-accent-ink",
          getAccentInk(color)
        );
      }
    } catch (error) {
      // 读取系统主题色失败时沿用 CSS 中的默认色
    }
  }

  function updateSidebarA11y() {
    if (!elements.sidebar || !elements.sidebarToggle) return;

    const pinned = elements.sidebar.classList.contains("is-pinned");
    const expanded =
      pinned || elements.sidebar.classList.contains("is-hovered");
    const label = pinned ? "收起导航栏" : "展开导航栏";

    elements.sidebar.classList.toggle("is-expanded", expanded);
    elements.sidebarToggle.setAttribute("aria-expanded", String(expanded));
    elements.sidebarToggle.setAttribute("aria-label", label);
    elements.sidebarToggle.title = label;
  }

  function setupSidebar() {
    if (!elements.sidebar || !elements.sidebarToggle) return;

    elements.sidebarToggle.addEventListener("click", () => {
      const pinned = elements.sidebar.classList.contains("is-pinned");

      if (pinned) {
        elements.sidebar.classList.remove("is-pinned");
        elements.sidebar.classList.remove("is-hovered");
        sidebarHoverSuppressed = true;
      } else {
        elements.sidebar.classList.add("is-pinned");
        sidebarHoverSuppressed = false;
      }

      updateSidebarA11y();
    });

    elements.sidebar.addEventListener("mouseenter", () => {
      if (sidebarHoverSuppressed) return;
      elements.sidebar.classList.add("is-hovered");
      updateSidebarA11y();
    });

    elements.sidebar.addEventListener("mouseleave", () => {
      sidebarHoverSuppressed = false;

      if (!elements.sidebar.classList.contains("is-pinned")) {
        elements.sidebar.classList.remove("is-hovered");
      }

      updateSidebarA11y();
    });

    elements.sidebar.addEventListener("focusin", () => {
      if (elements.sidebar.classList.contains("is-pinned")) return;
      elements.sidebar.classList.add("is-hovered");
      updateSidebarA11y();
    });

    elements.sidebar.addEventListener("focusout", (event) => {
      if (elements.sidebar.classList.contains("is-pinned")) return;
      if (event.relatedTarget && elements.sidebar.contains(event.relatedTarget)) {
        return;
      }

      elements.sidebar.classList.remove("is-hovered");
      updateSidebarA11y();
    });

    updateSidebarA11y();
  }

  function collapseSidebarAfterNavigation() {
    if (!elements.sidebar) return;

    if (elements.sidebar.classList.contains("is-pinned")) {
      updateSidebarA11y();
      return;
    }

    elements.sidebar.classList.remove("is-hovered");
    sidebarHoverSuppressed = true;
    updateSidebarA11y();
  }

  function normalizeSearchQuery(value) {
    return String(value || "").trim().toLowerCase();
  }

  function matchesSearch(element, query) {
    if (!query || !element) return true;
    return element.textContent.toLowerCase().includes(query);
  }

  function filterSettingsGroups(page, query) {
    let visibleCount = 0;

    page.querySelectorAll(".settings-group").forEach((group) => {
      const groupHead = group.querySelector(":scope > h3");
      const groupHeadMatches = Boolean(query) && matchesSearch(groupHead, query);
      let groupVisible = 0;

      group.querySelectorAll(":scope > .settings-row").forEach((row) => {
        const match = !query || groupHeadMatches || matchesSearch(row, query);
        row.hidden = !match;
        if (match) groupVisible += 1;
      });

      group.querySelectorAll(":scope > .settings-block").forEach((block) => {
        const head = block.querySelector(".settings-block-head");
        const headMatches =
          !query || groupHeadMatches || matchesSearch(head, query);
        const items = Array.from(block.querySelectorAll(".settings-item"));

        if (items.length > 0) {
          let shownItems = 0;

          items.forEach((item) => {
            const match = headMatches || matchesSearch(item, query);
            item.hidden = !match;
            if (match) shownItems += 1;
          });

          block.hidden = Boolean(query) && shownItems === 0;
          groupVisible += shownItems;
        } else {
          const match = headMatches || matchesSearch(block, query);
          block.hidden = !match;
          if (match) groupVisible += 1;
        }
      });

      group.querySelectorAll(":scope > .settings-note").forEach((note) => {
        note.hidden = Boolean(query);
      });

      group.hidden = Boolean(query) && groupVisible === 0;

      if (!group.hidden) {
        visibleCount += Math.max(groupVisible, query ? 0 : 1);
      }
    });

    return visibleCount;
  }

  function applySearchFilter() {
    const query = normalizeSearchQuery(searchQuery);
    let visibleCount = 0;

    if (currentPage === "home" || currentPage === "organize") {
      const scope = currentPage === "home" ? elements.pageHome : elements.pageOrganize;
      const selector = currentPage === "home" ? ".dashboard-card" : ".category-card";
      const cards = scope.querySelectorAll(selector);

      cards.forEach((card) => {
        const match = matchesSearch(card, query);
        card.hidden = !match;
        if (match) visibleCount += 1;
      });
    } else if (currentPage === "personalize") {
      if (personalizeDetailKey) {
        visibleCount = filterSettingsGroups(elements.pagePersonalize, query);
      } else {
        let shownCards = 0;

        elements.personalizeCardList
          .querySelectorAll(".personalize-card")
          .forEach((card) => {
            const match = matchesSearch(card, query);
            const enabled = card.dataset.componentEnabled === "true";
            const filterMatch = !showOnlyDisabledComponents || !enabled;
            card.hidden = !(match && filterMatch);
            if (!card.hidden) {
              visibleCount += 1;
              shownCards += 1;
            }
          });

        if (elements.componentFilterEmpty) {
          elements.componentFilterEmpty.hidden =
            !(showOnlyDisabledComponents && shownCards === 0);
        }
      }
    } else if (currentPage === "widgets") {
      visibleCount = filterSettingsGroups(elements.pageWidgets, query);
    } else if (currentPage === "settings") {
      visibleCount = filterSettingsGroups(elements.pageSettings, query);
    } else if (currentPage === "about") {
      const paragraphs = elements.pageAbout.querySelectorAll(".about-copy p");

      paragraphs.forEach((paragraph) => {
        const match = matchesSearch(paragraph, query);
        paragraph.hidden = !match;
        if (match) visibleCount += 1;
      });

      const card = elements.pageAbout.querySelector(".settings-group");
      if (card) card.hidden = Boolean(query) && visibleCount === 0;
    }

    if (elements.searchEmpty) {
      elements.searchEmpty.hidden = !query || visibleCount > 0;
    }
  }

  function clearSearch() {
    if (!elements.settingsSearch) return;

    elements.settingsSearch.value = "";
    searchQuery = "";
    if (elements.searchClearButton) elements.searchClearButton.hidden = true;
    applySearchFilter();
  }

  function setupSearch() {
    if (!elements.settingsSearch) return;

    elements.settingsSearch.addEventListener("input", () => {
      searchQuery = elements.settingsSearch.value;

      if (elements.searchClearButton) {
        elements.searchClearButton.hidden = searchQuery.length === 0;
      }

      if (
        searchQuery.trim() &&
        !searchAchievementRecorded &&
        api &&
        typeof api.recordAchievementEvent === "function"
      ) {
        searchAchievementRecorded = true;
        api.recordAchievementEvent("search-used").catch(() => {});
      }

      applySearchFilter();
    });

    elements.settingsSearch.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && (searchQuery || elements.settingsSearch.value)) {
        event.preventDefault();
        clearSearch();
        return;
      }

      if (event.key === "Enter") {
        const query = normalizeSearchQuery(elements.settingsSearch.value);

        if (["bug", "作弊", "admin"].includes(query)) {
          api.recordAchievementEvent("search-secret-query", { query })
            .catch(() => {});
        }
      }
    });

    if (elements.searchClearButton) {
      elements.searchClearButton.addEventListener("click", () => {
        clearSearch();
        elements.settingsSearch.focus();
      });
    }
  }

  function setupCollapseModeControl() {
    if (!elements.collapseModeHost) return;

    collapseModeControl = createSelectControl({
      options: [
        { value: "double-click", label: "双击标题栏" },
        { value: "hover", label: "悬停展开" }
      ],
      value: "double-click",
      ariaLabel: "分类窗口折叠方式"
    });
    collapseModeControl.classList.add("collapse-mode-select");

    collapseModeControl.addEventListener("change", async () => {
      if (!api || typeof api.setFloatingCollapseMode !== "function") return;

      try {
        const result = await api.setFloatingCollapseMode(collapseModeControl.value);

        if (result && result.ok && result.settings) {
          renderFloatingSettings(result.settings);
          setStatus("折叠方式已保存。", "success");
        } else {
          setStatus(
            result && result.error ? result.error : "无法保存折叠方式。",
            "error"
          );
          await refreshFloatingSettings();
        }
      } catch (error) {
        setStatus("无法保存折叠方式。", "error");
        await refreshFloatingSettings();
      }
    });

    elements.collapseModeHost.append(collapseModeControl);
  }

  async function loadSettingsPaths() {
    if (!api || settingsPathsLoading) return;

    settingsPathsLoading = true;

    try {
      const result = await api.getAppPaths();

      if (!result || !result.ok) {
        throw new Error(result && result.error ? result.error : "读取路径失败");
      }

      const targets = [
        [elements.appFolderPath, result.userData],
        [elements.appProgramPath, result.appPath],
        [elements.notesFolderPath, result.notes],
        [elements.desktopFolderPath, result.desktop]
      ];

      for (const [node, value] of targets) {
        if (!node) continue;
        node.textContent = value || "—";
        node.title = value || "";
      }
    } catch (error) {
      for (const node of [
        elements.appFolderPath,
        elements.appProgramPath,
        elements.notesFolderPath,
        elements.desktopFolderPath
      ]) {
        if (node) node.textContent = "无法读取路径";
      }
    } finally {
      settingsPathsLoading = false;
    }
  }

  async function loadShellIntegration() {
    if (!api || shellIntegrationLoading || !elements.toggleShellIntegrationButton) {
      return;
    }

    shellIntegrationLoading = true;

    try {
      const result = await api.getShellIntegration();
      const enabled = Boolean(result && result.ok && result.enabled);
      const supported = Boolean(result && result.ok && result.supported);

      elements.toggleShellIntegrationButton.setAttribute(
        "aria-checked",
        String(enabled)
      );
      elements.toggleShellIntegrationButton.disabled = !supported;

      if (elements.shellIntegrationNote) {
        elements.shellIntegrationNote.textContent = supported
          ? "在桌面或文件夹空白处右键，显示「将剪贴板内容生成为随手记卡片」。"
          : "当前系统不支持此快捷入口。";
      }
    } catch (error) {
      if (elements.shellIntegrationNote) {
        elements.shellIntegrationNote.textContent = "无法读取桌面右键菜单状态。";
      }
    } finally {
      shellIntegrationLoading = false;
    }
  }

  async function handleOpenPath(target) {
    if (!api) return;

    try {
      const result = await api.openAppPath(target);

      if (!result || !result.ok) {
        setStatus(result && result.error ? result.error : "无法打开文件夹。", "error");
      }
    } catch (error) {
      setStatus("无法打开文件夹。", "error");
    }
  }

  async function saveClipboardNoteNow() {
    if (!api || !elements.clipboardNoteButton) return;

    elements.clipboardNoteButton.disabled = true;
    elements.clipboardNoteButton.textContent = "读取中…";

    try {
      const result = await api.saveClipboardNote();

      if (result && result.ok) {
        setStatus("剪贴板内容已保存为随手记。", "success");
      } else {
        setStatus(
          result && result.error ? result.error : "剪贴板中没有可保存的文字。",
          "error"
        );
      }
    } catch (error) {
      setStatus("无法读取剪贴板。", "error");
    } finally {
      elements.clipboardNoteButton.disabled = false;
      elements.clipboardNoteButton.textContent = "立即生成";
    }
  }

  async function toggleShellIntegration() {
    if (!api || !elements.toggleShellIntegrationButton) return;

    const next = elements.toggleShellIntegrationButton.getAttribute("aria-checked") !== "true";
    elements.toggleShellIntegrationButton.disabled = true;

    try {
      const result = await api.setShellIntegration(next);

      if (result && result.ok) {
        elements.toggleShellIntegrationButton.setAttribute(
          "aria-checked",
          String(Boolean(result.enabled))
        );
        setStatus(
          next
            ? "已启用桌面右键菜单。现在可以在桌面空白处右键使用。"
            : "已关闭桌面右键菜单。",
          "success"
        );
      } else {
        setStatus(
          result && result.error ? result.error : "无法更新桌面右键菜单。",
          "error"
        );
      }
    } catch (error) {
      setStatus("无法更新桌面右键菜单。", "error");
    } finally {
      elements.toggleShellIntegrationButton.disabled = false;
      await loadShellIntegration();
    }
  }

  function setActiveSubtab(sectionId) {
    if (!elements.widgetSubtabs || activeSubtabSection === sectionId) return;

    activeSubtabSection = sectionId;

    elements.widgetSubtabs.querySelectorAll(".nav-subtab").forEach((button) => {
      const active = button.dataset.section === sectionId;
      button.classList.toggle("is-active", active);

      if (active) {
        button.setAttribute("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  }

  function updateWidgetSubtabForScroll() {
    if (currentPage !== "widgets" || !elements.widgetSubtabs) return;

    const contentTop = elements.content.getBoundingClientRect().top + 128;
    const sections = Array.from(
      elements.widgetSubtabs.querySelectorAll(".nav-subtab")
    )
      .map((button) => document.getElementById(button.dataset.section))
      .filter(Boolean);

    let active = sections.length > 0 ? sections[0].id : "";

    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= contentTop) {
        active = section.id;
      }
    });

    setActiveSubtab(active);
  }

  function setupWidgetSubtabs() {
    if (!elements.widgetSubtabs) return;

    elements.widgetSubtabs.querySelectorAll(".nav-subtab").forEach((button) => {
      button.addEventListener("click", () => {
        const section = document.getElementById(button.dataset.section);
        if (!section) return;

        setActiveSubtab(section.id);
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    if (elements.content) {
      elements.content.addEventListener("scroll", () => {
        if (currentPage === "widgets") updateWidgetSubtabForScroll();
      }, { passive: true });
    }

    window.addEventListener("resize", () => {
      if (currentPage === "widgets") updateWidgetSubtabForScroll();
    });
  }

  function setEmptyState(title, text) {
    elements.emptyTitle.textContent = title;
    elements.emptyText.textContent = text;
  }

  function getSelectedCount() {
    if (!currentPlan) return 0;

    let count = 0;
    currentPlan.categories.forEach((category) => {
      category.files.forEach((file) => {
        if (selectedPaths.has(file.sourcePath)) count += 1;
      });
    });

    return count;
  }

  function updateSelectionUI() {
    const selected = getSelectedCount();
    const busy = scanning || organizing || undoing || rollbackInProgress || manualBusy;

    if (elements.scanConfirmButton) {
      elements.scanConfirmButton.disabled = busy || selected === 0;
      elements.scanConfirmButton.textContent = organizing
        ? "正在整理…"
        : selected > 0
          ? `确认整理（${selected}）`
          : "确认整理";
    }

    if (elements.selectionSummary) {
      const total = currentPlan ? currentPlan.totalFiles : 0;
      elements.selectionSummary.textContent = `已选 ${selected} / 共 ${total} 个文件`;
    }

    if (elements.toggleAllButton) {
      const total = currentPlan ? currentPlan.totalFiles : 0;
      elements.toggleAllButton.disabled = busy || total === 0;
      elements.toggleAllButton.textContent = total > 0 && selected === total ? "取消全选" : "全选";
    }

    updateButtons();
  }

  function handleFileSelection(checkbox) {
    const sourcePath = checkbox.dataset.sourcePath;
    if (!sourcePath) return;

    if (checkbox.checked) {
      selectedPaths.add(sourcePath);
    } else {
      selectedPaths.delete(sourcePath);
    }

    const item = checkbox.closest(".file-item");
    if (item) {
      item.classList.toggle("is-unselected", !checkbox.checked);
    }

    updateSelectionUI();
  }

  function toggleAllSelection() {
    const total = currentPlan ? currentPlan.totalFiles : 0;
    if (total === 0) return;

    const selectAll = getSelectedCount() < total;
    selectedPaths = new Set();

    fileCheckboxes.forEach((checkbox) => {
      checkbox.checked = selectAll;
      if (selectAll) {
        selectedPaths.add(checkbox.dataset.sourcePath);
      }
      const item = checkbox.closest(".file-item");
      if (item) {
        item.classList.toggle("is-unselected", !selectAll);
      }
    });

    updateSelectionUI();
  }

  function resetSelection(plan) {
    selectedPaths = new Set();
    fileCheckboxes = [];

    if (!plan) return;

    plan.categories.forEach((category) => {
      category.files.forEach((file) => {
        selectedPaths.add(file.sourcePath);
      });
    });
  }

  function updateButtons() {
    const busy = scanning || organizing || undoing || rollbackInProgress || manualBusy;
    const toolbarBusy = busy;
    const selectedCount = getSelectedCount();
    const hasSelection = Boolean(currentPlan && selectedCount > 0);
    const hasFiles = Boolean(currentPlan && currentPlan.totalFiles > 0);

    elements.scanButton.disabled = toolbarBusy;
    if (elements.rescanButton) elements.rescanButton.disabled = busy;
    if (elements.organizeButton) elements.organizeButton.disabled = busy || !hasSelection;
    elements.historyButton.disabled = toolbarBusy;
    elements.undoButton.disabled = toolbarBusy || !undoStatus.available;
    elements.closeHistoryButton.disabled = rollbackInProgress;
    if (elements.toggleAllButton) elements.toggleAllButton.disabled = busy || !hasFiles;
    if (elements.scanConfirmButton) {
      elements.scanConfirmButton.disabled = busy || !hasSelection;
      elements.scanConfirmButton.textContent = organizing
        ? "正在整理…"
        : hasSelection
          ? `确认整理（${selectedCount}）`
          : "确认整理";
    }
    fileCheckboxes.forEach((checkbox) => {
      checkbox.disabled = busy;
    });
    elements.undoButton.classList.toggle("is-armed", undoArmed && undoStatus.available);
    elements.undoButtonLabel.textContent = undoing
      ? "正在撤销…"
      : undoArmed && undoStatus.available
        ? `确认撤销（${undoStatus.count}）`
        : "撤销";
    elements.undoButton.title = undoStatus.available
      ? `撤销上次整理（${undoStatus.count} 个文件${undoStatus.runAt ? `，${new Date(undoStatus.runAt).toLocaleString("zh-CN")}` : ""}）`
      : "暂无可撤销的整理记录";
    elements.manualUndoButton.disabled = busy || !manualUndoStatus.available;
    elements.manualUndoButtonLabel.textContent = manualBusy
      ? "正在撤销分类…"
      : "撤销分类调整";
    elements.manualUndoButton.title = manualUndoStatus.available && manualUndoStatus.last
      ? `撤销「${manualUndoStatus.last.name}」的分类调整（${manualUndoStatus.last.fromLabel} → ${manualUndoStatus.last.toLabel}）`
      : "暂无可撤销的分类调整";
    elements.scanButton.classList.toggle("is-busy", scanning);
    elements.scanButtonLabel.textContent = scanning ? "正在扫描…" : "扫描桌面";

    if (elements.organizeButton) {
      if (organizing) {
        elements.organizeButton.textContent = "正在整理…";
      } else {
        elements.organizeButton.textContent = hasSelection
          ? `确认整理（${selectedCount}）`
          : "确认整理";
      }
    }
  }

  function resetUndoArmed() {
    if (undoTimer) {
      clearTimeout(undoTimer);
      undoTimer = null;
    }

    if (undoArmed) {
      undoArmed = false;
      updateButtons();
    }
  }

  async function refreshUndoStatus() {
    if (!api) return;

    try {
      const result = await api.getUndoStatus();

      if (result && result.ok) {
        undoStatus = {
          available: Boolean(result.available),
          count: result.count || 0,
          runAt: result.runAt || null
        };
      } else {
        undoStatus = { available: false, count: 0, runAt: null };
      }
    } catch (error) {
      undoStatus = { available: false, count: 0, runAt: null };
    }

    if (!undoStatus.available) {
      resetUndoArmed();
    }

    updateButtons();
  }

  async function refreshManualUndoStatus() {
    if (!api) return;

    try {
      const result = await api.getManualUndoStatus();

      if (result && result.ok) {
        manualUndoStatus = {
          available: Boolean(result.available),
          last: result.last || null
        };
      } else {
        manualUndoStatus = { available: false, last: null };
      }
    } catch (error) {
      manualUndoStatus = { available: false, last: null };
    }

    updateButtons();
  }

  function formatHistoryTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "未知时间";

    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
  }

  function historyStatusLabel(status) {
    if (status === "active") return "已整理";
    if (status === "undone") return "已撤销";
    if (status === "rolledBack") return "已回档";
    if (status === "empty") return "无操作";
    return "已记录";
  }

  function historyStatusClass(status) {
    if (status === "active") return "is-active";
    if (status === "undone") return "is-undone";
    if (status === "rolledBack") return "is-rolled-back";
    return "is-empty";
  }

  function fileNameFromPath(value) {
    if (!value) return "未知文件";
    return String(value).split(/[\\/]/).pop() || "未知文件";
  }

  function resetHistoryArmed() {
    if (historyTimer) {
      clearTimeout(historyTimer);
      historyTimer = null;
    }

    if (historyArmedRunId) {
      historyArmedRunId = null;
      if (!elements.historyModal.hidden) {
        renderHistoryList();
      }
    }
  }

  async function refreshHistoryList() {
    if (!api) return;

    try {
      const result = await api.getHistory();

      if (elements.historyModal.hidden) return;

      if (!result || !result.ok) {
        historyRuns = [];
        renderHistoryError(result && result.error ? result.error : "无法读取历史记录。");
        return;
      }

      historyRuns = Array.isArray(result.runs) ? result.runs : [];
      renderHistoryList();
    } catch (error) {
      if (!elements.historyModal.hidden) {
        renderHistoryError(error.message || "无法读取历史记录。");
      }
    }
  }

  function renderHistoryError(message) {
    elements.historyList.replaceChildren();

    const node = document.createElement("p");
    node.className = "history-empty";
    node.textContent = message;
    elements.historyList.append(node);
  }

  function renderHistoryList() {
    elements.historyList.replaceChildren();

    if (historyRuns.length === 0) {
      const empty = document.createElement("p");
      empty.className = "history-empty";
      empty.textContent = "还没有整理记录。下次整理后会出现在这里。";
      elements.historyList.append(empty);
      return;
    }

    historyRuns.forEach((run, index) => {
      const item = document.createElement("div");
      item.className = "history-item";

      const row = document.createElement("div");
      row.className = "history-row";

      const main = document.createElement("div");
      main.className = "history-main";

      const time = document.createElement("p");
      time.className = "history-time";
      time.textContent = formatHistoryTime(run.createdAt);

      const meta = document.createElement("div");
      meta.className = "history-meta";

      const runItemCount = Number.isFinite(run.itemCount)
        ? run.itemCount
        : (Number.isFinite(run.movedCount) ? run.movedCount : 0);
      const count = document.createElement("span");
      count.className = "history-count";
      count.textContent = `归属 ${runItemCount} 个文件`;

      const status = document.createElement("span");
      status.className = `history-status ${historyStatusClass(run.status)}`;
      status.textContent = historyStatusLabel(run.status);

      meta.append(count, status);
      main.append(time, meta);

      const armed = historyArmedRunId === run.id;
      const button = document.createElement("button");
      button.className = `btn btn-ghost history-rollback${armed ? " is-armed" : ""}`;
      button.type = "button";
      button.disabled = rollbackInProgress || runItemCount === 0;
      button.textContent = armed
        ? `确认回档（${index + 1} 次）`
        : "回档到此次之前";
      button.title = runItemCount === 0
        ? "此次没有归属记录"
        : `回档此次及之后共 ${index + 1} 次整理`;
      button.addEventListener("click", () => armHistoryRollback(run.id));

      row.append(main, button);
      item.append(row);

      if (armed) {
        const warning = document.createElement("p");
        warning.className = "history-warning";
        warning.textContent =
          `将删除此次及之后共 ${index + 1} 次整理的归属记录；桌面文件不会被移动，已被后续整理或手动调整覆盖的记录会被跳过，并在回档结果中列出。`;
        item.append(warning);
      }

      elements.historyList.append(item);
    });
  }

  function armHistoryRollback(runId) {
    if (rollbackInProgress) return;

    if (historyArmedRunId === runId) {
      clearTimeout(historyTimer);
      historyTimer = null;
      historyArmedRunId = null;
      performHistoryRollback(runId);
      return;
    }

    resetHistoryArmed();
    historyArmedRunId = runId;
    clearTimeout(historyTimer);
    historyTimer = setTimeout(() => {
      historyArmedRunId = null;
      historyTimer = null;
      renderHistoryList();
    }, 6000);
    renderHistoryList();
  }

  function ensureHistoryResult() {
    elements.historyResult.hidden = false;
    elements.historyResult.classList.remove("is-error");
    elements.historyResult.replaceChildren();
  }

  function renderHistoryResultMessage(message, isError = false) {
    ensureHistoryResult();
    elements.historyResult.classList.toggle("is-error", isError);

    const node = document.createElement("p");
    node.className = "history-result-ok";
    node.textContent = message;
    elements.historyResult.append(node);
  }

  function renderHistoryRollbackResult(result) {
    ensureHistoryResult();

    const report = result.report;
    const head = document.createElement("div");
    head.className = "history-result-head";

    const title = document.createElement("strong");
    title.textContent = "回档完成";

    const counts = document.createElement("span");
    counts.className = "history-result-counts";
    counts.textContent =
      `解除归属 ${report.removed} 个 · 跳过 ${report.skipped} 个 · 失败 ${report.errors.length} 个`;

    head.append(title, counts);
    elements.historyResult.append(head);

    if (result.logError) {
      const log = document.createElement("p");
      log.className = "history-result-log";
      log.textContent = `回档日志写入失败：${result.logError}`;
      elements.historyResult.append(log);
    }

    if (result.historyError) {
      const log = document.createElement("p");
      log.className = "history-result-log";
      log.textContent = `历史记录保存失败：${result.historyError}`;
      elements.historyResult.append(log);
    }

    const problems = Array.isArray(report.items)
      ? report.items.filter((item) => item.status === "skipped" || item.status === "error")
      : [];

    if (problems.length === 0) {
      const ok = document.createElement("p");
      ok.className = "history-result-ok";
      ok.textContent = "所有归属记录都已解除，桌面文件保持原位。";
      elements.historyResult.append(ok);
      return;
    }

    const subhead = document.createElement("p");
    subhead.className = "history-result-subhead";
    subhead.textContent = `未能解除归属的记录（${problems.length}）`;
    elements.historyResult.append(subhead);

    const list = document.createElement("ul");
    list.className = "history-result-list";

    problems.forEach((item) => {
      const entry = document.createElement("li");

      const displayPath = item.path || item.from || "";

      const name = document.createElement("span");
      name.className = "history-result-name";
      name.textContent = fileNameFromPath(displayPath);
      name.title = displayPath;

      const reason = document.createElement("span");
      reason.className = "history-result-reason";
      reason.textContent = item.status === "error"
        ? (item.message || "回档失败")
        : (item.reason || "已跳过");

      entry.append(name, reason);
      list.append(entry);
    });

    elements.historyResult.append(list);
  }

  function renderHistoryResultError(message) {
    ensureHistoryResult();
    elements.historyResult.classList.add("is-error");

    const node = document.createElement("p");
    node.className = "history-result-ok";
    node.textContent = message;
    elements.historyResult.append(node);
  }

  async function openHistory() {
    if (!api || scanning || organizing || undoing || rollbackInProgress) return;

    resetUndoArmed();
    resetHistoryArmed();
    clearStatus();

    lastHistoryFocus = document.activeElement;
    elements.historyResult.hidden = true;
    elements.historyResult.replaceChildren();
    elements.historyList.replaceChildren();

    const loading = document.createElement("p");
    loading.className = "history-empty";
    loading.textContent = "正在读取历史记录…";
    elements.historyList.append(loading);

    elements.historyModal.hidden = false;
    document.body.classList.add("modal-open");
    elements.closeHistoryButton.focus();

    await refreshHistoryList();
    updateButtons();
  }

  function closeHistory() {
    if (rollbackInProgress) return;

    resetHistoryArmed();
    elements.historyModal.hidden = true;

    if (
      elements.renameDialog.hidden &&
      (!elements.neteaseAdapterModal || elements.neteaseAdapterModal.hidden) &&
      (!elements.noteReaderModal || elements.noteReaderModal.hidden)
    ) {
      document.body.classList.remove("modal-open");
    }

    if (lastHistoryFocus && typeof lastHistoryFocus.focus === "function") {
      lastHistoryFocus.focus();
    }
  }

  function getFrostModeText(settings) {
    if (!settings.frosted) return "当前方式：已关闭";
    if (settings.material === "native") return "当前方式：系统亚克力材质";
    if (settings.material === "css") return "当前方式：CSS 模糊（系统材质不可用）";
    return "当前方式：—";
  }

  async function refreshFloatingSettings() {
    if (!api) return null;

    try {
      const result = await api.getFloatingSettings();
      if (result && result.ok) {
        floatingSettings = result;
        applyGlobalAppearance(result);
        if (currentPage === "widgets" || currentPage === "personalize") {
          renderFloatingSettings(result);
        }
        updateDashboardFromSettings();
        return result;
      }
    } catch (error) {
      // 设置读取失败时由调用方展示提示
    }

    return null;
  }

  async function loadStartupNotice() {
    if (!api) return;

    try {
      const result = await api.getStartupNotice();

      if (result && result.ok && result.notice) {
        setStatus(result.notice, "info");
      }
    } catch (error) {
      // 启动提示失败不影响主界面
    }
  }

  function isClockSettingsEditing() {
    const active = document.activeElement;
    return Boolean(
      active &&
      typeof active.closest === "function" &&
      active.closest(".clock-settings")
    );
  }

  function createSelectControl({ options, value, ariaLabel }) {
    const wrapper = document.createElement("div");
    wrapper.className = "select-control";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "select-button";
    button.setAttribute("aria-haspopup", "listbox");
    button.setAttribute("aria-expanded", "false");
    if (ariaLabel) button.setAttribute("aria-label", ariaLabel);

    const valueLabel = document.createElement("span");
    valueLabel.className = "select-value";
    button.append(valueLabel, createIcon("chevron-down", "icon select-chevron"));

    const menu = document.createElement("div");
    menu.className = "select-menu";
    menu.setAttribute("role", "listbox");
    if (ariaLabel) menu.setAttribute("aria-label", ariaLabel);
    menu.hidden = true;

    let currentValue = options.some((option) => option.value === value)
      ? value
      : options[0] && options[0].value;
    let activeIndex = Math.max(
      0,
      options.findIndex((option) => option.value === currentValue)
    );

    const optionNodes = options.map((option, index) => {
      const node = document.createElement("div");
      node.className = "select-option";
      node.setAttribute("role", "option");
      node.setAttribute("aria-selected", "false");
      node.tabIndex = -1;
      node.dataset.value = option.value;
      node.textContent = option.label;
      node.addEventListener("click", () => choose(index));
      node.addEventListener("keydown", handleOptionKeydown);
      menu.append(node);
      return node;
    });

    function sync() {
      const selected = options.find((option) => option.value === currentValue);
      valueLabel.textContent = selected ? selected.label : "";

      optionNodes.forEach((node, index) => {
        const isSelected = options[index].value === currentValue;
        node.classList.toggle("is-selected", isSelected);
        node.setAttribute("aria-selected", String(isSelected));
      });
    }

    function isMenuOpen() {
      return !menu.hidden;
    }

    function open() {
      if (!optionNodes.length) return;
      menu.hidden = false;
      wrapper.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
      optionNodes[activeIndex].focus();
    }

    function close({ focusButton = false } = {}) {
      menu.hidden = true;
      wrapper.classList.remove("is-open");
      button.setAttribute("aria-expanded", "false");
      if (focusButton) button.focus();
    }

    function choose(index) {
      const option = options[index];
      if (!option) return;

      const changed = option.value !== currentValue;
      currentValue = option.value;
      activeIndex = index;
      sync();
      close({ focusButton: true });

      if (changed) {
        wrapper.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    function moveActive(delta) {
      if (!optionNodes.length) return;
      activeIndex =
        (activeIndex + delta + optionNodes.length) % optionNodes.length;
      optionNodes[activeIndex].focus();
    }

    function handleOptionKeydown(event) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveActive(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveActive(-1);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        choose(activeIndex);
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close({ focusButton: true });
      } else if (event.key === "Tab") {
        close();
      }
    }

    button.addEventListener("click", () => {
      if (isMenuOpen()) {
        close();
      } else {
        open();
      }
    });

    button.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!isMenuOpen()) {
          open();
        } else {
          moveActive(event.key === "ArrowDown" ? 1 : -1);
        }
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (!isMenuOpen()) {
          open();
        } else {
          choose(activeIndex);
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    });

    document.addEventListener("click", (event) => {
      if (!wrapper.contains(event.target)) close();
    });

    Object.defineProperty(wrapper, "value", {
      get: () => currentValue,
      set: (nextValue) => {
        if (!options.some((option) => option.value === nextValue)) return;
        currentValue = nextValue;
        activeIndex = options.findIndex(
          (option) => option.value === nextValue
        );
        sync();
      }
    });

    wrapper.append(button, menu);
    sync();

    return wrapper;
  }

  function createClockSettingsPanel(widget, options) {
    const clockOptions = options && typeof options === "object" ? options : {};
    const timeFormats = Array.isArray(clockOptions.timeFormats)
      ? clockOptions.timeFormats
      : ["hh/mm/ss", "hh/mm", "hh"];
    const dateFormats = Array.isArray(clockOptions.dateFormats)
      ? clockOptions.dateFormats
      : ["yyyy/mm/dd", "yyyy-mm-dd", "mm/dd", "yyyy"];
    const maxTextLength = Number.isInteger(clockOptions.maxTextLength)
      ? clockOptions.maxTextLength
      : 1000;

    const panel = document.createElement("div");
    panel.className = "clock-settings";

    const timeField = document.createElement("label");
    timeField.className = "clock-field";

    const timeCaption = document.createElement("span");
    timeCaption.textContent = "时间格式";

    const timeSelect = createSelectControl({
      options: timeFormats.map((format) => ({
        value: format,
        label: format === "hh" ? "hh" : format.replace(/\//g, ":")
      })),
      value: timeFormats.includes(widget.timeFormat)
        ? widget.timeFormat
        : timeFormats[0],
      ariaLabel: "时间格式"
    });
    timeSelect.classList.add("clock-select");
    timeField.append(timeCaption, timeSelect);

    const dateField = document.createElement("label");
    dateField.className = "clock-field";

    const dateCaption = document.createElement("span");
    dateCaption.textContent = "日期格式";

    const dateSelect = createSelectControl({
      options: dateFormats.map((format) => ({
        value: format,
        label: format
      })),
      value: dateFormats.includes(widget.dateFormat)
        ? widget.dateFormat
        : dateFormats[0],
      ariaLabel: "日期格式"
    });
    dateSelect.classList.add("clock-select");
    dateField.append(dateCaption, dateSelect);

    const textField = document.createElement("label");
    textField.className = "clock-field clock-field--wide";

    const textCaption = document.createElement("span");
    textCaption.textContent = "自定义文字";

    const textArea = document.createElement("textarea");
    textArea.className = "clock-text-input";
    textArea.rows = 3;
    textArea.maxLength = maxTextLength;
    textArea.value = typeof widget.customText === "string"
      ? widget.customText
      : "祝你开心！";
    textArea.placeholder = "祝你开心！";

    const textHint = document.createElement("span");
    textHint.className = "clock-settings-hint";
    textHint.textContent = "支持多行；按 Ctrl + 回车手动换行，长文本会自动换行。";

    textField.append(textCaption, textArea, textHint);

    const error = document.createElement("p");
    error.className = "clock-settings-error";
    error.hidden = true;

    panel.append(timeField, dateField, textField, error);

    let saveTimer = null;
    let saving = false;
    let pending = false;

    const collect = () => ({
      timeFormat: timeSelect.value,
      dateFormat: dateSelect.value,
      customText: textArea.value
    });

    const persist = async () => {
      clearTimeout(saveTimer);
      saveTimer = null;

      if (!api) return;

      if (saving) {
        pending = true;
        return;
      }

      saving = true;

      try {
        const result = await api.setClockSettings(collect());

        if (result && result.ok) {
          if (result.settings) {
            floatingSettings = result.settings;
          }
          error.hidden = true;
          error.textContent = "";
        } else {
          error.textContent = result && result.error
            ? result.error
            : "无法保存时钟设置。";
          error.hidden = false;
        }
      } catch (saveError) {
        error.textContent = "无法保存时钟设置。";
        error.hidden = false;
      } finally {
        saving = false;

        if (pending) {
          pending = false;
          persist();
        }
      }
    };

    const schedulePersist = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(persist, 320);
    };

    timeSelect.addEventListener("change", persist);
    dateSelect.addEventListener("change", persist);
    textArea.addEventListener("input", schedulePersist);
    textArea.addEventListener("change", persist);

    textArea.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();

        const start = textArea.selectionStart;
        const end = textArea.selectionEnd;
        const value = textArea.value;

        textArea.value = `${value.slice(0, start)}\n${value.slice(end)}`;
        const cursor = start + 1;
        textArea.selectionStart = cursor;
        textArea.selectionEnd = cursor;
        schedulePersist();
      }
    });

    return panel;
  }

  function createSettingsButton(label, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-ghost settings-action";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  function renderTintSettings(settings) {
    Array.from(elements.tintOptions.querySelectorAll("[data-tint]")).forEach((button) => {
      const active = button.dataset.tint === settings.tint;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    const savedColor = String(settings.customTint || "").toLowerCase();
    const colors = CUSTOM_TINT_PALETTE.slice();

    elements.tintPalette.replaceChildren();

    colors.forEach((color) => {
      const swatch = document.createElement("button");
      swatch.type = "button";
      swatch.className = "tint-swatch";
      swatch.dataset.color = color;
      swatch.title = color;
      swatch.setAttribute("aria-label", `自定义颜色 ${color}`);

      const selected = savedColor === color;
      swatch.classList.toggle("is-selected", selected);
      swatch.classList.toggle("is-active", settings.tint === "custom" && selected);
      swatch.addEventListener("click", () => changeFloatingCustomTint(color));
      elements.tintPalette.append(swatch);
    });
  }

  function applySmartThemeAccent(settings) {
    const state = settings.smartThemeState;

    if (state && state.enabled && state.color) {
      lastAppliedSmartAccent = state.color;
      document.documentElement.style.setProperty("--system-accent", state.color);
      document.documentElement.style.setProperty(
        "--system-accent-ink",
        state.ink || getAccentInk(state.color)
      );
      return;
    }

    if (lastAppliedSmartAccent) {
      lastAppliedSmartAccent = null;
      refreshSystemAccent();
    }
  }

  function renderSmartThemeSettings(settings) {
    const config = settings.smartTheme || {
      enabled: false,
      timeRhythm: true,
      seasonal: true
    };
    const state = settings.smartThemeState || {};
    const enabled = Boolean(config.enabled);

    elements.toggleSmartThemeButton.setAttribute("aria-checked", String(enabled));
    elements.toggleSmartThemeButton.setAttribute(
      "aria-label",
      enabled ? "关闭智能节律主题" : "开启智能节律主题"
    );
    elements.toggleSmartTimeButton.setAttribute(
      "aria-checked",
      String(Boolean(config.timeRhythm))
    );
    elements.toggleSmartSeasonButton.setAttribute(
      "aria-checked",
      String(Boolean(config.seasonal))
    );
    elements.toggleSmartTimeButton.disabled = !enabled;
    elements.toggleSmartSeasonButton.disabled = !enabled;
    elements.smartThemePanel.classList.toggle("is-disabled", !enabled);

    const colorLocked = enabled;
    elements.tintOptions.classList.toggle("is-disabled", colorLocked);
    elements.tintOptions.querySelectorAll("button").forEach((button) => {
      button.disabled = colorLocked;
    });
    elements.tintPalette.classList.toggle("is-disabled", colorLocked);
    elements.tintPalette.querySelectorAll("button").forEach((button) => {
      button.disabled = colorLocked;
    });
    if (elements.tintLockedNote) {
      elements.tintLockedNote.hidden = !colorLocked;
    }

    if (elements.smartThemeSwatch) {
      elements.smartThemeSwatch.style.setProperty(
        "--smart-color",
        enabled && state.color ? state.color : "#c6cec8"
      );
      elements.smartThemeSwatch.classList.toggle("is-off", !enabled);
    }

    if (elements.smartThemeTitle) {
      elements.smartThemeTitle.textContent = enabled
        ? (state.label || "智能感知")
        : "智能感知已关闭";
    }

    if (elements.smartThemeDetail) {
      if (!enabled) {
        elements.smartThemeDetail.textContent =
          "开启后，组件点缀色会随时间和节日、节气自动变化。";
      } else {
        const parts = [];

        if (state.holiday) {
          parts.push(`今日 ${state.holiday.name}`);
        } else if (state.solarTerm) {
          parts.push(`今日 ${state.solarTerm.name}`);
        } else {
          parts.push(`当前时段 ${state.period ? state.period.label : "—"}`);
        }

        if (state.color) parts.push(String(state.color).toUpperCase());
        elements.smartThemeDetail.textContent = parts.join(" · ");
      }
    }

    applySmartThemeAccent(settings);
  }

  function getBackgroundFileName(filePath) {
    if (typeof filePath !== "string" || !filePath) return "未选择图片";
    return filePath.split(/[\\/]/).filter(Boolean).pop() || filePath;
  }

  function applyUiBackground(background, smartState = {}) {
    const type = ["solid", "gradient", "image"].includes(background.type)
      ? background.type
      : "solid";
    const rootStyle = document.documentElement.style;
    const smartActive = Boolean(smartState.enabled && smartState.color);
    const smartColor = smartActive ? smartState.color : null;
    const solid = smartColor
      ? mixHexColors(background.color || "#f2f4ef", smartColor, 0.1)
      : (background.color || "#f2f4ef");
    const gradientStart = smartColor
      ? mixHexColors(background.gradientStart || "#edf4ee", smartColor, 0.09)
      : (background.gradientStart || "#edf4ee");
    const gradientEnd = smartColor
      ? mixHexColors(background.gradientEnd || "#e4edf6", smartColor, 0.09)
      : (background.gradientEnd || "#e4edf6");

    document.body.dataset.uiBackground = type;
    rootStyle.setProperty("--app-bg-color", solid);
    rootStyle.setProperty(
      "--app-bg-gradient",
      `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`
    );

    if (type === "image" && background.url) {
      const overlay = smartColor
        ? `linear-gradient(${rgbaFromHex(smartColor, 0.16)}, ${rgbaFromHex(smartColor, 0.16)}), `
        : "";

      rootStyle.setProperty(
        "--app-bg-image",
        `${overlay}url("${background.url}")`
      );
    } else {
      rootStyle.removeProperty("--app-bg-image");
    }
  }

  function renderUiBackgroundSettings(settings) {
    const background = settings.uiBackground || {
      type: "solid",
      color: "#f2f4ef",
      gradientStart: "#edf4ee",
      gradientEnd: "#e4edf6",
      imagePath: null,
      url: null
    };
    const type = ["solid", "gradient", "image"].includes(background.type)
      ? background.type
      : "solid";

    elements.uiBackgroundTypes.querySelectorAll("[data-ui-bg-type]").forEach((button) => {
      const active = button.dataset.uiBgType === type;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    elements.uiBgSolidRow.hidden = type !== "solid";
    elements.uiBgGradientRow.hidden = type !== "gradient";
    elements.uiBgImageRow.hidden = type !== "image";
    elements.uiBgSolidColor.value = background.color || "#f2f4ef";
    elements.uiBgSolidValue.textContent = (background.color || "#f2f4ef").toUpperCase();
    elements.uiBgGradientStart.value = background.gradientStart || "#edf4ee";
    elements.uiBgGradientEnd.value = background.gradientEnd || "#e4edf6";

    if (elements.uiBgPreview) {
      elements.uiBgPreview.style.backgroundImage = background.url
        ? `url("${background.url}")`
        : "";
      elements.uiBgPreview.classList.toggle("is-empty", !background.url);
    }

    elements.uiBgImageName.textContent = getBackgroundFileName(background.imagePath);

    const locked = Boolean(settings.smartTheme && settings.smartTheme.enabled);
    elements.uiBackgroundTypes.classList.toggle("is-disabled", locked);
    elements.uiBackgroundTypes.querySelectorAll("button").forEach((button) => {
      button.disabled = locked;
    });
    elements.uiBgSolidColor.disabled = locked;
    elements.uiBgGradientStart.disabled = locked;
    elements.uiBgGradientEnd.disabled = locked;
    elements.uiBgGradientPresets.querySelectorAll("button").forEach((button) => {
      button.disabled = locked;
    });
    elements.uiBgPickButton.disabled = locked;
    elements.uiBgClearButton.disabled = locked || !background.imagePath;
    elements.uiBackgroundBlock.classList.toggle("is-disabled", locked);

    if (elements.uiBackgroundLockedNote) {
      elements.uiBackgroundLockedNote.hidden = !locked;
    }

    applyUiBackground(background, settings.smartThemeState || {});
  }

  function readRecentOrganized() {
    try {
      const raw = window.localStorage.getItem(RECENT_ORGANIZED_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter((item) => item && typeof item.name === "string" && item.name)
        .map((item) => ({
          name: item.name,
          category: typeof item.category === "string" ? item.category : "",
          kind: item.kind === "folder" ? "folder" : "file",
          at: Number(item.at) || Date.now()
        }))
        .slice(0, 12);
    } catch (error) {
      return [];
    }
  }

  function writeRecentOrganized(items) {
    try {
      window.localStorage.setItem(
        RECENT_ORGANIZED_KEY,
        JSON.stringify(items.slice(0, 12))
      );
    } catch (error) {
      // localStorage 不可用时只保留本次会话内的记录
    }
  }

  function formatRecentOrganizedTime(value) {
    const timestamp = Number(value);
    if (!Number.isFinite(timestamp)) return "";

    const diff = Math.max(0, Date.now() - timestamp);
    if (diff < 60 * 1000) return "刚刚";
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} 小时前`;

    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  function createDashboardRecentItem({ name, meta, icon, tone }) {
    const item = document.createElement("li");
    item.className = "dashboard-recent-item";

    const iconWrap = document.createElement("span");
    iconWrap.className = `dashboard-recent-icon tone-${tone || "blue"}`;
    iconWrap.setAttribute("aria-hidden", "true");
    iconWrap.append(createIcon(icon, "icon"));

    const copy = document.createElement("span");
    copy.className = "dashboard-recent-copy";

    const title = document.createElement("span");
    title.className = "dashboard-recent-name";
    title.textContent = name;
    title.title = name;

    const description = document.createElement("span");
    description.className = "dashboard-recent-meta";
    description.textContent = meta;

    copy.append(title, description);
    item.append(iconWrap, copy);
    return item;
  }

  let dashboardRecentToken = 0;

  async function renderDashboardRecent() {
    if (!elements.dashRecentList) return;

    const token = ++dashboardRecentToken;
    elements.dashRecentList.replaceChildren();

    if (recentOrganized.length > 0) {
      const items = recentOrganized.slice(0, 3);

      items.forEach((item) => {
        const meta = [
          CATEGORY_META[item.category] ? CATEGORY_META[item.category].label : "文件",
          formatRecentOrganizedTime(item.at)
        ].filter(Boolean).join(" · ");

        elements.dashRecentList.append(createDashboardRecentItem({
          name: item.name,
          meta,
          icon: CATEGORY_ICON_NAMES[item.category] || (item.kind === "folder" ? "folder" : "document"),
          tone: CATEGORY_TONES[item.category] || "yellow"
        }));
      });

      if (elements.dashRecentCount) {
        elements.dashRecentCount.textContent = String(recentOrganized.length);
      }

      return;
    }

    if (!api || typeof api.getHistory !== "function") {
      elements.dashRecentList.append(createDashboardRecentEmpty());
      if (elements.dashRecentCount) elements.dashRecentCount.textContent = "0";
      return;
    }

    try {
      const result = await api.getHistory();
      if (token !== dashboardRecentToken) return;

      const runs = result && result.ok && Array.isArray(result.runs)
        ? result.runs.slice(0, 3)
        : [];

      if (runs.length === 0) {
        elements.dashRecentList.append(createDashboardRecentEmpty());
        if (elements.dashRecentCount) elements.dashRecentCount.textContent = "0";
        return;
      }

      runs.forEach((run) => {
        elements.dashRecentList.append(createDashboardRecentItem({
          name: `${run.itemCount || 0} 个文件`,
          meta: `${historyStatusLabel(run.status)} · ${formatHistoryTime(run.createdAt)}`,
          icon: "clock",
          tone: "purple"
        }));
      });

      if (elements.dashRecentCount) {
        elements.dashRecentCount.textContent = String(runs.length);
      }
    } catch (error) {
      if (token !== dashboardRecentToken) return;
      elements.dashRecentList.append(createDashboardRecentEmpty());
      if (elements.dashRecentCount) elements.dashRecentCount.textContent = "0";
    }
  }

  function createDashboardRecentEmpty() {
    const empty = document.createElement("li");
    empty.className = "dashboard-recent-empty";
    empty.textContent = "还没有整理记录";
    return empty;
  }

  function rememberOrganized(entries) {
    if (!Array.isArray(entries) || entries.length === 0) return;

    const normalized = entries
      .filter((entry) => entry && typeof entry.name === "string" && entry.name)
      .map((entry) => ({
        name: entry.name,
        category: typeof entry.category === "string" ? entry.category : "",
        kind: entry.kind === "folder" ? "folder" : "file",
        at: Number(entry.at) || Date.now()
      }));

    if (normalized.length === 0) return;

    recentOrganized = normalized.concat(recentOrganized).slice(0, 12);
    writeRecentOrganized(recentOrganized);
    renderDashboardRecent();
  }

  function getDashboardWidget(widgetKey) {
    if (!floatingSettings || !Array.isArray(floatingSettings.widgets)) return null;
    return floatingSettings.widgets.find((widget) => widget.key === widgetKey) || null;
  }

  function updateDashboardClock() {
    if (!elements.dashClockValue) return;

    const now = new Date();
    elements.dashClockValue.textContent = now.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    if (elements.dashClockMeta) {
      elements.dashClockMeta.textContent = now.toLocaleDateString("zh-CN", {
        month: "long",
        day: "numeric",
        weekday: "short"
      });
    }
  }

  let isPrivacyMode = false;

  function applyMainPrivacyMode(active) {
    isPrivacyMode = Boolean(active);
    window.isPrivacyMode = isPrivacyMode;
    document.body.classList.toggle("privacy-active", isPrivacyMode);
  }

  function updateDashboardFromSettings() {
    const hasSettings = Boolean(floatingSettings && Array.isArray(floatingSettings.widgets));
    const privacyActive = hasSettings && Boolean(floatingSettings.privacyActive);

    if (hasSettings) {
      applyMainPrivacyMode(privacyActive);
    }

    const todo = getDashboardWidget("todo");
    const pomodoro = getDashboardWidget("pomodoro");

    refreshTodoDashboard(hasSettings, Boolean(todo && todo.enabled));

    if (elements.dashFocusMeta) {
      elements.dashFocusMeta.textContent = !hasSettings
        ? "正在读取番茄钟状态…"
        : pomodoro && pomodoro.enabled
          ? "25 分钟专注，计时可在桌面组件中开始。"
          : "番茄钟组件当前未开启。";
    }

    if (elements.dashPrivacyMeta) {
      elements.dashPrivacyMeta.textContent = !hasSettings
        ? "正在读取防窥状态…"
        : privacyActive
          ? "文件名与图标已全局模糊，点击恢复"
          : "点击一键模糊文件名与图标";
    }

    if (elements.dashPrivacyValue) {
      elements.dashPrivacyValue.textContent = !hasSettings
        ? "—"
        : privacyActive
          ? "已打码"
          : "未打码";
    }

    if (elements.dashPrivacyCard) {
      elements.dashPrivacyCard.classList.toggle("is-active", privacyActive);
      elements.dashPrivacyCard.setAttribute("aria-disabled", String(!hasSettings));
      elements.dashPrivacyCard.setAttribute("aria-pressed", String(privacyActive));
      elements.dashPrivacyCard.setAttribute(
        "aria-label",
        !hasSettings
          ? "防窥模式，正在读取状态"
          : privacyActive
            ? "防窥模式已开启，点击恢复桌面内容"
            : "防窥模式已关闭，点击模糊文件名与图标"
      );
      elements.dashPrivacyCard.title = !hasSettings
        ? "正在读取防窥状态"
        : privacyActive
          ? "点击恢复桌面内容"
          : "点击一键打码";
    }
  }

  let dashboardPrivacyBusy = false;

  async function toggleDashboardPrivacy() {
    if (!api || !elements.dashPrivacyCard || dashboardPrivacyBusy) return;

    if (!floatingSettings) {
      await refreshFloatingSettings();
    }

    if (!floatingSettings) {
      setStatus("无法读取桌面组件状态。", "error");
      return;
    }

    const target = !Boolean(floatingSettings.privacyActive);
    dashboardPrivacyBusy = true;
    elements.dashPrivacyCard.setAttribute("aria-disabled", "true");

    try {
      const result = await api.setPrivacyMode(target);

      if (result && result.ok) {
        if (result.settings) floatingSettings = result.settings;
        updateDashboardFromSettings();
        setStatus(
          target ? "已开启访客防窥，桌面内容已打码。" : "已关闭访客防窥。",
          "success"
        );
      } else {
        setStatus(
          result && result.error ? result.error : "无法切换防窥模式。",
          "error"
        );
      }
    } catch (error) {
      setStatus("无法切换防窥模式。", "error");
    } finally {
      dashboardPrivacyBusy = false;
      updateDashboardFromSettings();
    }
  }

  function setPersonalizeOverviewMeta() {
    const meta = PAGE_META.personalize;

    if (elements.pageTitle && elements.pageSubtitle && meta) {
      elements.pageTitle.textContent = meta.title;
      elements.pageSubtitle.textContent = meta.subtitle;
    }
  }

  async function showNotesHistoryFromDesktop() {
    pendingNotesHistoryFocus = true;
    clearSearch();

    if (currentPage !== "personalize") {
      await showPage("personalize");
    } else {
      await refreshFloatingSettings();
    }

    if (!floatingSettings) {
      pendingNotesHistoryFocus = false;
      setStatus("无法读取随手记设置。", "error");
      return;
    }

    openPersonalizeDetail("notes");
  }

  async function openComponentSettingsFromDesktop(payload) {
    if (!payload || !payload.key) return;

    clearSearch();

    if (payload.kind === "widget") {
      pendingNotesHistoryFocus = payload.key === "notes" ? pendingNotesHistoryFocus : false;

      if (currentPage !== "personalize") {
        await showPage("personalize");
      } else {
        await refreshFloatingSettings();
      }

      if (floatingSettings) openPersonalizeDetail(payload.key);
      return;
    }

    if (payload.kind === "category") {
      if (currentPage !== "personalize") {
        await showPage("personalize");
      } else {
        await refreshFloatingSettings();
      }

      if (floatingSettings) openCategoryDetail(payload.key);
    }
  }

  function openPersonalizeDetail(widgetKey) {
    const widget = floatingSettings &&
      Array.isArray(floatingSettings.widgets)
      ? floatingSettings.widgets.find((item) => item.key === widgetKey)
      : null;
    const meta = PERSONALIZE_META[widgetKey];

    if (!widget || !meta) return;

    lastPersonalizeFocus = document.activeElement;
    personalizeDetailKey = widgetKey;
    personalizeDetailKind = "widget";
    elements.personalizeOverview.hidden = true;
    elements.personalizeDetail.hidden = false;
    elements.content.scrollTop = 0;
    elements.pageTitle.textContent = "组件库";
    elements.pageSubtitle.textContent = "打开组件，并调整它在桌面上的显示方式。";
    if (elements.personalizeDetailTitle) {
      elements.personalizeDetailTitle.textContent = widget.label;
    }
    renderPersonalizeDetail(floatingSettings);
    applySearchFilter();

    if (elements.personalizeBack) elements.personalizeBack.focus();
  }

  function openCategoryDetail(categoryKey) {
    const category = floatingSettings &&
      Array.isArray(floatingSettings.categories)
      ? floatingSettings.categories.find((item) => item.key === categoryKey)
      : null;

    if (!category) return;

    lastPersonalizeFocus = document.activeElement;
    personalizeDetailKey = categoryKey;
    personalizeDetailKind = "category";
    elements.personalizeOverview.hidden = true;
    elements.personalizeDetail.hidden = false;
    elements.content.scrollTop = 0;
    elements.pageTitle.textContent = "组件库";
    elements.pageSubtitle.textContent = "打开组件，并调整它在桌面上的显示方式。";
    if (elements.personalizeDetailTitle) {
      elements.personalizeDetailTitle.textContent = category.label;
    }
    renderPersonalizeDetail(floatingSettings);
    applySearchFilter();

    if (elements.personalizeBack) elements.personalizeBack.focus();
  }

  function closePersonalizeDetail({ restoreFocus = true } = {}) {
    if (!personalizeDetailKey) return;

    personalizeDetailKey = null;
    personalizeDetailKind = "widget";
    elements.personalizeOverview.hidden = false;
    elements.personalizeDetail.hidden = true;
    elements.personalizeDetailContent.replaceChildren();
    elements.content.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth"
    });
    setPersonalizeOverviewMeta();
    applySearchFilter();

    if (
      restoreFocus &&
      lastPersonalizeFocus &&
      lastPersonalizeFocus.isConnected &&
      typeof lastPersonalizeFocus.focus === "function"
    ) {
      lastPersonalizeFocus.focus({ preventScroll: true });
    }

    lastPersonalizeFocus = null;
  }

  function renderPersonalizeCards(widgets, categories = []) {
    if (!elements.personalizeCardList) return;

    const order = [
      "clock",
      "music",
      "notes",
      "todo",
      "calendar",
      "pomodoro",
      "quick",
      "clipboard",
      "search"
    ];
    const sorted = widgets.slice().sort((left, right) => {
      const leftIndex = order.indexOf(left.key);
      const rightIndex = order.indexOf(right.key);
      return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
    });

    elements.personalizeCardList.replaceChildren();

    sorted.forEach((widget) => {
      const meta = PERSONALIZE_META[widget.key];

      if (!meta) return;

      const card = document.createElement("article");
      card.className = `ui-card grid-card personalize-card tone-${WIDGET_TONES[widget.key] || "blue"}`;
      card.dataset.widgetKey = widget.key;
      card.dataset.componentEnabled = String(widget.enabled);
      card.classList.toggle("is-enabled", widget.enabled);
      card.classList.toggle("is-visible", widget.visible);
      card.hidden = showOnlyDisabledComponents && widget.enabled;

      const openButton = document.createElement("button");
      openButton.type = "button";
      openButton.className = "personalize-card-hit";
      openButton.setAttribute(
        "aria-label",
        `打开「${widget.label}」的组件设置`
      );
      openButton.addEventListener("click", () => {
        openPersonalizeDetail(widget.key);
      });

      const visual = document.createElement("span");
      visual.className = "personalize-card-icon";
      visual.setAttribute("aria-hidden", "true");
      visual.append(createIcon(meta.icon, "icon"));

      const copy = document.createElement("div");
      copy.className = "personalize-card-copy";

      const title = document.createElement("h3");
      title.textContent = widget.label;

      const description = document.createElement("p");
      description.textContent = meta.description;

      copy.append(title, description);

      const toggleArea = document.createElement("div");
      toggleArea.className = "personalize-card-toggle";

      const toggle = createSwitch({
        checked: widget.enabled,
        label: `${widget.label}：${widget.enabled ? "在桌面显示" : "不在桌面显示"}`,
        onChange: (checked) => changeFloatingWidget(widget.key, checked)
      });

      toggleArea.append(toggle);
      card.append(openButton, visual, copy, toggleArea);
      elements.personalizeCardList.append(card);
    });

    categories.forEach((category) => {
      const card = document.createElement("article");
      card.className = `ui-card grid-card personalize-card category-library-card tone-${CATEGORY_TONES[category.key] || "yellow"}`;
      card.dataset.categoryKey = category.key;
      card.dataset.folderBadge = category.mappedFolder ? "1" : "";
      card.dataset.componentEnabled = String(!category.removed);
      card.classList.toggle("is-enabled", !category.removed);
      card.classList.toggle("is-visible", category.visible);
      card.hidden = showOnlyDisabledComponents && !category.removed;

      const openButton = document.createElement("button");
      openButton.type = "button";
      openButton.className = "personalize-card-hit";
      openButton.setAttribute("aria-label", `打开「${category.label}」的分类设置`);
      openButton.addEventListener("click", () => {
        openCategoryDetail(category.key);
      });

      const visual = document.createElement("span");
      visual.className = "personalize-card-icon";
      visual.setAttribute("aria-hidden", "true");
      visual.append(createIcon(
        CATEGORY_ICON_NAMES[category.key] || "folder",
        "icon"
      ));

      const copy = document.createElement("div");
      copy.className = "personalize-card-copy";

      const title = document.createElement("h3");
      title.textContent = category.label;

      const description = document.createElement("p");
      description.textContent = `${category.itemCount || 0} 个文件`;

      copy.append(title, description);

      const toggleArea = document.createElement("div");
      toggleArea.className = "personalize-card-toggle";

      const toggle = createSwitch({
        checked: !category.removed,
        label: `${category.label}：${category.removed ? "隐藏" : "在桌面显示"}`,
        onChange: (checked) => changeFloatingCategory(category.key, !checked)
      });

      toggleArea.append(toggle);
      card.append(openButton, visual, copy, toggleArea);
      elements.personalizeCardList.append(card);
    });

    const disabledCount = [
      ...widgets.filter((widget) => !widget.enabled),
      ...categories.filter((category) => category.removed)
    ].length;

    if (elements.componentFilterCount) {
      elements.componentFilterCount.textContent = showOnlyDisabledComponents
        ? `仅显示 ${disabledCount} 个未开启组件`
        : `共 ${widgets.length + categories.length} 个组件 · ${disabledCount} 个未开启`;
    }

    updateComponentFilterState();
  }

  function updateComponentFilterState() {
    if (!elements.filterDisabledComponents) return;

    elements.filterDisabledComponents.classList.toggle(
      "is-active",
      showOnlyDisabledComponents
    );
    elements.filterDisabledComponents.setAttribute(
      "aria-pressed",
      String(showOnlyDisabledComponents)
    );
  }

  function createPersonalizeSettingRow({ icon, title, description, control }) {
    const row = document.createElement("div");
    row.className = "settings-row";
    const iconNode = createIcon(icon);
    iconNode.classList.add(`tone-${ICON_TONES[icon] || "blue"}`);

    row.append(
      iconNode,
      (() => {
        const copy = document.createElement("div");
        copy.className = "settings-copy";
        const heading = document.createElement("h4");
        heading.textContent = title;
        const text = document.createElement("p");
        text.textContent = description;
        copy.append(heading, text);
        return copy;
      })(),
      control
    );

    return row;
  }

  function formatNotesTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const now = new Date();
    const sameDay = date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

    return sameDay
      ? `今天 ${time}`
      : `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${time}`;
  }

  function createNotesHistorySection() {
    const section = document.createElement("section");
    section.className = "ui-card list-group settings-group notes-history-section tone-yellow";
    section.id = "notesHistorySection";

    const head = document.createElement("div");
    head.className = "notes-history-toolbar";
    const heading = document.createElement("h3");
    heading.textContent = "历史记录";
    head.append(heading);

    const openFolderButton = createSettingsButton("打开随手记文件夹", () => {
      openNotesFolder();
    });
    head.append(openFolderButton);

    const list = document.createElement("div");
    list.className = "notes-history-list";
    const loading = document.createElement("p");
    loading.className = "notes-history-empty";
    loading.textContent = "正在读取随手记历史…";
    list.append(loading);

    section.append(head, list);

    loadNotesHistoryInto(list);

    return section;
  }

  function splitNoteEditorText(text) {
    const lines = String(text || "").split("\n");
    const titleIndex = lines.findIndex((line) => line.trim());

    if (titleIndex === -1) {
      return { title: "", body: "" };
    }

    return {
      title: lines[titleIndex].trim(),
      body: lines.slice(titleIndex + 1).join("\n")
    };
  }

  function isAnyOtherModalOpen() {
    return Boolean(
      (elements.noteReaderModal && !elements.noteReaderModal.hidden) ||
      (elements.noteEditorModal && !elements.noteEditorModal.hidden) ||
      (elements.historyModal && !elements.historyModal.hidden) ||
      (elements.renameDialog && !elements.renameDialog.hidden) ||
      (elements.scanModal && !elements.scanModal.hidden) ||
      (elements.neteaseAdapterModal && !elements.neteaseAdapterModal.hidden) ||
      (elements.donateModal && !elements.donateModal.hidden)
    );
  }

  /* ---------- 关于页：赞赏与支持 ---------- */

  const DONATE_LINKS = {
    afdian: "https://afdian.net/",
    github: "https://github.com/sponsors",
    bilibili: "https://space.bilibili.com/"
  };

  function openDonateModal() {
    if (!elements.donateModal) return;

    elements.donateModal.hidden = false;
    document.body.classList.add("modal-open");
    if (elements.closeDonateButton) elements.closeDonateButton.focus();
  }

  function closeDonateModal() {
    if (!elements.donateModal || elements.donateModal.hidden) return;

    elements.donateModal.hidden = true;

    if (!isAnyOtherModalOpen()) {
      document.body.classList.remove("modal-open");
    }

    if (elements.aboutDonateCard) elements.aboutDonateCard.focus();
  }

  function openDonateLink(kind) {
    const url = DONATE_LINKS[kind];
    if (!url) return;

    if (api && typeof api.openExternal === "function") {
      api.openExternal(url).catch(() => {});
      return;
    }

    window.open(url, "_blank", "noopener");
  }

  function setupDonateEntry() {
    if (elements.aboutDonateCard) {
      elements.aboutDonateCard.addEventListener("click", openDonateModal);
    }
    if (elements.closeDonateButton) {
      elements.closeDonateButton.addEventListener("click", closeDonateModal);
    }
    if (elements.donateModal) {
      elements.donateModal.addEventListener("mousedown", (event) => {
        if (event.target === elements.donateModal) closeDonateModal();
      });
    }
    if (elements.donateAfdianButton) {
      elements.donateAfdianButton.addEventListener("click", () => openDonateLink("afdian"));
    }
    if (elements.donateGithubButton) {
      elements.donateGithubButton.addEventListener("click", () => openDonateLink("github"));
    }
    if (elements.donateBilibiliButton) {
      elements.donateBilibiliButton.addEventListener("click", () => openDonateLink("bilibili"));
    }

    // 赞赏码是占位资源，缺图时退化成虚线占位块而不是破图。
    for (const image of [elements.donateWechatImage, elements.donateAlipayImage]) {
      if (!image) continue;

      const markMissing = () => image.classList.add("is-missing");
      image.addEventListener("error", markMissing);
      if (image.complete && image.naturalWidth === 0) markMissing();
    }
  }

  function closeNoteReader({ restoreFocus = true } = {}) {
    if (!elements.noteReaderModal || elements.noteReaderModal.hidden) return;

    elements.noteReaderModal.hidden = true;
    activeNoteReader = null;

    if (!isAnyOtherModalOpen()) {
      document.body.classList.remove("modal-open");
    }

    if (
      restoreFocus &&
      noteReaderLastFocus &&
      noteReaderLastFocus.isConnected &&
      typeof noteReaderLastFocus.focus === "function"
    ) {
      noteReaderLastFocus.focus({ preventScroll: true });
    }

    noteReaderLastFocus = null;
  }

  function openNoteReader(entry, list) {
    if (!entry || !elements.noteReaderModal) return;

    const parts = splitNoteEditorText(entry.text);
    activeNoteReader = { entry, list };
    noteReaderLastFocus = document.activeElement;
    elements.noteReaderTitle.textContent = entry.title || "无标题随手记";
    elements.noteReaderMeta.textContent = formatNotesTime(entry.savedAt) || "未知时间";
    elements.noteReaderContent.textContent = parts.body.trim() ||
      (parts.title ? "这条随手记只有标题。" : "（空白内容）");
    if (elements.noteReaderCopy) {
      elements.noteReaderCopy.disabled = false;
      elements.noteReaderCopy.textContent = "📋 复制全文";
    }
    elements.noteReaderModal.hidden = false;
    document.body.classList.add("modal-open");
    requestAnimationFrame(() => {
      if (elements.noteReaderClose) elements.noteReaderClose.focus();
    });
  }

  async function copyActiveNote() {
    if (!activeNoteReader || !api || typeof api.copyNote !== "function") return;

    const button = elements.noteReaderCopy;
    if (button) button.disabled = true;

    try {
      const result = await api.copyNote(activeNoteReader.entry.id);

      if (!result || !result.ok) {
        setStatus(result && result.error ? result.error : "无法复制随手记。", "error");
        return;
      }

      if (button) button.textContent = "已复制";
      setTimeout(() => {
        if (button && button.isConnected) {
          button.textContent = "📋 复制全文";
          button.disabled = false;
        }
      }, 1600);
    } catch (error) {
      setStatus("无法复制随手记。", "error");
    } finally {
      if (button && button.textContent !== "已复制") button.disabled = false;
    }
  }

  function editActiveNoteReader() {
    if (!activeNoteReader) return;
    const { entry, list } = activeNoteReader;
    closeNoteReader({ restoreFocus: false });
    openNoteEditor(entry, list);
  }

  function closeNoteEditor() {
    if (!elements.noteEditorModal) return;
    activeNoteEditor = null;
    elements.noteEditorModal.hidden = true;

    if (!isAnyOtherModalOpen()) {
      document.body.classList.remove("modal-open");
    }
  }

  function openNoteEditor(entry, list, { focusTitle = false } = {}) {
    if (!entry || !elements.noteEditorModal) return;

    activeNoteEditor = { entry, list };
    const parts = splitNoteEditorText(entry.text);
    elements.noteEditorTitleInput.value = parts.title;
    elements.noteEditorBodyInput.value = parts.body;
    elements.noteEditorModal.hidden = false;
    document.body.classList.add("modal-open");
    requestAnimationFrame(() => {
      if (focusTitle) {
        elements.noteEditorTitleInput.focus();
        elements.noteEditorTitleInput.select();
      } else {
        elements.noteEditorBodyInput.focus();
      }
    });
  }

  async function saveNoteEditor() {
    if (!activeNoteEditor || !api) return;

    const token = ++notesEditorRequestToken;
    const title = elements.noteEditorTitleInput.value.trim();

    if (!title) {
      setStatus("标题不能为空。", "error");
      elements.noteEditorTitleInput.focus();
      return;
    }

    const body = elements.noteEditorBodyInput.value;
    const text = body.trim() ? `${title}\n${body}` : title;
    elements.noteEditorSave.disabled = true;
    elements.noteEditorSave.textContent = "保存中…";

    try {
      const result = await api.updateNote(activeNoteEditor.entry.id, text);

      if (token !== notesEditorRequestToken) return;

      if (!result || !result.ok) {
        setStatus(result && result.error ? result.error : "无法保存随手记。", "error");
        return;
      }

      const list = activeNoteEditor.list;
      closeNoteEditor();
      setStatus("随手记已更新。", "success");
      if (list) loadNotesHistoryInto(list);
    } catch (error) {
      setStatus("无法保存随手记。", "error");
    } finally {
      elements.noteEditorSave.disabled = false;
      elements.noteEditorSave.textContent = "保存修改";
    }
  }

  async function loadNotesHistoryInto(list) {
    if (!api || !list) return;

    const token = ++notesHistoryRequestToken;

    try {
      const result = await api.listNotes();

      if (token !== notesHistoryRequestToken || !list.isConnected) return;

      if (!result || !result.ok) {
        throw new Error(result && result.error ? result.error : "读取失败");
      }

      const entries = Array.isArray(result.entries) ? result.entries : [];
      list.replaceChildren();

      if (entries.length === 0) {
        const empty = document.createElement("p");
        empty.className = "notes-history-empty";
        empty.textContent = "还没有保存过随手记。";
        list.append(empty);
        return;
      }

      for (const entry of entries) {
        const row = document.createElement("div");
        row.className = "notes-history-row";

        const icon = document.createElement("span");
        icon.className = "settings-icon tone-yellow";
        icon.setAttribute("aria-hidden", "true");
        icon.append(createIcon("note", "icon"));

        const copy = document.createElement("div");
        copy.className = "notes-history-copy";

        const title = document.createElement("span");
        title.className = "notes-history-title";
        title.textContent = entry.listTitle || entry.title || "无标题随手记";
        title.title = entry.text || "";

        const preview = document.createElement("span");
        preview.className = "notes-history-preview";
        preview.textContent = entry.preview || "（空白内容）";

        const meta = document.createElement("span");
        meta.className = "notes-history-meta";
        meta.textContent = formatNotesTime(entry.savedAt);

        copy.append(title, preview, meta);

        const actions = document.createElement("div");
        actions.className = "notes-history-actions";

        const reveal = createSettingsButton("打开位置", () => {
          api.revealNote(entry.path).then((revealResult) => {
            if (!revealResult || !revealResult.ok) {
              setStatus(
                revealResult && revealResult.error
                  ? revealResult.error
                  : "无法打开随手记位置。",
                "error"
              );
            }
          }).catch(() => setStatus("无法打开随手记位置。", "error"));
        });

        const remove = createSettingsButton("删除", async () => {
          if (!remove.classList.contains("is-armed")) {
            remove.classList.add("is-armed");
            remove.textContent = "确认删除";
            setTimeout(() => {
              if (!remove.isConnected) return;
              remove.classList.remove("is-armed");
              remove.textContent = "删除";
            }, 2600);
            return;
          }

          try {
            const deleteResult = await api.deleteNote(entry.id);

            if (deleteResult && deleteResult.ok) {
              setStatus("随手记记录已删除。", "success");
              loadNotesHistoryInto(list);
            } else {
              setStatus(
                deleteResult && deleteResult.error
                  ? deleteResult.error
                  : "无法删除随手记。",
                "error"
              );
            }
          } catch (error) {
            setStatus("无法删除随手记。", "error");
          }
        });

        actions.append(reveal, remove);
        row.tabIndex = 0;
        row.setAttribute("role", "button");
        row.title = "点击进入阅读模式";
        row.addEventListener("click", (event) => {
          if (event.target.closest(".notes-history-actions")) return;
          openNoteReader(entry, list);
        });
        row.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          if (event.target.closest(".notes-history-actions")) return;
          event.preventDefault();
          openNoteReader(entry, list);
        });
        row.append(icon, copy, actions);
        list.append(row);
      }
    } catch (error) {
      if (token !== notesHistoryRequestToken || !list.isConnected) return;

      list.replaceChildren();
      const failed = document.createElement("p");
      failed.className = "notes-history-empty";
      failed.textContent = "无法读取随手记历史。";
      list.append(failed);
    }
  }

  async function openNotesFolder() {
    if (!api) return;

    try {
      const result = await api.openNotesFolder();

      if (!result || !result.ok) {
        setStatus(result && result.error ? result.error : "无法打开随手记文件夹。", "error");
      }
    } catch (error) {
      setStatus("无法打开随手记文件夹。", "error");
    }
  }

  function renderPersonalizeDetail(settings) {
    if (!personalizeDetailKey || !settings) return;

    if (personalizeDetailKind === "category") {
      renderCategoryDetail(settings);
      return;
    }

    const widget = Array.isArray(settings.widgets)
      ? settings.widgets.find((item) => item.key === personalizeDetailKey)
      : null;
    const meta = widget ? PERSONALIZE_META[widget.key] : null;

    if (!widget || !meta) {
      closePersonalizeDetail({ restoreFocus: false });
      return;
    }

    if (elements.personalizeDetailTitle) {
      elements.personalizeDetailTitle.textContent = widget.label;
    }

    const fragment = document.createDocumentFragment();
    const manageGroup = document.createElement("section");
    manageGroup.className = `ui-card list-group settings-group tone-${WIDGET_TONES[widget.key] || "blue"}`;

    const enabledSwitch = createSwitch({
      checked: widget.enabled,
      label: `${widget.label}：${widget.enabled ? "在桌面显示" : "不在桌面显示"}`,
      onChange: (checked) => changeFloatingWidget(widget.key, checked)
    });

    manageGroup.append(createPersonalizeSettingRow({
      icon: "eye",
      title: "在桌面显示",
      description: "关闭后组件会从桌面层隐藏，内容仍会保留。",
      control: enabledSwitch
    }));

    const lockedSwitch = createSwitch({
      checked: widget.locked,
      label: `${widget.label}锁定`,
      onChange: (checked) => changeFloatingWidgetLocked(widget.key, checked)
    });

    manageGroup.append(createPersonalizeSettingRow({
      icon: "layout",
      title: "锁定位置与大小",
      description: "锁定后无法拖动或缩放；可在设置中解锁。",
      control: lockedSwitch
    }));

    const nameControls = document.createElement("div");
    nameControls.className = "settings-item-actions";
    nameControls.append(createSettingsButton("编辑名称", () => {
      openRenameDialog({
        kind: "widget",
        key: widget.key,
        label: widget.label,
        defaultLabel: widget.defaultLabel || widget.label
      });
    }));

    manageGroup.append(createPersonalizeSettingRow({
      icon: "document",
      title: "组件名称",
      description: widget.name
        ? `当前自定义名称：${widget.name}`
        : `当前使用默认名称：${widget.defaultLabel || widget.label}`,
      control: nameControls
    }));

    const backgroundControls = document.createElement("div");
    backgroundControls.className = "settings-item-actions";
    backgroundControls.append(
      createSettingsButton("选择图片", () => pickWidgetBackground(widget.key)),
      (() => {
        const button = createSettingsButton("清除", () => {
          clearWidgetBackground(widget.key);
        });
        button.disabled = !widget.hasBackground;
        return button;
      })()
    );

    manageGroup.append(createPersonalizeSettingRow({
      icon: "image",
      title: "背景图片",
      description: widget.hasBackground
        ? `当前：${getBackgroundFileName(widget.backgroundName)}`
        : "使用本地图片作为组件背景。",
      control: backgroundControls
    }));

    const bingControls = document.createElement("div");
    bingControls.className = "settings-item-actions";
    bingControls.append(
      createSettingsButton("设为今日壁纸", () => setWidgetBingBackground(widget.key, false)),
      createSettingsButton("换一张", () => setWidgetBingBackground(widget.key, true))
    );

    manageGroup.append(createPersonalizeSettingRow({
      icon: "palette",
      title: "Bing 每日壁纸",
      description: "使用 Bing 当天的图片作为背景。",
      control: bingControls
    }));

    fragment.append(manageGroup);

    if (widget.key === "clock") {
      const contentGroup = document.createElement("section");
      contentGroup.className = "ui-card list-group settings-group tone-blue";

      const block = document.createElement("div");
      block.className = "settings-block";
      const blockHead = document.createElement("div");
      blockHead.className = "settings-block-head";
      const blockIcon = document.createElement("span");
      blockIcon.className = "settings-icon tone-blue";
      blockIcon.setAttribute("aria-hidden", "true");
      blockIcon.append(createIcon("clock", "icon"));
      const blockCopy = document.createElement("div");
      blockCopy.className = "settings-copy";
      const blockHeading = document.createElement("h4");
      blockHeading.textContent = "时钟内容";
      const blockDescription = document.createElement("p");
      blockDescription.textContent = "设置时间格式、日期格式和自定义文字。";
      blockCopy.append(blockHeading, blockDescription);
      blockHead.append(blockIcon, blockCopy);
      block.append(
        blockHead,
        createClockSettingsPanel(widget, settings.clockOptions)
      );
      contentGroup.append(block);
      fragment.append(contentGroup);
    }

    if (widget.key === "notes") {
      fragment.append(createNotesHistorySection());
    }

    if (widget.key === "todo") {
      fragment.append(createTodoManagerSection());
    }

    elements.personalizeDetailContent.replaceChildren(fragment);
    applySearchFilter();

    if (widget.key === "todo") {
      renderTodoManager();
      loadTodos();
    }

    if (pendingNotesHistoryFocus && widget.key === "notes") {
      pendingNotesHistoryFocus = false;
      requestAnimationFrame(() => {
        const section = document.querySelector("#notesHistorySection");

        if (section) {
          section.scrollIntoView({ behavior: "smooth", block: "start" });
          section.setAttribute("tabindex", "-1");
          section.focus({ preventScroll: true });
        }
      });
    }
  }

  function renderCategoryDetail(settings) {
    const category = Array.isArray(settings.categories)
      ? settings.categories.find((item) => item.key === personalizeDetailKey)
      : null;

    if (!category) {
      closePersonalizeDetail({ restoreFocus: false });
      return;
    }

    if (elements.personalizeDetailTitle) {
      elements.personalizeDetailTitle.textContent = category.label;
    }

    const fragment = document.createDocumentFragment();
    const manageGroup = document.createElement("section");
    manageGroup.className = `ui-card list-group settings-group tone-${CATEGORY_TONES[category.key] || "yellow"}`;

    const enabledSwitch = createSwitch({
      checked: !category.removed,
      label: `${category.label}：${category.removed ? "隐藏" : "在桌面显示"}`,
      onChange: (checked) => changeFloatingCategory(category.key, !checked)
    });

    manageGroup.append(createPersonalizeSettingRow({
      icon: "eye",
      title: "在桌面显示",
      description: "关闭后分类卡片会从桌面层隐藏，归属记录仍会保留。",
      control: enabledSwitch
    }));

    const nameControls = document.createElement("div");
    nameControls.className = "settings-item-actions";
    nameControls.append(createSettingsButton("编辑名称", () => {
      openRenameDialog({
        kind: "category",
        key: category.key,
        label: category.label,
        defaultLabel: category.defaultLabel || category.label
      });
    }));

    manageGroup.append(createPersonalizeSettingRow({
      icon: "document",
      title: "分类名称",
      description: category.name
        ? `当前自定义名称：${category.name}`
        : `当前使用默认名称：${category.defaultLabel || category.label}`,
      control: nameControls
    }));

    fragment.append(manageGroup);
    elements.personalizeDetailContent.replaceChildren(fragment);
    applySearchFilter();
  }

  function renderPersonalizePage(settings) {
    if (!settings || !elements.personalizeCardList) return;

    const widgets = Array.isArray(settings.widgets) ? settings.widgets : [];
    const categories = Array.isArray(settings.categories) ? settings.categories : [];
    renderPersonalizeCards(widgets, categories);

    if (personalizeDetailKey && currentPage === "personalize") {
      if (personalizeDetailKind === "category") {
        const category = categories.find((item) => item.key === personalizeDetailKey);

        if (!category) {
          closePersonalizeDetail({ restoreFocus: false });
        } else {
          elements.pageTitle.textContent = "组件库";
          elements.pageSubtitle.textContent = "打开组件，并调整它在桌面上的显示方式。";
          renderPersonalizeDetail(settings);
        }
        return;
      }

      const widget = widgets.find((item) => item.key === personalizeDetailKey);
      const meta = widget ? PERSONALIZE_META[widget.key] : null;

      if (!widget || !meta) {
        closePersonalizeDetail({ restoreFocus: false });
      } else {
        elements.pageTitle.textContent = "组件库";
        elements.pageSubtitle.textContent = "打开组件，并调整它在桌面上的显示方式。";
        renderPersonalizeDetail(settings);
      }
    }
  }

  function applyMainUiTheme(settings) {
    const smartState = settings.smartThemeState || {};
    const smartActive = Boolean(smartState.enabled && smartState.color);
    const tint = settings.tint || "system";
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    let dark = systemDark;

    if (settings.followWallpaperBrightness) {
      dark = Boolean(settings.wallpaperTheme && settings.wallpaperTheme.isDark);
    } else if (smartActive) {
      dark = smartState.source === "time" &&
        smartState.period &&
        smartState.period.key === "night";
    } else if (tint === "black") {
      dark = true;
    } else if (tint === "white") {
      dark = false;
    } else if (tint === "custom") {
      dark = isDarkHexColor(settings.customTint);
    }

    const base = dark ? DARK_UI_PALETTE : LIGHT_UI_PALETTE;
    const tintColor = smartActive
      ? smartState.color
      : tint === "custom"
        ? settings.customTint
        : null;
    const strength = smartActive ? 1.8 : 1;
    const mix = (color, ratio) => tintColor
      ? mixHexColors(color, tintColor, ratio * strength)
      : color;
    const frosted = settings.frosted !== false;
    const transparentTint = tint === "transparent" && !smartActive;
    const cardAlpha = frosted ? (transparentTint ? 0.56 : 0.84) : 1;
    const chromeAlpha = frosted ? (transparentTint ? 0.4 : 0.8) : 1;
    const rootStyle = document.documentElement.style;
    const variables = {
      "--win-bg": mix(base.bg, 0.1),
      "--win-surface": mix(base.surface, 0.06),
      "--win-card": mix(base.card, 0.04),
      "--win-card-border": mix(base.cardBorder, 0.06),
      "--win-ink": base.ink,
      "--win-ink-2": mix(base.ink2, 0.03),
      "--win-muted": base.muted,
      "--win-line": mix(base.line, 0.05),
      "--win-control-bg": mix(base.controlBg, 0.05),
      "--win-control-border": mix(base.controlBorder, 0.06),
      "--win-hover": mix(base.hover, 0.08),
      "--win-nav-active": mix(base.navActive, 0.12),
      "--win-shadow": base.shadow,
      "--ui-card-bg": rgbaFromHex(mix(base.card, 0.045), cardAlpha),
      "--ui-card-hover": rgbaFromHex(
        mix(base.hover, 0.06),
        frosted ? Math.min(1, cardAlpha + 0.08) : 1
      ),
      "--ui-chrome-bg": rgbaFromHex(mix(base.surface, 0.065), chromeAlpha),
      "--ui-tint-color": tintColor || "transparent",
      "--ui-blur": frosted ? "blur(18px)" : "none"
    };

    Object.entries(variables).forEach(([name, value]) => {
      rootStyle.setProperty(name, value);
    });

    if (smartActive) {
      const smartBgStart = mixHexColors(base.bg, smartState.color, 0.18);
      const smartBgEnd = mixHexColors(base.bg, smartState.color, 0.34);

      rootStyle.setProperty("--ui-smart-color", smartState.color);
      rootStyle.setProperty(
        "--app-bg-smart",
        `radial-gradient(circle at 86% 12%, ${rgbaFromHex(smartState.color, 0.2)}, transparent 46%), linear-gradient(135deg, ${smartBgStart}, ${smartBgEnd})`
      );
    } else {
      rootStyle.removeProperty("--ui-smart-color");
      rootStyle.removeProperty("--app-bg-smart");
    }

    document.body.classList.toggle("ui-dark", dark);
    document.body.classList.toggle("ui-light", !dark);
    document.body.classList.toggle("ui-frosted", frosted);
    document.body.classList.toggle("ui-transparent", transparentTint);
    document.body.classList.toggle("ui-smart", smartActive);
    document.body.classList.toggle(
      "performance-mode",
      Boolean(settings.performanceMode)
    );
    document.body.dataset.uiTint = tint;

    applyUiBackground(settings.uiBackground || {}, smartState);
  }

  function applyGlobalAppearance(settings) {
    if (!settings || !settings.ok) return;
    renderSmartThemeSettings(settings);
    applyMainUiTheme(settings);
    renderUiBackgroundSettings(settings);
  }

  let focusChartRange = 7;
  let focusChartRequestToken = 0;
  let focusChartBuckets = [];

  const FOCUS_CHART_RANGE_META = {
    7: { period: "最近 7 天", subtitle: "每天完成的番茄钟专注时长" },
    30: { period: "最近 1 个月", subtitle: "按天查看最近一个月的专注时长" },
    182: { period: "最近半年", subtitle: "按周汇总最近半年的专注时长" }
  };
  const FOCUS_CHART_WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const FOCUS_CHART_AXIS_STEPS = [
    5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 360, 480,
    720, 960, 1440, 2160, 2880, 4320, 5760
  ];

  function parseFocusChartDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    if (!match) return null;
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  function formatFocusChartDate(value) {
    const date = value instanceof Date ? value : parseFocusChartDate(value);
    if (!date) return "未知日期";
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  function formatFocusAxisValue(value) {
    if (value >= 1000) {
      const compact = value / 1000;
      return `${Number.isInteger(compact) ? compact : compact.toFixed(1)}k`;
    }

    return String(Math.round(value));
  }

  function createFocusChartBuckets(days, range) {
    const normalized = days.map((day) => {
      const date = parseFocusChartDate(day.date);
      return {
        date: day.date,
        parsedDate: date,
        minutes: Math.max(0, Math.round(Number(day.minutes) || 0)),
        sessions: Math.max(0, Math.round(Number(day.sessions) || 0))
      };
    }).filter((day) => day.parsedDate);

    if (range !== 182) {
      return normalized.map((day, index) => {
        let axisLabel = "";

        if (range === 7) {
          axisLabel = FOCUS_CHART_WEEKDAYS[day.parsedDate.getDay()];
        } else if (
          index === 0 ||
          index === normalized.length - 1 ||
          index % 5 === 0
        ) {
          axisLabel = `${day.parsedDate.getMonth() + 1}/${day.parsedDate.getDate()}`;
        }

        return {
          ...day,
          startDate: day.date,
          endDate: day.date,
          axisLabel,
          rangeLabel: formatFocusChartDate(day.date)
        };
      });
    }

    const buckets = [];
    let lastAxisMonth = -1;

    for (let index = 0; index < normalized.length; index += 7) {
      const chunk = normalized.slice(index, index + 7);
      if (chunk.length === 0) continue;

      const first = chunk[0];
      const last = chunk[chunk.length - 1];
      const month = first.parsedDate.getMonth();
      const axisLabel = month !== lastAxisMonth
        ? `${month + 1}月`
        : "";

      if (axisLabel) lastAxisMonth = month;

      buckets.push({
        date: first.date,
        parsedDate: first.parsedDate,
        startDate: first.date,
        endDate: last.date,
        minutes: chunk.reduce((sum, day) => sum + day.minutes, 0),
        sessions: chunk.reduce((sum, day) => sum + day.sessions, 0),
        axisLabel,
        rangeLabel: `${formatFocusChartDate(first.date)}–${formatFocusChartDate(last.date)}`
      });
    }

    return buckets;
  }

  function hideFocusChartTooltip() {
    if (elements.focusChartTooltip) {
      elements.focusChartTooltip.hidden = true;
    }
  }

  function getFocusChartYStep(maxMinutes = 0) {
    return FOCUS_CHART_AXIS_STEPS.find((candidate) => candidate * 3 >= maxMinutes) ||
      FOCUS_CHART_AXIS_STEPS[FOCUS_CHART_AXIS_STEPS.length - 1];
  }

  function showFocusChartTooltip(bucket, column) {
    if (
      !elements.focusChartTooltip ||
      !elements.focusChartTooltipValue ||
      !elements.focusChartTooltipMeta ||
      !elements.focusChartPlot ||
      !column
    ) {
      return;
    }

    const tooltip = elements.focusChartTooltip;
    const plotRect = elements.focusChartPlot.getBoundingClientRect();
    const track = column.querySelector(".focus-chart-track");
    if (!plotRect.width || !track) return;

    const trackRect = track.getBoundingClientRect();
    const maxMinutes = Math.max(0, ...focusChartBuckets.map((item) => item.minutes));
    const yMax = getFocusChartYStep(maxMinutes) * 3;
    const ratio = Math.min(1, bucket.minutes / yMax);
    const barTop = trackRect.bottom - trackRect.height * ratio;
    const centerX = trackRect.left + trackRect.width / 2 - plotRect.left;

    elements.focusChartTooltipValue.textContent =
      `${bucket.rangeLabel}：专注 ${bucket.minutes} 分钟`;
    elements.focusChartTooltipMeta.textContent = `${bucket.sessions} 个番茄钟`;

    tooltip.hidden = false;
    tooltip.classList.remove("is-below");

    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    const half = tooltipWidth / 2;
    const left = Math.min(
      Math.max(centerX, half + 8),
      Math.max(half + 8, plotRect.width - half - 8)
    );
    const relativeTop = barTop - plotRect.top;
    const placeBelow = relativeTop < tooltipHeight + 18;

    tooltip.classList.toggle("is-below", placeBelow);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${placeBelow ? relativeTop + 8 : relativeTop - 8}px`;
  }

  function renderFocusChartAxis(maxMinutes) {
    if (!elements.focusChartYAxis) return;

    const step = getFocusChartYStep(maxMinutes);
    elements.focusChartYAxis.replaceChildren();

    for (let index = 0; index < 4; index += 1) {
      const label = document.createElement("span");
      label.textContent = formatFocusAxisValue(step * (3 - index));
      elements.focusChartYAxis.append(label);
    }

    return step;
  }

  function renderFocusChartTable(buckets) {
    if (!elements.focusChartTable) return;
    elements.focusChartTable.replaceChildren();

    if (buckets.length === 0) return;

    const table = document.createElement("table");
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    const rangeHead = document.createElement("th");
    rangeHead.textContent = focusChartRange === 182 ? "周" : "日期";
    const minutesHead = document.createElement("th");
    minutesHead.textContent = "专注分钟";
    const sessionsHead = document.createElement("th");
    sessionsHead.textContent = "番茄钟";
    headRow.append(rangeHead, minutesHead, sessionsHead);
    head.append(headRow);

    const body = document.createElement("tbody");

    for (const bucket of buckets) {
      const row = document.createElement("tr");
      const rangeCell = document.createElement("td");
      rangeCell.textContent = bucket.rangeLabel;
      const minutesCell = document.createElement("td");
      minutesCell.textContent = String(bucket.minutes);
      const sessionsCell = document.createElement("td");
      sessionsCell.textContent = String(bucket.sessions);
      row.append(rangeCell, minutesCell, sessionsCell);
      body.append(row);
    }

    table.append(head, body);
    elements.focusChartTable.append(table);
  }

  function renderFocusChart(data) {
    if (!elements.focusChartBars) return;

    const days = Array.isArray(data && data.days) ? data.days : [];
    const totalMinutes = Math.max(0, Number(data && data.totalMinutes) || 0);
    const totalSessions = Math.max(0, Number(data && data.totalSessions) || 0);
    const buckets = createFocusChartBuckets(days, focusChartRange);
    focusChartBuckets = buckets;
    hideFocusChartTooltip();

    elements.focusChartTotal.textContent = totalMinutes.toLocaleString("zh-CN");
    elements.focusChartSessions.textContent = totalSessions.toLocaleString("zh-CN");
    elements.focusChartAverage.textContent = String(
      Math.round(totalMinutes / focusChartRange)
    );
    elements.focusChartEmpty.hidden = totalMinutes > 0;
    if (elements.focusChartTable && elements.focusChartTable.parentElement) {
      elements.focusChartTable.parentElement.hidden = buckets.length === 0;
    }
    elements.focusChartBars.replaceChildren();
    elements.focusChartBars.setAttribute(
      "aria-label",
      `${FOCUS_CHART_RANGE_META[focusChartRange].period}专注时长柱状图，共 ${totalMinutes} 分钟`
    );

    const maxMinutes = Math.max(0, ...buckets.map((bucket) => bucket.minutes));
    const yMax = renderFocusChartAxis(maxMinutes) * 3;

    for (const bucket of buckets) {
      const column = document.createElement("div");
      const track = document.createElement("span");
      const bar = document.createElement("span");
      const label = document.createElement("span");

      column.className = "focus-chart-column";
      column.tabIndex = 0;
      column.setAttribute("role", "img");
      column.setAttribute(
        "aria-label",
        `${bucket.rangeLabel}：专注 ${bucket.minutes} 分钟，${bucket.sessions} 个番茄钟`
      );

      track.className = "focus-chart-track";
      bar.className = "focus-chart-bar";
      bar.style.height = `${Math.max(0, Math.min(100, (bucket.minutes / yMax) * 100))}%`;
      if (bucket.minutes === 0) bar.classList.add("is-empty");
      bar.setAttribute("aria-hidden", "true");

      label.className = "focus-chart-label";
      label.textContent = bucket.axisLabel;
      if (!bucket.axisLabel) label.classList.add("is-blank");

      track.append(bar);
      column.append(track, label);
      column.addEventListener("mouseenter", () => showFocusChartTooltip(bucket, column));
      column.addEventListener("focus", () => showFocusChartTooltip(bucket, column));
      column.addEventListener("mouseleave", hideFocusChartTooltip);
      column.addEventListener("blur", hideFocusChartTooltip);
      elements.focusChartBars.append(column);
    }

    renderFocusChartTable(buckets);
  }

  async function loadFocusChart(range = focusChartRange) {
    if (!api || typeof api.getPomodoroHeatmap !== "function") return;

    focusChartRange = [7, 30, 182].includes(Number(range))
      ? Number(range)
      : 7;
    const meta = FOCUS_CHART_RANGE_META[focusChartRange];
    const token = ++focusChartRequestToken;

    if (elements.focusChartRanges) {
      elements.focusChartRanges
        .querySelectorAll("[data-focus-chart-range]")
        .forEach((button) => {
          button.setAttribute(
            "aria-pressed",
            String(Number(button.dataset.focusChartRange) === focusChartRange)
          );
        });
    }

    if (elements.focusChartPeriod) elements.focusChartPeriod.textContent = meta.period;
    if (elements.focusChartSubtitle) elements.focusChartSubtitle.textContent = meta.subtitle;

    const chart = document.getElementById("dashboardFocusChart");
    if (chart) {
      chart.classList.add("is-loading");
      chart.setAttribute("aria-busy", "true");
    }

    try {
      const data = await api.getPomodoroHeatmap(focusChartRange);
      if (token !== focusChartRequestToken) return;

      renderFocusChart(data && data.ok ? data : { days: [] });
    } catch (error) {
      if (token !== focusChartRequestToken) return;
      renderFocusChart({ days: [] });
    } finally {
      if (token === focusChartRequestToken && chart) {
        chart.classList.remove("is-loading");
        chart.removeAttribute("aria-busy");
      }
    }
  }

  function setupFocusChart() {
    if (elements.focusChartRanges) {
      elements.focusChartRanges.addEventListener("click", (event) => {
        const button = event.target.closest("[data-focus-chart-range]");
        if (!button) return;
        loadFocusChart(Number(button.dataset.focusChartRange));
      });
    }

    if (elements.focusChartBars) {
      elements.focusChartBars.addEventListener("mouseleave", hideFocusChartTooltip);
    }

    window.addEventListener("resize", hideFocusChartTooltip);
  }

  function setNeteaseAdapterStatus(message, tone = "info") {
    if (!elements.neteaseAdapterStatus) return;

    elements.neteaseAdapterStatus.textContent = message || "";
    elements.neteaseAdapterStatus.className =
      `netease-adapter-status is-${tone}`;
    elements.neteaseAdapterStatus.hidden = !message;
  }

  async function refreshNeteaseInstallInfo() {
    if (!elements.neteaseInstallPath) return;

    elements.neteaseInstallPath.textContent = "正在检测…";
    elements.neteaseInstallPath.title = "";

    if (!api || typeof api.getNeteaseInstallInfo !== "function") {
      elements.neteaseInstallPath.textContent = "暂不可用";
      return;
    }

    try {
      const result = await api.getNeteaseInstallInfo();

      if (result && result.ok && result.installed) {
        elements.neteaseInstallPath.textContent = result.path;
        elements.neteaseInstallPath.title = result.path;
      } else {
        elements.neteaseInstallPath.textContent = "未检测到桌面版安装目录";
      }
    } catch (error) {
      elements.neteaseInstallPath.textContent = "检测安装目录失败";
    }
  }

  let neteaseAdapterLastFocus = null;

  function openNeteaseAdapterModal() {
    if (!elements.neteaseAdapterModal) return;

    neteaseAdapterLastFocus = document.activeElement;
    setNeteaseAdapterStatus("");
    if (elements.openNeteaseDirButton) elements.openNeteaseDirButton.disabled = false;
    elements.neteaseAdapterModal.hidden = false;
    document.body.classList.add("modal-open");
    refreshNeteaseInstallInfo();
    requestAnimationFrame(() => {
      if (elements.neteaseAdapterCloseButton) {
        elements.neteaseAdapterCloseButton.focus();
      }
    });
  }

  function closeNeteaseAdapterModal({ restoreFocus = true } = {}) {
    if (!elements.neteaseAdapterModal || elements.neteaseAdapterModal.hidden) return;

    elements.neteaseAdapterModal.hidden = true;

    if (
      elements.historyModal.hidden &&
      elements.renameDialog.hidden &&
      (!elements.scanModal || elements.scanModal.hidden) &&
      (!elements.noteEditorModal || elements.noteEditorModal.hidden) &&
      (!elements.noteReaderModal || elements.noteReaderModal.hidden)
    ) {
      document.body.classList.remove("modal-open");
    }

    if (
      restoreFocus &&
      neteaseAdapterLastFocus &&
      neteaseAdapterLastFocus.isConnected &&
      typeof neteaseAdapterLastFocus.focus === "function"
    ) {
      neteaseAdapterLastFocus.focus({ preventScroll: true });
    }

    neteaseAdapterLastFocus = null;
  }

  async function openNeteaseInstallDir() {
    if (!api || typeof api.openNeteaseInstallDir !== "function") return;

    if (elements.openNeteaseDirButton) elements.openNeteaseDirButton.disabled = true;
    setNeteaseAdapterStatus("正在定位网易云音乐安装目录…");

    try {
      const result = await api.openNeteaseInstallDir();

      if (result && result.ok) {
        setNeteaseAdapterStatus(
          result.path ? `已打开：${result.path}` : "已打开安装目录。",
          "success"
        );
        if (result.path && elements.neteaseInstallPath) {
          elements.neteaseInstallPath.textContent = result.path;
          elements.neteaseInstallPath.title = result.path;
        }
      } else {
        setNeteaseAdapterStatus(
          result && result.error
            ? result.error
            : "无法打开网易云音乐安装目录。",
          "error"
        );
      }
    } catch (error) {
      setNeteaseAdapterStatus("无法打开网易云音乐安装目录。", "error");
    } finally {
      if (elements.openNeteaseDirButton) {
        elements.openNeteaseDirButton.disabled = false;
      }
    }
  }

  async function openNeteaseAdapterLink(kind) {
    if (!api || typeof api.openMusicAdapterLink !== "function") return;

    try {
      const result = await api.openMusicAdapterLink(kind);

      if (!result || !result.ok) {
        setNeteaseAdapterStatus(
          result && result.error ? result.error : "无法打开下载页面。",
          "error"
        );
      }
    } catch (error) {
      setNeteaseAdapterStatus("无法打开下载页面。", "error");
    }
  }

  // 难度只靠图标底座配色（青铜/白银/黄金/彩虹）区分，卡片上不再重复贴文字标签。
  function createAchievementIconNode(icon) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = icon && typeof icon.markup === "string"
      ? icon.markup
      : "";
    return svg;
  }

  function formatAchievementUnlockTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  }

  function updateAchievementsSummary(data) {
    if (!data) return;
    const total = Number(data.total) || 81;
    const unlocked = Number(data.unlockedCount) || 0;
    const secretTotal = Array.isArray(data.achievements)
      ? data.achievements.filter((item) => item.isSecret).length
      : 0;
    const secretUnlocked = Array.isArray(data.achievements)
      ? data.achievements.filter((item) => item.isSecret && item.unlocked).length
      : 0;

    if (elements.achievementsProgressText) {
      elements.achievementsProgressText.textContent =
        `已解锁 ${unlocked} / ${total} · 神秘成就 ${secretUnlocked} / ${secretTotal}`;
    }

    if (elements.achievementsSummary) {
      elements.achievementsSummary.textContent =
        `已解锁 ${unlocked} / ${total} 个成就`;
    }

    if (elements.achievementsProgressBar) {
      elements.achievementsProgressBar.style.width =
        `${total > 0 ? (unlocked / total) * 100 : 0}%`;
    }

    if (elements.achievementsHeroValue) {
      elements.achievementsHeroValue.textContent = String(unlocked);
    }

    if (elements.dashboardAchievementCount) {
      elements.dashboardAchievementCount.textContent = `${unlocked} / ${total}`;
    }

    if (elements.dashboardAchievementMeta) {
      elements.dashboardAchievementMeta.textContent =
        `已解锁 ${unlocked} / ${total} 个成就 · 神秘成就 ${secretUnlocked} / ${secretTotal}`;
    }

    if (elements.dashboardAchievementProgressBar) {
      elements.dashboardAchievementProgressBar.style.width =
        `${total > 0 ? (unlocked / total) * 100 : 0}%`;
    }
  }

  function createAchievementCard(achievement) {
    const hiddenSecret = achievement.isSecret && !achievement.unlocked;
    const card = document.createElement("article");
    card.className = "achievement-card";
    card.dataset.difficulty = String(achievement.difficulty || 1);
    card.classList.toggle("is-unlocked", Boolean(achievement.unlocked));
    card.classList.toggle("is-locked", !achievement.unlocked);
    card.classList.toggle("is-secret-locked", hiddenSecret);

    const medal = document.createElement("span");
    medal.className = "achievement-card-medal";
    medal.setAttribute("aria-hidden", "true");

    if (hiddenSecret) {
      const mark = document.createElement("span");
      mark.className = "achievement-secret-mark";
      mark.textContent = "?";
      medal.append(mark);
    } else {
      medal.append(createAchievementIconNode(achievement.icon));
    }

    const copy = document.createElement("div");
    copy.className = "achievement-card-copy";

    const titleRow = document.createElement("div");
    titleRow.className = "achievement-card-title-row";

    const title = document.createElement("h4");
    title.className = "achievement-card-title";
    title.textContent = hiddenSecret ? "???" : achievement.name;

    const description = document.createElement("p");
    description.className = "achievement-card-description";
    description.textContent = hiddenSecret
      ? "达成后揭晓这条神秘成就。"
      : achievement.description;

    const meta = document.createElement("span");
    meta.className = "achievement-card-meta";
    const unlockedAt = formatAchievementUnlockTime(achievement.unlockedAt);
    meta.textContent = achievement.unlocked
      ? unlockedAt ? `已解锁 · ${unlockedAt}` : "已解锁"
      : "尚未达成";

    titleRow.append(title);
    copy.append(titleRow, description, meta);
    card.append(medal, copy);
    return card;
  }

  function renderAchievementsGallery() {
    if (!elements.achievementsGrid) return;

    if (!achievementsData || !Array.isArray(achievementsData.achievements)) {
      elements.achievementsGrid.replaceChildren();
      const loading = document.createElement("p");
      loading.className = "achievements-loading";
      loading.textContent = "正在读取成就…";
      elements.achievementsGrid.append(loading);
      return;
    }

    const list = achievementsData.achievements.filter((achievement) => (
      achievementFilter === "all" ||
      String(achievement.difficulty) === String(achievementFilter)
    ));

    elements.achievementsGrid.replaceChildren();

    if (list.length === 0) {
      const empty = document.createElement("p");
      empty.className = "achievements-empty";
      empty.textContent = "没有符合筛选条件的成就。";
      elements.achievementsGrid.append(empty);
    } else {
      for (const achievement of list) {
        elements.achievementsGrid.append(createAchievementCard(achievement));
      }
    }

    if (elements.achievementFilterCount) {
      elements.achievementFilterCount.textContent =
        `${list.length} / ${achievementsData.total || 81}`;
    }

    if (elements.achievementFilters) {
      elements.achievementFilters
        .querySelectorAll("[data-achievement-filter]")
        .forEach((button) => {
          button.setAttribute(
            "aria-pressed",
            String(button.dataset.achievementFilter === achievementFilter)
          );
        });
    }

    updateAchievementsSummary(achievementsData);
  }

  async function loadAchievementsData() {
    if (!api || typeof api.getAchievements !== "function") {
      if (elements.achievementsGrid) {
        elements.achievementsGrid.replaceChildren();
        const failed = document.createElement("p");
        failed.className = "achievements-empty";
        failed.textContent = "当前版本无法读取成就。";
        elements.achievementsGrid.append(failed);
      }
      return null;
    }

    try {
      const result = await api.getAchievements();
      if (!result || !result.ok) {
        throw new Error(result && result.error ? result.error : "读取失败");
      }

      achievementsData = result;
      updateAchievementsSummary(result);

      if (currentPage === "achievements") {
        renderAchievementsGallery();
      }
      return result;
    } catch (error) {
      if (currentPage === "achievements") {
        elements.achievementsGrid.replaceChildren();
        const failed = document.createElement("p");
        failed.className = "achievements-empty";
        failed.textContent = "无法读取成就数据。";
        elements.achievementsGrid.append(failed);
      }
      return null;
    }
  }

  async function openAchievementsPage() {
    achievementFilter = "all";
    await showPage("achievements");
    renderAchievementsGallery();
    await loadAchievementsData();
  }

  function createAboutRow({ icon, title, description, control, tone = "blue" }) {
    const row = document.createElement("div");
    row.className = "settings-row";

    const iconNode = createIcon(icon);
    iconNode.classList.add("settings-icon", `tone-${tone}`);

    const copy = document.createElement("div");
    copy.className = "settings-copy";
    const heading = document.createElement("h4");
    heading.textContent = title;
    const text = document.createElement("p");
    text.textContent = description;
    copy.append(heading, text);

    row.append(iconNode, copy);

    const holder = document.createElement("div");
    holder.className = "about-detail-control";
    if (control) {
      holder.append(control);
    } else {
      holder.setAttribute("aria-hidden", "true");
    }
    row.append(holder);

    return row;
  }

  function createAboutTextValue(value) {
    const node = document.createElement("code");
    node.className = "about-info-value";
    node.textContent = value || "—";
    return node;
  }

  function createAboutButton(label, onClick, { primary = false } = {}) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = primary
      ? "btn btn-primary settings-action"
      : "btn btn-ghost settings-action";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  async function ensureAboutInfo() {
    if (aboutInfo) return aboutInfo;

    if (!api || typeof api.getAboutInfo !== "function") {
      aboutInfo = {
        version: "0.1.0",
        electron: "—",
        chrome: "—",
        node: "—",
        platform: "Windows",
        githubUrl: "https://github.com/yourname/within-cubes"
      };
    } else {
      try {
        const result = await api.getAboutInfo();
        aboutInfo = result && result.ok
          ? result
          : {
              version: "0.1.0",
              electron: "—",
              chrome: "—",
              node: "—",
              platform: "Windows",
              githubUrl: "https://github.com/yourname/within-cubes"
            };
      } catch (error) {
        aboutInfo = {
          version: "0.1.0",
          electron: "—",
          chrome: "—",
          node: "—",
          platform: "Windows",
          githubUrl: "https://github.com/yourname/within-cubes"
        };
      }
    }

    if (elements.aboutVersion) {
      elements.aboutVersion.textContent = `v${String(aboutInfo.version || "0.1.0").replace(/^v/i, "")}`;
    }

    return aboutInfo;
  }

  async function openAboutLink(target) {
    if (!api || typeof api.openAboutLink !== "function") return;

    try {
      const result = await api.openAboutLink(target);
      if (!result || !result.ok) {
        setStatus(result && result.error ? result.error : "无法打开链接。", "error");
      }
    } catch (error) {
      setStatus("无法打开链接。", "error");
    }
  }

  async function checkAboutUpdates(button, status) {
    if (!api || typeof api.checkForUpdates !== "function") return;

    button.disabled = true;
    button.textContent = "正在检查…";
    status.hidden = false;
    status.className = "about-update-status";
    status.textContent = "正在连接更新服务…";

    try {
      const result = await api.checkForUpdates();

      if (!result || !result.ok) {
        status.className = "about-update-status is-error";
        status.textContent = result && result.error
          ? result.error
          : "检查更新失败。";
        return;
      }

      status.className = `about-update-status${result.hasUpdate ? " is-available" : ""}`;
      status.textContent = result.message || "更新检查完成。";
    } catch (error) {
      status.className = "about-update-status is-error";
      status.textContent = "检查更新失败。";
    } finally {
      button.disabled = false;
      button.textContent = "检查更新";
    }
  }

  function renderAboutDetail() {
    if (!elements.aboutDetailList) return;

    const list = elements.aboutDetailList;
    const info = aboutInfo || {};
    const isFeaturesPanel = aboutCurrentPanel === "features";

    list.hidden = isFeaturesPanel;
    list.replaceChildren();

    if (elements.aboutFeatures) {
      elements.aboutFeatures.hidden = !isFeaturesPanel;
    }

    if (isFeaturesPanel) return;

    if (aboutCurrentPanel === "version") {
      const version = `v${String(info.version || "0.1.0").replace(/^v/i, "")}`;
      const status = document.createElement("p");
      status.className = "about-update-status";
      status.hidden = true;
      const checkButton = createAboutButton("检查更新", () => {
        checkAboutUpdates(checkButton, status);
      }, { primary: true });

      list.append(
        createAboutRow({
          icon: "info",
          title: "当前版本",
          description: "设置页与状态栏使用同一个应用版本号。",
          control: createAboutTextValue(version),
          tone: "blue"
        }),
        createAboutRow({
          icon: "reset",
          title: "更新通道",
          description: info.updateSourceConfigured
            ? "已配置 GitHub Release 或在线更新源，可检查最新版本。"
            : "尚未配置 GitHub 仓库或在线更新源。",
          control: createAboutTextValue(info.githubRepo || "未配置"),
          tone: "purple"
        }),
        createAboutRow({
          icon: "reset",
          title: "检查更新",
          description: "从配置的更新服务读取最新版本信息。",
          control: checkButton,
          tone: "green"
        })
      );
      list.append(status);
      return;
    }

    if (aboutCurrentPanel === "credits") {
      list.append(
        createAboutRow({
          icon: "app",
          title: "Electron",
          description: "桌面应用运行时、窗口系统与 IPC 基础设施。",
          control: createAboutTextValue(info.electron),
          tone: "blue"
        }),
        createAboutRow({
          icon: "window",
          title: "Chromium",
          description: "渲染界面与桌面玻璃材质效果。",
          control: createAboutTextValue(info.chrome),
          tone: "yellow"
        }),
        createAboutRow({
          icon: "document",
          title: "Node.js",
          description: "主进程文件系统、进程管理与本地服务。",
          control: createAboutTextValue(info.node),
          tone: "green"
        }),
        createAboutRow({
          icon: "sparkles",
          title: "Lucide Icons",
          description: "81 个成就徽章使用的开源 SVG 图标几何。",
          control: createAboutButton("打开 GitHub", () => openAboutLink("github")),
          tone: "purple"
        }),
        createAboutRow({
          icon: "arrow-up-right",
          title: "开源项目主页",
          description: "查看源码、依赖与项目的开源致谢列表。",
          control: createAboutButton("GitHub", () => openAboutLink("github")),
          tone: "peach"
        })
      );
      return;
    }

    if (aboutCurrentPanel === "community") {
      list.append(
        createAboutRow({
          icon: "inbox",
          title: "问题与反馈",
          description: "在 GitHub 提交问题、建议或展示你的桌面布置。",
          control: createAboutButton("打开 GitHub", () => openAboutLink("feedback")),
          tone: "peach"
        }),
        createAboutRow({
          icon: "info",
          title: "运行环境",
          description: "反馈问题时附上版本和系统信息会更容易定位。",
          control: createAboutTextValue(
            `v${String(info.version || "0.1.0").replace(/^v/i, "")} · ${info.platform || "win32"}`
          ),
          tone: "blue"
        }),
        createAboutRow({
          icon: "sparkles",
          title: "成就与版本",
          description: "更多产品细节可以在成就图鉴和版本页面中查看。",
          control: createAboutButton("查看成就", openAchievementsPage),
          tone: "purple"
        })
      );
    }
  }

  async function openAboutPanel(panelKey) {
    const titles = {
      features: "核心特性",
      version: "版本与更新",
      credits: "开源与致谢",
      community: "反馈与社区"
    };

    if (!titles[panelKey]) return;

    aboutCurrentPanel = panelKey;
    if (elements.aboutOverview) elements.aboutOverview.hidden = true;
    if (elements.aboutDetail) elements.aboutDetail.hidden = false;
    if (elements.aboutBreadcrumbCurrent) {
      elements.aboutBreadcrumbCurrent.textContent = titles[panelKey];
    }

    await ensureAboutInfo();
    renderAboutDetail();

    if (elements.content) elements.content.scrollTop = 0;
    if (elements.aboutBackLink) elements.aboutBackLink.focus();
  }

  function closeAboutDetail({ restoreFocus = true } = {}) {
    aboutCurrentPanel = "";

    if (elements.aboutDetail) elements.aboutDetail.hidden = true;
    if (elements.aboutOverview) elements.aboutOverview.hidden = false;

    if (restoreFocus && elements.content) {
      elements.content.scrollTop = 0;
    }
  }

  async function openAboutPage() {
    closeAboutDetail({ restoreFocus: false });
    await showPage("about");
    await ensureAboutInfo();
    renderAboutDetail();
  }

  function renderShortcutList() {
    if (!elements.shortcutList) return;
    elements.shortcutList.replaceChildren();

    if (!shortcutState || !Array.isArray(shortcutState.actions)) {
      const loading = document.createElement("p");
      loading.className = "shortcut-empty";
      loading.textContent = shortcutState && shortcutState.error
        ? shortcutState.error
        : "当前版本无法读取快捷键。";
      elements.shortcutList.append(loading);
      if (elements.shortcutSummaryText) {
        elements.shortcutSummaryText.textContent = "暂时无法读取快捷键状态。";
      }
      return;
    }

    for (const action of shortcutState.actions) {
      const row = document.createElement("div");
      row.className = "shortcut-row";
      row.dataset.shortcutAction = action.id;

      const copy = document.createElement("div");
      copy.className = "shortcut-copy";
      const label = document.createElement("span");
      label.className = "shortcut-label";
      label.textContent = action.label;
      const description = document.createElement("span");
      description.className = "shortcut-description";
      description.textContent = action.description;
      copy.append(label, description);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "shortcut-record-button";
      button.dataset.shortcutAction = action.id;
      button.textContent = action.display || "未设置";
      button.classList.toggle("is-recording", shortcutRecordingAction === action.id);
      button.classList.toggle("is-unregistered", action.registered === false);
      button.title = action.registered === false
        ? "快捷键未能注册，可能被其他应用占用"
        : "点击录制新的快捷键";
      button.setAttribute("aria-label", `${action.label}：${action.display}`);
      button.addEventListener("click", () => beginShortcutRecording(action.id));

      row.append(copy, button);
      elements.shortcutList.append(row);
    }

    if (elements.shortcutSummaryText) {
      const total = shortcutState.actions.length;
      const registered = shortcutState.actions
        .filter((action) => action.registered !== false).length;
      elements.shortcutSummaryText.textContent =
        `${registered} / ${total} 项已生效 · 点击进入管理`;
    }
  }

  async function loadShortcuts() {
    if (!api || typeof api.getShortcuts !== "function") {
      shortcutState = { error: "当前版本不支持自定义快捷键。" };
      renderShortcutList();
      return;
    }

    try {
      const result = await api.getShortcuts();
      if (result && result.ok) {
        shortcutState = result;
      } else {
        shortcutState = {
          error: result && result.error ? result.error : "无法读取快捷键。"
        };
      }
    } catch (error) {
      shortcutState = { error: "无法读取快捷键。" };
    }

    renderShortcutList();
  }

  function setShortcutRecordingUI(active) {
    if (elements.shortcutRecordingNote) {
      elements.shortcutRecordingNote.hidden = !active;
      elements.shortcutRecordingNote.textContent =
        "正在录制：按下包含 Ctrl、Alt、Shift 或 Win 的组合键；Esc 取消。";
    }
    renderShortcutList();
  }

  async function beginShortcutRecording(actionId) {
    if (!api || typeof api.setShortcutRecording !== "function") return;
    if (shortcutRecordingAction) return;

    try {
      const result = await api.setShortcutRecording(true);
      if (!result || !result.ok) {
        setStatus(result && result.error ? result.error : "无法开始录制快捷键。", "error");
        return;
      }

      shortcutState = result;
      shortcutRecordingAction = actionId;
      setShortcutRecordingUI(true);

      // Rendering the list replaces the button, so re-query before applying
      // the recording label and focus to the visible element.
      shortcutRecordingButton = elements.shortcutList
        ? elements.shortcutList.querySelector(
            `.shortcut-record-button[data-shortcut-action="${actionId}"]`
          )
        : null;

      if (shortcutRecordingButton) {
        shortcutRecordingButton.textContent = "请按下组合键…";
        shortcutRecordingButton.classList.add("is-recording");
        shortcutRecordingButton.focus();
      }
    } catch (error) {
      setStatus("无法开始录制快捷键。", "error");
    }
  }

  async function cancelShortcutRecording() {
    if (!shortcutRecordingAction || !api) return;

    shortcutRecordingAction = "";
    shortcutRecordingButton = null;
    setShortcutRecordingUI(false);

    try {
      const result = await api.setShortcutRecording(false);
      if (result && result.ok) {
        shortcutState = result;
        renderShortcutList();
      }
    } catch (error) {
      setStatus("无法恢复全局快捷键。", "error");
    }
  }

  async function submitShortcutRecording(accelerator) {
    if (!shortcutRecordingAction || !api) return;

    const action = shortcutRecordingAction;
    const button = shortcutRecordingButton;
    shortcutRecordingAction = "";
    shortcutRecordingButton = null;
    setShortcutRecordingUI(false);

    if (button) {
      button.disabled = true;
      button.textContent = "保存中…";
    }

    try {
      const result = await api.setShortcut(action, accelerator);
      if (result && result.ok) {
        shortcutState = result;
        setStatus(
          result.warning || "全局快捷键已更新。",
          result.warning ? "error" : "success"
        );
      } else {
        setStatus(result && result.error ? result.error : "无法注册快捷键。", "error");
        const fallback = await api.getShortcuts().catch(() => null);
        if (fallback && fallback.ok) shortcutState = fallback;
      }
    } catch (error) {
      setStatus("无法注册快捷键。", "error");
    } finally {
      renderShortcutList();
    }
  }

  function mapShortcutKey(event) {
    if (!event) return "";

    if (/^Key[A-Z]$/.test(event.code)) return event.code.slice(3);
    if (/^Digit[0-9]$/.test(event.code)) return event.code.slice(5);
    if (/^F(?:[1-9]|1\d|2[0-4])$/.test(event.code)) return event.code;

    const named = {
      Space: "Space",
      Tab: "Tab",
      Enter: "Enter",
      Backspace: "Backspace",
      Delete: "Delete",
      Insert: "Insert",
      Home: "Home",
      End: "End",
      PageUp: "PageUp",
      PageDown: "PageDown",
      ArrowUp: "Up",
      ArrowDown: "Down",
      ArrowLeft: "Left",
      ArrowRight: "Right"
    };

    if (named[event.code]) return named[event.code];

    if (typeof event.key === "string" && /^[a-z0-9]$/i.test(event.key)) {
      return event.key.toUpperCase();
    }

    return "";
  }

  function acceleratorFromKeyboardEvent(event) {
    const key = mapShortcutKey(event);
    if (!key) return "";

    const modifiers = [];
    if (event.ctrlKey) modifiers.push("Control");
    if (event.altKey) modifiers.push("Alt");
    if (event.shiftKey) modifiers.push("Shift");
    if (event.metaKey) modifiers.push("Super");

    if (modifiers.length === 0) return "";
    return [...modifiers, key].join("+");
  }

  function handleShortcutRecordingKeydown(event) {
    if (!shortcutRecordingAction) return;

    event.preventDefault();
    event.stopPropagation();

    if (event.isComposing) return;

    if (event.key === "Escape") {
      cancelShortcutRecording();
      return;
    }

    if (["Control", "Alt", "Shift", "Meta"].includes(event.key)) {
      return;
    }

    const accelerator = acceleratorFromKeyboardEvent(event);

    if (!accelerator) {
      if (elements.shortcutRecordingNote) {
        elements.shortcutRecordingNote.textContent =
          "请使用 Ctrl、Alt、Shift 或 Win 搭配一个按键；Esc 取消。";
      }
      return;
    }

    submitShortcutRecording(accelerator);
  }

  async function resetShortcuts() {
    if (!api || typeof api.resetShortcuts !== "function") return;

    if (elements.resetShortcutsButton) {
      elements.resetShortcutsButton.disabled = true;
    }

    try {
      const result = await api.resetShortcuts();
      if (result && Array.isArray(result.actions)) {
        shortcutState = result;
        renderShortcutList();
      }

      if (result && result.ok) {
        setStatus(
          result.warning || "全局快捷键已恢复默认。",
          result.warning ? "error" : "success"
        );
      } else {
        setStatus(result && result.error ? result.error : "无法恢复默认快捷键。", "error");
      }
    } catch (error) {
      setStatus("无法恢复默认快捷键。", "error");
    } finally {
      if (elements.resetShortcutsButton) {
        elements.resetShortcutsButton.disabled = false;
      }
    }
  }

  function renderFloatingSettings(settings) {
    if (!settings || !settings.ok) return;

    floatingSettings = settings;
    const visible = settings.visibleCount || 0;
    const widgets = Array.isArray(settings.widgets) ? settings.widgets : [];
    const categories = Array.isArray(settings.categories) ? settings.categories : [];
    const available =
      categories.some((category) => !category.removed) ||
      widgets.some((widget) => widget.enabled);

    elements.floatingVisibleSummary.textContent = `当前 ${visible} 个桌面组件可见`;

    const allVisible = visible > 0;
    const allLabel = allVisible ? "隐藏所有桌面组件" : "显示所有桌面组件";
    elements.toggleAllFloatingButton.setAttribute(
      "aria-checked",
      String(allVisible)
    );
    elements.toggleAllFloatingButton.setAttribute("aria-label", allLabel);
    elements.toggleAllFloatingButton.title = allLabel;
    elements.toggleAllFloatingButton.disabled = !available;

    renderTintSettings(settings);
    applyMainUiTheme(settings);
    renderSmartThemeSettings(settings);
    renderUiBackgroundSettings(settings);

    if (collapseModeControl) {
      collapseModeControl.value = settings.collapseMode === "hover"
        ? "hover"
        : "double-click";
    }

    const frostLabel = settings.frosted ? "关闭磨砂效果" : "开启磨砂效果";
    elements.toggleFrostButton.setAttribute(
      "aria-checked",
      String(Boolean(settings.frosted))
    );
    elements.toggleFrostButton.setAttribute("aria-label", frostLabel);
    elements.toggleFrostButton.title = frostLabel;
    elements.frostModeNote.textContent = getFrostModeText(settings);

    if (elements.toggleWallpaperBrightnessButton) {
      elements.toggleWallpaperBrightnessButton.setAttribute(
        "aria-checked",
        String(Boolean(settings.followWallpaperBrightness))
      );
      elements.toggleWallpaperBrightnessButton.title =
        settings.followWallpaperBrightness ? "关闭跟随壁纸亮度" : "跟随壁纸亮度";
    }

    if (elements.togglePerformanceModeButton) {
      elements.togglePerformanceModeButton.setAttribute(
        "aria-checked",
        String(Boolean(settings.performanceMode))
      );
      elements.togglePerformanceModeButton.title =
        settings.performanceMode ? "关闭性能保护模式" : "开启性能保护模式";
    }

    if (elements.toggleDepth3dButton) {
      elements.toggleDepth3dButton.setAttribute(
        "aria-checked",
        String(Boolean(settings.depth3d))
      );
      elements.toggleDepth3dButton.title =
        settings.depth3d ? "关闭 3D 景深" : "开启 3D 景深";
    }

    if (elements.toggleMusicVisualizerButton) {
      const musicVisualizer = settings.musicVisualizer !== false;
      elements.toggleMusicVisualizerButton.setAttribute(
        "aria-checked",
        String(musicVisualizer)
      );
      elements.toggleMusicVisualizerButton.title =
        musicVisualizer ? "关闭音乐封面背景" : "开启音乐封面背景";
    }

    renderPersonalizePage(settings);
    applySearchFilter();
  }

  async function showPage(page) {
    if (!pages[page]) return;

    if (page !== "personalize") {
      pendingNotesHistoryFocus = false;
    }

    currentPage = page;

    if (page === "about" && !aboutAchievementRecorded) {
      aboutAchievementRecorded = true;
      if (api && typeof api.recordAchievementEvent === "function") {
        api.recordAchievementEvent("about-view").catch(() => {});
      }
    }

    if (page === "personalize") {
      personalizeDetailKey = null;
      lastPersonalizeFocus = null;
      elements.personalizeOverview.hidden = false;
      elements.personalizeDetail.hidden = true;
      elements.personalizeDetailContent.replaceChildren();
    } else {
      personalizeDetailKey = null;
      lastPersonalizeFocus = null;
      if (elements.personalizeDetail) {
        elements.personalizeDetail.hidden = true;
      }
    }

    const meta = PAGE_META[page];
    if (meta && elements.pageTitle && elements.pageSubtitle) {
      elements.pageTitle.textContent = meta.title;
      elements.pageSubtitle.textContent = meta.subtitle;
    }

    if (elements.content) {
      elements.content.scrollTop = 0;
    }

    if (elements.widgetSubtabs) {
      elements.widgetSubtabs.hidden = page !== "widgets";

      if (page === "widgets") {
        const firstButton = elements.widgetSubtabs.querySelector(".nav-subtab");
        activeSubtabSection = "";
        setActiveSubtab(firstButton ? firstButton.dataset.section : "");
      }
    }

    Object.entries(pages).forEach(([key, node]) => {
      node.hidden = key !== page;
    });

    Object.entries(navItems).forEach(([key, node]) => {
      // The shortcut manager is a drill-down of 设置, so 设置 stays highlighted.
      const active = key === page || (page === "shortcuts" && key === "settings");
      node.classList.toggle("is-active", active);

      if (active) {
        node.setAttribute("aria-current", "page");
      } else {
        node.removeAttribute("aria-current");
      }
    });

    closeRenameDialog({ restoreFocus: false });

    if (page === "home") {
      loadFocusChart();
    }

    if (page === "achievements") {
      achievementFilter = "all";
      await loadAchievementsData();
      renderAchievementsGallery();
    }

    if (page === "about") {
      closeAboutDetail({ restoreFocus: false });
      ensureAboutInfo().then(() => {
        if (currentPage === "about" && !aboutCurrentPanel) {
          renderAboutDetail();
        }
      });
    }

    if (page === "settings") {
      loadSettingsPaths();
      loadShellIntegration();
    }

    if (page !== "widgets" && page !== "personalize") {
      applySearchFilter();
      return;
    }

    const settings = await refreshFloatingSettings();

    if (!settings && currentPage === page) {
      if (page === "personalize") {
        const error = document.createElement("p");
        error.className = "history-empty";
        error.textContent = "无法读取组件设置。";
        elements.personalizeCardList.replaceChildren(error);
      } else {
        setStatus("无法读取全局设置。", "error");
      }
    }

    applySearchFilter();
  }

  /* ---------- 待办管理页 ----------
     桌面组件只管「添加 + 看未完成」，完整的管理（筛选/编辑/删除/CSV）都在这页。
     数据与桌面组件共用主进程的同一份 widgetData，任一侧改动都会广播到另一侧。 */

  let todoItems = [];
  let todoFilter = "all";
  let todoEditingId = "";

  function getTodoSortWeight(todo) {
    const datePart = todo && todo.dueDate ? todo.dueDate : "9999-99-99";
    const timePart = todo && todo.dueTime ? todo.dueTime : "99:99";
    const created = todo && typeof todo.createdAt === "string" ? todo.createdAt : "";
    return `${datePart} ${timePart} ${created}`;
  }

  function sortTodosForManager(todos) {
    return [...todos].sort((left, right) => {
      const weight = getTodoSortWeight(left).localeCompare(getTodoSortWeight(right));
      if (weight !== 0) return weight;
      return String(left.text || "").localeCompare(String(right.text || ""));
    });
  }

  function formatTodoSchedule(todo) {
    if (!todo.dueDate && !todo.dueTime) return "未安排日期";

    const dateLabel = todo.dueDate
      ? `${Number(todo.dueDate.slice(5, 7))}月${Number(todo.dueDate.slice(8, 10))}日`
      : "";
    const timeLabel = todo.dueTime || "";

    if (dateLabel && timeLabel) return `${dateLabel} ${timeLabel}`;
    if (dateLabel) return dateLabel;
    return `今天 ${timeLabel}`;
  }

  function getVisibleTodos() {
    const sorted = sortTodosForManager(todoItems);

    if (todoFilter === "open") return sorted.filter((todo) => !todo.done);
    if (todoFilter === "done") return sorted.filter((todo) => todo.done);
    return sorted;
  }

  function setTodoFilter(filter) {
    todoFilter = filter === "open" || filter === "done" ? filter : "all";
    todoEditingId = "";

    for (const tab of elements.todoTabs) {
      const active = tab.dataset.todoTab === todoFilter;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    }

    renderTodoManager();
  }

  function buildTodoRow(todo) {
    const row = document.createElement("li");
    row.className = "todo-row";
    row.dataset.todoId = todo.id;
    row.classList.toggle("is-done", Boolean(todo.done));
    row.setAttribute("role", "listitem");

    if (todoEditingId === todo.id) {
      row.classList.add("is-editing");
      const editor = document.createElement("div");
      editor.className = "todo-row-editor";

      const textInput = document.createElement("input");
      textInput.type = "text";
      textInput.value = todo.text;
      textInput.maxLength = 200;
      textInput.setAttribute("aria-label", "待办内容");

      const dateInput = document.createElement("input");
      dateInput.type = "date";
      dateInput.value = todo.dueDate || "";
      dateInput.setAttribute("aria-label", "待办日期");

      const timeInput = document.createElement("input");
      timeInput.type = "time";
      timeInput.value = todo.dueTime || "";
      timeInput.setAttribute("aria-label", "待办时间");

      const commit = () => {
        const text = textInput.value.trim();
        if (!text) {
          setStatus("待办内容不能为空。", "error");
          textInput.focus();
          return;
        }

        todoEditingId = "";
        saveTodoEdit(todo.id, {
          text,
          dueDate: dateInput.value || "",
          dueTime: timeInput.value || ""
        });
      };

      textInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        } else if (event.key === "Escape") {
          event.preventDefault();
          todoEditingId = "";
          renderTodoManager();
        }
      });

      const saveButton = document.createElement("button");
      saveButton.type = "button";
      saveButton.className = "todo-row-action";
      saveButton.title = "保存";
      saveButton.setAttribute("aria-label", "保存待办");
      saveButton.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-todo"></use></svg>';
      saveButton.addEventListener("click", commit);

      const cancelButton = document.createElement("button");
      cancelButton.type = "button";
      cancelButton.className = "todo-row-action";
      cancelButton.title = "取消";
      cancelButton.setAttribute("aria-label", "取消编辑");
      cancelButton.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-reset"></use></svg>';
      cancelButton.addEventListener("click", () => {
        todoEditingId = "";
        renderTodoManager();
      });

      editor.append(textInput, dateInput, timeInput, saveButton, cancelButton);
      row.append(editor);
      requestAnimationFrame(() => textInput.focus());
      return row;
    }

    // 每行只有一个圆形复选框：点它就切换「已完成 / 未完成」。
    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "todo-row-check";
    check.checked = Boolean(todo.done);
    check.title = todo.done ? "标记为未完成" : "标记为已完成";
    check.setAttribute(
      "aria-label",
      todo.done ? `标记「${todo.text}」为未完成` : `完成「${todo.text}」`
    );
    check.addEventListener("change", () => {
      toggleTodoItem(todo.id, check.checked);
    });

    const copy = document.createElement("div");
    copy.className = "todo-row-copy";

    const text = document.createElement("span");
    text.className = "todo-row-text";
    text.textContent = todo.text;
    text.title = todo.text;

    const time = document.createElement("span");
    time.className = "todo-row-time";
    time.textContent = formatTodoSchedule(todo);

    copy.append(text, time);

    const actions = document.createElement("div");
    actions.className = "todo-row-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "todo-row-action";
    edit.title = "编辑";
    edit.setAttribute("aria-label", `编辑待办「${todo.text}」`);
    edit.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-edit"></use></svg>';
    edit.addEventListener("click", () => {
      todoEditingId = todo.id;
      renderTodoManager();
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "todo-row-action is-danger";
    remove.title = "删除";
    remove.setAttribute("aria-label", `删除待办「${todo.text}」`);
    remove.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-trash"></use></svg>';
    remove.addEventListener("click", () => {
      deleteTodoItem(todo.id, todo.text);
    });

    actions.append(edit, remove);
    row.append(check, copy, actions);
    return row;
  }

  /** 导出按钮的提示文案跟着当前 Tab 走（导出范围 = 当前列表全部条目）。 */
  function updateTodoToolbarState() {
    if (!elements.exportTodoCsvButton) return;

    const visible = getVisibleTodos();
    const label = { all: "全部", open: "未完成", done: "已完成" }[todoFilter] || "全部";
    elements.exportTodoCsvButton.title =
      visible.length > 0
        ? `导出当前「${label}」列表的 ${visible.length} 条待办`
        : `当前「${label}」列表没有可导出的待办`;
  }

  function renderTodoManager() {
    // 下钻页关掉后这些引用会指向已移除的节点，直接跳过。
    if (!elements.todoManagerList || !elements.todoManagerList.isConnected) return;

    const visible = getVisibleTodos();
    const doneCount = todoItems.filter((todo) => todo.done).length;
    const openCount = todoItems.length - doneCount;

    if (elements.todoTabCount) {
      elements.todoTabCount.textContent = `${visible.length} 项`;
    }
    if (elements.todoManagerMeta) {
      elements.todoManagerMeta.textContent =
        `共 ${todoItems.length} 项 · 未完成 ${openCount} · 已完成 ${doneCount}`;
    }

    elements.todoManagerList.replaceChildren();
    elements.todoManagerList.hidden = visible.length === 0;
    elements.todoManagerEmpty.hidden = visible.length > 0;

    if (visible.length === 0 && elements.todoManagerEmpty) {
      elements.todoManagerEmpty.textContent =
        todoItems.length === 0
          ? "还没有待办，先在桌面组件里添加一条吧。"
          : "这个筛选下没有待办。";
    }

    for (const todo of visible) {
      elements.todoManagerList.append(buildTodoRow(todo));
    }

    updateTodoToolbarState();
  }

  function createTodoToolButton(iconName, label, title) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "todo-tool-btn";
    button.title = title;
    button.append(createIcon(iconName, "icon"));

    const text = document.createElement("span");
    text.textContent = label;
    button.append(text);

    return button;
  }

  /**
   * 待办管理区：作为「组件库 → 任务待办」的下钻内容存在，
   * 不再占用独立页面，也不出现在左侧主导航里。
   */
  function createTodoManagerSection() {
    const section = document.createElement("section");
    section.className = "ui-card list-group settings-group tone-green todo-manager";
    section.id = "todoManager";

    // ---- 头部：标题 + 统计 + 导入/导出 ----
    const headBlock = document.createElement("div");
    headBlock.className = "settings-block todo-manager-head";

    const headRow = document.createElement("div");
    headRow.className = "settings-block-head";

    const headIcon = document.createElement("span");
    headIcon.className = "settings-icon tone-green";
    headIcon.setAttribute("aria-hidden", "true");
    headIcon.append(createIcon("todo", "icon"));

    const headCopy = document.createElement("div");
    headCopy.className = "settings-copy";
    const headTitle = document.createElement("h4");
    headTitle.textContent = "待办管理";
    const headMeta = document.createElement("p");
    headMeta.textContent = "全部待办一目了然；导出会写出当前列表的全部条目。";
    headCopy.append(headTitle, headMeta);

    const headActions = document.createElement("div");
    headActions.className = "todo-manager-actions";
    const importButton = createTodoToolButton("upload", "导入", "从 CSV 导入待办");
    const exportButton = createTodoToolButton("download", "导出", "导出当前列表的待办");
    headActions.append(importButton, exportButton);

    headRow.append(headIcon, headCopy, headActions);
    headBlock.append(headRow);

    // ---- 工具栏：状态筛选（导出范围跟着当前 Tab 走） ----
    const toolbar = document.createElement("div");
    toolbar.className = "settings-block todo-manager-toolbar";

    const tabs = document.createElement("div");
    tabs.className = "todo-tabs";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "待办筛选");

    const tabButtons = [];
    for (const [value, label] of [["all", "全部"], ["open", "未完成"], ["done", "已完成"]]) {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "todo-tab";
      tab.dataset.todoTab = value;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(value === todoFilter));
      tab.classList.toggle("is-active", value === todoFilter);
      tab.textContent = label;
      tab.addEventListener("click", () => setTodoFilter(value));
      tabButtons.push(tab);
      tabs.append(tab);
    }

    const tabCount = document.createElement("span");
    tabCount.className = "todo-tab-count";
    tabCount.textContent = "0 项";
    tabs.append(tabCount);

    toolbar.append(tabs);

    // ---- 列表 ----
    const list = document.createElement("ul");
    list.className = "list-rows todo-manager-list";
    list.setAttribute("role", "list");

    const empty = document.createElement("p");
    empty.className = "todo-manager-empty";
    empty.hidden = true;
    empty.textContent = "还没有待办，先在桌面组件里添加一条吧。";

    section.append(headBlock, toolbar, list, empty);

    // 把引用挂回全局，渲染函数就能复用同一套逻辑。
    elements.todoManagerList = list;
    elements.todoManagerEmpty = empty;
    elements.todoManagerMeta = headMeta;
    elements.todoTabCount = tabCount;
    elements.todoTabs = tabButtons;
    elements.importTodoCsvButton = importButton;
    elements.exportTodoCsvButton = exportButton;

    importButton.addEventListener("click", importTodosCsv);
    exportButton.addEventListener("click", exportTodosCsv);

    return section;
  }

  async function loadTodos() {
    if (!api || typeof api.listTodos !== "function") return;

    try {
      const result = await api.listTodos();
      if (result && Array.isArray(result.todos)) {
        todoItems = result.todos;
      }
    } catch (error) {
      todoItems = [];
    }

    renderTodoManager();
  }

  function applyTodoResult(result, failureMessage) {
    if (!result || !result.ok) {
      setStatus(result && result.error ? result.error : failureMessage, "error");
      return false;
    }

    if (Array.isArray(result.todos)) {
      todoItems = result.todos;
      renderTodoManager();
    }

    return true;
  }

  async function toggleTodoItem(id, done) {
    if (!api || typeof api.toggleTodo !== "function") return;

    try {
      const result = await api.toggleTodo(id, done);
      applyTodoResult(result, "无法更新待办。");
    } catch (error) {
      setStatus("无法更新待办。", "error");
    }
  }

  async function saveTodoEdit(id, payload) {
    if (!api || typeof api.updateTodo !== "function") return;

    try {
      const result = await api.updateTodo({ id, ...payload });
      if (applyTodoResult(result, "无法保存待办。")) {
        setStatus("待办已更新。", "success");
      }
    } catch (error) {
      setStatus("无法保存待办。", "error");
    }
  }

  async function deleteTodoItem(id, text) {
    if (!api || typeof api.deleteTodo !== "function") return;
    if (!window.confirm(`确定删除待办「${text}」吗？`)) return;

    try {
      const result = await api.deleteTodo(id);
      if (applyTodoResult(result, "无法删除待办。")) {
        setStatus("待办已删除。", "success");
      }
    } catch (error) {
      setStatus("无法删除待办。", "error");
    }
  }

  async function exportTodosCsv() {
    if (!api || typeof api.exportTodosCsv !== "function") return;

    // 导出范围 = 当前 Tab 下的全部条目（全部 / 未完成 / 已完成），不再需要逐条勾选。
    const visible = getVisibleTodos();
    if (visible.length === 0) {
      setStatus("当前列表没有可导出的待办。", "error");
      return;
    }

    const ids = visible.map((todo) => todo.id);
    elements.exportTodoCsvButton.disabled = true;

    try {
      const result = await api.exportTodosCsv(ids);

      if (!result || !result.ok) {
        if (result && result.canceled) return;
        setStatus(result && result.error ? result.error : "导出失败。", "error");
        return;
      }

      setStatus(`已导出 ${result.count} 条待办（UTF-8 CSV）。`, "success");
    } catch (error) {
      setStatus("导出失败。", "error");
    } finally {
      elements.exportTodoCsvButton.disabled = false;
    }
  }

  async function importTodosCsv() {
    if (!api || typeof api.importTodosCsv !== "function") return;

    elements.importTodoCsvButton.disabled = true;

    try {
      const result = await api.importTodosCsv();

      if (!result || !result.ok) {
        if (result && result.canceled) return;
        setStatus(result && result.error ? result.error : "导入失败。", "error");
        return;
      }

      const skipped = result.skipped > 0 ? `，跳过 ${result.skipped} 条重复` : "";
      setStatus(`已导入 ${result.added} 条待办${skipped}。`, "success");
      await loadTodos();
    } catch (error) {
      setStatus("导入失败。", "error");
    } finally {
      elements.importTodoCsvButton.disabled = false;
    }
  }

  /** 仪表盘「待办剩余」卡片：显示未完成条数，没有数据时不覆盖组件状态文案。 */
  function refreshTodoDashboard(hasSettings = true, widgetEnabled = true) {
    if (elements.dashTodoMeta) {
      if (!hasSettings) {
        elements.dashTodoMeta.textContent = "正在读取待办组件状态…";
      } else if (!widgetEnabled) {
        elements.dashTodoMeta.textContent = "待办组件当前未开启。";
      } else {
        const open = todoItems.filter((item) => !item.done).length;
        elements.dashTodoMeta.textContent = open > 0
          ? `还有 ${open} 项未完成，点击管理`
          : "全部完成，点击管理待办";
      }
    }

    if (elements.dashTodoValue) {
      elements.dashTodoValue.textContent = todoItems.length > 0
        ? String(todoItems.filter((item) => !item.done).length)
        : "—";
    }
  }

  function setupTodoManager() {
    if (api && typeof api.onTodosChanged === "function") {
      api.onTodosChanged((payload) => {
        if (!payload || !Array.isArray(payload.todos)) return;
        todoItems = payload.todos;
        if (currentPage === "personalize" && personalizeDetailKey === "todo") {
          renderTodoManager();
        }
        refreshTodoDashboard();
      });
    }

    // 仪表盘卡片也可以直接进管理区，不用非得回桌面点按钮。
    if (elements.dashTodoCard) {
      elements.dashTodoCard.addEventListener("click", () => {
        openTodoManagerPage();
      });
      elements.dashTodoCard.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        elements.dashTodoCard.click();
      });
    }

    loadTodos();

    // 桌面组件第二页的「查看全部」会走到这里。
    if (api && typeof api.onOpenTodoManager === "function") {
      api.onOpenTodoManager(() => {
        openTodoManagerPage();
      });
    }
  }

  /** 统一入口：打开「组件库 → 任务待办」下钻页。 */
  async function openTodoManagerPage() {
    clearSearch();

    if (currentPage !== "personalize") {
      await showPage("personalize");
    } else if (!floatingSettings) {
      await refreshFloatingSettings();
    }

    if (!floatingSettings) {
      setStatus("无法读取组件设置。", "error");
      return;
    }

    openPersonalizeDetail("todo");
    collapseSidebarAfterNavigation();
  }

  async function changeFloatingCategory(categoryKey, removed) {
    if (!api) return;

    try {
      const result = await api.setFloatingCategoryRemoved(categoryKey, removed);

      if (result && result.ok) {
        if (result.canceled) {
          setStatus("已取消移除分类。", "info");
          await refreshFloatingSettings();
          return;
        }

        if (result.settings) {
          renderFloatingSettings(result.settings);
        }
      } else {
        setStatus(result && result.error ? result.error : "无法修改分类状态。", "error");
        await refreshFloatingSettings();
      }
    } catch (error) {
      setStatus("无法修改分类状态。", "error");
      await refreshFloatingSettings();
    }
  }

  async function changeFloatingWidgetLocked(widgetKey, locked) {
    if (!api || typeof api.setFloatingWidgetLocked !== "function") return;

    try {
      const result = await api.setFloatingWidgetLocked(widgetKey, locked);

      if (result && result.ok && result.settings) {
        renderFloatingSettings(result.settings);
      } else {
        setStatus(
          result && result.error ? result.error : "无法修改锁定状态。",
          "error"
        );
        await refreshFloatingSettings();
      }
    } catch (error) {
      setStatus("无法修改锁定状态。", "error");
      await refreshFloatingSettings();
    }
  }

  async function changeFloatingWidget(widgetKey, enabled) {
    if (!api) return;

    try {
      const result = await api.setFloatingWidgetEnabled(widgetKey, enabled);
      if (result && result.ok) {
        renderFloatingSettings(result.settings);
        updateDashboardFromSettings();
      } else {
        setStatus(result && result.error ? result.error : "无法修改组件状态。", "error");
        await refreshFloatingSettings();
        updateDashboardFromSettings();
      }
    } catch (error) {
      setStatus("无法修改组件状态。", "error");
      await refreshFloatingSettings();
    }
  }

  async function runFloatingSettingAction(action, fallbackMessage) {
    if (!api) return;

    try {
      const result = await action();

      if (result && result.ok) {
        renderFloatingSettings(result.settings);
      } else {
        setStatus(result && result.error ? result.error : fallbackMessage, "error");
      }
    } catch (error) {
      setStatus(fallbackMessage, "error");
    }
  }

  function changeFloatingCustomTint(color) {
    return runFloatingSettingAction(
      () => api.setFloatingCustomTint(color),
      "无法修改自定义颜色。"
    );
  }

  function changeFloatingWidgetSize(widgetKey, widthInput, heightInput) {
    const width = Number(widthInput.value);
    const height = Number(heightInput.value);

    if (!Number.isInteger(width) || !Number.isInteger(height)) {
      setStatus("窗口尺寸需为整数。", "error");
      if (floatingSettings) renderFloatingSettings(floatingSettings);
      return;
    }

    return runFloatingSettingAction(
      () => api.setFloatingWidgetSize(widgetKey, width, height),
      "无法调整窗口大小。"
    );
  }

  function resetFloatingWidgetSize(widgetKey) {
    return runFloatingSettingAction(
      () => api.resetFloatingWidgetSize(widgetKey),
      "无法恢复默认大小。"
    );
  }

  function resetFloatingWidgetPosition(widgetKey) {
    return runFloatingSettingAction(
      () => api.resetFloatingWidgetPosition(widgetKey),
      "无法重置窗口位置。"
    );
  }

  function resetFloatingCategorySize(categoryKey) {
    return runFloatingSettingAction(
      () => api.resetFloatingCategorySize(categoryKey),
      "无法恢复默认大小。"
    );
  }

  function resetFloatingCategoryPosition(categoryKey) {
    return runFloatingSettingAction(
      () => api.resetFloatingCategoryPosition(categoryKey),
      "无法重置窗口位置。"
    );
  }

  function openRenameDialog(target) {
    if (!target) return;

    lastRenameFocus = document.activeElement;
    renameTarget = target;

    elements.renameTitle.textContent = "编辑名称";
    elements.renameSubtitle.textContent =
      `默认名称：${target.defaultLabel}；留空可恢复默认名称。`;
    elements.renameSubtitle.classList.remove("is-error");
    elements.renameInput.value = target.label;
    elements.renameDialog.hidden = false;
    document.body.classList.add("modal-open");

    requestAnimationFrame(() => {
      elements.renameInput.focus();
      elements.renameInput.select();
    });
  }

  function closeRenameDialog({ restoreFocus = true } = {}) {
    if (elements.renameDialog.hidden) return;

    elements.renameDialog.hidden = true;
    renameTarget = null;

    if (
      elements.historyModal.hidden &&
      (!elements.neteaseAdapterModal || elements.neteaseAdapterModal.hidden) &&
      (!elements.noteReaderModal || elements.noteReaderModal.hidden)
    ) {
      document.body.classList.remove("modal-open");
    }

    if (
      restoreFocus &&
      lastRenameFocus &&
      lastRenameFocus.isConnected &&
      typeof lastRenameFocus.focus === "function"
    ) {
      lastRenameFocus.focus();
    }

    lastRenameFocus = null;
  }

  function showRenameError(message) {
    elements.renameSubtitle.textContent = message;
    elements.renameSubtitle.classList.add("is-error");
    elements.renameInput.focus();
    elements.renameInput.select();
  }

  async function submitRenameDialog() {
    if (!renameTarget || !api) return;

    const { kind, key } = renameTarget;
    const name = elements.renameInput.value;

    elements.renameConfirmButton.disabled = true;

    try {
      const result = kind === "category"
        ? await api.renameFloatingCategory(key, name)
        : await api.renameFloatingWidget(key, name);

      if (result && result.ok) {
        if (result.settings) {
          renderFloatingSettings(result.settings);
        }
        closeRenameDialog({ restoreFocus: false });

        if (currentPage === "personalize" && elements.navPersonalize) {
          elements.navPersonalize.focus();
        } else {
          elements.navWidgets.focus();
        }
      } else {
        showRenameError(result && result.error ? result.error : "无法保存名称。");
      }
    } catch (error) {
      showRenameError("无法保存名称。");
    } finally {
      elements.renameConfirmButton.disabled = false;
    }
  }

  async function pickWidgetBackground(widgetKey) {
    if (!api) return;

    try {
      const result = await api.pickFloatingWidgetBackground(widgetKey);

      if (result && result.ok) {
        if (result.settings) {
          renderFloatingSettings(result.settings);
        }
      } else {
        setStatus(result && result.error ? result.error : "无法选择背景图片。", "error");
      }
    } catch (error) {
      setStatus("无法选择背景图片。", "error");
    }
  }

  async function setWidgetBingBackground(widgetKey, refresh) {
    if (!api) return;

    setStatus(
      refresh ? "正在拉取另一张 Bing 壁纸…" : "正在拉取 Bing 每日壁纸…",
      "info"
    );

    try {
      const result = await api.setFloatingWidgetBingBackground(widgetKey, refresh);

      if (result && result.ok) {
        if (result.settings) {
          renderFloatingSettings(result.settings);
        }
        setStatus("Bing 壁纸已更新。", "success");
      } else {
        setStatus(
          result && result.error ? result.error : "无法获取 Bing 壁纸。",
          "error"
        );
      }
    } catch (error) {
      setStatus("无法获取 Bing 壁纸。", "error");
    }
  }

  async function clearWidgetBackground(widgetKey) {
    if (!api) return;

    try {
      const result = await api.clearFloatingWidgetBackground(widgetKey);

      if (result && result.ok) {
        if (result.settings) {
          renderFloatingSettings(result.settings);
        }
      } else {
        setStatus(result && result.error ? result.error : "无法清除背景图片。", "error");
      }
    } catch (error) {
      setStatus("无法清除背景图片。", "error");
    }
  }

  async function changeFloatingCategoryGrid(categoryKey, rowsInput, colsInput) {
    if (!api) return;

    const rows = Number(rowsInput.value);
    const cols = Number(colsInput.value);

    if (
      !Number.isInteger(rows) || rows < 1 || rows > 8 ||
      !Number.isInteger(cols) || cols < 1 || cols > 8
    ) {
      setStatus("行数和列数需在 1–8 之间。", "error");
      if (floatingSettings) renderFloatingSettings(floatingSettings);
      return;
    }

    try {
      const result = await api.setFloatingCategoryGrid(categoryKey, rows, cols);
      if (result && result.ok) {
        renderFloatingSettings(result.settings);
      } else {
        setStatus(result && result.error ? result.error : "无法调整网格大小。", "error");
        if (floatingSettings) renderFloatingSettings(floatingSettings);
      }
    } catch (error) {
      setStatus("无法调整网格大小。", "error");
      if (floatingSettings) renderFloatingSettings(floatingSettings);
    }
  }

  async function toggleAllFloating() {
    if (!api || !floatingSettings) return;

    const target = (floatingSettings.visibleCount || 0) > 0 ? false : true;

    try {
      const result = await api.setAllFloatingVisible(target);
      if (result && result.ok) {
        renderFloatingSettings(result.settings);
      } else {
        setStatus(result && result.error ? result.error : "无法切换桌面组件显示。", "error");
      }
    } catch (error) {
      setStatus("无法切换桌面组件显示。", "error");
    }
  }

  async function changeFloatingTint(tint) {
    if (!api) return;

    try {
      const result = await api.setFloatingTint(tint);
      if (result && result.ok) {
        renderFloatingSettings(result.settings);
      } else {
        setStatus(result && result.error ? result.error : "无法修改颜色。", "error");
      }
    } catch (error) {
      setStatus("无法修改颜色。", "error");
    }
  }

  async function toggleFloatingFrost() {
    if (!api || !floatingSettings) return;

    try {
      const result = await api.setFloatingFrosted(!floatingSettings.frosted);
      if (result && result.ok) {
        renderFloatingSettings(result.settings);
      } else {
        setStatus(result && result.error ? result.error : "无法切换磨砂效果。", "error");
      }
    } catch (error) {
      setStatus("无法切换磨砂效果。", "error");
    }
  }

  async function changeSmartThemeSettings(patch) {
    if (!api || !floatingSettings) return;

    const current = floatingSettings.smartTheme || {
      enabled: false,
      timeRhythm: true,
      seasonal: true
    };

    try {
      const result = await api.setFloatingSmartTheme({
        ...current,
        ...patch
      });

      if (result && result.ok && result.settings) {
        renderFloatingSettings(result.settings);
      } else {
        setStatus(
          result && result.error ? result.error : "无法更新智能节律主题。",
          "error"
        );
        await refreshFloatingSettings();
      }
    } catch (error) {
      setStatus("无法更新智能节律主题。", "error");
      await refreshFloatingSettings();
    }
  }

  async function changeUiBackground(patch) {
    if (!api || !floatingSettings) return;

    try {
      const result = await api.setUiBackground(patch);

      if (result && result.ok && result.settings) {
        renderFloatingSettings(result.settings);
      } else {
        setStatus(
          result && result.error ? result.error : "无法更新主界面背景。",
          "error"
        );
        await refreshFloatingSettings();
      }
    } catch (error) {
      setStatus("无法更新主界面背景。", "error");
    }
  }

  async function pickUiBackground() {
    if (!api || typeof api.pickUiBackground !== "function") return;

    try {
      const result = await api.pickUiBackground();

      if (result && result.ok && result.settings) {
        renderFloatingSettings(result.settings);
      } else if (result && !result.canceled) {
        setStatus(result.error || "无法选择背景图片。", "error");
      }
    } catch (error) {
      setStatus("无法选择背景图片。", "error");
    }
  }

  async function clearUiBackground() {
    if (!api || typeof api.clearUiBackground !== "function") return;

    try {
      const result = await api.clearUiBackground();

      if (result && result.ok && result.settings) {
        renderFloatingSettings(result.settings);
      } else {
        setStatus(
          result && result.error ? result.error : "无法清除背景图片。",
          "error"
        );
      }
    } catch (error) {
      setStatus("无法清除背景图片。", "error");
    }
  }

  async function performHistoryRollback(runId) {
    if (!api || rollbackInProgress) return;

    rollbackInProgress = true;
    historyArmedRunId = null;
    clearTimeout(historyTimer);
    historyTimer = null;
    renderHistoryList();
    renderHistoryResultMessage("正在执行回档，请稍候…");
    updateButtons();

    try {
      const result = await api.rollbackHistory(runId);

      if (!result || !result.ok) {
        renderHistoryResultError(result && result.error ? result.error : "回档失败。");
        return;
      }

      renderHistoryRollbackResult(result);
      await refreshHistoryList();
      await refreshAfterMove();
      await refreshUndoStatus();
    } catch (error) {
      renderHistoryResultError(error.message || "回档失败。");
    } finally {
      rollbackInProgress = false;
      renderHistoryList();
      updateButtons();
    }
  }

  function categoryLabelFor(categoryKey) {
    return CATEGORY_META[categoryKey]?.label || categoryKey || "未知分类";
  }

  function updatePlanFileCategory(sourcePath, assignedCategory) {
    if (!currentPlan) return false;

    let updated = false;

    currentPlan.categories.forEach((category) => {
      category.files.forEach((file) => {
        if (file.sourcePath === sourcePath) {
          file.assignedCategory = assignedCategory || null;
          updated = true;
        }
      });
    });

    return updated;
  }

  function buildDisplayCategories(plan) {
    const display = plan.categories.map((category) => ({
      ...category,
      files: []
    }));
    const byKey = new Map(display.map((category) => [category.key, category]));
    const collator = new Intl.Collator("zh-CN", { numeric: true, sensitivity: "base" });

    plan.categories.forEach((category) => {
      category.files.forEach((file) => {
        const targetKey =
          file.assignedCategory && byKey.has(file.assignedCategory)
            ? file.assignedCategory
            : category.key;

        byKey.get(targetKey).files.push({
          ...file,
          naturalCategoryKey: category.key,
          naturalCategoryLabel: category.label,
          isManualCategory: Boolean(file.assignedCategory)
        });
      });
    });

    display.forEach((category) => {
      category.files.sort((left, right) => collator.compare(left.name, right.name));
    });

    return display;
  }

  function clearCategoryDropHighlights() {
    elements.categoryGrid
      .querySelectorAll(".category-card.is-drop-target")
      .forEach((card) => card.classList.remove("is-drop-target"));
  }

  async function assignPreviewCategory(sourcePath, toCategory) {
    if (!api || manualBusy) return;

    manualBusy = true;
    updateButtons();

    try {
      const result = await api.assignPreviewCategory(sourcePath, toCategory);

      if (!result || !result.ok) {
        setStatus(result && result.error ? result.error : "无法调整分类归属。", "error");
        return;
      }

      if (!result.changed) return;

      updatePlanFileCategory(result.path || sourcePath, result.assignedCategory || toCategory);
      manualUndoStatus = result.status || manualUndoStatus;

      if (currentPlan) {
        renderPlan(currentPlan, { preserveSelection: true });
      }

      let message =
        `已将「${result.name}」的显示分类调整为「${categoryLabelFor(result.toCategory)}」。`;
      if (result.saveError) {
        message += ` 归属记录保存失败：${result.saveError}`;
      }
      if (result.logError) {
        message += ` 日志写入失败：${result.logError}`;
      }

      setStatus(message, result.saveError || result.logError ? "warn" : "success");
    } catch (error) {
      setStatus("无法调整分类归属。", "error");
    } finally {
      manualBusy = false;
      await refreshManualUndoStatus();
    }
  }

  async function undoManualAdjustment() {
    if (!api || manualBusy || !manualUndoStatus.available) return;

    manualBusy = true;
    updateButtons();

    try {
      const result = await api.undoManualCategory();

      if (!result || !result.ok) {
        setStatus(result && result.error ? result.error : "无法撤销分类调整。", "error");
        return;
      }

      updatePlanFileCategory(result.path, result.assignedCategory);

      if (currentPlan) {
        renderPlan(currentPlan, { preserveSelection: true });
      }

      manualUndoStatus = result.status || manualUndoStatus;

      let message =
        `已撤销「${result.name}」的分类调整，显示分类回到「${categoryLabelFor(result.restoredCategory)}」。`;
      if (result.saveError) {
        message += ` 归属记录保存失败：${result.saveError}`;
      }
      if (result.logError) {
        message += ` 日志写入失败：${result.logError}`;
      }

      setStatus(message, result.saveError || result.logError ? "warn" : "success");
    } catch (error) {
      setStatus("无法撤销分类调整。", "error");
    } finally {
      manualBusy = false;
      await refreshManualUndoStatus();
    }
  }

  function createCategoryCard(category) {
    const meta = CATEGORY_META[category.key] || { icon: "•" };
    const card = document.createElement("article");
    card.className = `ui-card category-card category-${category.key} tone-${CATEGORY_TONES[category.key] || "yellow"}`;
    card.dataset.categoryKey = category.key;
    card.classList.toggle("is-empty", category.files.length === 0);

    card.addEventListener("dragover", (event) => {
      if (!previewDrag || previewDrag.fromCategory === category.key) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      clearCategoryDropHighlights();
      card.classList.add("is-drop-target");
    });

    card.addEventListener("dragleave", (event) => {
      if (!card.contains(event.relatedTarget)) {
        card.classList.remove("is-drop-target");
      }
    });

    card.addEventListener("drop", (event) => {
      if (!previewDrag) return;

      event.preventDefault();

      const drag = previewDrag;
      previewDrag = null;
      clearCategoryDropHighlights();

      if (drag.fromCategory === category.key) return;
      assignPreviewCategory(drag.sourcePath, category.key);
    });

    const header = document.createElement("header");
    header.className = "category-header";

    const icon = document.createElement("span");
    icon.className = "category-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.append(createIcon(meta.icon || "document", "icon"));

    const titleWrap = document.createElement("div");
    titleWrap.className = "category-title-wrap";

    const title = document.createElement("h3");
    title.textContent = category.label;

    const count = document.createElement("p");
    count.textContent = `${category.files.length} 个文件`;

    titleWrap.append(title, count);
    header.append(icon, titleWrap);

    const target = document.createElement("p");
    target.className = "target-path";

    const targetLabel = document.createElement("span");
    targetLabel.textContent = "显示在";

    const targetCode = document.createElement("code");
    targetCode.textContent = `${category.label}小组件`;
    targetCode.title = `归入：${category.label}小组件`;

    target.append(targetLabel, targetCode);

    const list = document.createElement("ul");
    list.className = "file-list";

    if (category.files.length === 0) {
      const empty = document.createElement("li");
      empty.className = "file-empty";
      empty.textContent = "拖动文件到这里调整显示归属";
      list.append(empty);
    }

    category.files.forEach((file) => {
      const isManual = Boolean(file.isManualCategory);
      const item = document.createElement("li");
      item.className = "file-item";
      item.draggable = true;
      item.dataset.sourcePath = file.sourcePath;
      item.title = [
        file.sourcePath,
        `显示分类：${category.label}`,
        `归入：${category.label}小组件`,
        isManual
          ? `原始分类：${file.naturalCategoryLabel || "未知"}；手动调整只影响显示，不改变文件位置`
          : ""
      ].filter(Boolean).join("\n");

      if (isManual) {
        item.classList.add("is-manual-category");
      }

      const label = document.createElement("label");
      label.className = "file-select";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "file-checkbox";
      checkbox.checked = selectedPaths.has(file.sourcePath);
      checkbox.dataset.sourcePath = file.sourcePath;
      checkbox.setAttribute("aria-label", `整理 ${file.name}`);
      checkbox.addEventListener("change", () => handleFileSelection(checkbox));

      const name = document.createElement("span");
      name.className = "file-name";
      name.textContent = file.name;

      const destination = document.createElement("span");
      destination.className = "file-dest";
      destination.textContent = `→ ${category.label}`;
      destination.title = `归入：${category.label}小组件`;

      const extension = document.createElement("span");
      extension.className = "file-ext";
      extension.textContent = file.kind === "folder"
        ? "文件夹"
        : file.extension
          ? file.extension.replace(".", "").toUpperCase()
          : "无扩展名";

      label.append(checkbox, name, destination, extension);
      item.append(label);
      item.classList.toggle("is-unselected", !checkbox.checked);
      fileCheckboxes.push(checkbox);

      item.addEventListener("dragstart", (event) => {
        previewDrag = {
          sourcePath: file.sourcePath,
          fromCategory: category.key
        };
        item.classList.add("is-dragging");
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", file.sourcePath);
        event.dataTransfer.setData(
          "application/x-within-cubes-file",
          file.sourcePath
        );
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("is-dragging");
        previewDrag = null;
        clearCategoryDropHighlights();
      });

      list.append(item);
    });

    card.append(header, target, list);
    return card;
  }

  function renderPlan(plan, { preserveSelection = false } = {}) {
    if (!elements.results || !elements.categoryGrid) {
      updateSelectionUI();
      applySearchFilter();
      return;
    }

    currentPlan = plan;
    fileCheckboxes = [];

    if (!preserveSelection) {
      resetSelection(plan);
    }

    const categories = buildDisplayCategories(plan);
    const skipped = Array.isArray(plan.skipped) ? plan.skipped : [];

    elements.skippedNotice.hidden = skipped.length === 0;
    elements.skippedNotice.textContent = skipped.length === 0
      ? ""
      : `另有 ${skipped.length} 个文件因类型不支持将被跳过：${skipped.map((item) => item.name).join("、")}`;
    elements.skippedNotice.title = skipped
      .map((item) => `${item.name}：${item.reason}`)
      .join("\n");

    if (plan.totalFiles === 0) {
      elements.results.hidden = true;
      elements.actionBar.hidden = true;
      elements.emptyState.hidden = false;
      elements.emptyState.classList.remove("is-loading");

      if (skipped.length > 0) {
        const names = skipped.map((item) => item.name).join("、");
        setEmptyState(
          "没有可整理的文件",
          `${skipped.length} 个文件因类型不支持被跳过：${names}`
        );
        elements.emptyText.title = skipped
          .map((item) => `${item.name}：${item.reason}`)
          .join("\n");
      } else {
        setEmptyState("桌面已经很整洁了", "这次没有发现需要整理的文件。");
        elements.emptyText.title = "";
      }

      updateSelectionUI();
      applySearchFilter();
      return;
    }

    elements.emptyState.hidden = true;
    elements.results.hidden = false;
    elements.actionBar.hidden = false;
    elements.summaryTitle.textContent = `共找到 ${plan.totalFiles} 个文件`;
    elements.summaryNote.textContent =
      "勾选的文件只会登记归属，文件仍留在桌面原位，可在分类小组件中查看；未勾选的文件保持原样。拖动文件到其他分类只调整归属，不会移动或复制文件。";
    elements.categoryGrid.replaceChildren();

    categories.forEach((category) => {
      elements.categoryGrid.append(createCategoryCard(category));
    });

    updateSelectionUI();
    applySearchFilter();
  }

  function setOrganizeStatus(title, text, tone = "info") {
    if (!elements.emptyTitle || !elements.emptyText || !elements.emptyState) return;

    elements.emptyTitle.textContent = title;
    elements.emptyText.textContent = text;
    elements.emptyText.title = text;
    elements.emptyState.dataset.tone = tone;
    elements.emptyState.classList.remove("is-loading");
    elements.emptyState.hidden = false;
  }

  function setScanModalOpen(open) {
    if (!elements.scanModal) return;

    elements.scanModal.hidden = !open;

    if (open) {
      document.body.classList.add("modal-open");
    } else if (
      elements.renameDialog.hidden &&
      elements.historyModal.hidden &&
      (!elements.neteaseAdapterModal || elements.neteaseAdapterModal.hidden) &&
      (!elements.noteReaderModal || elements.noteReaderModal.hidden)
    ) {
      document.body.classList.remove("modal-open");
    }
  }

  function flattenPlanFiles(plan) {
    if (!plan) return [];

    return buildDisplayCategories(plan).flatMap((category) =>
      category.files.map((file) => ({
        ...file,
        categoryKey: category.key,
        categoryLabel: category.label
      }))
    );
  }

  function renderScanModal(plan) {
    if (!elements.scanModalList) return;

    const files = flattenPlanFiles(plan);
    const skipped = Array.isArray(plan && plan.skipped) ? plan.skipped : [];

    elements.scanModalList.replaceChildren();

    if (files.length === 0) {
      const empty = document.createElement("div");
      empty.className = "scan-file-empty";
      empty.textContent = "桌面没有需要整理的文件。";
      elements.scanModalList.append(empty);
    } else {
      files.forEach((file) => {
        const row = document.createElement("div");
        row.className = "scan-file-row";
        row.title = file.sourcePath || file.name;

        const tone = CATEGORY_TONES[file.categoryKey] || "blue";
        const icon = document.createElement("span");
        icon.className = `scan-file-icon tone-${tone}`;
        icon.setAttribute("aria-hidden", "true");
        icon.append(createIcon(CATEGORY_ICON_NAMES[file.categoryKey] || "document", "icon"));

        const name = document.createElement("span");
        name.className = "scan-file-name";
        name.textContent = file.name;

        const category = document.createElement("span");
        category.className = `scan-file-category tone-${tone}`;
        category.textContent = file.categoryLabel;

        row.append(icon, name, category);
        elements.scanModalList.append(row);
      });
    }

    if (elements.scanModalMeta) {
      elements.scanModalMeta.textContent = files.length === 0
        ? "没有可整理的文件"
        : `共 ${files.length} 个文件 · 确认后仅登记分类归属`;
    }

    if (elements.scanModalNote) {
      elements.scanModalNote.hidden = skipped.length === 0;
      elements.scanModalNote.textContent = skipped.length === 0
        ? ""
        : `已跳过 ${skipped.length} 个不支持的文件：${skipped
            .map((item) => item.name)
            .join("、")}`;
      elements.scanModalNote.title = skipped
        .map((item) => `${item.name}：${item.reason}`)
        .join("\n");
    }

    if (elements.scanCancelButton) {
      elements.scanCancelButton.textContent = files.length === 0 ? "关闭" : "取消";
    }

    updateSelectionUI();
  }

  function openScanModal(plan) {
    if (!elements.scanModal) return;

    currentPlan = plan;
    resetSelection(plan);
    renderScanModal(plan);
    setScanModalOpen(true);

    requestAnimationFrame(() => {
      const target = getSelectedCount() > 0
        ? elements.scanConfirmButton
        : elements.scanCancelButton;
      if (target) target.focus();
    });
  }

  function closeScanModal({ restoreFocus = true } = {}) {
    if (!elements.scanModal || organizing) return;

    setScanModalOpen(false);

    if (restoreFocus && elements.scanButton) {
      elements.scanButton.focus({ preventScroll: true });
    }
  }

  function cancelScan() {
    if (organizing) return;

    closeScanModal();
    currentPlan = null;
    selectedPaths = new Set();
    fileCheckboxes = [];
    setOrganizeStatus("已取消本次整理", "桌面文件与分类归属均未发生变化。");
    updateButtons();
  }

  async function scan() {
    if (scanning || organizing || undoing || rollbackInProgress) return;

    if (!api) {
      setStatus("预加载脚本未生效，无法连接主进程。", "error");
      return;
    }

    scanning = true;
    resetUndoArmed();
    showPage("organize");
    currentPlan = null;
    selectedPaths = new Set();
    clearStatus();
    closeScanModal({ restoreFocus: false });
    setOrganizeStatus("正在扫描桌面…", "稍等片刻，正在读取桌面上的文件。", "loading");
    updateButtons();

    try {
      const result = await api.scan();

      if (!result || !result.ok) {
        setOrganizeStatus("扫描失败", result && result.error ? result.error : "无法读取桌面目录。", "error");
        setStatus(result && result.error ? result.error : "扫描失败。", "error");
        return;
      }

      const fileCount = Number(result.plan.totalFiles) || 0;
      const skippedCount = Array.isArray(result.plan.skipped) ? result.plan.skipped.length : 0;
      setOrganizeStatus(
        fileCount > 0 ? `已找到 ${fileCount} 个可整理文件` : "桌面没有需要整理的文件",
        fileCount > 0
          ? "请在预览中确认文件与归类，确认后才会登记归属。"
          : skippedCount > 0
            ? `${skippedCount} 个文件类型不受支持，已自动跳过。`
            : "桌面当前没有可归类的文件。"
      );
      openScanModal(result.plan);
    } catch (error) {
      setOrganizeStatus("扫描失败", error.message || "未知错误。", "error");
      setStatus(error.message || "扫描失败。", "error");
    } finally {
      scanning = false;
      updateButtons();
    }
  }

  async function refreshAfterMove() {
    currentPlan = null;
    selectedPaths = new Set();
    fileCheckboxes = [];
    if (elements.actionBar) elements.actionBar.hidden = true;
    updateButtons();
  }

  async function organize() {
    const selectedCount = getSelectedCount();
    if (!currentPlan || selectedCount === 0 || organizing || undoing || rollbackInProgress) {
      return;
    }

    const selected = Array.from(selectedPaths);
    resetUndoArmed();
    organizing = true;
    setStatus("正在登记归属，请稍候…", "info");
    updateButtons();

    try {
      const result = await api.organize(selected);

      if (!result || !result.ok) {
        setStatus(result && result.error ? result.error : "整理失败。", "error");
        return;
      }

      const report = result.report;
      let message = `已登记 ${report.assigned} 个文件的归属，文件仍在桌面原位。`;

      if (report.skipped > 0) {
        message += ` ${report.skipped} 个文件已跳过。`;
      }
      if (report.errors.length > 0) {
        message += ` ${report.errors.length} 个文件登记失败。`;
      }
      if (result.saveError) {
        message += ` 归属记录保存失败：${result.saveError}`;
      }
      if (result.logError) {
        message += ` 日志写入失败：${result.logError}`;
      }
      if (result.historyError) {
        message += ` 历史记录保存失败：${result.historyError}`;
      }

      setStatus(
        message,
        report.errors.length > 0 ||
          result.saveError ||
          result.logError ||
          result.historyError
          ? "warn"
          : "success"
      );

      if (report.assigned > 0) {
        const selectedSet = new Set(selected);
        const organized = [];

        currentPlan.categories.forEach((category) => {
          category.files.forEach((file) => {
            if (!selectedSet.has(file.sourcePath)) return;

            organized.push({
              name: file.name,
              category: category.key,
              kind: file.kind,
              at: Date.now()
            });
          });
        });

        rememberOrganized(organized);
      }

      setOrganizeStatus(
        "整理完成",
        `已登记 ${report.assigned} 个文件的分类归属，文件仍在桌面原位。`
      );
      setScanModalOpen(false);
      currentPlan = null;
      selectedPaths = new Set();
      fileCheckboxes = [];
      await refreshAfterMove();

      if (elements.scanButton) {
        elements.scanButton.focus({ preventScroll: true });
      }
    } catch (error) {
      setStatus(error.message || "整理失败。", "error");
    } finally {
      organizing = false;
      await refreshUndoStatus();
      updateButtons();
    }
  }

  async function undoLastRun() {
    if (!undoStatus.available || undoing || rollbackInProgress) return;

    if (!undoArmed) {
      undoArmed = true;
      clearTimeout(undoTimer);
      undoTimer = setTimeout(() => {
        undoArmed = false;
        setStatus("撤销确认已取消。", "info");
        updateButtons();
      }, 6000);
      setStatus(
        `将删除上次整理的 ${undoStatus.count} 条归属记录，桌面文件不会被移动；再次点击「确认撤销」执行。`,
        "info"
      );
      updateButtons();
      return;
    }

    clearTimeout(undoTimer);
    undoArmed = false;
    undoing = true;
    setStatus("正在撤销上次整理…", "info");
    updateButtons();

    try {
      const result = await api.undo();

      if (!result || !result.ok) {
        setStatus(result && result.error ? result.error : "撤销失败。", "error");
        return;
      }

      const report = result.report;
      let message = `已撤销上次整理，解除 ${report.removed} 条归属记录，桌面文件未移动。`;

      if (report.skipped > 0) {
        message += ` ${report.skipped} 条记录已跳过。`;
      }
      if (report.errors.length > 0) {
        message += ` ${report.errors.length} 条记录撤销失败。`;
      }
      if (result.saveError) {
        message += ` 归属记录保存失败：${result.saveError}`;
      }
      if (result.logError) {
        message += ` 回档日志写入失败：${result.logError}`;
      }
      if (result.historyError) {
        message += ` 历史记录保存失败：${result.historyError}`;
      }

      setStatus(
        message,
        report.errors.length > 0 ||
          report.skipped > 0 ||
          result.saveError ||
          result.logError ||
          result.historyError
          ? "warn"
          : "success"
      );
      await refreshAfterMove();
    } catch (error) {
      setStatus(error.message || "撤销失败。", "error");
    } finally {
      undoing = false;
      await refreshUndoStatus();
      updateButtons();
    }
  }

  elements.scanButton.addEventListener("click", scan);
  elements.historyButton.addEventListener("click", openHistory);
  elements.undoButton.addEventListener("click", undoLastRun);
  elements.manualUndoButton.addEventListener("click", undoManualAdjustment);
  elements.closeHistoryButton.addEventListener("click", closeHistory);
  elements.toggleAllFloatingButton.addEventListener("click", toggleAllFloating);
  elements.toggleFrostButton.addEventListener("click", toggleFloatingFrost);

  if (elements.scanConfirmButton) {
    elements.scanConfirmButton.addEventListener("click", organize);
  }
  if (elements.scanCancelButton) {
    elements.scanCancelButton.addEventListener("click", cancelScan);
  }
  if (elements.scanModalClose) {
    elements.scanModalClose.addEventListener("click", cancelScan);
  }
  if (elements.scanModal) {
    elements.scanModal.addEventListener("click", (event) => {
      if (event.target === elements.scanModal) cancelScan();
    });
  }

  if (elements.dashPrivacyCard) {
    elements.dashPrivacyCard.addEventListener("click", toggleDashboardPrivacy);
    elements.dashPrivacyCard.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggleDashboardPrivacy();
    });
  }

  if (elements.toggleWallpaperBrightnessButton) {
    elements.toggleWallpaperBrightnessButton.addEventListener("click", async () => {
      if (!api) return;
      const enabled =
        elements.toggleWallpaperBrightnessButton.getAttribute("aria-checked") !== "true";
      const result = await api.setFollowWallpaperBrightness(enabled);

      if (result && result.ok) {
        if (result.settings) renderFloatingSettings(result.settings);
        setStatus(
          enabled ? "已跟随壁纸亮度。" : "已关闭壁纸亮度跟随。",
          "success"
        );
      } else {
        setStatus(result && result.error ? result.error : "无法更新壁纸亮度跟随。", "error");
      }
    });
  }

  if (elements.togglePerformanceModeButton) {
    elements.togglePerformanceModeButton.addEventListener("click", async () => {
      if (!api) return;
      const enabled =
        elements.togglePerformanceModeButton.getAttribute("aria-checked") !== "true";
      const result = await api.setPerformanceMode(enabled);

      if (result && result.ok) {
        if (result.settings) renderFloatingSettings(result.settings);
        setStatus(
          enabled ? "性能保护模式已开启。" : "性能保护模式已关闭。",
          "success"
        );
      } else {
        setStatus(result && result.error ? result.error : "无法更新性能保护模式。", "error");
      }
    });
  }

  if (elements.toggleDepth3dButton) {
    elements.toggleDepth3dButton.addEventListener("click", async () => {
      if (!api) return;
      const enabled =
        elements.toggleDepth3dButton.getAttribute("aria-checked") !== "true";
      const result = await api.setDepth3d(enabled);

      if (result && result.ok) {
        if (result.settings) renderFloatingSettings(result.settings);
        setStatus(
          enabled
            ? "3D 景深已开启：按住 Ctrl 滚动滚轮调整组件深度。"
            : "3D 景深已关闭。",
          "success"
        );
      } else {
        setStatus(result && result.error ? result.error : "无法更新 3D 景深。", "error");
      }
    });
  }

  if (elements.toggleMusicVisualizerButton) {
    elements.toggleMusicVisualizerButton.addEventListener("click", async () => {
      if (!api) return;
      const enabled =
        elements.toggleMusicVisualizerButton.getAttribute("aria-checked") !== "true";
      const result = await api.setMusicVisualizer(enabled);

      if (result && result.ok) {
        if (result.settings) renderFloatingSettings(result.settings);
        setStatus(
          enabled ? "音乐封面背景已开启。" : "音乐封面背景已关闭。",
          "success"
        );
      } else {
        setStatus(result && result.error ? result.error : "无法更新音乐封面背景。", "error");
      }
    });
  }

  elements.toggleSmartThemeButton.addEventListener("click", () => {
    const enabled =
      elements.toggleSmartThemeButton.getAttribute("aria-checked") !== "true";
    changeSmartThemeSettings({ enabled });
  });
  elements.toggleSmartTimeButton.addEventListener("click", () => {
    const enabled =
      elements.toggleSmartTimeButton.getAttribute("aria-checked") !== "true";
    changeSmartThemeSettings({ timeRhythm: enabled });
  });
  elements.toggleSmartSeasonButton.addEventListener("click", () => {
    const enabled =
      elements.toggleSmartSeasonButton.getAttribute("aria-checked") !== "true";
    changeSmartThemeSettings({ seasonal: enabled });
  });

  elements.uiBackgroundTypes.addEventListener("click", (event) => {
    const button = event.target.closest("[data-ui-bg-type]");
    if (!button) return;

    const type = button.dataset.uiBgType;
    const hasImage = Boolean(
      floatingSettings &&
      floatingSettings.uiBackground &&
      floatingSettings.uiBackground.imagePath
    );

    if (type === "image" && !hasImage) {
      pickUiBackground();
      return;
    }

    changeUiBackground({ type });
  });

  elements.uiBgSolidColor.addEventListener("change", () => {
    changeUiBackground({
      type: "solid",
      color: elements.uiBgSolidColor.value
    });
  });
  elements.uiBgGradientStart.addEventListener("change", () => {
    changeUiBackground({
      type: "gradient",
      gradientStart: elements.uiBgGradientStart.value,
      gradientEnd: elements.uiBgGradientEnd.value
    });
  });
  elements.uiBgGradientEnd.addEventListener("change", () => {
    changeUiBackground({
      type: "gradient",
      gradientStart: elements.uiBgGradientStart.value,
      gradientEnd: elements.uiBgGradientEnd.value
    });
  });
  elements.uiBgGradientPresets.addEventListener("click", (event) => {
    const button = event.target.closest("[data-ui-gradient]");
    if (!button) return;

    const [gradientStart, gradientEnd] = String(button.dataset.uiGradient || "")
      .split(":");

    if (!gradientStart || !gradientEnd) return;

    changeUiBackground({
      type: "gradient",
      gradientStart,
      gradientEnd
    });
  });
  elements.uiBgPickButton.addEventListener("click", pickUiBackground);
  elements.uiBgClearButton.addEventListener("click", clearUiBackground);

  elements.pageSettings.querySelectorAll("[data-open-path]").forEach((button) => {
    button.addEventListener("click", () => handleOpenPath(button.dataset.openPath));
  });

  if (elements.neteaseAdapterButton) {
    elements.neteaseAdapterButton.addEventListener("click", openNeteaseAdapterModal);
    elements.neteaseAdapterButton.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openNeteaseAdapterModal();
    });
  }

  if (elements.neteaseAdapterModal) {
    elements.neteaseAdapterModal.addEventListener("click", (event) => {
      if (event.target === elements.neteaseAdapterModal) {
        closeNeteaseAdapterModal();
      }
    });

    elements.neteaseAdapterModal
      .querySelectorAll("[data-netease-link]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          openNeteaseAdapterLink(button.dataset.neteaseLink);
        });
      });
  }

  if (elements.neteaseAdapterCloseButton) {
    elements.neteaseAdapterCloseButton.addEventListener("click", () => {
      closeNeteaseAdapterModal();
    });
  }

  if (elements.neteaseAdapterDoneButton) {
    elements.neteaseAdapterDoneButton.addEventListener("click", () => {
      closeNeteaseAdapterModal();
    });
  }

  if (elements.openNeteaseDirButton) {
    elements.openNeteaseDirButton.addEventListener("click", openNeteaseInstallDir);
  }

  if (elements.openAchievementsButton) {
    elements.openAchievementsButton.addEventListener("click", openAchievementsPage);
    elements.openAchievementsButton.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openAchievementsPage();
    });
  }

  if (elements.openAchievementsPageButton) {
    elements.openAchievementsPageButton.addEventListener("click", openAchievementsPage);
  }

  if (elements.dashboardAchievementCard) {
    elements.dashboardAchievementCard.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (event.target !== elements.dashboardAchievementCard) return;
      event.preventDefault();
      openAchievementsPage();
    });
  }

  if (elements.achievementsBackLink) {
    elements.achievementsBackLink.addEventListener("click", (event) => {
      event.preventDefault();
      showPage("home");
      collapseSidebarAfterNavigation();
    });
  }

  const openShortcutsPage = () => {
    showPage("shortcuts");
    collapseSidebarAfterNavigation();
    loadShortcuts().catch(() => {});
  };

  if (elements.openShortcutsButton) {
    elements.openShortcutsButton.addEventListener("click", openShortcutsPage);
    elements.openShortcutsButton.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openShortcutsPage();
    });
  }

  if (elements.shortcutsBackLink) {
    elements.shortcutsBackLink.addEventListener("click", (event) => {
      event.preventDefault();
      showPage("settings");
      collapseSidebarAfterNavigation();
    });
  }

  if (elements.achievementFilters) {
    elements.achievementFilters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-achievement-filter]");
      if (!button) return;
      achievementFilter = button.dataset.achievementFilter || "all";
      renderAchievementsGallery();
    });
  }

  document.querySelectorAll("[data-about-panel]").forEach((button) => {
    button.addEventListener("click", () => {
      openAboutPanel(button.dataset.aboutPanel);
    });
  });

  if (elements.aboutBackLink) {
    elements.aboutBackLink.addEventListener("click", (event) => {
      event.preventDefault();
      closeAboutDetail();
    });
  }

  if (elements.resetShortcutsButton) {
    elements.resetShortcutsButton.addEventListener("click", resetShortcuts);
  }

  document.addEventListener("keydown", handleShortcutRecordingKeydown, true);
  window.addEventListener("blur", () => {
    if (shortcutRecordingAction) cancelShortcutRecording();
  });

  if (api && typeof api.onAchievementsChanged === "function") {
    api.onAchievementsChanged(() => {
      loadAchievementsData();
    });
  }

  if (api && typeof api.onShowHome === "function") {
    api.onShowHome(() => {
      showPage("home");
      collapseSidebarAfterNavigation();
    });
  }

  setupTodoManager();
  setupDonateEntry();

  if (elements.resetDesktopLayoutButton) {
    elements.resetDesktopLayoutButton.addEventListener("click", async () => {
      if (!api || typeof api.resetDesktopLayout !== "function") return;

      try {
        const result = await api.resetDesktopLayout();

        if (!result || !result.ok) {
          setStatus(
            result && result.error ? result.error : "无法重置桌面布局。",
            "error"
          );
          return;
        }

        if (result.canceled) return;

        if (result.settings) renderFloatingSettings(result.settings);
        setStatus("桌面布局已重置。", "success");
      } catch (error) {
        setStatus("无法重置桌面布局。", "error");
      }
    });
  }

  if (elements.exportLayoutButton) {
    elements.exportLayoutButton.addEventListener("click", async () => {
      if (!api) return;
      elements.exportLayoutButton.disabled = true;

      try {
        const result = await api.exportLayout();

        if (result && result.ok && !result.canceled) {
          setStatus("桌面布局已导出。", "success");
        } else if (result && !result.ok) {
          setStatus(result.error || "无法导出布局。", "error");
        }
      } catch (error) {
        setStatus("无法导出布局。", "error");
      } finally {
        elements.exportLayoutButton.disabled = false;
      }
    });
  }

  if (elements.importLayoutButton) {
    elements.importLayoutButton.addEventListener("click", async () => {
      if (!api) return;
      elements.importLayoutButton.disabled = true;

      try {
        const result = await api.importLayout();

        if (result && result.ok && !result.canceled) {
          if (result.settings) {
            floatingSettings = result.settings;
            renderFloatingSettings(result.settings);
          }
          const rescued = result.rescue && result.rescue.moved
            ? Number(result.rescue.moved)
            : 0;
          if (rescued > 0) {
            setStatus(
              result.rescue.rebuilt
                ? "布局已导入，但原坐标全都不在当前屏幕内，已按默认网格重新排列。"
                : `布局已导入，${rescued} 个越界组件已拉回主屏可见区域。`,
              "success"
            );
          } else {
            setStatus("桌面布局已导入。", "success");
          }
        } else if (result && !result.ok) {
          setStatus(result.error || "无法导入布局。", "error");
        }
      } catch (error) {
        setStatus("无法导入布局。", "error");
      } finally {
        elements.importLayoutButton.disabled = false;
      }
    });
  }

  if (elements.importIconPackButton) {
    elements.importIconPackButton.addEventListener("click", async () => {
      if (!api) return;
      elements.importIconPackButton.disabled = true;

      try {
        const result = await api.importIconPack();

        if (result && result.ok && !result.canceled) {
          setStatus(`图标包已导入，共 ${result.count || 0} 个类型图标。`, "success");
        } else if (result && !result.ok) {
          setStatus(result.error || "无法导入图标包。", "error");
        }
      } catch (error) {
        setStatus("无法导入图标包。", "error");
      } finally {
        elements.importIconPackButton.disabled = false;
      }
    });
  }

  if (elements.replayOnboardingButton) {
    elements.replayOnboardingButton.addEventListener("click", async () => {
      if (!api || typeof api.startOnboarding !== "function") {
        setStatus("当前版本无法打开桌面新手引导。", "error");
        return;
      }

      elements.replayOnboardingButton.disabled = true;

      try {
        const result = await api.startOnboarding();

        if (!result || !result.ok) {
          setStatus(result?.error || "无法打开桌面新手引导。", "error");
        }
      } catch (error) {
        setStatus("无法打开桌面新手引导。", "error");
      } finally {
        elements.replayOnboardingButton.disabled = false;
      }
    });
  }

  if (elements.resetAllDataButton) {
    elements.resetAllDataButton.addEventListener("click", async () => {
      if (!api) return;
      elements.resetAllDataButton.disabled = true;

      try {
        const result = await api.resetAllData();

        if (result && result.ok && !result.canceled) {
          setStatus("已重置全部数据，正在重启…", "info");
          return;
        }
      } catch (error) {
        setStatus("无法重置数据。", "error");
      } finally {
        elements.resetAllDataButton.disabled = false;
      }
    });
  }

  if (elements.clipboardNoteButton) {
    elements.clipboardNoteButton.addEventListener("click", saveClipboardNoteNow);
  }

  if (elements.toggleShellIntegrationButton) {
    elements.toggleShellIntegrationButton.addEventListener("click", toggleShellIntegration);
  }

  Object.entries(navItems).forEach(([page, node]) => {
    node.addEventListener("click", () => {
      if (page === "widgets") {
        if (window.location.hash !== "#globalOverview") {
          window.location.hash = "globalOverview";
        }
      } else if (window.location.hash) {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`
        );
      }
      showPage(page);
      collapseSidebarAfterNavigation();
    });
  });
  elements.renameCancelButton.addEventListener("click", () => closeRenameDialog());
  elements.renameConfirmButton.addEventListener("click", submitRenameDialog);

  if (elements.noteEditorClose) {
    elements.noteEditorClose.addEventListener("click", closeNoteEditor);
  }
  if (elements.noteEditorCancel) {
    elements.noteEditorCancel.addEventListener("click", closeNoteEditor);
  }
  if (elements.noteEditorSave) {
    elements.noteEditorSave.addEventListener("click", saveNoteEditor);
  }
  if (elements.noteEditorModal) {
    elements.noteEditorModal.addEventListener("click", (event) => {
      if (event.target === elements.noteEditorModal) closeNoteEditor();
    });
  }
  if (elements.noteEditorBodyInput) {
    elements.noteEditorBodyInput.addEventListener("keydown", (event) => {
      if (event.isComposing) return;
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        saveNoteEditor();
      }
    });
  }

  if (elements.noteReaderClose) {
    elements.noteReaderClose.addEventListener("click", () => closeNoteReader());
  }
  if (elements.noteReaderDone) {
    elements.noteReaderDone.addEventListener("click", () => closeNoteReader());
  }
  if (elements.noteReaderCopy) {
    elements.noteReaderCopy.addEventListener("click", copyActiveNote);
  }
  if (elements.noteReaderEdit) {
    elements.noteReaderEdit.addEventListener("click", editActiveNoteReader);
  }
  if (elements.noteReaderModal) {
    elements.noteReaderModal.addEventListener("click", (event) => {
      if (event.target === elements.noteReaderModal) closeNoteReader();
    });
  }

  if (elements.personalizeBack) {
    elements.personalizeBack.addEventListener("click", (event) => {
      event.preventDefault();
      closePersonalizeDetail();
    });
  }

  if (elements.filterDisabledComponents) {
    elements.filterDisabledComponents.addEventListener("click", () => {
      showOnlyDisabledComponents = !showOnlyDisabledComponents;
      updateComponentFilterState();

      if (
        floatingSettings &&
        currentPage === "personalize" &&
        !personalizeDetailKey
      ) {
        renderPersonalizePage(floatingSettings);
      }

      applySearchFilter();
    });
  }

  elements.renameInput.addEventListener("keydown", (event) => {
    if (event.isComposing) return;
    if (event.key === "Enter") {
      event.preventDefault();
      submitRenameDialog();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeRenameDialog();
    }
  });

  elements.renameDialog.addEventListener("click", (event) => {
    if (event.target === elements.renameDialog) {
      closeRenameDialog();
    }
  });

  Array.from(elements.tintOptions.querySelectorAll("[data-tint]")).forEach((button) => {
    button.addEventListener("click", () => changeFloatingTint(button.dataset.tint));
  });

  elements.historyModal.addEventListener("click", (event) => {
    if (event.target === elements.historyModal) {
      closeHistory();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    if (elements.donateModal && !elements.donateModal.hidden) {
      closeDonateModal();
    } else if (elements.neteaseAdapterModal && !elements.neteaseAdapterModal.hidden) {
      closeNeteaseAdapterModal();
    } else if (elements.noteReaderModal && !elements.noteReaderModal.hidden) {
      closeNoteReader();
    } else if (elements.noteEditorModal && !elements.noteEditorModal.hidden) {
      closeNoteEditor();
    } else if (!elements.renameDialog.hidden) {
      closeRenameDialog();
    } else if (!elements.historyModal.hidden) {
      closeHistory();
    } else if (elements.scanModal && !elements.scanModal.hidden) {
      cancelScan();
    } else if (currentPage === "personalize" && personalizeDetailKey) {
      closePersonalizeDetail();
    }
  });

  if (api && typeof api.onTogglePrivacy === "function") {
    api.onTogglePrivacy((payload) => {
      const active = payload && typeof payload.active === "boolean"
        ? payload.active
        : Boolean(payload && payload.privacyActive);
      applyMainPrivacyMode(active);
    });
  }

  if (api && typeof api.onFloatingSettingsChanged === "function") {
    api.onFloatingSettingsChanged((settings) => {
      floatingSettings = settings;
      applyGlobalAppearance(settings);
      updateDashboardFromSettings();

      if (
        (currentPage === "widgets" || currentPage === "personalize") &&
        !isClockSettingsEditing()
      ) {
        renderFloatingSettings(settings);
      }
    });
  }

  if (api && typeof api.onManualStatusChanged === "function") {
    api.onManualStatusChanged((status) => {
      if (!status || !status.ok) return;

      manualUndoStatus = {
        available: Boolean(status.available),
        last: status.last || null
      };
      updateButtons();
    });
  }

  if (api && typeof api.onShowNotesHistory === "function") {
    api.onShowNotesHistory(() => {
      showNotesHistoryFromDesktop().catch(() => {
        setStatus("无法打开随手记历史记录。", "error");
      });
    });
  }

  if (api && typeof api.onOpenComponentSettings === "function") {
    api.onOpenComponentSettings((payload) => {
      openComponentSettingsFromDesktop(payload).catch(() => {
        setStatus("无法打开组件设置。", "error");
      });
    });
  }

  if (api && typeof api.onTrayQuickOrganize === "function") {
    api.onTrayQuickOrganize(() => {
      showPage("organize").then(() => {
        scan();
      }).catch(() => {});
    });
  }

  if (api && typeof api.onFocusSearch === "function") {
    api.onFocusSearch(() => {
      clearSearch();
      elements.content.scrollTop = 0;
      if (elements.settingsSearch) {
        elements.settingsSearch.focus();
        elements.settingsSearch.select();
      }
    });
  }

  if (api && typeof api.onNotesChanged === "function") {
    api.onNotesChanged(() => {
      if (currentPage === "personalize" && personalizeDetailKey === "notes") {
        const list = document.querySelector(".notes-history-list");

        if (list) loadNotesHistoryInto(list);
      }
    });
  }

  if (window.withinI18n && elements.languageSelect) {
    elements.languageSelect.value = window.withinI18n.getPreference();
  }

  // 语言偏好以主进程保存的为准（桌面层只能从主进程拿到它）；
  // 主进程还没有存过（首次启动 / 升级）时，反过来把本地偏好交给主进程。
  if (window.withinI18n && api && typeof api.getLocaleInfo === "function") {
    api.getLocaleInfo().then((info) => {
      if (!info) return;

      if (info.systemLocale) {
        window.__WITHIN_SYSTEM_LOCALE__ = info.systemLocale;
      }

      const preference = info.stored
        ? info.preference
        : window.withinI18n.getPreference();

      window.withinI18n.syncLocale(preference);

      if (!info.stored && typeof api.setLocalePreference === "function") {
        api.setLocalePreference(preference);
      }

      if (elements.languageSelect) {
        elements.languageSelect.value = window.withinI18n.getPreference();
      }
    }).catch(() => {});
  }

  if (elements.languageSelect) {
    elements.languageSelect.addEventListener("change", () => {
      if (!window.withinI18n) return;

      window.withinI18n.setLocale(elements.languageSelect.value);
      elements.languageSelect.value = window.withinI18n.getPreference();
      setStatus("界面语言已切换。", "success");
    });
  }

  setupSidebar();
  setupSearch();
  setupCollapseModeControl();
  setupWidgetSubtabs();
  setupFocusChart();

  window.addEventListener("hashchange", () => {
    if (window.location.hash === "#globalOverview" && searchQuery) {
      clearSearch();
    }
  });
  refreshSystemAccent();
  window.addEventListener("focus", refreshSystemAccent);
  window.addEventListener("focus", () => {
    if (currentPage === "home") loadFocusChart();
  });

  const systemSchemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
  systemSchemeMedia.addEventListener("change", () => {
    if (floatingSettings) applyGlobalAppearance(floatingSettings);
  });

  updateDashboardClock();
  window.setInterval(updateDashboardClock, 30000);
  showPage("home");
  renderDashboardRecent();
  updateDashboardFromSettings();
  refreshFloatingSettings();
  loadAchievementsData();
  loadShortcuts();
  updateButtons();
  refreshUndoStatus();
  refreshManualUndoStatus();
  loadStartupNotice();
})();
