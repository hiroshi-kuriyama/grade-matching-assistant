/**
 * Preloadスクリプト
 * MainプロセスとRendererプロセスの安全なブリッジ
 */

import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  // Renderer → Main
  startAnalysis: (payload: { referencePath: string; targetPath: string }) => {
    ipcRenderer.send('analysis:start', payload);
  },
  startCapture: (payload: { slot: 'reference' | 'target' }) => {
    ipcRenderer.send('capture:start', payload);
  },
  openFileDialog: async (options?: { filters?: { name: string; extensions: string[] }[] }) => {
    return await ipcRenderer.invoke('files:openDialog', options);
  },
  saveTempFile: async (payload: { data: number[]; filename: string }) => {
    return await ipcRenderer.invoke('files:saveTemp', payload);
  },

  // Main → Renderer (イベントリスナー)
  onAnalysisStdout: (callback: (payload: { chunk: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: { chunk: string }) => callback(payload);
    ipcRenderer.on('analysis:stdout', handler);
    return () => ipcRenderer.removeListener('analysis:stdout', handler);
  },
  onAnalysisDone: (callback: (payload: { fullText: string; code: number }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: { fullText: string; code: number }) => callback(payload);
    ipcRenderer.on('analysis:done', handler);
    return () => ipcRenderer.removeListener('analysis:done', handler);
  },
  onAnalysisError: (callback: (payload: { message: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: { message: string }) => callback(payload);
    ipcRenderer.on('analysis:error', handler);
    return () => ipcRenderer.removeListener('analysis:error', handler);
  },
  onCaptureReady: (callback: (payload: { slot: 'reference' | 'target' }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: { slot: 'reference' | 'target' }) => callback(payload);
    ipcRenderer.on('capture:ready', handler);
    return () => ipcRenderer.removeListener('capture:ready', handler);
  },
  onCaptureDone: (callback: (payload: { slot: 'reference' | 'target'; savedPath: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: { slot: 'reference' | 'target'; savedPath: string }) => callback(payload);
    ipcRenderer.on('capture:done', handler);
    return () => ipcRenderer.removeListener('capture:done', handler);
  },
  onCaptureError: (callback: (payload: { message: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: { message: string }) => callback(payload);
    ipcRenderer.on('capture:error', handler);
    return () => ipcRenderer.removeListener('capture:error', handler);
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

