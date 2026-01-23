# ショートカット作成スクリプト
# 実行方法: PowerShellで右クリック→「PowerShellで実行」

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$targetPath = Join-Path $scriptDir "起動.bat"
$shortcutPath = Join-Path $scriptDir "業務自動化ランチャー.lnk"
$electronExe = Join-Path $scriptDir "node_modules\electron\dist\electron.exe"

# ショートカット作成
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetPath
$shortcut.WorkingDirectory = $scriptDir
$shortcut.Description = "業務自動化ランチャーを起動します"

# Electronアイコンを設定（存在する場合）
if (Test-Path $electronExe) {
    $shortcut.IconLocation = "$electronExe,0"
    Write-Host "✓ Electronアイコンを設定しました" -ForegroundColor Green
} else {
    Write-Host "⚠ Electronアイコンが見つかりません。デフォルトアイコンを使用します" -ForegroundColor Yellow
}

$shortcut.Save()

Write-Host ""
Write-Host "✓ ショートカットを作成しました: $shortcutPath" -ForegroundColor Green
Write-Host ""
Write-Host "このショートカットをデスクトップにコピーしてご使用ください。" -ForegroundColor Cyan
Write-Host ""

# 完了待ち
Read-Host "Enterキーで終了"
