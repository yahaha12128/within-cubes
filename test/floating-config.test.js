"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const {
  MAX_NAME_LENGTH,
  MAX_CLOCK_TEXT_LENGTH,
  CLOCK_TIME_FORMATS,
  CLOCK_DATE_FORMATS,
  DEFAULT_CLOCK_TEXT,
  DEFAULT_CUSTOM_TINT,
  createDefaultConfig,
  createCategoryConfig,
  normalizeName,
  normalizeClockText,
  normalizeClockSettings,
  normalizeCustomTint,
  normalizeConfig,
  loadFloatingConfig,
  saveFloatingConfig
} = require("../src/floating-config");
const { MIN_WIDGET_WIDTH, MIN_WIDGET_HEIGHT } = require("../src/floating");

async function makeTempDir(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "within-cubes-floating-config-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

test("悬浮窗配置默认按分类保存 3 列 2 行且未锁定", () => {
  const defaults = createDefaultConfig();

  assert.equal(defaults.version, 9);
  assert.equal(defaults.tint, "system");
  assert.equal(defaults.customTint, DEFAULT_CUSTOM_TINT);
  assert.equal(defaults.frosted, true);
  assert.equal(defaults.followWallpaperBrightness, false);
  assert.equal(defaults.performanceMode, false);
  assert.equal(defaults.autoLayoutVersion, 0);
  assert.deepEqual(defaults.smartTheme, {
    enabled: false,
    timeRhythm: true,
    seasonal: true
  });
  assert.deepEqual(defaults.uiBackground, {
    type: "solid",
    color: "#f2f4ef",
    gradientStart: "#edf4ee",
    gradientEnd: "#e4edf6",
    imagePath: null
  });

  for (const key of ["folders", "apps", "documents", "media", "archives"]) {
    assert.deepEqual(defaults.categories[key], {
      removed: false,
      locked: false,
      rows: 2,
      cols: 3,
      x: null,
      y: null,
      name: "",
      sortMode: "name",
      orderKeys: []
    });
  }
});

test("分类窗口折叠方式默认双击，非法值回退", () => {
  assert.equal(createDefaultConfig().collapseMode, "double-click");

  assert.equal(
    normalizeConfig({ collapseMode: "hover" }).collapseMode,
    "hover"
  );
  assert.equal(
    normalizeConfig({ collapseMode: "double-click" }).collapseMode,
    "double-click"
  );
  assert.equal(
    normalizeConfig({ collapseMode: "bad-value" }).collapseMode,
    "double-click"
  );
});

test("九个桌面组件默认关闭，旧的系统图标小组件已废弃", () => {
  const defaults = createDefaultConfig();

  assert.deepEqual(
    Object.keys(defaults.widgets).sort(),
    ["calendar", "clipboard", "clock", "music", "notes", "pomodoro", "quick", "search", "todo"]
  );

  assert.deepEqual(defaults.widgets.clock, {
    enabled: false,
    locked: false,
    x: null,
    y: null,
    width: 616,
    height: 294,
    name: "",
    sizeCustomized: false,
    backgroundImage: null,
    timeFormat: "hh/mm/ss",
    dateFormat: "yyyy/mm/dd",
    customText: DEFAULT_CLOCK_TEXT
  });

  assert.deepEqual(defaults.widgets.music, {
    enabled: false,
    locked: false,
    x: null,
    y: null,
    width: 300,
    height: 294,
    name: "",
    sizeCustomized: false,
    backgroundImage: null
  });

  assert.deepEqual(defaults.widgets.notes, {
    enabled: false,
    locked: false,
    x: null,
    y: null,
    width: 300,
    height: 294,
    name: "",
    sizeCustomized: false,
    backgroundImage: null
  });

  assert.deepEqual(defaults.widgets.todo, {
    enabled: false,
    locked: false,
    x: null,
    y: null,
    width: 300,
    height: 294,
    name: "",
    sizeCustomized: false,
    backgroundImage: null
  });

  assert.deepEqual(defaults.widgets.calendar, {
    enabled: false,
    locked: false,
    x: null,
    y: null,
    width: 300,
    height: 294,
    name: "",
    sizeCustomized: false,
    backgroundImage: null
  });

  assert.deepEqual(defaults.widgets.pomodoro, {
    enabled: false,
    locked: false,
    x: null,
    y: null,
    width: 300,
    height: 294,
    name: "",
    sizeCustomized: false,
    backgroundImage: null
  });

  assert.deepEqual(defaults.widgets.quick, {
    enabled: false,
    locked: false,
    x: null,
    y: null,
    width: 300,
    height: 294,
    name: "",
    sizeCustomized: false,
    backgroundImage: null
  });

  assert.deepEqual(defaults.widgets.clipboard, {
    enabled: false,
    locked: false,
    x: null,
    y: null,
    width: 300,
    height: 294,
    name: "",
    sizeCustomized: false,
    backgroundImage: null
  });
});

test("悬浮窗名称会去除首尾空白、控制字符并限制长度", () => {
  assert.equal(normalizeName("  我的窗口  "), "我的窗口");
  assert.equal(normalizeName("前\u0000中\u001f后"), "前中后");
  assert.equal(normalizeName("   "), "");
  assert.equal(normalizeName(42), "");
  assert.equal(normalizeName("名".repeat(MAX_NAME_LENGTH + 5)).length, MAX_NAME_LENGTH);
});

test("时钟格式和自定义文字会校验、保留换行并限制长度", () => {
  const normalized = normalizeClockSettings({
    timeFormat: "hh/mm",
    dateFormat: "yyyy-mm-dd",
    customText: "第一行\r\n第二行\r第三行\n第四行"
  });

  assert.equal(normalized.timeFormat, "hh/mm");
  assert.equal(normalized.dateFormat, "yyyy-mm-dd");
  assert.equal(normalized.customText, "第一行\n第二行\n第三行\n第四行");

  const fallback = normalizeClockSettings({
    timeFormat: "minutes",
    dateFormat: "dd.mm.yyyy",
    customText: 42
  });

  assert.equal(fallback.timeFormat, "hh/mm/ss");
  assert.equal(fallback.dateFormat, "yyyy/mm/dd");
  assert.equal(fallback.customText, DEFAULT_CLOCK_TEXT);

  assert.ok(CLOCK_TIME_FORMATS.includes("hh/mm/ss"));
  assert.ok(CLOCK_TIME_FORMATS.includes("hh/mm"));
  assert.ok(CLOCK_TIME_FORMATS.includes("hh"));
  assert.ok(CLOCK_DATE_FORMATS.includes("yyyy/mm/dd"));
  assert.ok(CLOCK_DATE_FORMATS.includes("yyyy-mm-dd"));
  assert.ok(CLOCK_DATE_FORMATS.includes("mm/dd"));
  assert.ok(CLOCK_DATE_FORMATS.includes("yyyy"));

  assert.equal(normalizeClockText(42), DEFAULT_CLOCK_TEXT);
  assert.equal(normalizeClockText("字".repeat(MAX_CLOCK_TEXT_LENGTH + 10)).length, MAX_CLOCK_TEXT_LENGTH);
  assert.equal(normalizeClockText(""), "");
});

test("新组件可独立启用并保存尺寸、坐标与背景", () => {
  const normalized = normalizeConfig({
    version: 9,
    widgets: {
      notes: {
        enabled: true,
        x: 120,
        y: 240,
        width: 420,
        height: 320,
        backgroundImage: "C:\\walls\\notes.png"
      },
      todo: {
        enabled: true,
        width: 500,
        height: 440
      },
      calendar: {
        enabled: false,
        width: 460,
        height: 380
      }
    }
  });

  assert.equal(normalized.widgets.notes.enabled, true);
  assert.equal(normalized.widgets.notes.x, 120);
  assert.equal(normalized.widgets.notes.y, 240);
  assert.equal(normalized.widgets.notes.width, 420);
  assert.equal(normalized.widgets.notes.height, 320);
  assert.equal(normalized.widgets.notes.backgroundImage, "C:\\walls\\notes.png");
  assert.equal(normalized.widgets.todo.enabled, true);
  assert.equal(normalized.widgets.todo.width, 500);
  assert.equal(normalized.widgets.todo.height, 440);
  assert.equal(normalized.widgets.calendar.enabled, false);
  assert.equal(normalized.widgets.calendar.width, 460);
  assert.equal(normalized.widgets.calendar.height, 380);
});

test("升级到 v9 时旧默认尺寸切到新网格，自定义尺寸保留", () => {
  const migrated = normalizeConfig({
    version: 8,
    widgets: {
      clock: { width: 340, height: 294 },
      music: { width: 500, height: 400 },
      notes: { width: 360, height: 300 }
    }
  });

  assert.equal(migrated.version, 9);
  assert.equal(migrated.widgets.clock.width, 616);
  assert.equal(migrated.widgets.clock.height, 294);
  assert.equal(migrated.widgets.music.width, 500);
  assert.equal(migrated.widgets.music.height, 400);
  assert.equal(migrated.widgets.notes.width, 300);
  assert.equal(migrated.widgets.notes.height, 294);
  assert.equal(migrated.widgets.pomodoro.width, 300);
  assert.equal(migrated.widgets.pomodoro.height, 294);

  const alreadyMigrated = normalizeConfig({
    version: 9,
    widgets: {
      clock: { width: 340, height: 294 }
    }
  });

  assert.equal(alreadyMigrated.widgets.clock.width, 340);
  assert.equal(alreadyMigrated.widgets.clock.height, 294);
});

test("启动加载优先使用用户保存的宽高，默认公式不再介入", () => {
  const loaded = normalizeConfig({
    version: 9,
    widgets: {
      clock: { width: 700, height: 340 },
      music: { width: 420, height: 500 },
      notes: { width: 300, height: 294 }
    }
  });

  assert.equal(loaded.widgets.clock.width, 700);
  assert.equal(loaded.widgets.clock.height, 340);
  assert.equal(loaded.widgets.music.width, 420);
  assert.equal(loaded.widgets.music.height, 500);
  assert.equal(loaded.widgets.notes.width, 300);
  assert.equal(loaded.widgets.notes.height, 294);
});

test("用户手动调整过的尺寸在版本迁移中不会被默认值覆盖", () => {
  const migrated = normalizeConfig({
    version: 8,
    widgets: {
      // 恰好等于旧默认值，但用户标记为自定义 → 必须保留
      clock: { width: 340, height: 294, sizeCustomized: true },
      // 旧配置没有标记，靠数值推断为自定义
      music: { width: 500, height: 400 }
    }
  });

  assert.equal(migrated.widgets.clock.width, 340);
  assert.equal(migrated.widgets.clock.height, 294);
  assert.equal(migrated.widgets.clock.sizeCustomized, true);
  assert.equal(migrated.widgets.music.width, 500);
  assert.equal(migrated.widgets.music.height, 400);
  assert.equal(migrated.widgets.music.sizeCustomized, true);
});

test("尺寸标记能从旧配置的数值推断，默认尺寸不会被标记为自定义", () => {
  const loaded = normalizeConfig({
    version: 9,
    widgets: {
      music: { width: 420, height: 500 },
      notes: { width: 300, height: 294 }
    }
  });

  assert.equal(loaded.widgets.music.sizeCustomized, true);
  assert.equal(loaded.widgets.notes.sizeCustomized, false);
  assert.equal(loaded.widgets.todo.sizeCustomized, false);
});

test("小组件配置会校验开关、锁定、坐标、名称、背景和尺寸", () => {
  const normalized = normalizeConfig({
    version: 9,
    widgets: {
      clock: {
        enabled: 1,
        locked: 1,
        x: "64",
        y: "bad",
        width: 100,
        height: 9999,
        name: "  桌面时钟 ",
        backgroundImage: "  C:\\walls\\clock.png  ",
        timeFormat: "bad",
        dateFormat: "yyyy",
        customText: "第一行\r\n第二行"
      },
      music: {
        width: "bad",
        height: "-20",
        name: 123,
        backgroundImage: "   "
      }
    }
  });

  assert.equal(normalized.widgets.clock.enabled, true);
  assert.equal(normalized.widgets.clock.locked, true);
  assert.equal(normalized.widgets.clock.x, 64);
  assert.equal(normalized.widgets.clock.y, null);
  assert.equal(normalized.widgets.clock.width, MIN_WIDGET_WIDTH);
  assert.equal(normalized.widgets.clock.height, 2000);
  assert.equal(normalized.widgets.clock.name, "桌面时钟");
  assert.equal(normalized.widgets.clock.backgroundImage, "C:\\walls\\clock.png");
  assert.equal(normalized.widgets.clock.timeFormat, "hh/mm/ss");
  assert.equal(normalized.widgets.clock.dateFormat, "yyyy");
  assert.equal(normalized.widgets.clock.customText, "第一行\n第二行");

  assert.equal(normalized.widgets.music.enabled, false);
  assert.equal(normalized.widgets.music.width, 300);
  assert.equal(normalized.widgets.music.height, MIN_WIDGET_HEIGHT);
  assert.equal(normalized.widgets.music.name, "");
  assert.equal(normalized.widgets.music.backgroundImage, null);

  // 旧的独立系统图标小组件配置会被忽略，系统图标已并入应用分类。
  assert.equal(normalized.widgets.system, undefined);
  assert.equal(
    normalizeConfig({ widgets: { system: { enabled: true } } }).widgets.system,
    undefined
  );
});

test("悬浮窗配置会校验每个分类的网格、坐标、状态和排序键", () => {
  const normalized = normalizeConfig({
    tint: "black",
    frosted: false,
    categories: {
      folders: {
        removed: 1,
        locked: 1,
        rows: 9,
        cols: 1,
        x: "120",
        y: "bad",
        name: "  我的分类 ",
        orderKeys: ["a", 42, null, "b"]
      },
      documents: {
        rows: 6,
        cols: 6
      }
    }
  });

  assert.equal(normalized.tint, "black");
  assert.equal(normalized.frosted, false);

  assert.equal(normalized.categories.folders.removed, true);
  assert.equal(normalized.categories.folders.locked, true);
  assert.equal(normalized.categories.folders.rows, 2);
  assert.equal(normalized.categories.folders.cols, 1);
  assert.equal(normalized.categories.folders.x, 120);
  assert.equal(normalized.categories.folders.y, null);
  assert.equal(normalized.categories.folders.name, "我的分类");
  assert.deepEqual(normalized.categories.folders.orderKeys, ["a", "b"]);

  assert.equal(normalized.categories.documents.rows, 6);
  assert.equal(normalized.categories.documents.cols, 6);

  assert.deepEqual(normalized.categories.media, createCategoryConfig());
});

test("非法颜色与缺省磨砂配置回退到默认值", () => {
  const normalized = normalizeConfig({
    tint: "rainbow",
    categories: {}
  });

  assert.equal(normalized.tint, "system");
  assert.equal(normalized.customTint, DEFAULT_CUSTOM_TINT);
  assert.equal(normalized.frosted, true);

  const custom = normalizeConfig({
    tint: "custom",
    customTint: "#3F6F8E",
    categories: {}
  });

  assert.equal(custom.tint, "custom");
  assert.equal(custom.customTint, "#3f6f8e");
  assert.equal(normalizeCustomTint("not-a-color"), DEFAULT_CUSTOM_TINT);
  assert.equal(normalizeCustomTint("#a33a32"), "#a33a32");
});

test("悬浮窗配置可保存并重新读取", async (t) => {
  const directory = await makeTempDir(t);
  const configPath = path.join(directory, "floating.json");
  const config = createDefaultConfig();

  config.tint = "custom";
  config.customTint = "#3f6f8e";
  config.frosted = false;
  config.categories.folders.removed = true;
  config.categories.folders.rows = 4;
  config.categories.folders.cols = 5;
  config.categories.folders.x = 100;
  config.categories.folders.y = 200;
  config.categories.folders.name = "我的文件夹";
  config.categories.folders.orderKeys = ["a\u0000b", "c\u0000d"];
  config.widgets.clock.name = "我的时钟";
  config.widgets.clock.backgroundImage = "C:\\walls\\clock.png";
  config.widgets.clock.timeFormat = "hh/mm";
  config.widgets.clock.dateFormat = "mm/dd";
  config.widgets.clock.customText = "第一行\n第二行";
  config.smartTheme = {
    enabled: true,
    timeRhythm: false,
    seasonal: true
  };
  config.uiBackground = {
    type: "image",
    color: "#112233",
    gradientStart: "#445566",
    gradientEnd: "#778899",
    imagePath: "C:\\wallpapers\\bg.png"
  };

  await saveFloatingConfig(configPath, config);
  const loaded = await loadFloatingConfig(configPath);

  assert.equal(loaded.tint, "custom");
  assert.equal(loaded.customTint, "#3f6f8e");
  assert.equal(loaded.frosted, false);
  assert.equal(loaded.categories.folders.removed, true);
  assert.equal(loaded.categories.folders.rows, 4);
  assert.equal(loaded.categories.folders.cols, 5);
  assert.equal(loaded.categories.folders.x, 100);
  assert.equal(loaded.categories.folders.y, 200);
  assert.equal(loaded.categories.folders.name, "我的文件夹");
  assert.deepEqual(loaded.categories.folders.orderKeys, ["a\u0000b", "c\u0000d"]);
  assert.equal(loaded.widgets.clock.name, "我的时钟");
  assert.equal(loaded.widgets.clock.backgroundImage, "C:\\walls\\clock.png");
  assert.equal(loaded.widgets.clock.timeFormat, "hh/mm");
  assert.equal(loaded.widgets.clock.dateFormat, "mm/dd");
  assert.equal(loaded.widgets.clock.customText, "第一行\n第二行");
  assert.equal(loaded.widgets.music.name, "");
  assert.equal(loaded.widgets.music.backgroundImage, null);
  assert.equal(loaded.widgets.music.timeFormat, undefined);
  assert.equal(loaded.widgets.system, undefined);
  assert.equal(loaded.categories.documents.rows, 2);
  assert.equal(loaded.categories.documents.cols, 3);
  assert.deepEqual(loaded.smartTheme, {
    enabled: true,
    timeRhythm: false,
    seasonal: true
  });
  assert.deepEqual(loaded.uiBackground, {
    type: "image",
    color: "#112233",
    gradientStart: "#445566",
    gradientEnd: "#778899",
    imagePath: "C:\\wallpapers\\bg.png"
  });
});

test("主界面背景会校验类型、颜色，并在图片缺失时回退纯色", () => {
  const normalized = normalizeConfig({
    version: 9,
    uiBackground: {
      type: "image",
      imagePath: "",
      color: "bad",
      gradientStart: "#ABCDEF",
      gradientEnd: 42
    }
  });

  assert.deepEqual(normalized.uiBackground, {
    type: "solid",
    color: "#f2f4ef",
    gradientStart: "#abcdef",
    gradientEnd: "#e4edf6",
    imagePath: null
  });

  const gradient = normalizeConfig({
    uiBackground: {
      type: "gradient",
      gradientStart: "#112233",
      gradientEnd: "#445566"
    }
  });

  assert.equal(gradient.uiBackground.type, "gradient");
  assert.equal(gradient.uiBackground.gradientStart, "#112233");
  assert.equal(gradient.uiBackground.gradientEnd, "#445566");
  assert.deepEqual(gradient.smartTheme, {
    enabled: false,
    timeRhythm: true,
    seasonal: true
  });
});

test("旧版单窗口排序记录会迁移到新的分类配置", () => {
  const keys = [
    "photo.png\u0000C:\\Desktop\\photo.png",
    "report.pdf\u0000C:\\Desktop\\report.pdf",
    "archive.zip\u0000C:\\Desktop\\archive.zip",
    "tool.lnk\u0000C:\\Desktop\\tool.lnk",
    "script.js\u0000C:\\Desktop\\script.js"
  ];

  const migrated = normalizeConfig({
    locked: true,
    rows: 3,
    cols: 2,
    x: 50,
    y: 780,
    orderKeys: keys
  });

  assert.deepEqual(migrated.categories.media.orderKeys, [keys[0]]);
  assert.deepEqual(migrated.categories.documents.orderKeys, [keys[1]]);
  assert.deepEqual(migrated.categories.archives.orderKeys, [keys[2]]);
  assert.deepEqual(migrated.categories.apps.orderKeys, [keys[3]]);
  assert.equal(migrated.categories.folders.orderKeys.length, 0);
  assert.equal(migrated.categories.media.rows, 2);
  assert.equal(migrated.categories.media.cols, 3);
  assert.equal(migrated.categories.media.locked, false);
  assert.equal(migrated.tint, "system");
  assert.equal(migrated.frosted, true);
});

test("缺失或损坏的配置会回退到默认值", async (t) => {
  const directory = await makeTempDir(t);

  assert.deepEqual(
    await loadFloatingConfig(path.join(directory, "missing.json")),
    createDefaultConfig()
  );

  const brokenPath = path.join(directory, "broken.json");
  await fs.writeFile(brokenPath, "{not-json", "utf8");

  assert.deepEqual(await loadFloatingConfig(brokenPath), createDefaultConfig());
});

test("3D 景深与音乐封面背景设置会持久化，两者默认开启", () => {
  const defaults = createDefaultConfig();
  assert.equal(defaults.depth3d, true);
  assert.equal(defaults.musicVisualizer, true);

  const normalized = normalizeConfig({
    depth3d: true,
    musicVisualizer: false
  });

  assert.equal(normalized.depth3d, true);
  assert.equal(normalized.musicVisualizer, false);
});

test("升级前的配置会补开 3D 景深，之后用户主动关闭不会被重置", () => {
  // 旧版本写下的 false 不带 depth3dDefaultOn，属于升级前配置，补开一次。
  const upgraded = normalizeConfig({ depth3d: false });
  assert.equal(upgraded.depth3d, true);
  assert.equal(upgraded.depth3dDefaultOn, true);

  // 升级后用户自己关掉，再加载时必须尊重这个选择。
  const keptOff = normalizeConfig({ depth3d: false, depth3dDefaultOn: true });
  assert.equal(keptOff.depth3d, false);
});
