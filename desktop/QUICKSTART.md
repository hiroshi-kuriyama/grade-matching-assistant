# クイックスタートガイド

## 初回セットアップ

### 1. Node.jsのインストール確認

```powershell
node --version
npm --version
```

**エラーが出る場合:**
- Node.jsがインストールされていません
- [Node.js公式サイト](https://nodejs.org/)からLTS版をダウンロードしてインストール
- インストール後、PowerShellを再起動して再度確認

### 2. 依存関係のインストール

```powershell
cd desktop
npm install
```

### 3. preload.jsの生成

```powershell
tsc electron/preload.ts --outDir electron --module commonjs --target es2020 --esModuleInterop --skipLibCheck
```

### 4. 開発モードで起動

```powershell
npm run dev
```

## よくあるエラーと解決方法

### `npm : 用語 'npm' は...として認識されません`

**原因:** Node.jsがインストールされていない

**解決:**
1. [Node.js公式サイト](https://nodejs.org/)からインストール
2. PowerShellを再起動
3. `npm --version`で確認

### `Cannot find module 'preload.js'`

**解決:**
```powershell
tsc electron/preload.ts --outDir electron --module commonjs --target es2020 --esModuleInterop --skipLibCheck
```

### `Pythonが見つかりません`

**解決:**
1. Pythonがインストールされているか確認
2. 環境変数 `PYTHON_BIN` にPythonのパスを設定:
   ```powershell
   $env:PYTHON_BIN="C:\path\to\python.exe"
   ```

## 次のステップ

詳細は [README.md](./README.md) を参照してください。


