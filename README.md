# Grade Matching Assistant

DaVinci Resolveでのカラーグレーディングを支援する個人用ツールです。

リファレンス画像（目標ルック）と編集対象画像（現在の素材）の2枚を入力すると、編集対象画像をリファレンス画像のカラー傾向に近づけるための、DaVinci Resolve上での具体的なカラー調整手順をテキストで出力します。

## プロジェクト構成

このプロジェクトは2つのフェーズで構成されています：

- **CLI版** (`main`ブランチ): Python製のCLIツール
- **Desktop版** (`desktop`ブランチ): Electron + React製のデスクトップアプリ

## CLI版の使用方法

### インストール

1. リポジトリをクローンまたはダウンロード
2. 仮想環境を作成して有効化:

```powershell
python -m venv grade-matching-assistant-env
.\grade-matching-assistant-env\Scripts\Activate.ps1
```

3. 依存関係をインストール:

```powershell
pip install -r requirements.txt
```

4. OpenAI APIキーを環境変数に設定:

```powershell
$env:OPENAI_API_KEY="your_api_key_here"
```

### 使用方法

```powershell
python app.py --reference reference.jpg --target target.jpg
```

## Desktop版の使用方法

### 概要

既存のPython CLIツール（`app.py`）をGUIで操作できるデスクトップアプリケーションです。

### 機能

- **画像入力方法**
  - ドラッグ&ドロップ
  - ファイル選択ダイアログ
  - スクリーンショット範囲選択（透明オーバーレイ）
  - グローバルホットキー（`Ctrl/Cmd + Shift + 1/2`）

- **解析実行**
  - 2枚の画像を選択して解析開始
  - 進捗ログのリアルタイム表示
  - 結果の見出し抽出とカード表示

- **結果表示**
  - 全文テキスト表示
  - 見出し別のカード表示（全体方針、推奨ノード構成、各ノードの具体指示）
  - ワンクリックでクリップボードにコピー

### 前提条件

- **Node.js 18以上**（npm含む）
  - インストール確認: `node --version` と `npm --version`
  - 未インストールの場合: [Node.js公式サイト](https://nodejs.org/)からLTS版をダウンロード
  - インストール後、PowerShellを再起動して再度確認
- **Python 3.x**（既存のCLIツールが動作すること）
- 既存のPython CLIツール（`app.py`）が利用可能であること

### インストール

```powershell
cd desktop
npm install
```

### 開発モードで起動

```powershell
npm run dev
```

これにより、Vite開発サーバーとElectronが同時に起動します。

### ビルド

```powershell
npm run build
npm start
```

### 使用方法

#### 1. 画像の入力

**ドラッグ&ドロップ**
- 画像ファイルをドロップゾーンにドラッグ&ドロップ

**ファイル選択**
- 「ファイルを選択」ボタンをクリック

**スクリーンショット**
- 「Referenceをキャプチャ」または「Targetをキャプチャ」ボタンをクリック
- アプリが一時的に非表示になり、透明オーバーレイが表示されます
- マウスで範囲をドラッグして選択
- 選択確定で自動的にキャプチャされます
- `Esc`キーでキャンセル

**グローバルホットキー**
- `Ctrl + Shift + 1`（Windows）または `Cmd + Shift + 1`（macOS）: Referenceをキャプチャ
- `Ctrl + Shift + 2`（Windows）または `Cmd + Shift + 2`（macOS）: Targetをキャプチャ

#### 2. 解析の実行

1. リファレンス画像と編集対象画像の両方を選択
2. 「解析開始」ボタンをクリック
3. 進捗ログが表示されます
4. 解析完了後、結果が表示されます

#### 3. 結果のコピー

「指示文をコピー」ボタンをクリックすると、全文がクリップボードにコピーされます。

### Pythonのパス設定

デフォルトでは、システムの`python`コマンドを使用します。

カスタムPythonパスを使用する場合：

```powershell
# PowerShell
$env:PYTHON_BIN="C:\path\to\python.exe"
npm run dev
```

### macOSでの画面収録権限

初回起動時に、macOSから「画面収録」の権限を要求されます。

1. システム環境設定 → セキュリティとプライバシー → プライバシー
2. 「画面収録」を選択
3. アプリにチェックを入れる

権限が付与されていない場合、スクリーンショット機能は動作しません。

### 既知の制限

- **DPIスケーリング**: 初期実装では1倍スケールを想定（TODO: マルチDPI対応）
- **マルチディスプレイ**: プライマリディスプレイのみ対応（TODO: 画面選択UI）
- **履歴**: セッション内のみ保持（TODO: 永続化）

### セキュリティ

- ローカルのみの処理で、外部へのデータ送信は行いません
- `contextIsolation: true`、`nodeIntegration: false`で安全なIPC通信を実装
- クリップボード操作はRendererプロセスで実行

### 開発

#### ディレクトリ構造

```
desktop/
├── electron/
│   ├── main.ts              # メインプロセス
│   ├── preload.ts           # IPCブリッジ
│   ├── overlay.html         # スクリーンショットオーバーレイ
│   └── overlay-renderer.js  # オーバーレイのレンダラー
├── renderer/
│   ├── index.html
│   └── src/
│       ├── App.tsx          # メインコンポーネント
│       ├── components/      # UIコンポーネント
│       ├── types.ts         # 型定義
│       └── ipc.ts           # IPC型定義
├── package.json
├── tsconfig.json
└── vite.config.ts
```

#### IPC通信

**Renderer → Main**
- `analysis:start`: 解析開始
- `capture:start`: スクリーンショット開始
- `files:openDialog`: ファイル選択ダイアログ

**Main → Renderer**
- `analysis:stdout`: 標準出力（逐次）
- `analysis:done`: 解析完了
- `analysis:error`: エラー
- `capture:ready`: キャプチャ準備完了
- `capture:done`: キャプチャ完了
- `capture:error`: キャプチャエラー

## ライセンス

このプロジェクトは個人利用を目的としています。
