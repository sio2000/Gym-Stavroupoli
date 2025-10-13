@echo off
echo Δημιουργία Release Keystore για GetFit...

REM Μεταβαίνουμε στον φάκελο android
cd android

REM Δημιουργία του keystore
echo Δημιουργία keystore...
keytool -genkey -v -keystore getfit-release-key.keystore -alias getfit -keyalg RSA -keysize 2048 -validity 10000

REM Δημιουργία του αρχείου key.properties
echo Δημιουργία key.properties...
echo storePassword=your_store_password > key.properties
echo keyPassword=your_key_password >> key.properties
echo keyAlias=getfit >> key.properties
echo storeFile=getfit-release-key.keystore >> key.properties

echo.
echo ✅ Keystore δημιουργήθηκε επιτυχώς!
echo.
echo ⚠️  ΣΗΜΑΝΤΙΚΟ:
echo 1. Αλλάξτε τα passwords στο key.properties
echo 2. Μην κάνετε commit τα αρχεία keystore και key.properties
echo 3. Κρατήστε αντίγραφα ασφαλείας σε ασφαλή μέρος
echo.
echo Το keystore βρίσκεται στο: android/getfit-release-key.keystore
echo Το key.properties βρίσκεται στο: android/key.properties

pause
