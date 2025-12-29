// カラーミーショップのダウンロードページ要素を確認するテストスクリプト
const ColorMeDownloadAutomationV2 = require('./automation-coloreme-download-v2');

async function testDownloadPage() {
  const automation = new ColorMeDownloadAutomationV2();

  try {
    console.log('=== カラーミーショップ ダウンロードページ要素確認 ===\n');

    // ブラウザを起動
    await automation.initialize();

    // 手動ログイン待機（60秒）
    console.log('カラーミーショップのログインページを開きます...');
    console.log('手動でログインして、ダウンロードページまで移動してください！\n');

    await automation.page.goto('https://admin.shop-pro.jp/login', {
      waitUntil: 'networkidle2'
    });

    console.log('60秒待機します。この間に：');
    console.log('1. ログインしてください');
    console.log('2. ダウンロードページに移動してください');
    console.log('3. そのまま待機してください\n');

    // 60秒待機
    for (let i = 60; i > 0; i -= 10) {
      console.log(`残り ${i} 秒...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    console.log('\n待機完了！現在のページを解析します...\n');

    // 現在のURLを表示
    const currentUrl = automation.page.url();
    console.log(`現在のURL: ${currentUrl}\n`);

    // スクリーンショット保存
    await automation.page.screenshot({
      path: 'current-page.png',
      fullPage: true
    });
    console.log('✓ スクリーンショット保存: current-page.png\n');

    // ページタイトルを取得
    const title = await automation.page.title();
    console.log(`ページタイトル: ${title}\n`);

    console.log('=== ボタン要素を探しています... ===');
    const buttons = await automation.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn, a.button'));
      return elements.map((el, index) => ({
        index: index + 1,
        tagName: el.tagName,
        type: el.type,
        text: (el.textContent || el.value || '').trim().substring(0, 50),
        id: el.id,
        class: el.className,
        name: el.name
      }));
    });

    console.log(`見つかったボタン要素: ${buttons.length}個\n`);
    buttons.forEach(btn => {
      console.log(`${btn.index}. [${btn.tagName}] "${btn.text}"`);
      if (btn.id) console.log(`   id="${btn.id}"`);
      if (btn.class) console.log(`   class="${btn.class}"`);
      if (btn.name) console.log(`   name="${btn.name}"`);
      console.log('');
    });

    console.log('\n=== セレクト（プルダウン）要素を探しています... ===');
    const selects = await automation.page.evaluate(() => {
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

    console.log(`見つかったセレクト要素: ${selects.length}個\n`);
    selects.forEach(sel => {
      console.log(`${sel.index}. セレクトボックス`);
      if (sel.id) console.log(`   id="${sel.id}"`);
      if (sel.name) console.log(`   name="${sel.name}"`);
      if (sel.class) console.log(`   class="${sel.class}"`);
      console.log('   選択肢:');
      sel.options.forEach((opt, i) => {
        console.log(`     ${i + 1}. value="${opt.value}" text="${opt.text}"`);
      });
      console.log('');
    });

    console.log('\n=== チェックボックス要素を探しています... ===');
    const checkboxes = await automation.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      return elements.map((el, index) => {
        const label = el.labels && el.labels[0] ? el.labels[0].textContent.trim() : '';
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

    console.log(`見つかったチェックボックス: ${checkboxes.length}個\n`);
    checkboxes.forEach(cb => {
      console.log(`${cb.index}. チェックボックス`);
      if (cb.label) console.log(`   ラベル: "${cb.label}"`);
      if (cb.id) console.log(`   id="${cb.id}"`);
      if (cb.name) console.log(`   name="${cb.name}"`);
      if (cb.value) console.log(`   value="${cb.value}"`);
      console.log(`   チェック状態: ${cb.checked ? 'チェック済み' : '未チェック'}`);
      console.log('');
    });

    console.log('\n=== 次のステップ ===');
    console.log('1. current-page.png を確認してください');
    console.log('2. 上記の要素情報から、ダウンロードに必要なセレクタを特定してください');
    console.log('3. 以下の情報を教えてください：');
    console.log('   - 最初のダウンロードボタンのセレクタ');
    console.log('   - データ種類選択のセレクタと選びたい値');
    console.log('   - 除外条件チェックボックスのセレクタ');
    console.log('   - 最終ダウンロードボタンのセレクタ');
    console.log('\nブラウザは30秒後に自動的に閉じます...');

    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await automation.close();
  }
}

testDownloadPage();
