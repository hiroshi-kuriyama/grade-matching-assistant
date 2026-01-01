# Grade Matching Assistant

DaVinci Resolveでのカラーグレーディングを支援する個人用ツールです。

リファレンス画像（目標ルック）と編集対象画像（現在の素材）の2枚を入力すると、編集対象画像をリファレンス画像のカラー傾向に近づけるための、DaVinci Resolve上での具体的なカラー調整手順をテキストで出力します。

## プロジェクト構成

このプロジェクトは2つのフェーズで構成されています：

- **CLI版** (`main`ブランチ): Python製のCLIツール
- **Desktop版** (`desktop`ブランチ): Electron + React製のデスクトップアプリ

## CLI版の使用方法

詳細は以下のセクションを参照してください。

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

詳細は [desktop/README.md](./desktop/README.md) を参照してください。

## ライセンス

このプロジェクトは個人利用を目的としています。
