@echo off
echo Building GetFit για Google Play Store...

echo.
echo Βήμα 1: Build web assets...
call npm run build:mobile
if %errorlevel% neq 0 (
    echo ❌ Σφάλμα στο build web assets
    pause
    exit /b 1
)

echo.
echo Βήμα 2: Sync με Capacitor...
call npm run cap:sync:android
if %errorlevel% neq 0 (
    echo ❌ Σφάλμα στο Capacitor sync
    pause
    exit /b 1
)

echo.
echo Βήμα 3: Μεταβαίνουμε στον φάκελο android...
cd android

echo.
echo Βήμα 4: Clean previous builds...
call gradlew clean
if %errorlevel% neq 0 (
    echo ❌ Σφάλμα στο clean
    pause
    exit /b 1
)

echo.
echo Βήμα 5: Build Android App Bundle (AAB)...
call gradlew bundleRelease
if %errorlevel% neq 0 (
    echo ❌ Σφάλμα στο build AAB
    pause
    exit /b 1
)

echo.
echo ✅ Build ολοκληρώθηκε επιτυχώς!
echo.
echo Το AAB βρίσκεται στο:
echo android\app\build\outputs\bundle\release\app-release.aab
echo.
echo Μπορείτε τώρα να το ανεβάσετε στο Google Play Console!

pause
