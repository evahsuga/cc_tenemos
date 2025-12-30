#!/bin/bash

echo "╔═══════════════════════════════════════╗"
echo "║    業務自動化ランチャー 起動中...     ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# スクリプトのディレクトリに移動
cd "$(dirname "$0")"

echo "[1/3] 最新版を取得しています..."
git pull
if [ $? -ne 0 ]; then
    echo ""
    echo "⚠ 更新に失敗しました。ネットワーク接続を確認してください。"
    read -p "Enterキーを押して終了..."
    exit 1
fi

echo ""
echo "[2/3] 依存関係を更新しています..."
npm install
if [ $? -ne 0 ]; then
    echo ""
    echo "⚠ 依存関係の更新に失敗しました。"
    read -p "Enterキーを押して終了..."
    exit 1
fi

echo ""
echo "[3/3] アプリケーションを起動しています..."
echo ""
echo "✓ 準備完了！アプリケーションが起動します。"
echo ""

npm start
