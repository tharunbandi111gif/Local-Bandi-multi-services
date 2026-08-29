# Local Bandi Multi Services — Build & Deployment Instructions

This guide explains how to use the multi-page entry points defined in `vite.config.ts` to generate standalone or combined production builds for all 4 platforms:

1. **Customer App** (`com.localbandi.app`)
2. **Partner & Rider Hub** (`com.localbandi.partner`)
3. **Franchise App** (`com.localbandi.franchise`)
4. **Master Admin Console** (`com.localbandi.admin`)

---

## 1. Architecture & Multi-Page Entry Points

`vite.config.ts` uses Rollup's multi-input feature to compile four independent HTML documents into optimized bundles inside `dist/`:

```ts
// vite.config.ts
export default defineConfig({
  // ...
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),       // Customer App
        partner: path.resolve(__dirname, 'partner.html'),   // Partner & Rider Hub
        admin: path.resolve(__dirname, 'admin.html'),       // Master Admin Console
        franchise: path.resolve(__dirname, 'franchise.html'),// Franchise App
      }
    }
  }
});
```

---

## 2. Terminal Commands for Building

### A. Universal Multi-App Build (Default & Recommended)
Compiles all 4 applications simultaneously into a unified production distribution directory (`dist/`):
```bash
npm run build
# Or explicitly:
npx vite build
```

### B. Individual Targeted Production Builds

If you need to build or isolate specific applications, you can pass target inputs directly to the Vite CLI:

#### 1. Customer App Only
```bash
# Compiles index.html (Customer Storefront, Hospital OP, Real Estate & Food/Groceries)
npx vite build index.html
# Or using npm:
npm run build:customer
```
*Output File:* `dist/index.html` + associated chunk assets (`dist/assets/index-*.js`, `dist/assets/index-*.css`)
*PWA Manifest:* `/manifest.json`

#### 2. Partner & Rider Hub Only
```bash
# Compiles partner.html (Delivery Partner Dashboard, Store Merchant Console, Order Alerts)
npx vite build partner.html
# Or using npm:
npm run build:partner
```
*Output File:* `dist/partner.html` + associated chunk assets (`dist/assets/partner-*.js`, `dist/assets/partner-*.css`)
*PWA Manifest:* `/manifest-partner.json`

#### 3. Franchise App Only
```bash
# Compiles franchise.html (Regional Branch Console, Branch Settlement & Order Governance)
npx vite build franchise.html
# Or using npm:
npm run build:franchise
```
*Output File:* `dist/franchise.html` + associated chunk assets (`dist/assets/franchise-*.js`, `dist/assets/franchise-*.css`)
*PWA Manifest:* `/manifest-franchise.json`

#### 4. Master Admin Console Only
```bash
# Compiles admin.html (Tarun Bandi Command Center, Banner Slider Controls, Inventory & Financials)
npx vite build admin.html
# Or using npm:
npm run build:admin
```
*Output File:* `dist/admin.html` + associated chunk assets (`dist/assets/admin-*.js`, `dist/assets/admin-*.css`)
*PWA Manifest:* `/manifest-admin.json`

---

## 3. Previewing the Production Output

To run a local static preview server on port 3000 to verify all 4 portals:
```bash
npm run preview
```
Direct access routes in preview:
- Customer App: `http://localhost:3000/`
- Partner & Rider Hub: `http://localhost:3000/partner.html`
- Franchise App: `http://localhost:3000/franchise.html`
- Master Admin Console: `http://localhost:3000/admin.html`

---

## 4. Android APK & Capacitor Sync Commands

To package the built web assets into the Android native project:

```bash
# 1. Clean build
npm run build

# 2. Sync distribution assets and plugins to Android directory
npm run cap:sync
# Or:
npx cap sync android

# 3. Open in Android Studio to build signed release APK / AAB
npx cap open android
```

### Direct Cloud APK Generation (PWABuilder)
Each application can be compiled directly into a signed `.apk` without local Android Studio using Microsoft PWABuilder with the public app URL (`ais-pre-...`):
- **Customer App:** [Generate APK](https://www.pwabuilder.com?site=https%3A%2F%2Fais-pre-nrxv6weliaidu3roycbqtf-790133860415.asia-southeast1.run.app%2F)
- **Partner Hub:** [Generate APK](https://www.pwabuilder.com?site=https%3A%2F%2Fais-pre-nrxv6weliaidu3roycbqtf-790133860415.asia-southeast1.run.app%2Fpartner.html)
- **Franchise App:** [Generate APK](https://www.pwabuilder.com?site=https%3A%2F%2Fais-pre-nrxv6weliaidu3roycbqtf-790133860415.asia-southeast1.run.app%2Ffranchise.html)
- **Master Admin:** [Generate APK](https://www.pwabuilder.com?site=https%3A%2F%2Fais-pre-nrxv6weliaidu3roycbqtf-790133860415.asia-southeast1.run.app%2Fadmin.html)
