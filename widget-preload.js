"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("widgetApi", {
  getData: () => ipcRenderer.invoke("widget:get-data"),
  getMusicSession: () => ipcRenderer.invoke("widget:get-music-session"),
  controlMusic: (command) => ipcRenderer.invoke("widget:music-control", command),
  rename: (name) => ipcRenderer.invoke("widget:rename", name),
  toggleLock: () => ipcRenderer.invoke("widget:toggle-lock"),
  close: () => ipcRenderer.invoke("widget:close"),
  ready: () => ipcRenderer.send("widget:ready"),
  onUpdate: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on("widget:update", listener);
    return () => ipcRenderer.removeListener("widget:update", listener);
  },
  onMusicUpdate: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("widget:music-update", listener);
    return () => ipcRenderer.removeListener("widget:music-update", listener);
  }
});
