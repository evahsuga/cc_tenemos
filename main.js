const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const http = require('http');
const ColorMeExistingBrowserAutomation = require('./automation-coloreme-existing-browser');

let mainWindow;
let chromeProcess = null;

// Chromeデバッグモードが起動しているか確認
function checkChromeDebugRunning() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:9222/json/version', (res) => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Chromeをデバッグモードで起動
function startChromeDebug() {
  return new Promise((resolve, reject) => {
    console.log('Chromeデバッグモードを起動中...');

    let chromePath;
    let args;

    const platform = os.platform();

    if (platform === 'darwin') {
      // macOS
      chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      args = [
        '--remote-debugging-port=9222',
        '--user-data-dir=' + path.join(os.homedir(), '.chrome-automation-profile'),
        '--no-first-run',
        '--no-default-browser-check'
      ];
    } else if (platform === 'win32') {
      // Windows
      chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      args = [
        '--remote-debugging-port=9222',
        '--user-data-dir=' + path.join(os.homedir(), '.chrome-automation-profile'),
        '--no-first-run',
        '--no-default-browser-check'
      ];
    } else {
      // Linux
      chromePath = 'google-chrome';
      args = [
        '--remote-debugging-port=9222',
        '--user-data-dir=' + path.join(os.homedir(), '.chrome-automation-profile'),
        '--no-first-run',
        '--no-default-browser-check'
      ];
    }

    try {
      chromeProcess = spawn(chromePath, args, {
        detached: true,
        stdio: 'ignore'
      });

      chromeProcess.unref();

      console.log('✓ Chrome起動完了');

      // 起動完了を待つ
      setTimeout(() => {
        resolve(true);
      }, 3000);

    } catch (error) {
      console.error('❌ Chrome起動失敗:', error.message);
      reject(error);
    }
  });
}

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

  // Content Security Policy を設定
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"]
      }
    });
  });

  mainWindow.loadFile('business_flow_dashboard.html');

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

// カラーミーショップ自動ダウンロードのIPCハンドラー
ipcMain.handle('run-coloreme-download', async (event) => {
  const automation = new ColorMeExistingBrowserAutomation();

  try {
    // Chromeデバッグモードが起動しているか確認
    const isRunning = await checkChromeDebugRunning();

    if (!isRunning) {
      // 起動していない場合は自動起動
      try {
        await startChromeDebug();

        // Chromeが開いたらユーザーにログインを促す
        return {
          success: false,
          message: 'Chromeを起動しました。\n\n次の手順を実行してください：\n1. 開いたChromeでカラーミーショップにログイン\n2. メニューページ (https://admin.shop-pro.jp/?mode=menu) に移動\n3. 再度このボタンをクリック'
        };
      } catch (error) {
        return {
          success: false,
          message: 'Chromeの自動起動に失敗しました。\n手動でChromeを起動してください。'
        };
      }
    }

    // 既存のChromeに接続
    const connected = await automation.connectToExistingBrowser();

    if (!connected) {
      return {
        success: false,
        message: 'Chromeへの接続に失敗しました。\nChromeでカラーミーショップにログイン後、再度お試しください。'
      };
    }

    // 現在のURLを確認
    const currentUrl = automation.page.url();

    // メニューページに移動（必要な場合）
    if (!currentUrl.includes('mode=menu')) {
      await automation.navigateToPage('https://admin.shop-pro.jp/?mode=menu');
    }

    // 第1ステップ: ダウンロードページへ移動
    await Promise.all([
      automation.page.waitForNavigation({
        waitUntil: 'domcontentloaded',
        timeout: 60000  // 60秒
      }),
      automation.page.click('a[href*="mode=data_download"]')
    ]);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 第2ステップ: データ種類を選択
    await automation.page.select('select[name="data_type"]', '9'); // 受注一括データ
    await new Promise(resolve => setTimeout(resolve, 300));

    // 第3ステップ: 除外条件にチェック
    const checkbox1Checked = await automation.page.$eval('#except_shipped', el => el.checked);
    if (!checkbox1Checked) {
      await automation.page.click('#except_shipped');
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const checkbox2Checked = await automation.page.$eval('#sales_all_except_shipped', el => el.checked);
    if (!checkbox2Checked) {
      await automation.page.click('#sales_all_except_shipped');
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // 第4ステップ: ダウンロード実行
    await automation.page.evaluate(() => {
      if (typeof jf_ProductDownloadSubmit !== 'undefined') {
        jf_ProductDownloadSubmit(0);
      }
    });

    // ダウンロード完了を待つ
    await new Promise(resolve => setTimeout(resolve, 2000));

    await automation.disconnect();

    return {
      success: true,
      message: 'CSVファイルのダウンロードが完了しました。ダウンロードフォルダを確認してください。'
    };

  } catch (error) {
    await automation.disconnect();
    return {
      success: false,
      message: 'エラーが発生しました: ' + error.message
    };
  }
});
