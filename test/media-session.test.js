"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  MediaSessionWatcher,
  isControlSupported,
  normalizeThumbnail,
  pickSession
} = require("../src/media-session");

function makeSession(overrides = {}) {
  return {
    id: "app.exe",
    playbackStatus: "paused",
    controls: {
      canPlay: true,
      canPause: false,
      canSkipNext: false,
      canSkipPrevious: false
    },
    ...overrides
  };
}

test("优先选择 Windows 当前的媒体会话", () => {
  const paused = makeSession({ id: "paused.exe", playbackStatus: "paused" });
  const playing = makeSession({
    id: "playing.exe",
    playbackStatus: "playing",
    controls: {
      canPlay: false,
      canPause: true,
      canSkipNext: false,
      canSkipPrevious: false
    }
  });

  assert.equal(pickSession([playing, paused], "paused.exe"), paused);
});

test("当前会话不存在时优先选择正在播放的会话", () => {
  const paused = makeSession({ id: "paused.exe" });
  const playing = makeSession({
    id: "playing.exe",
    playbackStatus: "playing"
  });

  assert.equal(pickSession([paused, playing], "missing.exe"), playing);
});

test("没有正在播放的会话时回退到第一个会话", () => {
  const first = makeSession({ id: "first.exe" });
  const second = makeSession({ id: "second.exe" });

  assert.equal(pickSession([first, second], null), first);
  assert.equal(pickSession([], null), null);
});

test("播放/暂停支持判断跟随当前播放状态", () => {
  const playing = makeSession({
    playbackStatus: "playing",
    controls: {
      canPlay: false,
      canPause: true,
      canSkipNext: false,
      canSkipPrevious: false
    }
  });
  const paused = makeSession({
    playbackStatus: "paused",
    controls: {
      canPlay: true,
      canPause: false,
      canSkipNext: false,
      canSkipPrevious: false
    }
  });

  assert.equal(isControlSupported("playPause", playing), true);
  assert.equal(isControlSupported("playPause", paused), true);
  assert.equal(
    isControlSupported(
      "playPause",
      makeSession({ playbackStatus: "playing", controls: { canPlay: true } })
    ),
    false
  );
});

test("切歌支持判断读取 canSkip 字段", () => {
  const session = makeSession({
    controls: {
      canPlay: true,
      canPause: true,
      canSkipNext: true,
      canSkipPrevious: false
    }
  });

  assert.equal(isControlSupported("next", session), true);
  assert.equal(isControlSupported("previous", session), false);
  assert.equal(isControlSupported("next", makeSession({ controls: null })), false);
  assert.equal(isControlSupported("previous", null), false);
});

test("缩略图会修复重复 MIME 并拒绝非图片 data URL", () => {
  assert.equal(
    normalizeThumbnail("data:image/jpeg,image/jpe,image/jpg;base64,QUJD"),
    "data:image/jpeg;base64,QUJD"
  );
  assert.equal(
    normalizeThumbnail("data:image/png;base64,QUJD"),
    "data:image/png;base64,QUJD"
  );
  assert.equal(normalizeThumbnail("https://example.com/cover.jpg"), "");
  assert.equal(normalizeThumbnail("data:text/html;base64,QUJD"), "");
  assert.equal(normalizeThumbnail(""), "");
  assert.equal(normalizeThumbnail(null), "");
});

test("播放中会按秒推进时间轴并触发实时更新", () => {
  let events = 0;
  const watcher = new MediaSessionWatcher({ onChange: () => { events += 1; } });
  const session = makeSession({
    playbackStatus: "playing",
    timeline: { positionMs: 5000, durationMs: 60000 }
  });

  watcher.sessions = [session];
  watcher.currentSessionId = session.id;
  watcher.lastProgressTick = 1000;
  assert.equal(watcher.advanceProgress(2000), true);
  assert.equal(session.timeline.positionMs, 6000);
  assert.equal(events, 1);

  session.playbackStatus = "paused";
  assert.equal(watcher.advanceProgress(3000), false);
  assert.equal(session.timeline.positionMs, 6000);
  assert.equal(events, 1);
  watcher.dispose();
});
