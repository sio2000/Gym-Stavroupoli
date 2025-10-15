#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Demo QR Codes Generator for GetFit App
Creates QR codes as PNG files for App Store review
"""

import qrcode
import os
from datetime import datetime

def create_qr_code(data, filename, description):
    """Create QR code and save as PNG"""
    print(f"Creating QR code: {description}")
    
    # Create QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save
    img.save(filename)
    print(f"OK - Saved: {filename}")

def main():
    print("Demo QR Codes for GetFit App")
    print("=" * 50)
    
    # Create directory if not exists
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
    
    # Create QR codes
    for code in demo_codes:
        create_qr_code(code['data'], code['filename'], code['description'])
    
    # Create README file
    readme_content = f"""# Generated Demo QR Codes for GetFit App

Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Files Generated:

1. **demo-qr-code-free-gym.png**
   - Data: GETFIT_DEMO_FREE_GYM_2025_10_15_USER_DEMO_001
   - Purpose: Demo QR for gym access

2. **demo-qr-code-pilates.png**
   - Data: GETFIT_DEMO_PILATES_2025_10_15_USER_DEMO_002
   - Purpose: Demo QR for Pilates class

3. **demo-qr-code-personal.png**
   - Data: GETFIT_DEMO_PERSONAL_2025_10_15_USER_DEMO_003
   - Purpose: Demo QR for personal training

4. **demo-qr-code-demo-url.png**
   - Data: https://getfitskg.com/demo?source=app-store-review
   - Purpose: QR that leads to demo page

## Instructions for Review Team:

1. Take screenshots of these QR codes
2. Open the GetFit app
3. Go to "Secretary Dashboard" section
4. Click "Start QR Scan" button
5. Scan one of the QR codes above
6. The app will display the scan result

## Submission Info:
- Submission ID: f58c026f-5090-4545-8f7e-11edec18fc99
- App Name: GetFit_Skg
- Developer: THEOCHARIS SIOZOS
- Status: Ready for App Store Review
"""
    
    with open('generated-qr-codes/README.md', 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print("\n" + "=" * 50)
    print("ALL QR CODES CREATED SUCCESSFULLY!")
    print("Files are in folder: generated-qr-codes/")
    print("Read README.md for instructions")
    print("=" * 50)

if __name__ == "__main__":
    try:
        main()
    except ImportError:
        print("Error: qrcode library not installed")
        print("Install with: pip install qrcode[pil]")
    except Exception as e:
        print(f"Error: {e}")
