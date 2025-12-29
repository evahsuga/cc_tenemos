# 業務自動化ランチャー

弥生販売とカラーミーショップの操作を1クリックで自動化するElectronアプリケーション

## プロジェクト構成

```
cc_tenemos/
├── package.json                    # プロジェクト設定とパッケージ定義
├── main.js                         # Electronメインプロセス
├── preload.js                      # Electronプリロードスクリプト
├── index.html                      # アプリケーションUI
├── automation-coloreme.js          # カラーミーショップ自動化スクリプト
├── automation-yayoi.py             # 弥生販売自動化スクリプト (Windows専用)
├── development-plan.md             # 開発計画書
├── vscode-developer-request.md     # 開発依頼書
└── prototype-implementation-guide.md # 実装ガイド
```

## 技術スタック

- **Electron** v28.0.0 - デスクトップアプリケーションフレームワーク
- **Puppeteer** v24.34.0 - Web自動化（カラーミーショップ）
- **pywinauto** - Windows自動化（弥生販売）※Windows専用
- **Node.js** - ランタイム
- **Python 3** - pywinautoスクリプト実行用

## 必要な環境

### 共通
- Node.js (LTS版推奨)
- npm

### カラーミーショップ自動化
- インターネット接続
- カラーミーショップアカウント

### 弥生販売自動化（Windows環境のみ）
- Python 3.x
- pywinauto (`pip install pywinauto`)
- 弥生販売がインストールされていること

## インストール

```bash
# パッケージのインストール
npm install
```

## 使い方

### 1. アプリケーションの起動

```bash
npm start
```

### 2. カラーミーショップ自動化の設定

`main.js`の45-46行目で、ログイン情報を設定してください：

```javascript
const result = await automation.run(
  'your_username',  // ←実際のユーザー名に変更
  'your_password',  // ←実際のパスワードに変更
  orderId
);
```

### 3. カラーミーショップの要素セレクタ調整

`automation-coloreme.js`で、実際のカラーミーショップ管理画面に合わせてセレクタを調整してください：

- ログインフォームの要素（29-35行目）
- 検索フォームの要素（54-58行目）
- 受注詳細リンク（73行目）

### 4. 弥生販売自動化の設定（Windows環境）

Windows環境で`automation-yayoi.py`のセレクタを実際の弥生販売に合わせて調整してください：

- ウィンドウタイトル（18-19行目）
- ダイアログタイトル（37行目）
- 要素のauto_id（42行目）

## 機能

### 接続テスト
Electronの基本的な動作を確認します。

### カラーミーショップ自動実行
1. カラーミーショップ管理画面にログイン
2. 受注IDで検索
3. 受注詳細を開く

### 弥生販売自動実行（Windows専用）
1. 検索画面を開く（Ctrl+F）
2. 顧客コードを入力
3. 検索を実行

## 開発モード

開発者ツールを開いた状態で起動：

```bash
npm run dev
```

## セキュリティに関する注意

- ログイン情報はコードに直接書かず、環境変数や設定ファイルで管理することを推奨します
- 本番環境では、認証情報を暗号化して保存してください

## トラブルシューティング

### Puppeteerがエラーになる場合

```bash
# Puppeteerを再インストール
npm install puppeteer --force
```

### pywinautoで要素が見つからない場合

要素を探すテストスクリプトを実行：

```python
from pywinauto import Application

app = Application(backend="uia").connect(title_re=".*弥生販売.*")
window = app.window(title_re=".*弥生販売.*")

# すべての要素を表示
window.print_control_identifiers()
```

### Pythonスクリプトが実行されない場合

Pythonのパスを確認し、必要に応じて`main.js`の66行目を調整：

```javascript
// Windowsの場合
const python = spawn('python', ['automation-yayoi.py', customerCode]);

// macOS/Linuxの場合
const python = spawn('python3', ['automation-yayoi.py', customerCode]);
```

## 次のステップ

このプロトタイプをベースに、以下の改善を行うことができます：

1. **設定ファイルの追加** - ログイン情報を外部ファイルで管理
2. **エラーハンドリングの強化** - リトライ機能の実装
3. **ログ機能の追加** - 実行履歴の記録
4. **UIの改善** - より直感的なインターフェース
5. **他の業務への展開** - テンプレート化して他の自動化にも利用

## ライセンス

MIT

## サポート

質問や問題がある場合は、プロジェクト管理者までお問い合わせください。
