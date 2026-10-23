"use strict";

const MEDIA_COMMANDS = new Set(["playPause", "next", "previous"]);
const PROGRESS_TICK_MS = 1000;
const MAX_PROGRESS_STEP_MS = 3000;

// Windows 虚拟键码：媒体键由系统路由到当前的 SMTC 会话。
const MEDIA_KEY_CODES = {
  playPause: 0xb3,
  next: 0xb0,
  previous: 0xb1
};

const KEYEVENTF_EXTENDEDKEY = 0x0001;
const KEYEVENTF_KEYUP = 0x0002;

let mediaKeyApi = null;

function loadMediaKeyApi() {
  if (mediaKeyApi !== null) return mediaKeyApi;

  if (process.platform !== "win32") {
    mediaKeyApi = { available: false, reason: "当前系统不是 Windows" };
    return mediaKeyApi;
  }

  try {
    const koffi = require("koffi");
    const user32 = koffi.load("user32.dll");

    mediaKeyApi = {
      available: true,
      keybd_event: user32.func(
        "void keybd_event(uint8_t bVk, uint8_t bScan, uint32_t dwFlags, uintptr_t dwExtraInfo)"
      )
    };
  } catch (error) {
    mediaKeyApi = {
      available: false,
      reason: error && error.message ? error.message : String(error),
      error
    };
  }

  return mediaKeyApi;
}

function pressMediaKey(command) {
  const keyCode = MEDIA_KEY_CODES[command];

  if (!keyCode) {
    return { ok: false, error: `未知媒体控制指令：${command}` };
  }

  const api = loadMediaKeyApi();

  if (!api.available) {
    return { ok: false, error: `无法发送媒体按键：${api.reason}` };
  }

  try {
    api.keybd_event(keyCode, 0, KEYEVENTF_EXTENDEDKEY, 0);
    api.keybd_event(keyCode, 0, KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYUP, 0);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: `发送媒体按键失败：${error && error.message ? error.message : String(error)}`
    };
  }
}

// 优先使用 Windows 认为的当前活动会话；无法判断时优先正在播放的会话。
function pickSession(sessions, currentSessionId) {
  const list = Array.isArray(sessions) ? sessions : [];

  if (currentSessionId) {
    const current = list.find(
      (session) => session && session.id === currentSessionId
    );

    if (current) return current;
  }

  const playing = list.find(
    (session) => session && session.playbackStatus === "playing"
  );

  if (playing) return playing;

  return list[0] || null;
}

function getRequiredControl(command, session) {
  if (!session) return null;

  if (command === "playPause") {
    return session.playbackStatus === "playing" ? "canPause" : "canPlay";
  }

  if (command === "next") return "canSkipNext";
  if (command === "previous") return "canSkipPrevious";
  return null;
}

function isControlSupported(command, session) {
  const required = getRequiredControl(command, session);

  if (!required || !session.controls) return false;

  return session.controls[required] === true;
}

function normalizeThumbnail(value) {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!/^data:image\//i.test(trimmed)) return "";

  const marker = ";base64,";
  const markerIndex = trimmed.toLowerCase().indexOf(marker);
  if (markerIndex === -1) return "";

  // 某些后端会把多个 MIME 拼成 "image/jpeg,image/jpe,..."，
  // 只保留第一个合法图片类型，其余部分按标准 data URL 重组。
  const mime = trimmed.slice(5, markerIndex).split(",")[0].trim().toLowerCase();
  const payload = trimmed.slice(markerIndex + marker.length);

  if (!/^image\/[a-z0-9.+-]+$/i.test(mime)) return "";
  if (!payload || !/^[a-z0-9+/=\r\n]+$/i.test(payload)) return "";

  return `data:${mime};base64,${payload}`;
}

function mapSession(session) {
  return {
    id: session.id || "",
    app: session.sourceAppDisplayName || session.sourceAppUserModelId || "",
    title: session.title || "",
    artist: session.artist || "",
    albumTitle: session.albumTitle || "",
    thumbnail: normalizeThumbnail(session.thumbnail),
    playbackStatus: session.playbackStatus || "closed",
    timeline: {
      positionMs: Number(session.timeline && session.timeline.positionMs) || 0,
      durationMs: Number(session.timeline && session.timeline.durationMs) || 0
    },
    controls: session.controls
      ? {
          canPlay: session.controls.canPlay === true,
          canPause: session.controls.canPause === true,
          canSkipNext: session.controls.canSkipNext === true,
          canSkipPrevious: session.controls.canSkipPrevious === true
        }
      : null
  };
}

class MediaSessionWatcher {
  constructor({ onChange } = {}) {
    this.onChange = typeof onChange === "function" ? onChange : () => {};
    this.manager = null;
    this.unsubscribe = null;
    this.sessions = [];
    this.currentSessionId = null;
    this.lastError = null;
    this.started = false;
    this.progressTimer = null;
    this.lastProgressTick = 0;
  }

  ensureManager() {
    if (this.manager) return this.manager;

    let library;

    try {
      library = require("windows-media-sessions");
    } catch (error) {
      this.lastError = `无法加载 windows-media-sessions：${
        error && error.message ? error.message : String(error)
      }`;
      console.error("[media-session]", this.lastError);
      return null;
    }

    try {
      const manager = library.createSessionManager();

      // 库的公开 API 不返回 currentSessionId，但后端快照里有；只读监听即可。
      if (manager.backend && typeof manager.backend.on === "function") {
        manager.backend.on("message", (message) => {
          if (message && message.type === "sessions") {
            this.currentSessionId =
              typeof message.currentSessionId === "string"
                ? message.currentSessionId
                : null;
          }
        });
      }

      manager.on("error", (error) => {
        this.lastError =
          error && error.message ? error.message : String(error);
        console.error("[media-session]", this.lastError);
        this.emitChange();
      });

      manager.on("diagnostic", (error) => {
        const message =
          error && error.message ? error.message : String(error);
        console.warn("[media-session] diagnostic:", message);
      });

      this.manager = manager;
      return manager;
    } catch (error) {
      this.lastError = `无法初始化 windows-media-sessions：${
        error && error.message ? error.message : String(error)
      }`;
      console.error("[media-session]", this.lastError);
      return null;
    }
  }

  start() {
    if (this.started) return;
    this.started = true;

    const manager = this.ensureManager();

    if (!manager) {
      this.emitChange();
      return;
    }

    try {
      this.unsubscribe = manager.onSessionsChanged((sessions) => {
        this.sessions = Array.isArray(sessions) ? sessions : [];
        this.lastError = null;
        this.lastProgressTick = Date.now();
        this.syncProgressTicker();
        this.emitChange();
      });
      this.syncProgressTicker();
    } catch (error) {
      this.lastError = `无法订阅媒体会话变化：${
        error && error.message ? error.message : String(error)
      }`;
      console.error("[media-session]", this.lastError);
      this.emitChange();
    }
  }

  getCurrentSession() {
    return pickSession(this.sessions, this.currentSessionId);
  }

  // GSMTC 的 timeline 事件并不保证每秒触发。播放期间在本地按秒推进位置，
  // 后端下一次快照到达时会用系统时间轴覆盖它，从而兼顾实时性与准确性。
  syncProgressTicker() {
    const session = this.getCurrentSession();
    const shouldTick = Boolean(
      this.started &&
      session &&
      session.playbackStatus === "playing" &&
      Number(session.timeline && session.timeline.durationMs) > 0
    );

    if (!shouldTick) {
      if (this.progressTimer) {
        clearInterval(this.progressTimer);
        this.progressTimer = null;
      }
      this.lastProgressTick = 0;
      return;
    }

    if (this.progressTimer) return;

    this.lastProgressTick = Date.now();
    this.progressTimer = setInterval(
      () => this.advanceProgress(),
      PROGRESS_TICK_MS
    );

    if (typeof this.progressTimer.unref === "function") {
      this.progressTimer.unref();
    }
  }

  advanceProgress(now = Date.now()) {
    const current = this.getCurrentSession();
    const timeline = current && current.timeline;

    if (
      !current ||
      current.playbackStatus !== "playing" ||
      !timeline ||
      !(Number(timeline.durationMs) > 0)
    ) {
      this.syncProgressTicker();
      return false;
    }

    const elapsed = this.lastProgressTick
      ? Math.max(0, Math.min(MAX_PROGRESS_STEP_MS, now - this.lastProgressTick))
      : PROGRESS_TICK_MS;
    this.lastProgressTick = now;

    const position = Math.max(0, Number(timeline.positionMs) || 0);
    const duration = Math.max(0, Number(timeline.durationMs) || 0);
    const next = Math.min(duration, position + elapsed);

    if (next <= position) return false;

    timeline.positionMs = next;
    this.emitChange();
    return true;
  }

  buildPayload() {
    const session = pickSession(this.sessions, this.currentSessionId);

    return {
      ok: true,
      session: session ? mapSession(session) : null,
      sessionCount: this.sessions.length,
      currentSessionId: this.currentSessionId,
      error: this.lastError || null
    };
  }

  emitChange() {
    this.onChange(this.buildPayload());
  }

  async getSnapshot() {
    this.start();

    const manager = this.manager;

    if (!manager) {
      return {
        ok: false,
        session: null,
        sessionCount: 0,
        error: this.lastError || "媒体会话后端不可用"
      };
    }

    try {
      // 一次性读取全部会话，再由 pickSession 优先选择 Windows 的当前会话，
      // 避免“当前会话已暂停、另一个播放器正在播放”时丢失当前会话。
      this.sessions = await manager.getAllSessions();
      this.lastError = null;
      this.lastProgressTick = Date.now();
      this.syncProgressTicker();
      return this.buildPayload();
    } catch (error) {
      const message =
        this.lastError ||
        (error && error.message ? error.message : String(error));

      return {
        ok: false,
        session: null,
        sessionCount: 0,
        error: message
      };
    }
  }

  async control(command) {
    this.start();

    if (!MEDIA_COMMANDS.has(command)) {
      return {
        ok: false,
        supported: false,
        message: "未知的媒体控制操作。"
      };
    }

    const session = pickSession(this.sessions, this.currentSessionId);

    if (!session) {
      return {
        ok: false,
        supported: false,
        message: "当前无播放内容。"
      };
    }

    if (!isControlSupported(command, session)) {
      return {
        ok: false,
        supported: false,
        message: "当前播放器不支持此操作。"
      };
    }

    const result = pressMediaKey(command);

    if (!result.ok) {
      return { ok: false, supported: true, message: result.error };
    }

    // 媒体键会把指令交给 Windows 当前的 SMTC 会话。稍后主动刷新一次，
    // 让界面不必等待播放器自己的元数据事件就能拿到新的播放状态。
    const backend = this.manager && this.manager.backend;

    if (backend && typeof backend.requestRefresh === "function") {
      const timer = setTimeout(() => {
        try {
          backend.requestRefresh();
        } catch (error) {
          // 后端正在重启时忽略这次刷新，下一次事件会自然恢复。
        }
      }, 180);

      if (typeof timer.unref === "function") timer.unref();
    }

    return { ok: true, supported: true };
  }

  dispose() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
    this.lastProgressTick = 0;

    const manager = this.manager;
    this.manager = null;
    this.started = false;

    if (manager) {
      manager.stop().catch(() => {});
    }
  }
}

module.exports = {
  MediaSessionWatcher,
  isControlSupported,
  normalizeThumbnail,
  pickSession
};
