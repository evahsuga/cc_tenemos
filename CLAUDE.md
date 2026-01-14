# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**業務自動化ランチャー (Business Automation Launcher)** - An Electron desktop application that automates workflows between ColorMe Shop (カラーミーショップ) e-commerce platform and Yayoi Sales (弥生販売) accounting software.

**Key Goal**: Replace slow RPA solutions with a fast, custom desktop app that reduces task execution from 30 seconds to under 1 second, saving ~¥300,000 annually in RPA licensing costs.

**Target**: 30x speed improvement over manual operations with 95%+ success rate.

## Technology Stack

- **Framework**: Electron v28.0.0 (desktop application)
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
- `automation-yayoi-import-sales.py` - Yayoi Sales slip import automation (Step 7, active development)

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

**Renderer → Main**: Uses `window.electronAPI` exposed via preload.js
```javascript
// In renderer (business_flow_dashboard.html)
await window.electronAPI.runColorMeDownload()

// In preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  runColorMeDownload: () => ipcRenderer.invoke('run-coloreme-download')
})

// In main.js
ipcMain.handle('run-coloreme-download', async (event) => { ... })
```

**Available IPC Channels**:
- `test-action` - Connection test
- `run-coloreme` - Original ColorMe automation
- `run-yayoi` - Yayoi automation
- `run-coloreme-download` - Active ColorMe CSV download
- `run-yayoi-customer-import` - Yayoi customer import automation (Step 6)
- `run-yayoi-sales-import` - Yayoi sales slip import automation (Step 7)

### Security Configuration

- `contextIsolation: true` - Isolates renderer from Node.js APIs
- `nodeIntegration: false` - Disables Node.js in renderer
- Context bridge pattern via preload.js
- Credentials should be in `config.json` (gitignored)

## Business Workflow

The dashboard implements a 15-step order-to-shipping workflow divided into 4 phases:

**Phase 1: Order Processing** (Steps 1-3)
- Step 2 is **fully automated** (ColorMe sales slip CSV download)
  - One-click execution: Chrome startup → Login → CSV download
  - Downloads to: `C:\Users\user\Downloads\sales_all.csv`
  - Automatic Chrome debug mode management
  - Automatic login with saved credentials
  - Fully unattended operation

**Phase 2: Payment & Documents** (Steps 4-5)
- Semi-automated via external web app

**Phase 3: Yayoi Import** (Steps 6-8)
- Currently in development
- Will automate customer ledger and sales slip import

**Phase 4: Shipping** (Steps 9-15)
- Planned for future implementation (PowerAutomate)

### Current Implementation Status
- ✅ **Step 2: Fully automated and production-ready** (2026-01-14)
  - Complete automation: Chrome launch → Login → CSV download
  - Fixed IPv6/IPv4 connection issue (localhost → 127.0.0.1)
  - Automatic Chrome process cleanup before startup
  - Robust debug port connection with retry mechanism
  - Output file: `C:\Users\user\Downloads\sales_all.csv`
- 🔨 Steps 6-7: Next development target (Yayoi import automation)
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

### Step 2 Complete Automation - Production Ready (2026-01-14)

**Achievement**: Full automation from button click to CSV download completion

**Execution Flow** (Total ~60 seconds):
1. Kill existing Chrome processes (2 seconds)
2. Wait for process cleanup (3 seconds)
3. Launch Chrome in debug mode (8 seconds)
4. Connect to debug port (immediate if successful, up to 40 seconds with retry)
5. Navigate to login page (2 seconds)
6. Wait for password autofill (3 seconds)
7. Auto-click login button (immediate)
8. Wait for login completion (5 seconds)
9. Navigate to download page (2 seconds)
10. Select data type and options (1 second)
11. Execute download (2 seconds)

**Output File**:
- Path: `C:\Users\user\Downloads\sales_all.csv`
- Format: ColorMe sales slip data (受注一括データ)
- Note: Multiple downloads create numbered files: `sales_all (1).csv`, `sales_all (2).csv`, etc.

**Key Success Factors**:
- IPv6/IPv4 fix (`127.0.0.1` instead of `localhost`)
- Automatic Chrome process cleanup before launch
- Sufficient wait times at each step
- Robust error handling with detailed logging

**Next Steps**:
- File management: Auto-delete old `sales_all.csv` before download to prevent numbered duplicates
- Integrate with Step 3 (web app) for customer verification
- Develop Step 6-7 (Yayoi import automation)

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

### Step 7 Yayoi Sales Slip Import - Partial Automation (2026-01-14)

**Achievement**: Automated navigation to Yayoi Sales import menu (伝票インポート)

**File**: `automation-yayoi-import-sales.py` (New Python script for sales slip import)

**Execution Flow** (Current implementation):
1. Connect to running Yayoi Sales application (~2 seconds)
   - Uses same smart window selection logic as Step 6
   - Priority-based selection ensures correct main window
2. Activate main window (0.5 seconds)
3. Open File menu: Alt+F (1 second)
4. Select Import: I key (1.5 seconds)
5. Select Slip Import: I key (1.5 seconds) - **Different from Step 6 (A key)**
6. Verify import dialog opened (2 seconds)

**Total execution time**: ~8-9 seconds to reach import dialog

**Key Differences from Step 6**:
- Step 6: 台帳インポート(A) → Customer ledger import
- Step 7: 伝票インポート(I) → Sales slip import
- Same window connection logic, different menu path

**Prerequisites**:
- Python 3.x installed and in PATH
- pywinauto: `pip install pywinauto`
- Yayoi Sales application must be running
- Version: Works with Yayoi プロフェッショナル版

**Integration**:
- IPC Handler: `run-yayoi-sales-import` in main.js
- API: `window.api.runYayoiSalesImport()` in preload.js
- UI: Step 7 button in business_flow_dashboard.html
- Badge states: 開発中 → 実行中 → 完了

**Next Steps** (Pending implementation - prioritized over Step 6):
- Select "売上伝票" (Sales Slip) from import dialog
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

**Development Priority**: Step 7 is prioritized over Step 6 due to higher usage frequency in production workflow.

### Working with Yayoi Automation (Windows Only)

- Requires Python 3 + pywinauto installed
- Uses `spawn('python', ['automation-yayoi.py', ...])` from Node.js
- Selectors need customization per Yayoi installation
- Uses UIA (UI Automation) backend for modern Windows apps

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

Modal feedback system with three states:
1. **Loading**: Show spinner modal
2. **Success**: Show checkmark, auto-dismiss after 2 seconds
3. **Error**: Show error message, require user dismissal

Implement in automation modules:
```javascript
throw new Error('明確なエラーメッセージ'); // Shows in modal
```

## Project Status

**Phase**: Phase 2 (Main Implementation) - In Progress

**Completed (2026-01-14)**:
- ✅ Electron app structure
- ✅ Chrome debug mode integration with automatic process management
- ✅ **ColorMe CSV download full automation (Step 2)** - PRODUCTION READY
  - One-click operation from Chrome launch to CSV download
  - Automatic login with saved credentials
  - Fixed IPv6/IPv4 connection issue (localhost → 127.0.0.1)
  - Robust retry mechanism (40-second max wait)
  - Output: `C:\Users\user\Downloads\sales_all.csv`
- ✅ Dashboard UI with workflow visualization
- ✅ Git-based auto-update launchers
- ✅ Comprehensive error handling and logging

**In Development (2026-01-14)**:
- 🔨 **Yayoi automation (Step 7 - Priority)** - IN PROGRESS
  - ✅ Connection to Yayoi Sales application
  - ✅ Smart window selection logic (handles main window only or with slip windows)
  - ✅ Navigation to import menu (ファイル → インポート → 伝票インポート)
  - ✅ UTF-8 encoding fix for Windows
  - ⏳ Import dialog interaction (screenshot-based development next)
  - ⏳ CSV file selection and import execution
- 🔨 **Yayoi automation (Step 6)** - IN PROGRESS (lower priority)
  - ✅ Connection to Yayoi Sales application
  - ✅ Smart window selection logic (handles main window only or with slip windows)
  - ✅ Navigation to import menu (ファイル → インポート → 台帳インポート)
  - ✅ UTF-8 encoding fix for Windows
  - ⏳ Import dialog interaction (screenshot-based development next)
  - ⏳ CSV file selection and import execution
- Configuration system
- Advanced error recovery

**Planned**:
- Steps 9-15 automation (PowerAutomate integration)
- File management system (auto-cleanup, archiving)
- Execution history logging

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
