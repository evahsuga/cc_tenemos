// カラーミーショップの要素を確認するためのテストスクリプト
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// ステルスプラグインを追加
puppeteer.use(StealthPlugin());

const ColorMeDownloadAutomation = require('./automation-coloreme-download');

async function testElements() {
  const automation = new ColorMeDownloadAutomation();

  try {
    console.log('=== カラーミーショップ要素確認テスト ===\n');

    // ブラウザを起動
    await automation.initialize();

    // ログインページを開く
    console.log('ログインページを開きます...');
    await automation.page.goto('https://admin.shop-pro.jp/login', {
      waitUntil: 'networkidle2'
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // スクリーンショット保存
    await automation.page.screenshot({
      path: 'test-login-page.png',
      fullPage: true
    });
    console.log('✓ スクリーンショット保存: test-login-page.png');

    // ページ上のフォーム要素を探す
    console.log('\n=== ログインフォームの要素を探しています... ===');

    // input要素を全て取得
    const inputs = await automation.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('input'));
      return elements.map(el => ({
        type: el.type,
        name: el.name,
        id: el.id,
        class: el.className,
        placeholder: el.placeholder
      }));
    });

    console.log('\n見つかったinput要素:');
    inputs.forEach((input, i) => {
      console.log(`${i + 1}. type="${input.type}" name="${input.name}" id="${input.id}" class="${input.class}"`);
    });

    // button要素を全て取得
    const buttons = await automation.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, input[type="submit"]'));
      return elements.map(el => ({
        type: el.type,
        text: el.textContent || el.value,
        id: el.id,
        class: el.className
      }));
    });

    console.log('\n見つかったボタン要素:');
    buttons.forEach((button, i) => {
      console.log(`${i + 1}. text="${button.text}" id="${button.id}" class="${button.class}"`);
    });

    console.log('\n\n=== 次のステップ ===');
    console.log('1. test-login-page.png を確認してください');
    console.log('2. 上記の要素情報から、ログインに必要なセレクタを特定してください');
    console.log('3. パスワードロボの要素も確認してください');
    console.log('\nブラウザは30秒後に自動的に閉じます...');

    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await automation.close();
  }
}

testElements();
