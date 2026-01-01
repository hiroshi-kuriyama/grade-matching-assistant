import React, { useState, useEffect } from 'react';
import DropZone from './components/DropZone';
import CaptureButtons from './components/CaptureButtons';
import ResultView from './components/ResultView';
import type { ImageSlot } from './types';
import './App.css';

const App: React.FC = () => {
  const [referencePath, setReferencePath] = useState<string | null>(null);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!window.electronAPI) {
      console.error('electronAPI is not available');
      return;
    }

    const unsubscribeStdout = window.electronAPI.onAnalysisStdout((payload) => {
      setLogs((prev) => [...prev, payload.chunk]);
    });

    const unsubscribeDone = window.electronAPI.onAnalysisDone((payload) => {
      setAnalyzing(false);
      setResult(payload.fullText);
      setLogs([]);
    });

    const unsubscribeError = window.electronAPI.onAnalysisError((payload) => {
      setAnalyzing(false);
      setError(payload.message);
      setLogs([]);
    });

    return () => {
      unsubscribeStdout();
      unsubscribeDone();
      unsubscribeError();
    };
  }, []);

  const handleFileSelect = async (slot: ImageSlot, file: File) => {
    console.log('handleFileSelect called', { slot, fileName: file.name, fileSize: file.size });
    
    // Electronでは、ドラッグ&ドロップでFileオブジェクトにpathプロパティが含まれる場合があります
    const filePath = (file as any).path;
    console.log('File path from file object:', filePath);
    
    if (filePath) {
      // パスが直接取得できる場合（ドラッグ&ドロップ）
      console.log('Using file path directly:', filePath);
      handlePathChange(slot, filePath);
    } else {
      // パスが取得できない場合、ファイルを読み込んで一時ファイルとして保存
      console.log('File path not available, saving to temp file...', file.name);
      
      if (!window.electronAPI) {
        console.error('electronAPI is not available');
        alert('electronAPIが利用できません');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          console.log('File read, size:', uint8Array.length);
          
          // IPC経由でファイルを保存
          const savedPath = await window.electronAPI.saveTempFile({
            data: Array.from(uint8Array),
            filename: file.name,
          });
          
          console.log('File saved to:', savedPath);
          if (savedPath) {
            handlePathChange(slot, savedPath);
          } else {
            console.error('Failed to save file: savedPath is null');
            alert('ファイルの保存に失敗しました');
          }
        } catch (error) {
          console.error('Failed to save file:', error);
          alert('ファイルの保存に失敗しました: ' + (error as Error).message);
        }
      };
      reader.onerror = () => {
        console.error('FileReader error');
        alert('ファイルの読み込みに失敗しました');
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handlePathChange = (slot: ImageSlot, path: string | null) => {
    console.log('handlePathChange called', { slot, path });
    if (slot === 'reference') {
      setReferencePath(path);
      console.log('Reference path set to:', path);
    } else {
      setTargetPath(path);
      console.log('Target path set to:', path);
    }
  };

  const handleCapture = (slot: ImageSlot) => {
    console.log('handleCapture called', { slot });
    if (!window.electronAPI) {
      console.error('electronAPI is not available');
      return;
    }
    console.log('Calling startCapture IPC');
    window.electronAPI.startCapture({ slot });
  };

  const handleStartAnalysis = () => {
    if (!referencePath || !targetPath || !window.electronAPI) {
      return;
    }

    setAnalyzing(true);
    setResult(null);
    setError(null);
    setLogs([]);

    window.electronAPI.startAnalysis({
      referencePath,
      targetPath,
    });
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

  const canStartAnalysis = referencePath && targetPath && !analyzing;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Grade Matching Assistant</h1>
        <p>DaVinci Resolveカラーグレーディング支援ツール</p>
      </header>

      <main className="app-main">
        <section className="input-section">
          <div className="input-panels">
            <DropZone
              slot="reference"
              imagePath={referencePath}
              onFileSelect={(file) => handleFileSelect('reference', file)}
              onPathChange={(path) => handlePathChange('reference', path)}
            />
            <DropZone
              slot="target"
              imagePath={targetPath}
              onFileSelect={(file) => handleFileSelect('target', file)}
              onPathChange={(path) => handlePathChange('target', path)}
            />
          </div>

          <CaptureButtons
            onCapture={handleCapture}
            onPathChange={handlePathChange}
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

        {analyzing && logs.length > 0 && (
          <section className="logs-section">
            <h2>ログ</h2>
            <div className="logs">
              {logs.map((log, index) => (
                <div key={index} className="log-line">
                  {log}
                </div>
              ))}
            </div>
          </section>
        )}

        {error && (
          <section className="error-section">
            <h2>エラー</h2>
            <div className="error-message">{error}</div>
          </section>
        )}

        {result && (
          <ResultView result={result} onCopy={handleCopy} />
        )}
      </main>
    </div>
  );
};

export default App;

