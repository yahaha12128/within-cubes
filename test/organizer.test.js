"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const {
  LEGACY_DIR_NAME,
  isIgnoredFile,
  scanDesktop,
  filterOrganizedFiles,
  getAvailablePath
} = require("../src/organizer");
const { classifyFileName } = require("../src/categories");
const {
  createEmptyCategoryMap,
  setAssignment
} = require("../src/category-map");

async function makeTempDir(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "within-cubes-test-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

async function writeFile(directory, name, content = name) {
  const target = path.join(directory, name);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content);
  return target;
}

test("固定五类分类并拒绝未知扩展名和无扩展名文件", () => {
  assert.equal(classifyFileName("photo.PNG").category, "media");
  assert.equal(classifyFileName("song.mp3").category, "media");
  assert.equal(classifyFileName("movie.mp4").category, "media");
  assert.equal(classifyFileName("report.pdf").category, "documents");
  assert.equal(classifyFileName("notes.txt").category, "documents");
  assert.equal(classifyFileName("archive.7z").category, "archives");
  assert.equal(classifyFileName("setup.exe").category, "apps");
  assert.equal(classifyFileName("shortcut.lnk").category, "apps");

  const unknown = classifyFileName("script.js");
  assert.equal(unknown.category, null);
  assert.match(unknown.reason, /不在支持列表/);

  const noExtension = classifyFileName("README");
  assert.equal(noExtension.category, null);
  assert.match(noExtension.reason, /没有扩展名/);
});

test("忽略系统文件、隐藏文件与 Office 临时文件", () => {
  assert.equal(isIgnoredFile("desktop.ini"), true);
  assert.equal(isIgnoredFile("Thumbs.db"), true);
  assert.equal(isIgnoredFile(".gitignore"), true);
  assert.equal(isIgnoredFile("~$report.docx"), true);
  assert.equal(isIgnoredFile("report.docx"), false);
});

test("扫描桌面只读取根目录并按五类分组，不包含旧整理目录", async (t) => {
  const desktop = await makeTempDir(t);

  await writeFile(desktop, "photo.PNG", "photo");
  await writeFile(desktop, "report.pdf", "pdf");
  await writeFile(desktop, "notes.txt", "txt");
  await writeFile(desktop, "archive.zip", "zip");
  await writeFile(desktop, "setup.exe", "exe");
  await writeFile(desktop, "link.lnk", "lnk");
  await writeFile(desktop, "script.js", "js");
  await writeFile(desktop, "README", "no-extension");
  await writeFile(desktop, ".hidden", "hidden");
  await writeFile(desktop, "~$draft.docx", "office-temp");
  await writeFile(desktop, "desktop.ini", "system");

  await fs.mkdir(path.join(desktop, "ProjectA"), { recursive: true });
  await writeFile(desktop, path.join("ProjectA", "inside.txt"), "inside");
  await fs.mkdir(path.join(desktop, "ProjectB"), { recursive: true });

  await fs.mkdir(path.join(desktop, LEGACY_DIR_NAME), { recursive: true });
  await writeFile(desktop, path.join(LEGACY_DIR_NAME, "not-scanned.txt"), "target");

  const plan = await scanDesktop(desktop);
  const byKey = Object.fromEntries(plan.categories.map((category) => [category.key, category]));

  assert.equal(plan.desktopPath, path.resolve(desktop));
  assert.equal(plan.targetRoot, undefined);
  assert.equal(plan.totalFiles, 8);

  assert.deepEqual(plan.categories.map((category) => category.key), [
    "folders",
    "apps",
    "documents",
    "media",
    "archives"
  ]);

  assert.deepEqual(byKey.folders.files.map((file) => file.name), ["ProjectA", "ProjectB"]);
  assert.equal(byKey.folders.files[0].kind, "folder");
  assert.equal(byKey.folders.files[0].extension, "");
  assert.deepEqual(byKey.apps.files.map((file) => file.name), ["link.lnk", "setup.exe"]);
  assert.deepEqual(byKey.documents.files.map((file) => file.name), ["notes.txt", "report.pdf"]);
  assert.deepEqual(byKey.media.files.map((file) => file.name), ["photo.PNG"]);
  assert.deepEqual(byKey.archives.files.map((file) => file.name), ["archive.zip"]);

  assert.deepEqual(plan.skipped.map((item) => item.name), ["README", "script.js"]);
  assert.match(plan.skipped[0].reason, /没有扩展名/);
  assert.match(plan.skipped[1].reason, /不在支持列表/);
  assert.equal(plan.skipped.some((item) => item.name === ".hidden"), false);
  assert.equal(plan.skipped.some((item) => item.name === "desktop.ini"), false);
  assert.equal(byKey.folders.files.some((file) => file.name === LEGACY_DIR_NAME), false);
});

test("扫描预览会过滤掉 category-map 中已有归属的文件", async (t) => {
  const desktop = await makeTempDir(t);
  const report = await writeFile(desktop, "report.pdf", "report");
  const notes = await writeFile(desktop, "notes.txt", "notes");
  const setup = await writeFile(desktop, "setup.exe", "setup");

  const plan = await scanDesktop(desktop);
  const state = createEmptyCategoryMap(desktop);

  setAssignment(state, {
    path: report,
    category: "documents",
    kind: "file",
    runId: "run-1",
    source: "organize"
  });
  setAssignment(state, {
    path: setup,
    category: "apps",
    kind: "file",
    runId: "run-1",
    source: "organize"
  });

  const filtered = filterOrganizedFiles(plan, state);
  const byKey = Object.fromEntries(
    filtered.categories.map((category) => [category.key, category])
  );

  assert.equal(filtered.totalFiles, 1);
  assert.deepEqual(byKey.documents.files.map((file) => file.name), ["notes.txt"]);
  assert.equal(byKey.media.files.length, 0);
  assert.equal(byKey.apps.files.length, 0);
  assert.equal(
    filtered.categories.some((category) =>
      category.files.some((file) => file.sourcePath === report)
    ),
    false
  );
  assert.equal(
    filtered.categories.some((category) =>
      category.files.some((file) => file.sourcePath === notes)
    ),
    true
  );
});

test("扫描不会移动或改写桌面文件", async (t) => {
  const desktop = await makeTempDir(t);
  const filePath = await writeFile(desktop, "report.pdf", "report");

  const plan = await scanDesktop(desktop);

  assert.equal(plan.totalFiles, 1);
  assert.equal(await fs.readFile(filePath, "utf8"), "report");
  assert.deepEqual(await fs.readdir(desktop), ["report.pdf"]);
});

test("生成不冲突路径时自动加序号", async (t) => {
  const desktop = await makeTempDir(t);
  const first = await writeFile(desktop, "report.pdf", "1");
  await writeFile(desktop, "report(1).pdf", "2");

  const available = await getAvailablePath(desktop, "report.pdf");

  assert.equal(available, path.join(desktop, "report(2).pdf"));
  assert.equal(await fs.readFile(first, "utf8"), "1");
});
