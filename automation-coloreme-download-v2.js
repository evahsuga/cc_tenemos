const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const os = require('os');

// ステルスプラグインを追加
puppeteer.use(StealthPlugin());

class ColorMeDownloadAutomationV2 {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    // ダウンロードフォルダのパス
    const downloadPath = path.join(os.homedir(), 'Downloads');

    // ブラウザを起動
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    this.page = await this.browser.newPage();

    // ダウンロード設定
    const client = await this.page.createCDPSession();
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: downloadPath
    });

    // タイムアウトを設定
    this.page.setDefaultTimeout(30000);

    console.log('ダウンロード先:', downloadPath);
  }

  async waitForManualLogin(loginUrl, waitTimeSeconds = 60) {
    console.log('\n=== 手動ログイン待機モード ===');
    console.log(`1. ブラウザでカラーミーショップのログインページを開きます`);
    console.log(`2. ${waitTimeSeconds}秒以内に手動でログインしてください`);
    console.log(`3. ログイン後、ダウンロードページに移動してください`);
    console.log('=====================================\n');

    // ログインページを開く
    await this.page.goto(loginUrl, {
      waitUntil: 'networkidle2'
    });

    console.log(`ログインページを開きました: ${loginUrl}`);
    console.log(`手動でログインしてください...（残り${waitTimeSeconds}秒）`);

    // カウントダウン表示
    for (let i = waitTimeSeconds; i > 0; i -= 10) {
      if (i !== waitTimeSeconds) {
        console.log(`残り ${i} 秒...`);
      }
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    console.log('手動ログイン待機完了！');

    // 現在のURLを確認
    const currentUrl = this.page.url();
    console.log(`現在のURL: ${currentUrl}`);

    return currentUrl;
  }

  async navigateToDownloadPage(downloadPageUrl) {
    console.log('\nダウンロードページへ移動...');

    // 既にダウンロードページにいる場合はスキップ
    const currentUrl = this.page.url();
    if (currentUrl === downloadPageUrl) {
      console.log('既にダウンロードページにいます');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      // ダウンロードページへ移動
      await this.page.goto(downloadPageUrl, {
        waitUntil: 'networkidle2'
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // スクリーンショット撮影
    await this.page.screenshot({
      path: 'download-page.png',
      fullPage: true
    });
    console.log('✓ スクリーンショット保存: download-page.png');
  }

  async performDownload(options = {}) {
    console.log('\n=== ダウンロード処理開始 ===');

    const {
      dataTypeSelector,      // データ種類のセレクタ
      dataTypeValue,         // データ種類の値
      excludeConditions,     // 除外条件のセレクタ配列
      firstDownloadButton,   // 最初のダウンロードボタン
      finalDownloadButton    // 最終ダウンロードボタン
    } = options;

    try {
      // 工程1: 最初のダウンロードボタンをクリック
      if (firstDownloadButton) {
        console.log('工程1: 最初のダウンロードボタンをクリック...');
        await this.page.click(firstDownloadButton);
        await new Promise(resolve => setTimeout(resolve, 2000));

        await this.page.screenshot({
          path: 'step1-after-first-button.png',
          fullPage: true
        });
        console.log('✓ スクリーンショット保存: step1-after-first-button.png');
      }

      // 工程2: データの種類を選択
      if (dataTypeSelector && dataTypeValue) {
        console.log(`工程2: データの種類を選択 (${dataTypeValue})...`);
        await this.page.select(dataTypeSelector, dataTypeValue);
        await new Promise(resolve => setTimeout(resolve, 1000));

        await this.page.screenshot({
          path: 'step2-after-data-type.png',
          fullPage: true
        });
        console.log('✓ スクリーンショット保存: step2-after-data-type.png');
      }

      // 工程3: 除外条件にチェックを入れる
      if (excludeConditions && excludeConditions.length > 0) {
        console.log('工程3: 除外条件にチェックを入れる...');
        for (const condition of excludeConditions) {
          console.log(`  ✓ チェック: ${condition}`);
          await this.page.click(condition);
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        await this.page.screenshot({
          path: 'step3-after-conditions.png',
          fullPage: true
        });
        console.log('✓ スクリーンショット保存: step3-after-conditions.png');
      }

      // 工程4: 最終的なダウンロードボタンをクリック
      if (finalDownloadButton) {
        console.log('工程4: 最終ダウンロードボタンをクリック...');

        await this.page.screenshot({
          path: 'step4-before-final-download.png',
          fullPage: true
        });
        console.log('✓ スクリーンショット保存: step4-before-final-download.png');

        await this.page.click(finalDownloadButton);

        // ダウンロード完了を待つ
        console.log('ダウンロード完了を待っています...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      console.log('\n✓ ダウンロード処理完了！');
      return true;

    } catch (error) {
      console.error('エラー:', error);

      // エラー時もスクリーンショットを保存
      await this.page.screenshot({
        path: 'error-screenshot.png',
        fullPage: true
      });
      console.log('✓ エラー時スクリーンショット保存: error-screenshot.png');

      return false;
    }
  }

  async run(loginUrl, downloadPageUrl, downloadOptions) {
    const startTime = Date.now();

    try {
      // 初期化
      await this.initialize();

      // 手動ログイン待機
      await this.waitForManualLogin(loginUrl, 60);

      // ダウンロードページへ移動
      await this.navigateToDownloadPage(downloadPageUrl);

      // ダウンロード実行
      const success = await this.performDownload(downloadOptions);

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      if (success) {
        console.log(`\n完了！所要時間: ${duration}秒`);
        return {
          success: true,
          message: `データをダウンロードしました（${duration}秒）`,
          duration
        };
      } else {
        return {
          success: false,
          message: 'ダウンロード処理でエラーが発生しました'
        };
      }

    } catch (error) {
      console.error('エラー:', error);
      return {
        success: false,
        message: 'エラーが発生しました: ' + error.message
      };
    }
  }

  async close() {
    if (this.browser) {
      console.log('\nブラウザを閉じます...');
      await this.browser.close();
    }
  }
}

module.exports = ColorMeDownloadAutomationV2;
