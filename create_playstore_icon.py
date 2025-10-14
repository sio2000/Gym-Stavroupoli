#!/usr/bin/env python3
"""
Script to create Play Store app icon (512x512) from existing logo
"""

try:
    from PIL import Image, ImageDraw
    import os
except ImportError:
    print("Installing required package: Pillow")
    import subprocess
    subprocess.check_call(["pip", "install", "Pillow"])
    from PIL import Image, ImageDraw
    import os

def create_playstore_icon(logo_path, output_path, size=512):
    """Create a 512x512 Play Store app icon from logo"""
    
    print(f"Creating Play Store icon from: {logo_path}")
    
    # Check if logo exists
    if not os.path.exists(logo_path):
        print(f"Error: Logo not found at {logo_path}")
        return False
    
    # Create square canvas with white background (Play Store requirement)
    icon = Image.new('RGB', (size, size), (255, 255, 255))
    
    try:
        # Open and convert logo
        logo = Image.open(logo_path).convert('RGBA')
        
        # Calculate logo size (80% of icon size for safe zone)
        logo_size = int(size * 0.8)
        
        # Resize logo maintaining aspect ratio
        logo_ratio = logo.width / logo.height
        if logo_ratio > 1:
            # Logo is wider
            logo_width = logo_size
            logo_height = int(logo_size / logo_ratio)
        else:
            # Logo is taller or square
            logo_height = logo_size
            logo_width = int(logo_size * logo_ratio)
        
        logo = logo.resize((logo_width, logo_height), Image.Resampling.LANCZOS)
        
        # Calculate position to center logo
        x = (size - logo_width) // 2
        y = (size - logo_height) // 2
        
        # Create a temporary image with the logo
        temp_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        temp_img.paste(logo, (x, y), logo)
        
        # Paste logo onto white background
        icon.paste(temp_img, (0, 0), temp_img)
        
        # Save as PNG (Play Store requirement)
        icon.save(output_path, 'PNG', quality=95)
        print(f"Created Play Store icon: {output_path}")
        
        # Show file info
        file_size = os.path.getsize(output_path)
        print(f"Size: {size}x{size} pixels")
        print(f"File size: {file_size / 1024:.1f} KB")
        
        return True
        
    except Exception as e:
        print(f"Error processing logo: {e}")
        return False

def main():
    print("Creating Play Store App Icon for GetFit\n")
    
    # Try different logo files - prioritizing logoapp.png
    logo_candidates = [
        "public/logoapp.png",
        "public/logo2.png", 
        "public/logo.png"
    ]
    
    logo_path = None
    for candidate in logo_candidates:
        if os.path.exists(candidate):
            logo_path = candidate
            break
    
    if not logo_path:
        print("No logo found! Please ensure you have one of these files:")
        for candidate in logo_candidates:
            print(f"   - {candidate}")
        return
    
    print(f"Using logo: {logo_path}")
    
    # Create output directory
    output_dir = "playstore-assets/icons"
    os.makedirs(output_dir, exist_ok=True)
    
    # Create Play Store icon
    output_path = os.path.join(output_dir, "app-icon-512.png")
    success = create_playstore_icon(logo_path, output_path)
    
    if success:
        print("\nSUCCESS!")
        print(f"Your Play Store icon is ready: {output_path}")
        print("\nNext steps:")
        print("1. Go to Google Play Console")
        print("2. Navigate to Store listing > App icon")
        print(f"3. Upload the file: {output_path}")
        print("4. The icon should be 512x512 pixels, PNG format")
        print("\nYour app will look great on the Play Store!")
    else:
        print("\nFailed to create Play Store icon")
        print("Please check your logo file and try again")

if __name__ == "__main__":
    main()
