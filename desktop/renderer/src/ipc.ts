/**
 * Electron APIの型安全なラッパー
 * preload.tsから公開されるAPIを型付け
 */

export interface ElectronAPI {
  // Renderer → Main
  startAnalysis: (payload: { referencePath: string; targetPath: string }) => void;
  startCapture: (payload: { slot: 'reference' | 'target' }) => void;
  openFileDialog: (options?: { filters?: { name: string; extensions: string[] }[] }) => Promise<string | null>;
  saveTempFile: (payload: { data: number[]; filename: string }) => Promise<string | null>;
  getImageDataUrl: (filePath: string) => Promise<string | null>;

  // Main → Renderer (イベントリスナー)
  onAnalysisStdout: (callback: (payload: { chunk: string }) => void) => () => void;
  onAnalysisDone: (callback: (payload: { fullText: string; code: number }) => void) => () => void;
  onAnalysisError: (callback: (payload: { message: string }) => void) => () => void;
  onCaptureReady: (callback: (payload: { slot: 'reference' | 'target' }) => void) => () => void;
  onCaptureDone: (callback: (payload: { slot: 'reference' | 'target'; savedPath: string }) => void) => () => void;
  onCaptureError: (callback: (payload: { message: string }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
