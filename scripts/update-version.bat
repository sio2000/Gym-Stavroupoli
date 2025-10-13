@echo off
echo Ενημέρωση Έκδοσης για Play Store...

echo.
echo Τρέχουσα έκδοση στο package.json:
findstr /C:"\"version\"" package.json

echo.
echo Τρέχουσα έκδοση στο Android build.gradle:
findstr /C:"versionName" android\app\build.gradle

echo.
set /p new_version="Εισάγετε τη νέα έκδοση (π.χ. 1.1.0): "
if "%new_version%"=="" (
    echo ❌ Δεν εισήχθη έκδοση
    pause
    exit /b 1
)

set /p new_version_code="Εισάγετε το νέο version code (π.χ. 2): "
if "%new_version_code%"=="" (
    echo ❌ Δεν εισήχθη version code
    pause
    exit /b 1
)

echo.
echo Ενημέρωση package.json...
powershell -Command "(Get-Content package.json) -replace '\"version\": \"[^\"]*\"', '\"version\": \"%new_version%\"' | Set-Content package.json"

echo Ενημέρωση Android build.gradle...
powershell -Command "(Get-Content android\app\build.gradle) -replace 'versionName \"[^\"]*\"', 'versionName \"%new_version%\"' | Set-Content android\app\build.gradle"
powershell -Command "(Get-Content android\app\build.gradle) -replace 'versionCode [0-9]*', 'versionCode %new_version_code%' | Set-Content android\app\build.gradle"

echo.
echo ✅ Έκδοση ενημερώθηκε επιτυχώς!
echo.
echo Νέα έκδοση: %new_version%
echo Νέο version code: %new_version_code%

echo.
echo Τρέχουσα έκδοση στο package.json:
findstr /C:"\"version\"" package.json

echo.
echo Τρέχουσα έκδοση στο Android build.gradle:
findstr /C:"versionName" android\app\build.gradle
findstr /C:"versionCode" android\app\build.gradle

pause
