# Clear Build Instructions - Step by Step

## ✅ WHERE TO RUN THE COMMAND

**Run ALL commands in the FRONTEND directory:**
```bash
cd AwesomeInvoiceWeb\AwesomeInvoiceWeb\AwesomeInvoiceWeb\frontend
```

## 📋 COMPLETE BUILD PROCESS

### Step 1: Make Sure Backend is Built
```bash
# Go to backend directory
cd ..\backend

# Build the backend
npm run build

# Verify dist folder exists
dir dist\app.js
```

### Step 2: Go Back to Frontend
```bash
cd ..\frontend
```

### Step 3: Build Frontend
```bash
npm run build
```

### Step 4: Build Electron Main Process
```bash
npm run build:electron-main
```

### Step 5: Build Windows Installer (THIS IS THE KEY STEP)
```bash
npm run electron:build:win
```

## 🔍 VERIFY BACKEND WAS COPIED

After Step 5 completes, check:

```bash
dir dist\win-unpacked\resources
```

**You should see:**
- `app.asar`
- `app-update.yml`
- `elevate.exe`
- **`backend/`** ← This folder should exist!

If `backend/` is missing, the build didn't copy it. Check the build logs for errors.

## 🐛 TROUBLESHOOTING

### If backend folder is still missing:

1. **Check build logs** - Look for any errors about `extraResources`
2. **Verify paths exist:**
   ```bash
   # In frontend directory
   Test-Path "..\backend\dist\app.js"
   Test-Path "..\backend\node_modules\express"
   ```
   Both should return `True`

3. **Check electron-builder config:**
   The config file should have:
   ```javascript
   extraResources: [
     {
       from: backendDist,  // Should point to ../backend/dist
       to: 'backend/dist',
     },
     {
       from: backendPackageJson,  // Should point to ../backend/package.json
       to: 'backend',
     },
     {
       from: path.join(backendRoot, 'node_modules'),  // Should point to ../backend/node_modules
       to: 'backend/node_modules',
     },
   ],
   ```

## 📝 QUICK REFERENCE

**All commands run from:** `frontend/` directory

**Build command:** `npm run electron:build:win`

**Check result:** `dir dist\win-unpacked\resources\backend`

**Expected structure:**
```
dist/win-unpacked/resources/
├── app.asar
├── app-update.yml
├── elevate.exe
└── backend/          ← Should be here!
    ├── dist/
    ├── package.json
    └── node_modules/
```

