const screenshot = require("screenshot-desktop");
const { uIOhook, UiohookKey } = require("uiohook-napi");
const { Jimp } = require("jimp");
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

let cutmode = false;
let waitend = false;
let startPoint = { x: 0, y: 0 };
let endPoint = { x: 0, y: 0 };

function moniter(openfunc, closefunc, processfunc, alert, key = UiohookKey.O) {
    uIOhook.on("keydown", (e) => {
        if (e.keycode === key && e.altKey) {
            cutmode = !cutmode;
            waitend = false;
            cutmode ? openfunc() : closefunc();
            console.log("cutmode:", cutmode);
            alert("截屏模式:" + cutmode);
        }
    });
    uIOhook.on("mousedown", (e) => {
        if (cutmode && !waitend) {
            startPoint = { x: e.x, y: e.y };
            console.log("start", startPoint);
            waitend = true;
        }
    });
    uIOhook.on("mouseup", async (e) => {
        if (cutmode && waitend) {
            closefunc();
            cutmode = false;
            waitend = false;
            endPoint = { x: e.x, y: e.y };
            console.log("end", endPoint);
            await cutAndMerge({
                x:
                    Math.sign(startPoint.x) === Math.sign(endPoint.x)
                        ? Math.min(startPoint.x, endPoint.x)
                        : Math.min(startPoint.x, 0),
                y:
                    Math.sign(startPoint.y) === Math.sign(endPoint.y)
                        ? Math.min(startPoint.y, endPoint.y)
                        : Math.min(startPoint.y, 0),
                width: Math.abs(endPoint.x - startPoint.x),
                height:
                    Math.sign(startPoint.y) === Math.sign(endPoint.y)
                        ? Math.abs(endPoint.y - startPoint.y)
                        : Math.abs(startPoint.y),
            });
            alert("截图成功,正在处理");
            await processfunc();
            alert("处理成功");
        }
    });
    uIOhook.start();
}

async function cutAndMerge({ x, y, width, height }) {
    try {
        const displays = await screenshot.listDisplays();
        //console.log(displays);

        // 记录所有截图信息（包括图片和对应屏幕的位置）
        const images = [];

        // 获取所有截图
        for (let i = 0; i < displays.length; i++) {
            const display = displays[i];
            const imgBuffer = await screenshot({
                screen: display.id,
                format: "png",
            });
            const img = await Jimp.read(imgBuffer);

            images.push({
                img,
                x: display.left,
                y: display.top,
                width: display.width,
                height: display.height,
            });
        }

        // 计算最终画布的边界
        const minX = Math.min(...images.map((i) => i.x));
        const minY = Math.min(...images.map((i) => i.y));
        const maxX = Math.max(...images.map((i) => i.x + i.width));
        const maxY = Math.max(...images.map((i) => i.y + i.height));
        const totalWidth = maxX - minX;
        const totalHeight = maxY - minY;

        // 创建大画布
        const merged = new Jimp({ width: totalWidth, height: totalHeight });

        // 把每个图贴到正确的位置（偏移原点）
        for (const item of images) {
            const offsetX = item.x - minX;
            const offsetY = item.y - minY;
            merged.composite(item.img, offsetX, offsetY);
        }

        // 裁剪区域
        const cropX = x - minX;
        const cropY = y - minY;
        const cropped = merged.clone().crop({
            x: cropX,
            y: cropY,
            w: width,
            h: height,
        });

        // 保存裁剪结果
        //const outputPath = path.join(__dirname, "cropped-region.png");//开发环境
        const userDataDir = app.getPath("userData");
        const outputPath = path.join(userDataDir, "cropped-region.png"); //打包环境
        await cropped.write(outputPath);
        console.log("image saved:", outputPath);
    } catch (err) {
        console.error("err:", err);
    }
}

module.exports = { moniter, cutAndMerge };
