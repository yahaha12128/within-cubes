"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const {
  HISTORY_VERSION,
  MAX_RUNS,
  createEmptyHistory,
  normalizeHistory,
  loadHistory,
  saveHistory,
  getLatestActiveRun,
  getRunItems,
  createRunId,
  createRollbackId
} = require("../src/history");

async function makeTempDir(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "within-cubes-history-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

test("空历史与损坏历史会回退为空结构", () => {
  assert.deepStrictEqual(normalizeHistory(null), createEmptyHistory());
  assert.deepStrictEqual(normalizeHistory({ runs: "bad" }), createEmptyHistory());
});

test("历史记录会补齐默认字段并限制为最近 10 条", () => {
  const runs = Array.from({ length: 15 }, (_, index) => ({
    id: `run-${index}`,
    createdAt: new Date(2026, 0, 1, 0, 0, index).toISOString(),
    items: [
      {
        name: "a.txt",
        path: "C:\\Desktop\\a.txt",
        category: "documents",
        kind: "file"
      }
    ],
    moves: [],
    status: index === 14 ? "unknown" : "active"
  }));

  const normalized = normalizeHistory({ version: 1, runs, rollbacks: [] });

  assert.equal(MAX_RUNS, 10);
  assert.equal(normalized.version, HISTORY_VERSION);
  assert.equal(normalized.runs.length, 10);
  assert.equal(normalized.runs[0].id, "run-5");
  assert.equal(normalized.runs[9].itemCount, 1);
  assert.equal(normalized.runs[9].status, "active");
});

test("新历史 items 与旧 moves 两种形状都能读取", () => {
  const normalized = normalizeHistory({
    version: 2,
    runs: [
      {
        id: "run-items",
        createdAt: new Date().toISOString(),
        status: "active",
        moves: [],
        items: [
          {
            name: "report.pdf",
            path: "C:\\Desktop\\report.pdf",
            category: "documents",
            kind: "file"
          }
        ]
      },
      {
        id: "run-moves",
        createdAt: new Date().toISOString(),
        status: "active",
        moves: [
          {
            name: "old.txt",
            sourcePath: "C:\\Desktop\\old.txt",
            destinationPath: "C:\\Desktop\\桌面整理\\文档\\old.txt"
          }
        ]
      }
    ]
  });

  assert.equal(normalized.runs.length, 2);
  assert.equal(normalized.runs[0].itemCount, 1);
  assert.equal(normalized.runs[0].items[0].category, "documents");
  assert.equal(normalized.runs[1].items.length, 0);
  assert.equal(normalized.runs[1].moves.length, 1);
});

test("保存后可重新读取历史记录", async (t) => {
  const directory = await makeTempDir(t);
  const historyPath = path.join(directory, "history.json");
  const history = createEmptyHistory();

  history.runs.push({
    id: createRunId(),
    createdAt: new Date().toISOString(),
    status: "active",
    itemCount: 1,
    desktopPath: "D:\\Desktop",
    logPath: "D:\\logs\\organize.log",
    moves: [],
    items: [
      {
        name: "report.pdf",
        path: "D:\\Desktop\\report.pdf",
        category: "documents",
        kind: "file",
        timestamp: new Date().toISOString()
      }
    ]
  });
  history.rollbacks.push({
    id: createRollbackId(),
    createdAt: new Date().toISOString(),
    targetRunId: history.runs[0].id,
    runCount: 1,
    removed: 1,
    skipped: 0,
    errors: 0,
    items: []
  });

  await saveHistory(historyPath, history);
  const loaded = await loadHistory(historyPath);

  assert.equal(loaded.runs.length, 1);
  assert.equal(loaded.runs[0].id, history.runs[0].id);
  assert.equal(loaded.runs[0].itemCount, 1);
  assert.equal(loaded.runs[0].items[0].path, "D:\\Desktop\\report.pdf");
  assert.equal(loaded.rollbacks.length, 1);
  assert.equal(loaded.rollbacks[0].removed, 1);
});

test("迁移读取可以跳过 10 条上限", async (t) => {
  const directory = await makeTempDir(t);
  const historyPath = path.join(directory, "history.json");
  const runs = Array.from({ length: 15 }, (_, index) => ({
    id: `run-${index}`,
    createdAt: new Date(2026, 0, 1, 0, 0, index).toISOString(),
    moves: [],
    items: [],
    status: "active"
  }));

  await fs.writeFile(historyPath, JSON.stringify({
    version: 3,
    runs,
    rollbacks: []
  }), "utf8");

  const capped = await loadHistory(historyPath);
  const raw = await loadHistory(historyPath, { maxRuns: Infinity });

  assert.equal(capped.runs.length, 10);
  assert.equal(raw.runs.length, 15);
  assert.equal(raw.runs[0].id, "run-0");
});

test("缺失的历史文件返回空记录", async (t) => {
  const directory = await makeTempDir(t);
  const loaded = await loadHistory(path.join(directory, "missing.json"));

  assert.deepStrictEqual(loaded, createEmptyHistory());
});

test("getLatestActiveRun 返回最新一条有归属记录的活动整理", () => {
  const history = {
    runs: [
      { id: "old", status: "active", items: [{ path: "a" }] },
      { id: "undone", status: "undone", items: [{ path: "b" }] },
      { id: "empty", status: "active", items: [] },
      { id: "latest", status: "active", items: [{ path: "c" }, { path: "d" }] },
      { id: "rolled", status: "rolledBack", items: [{ path: "e" }] }
    ]
  };

  assert.equal(getLatestActiveRun(history).id, "latest");
  assert.equal(
    getLatestActiveRun({ runs: [{ id: "none", status: "undone", items: [{ path: "a" }] }] }),
    null
  );
  assert.deepEqual(getRunItems({ items: [{ path: "a" }] }), [{ path: "a" }]);
  assert.deepEqual(getRunItems({}), []);
});
