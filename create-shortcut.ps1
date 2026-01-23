# Create Shortcut Script
# Run: Right-click -> Run with PowerShell

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$targetPath = Join-Path $scriptDir "起動.bat"
$shortcutPath = Join-Path $scriptDir "Launcher.lnk"
$electronExe = Join-Path $scriptDir "node_modules\electron\dist\electron.exe"

# Create shortcut
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetPath
$shortcut.WorkingDirectory = $scriptDir
$shortcut.Description = "Business Automation Launcher"

# Set Electron icon if exists
if (Test-Path $electronExe) {
    $shortcut.IconLocation = $electronExe + ",0"
    Write-Host "OK: Electron icon set" -ForegroundColor Green
} else {
    Write-Host "Warning: Electron icon not found" -ForegroundColor Yellow
}

$shortcut.Save()

Write-Host ""
Write-Host "OK: Shortcut created: $shortcutPath" -ForegroundColor Green
Write-Host ""
Write-Host "Copy this shortcut to your Desktop." -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to exit"
