import React from 'react';

interface UsageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UsageModal: React.FC<UsageModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>使い方</h2>
          <button onClick={onClose} className="modal-close-btn">
            ×
          </button>
        </div>
        <div className="modal-body">
          <section>
            <h3>1. OpenAI APIキーの設定</h3>
            <ol>
              <li>
                <a
                  href="https://platform.openai.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  OpenAI
                </a>
                でAPIキーを取得
              </li>
              <li>アプリの「OpenAI APIキー」欄にキーを入力</li>
              <li>
                （オプション）「ブラウザに保存」にチェックを入れると、次回起動時も使用できます
              </li>
            </ol>
          </section>

          <section>
            <h3>2. 画像の入力</h3>
            <h4>ドラッグ&ドロップ</h4>
            <p>画像ファイルをドロップゾーンにドラッグ&ドロップ</p>

            <h4>ファイル選択</h4>
            <p>「ファイルを選択」ボタンをクリック</p>

            <h4>クリップボード貼り付け</h4>
            <p>
              画像をコピーした状態で、ドロップゾーンをクリックしてフォーカスし、
              <kbd>Ctrl+V</kbd>（Windows）または <kbd>Cmd+V</kbd>（macOS）で貼り付け
            </p>
          </section>

          <section>
            <h3>3. 解析の実行</h3>
            <ol>
              <li>リファレンス画像と編集対象画像の両方を選択</li>
              <li>「解析開始」ボタンをクリック</li>
              <li>解析完了後、結果が表示されます</li>
            </ol>
          </section>

          <section>
            <h3>4. 結果のコピー</h3>
            <p>「指示文をコピー」ボタンをクリックすると、全文がクリップボードにコピーされます。</p>
          </section>

          <section>
            <h3>プロンプト編集機能</h3>
            <p>
              「プロンプトを編集」セクションを展開すると、OpenAI APIに送信するプロンプトをカスタマイズできます。
              デフォルトのプロンプトを編集して、より詳細な指示を追加したり、出力形式を変更したりできます。
            </p>
          </section>

          <section className="modal-footer">
            <p>
              <a
                href="https://github.com/hiroshi-kuriyama/grade-matching-assistant"
                target="_blank"
                rel="noopener noreferrer"
                className="github-link"
              >
                GitHubリポジトリ
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default UsageModal;

