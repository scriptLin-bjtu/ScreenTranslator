const fs = require("fs/promises");
const path = require("path");

async function traditionalTranslate(
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
        return {
            origin: extractedText,
            translate: translateResult.result,
            knowledge: "",
        };
    } catch (err) {
        console.error("请求出错:", err);
    }
}
async function VLMtranslate(key) {
    const url = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
    const imageBuffer = await fs.readFile(path.resolve("cropped-region.png"));
    const base64ImageData = `data:image/png;base64,${imageBuffer.toString(
        "base64"
    )}`;

    const body = {
        model: "glm-4.1v-thinking-flash",
        do_sample: true,
        stream: false,
        thinking: { type: "enabled" },
        temperature: 0.8,
        top_p: 0.7,
        max_tokens: 16000,
        tool_choice: "auto",
        response_format: { type: "json_object" },
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "image_url",
                        image_url: {
                            url: base64ImageData,
                        },
                    },
                    {
                        type: "text",
                        text:
                            "这是一个用户截图的内容，请你提取里面的文字信息，返回json格式，要求三个字符串属性:" +
                            "1.origin:提取的原始文字信息。" +
                            "2.translate:翻译润色成中文后的信息。" +
                            "3.knowledge:原文中重点词语或用法的解释，从语言学习的角度",
                    },
                ],
            },
        ],
    };

    const options = {
        method: "POST",
        headers: {
            Authorization: "Bearer " + key,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    };

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        const message = data.choices?.[0]?.message?.content;
        return JSON.parse(message);
    } catch (error) {
        console.error(error);
    }
}

module.exports = { traditionalTranslate, VLMtranslate };
