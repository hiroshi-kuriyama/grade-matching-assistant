"""
画像の特徴量を抽出するモジュール
平均輝度、RGBバランス、彩度傾向などを計算
"""

from PIL import Image
import numpy as np
import base64
import io
from typing import Dict, Tuple


def load_image(image_path: str) -> Image.Image:
    """画像を読み込む"""
    try:
        img = Image.open(image_path)
        # RGBに変換（RGBAやグレースケールの場合も対応）
        if img.mode != 'RGB':
            img = img.convert('RGB')
        return img
    except Exception as e:
        raise ValueError(f"画像の読み込みに失敗しました: {image_path} - {e}")


def calculate_brightness(img: Image.Image) -> float:
    """平均輝度を計算（0-1の範囲）"""
    img_array = np.array(img)
    # RGBの平均を計算
    brightness = np.mean(img_array) / 255.0
    return float(brightness)


def calculate_rgb_balance(img: Image.Image) -> Dict[str, float]:
    """RGB各チャンネルの平均値を計算（0-1の範囲）"""
    img_array = np.array(img)
    r_mean = np.mean(img_array[:, :, 0]) / 255.0
    g_mean = np.mean(img_array[:, :, 1]) / 255.0
    b_mean = np.mean(img_array[:, :, 2]) / 255.0
    
    return {
        'r': float(r_mean),
        'g': float(g_mean),
        'b': float(b_mean)
    }


def calculate_saturation(img: Image.Image) -> float:
    """平均彩度を計算（簡易版：RGBの標準偏差ベース）"""
    img_array = np.array(img).astype(np.float32) / 255.0
    
    # 各ピクセルのRGB標準偏差を計算（彩度の簡易指標）
    pixel_saturations = np.std(img_array, axis=2)
    avg_saturation = np.mean(pixel_saturations)
    
    return float(avg_saturation)


def calculate_color_temperature_hint(rgb_balance: Dict[str, float]) -> str:
    """RGBバランスから色温度の傾向を推定"""
    r, g, b = rgb_balance['r'], rgb_balance['g'], rgb_balance['b']
    
    # 簡易的な判定
    if r > g and r > b:
        return "暖色寄り"
    elif b > r and b > g:
        return "寒色寄り"
    else:
        return "中性"


def image_to_base64(image_path: str, max_size: int = 2048) -> str:
    """
    画像をbase64エンコードして返す
    OpenAI APIのサイズ制限に合わせて、必要に応じてリサイズする
    """
    img = load_image(image_path)
    
    # サイズ制限に合わせてリサイズ（アスペクト比を維持）
    if img.width > max_size or img.height > max_size:
        ratio = min(max_size / img.width, max_size / img.height)
        new_width = int(img.width * ratio)
        new_height = int(img.height * ratio)
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    # JPEG形式でメモリに保存
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG', quality=85)
    buffer.seek(0)
    
    # base64エンコード
    image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
    
    return image_base64


def extract_features(image_path: str) -> Dict:
    """画像から特徴量を抽出して辞書で返す"""
    img = load_image(image_path)
    
    brightness = calculate_brightness(img)
    rgb_balance = calculate_rgb_balance(img)
    saturation = calculate_saturation(img)
    color_temp_hint = calculate_color_temperature_hint(rgb_balance)
    
    return {
        'brightness': brightness,
        'rgb_balance': rgb_balance,
        'saturation': saturation,
        'color_temperature_hint': color_temp_hint,
        'width': img.width,
        'height': img.height
    }

