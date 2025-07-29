const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    openOverlay: () => ipcRenderer.send("open-overlay"),
    closeOverlay: () => ipcRenderer.send("close-overlay-windows"),
    sendConfig: (options) => ipcRenderer.send("sendConfig", options),
    getConfig: async () => await ipcRenderer.invoke("getConfig"),
    onShowText: (callback) =>
        ipcRenderer.on("show-text", (event, obj) => callback(obj)),
    onConsole: (callback) =>
        ipcRenderer.on("console", (event, obj) => callback(obj)),
});
