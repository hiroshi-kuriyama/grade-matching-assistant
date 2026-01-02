import React from 'react';

interface PasteHintProps {
  focusedSlot: 'reference' | 'target' | null;
}

const PasteHint: React.FC<PasteHintProps> = ({ focusedSlot }) => {
  if (!focusedSlot) {
    return null;
  }

  const slotLabel = focusedSlot === 'reference' ? 'リファレンス画像' : '編集対象画像';

  return (
    <div className="paste-hint">
      <p>
        <strong>{slotLabel}</strong> にフォーカス中。クリップボードから画像を貼り付けできます（
        <kbd>Ctrl+V</kbd> / <kbd>Cmd+V</kbd>）
      </p>
    </div>
  );
};

export default PasteHint;

