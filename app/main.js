const { app, BrowserWindow, screen, ipcMain } = require("electron");
const { moniter, cutAndMerge } = require("./tools");
const { processImage } = require("./fetch");
const path = require("path");

let mainWindow;
let overlayWindows = [];

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.loadFile("index.html");
}

function createOverlayWindows() {
    const displays = screen.getAllDisplays();
    overlayWindows.forEach((win) => win.close());
    overlayWindows = [];

    displays.forEach((display) => {
        const { bounds } = display;

        const overlay = new BrowserWindow({
            x: bounds.x,
            y: bounds.y,
            width: Math.floor(bounds.width),
            height: Math.floor(bounds.height),
            transparent: true,
            frame: false,
            alwaysOnTop: true,
            skipTaskbar: true,
            focusable: true,
            resizable: false,
            webPreferences: {
                preload: path.join(__dirname, "preload.js"),
                nodeIntegration: false,
                contextIsolation: true,
            },
        });
        overlay.setAlwaysOnTop(true, "screen-saver");

        overlay.loadFile("overlay.html");
        overlay.setBounds({
            x: bounds.x,
            y: bounds.y,
            width: Math.floor(bounds.width),
            height: Math.floor(bounds.height),
        });

        overlayWindows.push(overlay);
    });
}

function closeOverlayWindows() {
    overlayWindows.forEach((win) => {
        if (!win.isDestroyed()) win.close();
    });
    overlayWindows = [];
}

app.whenReady().then(() => {
    createMainWindow();
    moniter(createOverlayWindows, closeOverlayWindows, async () => {
        const text = await processImage();
        mainWindow.webContents.send("show-text", text);
    });

    ipcMain.on("close-overlay-windows", () => {
        console.log("recieve cut");
    });

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
