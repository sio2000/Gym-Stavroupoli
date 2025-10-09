#!/usr/bin/env python3
"""
Script to create app icons from logo for Android app
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
logo_path = "public/logo.png"
output_base = "android/app/src/main/res"

# App icon sizes for different densities
icon_sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

def create_icon(logo_path, output_path, size, bg_color=None):
    """Create an app icon with centered logo"""
    
    # Create square canvas
    icon = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    
    # Open and resize logo
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
    
    # Paste logo onto icon
    icon.paste(logo, (x, y), logo)
    
    # Convert to RGB and save
    icon = icon.convert('RGB')
    icon.save(output_path, 'PNG', quality=95)
    print(f"Created: {output_path}")

def main():
    print("Creating app icons for GetFit app...\n")
    
    # Check if logo exists
    if not os.path.exists(logo_path):
        print(f"Error: Logo not found at {logo_path}")
        return
    
    # Create all app icons
    for folder, size in icon_sizes.items():
        output_dir = os.path.join(output_base, folder)
        os.makedirs(output_dir, exist_ok=True)
        
        # Create ic_launcher.png
        output_path = os.path.join(output_dir, "ic_launcher.png")
        create_icon(logo_path, output_path, size)
        
        # Create ic_launcher_round.png (same as ic_launcher for now)
        output_path_round = os.path.join(output_dir, "ic_launcher_round.png")
        create_icon(logo_path, output_path_round, size)
    
    print("\nAll app icons created successfully!")
    print("\nNext steps:")
    print("1. Run: npx cap sync android")
    print("2. Run: cd android && .\\gradlew installDebug")
    print("3. Launch the app and see your beautiful icon!")

if __name__ == "__main__":
    main()
