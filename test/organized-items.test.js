"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const {
  createEmptyOrganizedItems,
  getOrganizedItem,
  getOrganizedItemsByRun,
  hasOrganizedItem,
  isUnderDesktop,
  listOrganizedItems,
  loadOrganizedItems,
  normalizeOrganizedItems,
  removeOrganizedItem,
  saveOrganizedItems,
  upsertOrganizedItem
} = require("../src/organized-items");

async function makeTempDir(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "within-cubes-items-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

function makeItem(desktop, name = "report.txt", overrides = {}) {
  return {
    path: path.join(desktop, name),
    originalPath: path.join(desktop, name),
    category: "documents",
    kind: "file",
    runId: "run-1",
    organizedAt: new Date().toISOString(),
    hiddenBefore: false,
    source: "organize",
    ...overrides
  };
}

test("规范化只保留桌面内且字段有效的项目", async (t) => {
  const desktop = await makeTempDir(t);
  const outside = await makeTempDir(t);

  const state = normalizeOrganizedItems({
    version: 1,
    desktopPath: desktop,
    items: {
      good: makeItem(desktop),
      outside: makeItem(outside),
      badCategory: makeItem(desktop, "bad.txt", { category: "unknown" }),
      badKind: makeItem(desktop, "bad2.txt", { kind: "other" })
    }
  }, { desktopPath: desktop });

  assert.equal(listOrganizedItems(state).length, 1);
  assert.ok(hasOrganizedItem(state, path.join(desktop, "report.txt")));
  assert.equal(getOrganizedItem(state, path.join(desktop, "report.txt")).category, "documents");
});

test("upsert、按 run 查询和删除", async (t) => {
  const desktop = await makeTempDir(t);
  const state = createEmptyOrganizedItems(desktop);

  const item = upsertOrganizedItem(state, makeItem(desktop));
  assert.ok(item);
  assert.equal(getOrganizedItemsByRun(state, "run-1").length, 1);
  assert.equal(getOrganizedItemsByRun(state, "run-2").length, 0);

  const updated = upsertOrganizedItem(state, makeItem(desktop, "report.txt", {
    category: "media",
    runId: "run-2"
  }));
  assert.equal(updated.category, "media");
  assert.equal(listOrganizedItems(state).length, 1);
  assert.equal(getOrganizedItemsByRun(state, "run-2").length, 1);

  assert.equal(removeOrganizedItem(state, path.join(desktop, "REPORT.TXT")), true);
  assert.equal(listOrganizedItems(state).length, 0);
});

test("保存后可以重新读取", async (t) => {
  const desktop = await makeTempDir(t);
  const filePath = path.join(desktop, "organized-items.json");
  const state = createEmptyOrganizedItems(desktop);

  upsertOrganizedItem(state, makeItem(desktop));
  await saveOrganizedItems(filePath, state);

  const loaded = await loadOrganizedItems(filePath, { desktopPath: desktop });

  assert.equal(listOrganizedItems(loaded).length, 1);
  assert.equal(
    getOrganizedItem(loaded, path.join(desktop, "report.txt")).hiddenBefore,
    false
  );
});

test("主文件损坏时回退到 .bak", async (t) => {
  const desktop = await makeTempDir(t);
  const filePath = path.join(desktop, "organized-items.json");
  const first = createEmptyOrganizedItems(desktop);
  const second = createEmptyOrganizedItems(desktop);

  upsertOrganizedItem(first, makeItem(desktop, "first.txt"));
  await saveOrganizedItems(filePath, first);

  upsertOrganizedItem(second, makeItem(desktop, "second.txt"));
  await saveOrganizedItems(filePath, second);

  await fs.writeFile(filePath, "{bad json", "utf8");

  const loaded = await loadOrganizedItems(filePath, { desktopPath: desktop });
  const names = listOrganizedItems(loaded).map((item) => path.basename(item.path));

  assert.deepEqual(names, ["first.txt"]);
});

test("桌面路径判断", async (t) => {
  const desktop = await makeTempDir(t);
  const outside = await makeTempDir(t);

  assert.equal(isUnderDesktop(path.join(desktop, "a.txt"), desktop), true);
  assert.equal(isUnderDesktop(path.join(desktop, "sub", "a.txt"), desktop), true);
  assert.equal(isUnderDesktop(path.join(outside, "a.txt"), desktop), false);
});
