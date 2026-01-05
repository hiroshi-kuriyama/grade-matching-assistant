import React, { useState, useEffect } from 'react';
import DropZone, { type ImageSlot } from './components/DropZone';
import PasteHint from './components/PasteHint';
import ResultView from './components/ResultView';
import UsageModal from './components/UsageModal';
import PromptEditor from './components/PromptEditor';
import { getApiKey, setApiKey, clearApiKey, isStorageEnabled } from './lib/apiKey';
import { extractFeatures, imageToBase64, fileToDataUrl, type ImageFeatures } from './lib/images';
import { createAnalysisPrompt } from './lib/prompt';
import { analyzeImages, OpenAIApiError } from './lib/openai';
import './styles.css';

const App: React.FC = () => {
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [referenceDataUrl, setReferenceDataUrl] = useState<string | null>(null);
  const [targetDataUrl, setTargetDataUrl] = useState<string | null>(null);
  const [focusedSlot, setFocusedSlot] = useState<ImageSlot | null>(null);
  const [apiKey, setApiKeyState] = useState<string>('');
  const [saveApiKey, setSaveApiKey] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState<string | null>(null);
  const [referenceFeatures, setReferenceFeatures] = useState<ImageFeatures | null>(null);
  const [targetFeatures, setTargetFeatures] = useState<ImageFeatures | null>(null);

  // 初期化: 保存されたAPIキーを読み込み
  useEffect(() => {
    const savedKey = getApiKey();
    if (savedKey) {
      setApiKeyState(savedKey);
      setSaveApiKey(isStorageEnabled());
    }
  }, []);

  // クリップボード貼り付け処理
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!focusedSlot) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            handleFileSelect(focusedSlot, file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [focusedSlot]);

  const handleFileSelect = async (slot: ImageSlot, file: File) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      if (slot === 'reference') {
        setReferenceFile(file);
        setReferenceDataUrl(dataUrl);
      } else {
        setTargetFile(file);
        setTargetDataUrl(dataUrl);
      }
      setError(null);
    } catch (err) {
      setError(`画像の読み込みに失敗しました: ${(err as Error).message}`);
    }
  };

  const handleRemove = (slot: ImageSlot) => {
    if (slot === 'reference') {
      setReferenceFile(null);
      setReferenceDataUrl(null);
    } else {
      setTargetFile(null);
      setTargetDataUrl(null);
    }
  };

  const handleApiKeyChange = (key: string) => {
    setApiKeyState(key);
    setApiKey(key, saveApiKey);
  };

  const handleSaveApiKeyChange = (enabled: boolean) => {
    setSaveApiKey(enabled);
    if (apiKey) {
      setApiKey(apiKey, enabled);
    }
  };

  const handleStartAnalysis = async () => {
    if (!referenceFile || !targetFile) {
      setError('リファレンス画像と編集対象画像の両方を選択してください');
      return;
    }

    const currentApiKey = getApiKey() || apiKey;
    if (!currentApiKey) {
      setError('OpenAI APIキーを入力してください');
      return;
    }

    setAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      // 画像特徴量を抽出
      const [refFeatures, targetFeat] = await Promise.all([
        extractFeatures(referenceFile),
        extractFeatures(targetFile),
      ]);

      // 特徴量を保存（プロンプト編集用）
      setReferenceFeatures(refFeatures);
      setTargetFeatures(targetFeat);

      // プロンプト生成（カスタムプロンプトがあればそれを使用、なければデフォルト）
      const prompt = customPrompt || createAnalysisPrompt(refFeatures, targetFeat);

      // 画像をBase64に変換
      const [refBase64, targetBase64] = await Promise.all([
        imageToBase64(referenceFile),
        imageToBase64(targetFile),
      ]);

      // OpenAI API呼び出し
      const analysisResult = await analyzeImages(currentApiKey, prompt, refBase64, targetBase64);

      setResult(analysisResult);
    } catch (err) {
      if (err instanceof OpenAIApiError) {
        // エラータイプに応じたメッセージを表示
        let userMessage = '解析に失敗しました: ';
        switch (err.type) {
          case 'network':
            userMessage += 'ネットワークエラー。インターネット接続を確認してください。';
            break;
          case 'cors':
            userMessage +=
              'CORSエラー。ブラウザのセキュリティポリシーによりリクエストがブロックされました。';
            break;
          case 'http':
            userMessage += `HTTPエラー (${err.statusCode ?? '不明'})。APIキーやリクエストを確認してください。`;
            break;
          case 'api':
            userMessage += `APIエラー: ${err.message}`;
            break;
          default:
            userMessage += err.message;
        }
        setError(userMessage);
        console.error('OpenAI API Error:', err);
      } else {
        setError(`解析に失敗しました: ${err instanceof Error ? err.message : String(err)}`);
        console.error('Unexpected error:', err);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result);
      alert('クリップボードにコピーしました');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('コピーに失敗しました');
    }
  };

  const canStartAnalysis = referenceFile && targetFile && !analyzing && getApiKey() !== null;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>Grade Matching Assistant</h1>
            <p>DaVinci Resolveカラーグレーディング支援ツール</p>
          </div>
          <div className="header-actions">
            <a
              href="https://github.com/hiroshi-kuriyama/grade-matching-assistant"
              target="_blank"
              rel="noopener noreferrer"
              className="github-link-header"
              title="GitHubリポジトリ"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <button onClick={() => setIsUsageModalOpen(true)} className="usage-link-btn">
              使い方
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* APIキー入力 */}
        <section className="api-key-section">
          <h2>OpenAI APIキー</h2>
          <div className="api-key-input">
            <input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={e => handleApiKeyChange(e.target.value)}
              className="api-key-field"
            />
            <label className="save-key-checkbox">
              <input
                type="checkbox"
                checked={saveApiKey}
                onChange={e => handleSaveApiKeyChange(e.target.checked)}
              />
              <span>ブラウザに保存（次回起動時も使用）</span>
            </label>
            {apiKey && (
              <button
                onClick={() => {
                  clearApiKey();
                  setApiKeyState('');
                  setSaveApiKey(false);
                }}
                className="clear-key-btn"
              >
                キーを削除
              </button>
            )}
          </div>
          <p className="api-key-note">
            注意: APIキーはクライアント側のみで使用され、サーバーには送信されません。
            {saveApiKey && ' ブラウザのlocalStorageに保存されます。'}
          </p>
        </section>

        {/* 画像入力 */}
        <section className="input-section">
          <div className="input-panels">
            <DropZone
              slot="reference"
              imageFile={referenceFile}
              imageDataUrl={referenceDataUrl}
              onFileSelect={file => handleFileSelect('reference', file)}
              onRemove={() => handleRemove('reference')}
              isFocused={focusedSlot === 'reference'}
              onFocus={() => setFocusedSlot('reference')}
            />
            <DropZone
              slot="target"
              imageFile={targetFile}
              imageDataUrl={targetDataUrl}
              onFileSelect={file => handleFileSelect('target', file)}
              onRemove={() => handleRemove('target')}
              isFocused={focusedSlot === 'target'}
              onFocus={() => setFocusedSlot('target')}
            />
          </div>

          <PasteHint focusedSlot={focusedSlot} />

          {/* プロンプト編集セクション */}
          <PromptEditor
            referenceFeatures={referenceFeatures}
            targetFeatures={targetFeatures}
            customPrompt={customPrompt}
            onPromptChange={setCustomPrompt}
          />

          <div className="analysis-controls">
            <button
              onClick={handleStartAnalysis}
              disabled={!canStartAnalysis}
              className="start-btn"
            >
              {analyzing ? '解析中...' : '解析開始'}
            </button>
          </div>
        </section>

        {/* エラー表示 */}
        {error && (
          <section className="error-section">
            <h2>エラー</h2>
            <div className="error-message">{error}</div>
          </section>
        )}

        {/* 結果表示 */}
        {result && <ResultView result={result} onCopy={handleCopy} />}
      </main>

      {/* 使い方モーダル */}
      <UsageModal isOpen={isUsageModalOpen} onClose={() => setIsUsageModalOpen(false)} />
    </div>
  );
};

export default App;
