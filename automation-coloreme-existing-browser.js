const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const os = require('os');

puppeteer.use(StealthPlugin());

class ColorMeExistingBrowserAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async connectToExistingBrowser(browserURL = 'http://localhost:9222') {
    console.log('既存のChromeブラウザに接続しています...');

    try {
      // 既存のブラウザに接続
      this.browser = await puppeteer.connect({
        browserURL: browserURL,
        defaultViewport: null
      });

      console.log('✓ ブラウザに接続しました');

      // 既存のページを取得（複数タブがある場合は最初のタブ）
      const pages = await this.browser.pages();

      if (pages.length > 0) {
        this.page = pages[pages.length - 1]; // 最後に開いたタブを使用
        console.log(`✓ タブに接続しました (全${pages.length}タブ)`);
      } else {
        // 新しいタブを開く
        this.page = await this.browser.newPage();
        console.log('✓ 新しいタブを開きました');
      }

      // ダウンロード設定
      const downloadPath = path.join(os.homedir(), 'Downloads');
      const client = await this.page.createCDPSession();
      await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath
      });

      console.log(`✓ ダウンロード先: ${downloadPath}\n`);

      return true;
    } catch (error) {
      console.error('❌ ブラウザへの接続に失敗しました:', error.message);
      console.error('\n以下を確認してください：');
      console.error('1. Chromeがデバッグモードで起動されているか');
      console.error('2. ポート9222が使用されているか');
      return false;
    }
  }

  async navigateToPage(url) {
    console.log(`ページに移動: ${url}`);
    await this.page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async getCurrentPageInfo() {
    const url = this.page.url();
    const title = await this.page.title();

    console.log('\n=== 現在のページ情報 ===');
    console.log(`URL: ${url}`);
    console.log(`タイトル: ${title}`);

    return { url, title };
  }

  async analyzeDownloadPage() {
    console.log('\n=== ダウンロードページを解析中... ===\n');

    // スクリーンショット保存
    await this.page.screenshot({
      path: 'download-page-analysis.png',
      fullPage: true
    });
    console.log('✓ スクリーンショット: download-page-analysis.png\n');

    // ボタン要素を探す
    console.log('--- ボタン要素 ---');
    const buttons = await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn, a.button, [role="button"]'));
      return elements.map((el, index) => ({
        index: index + 1,
        tagName: el.tagName,
        text: (el.textContent || el.value || '').trim().substring(0, 60),
        id: el.id,
        class: el.className,
        name: el.name,
        onclick: el.onclick ? 'あり' : 'なし'
      }));
    });

    buttons.forEach(btn => {
      console.log(`\n${btn.index}. [${btn.tagName}] "${btn.text}"`);
      if (btn.id) console.log(`   id="${btn.id}"`);
      if (btn.class) console.log(`   class="${btn.class}"`);
      if (btn.name) console.log(`   name="${btn.name}"`);
    });

    // セレクトボックスを探す
    console.log('\n\n--- セレクトボックス ---');
    const selects = await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('select'));
      return elements.map((el, index) => {
        const options = Array.from(el.options).map(opt => ({
          value: opt.value,
          text: opt.text
        }));
        return {
          index: index + 1,
          id: el.id,
          name: el.name,
          class: el.className,
          options: options
        };
      });
    });

    selects.forEach(sel => {
      console.log(`\n${sel.index}. セレクトボックス`);
      if (sel.id) console.log(`   id="${sel.id}"`);
      if (sel.name) console.log(`   name="${sel.name}"`);
      if (sel.class) console.log(`   class="${sel.class}"`);
      console.log('   選択肢:');
      sel.options.forEach((opt, i) => {
        console.log(`     - value="${opt.value}" → "${opt.text}"`);
      });
    });

    // チェックボックスを探す
    console.log('\n\n--- チェックボックス ---');
    const checkboxes = await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      return elements.map((el, index) => {
        let label = '';
        if (el.labels && el.labels[0]) {
          label = el.labels[0].textContent.trim();
        } else {
          // ラベルがない場合、親要素のテキストを取得
          const parent = el.parentElement;
          if (parent) {
            label = parent.textContent.trim().substring(0, 50);
          }
        }
        return {
          index: index + 1,
          id: el.id,
          name: el.name,
          class: el.className,
          value: el.value,
          label: label,
          checked: el.checked
        };
      });
    });

    checkboxes.forEach(cb => {
      console.log(`\n${cb.index}. チェックボックス`);
      if (cb.label) console.log(`   ラベル: "${cb.label}"`);
      if (cb.id) console.log(`   id="${cb.id}"`);
      if (cb.name) console.log(`   name="${cb.name}"`);
      if (cb.value) console.log(`   value="${cb.value}"`);
      console.log(`   状態: ${cb.checked ? '✓ チェック済み' : '☐ 未チェック'}`);
    });

    return { buttons, selects, checkboxes };
  }

  async performDownload(options) {
    console.log('\n\n=== ダウンロード実行 ===\n');

    const {
      firstButtonSelector,    // 最初のダウンロードボタン
      dataTypeSelector,       // データ種類のセレクタ
      dataTypeValue,          // 選択する値
      excludeCheckboxes,      // 除外条件チェックボックスの配列
      finalButtonSelector     // 最終ダウンロードボタン
    } = options;

    try {
      // 工程1: 最初のボタンをクリック
      if (firstButtonSelector) {
        console.log('工程1: 最初のダウンロードボタンをクリック...');
        await this.page.click(firstButtonSelector);
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✓ 完了\n');
      }

      // 工程2: データ種類を選択
      if (dataTypeSelector && dataTypeValue) {
        console.log(`工程2: データ種類を選択 (${dataTypeValue})...`);
        await this.page.select(dataTypeSelector, dataTypeValue);
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('✓ 完了\n');
      }

      // 工程3: 除外条件にチェック
      if (excludeCheckboxes && excludeCheckboxes.length > 0) {
        console.log('工程3: 除外条件にチェック...');
        for (const checkbox of excludeCheckboxes) {
          console.log(`  - ${checkbox} にチェック`);
          await this.page.click(checkbox);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        console.log('✓ 完了\n');
      }

      // 工程4: 最終ダウンロードボタンをクリック
      if (finalButtonSelector) {
        console.log('工程4: 最終ダウンロードボタンをクリック...');
        await this.page.click(finalButtonSelector);
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✓ 完了\n');
      }

      console.log('✓✓✓ ダウンロード処理完了！✓✓✓');
      return true;

    } catch (error) {
      console.error('❌ エラー発生:', error.message);

      await this.page.screenshot({
        path: 'error-screenshot.png',
        fullPage: true
      });
      console.log('✓ エラー時スクリーンショット: error-screenshot.png');

      return false;
    }
  }

  async disconnect() {
    if (this.browser) {
      console.log('\nブラウザ接続を解除します（ブラウザは閉じません）');
      await this.browser.disconnect();
    }
  }
}

module.exports = ColorMeExistingBrowserAutomation;
