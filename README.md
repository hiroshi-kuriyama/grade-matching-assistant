# Grade Matching Assistant

DaVinci Resolveでのカラーグレーディングを支援するWebアプリケーションです。

リファレンス画像（目標ルック）と編集対象画像（現在の素材）の2枚を入力すると、編集対象画像をリファレンス画像のカラー傾向に近づけるための、DaVinci Resolve上での具体的なカラー調整手順をテキストで出力します。

## デモ

[GitHub Pages](https://hiroshi-kuriyama.github.io/grade-matching-assistant/) で公開されています。

## 機能

- **画像入力方法**
  - ドラッグ&ドロップ
  - ファイル選択ダイアログ
  - クリップボード貼り付け（`Ctrl+V` / `Cmd+V`）

- **解析実行**
  - 2枚の画像を選択して解析開始
  - OpenAI GPT-4o/GPT-4o-miniを使用した画像分析
  - 結果の見出し抽出とカード表示

- **結果表示**
  - 全文テキスト表示
  - 見出し別のカード表示（全体方針、推奨ノード構成、各ノードの具体指示）
  - ワンクリックでクリップボードにコピー

- **セキュリティ**
  - APIキーはクライアント側のみで使用（サーバーに送信されません）
  - メモリ保持（既定）またはlocalStorage保存（オプション）

## 使用方法

### 1. アクセス

[GitHub Pages](https://hiroshi-kuriyama.github.io/grade-matching-assistant/) にアクセスするか、ローカルで開発サーバーを起動します。

### 2. OpenAI APIキーの設定

1. [OpenAI](https://platform.openai.com/) でAPIキーを取得
2. アプリの「OpenAI APIキー」欄にキーを入力
3. （オプション）「ブラウザに保存」にチェックを入れると、次回起動時も使用できます

### 3. 画像の入力

**ドラッグ&ドロップ**
- 画像ファイルをドロップゾーンにドラッグ&ドロップ

**ファイル選択**
- 「ファイルを選択」ボタンをクリック

**クリップボード貼り付け**
- 画像をコピーした状態で、ドロップゾーンをクリックしてフォーカス
- `Ctrl+V`（Windows）または `Cmd+V`（macOS）で貼り付け

### 4. 解析の実行

1. リファレンス画像と編集対象画像の両方を選択
2. 「解析開始」ボタンをクリック
3. 解析完了後、結果が表示されます

### 5. 結果のコピー

「指示文をコピー」ボタンをクリックすると、全文がクリップボードにコピーされます。

## ローカル開発

### 前提条件

- **Node.js 18以上**（npm含む）
  - インストール確認: `node --version` と `npm --version`
  - 未インストールの場合: [Node.js公式サイト](https://nodejs.org/)からLTS版をダウンロード

### インストール

```powershell
cd web
npm install
```

### 開発モードで起動

```powershell
npm run dev
```

これにより、Vite開発サーバーが起動します（通常は `http://localhost:5174`）。

### ビルド

```powershell
npm run build
```

ビルド成果物は `docs/` ディレクトリに出力されます。

### プレビュー

```powershell
npm run preview
```

ビルド後のアプリをローカルでプレビューできます。

## プロジェクト構成

```
grade-matching-assistant/
├── docs/              # GitHub Pages用のビルド成果物
│   ├── index.html
│   └── assets/
├── web/               # Webアプリケーションのソースコード
│   ├── src/
│   │   ├── components/    # Reactコンポーネント
│   │   │   ├── DropZone.tsx      # 画像ドロップゾーン
│   │   │   ├── PasteHint.tsx     # クリップボード貼り付け導線
│   │   │   └── ResultView.tsx     # 結果表示
│   │   ├── lib/           # ライブラリ
│   │   │   ├── apiKey.ts          # APIキー管理
│   │   │   ├── images.ts          # 画像処理
│   │   │   ├── openai.ts          # OpenAI API呼び出し
│   │   │   ├── prompt.ts          # プロンプト生成
│   │   │   └── format.ts           # 見出し抽出
│   │   ├── App.tsx        # メインコンポーネント
│   │   ├── main.tsx       # エントリーポイント
│   │   └── styles.css     # スタイル
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── README.md
```

## 技術スタック

- **React 18** - UIフレームワーク
- **TypeScript** - 型安全性
- **Vite** - ビルドツール
- **OpenAI API** - GPT-4o/GPT-4o-miniを使用した画像分析

## セキュリティ

- ローカルのみの処理で、外部へのデータ送信はOpenAI APIへの直接呼び出しのみ
- APIキーはクライアント側のみで使用され、サーバーには送信されません
- Content Security Policy (CSP) を設定してセキュリティを強化

## ライセンス

このプロジェクトは個人利用を目的としています。
