// メニューページの最初のダウンロードボタンを見つけるスクリプト
const ColorMeExistingBrowserAutomation = require('./automation-coloreme-existing-browser');

async function findFirstButton() {
  const automation = new ColorMeExistingBrowserAutomation();

  try {
    console.log('=== 最初のダウンロードボタンを検索 ===\n');

    const connected = await automation.connectToExistingBrowser();

    if (!connected) {
      console.error('\n❌ Chromeに接続できませんでした');
      process.exit(1);
    }

    console.log('--- 指示 ---');
    console.log('Chromeブラウザで以下を確認してください：');
    console.log('1. カラーミーショップのメニューページ (https://admin.shop-pro.jp/?mode=menu) を表示');
    console.log('2. 最初の「ダウンロード」ボタンが見える状態にしてください');
    console.log('3. 準備ができたらEnterキーを押してください\n');

    await waitForUserInput();

    console.log('\nページを解析中...\n');

    // 「ダウンロード」セクション内のリンクやボタンを探す
    const downloadLinks = await automation.page.evaluate(() => {
      const results = [];

      // すべてのaタグとbuttonタグを取得
      const links = Array.from(document.querySelectorAll('a, button'));

      links.forEach((el, index) => {
        const text = (el.textContent || '').trim();
        const href = el.href || '';

        // 「ダウンロード」という文字を含む、または特定のmodeを含むもの
        if (text.includes('ダウンロード') || href.includes('mode=data_download')) {
          let selector = el.tagName.toLowerCase();

          if (el.id) {
            selector = `#${el.id}`;
          } else if (el.className) {
            const classes = el.className.split(' ').filter(c => c && !c.includes('--')).slice(0, 2).join('.');
            if (classes) {
              selector = `${el.tagName.toLowerCase()}.${classes}`;
            }
          }

          // href属性がある場合
          if (href && href.includes('mode=')) {
            const url = new URL(href);
            const mode = url.searchParams.get('mode');
            if (mode) {
              selector = `a[href*="mode=${mode}"]`;
            }
          }

          results.push({
            index: results.length + 1,
            tagName: el.tagName,
            text: text.substring(0, 60),
            href: href,
            id: el.id,
            class: el.className,
            selector: selector
          });
        }
      });

      return results;
    });

    console.log('=== 見つかった「ダウンロード」関連要素 ===\n');

    downloadLinks.forEach(link => {
      console.log(`${link.index}. [${link.tagName}] "${link.text}"`);
      console.log(`   ★推奨セレクタ: ${link.selector}`);
      if (link.id) console.log(`   id="${link.id}"`);
      if (link.href) console.log(`   href="${link.href}"`);
      console.log('');
    });

    // 特にmode=data_downloadを含むリンクを強調表示
    console.log('\n=== データダウンロードページへのリンク ===\n');
    const dataDownloadLinks = downloadLinks.filter(l => l.href && l.href.includes('mode=data_download'));

    if (dataDownloadLinks.length > 0) {
      dataDownloadLinks.forEach(link => {
        console.log(`✓✓✓ [${link.tagName}] "${link.text}"`);
        console.log(`   ★★★ これを使用: ${link.selector}`);
        console.log(`   URL: ${link.href}\n`);
      });
    }

    // スクリーンショット保存
    await automation.page.screenshot({
      path: 'menu-page.png',
      fullPage: true
    });
    console.log('✓ スクリーンショット: menu-page.png');

    console.log('\n=== 完了 ===');
    console.log('上記から最初に押すべきダウンロードボタンのセレクタを確認してください。');

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

findFirstButton();
