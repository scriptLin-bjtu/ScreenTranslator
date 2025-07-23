const express = require("express");
const puppeteer = require("puppeteer-core");
const chromeLauncher = require("chrome-launcher");

const app = express();
app.use(express.json()); // Parse JSON request body

let browser, pageYD, pageBing, lastResultYD, lastResultBing, caches;

// Launch Puppeteer and open Youdao Translate page and Bing Translate page
async function initBrowser() {
    console.log("Launching browser...");
    lastResultYD = "";
    lastResultBing = "";
    caches = [];
    const chromePath = await chromeLauncher.Launcher.getInstallations();
    if (chromePath.length == 0) {
        throw new Error("No Chrome In Your System");
    }

    browser = await puppeteer.launch({
        headless: true,
        executablePath: chromePath[0],
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    pageYD = await browser.newPage();
    console.log("Opening Youdao Translate page...");
    await pageYD.goto("https://fanyi.youdao.com/#/TextTranslate", {
        waitUntil: "networkidle2",
    });
    console.log("Youdao Translate page loaded.");
    pageBing = await browser.newPage();
    console.log("Opening Bing Translate page...");
    await pageBing.goto("https://cn.bing.com/translator?setlang=zh-cn", {
        waitUntil: "networkidle2",
    });
    console.log("Bing Translate page loaded.");
}

// Main translation function
async function translateText(content, source) {
    console.log(`Translating: "${content}"`);

    // Check cache
    const item = caches.find((i) => i.text === content);
    if (item) {
        console.log("Cache hit. Returning cached result.");
        return item.result;
    }

    console.log("Cache miss. Sending new request to browser.");

    let result;

    if (source == "youdao") {
        await pageYD.bringToFront();
        // Clear input box
        console.log("Clearing input box...");
        await pageYD.evaluate(() => {
            document.querySelector("#js_fanyi_input").innerText = "";
        });

        // Input text
        console.log("Entering new text into input box...");
        await pageYD.evaluate((text) => {
            const inputDiv = document.querySelector("#js_fanyi_input");
            inputDiv.innerText = text;
            const event = new Event("input", { bubbles: true });
            inputDiv.dispatchEvent(event);
        }, content);

        // Press Enter to trigger translation
        console.log("Triggering translation via Enter key...");
        await pageYD.keyboard.press("Enter");

        // Wait for translation result to update
        console.log("Waiting for new translation result...");
        await pageYD.waitForFunction(
            (lastResultYD) => {
                const span = document.querySelector(
                    "#js_fanyi_output_resultOutput > p > span"
                );
                return (
                    span &&
                    span.innerText.trim().length > 0 &&
                    span.innerText.trim() !== lastResultYD
                );
            },
            { timeout: 15000 },
            lastResultYD
        );

        console.log("New translation result detected.");

        // Extract result
        result = await pageYD.evaluate(() => {
            const span = document.querySelector(
                "#js_fanyi_output_resultOutput > p > span"
            );
            return span ? span.innerText.trim() : null;
        });
        lastResultYD = result;
    }
    if (source == "bing") {
        await pageBing.bringToFront();
        // Clear input box
        console.log("Clearing input box...");
        await pageBing.evaluate(() => {
            document.querySelector("#tta_input_ta").innerText = "";
        });

        // Input text
        console.log("Entering new text into input box...");
        await pageBing.evaluate((text) => {
            const inputDiv = document.querySelector("#tta_input_ta");
            inputDiv.innerText = text;
            const event = new Event("input", { bubbles: true });
            inputDiv.dispatchEvent(event);
        }, content);

        // Press Enter to trigger translation
        console.log("Triggering translation via Enter key...");
        await pageBing.keyboard.press("Enter");

        // Wait for translation result to update
        console.log("Waiting for new translation result...");
        await pageBing.waitForFunction(
            (lastResultBing) => {
                const span = document.querySelector("#tta_output_ta");
                return (
                    span &&
                    span.innerText.trim().length > 0 &&
                    span.innerHTML.trim() !== "..." &&
                    span.innerText.trim() !== lastResultBing + " ..."
                );
            },
            { timeout: 10000 },
            lastResultBing
        );

        console.log("New translation result detected.");

        // Extract result
        result = await pageBing.evaluate(() => {
            const span = document.querySelector("#tta_output_ta");
            return span ? span.innerText.trim() : null;
        });
        lastResultBing = result;
    }

    console.log(`Translation complete: "${result}"`);

    // Update last result and cache
    caches.push({ text: content, result });
    if (caches.length > 10) {
        caches.pop();
    }

    return result;
}

// API endpoint
app.post("/translate", async (req, res) => {
    const { content, source } = req.body;

    if (!content || typeof content !== "string") {
        console.log("Bad request: Missing or invalid 'content'.");
        return res.status(400).json({ error: "Missing or invalid content" });
    }

    try {
        const result = await translateText(content, source);
        res.json({ result });
    } catch (error) {
        console.error("Translation error:", error);
        res.status(500).json({ error: "Translation failed" });
    }
});

// Start server
const PORT = 8888;
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await initBrowser();
});
