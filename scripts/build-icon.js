"use strict";

/**
 * build/icon.svg → build/icon.ico + build/icon-<size>.png
 *
 * 用法：npm run icon
 *
 * 说明：
 *   项目没有引入 sharp / electron-icon-builder 之类的原生依赖，
 *   这里直接借用项目自带 Electron 的 Chromium 做矢量光栅化：
 *   SVG → <canvas> → dataURL(PNG) → 手工拼装 PNG-in-ICO。
 *   这样不新增任何依赖，图标改 SVG 后跑一次即可全量重建。
 *
 * 运行方式：electron scripts/build-icon.js（由 npm run icon 触发）
 */

const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");

const SIZES = [16, 24, 32, 48, 64, 128, 256];
const ROOT = path.join(__dirname, "..");
const BUILD_DIR = path.join(ROOT, "build");
const SVG_PATH = path.join(BUILD_DIR, "icon.svg");
const ICO_PATH = path.join(BUILD_DIR, "icon.ico");

// 在页面里执行的渐变光栅化函数：把 SVG 文本按目标尺寸画进 canvas 再导出 PNG。
const RASTERIZE = `async (svgText, size) => {
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const image = new Image();

  await new Promise((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("SVG 解码失败"));
    image.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(image, 0, 0, size, size);
  URL.revokeObjectURL(url);

  return canvas.toDataURL("image/png");
}`;

function readSvg() {
  return fs.readFileSync(SVG_PATH, "utf8");
}

// 原始 SVG 没有 width/height，只靠 viewBox；显式补上尺寸，
// 让 Image 的固有尺寸与目标尺寸一致，drawImage 不会因宽高比被拉伸。
function withIntrinsicSize(svg, size) {
  return svg.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
    const cleaned = attrs
      .replace(/\swidth\s*=\s*"[^"]*"/gi, "")
      .replace(/\sheight\s*=\s*"[^"]*"/gi, "");
    return `<svg width="${size}" height="${size}"${cleaned}>`;
  });
}

function toPngBuffer(dataUrl) {
  const marker = "base64,";
  const index = dataUrl.indexOf(marker);
  if (index < 0) throw new Error("canvas 未返回 PNG dataURL");
  return Buffer.from(dataUrl.slice(index + marker.length), "base64");
}

function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(entries.length, 4);

  const table = Buffer.alloc(16 * entries.length);
  let offset = 6 + 16 * entries.length;

  entries.forEach((entry, index) => {
    const base = index * 16; // 目录项在 table 内的偏移（不含 6 字节文件头）
    const dimension = entry.size >= 256 ? 0 : entry.size; // 0 表示 256
    table[base] = dimension;
    table[base + 1] = dimension;
    table[base + 2] = 0; // 调色板数量
    table[base + 3] = 0; // reserved
    table.writeUInt16LE(1, base + 4); // color planes
    table.writeUInt16LE(32, base + 6); // bits per pixel
    table.writeUInt32LE(entry.png.length, base + 8);
    table.writeUInt32LE(offset, base + 12);
    offset += entry.png.length;
  });

  return Buffer.concat([header, table, ...entries.map((entry) => entry.png)]);
}

async function main() {
  const svg = readSvg();

  const win = new BrowserWindow({
    width: 320,
    height: 320,
    show: false,
    frame: false,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      offscreen: true
    }
  });

  await win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent("<!doctype html><html><body></body></html>"));

  const entries = [];

  for (const size of SIZES) {
    const scaled = withIntrinsicSize(svg, size);
    const dataUrl = await win.webContents.executeJavaScript(
      `(${RASTERIZE})(${JSON.stringify(scaled)}, ${size})`
    );
    const png = toPngBuffer(dataUrl);

    fs.writeFileSync(path.join(BUILD_DIR, `icon-${size}.png`), png);
    entries.push({ size, png });
    console.log(`  icon-${size}.png  ${png.length} bytes`);
  }

  // 单张主 PNG（256px），部分场景（快捷方式 / 文档）会用到。
  fs.copyFileSync(
    path.join(BUILD_DIR, "icon-256.png"),
    path.join(BUILD_DIR, "icon.png")
  );

  const ico = buildIco(entries);
  fs.writeFileSync(ICO_PATH, ico);

  console.log(`  icon.ico  ${ico.length} bytes / ${entries.length} 层：${SIZES.join(", ")}`);

  win.destroy();
}

app.whenReady().then(async () => {
  try {
    console.log(`[icon] ${SVG_PATH}`);
    await main();
    console.log("[icon] 完成");
    app.exit(0);
  } catch (error) {
    console.error("[icon] 失败：", error && error.stack ? error.stack : error);
    app.exit(1);
  }
});
