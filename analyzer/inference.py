"""
LLMによる推論を行うモジュール
"""

import os
from typing import Optional, Tuple, Dict
from openai import OpenAI
from openai import APIError, RateLimitError, APIConnectionError


def get_openai_client() -> Optional[OpenAI]:
    """環境変数からOpenAI APIキーを取得してクライアントを作成"""
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return None
    return OpenAI(api_key=api_key)


def calculate_cost(prompt_tokens: int, completion_tokens: int, model: str) -> Dict:
    """
    API使用量から料金を計算
    
    Args:
        prompt_tokens: プロンプトトークン数
        completion_tokens: 生成トークン数
        model: 使用したモデル名
    
    Returns:
        料金情報の辞書
    """
    # モデルごとの料金（2024年12月時点、1M tokensあたり）
    pricing = {
        "gpt-4o-mini": {
            "input": 0.15,  # $0.15 per 1M tokens
            "output": 0.60  # $0.60 per 1M tokens
        },
        "gpt-4o": {
            "input": 2.50,  # $2.50 per 1M tokens
            "output": 10.00  # $10.00 per 1M tokens
        },
        "gpt-4-turbo": {
            "input": 10.00,  # $10.00 per 1M tokens
            "output": 30.00  # $30.00 per 1M tokens
        }
    }
    
    # デフォルトはgpt-4o-miniの料金
    model_pricing = pricing.get(model, pricing["gpt-4o-mini"])
    
    input_cost = (prompt_tokens / 1_000_000) * model_pricing["input"]
    output_cost = (completion_tokens / 1_000_000) * model_pricing["output"]
    total_cost = input_cost + output_cost
    
    return {
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_tokens": prompt_tokens + completion_tokens,
        "input_cost_usd": input_cost,
        "output_cost_usd": output_cost,
        "total_cost_usd": total_cost,
        "model": model
    }


def generate_instructions(
    prompt: str, 
    model: str = "gpt-4o-mini",
    reference_image_path: str = None,
    target_image_path: str = None
) -> Tuple[str, Dict]:
    """
    LLMを使ってカラーグレーディング指示を生成
    
    Args:
        prompt: テキストプロンプト
        model: 使用するLLMモデル
        reference_image_path: リファレンス画像のパス（オプション）
        target_image_path: 編集対象画像のパス（オプション）
    
    Returns:
        (生成された指示文, 使用量情報の辞書) のタプル
    """
    client = get_openai_client()
    
    if client is None:
        raise ValueError(
            "OPENAI_API_KEY環境変数が設定されていません。\n"
            "以下のコマンドで設定してください:\n"
            "Windows: set OPENAI_API_KEY=your_api_key\n"
            "Linux/Mac: export OPENAI_API_KEY=your_api_key"
        )
    
    # メッセージのcontentを構築
    content = []
    
    # テキストプロンプトを追加
    content.append({
        "type": "text",
        "text": prompt
    })
    
    # 画像を追加（存在する場合）
    # リファレンス画像を先に追加
    if reference_image_path:
        from analyzer.image_features import image_to_base64
        reference_base64 = image_to_base64(reference_image_path)
        content.append({
            "type": "text",
            "text": "\n\n【リファレンス画像（目標ルック）】"
        })
        content.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:image/jpeg;base64,{reference_base64}"
            }
        })
    
    # 編集対象画像を後に追加
    if target_image_path:
        from analyzer.image_features import image_to_base64
        target_base64 = image_to_base64(target_image_path)
        content.append({
            "type": "text",
            "text": "\n\n【編集対象画像（現在の素材）】"
        })
        content.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:image/jpeg;base64,{target_base64}"
            }
        })
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "あなたはDaVinci Resolveのカラーグレーディングの専門家です。具体的で実践的な操作手順を提示してください。"
                },
                {
                    "role": "user",
                    "content": content
                }
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        # 使用量情報を取得
        usage = response.usage
        cost_info = calculate_cost(
            usage.prompt_tokens,
            usage.completion_tokens,
            model
        )
        
        instructions = response.choices[0].message.content.strip()
        return instructions, cost_info
    
    except RateLimitError as e:
        error_msg = (
            "OpenAI APIの使用量制限に達しました。\n"
            "考えられる原因:\n"
            "  - 月間の使用量上限に達している\n"
            "  - 支払い情報が未設定または期限切れ\n"
            "  - クレジット残高が不足している\n\n"
            "対処方法:\n"
            "  1. OpenAIのダッシュボード（https://platform.openai.com/）で使用状況を確認\n"
            "  2. 支払い情報を確認・更新\n"
            "  3. クレジット残高を補充\n"
            "  4. しばらく時間をおいてから再試行\n\n"
            f"詳細: {e}"
        )
        raise RuntimeError(error_msg)
    
    except APIError as e:
        if e.status_code == 401:
            error_msg = (
                "OpenAI APIの認証に失敗しました。\n"
                "APIキーが正しく設定されているか確認してください。\n\n"
                f"詳細: {e}"
            )
        elif e.status_code == 429:
            error_msg = (
                "OpenAI APIのレート制限に達しました。\n"
                "しばらく時間をおいてから再試行してください。\n\n"
                f"詳細: {e}"
            )
        else:
            error_msg = (
                f"OpenAI APIでエラーが発生しました（ステータスコード: {e.status_code}）。\n"
                f"詳細: {e}"
            )
        raise RuntimeError(error_msg)
    
    except APIConnectionError as e:
        error_msg = (
            "OpenAI APIへの接続に失敗しました。\n"
            "インターネット接続を確認してください。\n\n"
            f"詳細: {e}"
        )
        raise RuntimeError(error_msg)
    
    except Exception as e:
        raise RuntimeError(f"LLM推論中に予期しないエラーが発生しました: {e}")

