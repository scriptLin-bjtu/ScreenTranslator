const fs = require("fs/promises");
const path = require("path");
const { createReadStream } = require("fs");

/**
 * 执行 OCR 并翻译指定图片文件
 * @param {string} imagePath - 图片路径，默认使用当前目录下的 "cropped-region.png"
 * @returns {Promise<void>}
 */
async function processImage(
    imagePath = path.join(__dirname, "cropped-region.png")
) {
    try {
        const fileContent = await fs.readFile(imagePath);
        const filename = path.basename(imagePath);

        const boundary =
            "----WebKitFormBoundary" + Math.random().toString(16).slice(2);

        const payloadStart = Buffer.from(
            `--${boundary}\r\n` +
                `Content-Disposition: form-data; name="image"; filename="${filename}"\r\n` +
                `Content-Type: image/png\r\n\r\n`
        );
        const payloadEnd = Buffer.from(`\r\n--${boundary}--\r\n`);
        const body = Buffer.concat([payloadStart, fileContent, payloadEnd]);

        const ocrResponse = await fetch("http://localhost:6987/ocr", {
            method: "POST",
            headers: {
                "Content-Type": `multipart/form-data; boundary=${boundary}`,
                "Content-Length": body.length.toString(),
            },
            body,
        });

        if (!ocrResponse.ok) {
            throw new Error(`OCR 请求失败，状态码: ${ocrResponse.status}`);
        }

        const ocrResult = await ocrResponse.json();
        const extractedText =
            ocrResult?.results?.map((i) => i.text).join(" ") || "";
        console.log("OCR result:", extractedText);

        const translateResponse = await fetch(
            "http://localhost:8888/translate",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: extractedText,
                    source: "youdao",
                }),
            }
        );

        if (!translateResponse.ok) {
            throw new Error(
                `翻译请求失败，状态码: ${translateResponse.status}`
            );
        }

        const translateResult = await translateResponse.json();
        console.log("translate result:\n", translateResult);
        return { ocr: extractedText, translate: translateResult.result };
    } catch (err) {
        console.error("请求出错:", err);
    }
}

module.exports = { processImage };
