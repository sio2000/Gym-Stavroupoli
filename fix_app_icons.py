#!/usr/bin/env python3
"""
Script to fix app icons by removing transparency and adding white background
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

# Paths
logo_path = "ios/App/App/public/logoapp.png"
ios_output_base = "ios/App/App/Assets.xcassets/AppIcon.appiconset"

# iOS app icon sizes
ios_icon_sizes = {
    "Icon-20.png": 20,
    "Icon-20@2x.png": 40,
    "Icon-20@2x-ipad.png": 40,
    "Icon-20@3x.png": 60,
    "Icon-29.png": 29,
    "Icon-29@2x.png": 58,
    "Icon-29@2x-ipad.png": 58,
    "Icon-29@3x.png": 87,
    "Icon-40.png": 40,
    "Icon-40@2x.png": 80,
    "Icon-40@2x-ipad.png": 80,
    "Icon-40@3x.png": 120,
    "Icon-60@2x.png": 120,
    "Icon-60@3x.png": 180,
    "Icon-76.png": 76,
    "Icon-76@2x.png": 152,
    "Icon-83.5@2x.png": 167,
    "Icon-1024.png": 1024,
}

def create_icon_with_white_background(logo_path, output_path, size):
    """Create an app icon with white background (no transparency)"""
    
    # Create square canvas with WHITE background (no transparency)
    icon = Image.new('RGB', (size, size), (255, 255, 255))
    
    # Open and resize logo
    logo = Image.open(logo_path).convert('RGBA')
    
    # Calculate logo size (85% of icon size for safe zone)
    logo_size = int(size * 0.85)
    
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
    
    # Convert to RGB and paste onto white background
    temp_img_rgb = Image.new('RGB', (size, size), (255, 255, 255))
    temp_img_rgb.paste(temp_img, (0, 0), temp_img)
    
    # Save as PNG (no transparency)
    temp_img_rgb.save(output_path, 'PNG', quality=95)
    print(f"Created: {output_path}")

def main():
    print("Fixing app icons - removing transparency and adding white background...\n")
    
    # Check if logo exists
    if not os.path.exists(logo_path):
        print(f"Error: Logo not found at {logo_path}")
        return
    
    print(f"Using logo: {logo_path}")
    
    # Create iOS icons with white background
    for filename, size in ios_icon_sizes.items():
        output_path = os.path.join(ios_output_base, filename)
        create_icon_with_white_background(logo_path, output_path, size)
    
    print("\nAll app icons fixed successfully!")
    print("Icons now have white background and no transparency - ready for App Store!")

if __name__ == "__main__":
    main()
