const puppeteer = require('puppeteer');

class ColorMeAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    // ブラウザを起動
    this.browser = await puppeteer.launch({
      headless: false,  // ブラウザを表示する
      defaultViewport: null,
      args: ['--start-maximized']
    });

    this.page = await this.browser.newPage();

    // タイムアウトを設定
    this.page.setDefaultTimeout(10000);
  }

  async login(username, password) {
    console.log('ログイン開始...');

    // ログインページへ移動
    await this.page.goto('https://admin.shop-pro.jp/login');

    // ユーザー名を入力
    // ※実際のセレクタに変更してください
    await this.page.type('#username', username);

    // パスワードを入力
    await this.page.type('#password', password);

    // ログインボタンをクリック
    await this.page.click('#login-button');

    // ページ遷移を待つ
    await this.page.waitForNavigation();

    console.log('ログイン完了！');
  }

  async searchOrder(orderId) {
    console.log(`受注ID ${orderId} を検索...`);

    // 受注一覧へ移動
    await this.page.goto('https://admin.shop-pro.jp/?mode=order_list');

    // 検索欄に入力
    // ※実際のセレクタに変更してください
    await this.page.type('#search-order-id', orderId);

    // 検索ボタンをクリック
    await this.page.click('#search-button');

    // 結果が表示されるまで待つ
    await this.page.waitForSelector('.order-row');

    console.log('検索完了！');
  }

  async openOrderDetail(orderId) {
    console.log('受注詳細を開く...');

    // 受注IDのリンクをクリック
    // ※実際のセレクタに変更してください
    await this.page.click(`#order-${orderId}`);

    // 詳細画面が表示されるまで待つ
    await this.page.waitForSelector('.order-detail');

    console.log('受注詳細を開きました！');
  }

  async run(username, password, orderId) {
    const startTime = Date.now();

    try {
      await this.initialize();

      // 工程1: ログイン
      await this.login(username, password);

      // 工程2-3: 検索
      await this.searchOrder(orderId);

      // 工程4: 詳細表示
      await this.openOrderDetail(orderId);

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      console.log(`完了！所要時間: ${duration}秒`);

      return {
        success: true,
        message: `受注 ${orderId} を開きました（${duration}秒）`,
        duration
      };

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
      await this.browser.close();
    }
  }
}

module.exports = ColorMeAutomation;
