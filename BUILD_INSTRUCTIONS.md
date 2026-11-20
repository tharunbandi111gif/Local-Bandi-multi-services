# Local Bandi Multi Services — 5 Standalone Apps Build & Google Play Console Guide

This repository contains the enterprise ecosystem for **Local Bandi Multi Services**, operating on the production domain **`https://localbandimultiservices.in`** with a unified secure Node.js backend, central Firestore database, Cashfree Payment Gateway, and Firebase Authentication.

---

## 1. The 5 Standalone Applications

Each application functions as an independent standalone app with its own dedicated HTML entry point, PWA manifest, service worker, and Android package identifier:

| App # | Application Name | Target Role | Production Web Link | Manifest | Package ID (Google Play) | Google Play Store Link |
|---|---|---|---|---|---|---|
| **1** | **Customer App** | End-consumers (Food, Grocery, Hospital OPD, Services) | `https://localbandimultiservices.in/` | `/manifest.json` | `com.localbandi.customer` | [Customer on Play Store](https://play.google.com/store/apps/details?id=com.localbandi.customer) |
| **2** | **Vendor & Merchant App** | Store & Restaurant Owners | `https://localbandimultiservices.in/vendor.html` | `/manifest-vendor.json` | `com.localbandi.vendor` | [Vendor Hub on Play Store](https://play.google.com/store/apps/details?id=com.localbandi.vendor) |
| **3** | **Delivery Partner App** | Delivery Fleet Riders | `https://localbandimultiservices.in/delivery.html` | `/manifest-delivery.json` | `com.localbandi.delivery` | [Rider Partner on Play Store](https://play.google.com/store/apps/details?id=com.localbandi.delivery) |
| **4** | **Branch Admin App** | Regional Franchise & Hub Managers | `https://localbandimultiservices.in/branch-admin.html` | `/manifest-branch.json` | `com.localbandi.branchadmin` | [Branch Admin on Play Store](https://play.google.com/store/apps/details?id=com.localbandi.branchadmin) |
| **5** | **Master Admin Console** | Executive Command & Tarun Bandi | `https://localbandimultiservices.in/admin.html` | `/manifest-admin.json` | `com.localbandi.masteradmin` | [Master Console on Play Store](https://play.google.com/store/apps/details?id=com.localbandi.masteradmin) |

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
   - **Customer App**: [Generate Customer APK](https://www.pwabuilder.com?site=https%3A%2F%2Flocalbandimultiservices.in%2F)
   - **Vendor App**: [Generate Vendor APK](https://www.pwabuilder.com?site=https%3A%2F%2Flocalbandimultiservices.in%2Fvendor.html)
   - **Delivery Partner App**: [Generate Delivery APK](https://www.pwabuilder.com?site=https%3A%2F%2Flocalbandimultiservices.in%2Fdelivery.html)
   - **Branch Admin App**: [Generate Branch Admin APK](https://www.pwabuilder.com?site=https%3A%2F%2Flocalbandimultiservices.in%2Fbranch-admin.html)
   - **Master Admin App**: [Generate Master Admin APK](https://www.pwabuilder.com?site=https%3A%2F%2Flocalbandimultiservices.in%2Fadmin.html)
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
bubblewrap init --manifest="https://localbandimultiservices.in/manifest.json"
bubblewrap build
```

**Vendor App:**
```bash
mkdir -p build-vendor && cd build-vendor
bubblewrap init --manifest="https://localbandimultiservices.in/manifest-vendor.json"
bubblewrap build
```

**Delivery Partner App:**
```bash
mkdir -p build-delivery && cd build-delivery
bubblewrap init --manifest="https://localbandimultiservices.in/manifest-delivery.json"
bubblewrap build
```

**Branch Admin App:**
```bash
mkdir -p build-branch && cd build-branch
bubblewrap init --manifest="https://localbandimultiservices.in/manifest-branch.json"
bubblewrap build
```

**Master Admin App:**
```bash
mkdir -p build-admin && cd build-admin
bubblewrap init --manifest="https://localbandimultiservices.in/manifest-admin.json"
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
   - The central server automatically serves `https://localbandimultiservices.in/.well-known/assetlinks.json` with the SHA-256 fingerprint matching your release keys, ensuring the app opens in full-screen standalone mode without any browser URL bar.
- Master Admin Console: `http://localhost:3000/admin.html`

## 4. Android Native Gradle Build (Local or CI/CD)

The native Android Gradle project in `./android` is already configured with 5 product flavors matching all 5 standalone application IDs.

To build all 5 production App Bundles (`.aab`) and release APKs in one command:
```bash
# Build all 5 standalone AAB bundles and APKs
npm run bundle:all
# Or run the script directly:
bash android/build-all-apks.sh
```

To build individual App Bundles (`.aab`) for each app:
```bash
# 1. Customer App Bundle (com.localbandi.customer)
npm run bundle:customer
# Output: android/app/build/outputs/bundle/customerRelease/app-customer-release.aab

# 2. Vendor Partner App Bundle (com.localbandi.vendor)
npm run bundle:vendor
# Output: android/app/build/outputs/bundle/vendorRelease/app-vendor-release.aab

# 3. Delivery Partner App Bundle (com.localbandi.delivery)
npm run bundle:delivery
# Output: android/app/build/outputs/bundle/deliveryRelease/app-delivery-release.aab

# 4. Branch Admin App Bundle (com.localbandi.branchadmin)
npm run bundle:branch
# Output: android/app/build/outputs/bundle/branchadminRelease/app-branchadmin-release.aab

# 5. Master Admin Console Bundle (com.localbandi.masteradmin)
npm run bundle:admin
# Output: android/app/build/outputs/bundle/masteradminRelease/app-masteradmin-release.aab
```

---

## 5. Google Play Console Upload & Production Release Steps

To publish all five apps and get live separate Google Play Store links:

1. **Log into Google Play Console**: [https://play.google.com/console](https://play.google.com/console)
2. **Create 5 Separate Applications**:
   Click **Create app** for each of the 5 apps:
   - App 1: Name: **Local Bandi - Fast Hyperlocal** | Package: `com.localbandi.customer`
   - App 2: Name: **Local Bandi Vendor Hub** | Package: `com.localbandi.vendor`
   - App 3: Name: **Local Bandi Delivery Partner** | Package: `com.localbandi.delivery`
   - App 4: Name: **Local Bandi Branch Admin** | Package: `com.localbandi.branchadmin`
   - App 5: Name: **Local Bandi Master Admin Console** | Package: `com.localbandi.masteradmin`
3. **Upload the Respective App Bundle (`.aab`)**:
   - Go to **Production** (or **Closed testing** / **Internal testing**) > **Create new release**.
   - Drag and drop the corresponding `.aab` bundle file generated from Gradle or PWABuilder.
   - Enter release notes (e.g., `v1.0.0 Production Release`).
4. **Complete Store Listing Information**:
   - App Title, Short Description (80 characters), Full Description (up to 4,000 characters) — copyable directly from the Master Admin **APK & Play Store Hub** (`/admin.html`).
   - App Category, Content Rating Questionnaire (PEGI 3 / Everyone).
   - Dedicated Privacy Policy URL (`/privacy-customer.html`, `/privacy-vendor.html`, `/privacy-delivery.html`, `/privacy-branch.html`, `/privacy-admin.html`).
5. **Review and Roll Out**:
   - Submit for Google review. Once reviewed and approved by Google Play, each app will become live on its own unique Google Play Store link:
     - `https://play.google.com/store/apps/details?id=com.localbandi.customer`
     - `https://play.google.com/store/apps/details?id=com.localbandi.vendor`
     - `https://play.google.com/store/apps/details?id=com.localbandi.delivery`
     - `https://play.google.com/store/apps/details?id=com.localbandi.branchadmin`
     - `https://play.google.com/store/apps/details?id=com.localbandi.masteradmin`
