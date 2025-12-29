// 既存のChromeブラウザに接続してダウンロードページを解析するテスト
const ColorMeExistingBrowserAutomation = require('./automation-coloreme-existing-browser');

async function test() {
  const automation = new ColorMeExistingBrowserAutomation();

  try {
    console.log('=== カラーミーショップ ダウンロードページ解析 ===\n');

    // 既存のChromeに接続
    const connected = await automation.connectToExistingBrowser();

    if (!connected) {
      console.error('\n❌ Chromeに接続できませんでした');
      console.error('\n以下の手順でChromeを起動してください：\n');
      console.error('【macOS】');
      console.error('/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"\n');
      console.error('または、別のターミナルで以下のコマンドを実行：');
      console.error('node start-chrome-debug.js\n');
      process.exit(1);
    }

    // 現在のページ情報を取得
    await automation.getCurrentPageInfo();

    console.log('\n--- 指示 ---');
    console.log('現在開いているChromeブラウザで、手動で以下を行ってください：');
    console.log('1. カラーミーショップにログイン（まだの場合）');
    console.log('2. ダウンロードページに移動');
    console.log('3. このターミナルに戻ってEnterキーを押す\n');

    // ユーザーの入力を待つ
    await waitForUserInput();

    // ページを解析
    await automation.analyzeDownloadPage();

    console.log('\n\n=== 解析完了 ===');
    console.log('スクリーンショット download-page-analysis.png を確認してください');
    console.log('\n次に必要な情報：');
    console.log('1. 最初のダウンロードボタンは何番ですか？');
    console.log('2. データ種類のセレクトボックスは何番で、どの値を選びますか？');
    console.log('3. 除外条件のチェックボックスは何番ですか？（複数可）');
    console.log('4. 最終ダウンロードボタンは何番ですか？');

    console.log('\n30秒後にブラウザ接続を解除します（ブラウザは閉じません）...');
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await automation.disconnect();
  }
}

function waitForUserInput() {
  return new Promise((resolve) => {
    process.stdin.once('data', () => {
      resolve();
    });
  });
}

test();
