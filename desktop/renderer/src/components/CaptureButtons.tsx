import React, { useEffect, useState } from 'react';
import type { ImageSlot } from '../types';

interface CaptureButtonsProps {
  onCapture: (slot: ImageSlot) => void;
  onPathChange: (slot: ImageSlot, path: string) => void;
}

const CaptureButtons: React.FC<CaptureButtonsProps> = ({ onCapture, onPathChange }) => {
  const [capturing, setCapturing] = useState<ImageSlot | null>(null);

  useEffect(() => {
    if (!window.electronAPI) return;

    const unsubscribeReady = window.electronAPI.onCaptureReady((payload) => {
      setCapturing(payload.slot);
    });

    const unsubscribeDone = window.electronAPI.onCaptureDone((payload) => {
      setCapturing(null);
      onPathChange(payload.slot, payload.savedPath);
    });

    const unsubscribeError = window.electronAPI.onCaptureError(() => {
      setCapturing(null);
    });

    return () => {
      unsubscribeReady();
      unsubscribeDone();
      unsubscribeError();
    };
  }, [onPathChange]);

  const handleCapture = (slot: ImageSlot) => {
    if (capturing) return;
    onCapture(slot);
  };

  return (
    <div className="capture-buttons">
      <button
        onClick={() => handleCapture('reference')}
        disabled={capturing !== null}
        className="capture-btn"
      >
        {capturing === 'reference' ? 'キャプチャ中...' : 'Referenceをキャプチャ'}
      </button>
      <button
        onClick={() => handleCapture('target')}
        disabled={capturing !== null}
        className="capture-btn"
      >
        {capturing === 'target' ? 'キャプチャ中...' : 'Targetをキャプチャ'}
      </button>
      {capturing && (
        <p className="capture-hint">
          範囲をドラッグして選択してください（Escでキャンセル）
        </p>
      )}
    </div>
  );
};

export default CaptureButtons;


