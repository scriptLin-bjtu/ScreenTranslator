# ScreenTranslator

[中文](https://github.com/scriptLin-bjtu/ScreenTranslator/blob/master/CNREADME.md)

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

An Electron-based screen translation tool that combines OCR and translation services.

![show1](https://github.com/scriptLin-bjtu/ScreenTranslator/blob/master/screen01.png)
![show2](https://github.com/scriptLin-bjtu/ScreenTranslator/blob/master/screen02.png)
![show3](https://github.com/scriptLin-bjtu/ScreenTranslator/blob/master/screen03.png)

## Features

- Screen capture and region selection
- Text recognition using PaddleOCR
- Translation services (Youdao/Bing)
- VLM Translation (GLM-4.1V-flash)
- Hotkey support for quick access
- Cross-platform support (Windows/macOS/Linux)

## Quick Start

### Prerequisites

- Node.js 16+
- Python 3.7+
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ScreenTranslator.git
cd ScreenTranslator
```

2. Set up Python environment (for OCR service):
```bash
cd paddleocr2
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/macOS
pip install paddlepaddle paddleocr flask pillow
```

3. Install Node.js dependencies:
```bash
cd ../app
npm install
```

### Running the Application

1. Start the OCR service (in one terminal):
```bash
cd paddleocr2
python main.py
```

2. Start the Electron app (in another terminal):
```bash
cd app
npm start
```

## Usage

- Press the configured hotkey to capture screen region
- Selected text will be automatically recognized and translated
- Choose between traditional or VLM mode

## Configuration

### OCR Settings

Edit `paddleocr2/main.py` to modify:
- OCR language settings
- Server port (default: 6987)

### Translation Settings

Edit `app/config/translateServer` to change:
- Default translation service
- API endpoints

## Development

### Project Structure

- `app/`: Electron application (frontend)
  - `main.js`: Main process
  - `puppeteer.js`: Translation handling
  - `tools.js`: Utility functions
- `paddleocr2/`: OCR service (backend)
  - `main.py`: Flask server with PaddleOCR

### Building for Production

```bash
cd app
npm run dist
```

## Notice

1. About PaddleOCR service packaging issues, please refer to: [PaddleOCR Discussion #11490](https://github.com/PaddlePaddle/PaddleOCR/discussions/11490)
2. If using traditional translation mode, you need to download OCR service files and configure the OCR file path in the software. If using large model translation mode, you need to configure the [API key](https://bigmodel.cn/console/overview) in the software.


## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

ISC © [ScriptLin]
