@echo off
echo Διόρθωση build.gradle για Release Build...

REM Δημιουργία backup
copy "android\app\build.gradle" "android\app\build.gradle.backup"

echo.
echo Ενημέρωση build.gradle με signing config...

REM Διαβάζουμε το υπάρχον αρχείο και προσθέτουμε το signing config
powershell -Command "$content = Get-Content 'android\app\build.gradle' -Raw; $content = $content -replace '    }', '    }`n    signingConfigs {`n        release {`n            if (project.hasProperty(''MYAPP_RELEASE_STORE_FILE'')) {`n                storeFile file(MYAPP_RELEASE_STORE_FILE)`n                storePassword MYAPP_RELEASE_STORE_PASSWORD`n                keyAlias MYAPP_RELEASE_KEY_ALIAS`n                keyPassword MYAPP_RELEASE_KEY_PASSWORD`n            }`n        }`n    }'; $content = $content -replace '        release {', '        release {`n            signingConfig signingConfigs.release`n            minifyEnabled true'; Set-Content 'android\app\build.gradle' $content"

echo.
echo ✅ build.gradle ενημερώθηκε επιτυχώς!
echo.
echo Το backup βρίσκεται στο: android\app\build.gradle.backup

pause
