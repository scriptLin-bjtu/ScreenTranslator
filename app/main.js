const { app, BrowserWindow, screen, ipcMain } = require("electron");
const { moniter } = require("./tools");
const { traditionalTranslate, VLMtranslate } = require("./fetch");
const { LocalStorage } = require("node-localstorage");
const path = require("path");
const { exec } = require("child_process");
require("./puppeteer.js");

const localStorage = new LocalStorage("./config");

let mainWindow;
let overlayWindows = [];
let mode = Number(localStorage.getItem("mode")) || 1; //1为传统翻译。2为大模型翻译
let apikey = localStorage.getItem("apikey") || "";
let ocrfilepath =
    localStorage.getItem("ocrfilepath") ||
    "D:\\project\\nodejs-project\\fy\\paddleocr2\\output\\main666.exe";
let ocrprocess = exec(ocrfilepath);
let translateServer = localStorage.getItem("translateServer") || "youdao";

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
        const translateObj =
            mode == 1
                ? await traditionalTranslate()
                : await VLMtranslate(apikey);
        mainWindow.webContents.send("show-text", translateObj);
    });

    ipcMain.on("close-overlay-windows", () => {
        console.log("recieve cut");
    });

    ipcMain.on("sendConfig", (event, options) => {
        console.log("config:", options);
        if (options.mode === "mode1") {
            mode = 1;
        } else if (options.mode === "mode2") {
            mode = 2;
        }

        if (options.apikey.length > 0) {
            apikey = options.apikey;
        }

        if (options.ocrfilepath.length > 0) {
            ocrfilepath = options.ocrfilepath;
        }

        translateServer = options.translateServer;

        localStorage.setItem("mode", mode);
        localStorage.setItem("apikey", apikey);
        localStorage.setItem("ocrfilepath", ocrfilepath);
        localStorage.setItem("translateServer", translateServer);
    });

    ipcMain.handle("getConfig", async () => {
        return {
            mode,
            apikey,
            ocrfilepath,
            translateServer,
        };
    });

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        exec("taskkill /IM main666.exe /F");
        app.quit();
    }
});
