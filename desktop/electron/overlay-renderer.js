/**
 * オーバーレイウィンドウのレンダラースクリプト
 * 範囲選択のUI処理
 */

const { ipcRenderer } = require('electron');

let isSelecting = false;
let startX = 0;
let startY = 0;
const selection = document.getElementById('selection');
const instructions = document.getElementById('instructions');

function updateSelection(x, y, width, height) {
  selection.style.left = x + 'px';
  selection.style.top = y + 'px';
  selection.style.width = width + 'px';
  selection.style.height = height + 'px';
}

function hideSelection() {
  selection.style.display = 'none';
}

function showSelection() {
  selection.style.display = 'block';
}

document.addEventListener('mousedown', (e) => {
  isSelecting = true;
  startX = e.clientX;
  startY = e.clientY;
  showSelection();
  updateSelection(startX, startY, 0, 0);
});

document.addEventListener('mousemove', (e) => {
  if (!isSelecting) return;

  const currentX = e.clientX;
  const currentY = e.clientY;
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  const x = Math.min(startX, currentX);
  const y = Math.min(startY, currentY);

  updateSelection(x, y, width, height);
});

document.addEventListener('mouseup', (e) => {
  if (!isSelecting) return;

  isSelecting = false;
  const endX = e.clientX;
  const endY = e.clientY;

  if (Math.abs(endX - startX) > 10 && Math.abs(endY - startY) > 10) {
    console.log('Sending capture:select', { start: { x: startX, y: startY }, end: { x: endX, y: endY } });
    ipcRenderer.send('capture:select', {
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
    });
  } else {
    hideSelection();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    ipcRenderer.send('capture:cancel');
  }
});

// 初期化完了を通知
ipcRenderer.on('capture:init', () => {
  instructions.textContent = '範囲をドラッグして選択してください（Escでキャンセル）';
  hideSelection();
});

