@echo off
echo Ρύθμιση Signing Config για Release Build...

REM Ελέγχουμε αν υπάρχει το keystore
if not exist "android\getfit-release-key.keystore" (
    echo ❌ Δεν βρέθηκε το keystore!
    echo Εκτελέστε πρώτα το create-release-keystore.bat
    pause
    exit /b 1
)

REM Ελέγχουμε αν υπάρχει το key.properties
if not exist "android\key.properties" (
    echo ❌ Δεν βρέθηκε το key.properties!
    echo Εκτελέστε πρώτα το create-release-keystore.bat
    pause
    exit /b 1
)

echo.
echo Δημιουργία backup του build.gradle...
copy "android\app\build.gradle" "android\app\build.gradle.backup"

echo.
echo Προσθήκη signing config στο build.gradle...

REM Προσθέτουμε signing configs μετά το defaultConfig
powershell -Command "(Get-Content android\app\build.gradle) -replace '    }', '    }`n    signingConfigs {`n        release {`n            if (project.hasProperty(''MYAPP_RELEASE_STORE_FILE'')) {`n                storeFile file(MYAPP_RELEASE_STORE_FILE)`n                storePassword MYAPP_RELEASE_STORE_PASSWORD`n                keyAlias MYAPP_RELEASE_KEY_ALIAS`n                keyPassword MYAPP_RELEASE_KEY_PASSWORD`n            }`n        }`n    }' | Set-Content android\app\build.gradle"

REM Ενημερώνουμε το buildTypes release
powershell -Command "(Get-Content android\app\build.gradle) -replace '        release {', '        release {`n            signingConfig signingConfigs.release`n            minifyEnabled true' | Set-Content android\app\build.gradle"

echo.
echo ✅ Signing config προστέθηκε στο build.gradle!
echo.
echo ⚠️  ΣΗΜΑΝΤΙΚΟ: Ελέγξτε τα passwords στο android/key.properties
echo.

pause
