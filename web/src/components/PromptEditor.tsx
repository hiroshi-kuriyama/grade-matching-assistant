import React, { useState, useEffect } from 'react';
import { createAnalysisPrompt } from '../lib/prompt';
import type { ImageFeatures } from '../lib/images';

interface PromptEditorProps {
  referenceFeatures: ImageFeatures | null;
  targetFeatures: ImageFeatures | null;
  customPrompt: string | null;
  onPromptChange: (prompt: string | null) => void;
}

// デフォルトプロンプトのテンプレート（画像が選択されていない場合）
const DEFAULT_PROMPT_TEMPLATE = `あなたはDaVinci Resolveのカラーグレーディングの専門家です。
以下の2枚の画像（リファレンス画像と編集対象画像）を視覚的に分析し、編集対象画像をリファレンス画像のカラー傾向に近づけるための具体的な操作手順を提示してください。

画像と併せて、以下の数値データも参考にしてください：

## リファレンス画像の特徴（数値データ）
- 平均輝度: {referenceBrightness} (0=暗い, 1=明るい)
- RGBバランス: R={referenceR}, G={referenceG}, B={referenceB}
- 平均彩度: {referenceSaturation}
- 色温度傾向: {referenceColorTemp}
- 解像度: {referenceWidth}x{referenceHeight}

## 編集対象画像の特徴（数値データ）
- 平均輝度: {targetBrightness} (0=暗い, 1=明るい)
- RGBバランス: R={targetR}, G={targetG}, B={targetB}
- 平均彩度: {targetSaturation}
- 色温度傾向: {targetColorTemp}
- 解像度: {targetWidth}x{targetHeight}

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

const PromptEditor: React.FC<PromptEditorProps> = ({
  referenceFeatures,
  targetFeatures,
  customPrompt,
  onPromptChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHelpExpanded, setIsHelpExpanded] = useState(false);
  const [promptText, setPromptText] = useState<string>('');

  // デフォルトプロンプトを生成
  useEffect(() => {
    if (referenceFeatures && targetFeatures && !customPrompt) {
      const defaultPrompt = createAnalysisPrompt(referenceFeatures, targetFeatures);
      setPromptText(defaultPrompt);
    } else if (customPrompt) {
      setPromptText(customPrompt);
    } else {
      // 画像が選択されていない場合はテンプレートを表示
      setPromptText(DEFAULT_PROMPT_TEMPLATE);
    }
  }, [referenceFeatures, targetFeatures, customPrompt]);

  // 展開時にデフォルトプロンプトを更新
  useEffect(() => {
    if (isExpanded) {
      if (referenceFeatures && targetFeatures && !customPrompt) {
        const defaultPrompt = createAnalysisPrompt(referenceFeatures, targetFeatures);
        setPromptText(defaultPrompt);
      } else if (!customPrompt && (!referenceFeatures || !targetFeatures)) {
        // 画像が選択されていない場合はテンプレートを表示
        setPromptText(DEFAULT_PROMPT_TEMPLATE);
      }
    }
  }, [isExpanded, referenceFeatures, targetFeatures, customPrompt]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = e.target.value;
    setPromptText(newPrompt);
    onPromptChange(newPrompt || null);
  };

  const handleReset = () => {
    if (referenceFeatures && targetFeatures) {
      const defaultPrompt = createAnalysisPrompt(referenceFeatures, targetFeatures);
      setPromptText(defaultPrompt);
      onPromptChange(null);
    } else {
      setPromptText(DEFAULT_PROMPT_TEMPLATE);
      onPromptChange(null);
    }
  };

  // 画像特徴量の情報を表示用にフォーマット
  const formatFeaturesInfo = (features: ImageFeatures | null, label: string): string => {
    if (!features) {
      return `${label}: 未選択`;
    }
    return `${label}:
- 平均輝度: ${features.brightness.toFixed(3)} (0=暗い, 1=明るい)
- RGBバランス: R=${features.rgbBalance.r.toFixed(3)}, G=${features.rgbBalance.g.toFixed(3)}, B=${features.rgbBalance.b.toFixed(3)}
- 平均彩度: ${features.saturation.toFixed(3)}
- 色温度傾向: ${features.colorTemperatureHint}
- 解像度: ${features.width}x${features.height}`;
  };

  return (
    <div className="prompt-editor">
      <button onClick={handleToggle} className="prompt-editor-toggle">
        {isExpanded ? '▼' : '▶'} プロンプトを編集
      </button>
      {isExpanded && (
        <div className="prompt-editor-content">
          <div className="prompt-editor-header">
            <p className="prompt-editor-hint">
              OpenAI APIに送信するプロンプトをカスタマイズできます。デフォルトのプロンプトを編集して、より詳細な指示を追加したり、出力形式を変更したりできます。
            </p>
            <button onClick={handleReset} className="prompt-reset-btn">
              デフォルトに戻す
            </button>
          </div>

          {/* 画像特徴量情報 */}
          {(referenceFeatures || targetFeatures) && (
            <div className="prompt-features-info">
              <h4>現在の画像特徴量</h4>
              <pre className="features-pre">
                {`${formatFeaturesInfo(referenceFeatures, 'リファレンス画像')}\n\n${formatFeaturesInfo(targetFeatures, '編集対象画像')}`}
              </pre>
              <p className="features-note">
                これらの値はプロンプト内で使用できます。画像を変更すると自動的に更新されます。
              </p>
            </div>
          )}

          {/* 編集方法ヘルプ */}
          <div className="prompt-help-section">
            <button
              onClick={() => setIsHelpExpanded(!isHelpExpanded)}
              className="prompt-help-toggle"
            >
              {isHelpExpanded ? '▼' : '▶'} 編集方法
            </button>
            {isHelpExpanded && (
              <div className="prompt-help-content">
                <h4>プロンプトの構造</h4>
                <p>
                  プロンプトは以下の部分で構成されています：
                </p>
                <ul>
                  <li>
                    <strong>役割定義</strong>: 「あなたはDaVinci Resolveのカラーグレーディングの専門家です。」など、AIの役割を定義
                  </li>
                  <li>
                    <strong>画像特徴量データ</strong>: 平均輝度、RGBバランス、彩度、色温度傾向、解像度などの数値データ
                  </li>
                  <li>
                    <strong>出力フォーマット指示</strong>: 全体方針、推奨ノード構成、各ノードの具体指示などの出力構造
                  </li>
                </ul>

                <h4>編集のポイント</h4>
                <ul>
                  <li>
                    <strong>画像特徴量の参照</strong>: 画像が選択されている場合、プロンプト内に実際の数値が自動的に挿入されます。画像が選択されていない場合は、プレースホルダー（例:{' '}
                    <code>&#123;referenceBrightness&#125;</code>）が表示されます。
                  </li>
                  <li>
                    <strong>出力形式のカスタマイズ</strong>: 「出力フォーマット」セクションを編集することで、AIからの出力形式を変更できます。例えば、より詳細な指示を追加したり、特定のノードに焦点を当てたりできます。
                  </li>
                  <li>
                    <strong>専門用語の追加</strong>: DaVinci Resolveの特定の機能やノードについて、より詳細な説明を追加することで、出力の精度を向上させることができます。
                  </li>
                </ul>

                <h4>プレースホルダー</h4>
                <p>画像が選択されていない場合、以下のプレースホルダーが使用されます：</p>
                <ul>
                  <li>
                    <code>&#123;referenceBrightness&#125;</code>,{' '}
                    <code>&#123;targetBrightness&#125;</code>: 平均輝度
                  </li>
                  <li>
                    <code>&#123;referenceR&#125;</code>, <code>&#123;referenceG&#125;</code>,{' '}
                    <code>&#123;referenceB&#125;</code>: リファレンス画像のRGB値
                  </li>
                  <li>
                    <code>&#123;targetR&#125;</code>, <code>&#123;targetG&#125;</code>,{' '}
                    <code>&#123;targetB&#125;</code>: 編集対象画像のRGB値
                  </li>
                  <li>
                    <code>&#123;referenceSaturation&#125;</code>,{' '}
                    <code>&#123;targetSaturation&#125;</code>: 平均彩度
                  </li>
                  <li>
                    <code>&#123;referenceColorTemp&#125;</code>,{' '}
                    <code>&#123;targetColorTemp&#125;</code>: 色温度傾向
                  </li>
                  <li>
                    <code>&#123;referenceWidth&#125;</code>, <code>&#123;referenceHeight&#125;</code>:
                    リファレンス画像の解像度
                  </li>
                  <li>
                    <code>&#123;targetWidth&#125;</code>, <code>&#123;targetHeight&#125;</code>:
                    編集対象画像の解像度
                  </li>
                </ul>
                <p>
                  画像が選択されている場合、これらのプレースホルダーは実際の値に自動的に置き換えられます。
                </p>
              </div>
            )}
          </div>

          <textarea
            value={promptText}
            onChange={handlePromptChange}
            className="prompt-textarea"
            placeholder="プロンプトを入力..."
            rows={15}
          />
        </div>
      )}
    </div>
  );
};

export default PromptEditor;

