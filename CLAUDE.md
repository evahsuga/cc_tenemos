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
- `automation-yayoi.py` - Yayoi Sales Windows automation

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

### Security Configuration

- `contextIsolation: true` - Isolates renderer from Node.js APIs
- `nodeIntegration: false` - Disables Node.js in renderer
- Context bridge pattern via preload.js
- Credentials should be in `config.json` (gitignored)

## Business Workflow

The dashboard implements a 15-step order-to-shipping workflow divided into 4 phases:

**Phase 1: Order Processing** (Steps 1-3)
- Step 2 is fully automated (ColorMe sales slip CSV download)

**Phase 2: Payment & Documents** (Steps 4-5)
- Semi-automated via external web app

**Phase 3: Yayoi Import** (Steps 6-8)
- Currently in development
- Will automate customer ledger and sales slip import

**Phase 4: Shipping** (Steps 9-15)
- Planned for future implementation (PowerAutomate)

### Current Implementation Status
- ✅ Step 2: Fully automated
- 🔨 Steps 6-7: Under development
- 📋 Steps 9-15: Planned

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

- Uses `puppeteer-extra-plugin-stealth` to avoid bot detection
- Always connect to existing browser via `puppeteer.connect()`, never `puppeteer.launch()`
- Download path is set via CDP: `Page.setDownloadBehavior`
- Wait for `networkidle2` and add 2-second delays for stability

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

**Completed**:
- Electron app structure
- Chrome debug mode integration
- ColorMe CSV download automation (Step 2)
- Dashboard UI with workflow visualization
- Git-based auto-update launchers

**In Development**:
- Yayoi automation (Steps 6-7)
- Configuration system
- Error handling improvements

**Planned**:
- Steps 9-15 automation
- Logging system
- Retry mechanisms

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
- Ensure Chrome is launched with correct `--remote-debugging-port=9222`
- Check `--user-data-dir` path is writable
- Verify no firewall blocking localhost:9222

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
