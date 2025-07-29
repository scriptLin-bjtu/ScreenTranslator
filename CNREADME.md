# 屏幕翻译工具

English

[![许可证: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

基于Electron的屏幕翻译工具，结合OCR和翻译服务。

## 功能特点

- 屏幕截图和区域选择
- 使用PaddleOCR进行文字识别
- 翻译服务(有道/必应)
- 支持智谱GLM-4.1V-flash大模型翻译
- 支持快捷键快速调用
- 跨平台支持(Windows/macOS/Linux)

## 快速开始

### 环境要求

- Node.js 16+
- Python 3.7+
- Git

### 安装步骤

1. 克隆仓库:
```bash
git clone https://github.com/yourusername/ScreenTranslator.git
cd ScreenTranslator
```

2. 设置Python环境(OCR服务):
```bash
cd paddleocr2
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/macOS
pip install paddlepaddle paddleocr flask pillow
```

3. 安装Node.js依赖:
```bash
cd ../app
npm install
```

### 运行应用

1. 启动OCR服务(在一个终端中):
```bash
cd paddleocr2
python main.py
```

2. 启动Electron应用(在另一个终端中):
```bash
cd app
npm start
```

## 使用方法

- 按下配置的快捷键截取屏幕区域
- 选中的文本将自动识别并翻译
- 可选择传统模式或VLM模式

## 配置说明

### OCR设置

编辑 `paddleocr2/main.py` 修改:
- OCR语言设置
- 服务器端口(默认: 6987)

### 翻译设置

编辑 `app/config/translateServer` 修改:
- 默认翻译服务
- API端点

## 开发指南

### 项目结构

- `app/`: Electron应用(前端)
  - `main.js`: 主进程
  - `puppeteer.js`: 翻译处理
  - `tools.js`: 工具函数
- `paddleocr2/`: OCR服务(后端)
  - `main.py`: 使用PaddleOCR的Flask服务器

### 生产环境构建

```bash
cd app
npm run dist
```

## 注意事项

1. 关于PaddleOCR服务打包问题，请参考: [PaddleOCR Discussion #11490](https://github.com/PaddlePaddle/PaddleOCR/discussions/11490)
2. 如果使用传统翻译模式，需要下载OCR服务文件并在软件中配置OCR文件路径。如果使用大模型翻译模式，需要在软件中配置[API key](https://bigmodel.cn/console/overview)。

## 贡献指南

欢迎贡献代码！请提交issue或pull request。

## 许可证

ISC © [ScriptLin]
