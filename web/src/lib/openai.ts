/**
 * OpenAI API呼び出し
 * クライアント側から直接呼び出し
 */

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: Array<
    { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }
  >;
}

export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAIError {
  error: {
    message: string;
    type?: string;
    code?: string;
  };
}

export class OpenAIApiError extends Error {
  constructor(
    message: string,
    public readonly type: 'network' | 'cors' | 'http' | 'api' | 'unknown',
    public readonly statusCode?: number,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'OpenAIApiError';
  }
}

/**
 * OpenAI APIを呼び出し
 * CORS/HTTP/ネットワークエラーを明示的に分類
 */
export async function callOpenAI(
  apiKey: string,
  messages: OpenAIMessage[],
  model: string = 'gpt-4o-mini'
): Promise<OpenAIResponse> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      // HTTPエラー（4xx, 5xx）
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorType: 'http' | 'api' = 'http';

      try {
        const errorData: OpenAIError = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error.message || errorMessage;
          errorType = 'api';
        }
      } catch {
        // JSONパース失敗時はHTTPステータスメッセージを使用
      }

      throw new OpenAIApiError(errorMessage, errorType, response.status);
    }

    const data: unknown = await response.json();
    return parseOpenAIResponse(data);
  } catch (error) {
    if (error instanceof OpenAIApiError) {
      throw error;
    }

    // ネットワークエラー（CORS、接続失敗など）
    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
        throw new OpenAIApiError(
          'CORSエラー: ブラウザのセキュリティポリシーによりリクエストがブロックされました',
          'cors',
          undefined,
          error
        );
      }
      throw new OpenAIApiError(
        'ネットワークエラー: 接続に失敗しました。インターネット接続を確認してください',
        'network',
        undefined,
        error
      );
    }

    // その他の予期しないエラー
    throw new OpenAIApiError(
      `予期しないエラー: ${error instanceof Error ? error.message : String(error)}`,
      'unknown',
      undefined,
      error
    );
  }
}

/**
 * OpenAI APIレスポンスを型安全にパース
 */
function parseOpenAIResponse(data: unknown): OpenAIResponse {
  if (typeof data !== 'object' || data === null) {
    throw new OpenAIApiError('無効なAPIレスポンス形式', 'api');
  }

  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.choices) || obj.choices.length === 0) {
    throw new OpenAIApiError('APIレスポンスにchoicesが含まれていません', 'api');
  }

  const firstChoice = obj.choices[0];
  if (
    typeof firstChoice !== 'object' ||
    firstChoice === null ||
    typeof (firstChoice as Record<string, unknown>).message !== 'object' ||
    (firstChoice as Record<string, unknown>).message === null
  ) {
    throw new OpenAIApiError('APIレスポンスのchoices[0].messageが無効です', 'api');
  }

  const message = (firstChoice as { message: Record<string, unknown> }).message;
  if (typeof message.content !== 'string') {
    throw new OpenAIApiError('APIレスポンスのmessage.contentが文字列ではありません', 'api');
  }

  return {
    choices: [
      {
        message: {
          content: message.content,
        },
      },
    ],
    usage:
      typeof obj.usage === 'object' && obj.usage !== null
        ? ((): { prompt_tokens: number; completion_tokens: number; total_tokens: number } => {
            const usage = obj.usage as Record<string, unknown>;
            const promptTokens = typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : 0;
            const completionTokens =
              typeof usage.completion_tokens === 'number' ? usage.completion_tokens : 0;
            const totalTokens = typeof usage.total_tokens === 'number' ? usage.total_tokens : 0;
            return {
              prompt_tokens: promptTokens,
              completion_tokens: completionTokens,
              total_tokens: totalTokens,
            };
          })()
        : undefined,
  };
}

/**
 * 画像2枚とプロンプトで解析を実行
 */
export async function analyzeImages(
  apiKey: string,
  prompt: string,
  referenceImageDataUrl: string,
  targetImageDataUrl: string,
  model: string = 'gpt-4o-mini'
): Promise<string> {
  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: [
        {
          type: 'text',
          text: 'あなたはDaVinci Resolveのカラーグレーディングの専門家です。具体的で実践的な操作手順を提示してください。',
        },
      ],
    },
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'text', text: '\n\n【リファレンス画像（目標ルック）】' },
        { type: 'image_url', image_url: { url: referenceImageDataUrl } },
        { type: 'text', text: '\n\n【編集対象画像（現在の素材）】' },
        { type: 'image_url', image_url: { url: targetImageDataUrl } },
      ],
    },
  ];

  const result = await callOpenAI(apiKey, messages, model);
  const content = result.choices[0]?.message?.content;
  if (!content) {
    throw new OpenAIApiError('APIレスポンスにコンテンツが含まれていません', 'api');
  }
  return content;
}
