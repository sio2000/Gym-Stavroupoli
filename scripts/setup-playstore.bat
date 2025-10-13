@echo off
title GetFit - Setup για Google Play Store

echo ========================================
echo    GetFit - Setup για Google Play Store
echo ========================================
echo.

echo Αυτό το script θα σας βοηθήσει να προετοιμάσετε την εφαρμογή
echo GetFit για δημοσίευση στο Google Play Store.
echo.

echo Βήματα που θα εκτελεστούν:
echo 1. Δημιουργία Release Keystore
echo 2. Ρύθμιση Signing Config
echo 3. Ρύθμιση Gradle Properties
echo 4. Προετοιμασία Assets
echo 5. Build για Play Store
echo.

set /p continue="Θέλετε να συνεχίσετε; (Y/N): "
if /i not "%continue%"=="Y" (
    echo Ακυρώθηκε από τον χρήστη.
    pause
    exit /b 0
)

echo.
echo ========================================
echo Βήμα 1: Δημιουργία Release Keystore
echo ========================================
call scripts\create-release-keystore.bat
if %errorlevel% neq 0 (
    echo ❌ Σφάλμα στη δημιουργία keystore
    pause
    exit /b 1
)

echo.
echo ========================================
echo Βήμα 2: Ρύθμιση Signing Config
echo ========================================
call scripts\setup-signing-config.bat
if %errorlevel% neq 0 (
    echo ❌ Σφάλμα στη ρύθμιση signing config
    pause
    exit /b 1
)

echo.
echo ========================================
echo Βήμα 3: Ρύθμιση Gradle Properties
echo ========================================
call scripts\setup-gradle-properties.bat
if %errorlevel% neq 0 (
    echo ❌ Σφάλμα στη ρύθμιση gradle properties
    pause
    exit /b 1
)

echo.
echo ========================================
echo Βήμα 4: Προετοιμασία Assets
echo ========================================
call scripts\prepare-playstore-assets.bat
if %errorlevel% neq 0 (
    echo ❌ Σφάλμα στην προετοιμασία assets
    pause
    exit /b 1
)

echo.
echo ========================================
echo Βήμα 5: Build για Play Store
echo ========================================
set /p build_now="Θέλετε να κάνετε build τώρα; (Y/N): "
if /i "%build_now%"=="Y" (
    call scripts\build-for-playstore.bat
    if %errorlevel% neq 0 (
        echo ❌ Σφάλμα στο build
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo ✅ ΟΛΟΚΛΗΡΩΜΕΝΟ!
echo ========================================
echo.
echo Η εφαρμογή GetFit είναι έτοιμη για το Google Play Store!
echo.
echo Επόμενα βήματα:
echo 1. Αλλάξτε τα passwords στο android/key.properties και android/gradle.properties
echo 2. Προετοιμάστε τα assets (εικόνες, screenshots) στο φάκελο playstore-assets/
echo 3. Εκτελέστε το scripts\build-for-playstore.bat για να δημιουργήσετε το AAB
echo 4. Ανεβάστε το AAB στο Google Play Console
echo.
echo Για περισσότερες λεπτομέρειες, διαβάστε το PLAYSTORE_PUBLISHING_GUIDE.md
echo.

pause
