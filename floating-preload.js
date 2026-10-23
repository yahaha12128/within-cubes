"use strict";

const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("floatingApi", {
  getData: () => ipcRenderer.invoke("floating:get-data"),
  getSystemIcon: (filePath) => ipcRenderer.invoke("floating:get-icon", filePath),
  openFile: (filePath) => ipcRenderer.invoke("floating:open-file", filePath),
  showContextMenu: (filePath) => ipcRenderer.invoke("floating:context-menu", filePath),
  resetGrid: () => ipcRenderer.invoke("floating:reset-grid"),
  rename: (name) => ipcRenderer.invoke("floating:rename", name),
  toggleLock: () => ipcRenderer.invoke("floating:toggle-lock"),
  close: () => ipcRenderer.invoke("floating:close"),
  setCollapsed: (collapsed) => ipcRenderer.invoke("floating:set-collapsed", collapsed),
  saveOrder: (keys) => ipcRenderer.invoke("floating:save-order", keys),
  startCategoryDrag: (filePath) => ipcRenderer.invoke("floating:drag-start", filePath),
  endCategoryDrag: (options) => ipcRenderer.invoke("floating:drag-end", options),
  onDragTarget: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on("floating:drag-target", listener);
    return () => ipcRenderer.removeListener("floating:drag-target", listener);
  },
  onExternalDropResult: (callback) => {
    const listener = (_event, result) => callback(result);
    ipcRenderer.on("floating:external-drop-result", listener);
    return () => ipcRenderer.removeListener("floating:external-drop-result", listener);
  },
  onToast: (callback) => {
    const listener = (_event, message) => callback(message);
    ipcRenderer.on("floating:toast", listener);
    return () => ipcRenderer.removeListener("floating:toast", listener);
  },
  ready: () => ipcRenderer.send("floating:ready"),
  onUpdate: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on("floating:update", listener);
    return () => ipcRenderer.removeListener("floating:update", listener);
  }
});

// 资源管理器 → 分类小组件：在预加载层读取 File 对应的真实路径，
// 避免渲染进程在 sandbox 下拿不到磁盘路径。
window.addEventListener("dragover", (event) => {
  if (
    event.dataTransfer &&
    Array.from(event.dataTransfer.types || []).includes("Files")
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }
}, true);

window.addEventListener("drop", (event) => {
  const files = event.dataTransfer && event.dataTransfer.files;

  if (!files || files.length === 0) return;

  const paths = [];

  for (const file of Array.from(files)) {
    try {
      const filePath = webUtils.getPathForFile(file);
      if (filePath) paths.push(filePath);
    } catch (error) {
      // 忽略无法解析的拖入项
    }
  }

  if (paths.length === 0) return;

  event.preventDefault();
  event.stopPropagation();
  ipcRenderer.invoke("floating:assign-dropped-files", paths).catch(() => {});
}, true);
