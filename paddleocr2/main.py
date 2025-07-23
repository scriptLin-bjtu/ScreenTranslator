from flask import Flask, request, jsonify
from paddleocr import PaddleOCR
from PIL import Image
import os
import time

# 初始化 OCR 实例（英文 + 不启用方向分类）
ocr = PaddleOCR(use_angle_cls=False, lang='en')

# 创建 Flask 应用
app = Flask(__name__)

# 创建 uploads 文件夹（如果不存在）
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/ocr', methods=['POST'])
def ocr_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    try:
        # 生成唯一文件名
        filename = f"{int(time.time() * 1000)}.png"
        image_path = os.path.join(UPLOAD_FOLDER, filename)

        # 保存图片到本地 uploads/ 文件夹
        image = Image.open(file.stream).convert('RGB')
        image.save(image_path)

        # 使用文件路径进行 OCR 识别
        results = ocr.ocr(image_path, cls=False)

        # 提取识别结果
        response_data = []
        for line in results:
            for box, (text, score) in line:
                response_data.append({
                    'text': text,
                    'confidence': round(score, 4),
                    'bbox': box
                })

        os.remove(image_path)

        return jsonify({'results': response_data})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 启动 Flask 服务器
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6987)



