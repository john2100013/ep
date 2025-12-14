# Backend Not Being Copied - Fix

## Problem
The backend folder is not being copied to `resources/backend` during the Electron build, causing "Backend Not Found" error.

## Root Cause
The `extraResources` configuration in `electron-builder.config.js` was using relative paths that might not resolve correctly during the build process.

## Solution Applied

### 1. Fixed Path Resolution
Changed from relative paths to absolute paths using `path.resolve(__dirname, ...)`:

```javascript
extraResources: [
  {
    from: path.resolve(__dirname, '../backend/dist'),
    to: 'backend/dist',
    filter: ['**/*'],
  },
  {
    from: path.resolve(__dirname, '../backend/package.json'),
    to: 'backend',
  },
],
```

### 2. Verified Backend Structure
- ✅ `backend/dist/app.js` exists
- ✅ `backend/package.json` exists
- ✅ Backend is built before Electron packaging

## Next Steps

### Rebuild the Installer
```bash
cd frontend
npm run electron:build:win
```

### Verify After Build
After building, check that the backend is included:
```bash
# Check unpacked build
dir dist\win-unpacked\resources\backend

# Should show:
# - backend/dist/ (folder with app.js)
# - backend/package.json
```

### Expected Structure After Build
```
resources/
├── app.asar
├── app-update.yml
├── elevate.exe
└── backend/          ← This should exist now!
    ├── dist/
    │   ├── app.js
    │   └── ... (other compiled files)
    └── package.json
```

## If Backend Still Not Copied

### Option 1: Check Build Logs
Look for any errors or warnings about `extraResources` in the build output.

### Option 2: Manual Verification
Before building, verify:
1. Backend is built: `cd ../backend && npm run build`
2. `backend/dist/app.js` exists
3. `backend/package.json` exists

### Option 3: Alternative Configuration
If absolute paths don't work, try using glob patterns:
```javascript
extraResources: [
  {
    from: '../backend/dist/**/*',
    to: 'backend/dist',
  },
]
```

## Testing
After rebuilding:
1. Install the new `.exe` file
2. Check `C:\Users\[YourUser]\AppData\Local\Programs\frontend\resources\backend` exists
3. Launch the app - should no longer show "Backend Not Found" error

