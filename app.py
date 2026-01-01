"""
DaVinci Resolveカラーグレーディング支援CLIツール
"""

import argparse
import sys
from pathlib import Path

from analyzer.image_features import extract_features
from analyzer.prompt import create_analysis_prompt
from analyzer.inference import generate_instructions


def main():
    parser = argparse.ArgumentParser(
        description='DaVinci Resolveでのカラーグレーディング支援ツール',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用例:
  python app.py --reference reference.jpg --target target.jpg

環境変数:
  OPENAI_API_KEY: OpenAI APIキーを設定してください
        """
    )
    
    parser.add_argument(
        '--reference',
        type=str,
        required=True,
        help='リファレンス画像のパス（目標ルック）'
    )
    
    parser.add_argument(
        '--target',
        type=str,
        required=True,
        help='編集対象画像のパス（現在の素材）'
    )
    
    parser.add_argument(
        '--model',
        type=str,
        default='gpt-4o-mini',
        help='使用するLLMモデル（デフォルト: gpt-4o-mini）'
    )
    
    args = parser.parse_args()
    
    # ファイルの存在確認
    reference_path = Path(args.reference)
    target_path = Path(args.target)
    
    if not reference_path.exists():
        print(f"エラー: リファレンス画像が見つかりません: {args.reference}", file=sys.stderr)
        sys.exit(1)
    
    if not target_path.exists():
        print(f"エラー: 編集対象画像が見つかりません: {args.target}", file=sys.stderr)
        sys.exit(1)
    
    try:
        # 画像特徴量の抽出
        print("画像を解析中...", file=sys.stderr)
        reference_features = extract_features(str(reference_path))
        target_features = extract_features(str(target_path))
        
        # プロンプト生成
        print("分析プロンプトを生成中...", file=sys.stderr)
        prompt = create_analysis_prompt(reference_features, target_features)
        
        # LLM推論
        print("LLMで分析中...", file=sys.stderr)
        instructions, cost_info = generate_instructions(
            prompt, 
            model=args.model,
            reference_image_path=str(reference_path),
            target_image_path=str(target_path)
        )
        
        # 結果を出力
        print("\n" + "="*70)
        print("DaVinci Resolve カラーグレーディング指示")
        print("="*70 + "\n")
        print(instructions)
        print("\n" + "="*70)
        
        # API使用量と料金を表示
        print("\n【API使用量と料金】")
        print(f"モデル: {cost_info['model']}")
        print(f"プロンプトトークン数: {cost_info['prompt_tokens']:,}")
        print(f"生成トークン数: {cost_info['completion_tokens']:,}")
        print(f"合計トークン数: {cost_info['total_tokens']:,}")
        print(f"入力コスト: ${cost_info['input_cost_usd']:.6f}")
        print(f"出力コスト: ${cost_info['output_cost_usd']:.6f}")
        print(f"合計コスト: ${cost_info['total_cost_usd']:.6f}")
        print("="*70)
        
    except Exception as e:
        print(f"エラー: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()

