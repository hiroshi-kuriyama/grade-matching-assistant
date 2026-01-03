import React, { useRef, useState } from 'react';

export type ImageSlot = 'reference' | 'target';

interface DropZoneProps {
  slot: ImageSlot;
  imageFile: File | null;
  imageDataUrl: string | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  isFocused: boolean;
  onFocus: () => void;
}

const DropZone: React.FC<DropZoneProps> = ({
  slot,
  imageFile,
  imageDataUrl,
  onFileSelect,
  onRemove,
  isFocused,
  onFocus,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slotLabel = slot === 'reference' ? 'リファレンス画像' : '編集対象画像';

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
    const imageFile = files.find(file => /\.(png|jpg|jpeg)$/i.test(file.name));

    if (imageFile) {
      onFileSelect(imageFile);
      onFocus();
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && /\.(png|jpg|jpeg)$/i.test(file.name)) {
      onFileSelect(file);
      onFocus();
    }
  };

  const handleRemove = () => {
    onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="drop-zone-container">
      <h3>{slotLabel}</h3>
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${imageFile ? 'has-image' : ''} ${isFocused ? 'focused' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={onFocus}
      >
        {imageFile && imageDataUrl ? (
          <div className="image-preview">
            <img src={imageDataUrl} alt={slotLabel} />
            <div className="image-info">
              <p className="image-name">{imageFile.name}</p>
              <p className="image-size">
                {imageFile.size > 1024 * 1024
                  ? `${(imageFile.size / (1024 * 1024)).toFixed(2)} MB`
                  : `${(imageFile.size / 1024).toFixed(2)} KB`}
              </p>
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
