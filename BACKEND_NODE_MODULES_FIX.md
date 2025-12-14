# Backend Node Modules Missing - Fix

## Problem
After manually copying the backend `dist` folder, the app shows:
- ✅ "Backend executable not found" - FIXED (dist folder is there)
- ❌ "Cannot find module 'express'" - NEW ISSUE

## Root Cause
The backend's `node_modules` folder is not included in the packaged app. The backend needs its dependencies (express, pg, cors, etc.) to run.

## Solution Applied

Updated `electron-builder.config.js` to include `backend/node_modules` in `extraResources`:

```javascript
extraResources: [
  {
    from: backendDist,
    to: 'backend/dist',
    filter: ['**/*'],
  },
  {
    from: backendPackageJson,
    to: 'backend',
  },
  {
    from: path.join(backendRoot, 'node_modules'),
    to: 'backend/node_modules',
    filter: [
      '**/*',
      // Exclude unnecessary files to reduce size
      '!**/*.md',
      '!**/*.ts',
      '!**/*.map',
      '!**/test/**',
      '!**/tests/**',
      '!**/*.test.*',
      '!**/*.spec.*',
      '!**/.cache/**',
      '!**/.git/**',
    ],
  },
],
```

## What This Does

1. **Copies backend/dist** - The compiled JavaScript files
2. **Copies backend/package.json** - Needed for dependency resolution
3. **Copies backend/node_modules** - All backend dependencies (express, pg, etc.)

## Expected Structure After Build

```
resources/
├── app.asar
├── app-update.yml
├── elevate.exe
└── backend/
    ├── dist/
    │   ├── app.js
    │   └── ... (compiled files)
    ├── package.json
    └── node_modules/    ← NEW! This is what was missing
        ├── express/
        ├── pg/
        ├── cors/
        └── ... (all dependencies)
```

## Next Steps

### 1. Rebuild the Installer
```bash
cd frontend
npm run electron:build:win
```

**Note:** This will take longer because it's copying `node_modules` (can be 100-200MB).

### 2. Verify After Build
Check that node_modules is included:
```bash
dir dist\win-unpacked\resources\backend\node_modules
```

You should see folders like:
- `express/`
- `pg/`
- `cors/`
- etc.

### 3. Install and Test
After rebuilding:
1. Install the new `.exe` file
2. Launch the app
3. Should no longer show "Cannot find module 'express'" error

## Size Consideration

Including `node_modules` will increase the installer size significantly:
- **Before:** ~100MB
- **After:** ~200-300MB (depending on dependencies)

This is normal for Electron apps that bundle Node.js backends.

## Alternative (Advanced)

If you want to reduce size, you could:
1. Use `pkg` or `nexe` to bundle the backend into a single executable
2. Use webpack to bundle backend dependencies
3. Use `npm prune --production` to remove dev dependencies first

But for now, including `node_modules` is the simplest and most reliable solution.

