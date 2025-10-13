@echo off
echo Ρύθμιση gradle.properties για Release Build...

REM Ελέγχουμε αν υπάρχει το gradle.properties
if not exist "android\gradle.properties" (
    echo ❌ Δεν βρέθηκε το gradle.properties!
    echo Το αρχείο πρέπει να υπάρχει στο android/gradle.properties
    pause
    exit /b 1
)

echo.
echo Δημιουργία backup του gradle.properties...
copy "android\gradle.properties" "android\gradle.properties.backup"

echo.
echo Προσθήκη signing properties στο gradle.properties...

REM Διαβάζουμε το υπάρχον αρχείο και προσθέτουμε τις νέες γραμμές
echo. >> android\gradle.properties
echo # Release signing configuration >> android\gradle.properties
echo MYAPP_RELEASE_STORE_FILE=getfit-release-key.keystore >> android\gradle.properties
echo MYAPP_RELEASE_KEY_ALIAS=getfit >> android\gradle.properties
echo MYAPP_RELEASE_STORE_PASSWORD=your_store_password >> android\gradle.properties
echo MYAPP_RELEASE_KEY_PASSWORD=your_key_password >> android\gradle.properties

echo.
echo ✅ Signing properties προστέθηκαν στο gradle.properties!
echo.
echo ⚠️  ΣΗΜΑΝΤΙΚΟ: Αλλάξτε τα passwords στο android/gradle.properties
echo.

pause
