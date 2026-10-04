# Local Bandi Multi Services — 5 Standalone Apps Build & Google Play Console Guide

This repository contains the enterprise ecosystem for **Local Bandi Multi Services**, operating on the production domain **`https://localbundimultiservices.in`** with a unified secure Node.js backend, central Firestore database, Cashfree Payment Gateway, and Firebase Authentication.

---

## 1. The 5 Standalone Applications

Each application functions as an independent standalone app with its own dedicated HTML entry point, PWA manifest, service worker, and Android package identifier:

| App # | Application Name | Target Role | Production Web Link | Manifest | Package ID (Google Play) |
|---|---|---|---|---|---|
| **1** | **Customer App** | End-consumers (Food, Grocery, Hospital OPD, Services) | `https://localbundimultiservices.in/` | `/manifest.json` | `com.localbandi.customer` |
| **2** | **Vendor & Merchant App** | Store & Restaurant Owners | `https://localbundimultiservices.in/vendor.html` | `/manifest-vendor.json` | `com.localbandi.vendor` |
| **3** | **Delivery Partner App** | Delivery Fleet Riders | `https://localbundimultiservices.in/delivery.html` | `/manifest-delivery.json` | `com.localbandi.delivery` |
| **4** | **Branch Admin App** | Regional Franchise & Hub Managers | `https://localbundimultiservices.in/branch-admin.html` | `/manifest-branch.json` | `com.localbandi.branch` |
| **5** | **Master Admin Console** | Executive Command & Tarun Bandi | `https://localbundimultiservices.in/admin.html` | `/manifest-admin.json` | `com.localbandi.admin` |

---

## 2. Web Build & Compilation

### Universal Multi-App Compilation (All 5 Apps)
To compile all 5 standalone entry points into the optimized `dist/` directory:
```bash
npm run build
```
This runs Vite multi-page Rollup compilation and outputs:
- `dist/index.html` (Customer App)
- `dist/vendor.html` (Vendor App)
- `dist/delivery.html` (Delivery Partner App)
- `dist/branch-admin.html` (Branch Admin App)
- `dist/admin.html` (Master Admin App)
- All manifest JSON files, icons, and `sw.js` copied to `dist/`

---

## 3. Generating Android APKs & AABs for Google Play Console

You have 3 official methods to produce signed Android Application Bundles (`.aab`) and installable (`.apk`) packages for Google Play Console:

### Method A: 1-Click Cloud APK Builder (Microsoft PWABuilder - Fastest)

1. Open the PWABuilder direct link for the app you wish to package:
   - **Customer App**: [Generate Customer APK](https://www.pwabuilder.com?site=https%3A%2F%2Flocalbundimultiservices.in%2F)
   - **Vendor App**: [Generate Vendor APK](https://www.pwabuilder.com?site=https%3A%2F%2Flocalbundimultiservices.in%2Fvendor.html)
   - **Delivery Partner App**: [Generate Delivery APK](https://www.pwabuilder.com?site=https%3A%2F%2Flocalbundimultiservices.in%2Fdelivery.html)
   - **Branch Admin App**: [Generate Branch Admin APK](https://www.pwabuilder.com?site=https%3A%2F%2Flocalbundimultiservices.in%2Fbranch-admin.html)
   - **Master Admin App**: [Generate Master Admin APK](https://www.pwabuilder.com?site=https%3A%2F%2Flocalbundimultiservices.in%2Fadmin.html)
2. Click **Package for Android**.
3. Set the **Package ID** matching the table above (e.g., `com.localbandi.customer`).
4. Set the app name, launcher icons, and signing key details.
5. Click **Download Package** to receive the ready `.aab` (for Play Store) and `.apk` (for direct testing).

---

### Method B: Google Bubblewrap CLI (Official Google Tool)

Google Bubblewrap uses Trusted Web Activity (TWA) to compile production Android binaries directly from the terminal.

#### 1. Install Bubblewrap CLI
```bash
npm install -g @bubblewrap/cli
```

#### 2. Initialize and Build Each App

**Customer App:**
```bash
mkdir -p build-customer && cd build-customer
bubblewrap init --manifest="https://localbundimultiservices.in/manifest.json"
bubblewrap build
```

**Vendor App:**
```bash
mkdir -p build-vendor && cd build-vendor
bubblewrap init --manifest="https://localbundimultiservices.in/manifest-vendor.json"
bubblewrap build
```

**Delivery Partner App:**
```bash
mkdir -p build-delivery && cd build-delivery
bubblewrap init --manifest="https://localbundimultiservices.in/manifest-delivery.json"
bubblewrap build
```

**Branch Admin App:**
```bash
mkdir -p build-branch && cd build-branch
bubblewrap init --manifest="https://localbundimultiservices.in/manifest-branch.json"
bubblewrap build
```

**Master Admin App:**
```bash
mkdir -p build-admin && cd build-admin
bubblewrap init --manifest="https://localbundimultiservices.in/manifest-admin.json"
bubblewrap build
```

---

## 4. Google Play Console Upload & Testing Steps

1. **Log in to Google Play Console**: [https://play.google.com/console](https://play.google.com/console)
2. **Create New App**:
   - Enter App Name (e.g., "Local Bandi - Customer App" or "Local Bandi Delivery Partner")
   - Default language: English (India)
   - App or game: App
   - Free or paid: Free
3. **Internal / Closed Testing Track**:
   - Navigate to **Testing** > **Internal testing** (or **Closed testing**).
   - Click **Create new release**.
   - Upload the generated `.aab` file from PWABuilder or Bubblewrap.
   - Enter release notes and save.
4. **Testers & Sharing**:
   - Add tester email addresses (e.g. `tharunbandi111@gmail.com`).
   - Copy the Play Store internal test link and open it on an Android device to install.
5. **Digital Asset Links Verification**:
   - The central server automatically serves `https://localbundimultiservices.in/.well-known/assetlinks.json` with the SHA-256 fingerprint matching your release keys, ensuring the app opens in full-screen standalone mode without any browser URL bar.
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
