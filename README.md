技术选型：
ocr:
弃用Tesseract.js 识别效果差
弃用easyocr 体积太大
paddleocr(打包的问题:https://github.com/PaddlePaddle/PaddleOCR/discussions/11490)采用
loacalhost:6987:ocr
formdata{image:imagefile}
Windows: python -m venv venv 并激活 venv\Scripts\activate
wechat dll不合法
翻译 api:vercel deepl x
目前采用puppeteer访问有道/必应翻译的操作
localhost:8888/translate
{content:string,source:<"youdao"|"bing">}

智谱GLM 4.1V视觉模型
ocr+翻译

界面：
electron


To Do List:
7.21
优化orc时间，也许采用两个模型（一个一般的识别，一个针对手写体识别）
寻找翻译技术选型
集成到electron里
——1.electron可视化界面
——2.一个快捷键实现打开截图+翻译窗口