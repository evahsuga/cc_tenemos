const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const os = require('os');

// ステルスプラグインを追加
puppeteer.use(StealthPlugin());

class ColorMeDownloadAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    // ダウンロードフォルダのパス
    const downloadPath = path.join(os.homedir(), 'Downloads');

    // ブラウザを起動（ステルスプラグインが自動的に設定を調整）
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

  async login(username, password) {
    console.log('ログイン開始...');

    // ログインページへ移動
    await this.page.goto('https://admin.shop-pro.jp/login', {
      waitUntil: 'networkidle2'
    });

    // 3秒待機（ページの読み込みを確認）
    await new Promise(resolve => setTimeout(resolve, 3000));

    // ここで画面のスクリーンショットを撮って要素を確認
    await this.page.screenshot({
      path: 'login-page.png',
      fullPage: true
    });
    console.log('ログインページのスクリーンショットを保存しました: login-page.png');

    // TODO: 実際の要素に合わせて調整してください
    // ユーザー名を入力（セレクタは仮）
    await this.page.type('input[name="login_id"]', username);

    // パスワードを入力（セレクタは仮）
    await this.page.type('input[name="passwd"]', password);

    // パスワードロボの選択肢を確認するため、スクリーンショット撮影
    await this.page.screenshot({
      path: 'before-login.png',
      fullPage: true
    });
    console.log('ログイン前のスクリーンショットを保存しました: before-login.png');

    // TODO: パスワードロボの対応
    // 実際の画面を見てから実装します
    console.log('パスワードロボの選択が必要な場合は、ここで30秒待機します...');
    console.log('手動で選択してください！');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // ログインボタンをクリック（セレクタは仮）
    // await this.page.click('button[type="submit"]');

    // ページ遷移を待つ
    // await this.page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log('ログイン完了！');
  }

  async navigateToDownloadPage(downloadPageUrl) {
    console.log('ダウンロードページへ移動...');

    // ダウンロードページへ移動
    await this.page.goto(downloadPageUrl, {
      waitUntil: 'networkidle2'
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // スクリーンショット撮影
    await this.page.screenshot({
      path: 'download-page.png',
      fullPage: true
    });
    console.log('ダウンロードページのスクリーンショットを保存しました: download-page.png');
  }

  async performDownload(dataType, excludeConditions) {
    console.log('ダウンロード処理開始...');

    // TODO: 実際の要素に合わせて調整

    // 工程1: ダウンロードボタンをクリック
    console.log('ダウンロードボタンをクリック...');
    // await this.page.click('#download-button'); // セレクタは仮

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 工程2: データの種類を選択
    console.log(`データの種類を選択: ${dataType}`);
    // await this.page.select('#data-type-select', dataType); // セレクタは仮

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 工程3: 除外条件にチェックを入れる
    console.log('除外条件にチェックを入れる...');
    for (const condition of excludeConditions) {
      console.log(`  - ${condition} にチェック`);
      // await this.page.click(`input[name="${condition}"]`); // セレクタは仮
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // スクリーンショット（ダウンロード前の最終確認）
    await this.page.screenshot({
      path: 'before-final-download.png',
      fullPage: true
    });
    console.log('最終ダウンロード前のスクリーンショットを保存しました: before-final-download.png');

    // 工程4: 最終的なダウンロードボタンをクリック
    console.log('最終ダウンロードボタンをクリック...');
    // await this.page.click('#final-download-button'); // セレクタは仮

    // ダウンロード完了を待つ
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('ダウンロード完了！');
  }

  async run(username, password, downloadPageUrl, dataType, excludeConditions) {
    const startTime = Date.now();

    try {
      await this.initialize();

      // 工程1: ログイン
      await this.login(username, password);

      // 工程2: ダウンロードページへ移動
      await this.navigateToDownloadPage(downloadPageUrl);

      // 工程3: ダウンロード実行
      await this.performDownload(dataType, excludeConditions);

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      console.log(`完了！所要時間: ${duration}秒`);

      return {
        success: true,
        message: `データをダウンロードしました（${duration}秒）`,
        duration
      };

    } catch (error) {
      console.error('エラー:', error);

      // エラー時もスクリーンショットを保存
      try {
        await this.page.screenshot({
          path: 'error-screenshot.png',
          fullPage: true
        });
        console.log('エラー時のスクリーンショットを保存しました: error-screenshot.png');
      } catch (e) {
        // スクリーンショット保存失敗は無視
      }

      return {
        success: false,
        message: 'エラーが発生しました: ' + error.message
      };
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = ColorMeDownloadAutomation;
