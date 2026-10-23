"use strict";

// Standalone, throw-away feasibility demo. It intentionally does not import
// anything from the production app. Run with:
//   .\node_modules\.bin\electron.cmd experiments\workerw-demo
//
// The only thing this does to the system is reparent its own window into the
// current desktop WorkerW. Closing the demo destroys that window; Explorer and
// desktop icons are not modified.

const path = require("node:path");
const os = require("node:os");
const { app, BrowserWindow, ipcMain, screen } = require("electron");

const win32 = require("./win32");

app.setName("within-cubes-workerw-demo");
app.setPath(
  "userData",
  path.join(os.tmpdir(), "within-cubes-workerw-demo-userdata")
);

let demoWindow = null;
let nativeApi = null;
let currentStatus = {
  phase: "starting",
  attached: false,
  error: null,
  host: null,
  defView: null,
  diagnostics: null,
  details: null
};

function log(...args) {
  console.log("[workerw-demo]", ...args);
}

function errorMessage(error) {
  return error && error.message ? error.message : String(error);
}

function publishStatus(next) {
  currentStatus = next;

  if (!demoWindow || demoWindow.isDestroyed()) return;

  try {
    demoWindow.webContents.send("workerw:status", currentStatus);
  } catch (error) {
    log("Failed to publish status:", errorMessage(error));
  }

  log("Status:", JSON.stringify({
    phase: currentStatus.phase,
    attached: currentStatus.attached,
    host: currentStatus.host,
    error: currentStatus.error,
    parent: currentStatus.diagnostics && currentStatus.diagnostics.parent,
    parentClass: currentStatus.diagnostics
      && currentStatus.diagnostics.parentClass,
    isChildStyle: currentStatus.diagnostics
      && currentStatus.diagnostics.isChildStyle
  }));
}

function refreshDiagnostics() {
  if (!nativeApi || !nativeApi.available || !demoWindow
    || demoWindow.isDestroyed()) {
    return null;
  }

  const hwnd = win32.getNativeWindowHandle(demoWindow);
  if (hwnd === null) return null;

  return win32.readWindowDiagnostics(nativeApi, hwnd);
}

function attachDemoWindow() {
  try {
    nativeApi = win32.loadNative();

    if (!nativeApi.available) {
      throw new Error(nativeApi.reason || "Win32 API is unavailable");
    }

    const discovered = win32.findWorkerW(nativeApi);
    const hwnd = win32.getNativeWindowHandle(demoWindow);

    if (hwnd === null) {
      throw new Error("Could not read the Electron HWND");
    }

    log("Progman:", win32.hex(discovered.progman));
    log("SHELLDLL_DefView:", win32.hex(discovered.defView));
    log("Desktop host:", discovered.hostClass, win32.hex(discovered.host));
    log("WorkerW candidates:", JSON.stringify(
      discovered.workers.map((entry) => ({
        hwnd: win32.hex(entry.hwnd),
        defView: win32.hex(entry.defView),
        visible: entry.visible
      }))
    ));

    // Keep all mouse buttons live. This is the opposite of click-through and
    // is required for the HTML test button.
    demoWindow.setIgnoreMouseEvents(false);

    const details = win32.attachToDesktop(
      nativeApi,
      hwnd,
      discovered.host
    );

    log("SetParent result:", JSON.stringify(details, null, 2));

    publishStatus({
      phase: "attached",
      attached: true,
      error: null,
      host: {
        hwnd: win32.hex(discovered.host),
        className: discovered.hostClass,
        defView: win32.hex(discovered.defView),
        visible: discovered.hostVisible,
        spawnedByDemo: discovered.spawned
      },
      defView: win32.hex(discovered.defView),
      diagnostics: details.after,
      details: {
        previousParent: details.previousParent,
        hostRect: details.hostRect,
        hostClientRect: details.hostClientRect,
        before: details.before
      }
    });

    // Electron may apply its cached bounds/visibility after the native
    // reparent. Re-check after the event loop settles and surface any surprise
    // instead of silently reporting a green test.
    setTimeout(() => {
      if (!demoWindow || demoWindow.isDestroyed()) return;

      const diagnostics = refreshDiagnostics();
      if (!diagnostics) return;

      if (diagnostics.parent !== win32.hex(discovered.host)) {
        log("WARNING: parent changed after attach:", diagnostics.parent);
        publishStatus({
          ...currentStatus,
          phase: "detached",
          attached: false,
          error: `Parent changed after attach: ${diagnostics.parent}`,
          diagnostics
        });
      } else {
        log("Post-show diagnostics:", JSON.stringify(diagnostics, null, 2));
        publishStatus({
          ...currentStatus,
          diagnostics
        });
      }
    }, 400);
  } catch (error) {
    const message = errorMessage(error);
    log("Attach failed:", error);
    publishStatus({
      phase: "failed",
      attached: false,
      error: message,
      host: null,
      defView: null,
      diagnostics: refreshDiagnostics(),
      details: null
    });

    // Leave a normal, inspectable window on failure. The demo must never leave
    // the user with an invisible unattached window.
    if (demoWindow && !demoWindow.isDestroyed()) {
      demoWindow.showInactive();
    }
  }
}

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  const width = 520;
  const height = 460;

  demoWindow = new BrowserWindow({
    x: Math.round(workArea.x + Math.max(24, Math.min(160, workArea.width / 8))),
    y: Math.round(workArea.y + Math.max(24, Math.min(160, workArea.height / 8))),
    width,
    height,
    useContentSize: true,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    show: false,
    title: "WorkerW 嵌入测试",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false
    }
  });

  demoWindow.setMenuBarVisibility(false);
  demoWindow.setAlwaysOnTop(false);

  demoWindow.once("ready-to-show", () => {
    // Show before reparenting so Electron's own visibility state agrees with
    // the Win32 window. The reparent happens immediately afterwards.
    demoWindow.showInactive();
    attachDemoWindow();
  });

  demoWindow.on("closed", () => {
    log("Window closed");
    demoWindow = null;
  });

  demoWindow.webContents.on("render-process-gone", (_event, details) => {
    log("Renderer gone:", JSON.stringify(details));
  });

  demoWindow.loadFile(path.join(__dirname, "index.html")).catch((error) => {
    log("loadFile failed:", errorMessage(error));
  });
}

ipcMain.handle("workerw:get-status", () => currentStatus);

ipcMain.handle("workerw:reapply-z-order", () => {
  try {
    if (!nativeApi || !nativeApi.available) {
      throw new Error("Win32 API is unavailable");
    }

    const hwnd = win32.getNativeWindowHandle(demoWindow);
    if (hwnd === null) throw new Error("Electron HWND is unavailable");

    const ok = win32.reapplyZOrder(nativeApi, hwnd);
    const diagnostics = refreshDiagnostics();

    publishStatus({
      ...currentStatus,
      diagnostics,
      error: ok ? null : "SetWindowPos(HWND_TOP) failed",
      details: {
        ...(currentStatus.details || {}),
        lastReapplyAt: new Date().toISOString(),
        lastReapplyOk: ok
      }
    });

    return { ok, diagnostics, error: ok ? null : "SetWindowPos failed" };
  } catch (error) {
    log("Reapply failed:", error);
    return { ok: false, diagnostics: refreshDiagnostics(), error: errorMessage(error) };
  }
});

ipcMain.handle("workerw:close", () => {
  log("Close requested from renderer");
  if (demoWindow && !demoWindow.isDestroyed()) {
    demoWindow.close();
  }
  return true;
});

ipcMain.on("workerw:pointer", (_event, payload) => {
  log("Pointer event from renderer:", JSON.stringify(payload));
});

app.whenReady().then(() => {
  log("Electron ready. PID:", process.pid);
  log("Platform:", process.platform, process.arch);
  log("Demo directory:", __dirname);
  createWindow();
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("before-quit", () => {
  log("Quitting");
});
