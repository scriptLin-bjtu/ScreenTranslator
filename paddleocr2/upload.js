import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// 兼容 __dirname (ESM 环境下)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    try {
        // 读取文件内容
        const filePath = path.join(__dirname, "2.png");
        const fileContent = await fs.readFile(filePath);
        const filename = path.basename(filePath);

        // 构造 multipart/form-data body 和 boundary
        const boundary =
            "----WebKitFormBoundary" + Math.random().toString(16).slice(2);

        const payloadStart = Buffer.from(
            `--${boundary}\r\n` +
                `Content-Disposition: form-data; name="image"; filename="${filename}"\r\n` +
                `Content-Type: image/png\r\n\r\n`
        );
        const payloadEnd = Buffer.from(`\r\n--${boundary}--\r\n`);

        // 因 fetch 需要 body 是 ReadableStream 或 Blob，Node.js 18+ 支持 Buffer 也可以直接传
        const body = Buffer.concat([payloadStart, fileContent, payloadEnd]);

        // 发送 OCR 请求
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
        console.log("OCR 提取结果:", extractedText);

        // 发送翻译请求
        const translatePayload = {
            content: extractedText,
            source: "youdao",
        };

        const translateResponse = await fetch(
            "http://localhost:8888/translate",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(translatePayload),
            }
        );

        if (!translateResponse.ok) {
            throw new Error(
                `翻译请求失败，状态码: ${translateResponse.status}`
            );
        }

        const translateResult = await translateResponse.json();
        console.log("翻译接口返回结果:\n", translateResult);
    } catch (err) {
        console.error("请求出错:", err);
    }
}

main();
