/**
 * Electron Main Process
 * ウィンドウ作成・IPC・Python起動・スクリーンショット管理
 */
const electron = require('electron');
const { app, BrowserWindow, ipcMain, dialog, globalShortcut, desktopCapturer, protocol } = electron;
const electronScreen = electron.screen;
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
let mainWindow = null;
let overlayWindow = null;
let currentCaptureSlot = null;
let captureStartPos = null;
let captureEndPos = null;
let analysisProcess = null;
/**
 * Python実行ファイルのパスを取得
 */
function getPythonPath() {
    // 1. 環境変数 PYTHON_BIN があればそれを使用
    if (process.env.PYTHON_BIN) {
        return process.env.PYTHON_BIN;
    }
    // 2. 'python' を試す
    // 3. Windowsの場合 'py -3' を試す
    // 実際の検出は実行時にエラーハンドリングで行う
    return process.platform === 'win32' ? 'python' : 'python3';
}
/**
 * app.pyの絶対パスを取得
 */
function getAppPyPath() {
    // desktop/ から見た ../app.py
    return path.resolve(__dirname, '../../app.py');
}
/**
 * 一時ディレクトリのパスを取得
 */
function getCapturesDir() {
    const capturesDir = path.join(os.homedir(), '.grade-matching-assistant', 'captures');
    if (!fs.existsSync(capturesDir)) {
        fs.mkdirSync(capturesDir, { recursive: true });
    }
    return capturesDir;
}
/**
 * メインウィンドウを作成
 */
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false, // ローカルファイルアクセスのため
        },
    });
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist/renderer/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
/**
 * スクリーンショット用の透明オーバーレイウィンドウを作成
 */
function createOverlayWindow() {
    const primaryDisplay = electronScreen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    overlayWindow = new BrowserWindow({
        width,
        height,
        x: primaryDisplay.workArea.x,
        y: primaryDisplay.workArea.y,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: true, // オーバーレイでは直接requireを使用
            contextIsolation: false,
        },
    });
    overlayWindow.setIgnoreMouseEvents(false, { forward: true });
    overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));
    overlayWindow.on('closed', () => {
        overlayWindow = null;
    });
}
/**
 * スクリーンショット範囲選択を開始
 */
async function startCapture(slot) {
    if (overlayWindow) {
        return; // 既にキャプチャ中
    }
    currentCaptureSlot = slot;
    // メインウィンドウを非表示
    if (mainWindow) {
        mainWindow.hide();
    }
    // オーバーレイウィンドウを作成
    createOverlayWindow();
    // 準備完了を通知
    if (mainWindow) {
        mainWindow.webContents.send('capture:ready', { slot });
    }
    // オーバーレイウィンドウでマウスイベントを監視
    if (overlayWindow) {
        overlayWindow.webContents.on('did-finish-load', () => {
            overlayWindow?.webContents.send('capture:init', { slot });
        });
    }
}
/**
 * スクリーンショットを実行
 */
async function executeCapture(startPos, endPos) {
    if (!currentCaptureSlot) {
        return;
    }
    try {
        // 選択範囲を正規化
        const x = Math.min(startPos.x, endPos.x);
        const y = Math.min(startPos.y, endPos.y);
        const width = Math.abs(endPos.x - startPos.x);
        const height = Math.abs(endPos.y - startPos.y);
        if (width < 10 || height < 10) {
            throw new Error('選択範囲が小さすぎます');
        }
        // デスクトップキャプチャを取得
        const capturePrimaryDisplay = electronScreen.getPrimaryDisplay();
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: { width: capturePrimaryDisplay.size.width, height: capturePrimaryDisplay.size.height },
        });
        if (sources.length === 0) {
            throw new Error('スクリーンキャプチャを取得できませんでした');
        }
        const primarySource = sources[0];
        // 画像をクロップして保存
        // 注意: 実際の実装では、desktopCapturerのthumbnailをCanvas APIで処理する必要があります
        // ここでは簡易実装として、fullSize画像を取得してクロップする方法を想定
        const capturesDir = getCapturesDir();
        const timestamp = Date.now();
        const filename = `capture_${currentCaptureSlot}_${timestamp}.png`;
        const filePath = path.join(capturesDir, filename);
        // 注意: desktopCapturer.getSources()のthumbnailは低解像度のサムネイルです
        // 実際の高解像度キャプチャには、より複雑な実装が必要です
        // TODO: 高解像度スクリーンショットの実装（desktopCapturer + MediaStream APIを使用）
        // 簡易実装: サムネイルを使用（実際の実装ではMediaStream APIを使用する必要があります）
        const { nativeImage } = require('electron');
        // サムネイルから画像を作成（解像度は低いですが動作確認用）
        const fullImage = nativeImage.createFromDataURL(primarySource.thumbnail.toDataURL());
        // サムネイルのスケールを計算
        const scalePrimaryDisplay = electronScreen.getPrimaryDisplay();
        const displaySize = scalePrimaryDisplay.size;
        const scaleX = primarySource.thumbnail.getSize().width / displaySize.width;
        const scaleY = primarySource.thumbnail.getSize().height / displaySize.height;
        // スケールされた座標でクロップ
        const scaledX = Math.floor(x * scaleX);
        const scaledY = Math.floor(y * scaleY);
        const scaledWidth = Math.floor(width * scaleX);
        const scaledHeight = Math.floor(height * scaleY);
        const cropped = fullImage.crop({ x: scaledX, y: scaledY, width: scaledWidth, height: scaledHeight });
        require('fs').writeFileSync(filePath, cropped.toPNG());
        // キャプチャ完了を通知
        if (mainWindow) {
            mainWindow.webContents.send('capture:done', {
                slot: currentCaptureSlot,
                savedPath: filePath,
            });
        }
        // クリーンアップ
        cleanupCapture();
    }
    catch (error) {
        if (mainWindow) {
            mainWindow.webContents.send('capture:error', {
                message: error.message || 'キャプチャに失敗しました',
            });
        }
        cleanupCapture();
    }
}
/**
 * キャプチャをクリーンアップ
 */
function cleanupCapture() {
    if (overlayWindow) {
        overlayWindow.close();
        overlayWindow = null;
    }
    if (mainWindow) {
        mainWindow.show();
    }
    currentCaptureSlot = null;
    captureStartPos = null;
    captureEndPos = null;
}
/**
 * Pythonプロセスを起動して解析を実行
 */
function startAnalysis(referencePath, targetPath) {
    if (analysisProcess) {
        analysisProcess.kill();
    }
    const pythonPath = getPythonPath();
    const appPyPath = getAppPyPath();
    // 絶対パスに変換
    const absReferencePath = path.resolve(referencePath);
    const absTargetPath = path.resolve(targetPath);
    let fullOutput = '';
    let errorOutput = '';
    // WindowsでUTF-8を強制するための環境変数を設定
    const env = { ...process.env };
    env.PYTHONIOENCODING = 'utf-8';
    env.PYTHONUTF8 = '1';
    analysisProcess = spawn(pythonPath, [
        appPyPath,
        '--reference',
        absReferencePath,
        '--target',
        absTargetPath,
    ], {
        cwd: path.dirname(appPyPath),
        env: env,
    });
    analysisProcess.stdout?.on('data', (data) => {
        const chunk = data.toString('utf-8');
        fullOutput += chunk;
        if (mainWindow) {
            mainWindow.webContents.send('analysis:stdout', { chunk });
        }
    });
    analysisProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString('utf-8');
    });
    analysisProcess.on('close', (code) => {
        if (code === 0) {
            if (mainWindow) {
                mainWindow.webContents.send('analysis:done', {
                    fullText: fullOutput,
                    code,
                });
            }
        }
        else {
            if (mainWindow) {
                mainWindow.webContents.send('analysis:error', {
                    message: errorOutput || `プロセスが終了コード ${code} で終了しました`,
                });
            }
        }
        analysisProcess = null;
    });
    analysisProcess.on('error', (error) => {
        if (mainWindow) {
            let errorMessage = error.message;
            if (error.message.includes('ENOENT')) {
                errorMessage = `Pythonが見つかりません。PYTHON_BIN環境変数を設定するか、Pythonがインストールされているか確認してください。`;
            }
            mainWindow.webContents.send('analysis:error', {
                message: errorMessage,
            });
        }
        analysisProcess = null;
    });
}
// IPCハンドラー
ipcMain.on('analysis:start', (_event, payload) => {
    startAnalysis(payload.referencePath, payload.targetPath);
});
ipcMain.on('capture:start', (_event, payload) => {
    console.log('Received capture:start', payload);
    startCapture(payload.slot);
});
ipcMain.on('capture:cancel', () => {
    cleanupCapture();
});
ipcMain.on('capture:select', (_event, payload) => {
    console.log('Received capture:select', payload);
    executeCapture(payload.start, payload.end);
});
ipcMain.handle('files:openDialog', async (_event, options) => {
    if (!mainWindow) {
        return null;
    }
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: options?.filters || [
            { name: '画像ファイル', extensions: ['png', 'jpg', 'jpeg'] },
        ],
    });
    if (result.canceled || result.filePaths.length === 0) {
        return null;
    }
    return result.filePaths[0];
});
ipcMain.handle('files:saveTemp', async (_event, payload) => {
    const tempDir = path.join(os.homedir(), '.grade-matching-assistant', 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    const timestamp = Date.now();
    const ext = path.extname(payload.filename) || '.png';
    const filename = `temp_${timestamp}_${payload.filename}`;
    const filePath = path.join(tempDir, filename);
    const buffer = Buffer.from(payload.data);
    fs.writeFileSync(filePath, buffer);
    return filePath;
});
ipcMain.handle('files:getImageDataUrl', async (_event, filePath) => {
    try {
        const { nativeImage } = require('electron');
        const image = nativeImage.createFromPath(filePath);
        if (image.isEmpty()) {
            return null;
        }
        return image.toDataURL();
    }
    catch (error) {
        console.error('Failed to load image:', error);
        return null;
    }
});
// グローバルホットキー
app.whenReady().then(() => {
    createMainWindow();
    // グローバルホットキー登録
    globalShortcut.register('CommandOrControl+Shift+1', () => {
        if (mainWindow) {
            startCapture('reference');
        }
    });
    globalShortcut.register('CommandOrControl+Shift+2', () => {
        if (mainWindow) {
            startCapture('target');
        }
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    if (analysisProcess) {
        analysisProcess.kill();
    }
});
