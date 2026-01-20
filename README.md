# Project Dashboard

A local dashboard to manage and navigate your development projects. Scan your projects folder, track what you're working on, and quickly open projects in VS Code, Explorer, or Terminal.

**Now available as a native desktop app via Electron!**

## Features

- **Project Scanner** - Automatically detects projects and their tech stack (Next.js, React, Vue, Python, etc.)
- **Git Status** - See last commit date and uncommitted changes at a glance
- **Focus Projects** - Pin important projects to the top
- **Favorites** - Mark projects you access frequently
- **Quick Actions** - Open any project in VS Code, File Explorer, or Terminal with one click
- **Archive** - Move stale projects to an archive folder
- **Category Organization** - Organize projects into customizable category folders
- **Fast Loading** - Cached data for instant load, background refresh for accuracy

## Requirements

- Node.js 18+
- Windows (Terminal integration uses Windows Terminal)
- VS Code (with `code` command in PATH)

## Installation

1. **Clone or download** this repository to your preferred location:
   ```bash
   git clone https://github.com/yourusername/project-dashboard.git
   cd project-dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the app:**

   **Option A: Desktop App (Electron)**
   ```bash
   npm run dev:electron
   ```

   **Option B: Browser Version**
   ```bash
   npm run dev
   ```
   Then open [http://localhost:3000](http://localhost:3000)

4. **Configure your settings:**
   - Click "Settings" in the top right
   - Set your **Projects Root Directory** (e.g., `C:/Users/YourName/Projects`)
   - Customize your **Category Folders** (subfolders in your root directory)
   - Customize your **Ignored Folders** (folder names to skip when scanning)

## Project Structure

Your projects folder should be organized like this:

```
Your-Projects-Folder/
├── Category1/          # e.g., Finance, WebApps, etc.
│   ├── project-a/
│   └── project-b/
├── Category2/          # e.g., DevTools, Templates, etc.
│   ├── project-c/
│   └── project-d/
├── _Archive/           # Archived projects go here
│   └── old-project/
└── _Misc/              # Uncategorized projects
```

## Usage

### Viewing Projects
- All projects are displayed in a sortable table
- Click column headers to sort by name, category, last commit, or size
- Use the search box to filter by project name
- Filter by category using the dropdown
- Check "Stale only" to see projects with no commits in 90+ days

### Managing Projects
- **Star (★)** - Mark as favorite (sorts to top)
- **Target (◎)** - Mark as focus project (appears in Focus section)
- **Code** - Open in VS Code
- **Folder** - Open in File Explorer
- **Terminal** - Open Windows Terminal at project path
- **Archive** - Move project to _Archive folder

### Focus Projects
Projects marked as "Focus" appear in a highlighted section at the top of the dashboard. Click any focus card to open it directly in VS Code.

## Configuration

Settings are stored in `data/settings.json`:

```json
{
  "rootPath": "C:/Users/YourName/Projects",
  "ignoredFolders": [
    "node_modules",
    ".git",
    ".next",
    "dist"
  ],
  "editor": "vscode",
  "defaultAction": "editor"
}
```

**Settings:**
- `rootPath` - Your projects root directory
- `ignoredFolders` - Folder names to skip (also used to hide categories)
- `editor` - Your code editor: `vscode` or `cursor`
- `defaultAction` - What happens when clicking focus cards: `editor`, `explorer`, or `terminal`

**Note:** Categories are auto-detected from folders in your root directory. Use the Settings page to hide categories you don't want to see.

## Tech Stack

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **CSS Modules** - Scoped styling (no Tailwind)
- **Electron** - Desktop app wrapper
- **Local JSON** - Simple file-based persistence

## Development

```bash
# Start browser dev server
npm run dev

# Start Electron desktop app (development)
npm run dev:electron

# Build for production (browser)
npm run build

# Start production server (browser)
npm start
```

## Desktop App (Electron)

The app can be packaged as a standalone desktop application for Windows, macOS, and Linux.

### Development

```bash
# Run the desktop app in development mode
npm run dev:electron
```

This starts both the Next.js dev server and the Electron window with hot reloading.

### Building Distributables

```bash
# Build for all platforms
npm run electron:build

# Build for specific platforms
npm run electron:build:win    # Windows (.exe installer + portable)
npm run electron:build:mac    # macOS (.dmg)
npm run electron:build:linux  # Linux (.AppImage + .deb)
```

Build outputs are placed in the `dist-electron/` directory.

### How It Works

The Electron version runs the full Next.js application internally:
- **Development**: Launches the Next.js dev server and loads it in the Electron window
- **Production**: Runs the Next.js standalone server bundled with the app

All features work identically in both browser and desktop versions.

## Notes

- Ignored folders (like `node_modules`, `.git`) are configurable in Settings
- Git operations have a 5-second timeout to prevent hanging on large repos
- Directory sizes are estimated from top-level files only (for speed)
- Cache expires after 5 minutes; click "Refresh" to force a fresh scan

## License

MIT
