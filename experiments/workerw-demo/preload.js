"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("workerwDemo", {
  getStatus: () => ipcRenderer.invoke("workerw:get-status"),
  reapplyZOrder: () => ipcRenderer.invoke("workerw:reapply-z-order"),
  close: () => ipcRenderer.invoke("workerw:close"),
  reportPointer: (payload) => ipcRenderer.send("workerw:pointer", payload),
  onStatus: (callback) => {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on("workerw:status", listener);

    return () => {
      ipcRenderer.removeListener("workerw:status", listener);
    };
  }
});
