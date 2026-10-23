"use strict";

(() => {
  const api = window.widgetApi;

  const els = {
    app: document.querySelector("#floatingApp"),
    widgetBg: document.querySelector("#widgetBg"),
    widgetBgImage: document.querySelector("#widgetBgImage"),
    clockPanel: document.querySelector("#clockPanel"),
    clockContent: document.querySelector("#clockContent"),
    clockTime: document.querySelector("#clockTime"),
    clockDate: document.querySelector("#clockDate"),
    clockWeekday: document.querySelector("#clockWeekday"),
    clockText: document.querySelector("#clockText"),
    musicPanel: document.querySelector("#musicPanel"),
    musicDisc: document.querySelector("#musicDisc"),
    musicTitle: document.querySelector("#musicTitle"),
    musicArtist: document.querySelector("#musicArtist"),
    musicSeek: document.querySelector("#musicSeek"),
    musicSeekFill: document.querySelector("#musicSeekFill"),
    musicCurrent: document.querySelector("#musicCurrent"),
    musicDuration: document.querySelector("#musicDuration"),
    musicPrev: document.querySelector("#musicPrev"),
    musicPlay: document.querySelector("#musicPlay"),
    musicNext: document.querySelector("#musicNext")
  };

  const systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");

  let widgetKey = "";
  let label = "小组件";
  let tint = "system";
  let customTint = "#2f6b4f";
  let frosted = true;
  let material = "css";
  let clockTimer = null;
  let clockTimeFormat = "hh/mm/ss";
  let clockDateFormat = "yyyy/mm/dd";
  let clockCustomText = "祝你开心！";
  let clockFitFrame = null;
  let musicStarted = false;
  let currentSession = null;
  let lastMusicPayload = null;
  let noticeUntil = 0;
  let noticeTimer = null;
  let backgroundUrl = "";
  let failedBackgroundUrl = "";

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

  function applyGlassAppearance() {
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

    els.app.classList.remove(...classes);

    let resolvedTint = tint;
    let theme = "light";

    if (tint === "system") {
      const dark = systemThemeMedia.matches;
      resolvedTint = dark ? "black" : "white";
      theme = dark ? "dark" : "light";
    } else if (tint === "black") {
      theme = "dark";
    } else if (tint === "custom") {
      theme = isDarkColor(customTint) ? "dark" : "light";
    }

    if (resolvedTint === "transparent") {
      theme = "light";
    }

    if (resolvedTint === "custom") {
      els.app.style.setProperty("--glass-tint", hexToRgba(customTint, 0.42));
    } else {
      els.app.style.removeProperty("--glass-tint");
    }

    els.app.classList.add(
      `theme-${theme}`,
      `tint-${resolvedTint}`,
      `material-${material}`
    );
    els.app.dataset.tint = resolvedTint;
    els.app.dataset.material = material;
  }

  function applyBackground(url) {
    const next = typeof url === "string" ? url : "";
    const changed = next !== backgroundUrl;
    backgroundUrl = next;

    if (!next) {
      failedBackgroundUrl = "";
      els.widgetBg.hidden = true;
      els.widgetBgImage.removeAttribute("src");
      els.app.classList.remove("has-bg");
      return;
    }

    if (changed || failedBackgroundUrl === next) {
      failedBackgroundUrl = "";
      els.widgetBgImage.src = next;
    }

    els.widgetBg.hidden = false;
    els.app.classList.add("has-bg");
  }

  function applyState(state) {
    if (!state || !state.ok) return;

    widgetKey = state.widgetKey || "";
    label = state.label || "小组件";
    tint = ["transparent", "white", "black", "system", "custom"].includes(state.tint)
      ? state.tint
      : "system";
    if (typeof state.customTint === "string") {
      customTint = state.customTint;
    }
    frosted = state.frosted !== false;
    material = state.material === "native" || state.material === "off"
      ? state.material
      : "css";

    if (!frosted) {
      material = "off";
    }

    document.title = label;
    document.documentElement.dataset.widgetKey = widgetKey;
    els.clockPanel.hidden = widgetKey !== "clock";
    els.musicPanel.hidden = widgetKey !== "music";

    if (widgetKey === "clock") {
      if (["hh/mm/ss", "hh/mm", "hh"].includes(state.timeFormat)) {
        clockTimeFormat = state.timeFormat;
      }
      if (["yyyy/mm/dd", "yyyy-mm-dd", "mm/dd", "yyyy"].includes(state.dateFormat)) {
        clockDateFormat = state.dateFormat;
      }
      if (typeof state.customText === "string") {
        clockCustomText = state.customText;
      }
    }

    applyGlassAppearance();
    applyBackground(state.backgroundImageUrl);

    if (widgetKey === "clock") {
      applyClockText();
      startClock();
      scheduleClockFit();
    } else if (widgetKey === "music") {
      startMusicWidget();
    }
  }

  function applyClockText() {
    els.clockText.textContent = clockCustomText;
    els.clockText.hidden = clockCustomText.trim() === "";
  }

  function formatClockTime(now) {
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    if (clockTimeFormat === "hh") return hours;
    if (clockTimeFormat === "hh/mm") return `${hours}:${minutes}`;
    return `${hours}:${minutes}:${seconds}`;
  }

  function formatClockDate(now) {
    const year = String(now.getFullYear()).padStart(4, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    if (clockDateFormat === "yyyy") return year;
    if (clockDateFormat === "mm/dd") return `${month}/${day}`;
    if (clockDateFormat === "yyyy-mm-dd") return `${year}-${month}-${day}`;
    return `${year}/${month}/${day}`;
  }

  function updateClock() {
    const now = new Date();
    const weekday = "日一二三四五六"[now.getDay()];

    els.clockTime.textContent = formatClockTime(now);
    els.clockDate.textContent = formatClockDate(now);
    els.clockWeekday.textContent = `星期${weekday}`;
  }

  function startClock() {
    updateClock();

    if (clockTimer === null) {
      clockTimer = setInterval(updateClock, 1000);
    }
  }

  function scheduleClockFit() {
    if (clockFitFrame !== null) return;

    clockFitFrame = requestAnimationFrame(() => {
      clockFitFrame = null;
      fitClockContent();
    });
  }

  function fitClockContent() {
    if (widgetKey !== "clock" || els.clockPanel.hidden) return;

    const content = els.clockContent;
    const body = els.clockPanel.parentElement;

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

  function formatTime(seconds) {
    const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const rest = total % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
    }

    return `${minutes}:${String(rest).padStart(2, "0")}`;
  }

  function setPlayingUI(playing) {
    els.musicDisc.classList.toggle("is-playing", playing);
    els.musicPlay.textContent = playing ? "⏸" : "▶";
    els.musicPlay.setAttribute("aria-label", playing ? "暂停" : "播放");
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

  function setControlState(session) {
    const playing = Boolean(session && session.playbackStatus === "playing");
    const buttons = [
      [els.musicPrev, "previous", "上一首"],
      [els.musicPlay, "playPause", playing ? "暂停" : "播放"],
      [els.musicNext, "next", "下一首"]
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

  function renderMusicSession(session) {
    currentSession = session;

    if (!session) {
      els.musicTitle.textContent = "当前无播放内容";
      els.musicTitle.title = "";
      els.musicArtist.textContent = "在任意播放器中开始播放后会自动显示";
      els.musicArtist.title = "";
      els.musicCurrent.textContent = "0:00";
      els.musicDuration.textContent = "0:00";
      els.musicSeekFill.style.width = "0%";
      els.musicSeek.setAttribute("aria-valuenow", "0");
      setPlayingUI(false);
      setControlState(null);
      return;
    }

    const title = session.title || "未知曲目";
    const artist = session.artist || session.app || "未知歌手";
    const position = Number(session.timeline && session.timeline.positionMs) || 0;
    const duration = Number(session.timeline && session.timeline.durationMs) || 0;
    const percent = duration > 0
      ? Math.max(0, Math.min(100, (position / duration) * 100))
      : 0;

    els.musicTitle.textContent = title;
    els.musicTitle.title = title;

    if (Date.now() >= noticeUntil) {
      els.musicArtist.textContent = artist;
      els.musicArtist.title = artist;
    }

    els.musicCurrent.textContent = formatTime(position / 1000);
    els.musicDuration.textContent = formatTime(duration / 1000);
    els.musicSeekFill.style.width = `${percent}%`;
    els.musicSeek.setAttribute("aria-valuenow", String(Math.round(percent)));

    setPlayingUI(session.playbackStatus === "playing");
    setControlState(session);
  }

  function showMusicError(message) {
    currentSession = null;

    els.musicTitle.textContent = "无法读取媒体会话";
    els.musicTitle.title = "";
    els.musicArtist.textContent = message || "未知错误";
    els.musicArtist.title = message || "";
    els.musicCurrent.textContent = "0:00";
    els.musicDuration.textContent = "0:00";
    els.musicSeekFill.style.width = "0%";
    els.musicSeek.setAttribute("aria-valuenow", "0");

    setPlayingUI(false);
    setControlState(null);
  }

  function showMusicNotice(text) {
    noticeUntil = Date.now() + 2500;

    els.musicArtist.textContent = text;
    els.musicArtist.title = text;

    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      noticeTimer = null;
      noticeUntil = 0;

      if (lastMusicPayload) {
        applyMusicPayload(lastMusicPayload);
      }
    }, 2500);
  }

  function applyMusicPayload(payload) {
    lastMusicPayload = payload;

    if (!payload || payload.ok !== true) {
      showMusicError(payload && payload.error);
      return;
    }

    if (!payload.session) {
      if (payload.error) {
        showMusicError(payload.error);
      } else {
        renderMusicSession(null);
      }
      return;
    }

    renderMusicSession(payload.session);

    if (payload.error) {
      els.musicArtist.textContent = `媒体会话异常：${payload.error}`;
      els.musicArtist.title = payload.error;
    }
  }

  async function startMusicWidget() {
    if (musicStarted) return;
    musicStarted = true;

    try {
      const payload = await api.getMusicSession();
      applyMusicPayload(payload);
    } catch (error) {
      showMusicError("无法读取媒体会话");
    }
  }

  async function sendMusicCommand(command) {
    if (!currentSession) return;

    if (!getCommandSupport(command, currentSession)) {
      showMusicNotice("当前播放器不支持此操作");
      return;
    }

    try {
      const result = await api.controlMusic(command);

      if (!result || !result.ok) {
        showMusicNotice(result && result.message ? result.message : "操作失败");
      }
    } catch (error) {
      showMusicNotice("操作失败");
    }
  }

  async function loadInitialState() {
    try {
      const state = await api.getData();
      applyState(state);
    } catch (error) {
      // 无法读取状态时保留默认外观
    } finally {
      api.ready();
    }
  }

  els.musicPrev.addEventListener("click", () => sendMusicCommand("previous"));
  els.musicNext.addEventListener("click", () => sendMusicCommand("next"));
  els.musicPlay.addEventListener("click", () => sendMusicCommand("playPause"));

  els.widgetBgImage.addEventListener("error", () => {
    failedBackgroundUrl = backgroundUrl;
    els.widgetBg.hidden = true;
    els.app.classList.remove("has-bg");
  });

  window.addEventListener("resize", () => {
    if (widgetKey === "clock") {
      scheduleClockFit();
    }
  });

  systemThemeMedia.addEventListener("change", () => {
    if (tint === "system") {
      applyGlassAppearance();
    }
  });

  api.onUpdate((state) => {
    applyState(state);
  });

  api.onMusicUpdate((payload) => {
    if (widgetKey === "music") {
      applyMusicPayload(payload);
    }
  });

  loadInitialState();
})();
