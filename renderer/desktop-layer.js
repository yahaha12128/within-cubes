"use strict";

(() => {
  const api = window.desktopLayer;

  const stage = document.querySelector("#desktopStage");
  const desktopIconLayer = document.querySelector("#desktopIconLayer");
  const widgetLayer = document.querySelector("#widgetLayer");
  const layerToast = document.querySelector("#layerToast");
  const achievementToast = document.querySelector("#achievementToast");
  const achievementToastIcon = document.querySelector("#achievementToastIcon");
  const achievementToastName = document.querySelector("#achievementToastName");
  const achievementToastDescription = document.querySelector("#achievementToastDescription");
  const categoryTemplate = document.querySelector("#categoryTemplate");
  const tabGroupTemplate = document.querySelector("#tabGroupTemplate");
  const alignmentGuides = document.querySelector("#alignmentGuides");
  const contextMenuEl = document.querySelector("#desktopContextMenu");
  const contextMenuHead = document.querySelector("#contextMenuHead");
  const contextMenuHeadIcon = document.querySelector("#contextMenuHeadIcon");
  const contextMenuTitle = document.querySelector("#contextMenuTitle");
  const contextMenuSubtitle = document.querySelector("#contextMenuSubtitle");
  const contextMenuBody = document.querySelector("#contextMenuBody");
  const desktopTour = document.querySelector("#desktopTour");
  const tourCard = document.querySelector("#tourCard");
  const tourTitle = document.querySelector("#tourTitle");
  const tourCopy = document.querySelector("#tourCopy");
  const tourCounter = document.querySelector("#tourCounter");
  const tourProgress = document.querySelector("#tourProgress");
  const tourSpotlight = document.querySelector("#tourSpotlight");
  const tourDemoTarget = document.querySelector("#tourDemoTarget");
  const tourSkipButton = document.querySelector("#tourSkipButton");
  const tourPrevButton = document.querySelector("#tourPrevButton");
  const tourNextButton = document.querySelector("#tourNextButton");
  const tourMasks = {
    top: document.querySelector('[data-tour-mask="top"]'),
    right: document.querySelector('[data-tour-mask="right"]'),
    bottom: document.querySelector('[data-tour-mask="bottom"]'),
    left: document.querySelector('[data-tour-mask="left"]')
  };
  const componentTemplates = {
    clock: document.querySelector("#clockTemplate"),
    music: document.querySelector("#musicTemplate"),
    notes: document.querySelector("#notesTemplate"),
    todo: document.querySelector("#todoTemplate"),
    calendar: document.querySelector("#calendarTemplate"),
    pomodoro: document.querySelector("#pomodoroTemplate"),
    quick: document.querySelector("#quickTemplate"),
    clipboard: document.querySelector("#clipboardTemplate"),
    search: document.querySelector("#searchTemplate")
  };

  const POMODORO_PHASES = {
    focus: { label: "专注时间", seconds: 25 * 60 },
    break: { label: "休息时间", seconds: 5 * 60 }
  };

  const ONBOARDING_STEPS = [
    {
      title: "欢迎来到方寸格",
      copy: "方寸之间，自有天地。",
      nextLabel: "开启探索",
      welcome: true
    },
    {
      title: "悬停展开 & 标签魔法",
      copy: "悬停自动展开；拖拽标题合并，拆分自动归位。",
      nextLabel: "下一步"
    },
    {
      title: "智能番茄钟与专注时刻",
      copy: "拖入文件自动算专注时间！开启专注模式，其他组件自动变暗。",
      nextLabel: "下一步"
    },
    {
      title: "极客视觉：3D 景深",
      copy: "按住 Ctrl + 滚轮，组件在 3D 空间中模糊沉底；音乐播放时背景随封面律动。",
      nextLabel: "下一步"
    },
    {
      title: "你的桌面，你做主",
      copy: "按 Ctrl+Alt+V 开启防窥，文件名与图标瞬间打码！组件留在原位，访客只能看到一片朦胧。",
      nextLabel: "下一步"
    },
    {
      title: "时间胶囊",
      copy: "超过30天没碰的文件会褪色变灰，双击瞬间恢复彩色！",
      nextLabel: "下一步"
    },
    {
      title: "隐藏的荣誉殿堂",
      copy: "藏有 81 个成就彩蛋，从整理到专注，甚至深夜彩蛋等你发掘。",
      nextLabel: "下一步"
    },
    {
      title: "掌控全局",
      copy: "Ctrl+Alt+S 随时呼出全局搜索；全屏游戏时自动屏蔽快捷键，绝不打扰。",
      nextLabel: "下一步"
    }
  ];

  const SNAP_THRESHOLD = 10;
  const ACCENT_COLORS = [
    "#2f6b4f",
    "#3f6f8e",
    "#6a5b86",
    "#8a4f38",
    "#9a7437",
    "#a33a32",
    "#d97706",
    "#0f766e"
  ];
  const FILE_COLORS = [
    { value: "red", label: "红色" },
    { value: "yellow", label: "黄色" },
    { value: "blue", label: "蓝色" },
    { value: "green", label: "绿色" },
    { value: "purple", label: "紫色" },
    { value: "orange", label: "橙色" }
  ];
  const RESIZE_CURSORS = {
    n: "ns-resize",
    s: "ns-resize",
    e: "ew-resize",
    w: "ew-resize",
    ne: "nesw-resize",
    sw: "nesw-resize",
    nw: "nwse-resize",
    se: "nwse-resize"
  };
  const RESIZE_DIRECTIONS = Object.keys(RESIZE_CURSORS);
  const LOCK_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`;
  const UNLOCK_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/></svg>`;
  const MORE_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg>`;

  const TYPE_ICONS = {
    folder: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="42" height="42" rx="12" fill="#f5efe3"/>
      <path d="M13 19h9l3 3h10v14H13z" fill="#fff" stroke="#7a6238" stroke-width="2" stroke-linejoin="round"/>
      <path d="M13 22h22" fill="none" stroke="#7a6238" stroke-width="2"/>
    </svg>`,
    image: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="42" height="42" rx="12" fill="#e9f1f6"/>
      <rect x="13" y="15" width="22" height="18" rx="3" fill="#fff" stroke="#3f6f8e" stroke-width="2"/>
      <circle cx="20" cy="21" r="2.4" fill="#3f6f8e"/>
      <path d="M15 31l6-7 4 4 3-3 5 6z" fill="#3f6f8e"/>
    </svg>`,
    document: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="42" height="42" rx="12" fill="#e9f1f6"/>
      <path d="M17 12h10l6 6v18H17z" fill="#fff" stroke="#3f6f8e" stroke-width="2" stroke-linejoin="round"/>
      <path d="M27 12v7h6" fill="none" stroke="#3f6f8e" stroke-width="2" stroke-linejoin="round"/>
      <path d="M21 25h8M21 30h6" fill="none" stroke="#3f6f8e" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    archive: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="42" height="42" rx="12" fill="#f5efe3"/>
      <rect x="16" y="14" width="16" height="21" rx="3" fill="#fff" stroke="#7a6238" stroke-width="2"/>
      <path d="M24 14v21" stroke="#7a6238" stroke-width="2" stroke-dasharray="3 2"/>
      <path d="M21 19h6" stroke="#7a6238" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    installer: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="42" height="42" rx="12" fill="#f7ebe6"/>
      <path d="M24 12v13M18.5 20l5.5 6.5 5.5-6.5" fill="none" stroke="#8a4f38" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="16" y="31" width="16" height="4" rx="2" fill="#8a4f38"/>
    </svg>`,
    audio: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="42" height="42" rx="12" fill="#e8f1eb"/>
      <path d="M27 14v15a4 4 0 1 1-2-3.46V18l9-2v11" fill="none" stroke="#496a52" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="23" cy="31" r="4" fill="none" stroke="#496a52" stroke-width="2"/>
      <circle cx="32" cy="28" r="4" fill="none" stroke="#496a52" stroke-width="2"/>
    </svg>`,
    video: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="42" height="42" rx="12" fill="#f0edf6"/>
      <rect x="13" y="17" width="22" height="14" rx="3" fill="#fff" stroke="#6a5b86" stroke-width="2"/>
      <path d="M22 21l6 3-6 3z" fill="#6a5b86"/>
    </svg>`,
    code: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="42" height="42" rx="12" fill="#eef2ee"/>
      <path d="M20 18l-6 6 6 6M28 18l6 6-6 6" fill="none" stroke="#5e6b63" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M26 15l-4 18" stroke="#5e6b63" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    shortcut: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="42" height="42" rx="12" fill="#eef2ee"/>
      <path d="M18 30l12-12M22 18h8v8" fill="none" stroke="#5e6b63" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    other: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="42" height="42" rx="12" fill="#eef2ee"/>
      <path d="M17 12h10l6 6v18H17z" fill="#fff" stroke="#5e6b63" stroke-width="2" stroke-linejoin="round"/>
      <path d="M27 12v7h6" fill="none" stroke="#5e6b63" stroke-width="2" stroke-linejoin="round"/>
    </svg>`
  };

  const LUCIDE_ICONS = {
    "arrow-up-right": '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    "app-window": '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 4v4"/><path d="M2 8h20"/><path d="M6 4v4"/>',
    "clipboard": '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6"/><path d="M9 16h6"/>',
    "copy": '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    "file": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
    "file-image": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><circle cx="10" cy="13" r="2"/><path d="m20 17-1.3-1.3a2 2 0 0 0-2.8 0L9 22"/>',
    "file-text": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    "folder": '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    "folder-open": '<path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/>',
    "info": '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    "link": '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    "monitor": '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
    "palette": '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
    "pin": '<line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>',
    "scissors": '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
    "shield": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    "trash-2": '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
    "x": '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
  };

  function createLucideIcon(name, className = "context-menu-icon") {
    const wrapper = document.createElement("span");
    wrapper.className = className;
    wrapper.setAttribute("aria-hidden", "true");
    wrapper.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${LUCIDE_ICONS[name] || LUCIDE_ICONS.file}</svg>`;
    return wrapper;
  }

  const GENERIC_ICON = TYPE_ICONS.other;
  let customIconPack = { name: "", icons: {} };

  function applyTypeIcon(iconWrap, type) {
    if (!iconWrap) return;
    const custom = customIconPack.icons[type] || customIconPack.icons.other;

    if (custom) {
      const image = new Image();
      image.alt = "";
      image.className = "icon-pack-image";
      image.src = custom;
      iconWrap.replaceChildren(image);
      return;
    }

    iconWrap.innerHTML = TYPE_ICONS[type] || GENERIC_ICON;
  }
  const systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
  const iconCache = new Map();
  const categories = new Map();
  const groups = new Map();
  const tabEntries = new Map();
  const widgets = new Map();

  let state = null;
  let privacyModeActive = false;
  let isPrivacyMode = false;
  let privacyModeRevision = -1;
  let collapsedCategoryKeys = new Set();
  let zCounter = 100;
  let lastPassthrough = true;
  let holds = new Set();
  let fileDrag = null;
  let lastPointer = { x: 0, y: 0, valid: false };
  const selectedFilePaths = new Set();
  const timeCapsuleRestored = new Set();
  const fileMetaByPath = new Map();
  let marqueeState = null;
  let lastClickedFilePath = null;
  let desktopItemsSignature = "";
  let filesChangedRequest = 0;
  const desktopIconEntries = new Map();
  let layerToastTimer = null;
  let latestMusicPayload = null;
  let clockTimer = null;
  let clockFitFrame = null;
  let musicSessionRequested = false;
  let currentSession = null;
  let noticeUntil = 0;
  let draggedTodoId = "";
  const achievementToastQueue = [];
  let achievementToastActive = null;
  let achievementToastTimer = null;
  let achievementToastRemaining = 5000;
  let achievementToastStartedAt = 0;
  let achievementToastExitTimer = null;
  let noticeTimer = null;
  let componentData = null;
  let componentDataPromise = null;
  let calendarTimer = null;
  let calendarDayKey = "";
  let contextMenuOpen = false;
  let contextMenuCleanup = null;
  let parallaxFrame = null;
  let parallaxPoint = { x: 0, y: 0 };
  let focusModeActive = false;
  let activeContextComponent = null;
  let categoryDragHoverKey = null;
  let categoryDragLeaveTimer = null;
  let fileDragIdleTimer = null;
  const dragExpandedCategoryKeys = new Set();
  const dragRaisedCategoryKeys = new Set();
  const DRAG_RAISED_Z_INDEX = 9999;

  let tourActive = false;
  let tourStepIndex = 0;
  let tourApplyToken = 0;
  let tourTarget = null;
  let tourSpotRect = null;
  let tourCategoryKey = "";
  let tourCategoryOriginalCollapsed = null;
  let tourKeepExpandedCategoryKey = "";
  const tourExpandedCategoryStates = new Map();
  let tourPomodoroRequested = false;
  let tourLayoutTimer = null;
  let tourRetargetTimer = null;
  let tourLastLayoutSignature = "";
  let tourResizeHandler = null;

  function round(value) {
    return Math.round(Number(value) || 0);
  }

  function overlayOrigin() {
    const overlay = state && state.overlay;
    return {
      x: overlay && Number.isFinite(overlay.x) ? overlay.x : 0,
      y: overlay && Number.isFinite(overlay.y) ? overlay.y : 0
    };
  }

  // The layer window spans the union of every display. On a multi-monitor
  // desktop that union can start above or left of the primary screen, so
  // anchoring the icon grid at 0,0 would paint newly created files in the
  // invisible area outside the primary display. Native desktop icons live on
  // the primary work area; place our replacement grid there too.
  function syncDesktopIconArea() {
    const overlay = state && state.overlay ? state.overlay : {};
    const displays = state && Array.isArray(state.displays)
      ? state.displays
      : [];
    const primary =
      displays.find((display) => display && display.primary) ||
      displays[0] ||
      null;

    desktopIconLayer.style.inset = "auto";

    if (
      !primary ||
      !Number.isFinite(primary.x) ||
      !Number.isFinite(primary.y) ||
      !Number.isFinite(primary.width) ||
      !Number.isFinite(primary.height)
    ) {
      desktopIconLayer.style.left = "0px";
      desktopIconLayer.style.top = "0px";
      desktopIconLayer.style.width = "100%";
      desktopIconLayer.style.height = "100%";
      return;
    }

    const originX = overlay && Number.isFinite(overlay.x) ? overlay.x : 0;
    const originY = overlay && Number.isFinite(overlay.y) ? overlay.y : 0;

    desktopIconLayer.style.left = `${Math.round(primary.x - originX)}px`;
    desktopIconLayer.style.top = `${Math.round(primary.y - originY)}px`;
    desktopIconLayer.style.width = `${Math.round(primary.width)}px`;
    desktopIconLayer.style.height = `${Math.round(primary.height)}px`;
  }

  function hexToRgba(hex, alpha) {
    const match = /^#([0-9a-f]{6})$/i.exec(String(hex || ""));

    if (!match) return `rgba(47, 107, 79, ${alpha})`;

    const value = parseInt(match[1], 16);
    const red = (value >> 16) & 255;
    const green = (value >> 8) & 255;
    const blue = value & 255;

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  function isDarkColor(hex) {
    const match = /^#([0-9a-f]{6})$/i.exec(String(hex || ""));

    if (!match) return false;

    const value = parseInt(match[1], 16);
    const red = (value >> 16) & 255;
    const green = (value >> 8) & 255;
    const blue = value & 255;

    return red * 0.299 + green * 0.587 + blue * 0.114 < 140;
  }

  function applyAppearance(app) {
    if (!app || !state || !state.settings) return;

    const settings = state.settings;
    const classes = [
      "theme-light",
      "theme-dark",
      "tint-transparent",
      "tint-white",
      "tint-black",
      "tint-custom",
      "material-native",
      "material-css",
      "material-off"
    ];

    app.classList.remove(...classes);

    let tint = ["transparent", "white", "black", "system", "custom"].includes(settings.tint)
      ? settings.tint
      : "system";
    const customTint = typeof settings.customTint === "string"
      ? settings.customTint
      : "#2f6b4f";
    let theme = "light";

    if (tint === "system") {
      const dark = systemThemeMedia.matches;
      tint = dark ? "black" : "white";
      theme = dark ? "dark" : "light";
    } else if (tint === "black") {
      theme = "dark";
    } else if (tint === "custom") {
      theme = isDarkColor(customTint) ? "dark" : "light";
    }

    if (tint === "transparent") {
      // Use light text on the shared contrast wash; otherwise dark-on-dark is
      // unreadable when a dark wallpaper shows through a transparent tint.
      theme = "dark";
    }

    if (settings.followWallpaperBrightness && settings.wallpaperDark) {
      theme = "dark";
      if (tint === "system") tint = "black";
    }

    if (tint === "custom") {
      // Keep the color translucent so the wallpaper remains visible and the
      // glass reads as a tint instead of an opaque black rectangle.
      app.style.setProperty("--glass-tint", hexToRgba(customTint, 0.55));
    } else {
      app.style.removeProperty("--glass-tint");
    }

    // Native acrylic belongs to the old native windows. In the single layered
    // renderer CSS backdrop-filter is the portable path.
    const material = settings.frosted === false ? "off" : "css";

    app.classList.add(
      `theme-${theme}`,
      `tint-${tint}`,
      `material-${material}`
    );
    app.dataset.tint = tint;
    app.dataset.material = material;
    document.documentElement.dataset.theme = theme;
  }

  function applyAccent(app, color) {
    if (!app) return;

    const next = typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color)
      ? color.toLowerCase()
      : "";

    if (!next) {
      app.style.removeProperty("--accent");
      app.style.removeProperty("--accent-soft");
      app.style.removeProperty("--scroll-thumb");
      app.classList.remove("has-custom-accent");
      return;
    }

    app.style.setProperty("--accent", next);
    app.style.setProperty("--accent-soft", hexToRgba(next, 0.16));
    app.style.setProperty("--scroll-thumb", hexToRgba(next, 0.36));
    app.classList.add("has-custom-accent");
  }

  // Elements that own their own pointer interaction. A press that starts on any
  // of these must not turn into a component drag, and must not bubble into the
  // desktop layer either (that is what cancelled selections and stole focus).
  const WIDGET_INTERACTIVE_SELECTOR = [
    "button",
    "input",
    "select",
    "textarea",
    "a",
    "form",
    "label",
    "canvas",
    "video",
    "audio",
    "[contenteditable='true']",
    "[data-no-drag]",
    "[data-resize-handle]"
  ].join(",");

  function isWidgetInteractiveTarget(target) {
    if (!target || typeof target.closest !== "function") return false;
    if (target.closest(WIDGET_INTERACTIVE_SELECTOR)) return true;

    // Scrollable panes (clipboard history, todo list, search results…) need the
    // press for scrolling/dragging their own content.
    let node = target;

    while (node && node.nodeType === 1 && node !== document.body) {
      if (
        node.scrollHeight > node.clientHeight + 1 ||
        node.scrollWidth > node.clientWidth + 1
      ) {
        const style = window.getComputedStyle(node);
        const overflowY = style.overflowY;
        const overflowX = style.overflowX;

        if (
          overflowY === "auto" || overflowY === "scroll" ||
          overflowX === "auto" || overflowX === "scroll"
        ) {
          return true;
        }
      }

      node = node.parentElement;
    }

    return false;
  }

  // Dragged components are pinned above everything else for the duration of the
  // gesture. Without this the pointer can slip under a neighbour, which breaks
  // the hover/pointer chain and makes the component jump between positions.
  const DRAG_TOP_Z_INDEX = 9999;

  function raise(entry) {
    zCounter += 1;
    entry.el.style.zIndex = String(zCounter);
  }

  function pinForDrag(entry) {
    if (!entry || !entry.el) return;
    entry.el.style.zIndex = String(DRAG_TOP_Z_INDEX);
    entry.el.classList.add("is-drag-pinned");
  }

  function unpinAfterDrag(entry) {
    if (!entry || !entry.el) return;
    entry.el.classList.remove("is-drag-pinned");
    raise(entry);
  }

  const MAX_DEPTH = 3;
  let depthClickSuppressUntil = 0;

  function getDesktopEntryForElement(element) {
    if (!element || typeof element.closest !== "function") return null;

    const widgetEl = element.closest(".desktop-widget");
    if (!widgetEl) return null;

    if (widgetEl.dataset.groupKey) {
      return groups.get(widgetEl.dataset.groupKey) || null;
    }
    if (widgetEl.dataset.categoryKey) {
      return categories.get(widgetEl.dataset.categoryKey) || null;
    }
    if (widgetEl.dataset.widgetKey) {
      return widgets.get(widgetEl.dataset.widgetKey) || null;
    }

    return null;
  }

  function getEntryDepth(entry) {
    return entry && Number.isInteger(entry.depth) ? entry.depth : 0;
  }

  function setEntryDepth(entry, depth) {
    if (!entry || !entry.el) return;

    const next = Math.max(0, Math.min(MAX_DEPTH, depth));
    entry.depth = next;
    entry.el.classList.remove(
      "is-depth-deep",
      "is-depth-1",
      "is-depth-2",
      "is-depth-3"
    );

    if (next > 0) {
      entry.el.classList.add("is-depth-deep", `is-depth-${next}`);
    }
  }

  function restoreEntryDepth(entry) {
    if (!entry || getEntryDepth(entry) === 0) return false;

    entry.el.classList.add("is-depth-returning");
    setEntryDepth(entry, 0);
    raise(entry);
    window.setTimeout(() => {
      if (entry.el && entry.el.isConnected) {
        entry.el.classList.remove("is-depth-returning");
      }
    }, 520);
    return true;
  }

  function resetAllDepths() {
    for (const entry of categories.values()) setEntryDepth(entry, 0);
    for (const entry of groups.values()) setEntryDepth(entry, 0);
    for (const entry of widgets.values()) setEntryDepth(entry, 0);
  }

  function adjustDepthAtPoint(clientX, clientY, delta) {
    if (!isCursorOverLayerPoint(clientX, clientY)) return false;

    const elements = document.elementsFromPoint(clientX, clientY);
    let entry = null;

    for (const element of elements) {
      if (!element || !element.closest) continue;
      entry = getDesktopEntryForElement(element);
      if (entry) break;
    }

    if (!entry) return false;

    const current = getEntryDepth(entry);
    const next = Math.max(0, Math.min(MAX_DEPTH, current + delta));

    if (next === current) return true;

    entry.el.classList.remove("is-depth-returning");
    setEntryDepth(entry, next);
    showLayerToast(
      next === 0
        ? "组件已回到眼前"
        : `景深 ${next} 级 · 点击组件可飞回眼前`
    );
    return true;
  }

  function isCursorOverLayerPoint(clientX, clientY) {
    return clientX >= 0 &&
      clientY >= 0 &&
      clientX <= window.innerWidth &&
      clientY <= window.innerHeight;
  }

  function isTimeCapsuleCell(file) {
    return Boolean(
      file &&
      file.timeCapsule &&
      file.path &&
      !timeCapsuleRestored.has(file.path)
    );
  }

  function restoreTimeCapsulePath(filePath) {
    if (!filePath || timeCapsuleRestored.has(filePath)) return false;

    timeCapsuleRestored.add(filePath);
    document
      .querySelectorAll(`[data-file-path="${CSS.escape(filePath)}"]`)
      .forEach((node) => node.classList.remove("is-time-capsule"));
    return true;
  }

  stage.addEventListener("wheel", (event) => {
    if (!state || !state.settings || !state.settings.depth3d) return;
    if (!event.ctrlKey) return;
    if (Math.abs(event.deltaY) < 1) return;

    const handled = adjustDepthAtPoint(
      event.clientX,
      event.clientY,
      event.deltaY > 0 ? 1 : -1
    );

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
      api.recordAchievementEvent("preview-used", { count: 1 })
        .catch(() => {});
    }
  }, { passive: false });

  stage.addEventListener("pointerdown", (event) => {
    if (!state || !state.settings || !state.settings.depth3d) return;

    const entry = getDesktopEntryForElement(event.target);

    if (!entry || getEntryDepth(entry) === 0) return;

    event.preventDefault();
    event.stopPropagation();
    depthClickSuppressUntil = Date.now() + 420;
    restoreEntryDepth(entry);
  }, true);

  stage.addEventListener("click", (event) => {
    if (Date.now() >= depthClickSuppressUntil) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  function showLayerToast(message, { error = false } = {}) {
    clearTimeout(layerToastTimer);
    layerToast.textContent = message;
    layerToast.classList.toggle("is-error", error);
    layerToast.hidden = false;

    requestAnimationFrame(() => {
      layerToast.classList.add("is-visible");
    });

    layerToastTimer = setTimeout(() => {
      layerToast.classList.remove("is-visible");
      layerToastTimer = setTimeout(() => {
        layerToast.hidden = true;
      }, 180);
    }, 2400);
  }

  function positionAchievementToast() {
    if (!achievementToast || achievementToast.hidden) return;

    const displays = state && Array.isArray(state.displays)
      ? state.displays
      : [];
    const primary = displays.find((display) => display.primary) || displays[0];
    const overlay = state && state.overlay;

    if (!primary || !overlay) return;

    const width = achievementToast.offsetWidth || 390;
    const height = achievementToast.offsetHeight || 96;
    const margin = 24;
    const taskbarGap = 18;

    achievementToast.style.left = `${Math.round(
      Number(primary.x) - Number(overlay.x) + Number(primary.width) - width - margin
    )}px`;
    achievementToast.style.top = `${Math.round(
      Number(primary.y) - Number(overlay.y) + Number(primary.height) - height - taskbarGap
    )}px`;
    achievementToast.style.right = "auto";
    achievementToast.style.bottom = "auto";
  }

  function renderAchievementToastIcon(icon) {
    if (!achievementToastIcon) return;
    achievementToastIcon.replaceChildren();

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
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
    achievementToastIcon.append(svg);
  }

  function scheduleAchievementToastHide(duration = achievementToastRemaining) {
    clearTimeout(achievementToastTimer);
    achievementToastStartedAt = Date.now();
    achievementToastRemaining = Math.max(0, duration);
    achievementToastTimer = setTimeout(hideAchievementToast, achievementToastRemaining);
  }

  function pauseAchievementToast() {
    if (!achievementToastActive || achievementToast.hidden) return;
    clearTimeout(achievementToastTimer);
    achievementToastTimer = null;
    achievementToastRemaining = Math.max(
      0,
      achievementToastRemaining - (Date.now() - achievementToastStartedAt)
    );
    achievementToast.classList.add("is-paused");
  }

  function resumeAchievementToast() {
    if (!achievementToastActive || achievementToast.hidden) return;
    achievementToast.classList.remove("is-paused");
    scheduleAchievementToastHide(achievementToastRemaining);
  }

  function hideAchievementToast() {
    if (!achievementToastActive) return;

    clearTimeout(achievementToastTimer);
    clearTimeout(achievementToastExitTimer);
    achievementToastTimer = null;
    achievementToast.classList.remove("is-visible");
    achievementToast.classList.remove("is-paused");
    achievementToastExitTimer = setTimeout(() => {
      achievementToast.hidden = true;
      achievementToastActive = null;
      showNextAchievementToast();
    }, 470);
  }

  function showNextAchievementToast() {
    if (achievementToastActive || achievementToastQueue.length === 0) return;

    const payload = achievementToastQueue.shift();
    if (!payload || !payload.id || !achievementToast) {
      showNextAchievementToast();
      return;
    }

    achievementToastActive = payload;
    achievementToast.dataset.difficulty = String(payload.difficulty || 1);
    achievementToastName.textContent = payload.name || "未知成就";
    achievementToastDescription.textContent = payload.description || "";
    renderAchievementToastIcon(payload.icon);
    achievementToast.classList.remove("is-visible", "is-paused");
    achievementToast.hidden = false;

    // Restart the underline animation for every queued achievement.
    void achievementToast.offsetWidth;
    positionAchievementToast();
    achievementToast.classList.add("is-visible");
    achievementToastRemaining = 5000;
    scheduleAchievementToastHide(5000);
  }

  function enqueueAchievementToast(payload) {
    if (!payload || typeof payload.id !== "string") return;
    achievementToastQueue.push(payload);
    showNextAchievementToast();
  }

  function setShortcutFocusMode(active) {
    const next = Boolean(active);
    document.body.classList.toggle("is-shortcut-focus-mode", next);

    if (next) {
      closeComponentMenu();
      closeTextInputDialog();
      api.releaseInput();
    }

    Promise.resolve(api.setFocusMode(next)).catch(() => {});
  }

  function getCategoryLikeEntry(categoryKey) {
    return categories.get(categoryKey) || tabEntries.get(categoryKey) || null;
  }

  function showCategoryToast(categoryKey, message) {
    const entry = getCategoryLikeEntry(categoryKey);

    if (!entry) {
      showLayerToast(message);
      return;
    }

    const host = entry.group || entry;

    clearTimeout(host.toastTimer);
    host.toast.textContent = message;
    host.toast.hidden = false;

    requestAnimationFrame(() => {
      host.toast.classList.add("is-visible");
    });

    host.toastTimer = setTimeout(() => {
      host.toast.classList.remove("is-visible");
      host.toastTimer = setTimeout(() => {
        host.toast.hidden = true;
      }, 220);
    }, 2300);
  }

  function closeComponentMenu() {
    if (!contextMenuOpen) return;

    contextMenuOpen = false;
    contextMenuEl.classList.remove("is-visible");
    contextMenuEl.hidden = true;
    activeContextComponent = null;

    if (contextMenuCleanup) {
      contextMenuCleanup();
      contextMenuCleanup = null;
    }

    api.setMenuOpen(false);
  }

  function clampMenuPosition(element, x, y) {
    const margin = 8;
    const rect = element.getBoundingClientRect();
    const left = Math.max(
      margin,
      Math.min(window.innerWidth - rect.width - margin, x)
    );
    const top = Math.max(
      margin,
      Math.min(window.innerHeight - rect.height - margin, y)
    );

    element.style.left = `${Math.round(left)}px`;
    element.style.top = `${Math.round(top)}px`;
    element.style.setProperty(
      "--menu-origin",
      `${x > window.innerWidth / 2 ? "top right" : "top left"}`
    );
  }

  function appendContextAction(label, options = {}) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "context-menu-item";
    button.classList.toggle("is-danger", Boolean(options.danger));
    button.disabled = Boolean(options.disabled);
    button.setAttribute("role", "menuitem");

    if (options.lucide) {
      button.append(createLucideIcon(options.lucide));
    } else if (options.icon) {
      const icon = document.createElement("span");
      icon.className = "context-menu-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = options.icon;
      button.append(icon);
    }

    const text = document.createElement("span");
    text.className = "context-menu-label";
    text.textContent = label;
    button.append(text);

    if (options.shortcut) {
      const shortcut = document.createElement("span");
      shortcut.className = "context-menu-shortcut";
      shortcut.textContent = options.shortcut;
      button.append(shortcut);
    }

    button.addEventListener("click", () => {
      if (button.disabled) return;
      closeComponentMenu();
      Promise.resolve(options.action && options.action()).catch(() => {});
    });

    contextMenuBody.append(button);
    return button;
  }

  function appendContextSeparator() {
    const separator = document.createElement("div");
    separator.className = "context-menu-separator";
    separator.setAttribute("role", "separator");
    contextMenuBody.append(separator);
  }

  function appendContextSection(label, options = {}) {
    const heading = document.createElement("div");
    heading.className = "context-menu-section";

    if (options.lucide) {
      heading.append(
        createLucideIcon(options.lucide, "context-menu-section-icon")
      );
    }

    const text = document.createElement("span");
    text.textContent = label;
    heading.append(text);
    contextMenuBody.append(heading);
  }

  function appendColorSwatches({ active = "", onPick }) {
    const row = document.createElement("div");
    row.className = "context-menu-swatches";

    const defaults = document.createElement("button");
    defaults.type = "button";
    defaults.className = "context-menu-swatch is-default";
    defaults.classList.toggle("is-active", !active);
    defaults.title = "使用默认颜色";
    defaults.setAttribute("aria-label", "恢复默认颜色");
    defaults.addEventListener("click", () => {
      closeComponentMenu();
      Promise.resolve(onPick("")).catch(() => {});
    });
    row.append(defaults);

    for (const color of ACCENT_COLORS) {
      const swatch = document.createElement("button");
      swatch.type = "button";
      swatch.className = "context-menu-swatch";
      swatch.style.setProperty("--swatch", color);
      swatch.title = color;
      swatch.setAttribute("aria-label", `外观颜色 ${color}`);
      swatch.classList.toggle("is-active", active === color);
      swatch.addEventListener("click", () => {
        closeComponentMenu();
        Promise.resolve(onPick(color)).catch(() => {});
      });
      row.append(swatch);
    }

    contextMenuBody.append(row);
  }

  function appendFileColorSwatches({ active = "", onPick }) {
    const row = document.createElement("div");
    row.className = "context-menu-swatches";

    const none = document.createElement("button");
    none.type = "button";
    none.className = "context-menu-swatch is-default";
    none.classList.toggle("is-active", !active);
    none.title = "清除颜色角标";
    none.setAttribute("aria-label", "清除颜色角标");
    none.addEventListener("click", () => {
      closeComponentMenu();
      Promise.resolve(onPick("")).catch(() => {});
    });
    row.append(none);

    for (const item of FILE_COLORS) {
      const swatch = document.createElement("button");
      swatch.type = "button";
      swatch.className = "context-menu-swatch";
      swatch.dataset.tag = item.value;
      swatch.title = item.label;
      swatch.setAttribute("aria-label", `${item.label}角标`);
      const css = {
        red: "#dc4c4c",
        yellow: "#e6b325",
        blue: "#4f83dd",
        green: "#3e9c68",
        purple: "#8b6cc9",
        orange: "#df8539"
      };
      swatch.style.setProperty("--swatch", css[item.value]);
      swatch.classList.toggle("is-active", active === item.value);
      swatch.addEventListener("click", () => {
        closeComponentMenu();
        Promise.resolve(onPick(item.value)).catch(() => {});
      });
      row.append(swatch);
    }

    contextMenuBody.append(row);
  }

  function appendBackgroundChips({ backgroundIsBing = false, onPick }) {
    const row = document.createElement("div");
    row.className = "context-menu-backgrounds";

    const chips = [
      ["本地图片", () => onPick("local")],
      ["Bing 每日壁纸", () => onPick("bing")],
      ["换一张", () => onPick("bing-refresh")],
      ["清除背景", () => onPick("clear")]
    ];

    for (const [label, action] of chips) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "context-menu-chip";
      chip.textContent = label;
      if (label === "换一张" && !backgroundIsBing) {
        chip.title = "拉取一张新的 Bing 每日壁纸";
      }
      chip.addEventListener("click", () => {
        closeComponentMenu();
        Promise.resolve(action()).catch(() => {});
      });
      row.append(chip);
    }

    contextMenuBody.append(row);
  }

  function openContextMenu({
    x,
    y,
    title,
    subtitle = "",
    lucide = "",
    iconImage = "",
    tone = "neutral",
    buildItems
  }) {
    closeComponentMenu();
    closeTextInputDialog();

    contextMenuTitle.textContent = title || "";
    contextMenuSubtitle.textContent = subtitle || "";
    contextMenuSubtitle.hidden = !subtitle;
    contextMenuHead.classList.toggle("has-icon", Boolean(lucide || iconImage));
    contextMenuHead.classList.toggle("has-subtitle", Boolean(subtitle));
    contextMenuHeadIcon.replaceChildren();
    contextMenuHeadIcon.hidden = !(lucide || iconImage);

    if (iconImage) {
      const image = new Image();
      image.src = iconImage;
      image.alt = "";
      contextMenuHeadIcon.append(image);
    } else if (lucide) {
      contextMenuHeadIcon.append(
        createLucideIcon(lucide, "context-menu-head-svg")
      );
    }

    contextMenuEl.dataset.tone = tone;
    contextMenuBody.replaceChildren();
    contextMenuBody.scrollTop = 0;
    buildItems(contextMenuBody);
    contextMenuEl.hidden = false;
    contextMenuEl.classList.remove("is-visible");
    contextMenuOpen = true;
    api.setMenuOpen(true);

    clampMenuPosition(contextMenuEl, x, y);
    requestAnimationFrame(() => {
      if (contextMenuOpen) contextMenuEl.classList.add("is-visible");
    });

    const onPointerDown = (event) => {
      if (contextMenuEl.contains(event.target)) return;
      closeComponentMenu();
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeComponentMenu();
      }
    };
    const onBlur = () => closeComponentMenu();

    setTimeout(() => {
      if (!contextMenuOpen) return;
      document.addEventListener("pointerdown", onPointerDown, true);
    }, 0);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("blur", onBlur);

    contextMenuCleanup = () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("blur", onBlur);
    };
  }

  function appendCategorySortActions(categoryKey) {
    const entry = getCategoryLikeEntry(categoryKey);
    const current = entry && entry.data ? entry.data.sortMode : "";
    const choices = [
      ["name", "按名称排序", "AZ"],
      ["time", "按修改时间排序", "🕒"],
      ["size", "按文件大小排序", "⇅"]
    ];

    appendContextSection("文件排序");

    for (const [mode, label, icon] of choices) {
      appendContextAction(`${label}${current === mode ? " ✓" : ""}`, {
        icon,
        action: async () => {
          const result = await api.setCategorySort(categoryKey, mode);

          if (!result || !result.ok) {
            showCategoryToast(
              categoryKey,
              result && result.error ? result.error : "无法排序文件",
              { error: true }
            );
            return;
          }

          if (entry && entry.data) entry.data.sortMode = mode;
          showCategoryToast(categoryKey, label);
        }
      });
    }

    appendContextSeparator();
  }

  function openGroupContextMenu(entry, x, y) {
    if (!entry || !entry.data) return;

    const locked = Boolean(entry.data.locked);
    const tabCount = Array.isArray(entry.data.tabs) ? entry.data.tabs.length : 0;

    openContextMenu({
      x,
      y,
      title: entry.data.label || "标签组",
      subtitle: `${tabCount} 个分类标签已合并`,
      buildItems: () => {
        appendContextAction("拆分标签组", {
          icon: "⧉",
          action: async () => {
            const result = await api.splitGroup(entry.data.key);

            if (!result || !result.ok) {
              showLayerToast(
                result && result.error ? result.error : "无法拆分标签组",
                { error: true }
              );
              return;
            }

            showLayerToast(
              result.reassigned > 0
                ? `标签组已拆分，${result.reassigned} 个文件已按类型回到匹配分类`
                : "标签组已拆分，各分类已恢复为独立组件"
            );
          }
        });

        appendContextSeparator();
        appendContextAction(locked ? "解锁组件" : "锁定组件", {
          icon: locked ? "🔒" : "🔓",
          action: async () => {
            const result = await api.toggleGroupLock(entry.data.key);

            if (!result || !result.ok) {
              showLayerToast(
                result && result.error ? result.error : "无法切换锁定状态",
                { error: true }
              );
            }
          }
        });

        appendContextAction("调整大小", {
          icon: "⤡",
          disabled: locked,
          action: () => promptResize(entry)
        });
      }
    });
  }

  function openComponentContextMenu(entry, kind, x, y) {
    if (!entry || !entry.data) return;

    if (kind === "group") {
      openGroupContextMenu(entry, x, y);
      return;
    }

    const isCategory = kind === "category";
    const data = entry.data;
    const label = isCategory
      ? data.label
      : (data.label || entry.key);
    const locked = Boolean(data.locked);

    openContextMenu({
      x,
      y,
      title: label,
      buildItems: () => {
        if (isCategory) {
          appendContextAction(data.collapsed ? "展开组件" : "收起组件", {
            icon: data.collapsed ? "⌄" : "⌃",
            action: () => api.setCategoryCollapsed(entry.data.key, !entry.data.collapsed)
          });
          appendContextAction("刷新文件", {
            icon: "↻",
            action: () => api.refreshCategory(entry.data.key).then((result) => {
              if (result && result.ok) showLayerToast("分类已刷新");
            })
          });
          appendCategorySortActions(entry.data.key);
          appendContextAction(
            data.mappedFolder ? "更换映射文件夹…" : "映射本地文件夹…",
            {
              icon: "📁",
              action: async () => {
                const result = await api.mapCategoryFolder(entry.data.key);
                if (result && !result.ok) {
                  showLayerToast(result.error || "无法映射文件夹", { error: true });
                } else if (result && !result.canceled) {
                  showLayerToast("文件夹映射已保存");
                }
              }
            }
          );

          if (data.mappedFolder) {
            appendContextAction("取消文件夹映射", {
              icon: "⊘",
              action: async () => {
                const result = await api.unmapCategoryFolder(entry.data.key);
                if (result && !result.ok) {
                  showLayerToast(result.error || "无法取消映射", { error: true });
                } else {
                  showLayerToast("已取消文件夹映射");
                }
              }
            });
          }

          appendContextAction("清空记录", {
            icon: "⌫",
            danger: true,
            action: async () => {
              const result = await api.clearCategoryRecords(entry.data.key);
              if (result && !result.ok) {
                showLayerToast(result.error || "无法清空记录", { error: true });
              } else if (result && !result.canceled) {
                showLayerToast(`已清空 ${result.removed || 0} 条归属记录`);
              }
            }
          });
          appendContextSeparator();
        }

        if (!isCategory) {
          if (entry.key === "clock") {
            appendContextAction("编辑文字", {
              icon: "✎",
              action: () => {
                openTextInputDialog({
                  title: "编辑时钟文字",
                  description: "这段文字会显示在时间、日期和星期下方。",
                  value: entry.data.customText || "",
                  maxLength: 1000,
                  onSave: async (value) => {
                    const result = await api.setClockText(value);
                    if (!result || !result.ok) {
                      showLayerToast(
                        result && result.error ? result.error : "无法保存时钟文字",
                        { error: true }
                      );
                    }
                  }
                });
              }
            });
            appendContextSeparator();
          }

          if (entry.key === "pomodoro" && entry.pomodoro && entry.pomodoro.target) {
            appendContextAction("清除专注目标", {
              icon: "⌫",
              action: () => {
                clearPomodoroTarget(entry);
                showLayerToast("已清除专注目标");
              }
            });
            appendContextSeparator();
          }

          if (entry.key === "todo") {
            appendContextAction("查看全部待办", {
              icon: "☰",
              action: () => openTodoManager()
            });
            appendContextSeparator();
            appendContextAction("清空已完成", {
              icon: "✓",
              danger: true,
              action: async () => {
                const result = await api.clearCompletedTodos();
                if (!result || !result.ok) {
                  showLayerToast(
                    result && result.error ? result.error : "无法清空已完成待办",
                    { error: true }
                  );
                  return;
                }

                if (componentData) componentData.todos = result.todos || [];
                refreshTodoSurfaces();
                showLayerToast(
                  result.removed > 0
                    ? `已清空 ${result.removed} 项已完成待办`
                    : "没有已完成的待办"
                );
              }
            });
            appendContextSeparator();
          }

          if (entry.key === "quick") {
            const count = entry.data.files ? entry.data.files.length : 0;
            appendContextAction("清空快速收纳", {
              icon: "⌫",
              danger: true,
              disabled: count === 0,
              action: async () => {
                const result = await api.clearQuickFiles();
                if (!result || !result.ok) {
                  showLayerToast(
                    result && result.error ? result.error : "无法清空快速收纳",
                    { error: true }
                  );
                } else {
                  showLayerToast(
                    result.removed > 0 ? "快速收纳已清空" : "快速收纳已经是空的"
                  );
                }
              }
            });
            appendContextSeparator();
          }
        }

        appendContextAction(locked ? "解锁组件" : "锁定组件", {
          icon: locked ? "🔒" : "🔓",
          action: async () => {
            if (isCategory) {
              await api.toggleCategoryLock(entry.data.key);
            } else {
              await api.toggleWidgetLock(entry.key);
            }
          }
        });

        appendContextAction("调整大小", {
          icon: "⤡",
          disabled: locked,
          action: () => promptResize(entry)
        });

        appendContextSection("外观颜色");
        appendColorSwatches({
          active: data.accentColor || "",
          onPick: async (color) => {
            const result = await api.setComponentAccent(kind, entry.data.key || entry.key, color);
            if (result && result.ok) {
              showLayerToast(color ? "组件颜色已更新" : "已恢复默认颜色");
            } else {
              showLayerToast(
                result && result.error ? result.error : "无法更新组件颜色",
                { error: true }
              );
            }
          }
        });

        if (!isCategory) {
          appendContextSection("背景图片");
          appendBackgroundChips({
            backgroundIsBing: Boolean(data.backgroundIsBing),
            onPick: async (action) => {
              const key = entry.key;

              if (action === "local") {
                const result = await api.pickWidgetBackground(key);
                if (result && result.ok && !result.canceled) {
                  showLayerToast("背景图片已更新");
                } else if (result && !result.ok) {
                  showLayerToast(result.error || "无法选择背景图片", { error: true });
                }
              } else if (action === "bing" || action === "bing-refresh") {
                showLayerToast(action === "bing-refresh" ? "正在拉取另一张 Bing 壁纸…" : "正在拉取 Bing 每日壁纸…");
                const result = await api.setBingBackground(key, action === "bing-refresh");
                if (!result || !result.ok) {
                  showLayerToast(
                    result && result.error ? result.error : "无法获取 Bing 壁纸",
                    { error: true }
                  );
                } else {
                  showLayerToast("Bing 壁纸已更新");
                }
              } else {
                const result = await api.clearWidgetBackground(key);
                if (result && result.ok) {
                  showLayerToast("背景图片已清除");
                } else {
                  showLayerToast(
                    result && result.error ? result.error : "无法清除背景图片",
                    { error: true }
                  );
                }
              }
            }
          });
        }

        appendContextSeparator();
        appendContextAction("打开组件设置", {
          icon: "⚙",
          action: async () => {
            const result = await api.openComponentSettings(
              kind,
              isCategory ? entry.data.key : entry.key
            );
            if (result && !result.ok) {
              showLayerToast(result.error || "无法打开组件设置", { error: true });
            }
          }
        });
        appendContextAction("关闭组件", {
          icon: "×",
          danger: true,
          action: async () => {
            if (isCategory) {
              await api.closeCategory(entry.data.key);
            } else {
              await api.closeWidget(entry.key);
            }
          }
        });
      }
    });
  }

  function getFileElementByPath(filePath) {
    return Array.from(document.querySelectorAll("[data-file-path]"))
      .find((element) => element.dataset.filePath === filePath) || null;
  }

  function getFileMenuExtension(file) {
    if (!file || typeof file.name !== "string") return "";
    const dot = file.name.lastIndexOf(".");
    return dot > 0 ? file.name.slice(dot).toLowerCase() : "";
  }

  function getFileMenuProfile(file) {
    if (!file) {
      return {
        type: "document",
        label: "文件",
        icon: "file",
        tone: "document"
      };
    }

    if (file.isSystemIcon) {
      return {
        type: "system",
        label: "系统位置",
        icon: "monitor",
        tone: "system"
      };
    }

    if (file.kind === "folder" || file.type === "folder") {
      return {
        type: "folder",
        label: "文件夹",
        icon: "folder",
        tone: "folder"
      };
    }

    const extension = getFileMenuExtension(file);

    if (extension === ".lnk") {
      return {
        type: "application",
        label: "快捷方式",
        icon: "app-window",
        tone: "application"
      };
    }

    if (extension === ".exe") {
      return {
        type: "application",
        label: "应用程序",
        icon: "app-window",
        tone: "application"
      };
    }

    const typeLabels = {
      document: "文档",
      archive: "压缩包",
      installer: "安装程序",
      audio: "音频",
      video: "视频",
      image: "图片",
      code: "代码文件",
      shortcut: "快捷方式",
      other: "文件"
    };

    return {
      type: "document",
      label: typeLabels[file.type] || "文件",
      icon: file.type === "image" ? "file-image" : "file-text",
      tone: file.type === "image" || file.type === "video" ? "media" : "document"
    };
  }

  function getFileMenuIconImage(file) {
    const element = getFileElementByPath(file.path);
    const image = element ? element.querySelector(".file-icon img") : null;
    return image && image.src ? image.src : "";
  }

  async function setFileClipboardWithFeedback(paths, operation) {
    let result = null;

    try {
      result = await api.setFileClipboard(paths, operation);
    } catch (error) {
      result = null;
    }

    if (!result || !result.ok) {
      showLayerToast(
        result && result.error
          ? result.error
          : operation === "cut"
            ? "无法剪切文件"
            : "无法复制文件",
        { error: true }
      );
      return;
    }

    showLayerToast(
      operation === "cut"
        ? `已剪切 ${result.count} 个文件`
        : `已复制 ${result.count} 个文件到剪贴板`
    );
  }

  async function copyFilePathsWithFeedback(paths) {
    let result = null;

    try {
      result = await api.copyFilePathsText(paths);
    } catch (error) {
      result = null;
    }

    if (!result || !result.ok) {
      showLayerToast(
        result && result.error ? result.error : "无法复制文件路径",
        { error: true }
      );
      return;
    }

    showLayerToast(`已复制 ${result.count || paths.length} 条文件路径`);
  }

  function openFileContextMenu({ x, y, categoryKey, file }) {
    if (!file) return;

    const activeTag = file.colorTag || "";
    const isQuick = categoryKey === "quick";
    const isSystem = Boolean(file.isSystemIcon);
    const extension = getFileMenuExtension(file);
    const profile = getFileMenuProfile(file);
    const contextPaths = getContextPaths(file).filter((filePath) => {
      const meta = fileMetaByPath.get(filePath);
      return !meta || !meta.file || !meta.file.isSystemIcon;
    });
    const menuPaths = contextPaths.length > 0 ? contextPaths : [file.path];
    const extensionLabel = extension ? extension.slice(1).toUpperCase() : "";
    const selectionLabel = [
      profile.label,
      profile.type === "folder" || profile.type === "system"
        ? ""
        : extensionLabel,
      menuPaths.length > 1 ? `已选择 ${menuPaths.length} 项` : ""
    ].filter(Boolean).join(" · ");

    openContextMenu({
      x,
      y,
      title: file.name,
      subtitle: selectionLabel,
      lucide: profile.icon,
      iconImage: getFileMenuIconImage(file),
      tone: profile.tone,
      buildItems: () => {
        if (isSystem) {
          appendContextAction("打开系统入口", {
            lucide: "arrow-up-right",
            action: async () => {
              const result = await api.openFile(categoryKey, file.path);

              if (!result || !result.ok) {
                showLayerToast(
                  result && result.error ? result.error : "无法打开系统入口",
                  { error: true }
                );
              }
            }
          });
          return;
        }

        appendContextAction("打开", {
          lucide: "arrow-up-right",
          shortcut: "Enter",
          action: async () => {
            const result = isQuick
              ? await api.openQuickFile(file.path)
              : await api.openFile(categoryKey, file.path);

            if (!result || !result.ok) {
              showLayerToast(
                result && result.error ? result.error : "无法打开文件",
                { error: true }
              );
            }
          }
        });

        if (profile.type === "folder") {
          appendContextAction("在新窗口中打开", {
            lucide: "app-window",
            action: async () => {
              const result = await api.openFolderWindow(categoryKey, file.path);

              if (!result || !result.ok) {
                showLayerToast(
                  result && result.error ? result.error : "无法在新窗口中打开",
                  { error: true }
                );
              }
            }
          });
          appendContextAction("固定到快速访问", {
            lucide: "pin",
            action: async () => {
              const result = await api.pinQuickAccess(categoryKey, file.path);

              if (result && result.ok) {
                showLayerToast("已固定到快速访问");
              } else {
                showLayerToast(
                  result && result.error ? result.error : "无法固定到快速访问",
                  { error: true }
                );
              }
            }
          });
        }

        if (profile.type === "application" && extension === ".exe") {
          appendContextAction("以管理员身份运行", {
            lucide: "shield",
            action: async () => {
              const result = await api.runAsAdministrator(categoryKey, file.path);

              if (!result || !result.ok) {
                showLayerToast(
                  result && result.error ? result.error : "无法以管理员身份运行",
                  { error: true }
                );
              }
            }
          });
        }

        if (profile.type === "document") {
          appendContextAction("打开方式", {
            lucide: "app-window",
            action: async () => {
              const result = await api.openWith(categoryKey, file.path);

              if (!result || !result.ok) {
                showLayerToast(
                  result && result.error ? result.error : "无法打开「打开方式」",
                  { error: true }
                );
              }
            }
          });
        }

        appendContextSeparator();

        if (profile.type === "folder" || profile.type === "document") {
          appendContextAction("复制", {
            lucide: "copy",
            shortcut: "Ctrl+C",
            action: () => setFileClipboardWithFeedback(menuPaths, "copy")
          });
          appendContextAction("剪切", {
            lucide: "scissors",
            shortcut: "Ctrl+X",
            action: () => setFileClipboardWithFeedback(menuPaths, "cut")
          });
        }

        if (profile.type === "application") {
          appendContextAction("打开文件所在的位置", {
            lucide: "folder-open",
            action: async () => {
              const result = await api.revealFile(categoryKey, file.path);

              if (!result || !result.ok) {
                showLayerToast(
                  result && result.error ? result.error : "无法定位文件",
                  { error: true }
                );
              }
            }
          });
        }

        appendContextAction("复制文件路径", {
          lucide: "link",
          action: () => copyFilePathsWithFeedback(menuPaths)
        });

        appendContextSeparator();
        appendContextSection("颜色标签", { lucide: "palette" });
        appendFileColorSwatches({
          active: activeTag,
          onPick: async (color) => {
            const result = await api.setFileColorTag(categoryKey, file.path, color);

            if (result && result.ok) {
              showLayerToast(color ? "颜色标签已更新" : "颜色标签已清除");
            } else {
              showLayerToast(
                result && result.error ? result.error : "无法更新颜色标签",
                { error: true }
              );
            }
          }
        });

        appendContextSeparator();
        appendContextAction("删除", {
          lucide: "trash-2",
          danger: true,
          disabled: menuPaths.length === 0,
          action: () => trashFilesWithFeedback(menuPaths)
        });
        appendContextAction("属性", {
          lucide: "info",
          action: async () => {
            const result = await api.showFileProperties(categoryKey, file.path);

            if (!result || !result.ok) {
              showLayerToast(
                result && result.error ? result.error : "无法打开属性",
                { error: true }
              );
            }
          }
        });

        if (isQuick) {
          appendContextSeparator();
          appendContextAction("从快速收纳移除", {
            lucide: "x",
            danger: true,
            action: async () => {
              const result = await api.removeQuickFile(file.path);

              if (result && result.ok) {
                showLayerToast("已从快速收纳移除");
              } else {
                showLayerToast(
                  result && result.error ? result.error : "无法移除文件",
                  { error: true }
                );
              }
            }
          });
        }
      }
    });
  }

  function promptResize(entry) {
    if (!entry || !entry.data || entry.data.locked) return;

    const highlight = () => {
      entry.el.classList.add("is-resize-prompt");
      setTimeout(() => {
        if (entry.el.isConnected) entry.el.classList.remove("is-resize-prompt");
      }, 3200);
      showLayerToast("拖动组件边缘或四角调整大小");
    };

    if (entry.data.collapsed && entry.data.key) {
      api.setCategoryCollapsed(entry.data.key, false)
        .then(() => setTimeout(highlight, 120))
        .catch(highlight);
      return;
    }

    highlight();
  }

  function closeTextInputDialog() {
    const existing = document.querySelector(".layer-dialog-backdrop");
    if (!existing) return;

    existing.remove();
    api.setMenuOpen(false);
    api.releaseInput();
  }

  function openTextInputDialog({ title, description, value, maxLength, onSave }) {
    closeTextInputDialog();

    const backdrop = document.createElement("div");
    backdrop.className = "layer-dialog-backdrop";
    const card = document.createElement("section");
    card.className = "layer-dialog";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");

    const heading = document.createElement("h2");
    heading.textContent = title;

    const copy = document.createElement("p");
    copy.textContent = description || "";

    const input = document.createElement("textarea");
    input.className = "layer-dialog-input";
    input.value = value || "";
    input.maxLength = Math.max(1, Number(maxLength) || 1000);
    input.rows = 4;

    const actions = document.createElement("div");
    actions.className = "layer-dialog-actions";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "layer-dialog-btn";
    cancel.textContent = "取消";
    const save = document.createElement("button");
    save.type = "button";
    save.className = "layer-dialog-btn is-primary";
    save.textContent = "保存";
    actions.append(cancel, save);
    card.append(heading, copy, input, actions);
    backdrop.append(card);
    document.body.append(backdrop);

    api.setMenuOpen(true);
    input.focus();
    api.focusInput().catch(() => {});

    const close = () => {
      backdrop.remove();
      api.setMenuOpen(false);
      api.releaseInput();
    };
    const submit = async () => {
      const next = input.value;
      close();
      try {
        await onSave(next);
      } catch (error) {
        showLayerToast("无法保存文字", { error: true });
      }
    };

    cancel.addEventListener("click", close);
    save.addEventListener("click", submit);
    backdrop.addEventListener("pointerdown", (event) => {
      if (event.target === backdrop) close();
    });
    input.addEventListener("keydown", (event) => {
      if (event.isComposing) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        submit();
      }
    });
  }

  function setPassthrough(ignore) {
    const next = Boolean(ignore);
    if (lastPassthrough === next) return;
    lastPassthrough = next;
    api.setMousePassthrough(next);
  }

  function holdInteraction(reason) {
    if (holds.has(reason)) return;
    holds.add(reason);

    if (holds.size === 1) {
      api.setInteractionActive(true);
    }

    // Dragging must keep the layer interactive even if the pointer crosses a
    // gap between components. The main process restores passthrough later.
    setPassthrough(false);
  }

  function releaseInteraction(reason) {
    if (!holds.delete(reason)) return;

    if (holds.size === 0) {
      api.setInteractionActive(false);
    }
  }

  window.addEventListener("mousemove", (event) => {
    lastPointer = {
      x: event.clientX,
      y: event.clientY,
      valid: true
    };
    scheduleParallax(event.clientX, event.clientY);
  }, true);

  window.addEventListener("pointermove", (event) => {
    lastPointer = {
      x: event.clientX,
      y: event.clientY,
      valid: true
    };
    scheduleParallax(event.clientX, event.clientY);
  }, true);

  function bodyIsInPerformanceMode() {
    return document.body.classList.contains("performance-mode");
  }

  function scheduleParallax(x, y) {
    if (bodyIsInPerformanceMode()) return;
    parallaxPoint = { x, y };
    if (parallaxFrame !== null) return;

    parallaxFrame = requestAnimationFrame(() => {
      parallaxFrame = null;
      updateParallax(parallaxPoint.x, parallaxPoint.y);
    });
  }

  function updateParallax(x, y) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    for (const entry of widgets.values()) {
      if (!entry.backgroundUrl || !entry.el.isConnected) continue;

      if (reduceMotion) {
        entry.el.style.removeProperty("--parallax-x");
        entry.el.style.removeProperty("--parallax-y");
        continue;
      }

      const rect = entry.el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;

      const dx = Math.max(-1, Math.min(1, (x - (rect.left + rect.width / 2)) / (rect.width / 2)));
      const dy = Math.max(-1, Math.min(1, (y - (rect.top + rect.height / 2)) / (rect.height / 2)));

      entry.el.style.setProperty("--parallax-x", `${(-dx * 5).toFixed(1)}px`);
      entry.el.style.setProperty("--parallax-y", `${(-dy * 5).toFixed(1)}px`);
    }
  }

  function positionWidget(entry) {
    if (!state || !entry || entry.moving || entry.resizing) return;

    const origin = overlayOrigin();
    const item = entry.data;
    const width = Math.max(1, round(item.width));
    const height = Math.max(1, round(item.height));

    entry.el.style.left = `${round(item.x - origin.x)}px`;
    entry.el.style.top = `${round(item.y - origin.y)}px`;
    entry.el.style.width = `${width}px`;
    entry.el.style.height = `${height}px`;
    // The folded pane keeps this height while the card shrinks, so the content
    // slides out of view instead of reflowing mid-transition.
    entry.el.style.setProperty("--widget-content-height", `${height}px`);
  }

  function attachResizeHandle(entry, kind, key) {
    const frame = entry.resizeHandle;
    if (!frame) return;

    frame.classList.add("widget-resize-frame");
    frame.removeAttribute("title");

    // Standard window-resize affordances: eight invisible hit zones let the
    // pointer become ew/ns/nesw/nwse-resize on the matching edge or corner.
    for (const direction of RESIZE_DIRECTIONS) {
      const zone = document.createElement("div");
      zone.className = `widget-resize-zone is-${direction}`;
      zone.dataset.resizeHandle = direction;
      zone.setAttribute("aria-hidden", "true");
      zone.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        if (!entry.data || entry.data.locked || entry.data.collapsed) return;

        event.preventDefault();
        event.stopPropagation();
        raise(entry);
        startResize(entry, kind, key, event, direction);
      });
      frame.append(zone);
    }
  }

  function syncComponentActions(entry) {
    if (!entry || !entry.actions) return;

    const locked = Boolean(entry.data && entry.data.locked);
    const lockButton = entry.actions.lockButton;

    lockButton.innerHTML = locked ? LOCK_ICON : UNLOCK_ICON;
    lockButton.classList.toggle("is-locked", locked);
    lockButton.setAttribute("aria-pressed", String(locked));
    lockButton.setAttribute("aria-label", locked ? "解锁组件" : "锁定组件");
    lockButton.title = locked ? "解锁组件" : "锁定组件";
  }

  function attachComponentActions(entry, kind, key) {
    const bar = document.createElement("div");
    bar.className = "component-actions";
    bar.dataset.noDrag = "";

    const lockButton = document.createElement("button");
    lockButton.type = "button";
    lockButton.className = "component-action component-lock";
    lockButton.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
    lockButton.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!entry.data) return;

      try {
        const result = kind === "category"
          ? await api.toggleCategoryLock(key)
          : kind === "group"
            ? await api.toggleGroupLock(key)
            : await api.toggleWidgetLock(key);

        if (!result || !result.ok) {
          showLayerToast(
            result && result.error
              ? result.error
              : "无法切换锁定状态",
            { error: true }
          );
        }
      } catch (error) {
        showLayerToast("无法切换锁定状态", { error: true });
      }
    });

    const moreButton = document.createElement("button");
    moreButton.type = "button";
    moreButton.className = "component-action component-more";
    moreButton.innerHTML = MORE_ICON;
    moreButton.setAttribute("aria-label", "更多操作");
    moreButton.title = "更多操作";
    moreButton.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
    moreButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const rect = bar.getBoundingClientRect();
      openComponentContextMenu(
        entry,
        kind,
        Math.round(rect.right),
        Math.round(rect.bottom + 4)
      );
    });

    bar.append(lockButton, moreButton);
    entry.el.append(bar);
    entry.actions = { bar, lockButton, moreButton };

    // Categories already had a lock control in their title bar. Keep the
    // context menu and the unified top-right button as the single lock UI.
    if (kind === "category" && entry.lockButton) {
      entry.lockButton.style.display = "none";
    }

    syncComponentActions(entry);
  }

  function applyCategoryState(entry, item) {
    const previousFiles = entry.filesSignature;
    entry.data = item;
    entry.el.dataset.categoryKey = item.key;
    entry.el.classList.toggle("is-locked", Boolean(item.locked));
    entry.el.classList.toggle("is-collapsed", Boolean(item.collapsed));
    entry.el.dataset.collapsed = item.collapsed ? "true" : "false";
    entry.el.dataset.folderBadge = item.mappedFolder ? "1" : "";
    entry.label.textContent = item.label;
    entry.label.title = `双击重命名「${item.label}」`;
    entry.lockBadge.hidden = !item.locked;
    entry.lockButton.textContent = item.locked ? "🔒" : "🔓";
    entry.lockButton.setAttribute(
      "aria-label",
      item.locked ? "解锁小组件" : "锁定小组件"
    );
    entry.lockButton.title = item.locked ? "解锁小组件" : "锁定小组件";
    entry.lockButton.classList.toggle("is-locked", Boolean(item.locked));
    entry.app.classList.toggle("is-collapsed", Boolean(item.collapsed));
    entry.app.classList.toggle("is-locked", Boolean(item.locked));
    entry.app.style.setProperty("--rows", item.rows);
    entry.app.style.setProperty("--cols", item.cols);
    entry.app.setAttribute("aria-expanded", String(!item.collapsed));
    applyAccent(entry.app, item.accentColor);

    const files = Array.isArray(item.files) ? item.files : [];
    const empty = files.length === 0;
    entry.scroll.hidden = empty;
    entry.empty.hidden = !empty;

    const nextSignature = files
      .map((file) => `${file.key}:${file.type}:${file.iconMode}:${file.colorTag || ""}:${file.timeCapsule ? 1 : 0}`)
      .join("\u0001");

    if (previousFiles !== nextSignature) {
      entry.filesSignature = nextSignature;
      renderCategoryGrid(entry, files);
    }

    applyAppearance(entry.app);
    syncComponentActions(entry);
    positionWidget(entry);
  }

  function createCategory(item) {
    const fragment = categoryTemplate.content.cloneNode(true);
    const el = fragment.querySelector(".category-widget");
    const app = fragment.querySelector(".floating-app");
    const entry = {
      el,
      app,
      data: item,
      dragbar: fragment.querySelector("[data-category-dragbar]"),
      label: fragment.querySelector("[data-category-label]"),
      lockBadge: fragment.querySelector("[data-lock-badge]"),
      lockButton: fragment.querySelector('[data-action="lock"]'),
      resetButton: fragment.querySelector('[data-action="reset"]'),
      closeButton: fragment.querySelector('[data-action="close"]'),
      scroll: fragment.querySelector("[data-scroll]"),
      grid: fragment.querySelector("[data-grid]"),
      empty: fragment.querySelector("[data-empty]"),
      dropHint: fragment.querySelector("[data-drop-hint]"),
      toast: fragment.querySelector("[data-toast]"),
      resizeHandle: fragment.querySelector("[data-resize-handle]"),
      toastTimer: null,
      filesSignature: null,
      moving: false,
      resizing: false,
      renaming: false,
      hovering: false,
      collapseTimer: null
    };

    el.dataset.categoryKey = item.key;
    attachResizeHandle(entry, "category", item.key);
    attachComponentActions(entry, "category", item.key);

    // Overlapping desktop widgets use DOM stacking order. Raise a card on any
    // native press before button/file handlers run so a card moved over
    // another one becomes the interactive target.
    el.addEventListener("pointerdown", () => raise(entry), true);

    entry.lockButton.addEventListener("click", (event) => {
      event.stopPropagation();
      api.toggleCategoryLock(entry.data.key).catch(() => {
        showCategoryToast(entry.data.key, "无法切换锁定状态");
      });
    });
    entry.resetButton.addEventListener("click", (event) => {
      event.stopPropagation();
      api.resetCategoryGrid(entry.data.key).catch(() => {
        showCategoryToast(entry.data.key, "无法恢复默认大小");
      });
    });
    entry.closeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      api.closeCategory(entry.data.key).catch(() => {
        showCategoryToast(entry.data.key, "无法关闭组件");
      });
    });

    entry.dragbar.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      if (event.target.closest("button, input")) return;
      if (entry.data.locked) return;
      startMove(entry, "category", entry.data.key, event);
    });

    // Title text and the rest of the titlebar are separate double-click
    // targets: the label always renames, blank titlebar space toggles collapse.
    entry.label.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      beginRename(entry);
    });

    entry.label.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });

    entry.dragbar.addEventListener("dblclick", (event) => {
      if (event.target.closest("button, input, [data-category-label]")) return;
      if (!entry.data) return;

      api.setCategoryCollapsed(entry.data.key, !entry.data.collapsed)
        .catch(() => {});
      api.recordAchievementEvent("component-toggle", {
        key: entry.data.key
      }).catch(() => {});
    });

    entry.el.addEventListener("contextmenu", (event) => {
      if (event.target.closest(".file-cell")) return;
      event.preventDefault();
      event.stopPropagation();
      openComponentContextMenu(entry, "category", event.clientX, event.clientY);
    });

    entry.el.addEventListener("pointerenter", () => {
      entry.hovering = true;
      clearTimeout(entry.collapseTimer);

      const mode = state && state.settings
        ? state.settings.collapseMode
        : "double-click";

      if (mode === "hover" && entry.data.collapsed && !fileDrag) {
        api.setCategoryCollapsed(entry.data.key, false).catch(() => {});
      }
    });

    entry.el.addEventListener("pointerleave", () => {
      entry.hovering = false;

      const mode = state && state.settings
        ? state.settings.collapseMode
        : "double-click";

      if (
        mode !== "hover" ||
        entry.moving ||
        entry.renaming ||
        fileDrag ||
        entry.data?.key === tourKeepExpandedCategoryKey
      ) {
        return;
      }

      entry.collapseTimer = setTimeout(() => {
        if (
          !entry.hovering &&
          !entry.moving &&
          !entry.renaming &&
          entry.data?.key !== tourKeepExpandedCategoryKey
        ) {
          api.setCategoryCollapsed(entry.data.key, true).catch(() => {});
        }
      }, 110);
    });

    entry.el.addEventListener("dragenter", (event) => {
      if (!isFileDragEvent(event)) return;
      expandCategoryForFileDrag(entry);
    });

    entry.el.addEventListener("dragover", (event) => {
      if (!isFileDragEvent(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      expandCategoryForFileDrag(entry);
      entry.el.classList.add("is-file-drop-target");
      entry.dropHint.hidden = false;
    });

    entry.el.addEventListener("dragleave", (event) => {
      if (!entry.el.contains(event.relatedTarget)) {
        entry.el.classList.remove("is-file-drop-target");
        entry.dropHint.hidden = true;
        scheduleCategoryDragLeave(entry.data && entry.data.key);
      }
    });

    entry.el.addEventListener("drop", (event) => {
      if (!fileDrag) return;
      event.preventDefault();
      event.stopPropagation();
      dropFileOnCategory(entry, event, null);
    });

    // Drop on empty grid space means "append to this category".
    entry.grid.addEventListener("dragover", (event) => {
      if (!fileDrag) return;
      event.preventDefault();
      entry.el.classList.add("is-file-drop-target");
      entry.dropHint.hidden = false;
    });

    entry.grid.addEventListener("drop", (event) => {
      if (!fileDrag) return;
      event.preventDefault();
      event.stopPropagation();
      dropFileOnCategory(entry, event, entry.data.files.length);
    });

    entry.scroll.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      if (event.target.closest(".file-cell, .file-rename-input")) return;

      if (!event.ctrlKey && !event.metaKey) {
        clearFileSelection();
      }

      startMarqueeSelection(event);
    });

    arrayFromNodeList(fragment.querySelectorAll(".icon-btn")).forEach((button) => {
      button.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
      });
    });

    return entry;
  }

  function arrayFromNodeList(list) {
    return Array.prototype.slice.call(list);
  }

  function isFileDragEvent(event) {
    if (fileDrag) return true;

    return Boolean(
      event &&
      event.dataTransfer &&
      Array.from(event.dataTransfer.types || []).includes("Files")
    );
  }

  function expandCategoryForFileDrag(entry) {
    if (!entry || !entry.data) return;

    const key = entry.data.key;

    if (categoryDragHoverKey !== key) {
      const previous = categoryDragHoverKey;
      categoryDragHoverKey = key;

      if (previous) {
        restoreCategoryAfterFileDrag(previous);
      }
    }

    clearTimeout(categoryDragLeaveTimer);
    categoryDragLeaveTimer = null;

    // Raise the hovered category above every other component immediately,
    // even when it was already expanded and might be covered by a neighbour.
    if (!dragRaisedCategoryKeys.has(key)) {
      entry.dragPreviousZIndex = entry.el.style.zIndex || "";
      entry.el.style.zIndex = String(DRAG_RAISED_Z_INDEX);
      entry.el.classList.add("is-drag-raised");
      dragRaisedCategoryKeys.add(key);
    }

    if (!entry.data.collapsed) return;
    if (dragExpandedCategoryKeys.has(key)) return;

    dragExpandedCategoryKeys.add(key);
    api.setCategoryCollapsed(key, false).catch(() => {
      dragExpandedCategoryKeys.delete(key);
    });
  }

  function scheduleCategoryDragLeave(key) {
    if (!key || categoryDragHoverKey !== key) return;

    clearTimeout(categoryDragLeaveTimer);
    categoryDragLeaveTimer = setTimeout(() => {
      categoryDragLeaveTimer = null;
      if (categoryDragHoverKey !== key) return;
      categoryDragHoverKey = null;
      restoreCategoryAfterFileDrag(key);
    }, 140);
  }

  function clearCategoryDragHover() {
    const key = categoryDragHoverKey;
    categoryDragHoverKey = null;
    clearTimeout(categoryDragLeaveTimer);
    categoryDragLeaveTimer = null;

    if (key) restoreCategoryAfterFileDrag(key);
  }

  function restoreCategoryAfterFileDrag(key) {
    if (!key) return;

    const entry = categories.get(key);

    if (entry && dragRaisedCategoryKeys.delete(key)) {
      if (entry.dragPreviousZIndex) {
        entry.el.style.zIndex = entry.dragPreviousZIndex;
      } else {
        entry.el.style.zIndex = "";
      }

      entry.dragPreviousZIndex = null;
      entry.el.classList.remove("is-drag-raised");
    }

    if (!dragExpandedCategoryKeys.has(key)) return;

    dragExpandedCategoryKeys.delete(key);
    api.setCategoryCollapsed(key, true).catch(() => {});
  }

  function restoreAllDragExpandedCategories() {
    const keys = new Set([
      ...dragExpandedCategoryKeys,
      ...dragRaisedCategoryKeys
    ]);

    for (const key of keys) {
      restoreCategoryAfterFileDrag(key);
    }
  }

  function scheduleFileDragIdleCleanup() {
    clearTimeout(fileDragIdleTimer);
    fileDragIdleTimer = setTimeout(() => {
      fileDragIdleTimer = null;
      if (!fileDrag) clearAllFileDragVisuals();
    }, 1200);
  }

  function clearAllFileDragVisuals() {
    for (const entry of categories.values()) {
      entry.el.classList.remove("is-file-drop-target", "is-file-drag-source");
      entry.dropHint.hidden = true;
    }

    for (const entry of widgets.values()) {
      entry.el.classList.remove("is-file-drop-target");
      if (entry.quickEls) entry.quickEls.dropHint.hidden = true;
      if (entry.pomodoro) entry.pomodoro.dropHint.hidden = true;
      if (entry.transferDropHint) entry.transferDropHint.hidden = true;
    }

    for (const entry of tabEntries.values()) {
      entry.el.classList.remove("is-file-drop-target");
      entry.dropHint.hidden = true;
    }

    for (const entry of groups.values()) {
      entry.el.classList.remove("is-file-drop-target", "is-tab-merge-target");
    }

    clearCategoryDragHover();
    restoreAllDragExpandedCategories();
    clearTimeout(fileDragIdleTimer);
    fileDragIdleTimer = null;
  }

  function renderCategoryGrid(entry, files) {
    const scrollTop = entry.scroll.scrollTop;

    for (const [filePath, meta] of [...fileMetaByPath]) {
      if (meta.sourceKey === entry.data.key && meta.entry === entry) {
        fileMetaByPath.delete(filePath);
      }
    }

    entry.grid.replaceChildren();

    files.forEach((file, index) => {
      entry.grid.append(createFileCell(entry, file, index));
    });

    refreshSelectionClasses();
    entry.scroll.scrollTop = scrollTop;
    requestAnimationFrame(updateScrollable);
  }

  function openDesktopIcon(file) {
    if (!file || typeof file.path !== "string") return;

    const wasTimeCapsule = isTimeCapsuleCell(file);
    restoreTimeCapsulePath(file.path);
    if (wasTimeCapsule) {
      api.recordAchievementEvent("time-capsule-restore").catch(() => {});
    }

    api.openFile("desktop", file.path).then((result) => {
      if (!result || !result.ok) {
        showLayerToast(
          result && result.error ? result.error : "无法打开桌面文件",
          { error: true }
        );
      }
    }).catch(() => {
      showLayerToast("无法打开桌面文件", { error: true });
    });
  }

  function createDesktopIconCell(file, index, total) {
    const cell = document.createElement("div");
    cell.className = "desktop-icon";
    cell.draggable = true;
    cell.tabIndex = 0;
    cell.dataset.fileKey = file.key;
    cell.dataset.path = file.path;
    cell.dataset.filePath = file.path;
    cell.dataset.fileKind = file.kind || "file";
    cell.classList.toggle("is-selected", selectedFilePaths.has(file.path));
    cell.classList.toggle("is-time-capsule", isTimeCapsuleCell(file));
    cell.setAttribute("role", "listitem");
    cell.setAttribute(
      "aria-label",
      `${file.name}，未整理，点击打开；Ctrl 点击多选；Alt 拖拽到其他应用`
    );
    cell.setAttribute("aria-selected", String(selectedFilePaths.has(file.path)));
    cell.title = isTimeCapsuleCell(file)
      ? `${file.name}（超过 30 天未修改，双击打开并恢复彩色）`
      : `${file.name}（Alt+拖拽到其他应用）`;

    fileMetaByPath.set(file.path, {
      sourceKey: "desktop",
      entry: null,
      file,
      index
    });

    const iconWrap = document.createElement("div");
    iconWrap.className = "file-icon";
    applyTypeIcon(iconWrap, file.type);

    if (file.iconMode === "system") {
      iconWrap.classList.add("is-icon-loading");
      loadSystemIcon(null, file, iconWrap, "desktop");
    }

    const name = document.createElement("span");
    name.className = "file-name";
    name.textContent = file.name;
    name.title = file.name;

    cell.append(iconWrap, name);

    if (file.colorTag) {
      cell.dataset.colorTag = file.colorTag;
      const tag = document.createElement("span");
      tag.className = "file-color-tag";
      tag.setAttribute("aria-hidden", "true");
      cell.append(tag);
    }

    cell.addEventListener("click", (event) => {
      lastClickedFilePath = file.path;

      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        event.stopPropagation();
        toggleFileSelection(file.path);
        return;
      }

      if (fileDrag) return;

      if (isTimeCapsuleCell(file)) {
        event.preventDefault();
        event.stopPropagation();
        if (event.detail <= 1) {
          showLayerToast("时间胶囊：双击打开并恢复彩色");
        }
        return;
      }

      openDesktopIcon(file);
    });

    cell.addEventListener("dblclick", (event) => {
      if (!isTimeCapsuleCell(file)) return;
      event.preventDefault();
      event.stopPropagation();
      openDesktopIcon(file);
    });

    cell.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openDesktopIcon(file);
      }
    });

    cell.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openFileContextMenu({
        x: event.clientX,
        y: event.clientY,
        categoryKey: "desktop",
        file
      });
    });

    cell.addEventListener("dragover", (event) => {
      if (!fileDrag) return;
      event.preventDefault();
      event.stopPropagation();

      if (isFolderDropTarget(file)) {
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
        cell.classList.add("is-special-drop-target");
        return;
      }

      if (event.dataTransfer) event.dataTransfer.dropEffect = "none";
      cell.classList.add("is-drop-blocked");
    });

    cell.addEventListener("dragleave", () => {
      cell.classList.remove("is-special-drop-target", "is-drop-blocked");
    });

    cell.addEventListener("drop", (event) => {
      if (!fileDrag) return;
      event.preventDefault();
      event.stopPropagation();

      if (!isFolderDropTarget(file)) {
        finishFileDrag();
        showLayerToast("请把文件拖到文件夹或桌面空白处", { error: true });
        return;
      }

      moveDraggedFilesIntoFolder(file);
    });

    cell.addEventListener("dragstart", (event) => {
      if (wantsExternalFileDrag(event)) {
        startExternalFileDrag(event, cell, file);
        return;
      }

      const items = buildDragItems({
        sourceKey: "desktop",
        entry: null,
        file,
        index
      });
      const primaryItem = items.find((item) => item.file.path === file.path) ||
        items[0];

      fileDrag = {
        items,
        files: items.map((item) => item.file),
        sourceKey: "desktop",
        sourceEntry: null,
        file: primaryItem.file,
        fromIndex: primaryItem.fromIndex,
        filesLength: total,
        handled: false,
        canceled: false
      };
      holdInteraction("file-drag");
      document.body.classList.add("is-file-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(
        "text/plain",
        items.map((item) => item.file.path).join("\n")
      );

      for (const item of items) {
        const selectedCell = getFileElementByPath(item.file.path);
        if (selectedCell) selectedCell.classList.add("is-dragging");
      }

      const ghost = cell.cloneNode(true);
      ghost.classList.add("drag-ghost");
      ghost.classList.remove("is-dragging", "is-selected");

      if (items.length > 1) {
        const count = document.createElement("span");
        count.className = "drag-count";
        count.textContent = String(items.length);
        ghost.append(count);
      }

      document.body.append(ghost);
      event.dataTransfer.setDragImage(ghost, 38, 42);
      requestAnimationFrame(() => ghost.remove());
    });

    cell.addEventListener("dragend", () => {
      cell.classList.remove("is-dragging");
      finishFileDrag();
    });

    prepareCellDragIcon(cell);
    return cell;
  }

  function syncDesktopIcons(items) {
    const list = (Array.isArray(items) ? items : [])
      .filter((item) => item && typeof item.key === "string");
    const signature = list
      .map((item) => `${item.key}\u0000${item.iconMode || ""}\u0000${item.colorTag || ""}\u0000${item.timeCapsule ? 1 : 0}`)
      .join("\u0001");

    if (signature === desktopItemsSignature) return;

    desktopItemsSignature = signature;

    for (const [filePath, meta] of [...fileMetaByPath]) {
      if (meta.sourceKey === "desktop") {
        fileMetaByPath.delete(filePath);
      }
    }

    desktopIconEntries.clear();
    desktopIconLayer.replaceChildren();

    list.forEach((file, index) => {
      const cell = createDesktopIconCell(file, index, list.length);
      desktopIconEntries.set(file.key, cell);
      desktopIconLayer.append(cell);
    });

    refreshSelectionClasses();
    requestAnimationFrame(reportDesktopIconRects);
  }

  function reportDesktopIconRects() {
    if (typeof api.setDesktopIconRects !== "function") return;

    const rects = [];

    for (const cell of desktopIconEntries.values()) {
      if (!cell.isConnected) continue;
      const rect = cell.getBoundingClientRect();

      if (rect.width <= 0 || rect.height <= 0) continue;

      rects.push({
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      });
    }

    api.setDesktopIconRects(rects);
  }

  function updateScrollable() {
    const entries = [
      ...categories.values(),
      ...tabEntries.values()
    ];

    for (const entry of entries) {
      if (entry.scroll.hidden || (entry.el && entry.el.hidden)) {
        entry.scroll.classList.remove("is-scrollable");
        continue;
      }

      entry.scroll.classList.toggle(
        "is-scrollable",
        entry.scroll.scrollHeight > entry.scroll.clientHeight + 1
      );
    }
  }

  function getFileKeyFromDrag() {
    return fileDrag && fileDrag.file ? fileDrag.file.key : null;
  }

  function clearDropTargets() {
    document.querySelectorAll(".is-special-drop-target").forEach((element) => {
      element.classList.remove("is-special-drop-target");
    });
    for (const entry of categories.values()) {
      entry.el.classList.remove("is-file-drop-target");
      entry.dropHint.hidden = true;
      entry.grid.querySelectorAll(".drop-before, .drop-after").forEach((cell) => {
        cell.classList.remove("drop-before", "drop-after");
      });
    }

    for (const entry of widgets.values()) {
      entry.el.classList.remove("is-file-drop-target");

      if (entry.quickEls) {
        entry.quickEls.dropHint.hidden = true;
      }
      if (entry.pomodoro) {
        entry.pomodoro.dropHint.hidden = true;
      }
      if (entry.transferDropHint) {
        entry.transferDropHint.hidden = true;
      }
    }

    for (const entry of groups.values()) {
      entry.el.classList.remove("is-file-drop-target", "is-tab-merge-target");

      for (const tabEntry of entry.tabEntries.values()) {
        tabEntry.el.classList.remove("is-file-drop-target");
        tabEntry.dropHint.hidden = true;
      }
    }
  }

  function dropFileOnCategory(entry, event, targetIndex) {
    if (!fileDrag) return;

    const drag = fileDrag;
    const targetKey = entry.data.key;
    drag.handled = true;
    clearDropTargets();

    const items = Array.isArray(drag.items) && drag.items.length > 0
      ? drag.items
      : [{
        sourceKey: drag.sourceKey,
        sourceEntry: drag.sourceEntry,
        file: drag.file,
        fromIndex: drag.fromIndex
      }];
    const fromTarget = items.every((item) => item.sourceKey === targetKey);

    if (fromTarget) {
      if (targetIndex === null) return;

      const selectedKeys = new Set(items.map((item) => item.file.key));
      const files = entry.data.files.slice();
      const moved = files.filter((file) => selectedKeys.has(file.key));
      const remaining = files.filter((file) => !selectedKeys.has(file.key));
      const safeTarget = Math.max(0, Math.min(targetIndex, files.length));
      const insertIndex = files
        .slice(0, safeTarget)
        .filter((file) => !selectedKeys.has(file.key))
        .length;

      if (moved.length === 0) return;

      remaining.splice(insertIndex, 0, ...moved);

      api.saveCategoryOrder(targetKey, remaining.map((file) => file.key))
        .catch(() => {
          showCategoryToast(targetKey, "排序保存失败");
        });
      return;
    }

    const blockedSystem = items.some((item) => item.file.isSystemIcon);
    const blockedExternal = items.some((item) => item.file.external);
    const moves = items.filter((item) => (
      item.sourceKey !== targetKey &&
      !item.file.isSystemIcon &&
      !item.file.external
    ));

    if (moves.length === 0) {
      if (blockedSystem) {
        showCategoryToast(targetKey, "系统图标不能移入其他分类");
      } else if (blockedExternal) {
        showCategoryToast(targetKey, "映射文件夹中的文件不能移入分类");
      }
      return;
    }

    // Files entering a tab group from outside are routed to the tab matching
    // their type. Explicit moves between two tabs of the same group are left
    // alone so the user can reorganise files by hand.
    const groupKeys = entry.group
      ? [...entry.group.tabEntries.keys()]
      : null;
    const hasOutsideFiles = Boolean(
      groupKeys &&
      moves.some((item) => !groupKeys.includes(item.sourceKey))
    );

    if (groupKeys && hasOutsideFiles) {
      const routed = moves.map((item) => {
        let destination = getGroupCategoryForFile(item.file);

        if (!groupKeys.includes(destination)) {
          destination = targetKey;
        }

        return { item, destination };
      });

      Promise.all(routed.map(({ item, destination }) => (
        api.moveCategoryFile(item.sourceKey, destination, item.file.path)
      ))).then((results) => {
        const failed = results.find((result) => !result || !result.ok);

        if (failed) {
          showCategoryToast(
            targetKey,
            failed.error ? failed.error : "无法移动文件"
          );
          return;
        }

        const records = routed
          .filter((_entry, index) => results[index] && results[index].ok)
          .filter(({ item }) => !groupKeys.includes(item.sourceKey))
          .map(({ item }) => ({
            path: item.file.path,
            name: item.file.name,
            kind: item.file.kind === "folder" ? "folder" : "file"
          }));

        if (records.length > 0 && typeof api.recordGroupFiles === "function") {
          api.recordGroupFiles(entry.group.key, records).catch(() => {});
        }

        const targets = [...new Set(routed.map(({ destination }) => destination))];
        const names = targets
          .map((key) => {
            const tabEntry = entry.group.tabEntries.get(key);
            return tabEntry && tabEntry.data ? tabEntry.data.label : key;
          })
          .filter(Boolean);

        showCategoryToast(
          targetKey,
          targets.length === 1
            ? `已按类型归入「${names[0]}」`
            : `已按类型归入 ${names.join("、")}`
        );
      }).catch(() => {
        showCategoryToast(targetKey, "无法移动文件");
      });

      return;
    }

    Promise.all(moves.map((item) => (
      api.moveCategoryFile(item.sourceKey, targetKey, item.file.path)
    )))
      .then((results) => {
        const failed = results.find((result) => !result || !result.ok);

        if (failed) {
          showCategoryToast(
            targetKey,
            failed.error ? failed.error : "无法移动文件"
          );
        } else if (moves.length > 1) {
          showCategoryToast(targetKey, `已移入 ${moves.length} 个文件`);
        } else if (moves[0].sourceKey === "desktop") {
          showCategoryToast(targetKey, "已移入分类");
        }
      })
      .catch(() => {
        showCategoryToast(targetKey, "无法移动文件");
      });
  }

  function getFileDragSourcePaths(excludePath = "", { includeExternal = false } = {}) {
    if (!fileDrag) return [];

    const items = Array.isArray(fileDrag.items) && fileDrag.items.length > 0
      ? fileDrag.items
      : [{
        sourceKey: fileDrag.sourceKey,
        file: fileDrag.file
      }];
    const paths = [];

    for (const item of items) {
      const source = item && item.file;
      if (!source || !source.path || source.isSystemIcon) continue;
      if (source.external && !includeExternal) continue;
      if (excludePath && source.path === excludePath) continue;
      paths.push(source.path);
    }

    return [...new Set(paths)];
  }

  function isRecycleBinTarget(file) {
    return Boolean(
      file &&
      file.isSystemIcon &&
      (file.systemTargetKey === "recycleBin" ||
        file.path === "system-icon:recycleBin")
    );
  }

  function isFolderDropTarget(file) {
    return Boolean(file && file.kind === "folder" && !file.isSystemIcon);
  }

  function moveDraggedFilesIntoFolder(folderFile) {
    const paths = getFileDragSourcePaths(
      folderFile.sourcePath || folderFile.path,
      { includeExternal: true }
    );
    finishFileDrag();

    if (paths.length === 0) {
      showLayerToast("没有可移动的文件", { error: true });
      return;
    }

    api.moveFilesIntoFolder(folderFile.sourcePath || folderFile.path, paths)
      .then((result) => {
        if (!result || (!result.ok && (!result.moved || result.moved.length === 0))) {
          showLayerToast(
            result && result.error
              ? result.error
              : result && result.errors && result.errors[0]
                ? result.errors[0].error
                : "无法将文件移动到文件夹",
            { error: true }
          );
          return;
        }

        const movedCount = Array.isArray(result.moved) ? result.moved.length : 0;
        const errorCount = Array.isArray(result.errors) ? result.errors.length : 0;
        showLayerToast(
          `已移入「${folderFile.name}」：${movedCount} 个文件${errorCount ? `，${errorCount} 个失败` : ""}`
        );
      })
      .catch(() => {
        showLayerToast("无法将文件移动到文件夹", { error: true });
      });
  }

  function trashDraggedFiles() {
    const paths = getFileDragSourcePaths("", { includeExternal: true });
    finishFileDrag();

    if (paths.length === 0) {
      showLayerToast("没有可删除的文件", { error: true });
      return;
    }

    trashFilesWithFeedback(paths);
  }

  function createFileCell(entry, file, index) {
    const cell = document.createElement("div");
    cell.className = "file-cell";
    cell.draggable = true;
    cell.tabIndex = 0;
    cell.dataset.fileKey = file.key;
    cell.dataset.filePath = file.path;
    cell.dataset.fileKind = file.kind || "file";
    cell.dataset.systemTarget = file.systemTargetKey || "";
    cell.classList.toggle("is-selected", selectedFilePaths.has(file.path));
    cell.classList.toggle("is-time-capsule", isTimeCapsuleCell(file));
    cell.setAttribute("role", "listitem");
    cell.setAttribute(
      "aria-label",
      `${file.name}，点击打开；拖到桌面移出分类；Ctrl 点击多选；Alt 拖拽到其他应用`
    );
    cell.setAttribute(
      "aria-selected",
      String(selectedFilePaths.has(file.path))
    );
    cell.title = file.isSystemIcon
      ? `${file.name}（系统图标）`
      : isTimeCapsuleCell(file)
        ? `${file.name}（超过 30 天未修改，双击打开并恢复彩色）`
        : `${file.name}（拖到桌面移出分类；Alt+拖拽到其他应用）`;

    fileMetaByPath.set(file.path, {
      sourceKey: entry.data.key,
      entry,
      file,
      index
    });

    const iconWrap = document.createElement("div");
    iconWrap.className = "file-icon";

    if (file.isSystemIcon) {
      cell.classList.add("is-system-icon");
      iconWrap.classList.add("is-system-icon");
      const glyph = document.createElement("span");
      glyph.className = "file-icon-emoji";
      glyph.setAttribute("aria-hidden", "true");
      glyph.textContent = file.icon || "▣";
      iconWrap.append(glyph);
    } else {
      applyTypeIcon(iconWrap, file.type);

      if (file.iconMode === "system") {
        iconWrap.classList.add("is-icon-loading");
        loadSystemIcon(entry, file, iconWrap);
      }
    }

    const name = document.createElement("span");
    name.className = "file-name";
    name.textContent = file.name;
    name.title = file.name;

    cell.append(iconWrap, name);

    if (file.colorTag) {
      cell.dataset.colorTag = file.colorTag;
      const tag = document.createElement("span");
      tag.className = "file-color-tag";
      tag.setAttribute("aria-hidden", "true");
      cell.append(tag);
    }

    cell.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      raise(entry.group || entry);
    });

    cell.addEventListener("click", (event) => {
      lastClickedFilePath = file.path;

      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        event.stopPropagation();
        toggleFileSelection(file.path);
        return;
      }

      if (fileDrag) return;

      if (isTimeCapsuleCell(file)) {
        event.preventDefault();
        event.stopPropagation();
        if (event.detail <= 1) {
          showLayerToast("时间胶囊：双击打开并恢复彩色");
        }
        return;
      }

      openFile(entry, file);
    });

    cell.addEventListener("dblclick", (event) => {
      if (!isTimeCapsuleCell(file)) return;
      event.preventDefault();
      event.stopPropagation();
      openFile(entry, file);
    });

    cell.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openFile(entry, file);
      }
    });

    cell.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openFileContextMenu({
        x: event.clientX,
        y: event.clientY,
        categoryKey: entry.data.key,
        file
      });
    });

    cell.addEventListener("dragstart", (event) => {
      // 系统图标允许在组件内部拖动排序，但永远不能拖到组件外：
      // 因此跳过 Alt 外部拖拽，并用自定义 MIME 代替 text/plain。
      if (!file.isSystemIcon && wantsExternalFileDrag(event)) {
        startExternalFileDrag(event, cell, file);
        return;
      }

      const items = buildDragItems({
        sourceKey: entry.data.key,
        entry,
        file,
        index
      });
      const primaryItem = items.find((item) => item.file.path === file.path) ||
        items[0];

      fileDrag = {
        items,
        files: items.map((item) => item.file),
        sourceKey: primaryItem.sourceKey,
        sourceEntry: primaryItem.sourceEntry,
        file: primaryItem.file,
        fromIndex: primaryItem.fromIndex,
        filesLength: entry.data.files.length,
        handled: false,
        canceled: false
      };
      holdInteraction("file-drag");
      document.body.classList.add("is-file-dragging");
      event.dataTransfer.effectAllowed = "move";

      if (file.isSystemIcon) {
        // 系统图标没有物理文件，不暴露 text/plain，避免被外部应用接收。
        event.dataTransfer.setData("application/x-within-system-icon", file.key);
      } else {
        event.dataTransfer.setData(
          "text/plain",
          items.map((item) => item.file.path).join("\n")
        );
      }

      for (const item of items) {
        const selectedCell = getFileElementByPath(item.file.path);
        if (selectedCell) selectedCell.classList.add("is-dragging");
        if (item.sourceEntry && item.sourceEntry.el) {
          item.sourceEntry.el.classList.add("is-file-drag-source");
        }
      }

      const ghost = cell.cloneNode(true);
      ghost.classList.add("drag-ghost");
      ghost.classList.remove("is-dragging", "is-selected");

      if (items.length > 1) {
        const count = document.createElement("span");
        count.className = "drag-count";
        count.textContent = String(items.length);
        ghost.append(count);
      }

      document.body.append(ghost);
      event.dataTransfer.setDragImage(ghost, 38, 42);
      requestAnimationFrame(() => ghost.remove());
    });

    cell.addEventListener("dragover", (event) => {
      if (!fileDrag) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      clearDropTargets();

      // 系统图标只能用于排序，不能作为被移入回收站/文件夹的拖拽源。
      const draggingSystemIcon = Boolean(
        fileDrag.file && fileDrag.file.isSystemIcon
      );

      if (!draggingSystemIcon && (isRecycleBinTarget(file) || isFolderDropTarget(file))) {
        cell.classList.add("is-special-drop-target");
        entry.el.classList.add("is-file-drop-target");
        if (entry.group) entry.group.el.classList.add("is-file-drop-target");
        entry.dropHint.hidden = false;
        entry.dropHint.textContent = isRecycleBinTarget(file)
          ? "松开移入回收站"
          : `松开移入「${file.name}」`;
        return;
      }

      const rect = cell.getBoundingClientRect();
      const side = event.clientX < rect.left + rect.width / 2
        ? "before"
        : "after";
      cell.classList.add(side === "before" ? "drop-before" : "drop-after");
      entry.el.classList.add("is-file-drop-target");
      if (entry.group) entry.group.el.classList.add("is-file-drop-target");
      entry.dropHint.hidden = false;
      entry.dropHint.textContent = "松开移入";
    });

    cell.addEventListener("dragleave", (event) => {
      if (!cell.contains(event.relatedTarget)) {
        cell.classList.remove("drop-before", "drop-after", "is-special-drop-target");
        if (entry.group) entry.group.el.classList.remove("is-file-drop-target");
        if (entry.dropHint) entry.dropHint.textContent = "松开移入";
      }
    });

    cell.addEventListener("drop", (event) => {
      if (!fileDrag) return;
      event.preventDefault();
      event.stopPropagation();

      const draggingSystemIcon = Boolean(
        fileDrag.file && fileDrag.file.isSystemIcon
      );

      if (!draggingSystemIcon && isRecycleBinTarget(file)) {
        trashDraggedFiles();
        return;
      }

      if (!draggingSystemIcon && isFolderDropTarget(file)) {
        moveDraggedFilesIntoFolder(file);
        return;
      }

      const rect = cell.getBoundingClientRect();
      const after = event.clientX >= rect.left + rect.width / 2;
      dropFileOnCategory(entry, event, index + (after ? 1 : 0));
    });

    cell.addEventListener("dragend", () => {
      cell.classList.remove("is-dragging");
      finishFileDrag();
    });

    prepareCellDragIcon(cell);
    return cell;
  }

  async function loadSystemIcon(entry, file, iconWrap, categoryKey) {
    if (iconCache.has(file.path)) {
      setIconImage(iconWrap, iconCache.get(file.path));
      return;
    }

    let result = null;
    const key = categoryKey || (entry && entry.data ? entry.data.key : "");

    try {
      result = await api.getSystemIcon(key, file.path);
    } catch (error) {
      result = null;
    }

    if (!iconWrap.isConnected) return;

    if (!result || !result.ok || !result.dataUrl) {
      iconWrap.classList.remove("is-icon-loading");
      return;
    }

    iconCache.set(file.path, result.dataUrl);
    setIconImage(iconWrap, result.dataUrl);
  }

  function setIconImage(iconWrap, dataUrl) {
    const image = new Image();
    image.alt = "";
    image.draggable = false;

    image.addEventListener("load", () => {
      if (!iconWrap.isConnected) return;
      iconWrap.replaceChildren(image);
      iconWrap.classList.remove("is-icon-loading");

      const cell = iconWrap.closest(".file-cell, .desktop-icon");
      if (cell) prepareCellDragIcon(cell);
    }, { once: true });

    image.addEventListener("error", () => {
      if (!iconWrap.isConnected) return;
      iconWrap.classList.remove("is-icon-loading");
    }, { once: true });

    image.src = dataUrl;
  }

  function finishFileDrag() {
    const wasDragging = Boolean(fileDrag);
    fileDrag = null;
    document.body.classList.remove("is-file-dragging", "is-drop-forbidden");
    for (const entry of categories.values()) {
      entry.el.classList.remove("is-file-drag-source");
    }
    for (const entry of tabEntries.values()) {
      entry.el.classList.remove("is-file-drag-source");
    }
    for (const entry of groups.values()) {
      entry.el.classList.remove("is-file-drag-source", "is-file-drop-target");
    }
    document.querySelectorAll(".file-cell.is-dragging, .desktop-icon.is-dragging")
      .forEach((node) => node.classList.remove("is-dragging"));
    clearDropTargets();
    clearAllFileDragVisuals();
    if (wasDragging) releaseInteraction("file-drag");
  }

  function isDesktopDropSurface(target) {
    return !(target && typeof target.closest === "function" &&
      target.closest(".desktop-widget"));
  }

  function dropDraggedFilesOnDesktop(event) {
    if (!fileDrag) return false;

    const drag = fileDrag;
    const items = Array.isArray(drag.items) && drag.items.length > 0
      ? drag.items
      : [{
        sourceKey: drag.sourceKey,
        sourceEntry: drag.sourceEntry,
        file: drag.file
      }];
    const unique = [];
    const seen = new Set();

    for (const item of items) {
      const filePath = item && item.file && item.file.path;
      const sourceKey = item && item.sourceKey;

      if (
        !filePath ||
        sourceKey === "desktop" ||
        sourceKey === "quick" ||
        item.file.isSystemIcon ||
        item.file.external ||
        seen.has(filePath)
      ) {
        continue;
      }

      seen.add(filePath);
      unique.push({ sourceKey, filePath, name: item.file.name });
    }

    finishFileDrag();

    if (unique.length === 0) return false;

    Promise.all(unique.map((item) => (
      api.moveCategoryFile(item.sourceKey, "desktop", item.filePath)
    ))).then((results) => {
      const succeeded = results.filter((result) => (
        result && result.ok && result.changed
      ));
      const failed = results.find((result) => !result || !result.ok);

      if (failed) {
        showLayerToast(
          failed.error || "无法将文件移出分类",
          { error: true }
        );
        return;
      }

      if (succeeded.length === 1) {
        showLayerToast(`「${unique[0].name}」已移出分类，文件仍在桌面`);
      } else if (succeeded.length > 1) {
        showLayerToast(`已将 ${succeeded.length} 个文件移出分类`);
      }
    }).catch(() => {
      showLayerToast("无法将文件移出分类", { error: true });
    });

    return true;
  }

  function refreshSelectionClasses() {
    document.querySelectorAll("[data-file-path]").forEach((element) => {
      const filePath = element.dataset.filePath;

      element.classList.toggle(
        "is-selected",
        Boolean(filePath && selectedFilePaths.has(filePath))
      );
    });
  }

  function setFileSelection(paths, { additive = false } = {}) {
    if (!additive) selectedFilePaths.clear();

    for (const filePath of paths) {
      if (filePath) selectedFilePaths.add(filePath);
    }

    refreshSelectionClasses();
  }

  function toggleFileSelection(filePath) {
    if (!filePath) return;

    if (selectedFilePaths.has(filePath)) {
      selectedFilePaths.delete(filePath);
    } else {
      selectedFilePaths.add(filePath);
    }

    refreshSelectionClasses();
  }

  function clearFileSelection() {
    if (selectedFilePaths.size === 0) return;
    selectedFilePaths.clear();
    refreshSelectionClasses();
  }

  function getContextPaths(file) {
    if (file && selectedFilePaths.has(file.path)) {
      return [...selectedFilePaths];
    }

    return file && file.path ? [file.path] : [];
  }

  function getCategoryKeyAtPoint(point) {
    if (!point || !point.valid) return "desktop";

    const elements = document.elementsFromPoint(point.x, point.y);

    for (const element of elements) {
      if (!element || !element.closest) continue;

      const tabPanel = element.closest(".tab-panel[data-category-key]");
      if (tabPanel) return tabPanel.dataset.categoryKey;

      const group = element.closest(".tab-group-widget[data-group-key]");
      if (group) {
        const entry = groups.get(group.dataset.groupKey);
        return entry && entry.activeKey ? entry.activeKey : "desktop";
      }

      const category = element.closest(".category-widget[data-category-key]");
      if (category) return category.dataset.categoryKey;
    }

    return "desktop";
  }

  function startMarqueeSelection(event) {
    const startX = event.clientX;
    const startY = event.clientY;
    const additive = event.ctrlKey || event.metaKey;
    const baseSelection = additive
      ? new Set(selectedFilePaths)
      : new Set();
    const pointerId = event.pointerId;
    const marquee = document.createElement("div");
    let moved = false;

    marquee.className = "selection-marquee";
    marquee.hidden = true;
    stage.append(marquee);
    document.body.classList.add("is-marquee-selecting");

    const onMove = (moveEvent) => {
      if (pointerId !== undefined && moveEvent.pointerId !== pointerId) return;

      const distance = Math.hypot(
        moveEvent.clientX - startX,
        moveEvent.clientY - startY
      );

      if (!moved && distance < 4) return;

      moved = true;
      marquee.hidden = false;
      moveEvent.preventDefault();

      const left = Math.min(startX, moveEvent.clientX);
      const top = Math.min(startY, moveEvent.clientY);
      const width = Math.abs(moveEvent.clientX - startX);
      const height = Math.abs(moveEvent.clientY - startY);
      const right = left + width;
      const bottom = top + height;

      marquee.style.left = `${left}px`;
      marquee.style.top = `${top}px`;
      marquee.style.width = `${width}px`;
      marquee.style.height = `${height}px`;

      const selected = new Set(baseSelection);

      document.querySelectorAll("[data-file-path]").forEach((element) => {
        const rect = element.getBoundingClientRect();

        if (
          rect.width <= 0 ||
          rect.height <= 0 ||
          rect.left >= right ||
          rect.right <= left ||
          rect.top >= bottom ||
          rect.bottom <= top
        ) {
          return;
        }

        selected.add(element.dataset.filePath);
      });

      selectedFilePaths.clear();
      selected.forEach((filePath) => selectedFilePaths.add(filePath));
      refreshSelectionClasses();
    };

    const finish = () => {
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", finish, true);
      window.removeEventListener("pointercancel", finish, true);
      marquee.remove();
      document.body.classList.remove("is-marquee-selecting");
      marqueeState = null;
    };

    marqueeState = { finish };
    window.addEventListener("pointermove", onMove, true);
    window.addEventListener("pointerup", finish, true);
    window.addEventListener("pointercancel", finish, true);
  }

  async function trashFilesWithFeedback(paths) {
    if (!paths || paths.length === 0) return;

    const result = await api.trashFiles(paths);

    if (!result || !result.ok) {
      showLayerToast(
        result && result.error ? result.error : "无法删除文件",
        { error: true }
      );
      return;
    }

    clearFileSelection();

    const removedCount = Array.isArray(result.removed) ? result.removed.length : 0;
    const errorCount = Array.isArray(result.errors) ? result.errors.length : 0;

    if (removedCount > 0) {
      showLayerToast(
        `已移入回收站：${removedCount} 个文件${errorCount ? `，${errorCount} 个失败` : ""}`
      );
    } else if (errorCount > 0) {
      const firstError = result.errors[0];
      showLayerToast(
        firstError && firstError.error ? firstError.error : "无法删除文件",
        { error: true }
      );
    } else {
      showLayerToast("没有可删除的文件", { error: true });
    }
  }

  function beginInlineFileRename(categoryKey, file, cell) {
    if (!cell || !file || file.isSystemIcon || cell.querySelector(".file-rename-input")) {
      return;
    }

    const nameNode = cell.querySelector(".file-name");
    if (!nameNode) return;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "file-rename-input";
    input.value = file.name;
    input.maxLength = 240;
    input.setAttribute("aria-label", "重命名文件");
    const wasDraggable = cell.draggable;
    cell.draggable = false;
    nameNode.hidden = true;
    cell.append(input);
    input.focus();
    input.select();

    let finished = false;

    const finish = async (save) => {
      if (finished) return;
      finished = true;

      const value = input.value.trim();
      input.remove();
      nameNode.hidden = false;
      cell.draggable = wasDraggable;

      if (!save || !value || value === file.name) {
        return;
      }

      try {
        const result = await api.renameFile(categoryKey, file.path, value);

        if (!result || !result.ok) {
          showLayerToast(
            result && result.error ? result.error : "无法重命名文件",
            { error: true }
          );
        } else {
          showLayerToast("已重命名");
        }
      } catch (error) {
        showLayerToast("无法重命名文件", { error: true });
      }
    };

    input.addEventListener("keydown", (event) => {
      if (event.isComposing) return;

      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        finish(true);
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        finish(false);
      }
    });
    input.addEventListener("blur", () => finish(true));
  }

  function getDragIconDataUrl(cell) {
    if (!cell) return null;
    if (cell.dataset.dragIcon) return cell.dataset.dragIcon;

    const image = cell.querySelector(".file-icon img");
    if (image && image.src.startsWith("data:")) return image.src;

    const canvas = cell.querySelector("canvas");
    if (canvas) return canvas.toDataURL("image/png");

    return null;
  }

  function prepareCellDragIcon(cell) {
    if (!cell) return;

    const image = cell.querySelector(".file-icon img");
    const svg = cell.querySelector(".file-icon svg");
    let source = null;

    if (image && image.src.startsWith("data:")) {
      source = image.src;
    } else if (svg) {
      const serialized = new XMLSerializer().serializeToString(svg);
      source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
    }

    if (!source) return;

    const imageNode = new Image();

    imageNode.addEventListener("load", () => {
      if (!cell.isConnected) return;

      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const context = canvas.getContext("2d");
      if (!context) return;

      // A slightly translucent thumbnail reads as a native drag preview.
      context.globalAlpha = 0.82;
      context.drawImage(imageNode, 0, 0, 64, 64);
      cell.dataset.dragIcon = canvas.toDataURL("image/png");
    }, { once: true });

    imageNode.addEventListener("error", () => {
      cell.dataset.dragIcon = "";
    }, { once: true });

    imageNode.src = source;
  }

  function buildDragItems(primaryMeta) {
    const selectedItems = selectedFilePaths.has(primaryMeta.file.path) &&
      selectedFilePaths.size > 1
      ? [...selectedFilePaths]
        .map((filePath) => fileMetaByPath.get(filePath))
        .filter(Boolean)
      : [];

    const items = selectedItems.length > 0 ? selectedItems : [primaryMeta];

    return items.map((meta) => ({
      sourceKey: meta.sourceKey,
      sourceEntry: meta.entry || null,
      file: meta.file,
      fromIndex: meta.index
    }));
  }

  function getExternalDragPaths(file) {
    return selectedFilePaths.has(file.path)
      ? [...selectedFilePaths]
      : [file.path];
  }

  function wantsExternalFileDrag(event) {
    if (!event) return false;
    if (event.altKey) return true;
    return typeof event.getModifierState === "function" &&
      event.getModifierState("Alt");
  }

  function startExternalFileDrag(event, cell, file, paths = null) {
    const iconDataUrl = getDragIconDataUrl(cell);
    const dragPaths = Array.isArray(paths) && paths.length > 0
      ? paths
      : getExternalDragPaths(file);
    event.preventDefault();
    event.stopPropagation();
    api.startFileDrag(dragPaths, iconDataUrl);
    api.recordAchievementEvent("external-drag", {
      count: 1
    }).catch(() => {});
  }

  async function openFile(entry, file) {
    const wasTimeCapsule = isTimeCapsuleCell(file);
    restoreTimeCapsulePath(file.path);
    if (wasTimeCapsule) {
      api.recordAchievementEvent("time-capsule-restore").catch(() => {});
    }

    try {
      const result = await api.openFile(entry.data.key, file.path);
      if (!result || !result.ok) {
        showCategoryToast(
          entry.data.key,
          result && result.error ? result.error : "无法打开文件"
        );
      }
    } catch (error) {
      showCategoryToast(entry.data.key, "无法打开文件");
    }
  }

  function beginRename(entry) {
    if (entry.renaming || !entry.data) return;

    entry.renaming = true;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "drag-label-input";
    input.value = entry.data.label;
    input.maxLength = 40;
    input.setAttribute("aria-label", "小组件名称");
    input.title = "回车确认，Esc 取消";

    entry.label.hidden = true;
    entry.label.after(input);

    let settled = false;

    const finish = (commit) => {
      if (settled) return;
      settled = true;
      entry.renaming = false;
      const value = input.value;
      input.remove();
      entry.label.hidden = false;

      if (commit && value.trim() && value.trim() !== entry.data.label) {
        api.renameCategory(entry.data.key, value).catch(() => {
          showCategoryToast(entry.data.key, "重命名失败");
        });
      }
    };

    input.addEventListener("keydown", (event) => {
      event.stopPropagation();
      if (event.isComposing) return;

      if (event.key === "Enter") {
        event.preventDefault();
        finish(true);
      } else if (event.key === "Escape") {
        event.preventDefault();
        finish(false);
      }
    });
    input.addEventListener("blur", () => finish(true));
    input.addEventListener("pointerdown", (event) => event.stopPropagation());
    input.addEventListener("dblclick", (event) => event.stopPropagation());

    input.focus();
    input.select();
  }

  function syncCategories(nextCategories) {
    const incoming = new Map(
      (Array.isArray(nextCategories) ? nextCategories : [])
        .map((item) => [item.key, item])
    );

    for (const [key, item] of incoming) {
      let entry = categories.get(key);

      if (!entry) {
        entry = createCategory(item);
        categories.set(key, entry);
        widgetLayer.append(entry.el);
      }

      applyCategoryState(entry, item);
    }

    for (const [key, entry] of [...categories]) {
      if (incoming.has(key)) continue;

      for (const [filePath, meta] of [...fileMetaByPath]) {
        if (meta.entry === entry) fileMetaByPath.delete(filePath);
      }

      entry.el.remove();
      clearTimeout(entry.collapseTimer);
      clearTimeout(entry.toastTimer);
      categories.delete(key);
    }

    collapsedCategoryKeys = new Set(
      [...incoming.values()]
        .filter((item) => item.collapsed)
        .map((item) => item.key)
    );
  }

  function getGroupCategoryForFile(file) {
    if (!file) return "";
    if (file.kind === "folder" || file.type === "folder") return "folders";

    switch (file.type) {
      case "shortcut":
      case "installer":
        return "apps";
      case "image":
      case "audio":
      case "video":
        return "media";
      case "archive":
        return "archives";
      case "document":
      case "code":
      default:
        return "documents";
    }
  }

  function teardownTabEntry(tabEntry) {
    if (!tabEntry) return;

    if (tabEntry.data && tabEntry.data.key) {
      for (const [filePath, meta] of [...fileMetaByPath]) {
        if (meta.sourceKey === tabEntry.data.key && meta.entry === tabEntry) {
          fileMetaByPath.delete(filePath);
        }
      }

      if (tabEntries.get(tabEntry.data.key) === tabEntry) {
        tabEntries.delete(tabEntry.data.key);
      }
    }

    tabEntry.el.remove();
  }

  function setupTabPanelDropTarget(tabEntry) {
    const groupEntry = tabEntry.group;

    const showHover = () => {
      if (!groupEntry) return;
      raise(groupEntry);
      clearCategoryDragHover();
      groupEntry.el.classList.add("is-file-drop-target");
      tabEntry.el.classList.add("is-file-drop-target");
      tabEntry.dropHint.hidden = false;
    };

    tabEntry.el.addEventListener("dragenter", (event) => {
      if (!isFileDragEvent(event)) return;
      showHover();
    });

    tabEntry.el.addEventListener("dragover", (event) => {
      if (!isFileDragEvent(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      showHover();
    });

    tabEntry.el.addEventListener("dragleave", (event) => {
      if (tabEntry.el.contains(event.relatedTarget)) return;
      tabEntry.el.classList.remove("is-file-drop-target");
      tabEntry.dropHint.hidden = true;

      if (groupEntry) {
        groupEntry.el.classList.remove("is-file-drop-target");
      }
    });

    tabEntry.el.addEventListener("drop", (event) => {
      if (!fileDrag) return;
      event.preventDefault();
      event.stopPropagation();
      dropFileOnCategory(tabEntry, event, tabEntry.data.files.length);
    });
  }

  function rebuildGroupTabs(entry, tabs) {
    for (const tabEntry of entry.tabEntries.values()) {
      teardownTabEntry(tabEntry);
    }

    entry.tabEntries.clear();
    entry.tabsEl.replaceChildren();
    entry.panelsEl.replaceChildren();

    for (const tab of tabs) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "group-tab";
      button.dataset.categoryKey = tab.key;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", "false");
      button.title = tab.label;

      const label = document.createElement("span");
      label.className = "group-tab-label";
      label.textContent = tab.label;

      const count = document.createElement("span");
      count.className = "group-tab-count";
      count.textContent = String(Array.isArray(tab.files) ? tab.files.length : 0);

      button.append(label, count);
      button.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
      });
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        activateGroupTab(entry, tab.key, { persist: true });
      });
      entry.tabsEl.append(button);

      const panel = document.createElement("div");
      panel.className = "tab-panel";
      panel.dataset.categoryKey = tab.key;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-label", tab.label);
      panel.hidden = true;

      const scroll = document.createElement("div");
      scroll.className = "floating-scroll";
      scroll.dataset.scroll = "";

      const grid = document.createElement("div");
      grid.className = "floating-grid";
      grid.dataset.grid = "";
      grid.setAttribute("role", "list");
      scroll.append(grid);

      const empty = document.createElement("div");
      empty.className = "floating-empty";
      empty.dataset.empty = "";
      empty.textContent = "暂无文件";
      empty.hidden = true;

      const dropHint = document.createElement("div");
      dropHint.className = "category-drop-hint";
      dropHint.dataset.dropHint = "";
      dropHint.textContent = "松开移入";
      dropHint.hidden = true;

      panel.append(scroll, empty, dropHint);
      entry.panelsEl.append(panel);

      const tabEntry = {
        el: panel,
        app: entry.app,
        group: entry,
        button,
        data: {
          ...tab,
          locked: false,
          collapsed: false
        },
        scroll,
        grid,
        empty,
        dropHint,
        toast: entry.toast,
        toastTimer: null,
        filesSignature: null,
        moving: false,
        resizing: false,
        renaming: false,
        hovering: false
      };

      tabEntries.set(tab.key, tabEntry);
      entry.tabEntries.set(tab.key, tabEntry);
      setupTabPanelDropTarget(tabEntry);

      panel.addEventListener("pointerdown", () => raise(entry), true);
    }
  }

  function activateGroupTab(entry, categoryKey, { persist = false } = {}) {
    if (!entry || !entry.tabEntries.has(categoryKey)) return;

    entry.activeKey = categoryKey;
    entry.data.activeKey = categoryKey;

    for (const [key, tabEntry] of entry.tabEntries) {
      const active = key === categoryKey;
      tabEntry.el.hidden = !active;
      tabEntry.button.classList.toggle("is-active", active);
      tabEntry.button.setAttribute("aria-selected", String(active));
      tabEntry.el.setAttribute("aria-hidden", String(!active));
    }

    requestAnimationFrame(updateScrollable);

    if (persist) {
      api.setGroupActive(entry.key, categoryKey).catch(() => {});
    }
  }

  function applyTabGroupState(entry, item) {
    entry.data = item;
    entry.el.dataset.groupKey = item.key;
    entry.el.classList.toggle("is-locked", Boolean(item.locked));
    entry.label.textContent = item.label || "标签组";

    const tabs = Array.isArray(item.tabs) ? item.tabs : [];
    entry.countEl.textContent = `${tabs.length} 个标签`;
    applyAppearance(entry.app);
    applyAccent(entry.app, item.accentColor);
    positionWidget(entry);
    syncComponentActions(entry);

    const signature = tabs
      .map((tab) => `${tab.key}\u0000${tab.label}\u0000${tab.mappedFolder || ""}`)
      .join("\u0001");

    if (signature !== entry.tabsSignature) {
      entry.tabsSignature = signature;
      rebuildGroupTabs(entry, tabs);
    }

    for (const tab of tabs) {
      const tabEntry = entry.tabEntries.get(tab.key);
      if (!tabEntry) continue;

      tabEntry.data = {
        ...tab,
        locked: false,
        collapsed: false
      };

      const files = Array.isArray(tab.files) ? tab.files : [];
      const nextSignature = files
        .map((file) => `${file.key}:${file.type}:${file.iconMode}:${file.colorTag || ""}:${file.timeCapsule ? 1 : 0}`)
        .join("\u0001");

      tabEntry.empty.hidden = files.length !== 0;
      tabEntry.scroll.hidden = files.length === 0;

      if (tabEntry.filesSignature !== nextSignature) {
        tabEntry.filesSignature = nextSignature;
        renderCategoryGrid(tabEntry, files);
      }

      const count = tabEntry.button.querySelector(".group-tab-count");
      if (count) count.textContent = String(files.length);
      tabEntry.button.title = `${tab.label} · ${files.length} 个文件`;
    }

    const desiredKey = tabs.some((tab) => tab.key === item.activeKey)
      ? item.activeKey
      : tabs[0] && tabs[0].key;

    if (desiredKey) {
      activateGroupTab(entry, desiredKey);
    }
  }

  function createTabGroupEntry(item) {
    const fragment = tabGroupTemplate.content.cloneNode(true);
    const el = fragment.querySelector(".tab-group-widget");
    const entry = {
      el,
      key: item.key,
      data: item,
      app: fragment.querySelector(".floating-app"),
      dragbar: fragment.querySelector("[data-group-dragbar]"),
      label: fragment.querySelector("[data-group-label]"),
      countEl: fragment.querySelector("[data-group-count]"),
      splitButton: fragment.querySelector("[data-group-split]"),
      tabsEl: fragment.querySelector("[data-group-tabs]"),
      panelsEl: fragment.querySelector("[data-group-panels]"),
      toast: fragment.querySelector("[data-group-toast]"),
      resizeHandle: fragment.querySelector("[data-resize-handle]"),
      tabEntries: new Map(),
      tabsSignature: "",
      activeKey: "",
      toastTimer: null,
      moving: false,
      resizing: false
    };

    el.dataset.groupKey = item.key;
    el.dataset.widgetKind = "group";
    attachResizeHandle(entry, "group", item.key);
    attachComponentActions(entry, "group", item.key);

    el.addEventListener("pointerdown", () => raise(entry), true);

    entry.dragbar.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      if (event.target.closest("button, input")) return;
      if (entry.data.locked) return;
      startMove(entry, "group", entry.key, event);
    });

    entry.splitButton.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
    entry.splitButton.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const result = await api.splitGroup(entry.key).catch(() => null);

      if (!result || !result.ok) {
        showLayerToast(
          result && result.error ? result.error : "无法拆分标签组",
          { error: true }
        );
        return;
      }

      showLayerToast(
        result.reassigned > 0
          ? `标签组已拆分，${result.reassigned} 个文件已按类型回到匹配分类`
          : "标签组已拆分，各分类已恢复为独立组件"
      );
    });

    entry.el.addEventListener("contextmenu", (event) => {
      if (event.target.closest(".file-cell")) return;
      event.preventDefault();
      event.stopPropagation();
      openGroupContextMenu(entry, event.clientX, event.clientY);
    });

    applyTabGroupState(entry, item);
    return entry;
  }

  function destroyTabGroupEntry(entry) {
    for (const tabEntry of entry.tabEntries.values()) {
      teardownTabEntry(tabEntry);
    }

    entry.tabEntries.clear();
    clearTimeout(entry.toastTimer);
    entry.el.remove();
  }

  function syncGroups(nextGroups) {
    const incoming = new Map(
      (Array.isArray(nextGroups) ? nextGroups : [])
        .map((item) => [item.key, item])
    );

    for (const [key, item] of incoming) {
      let entry = groups.get(key);

      if (!entry) {
        entry = createTabGroupEntry(item);
        groups.set(key, entry);
        widgetLayer.append(entry.el);
      }

      applyTabGroupState(entry, item);
    }

    for (const [key, entry] of [...groups]) {
      if (incoming.has(key)) continue;
      destroyTabGroupEntry(entry);
      groups.delete(key);
    }
  }

  function createWidgetEntry(item) {
    const template = componentTemplates[item.key];
    if (!template) return null;

    const fragment = template.content.cloneNode(true);
    const el = fragment.querySelector(".desktop-widget");
    const entry = {
      el,
      key: item.key,
      data: item,
      app: fragment.querySelector(".floating-app"),
      widgetBg: fragment.querySelector("[data-widget-bg]"),
      widgetBgImage: fragment.querySelector("[data-widget-bg-image]"),
      resizeHandle: fragment.querySelector("[data-resize-handle]"),
      backgroundUrl: "",
      failedBackgroundUrl: "",
      transferDropHint: fragment.querySelector("[data-transfer-drop-hint]"),
      moving: false,
      resizing: false,
      clockEls: item.key === "clock" ? {
        time: fragment.querySelector("[data-clock-time]"),
        date: fragment.querySelector("[data-clock-date]"),
        weekday: fragment.querySelector("[data-clock-weekday]"),
        text: fragment.querySelector("[data-clock-text]"),
        content: fragment.querySelector("[data-clock-content]")
      } : null,
      musicEls: item.key === "music" ? {
        disc: fragment.querySelector("[data-music-disc]"),
        title: fragment.querySelector("[data-music-title]"),
        artist: fragment.querySelector("[data-music-artist]"),
        seek: fragment.querySelector("[data-music-seek]"),
        fill: fragment.querySelector("[data-music-seek-fill]"),
        current: fragment.querySelector("[data-music-current]"),
        duration: fragment.querySelector("[data-music-duration]"),
        prev: fragment.querySelector("[data-music-prev]"),
        play: fragment.querySelector("[data-music-play]"),
        next: fragment.querySelector("[data-music-next]"),
        cover: fragment.querySelector("[data-music-card-cover]")
      } : null,
      notes: item.key === "notes" ? {
        input: fragment.querySelector("[data-notes-input]"),
        status: fragment.querySelector("[data-notes-status]"),
        meta: fragment.querySelector("[data-notes-meta]"),
        pageCaption: fragment.querySelector("[data-notes-page-caption]"),
        pageLabel: fragment.querySelector("[data-notes-page-label]"),
        prev: fragment.querySelector("[data-notes-prev]"),
        next: fragment.querySelector("[data-notes-next]"),
        editorPage: fragment.querySelector("[data-notes-editor-page]"),
        historyPage: fragment.querySelector("[data-notes-history-page]"),
        historyList: fragment.querySelector("[data-notes-history]"),
        historyEmpty: fragment.querySelector("[data-notes-history-empty]"),
        historyCount: fragment.querySelector("[data-notes-history-count]"),
        saveButton: fragment.querySelector("[data-notes-save]"),
        moreButton: fragment.querySelector("[data-notes-more]"),
        timer: null,
        dirty: false,
        saving: false,
        queued: false,
        savingEntry: false,
        page: 1,
        entries: [],
        loadingHistory: false,
        lastSavedAt: null
      } : null,
      quickEls: item.key === "quick" ? {
        scroll: fragment.querySelector("[data-quick-scroll]"),
        grid: fragment.querySelector("[data-quick-grid]"),
        empty: fragment.querySelector("[data-quick-empty]"),
        dropHint: fragment.querySelector("[data-quick-drop-hint]"),
        count: fragment.querySelector("[data-quick-count]")
      } : null,
      clipboard: item.key === "clipboard" ? {
        list: fragment.querySelector("[data-clipboard-list]"),
        empty: fragment.querySelector("[data-clipboard-empty]"),
        count: fragment.querySelector("[data-clipboard-count]"),
        signature: "",
        marqueeFrame: 0,
        marqueeObserver: null
      } : null,
      todo: item.key === "todo" ? {
        form: fragment.querySelector("[data-todo-form]"),
        input: fragment.querySelector("[data-todo-input]"),
        dateInput: fragment.querySelector("[data-todo-date]"),
        timeInput: fragment.querySelector("[data-todo-time]"),
        addButton: fragment.querySelector(".todo-add"),
        list: fragment.querySelector("[data-todo-list]"),
        empty: fragment.querySelector("[data-todo-empty]"),
        count: fragment.querySelector("[data-todo-count]"),
        progress: fragment.querySelector("[data-todo-progress]"),
        openManagerButton: fragment.querySelector("[data-todo-open-manager]"),
        addPage: fragment.querySelector("[data-todo-add-page]"),
        listPage: fragment.querySelector("[data-todo-list-page]"),
        prevButton: fragment.querySelector("[data-todo-prev]"),
        nextButton: fragment.querySelector("[data-todo-next]"),
        pageLabel: fragment.querySelector("[data-todo-page-label]"),
        page: 1,
        busy: false
      } : null,
      search: item.key === "search" ? {
        form: fragment.querySelector("[data-search-form]"),
        input: fragment.querySelector("[data-search-input]"),
        results: fragment.querySelector("[data-search-results]"),
        empty: fragment.querySelector("[data-search-empty]"),
        count: fragment.querySelector("[data-search-count]"),
        status: fragment.querySelector("[data-search-status]"),
        timer: null,
        requestToken: 0,
        lastResults: []
      } : null,
      calendarEls: item.key === "calendar" ? {
        panel: fragment.querySelector("[data-calendar-panel]"),
        flipper: fragment.querySelector("[data-calendar-flipper]"),
        front: fragment.querySelector("[data-calendar-front]"),
        back: fragment.querySelector("[data-calendar-back]"),
        month: fragment.querySelector("[data-calendar-month]"),
        today: fragment.querySelector("[data-calendar-today]"),
        grid: fragment.querySelector("[data-calendar-grid]"),
        backButton: fragment.querySelector("[data-calendar-return]"),
        selectedDate: fragment.querySelector("[data-calendar-selected-date]"),
        backTodos: fragment.querySelector("[data-calendar-back-todos]"),
        backCount: fragment.querySelector("[data-calendar-back-count]"),
        backEmpty: fragment.querySelector("[data-calendar-back-empty]"),
        selectedKey: "",
        flipped: false
      } : null,
      pomodoro: item.key === "pomodoro" ? {
        panel: fragment.querySelector(".pomodoro-panel"),
        dial: fragment.querySelector(".pomodoro-dial"),
        phaseEl: fragment.querySelector("[data-pomodoro-phase]"),
        status: fragment.querySelector("[data-pomodoro-status]"),
        time: fragment.querySelector("[data-pomodoro-time]"),
        progress: fragment.querySelector("[data-pomodoro-progress]"),
        toggle: fragment.querySelector("[data-pomodoro-toggle]"),
        reset: fragment.querySelector("[data-pomodoro-reset]"),
        hint: fragment.querySelector("[data-pomodoro-hint]"),
        targetRow: fragment.querySelector("[data-pomodoro-target]"),
        targetName: fragment.querySelector("[data-pomodoro-target-name]"),
        targetMeta: fragment.querySelector("[data-pomodoro-target-meta]"),
        clearTarget: fragment.querySelector("[data-pomodoro-clear-target]"),
        dropHint: fragment.querySelector("[data-pomodoro-drop-hint]"),
        phase: "focus",
        remaining: POMODORO_PHASES.focus.seconds,
        customSeconds: 0,
        target: null,
        running: false,
        timer: null,
        flashTimer: null,
        rejectionTimer: null,
        sessionStartedAt: null,
        adjusting: false
      } : null,
      musicStarted: false
    };

    // Every component except the clock can collapse into a single summary line.
    if (item.key !== "clock") {
      const summary = document.createElement("div");
      summary.className = "widget-collapsed-summary";
      // The summary is the standing title bar of a folded card, so it has to
      // accept the same double-click (and keyboard) activation as the card.
      summary.setAttribute("role", "button");
      // Only the folded title bar is focusable; the expanded card is reached by
      // its own controls, so an invisible focus stop would only be confusing.
      summary.setAttribute("tabindex", "-1");
      summary.setAttribute("aria-expanded", "true");
      const summaryLabel = document.createElement("span");
      summaryLabel.className = "widget-summary-label";
      const summaryValue = document.createElement("span");
      summaryValue.className = "widget-summary-value";
      summary.append(summaryLabel, summaryValue);
      el.append(summary);

      summary.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        toggleWidgetCollapsed(entry);
      });

      entry.summaryEls = {
        root: summary,
        label: summaryLabel,
        value: summaryValue,
        name: item.name || item.label || "组件"
      };
      entry.collapsed = false;
      entry.collapsedTimer = null;
      entry.collapseAnimTimer = null;
      entry.hoverCollapseTimer = null;
      entry.lastCollapseToggleAt = 0;
    }

    el.dataset.widgetKey = item.key;
    el.addEventListener("pointerdown", (event) => {
      raise(entry);

      // A press that lands on any interactive / scrollable area belongs to that
      // area. Stop it here so it never reaches the desktop layer's marquee
      // selection or starts a drag from an input.
      if (isWidgetInteractiveTarget(event.target)) {
        event.stopPropagation();
        return;
      }

      if (event.button !== 0) return;
      if (entry.data.locked) return;

      startMove(entry, "widget", entry.key, event);
    });

    entry.widgetBgImage.addEventListener("error", () => {
      entry.failedBackgroundUrl = entry.backgroundUrl;
      entry.widgetBg.hidden = true;
      entry.app.classList.remove("has-bg");
    });

    attachResizeHandle(entry, "widget", item.key);
    attachComponentActions(entry, "widget", item.key);
    attachWidgetCollapse(entry);

    entry.el.addEventListener("contextmenu", (event) => {
      if (event.target.closest("input, textarea")) return;
      if (event.target.closest(".quick-cell")) return;

      event.preventDefault();
      event.stopPropagation();
      openComponentContextMenu(entry, "widget", event.clientX, event.clientY);
    });

    if (entry.musicEls) {
      entry.musicEls.prev.addEventListener("click", () => sendMusicCommand("previous"));
      entry.musicEls.next.addEventListener("click", () => sendMusicCommand("next"));
      entry.musicEls.play.addEventListener("click", () => sendMusicCommand("playPause"));
    }

    if (entry.notes) {
      setupNotesEntry(entry);
      setupTransferDropTarget(entry, "notes");
    }

    if (entry.todo) {
      entry.todo.form.addEventListener("submit", (event) => {
        event.preventDefault();
        addTodoItem(entry);
      });
      // 大输入框是 textarea：Enter 直接提交，Shift+Enter 也提交（待办保持单行）。
      entry.todo.input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" || event.isComposing) return;
        event.preventDefault();
        addTodoItem(entry);
      });
      // 日期框默认今天，用户不改就是「今天做」。
      entry.todo.dateInput.value = calendarDateKey(new Date());
      entry.todo.prevButton.addEventListener("click", () => {
        setTodoPage(entry, entry.todo.page - 1);
      });
      entry.todo.nextButton.addEventListener("click", () => {
        setTodoPage(entry, entry.todo.page + 1);
      });
      entry.todo.openManagerButton.addEventListener("click", () => {
        openTodoManager();
      });
      setTodoPage(entry, 1);
      setupTransferDropTarget(entry, "todo");
    }

    if (entry.calendarEls) {
      entry.calendarEls.backButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setCalendarFlipped(entry, false);
      });
      attachCalendarDropTarget(
        entry,
        entry.calendarEls.back,
        () => entry.calendarEls.selectedKey
      );
    }

    if (entry.search) {
      setupSearchEntry(entry);
      setupTransferDropTarget(entry, "search");
    }

    if (entry.quickEls) {
      setupQuickDropTarget(entry);
    }

    if (entry.pomodoro) {
      entry.pomodoro.toggle.addEventListener("click", () => {
        togglePomodoro(entry);
      });
      entry.pomodoro.reset.addEventListener("click", () => {
        resetPomodoro(entry);
      });
      entry.pomodoro.clearTarget.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        clearPomodoroTarget(entry);
      });
      setupPomodoroDropTarget(entry);
      setupPomodoroRingDrag(entry);
      renderPomodoro(entry);
    }

    return entry;
  }

  function applyWidgetBackground(entry, url) {
    const next = typeof url === "string" ? url : "";
    const changed = next !== entry.backgroundUrl;
    entry.backgroundUrl = next;

    if (!next) {
      entry.failedBackgroundUrl = "";
      entry.widgetBg.hidden = true;
      entry.widgetBgImage.removeAttribute("src");
      entry.app.classList.remove("has-bg");
      entry.el.style.removeProperty("--parallax-x");
      entry.el.style.removeProperty("--parallax-y");
      return;
    }

    if (changed || entry.failedBackgroundUrl === next) {
      entry.failedBackgroundUrl = "";
      entry.widgetBgImage.src = next;
    }

    entry.widgetBg.hidden = false;
    entry.app.classList.add("has-bg");
  }

  // Collapsing hides the component body and leaves one line of live context, so
  // a folded widget still answers "what is going on right now?".
  function describeWidgetCollapsed(entry) {
    const readText = (node) => (node && typeof node.textContent === "string"
      ? node.textContent.trim()
      : "");

    switch (entry.key) {
      case "music": {
        const title = readText(entry.musicEls && entry.musicEls.title);
        const artist = readText(entry.musicEls && entry.musicEls.artist);
        const hasTrack = title && title !== "—";
        const hasArtist = artist && artist !== "—";
        return {
          label: "正在播放",
          value: hasTrack
            ? (hasArtist ? `${title} · ${artist}` : title)
            : "未在播放"
        };
      }
      case "calendar": {
        const now = new Date();
        return { label: "今天", value: `${now.getMonth() + 1}月${now.getDate()}日` };
      }
      case "todo": {
        const list = entry.el.querySelector("[data-todo-list]");
        const items = list ? Array.from(list.children) : [];
        const open = items.find((node) => (
          !node.classList.contains("is-done") &&
          !node.classList.contains("is-completed") &&
          node.getAttribute("data-done") !== "true"
        ));
        return {
          label: "待办",
          value: open ? (readText(open) || "未命名待办") : "暂无未完成"
        };
      }
      case "pomodoro": {
        const value = readText(entry.pomodoro && entry.pomodoro.time);
        const status = readText(entry.pomodoro && entry.pomodoro.status);
        return { label: status || "番茄钟", value: value || "25:00" };
      }
      case "clipboard": {
        const list = entry.el.querySelector("[data-clipboard-list]");
        const first = list ? list.firstElementChild : null;
        return {
          label: "最近复制",
          value: readText(first).slice(0, 80) || "暂无内容"
        };
      }
      case "notes": {
        const input = entry.notes && entry.notes.input;
        const raw = input ? String(input.value || "") : "";
        return {
          label: "随手记",
          value: raw.trim() ? raw.trim().slice(0, 80) : "还没有内容"
        };
      }
      case "quick": {
        const count = readText(entry.el.querySelector("[data-quick-count]"));
        return { label: "快速收纳", value: count || "暂无收纳" };
      }
      case "search": {
        const count = readText(entry.el.querySelector("[data-search-count]"));
        return { label: "快速搜索", value: count || "双击搜索" };
      }
      default:
        return {
          label: (entry.data && entry.data.label) || "组件",
          value: "双击展开"
        };
    }
  }

  function updateWidgetCollapsedSummary(entry) {
    if (!entry || !entry.summaryEls) return;
    const info = describeWidgetCollapsed(entry);
    entry.summaryEls.label.textContent = info.label;
    entry.summaryEls.value.textContent = info.value;
  }

  // The fold animation duration lives in CSS as well; keep the two in sync.
  const COLLAPSE_ANIMATION_MS = 300;
  const COLLAPSE_DOUBLE_PRESS_MS = 460;
  const COLLAPSE_DOUBLE_PRESS_SLOP = 12;
  // Controls and content rows keep their own double-click behaviour (rename,
  // page flip, open file…). Folding is reserved for the card chrome / title
  // area, so a double click inside a list never collapses the component.
  const COLLAPSE_IGNORE_SELECTOR = [
    "button, input, textarea, select, a, form, label, img, canvas, li",
    "[contenteditable='true']",
    "[data-no-drag]",
    "[data-resize-handle]",
    ".component-actions",
    ".widget-resize-handle",
    ".widget-resize-zone",
    ".file-cell",
    ".quick-cell",
    ".todo-item",
    ".clipboard-item",
    ".search-result"
  ].join(",");

  let collapseDelegationReady = false;
  let lastWidgetPress = { key: "", at: 0, x: 0, y: 0 };

  // A fold toggle must resolve the *card* under the cursor, never a specific
  // descendant. Collapsing replaces the pane with the summary line, so the
  // element that was pressed first is gone by the second press. Relying on the
  // native dblclick target therefore made "double-click to expand" a no-op:
  // the second press landed on the desktop and the event never reached the card.
  function widgetEntryFromCollapseEvent(event) {
    const target = event.target;
    if (!target || typeof target.closest !== "function") return null;

    const el = target.closest(".desktop-widget[data-widget-key]");
    if (!el) return null;

    const entry = widgets.get(el.dataset.widgetKey);
    if (!entry || entry.key === "clock") return null;
    if (target.closest(COLLAPSE_IGNORE_SELECTOR)) return null;

    return entry;
  }

  function toggleWidgetCollapsed(entry) {
    if (!entry) return;

    const now = performance.now();
    // The press detector and the native dblclick can both fire for one gesture;
    // this window makes sure the fold only flips once.
    if (now - (entry.lastCollapseToggleAt || 0) < 120) return;

    entry.lastCollapseToggleAt = now;
    raise(entry);
    setWidgetCollapsed(entry, !entry.collapsed);
  }

  // `body.is-moving` disables pointer events on every other component. If a
  // gesture ever ends without its pointerup (window blur, lost capture), the
  // whole desktop would stop reacting — clear the flag instead.
  function clearStaleDragState() {
    if (!document.body.classList.contains("is-moving")) return;

    for (const entry of widgets.values()) if (entry.moving) return;
    for (const entry of categories.values()) if (entry.moving) return;
    for (const entry of groups.values()) if (entry.moving) return;

    document.body.classList.remove("is-moving");
    document.body.classList.remove("is-resizing");
  }

  function ensureCollapseDelegation() {
    if (collapseDelegationReady) return;
    collapseDelegationReady = true;

    // Event delegation: one listener for every component, bound to the layer
    // instead of the (replaceable) card contents.
    widgetLayer.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;

      const entry = widgetEntryFromCollapseEvent(event);

      if (!entry) {
        lastWidgetPress = { key: "", at: 0, x: 0, y: 0 };
        return;
      }

      const now = performance.now();
      const isDoublePress =
        lastWidgetPress.key === entry.key &&
        now - lastWidgetPress.at <= COLLAPSE_DOUBLE_PRESS_MS &&
        Math.hypot(
          event.clientX - lastWidgetPress.x,
          event.clientY - lastWidgetPress.y
        ) <= COLLAPSE_DOUBLE_PRESS_SLOP;

      lastWidgetPress = {
        key: entry.key,
        at: isDoublePress ? 0 : now,
        x: event.clientX,
        y: event.clientY
      };

      if (!isDoublePress) return;

      // A fold must never turn into a drag: swallow this press before the card
      // handler can start a move (or the desktop starts a marquee).
      event.stopPropagation();
      event.preventDefault();
      toggleWidgetCollapsed(entry);
    }, true);

    // Native dblclick stays as a fallback for presses consumed by an inner
    // control; the shared timestamp keeps the two paths from double toggling.
    widgetLayer.addEventListener("dblclick", (event) => {
      const entry = widgetEntryFromCollapseEvent(event);
      if (!entry) return;
      if (performance.now() - (entry.lastCollapseToggleAt || 0) < 400) return;
      toggleWidgetCollapsed(entry);
    }, true);

    window.addEventListener("pointerup", clearStaleDragState, true);
    window.addEventListener("blur", clearStaleDragState);
  }

  function setWidgetCollapsed(entry, collapsed) {
    if (!entry || entry.key === "clock") return;

    const next = Boolean(collapsed);
    if (entry.collapsed === next) return;

    entry.collapsed = next;
    entry.lastCollapseToggleAt = performance.now();
    entry.el.classList.toggle("is-collapsed", next);
    entry.el.dataset.collapsed = next ? "true" : "false";
    entry.el.setAttribute("aria-expanded", String(!next));

    // The content pane needs its natural height for the whole transition — in
    // both directions — otherwise it reflows while the card is still growing.
    entry.el.classList.add("is-collapse-animating");
    clearTimeout(entry.collapseAnimTimer);
    entry.collapseAnimTimer = setTimeout(() => {
      entry.el.classList.remove("is-collapse-animating");
      entry.collapseAnimTimer = null;
    }, COLLAPSE_ANIMATION_MS + 40);

    if (entry.app) {
      // Hidden content must leave the tab order and the hit-test surface.
      entry.app.inert = next;
      entry.app.setAttribute("aria-hidden", String(next));
    }

    if (entry.summaryEls) {
      entry.summaryEls.root.setAttribute("tabindex", next ? "0" : "-1");
      entry.summaryEls.root.setAttribute("aria-expanded", String(!next));
      entry.summaryEls.root.setAttribute(
        "aria-label",
        `${entry.summaryEls.name}组件，${next ? "已收起" : "已展开"}`
      );
    }

    if (entry.collapsedTimer) {
      clearInterval(entry.collapsedTimer);
      entry.collapsedTimer = null;
    }

    if (next) {
      updateWidgetCollapsedSummary(entry);
      // Music and the pomodoro keep changing while folded.
      entry.collapsedTimer = setInterval(() => updateWidgetCollapsedSummary(entry), 1000);
    }
  }

  function attachWidgetCollapse(entry) {
    if (!entry || entry.key === "clock") return;

    ensureCollapseDelegation();

    const collapseMode = () => (
      state && state.settings && state.settings.collapseMode
        ? state.settings.collapseMode
        : "double-click"
    );

    entry.el.addEventListener("pointerenter", () => {
      if (collapseMode() !== "hover") return;
      if (!entry.collapsed) return;
      if (entry.moving || entry.resizing) return;
      clearTimeout(entry.hoverCollapseTimer);
      entry.hoverExpanded = true;
      setWidgetCollapsed(entry, false);
    });

    entry.el.addEventListener("pointerleave", () => {
      if (collapseMode() !== "hover") return;
      if (!entry.hoverExpanded) return;
      clearTimeout(entry.hoverCollapseTimer);
      entry.hoverExpanded = false;
      entry.hoverCollapseTimer = setTimeout(() => {
        entry.hoverCollapseTimer = null;
        // The cursor can come back inside the delay — or the card can grow
        // under it while expanding. Never fold a card the pointer is still on,
        // otherwise a fast in-and-out leaves it stuck in the folded state.
        if (entry.el.isConnected && entry.el.matches(":hover")) {
          entry.hoverExpanded = true;
          return;
        }
        setWidgetCollapsed(entry, true);
      }, 250);
    });
  }

  function applyWidgetState(entry, item) {
    entry.data = item;
    entry.el.classList.toggle("is-locked", Boolean(item.locked));
    entry.el.dataset.locked = item.locked ? "true" : "false";
    entry.app.classList.toggle("is-locked", Boolean(item.locked));
    applyAppearance(entry.app);
    applyAccent(entry.app, item.accentColor);
    applyWidgetBackground(entry, item.backgroundImageUrl);
    positionWidget(entry);

    if (entry.key === "clock") {
      updateClock(entry);
      scheduleClockFit();
    } else if (entry.key === "music") {
      startMusic(entry);
    } else if (entry.key === "notes") {
      syncNotesInput(entry);
    } else if (entry.key === "todo") {
      renderTodos(entry);
    } else if (entry.key === "calendar") {
      renderCalendar(entry);
    } else if (entry.key === "pomodoro") {
      renderPomodoro(entry);
    } else if (entry.key === "quick") {
      renderQuickAccess(entry, item.files);
    } else if (entry.key === "clipboard") {
      renderClipboardHistory(entry, item.clipboardEntries, item.maxClipboardEntries);
    }

    if (entry.collapsed) updateWidgetCollapsedSummary(entry);

    syncComponentActions(entry);
  }

  function syncWidgets(nextWidgets) {
    const incoming = new Map(
      (Array.isArray(nextWidgets) ? nextWidgets : [])
        .map((item) => [item.key, item])
    );

    for (const [key, item] of incoming) {
      let entry = widgets.get(key);

      if (!entry) {
        entry = createWidgetEntry(item);
        if (!entry) continue;
        widgets.set(key, entry);
        widgetLayer.append(entry.el);
      }

      applyWidgetState(entry, item);
    }

    for (const [key, entry] of [...widgets]) {
      if (incoming.has(key)) continue;
      if (entry.notes) {
        clearTimeout(entry.notes.timer);
        if (entry.notes.dirty) flushNotes(entry);
      }
      if (entry.pomodoro) {
        clearInterval(entry.pomodoro.timer);
        clearTimeout(entry.pomodoro.flashTimer);
        clearTimeout(entry.pomodoro.rejectionTimer);
        if (key === "pomodoro") setPomodoroFocusMode(entry, false);
      }
      if (entry.collapsedTimer) clearInterval(entry.collapsedTimer);
      if (entry.hoverCollapseTimer) clearTimeout(entry.hoverCollapseTimer);
      if (entry.collapseAnimTimer) clearTimeout(entry.collapseAnimTimer);
      entry.el.remove();
      widgets.delete(key);
    }
  }

  const PRIVACY_MASK_SELECTOR = ".file-name, .file-icon";
  let privacyMaskFrame = 0;

  function markPrivacyTargets(active) {
    document.querySelectorAll(PRIVACY_MASK_SELECTOR).forEach((node) => {
      node.classList.toggle("is-privacy-masked", active);
    });
  }

  function applyPrivacyMode(active, revision) {
    const normalizedRevision = Number(revision);

    // State snapshots and privacy events travel on different IPC paths. A
    // slow getState() response must not roll back a newer privacy toggle.
    if (Number.isFinite(normalizedRevision)) {
      if (normalizedRevision < privacyModeRevision) return;

      privacyModeRevision = normalizedRevision;
    }

    privacyModeActive = Boolean(active);
    isPrivacyMode = privacyModeActive;
    window.isPrivacyMode = isPrivacyMode;

    // 给最外层容器写死 .privacy-active，CSS 只依赖这一个开关，
    // 不再需要逐个节点打标记才能生效。
    document.body.classList.toggle("privacy-masked", privacyModeActive);
    document.body.classList.toggle("privacy-active", privacyModeActive);
    document.documentElement.classList.toggle("privacy-active", privacyModeActive);
    stage.classList.toggle("privacy-active", privacyModeActive);
    markPrivacyTargets(privacyModeActive);
  }

  function schedulePrivacyMask() {
    if (privacyMaskFrame || !document.body.classList.contains("privacy-masked")) {
      return;
    }

    privacyMaskFrame = requestAnimationFrame(() => {
      privacyMaskFrame = 0;
      markPrivacyTargets(true);
    });
  }

  function applyState(next) {
    if (!next || next.ok !== true) return;

    state = next;
    applyPrivacyMode(Boolean(next.privacyActive), next.privacyRevision);
    document.body.classList.toggle(
      "performance-mode",
      Boolean(next.settings && next.settings.performanceMode)
    );

    if (!next.settings || !next.settings.depth3d) {
      resetAllDepths();
    }
    stage.classList.toggle("is-hidden", next.componentsVisible === false);
    syncDesktopIconArea();
    syncCategories(next.categories);
    syncGroups(next.groups);
    syncWidgets(next.widgets);
    syncDesktopIcons(next.desktopItems);

    // Rendering happens after applyPrivacyMode(), so every freshly inserted
    // file name/icon must be masked again synchronously. Do not rely only on
    // the MutationObserver frame; a new desktop file can otherwise appear
    // unblurred for at least one paint cycle.
    if (privacyModeActive) {
      markPrivacyTargets(true);
    }

    updateAllThemes();
    updateClocks();
    updateCalendars();
    updateMusicCardCover();
    positionAchievementToast();

    if (next.componentsVisible === false) {
      setPassthrough(true);
    }

    scheduleClockFit();
  }

  function updateAllThemes() {
    for (const entry of categories.values()) applyAppearance(entry.app);
    for (const entry of groups.values()) applyAppearance(entry.app);
    for (const entry of widgets.values()) applyAppearance(entry.app);
  }

  function collectAlignmentTargets(excludeEl) {
    const vertical = [0, window.innerWidth / 2, window.innerWidth];
    const horizontal = [0, window.innerHeight / 2, window.innerHeight];
    const boxes = [];
    const overlay = state && state.overlay
      ? state.overlay
      : { x: 0, y: 0 };
    const displays = state && Array.isArray(state.displays)
      ? state.displays
      : [];

    // Each monitor contributes its own edges and centers. This keeps snapping
    // useful after a component crosses onto a second display while the single
    // layer still spans the whole virtual desktop.
    for (const display of displays) {
      if (!display || !Number.isFinite(display.width)) continue;

      const left = display.x - overlay.x;
      const top = display.y - overlay.y;
      const right = left + display.width;
      const bottom = top + display.height;

      vertical.push(left, left + display.width / 2, right);
      horizontal.push(top, top + display.height / 2, bottom);
    }

    const entries = [
      ...categories.values(),
      ...groups.values(),
      ...widgets.values()
    ];

    for (const item of entries) {
      if (!item.el || item.el === excludeEl || !item.el.isConnected) continue;

      const rect = item.el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;

      boxes.push({
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom
      });
      vertical.push(
        rect.left,
        rect.left + rect.width / 2,
        rect.right
      );
      horizontal.push(
        rect.top,
        rect.top + rect.height / 2,
        rect.bottom
      );
    }

    return { vertical, horizontal, boxes };
  }

  function findBestSnap(candidates, targets) {
    let best = null;

    for (const candidate of candidates) {
      for (const target of targets) {
        const delta = target - candidate;

        if (Math.abs(delta) > SNAP_THRESHOLD) continue;

        if (!best || Math.abs(delta) < Math.abs(best.delta)) {
          best = { delta, line: target };
        }
      }
    }

    return best;
  }

  function findEqualSpacingSnap(left, top, width, height, boxes) {
    let bestX = null;
    let bestY = null;

    const verticallyOverlapping = boxes
      .filter((box) => box.bottom > top && box.top < top + height)
      .sort((a, b) => a.left - b.left);

    for (let index = 0; index < verticallyOverlapping.length - 1; index += 1) {
      const before = verticallyOverlapping[index];
      const after = verticallyOverlapping[index + 1];
      const gap = after.left - before.right;

      if (gap <= 0) continue;

      const candidate = before.right + gap / 2 - width / 2;
      const delta = candidate - left;

      if (
        Math.abs(delta) <= SNAP_THRESHOLD &&
        (!bestX || Math.abs(delta) < Math.abs(bestX.delta))
      ) {
        bestX = { delta, line: candidate + width / 2 };
      }
    }

    const horizontallyOverlapping = boxes
      .filter((box) => box.right > left && box.left < left + width)
      .sort((a, b) => a.top - b.top);

    for (let index = 0; index < horizontallyOverlapping.length - 1; index += 1) {
      const before = horizontallyOverlapping[index];
      const after = horizontallyOverlapping[index + 1];
      const gap = after.top - before.bottom;

      if (gap <= 0) continue;

      const candidate = before.bottom + gap / 2 - height / 2;
      const delta = candidate - top;

      if (
        Math.abs(delta) <= SNAP_THRESHOLD &&
        (!bestY || Math.abs(delta) < Math.abs(bestY.delta))
      ) {
        bestY = { delta, line: candidate + height / 2 };
      }
    }

    return { x: bestX, y: bestY };
  }

  function showAlignmentGuides(verticalLine, horizontalLine) {
    const verticalEl = alignmentGuides.querySelector('[data-guide="vertical"]');
    const horizontalEl = alignmentGuides.querySelector('[data-guide="horizontal"]');
    let visible = false;

    if (verticalLine !== null) {
      verticalEl.style.left = `${round(verticalLine)}px`;
      verticalEl.hidden = false;
      visible = true;
    } else {
      verticalEl.hidden = true;
    }

    if (horizontalLine !== null) {
      horizontalEl.style.top = `${round(horizontalLine)}px`;
      horizontalEl.hidden = false;
      visible = true;
    } else {
      horizontalEl.hidden = true;
    }

    alignmentGuides.hidden = !visible;
  }

  function hideAlignmentGuides() {
    alignmentGuides.hidden = true;
  }

  function getSnappedPosition(left, top, width, height, excludeEl) {
    const targets = collectAlignmentTargets(excludeEl);
    const edgeX = findBestSnap(
      [left, left + width / 2, left + width],
      targets.vertical
    );
    const edgeY = findBestSnap(
      [top, top + height / 2, top + height],
      targets.horizontal
    );
    const equal = findEqualSpacingSnap(
      left,
      top,
      width,
      height,
      targets.boxes
    );
    const xSnap = equal.x && (!edgeX || Math.abs(equal.x.delta) <= Math.abs(edgeX.delta))
      ? equal.x
      : edgeX;
    const ySnap = equal.y && (!edgeY || Math.abs(equal.y.delta) <= Math.abs(edgeY.delta))
      ? equal.y
      : edgeY;

    return {
      left: xSnap ? left + xSnap.delta : left,
      top: ySnap ? top + ySnap.delta : top,
      guideX: xSnap ? xSnap.line : null,
      guideY: ySnap ? ySnap.line : null
    };
  }

  function countAlignedDesktopEntries() {
    const entries = [
      ...categories.values(),
      ...groups.values(),
      ...widgets.values()
    ].filter((item) => item && item.el && item.el.isConnected && !item.el.hidden);
    const lefts = new Map();
    const tops = new Map();

    for (const item of entries) {
      const left = Math.round(parseFloat(item.el.style.left) || 0);
      const top = Math.round(parseFloat(item.el.style.top) || 0);
      lefts.set(left, (lefts.get(left) || 0) + 1);
      tops.set(top, (tops.get(top) || 0) + 1);
    }

    return Math.max(0, ...lefts.values(), ...tops.values());
  }

  function startMove(entry, kind, key, event) {
    if (!entry || !entry.data || entry.data.locked) return;

    const start = {
      pointerId: event.pointerId,
      screenX: event.screenX,
      screenY: event.screenY,
      left: parseFloat(entry.el.style.left) || 0,
      top: parseFloat(entry.el.style.top) || 0,
      started: false
    };
    let mergeTarget = null;
    let usedSnap = false;

    const clearMergeTarget = () => {
      if (mergeTarget) {
        mergeTarget.el.classList.remove("is-tab-merge-target");
        mergeTarget = null;
      }
    };

    const findMergeTarget = (moveEvent) => {
      if (kind !== "category") return null;

      const elements = document.elementsFromPoint(
        moveEvent.clientX,
        moveEvent.clientY
      );

      for (const element of elements) {
        if (!element || !element.closest) continue;
        if (entry.el.contains(element)) continue;

        const categoryEl = element.closest(".category-widget[data-category-key]");

        if (categoryEl) {
          const targetEntry = categories.get(categoryEl.dataset.categoryKey);

          if (
            !targetEntry ||
            targetEntry === entry ||
            (targetEntry.data && targetEntry.data.locked)
          ) {
            continue;
          }

          return targetEntry;
        }

        const groupEl = element.closest(".tab-group-widget[data-group-key]");

        if (groupEl) {
          const targetEntry = groups.get(groupEl.dataset.groupKey);

          if (!targetEntry || (targetEntry.data && targetEntry.data.locked)) {
            continue;
          }

          return targetEntry;
        }
      }

      return null;
    };

    clearTimeout(entry.collapseTimer);
    holdInteraction("component-move");
    entry.moving = true;

    let frameHandle = 0;
    let pendingMove = null;
    let dragWidth = 0;
    let dragHeight = 0;

    // The move handler only records the latest pointer sample; the actual DOM
    // writes happen once per animation frame. Writing style.left/top on every
    // pointermove (120Hz mice fire every ~8ms) interleaved with offsetWidth
    // reads forces a synchronous reflow each time, which is what made the
    // component visibly stutter under the cursor.
    const applyMove = () => {
      frameHandle = 0;
      const moveEvent = pendingMove;
      pendingMove = null;

      if (!moveEvent || !start.started) return;

      const dx = moveEvent.screenX - start.screenX;
      const dy = moveEvent.screenY - start.screenY;
      const maxLeft = Math.max(0, window.innerWidth - dragWidth);
      const maxTop = Math.max(0, window.innerHeight - dragHeight);
      const tentativeLeft = Math.max(0, Math.min(maxLeft, start.left + dx));
      const tentativeTop = Math.max(0, Math.min(maxTop, start.top + dy));
      const snapped = getSnappedPosition(
        tentativeLeft,
        tentativeTop,
        dragWidth,
        dragHeight,
        entry.el
      );
      const nextLeft = Math.max(0, Math.min(maxLeft, snapped.left));
      const nextTop = Math.max(0, Math.min(maxTop, snapped.top));

      entry.el.style.left = `${round(nextLeft)}px`;
      entry.el.style.top = `${round(nextTop)}px`;
      if (snapped.guideX !== null || snapped.guideY !== null) {
        usedSnap = true;
      }
      showAlignmentGuides(snapped.guideX, snapped.guideY);

      if (kind === "category") {
        const nextTarget = findMergeTarget(moveEvent);

        if (nextTarget !== mergeTarget) {
          clearMergeTarget();
          mergeTarget = nextTarget;

          if (mergeTarget) {
            mergeTarget.el.classList.add("is-tab-merge-target");
          }
        }
      }
    };

    const onPointerMove = (moveEvent) => {
      if (moveEvent.pointerId !== start.pointerId) return;

      const dx = moveEvent.screenX - start.screenX;
      const dy = moveEvent.screenY - start.screenY;

      if (!start.started) {
        if (Math.hypot(dx, dy) < 3) return;
        start.started = true;
        entry.el.classList.add("is-moving");
        document.body.classList.add("is-moving");
        pinForDrag(entry);

        // Measure once per gesture instead of on every move.
        dragWidth = entry.el.offsetWidth;
        dragHeight = entry.el.offsetHeight;

        try {
          entry.el.setPointerCapture(start.pointerId);
        } catch (error) {
          // Pointer capture is best-effort; the window-level listeners remain.
        }
      }

      moveEvent.preventDefault();
      pendingMove = moveEvent;

      if (!frameHandle) {
        frameHandle = window.requestAnimationFrame(applyMove);
      }
    };

    const finish = (finishEvent, canceled) => {
      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("pointercancel", onPointerCancel, true);

      if (frameHandle) {
        window.cancelAnimationFrame(frameHandle);
        frameHandle = 0;
      }
      pendingMove = null;

      try {
        if (entry.el.hasPointerCapture(start.pointerId)) {
          entry.el.releasePointerCapture(start.pointerId);
        }
      } catch (error) {
        // Ignore capture already released by the browser.
      }

      entry.moving = false;
      entry.el.classList.remove("is-moving");
      document.body.classList.remove("is-moving");
      hideAlignmentGuides();

      // Drop the 9999 pin and go back to the normal stacking counter, otherwise
      // every dragged component would stay above all others forever.
      unpinAfterDrag(entry);

      const pendingMerge = canceled ? null : mergeTarget;
      const pendingMergeLabel = pendingMerge && pendingMerge.data
        ? pendingMerge.data.label
        : "";
      clearMergeTarget();
      releaseInteraction("component-move");

      if (!start.started) {
        // A plain press (no movement) must not re-derive the position from the
        // state snapshot. The snapshot can be one layout pass behind the DOM,
        // and re-applying it made the card jump out from under the cursor —
        // which also broke double-click, because the second press then landed
        // on the desktop instead of the card.
        return;
      }

      if (canceled) {
        positionWidget(entry);
        return;
      }

      if (pendingMerge) {
        api.mergeCategories(entry.data.key, pendingMerge.data.key).then((result) => {
          if (!result || !result.ok) {
            showLayerToast(
              result && result.error ? result.error : "无法合并标签组",
              { error: true }
            );
            positionWidget(entry);
            return;
          }

          showLayerToast(`已与「${pendingMergeLabel}」合并为标签组`);
        }).catch(() => {
          showLayerToast("无法合并标签组", { error: true });
          positionWidget(entry);
        });
        return;
      }

      const origin = overlayOrigin();
      const x = (parseFloat(entry.el.style.left) || 0) + origin.x;
      const y = (parseFloat(entry.el.style.top) || 0) + origin.y;

      api.setPosition(kind, key, x, y).catch(() => {
        if (kind === "category") {
          showCategoryToast(key, "位置保存失败");
        } else {
          showLayerToast("位置保存失败", { error: true });
        }
      });
      api.recordAchievementEvent("layout-move", { kind, key })
        .catch(() => {});

      if (usedSnap) {
        const alignedCount = countAlignedDesktopEntries();
        if (alignedCount >= 5) {
          api.recordAchievementEvent("aligned-components", {
            count: alignedCount
          }).catch(() => {});
        }
      }
    };

    const onPointerUp = (upEvent) => finish(upEvent, false);
    const onPointerCancel = (cancelEvent) => finish(cancelEvent, true);

    window.addEventListener("pointermove", onPointerMove, true);
    window.addEventListener("pointerup", onPointerUp, true);
    window.addEventListener("pointercancel", onPointerCancel, true);
  }

  function startResize(entry, kind, key, event, direction = "se") {
    if (!entry || !entry.data || entry.data.locked) return;

    const dirX = direction.includes("e") ? 1 : direction.includes("w") ? -1 : 0;
    const dirY = direction.includes("s") ? 1 : direction.includes("n") ? -1 : 0;

    if (dirX === 0 && dirY === 0) return;

    const start = {
      pointerId: event.pointerId,
      screenX: event.screenX,
      screenY: event.screenY,
      width: entry.el.offsetWidth,
      height: entry.el.offsetHeight,
      left: entry.el.offsetLeft,
      top: entry.el.offsetTop,
      started: false
    };

    const minWidth = Math.max(80, Number(entry.data.minWidth) || 120);
    const minHeight = Math.max(80, Number(entry.data.minHeight) || 120);
    const cursor = RESIZE_CURSORS[direction] || "nwse-resize";

    clearTimeout(entry.collapseTimer);
    holdInteraction("component-resize");
    entry.resizing = true;

    const onPointerMove = (moveEvent) => {
      if (moveEvent.pointerId !== start.pointerId) return;

      const dx = moveEvent.screenX - start.screenX;
      const dy = moveEvent.screenY - start.screenY;

      if (!start.started) {
        if (Math.hypot(dx, dy) < 3) return;
        start.started = true;
        entry.el.classList.add("is-resizing");
        document.body.classList.add("is-resizing");
        document.body.style.setProperty("--resize-cursor", cursor);

        try {
          entry.el.setPointerCapture(start.pointerId);
        } catch (error) {
          // Pointer capture is best-effort; the window listeners remain.
        }
      }

      moveEvent.preventDefault();

      let left = start.left;
      let top = start.top;
      let width = start.width;
      let height = start.height;

      if (dirX === 1) {
        width = start.width + dx;
      } else if (dirX === -1) {
        left = start.left + dx;
      }

      if (dirY === 1) {
        height = start.height + dy;
      } else if (dirY === -1) {
        top = start.top + dy;
      }

      if (dirX === 1) {
        width = Math.max(minWidth, Math.min(window.innerWidth - start.left, width));
      } else if (dirX === -1) {
        left = Math.max(0, Math.min(start.left + start.width - minWidth, left));
        width = start.left + start.width - left;
      }

      if (dirY === 1) {
        height = Math.max(minHeight, Math.min(window.innerHeight - start.top, height));
      } else if (dirY === -1) {
        top = Math.max(0, Math.min(start.top + start.height - minHeight, top));
        height = start.top + start.height - top;
      }

      // Snap the edge being dragged to neighbouring components and the stage.
      const targets = collectAlignmentTargets(entry.el);
      let guideX = null;
      let guideY = null;

      if (dirX === 1) {
        const snap = findBestSnap([left + width], targets.vertical);

        if (snap) {
          width = Math.max(
            minWidth,
            Math.min(window.innerWidth - start.left, width + snap.delta)
          );
          guideX = snap.line;
        }
      } else if (dirX === -1) {
        const snap = findBestSnap([left], targets.vertical);

        if (snap) {
          left = Math.max(
            0,
            Math.min(start.left + start.width - minWidth, left + snap.delta)
          );
          width = start.left + start.width - left;
          guideX = snap.line;
        }
      }

      if (dirY === 1) {
        const snap = findBestSnap([top + height], targets.horizontal);

        if (snap) {
          height = Math.max(
            minHeight,
            Math.min(window.innerHeight - start.top, height + snap.delta)
          );
          guideY = snap.line;
        }
      } else if (dirY === -1) {
        const snap = findBestSnap([top], targets.horizontal);

        if (snap) {
          top = Math.max(
            0,
            Math.min(start.top + start.height - minHeight, top + snap.delta)
          );
          height = start.top + start.height - top;
          guideY = snap.line;
        }
      }

      entry.el.style.left = `${round(left)}px`;
      entry.el.style.top = `${round(top)}px`;
      entry.el.style.width = `${round(width)}px`;
      entry.el.style.height = `${round(height)}px`;
      showAlignmentGuides(guideX, guideY);
    };

    const finish = (finishEvent, canceled) => {
      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("pointercancel", onPointerCancel, true);

      try {
        if (entry.el.hasPointerCapture(start.pointerId)) {
          entry.el.releasePointerCapture(start.pointerId);
        }
      } catch (error) {
        // Ignore capture already released by the browser.
      }

      entry.resizing = false;
      entry.el.classList.remove("is-resizing");
      document.body.classList.remove("is-resizing");
      document.body.style.removeProperty("--resize-cursor");
      hideAlignmentGuides();
      releaseInteraction("component-resize");

      if (!start.started || canceled || !entry.el.isConnected) {
        positionWidget(entry);
        return;
      }

      const width = Math.round(entry.el.offsetWidth);
      const height = Math.round(entry.el.offsetHeight);
      const origin = overlayOrigin();
      const x = (parseFloat(entry.el.style.left) || 0) + origin.x;
      const y = (parseFloat(entry.el.style.top) || 0) + origin.y;

      api.resizeComponent(kind, key, width, height, x, y).then((result) => {
        if (!result || !result.ok) {
          const message = result && result.error
            ? result.error
            : "无法调整组件大小";

          if (kind === "category") {
            showCategoryToast(key, message);
          } else {
            showLayerToast(message, { error: true });
          }

          positionWidget(entry);
        }
      }).catch(() => {
        if (kind === "category") {
          showCategoryToast(key, "无法调整组件大小");
        } else {
          showLayerToast("无法调整组件大小", { error: true });
        }
        positionWidget(entry);
      });
    };

    const onPointerUp = (upEvent) => finish(upEvent, false);
    const onPointerCancel = (cancelEvent) => finish(cancelEvent, true);

    window.addEventListener("pointermove", onPointerMove, true);
    window.addEventListener("pointerup", onPointerUp, true);
    window.addEventListener("pointercancel", onPointerCancel, true);
  }

  function formatClockTime(now, format) {
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    if (format === "hh") return hours;
    if (format === "hh/mm") return `${hours}:${minutes}`;
    return `${hours}:${minutes}:${seconds}`;
  }

  function formatClockDate(now, format) {
    const year = String(now.getFullYear()).padStart(4, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    if (format === "yyyy") return year;
    if (format === "mm/dd") return `${month}/${day}`;
    if (format === "yyyy-mm-dd") return `${year}-${month}-${day}`;
    return `${year}/${month}/${day}`;
  }

  function updateClock(entry) {
    if (!entry || !entry.clockEls || !entry.data) return;
    const now = new Date();
    const weekday = "日一二三四五六"[now.getDay()];
    entry.clockEls.time.textContent = formatClockTime(
      now,
      entry.data.timeFormat || "hh/mm/ss"
    );
    entry.clockEls.date.textContent = formatClockDate(
      now,
      entry.data.dateFormat || "yyyy/mm/dd"
    );
    entry.clockEls.weekday.textContent = `星期${weekday}`;
    entry.clockEls.text.textContent = entry.data.customText || "";
    entry.clockEls.text.hidden = !String(entry.data.customText || "").trim();
  }

  function updateClocks() {
    for (const entry of widgets.values()) {
      if (entry.key === "clock") updateClock(entry);
    }
  }

  function startClock() {
    if (clockTimer !== null) return;
    clockTimer = setInterval(updateClocks, 1000);
  }

  function scheduleClockFit() {
    if (clockFitFrame !== null) return;

    clockFitFrame = requestAnimationFrame(() => {
      clockFitFrame = null;

      for (const entry of widgets.values()) {
        if (entry.key === "clock") fitClock(entry);
      }
    });
  }

  function fitClock(entry) {
    if (!entry.clockEls || !entry.clockEls.content || !entry.el.isConnected) return;

    const content = entry.clockEls.content;
    const body = content.closest(".widget-body");
    if (!body) return;

    content.style.transform = "none";
    const bodyStyle = getComputedStyle(body);
    const paddingX =
      parseFloat(bodyStyle.paddingLeft) + parseFloat(bodyStyle.paddingRight);
    const paddingY =
      parseFloat(bodyStyle.paddingTop) + parseFloat(bodyStyle.paddingBottom);
    const availableWidth = Math.max(1, body.clientWidth - paddingX);
    const availableHeight = Math.max(1, body.clientHeight - paddingY);

    content.style.width = `${availableWidth}px`;
    const rect = content.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const scale = Math.min(
      1,
      availableWidth / rect.width,
      availableHeight / rect.height
    );

    content.style.transform = `scale(${Math.max(0.01, scale)})`;
  }

  function formatSeconds(seconds) {
    const total = Number.isFinite(seconds) && seconds > 0
      ? Math.floor(seconds)
      : 0;
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const rest = total % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
    }

    return `${minutes}:${String(rest).padStart(2, "0")}`;
  }

  function getCommandSupport(command, session) {
    if (!session || !session.controls) return false;
    if (command === "next") return session.controls.canSkipNext === true;
    if (command === "previous") return session.controls.canSkipPrevious === true;

    if (command === "playPause") {
      return session.playbackStatus === "playing"
        ? session.controls.canPause === true
        : session.controls.canPlay === true;
    }

    return false;
  }

  function setMusicControls(entry, session) {
    const playing = Boolean(session && session.playbackStatus === "playing");
    const buttons = [
      [entry.musicEls.prev, "previous", "上一首"],
      [entry.musicEls.play, "playPause", playing ? "暂停" : "播放"],
      [entry.musicEls.next, "next", "下一首"]
    ];

    for (const [button, command, defaultTitle] of buttons) {
      const hasSession = Boolean(session);
      const supported = hasSession && getCommandSupport(command, session);
      button.disabled = !hasSession;
      button.setAttribute("aria-label", defaultTitle);

      if (!hasSession) {
        button.classList.remove("is-unsupported");
        button.removeAttribute("aria-disabled");
        button.title = "当前无播放内容";
        continue;
      }

      button.classList.toggle("is-unsupported", !supported);

      if (supported) {
        button.removeAttribute("aria-disabled");
        button.title = defaultTitle;
      } else {
        button.setAttribute("aria-disabled", "true");
        button.title = "当前播放器不支持此操作";
      }
    }
  }

  function renderMusicSession(entry, session) {
    if (!entry || !entry.musicEls) return;
    currentSession = session;

    if (!session) {
      entry.musicEls.title.textContent = "当前无播放内容";
      entry.musicEls.title.title = "";
      entry.musicEls.artist.textContent = "在任意播放器中开始播放后会自动显示";
      entry.musicEls.artist.title = "";
      entry.musicEls.current.textContent = "0:00";
      entry.musicEls.duration.textContent = "0:00";
      entry.musicEls.fill.style.width = "0%";
      entry.musicEls.seek.setAttribute("aria-valuenow", "0");
      entry.musicEls.disc.classList.remove("is-playing");
      entry.musicEls.play.textContent = "▶";
      setMusicControls(entry, null);
      return;
    }

    const title = session.title || "未知曲目";
    const artist = session.artist || session.app || "未知歌手";
    const position = Number(session.timeline && session.timeline.positionMs) || 0;
    const duration = Number(session.timeline && session.timeline.durationMs) || 0;
    const percent = duration > 0
      ? Math.max(0, Math.min(100, (position / duration) * 100))
      : 0;
    const playing = session.playbackStatus === "playing";

    entry.musicEls.title.textContent = title;
    entry.musicEls.title.title = title;

    if (Date.now() >= noticeUntil) {
      entry.musicEls.artist.textContent = artist;
      entry.musicEls.artist.title = artist;
    }

    entry.musicEls.current.textContent = formatSeconds(position / 1000);
    entry.musicEls.duration.textContent = formatSeconds(duration / 1000);
    entry.musicEls.fill.style.width = `${percent}%`;
    entry.musicEls.seek.setAttribute("aria-valuenow", String(Math.round(percent)));
    entry.musicEls.disc.classList.toggle("is-playing", playing);
    entry.musicEls.play.textContent = playing ? "⏸" : "▶";
    entry.musicEls.play.setAttribute("aria-label", playing ? "暂停" : "播放");
    setMusicControls(entry, session);
  }

  function showMusicError(entry, message) {
    if (!entry || !entry.musicEls) return;
    currentSession = null;
    entry.musicEls.title.textContent = "无法读取媒体会话";
    entry.musicEls.title.title = "";
    entry.musicEls.artist.textContent = message || "未知错误";
    entry.musicEls.artist.title = message || "";
    entry.musicEls.current.textContent = "0:00";
    entry.musicEls.duration.textContent = "0:00";
    entry.musicEls.fill.style.width = "0%";
    entry.musicEls.seek.setAttribute("aria-valuenow", "0");
    entry.musicEls.disc.classList.remove("is-playing");
    entry.musicEls.play.textContent = "▶";
    setMusicControls(entry, null);
  }

  function showMusicNotice(entry, text) {
    if (!entry || !entry.musicEls) return;
    noticeUntil = Date.now() + 2500;
    entry.musicEls.artist.textContent = text;
    entry.musicEls.artist.title = text;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      noticeTimer = null;
      noticeUntil = 0;
      if (latestMusicPayload) applyMusicPayload(latestMusicPayload);
    }, 2500);
  }

  function updateMusicCardCover(payload = latestMusicPayload) {
    const entry = widgets.get("music");

    if (!entry || !entry.musicEls || !entry.musicEls.cover) return;

    const settings = state && state.settings ? state.settings : {};
    const session = payload && payload.ok === true ? payload.session : null;
    const art = session &&
      session.playbackStatus === "playing" &&
      typeof session.thumbnail === "string"
      ? session.thumbnail
      : "";
    const enabled = Boolean(art) &&
      settings.musicVisualizer !== false &&
      state &&
      state.componentsVisible !== false;
    const cover = entry.musicEls.cover;

    if (!enabled) {
      cover.hidden = true;
      cover.style.removeProperty("background-image");
      cover.dataset.src = "";
      entry.el.classList.remove("has-music-cover");
      return;
    }

    if (cover.dataset.src !== art) {
      cover.dataset.src = art;
      cover.style.backgroundImage = `url("${art}")`;
    }

    cover.hidden = false;
    entry.el.classList.add("has-music-cover");
  }

  function applyMusicPayload(payload) {
    latestMusicPayload = payload;
    updateMusicCardCover(payload);
    const entry = widgets.get("music");

    if (!entry || !entry.musicEls) return;

    if (!payload || payload.ok !== true) {
      showMusicError(entry, payload && payload.error);
      return;
    }

    if (!payload.session) {
      if (payload.error) {
        showMusicError(entry, payload.error);
      } else {
        renderMusicSession(entry, null);
      }
      return;
    }

    renderMusicSession(entry, payload.session);

    if (payload.error) {
      entry.musicEls.artist.textContent = `媒体会话异常：${payload.error}`;
      entry.musicEls.artist.title = payload.error;
    }
  }

  async function startMusic(entry) {
    if (!entry || entry.musicStarted) return;
    entry.musicStarted = true;

    if (!latestMusicPayload) {
      try {
        latestMusicPayload = await api.getMusicSession();
      } catch (error) {
        latestMusicPayload = null;
      }
    }

    applyMusicPayload(latestMusicPayload);
  }

  async function sendMusicCommand(command) {
    const entry = widgets.get("music");
    if (!entry || !currentSession) return;

    if (!getCommandSupport(command, currentSession)) {
      showMusicNotice(entry, "当前播放器不支持此操作");
      return;
    }

    try {
      const result = await api.controlMusic(command);
      if (!result || !result.ok) {
        showMusicNotice(entry, result && result.message ? result.message : "操作失败");
      }
    } catch (error) {
      showMusicNotice(entry, "操作失败");
    }
  }

  function ensureComponentData() {
    if (componentData) return Promise.resolve(componentData);
    if (componentDataPromise) return componentDataPromise;

    componentDataPromise = Promise.resolve()
      .then(() => api.getWidgetData())
      .then((result) => {
        if (!result || result.ok !== true) {
          throw new Error(result && result.error ? result.error : "读取失败");
        }

        componentData = {
          notesText: typeof result.notesText === "string" ? result.notesText : "",
          todos: Array.isArray(result.todos) ? result.todos : []
        };

        return componentData;
      })
      .catch(() => {
        componentData = { notesText: "", todos: [] };
        return componentData;
      })
      .then((data) => {
        componentDataPromise = null;

        try {
          refreshDataWidgets();
        } catch (error) {
          // A rendering hiccup must not block the desktop layer state.
        }

        return data;
      });

    return componentDataPromise;
  }

  function refreshDataWidgets() {
    for (const entry of widgets.values()) {
      if (entry.key === "notes") syncNotesInput(entry);
      if (entry.key === "todo") renderTodos(entry);
      if (entry.key === "calendar") renderCalendar(entry);
    }
  }

  function setNotesStatus(entry, text, tone = "") {
    if (!entry || !entry.notes || !entry.notes.status) return;
    entry.notes.status.textContent = text;
    entry.notes.status.classList.toggle("is-saving", tone === "is-saving");
    entry.notes.status.classList.toggle("is-error", tone === "is-error");
  }

  function formatNoteTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const now = new Date();
    const sameDay = date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

    if (sameDay) return `今天 ${time}`;
    return `${date.getMonth() + 1}/${date.getDate()} ${time}`;
  }

  function setNotesPage(entry, page) {
    if (!entry || !entry.notes) return;

    const notes = entry.notes;
    const nextPage = page === 2 ? 2 : 1;
    notes.page = nextPage;
    notes.editorPage.hidden = nextPage !== 1;
    notes.historyPage.hidden = nextPage !== 2;
    notes.pageLabel.textContent = `${nextPage} / 2`;
    notes.prev.disabled = nextPage === 1;
    notes.next.disabled = nextPage === 2;
    notes.pageCaption.textContent = nextPage === 1
      ? "写好后保存到本机"
      : "最近保存的内容";

    if (nextPage === 2) {
      loadNoteEntries(entry);
    }
  }

  function renderNoteHistory(entry) {
    if (!entry || !entry.notes) return;

    const notes = entry.notes;
    const entries = notes.entries.slice(0, 5);
    notes.historyList.replaceChildren();
    notes.historyEmpty.hidden = entries.length > 0;
    notes.historyList.hidden = entries.length === 0;
    notes.historyCount.textContent = entries.length > 0
      ? `${entries.length} / 5`
      : "";

    if (entries.length === 0) {
      notes.historyEmpty.textContent = "还没有保存过随手记。";
    }

    for (const item of entries) {
      const row = document.createElement("div");
      row.className = "notes-history-item";
      row.title = `${item.text}

点击进入阅读模式`;
      row.setAttribute("role", "button");
      row.tabIndex = 0;
      row.addEventListener("click", () => openNoteHistoryReader(item, entry));
      row.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openNoteHistoryReader(item, entry);
      });
      row.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openTextInputDialog({
          title: "重命名随手记",
          description: "只修改标题，正文内容保持不变。",
          value: item.title,
          maxLength: 60,
          onSave: async (titleValue) => {
            const result = await api.renameNoteEntry(item.id, titleValue);

            if (!result || !result.ok) {
              showLayerToast(
                result && result.error ? result.error : "无法重命名随手记",
                { error: true }
              );
              return;
            }

            await loadNoteEntries(entry);
            renderNoteHistory(entry);
            showLayerToast("随手记标题已更新");
          }
        });
      });

      const title = document.createElement("span");
      title.className = "notes-history-item-title";
      title.textContent = item.listTitle || item.title;

      const preview = document.createElement("span");
      preview.className = "notes-history-item-preview";
      preview.textContent = item.preview || "（空白内容）";

      const time = document.createElement("span");
      time.className = "notes-history-item-time";
      time.textContent = formatNoteTime(item.savedAt);

      const imageMatch = /!\[[^\]]*\]\((file:[^)\s]+|data:image\/[^)\s]+)\)/.exec(
        String(item.text || "")
      );

      if (imageMatch) {
        row.classList.add("has-thumb");
        const thumb = document.createElement("img");
        thumb.className = "notes-history-item-thumb";
        thumb.alt = "";
        thumb.loading = "lazy";
        thumb.src = imageMatch[1];

        const copy = document.createElement("span");
        copy.className = "notes-history-item-copy";
        copy.append(title, preview, time);
        row.append(thumb, copy);
      } else {
        row.append(title, preview, time);
      }

      notes.historyList.append(row);
    }
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

  function openNoteHistoryReader(note, entry) {
    if (!note || !entry || !entry.notes) return;

    closeTextInputDialog();

    const parts = splitNoteEditorText(note.text);
    const backdrop = document.createElement("div");
    backdrop.className = "layer-dialog-backdrop";

    const card = document.createElement("section");
    card.className = "layer-dialog note-reader-dialog";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-label", "阅读随手记");

    const header = document.createElement("header");
    header.className = "note-reader-head";

    const headingCopy = document.createElement("div");
    headingCopy.className = "note-reader-heading-copy";
    const heading = document.createElement("h2");
    heading.textContent = note.title || "无标题随手记";
    const time = document.createElement("p");
    time.textContent = formatNoteTime(note.savedAt) || "未知时间";
    headingCopy.append(heading, time);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "note-reader-close";
    closeButton.setAttribute("aria-label", "关闭随手记阅读");
    closeButton.textContent = "×";
    header.append(headingCopy, closeButton);

    const content = document.createElement("pre");
    content.className = "note-reader-content";
    content.textContent = parts.body.trim() ||
      (parts.title ? "这条随手记只有标题。" : "（空白内容）");

    const actions = document.createElement("footer");
    actions.className = "note-reader-actions";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "layer-dialog-btn note-reader-copy";
    copyButton.textContent = "📋 复制全文";

    const actionGroup = document.createElement("div");
    actionGroup.className = "note-reader-action-group";
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "layer-dialog-btn";
    editButton.textContent = "编辑内容";
    const doneButton = document.createElement("button");
    doneButton.type = "button";
    doneButton.className = "layer-dialog-btn is-primary";
    doneButton.textContent = "关闭";
    actionGroup.append(editButton, doneButton);
    actions.append(copyButton, actionGroup);

    card.append(header, content, actions);
    backdrop.append(card);
    document.body.append(backdrop);

    api.setMenuOpen(true);

    const close = () => {
      backdrop.remove();
      api.setMenuOpen(false);
      api.releaseInput();
    };

    const copy = async () => {
      copyButton.disabled = true;

      try {
        const result = await api.copyNoteEntry(note.id);

        if (!result || !result.ok) {
          showLayerToast(
            result && result.error ? result.error : "无法复制随手记",
            { error: true }
          );
          return;
        }

        copyButton.textContent = "已复制";
        setTimeout(() => {
          if (copyButton.isConnected) {
            copyButton.textContent = "📋 复制全文";
            copyButton.disabled = false;
          }
        }, 1500);
      } catch (error) {
        showLayerToast("无法复制随手记", { error: true });
      } finally {
        if (copyButton.textContent !== "已复制") copyButton.disabled = false;
      }
    };

    const edit = () => {
      close();
      openNoteHistoryEditor(note, entry);
    };

    copyButton.addEventListener("click", copy);
    editButton.addEventListener("click", edit);
    doneButton.addEventListener("click", close);
    closeButton.addEventListener("click", close);
    backdrop.addEventListener("pointerdown", (event) => {
      if (event.target === backdrop) close();
    });
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close();
    });

    requestAnimationFrame(() => closeButton.focus());
  }

  function openNoteHistoryEditor(note, entry) {
    if (!note || !entry || !entry.notes) return;

    closeTextInputDialog();

    const parts = splitNoteEditorText(note.text);
    const backdrop = document.createElement("div");
    backdrop.className = "layer-dialog-backdrop";

    const card = document.createElement("section");
    card.className = "layer-dialog is-wide";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-label", "编辑随手记");

    const heading = document.createElement("h2");
    heading.textContent = "编辑随手记";

    const caption = document.createElement("p");
    caption.textContent = "保存后会覆盖原记录，列表顺序保持不变。";

    const titleLabel = document.createElement("label");
    titleLabel.className = "layer-dialog-field";
    const titleCaption = document.createElement("span");
    titleCaption.textContent = "标题";
    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.className = "layer-dialog-single";
    titleInput.maxLength = 60;
    titleInput.value = parts.title;
    titleInput.setAttribute("aria-label", "随手记标题");
    titleLabel.append(titleCaption, titleInput);

    const bodyLabel = document.createElement("label");
    bodyLabel.className = "layer-dialog-field";
    const bodyCaption = document.createElement("span");
    bodyCaption.textContent = "内容";
    const bodyInput = document.createElement("textarea");
    bodyInput.className = "layer-dialog-input is-large";
    bodyInput.rows = 12;
    bodyInput.value = parts.body;
    bodyInput.setAttribute("aria-label", "随手记内容");
    bodyLabel.append(bodyCaption, bodyInput);

    const actions = document.createElement("div");
    actions.className = "layer-dialog-actions";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "layer-dialog-btn";
    cancel.textContent = "取消";
    const save = document.createElement("button");
    save.type = "button";
    save.className = "layer-dialog-btn is-primary";
    save.textContent = "保存修改";
    actions.append(cancel, save);

    card.append(heading, caption, titleLabel, bodyLabel, actions);
    backdrop.append(card);
    document.body.append(backdrop);

    api.setMenuOpen(true);
    api.focusInput().catch(() => {});
    requestAnimationFrame(() => bodyInput.focus());

    const close = () => {
      backdrop.remove();
      api.setMenuOpen(false);
      api.releaseInput();
    };

    const submit = async () => {
      const title = titleInput.value.trim();

      if (!title) {
        showLayerToast("标题不能为空", { error: true });
        titleInput.focus();
        return;
      }

      const text = bodyInput.value.trim()
        ? `${title}\n${bodyInput.value}`
        : title;
      save.disabled = true;
      save.textContent = "保存中…";

      try {
        const result = await api.updateNoteEntry(note.id, text);

        if (!result || !result.ok) {
          showLayerToast(
            result && result.error ? result.error : "无法保存随手记",
            { error: true }
          );
          return;
        }

        close();
        showLayerToast("随手记已更新");
        await loadNoteEntries(entry);
        renderNoteHistory(entry);
      } catch (error) {
        showLayerToast("无法保存随手记", { error: true });
      } finally {
        if (save.isConnected) {
          save.disabled = false;
          save.textContent = "保存修改";
        }
      }
    };

    cancel.addEventListener("click", close);
    save.addEventListener("click", submit);
    backdrop.addEventListener("pointerdown", (event) => {
      if (event.target === backdrop) close();
    });
    card.addEventListener("keydown", (event) => {
      if (event.isComposing) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        submit();
      }
    });
  }

  async function loadNoteEntries(entry) {
    if (!entry || !entry.notes || entry.notes.loadingHistory) return;

    entry.notes.loadingHistory = true;
    entry.notes.historyEmpty.hidden = false;
    entry.notes.historyEmpty.textContent = "正在读取最近保存…";

    try {
      const result = await api.getNoteEntries(5);

      if (!result || result.ok !== true) {
        throw new Error(result && result.error ? result.error : "读取失败");
      }

      entry.notes.entries = Array.isArray(result.entries)
        ? result.entries
        : [];
      renderNoteHistory(entry);
    } catch (error) {
      entry.notes.entries = [];
      renderNoteHistory(entry);
      entry.notes.historyEmpty.textContent = "无法读取随手记历史。";
      entry.notes.historyEmpty.hidden = false;
    } finally {
      entry.notes.loadingHistory = false;
    }
  }

  function setupNotesEntry(entry) {
    const notes = entry.notes;

    notes.input.addEventListener("input", () => {
      notes.dirty = true;
      setNotesStatus(entry, "未保存", "is-saving");
      if (notes.meta) notes.meta.textContent = "草稿会自动保留";
      scheduleNotesSave(entry);
    });

    notes.input.addEventListener("blur", () => {
      flushNotes(entry);
    });

    notes.prev.addEventListener("click", () => setNotesPage(entry, 1));
    notes.next.addEventListener("click", () => setNotesPage(entry, 2));

    notes.saveButton.addEventListener("click", () => {
      saveNotesEntry(entry);
    });

    notes.moreButton.addEventListener("click", () => {
      api.openNotesHistory().then((result) => {
        if (!result || !result.ok) {
          showLayerToast(
            result && result.error ? result.error : "无法打开随手记历史",
            { error: true }
          );
        }
      }).catch(() => {
        showLayerToast("无法打开随手记历史", { error: true });
      });
    });

    setNotesPage(entry, 1);
    loadNoteEntries(entry);
  }

  async function saveNotesEntry(entry) {
    if (!entry || !entry.notes || entry.notes.savingEntry) return;

    const notes = entry.notes;
    const text = notes.input.value;

    if (!text.trim()) {
      setNotesStatus(entry, "内容为空，无法保存", "is-error");
      notes.input.focus();
      showLayerToast("请先写点内容再保存", { error: true });
      return;
    }

    notes.savingEntry = true;
    notes.saveButton.disabled = true;
    notes.saveButton.textContent = "保存中…";
    setNotesStatus(entry, "保存中…", "is-saving");

    try {
      const result = await api.saveNoteEntry(text);

      if (!result || !result.ok) {
        setNotesStatus(entry, "保存失败", "is-error");
        showLayerToast(
          result && result.error ? result.error : "随手记保存失败",
          { error: true }
        );
        return;
      }

      if (componentData) componentData.notesText = "";
      notes.input.value = "";
      notes.dirty = false;
      notes.lastSavedAt = result.savedAt || new Date().toISOString();
      notes.entries = Array.isArray(result.entries)
        ? result.entries.slice(0, 5)
        : notes.entries;
      notes.meta.textContent = `已保存到 ${formatNoteTime(notes.lastSavedAt)}`;
      setNotesStatus(entry, "已保存并清空输入框", "");
      renderNoteHistory(entry);
    } catch (error) {
      setNotesStatus(entry, "保存失败", "is-error");
      showLayerToast("随手记保存失败", { error: true });
    } finally {
      notes.savingEntry = false;
      notes.saveButton.disabled = false;
      notes.saveButton.textContent = "保存";
    }
  }

  function syncNotesInput(entry) {
    if (!entry || !entry.notes) return;

    if (!componentData) {
      setNotesStatus(entry, "读取中…", "is-saving");
      return;
    }

    const { input, dirty, saving } = entry.notes;
    const focused = document.activeElement === input;

    if (!dirty && !saving && (!focused || !input.value)) {
      if (input.value !== componentData.notesText) {
        input.value = componentData.notesText;
      }
    }

    if (!dirty && !saving && !entry.notes.savingEntry) {
      setNotesStatus(entry, notesStatusText(entry));
    }
  }

  function notesStatusText(entry) {
    if (entry.notes && entry.notes.lastSavedAt) {
      return `已保存 ${formatNoteTime(entry.notes.lastSavedAt)}`;
    }

    return "草稿已同步";
  }

  function scheduleNotesSave(entry) {
    if (!entry || !entry.notes) return;
    clearTimeout(entry.notes.timer);
    entry.notes.timer = setTimeout(() => {
      entry.notes.timer = null;
      flushNotes(entry);
    }, 280);
  }

  async function flushNotes(entry) {
    if (!entry || !entry.notes || !entry.notes.input) return;

    clearTimeout(entry.notes.timer);
    entry.notes.timer = null;

    if (entry.notes.saving) {
      entry.notes.queued = true;
      return;
    }

    const text = entry.notes.input.value;
    const wasDirty = entry.notes.dirty;
    entry.notes.saving = true;
    entry.notes.queued = false;

    if (wasDirty) setNotesStatus(entry, "草稿保存中…", "is-saving");

    try {
      const result = await api.saveNotes(text);

      if (!result || !result.ok) {
        setNotesStatus(entry, "草稿保存失败", "is-error");
        entry.notes.dirty = true;
        return;
      }

      if (componentData) componentData.notesText = text;

      if (entry.notes.input.value === text) {
        entry.notes.dirty = false;
        setNotesStatus(entry, notesStatusText(entry));
        if (entry.notes.meta) {
          entry.notes.meta.textContent = "草稿会自动保留；点「保存」写入随手记历史";
        }
      } else {
        entry.notes.dirty = true;
        entry.notes.queued = true;
      }
    } catch (error) {
      setNotesStatus(entry, "草稿保存失败", "is-error");
      entry.notes.dirty = true;
    } finally {
      entry.notes.saving = false;

      if (entry.notes.queued) {
        entry.notes.queued = false;
        scheduleNotesSave(entry);
      }
    }
  }

  function refreshClipboardMarquee(element) {
    if (!element) return;

    const track = element.querySelector(".clipboard-item-text-track");
    const primary = track
      ? track.querySelector(".clipboard-item-text-inner:not([data-marquee-clone])")
      : null;

    if (!track || !primary) return;

    element.classList.remove("is-marquee");
    element.style.removeProperty("--clipboard-marquee-duration");
    track.querySelector("[data-marquee-clone]")?.remove();

    // Measure the natural text width after removing any previous clone.
    const textWidth = primary.getBoundingClientRect().width;
    const overflow = textWidth - element.clientWidth;

    if (overflow <= 1) {
      return;
    }

    // 约 45px/s（约每秒 3 个中文字符），且一轮不短于 15 秒。
    const duration = Math.max(15, overflow / 45);
    element.style.setProperty(
      "--clipboard-marquee-duration",
      `${duration.toFixed(1)}s`
    );

    const clone = primary.cloneNode(true);
    clone.dataset.marqueeClone = "true";
    clone.setAttribute("aria-hidden", "true");
    track.append(clone);
    element.classList.add("is-marquee");
  }

  function scheduleClipboardMarqueeRefresh(entry) {
    if (!entry || !entry.clipboard) return;

    cancelAnimationFrame(entry.clipboard.marqueeFrame);
    entry.clipboard.marqueeFrame = requestAnimationFrame(() => {
      entry.clipboard.marqueeFrame = 0;
      entry.clipboard.list
        .querySelectorAll(".clipboard-item-text")
        .forEach(refreshClipboardMarquee);
    });
  }

  function observeClipboardMarquee(entry) {
    if (
      !entry ||
      !entry.clipboard ||
      entry.clipboard.marqueeObserver ||
      typeof ResizeObserver !== "function"
    ) {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (!entry.clipboard.list.isConnected) {
        observer.disconnect();
        entry.clipboard.marqueeObserver = null;
        return;
      }
      scheduleClipboardMarqueeRefresh(entry);
    });

    observer.observe(entry.clipboard.list);
    entry.clipboard.marqueeObserver = observer;
  }

  function renderClipboardHistory(entry, entries, maxEntries = 10) {
    if (!entry || !entry.clipboard) return;

    const max = Math.max(1, Math.round(Number(maxEntries) || 10));
    const items = (Array.isArray(entries) ? entries : [])
      .filter((item) => item && typeof item.text === "string")
      .slice(0, max);
    const signature = items
      .map((item) => `${item.id}\u0000${item.copiedAt || ""}\u0000${item.text.length}`)
      .join("\u0001");

    if (entry.clipboard.signature === signature) return;

    entry.clipboard.signature = signature;
    entry.clipboard.list.replaceChildren();
    entry.clipboard.count.textContent = `${items.length} / ${max}`;
    entry.clipboard.empty.hidden = items.length > 0;
    entry.clipboard.list.hidden = items.length === 0;

    for (const item of items) {
      const row = document.createElement("div");
      row.className = "clipboard-item";
      row.dataset.noDrag = "";
      row.dataset.clipboardId = item.id;
      row.setAttribute("role", "listitem");
      row.tabIndex = 0;
      row.title = "点击重新复制，右键删除";

      const text = document.createElement("span");
      text.className = "clipboard-item-text";

      const track = document.createElement("span");
      track.className = "clipboard-item-text-track";

      const textInner = document.createElement("span");
      textInner.className = "clipboard-item-text-inner";
      textInner.textContent = item.text;

      track.append(textInner);
      text.append(track);
      row.append(text);

      const copy = () => {
        copyClipboardHistoryEntry(item);
      };

      row.addEventListener("click", copy);
      row.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        copy();
      });
      row.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openContextMenu({
          x: event.clientX,
          y: event.clientY,
          title: "剪贴板记录",
          buildItems: () => {
            appendContextAction("复制这条内容", {
              icon: "⧉",
              action: () => copyClipboardHistoryEntry(item)
            });
            appendContextAction("删除这条记录", {
              icon: "⌫",
              danger: true,
              action: async () => {
                const result = await api.deleteClipboardEntry(item.id);

                if (result && result.ok) {
                  showLayerToast("已删除这条剪贴板记录");
                } else {
                  showLayerToast(
                    result && result.error
                      ? result.error
                      : "无法删除剪贴板记录",
                    { error: true }
                  );
                }
              }
            });
          }
        });
      });

      entry.clipboard.list.append(row);
    }

    observeClipboardMarquee(entry);
    scheduleClipboardMarqueeRefresh(entry);
  }

  async function copyClipboardHistoryEntry(item) {
    if (!item) return;

    try {
      const result = await api.copyClipboardEntry(item.id);

      if (!result || !result.ok) {
        showLayerToast(
          result && result.error ? result.error : "无法写入剪贴板",
          { error: true }
        );
        return;
      }

      showLayerToast("已复制到剪贴板");
    } catch (error) {
      showLayerToast("无法写入剪贴板", { error: true });
    }
  }

  function renderQuickAccess(entry, files) {
    if (!entry || !entry.quickEls) return;

    const items = Array.isArray(files) ? files : [];
    const { grid, empty, count } = entry.quickEls;

    count.textContent = `${items.length} 个中转文件`;
    empty.hidden = items.length > 0;
    grid.hidden = items.length === 0;
    grid.replaceChildren();

    for (const file of items) {
      grid.append(createQuickFileCell(entry, file));
    }
  }

  function createQuickFileCell(entry, file) {
    const cell = document.createElement("div");
    cell.className = "file-cell quick-cell";
    cell.tabIndex = 0;
    cell.draggable = true;
    cell.dataset.fileKey = file.key || file.path;
    cell.dataset.filePath = file.path;
    cell.dataset.fileKind = file.kind || "file";
    cell.setAttribute("role", "listitem");
    cell.setAttribute(
      "aria-label",
      `${file.name}，点击打开；拖拽到桌面或其他应用`
    );
    cell.title = `${file.name}（拖拽到桌面或其他应用）`;

    const iconWrap = document.createElement("div");
    iconWrap.className = "file-icon";
    applyTypeIcon(iconWrap, file.type);

    const name = document.createElement("span");
    name.className = "file-name";
    name.textContent = file.name;
    name.title = file.name;

    cell.append(iconWrap, name);

    if (file.colorTag) {
      cell.dataset.colorTag = file.colorTag;
      const tag = document.createElement("span");
      tag.className = "file-color-tag";
      tag.setAttribute("aria-hidden", "true");
      cell.append(tag);
    }

    cell.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      raise(entry);
    });

    const open = () => {
      api.openQuickFile(file.path).then((result) => {
        if (!result || !result.ok) {
          showLayerToast(
            result && result.error ? result.error : "无法打开文件",
            { error: true }
          );
        }
      }).catch(() => {
        showLayerToast("无法打开文件", { error: true });
      });
    };

    cell.addEventListener("click", open);
    cell.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
    cell.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openFileContextMenu({
        x: event.clientX,
        y: event.clientY,
        categoryKey: "quick",
        file
      });
    });

    cell.addEventListener("dragstart", (event) => {
      // Quick access is a transient shelf rather than a sortable category;
      // dragging from it always starts a native system drag.
      startExternalFileDrag(event, cell, file, [file.path]);
    });

    return cell;
  }

  function setupQuickDropTarget(entry) {
    entry.el.addEventListener("dragenter", (event) => {
      if (!isFileDragEvent(event)) return;
      clearCategoryDragHover();
      entry.el.classList.add("is-file-drop-target");
      entry.quickEls.dropHint.hidden = false;
    });

    entry.el.addEventListener("dragover", (event) => {
      if (!isFileDragEvent(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      clearCategoryDragHover();
      entry.el.classList.add("is-file-drop-target");
      entry.quickEls.dropHint.hidden = false;
    });

    entry.el.addEventListener("dragleave", (event) => {
      if (!entry.el.contains(event.relatedTarget)) {
        entry.el.classList.remove("is-file-drop-target");
        entry.quickEls.dropHint.hidden = true;
      }
    });

    entry.el.addEventListener("drop", (event) => {
      if (!fileDrag) return;

      event.preventDefault();
      event.stopPropagation();

      const drag = fileDrag;
      clearDropTargets();

      if (drag.file.isSystemIcon) {
        showLayerToast("系统图标不能加入快速收纳", { error: true });
        return;
      }

      api.addQuickFiles([drag.file.path]).then((result) => {
        if (!result || !result.ok) {
          showLayerToast(
            result && result.error ? result.error : "无法加入快速收纳",
            { error: true }
          );
          return;
        }

        if (result.count > 0) {
          showLayerToast("已加入快速收纳");
        } else {
          showLayerToast("这个文件已经在快速收纳里了");
        }
      }).catch(() => {
        showLayerToast("无法加入快速收纳", { error: true });
      });
    });
  }

  function setupTransferDropTarget(entry, target) {
    const hint = entry.transferDropHint;
    const hintText = target === "notes"
      ? "松开生成图文卡片"
      : target === "todo"
        ? "松开生成待办任务"
        : "松开填入文件名";

    if (hint) hint.textContent = hintText;

    const show = () => {
      entry.el.classList.add("is-file-drop-target");
      if (hint) hint.hidden = false;
    };

    const hide = () => {
      entry.el.classList.remove("is-file-drop-target");
      if (hint) hint.hidden = true;
    };

    entry.el.addEventListener("dragenter", (event) => {
      if (!isFileDragEvent(event)) return;
      show();
    });

    entry.el.addEventListener("dragover", (event) => {
      if (!isFileDragEvent(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
      clearCategoryDragHover();
      show();
    });

    entry.el.addEventListener("dragleave", (event) => {
      if (entry.el.contains(event.relatedTarget)) return;
      hide();
    });

    entry.el.addEventListener("drop", (event) => {
      if (!fileDrag) return;

      event.preventDefault();
      event.stopPropagation();
      const paths = getFileDragSourcePaths("", { includeExternal: true });

      fileDrag.handled = true;
      hide();
      finishFileDrag();

      if (paths.length === 0) {
        showLayerToast("没有可处理的文件", { error: true });
        return;
      }

      api.ingestDroppedFiles(target, paths).then((result) => {
        handleTransferResult(target, result, entry);
      }).catch(() => {
        showLayerToast("无法处理拖入的文件", { error: true });
      });
    });
  }

  function handleTransferResult(target, result, entry) {
    if (!result || result.ok === false) {
      showLayerToast(
        result && result.error ? result.error : "无法处理拖入的文件",
        { error: true }
      );
      return;
    }

    if (target === "notes") {
      const notesEntry = entry && entry.notes ? entry : widgets.get("notes");

      if (notesEntry && notesEntry.notes) {
        setNotesPage(notesEntry, 2);
        loadNoteEntries(notesEntry);
      }

      showLayerToast(`已生成图文卡片：${result.count} 个文件`);
      return;
    }

    if (target === "todo") {
      const todoEntry = entry && entry.todo ? entry : widgets.get("todo");

      if (componentData) {
        componentData.todos = Array.isArray(result.todos)
          ? result.todos
          : componentData.todos;
      }

      if (todoEntry) renderTodos(todoEntry);

      showLayerToast(
        result.added > 0
          ? `已生成 ${result.added} 项待办任务`
          : result.error || "这些文件已经在待办里了。"
      );
      return;
    }

    if (target === "search") {
      const searchEntry = entry && entry.search ? entry : widgets.get("search");
      const file = result.files && result.files[0];

      if (searchEntry && searchEntry.search && file) {
        setSearchQuery(searchEntry, file.name);
      }

      showLayerToast(file ? `已填入「${file.name}」` : "没有可填入的文件");
    }
  }

  function setupSearchEntry(entry) {
    const search = entry.search;

    search.input.addEventListener("input", () => {
      clearTimeout(search.timer);
      search.timer = setTimeout(() => runSearch(entry), 160);
    });

    search.form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearTimeout(search.timer);
      runSearch(entry);
    });

    renderSearchResults(entry, []);
  }

  function setSearchQuery(entry, query) {
    if (!entry || !entry.search) return;
    clearTimeout(entry.search.timer);
    entry.search.input.value = query;
    runSearch(entry);

    requestAnimationFrame(() => {
      entry.search.input.focus();
      entry.search.input.select();
    });
  }

  function runSearch(entry) {
    if (!entry || !entry.search) return;

    const search = entry.search;
    const query = search.input.value.trim();

    if (!query) {
      search.requestToken += 1;
      search.status.textContent = "搜索桌面与分类文件";
      renderSearchResults(entry, []);
      return;
    }

    const token = ++search.requestToken;
    search.status.textContent = "正在搜索…";

    api.searchFiles(query).then((result) => {
      if (token !== search.requestToken || !entry.el.isConnected) return;

      if (!result || !result.ok) {
        search.status.textContent = "搜索失败";
        renderSearchResults(entry, []);
        showLayerToast(
          result && result.error ? result.error : "搜索失败",
          { error: true }
        );
        return;
      }

      search.status.textContent = `搜索「${query}」`;
      renderSearchResults(entry, result.results);
    }).catch(() => {
      if (token !== search.requestToken) return;
      search.status.textContent = "搜索失败";
      renderSearchResults(entry, []);
    });
  }

  function openSearchResult(result) {
    if (!result || !result.path) return;

    const task = result.categoryKey === "quick"
      ? api.openQuickFile(result.path)
      : api.openFile(result.categoryKey, result.path);

    task.then((response) => {
      if (!response || !response.ok) {
        showLayerToast(
          response && response.error ? response.error : "无法打开文件",
          { error: true }
        );
      }
    }).catch(() => {
      showLayerToast("无法打开文件", { error: true });
    });
  }

  function renderSearchResults(entry, results) {
    if (!entry || !entry.search) return;

    const search = entry.search;
    const items = Array.isArray(results) ? results : [];
    search.lastResults = items;
    search.count.textContent = `${items.length} 个结果`;
    search.results.replaceChildren();
    search.results.hidden = items.length === 0;
    search.empty.hidden = items.length > 0;

    if (items.length === 0) {
      search.empty.textContent = search.input.value.trim()
        ? "没有找到匹配的文件。"
        : "输入名称搜索桌面、分类和快速收纳中的文件；拖入文件会自动填入文件名。";
      return;
    }

    for (const result of items) {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "search-result";
      row.dataset.noDrag = "";
      row.setAttribute("role", "listitem");
      row.title = result.path;

      const icon = document.createElement("span");
      icon.className = "file-icon search-result-icon";
      applyTypeIcon(icon, result.type);

      const copy = document.createElement("span");
      copy.className = "search-result-copy";

      const name = document.createElement("span");
      name.className = "search-result-name";
      name.textContent = result.name;

      const meta = document.createElement("span");
      meta.className = "search-result-meta";
      meta.textContent = `${result.categoryLabel || "文件"} · ${result.path}`;

      copy.append(name, meta);
      row.append(icon, copy);
      row.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
      });
      row.addEventListener("click", () => openSearchResult(result));
      search.results.append(row);
    }
  }

  function refreshTodoSurfaces() {
    for (const entry of widgets.values()) {
      if (entry.todo) renderTodos(entry);
      if (entry.calendarEls) renderCalendar(entry);
    }
  }

  function formatTodoDateLabel(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    if (!match) return "";

    return `${Number(match[2])}月${Number(match[3])}日`;
  }

  const TODO_PAGE_COUNT = 2;

  /** 按「日期 + 时间」升序排，没有日期的排在最后，同权重用创建时间兜底。 */
  function sortTodosForDisplay(todos) {
    return [...todos].sort((left, right) => {
      const weight = getTodoSortWeight(left).localeCompare(getTodoSortWeight(right));
      if (weight !== 0) return weight;
      return String(left.text || "").localeCompare(String(right.text || ""));
    });
  }

  function getTodoSortWeight(todo) {
    const datePart = todo && todo.dueDate ? todo.dueDate : "9999-99-99";
    const timePart = todo && todo.dueTime ? todo.dueTime : "99:99";
    const created = todo && typeof todo.createdAt === "string" ? todo.createdAt : "";
    return `${datePart} ${timePart} ${created}`;
  }

  /** 显示用的时间标签：优先「M月D日 HH:mm」，没有时间就只显示日期。 */
  function formatTodoScheduleLabel(todo) {
    const dateLabel = formatTodoDateLabel(todo && todo.dueDate);
    const timeLabel = todo && todo.dueTime ? todo.dueTime : "";

    if (dateLabel && timeLabel) return `${dateLabel} ${timeLabel}`;
    if (dateLabel) return dateLabel;
    if (timeLabel) return `今天 ${timeLabel}`;
    return "";
  }

  function setTodoPage(entry, page) {
    if (!entry || !entry.todo) return;

    const next = Math.min(TODO_PAGE_COUNT, Math.max(1, Number(page) || 1));
    entry.todo.page = next;

    entry.todo.addPage.hidden = next !== 1;
    entry.todo.listPage.hidden = next !== 2;
    entry.todo.pageLabel.textContent = `${next} / ${TODO_PAGE_COUNT}`;
    entry.todo.prevButton.disabled = next === 1;
    entry.todo.nextButton.disabled = next === TODO_PAGE_COUNT;

    renderTodos(entry);
  }

  function openTodoManager() {
    if (!api || typeof api.openTodoManager !== "function") {
      showLayerToast("待办管理需要重启应用后可用", { error: true });
      return;
    }

    api.openTodoManager().catch(() => {
      showLayerToast("无法打开待办管理页", { error: true });
    });
  }

  function renderTodos(entry) {
    if (!entry || !entry.todo) return;

    const { list, empty, count, progress } = entry.todo;
    const todos = componentData && Array.isArray(componentData.todos)
      ? componentData.todos
      : [];
    const doneCount = todos.filter((todo) => todo.done).length;
    // 第二页只展示未完成，按时间升序。
    const pending = sortTodosForDisplay(todos.filter((todo) => !todo.done));

    count.textContent = pending.length > 0
      ? `${todos.length} 项待办 · ${pending.length} 项未完成`
      : `${todos.length} 项待办`;
    progress.textContent = `${doneCount} / ${todos.length}`;
    list.replaceChildren();
    list.hidden = pending.length === 0;
    empty.hidden = pending.length > 0;

    for (const todo of pending) {
      const item = document.createElement("div");
      item.className = "todo-item";
      item.dataset.noDrag = "";
      item.dataset.todoId = todo.id;
      item.draggable = true;
      item.setAttribute("role", "listitem");

      const scheduleLabel = formatTodoScheduleLabel(todo);
      if (todo.dueDate) {
        item.dataset.dueDate = todo.dueDate;
        item.title = scheduleLabel ? `已安排到 ${scheduleLabel}` : todo.text;
      }

      item.addEventListener("dragstart", (event) => {
        draggedTodoId = todo.id;
        item.classList.add("is-dragging");
        event.dataTransfer.effectAllowed = "copyMove";
        event.dataTransfer.setData("application/x-within-cube-todo", todo.id);
        event.dataTransfer.setData("text/plain", todo.text);
      });

      item.addEventListener("dragend", () => {
        draggedTodoId = "";
        item.classList.remove("is-dragging");
        clearCalendarDropTargets();
      });

      const check = document.createElement("input");
      check.type = "checkbox";
      check.className = "todo-check";
      check.checked = false;
      check.setAttribute("aria-label", `完成「${todo.text}」`);
      check.addEventListener("change", () => {
        toggleTodoItem(entry, todo.id, check.checked);
      });

      const copy = document.createElement("div");
      copy.className = "todo-copy";

      const text = document.createElement("span");
      text.className = "todo-text";
      text.textContent = todo.text;
      text.title = todo.text;

      copy.append(text);

      if (scheduleLabel) {
        const schedule = document.createElement("span");
        schedule.className = "todo-schedule";
        schedule.textContent = scheduleLabel;
        copy.append(schedule);
      }

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "todo-delete";
      remove.textContent = "×";
      remove.title = "删除待办";
      remove.setAttribute("aria-label", `删除待办「${todo.text}」`);
      remove.addEventListener("click", () => {
        deleteTodoItem(entry, todo.id);
      });

      item.append(check, copy, remove);
      list.append(item);
    }
  }

  async function addTodoItem(entry) {
    if (!entry || !entry.todo || entry.todo.busy) return;

    const text = entry.todo.input.value.trim();
    if (!text) {
      entry.todo.input.focus();
      return;
    }

    entry.todo.busy = true;
    entry.todo.addButton.disabled = true;
    entry.todo.list.setAttribute("aria-busy", "true");

    // 日期默认今天；时间留空表示「不限时间」，排序时排在当天最后。
    const dueDate = entry.todo.dateInput.value || calendarDateKey(new Date());
    const dueTime = entry.todo.timeInput.value || "";

    try {
      const result = await api.addTodo({ text, dueDate, dueTime });

      if (!result || !result.ok) {
        showLayerToast(
          result && result.error ? result.error : "无法添加待办",
          { error: true }
        );
        return;
      }

      if (componentData) componentData.todos = result.todos || [];
      entry.todo.input.value = "";
      entry.todo.timeInput.value = "";
      entry.todo.dateInput.value = calendarDateKey(new Date());
      refreshTodoSurfaces();
      entry.todo.input.focus();
    } catch (error) {
      showLayerToast("无法添加待办", { error: true });
    } finally {
      entry.todo.busy = false;
      entry.todo.addButton.disabled = false;
      entry.todo.list.removeAttribute("aria-busy");
    }
  }

  async function toggleTodoItem(entry, id, done) {
    if (!entry || !entry.todo || entry.todo.busy) return;

    entry.todo.busy = true;
    entry.todo.list.setAttribute("aria-busy", "true");

    try {
      const result = await api.toggleTodo(id, done);

      if (!result || !result.ok) {
        showLayerToast(
          result && result.error ? result.error : "无法更新待办",
          { error: true }
        );
        return;
      }

      if (componentData) componentData.todos = result.todos || [];
    } catch (error) {
      showLayerToast("无法更新待办", { error: true });
    } finally {
      entry.todo.busy = false;
      entry.todo.list.removeAttribute("aria-busy");
      refreshTodoSurfaces();
    }
  }

  async function deleteTodoItem(entry, id) {
    if (!entry || !entry.todo || entry.todo.busy) return;

    entry.todo.busy = true;
    entry.todo.list.setAttribute("aria-busy", "true");

    try {
      const result = await api.deleteTodo(id);

      if (!result || !result.ok) {
        showLayerToast(
          result && result.error ? result.error : "无法删除待办",
          { error: true }
        );
        return;
      }

      if (componentData) componentData.todos = result.todos || [];
    } catch (error) {
      showLayerToast("无法删除待办", { error: true });
    } finally {
      entry.todo.busy = false;
      entry.todo.list.removeAttribute("aria-busy");
      refreshTodoSurfaces();
    }
  }

  function padCalendarNumber(value) {
    return String(value).padStart(2, "0");
  }

  function calendarDateKey(date) {
    return `${date.getFullYear()}-${padCalendarNumber(date.getMonth() + 1)}-${padCalendarNumber(date.getDate())}`;
  }

  function parseCalendarDateKey(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    if (!match) return null;

    const date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    );

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const CALENDAR_WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  function getCalendarTodos() {
    return componentData && Array.isArray(componentData.todos)
      ? componentData.todos
      : [];
  }

  function clearCalendarDropTargets() {
    document
      .querySelectorAll(".calendar-day.is-todo-drop-target, .calendar-back.is-todo-drop-target")
      .forEach((element) => {
        element.classList.remove("is-todo-drop-target");
      });
  }

  function setCalendarFlipped(entry, flipped, { focus = true } = {}) {
    const els = entry && entry.calendarEls;
    if (!els) return;

    const next = Boolean(flipped);
    els.flipped = next;
    els.panel.classList.toggle("is-flipped", next);
    els.front.setAttribute("aria-hidden", String(next));
    els.back.setAttribute("aria-hidden", String(!next));
    els.front.inert = next;
    els.back.inert = !next;

    if (!focus) return;

    if (next) {
      setTimeout(() => {
        if (els.flipped) els.backButton.focus({ preventScroll: true });
      }, 230);
    } else if (els.selectedKey) {
      setTimeout(() => {
        if (els.flipped) return;
        const cell = els.grid.querySelector(
          `[data-calendar-date="${els.selectedKey}"]`
        );
        if (cell) cell.focus({ preventScroll: true });
      }, 230);
    }
  }

  function renderCalendarBack(entry) {
    const els = entry && entry.calendarEls;
    if (!els) return;

    const selectedKey = els.selectedKey || calendarDateKey(new Date());
    const selectedDate = parseCalendarDateKey(selectedKey);
    const todos = getCalendarTodos().filter(
      (todo) => todo.dueDate === selectedKey
    );

    if (selectedDate) {
      els.selectedDate.textContent =
        `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日 · ${CALENDAR_WEEKDAYS[selectedDate.getDay()]}`;
    }

    els.backTodos.replaceChildren();
    els.backTodos.hidden = todos.length === 0;
    els.backEmpty.hidden = todos.length > 0;
    els.backCount.textContent = `${todos.length} 项`;

    for (const todo of todos) {
      const row = document.createElement("label");
      row.className = "calendar-back-todo";
      row.classList.toggle("is-done", Boolean(todo.done));
      row.setAttribute("role", "listitem");

      const check = document.createElement("input");
      check.type = "checkbox";
      check.className = "todo-check calendar-back-check";
      check.checked = Boolean(todo.done);
      check.setAttribute(
        "aria-label",
        todo.done ? `标记「${todo.text}」为未完成` : `完成「${todo.text}」`
      );
      check.addEventListener("change", async () => {
        check.disabled = true;

        try {
          await toggleTodoFromCalendar(todo.id, check.checked);
        } finally {
          if (check.isConnected) check.disabled = false;
        }
      });

      const text = document.createElement("span");
      text.className = "calendar-back-todo-text";
      text.textContent = todo.text;
      text.title = todo.text;

      row.append(check, text);
      els.backTodos.append(row);
    }
  }

  async function toggleTodoFromCalendar(id, done) {
    try {
      const result = await api.toggleTodo(id, done);

      if (!result || !result.ok) {
        showLayerToast(
          result && result.error ? result.error : "无法更新待办",
          { error: true }
        );
        return;
      }

      if (componentData) componentData.todos = result.todos || [];
      refreshTodoSurfaces();
    } catch (error) {
      showLayerToast("无法更新待办", { error: true });
      refreshTodoSurfaces();
    }
  }

  async function assignTodoToCalendarDate(id, dateKey) {
    if (!draggedTodoId && !id) return;

    try {
      const result = await api.setTodoDueDate(id, dateKey);

      if (!result || !result.ok) {
        showLayerToast(
          result && result.error ? result.error : "无法安排待办日期",
          { error: true }
        );
        return;
      }

      if (componentData) componentData.todos = result.todos || [];
      refreshTodoSurfaces();
      const date = parseCalendarDateKey(dateKey);
      showLayerToast(
        date
          ? `已安排到 ${date.getMonth() + 1}月${date.getDate()}日`
          : "已更新待办日期"
      );
    } catch (error) {
      showLayerToast("无法安排待办日期", { error: true });
    }
  }

  function attachCalendarDropTarget(entry, element, getDateKey) {
    element.addEventListener("dragover", (event) => {
      if (!draggedTodoId) return;
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = "copy";
      element.classList.add("is-todo-drop-target");
    });

    element.addEventListener("dragleave", (event) => {
      if (event.relatedTarget && element.contains(event.relatedTarget)) return;
      element.classList.remove("is-todo-drop-target");
    });

    element.addEventListener("drop", async (event) => {
      if (!draggedTodoId) return;
      event.preventDefault();
      event.stopPropagation();

      const todoId = draggedTodoId ||
        event.dataTransfer.getData("application/x-within-cube-todo");
      const dateKey = getDateKey();
      draggedTodoId = "";
      clearCalendarDropTargets();

      if (!todoId || !dateKey) return;
      await assignTodoToCalendarDate(todoId, dateKey);
    });
  }

  function renderCalendar(entry) {
    if (!entry || !entry.calendarEls) return;

    const els = entry.calendarEls;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const firstDay = new Date(year, month, 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - mondayOffset);
    const monthText = `${year} 年 ${month + 1} 月`;
    const todayKey = calendarDateKey(now);
    const pendingCounts = new Map();
    const totalCounts = new Map();

    for (const todo of getCalendarTodos()) {
      if (!todo.dueDate) continue;
      totalCounts.set(todo.dueDate, (totalCounts.get(todo.dueDate) || 0) + 1);
      if (todo.done) continue;
      pendingCounts.set(todo.dueDate, (pendingCounts.get(todo.dueDate) || 0) + 1);
    }

    calendarDayKey = todayKey;
    if (!els.selectedKey) els.selectedKey = todayKey;
    els.month.textContent = monthText;
    els.today.textContent = `今天 ${month + 1}/${today}`;
    els.grid.replaceChildren();

    for (let index = 0; index < 42; index += 1) {
      const date = new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + index
      );
      const inMonth = date.getMonth() === month;
      const day = date.getDate();
      const weekDay = date.getDay();
      const dateKey = calendarDateKey(date);
      const pending = pendingCounts.get(dateKey) || 0;
      const total = totalCounts.get(dateKey) || 0;
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "calendar-day";
      cell.dataset.calendarDate = dateKey;
      cell.setAttribute("role", "gridcell");
      cell.setAttribute(
        "aria-label",
        `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${day} 日${
          total > 0 ? `，${total} 项待办` : ""
        }${pending > 0 ? `（${pending} 项未完成）` : ""}`
      );

      const number = document.createElement("span");
      number.className = "calendar-day-number";
      number.textContent = String(day);
      cell.append(number);

      // 当天排了任何待办就点一个小圆点；全部做完了就把圆点变淡，
      // 既不丢信息，也不会让人误以为还有事没做。
      if (total > 0) {
        const dot = document.createElement("span");
        dot.className = "calendar-task-dot";
        if (pending === 0) dot.classList.add("is-all-done");
        dot.setAttribute("aria-hidden", "true");
        cell.append(dot);
        cell.classList.add("has-todos");
      }

      if (!inMonth) cell.classList.add("is-muted");
      if (weekDay === 0 || weekDay === 6) cell.classList.add("is-weekend");

      if (dateKey === todayKey) {
        cell.classList.add("is-today");
        cell.setAttribute("aria-current", "date");
      }

      cell.addEventListener("click", () => {
        els.selectedKey = dateKey;
        renderCalendarBack(entry);
        setCalendarFlipped(entry, true);
      });
      attachCalendarDropTarget(entry, cell, () => dateKey);

      els.grid.append(cell);
    }

    els.panel.classList.toggle("is-flipped", els.flipped);
    els.front.setAttribute("aria-hidden", String(els.flipped));
    els.back.setAttribute("aria-hidden", String(!els.flipped));
    els.front.inert = els.flipped;
    els.back.inert = !els.flipped;
    renderCalendarBack(entry);

    entry.el.dataset.calendarDay = todayKey;
  }

  function updateCalendars() {
    for (const entry of widgets.values()) {
      if (entry.key === "calendar") renderCalendar(entry);
    }
  }

  function formatPomodoroTime(seconds) {
    const safe = Math.max(0, Math.ceil(seconds));
    const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
    const rest = String(safe % 60).padStart(2, "0");
    return `${minutes}:${rest}`;
  }

  function getPomodoroTotalSeconds(state) {
    if (state.phase === "focus" && state.customSeconds > 0) {
      return state.customSeconds;
    }

    return POMODORO_PHASES[state.phase].seconds;
  }

  function renderPomodoro(entry) {
    if (!entry || !entry.pomodoro) return;

    const state = entry.pomodoro;
    const phase = POMODORO_PHASES[state.phase] || POMODORO_PHASES.focus;
    const total = getPomodoroTotalSeconds(state);
    const isInitial = state.remaining >= total;
    const elapsed = Math.max(0, total - state.remaining);
    const percent = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0;
    const focus = state.phase === "focus";
    const target = focus ? state.target : null;
    const widget = entry.el;

    state.time.textContent = formatPomodoroTime(state.remaining);
    state.phaseEl.textContent = state.adjusting
      ? "调整专注时长"
      : target ? "专注目标" : phase.label;
    state.hint.hidden = Boolean(target);
    state.hint.textContent = state.adjusting
      ? "拖动圆环设置 1–120 分钟"
      : focus
        ? "专注 25 分钟 · 休息 5 分钟"
        : "休息 5 分钟 · 之后继续专注";
    state.targetRow.hidden = !target;
    widget.classList.toggle("has-target", Boolean(target));

    if (target) {
      state.targetName.textContent = target.name;
      state.targetMeta.textContent = `${target.minutes} 分钟`;
      state.targetRow.title = target.path || target.name;
    } else {
      state.targetName.textContent = "";
      state.targetMeta.textContent = "";
      state.targetRow.removeAttribute("title");
    }

    state.progress.style.strokeDashoffset = String(100 - percent);
    state.panel.classList.toggle("is-break", !focus);
    widget.classList.toggle("is-break", !focus);
    widget.classList.toggle("is-focus-running", state.running && focus);
    widget.classList.toggle("is-break-running", state.running && !focus);
    widget.classList.toggle("is-focus-pomodoro", focusModeActive);
    widget.classList.toggle("is-adjusting-duration", state.adjusting);
    state.toggle.textContent = state.running
      ? "暂停"
      : isInitial
        ? "开始"
        : "继续";
    state.toggle.setAttribute(
      "aria-label",
      state.running ? "暂停番茄钟" : "开始番茄钟"
    );

    state.status.textContent = state.adjusting
      ? "调整中"
      : state.running
        ? focus ? "专注中" : "休息中"
        : isInitial
          ? focus
            ? target ? "等待开始" : "准备专注"
            : "准备休息"
          : "已暂停";
  }

  function rejectPomodoroFile(entry, result = {}) {
    if (!entry || !entry.pomodoro) return;

    clearTimeout(entry.pomodoro.rejectionTimer);
    entry.el.classList.add("is-file-rejected");
    entry.pomodoro.rejectionTimer = setTimeout(() => {
      if (!entry.el.isConnected) return;
      entry.el.classList.remove("is-file-rejected");
    }, 820);

    const limit = result && result.limitLabel
      ? `（上限 ${result.limitLabel}）`
      : "";

    showLayerToast(`文件过大，已弹回${limit}`, { error: true });
  }

  function applyPomodoroAnalysis(entry, result) {
    if (!entry || !entry.pomodoro) return;

    if (!result || (result.ok === false && result.accepted !== false)) {
      showLayerToast(
        result && result.error ? result.error : "无法分析这个文件",
        { error: true }
      );
      return;
    }

    if (!result.accepted) {
      rejectPomodoroFile(entry, result);
      return;
    }

    const minutes = Math.max(1, Math.round(Number(result.minutes) || 30));
    const state = entry.pomodoro;

    stopPomodoroTimer(entry);
    setPomodoroFocusMode(entry, false);
    clearTimeout(state.flashTimer);
    entry.el.classList.remove("is-phase-finished");

    state.phase = "focus";
    state.customSeconds = minutes * 60;
    state.remaining = state.customSeconds;
    state.running = false;
    state.sessionStartedAt = null;
    state.target = {
      name: result.name || "专注目标",
      path: result.path || "",
      minutes,
      groupLabel: result.groupLabel || "无法评估",
      capMinutes: result.capMinutes || minutes
    };

    renderPomodoro(entry);
    showLayerToast(
      `「${state.target.name}」${state.target.groupLabel} · 建议专注 ${minutes} 分钟，点击开始`
    );
  }

  function clearPomodoroTarget(entry) {
    if (!entry || !entry.pomodoro) return;

    const state = entry.pomodoro;
    stopPomodoroTimer(entry);
    setPomodoroFocusMode(entry, false);
    state.phase = "focus";
    state.customSeconds = 0;
    state.target = null;
    state.sessionStartedAt = null;
    state.remaining = POMODORO_PHASES.focus.seconds;
    renderPomodoro(entry);
  }

  function setupPomodoroDropTarget(entry) {
    entry.el.addEventListener("dragenter", (event) => {
      if (!isFileDragEvent(event)) return;
      clearCategoryDragHover();
      entry.el.classList.add("is-file-drop-target");
      entry.pomodoro.dropHint.hidden = false;
    });

    entry.el.addEventListener("dragover", (event) => {
      if (!isFileDragEvent(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
      clearCategoryDragHover();
      entry.el.classList.add("is-file-drop-target");
      entry.pomodoro.dropHint.hidden = false;
    });

    entry.el.addEventListener("dragleave", (event) => {
      if (entry.el.contains(event.relatedTarget)) return;
      entry.el.classList.remove("is-file-drop-target");
      entry.pomodoro.dropHint.hidden = true;
    });

    entry.el.addEventListener("drop", (event) => {
      if (!fileDrag) return;

      event.preventDefault();
      event.stopPropagation();

      const drag = fileDrag;
      const file = drag.file;

      if (!file || !file.path || file.isSystemIcon || file.external) {
        finishFileDrag();
        showLayerToast("这个文件不能设为专注目标", { error: true });
        return;
      }

      drag.handled = true;
      clearDropTargets();
      finishFileDrag();

      api.analyzePomodoroDrop([file.path]).then((result) => {
        applyPomodoroAnalysis(entry, result);
      }).catch(() => {
        showLayerToast("无法分析这个文件", { error: true });
      });
    });
  }

  function snapPomodoroMinutes(value) {
    const safe = Math.max(1, Math.min(120, value));

    if (safe <= 10) return Math.max(1, Math.round(safe));
    if (safe <= 60) return Math.max(15, Math.min(60, Math.round(safe / 5) * 5));
    return Math.max(70, Math.min(120, Math.round(safe / 10) * 10));
  }

  function getPomodoroMinutesFromPointer(dial, clientX, clientY) {
    const rect = dial.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = (Math.atan2(clientY - centerY, clientX - centerX) * 180 / Math.PI + 90 + 360) % 360;
    return snapPomodoroMinutes((angle / 360) * 120);
  }

  function applyRingDuration(entry, minutes) {
    if (!entry || !entry.pomodoro) return;

    const state = entry.pomodoro;
    state.phase = "focus";
    state.customSeconds = Math.max(1, Math.min(120, minutes)) * 60;
    state.remaining = state.customSeconds;
    state.running = false;

    if (state.target) {
      state.target.minutes = Math.max(1, Math.min(120, minutes));
    }
  }

  function setupPomodoroRingDrag(entry) {
    const state = entry.pomodoro;
    const dial = state.dial;
    if (!dial) return;

    let drag = null;

    const stopDrag = (event, canceled) => {
      if (!drag || (event && event.pointerId !== drag.pointerId)) return;

      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("pointercancel", onPointerCancel, true);

      try {
        if (dial.hasPointerCapture(drag.pointerId)) {
          dial.releasePointerCapture(drag.pointerId);
        }
      } catch (error) {
        // Ignore capture released by the browser.
      }

      state.adjusting = false;
      releaseInteraction("pomodoro-duration");
      renderPomodoro(entry);

      if (!canceled) {
        showLayerToast(`专注时长已设为 ${Math.round(state.customSeconds / 60)} 分钟`);
      }

      drag = null;
    };

    const onPointerMove = (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;

      event.preventDefault();
      event.stopPropagation();
      applyRingDuration(entry, getPomodoroMinutesFromPointer(
        dial,
        event.clientX,
        event.clientY
      ));
      renderPomodoro(entry);
    };

    const onPointerUp = (event) => stopDrag(event, false);
    const onPointerCancel = (event) => stopDrag(event, true);

    dial.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || drag) return;

      const rect = dial.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
      const ringMin = rect.width * 0.32;
      const ringMax = rect.width * 0.55;

      // Only the outer ring starts a duration drag; the centre remains a
      // normal move handle for the card.
      if (distance < ringMin || distance > ringMax) return;

      event.preventDefault();
      event.stopPropagation();
      stopPomodoroTimer(entry);
      setPomodoroFocusMode(entry, false);
      state.adjusting = true;
      state.sessionStartedAt = null;
      applyRingDuration(entry, getPomodoroMinutesFromPointer(
        dial,
        event.clientX,
        event.clientY
      ));
      renderPomodoro(entry);
      holdInteraction("pomodoro-duration");

      drag = { pointerId: event.pointerId };

      try {
        dial.setPointerCapture(event.pointerId);
      } catch (error) {
        // Window listeners keep the drag working without capture.
      }

      window.addEventListener("pointermove", onPointerMove, true);
      window.addEventListener("pointerup", onPointerUp, true);
      window.addEventListener("pointercancel", onPointerCancel, true);
    });
  }

  function setPomodoroFocusMode(entry, active) {
    const next = Boolean(active);

    if (focusModeActive === next) {
      if (entry) entry.el.classList.toggle("is-focus-pomodoro", next);
      return;
    }

    focusModeActive = next;
    document.body.classList.toggle("is-focus-mode", next);

    if (next) {
      closeComponentMenu();
      closeTextInputDialog();
      api.releaseInput();
    }

    for (const item of widgets.values()) {
      item.el.classList.toggle(
        "is-focus-pomodoro",
        next && item.key === "pomodoro"
      );
    }

    if (next && entry) raise(entry);
    Promise.resolve(api.setFocusMode(next)).catch(() => {});
  }

  function stopPomodoroTimer(entry) {
    if (!entry || !entry.pomodoro) return;
    clearInterval(entry.pomodoro.timer);
    entry.pomodoro.timer = null;
    entry.pomodoro.running = false;
  }

  function finishPomodoro(entry) {
    if (!entry || !entry.pomodoro) return;

    const completed = entry.pomodoro.phase;
    const finishedTarget = entry.pomodoro.target;
    const totalSeconds = getPomodoroTotalSeconds(entry.pomodoro);
    const startedAt = entry.pomodoro.sessionStartedAt;
    stopPomodoroTimer(entry);
    setPomodoroFocusMode(entry, false);
    entry.pomodoro.sessionStartedAt = null;

    if (completed === "focus") {
      api.recordPomodoroSession({
        startedAt: startedAt || new Date(
          Date.now() - totalSeconds * 1000
        ).toISOString(),
        completedAt: new Date().toISOString(),
        minutes: Math.max(1, Math.round(totalSeconds / 60)),
        target: finishedTarget ? finishedTarget.name : ""
      }).catch(() => {});
    }

    entry.pomodoro.phase = completed === "focus" ? "break" : "focus";
    entry.pomodoro.customSeconds = 0;
    entry.pomodoro.target = null;
    entry.pomodoro.remaining = POMODORO_PHASES[entry.pomodoro.phase].seconds;
    entry.el.classList.add("is-phase-finished");
    clearTimeout(entry.pomodoro.flashTimer);
    entry.pomodoro.flashTimer = setTimeout(() => {
      if (!entry.el.isConnected) return;
      entry.el.classList.remove("is-phase-finished");
    }, 1700);
    renderPomodoro(entry);

    showLayerToast(
      completed === "focus"
        ? finishedTarget
          ? `「${finishedTarget.name}」专注完成，休息 5 分钟吧。`
          : "专注结束，休息 5 分钟吧。"
        : "休息结束，开始下一轮专注吧。"
    );
  }

  function startPomodoro(entry) {
    if (!entry || !entry.pomodoro || entry.pomodoro.running) return;

    const total = getPomodoroTotalSeconds(entry.pomodoro);
    if (entry.pomodoro.remaining <= 0) entry.pomodoro.remaining = total;

    if (!entry.pomodoro.sessionStartedAt) {
      entry.pomodoro.sessionStartedAt = new Date().toISOString();
    }

    entry.pomodoro.running = true;
    setPomodoroFocusMode(entry, entry.pomodoro.phase === "focus");

    if (entry.pomodoro.phase === "focus") {
      api.recordAchievementEvent("pomodoro-start", {
        running: true,
        startedAt: entry.pomodoro.sessionStartedAt
      }).catch(() => {});
    }

    clearInterval(entry.pomodoro.timer);
    entry.pomodoro.timer = setInterval(() => {
      if (!entry.el.isConnected) {
        stopPomodoroTimer(entry);
        return;
      }

      entry.pomodoro.remaining -= 1;

      if (entry.pomodoro.remaining <= 0) {
        finishPomodoro(entry);
        return;
      }

      renderPomodoro(entry);
    }, 1000);

    renderPomodoro(entry);
  }

  function togglePomodoro(entry) {
    if (!entry || !entry.pomodoro) return;

    if (entry.pomodoro.running) {
      stopPomodoroTimer(entry);
      setPomodoroFocusMode(entry, false);
      api.recordAchievementEvent("pomodoro-running", {
        running: false
      }).catch(() => {});
      renderPomodoro(entry);
      return;
    }

    startPomodoro(entry);
  }

  function resetPomodoro(entry) {
    if (!entry || !entry.pomodoro) return;
    stopPomodoroTimer(entry);
    setPomodoroFocusMode(entry, false);
    entry.pomodoro.sessionStartedAt = null;
    entry.pomodoro.remaining = getPomodoroTotalSeconds(entry.pomodoro);
    renderPomodoro(entry);
  }

  function startCalendarTicker() {
    if (calendarTimer !== null) return;

    calendarTimer = setInterval(() => {
      const now = new Date();
      const key = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
      if (key === calendarDayKey) return;
      updateCalendars();
      updateClocks();
    }, 60000);
  }

  async function loadInitialState() {
    try {
      const [initialState] = await Promise.all([
        api.getState(),
        ensureComponentData()
      ]);
      applyState(initialState);
    } catch (error) {
      showLayerToast("无法读取桌面层状态", { error: true });
    }
  }

  async function pullStateAfterFileChange() {
    const request = ++filesChangedRequest;

    try {
      const next = await api.getState();

      // A burst of watcher events can resolve out of order. Only the newest
      // pull is allowed to overwrite the layer.
      if (request !== filesChangedRequest) return;
      applyState(next);
    } catch (error) {
      // The regular desktop-layer:state push remains the fallback.
    }
  }

  api.onState(applyState);
  if (typeof api.onFilesChanged === "function") {
    api.onFilesChanged(pullStateAfterFileChange);
  }
  const handlePrivacyPayload = (payload) => {
    // 兼容主进程的两种字段名，避免 IPC 载荷漂移导致防窥失效。
    const active = payload && typeof payload.active === "boolean"
      ? payload.active
      : Boolean(payload && payload.privacyActive);
    applyPrivacyMode(active, payload && payload.revision);
  };

  if (typeof api.onTogglePrivacy === "function") {
    api.onTogglePrivacy(handlePrivacyPayload);
  }
  if (typeof api.onPrivacy === "function") {
    api.onPrivacy(handlePrivacyPayload);
  }
  // 监听整个 body：新增的桌面图标、分类卡片和小组件内容都要立刻打码。
  new MutationObserver(schedulePrivacyMask).observe(document.body, {
    childList: true,
    subtree: true
  });
  api.onMusicUpdate(applyMusicPayload);
  // 主界面「待办管理页」增删改后同步回桌面组件与日历圆点。
  if (typeof api.onTodosChanged === "function") {
    api.onTodosChanged((payload) => {
      if (!payload || !Array.isArray(payload.todos)) return;
      if (componentData) componentData.todos = payload.todos;
      refreshTodoSurfaces();
    });
  }
  api.onExternalDropResult((result) => {
    if (!result) return;

    if (result.transfer) {
      handleTransferResult(
        result.transfer,
        result,
        widgets.get(result.transfer)
      );
      setTimeout(() => clearAllFileDragVisuals(), 0);
      return;
    }

    if (result.pomodoro) {
      const pomodoroEntry = widgets.get("pomodoro");

      if (pomodoroEntry) {
        applyPomodoroAnalysis(pomodoroEntry, result.analysis);
      }

      setTimeout(() => clearAllFileDragVisuals(), 0);
      return;
    }

    if (result.group) {
      const groupEntry = groups.get(result.groupId);

      if (result.ok && result.count > 0) {
        if (groupEntry && result.categoryKey) {
          activateGroupTab(groupEntry, result.categoryKey, { persist: true });
        }

        showLayerToast(`已按类型归入标签组：${result.count} 个文件`);
      } else {
        showLayerToast(
          result.error || "没有文件加入标签组",
          { error: true }
        );
      }

      setTimeout(() => clearAllFileDragVisuals(), 0);
      return;
    }

    if (result.ok && result.count > 0) {
      if (result.quick) {
        showLayerToast(`已加入 ${result.count} 个文件到快速收纳`);
      } else if (result.categoryKey) {
        showCategoryToast(
          result.categoryKey,
          `已移入 ${result.count} 个文件`
        );
      }
    } else if (result.error) {
      if (result.categoryKey) {
        showCategoryToast(result.categoryKey, result.error);
      } else {
        showLayerToast(result.error, { error: true });
      }
    } else if (result.quick && result.count === 0) {
      const reason = Array.isArray(result.skipped) && result.skipped[0]
        ? result.skipped[0].reason
        : "没有可加入的文件。";
      showLayerToast(reason, { error: true });
    }

    // A drop from Explorer/another app does not always produce dragend in
    // this renderer, so explicitly restore the category expansion and layer.
    setTimeout(() => clearAllFileDragVisuals(), 0);
  });

  if (typeof api.onNotesUpdated === "function") {
    api.onNotesUpdated(async () => {
      const noteEntry = widgets.get("notes");
      await refreshComponentDataFromMain();
      if (noteEntry) {
        syncNotesInput(noteEntry);
        await loadNoteEntries(noteEntry);
      }
    });
  }

  if (typeof api.onToast === "function") {
    api.onToast((payload) => {
      if (!payload || !payload.message) return;
      showLayerToast(payload.message, { error: Boolean(payload.error) });
    });
  }

  async function refreshComponentDataFromMain() {
    try {
      const result = await api.getWidgetData();
      if (!result || result.ok !== true) return;
      componentData = {
        notesText: typeof result.notesText === "string" ? result.notesText : "",
        todos: Array.isArray(result.todos) ? result.todos : []
      };
    } catch (error) {
      // Keep the current in-memory data when a refresh fails.
    }
  }

  systemThemeMedia.addEventListener("change", updateAllThemes);
  window.addEventListener("resize", () => {
    reportDesktopIconRects();
    scheduleClockFit();
    positionAchievementToast();
  });
  window.addEventListener("drop", () => {
    setTimeout(clearAllFileDragVisuals, 0);
  }, true);
  window.addEventListener("drop", (event) => {
    if (!fileDrag || !isDesktopDropSurface(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    dropDraggedFilesOnDesktop(event);
  });
  window.addEventListener("dragover", (event) => {
    if (!isFileDragEvent(event)) return;
    scheduleFileDragIdleCleanup();

    if (!fileDrag) return;

    const widget = event.target && event.target.closest
      ? event.target.closest(".desktop-widget")
      : null;
    const icon = event.target && event.target.closest
      ? event.target.closest(".desktop-icon")
      : null;
    const unsupportedWidget = Boolean(
      widget &&
      !widget.classList.contains("category-widget") &&
      !widget.classList.contains("quick-widget") &&
      !widget.classList.contains("pomodoro-widget") &&
      !widget.classList.contains("tab-group-widget") &&
      !widget.classList.contains("note-widget") &&
      !widget.classList.contains("todo-widget") &&
      !widget.classList.contains("search-widget")
    );
    const unsupportedIcon = Boolean(
      icon && icon.dataset.fileKind !== "folder"
    );
    const allowed = !unsupportedWidget && !unsupportedIcon;

    document.body.classList.toggle("is-drop-forbidden", !allowed);

    if (!allowed) {
      if (event.dataTransfer) event.dataTransfer.dropEffect = "none";
      return;
    }

    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  }, true);

  window.addEventListener("keydown", (event) => {
    if (fileDrag && event.key === "Escape") {
      fileDrag.canceled = true;
    }
  }, true);

  window.addEventListener("keydown", (event) => {
    const target = event.target;

    if (
      target &&
      target.closest &&
      target.closest("input, textarea, [contenteditable='true']")
    ) {
      return;
    }

    if (!(event.ctrlKey || event.metaKey) || event.repeat) return;

    const key = String(event.key || "").toLowerCase();

    if (key === "c" || key === "x") {
      const paths = selectedFilePaths.size > 0
        ? [...selectedFilePaths]
        : lastClickedFilePath
          ? [lastClickedFilePath]
          : [];

      if (paths.length === 0) return;

      event.preventDefault();
      event.stopPropagation();

      setFileClipboardWithFeedback(paths, key === "x" ? "cut" : "copy");
      api.recordAchievementEvent("grid-copy-paste", { count: 1 })
        .catch(() => {});
      return;
    }

    if (key === "v") {
      event.preventDefault();
      event.stopPropagation();

      const categoryKey = getCategoryKeyAtPoint(lastPointer);

      api.pasteFiles(categoryKey).then((result) => {
        if (!result || !result.ok) {
          showLayerToast(
            result && result.error ? result.error : "无法粘贴文件",
            { error: true }
          );
          return;
        }

        api.recordAchievementEvent("grid-copy-paste", { count: 1 })
          .catch(() => {});

        const copiedCount = Array.isArray(result.copied)
          ? result.copied.length
          : 0;
        const skippedCount = Array.isArray(result.skipped)
          ? result.skipped.length
          : 0;
        const errorCount = Array.isArray(result.errors)
          ? result.errors.length
          : 0;

        if (copiedCount > 0) {
          showLayerToast(
            `已粘贴 ${copiedCount} 个文件${skippedCount ? `，跳过 ${skippedCount} 个` : ""}${errorCount ? `，${errorCount} 个失败` : ""}`
          );
        } else if (errorCount > 0) {
          showLayerToast("粘贴文件失败", { error: true });
        } else if (skippedCount > 0) {
          showLayerToast("同名文件已跳过", { error: true });
        }
      }).catch(() => {
        showLayerToast("无法粘贴文件", { error: true });
      });
    }
  }, true);

  window.addEventListener("dragend", () => {
    // The cell-level handler normally covers this; this is a safety net for
    // re-rendered grids and interrupted native drags.
    finishFileDrag();
  }, true);

  // Clicking a child of Explorer's WorkerW gives the DOM text field focus,
  // but Windows' foreground queue still belongs to Explorer. Ask the main
  // process to bridge native focus to the embedded layer while editing.
  let lastFocusRequest = 0;

  function requestInputFocus() {
    const now = Date.now();
    if (now - lastFocusRequest < 160) return;
    lastFocusRequest = now;
    Promise.resolve(api.focusInput()).catch(() => {});
  }

  document.addEventListener("pointerdown", (event) => {
    const field = event.target && event.target.closest
      ? event.target.closest("input[type='text'], textarea")
      : null;

    if (field) requestInputFocus();
  }, true);

  document.addEventListener("focusin", (event) => {
    const field = event.target && event.target.closest
      ? event.target.closest("input[type='text'], textarea")
      : null;

    if (!field) return;
    requestInputFocus();
  }, true);

  document.addEventListener("focusout", (event) => {
    const field = event.target && event.target.closest
      ? event.target.closest("input[type='text'], textarea")
      : null;

    if (!field) return;

    setTimeout(() => {
      const active = document.activeElement;
      const stillEditing = active && active.matches &&
        active.matches("input[type='text'], textarea");

      if (!stillEditing) api.releaseInput();
    }, 0);
  }, true);

  window.addEventListener("blur", () => {
    api.releaseInput();
    closeComponentMenu();
    closeTextInputDialog();

    for (const entry of categories.values()) {
      entry.moving = false;
      entry.resizing = false;
      entry.el.classList.remove("is-moving", "is-resizing");
    }
    for (const entry of groups.values()) {
      entry.moving = false;
      entry.resizing = false;
      entry.el.classList.remove("is-moving", "is-resizing", "is-tab-merge-target");
    }
    for (const entry of widgets.values()) {
      entry.moving = false;
      entry.resizing = false;
      entry.el.classList.remove("is-moving", "is-resizing");
      if (entry.notes && entry.notes.dirty) flushNotes(entry);
    }
    document.body.classList.remove("is-moving", "is-file-dragging", "is-resizing");
    finishFileDrag();
    clearAllFileDragVisuals();
    holds.clear();
    api.setInteractionActive(false);
    setPassthrough(true);
  });

  async function loadCustomIconPack() {
    if (typeof api.getIconPack !== "function") return;
    try {
      const pack = await api.getIconPack();
      if (pack && pack.ok) {
        customIconPack = {
          name: typeof pack.name === "string" ? pack.name : "",
          icons: pack.icons && typeof pack.icons === "object" ? pack.icons : {}
        };
      }
    } catch (error) {
      // Use built-in SVG icons.
    }
  }

  if (typeof api.onIconPackChanged === "function") {
    api.onIconPackChanged(() => {
      window.location.reload();
    });
  }

  /* Desktop onboarding ---------------------------------------------------- */

  function tourDelay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function tourNextFrame() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  }

  async function waitForTour(condition, timeout = 1000) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeout) {
      try {
        if (condition()) return true;
      } catch (error) {
        // Keep waiting for the next renderer state.
      }

      await tourDelay(35);
    }

    try {
      return Boolean(condition());
    } catch (error) {
      return false;
    }
  }

  function clampTourValue(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function buildTourProgress() {
    if (!tourProgress || tourProgress.childElementCount === ONBOARDING_STEPS.length) {
      return;
    }

    const dots = ONBOARDING_STEPS.map(() => document.createElement("span"));
    tourProgress.replaceChildren(...dots);
  }

  function updateTourProgress() {
    if (!tourProgress) return;

    Array.from(tourProgress.children).forEach((dot, index) => {
      dot.classList.toggle("is-active", index === tourStepIndex);
    });
  }

  function pickTourCategoryKey() {
    const entries = [...categories.values()].filter(
      (entry) => entry && entry.el && entry.el.isConnected && entry.data
    );
    const withFiles = entries.find(
      (entry) => entry.el.querySelector(".file-cell")
    );
    return (withFiles || entries[0])?.data?.key || "";
  }

  function getTourCategoryEntry() {
    if (!tourCategoryKey) return null;

    const entry = categories.get(tourCategoryKey);
    return entry && entry.el && entry.el.isConnected ? entry : null;
  }

  async function ensureTourCategoryCollapsed() {
    const entry = getTourCategoryEntry();
    if (!entry) return null;

    if (!entry.data.collapsed) {
      try {
        await api.setCategoryCollapsed(entry.data.key, true);
      } catch (error) {
        // The fallback target below still keeps the tour usable.
      }

      await waitForTour(() => Boolean(
        getTourCategoryEntry()?.data?.collapsed
      ), 1000);
    }

    return getTourCategoryEntry();
  }

  async function ensureTourPomodoro() {
    const visible = widgets.get("pomodoro");
    if (visible && visible.el && visible.el.isConnected) return visible.el;

    if (!tourPomodoroRequested && typeof api.prepareOnboardingWidget === "function") {
      tourPomodoroRequested = true;

      try {
        await api.prepareOnboardingWidget("pomodoro");
      } catch (error) {
        // Use the demo card below when the real component cannot be shown.
      }

      await waitForTour(() => {
        const entry = widgets.get("pomodoro");
        return Boolean(entry && entry.el && entry.el.isConnected);
      }, 1300);
    }

    const entry = widgets.get("pomodoro");
    return entry && entry.el && entry.el.isConnected ? entry.el : null;
  }

  function collectTourObstacles() {
    const rects = [];

    for (const entry of [...categories.values(), ...groups.values(), ...widgets.values()]) {
      if (!entry || !entry.el || !entry.el.isConnected) continue;

      const rect = entry.el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;

      rects.push({
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom
      });
    }

    for (const cell of desktopIconLayer.querySelectorAll(".desktop-icon")) {
      const rect = cell.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;

      rects.push({
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom
      });
    }

    return rects;
  }

  function tourRectOverlapArea(candidate, obstacles) {
    let total = 0;

    for (const obstacle of obstacles) {
      const width = Math.max(0, Math.min(candidate.right, obstacle.right) -
        Math.max(candidate.left, obstacle.left));
      const height = Math.max(0, Math.min(candidate.bottom, obstacle.bottom) -
        Math.max(candidate.top, obstacle.top));
      total += width * height;
    }

    return total;
  }

  function findBlankTourRect(width, height) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const safeWidth = Math.min(width, viewportWidth - 48);
    const safeHeight = Math.min(height, viewportHeight - 48);

    if (safeWidth <= 0 || safeHeight <= 0) return null;

    const margin = 24;
    const step = Math.max(32, Math.round(Math.min(safeWidth, safeHeight) / 5));
    const obstacles = collectTourObstacles();
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;
    let best = null;

    for (let top = margin; top <= viewportHeight - safeHeight - margin; top += step) {
      for (let left = margin; left <= viewportWidth - safeWidth - margin; left += step) {
        const candidate = {
          left,
          top,
          width: safeWidth,
          height: safeHeight,
          right: left + safeWidth,
          bottom: top + safeHeight
        };
        const overlap = tourRectOverlapArea(candidate, obstacles);
        const distance = Math.abs(
          left + safeWidth / 2 - centerX
        ) + Math.abs(top + safeHeight / 2 - centerY);
        const score = overlap * 1000 + distance;

        if (!best || score < best.score) {
          best = { ...candidate, score };
        }

        if (overlap === 0 && distance < 220) {
          return candidate;
        }
      }
    }

    return best;
  }

  function createDemoTourTarget(kind) {
    const content = {
      category: { icon: "🗂", title: "整理分类", caption: "悬停展开" },
      file: { icon: "📄", title: "旧文件.jpg", caption: "30 天未打开" },
      pomodoro: { icon: "🍅", title: "番茄钟", caption: "专注时间" },
      achievement: { icon: "🏆", title: "成就图鉴", caption: "81 枚彩蛋 · 等你发掘" },
      search: { icon: "⌕", title: "全局搜索", caption: "Ctrl+Alt+S" }
    }[kind] || { icon: "📄", title: "示例组件", caption: "方寸格" };

    const icon = document.createElement("span");
    icon.className = "tour-demo-icon";
    icon.textContent = content.icon;

    const title = document.createElement("span");
    title.className = "tour-demo-title";
    title.textContent = content.title;

    const caption = document.createElement("span");
    caption.className = "tour-demo-caption";
    caption.textContent = content.caption;

    tourDemoTarget.dataset.kind = kind;
    tourDemoTarget.replaceChildren(icon, title, caption);
    tourDemoTarget.hidden = false;

    const width = tourDemoTarget.offsetWidth || 138;
    const height = tourDemoTarget.offsetHeight || 118;
    let left = Math.round((window.innerWidth - width) / 2);
    let top = Math.round((window.innerHeight - height) / 2);

    if (kind !== "search") {
      const blank = findBlankTourRect(width + 24, height + 24);
      if (blank) {
        left = blank.left + Math.round((blank.width - width) / 2);
        top = blank.top + Math.round((blank.height - height) / 2);
      }
    }

    tourDemoTarget.style.left = `${Math.max(12, left)}px`;
    tourDemoTarget.style.top = `${Math.max(12, top)}px`;

    return tourDemoTarget;
  }

  function getTourTargetElements(target) {
    if (!target) return [];

    const elements = Array.isArray(target.els)
      ? target.els
      : target.el
        ? [target.el]
        : [];

    return elements.filter((element) => (
      element && element.isConnected
    ));
  }

  function resetTourTarget() {
    document.querySelectorAll(".is-onboarding-highlight").forEach((element) => {
      element.classList.remove("is-onboarding-highlight");
    });

    tourTarget = null;
    tourSpotRect = null;
    tourLastLayoutSignature = "";
    tourDemoTarget.hidden = true;
    tourSpotlight.hidden = true;
  }

  function getTourTargetRect(target) {
    if (!target) return null;

    if (target.blankRect) {
      if (!target.blankWidth || !target.blankHeight) return target.blankRect;
      return findBlankTourRect(target.blankWidth, target.blankHeight);
    }

    const rects = getTourTargetElements(target)
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);

    if (rects.length === 0) return null;

    return rects.reduce((union, rect) => ({
      left: Math.min(union.left, rect.left),
      top: Math.min(union.top, rect.top),
      right: Math.max(union.right, rect.right),
      bottom: Math.max(union.bottom, rect.bottom),
      width: Math.max(union.right, rect.right) - Math.min(union.left, rect.left),
      height: Math.max(union.bottom, rect.bottom) - Math.min(union.top, rect.top)
    }));
  }

  function padTourRect(rect, padding) {
    const left = clampTourValue(rect.left - padding, 0, window.innerWidth);
    const top = clampTourValue(rect.top - padding, 0, window.innerHeight);
    const right = clampTourValue(rect.right + padding, 0, window.innerWidth);
    const bottom = clampTourValue(rect.bottom + padding, 0, window.innerHeight);

    if (right - left < 2 || bottom - top < 2) return null;

    return {
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top
    };
  }

  function updateTourMasks(spot) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (!spot) {
      Object.assign(tourMasks.top.style, {
        top: "0px",
        left: "0px",
        width: `${viewportWidth}px`,
        height: `${viewportHeight}px`
      });
      for (const key of ["right", "bottom", "left"]) {
        Object.assign(tourMasks[key].style, {
          top: "0px",
          left: "0px",
          width: "0px",
          height: "0px"
        });
      }
      return;
    }

    Object.assign(tourMasks.top.style, {
      top: "0px",
      left: "0px",
      width: `${viewportWidth}px`,
      height: `${Math.max(0, spot.top)}px`
    });
    Object.assign(tourMasks.left.style, {
      top: `${spot.top}px`,
      left: "0px",
      width: `${Math.max(0, spot.left)}px`,
      height: `${spot.height}px`
    });
    Object.assign(tourMasks.right.style, {
      top: `${spot.top}px`,
      left: `${spot.right}px`,
      width: `${Math.max(0, viewportWidth - spot.right)}px`,
      height: `${spot.height}px`
    });
    Object.assign(tourMasks.bottom.style, {
      top: `${spot.bottom}px`,
      left: "0px",
      width: `${viewportWidth}px`,
      height: `${Math.max(0, viewportHeight - spot.bottom)}px`
    });
  }

  function positionTourCard(spot) {
    if (!tourCard) return;

    const isWelcome = tourStepIndex === 0;
    tourCard.classList.toggle("is-welcome", isWelcome);

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 20;
    const gap = 28;
    const cardRect = tourCard.getBoundingClientRect();
    const cardWidth = Math.min(cardRect.width, viewportWidth - margin * 2);
    const cardHeight = Math.min(cardRect.height, viewportHeight - margin * 2);

    if (isWelcome || !spot) {
      tourCard.style.left = `${Math.round((viewportWidth - cardWidth) / 2)}px`;
      tourCard.style.top = `${Math.round((viewportHeight - cardHeight) / 2)}px`;
      return;
    }

    const centeredTop = clampTourValue(
      spot.top + (spot.height - cardHeight) / 2,
      margin,
      Math.max(margin, viewportHeight - cardHeight - margin)
    );
    const centeredLeft = clampTourValue(
      spot.left + (spot.width - cardWidth) / 2,
      margin,
      Math.max(margin, viewportWidth - cardWidth - margin)
    );
    const candidates = [
      {
        left: spot.right + gap,
        top: centeredTop
      },
      {
        left: spot.left - gap - cardWidth,
        top: centeredTop
      },
      {
        left: centeredLeft,
        top: spot.bottom + gap
      },
      {
        left: centeredLeft,
        top: spot.top - gap - cardHeight
      },
      {
        left: margin,
        top: margin
      },
      {
        left: viewportWidth - cardWidth - margin,
        top: margin
      },
      {
        left: margin,
        top: viewportHeight - cardHeight - margin
      },
      {
        left: viewportWidth - cardWidth - margin,
        top: viewportHeight - cardHeight - margin
      }
    ].map((candidate) => ({
      ...candidate,
      left: clampTourValue(
        candidate.left,
        margin,
        Math.max(margin, viewportWidth - cardWidth - margin)
      ),
      top: clampTourValue(
        candidate.top,
        margin,
        Math.max(margin, viewportHeight - cardHeight - margin)
      )
    }));

    let chosen = candidates[0];
    let bestOverlap = Number.POSITIVE_INFINITY;

    for (const candidate of candidates) {
      const overlap = tourRectOverlapArea({
        left: candidate.left,
        top: candidate.top,
        right: candidate.left + cardWidth,
        bottom: candidate.top + cardHeight
      }, [spot]);

      if (overlap < bestOverlap) {
        bestOverlap = overlap;
        chosen = candidate;
      }

      if (overlap === 0) break;
    }

    tourCard.style.left = `${Math.round(chosen.left)}px`;
    tourCard.style.top = `${Math.round(chosen.top)}px`;
  }

  function applyTourTarget(target) {
    resetTourTarget();
    tourTarget = target;

    if (!target) {
      updateTourMasks(null);
      positionTourCard(null);
      return;
    }

    for (const element of getTourTargetElements(target)) {
      element.classList.add("is-onboarding-highlight");
    }

    if (getTourTargetElements(target).includes(tourDemoTarget)) {
      tourDemoTarget.hidden = false;
    }

    const rawRect = getTourTargetRect(target);

    if (!rawRect) {
      updateTourMasks(null);
      positionTourCard(null);
      scheduleTourRetarget();
      return;
    }

    const spot = padTourRect(rawRect, target.padding ?? 10);

    if (!spot) {
      updateTourMasks(null);
      positionTourCard(null);
      return;
    }

    tourSpotRect = spot;
    tourSpotlight.hidden = false;
    tourSpotlight.style.setProperty(
      "--tour-radius",
      `${target.radius ?? 18}px`
    );
    Object.assign(tourSpotlight.style, {
      left: `${spot.left}px`,
      top: `${spot.top}px`,
      width: `${spot.width}px`,
      height: `${spot.height}px`
    });
    updateTourMasks(spot);
    positionTourCard(spot);
  }

  function tourLayoutSignature() {
    const rect = tourSpotRect
      ? [
        Math.round(tourSpotRect.left),
        Math.round(tourSpotRect.top),
        Math.round(tourSpotRect.width),
        Math.round(tourSpotRect.height)
      ].join(":")
      : "none";

    return [
      tourStepIndex,
      window.innerWidth,
      window.innerHeight,
      rect,
      tourActive ? "on" : "off"
    ].join("|");
  }

  function refreshTourLayout() {
    if (!tourActive || !tourTarget) {
      if (tourActive) {
        positionTourCard(null);
      }
      return;
    }

    const rawRect = getTourTargetRect(tourTarget);

    if (!rawRect) {
      updateTourMasks(null);
      tourSpotlight.hidden = true;
      tourSpotRect = null;
      positionTourCard(null);
      scheduleTourRetarget();
      return;
    }

    const spot = padTourRect(rawRect, tourTarget.padding ?? 10);

    if (!spot) return;

    tourSpotRect = spot;

    if (tourLayoutSignature() === tourLastLayoutSignature) return;
    tourLastLayoutSignature = tourLayoutSignature();

    Object.assign(tourSpotlight.style, {
      left: `${spot.left}px`,
      top: `${spot.top}px`,
      width: `${spot.width}px`,
      height: `${spot.height}px`
    });
    updateTourMasks(spot);
    positionTourCard(spot);
  }

  function pickTourTitleTargets(limit = 2) {
    const entries = [...categories.values()]
      .filter((entry) => (
        entry &&
        entry.el &&
        entry.el.isConnected &&
        entry.dragbar
      ))
      .sort((left, right) => {
        const leftHasFiles = Boolean(left.el.querySelector(".file-cell"));
        const rightHasFiles = Boolean(right.el.querySelector(".file-cell"));
        return Number(rightHasFiles) - Number(leftHasFiles);
      });

    return entries
      .slice(0, limit)
      .map((entry) => entry.dragbar)
      .filter((dragbar) => dragbar.isConnected);
  }

  function isVisibleTourElement(element) {
    if (!element || !element.isConnected) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function findVisibleTourTimeCapsuleCell(entry) {
    return [...entry.el.querySelectorAll(".file-cell.is-time-capsule")]
      .find((cell) => isVisibleTourElement(cell)) || null;
  }

  async function ensureTourTimeCapsuleTarget() {
    const desktopIcon = [...desktopIconLayer.querySelectorAll(".desktop-icon.is-time-capsule")]
      .find((cell) => isVisibleTourElement(cell));

    if (desktopIcon) {
      return { el: desktopIcon, padding: 7, radius: 12 };
    }

    const entries = [...categories.values()]
      .filter((entry) => (
        entry &&
        entry.el &&
        entry.el.isConnected &&
        Array.isArray(entry.data?.files) &&
        entry.data.files.some((file) => isTimeCapsuleCell(file))
      ));

    for (const entry of entries) {
      if (entry.data.collapsed) {
        if (!tourExpandedCategoryStates.has(entry.data.key)) {
          tourExpandedCategoryStates.set(
            entry.data.key,
            entry.data.key === tourCategoryKey
              ? Boolean(tourCategoryOriginalCollapsed)
              : true
          );
        }

        try {
          await api.setCategoryCollapsed(entry.data.key, false);
        } catch (error) {
          // Continue with the collapsed card so the step still has a target.
        }

        await waitForTour(() => {
          const current = categories.get(entry.data.key);
          return Boolean(current && !current.data.collapsed);
        }, 1000);
        await tourNextFrame();
      }

      if (tourStepIndex !== 5) return null;

      const cell = findVisibleTourTimeCapsuleCell(entry);

      if (cell) {
        tourKeepExpandedCategoryKey = entry.data.key;
        clearTimeout(entry.collapseTimer);

        try {
          cell.scrollIntoView({ block: "nearest", inline: "nearest" });
        } catch (error) {
          // The file is already visible.
        }

        await tourNextFrame();
        return { el: cell, padding: 7, radius: 12 };
      }
    }

    return null;
  }

  async function resolveTourTarget(index) {
    const categoryTarget = (entry, radius) => ({
      el: entry.el,
      padding: 10,
      radius
    });

    if (index === 0) return null;

    if (index === 1) {
      const targets = pickTourTitleTargets(2);

      if (targets.length > 1) {
        return { els: targets, padding: 8, radius: 10 };
      }

      if (targets.length === 1) {
        return { el: targets[0], padding: 8, radius: 10 };
      }

      return { el: createDemoTourTarget("category"), padding: 10, radius: 18 };
    }

    if (index === 2) {
      const pomodoro = await ensureTourPomodoro();
      return pomodoro
        ? { el: pomodoro, padding: 10, radius: 18 }
        : { el: createDemoTourTarget("pomodoro"), padding: 10, radius: 18 };
    }

    if (index === 3) {
      const blank = findBlankTourRect(360, 236);
      return blank
        ? {
          blankRect: blank,
          blankWidth: 360,
          blankHeight: 236,
          padding: 0,
          radius: 24
        }
        : null;
    }

    if (index === 4) {
      const entry = await ensureTourCategoryCollapsed();
      return entry
        ? categoryTarget(entry, 18)
        : { el: createDemoTourTarget("category"), padding: 10, radius: 18 };
    }

    if (index === 5) {
      const target = await ensureTourTimeCapsuleTarget();
      return target ||
        { el: createDemoTourTarget("file"), padding: 10, radius: 16 };
    }

    if (index === 6) {
      return {
        el: createDemoTourTarget("achievement"),
        padding: 12,
        radius: 20
      };
    }

    return {
      el: createDemoTourTarget("search"),
      padding: 10,
      radius: 18
    };
  }

  function reportTourStep() {
    if (typeof api.reportOnboardingStep !== "function") return;

    try {
      api.reportOnboardingStep(tourStepIndex);
    } catch (error) {
      // Persisting the tour position is best effort.
    }
  }

  function scheduleTourRetarget() {
    if (!tourActive || tourRetargetTimer !== null) return;

    const token = tourApplyToken;

    tourRetargetTimer = setTimeout(() => {
      tourRetargetTimer = null;

      if (!tourActive || token !== tourApplyToken) return;

      applyTourStep(tourStepIndex);
    }, 180);
  }

  async function applyTourStep(index) {
    if (!tourActive) return;

    const token = ++tourApplyToken;
    const step = ONBOARDING_STEPS[index] || ONBOARDING_STEPS[0];

    tourStepIndex = index;
    tourKeepExpandedCategoryKey = "";

    clearTimeout(tourRetargetTimer);
    tourRetargetTimer = null;
    tourPrevButton.disabled = true;
    tourNextButton.disabled = true;
    tourTitle.textContent = step.title;
    tourCopy.textContent = step.copy;
    tourCounter.textContent =
      `${String(index + 1).padStart(2, "0")} / ${String(ONBOARDING_STEPS.length).padStart(2, "0")}`;
    tourNextButton.textContent = step.nextLabel;
    tourPrevButton.hidden = index === 0;
    updateTourProgress();
    tourCard.classList.toggle("is-welcome", Boolean(step.welcome));

    resetTourTarget();
    updateTourMasks(null);
    positionTourCard(null);
    reportTourStep();

    let target = null;

    try {
      target = await resolveTourTarget(index);
    } catch (error) {
      console.warn("[onboarding] 无法定位引导目标:", error);
    }

    if (!tourActive || token !== tourApplyToken) {
      if (getTourTargetElements(target).includes(tourDemoTarget)) {
        tourDemoTarget.hidden = true;
      }
      return;
    }

    await tourNextFrame();

    if (!tourActive || token !== tourApplyToken) return;

    applyTourTarget(target);
    tourPrevButton.disabled = false;
    tourNextButton.disabled = false;

    try {
      tourCard.focus({ preventScroll: true });
    } catch (error) {
      // Keyboard focus is optional in the WorkerW child window.
    }
  }

  async function finishDesktopTour({ completed = true } = {}) {
    if (!tourActive) return;

    const categoryKey = tourCategoryKey;
    const restoreCollapsed = tourCategoryOriginalCollapsed;
    const expandedCategories = [...tourExpandedCategoryStates];
    const finishedStep = tourStepIndex;

    tourActive = false;
    tourApplyToken += 1;
    clearInterval(tourLayoutTimer);
    tourLayoutTimer = null;
    clearTimeout(tourRetargetTimer);
    tourRetargetTimer = null;
    tourKeepExpandedCategoryKey = "";
    tourPrevButton.disabled = false;
    tourNextButton.disabled = false;

    if (tourResizeHandler) {
      window.removeEventListener("resize", tourResizeHandler);
      tourResizeHandler = null;
    }

    resetTourTarget();
    desktopTour.hidden = true;
    tourCategoryKey = "";
    tourCategoryOriginalCollapsed = null;
    tourPomodoroRequested = false;
    tourExpandedCategoryStates.clear();

    if (categoryKey && restoreCollapsed !== null) {
      try {
        await api.setCategoryCollapsed(categoryKey, restoreCollapsed);
      } catch (error) {
        // The category can be restored on the next state broadcast.
      }
    }

    for (const [key, collapsed] of expandedCategories) {
      if (key === categoryKey) continue;

      try {
        await api.setCategoryCollapsed(key, collapsed);
      } catch (error) {
        // The category can be restored on the next state broadcast.
      }
    }

    try {
      await api.setInteractionActive(false);
    } catch (error) {
      // Main also clears the tour interaction flag on finish.
    }

    if (typeof api.finishOnboarding === "function") {
      try {
        await api.finishOnboarding({
          completed: Boolean(completed),
          step: finishedStep
        });
      } catch (error) {
        // The overlay is already dismissed; a retry is not useful here.
      }
    }

    try {
      api.setMousePassthrough(true);
    } catch (error) {
      // The main-process pointer watcher restores passthrough as a fallback.
    }
  }

  function advanceDesktopTour(delta) {
    if (!tourActive) return;

    const next = tourStepIndex + delta;

    if (next < 0) return;
    if (next >= ONBOARDING_STEPS.length) {
      finishDesktopTour({ completed: true });
      return;
    }

    applyTourStep(next);
  }

  function startDesktopTour(payload = {}) {
    if (tourActive) return;

    const requestedStep = Number.isFinite(Number(payload.step))
      ? Math.round(Number(payload.step))
      : 0;

    tourActive = true;
    tourStepIndex = clampTourValue(requestedStep, 0, ONBOARDING_STEPS.length - 1);
    tourApplyToken = 0;
    tourTarget = null;
    tourSpotRect = null;
    tourLastLayoutSignature = "";
    tourCategoryKey = pickTourCategoryKey();
    tourCategoryOriginalCollapsed = getTourCategoryEntry()
      ? Boolean(getTourCategoryEntry().data.collapsed)
      : null;
    tourExpandedCategoryStates.clear();
    tourPomodoroRequested = false;

    closeComponentMenu();
    buildTourProgress();
    desktopTour.hidden = false;

    try {
      api.setInteractionActive(true);
    } catch (error) {
      // Repeated while the tour is active by the main-process pointer watcher.
    }

    clearInterval(tourLayoutTimer);
    tourLayoutTimer = setInterval(refreshTourLayout, 180);

    if (!tourResizeHandler) {
      tourResizeHandler = () => {
        tourLastLayoutSignature = "";
        refreshTourLayout();
      };
      window.addEventListener("resize", tourResizeHandler);
    }

    refreshTourLayout();
    applyTourStep(tourStepIndex);
  }

  function initializeAchievementExperience() {
    if (typeof api.onAchievementUnlocked === "function") {
      api.onAchievementUnlocked(enqueueAchievementToast);
    }

    if (typeof api.onShortcutFocus === "function") {
      api.onShortcutFocus(setShortcutFocusMode);
    }

    if (achievementToast) {
      achievementToast.addEventListener("mouseenter", pauseAchievementToast);
      achievementToast.addEventListener("mouseleave", resumeAchievementToast);
      achievementToast.addEventListener("focus", pauseAchievementToast);
      achievementToast.addEventListener("blur", resumeAchievementToast);
      achievementToast.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        hideAchievementToast();
      });
    }

    window.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        document.body.classList.contains("is-shortcut-focus-mode")
      ) {
        event.preventDefault();
        setShortcutFocusMode(false);
      }
    });
  }

  function initializeDesktopTour() {
    buildTourProgress();

    if (typeof api.onOnboardingStart === "function") {
      api.onOnboardingStart((payload) => {
        startDesktopTour(payload || {});
      });
    }

    tourSkipButton.addEventListener("click", () => {
      finishDesktopTour({ completed: true });
    });
    tourPrevButton.addEventListener("click", () => {
      advanceDesktopTour(-1);
    });
    tourNextButton.addEventListener("click", () => {
      advanceDesktopTour(1);
    });
    desktopTour.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });
    desktopTour.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
  }

  function initializeDesktopLocale() {
    const i18n = window.withinI18n;
    if (!i18n) return;

    const applyLocaleInfo = (info) => {
      if (!info) return;

      // 让“跟随系统”用的是 Electron 认定的系统语言，而不是渲染进程猜测的。
      if (info.systemLocale) {
        window.__WITHIN_SYSTEM_LOCALE__ = info.systemLocale;
      }

      if (info.preference) {
        i18n.syncLocale(info.preference);
      }
    };

    if (typeof api.getLocaleInfo === "function") {
      api.getLocaleInfo().then(applyLocaleInfo).catch(() => {});
    }

    // 主窗口切语言时，主进程会广播到这里，组件内部文字立即重译。
    if (typeof api.onLocaleChanged === "function") {
      api.onLocaleChanged(applyLocaleInfo);
    }
  }

  initializeAchievementExperience();
  initializeDesktopTour();
  initializeDesktopLocale();
  startClock();
  startCalendarTicker();
  loadCustomIconPack().finally(() => {
    loadInitialState().finally(() => {
      if (typeof api.notifyOnboardingReady === "function") {
        api.notifyOnboardingReady();
      }
    });
  });
})();
