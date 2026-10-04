#!/usr/bin/env bash
# ==============================================================================
# LOCAL BANDI MULTI SERVICES - 5 STANDALONE APPS BUILD PIPELINE
# Generates independent APKs and AAB packages for:
# 1. Local Bandi Customer App       (com.localbandi.customer)
# 2. Local Bandi Vendor App         (com.localbandi.vendor)
# 3. Local Bandi Delivery Partner   (com.localbandi.delivery)
# 4. Local Bandi Branch Admin       (com.localbandi.branchadmin)
# 5. Local Bandi Master Admin       (com.localbandi.masteradmin)
# ==============================================================================

set -e

echo "======================================================="
echo "Building Vite Production Web Assets..."
echo "======================================================="
cd "$(dirname "$0")/.."
npm run build

echo "======================================================="
echo "Synchronizing Capacitor Android assets..."
echo "======================================================="
npx cap sync android || true

cd android

echo "======================================================="
echo "Building 5 Standalone APKs (Release & Debug)..."
echo "======================================================="
./gradlew assembleCustomerRelease assembleCustomerDebug
./gradlew assembleVendorRelease assembleVendorDebug
./gradlew assembleDeliveryRelease assembleDeliveryDebug
./gradlew assembleBranchadminRelease assembleBranchadminDebug
./gradlew assembleMasteradminRelease assembleMasteradminDebug

echo "======================================================="
echo "Building 5 Standalone AABs (Android App Bundles)..."
echo "======================================================="
./gradlew bundleCustomerRelease
./gradlew bundleVendorRelease
./gradlew bundleDeliveryRelease
./gradlew bundleBranchadminRelease
./gradlew bundleMasteradminRelease

echo "======================================================="
echo "Build complete! All 5 Standalone APKs & AABs generated."
echo "======================================================="
