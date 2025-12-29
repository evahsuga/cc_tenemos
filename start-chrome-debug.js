// Chromeをデバッグモードで起動するヘルパースクリプト
const { spawn } = require('child_process');
const os = require('os');

function startChromeDebug() {
  console.log('=== Chromeをデバッグモードで起動 ===\n');

  let chromePath;
  let args;

  const platform = os.platform();

  if (platform === 'darwin') {
    // macOS
    chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    args = [
      '--remote-debugging-port=9222',
      '--user-data-dir=/tmp/chrome-debug',
      '--no-first-run',
      '--no-default-browser-check'
    ];
  } else if (platform === 'win32') {
    // Windows
    chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    args = [
      '--remote-debugging-port=9222',
      '--user-data-dir=C:\\temp\\chrome-debug',
      '--no-first-run',
      '--no-default-browser-check'
    ];
  } else {
    // Linux
    chromePath = 'google-chrome';
    args = [
      '--remote-debugging-port=9222',
      '--user-data-dir=/tmp/chrome-debug',
      '--no-first-run',
      '--no-default-browser-check'
    ];
  }

  console.log(`Chromeを起動: ${chromePath}`);
  console.log(`ポート: 9222`);
  console.log('');

  try {
    const chrome = spawn(chromePath, args, {
      detached: true,
      stdio: 'ignore'
    });

    chrome.unref();

    console.log('✓ Chromeがデバッグモードで起動しました！');
    console.log('');
    console.log('次のステップ：');
    console.log('1. 開いたChromeでカラーミーショップにログイン');
    console.log('2. ダウンロードページに移動');
    console.log('3. 別のターミナルで以下を実行：');
    console.log('   node test-existing-browser.js');
    console.log('');
    console.log('注意: このChromeウィンドウを閉じないでください！');

  } catch (error) {
    console.error('❌ Chromeの起動に失敗しました:', error.message);
    console.error('');
    console.error('手動で起動する場合、以下のコマンドを実行してください：');
    console.error('');

    if (platform === 'darwin') {
      console.error('/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"');
    } else if (platform === 'win32') {
      console.error('"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\\temp\\chrome-debug"');
    }
  }
}

startChromeDebug();
