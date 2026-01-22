# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**業務自動化ランチャー (Business Automation Launcher)** - An Electron desktop application that automates workflows between ColorMe Shop (カラーミーショップ) e-commerce platform and Yayoi Sales (弥生販売) accounting software.

**Current Version**: v2.0 (2026-01-16) - 現場リリース版

**Key Goal**: Replace slow RPA solutions with a fast, custom desktop app that reduces task execution from 30 seconds to under 1 second, saving ~¥300,000 annually in RPA licensing costs.

**Target**: 30x speed improvement over manual operations with 95%+ success rate.

## Technology Stack

- **Framework**: Electron v40.0.0 (desktop application)
- **Web Automation**: Puppeteer v24.34.0 with puppeteer-extra-plugin-stealth
- **Windows Automation**: pywinauto (Python, Windows-only)
- **UI**: Vanilla HTML/CSS/JavaScript
- **Platform**: Cross-platform (macOS, Windows)
- **Update Mechanism**: Git-based auto-update via launcher scripts

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Start application in development mode
npm start

# Start with debug logging
npm run dev
```

### Building
```bash
# Build for current platform
npm run build

# Build for macOS
npm run build:mac

# Build for Windows
npm run build:win
```

### Testing Automation Scripts
```bash
# Test ColorMe automation (existing browser connection)
node automation-coloreme-existing-browser.js

# Test Yayoi automation (Windows only, requires Python + pywinauto)
python automation-yayoi.py
```

### Launching in Production
```bash
# macOS
./起動.command

# Windows
起動.bat
```

**Important**: Launcher scripts implement **automatic updates** - they pull latest code from git and run `npm install` on every launch. This ensures end users always run the latest version without manual intervention. See "Git Auto-Update Mechanism" section below.

## Architecture

### Application Flow
```
Electron Main Process (main.js)
    ↓ IPC
Renderer Process (business_flow_dashboard.html)
    ↓ User clicks automation button
Main Process IPC Handler
    ↓
┌─────────────┬───────────────┐
│             │               │
Puppeteer     pywinauto       │
(Web)         (Python/Win)    │
│             │               │
ColorMe       Yayoi Sales     │
```

### Key Files

**Core Application**:
- `main.js` - Electron main process, IPC handlers, Chrome debug mode management
- `preload.js` - Security bridge (contextBridge) between renderer and main process
- `business_flow_dashboard.html` - Primary UI dashboard (active, production)
- `index.html` - Original simple UI (legacy, kept for reference)

**Automation Modules**:
- `automation-coloreme-existing-browser.js` - Active ColorMe automation (connects to existing Chrome)
- `automation-coloreme.js` - Original prototype (launches new browser instance)
- `automation-yayoi.py` - Yayoi Sales Windows automation (original prototype)
- `automation-yayoi-import-customer.py` - Yayoi Sales customer import automation (Step 6, active development)
- `automation-yayoi-import-sales.py` - Yayoi Sales slip import automation (Step 7-3, active development)

**Launchers**:
- `起動.bat` - Windows launcher with git auto-update
- `起動.command` - macOS launcher with git auto-update

**Configuration**:
- `config.example.json` - Template for credentials (copy to `config.json` for local use)
- `package.json` - Dependencies and electron-builder config

**Testing & Utility Scripts**:
- `test-existing-browser.js` - Tests Chrome debug connection
- `start-chrome-debug.js` - Standalone Chrome launcher for debugging
- `find-download-button.js` - ColorMe selector debugging tool
- `analyze-download-button.js` - ColorMe DOM analysis tool
- `automation-coloreme-download.js`, `automation-coloreme-download-v2.js` - Development iterations
- `coloreme-auto-download-final.js` - Final ColorMe download implementation

**Documentation**:
- `現場担当者向け_初回セットアップ.md` - End-user initial setup guide (first-run password persistence setup)
- `development-plan.md` - Project development roadmap
- `prototype-implementation-guide.md` - Implementation reference

### Chrome Debug Mode Architecture

**Critical Design Pattern**: This application does NOT launch headless browsers. It connects to an existing Chrome instance running in debug mode.

**Why**:
- Maintains user login sessions (no re-authentication needed)
- Avoids bot detection
- Faster startup (browser already running)

**Implementation**:
1. Main process checks if Chrome is running on `localhost:9222` (main.js:12-27)
2. If not running, spawns Chrome with `--remote-debugging-port=9222` (main.js:29-88)
3. Puppeteer connects via CDP (Chrome DevTools Protocol) using `puppeteer.connect()` (automation-coloreme-existing-browser.js:14-56)
4. Automation runs on existing browser tabs

**Platform-Specific Chrome Paths**:
- macOS: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- Windows: `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`
- Linux: `google-chrome`

**Chrome Profile Persistence** (Critical Feature):

The application uses a **persistent Chrome profile** via `--user-data-dir=~/.chrome-automation-profile`. This is essential for:

1. **Password Autofill**: Users log into ColorMe once manually, Chrome saves credentials, future automations work without re-authentication
2. **Session Persistence**: Login sessions survive app restarts
3. **User Experience**: End users don't need to manage credentials or re-login

**Initial Setup for End Users**:
- First run: User logs into ColorMe manually in the debug Chrome instance
- Chrome prompts to save password (or sync via Google Account)
- All subsequent automation runs use saved credentials automatically
- See `現場担当者向け_初回セットアップ.md` for detailed first-run instructions

**Profile Location**:
- macOS/Linux: `~/.chrome-automation-profile`
- Windows: `C:\Users\[username]\.chrome-automation-profile`

**Resetting Profile**: Delete the profile directory to start fresh (useful for troubleshooting)

### IPC Communication Pattern

**Renderer → Main**: Uses `window.api` exposed via preload.js
```javascript
// In renderer (business_flow_dashboard.html)
await window.api.runColorMeDownload()

// In preload.js
contextBridge.exposeInMainWorld('api', {
  runColorMeDownload: () => ipcRenderer.invoke('run-coloreme-download')
})

// In main.js
ipcMain.handle('run-coloreme-download', async (event) => { ... })
```

**Available IPC Channels**:
- `test-action` - Connection test
- `run-coloreme` - Original ColorMe automation
- `run-yayoi` - Yayoi automation
- `run-coloreme-download` - Active ColorMe CSV download (Step 2)
- `run-yayoi-customer-export` - Yayoi customer Excel export (Step 3-1)
- `run-yayoi-customer-import` - Yayoi customer import automation (Step 6)
- `run-yayoi-sales-import` - Yayoi sales slip import automation (Step 7-3)
- `open-external-url` - Opens URL in system default browser (used for Step 3-2, Step 5)

### Security Configuration

- `contextIsolation: true` - Isolates renderer from Node.js APIs
- `nodeIntegration: false` - Disables Node.js in renderer
- Context bridge pattern via preload.js
- Credentials should be in `config.json` (gitignored)

## Business Workflow

The dashboard implements a 15-step order-to-shipping workflow divided into 4 phases (v2.0 structure):

**Phase 1: 受注処理フェーズ** (Steps 0-3)
- Step 0: ゆうちょ銀行入金確認（手動）
- Step 1: カラーミー受注伝票出力（手動）
- Step 2: **Fully automated** - ColorMe CSV download
- Step 3-1: **Fully automated** - 弥生販売 顧客リストExcelエクスポート
- Step 3-2: 顧客登録照合（準AUTO - opens external web app）

**Phase 2: 新規顧客処理フェーズ** (Steps 4, 5, 6)
- Step 4: 対象者の有無確認（手動 - opens external web app with modal guide）
- Step 5: 「弥生形式」顧客txtダウンロード（手動）
- Step 6: 弥生販売インポート顧客台帳入力（部分自動化）

**Phase 3: 売上伝票作成フェーズ** (Steps 7-1, 7-2, 7-3, 8)
- Step 7-1: 受注プレビュー□欄へチェック（手動）
- Step 7-2: 「弥生形式」txtダウンロード（手動）
- Step 7-3: 弥生販売インポート売上伝票入力（部分自動化）
- Step 8: 弥生販売売上伝票印刷（手動）

**Phase 4: 出荷処理フェーズ** (Steps 9-15)
- Planned for future implementation (PowerAutomate)

### Current Implementation Status
- ✅ **Step 2: Fully automated** - ColorMe CSV download (production-ready)
- ✅ **Step 3-1: Fully automated** - 弥生販売 顧客リストExcelエクスポート (2026-01-21)
- ✅ **Step 3-2: Opens external app** - Opens conversion web app in default browser
- ✅ **Step 4: Manual with modal guide** - 対象者の有無確認（外部アプリ＋画像ガイド）
- ✅ **Step 5: Manual with modal guide** - 「弥生形式」顧客txtダウンロード（外部アプリ＋画像ガイド）
- ✅ **Step 6: Partial automation** - Navigates to import dialog, shows manual instruction modal
- ✅ **Step 7-2: Manual with image guide** - Shows instruction modal with screenshot
- ✅ **Step 7-3: Partial automation** - Navigates to CSV selection screen, shows manual instruction modal
- 📋 Steps 9-15: Planned (PowerAutomate)

## Development Guidelines

### Adding New Automation

1. **Create automation module** (e.g., `automation-newservice.js`)
2. **Add IPC handler** in main.js:
   ```javascript
   ipcMain.handle('run-newservice', async (event, params) => {
     const automation = require('./automation-newservice');
     return await automation.run(params);
   })
   ```
3. **Expose API** in preload.js:
   ```javascript
   runNewService: (params) => ipcRenderer.invoke('run-newservice', params)
   ```
4. **Add UI button** in business_flow_dashboard.html

### Working with ColorMe Automation

**Architecture:**
- Uses `puppeteer-extra-plugin-stealth` to avoid bot detection
- Always connect to existing browser via `puppeteer.connect()`, never `puppeteer.launch()`
- Download path is set via CDP: `Page.setDownloadBehavior`
- Wait for `networkidle2` and add 2-second delays for stability

**Critical Implementation Details (Step 2 - Completed 2026-01-14):**

1. **Chrome Process Management:**
   - Automatically kills existing Chrome processes before startup (`taskkill /F /IM chrome.exe`)
   - 3-second wait after process cleanup to ensure complete termination
   - Launches Chrome with `--remote-debugging-port=9222`
   - 8-second wait for Chrome startup completion

2. **IPv6/IPv4 Connection Fix:**
   - **CRITICAL**: Use `127.0.0.1:9222` instead of `localhost:9222`
   - Windows may resolve `localhost` to IPv6 (`::1`), but Chrome listens on IPv4 only
   - This caused ECONNREFUSED errors until fixed

3. **Automated Login Flow:**
   - Opens `https://admin.shop-pro.jp/` (login page)
   - Waits 3 seconds for password autofill
   - Automatically finds and clicks login button (multiple selector strategies)
   - Waits 5 seconds for login completion

4. **CSV Download Flow:**
   - Navigates to menu page → data download page
   - Selects data type: "9" (受注一括データ)
   - Checks exclusion checkboxes: `#except_shipped`, `#sales_all_except_shipped`
   - Executes download via `jf_ProductDownloadSubmit(0)`
   - Output: `C:\Users\user\Downloads\sales_all.csv`

5. **Retry Mechanism:**
   - Debug port connection: 20 retries × 2 seconds = 40 seconds max wait
   - Detailed logging at attempts 1, 10, and 19 for diagnostics

### Step 3-1 Yayoi Customer List Excel Export - Fully Automated (2026-01-21)

**Achievement**: Full automation of customer list Excel export from Yayoi Sales

**File**: `automation-yayoi-export-customer.py`

**Purpose**:
複数担当者が業務を行う際、電話対応で直接弥生販売に顧客登録を行うケースがある。その後、他の担当者がアプリからインポートを実行すると、既存顧客情報を上書きしてしまう事故を防止するため、Step 3-2の照合用データとして提供。

**Execution Flow** (Total ~15 seconds):
1. Connect to running Yayoi Sales application (~2 seconds)
   - Desktop enumeration for smart window selection
   - Priority: 管理者 → プロフェッショナル → スタンダード
   - Excludes 伝票/台帳 windows
2. Navigate to customer ledger: Alt+D → A (台帳 → 顧客台帳) (~2 seconds)
3. Click Excel button in customer ledger window (~1 second)
4. Wait for "Excelへの書き出し" dialog (~2.5 seconds)
5. Enter filename in 名称 field (~1 second)
6. Click OK button (~2 seconds)

**Output File**:
- Path: `C:\Users\user\Downloads\DLca_APP_INP00000YYMMDD.xls`
- Format: Excel (.xls) - 得意先リスト形式

**Key Technical Solutions (CRITICAL LEARNINGS)**:

1. **Smart Window Selection (Desktop Enumeration)**:
   - **Problem**: `Application.connect(title_re=...)` fails when multiple Yayoi windows exist
   - **Solution**: Use `Desktop(backend="uia").windows()` to enumerate all windows, then filter by priority
   ```python
   from pywinauto import Desktop
   desktop = Desktop(backend="uia")
   for window in desktop.windows():
       title = window.window_text()
       if "弥生販売" in title and "伝票" not in title and "台帳" not in title:
           # Found main window
   ```
   - Exclude 伝票 (slip) and 台帳 (ledger) windows to find the main application window

2. **WindowSpecification vs UIAWrapper**:
   - **Problem**: After `connect(handle=...)`, window object is UIAWrapper which lacks `child_window()` method
   - **Solution**: Re-get window from Application object
   ```python
   window_handle = selected_window.handle
   self.app = Application(backend="uia").connect(handle=window_handle)
   self.main_window = self.app.window(handle=window_handle)  # Now has child_window()
   ```

3. **ElementNotEnabled Error Handling**:
   - **Problem**: When a dialog is open, main window becomes disabled and can't receive keyboard input
   - **Solution**: Catch `ElementNotEnabled` exception and check for blocking dialogs
   ```python
   from pywinauto.base_wrapper import ElementNotEnabled
   try:
       self.main_window.type_keys("%d")
   except ElementNotEnabled:
       # Check for blocking dialogs using self.app.windows()
   ```

4. **Dialog Detection - Avoiding False Positives**:
   - **Problem**: Searching for "Excel" in title matches open Excel spreadsheets (e.g., `卸一覧表.xlsx - Excel`)
   - **Solution**: Search for exact dialog title "Excelへの書き出し" or unique keyword "書き出し"
   ```python
   # WRONG: Matches any Excel window
   if "Excel" in title:

   # CORRECT: Matches only Yayoi export dialog
   if "書き出し" in title and ".xlsx" not in title and ".xls" not in title:
   ```
   - Always exclude `.xlsx` and `.xls` file extensions to avoid matching Excel application windows

5. **Dialog Wait Time**:
   - **Problem**: Dialog not detected because script checks before it opens
   - **Solution**: Wait 2.5 seconds after clicking Excel button before searching for dialog
   - Dialogs in Yayoi often take 1-2 seconds to fully render

6. **UI Button Detection (アクセスキーのないボタン)**:
   - **Problem**: Some buttons (like "Excel") have no access key (Alt+X等), requiring visual detection
   - **Solution**: Multi-strategy approach with fallback chain
   ```python
   # 方法1: child_window で名前検索（最も確実）
   try:
       button = self.main_window.child_window(title="Excel")
       if button.exists(timeout=3):
           button.click_input()  # click_input() は click() より確実
           return True
   except Exception:
       pass

   # 方法2: descendants() で全子孫を探索
   try:
       for ctrl in self.main_window.descendants():
           if ctrl.window_text() == "Excel":
               ctrl.click_input()
               return True
   except Exception:
       pass

   # 方法3: 座標クリック（最終手段、デバッグで座標を取得）
   try:
       import pywinauto.mouse as mouse
       # debug-yayoi-ui.py で取得した座標を使用
       mouse.click(coords=(691, 125))
       return True
   except Exception:
       pass
   ```
   - **Debug Script**: `debug-yayoi-ui.py` でUI構造を調査し、ボタン座標を取得
   - **Key Point**: `click_input()` は `click()` より確実（実際のマウスイベントを発生）
   - **Reusability**: この技術は弥生販売の他のボタン（印刷、保存など）にも適用可能

**Integration**:
- IPC Handler: `run-yayoi-customer-export` in main.js
- API: `window.api.runYayoiCustomerExport()` in preload.js
- UI: Step 3-1 button in business_flow_dashboard.html with AUTO badge

### Step 6 Yayoi Customer Import - Partial Automation (2026-01-14)

**Achievement**: Automated navigation to Yayoi Sales import menu (台帳インポート)

**File**: `automation-yayoi-import-customer.py` (New Python script for customer ledger import)

**Execution Flow** (Current implementation):
1. Connect to running Yayoi Sales application (~2 seconds)
   - Search by window title: プロフェッショナル → スタンダード → 管理者
   - Actual window: "弥生販売 プロフェッショナル - 株式会社テネモスネット - 管理者"
2. Activate main window (0.5 seconds)
3. Open File menu: Alt+F (1 second)
4. Select Import: I key (1.5 seconds)
5. Select Ledger Import: A key (1.5 seconds)
6. Verify import dialog opened (2 seconds)

**Total execution time**: ~8-9 seconds to reach import dialog

**Key Technical Solutions**:

1. **UTF-8 Encoding (Windows character corruption fix)**:
   ```python
   # Python side
   sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
   sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

   # Node.js side
   const python = spawn('python', ['automation-yayoi-import-customer.py'], {
     env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
   });
   python.stdout.on('data', (data) => {
     const output = data.toString('utf8');
   });
   ```

2. **Smart Window Selection Logic (Updated 2026-01-14)**:
   - **Problem**: Original regex-based matching failed when multiple windows existed, or when only the main window was open
   - **Solution**: Desktop enumeration with priority-based selection
     1. Get all windows from Desktop
     2. Filter for windows containing "弥生販売"
     3. Select with priority order:
        - Priority 1: Windows with "管理者" (excluding "伝票")
        - Priority 2: Windows with "プロフェッショナル" (excluding "伝票")
        - Priority 3: Windows with "スタンダード" (excluding "伝票")
        - Priority 4: Any Yayoi window (excluding "伝票")
   - **Result**: Works in all scenarios:
     - ✅ Main window only
     - ✅ Main window + sales slip window
     - ✅ Multiple Yayoi windows
   - Detailed logging shows all discovered windows and selected window

3. **Access Key Navigation**:
   - Alt+F → File menu
   - I → Import (インポート)
   - A → Ledger Import (台帳インポート)
   - Faster and more reliable than visual element search

**Prerequisites**:
- Python 3.x installed and in PATH
- pywinauto: `pip install pywinauto`
- Yayoi Sales application must be running
- Version: Works with Yayoi プロフェッショナル版

**Integration**:
- IPC Handler: `run-yayoi-customer-import` in main.js
- API: `window.api.runYayoiCustomerImport()` in preload.js
- UI: Step 6 button in business_flow_dashboard.html
- Badge states: 開発中 → 実行中 → 完了

**Next Steps** (Pending implementation):
- Select "顧客台帳" (Customer Ledger) from import dialog
- Browse and select CSV file
- Execute import
- Handle import completion/error dialog
- Return success/failure status to Electron app

**Current Status**:
- ✅ Connection to Yayoi Sales
- ✅ Navigation to import menu
- ✅ UTF-8 encoding fix
- ✅ Smart window selection (2026-01-14)
- ⏳ Import dialog interaction (next phase - screenshot-based development)

### Step 7-3 Yayoi Sales Slip Import - CSV File Selection Automation (2026-01-14 COMPLETED)

**Achievement**: Fully automated navigation from menu to CSV file selection screen

**File**: `automation-yayoi-import-sales.py` (Python script for sales slip import)

**Execution Flow** (Complete implementation):
1. Connect to running Yayoi Sales application (~2 seconds)
   - Smart window selection logic (same as Step 6)
   - Priority-based selection ensures correct main window
2. Activate main window (0.5 seconds)
3. Open File menu: Alt+F (1 second)
4. Select Import: I key (1.5 seconds)
5. Select Transaction Import: B key (取引インポート) (3.5 seconds with wait)
6. Click Next: Alt+N on wizard dialog (2 seconds)
7. Select Slip Import (1): Default selected, no action needed (0.5 seconds)
8. Click Next: Alt+N on wizard dialog (2 seconds)
9. Select Sales Slip: Alt+D → HOME → DOWN×2 → ENTER (2 seconds)
10. **CSV file selection screen displayed** ✅

**Total execution time**: ~18 seconds to reach CSV file selection

**Key Technical Breakthroughs (2026-01-14)**:

1. **Dialog Window Detection via Process**:
   - **Problem**: "取引インポートウィザード" dialog has empty or invisible title
   - **Failed Approach**: `Desktop().windows()` searches all windows globally → incorrectly selected Electron app window
   - **Solution**: Use `self.app.windows()` to enumerate **only child windows of Yayoi process**
   ```python
   all_windows = self.app.windows()
   for window in all_windows:
       if window.handle != self.main_window.handle:
           dialog_window = window  # Found the wizard dialog!
   ```
   - **Result**: Correctly identifies wizard dialogs even without visible titles

2. **ComboBox Navigation for Sales Slip Selection**:
   - ComboBox order: 見積書(0) → 受注伝票(1) → 売上伝票(2)
   - Sequence: `Alt+D` (open combo) → `HOME` (go to first) → `DOWN×2` (move to sales slip) → `ENTER` (confirm)
   - Default shows "見積書", must change to "売上伝票"

3. **Default Selection Handling**:
   - "伝票インポート(1)" radio button is pre-selected by default
   - No action needed - sending "1" key was unnecessary and caused issues
   - Simply proceed to next step

**Prerequisites**:
- Python 3.x installed and in PATH
- pywinauto: `pip install pywinauto`
- Yayoi Sales application must be running
- Version: Works with Yayoi プロフェッショナル版

**Integration**:
- IPC Handler: `run-yayoi-sales-import` in main.js
- API: `window.api.runYayoiSalesImport()` in preload.js
- UI: Step 7-3 button in business_flow_dashboard.html
- Badge states: 開発中 → 実行中 → 完了

**Next Steps** (Pending implementation):
- Browse and select CSV file (参照ボタン)
- Execute import (次へボタン)
- Handle import completion/error dialog
- Return success/failure status to Electron app

**Current Status**:
- ✅ Connection to Yayoi Sales
- ✅ Navigation to import menu (ファイル → インポート → 取引インポート)
- ✅ UTF-8 encoding fix
- ✅ Smart window selection
- ✅ Wizard dialog detection via process enumeration **(CRITICAL FIX)**
- ✅ Next button clicks (Alt+N on correct dialog)
- ✅ Sales slip selection from combobox
- ✅ **CSV file selection screen reached** (2026-01-14)
- ⏳ CSV file browse and import execution (next phase)

**Development Priority**: Step 7-3 is prioritized over Step 6 due to higher usage frequency in production workflow.

### Working with Yayoi Automation (Windows Only)

- Requires Python 3 + pywinauto installed
- Uses `spawn('python', ['automation-yayoi.py', ...])` from Node.js
- Selectors need customization per Yayoi installation
- Uses UIA (UI Automation) backend for modern Windows apps

**CRITICAL: Dialog Detection Pattern (2026-01-14)**

Yayoi wizard dialogs often have **empty or invisible window titles**, making them impossible to find via `Desktop().windows()` with title-based search.

**❌ WRONG Approach**:
```python
# This will find ALL windows including other apps!
from pywinauto import Desktop
desktop = Desktop(backend="uia")
for window in desktop.windows():
    if "インポート" in window.window_text():  # May match Electron app!
        dialog = window
```

**✅ CORRECT Approach**:
```python
# Use self.app.windows() to enumerate ONLY Yayoi process windows
all_windows = self.app.windows()
for window in all_windows:
    if window.handle != self.main_window.handle:
        # This is a child dialog of Yayoi process
        dialog_window = window
        break
```

**Why this matters**:
1. Wizard dialogs may have empty titles or special characters
2. `Desktop().windows()` searches globally across all processes
3. Can accidentally select wrong window (e.g., Electron app with "インポート" in title)
4. `self.app.windows()` only searches windows belonging to Yayoi process
5. Guarantees you're interacting with the correct application

**Implementation Notes**:
- Always use `self.app.windows()` for dialog detection
- Filter by `window.handle != self.main_window.handle` to exclude main window
- Send key inputs to the dialog window, not the main window
- Main window becomes disabled when dialog is open (ElementNotEnabled error)

### Modifying Selectors

**ColorMe** (automation-coloreme-existing-browser.js):
- Web selectors may change with site updates
- Use browser DevTools to inspect elements
- Prefer stable selectors (IDs over classes)

**Yayoi** (automation-yayoi.py):
- Window titles and control IDs vary by version
- Use `window.print_control_identifiers()` to discover elements
- Test on actual Yayoi installation

### Configuration Management

**Current State**: Some credentials are hardcoded in automation files
**Best Practice**: Use `config.json` (based on `config.example.json`)
```javascript
const config = require('./config.json');
const { username, password } = config.colorMeCredentials;
```

### Error Handling Pattern

Modal feedback system with four states:
1. **Loading**: Show spinner modal during automation
2. **Success**: Show checkmark with success message
3. **Error**: Show error message, require user dismissal
4. **Info**: Show manual instruction modal (for partial automation steps)

Implement in automation modules:
```javascript
throw new Error('明確なエラーメッセージ'); // Shows in modal
```

### Manual Instruction Modal Pattern

For partially automated steps (where automation navigates to a screen, then user completes manually):

```javascript
// In dashboard JavaScript
if (result.success) {
    const instructionHtml = `
        <div style="text-align: left; line-height: 1.8;">
            <p><strong>① Step description</strong></p>
            <p style="margin-left: 1em;">Details...</p>
        </div>
    `;
    showModal('Title - 手動操作', instructionHtml, 'info');
}
```

**With images** (Step 7-2 pattern):
- Place images in `assets/` folder (e.g., `assets/jidoustep5-2.png`)
- Reference in modal HTML: `<img src="assets/jidoustep5-2.png" ...>`

## Project Status

**Phase**: Phase 2 (Main Implementation) - In Progress

**Completed Features**:
- ✅ Electron app structure with Chrome debug mode integration
- ✅ **Step 2**: ColorMe CSV download - fully automated (production-ready)
- ✅ **Step 3-1**: 弥生販売 顧客リストExcelエクスポート - fully automated (2026-01-21)
- ✅ **Step 3-2**: Opens conversion web app in default browser
- ✅ **Step 7-2**: Manual instruction modal with screenshot image
- ✅ **Step 6**: Partial automation to import dialog + manual instruction modal
- ✅ **Step 7-3**: Partial automation to CSV selection screen + manual instruction modal
- ✅ Dashboard UI with workflow visualization and modal system
- ✅ Git-based auto-update launchers

**Remaining Work**:
- Steps 9-15 automation (PowerAutomate integration)
- Optional: Extend Step 6, 7-3 automation to complete file selection (currently uses manual instruction modals)
- File management system (auto-cleanup, archiving)

## Important Notes

### Language
- UI and end-user documentation: Japanese
- Code comments: Mix of Japanese and English
- Technical documentation: Primarily Japanese

### File Naming
- Japanese file names are intentional (e.g., `起動.command`)
- Avoid renaming launcher scripts (users expect these names)

### Git Auto-Update Mechanism

**Critical**: The launcher scripts (`起動.bat`, `起動.command`) implement **automatic updates** on every launch:

1. **Git Pull**: `git pull` runs first to fetch latest code
2. **Dependency Update**: `npm install` runs to sync dependencies
3. **Launch**: Application starts with latest version

**Implications**:
- Users **never** manually update the application
- Any commit to master branch is deployed on next user launch
- Test thoroughly before merging to master
- Use feature branches for development work
- Consider the launcher scripts sacred - users depend on their file names and behavior

**User Impact**:
- Zero-maintenance updates for end users
- Always running latest bug fixes and features
- No version management complexity

### Dependencies
- Keep Electron version aligned with Puppeteer compatibility
- Test Chrome debug mode after Electron upgrades
- pywinauto is Python 3 only (not bundled, must be installed separately)

### Platform Considerations
- ColorMe automation works on all platforms
- Yayoi automation is Windows-only (uses Windows UI Automation)
- Test launchers on both macOS and Windows
- Launcher scripts use `.command` (macOS) and `.bat` (Windows)

### Initial Deployment
- End users need one-time setup to enable Chrome password persistence
- See `現場担当者向け_初回セットアップ.md` for step-by-step first-run instructions
- After initial setup, automation runs unattended
- Profile is stored in `~/.chrome-automation-profile` and persists across launches

## Troubleshooting

### Chrome Debug Mode Issues
```bash
# Check if Chrome is running on port 9222
curl http://localhost:9222/json/version

# Kill existing Chrome debug instances
pkill -f "remote-debugging-port=9222"  # macOS/Linux
taskkill /F /IM chrome.exe             # Windows
```

### Puppeteer Connection Failures

**CRITICAL FIX (2026-01-14): IPv6/IPv4 Connection Issue**

**Problem**: ECONNREFUSED error when connecting to debug port, even though Chrome is running with `--remote-debugging-port=9222`

**Root Cause**:
- Chrome listens on `127.0.0.1:9222` (IPv4)
- Windows may resolve `localhost` to `::1` (IPv6)
- IPv6 client → IPv4 server = connection refused

**Solution**:
- **Always use `127.0.0.1:9222` instead of `localhost:9222`**
- Changed in: `main.js`, `automation-coloreme-existing-browser.js`

**Diagnosis**:
```bash
# Check Chrome debug port (should show JSON response)
curl http://127.0.0.1:9222/json/version

# Check Chrome stderr output for confirmation
# Should see: "DevTools listening on ws://127.0.0.1:9222/..."
```

**Other common issues**:
- Ensure Chrome is launched with correct `--remote-debugging-port=9222`
- Check `--user-data-dir` path is writable
- Verify no firewall blocking port 9222
- Kill all Chrome processes before starting (`taskkill /F /IM chrome.exe`)

### pywinauto Element Not Found
Use inspection script to discover elements:
```python
from pywinauto import Application
app = Application(backend="uia").connect(title_re=".*弥生販売.*")
window = app.window(title_re=".*弥生販売.*")
window.print_control_identifiers()
```

### Auto-update Fails
- Check git remote is configured correctly
- Ensure no uncommitted local changes (will prevent pull)
- Verify npm is in PATH
