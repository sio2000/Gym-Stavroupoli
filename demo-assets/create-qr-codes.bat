@echo off
echo ========================================
echo Demo QR Codes για GetFit App
echo ========================================
echo.

REM Create directory for generated QR codes
if not exist "generated-qr-codes" mkdir "generated-qr-codes"

echo Δημιουργία QR codes με Python...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python δεν είναι εγκατεστημένο!
    echo 💡 Εγκαταστήστε Python από: https://python.org
    echo.
    echo Αυτόματα άνοιγμα HTML file...
    start create-qr-codes-100-working.html
    pause
    exit /b 1
)

REM Install qrcode library if not available
echo Έλεγχος για qrcode library...
python -c "import qrcode" >nul 2>&1
if errorlevel 1 (
    echo Εγκατάσταση qrcode library...
    pip install qrcode[pil]
)

REM Generate QR codes using Python script
echo.
echo Δημιουργία QR codes...
python generate-qr-codes.py

echo.
echo ========================================
echo ✅ ΕΠΙΤΥΧΙΑ!
echo ========================================
echo.
echo Τα QR codes δημιουργήθηκαν επιτυχώς!
echo Βρίσκονται στον φάκελο: generated-qr-codes/
echo.
echo Τώρα θα ανοίξει το HTML file για κατέβασμα...
echo.
pause

REM Open the HTML file
start create-qr-codes-100-working.html

REM Open the generated folder
start generated-qr-codes

echo.
echo Πατήστε οποιοδήποτε κουμπί για έξοδο...
pause >nul
