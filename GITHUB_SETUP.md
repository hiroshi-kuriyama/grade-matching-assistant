# GitHubへのアップロード手順

## 前提条件

- Gitがインストールされていること
- GitHubアカウント（hiroshi-kuriyama）にログインできること

## Gitのインストール（未インストールの場合）

### Windows

1. **Git for Windowsをダウンロード**
   - https://git-scm.com/download/win にアクセス
   - インストーラーをダウンロード

2. **インストール**
   - インストーラーを実行
   - デフォルト設定でインストール（「Add to PATH」オプションにチェックが入っていることを確認）

3. **インストール確認**
   - PowerShellを再起動
   - 以下のコマンドで確認:
     ```powershell
     git --version
     ```
   - バージョン番号が表示されればOK

### インストール後の確認

```powershell
git --version
```

コマンドが認識されない場合は、PowerShellを再起動してください。

## 手順

### 1. GitHubでリポジトリを作成

1. https://github.com/new にアクセス
2. リポジトリ名: `grade-matching-assistant`
3. 説明: "DaVinci Resolveカラーグレーディング支援ツール"
4. 公開設定: Private または Public（お好みで）
5. **「Initialize this repository with a README」のチェックを外す**（既にREADMEがあるため）
6. 「Create repository」をクリック

### 2. ローカルでGitリポジトリを初期化

```powershell
# プロジェクトルートで実行
git init
git add .
git commit -m "Initial commit: CLI version"
```

### 3. CLI版をmainブランチとして設定

```powershell
git branch -M main
git remote add origin https://github.com/hiroshi-kuriyama/grade-matching-assistant.git
git push -u origin main
```

**認証について:**
- GitHubのパスワード認証は非推奨になっています
- Personal Access Token (PAT) を使用してください
- トークンの作成: https://github.com/settings/tokens
- スコープ: `repo` を選択
- プッシュ時にパスワードの代わりにトークンを入力

### 4. Desktop版をdesktopブランチとして作成

```powershell
# desktopブランチを作成
git checkout -b desktop

# desktopディレクトリを追加
git add desktop/
git commit -m "Add desktop app (Electron + React)"

# desktopブランチをプッシュ
git push -u origin desktop
```

### 5. mainブランチに戻る

```powershell
git checkout main
```

## ブランチ構成

- **main**: CLI版（Python）
- **desktop**: Desktop版（Electron + React）

## 今後の作業

- `main`ブランチでCLI版の改善
- `desktop`ブランチでDesktop版の改善
- 必要に応じて`main`ブランチの変更を`desktop`ブランチにマージ

## 注意事項

- `.gitignore`で除外されているファイルはアップロードされません
- `desktop/node_modules/`は除外されています（`package.json`から再インストール可能）
- 仮想環境（`grade-matching-assistant-env/`）も除外されています

