"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("guideApi", {
  onGuides: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on("guides:update", listener);
    return () => ipcRenderer.removeListener("guides:update", listener);
  }
});
