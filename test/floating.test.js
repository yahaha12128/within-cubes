"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const {
  CELL_WIDTH,
  GRID_GAP,
  GRID_PADDING,
  DRAGBAR_HEIGHT,
  TOOLBAR_HEIGHT,
  MIN_WIDGET_WIDTH,
  MIN_WIDGET_HEIGHT,
  computeContentSize,
  computeCategoryWindowSize,
  computeWidgetSizeFromGrid,
  getGridSizeFromWindow,
  fileKey,
  scanDesktopEntries,
  scanFloatingCategories,
  buildFloatingState
} = require("../src/floating");
const {
  createEmptyCategoryMap,
  setAssignment
} = require("../src/category-map");

async function makeTempDir(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "within-cubes-floating-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

async function writeFile(directory, name, content = name) {
  const target = path.join(directory, name);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content);
  return target;
}

test("网格尺寸计算保持默认 3 列 2 行", () => {
  const size = computeContentSize(2, 3);

  assert.equal(
    size.width,
    3 * CELL_WIDTH + 2 * GRID_GAP + GRID_PADDING * 2
  );
  assert.equal(
    size.height,
    DRAGBAR_HEIGHT +
      TOOLBAR_HEIGHT +
      2 * 96 +
      GRID_GAP +
      GRID_PADDING * 2
  );
  assert.equal(MIN_WIDGET_WIDTH, size.width);
  assert.equal(MIN_WIDGET_HEIGHT, size.height);
});

test("桌面组件按共享网格换算初始像素尺寸", () => {
  assert.deepEqual(computeWidgetSizeFromGrid(6, 3), {
    width: 6 * CELL_WIDTH + 5 * GRID_GAP + GRID_PADDING * 2,
    height: 3 * 96 + 2 * GRID_GAP + GRID_PADDING * 2
  });
  assert.deepEqual(computeWidgetSizeFromGrid(3, 3), {
    width: 3 * CELL_WIDTH + 2 * GRID_GAP + GRID_PADDING * 2,
    height: 3 * 96 + 2 * GRID_GAP + GRID_PADDING * 2
  });
});

test("窗口尺寸与网格行列互相换算", () => {
  const size = computeCategoryWindowSize(4, 5);
  const grid = getGridSizeFromWindow(size.width, size.height);

  assert.equal(grid.rows, 4);
  assert.equal(grid.cols, 5);
  assert.deepEqual(getGridSizeFromWindow("bad", "bad"), { rows: 2, cols: 3 });
});

test("scanFloatingCategories 只返回桌面根目录中有归属记录的文件", async (t) => {
  const desktop = await makeTempDir(t);
  const report = await writeFile(desktop, "report.pdf", "report");
  const photo = await writeFile(desktop, "photo.png", "photo");
  const unassigned = await writeFile(desktop, "unassigned.txt", "text");
  await writeFile(desktop, "桌面整理", "legacy-file");
  await fs.mkdir(path.join(desktop, "ProjectA"));
  const folderPath = path.join(desktop, "ProjectA");

  const state = createEmptyCategoryMap(desktop);
  setAssignment(state, {
    path: report,
    category: "documents",
    kind: "file",
    runId: "run-1",
    source: "organize"
  });
  setAssignment(state, {
    path: photo,
    category: "documents",
    kind: "file",
    source: "manual"
  });
  setAssignment(state, {
    path: folderPath,
    category: "folders",
    kind: "folder",
    runId: "run-1",
    source: "organize"
  });
  setAssignment(state, {
    path: path.join(desktop, "missing.png"),
    category: "media",
    kind: "file",
    runId: "run-1",
    source: "organize"
  });

  const result = await scanFloatingCategories(desktop, { categoryMap: state });

  assert.deepEqual(
    result.itemsByCategory.get("documents").map((item) => item.name).sort(),
    ["photo.png", "report.pdf"]
  );
  assert.deepEqual(
    result.itemsByCategory.get("folders").map((item) => item.name),
    ["ProjectA"]
  );
  assert.equal(result.itemsByCategory.get("media").length, 0);
  assert.equal(
    result.itemsByCategory.get("documents").some((item) => item.path === unassigned),
    false
  );
  assert.deepEqual(
    result.unassignedItems.map((item) => item.name).sort(),
    ["unassigned.txt"]
  );
  assert.equal(
    result.unassignedItems.some((item) => item.path === report || item.path === photo || item.path === folderPath),
    false
  );

  const systemItems = result.itemsByCategory.get("apps");
  assert.deepEqual(
    systemItems.map((item) => item.name),
    ["回收站", "此电脑", "控制面板", "网络"]
  );
  assert.equal(systemItems.every((item) => item.isSystemIcon === true), true);
  assert.equal(systemItems.every((item) => item.iconMode === "virtual"), true);

  assert.equal(result.stale.length, 1);
  assert.equal(result.stale[0].path, path.join(desktop, "missing.png"));
});

test("scanDesktopEntries 跳过系统文件和旧整理目录", async (t) => {
  const desktop = await makeTempDir(t);
  await writeFile(desktop, "a.txt", "a");
  await writeFile(desktop, "desktop.ini", "ini");
  await writeFile(desktop, ".hidden", "hidden");
  await writeFile(desktop, "~$temp.docx", "temp");
  await writeFile(desktop, path.join("桌面整理", "old.txt"), "old");
  await fs.mkdir(path.join(desktop, "FolderA"));

  const result = await scanDesktopEntries(desktop);

  assert.deepEqual(
    result.items.map((item) => item.name).sort(),
    ["FolderA", "a.txt"]
  );
});

test("buildFloatingState 首次置顶系统图标，保存排序后按自定义顺序", () => {
  const app = {
    name: "app.lnk",
    path: "C:\\Desktop\\app.lnk",
    sourcePath: "C:\\Desktop\\app.lnk",
    type: "shortcut"
  };
  const recycleBin = {
    name: "回收站",
    path: "system-icon:recycleBin",
    sourcePath: "system-icon:recycleBin",
    type: "system",
    isSystemIcon: true,
    pinToStart: true
  };
  const computer = {
    name: "此电脑",
    path: "system-icon:computer",
    sourcePath: "system-icon:computer",
    type: "system",
    isSystemIcon: true,
    pinToStart: true
  };

  const first = buildFloatingState({
    files: [app, recycleBin, computer],
    orderKeys: []
  });

  assert.deepEqual(
    first.files.map((file) => file.name),
    ["回收站", "此电脑", "app.lnk"]
  );

  const customOrder = [
    first.orderKeys[2],
    first.orderKeys[0],
    first.orderKeys[1]
  ];
  const second = buildFloatingState({
    files: [app, recycleBin, computer],
    orderKeys: customOrder
  });

  assert.deepEqual(
    second.files.map((file) => file.name),
    ["app.lnk", "回收站", "此电脑"]
  );
});

test("buildFloatingState 保留自定义排序并追加新文件", () => {
  const report = {
    name: "report.pdf",
    path: "C:\\Desktop\\report.pdf",
    sourcePath: "C:\\Desktop\\report.pdf",
    type: "document"
  };
  const photo = {
    name: "photo.png",
    path: "C:\\Desktop\\photo.png",
    sourcePath: "C:\\Desktop\\photo.png",
    type: "image"
  };
  const archive = {
    name: "archive.zip",
    path: "C:\\Desktop\\archive.zip",
    sourcePath: "C:\\Desktop\\archive.zip",
    type: "archive"
  };
  const state = buildFloatingState({
    files: [photo, report, archive],
    orderKeys: [fileKey("archive.zip", "C:\\Desktop\\archive.zip")]
  });

  assert.deepEqual(
    state.files.map((file) => file.name),
    ["archive.zip", "photo.png", "report.pdf"]
  );
  assert.equal(state.total, 3);
  assert.equal(state.files[0].key, fileKey("archive.zip", "C:\\Desktop\\archive.zip"));
});

test("buildFloatingState 支持按名称、时间和大小排序", () => {
  const files = [
    { name: "b.txt", path: "C:\Desktop\b.txt", type: "other", mtimeMs: 10, size: 20 },
    { name: "a.txt", path: "C:\Desktop\a.txt", type: "other", mtimeMs: 30, size: 10 },
    { name: "c.txt", path: "C:\Desktop\c.txt", type: "other", mtimeMs: 20, size: 30 }
  ];

  assert.deepEqual(
    buildFloatingState({ files, orderKeys: [], sortMode: "name" }).files.map((file) => file.name),
    ["a.txt", "b.txt", "c.txt"]
  );
  assert.deepEqual(
    buildFloatingState({ files, orderKeys: [], sortMode: "time" }).files.map((file) => file.name),
    ["a.txt", "c.txt", "b.txt"]
  );
  assert.deepEqual(
    buildFloatingState({ files, orderKeys: [], sortMode: "size" }).files.map((file) => file.name),
    ["c.txt", "b.txt", "a.txt"]
  );
});
