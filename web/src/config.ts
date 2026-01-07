/**
 * アプリケーション設定
 * ビルド時に環境変数から読み込む
 */

// GASエンドポイントのURL（開発者負担版で使用）
// 本番環境では環境変数 VITE_GAS_ENDPOINT から取得
// 開発時は .env.local に設定
export const GAS_ENDPOINT = import.meta.env.VITE_GAS_ENDPOINT || '';

// 開発者負担版かどうか（APIキー入力不要）
// 環境変数 VITE_HOSTED_MODE が 'true' の場合、開発者負担版
export const IS_HOSTED_MODE = import.meta.env.VITE_HOSTED_MODE === 'true';

// 開発者負担版の場合、APIキー入力セクションを非表示にする
export const SHOW_API_KEY_INPUT = !IS_HOSTED_MODE;


