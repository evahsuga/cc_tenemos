// カラーミーショップ 受注一括データ 完全自動ダウンロード
const ColorMeExistingBrowserAutomation = require('./automation-coloreme-existing-browser');

async function autoDownload() {
  const automation = new ColorMeExistingBrowserAutomation();

  try {
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║  カラーミーショップ 受注一括データ 自動ダウンロード  ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    // 既存のChromeに接続
    const connected = await automation.connectToExistingBrowser();

    if (!connected) {
      console.error('\n❌ Chromeに接続できませんでした');
      console.error('\n【解決方法】');
      console.error('別のターミナルで以下を実行してください：');
      console.error('  node start-chrome-debug.js\n');
      process.exit(1);
    }

    // 現在のページ情報
    await automation.getCurrentPageInfo();

    console.log('\n【準備確認】');
    console.log('✓ カラーミーショップにログイン済みですか？');
    console.log('✓ メニューページ (https://admin.shop-pro.jp/?mode=menu) にいますか？');
    console.log('\n準備ができたらEnterキーを押してください...\n');

    await waitForUserInput();

    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║     自動ダウンロード開始！           ║');
    console.log('╚═══════════════════════════════════════╝\n');

    // 工程1: メニューページに移動
    const currentUrl = automation.page.url();
    if (!currentUrl.includes('mode=menu')) {
      console.log('[工程1] メニューページに移動中...');
      await automation.navigateToPage('https://admin.shop-pro.jp/?mode=menu');
      console.log('✓ 完了\n');
    }

    // 工程2: 最初のダウンロードボタンをクリック（データダウンロードページへ移動）
    console.log('[工程2] ダウンロードページへ移動...');
    await automation.page.click('a[href*="mode=data_download"]');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✓ 完了\n');

    // 現在のURLを確認
    const downloadPageUrl = automation.page.url();
    console.log(`現在のURL: ${downloadPageUrl}\n`);

    // スクリーンショット保存
    await automation.page.screenshot({
      path: 'step2-download-page.png',
      fullPage: true
    });
    console.log('✓ スクリーンショット: step2-download-page.png\n');

    // 工程3: データ種類を選択
    console.log('[工程3] データ種類を選択 (受注一括データ)...');
    await automation.page.select('select[name="data_type"]', '9');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✓ 完了\n');

    // 工程4: 除外条件にチェック
    console.log('[工程4] 除外条件にチェック...');

    // チェックボックスの状態を確認してからクリック
    const checkbox1Checked = await automation.page.$eval('#except_shipped', el => el.checked);
    if (!checkbox1Checked) {
      console.log('  - 「発送済・受注キャンセル済のものを除く」にチェック');
      await automation.page.click('#except_shipped');
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      console.log('  - 「発送済・受注キャンセル済のものを除く」は既にチェック済み');
    }

    const checkbox2Checked = await automation.page.$eval('#sales_all_except_shipped', el => el.checked);
    if (!checkbox2Checked) {
      console.log('  - 「売上データ用：発送済・受注キャンセル済のものを除く」にチェック');
      await automation.page.click('#sales_all_except_shipped');
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      console.log('  - 「売上データ用：発送済・受注キャンセル済のものを除く」は既にチェック済み');
    }

    console.log('✓ 完了\n');

    // 最終確認のスクリーンショット
    await automation.page.screenshot({
      path: 'step4-before-download.png',
      fullPage: true
    });
    console.log('✓ スクリーンショット: step4-before-download.png\n');

    // 工程5: ダウンロード実行（JavaScript関数を直接呼び出し）
    console.log('[工程5] ダウンロード実行...');

    // jf_ProductDownloadSubmit(0) 関数を直接実行
    await automation.page.evaluate(() => {
      if (typeof jf_ProductDownloadSubmit !== 'undefined') {
        jf_ProductDownloadSubmit(0);
      } else {
        throw new Error('jf_ProductDownloadSubmit関数が見つかりません');
      }
    });

    console.log('✓ ダウンロード関数を実行しました\n');

    // ダウンロード完了を待つ
    console.log('ダウンロード完了を待っています（5秒）...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║     ✓✓✓ 完了！✓✓✓                   ║');
    console.log('╚═══════════════════════════════════════╝\n');

    console.log('【結果確認】');
    console.log('✓ ダウンロードフォルダを確認してください');
    console.log('✓ CSVファイルがダウンロードされているはずです\n');

    console.log('【保存されたスクリーンショット】');
    console.log('  - step2-download-page.png');
    console.log('  - step4-before-download.png\n');

    console.log('10秒後にブラウザ接続を解除します（ブラウザは閉じません）...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    console.error('\n詳細:', error);

    // エラー時もスクリーンショットを保存
    try {
      await automation.page.screenshot({
        path: 'error-final.png',
        fullPage: true
      });
      console.log('\n✓ エラー時スクリーンショット: error-final.png');
    } catch (e) {
      // スクリーンショット保存失敗は無視
    }

  } finally {
    await automation.disconnect();
    console.log('\n処理を終了しました');
  }
}

function waitForUserInput() {
  return new Promise((resolve) => {
    process.stdin.once('data', () => {
      resolve();
    });
  });
}

// 実行
autoDownload();
