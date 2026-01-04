import React, { useState, useEffect } from 'react';
import { createAnalysisPrompt } from '../lib/prompt';
import type { ImageFeatures } from '../lib/images';

interface PromptEditorProps {
  referenceFeatures: ImageFeatures | null;
  targetFeatures: ImageFeatures | null;
  customPrompt: string | null;
  onPromptChange: (prompt: string | null) => void;
}

const PromptEditor: React.FC<PromptEditorProps> = ({
  referenceFeatures,
  targetFeatures,
  customPrompt,
  onPromptChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [promptText, setPromptText] = useState<string>('');

  // デフォルトプロンプトを生成
  useEffect(() => {
    if (referenceFeatures && targetFeatures && !customPrompt) {
      const defaultPrompt = createAnalysisPrompt(referenceFeatures, targetFeatures);
      setPromptText(defaultPrompt);
    } else if (customPrompt) {
      setPromptText(customPrompt);
    }
  }, [referenceFeatures, targetFeatures, customPrompt]);

  // 展開時にデフォルトプロンプトを更新
  useEffect(() => {
    if (isExpanded && referenceFeatures && targetFeatures && !customPrompt) {
      const defaultPrompt = createAnalysisPrompt(referenceFeatures, targetFeatures);
      setPromptText(defaultPrompt);
    } else if (isExpanded && !referenceFeatures && !targetFeatures) {
      // 画像が選択されていない場合は空にする
      setPromptText('');
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
    }
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

