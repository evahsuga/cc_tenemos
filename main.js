const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const http = require('http');
const ColorMeExistingBrowserAutomation = require('./automation-coloreme-existing-browser');

let mainWindow;
let chromeProcess = null;

// Chromeデバッグモードが起動しているか確認
function checkChromeDebugRunning(verbose = false) {
  return new Promise((resolve) => {
    if (verbose) {
      console.log('デバッグポートチェック: http://127.0.0.1:9222/json/version にアクセス中...');
    }

    const req = http.get('http://127.0.0.1:9222/json/version', (res) => {
      if (verbose) {
        console.log('✓ デバッグポート応答あり (status:', res.statusCode, ')');
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (verbose) {
          console.log('デバッグポート情報:', data);
        }
        resolve(true);
      });
    });

    req.on('error', (err) => {
      if (verbose) {
        console.log('❌ デバッグポート接続エラー:', err.code || err.message);
      }
      resolve(false);
    });

    req.setTimeout(2000, () => {
      if (verbose) {
        console.log('❌ デバッグポート接続タイムアウト (2秒)');
      }
      req.destroy();
      resolve(false);
    });
  });
}

// 既存のChromeプロセスを終了
function killExistingChrome() {
  return new Promise((resolve) => {
    const platform = os.platform();
    let killCommand;
    let resolved = false;

    if (platform === 'win32') {
      // Windows: taskkill
      killCommand = spawn('taskkill', ['/F', '/IM', 'chrome.exe'], {
        stdio: 'ignore'
      });
    } else if (platform === 'darwin') {
      // macOS: killall
      killCommand = spawn('killall', ['Google Chrome'], {
        stdio: 'ignore'
      });
    } else {
      // Linux: killall
      killCommand = spawn('killall', ['chrome'], {
        stdio: 'ignore'
      });
    }

    killCommand.on('close', (code) => {
      if (resolved) return;
      resolved = true;

      // エラーコード1は「プロセスが見つからない」なので正常とみなす
      if (code === 0 || code === 1 || code === 128) {
        console.log('✓ 既存Chromeプロセスのクリーンアップ完了（コード:', code, '）');
        resolve(true);
      } else {
        console.log('既存Chromeプロセスのクリーンアップ（エラーコード:', code, '）');
        resolve(true); // エラーでも続行
      }
    });

    killCommand.on('error', (err) => {
      if (resolved) return;
      resolved = true;
      console.log('既存Chromeプロセスのクリーンアップ（エラー:', err.message, '）');
      resolve(true); // エラーでも続行
    });

    // タイムアウト設定（2秒）
    setTimeout(() => {
      if (resolved) return;
      resolved = true;
      try {
        killCommand.kill();
      } catch (e) {
        // ignore
      }
      console.log('✓ 既存Chromeプロセスのクリーンアップ完了（タイムアウト）');
      resolve(true);
    }, 2000);
  });
}

// Chromeをデバッグモードで起動（カラーミーログインページを開く）
function startChromeDebug() {
  return new Promise((resolve, reject) => {
    console.log('Chromeデバッグモードを起動中...');

    let chromePath;
    let args;

    const platform = os.platform();
    const colorMeLoginUrl = 'https://admin.shop-pro.jp/';

    if (platform === 'darwin') {
      // macOS
      chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      args = [
        '--remote-debugging-port=9222',
        '--user-data-dir=' + path.join(os.homedir(), '.chrome-automation-profile'),
        '--no-first-run',
        '--no-default-browser-check',
        colorMeLoginUrl
      ];
    } else if (platform === 'win32') {
      // Windows
      chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      args = [
        '--remote-debugging-port=9222',
        '--user-data-dir=' + path.join(os.homedir(), '.chrome-automation-profile'),
        '--no-first-run',
        '--no-default-browser-check',
        colorMeLoginUrl
      ];
    } else {
      // Linux
      chromePath = 'google-chrome';
      args = [
        '--remote-debugging-port=9222',
        '--user-data-dir=' + path.join(os.homedir(), '.chrome-automation-profile'),
        '--no-first-run',
        '--no-default-browser-check',
        colorMeLoginUrl
      ];
    }

    try {
      console.log('Chrome起動コマンド:', chromePath);
      console.log('Chrome起動引数:', args.join(' '));

      chromeProcess = spawn(chromePath, args, {
        detached: true,
        stdio: 'pipe'  // 出力を確認できるように変更
      });

      // Chromeの出力をログに表示
      chromeProcess.stdout.on('data', (data) => {
        console.log('[Chrome stdout]:', data.toString().trim());
      });

      chromeProcess.stderr.on('data', (data) => {
        console.log('[Chrome stderr]:', data.toString().trim());
      });

      chromeProcess.on('error', (err) => {
        console.error('[Chrome起動エラー]:', err);
      });

      chromeProcess.unref();

      console.log('✓ Chrome起動コマンド実行完了');
      console.log('✓ カラーミーログインページを開きました');

      // Chrome起動完了を待つ（デバッグポートが開くまで待機）
      console.log('Chromeの起動を待っています...');
      setTimeout(() => {
        console.log('✓ Chrome起動待機完了');
        resolve(true);
      }, 8000);

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

  // 外部リンクをシステムのデフォルトブラウザで開く
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // 外部URLの場合はシステムのデフォルトブラウザで開く
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' }; // Electronでは開かない
    }
    return { action: 'allow' };
  });

  // ナビゲーションも同様に処理
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // 外部URLへのナビゲーションを防止し、デフォルトブラウザで開く
    if (url.startsWith('http://') || url.startsWith('https://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

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

// 外部URLをシステムのデフォルトブラウザで開くIPCハンドラー
ipcMain.handle('open-external-url', async (event, url) => {
  console.log('外部ブラウザでURLを開きます:', url);
  try {
    await shell.openExternal(url);
    return { success: true, message: 'ブラウザで開きました' };
  } catch (error) {
    console.error('外部URL起動エラー:', error);
    return { success: false, message: error.message };
  }
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
        // Chrome起動前に既存プロセスを終了
        console.log('既存のChromeプロセスをクリーンアップしています...');
        await killExistingChrome();

        // プロセスが完全に終了するまで追加待機
        console.log('プロセス終了完了を待っています...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✓ プロセス終了完了');
        console.log('');

        await startChromeDebug();

        // デバッグポートが準備できるまで待つ（最大20回リトライ、2秒間隔）
        console.log('Chromeデバッグポートの準備を待っています...');
        console.log('');

        let retryCount = 0;
        let debugPortReady = false;

        // 最初の試行は詳細ログ付き
        console.log('=== 初回接続試行（詳細ログ） ===');
        debugPortReady = await checkChromeDebugRunning(true);
        console.log('');

        if (!debugPortReady) {
          // 通常のリトライループ
          while (retryCount < 19 && !debugPortReady) {
            console.log(`リトライ ${retryCount + 1}/19...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            retryCount++;

            // 10回目と19回目は詳細ログ
            const verbose = (retryCount === 10 || retryCount === 19);
            if (verbose) {
              console.log('=== 詳細ログ ===');
            }
            debugPortReady = await checkChromeDebugRunning(verbose);
            if (verbose) {
              console.log('');
            }
          }
        }

        if (debugPortReady) {
          console.log('✓ デバッグポート接続成功！');
          console.log('');
        }

        if (!debugPortReady) {
          console.error('❌ デバッグポートへの接続に失敗しました');
          console.error('');
          console.error('対処方法：');
          console.error('1. タスクマネージャーを開く（Ctrl+Shift+Esc）');
          console.error('2. すべてのChromeプロセスを終了する');
          console.error('3. 再度ボタンをクリックする');
          console.error('');
          return {
            success: false,
            message: 'Chromeデバッグポートへの接続に失敗しました（40秒タイムアウト）。\n\n対処方法：\n1. タスクマネージャー（Ctrl+Shift+Esc）を開く\n2. すべてのChromeプロセスを終了\n3. 再度ボタンをクリック\n\n※既存のChromeが起動していると、デバッグモードで起動できません。'
          };
        }

        console.log('✓ デバッグポート準備完了');

        // Chrome起動後、Puppeteerで接続して自動ログインを試みる
        const connected = await automation.connectToExistingBrowser();

        if (!connected) {
          return {
            success: false,
            message: 'Chromeへの接続に失敗しました。\n再度ボタンをクリックしてください。'
          };
        }

        // カラーミーログインページが開いているか確認
        const currentUrl = automation.page.url();
        console.log('起動後のURL:', currentUrl);

        // パスワード自動入力を待つ
        await new Promise(resolve => setTimeout(resolve, 3000));

        // ログインボタンを探してクリック
        try {
          console.log('ログインボタンを探しています...');

          // 方法1: よくあるセレクタを試す
          const loginButtonSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            '.login-button',
            '#login-button',
            'button.btn-login'
          ];

          let buttonClicked = false;

          // まず標準的なセレクタを試す
          for (const selector of loginButtonSelectors) {
            try {
              const button = await automation.page.$(selector);
              if (button) {
                console.log(`ログインボタンを発見: ${selector}`);
                await automation.page.click(selector);
                buttonClicked = true;
                console.log('✓ ログインボタンをクリックしました');
                break;
              }
            } catch (e) {
              // 次のセレクタを試す
              continue;
            }
          }

          // 方法2: テキストで検索（セレクタで見つからない場合）
          if (!buttonClicked) {
            console.log('テキストでログインボタンを探しています...');
            buttonClicked = await automation.page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'));
              const loginButton = buttons.find(btn => {
                const text = btn.textContent || btn.value || '';
                return text.includes('ログイン') || text.includes('login') || text.includes('Login');
              });

              if (loginButton) {
                loginButton.click();
                return true;
              }
              return false;
            });

            if (buttonClicked) {
              console.log('✓ ログインボタンをクリックしました（テキスト検索）');
            }
          }

          if (!buttonClicked) {
            await automation.disconnect();
            return {
              success: false,
              message: 'ログインボタンが見つかりませんでした。\n手動でログインボタンをクリックし、ログイン後に再度このボタンをクリックしてください。'
            };
          }

          // ログイン完了を待つ（ページ遷移を待機）
          console.log('ログイン完了を待機しています...');
          await new Promise(resolve => setTimeout(resolve, 5000));

          console.log('✓ ログイン完了');
          console.log('CSVダウンロード処理を開始します...');

          // ログイン後、そのままCSVダウンロード処理を続行
          // （以下、通常のCSVダウンロード処理と同じ）

          // メニューページに移動
          const afterLoginUrl = automation.page.url();
          if (!afterLoginUrl.includes('mode=menu')) {
            console.log('メニューページに移動します...');
            await automation.navigateToPage('https://admin.shop-pro.jp/?mode=menu');
          }

          // 第1ステップ: ダウンロードページへ移動
          console.log('第1ステップ: ダウンロードページへ移動...');
          await Promise.all([
            automation.page.waitForNavigation({
              waitUntil: 'domcontentloaded',
              timeout: 60000
            }),
            automation.page.click('a[href*="mode=data_download"]')
          ]);
          await new Promise(resolve => setTimeout(resolve, 1000));

          // 第2ステップ: データ種類を選択
          console.log('第2ステップ: データ種類を選択（受注一括データ）...');
          await automation.page.select('select[name="data_type"]', '9');
          await new Promise(resolve => setTimeout(resolve, 300));

          // 第3ステップ: 除外条件にチェック
          console.log('第3ステップ: 除外条件にチェック...');
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
          console.log('第4ステップ: ダウンロード実行...');
          await automation.page.evaluate(() => {
            if (typeof jf_ProductDownloadSubmit !== 'undefined') {
              jf_ProductDownloadSubmit(0);
            }
          });

          // ダウンロード完了を待つ
          await new Promise(resolve => setTimeout(resolve, 2000));

          await automation.disconnect();

          console.log('✓✓✓ すべての処理が完了しました！');

          return {
            success: true,
            message: 'ログインからCSVダウンロードまで完了しました！\nダウンロードフォルダを確認してください。'
          };

        } catch (error) {
          console.error('自動化処理エラー:', error.message);
          console.error('エラースタック:', error.stack);
          await automation.disconnect();
          return {
            success: false,
            message: '自動化処理中にエラーが発生しました。\n\nエラー: ' + error.message + '\n\n手動でログイン後、再度ボタンをクリックしてください。'
          };
        }

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

    // カラーミーショップのログインページを開く
    console.log('カラーミーショップのログインページを開きます...');
    await automation.navigateToPage('https://admin.shop-pro.jp/');

    // ページ読み込みとパスワード自動入力を待つ
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 現在のURLを確認してログイン状態をチェック
    const currentUrl = automation.page.url();
    console.log('現在のURL:', currentUrl);

    // ログインページのままの場合は、ユーザーに手動ログインを促す
    if (currentUrl.includes('admin.shop-pro.jp/login') ||
        (!currentUrl.includes('mode=') && currentUrl.includes('admin.shop-pro.jp'))) {
      await automation.disconnect();
      return {
        success: false,
        message: 'カラーミーショップのログインページを開きました。\n\nパスワードが自動入力されている場合は、ログインボタンをクリックしてログインしてください。\nログイン後に再度このボタンをクリックしてください。'
      };
    }

    // ログイン済みの場合は、メニューページに移動
    if (!currentUrl.includes('mode=menu')) {
      console.log('メニューページに移動します...');
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

// 弥生販売 顧客台帳インポート自動化のIPCハンドラー
ipcMain.handle('run-yayoi-customer-import', async (event) => {
  return new Promise((resolve, reject) => {
    console.log('弥生販売 顧客台帳インポート自動化を開始...');

    // Pythonスクリプトを実行（UTF-8エンコーディングを明示的に指定）
    const pythonCommand = os.platform() === 'win32' ? 'python' : 'python3';
    const python = spawn(pythonCommand, ['automation-yayoi-import-customer.py'], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    let result = '';
    let stderrOutput = '';

    python.stdout.on('data', (data) => {
      const output = data.toString('utf8');
      console.log('[Python stdout]:', output);
      result += output;
    });

    python.stderr.on('data', (data) => {
      const output = data.toString('utf8');
      console.error('[Python stderr]:', output);
      stderrOutput += output;
    });

    python.on('close', (code) => {
      console.log(`Python script exited with code ${code}`);

      if (code === 0) {
        try {
          // JSONの最後の行を取得（前の行は標準エラー出力のログ）
          const lines = result.trim().split('\n');
          const jsonLine = lines[lines.length - 1];
          const parsed = JSON.parse(jsonLine);
          console.log('✓ 自動化完了:', parsed.message);
          resolve(parsed);
        } catch (e) {
          console.error('結果のパースに失敗:', e.message);
          console.error('出力内容:', result);
          resolve({
            success: false,
            message: '結果の解析に失敗しました。\n\n標準エラー出力:\n' + stderrOutput
          });
        }
      } else {
        console.error('Python実行エラー（終了コード ' + code + '）');
        resolve({
          success: false,
          message: 'Pythonスクリプトの実行に失敗しました。\n\n標準エラー出力:\n' + stderrOutput
        });
      }
    });

    python.on('error', (err) => {
      console.error('Python起動エラー:', err);
      resolve({
        success: false,
        message: 'Pythonの起動に失敗しました。\n\nPythonがインストールされているか確認してください。\nエラー: ' + err.message
      });
    });
  });
});

// 弥生販売 顧客リストExcelエクスポート自動化のIPCハンドラー（Step 3-1）
ipcMain.handle('run-yayoi-customer-export', async (event) => {
  return new Promise((resolve, reject) => {
    console.log('弥生販売 顧客リストExcelエクスポート自動化を開始...');

    // Pythonスクリプトを実行（UTF-8エンコーディングを明示的に指定）
    const pythonCommand = os.platform() === 'win32' ? 'python' : 'python3';
    const python = spawn(pythonCommand, ['automation-yayoi-export-customer.py'], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    let result = '';
    let stderrOutput = '';

    python.stdout.on('data', (data) => {
      const output = data.toString('utf8');
      console.log('[Python stdout]:', output);
      result += output;
    });

    python.stderr.on('data', (data) => {
      const output = data.toString('utf8');
      console.error('[Python stderr]:', output);
      stderrOutput += output;
    });

    python.on('close', (code) => {
      console.log(`Python script exited with code ${code}`);

      if (code === 0) {
        try {
          // JSONの最後の行を取得
          const lines = result.trim().split('\n');
          const jsonLine = lines[lines.length - 1];
          const parsed = JSON.parse(jsonLine);
          console.log('✓ 自動化完了:', parsed.message);
          resolve(parsed);
        } catch (e) {
          console.error('結果のパースに失敗:', e.message);
          resolve({
            success: false,
            message: '結果の解析に失敗しました。\n\n標準エラー出力:\n' + stderrOutput
          });
        }
      } else {
        console.error('Python実行エラー（終了コード ' + code + '）');
        resolve({
          success: false,
          message: 'Pythonスクリプトの実行に失敗しました。\n\n標準エラー出力:\n' + stderrOutput
        });
      }
    });

    python.on('error', (err) => {
      console.error('Python起動エラー:', err);
      resolve({
        success: false,
        message: 'Pythonの起動に失敗しました。\n\nPythonがインストールされているか確認してください。\nエラー: ' + err.message
      });
    });
  });
});

// 弥生販売 売上伝票インポート自動化のIPCハンドラー
ipcMain.handle('run-yayoi-sales-import', async (event) => {
  return new Promise((resolve, reject) => {
    console.log('弥生販売 売上伝票インポート自動化を開始...');

    // Pythonスクリプトを実行（UTF-8エンコーディングを明示的に指定）
    const pythonCommand = os.platform() === 'win32' ? 'python' : 'python3';
    const python = spawn(pythonCommand, ['automation-yayoi-import-sales.py'], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    let result = '';
    let stderrOutput = '';

    python.stdout.on('data', (data) => {
      const output = data.toString('utf8');
      console.log('[Python stdout]:', output);
      result += output;
    });

    python.stderr.on('data', (data) => {
      const output = data.toString('utf8');
      console.error('[Python stderr]:', output);
      stderrOutput += output;
    });

    python.on('close', (code) => {
      console.log(`Python script exited with code ${code}`);

      if (code === 0) {
        try {
          // JSONの最後の行を取得（前の行は標準エラー出力のログ）
          const lines = result.trim().split('\n');
          const jsonLine = lines[lines.length - 1];
          const parsed = JSON.parse(jsonLine);
          console.log('✓ 自動化完了:', parsed.message);
          resolve(parsed);
        } catch (e) {
          console.error('結果のパースに失敗:', e.message);
          console.error('出力内容:', result);
          resolve({
            success: false,
            message: '結果の解析に失敗しました。\n\n標準エラー出力:\n' + stderrOutput
          });
        }
      } else {
        console.error('Python実行エラー（終了コード ' + code + '）');
        resolve({
          success: false,
          message: 'Pythonスクリプトの実行に失敗しました。\n\n標準エラー出力:\n' + stderrOutput
        });
      }
    });

    python.on('error', (err) => {
      console.error('Python起動エラー:', err);
      resolve({
        success: false,
        message: 'Pythonの起動に失敗しました。\n\nPythonがインストールされているか確認してください。\nエラー: ' + err.message
      });
    });
  });
});
