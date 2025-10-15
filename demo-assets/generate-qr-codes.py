#!/usr/bin/env python3
"""
Demo QR Codes Generator για GetFit App
Αυτό το script δημιουργεί τα QR codes ως PNG files για το App Store review
"""

import qrcode
import os
from datetime import datetime

def create_qr_code(data, filename, description):
    """Δημιουργεί QR code και το αποθηκεύει ως PNG"""
    print(f"Δημιουργία QR code: {description}")
    
    # Δημιουργία QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    # Δημιουργία εικόνας
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Αποθήκευση
    img.save(filename)
    print(f"OK - Αποθηκεύτηκε: {filename}")

def main():
    print("Demo QR Codes για GetFit App")
    print("=" * 50)
    
    # Δημιουργία φακέλου αν δεν υπάρχει
    if not os.path.exists('generated-qr-codes'):
        os.makedirs('generated-qr-codes')
    
    # Demo QR Code Data
    demo_codes = [
        {
            'data': 'GETFIT_DEMO_FREE_GYM_2025_10_15_USER_DEMO_001',
            'filename': 'generated-qr-codes/demo-qr-code-free-gym.png',
            'description': 'Free Gym Access Demo QR Code'
        },
        {
            'data': 'GETFIT_DEMO_PILATES_2025_10_15_USER_DEMO_002',
            'filename': 'generated-qr-codes/demo-qr-code-pilates.png',
            'description': 'Pilates Class Demo QR Code'
        },
        {
            'data': 'GETFIT_DEMO_PERSONAL_2025_10_15_USER_DEMO_003',
            'filename': 'generated-qr-codes/demo-qr-code-personal.png',
            'description': 'Personal Training Demo QR Code'
        },
        {
            'data': 'https://getfitskg.com/demo?source=app-store-review',
            'filename': 'generated-qr-codes/demo-qr-code-demo-url.png',
            'description': 'Demo URL QR Code'
        }
    ]
    
    # Δημιουργία QR codes
    for code in demo_codes:
        create_qr_code(code['data'], code['filename'], code['description'])
    
    # Δημιουργία README file
    readme_content = f"""# Generated Demo QR Codes για GetFit App

Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Files Generated:

1. **demo-qr-code-free-gym.png**
   - Data: GETFIT_DEMO_FREE_GYM_2025_10_15_USER_DEMO_001
   - Purpose: Demo QR για πρόσβαση στο γυμναστήριο

2. **demo-qr-code-pilates.png**
   - Data: GETFIT_DEMO_PILATES_2025_10_15_USER_DEMO_002
   - Purpose: Demo QR για Pilates τάξη

3. **demo-qr-code-personal.png**
   - Data: GETFIT_DEMO_PERSONAL_2025_10_15_USER_DEMO_003
   - Purpose: Demo QR για προσωπική προπόνηση

4. **demo-qr-code-demo-url.png**
   - Data: https://getfitskg.com/demo?source=app-store-review
   - Purpose: QR που οδηγεί σε demo page

## Οδηγίες για το Review Team:

1. Κάντε screenshot αυτών των QR codes
2. Ανοίξτε την εφαρμογή GetFit
3. Πηγαίνετε στην ενότητα "Secretary Dashboard"
4. Κάντε κλικ στο κουμπί "Έναρξη Σάρωσης QR"
5. Σαρώστε έναν από τους QR codes παραπάνω
6. Η εφαρμογή θα εμφανίσει το αποτέλεσμα της σάρωσης

## Submission Info:
- Submission ID: f58c026f-5090-4545-8f7e-11edec18fc99
- App Name: GetFit_Skg
- Developer: THEOCHARIS SIOZOS
- Status: Ready for App Store Review
"""
    
    with open('generated-qr-codes/README.md', 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print("\n" + "=" * 50)
    print("ΟΛΑ ΤΑ QR CODES ΔΗΜΙΟΥΡΓΗΘΗΚΑΝ ΕΠΙΤΥΧΩΣ!")
    print("Βρίσκονται στον φάκελο: generated-qr-codes/")
    print("Διαβάστε το README.md για οδηγίες")
    print("=" * 50)

if __name__ == "__main__":
    try:
        main()
    except ImportError:
        print("Σφάλμα: Το qrcode library δεν είναι εγκατεστημένο")
        print("Εγκαταστήστε το με: pip install qrcode[pil]")
    except Exception as e:
        print(f"Σφάλμα: {e}")
