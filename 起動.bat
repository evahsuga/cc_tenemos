@echo off
chcp 65001
echo ╔═══════════════════════════════════════╗
echo ║    業務自動化ランチャー 起動中...     ║
echo ╚═══════════════════════════════════════╝
echo.

echo [1/3] 最新版を取得しています...
git pull
if %errorlevel% neq 0 (
    echo.
    echo ⚠ 更新に失敗しました。ネットワーク接続を確認してください。
    pause
    exit /b 1
)

echo.
echo [2/3] 依存関係を更新しています...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ⚠ 依存関係の更新に失敗しました。
    pause
    exit /b 1
)

echo.
echo [3/3] アプリケーションを起動しています...
echo.
echo ✓ 準備完了！アプリケーションが起動します。
echo.

call npm start
