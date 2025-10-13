@echo off
echo Προετοιμασία Assets για Google Play Store...

REM Δημιουργούμε φάκελο για τα assets
if not exist "playstore-assets" mkdir playstore-assets
if not exist "playstore-assets\icons" mkdir playstore-assets\icons
if not exist "playstore-assets\screenshots" mkdir playstore-assets\screenshots
if not exist "playstore-assets\graphics" mkdir playstore-assets\graphics

echo.
echo ✅ Φάκελοι δημιουργήθηκαν:
echo   - playstore-assets/
echo   - playstore-assets/icons/
echo   - playstore-assets/screenshots/
echo   - playstore-assets/graphics/

echo.
echo 📋 Assets που χρειάζονται:

echo.
echo 🎯 APP ICON (Απαιτούμενο):
echo   - Μέγεθος: 512x512 pixels
echo   - Μορφή: PNG (χωρίς transparency)
echo   - Τοποθεσία: playstore-assets/icons/app-icon-512.png

echo.
echo 🖼️  FEATURE GRAPHIC (Απαιτούμενο):
echo   - Μέγεθος: 1024x500 pixels
echo   - Μορφή: PNG
echo   - Τοποθεσία: playstore-assets/graphics/feature-graphic-1024x500.png

echo.
echo 📱 SCREENSHOTS (Απαιτούμενο - 2-8 εικόνες):
echo   Phone Screenshots:
echo   - Aspect ratio: 16:9 ή 9:16
echo   - Min height: 320px
echo   - Τοποθεσία: playstore-assets/screenshots/phone/

echo.
echo   Tablet Screenshots (7" - Προαιρετικό):
echo   - Aspect ratio: 16:10 ή 10:16
echo   - Min height: 320px
echo   - Τοποθεσία: playstore-assets/screenshots/tablet-7/

echo.
echo   Tablet Screenshots (10" - Προαιρετικό):
echo   - Aspect ratio: 16:10 ή 10:16
echo   - Min height: 320px
echo   - Τοποθεσία: playstore-assets/screenshots/tablet-10/

echo.
echo 📝 APP DESCRIPTION (Ελληνικά):
echo.
echo GetFit - Σύστημα Διαχείρισης Γυμναστηρίου
echo.
echo Η GetFit είναι μια σύγχρονη εφαρμογή διαχείρισης γυμναστηρίου που σας βοηθά να οργανώσετε τις προπονήσεις σας, να διαχειρίζεστε τη συνδρομή σας και να παρακολουθείτε την πρόοδό σας.
echo.
echo Χαρακτηριστικά:
echo • Διαχείριση συμμετοχής σε προπονήσεις
echo • QR Code σύστημα εισόδου
echo • Ημερολόγιο προπονήσεων
echo • Διαχείριση συνδρομών
echo • Σύστημα απουσιών
echo • Και πολλά άλλα...
echo.
echo Κατεβάστε τώρα και αρχίστε την πορεία σας προς μια υγιέστερη ζωή!

echo.
echo 💡 TIPS για Screenshots:
echo 1. Εμφανίστε τις κύριες λειτουργίες της εφαρμογής
echo 2. Χρησιμοποιήστε πραγματικά δεδομένα (όχι lorem ipsum)
echo 3. Βεβαιωθείτε ότι το κείμενο είναι ευανάγνωστο
echo 4. Εμφανίστε το logo/branding σας
echo 5. Χρησιμοποιήστε συνεπή styling

echo.
echo 📂 Όλα τα assets θα πρέπει να τοποθετηθούν στους αντίστοιχους φακέλους
echo    πριν από την ανέβασή τους στο Google Play Console.

pause
