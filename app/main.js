const { app, BrowserWindow, globalShortcut, screen } = require("electron");
const screenshot = require("screenshot-desktop");
const { Jimp } = require("jimp");
const path = require("path");
const fs = require("fs");

let mainWindow;
let overlayWindow;

// Create the main application window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"), // Optional preload script
        },
    });

    mainWindow.loadFile("index.html");
}

// Create the transparent overlay window (initially hidden)
function createOverlayWindow() {
    overlayWindow = new BrowserWindow({
        width: 400,
        height: 200,
        x: 100, // Set position to simplify screenshot cropping
        y: 100,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        movable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    overlayWindow.loadURL(`data:text/html;charset=utf-8,
        <style>
            body {
                margin: 0;
                background: rgba(0, 0, 0, 0.5);
                color: white;
                font-size: 28px;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                user-select: none;
            }
        </style>
        <body>Overlay Window</body>
    `);

    overlayWindow.hide(); // Start hidden
}

// Capture the desktop area under the overlay window and save as an image
async function captureBackgroundUnderOverlay() {
    const bounds = overlayWindow.getBounds();
    const scaleFactor = screen.getPrimaryDisplay().scaleFactor;

    const realX = Math.floor(bounds.x * scaleFactor);
    const realY = Math.floor(bounds.y * scaleFactor);
    const realWidth = Math.floor(bounds.width * scaleFactor);
    const realHeight = Math.floor(bounds.height * scaleFactor);

    try {
        const imgBuffer = await screenshot({ format: "png" });
        const image = await Jimp.read(imgBuffer);

        const cropped = image.crop({
            x: realX,
            y: realY,
            w: realWidth,
            h: realHeight,
        });

        const savePath = path.join(__dirname, "background-crop.png");
        await cropped.write(savePath);

        console.log("Screenshot saved successfully:", savePath);
    } catch (err) {
        console.error("Failed to capture screenshot:", err);
    }
}

// Toggle the overlay window visibility and capture background before showing
async function toggleOverlayWindow() {
    if (!overlayWindow) return;

    if (overlayWindow.isVisible()) {
        overlayWindow.hide();
    } else {
        await captureBackgroundUnderOverlay();
        overlayWindow.show();
        overlayWindow.focus();
    }
}

app.whenReady().then(() => {
    createMainWindow();
    createOverlayWindow();

    // Register global shortcut: Ctrl + O
    globalShortcut.register("Control+O", () => {
        toggleOverlayWindow();
    });

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

// Quit the app when all windows are closed (except on macOS)
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

// Unregister all shortcuts on app quit
app.on("will-quit", () => {
    globalShortcut.unregisterAll();
});
