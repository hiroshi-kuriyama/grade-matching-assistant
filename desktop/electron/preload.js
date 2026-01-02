"use strict";
/**
 * Preloadスクリプト
 * MainプロセスとRendererプロセスの安全なブリッジ
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electronAPI = {
    // Renderer → Main
    startAnalysis: (payload) => {
        electron_1.ipcRenderer.send('analysis:start', payload);
    },
    startCapture: (payload) => {
        electron_1.ipcRenderer.send('capture:start', payload);
    },
    openFileDialog: async (options) => {
        return await electron_1.ipcRenderer.invoke('files:openDialog', options);
    },
    saveTempFile: async (payload) => {
        return await electron_1.ipcRenderer.invoke('files:saveTemp', payload);
    },
    getImageDataUrl: async (filePath) => {
        return await electron_1.ipcRenderer.invoke('files:getImageDataUrl', filePath);
    },
    // Main → Renderer (イベントリスナー)
    onAnalysisStdout: (callback) => {
        const handler = (_event, payload) => callback(payload);
        electron_1.ipcRenderer.on('analysis:stdout', handler);
        return () => electron_1.ipcRenderer.removeListener('analysis:stdout', handler);
    },
    onAnalysisDone: (callback) => {
        const handler = (_event, payload) => callback(payload);
        electron_1.ipcRenderer.on('analysis:done', handler);
        return () => electron_1.ipcRenderer.removeListener('analysis:done', handler);
    },
    onAnalysisError: (callback) => {
        const handler = (_event, payload) => callback(payload);
        electron_1.ipcRenderer.on('analysis:error', handler);
        return () => electron_1.ipcRenderer.removeListener('analysis:error', handler);
    },
    onCaptureReady: (callback) => {
        const handler = (_event, payload) => callback(payload);
        electron_1.ipcRenderer.on('capture:ready', handler);
        return () => electron_1.ipcRenderer.removeListener('capture:ready', handler);
    },
    onCaptureDone: (callback) => {
        const handler = (_event, payload) => callback(payload);
        electron_1.ipcRenderer.on('capture:done', handler);
        return () => electron_1.ipcRenderer.removeListener('capture:done', handler);
    },
    onCaptureError: (callback) => {
        const handler = (_event, payload) => callback(payload);
        electron_1.ipcRenderer.on('capture:error', handler);
        return () => electron_1.ipcRenderer.removeListener('capture:error', handler);
    },
};
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
