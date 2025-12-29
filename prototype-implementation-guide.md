# プロトタイプ実装ガイド - Week 1完全マニュアル

**対象者**: VSCode担当者様  
**目標**: 1週間で動作するプロトタイプを完成させる  
**前提知識**: JavaScript基礎、VSCode操作

---

## 📅 Day 1-2: 環境構築と基本UI（4時間）

### Step 1: Node.jsのインストール確認（15分）

```bash
# バージョン確認
node --version
npm --version

# インストールされていない場合
# https://nodejs.org/ からLTS版をダウンロード
```

### Step 2: プロジェクトのセットアップ（30分）

```bash
# プロジェクトフォルダ作成
mkdir automation-launcher
cd automation-launcher

# package.json作成
npm init -y

# Electronインストール
npm install electron --save-dev

# 開発用の便利なツール
npm install electron-reload --save-dev
```

### Step 3: 基本ファイルの作成（2時間）

#### 3-1. package.jsonを編集

```json
{
  "name": "automation-launcher",
  "version": "1.0.0",
  "description": "業務自動化ランチャー",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "dev": "electron . --enable-logging"
  },
  "keywords": ["automation"],
  "author": "Your Name",
  "license": "MIT",
  "devDependencies": {
    "electron": "^28.0.0"
  }
}
```

#### 3-2. main.js（メインプロセス）を作成

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
  
  // 開発時はDevToolsを開く
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// テスト用のIPCハンドラー
ipcMain.handle('test-action', async () => {
  console.log('テストアクション実行！');
  return { success: true, message: 'テスト成功！' };
});
```

#### 3-3. preload.js（プリロードスクリプト）を作成

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  testAction: () => ipcRenderer.invoke('test-action')
});
```

#### 3-4. index.html（UI）を作成

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>業務自動化ランチャー</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .container {
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      min-width: 600px;
    }
    
    h1 {
      color: #667eea;
      margin-bottom: 30px;
      text-align: center;
    }
    
    .button-group {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    button {
      padding: 15px 30px;
      font-size: 16px;
      font-weight: bold;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s;
      color: white;
    }
    
    .btn-coloreme {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    
    .btn-yayoi {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
    
    .btn-test {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    }
    
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    }
    
    button:active {
      transform: translateY(0);
    }
    
    #status {
      margin-top: 20px;
      padding: 15px;
      border-radius: 10px;
      text-align: center;
      display: none;
    }
    
    #status.show {
      display: block;
    }
    
    #status.success {
      background: #d4edda;
      color: #155724;
    }
    
    #status.error {
      background: #f8d7da;
      color: #721c24;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 業務自動化ランチャー</h1>
    
    <div class="button-group">
      <button class="btn-coloreme" onclick="runColorMe()">
        📦 カラーミーショップ自動実行
      </button>
      
      <button class="btn-yayoi" onclick="runYayoi()">
        💼 弥生販売自動実行
      </button>
      
      <button class="btn-test" onclick="testAction()">
        🧪 接続テスト
      </button>
    </div>
    
    <div id="status"></div>
  </div>
  
  <script>
    function showStatus(message, isSuccess = true) {
      const status = document.getElementById('status');
      status.textContent = message;
      status.className = isSuccess ? 'show success' : 'show error';
      
      setTimeout(() => {
        status.classList.remove('show');
      }, 3000);
    }
    
    async function testAction() {
      try {
        const result = await window.api.testAction();
        showStatus(result.message, true);
      } catch (error) {
        showStatus('エラー: ' + error.message, false);
      }
    }
    
    async function runColorMe() {
      showStatus('カラーミーショップ自動化を実行中...', true);
      // Day 3-4で実装
    }
    
    async function runYayoi() {
      showStatus('弥生販売自動化を実行中...', true);
      // Day 5で実装
    }
  </script>
</body>
</html>
```

### Step 4: 起動確認（15分）

```bash
# アプリを起動
npm start

# 「接続テスト」ボタンをクリックして動作確認
```

**✅ Day 1-2のゴール**: Electronアプリが起動し、ボタンが表示される

---

## 📅 Day 3-4: Web自動化（Puppeteer）（8時間）

### Step 1: Puppeteerのインストール（15分）

```bash
npm install puppeteer
```

### Step 2: カラーミーショップの情報収集（1時間）

実際のカラーミーショップ管理画面で以下を確認：

```
1. ログインページURL
   例: https://admin.shop-pro.jp/login

2. ログインフォームの要素
   - ユーザー名入力欄のID/クラス
   - パスワード入力欄のID/クラス
   - ログインボタンのID/クラス

3. 自動化したい操作の画面URL
   例: 受注一覧 https://admin.shop-pro.jp/?mode=order_list

4. 各画面の要素ID
   - 検索欄、ボタンなど
```

**確認方法**:
1. ブラウザで管理画面を開く
2. F12キーで開発者ツールを開く
3. 要素を右クリック → 「検証」
4. IDやクラス名をメモ

### Step 3: Puppeteerスクリプトの作成（4時間）

#### automation-coloreme.js を作成

```javascript
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
```

### Step 4: main.jsへの統合（2時間）

main.jsに以下を追加：

```javascript
const ColorMeAutomation = require('./automation-coloreme');

// カラーミーショップ自動化のIPCハンドラー
ipcMain.handle('run-coloreme', async (event, orderId) => {
  const automation = new ColorMeAutomation();
  
  try {
    // TODO: 実際のログイン情報は設定ファイルから読み込む
    const result = await automation.run(
      'your_username',  // ←実際のユーザー名
      'your_password',  // ←実際のパスワード
      orderId
    );
    
    return result;
    
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
});
```

preload.jsに追加：

```javascript
contextBridge.exposeInMainWorld('api', {
  testAction: () => ipcRenderer.invoke('test-action'),
  runColorMe: (orderId) => ipcRenderer.invoke('run-coloreme', orderId)
});
```

index.htmlのrunColorMe関数を更新：

```javascript
async function runColorMe() {
  const orderId = prompt('受注IDを入力してください:', '12345');
  if (!orderId) return;
  
  showStatus('カラーミーショップ自動化を実行中...', true);
  
  try {
    const result = await window.api.runColorMe(orderId);
    showStatus(result.message, result.success);
  } catch (error) {
    showStatus('エラー: ' + error.message, false);
  }
}
```

### Step 5: テスト実行（30分）

```bash
# アプリを起動
npm start

# 「カラーミーショップ自動実行」ボタンをクリック
# 受注IDを入力してテスト
```

**✅ Day 3-4のゴール**: カラーミーショップが自動で操作される

---

## 📅 Day 5: Windows自動化（pywinauto）（4時間）

### Step 1: Pythonのインストール確認（15分）

```bash
# バージョン確認
python --version

# インストールされていない場合
# https://www.python.org/ からダウンロード
```

### Step 2: pywinautoのインストール（15分）

```bash
pip install pywinauto
```

### Step 3: 弥生販売の情報収集（1時間）

弥生販売を起動して以下を確認：

```
1. ウィンドウタイトル
   例: "弥生販売 - [顧客管理]"

2. ショートカットキー
   例: Ctrl+F で検索画面

3. ダイアログのタイトル
   例: "顧客検索"

4. 入力欄の名前
   例: "顧客コード"
```

**確認方法**:
後述のテストスクリプトで要素を探します

### Step 4: Pythonスクリプトの作成（2時間）

#### automation-yayoi.py を作成

```python
# -*- coding: utf-8 -*-
from pywinauto import Application
import sys
import json
import time

class YayoiAutomation:
    def __init__(self):
        self.app = None
        self.main_window = None
    
    def connect(self):
        """弥生販売に接続"""
        try:
            # 既に起動している弥生販売に接続
            # ※実際のタイトルに変更してください
            self.app = Application(backend="uia").connect(title_re=".*弥生販売.*")
            self.main_window = self.app.window(title_re=".*弥生販売.*")
            return True
        except Exception as e:
            print(f"エラー: 弥生販売が起動していません - {str(e)}", file=sys.stderr)
            return False
    
    def open_search(self):
        """検索画面を開く"""
        print("検索画面を開く...")
        
        # Ctrl+F で検索画面を開く
        self.main_window.type_keys("^f")
        time.sleep(0.5)
    
    def input_customer_code(self, customer_code):
        """顧客コードを入力"""
        print(f"顧客コード {customer_code} を入力...")
        
        # 検索ダイアログを取得
        # ※実際のタイトルに変更してください
        search_dialog = self.app.window(title_re=".*検索.*")
        
        # 顧客コード入力欄に入力
        # ※実際の要素名に変更してください
        search_dialog.child_window(auto_id="customerCodeEdit").set_text(customer_code)
        time.sleep(0.3)
    
    def execute_search(self):
        """検索を実行"""
        print("検索実行...")
        
        search_dialog = self.app.window(title_re=".*検索.*")
        
        # 検索ボタンをクリック
        # ※実際のボタン名に変更してください
        search_dialog.child_window(title="検索").click()
        time.sleep(0.5)
    
    def run(self, customer_code):
        """自動化を実行"""
        start_time = time.time()
        
        try:
            # 弥生販売に接続
            if not self.connect():
                return {
                    'success': False,
                    'message': '弥生販売が起動していません'
                }
            
            # 工程1: 検索画面を開く
            self.open_search()
            
            # 工程2: 顧客コードを入力
            self.input_customer_code(customer_code)
            
            # 工程3: 検索実行
            self.execute_search()
            
            end_time = time.time()
            duration = end_time - start_time
            
            return {
                'success': True,
                'message': f'顧客 {customer_code} を検索しました（{duration:.2f}秒）',
                'duration': duration
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f'エラー: {str(e)}'
            }

if __name__ == '__main__':
    # コマンドライン引数から顧客コードを取得
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'message': '顧客コードが指定されていません'}))
        sys.exit(1)
    
    customer_code = sys.argv[1]
    
    automation = YayoiAutomation()
    result = automation.run(customer_code)
    
    # 結果をJSON形式で出力
    print(json.dumps(result, ensure_ascii=False))
```

### Step 5: Node.jsからPythonを呼び出す（1時間）

main.jsに追加：

```javascript
const { spawn } = require('child_process');

// 弥生販売自動化のIPCハンドラー
ipcMain.handle('run-yayoi', async (event, customerCode) => {
  return new Promise((resolve, reject) => {
    // Pythonスクリプトを実行
    const python = spawn('python', ['automation-yayoi.py', customerCode]);
    
    let result = '';
    let error = '';
    
    python.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        try {
          const parsed = JSON.parse(result);
          resolve(parsed);
        } catch (e) {
          reject(new Error('結果のパースに失敗: ' + result));
        }
      } else {
        reject(new Error('Pythonエラー: ' + error));
      }
    });
  });
});
```

preload.jsに追加：

```javascript
runYayoi: (customerCode) => ipcRenderer.invoke('run-yayoi', customerCode)
```

index.htmlのrunYayoi関数を更新：

```javascript
async function runYayoi() {
  const customerCode = prompt('顧客コードを入力してください:', '12345');
  if (!customerCode) return;
  
  showStatus('弥生販売自動化を実行中...', true);
  
  try {
    const result = await window.api.runYayoi(customerCode);
    showStatus(result.message, result.success);
  } catch (error) {
    showStatus('エラー: ' + error.message, false);
  }
}
```

### Step 6: テスト実行（30分）

```bash
# 弥生販売を起動しておく

# アプリを起動
npm start

# 「弥生販売自動実行」ボタンをクリック
# 顧客コードを入力してテスト
```

**✅ Day 5のゴール**: 弥生販売が自動で操作される

---

## 📅 Day 6-7: 統合テスト（4時間）

### チェックリスト

```
□ Electronアプリが起動する
□ カラーミーショップが自動実行される
□ 弥生販売が自動実行される
□ エラーが適切に表示される
□ 実行時間が目標以内（各2秒以内）
□ 連続3回実行しても安定動作
```

### トラブルシューティング

#### 問題1: Puppeteerがエラー

```bash
# Chromiumが見つからない場合
npm install puppeteer --force

# 環境変数を確認
echo %PUPPETEER_SKIP_CHROMIUM_DOWNLOAD%
```

#### 問題2: pywinautoで要素が見つからない

```python
# 要素を探すテストスクリプト
from pywinauto import Application

app = Application(backend="uia").connect(title_re=".*弥生販売.*")
window = app.window(title_re=".*弥生販売.*")

# すべての要素を表示
window.print_control_identifiers()
```

#### 問題3: Pythonスクリプトが実行されない

```bash
# Pythonのパスを確認
where python

# 絶対パスで実行
const python = spawn('C:\\Python39\\python.exe', ['automation-yayoi.py', customerCode]);
```

---

## 🎉 Week 1完了！

### 成果物チェック

以下が動作すれば成功です：

1. ✅ Electronアプリが起動
2. ✅ カラーミーショップの自動操作
3. ✅ 弥生販売の自動操作
4. ✅ エラーハンドリング
5. ✅ 実行時間の計測

### 次週（Week 2）の準備

- [ ] カラーミーショップの全4工程を整理
- [ ] 弥生販売の全4工程を整理
- [ ] エラーケースのリストアップ

---

## 📞 サポート

困ったときは遠慮なく連絡してください！

- 画面共有でリアルタイムサポート
- コードレビュー
- デバッグ支援

**一緒に頑張りましょう！** 🚀
