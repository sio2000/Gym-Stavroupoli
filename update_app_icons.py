#!/usr/bin/env python3
"""
Script to update app icons using logoapp.png for both Android and iOS
"""

try:
    from PIL import Image, ImageDraw
    import os
    import shutil
except ImportError:
    print("Installing required package: Pillow")
    import subprocess
    subprocess.check_call(["pip", "install", "Pillow"])
    from PIL import Image, ImageDraw
    import os
    import shutil

# Paths
logo_path = "ios/App/App/public/logoapp.png"
android_output_base = "android/app/src/main/res"
ios_output_base = "ios/App/App/Assets.xcassets/AppIcon.appiconset"

# Android app icon sizes for different densities
android_icon_sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

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

def create_icon(logo_path, output_path, size, bg_color=None):
    """Create an app icon with centered logo"""
    
    # Create square canvas with transparent background
    icon = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    
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
    
    # Paste logo onto icon
    icon.paste(logo, (x, y), logo)
    
    # Save as PNG
    icon.save(output_path, 'PNG', quality=95)
    print(f"Created: {output_path}")

def create_android_icons():
    """Create Android app icons"""
    print("Creating Android app icons...")
    
    for folder, size in android_icon_sizes.items():
        output_dir = os.path.join(android_output_base, folder)
        os.makedirs(output_dir, exist_ok=True)
        
        # Create ic_launcher.png
        output_path = os.path.join(output_dir, "ic_launcher.png")
        create_icon(logo_path, output_path, size)
        
        # Create ic_launcher_round.png (same as ic_launcher for now)
        output_path_round = os.path.join(output_dir, "ic_launcher_round.png")
        create_icon(logo_path, output_path_round, size)
        
        # Create ic_launcher_foreground.png for adaptive icons
        output_path_foreground = os.path.join(output_dir, "ic_launcher_foreground.png")
        create_icon(logo_path, output_path_foreground, size)

def create_ios_icons():
    """Create iOS app icons"""
    print("Creating iOS app icons...")
    
    for filename, size in ios_icon_sizes.items():
        output_path = os.path.join(ios_output_base, filename)
        create_icon(logo_path, output_path, size)

def main():
    print("Updating app icons for GetFit app using logoapp.png...\n")
    
    # Check if logo exists
    if not os.path.exists(logo_path):
        print(f"Error: Logo not found at {logo_path}")
        return
    
    print(f"Using logo: {logo_path}")
    
    # Create Android icons
    create_android_icons()
    
    # Create iOS icons
    create_ios_icons()
    
    print("\nAll app icons updated successfully!")
    print("\nNext steps:")
    print("1. Run: npx cap sync")
    print("2. For Android: cd android && .\\gradlew assembleRelease")
    print("3. For iOS: Open Xcode and build the project")
    print("4. Upload new build to App Store Connect")
    print("\nYour app will now have the correct logo!")

if __name__ == "__main__":
    main()
