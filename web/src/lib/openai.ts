/**
 * OpenAI API呼び出し
 * クライアント側から直接呼び出し
 */

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }
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

/**
 * OpenAI APIを呼び出し
 */
export async function callOpenAI(
  apiKey: string,
  messages: OpenAIMessage[],
  model: string = 'gpt-4o-mini'
): Promise<OpenAIResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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
    const errorData: OpenAIError = await response.json().catch(() => ({
      error: { message: `HTTP ${response.status}: ${response.statusText}` },
    }));
    throw new Error(errorData.error.message || `API request failed: ${response.status}`);
  }

  return await response.json();
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
  return result.choices[0]?.message?.content || '';
}

