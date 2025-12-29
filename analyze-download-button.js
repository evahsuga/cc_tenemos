// ダウンロードボタンの詳細構造を解析
const ColorMeExistingBrowserAutomation = require('./automation-coloreme-existing-browser');

async function analyzeButton() {
  const automation = new ColorMeExistingBrowserAutomation();

  try {
    console.log('=== ダウンロードボタン詳細解析 ===\n');

    const connected = await automation.connectToExistingBrowser();
    if (!connected) {
      console.error('❌ Chromeに接続できませんでした');
      process.exit(1);
    }

    console.log('Chromeブラウザでデータダウンロードページを表示し、');
    console.log('青いダウンロードボタンが見える状態にしてください。');
    console.log('準備ができたらEnterキーを押してください...\n');

    await waitForUserInput();

    // #download要素の詳細情報を取得
    console.log('=== #download 要素の詳細 ===\n');

    const downloadInfo = await automation.page.evaluate(() => {
      const el = document.querySelector('#download');
      if (!el) return null;

      return {
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        innerHTML: el.innerHTML.substring(0, 500),
        onclick: el.onclick ? el.onclick.toString() : null,
        outerHTML: el.outerHTML.substring(0, 500),
        parentTagName: el.parentElement ? el.parentElement.tagName : null,
        parentClass: el.parentElement ? el.parentElement.className : null
      };
    });

    if (downloadInfo) {
      console.log('タグ名:', downloadInfo.tagName);
      console.log('ID:', downloadInfo.id);
      console.log('クラス:', downloadInfo.className);
      console.log('親要素:', downloadInfo.parentTagName, downloadInfo.parentClass);
      console.log('\nonclick属性:', downloadInfo.onclick || 'なし');
      console.log('\ninnerHTML:');
      console.log(downloadInfo.innerHTML);
      console.log('\nouterHTML:');
      console.log(downloadInfo.outerHTML);
    }

    // jf_ProductDownloadSubmit関数を探す
    console.log('\n\n=== JavaScript関数の確認 ===\n');

    const functionExists = await automation.page.evaluate(() => {
      return {
        jf_ProductDownloadSubmit: typeof jf_ProductDownloadSubmit !== 'undefined',
        jf_Submit: typeof jf_Submit !== 'undefined'
      };
    });

    console.log('jf_ProductDownloadSubmit関数:', functionExists.jf_ProductDownloadSubmit ? '✓ 存在する' : '❌ 存在しない');
    console.log('jf_Submit関数:', functionExists.jf_Submit ? '✓ 存在する' : '❌ 存在しない');

    // フォームを探す
    console.log('\n\n=== フォーム要素の確認 ===\n');

    const formInfo = await automation.page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form'));
      return forms.map(form => ({
        name: form.name,
        id: form.id,
        action: form.action,
        method: form.method,
        onsubmit: form.onsubmit ? form.onsubmit.toString() : null
      }));
    });

    formInfo.forEach((form, i) => {
      console.log(`フォーム ${i + 1}:`);
      console.log('  name:', form.name || 'なし');
      console.log('  id:', form.id || 'なし');
      console.log('  action:', form.action);
      console.log('  method:', form.method);
      console.log('  onsubmit:', form.onsubmit || 'なし');
      console.log('');
    });

    // 実際に関数を呼び出してみる（テスト）
    console.log('\n=== 解決策の提案 ===\n');

    if (functionExists.jf_ProductDownloadSubmit) {
      console.log('✓ 推奨方法: jf_ProductDownloadSubmit(0) を直接実行');
      console.log('  コード: await automation.page.evaluate(() => jf_ProductDownloadSubmit(0));');
    } else if (formInfo.length > 0) {
      console.log('✓ 推奨方法: フォームをsubmit');
      console.log(`  コード: await automation.page.evaluate(() => document.querySelector('form[name="${formInfo[0].name}"]').submit());`);
    } else {
      console.log('? さらなる調査が必要です');
    }

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

analyzeButton();
