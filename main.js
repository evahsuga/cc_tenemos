const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

  // 開発時はDevToolsを開く
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const ColorMeAutomation = require('./automation-coloreme');

// テスト用のIPCハンドラー
ipcMain.handle('test-action', async () => {
  console.log('テストアクション実行！');
  return { success: true, message: 'テスト成功！' };
});

// カラーミーショップ自動化のIPCハンドラー
ipcMain.handle('run-coloreme', async (event, orderId) => {
  const automation = new ColorMeAutomation();

  try {
    // TODO: 実際のログイン情報は設定ファイルから読み込む
    const result = await automation.run(
      'your_username',  // ←実際のユーザー名に変更してください
      'your_password',  // ←実際のパスワードに変更してください
      orderId
    );

    return result;

  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
});

// 弥生販売自動化のIPCハンドラー
ipcMain.handle('run-yayoi', async (event, customerCode) => {
  return new Promise((resolve, reject) => {
    // Pythonスクリプトを実行
    const python = spawn('python3', ['automation-yayoi.py', customerCode]);

    let result = '';
    let error = '';

    python.stdout.on('data', (data) => {
      result += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        try {
          const parsed = JSON.parse(result);
          resolve(parsed);
        } catch (e) {
          reject(new Error('結果のパースに失敗: ' + result));
        }
      } else {
        reject(new Error('Pythonエラー: ' + error));
      }
    });
  });
});
