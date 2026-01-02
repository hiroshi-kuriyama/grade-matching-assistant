/**
 * OpenAI APIキー管理
 * 既定: セッション（メモリ）のみ保持
 * オプション: localStorage保存（明示同意）
 */

const STORAGE_KEY = 'openai_api_key';
const STORAGE_ENABLED_KEY = 'openai_api_key_storage_enabled';

export interface ApiKeyState {
  key: string | null;
  storageEnabled: boolean;
}

/**
 * APIキーを取得（メモリ + localStorageから）
 */
export function getApiKey(): string | null {
  // まずメモリから取得を試みる（セッション保持）
  const memoryKey = (window as any).__openaiApiKey;
  if (memoryKey) {
    return memoryKey;
  }

  // localStorageが有効な場合のみ取得
  if (isStorageEnabled()) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // メモリにも保持
        (window as any).__openaiApiKey = stored;
        return stored;
      }
    } catch (e) {
      console.warn('Failed to read API key from localStorage:', e);
    }
  }

  return null;
}

/**
 * APIキーを設定
 */
export function setApiKey(key: string, saveToStorage: boolean = false): void {
  // メモリに保持
  (window as any).__openaiApiKey = key;

  // localStorage保存の設定
  setStorageEnabled(saveToStorage);

  if (saveToStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch (e) {
      console.warn('Failed to save API key to localStorage:', e);
    }
  } else {
    // 無効化された場合は削除
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // 無視
    }
  }
}

/**
 * APIキーを削除
 */
export function clearApiKey(): void {
  // メモリから削除
  delete (window as any).__openaiApiKey;

  // localStorageからも削除
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_ENABLED_KEY);
  } catch (e) {
    // 無視
  }
}

/**
 * localStorage保存が有効かどうか
 */
export function isStorageEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_ENABLED_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

/**
 * localStorage保存の有効/無効を設定
 */
export function setStorageEnabled(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(STORAGE_ENABLED_KEY, 'true');
    } else {
      localStorage.removeItem(STORAGE_ENABLED_KEY);
    }
  } catch (e) {
    console.warn('Failed to set storage enabled flag:', e);
  }
}

/**
 * 現在の状態を取得
 */
export function getApiKeyState(): ApiKeyState {
  return {
    key: getApiKey(),
    storageEnabled: isStorageEnabled(),
  };
}

