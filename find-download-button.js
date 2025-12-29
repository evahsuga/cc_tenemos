// ダウンロードボタンを見つけるテストスクリプト
const ColorMeExistingBrowserAutomation = require('./automation-coloreme-existing-browser');

async function findDownloadButton() {
  const automation = new ColorMeExistingBrowserAutomation();

  try {
    console.log('=== ダウンロードボタン検索 ===\n');

    // 既存のChromeに接続
    const connected = await automation.connectToExistingBrowser();

    if (!connected) {
      console.error('\n❌ Chromeに接続できませんでした');
      process.exit(1);
    }

    console.log('--- 指示 ---');
    console.log('Chromeブラウザでダウンロードページを表示し、');
    console.log('青いダウンロードボタンが見える状態にしてください。');
    console.log('準備ができたらEnterキーを押してください...\n');

    // ユーザーの入力を待つ
    await waitForUserInput();

    console.log('\nページを下までスクロールします...');
    // ページを下までスクロール
    await automation.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n「ダウンロード」という文字を含む要素を探しています...\n');

    // すべてのクリック可能な要素から「ダウンロード」を含むものを探す
    const downloadElements = await automation.page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      const results = [];

      allElements.forEach((el, index) => {
        const text = (el.textContent || '').trim();
        const tagName = el.tagName.toLowerCase();

        // 「ダウンロード」という文字を含む要素
        if (text.includes('ダウンロード') && text.length < 100) {
          // セレクタを生成
          let selector = tagName;
          if (el.id) {
            selector = `#${el.id}`;
          } else if (el.className) {
            const classes = el.className.split(' ').filter(c => c).join('.');
            if (classes) {
              selector = `${tagName}.${classes}`;
            }
          }

          // name属性も取得
          const name = el.getAttribute('name') || '';
          const type = el.getAttribute('type') || '';
          const value = el.getAttribute('value') || '';

          results.push({
            index: results.length + 1,
            tagName: tagName.toUpperCase(),
            text: text,
            id: el.id,
            class: el.className,
            name: name,
            type: type,
            value: value,
            selector: selector
          });
        }
      });

      return results;
    });

    console.log(`見つかった「ダウンロード」要素: ${downloadElements.length}個\n`);

    downloadElements.forEach(el => {
      console.log(`${el.index}. [${el.tagName}] "${el.text}"`);
      console.log(`   推奨セレクタ: ${el.selector}`);
      if (el.id) console.log(`   id="${el.id}"`);
      if (el.name) console.log(`   name="${el.name}"`);
      if (el.type) console.log(`   type="${el.type}"`);
      if (el.value) console.log(`   value="${el.value}"`);
      console.log('');
    });

    // 特にinput[type="submit"]とbuttonを探す
    console.log('\n--- Submit/Button要素を再確認 ---\n');
    const submitButtons = await automation.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('input[type="submit"], button[type="submit"], button'));
      return buttons.map((el, index) => {
        const text = (el.textContent || el.value || '').trim();

        let selector = el.tagName.toLowerCase();
        if (el.id) {
          selector = `#${el.id}`;
        } else if (el.name) {
          selector = `${el.tagName.toLowerCase()}[name="${el.name}"]`;
        } else if (el.className) {
          const classes = el.className.split(' ').filter(c => c).join('.');
          if (classes) {
            selector = `${el.tagName.toLowerCase()}.${classes}`;
          }
        }

        return {
          index: index + 1,
          tagName: el.tagName,
          text: text,
          id: el.id,
          name: el.name,
          class: el.className,
          type: el.type,
          value: el.value,
          selector: selector
        };
      });
    });

    submitButtons.forEach(btn => {
      if (btn.text.includes('ダウンロード') || btn.value?.includes('ダウンロード')) {
        console.log(`✓✓✓ ${btn.index}. [${btn.tagName}] "${btn.text || btn.value}" ✓✓✓`);
        console.log(`   ★推奨セレクタ: ${btn.selector}`);
        if (btn.id) console.log(`   id="${btn.id}"`);
        if (btn.name) console.log(`   name="${btn.name}"`);
        if (btn.type) console.log(`   type="${btn.type}"`);
        console.log('');
      }
    });

    // スクリーンショット保存
    await automation.page.screenshot({
      path: 'download-button-page.png',
      fullPage: true
    });
    console.log('✓ スクリーンショット: download-button-page.png');

    console.log('\n=== 完了 ===');
    console.log('上記の情報から、青いダウンロードボタンの「推奨セレクタ」を教えてください。');
    console.log('例: button[name="download"] や #download-btn など');

    console.log('\n30秒後に接続を解除します...');
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

findDownloadButton();
