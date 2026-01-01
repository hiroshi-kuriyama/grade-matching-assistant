/**
 * IPC通信で使用する型定義
 */

export type ImageSlot = 'reference' | 'target';

export interface AnalysisStartPayload {
  referencePath: string;
  targetPath: string;
}

export interface CaptureStartPayload {
  slot: ImageSlot;
}

export interface AnalysisStdoutPayload {
  chunk: string;
}

export interface AnalysisDonePayload {
  fullText: string;
  code: number;
}

export interface AnalysisErrorPayload {
  message: string;
}

export interface CaptureReadyPayload {
  slot: ImageSlot;
}

export interface CaptureDonePayload {
  slot: ImageSlot;
  savedPath: string;
}

export interface CaptureErrorPayload {
  message: string;
}
