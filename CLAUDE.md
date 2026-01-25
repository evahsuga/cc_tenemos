# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**業務自動化ランチャー (Business Automation Launcher)** - An Electron desktop application that automates workflows between ColorMe Shop (カラーミーショップ) e-commerce platform and Yayoi Sales (弥生販売) accounting software.

**Current Version**: v2.2 (2026-01-23)

**Key Goal**: Replace slow RPA solutions with a fast, custom desktop app (30x speed improvement, ~¥300,000 annual savings).

## Quick Reference

```bash
# Development
npm install          # Install dependencies
npm start            # Start app
npm run dev          # Start with debug logging

# Build
npm run build        # Current platform
npm run build:mac    # macOS
npm run build:win    # Windows

# Test automation scripts directly
node automation-coloreme-existing-browser.js    # ColorMe (all platforms)
python automation-yayoi-export-customer.py      # Yayoi export (Windows only)
python automation-yayoi-import-customer.py      # Yayoi import (Windows only)
python automation-yayoi-import-sales.py         # Yayoi sales (Windows only)

# Production launch (includes auto-update via git pull)
./起動.command       # macOS
起動.bat             # Windows
```

## Technology Stack

- **Electron v40.0.0** with Puppeteer v24.34.0 + puppeteer-extra-plugin-stealth
- **pywinauto** (Python) for Windows UI automation
- **Vanilla HTML/CSS/JS** for UI
- **Git-based auto-update** via launcher scripts

## Architecture

```
Electron Main Process (main.js)
    ↓ IPC
Renderer Process (business_flow_dashboard.html)
    ↓ User clicks button
Main Process IPC Handler
    ↓
┌─────────────┬───────────────┐
│ Puppeteer   │ pywinauto     │
│ (Web)       │ (Python/Win)  │
│     ↓       │       ↓       │
│ ColorMe     │ Yayoi Sales   │
└─────────────┴───────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `main.js` | Electron main process, IPC handlers, Chrome debug mode |
| `preload.js` | Security bridge (contextBridge) |
| `business_flow_dashboard.html` | Primary UI dashboard |
| `automation-coloreme-existing-browser.js` | ColorMe web automation |
| `automation-yayoi-export-customer.py` | Yayoi customer Excel export (Step 3-1) |
| `automation-yayoi-import-customer.py` | Yayoi customer import (Step 6) |
| `automation-yayoi-import-sales.py` | Yayoi sales slip import (Step 7-3) |
| `debug-yayoi-ui.py` | UI inspection tool for pywinauto |
| `create-shortcut.ps1` | Windows shortcut creator with Electron icon |

### Chrome Debug Mode (Critical Pattern)

This app connects to an existing Chrome instance—it does NOT launch headless browsers. This maintains login sessions and avoids bot detection.

1. Main process checks `127.0.0.1:9222` for running Chrome
2. If not running, spawns Chrome with `--remote-debugging-port=9222`
3. Puppeteer connects via `puppeteer.connect()` (never `puppeteer.launch()`)
4. Profile persists at `~/.chrome-automation-profile`

**Critical**: Always use `127.0.0.1:9222` not `localhost:9222` (Windows IPv6 issue).

### IPC Pattern

```javascript
// Renderer (business_flow_dashboard.html)
await window.api.runColorMeDownload()

// Preload (preload.js)
contextBridge.exposeInMainWorld('api', {
  runColorMeDownload: () => ipcRenderer.invoke('run-coloreme-download')
})

// Main (main.js)
ipcMain.handle('run-coloreme-download', async (event) => { ... })
```

## Business Workflow

15-step order-to-shipping workflow in 4 phases:

| Phase | Steps | Status |
|-------|-------|--------|
| 1: 受注処理 | 0-3 | Steps 2, 3-1, 3-2 automated |
| 2: 新規顧客処理 | 4-6 | Step 6 partial automation |
| 3: 売上伝票作成 | 7-8 | Step 7-3 partial automation |
| 4: 出荷処理 | 9-15 | Planned (PowerAutomate) |

**Fully Automated**: Step 2 (ColorMe CSV), Step 3-1 (Yayoi Excel export)
**Partial Automation**: Step 6, Step 7-3 (navigate to dialog, show manual instructions)

## Adding New Automation

1. Create automation module (e.g., `automation-newservice.js` or `.py`)
2. Add IPC handler in `main.js`:
   ```javascript
   ipcMain.handle('run-newservice', async (event, params) => {
     const automation = require('./automation-newservice');
     return await automation.run(params);
   })
   ```
3. Expose API in `preload.js`:
   ```javascript
   runNewService: (params) => ipcRenderer.invoke('run-newservice', params)
   ```
4. Add UI button in `business_flow_dashboard.html`

## pywinauto Patterns (Windows Only)

### Window Selection

Use Desktop enumeration with priority filtering—never rely on `title_re` alone:

```python
from pywinauto import Desktop, Application

desktop = Desktop(backend="uia")
selected_window = None

for window in desktop.windows():
    title = window.window_text()
    if "弥生販売" in title and "伝票" not in title and "台帳" not in title:
        # Priority: 管理者 > プロフェッショナル > スタンダード
        if "管理者" in title:
            selected_window = window
            break
        elif "プロフェッショナル" in title and selected_window is None:
            selected_window = window

# Connect via handle to get WindowSpecification (has child_window method)
app = Application(backend="uia").connect(handle=selected_window.handle)
main_window = app.window(handle=selected_window.handle)
```

### Dialog Detection

Yayoi dialogs often have empty titles. Use `app.windows()` not `Desktop().windows()`:

```python
# CORRECT: Only searches Yayoi process windows
for window in self.app.windows():
    if window.handle != self.main_window.handle:
        dialog_window = window  # Found child dialog
        break

# WRONG: Searches all windows, may match Electron app
for window in Desktop().windows():
    if "インポート" in window.window_text():  # Dangerous!
        ...
```

### Button Detection (No Access Key)

Multi-strategy approach for buttons without Alt+key shortcuts:

```python
# Method 1: child_window (most reliable)
button = window.child_window(title="Excel")
if button.exists(timeout=3):
    button.click_input()  # click_input() more reliable than click()

# Method 2: descendants search
for ctrl in window.descendants():
    if ctrl.window_text() == "Excel":
        ctrl.click_input()

# Method 3: Coordinate click (last resort, use debug-yayoi-ui.py to find coords)
import pywinauto.mouse as mouse
mouse.click(coords=(691, 125))
```

### Access Key Navigation

Faster than visual element search:
- `Alt+F` → File menu
- `I` → Import
- `A` → Ledger Import (台帳インポート)
- `B` → Transaction Import (取引インポート)
- `Alt+N` → Next button
- `Alt+D` → Open ComboBox

### UTF-8 Encoding (Windows)

```python
# Python side
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
```

```javascript
// Node.js side
const python = spawn('python', ['script.py'], {
  env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
});
```

## ColorMe Automation Notes

- Uses `puppeteer-extra-plugin-stealth` for bot detection avoidance
- Download path set via CDP: `Page.setDownloadBehavior`
- Wait for `networkidle2` and add delays (2-3 seconds) for stability
- Login page: `https://admin.shop-pro.jp/`
- CSV output: `C:\Users\user\Downloads\sales_all.csv`

## Modal Feedback System

Four states for user feedback:

```javascript
// In dashboard JavaScript
showModal('Title', 'Content HTML', 'loading');  // Spinner
showModal('Title', 'Content HTML', 'success');  // Checkmark
showModal('Title', 'Content HTML', 'error');    // Error (requires dismiss)
showModal('Title', 'Content HTML', 'info');     // Manual instructions

// For partial automation steps with images
const instructionHtml = `
    <div style="text-align: left;">
        <p><strong>① Step description</strong></p>
        <img src="assets/screenshot.png" style="max-width: 100%;">
    </div>
`;
showModal('手動操作', instructionHtml, 'info');
```

## Important Notes

### Git Auto-Update

Launcher scripts (`起動.bat`, `起動.command`) run `git pull` and `npm install` on every launch. Commits to master deploy immediately on next user launch.

### Language Conventions
- UI and user docs: Japanese
- Code comments: Japanese/English mix
- Japanese file names intentional (e.g., `起動.command`)

### Platform Considerations
- ColorMe automation: Cross-platform
- Yayoi automation: Windows-only (requires pywinauto)
- pywinauto not bundled—must be installed separately (`pip install pywinauto`)

### Security
- `contextIsolation: true`, `nodeIntegration: false`
- Credentials in `config.json` (gitignored, copy from `config.example.json`)

## Troubleshooting

### Chrome Debug Connection

```bash
# Check if Chrome running on debug port
curl http://127.0.0.1:9222/json/version

# Kill existing instances
pkill -f "remote-debugging-port=9222"  # macOS/Linux
taskkill /F /IM chrome.exe             # Windows
```

### pywinauto Element Discovery

```python
from pywinauto import Application
app = Application(backend="uia").connect(title_re=".*弥生販売.*")
window = app.window(title_re=".*弥生販売.*")
window.print_control_identifiers()  # Dumps all UI elements
```

### Common Issues

| Issue | Solution |
|-------|----------|
| ECONNREFUSED on port 9222 | Use `127.0.0.1` not `localhost` |
| Dialog not detected | Wait 2-3 seconds after click, use `app.windows()` |
| ElementNotEnabled | Dialog is open—find and handle it first |
| Japanese text corruption | Set `PYTHONIOENCODING=utf-8` |
