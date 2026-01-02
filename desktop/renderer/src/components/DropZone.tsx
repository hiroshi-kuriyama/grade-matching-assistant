import React, { useRef, useState, useEffect } from 'react';
import type { ImageSlot } from '../types';

interface DropZoneProps {
  slot: ImageSlot;
  imagePath: string | null;
  onFileSelect: (file: File) => void;
  onPathChange: (path: string | null) => void;
}

const DropZone: React.FC<DropZoneProps> = ({ slot, imagePath, onFileSelect, onPathChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slotLabel = slot === 'reference' ? 'リファレンス画像' : '編集対象画像';

  // 画像パスからDataURLを取得
  useEffect(() => {
    if (imagePath && window.electronAPI) {
      window.electronAPI.getImageDataUrl(imagePath).then((dataUrl) => {
        if (dataUrl) {
          setImageDataUrl(dataUrl);
        } else {
          setImageDataUrl(null);
        }
      }).catch((error) => {
        console.error('Failed to load image:', error);
        setImageDataUrl(null);
      });
    } else {
      setImageDataUrl(null);
    }
  }, [imagePath]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(
      (file) => /\.(png|jpg|jpeg)$/i.test(file.name)
    );

    if (imageFile) {
      onFileSelect(imageFile);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && /\.(png|jpg|jpeg)$/i.test(file.name)) {
      // ファイル選択ダイアログから選択した場合、パスを直接取得できないため
      // 一時ファイルとして保存する
      onFileSelect(file);
    }
  };


  const handleRemove = () => {
    onPathChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="drop-zone-container">
      <h3>{slotLabel}</h3>
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${imagePath ? 'has-image' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {imagePath ? (
          <div className="image-preview">
            {imageDataUrl ? (
              <img src={imageDataUrl} alt={slotLabel} />
            ) : (
              <div style={{ padding: '20px', color: '#666' }}>画像を読み込み中...</div>
            )}
            <div className="image-info">
              <p className="image-path">{imagePath}</p>
              <button onClick={handleRemove} className="remove-btn">
                削除
              </button>
            </div>
          </div>
        ) : (
          <div className="drop-zone-content">
            <p>画像をドラッグ&ドロップ</p>
            <p>または</p>
            <button onClick={() => fileInputRef.current?.click()} className="select-btn">
              ファイルを選択
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default DropZone;

