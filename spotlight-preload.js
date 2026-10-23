"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("spotlightApi", {
  search: (query) => ipcRenderer.invoke("spotlight:search", query),
  openResult: (payload) => ipcRenderer.invoke("spotlight:open-result", payload || {}),
  submitQuery: (query) => ipcRenderer.invoke("spotlight:submit-query", query),
  resize: (height) => ipcRenderer.invoke("spotlight:resize", height),
  hide: () => ipcRenderer.invoke("spotlight:hide"),
  onReset: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("spotlight:reset", listener);
    return () => ipcRenderer.removeListener("spotlight:reset", listener);
  }
});
