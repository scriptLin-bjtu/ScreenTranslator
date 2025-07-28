const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    openOverlay: () => ipcRenderer.send("open-overlay"),
    closeOverlay: () => ipcRenderer.send("close-overlay-windows"),
    onShowText: (callback) =>
        ipcRenderer.on("show-text", (event, text) => callback(text)),
});
