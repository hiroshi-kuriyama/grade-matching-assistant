/**
 * プロンプト生成
 * analyzer/prompt.py の章立て・語彙を移植
 */

import type { ImageFeatures } from './images';

/**
 * 分析プロンプトを生成
 * analyzer/prompt.py の内容をそのまま移植
 */
export function createAnalysisPrompt(
  referenceFeatures: ImageFeatures,
  targetFeatures: ImageFeatures
): string {
  return `あなたはDaVinci Resolveのカラーグレーディングの専門家です。
以下の2枚の画像（リファレンス画像と編集対象画像）を視覚的に分析し、編集対象画像をリファレンス画像のカラー傾向に近づけるための具体的な操作手順を提示してください。

画像と併せて、以下の数値データも参考にしてください：

## リファレンス画像の特徴（数値データ）
- 平均輝度: ${referenceFeatures.brightness.toFixed(3)} (0=暗い, 1=明るい)
- RGBバランス: R=${referenceFeatures.rgbBalance.r.toFixed(3)}, G=${referenceFeatures.rgbBalance.g.toFixed(3)}, B=${referenceFeatures.rgbBalance.b.toFixed(3)}
- 平均彩度: ${referenceFeatures.saturation.toFixed(3)}
- 色温度傾向: ${referenceFeatures.colorTemperatureHint}
- 解像度: ${referenceFeatures.width}x${referenceFeatures.height}

## 編集対象画像の特徴（数値データ）
- 平均輝度: ${targetFeatures.brightness.toFixed(3)} (0=暗い, 1=明るい)
- RGBバランス: R=${targetFeatures.rgbBalance.r.toFixed(3)}, G=${targetFeatures.rgbBalance.g.toFixed(3)}, B=${targetFeatures.rgbBalance.b.toFixed(3)}
- 平均彩度: ${targetFeatures.saturation.toFixed(3)}
- 色温度傾向: ${targetFeatures.colorTemperatureHint}
- 解像度: ${targetFeatures.width}x${targetFeatures.height}

## 出力フォーマット
以下の構造で、DaVinci Resolveでの具体的な操作手順を提示してください：

### 1. 全体方針（要約）
リファレンス画像の特徴と、編集対象との差分を簡潔に説明してください。

### 2. 推奨ノード構成
DaVinci Resolveで使用すべきノードとその順序を提示してください。
例：Color Space Transform、Primary Wheels、Contrast/Pivot、Hue vs Sat、Hue vs Hue など

### 3. 各ノードごとの具体指示
各ノードについて、以下の情報を含めてください：
- 調整対象（Lift / Gamma / Gain / Offset / Contrast / Pivot 等）
- 調整方向（上げる / 下げる / 左に / 右に）
- 相対的な強さ（わずかに / 中程度 / 強め）
- 意図（なぜそうするか）

数値は提示しても構いませんが、必須ではありません。人間が操作する前提で、感覚的な指示でも問題ありません。

出力は日本語でお願いします。`;
}
