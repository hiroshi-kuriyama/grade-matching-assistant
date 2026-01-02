/**
 * 画像処理ユーティリティ
 * Blob→Base64変換、画像リサイズ
 */

export interface ImageFeatures {
  brightness: number;
  rgbBalance: { r: number; g: number; b: number };
  saturation: number;
  colorTemperatureHint: string;
  width: number;
  height: number;
}

/**
 * 画像ファイルをBase64のdata URLに変換
 * OpenAI API用にリサイズ（最大512px幅）
 */
export async function imageToBase64(file: File, maxWidth: number = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const blob = new Blob([arrayBuffer], { type: file.type });
        
        // createImageBitmapで画像を読み込み
        const imageBitmap = await createImageBitmap(blob);
        
        // リサイズが必要かチェック
        let width = imageBitmap.width;
        let height = imageBitmap.height;
        
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = Math.round(height * ratio);
        }
        
        // CanvasでリサイズしてJPEGに変換
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(imageBitmap, 0, 0, width, height);
        
        // JPEG形式でBase64に変換
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to convert to blob'));
              return;
            }
            
            const reader2 = new FileReader();
            reader2.onload = () => {
              const base64 = (reader2.result as string).split(',')[1];
              resolve(`data:image/jpeg;base64,${base64}`);
            };
            reader2.onerror = () => reject(new Error('Failed to read blob'));
            reader2.readAsDataURL(blob);
          },
          'image/jpeg',
          0.85
        );
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 画像から特徴量を抽出
 */
export async function extractFeatures(file: File): Promise<ImageFeatures> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const blob = new Blob([arrayBuffer], { type: file.type });
        const imageBitmap = await createImageBitmap(blob);
        
        // Canvasで画像データを取得
        const canvas = document.createElement('canvas');
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(imageBitmap, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 平均輝度を計算
        let totalBrightness = 0;
        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        let saturationSum = 0;
        
        const pixelCount = data.length / 4;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i] / 255.0;
          const g = data[i + 1] / 255.0;
          const b = data[i + 2] / 255.0;
          
          // 平均輝度（RGB平均）
          const brightness = (r + g + b) / 3;
          totalBrightness += brightness;
          
          // RGB合計
          rSum += r;
          gSum += g;
          bSum += b;
          
          // 彩度（RGB標準偏差）
          const mean = (r + g + b) / 3;
          const variance = ((r - mean) ** 2 + (g - mean) ** 2 + (b - mean) ** 2) / 3;
          saturationSum += Math.sqrt(variance);
        }
        
        const brightness = totalBrightness / pixelCount;
        const rgbBalance = {
          r: rSum / pixelCount,
          g: gSum / pixelCount,
          b: bSum / pixelCount,
        };
        const saturation = saturationSum / pixelCount;
        
        // 色温度傾向
        const colorTemperatureHint = calculateColorTemperatureHint(rgbBalance);
        
        resolve({
          brightness,
          rgbBalance,
          saturation,
          colorTemperatureHint,
          width: imageBitmap.width,
          height: imageBitmap.height,
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * RGBバランスから色温度の傾向を推定
 */
function calculateColorTemperatureHint(rgbBalance: { r: number; g: number; b: number }): string {
  const { r, g, b } = rgbBalance;
  
  if (r > g && r > b) {
    return '暖色寄り';
  } else if (b > r && b > g) {
    return '寒色寄り';
  } else {
    return '中性';
  }
}

/**
 * 画像ファイルをDataURLに変換（プレビュー用）
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

