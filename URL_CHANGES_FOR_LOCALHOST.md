# URL Changes Documentation

This document tracks all backend URL configurations and changes between localhost and production environments.

## Summary
**Current Status: PRODUCTION URLs** ✅

All backend URLs are currently set to production: `https://erp-backend-beryl.vercel.app`

**Note:** Logs are always enabled for debugging purposes.

---

## Files Modified

### 1. `src/screens/BusinessSettingsScreen.tsx`

#### URL Configuration (Line ~62)
- **Current URL:** `https://erp-backend-beryl.vercel.app/api/business-settings`
- **Function:** `loadSettings()`
- **Purpose:** Fetches business settings from backend
- **Status:** ✅ Production URL

#### URL Configuration (Line ~181)
- **Current URL:** `https://erp-backend-beryl.vercel.app/api/business-settings`
- **Function:** `handleSave()`
- **Purpose:** Saves business settings to backend
- **Status:** ✅ Production URL

---

### 2. `src/screens/InvoiceListScreen.tsx`

#### URL Configuration (Line ~111)
- **Current URL:** `https://erp-backend-beryl.vercel.app/api/invoices`
- **Function:** `fetchInvoices()`
- **Purpose:** Fetches list of invoices from backend
- **Status:** ✅ Production URL

---

## Files That Use Environment Variables

These files use environment variables with production URLs as defaults:

1. **`src/services/api.ts`**
   - Uses: `import.meta.env.VITE_API_BASE_URL || 'https://erp-backend-beryl.vercel.app/api'`
   - **Status:** ✅ Production URL (default)
   - **Logs:** Always enabled for debugging

2. **`src/services/serviceBillingApi.ts`**
   - Uses: `import.meta.env.VITE_API_BASE_URL || 'https://erp-backend-beryl.vercel.app/api'`
   - **Status:** ✅ Production URL (default)

3. **`src/services/salonApi.ts`**
   - Uses the `api` instance from `api.ts`
   - **Status:** ✅ Production URL (inherited)

---

## How to Switch to Localhost for Development

### Option 1: Manual Change
Search and replace in the modified files:
- Find: `https://erp-backend-beryl.vercel.app`
- Replace: `http://localhost:3001`

### Option 2: Use Environment Variables (Recommended)
Use environment variables to switch between environments:

1. Create a `.env.local` file for local development:
   ```
   VITE_API_BASE_URL=http://localhost:3001/api
   ```

2. For production, use `.env.production`:
   ```
   VITE_API_BASE_URL=https://erp-backend-beryl.vercel.app/api
   ```

3. Update hardcoded fetch calls to use environment variables:
   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://erp-backend-beryl.vercel.app/api';
   const response = await fetch(`${API_BASE_URL}/business-settings`, {
   ```

---

## Quick Switch Commands

### Switch to Localhost (PowerShell):
```powershell
# Switch BusinessSettingsScreen.tsx
(Get-Content "src/screens/BusinessSettingsScreen.tsx") -replace "https://erp-backend-beryl.vercel.app", "http://localhost:3001" | Set-Content "src/screens/BusinessSettingsScreen.tsx"

# Switch InvoiceListScreen.tsx
(Get-Content "src/screens/InvoiceListScreen.tsx") -replace "https://erp-backend-beryl.vercel.app", "http://localhost:3001" | Set-Content "src/screens/InvoiceListScreen.tsx"
```

### Switch Back to Production (PowerShell):
```powershell
# Revert BusinessSettingsScreen.tsx
(Get-Content "src/screens/BusinessSettingsScreen.tsx") -replace "http://localhost:3001", "https://erp-backend-beryl.vercel.app" | Set-Content "src/screens/BusinessSettingsScreen.tsx"

# Revert InvoiceListScreen.tsx
(Get-Content "src/screens/InvoiceListScreen.tsx") -replace "http://localhost:3001", "https://erp-backend-beryl.vercel.app" | Set-Content "src/screens/InvoiceListScreen.tsx"
```

---

## Current Configuration Status

**Last Updated:** 2024-12-12

### Production URLs (Current)
- ✅ All URLs reverted to production: `https://erp-backend-beryl.vercel.app`
- ✅ Logs are always enabled for debugging
- ✅ API service defaults to production URL

### Notes
- **Logs:** Console logs are always enabled in `api.ts` for debugging purposes
- **Environment Variables:** API service files use environment variables with production as default
- **Hardcoded URLs:** `BusinessSettingsScreen.tsx` and `InvoiceListScreen.tsx` use hardcoded production URLs
- **Recommendation:** Consider refactoring hardcoded fetch calls to use the ApiService for consistency

