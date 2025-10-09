#!/usr/bin/env python3
"""
Script to create adaptive icons for Android app
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

# Adaptive icon sizes for different densities
adaptive_sizes = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}

def create_adaptive_foreground(logo_path, output_path, size):
    """Create adaptive icon foreground with centered logo"""
    
    # Create square canvas
    icon = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    
    # Open and resize logo
    logo = Image.open(logo_path).convert('RGBA')
    
    # Calculate logo size (60% of icon size for safe zone)
    logo_size = int(size * 0.6)
    
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

def create_adaptive_background(output_path, size, color=(255, 255, 255, 255)):
    """Create adaptive icon background"""
    
    # Create square canvas with solid color
    icon = Image.new('RGBA', (size, size), color)
    
    # Save as PNG
    icon.save(output_path, 'PNG', quality=95)
    print(f"Created: {output_path}")

def main():
    print("Creating adaptive icons for GetFit app...\n")
    
    # Check if logo exists
    if not os.path.exists(logo_path):
        print(f"Error: Logo not found at {logo_path}")
        return
    
    # Create all adaptive icon foregrounds
    for folder, size in adaptive_sizes.items():
        output_dir = os.path.join(output_base, folder)
        os.makedirs(output_dir, exist_ok=True)
        
        # Create ic_launcher_foreground.png
        output_path = os.path.join(output_dir, "ic_launcher_foreground.png")
        create_adaptive_foreground(logo_path, output_path, size)
        
        # Create ic_launcher_background.png
        output_path = os.path.join(output_dir, "ic_launcher_background.png")
        create_adaptive_background(output_path, size)
    
    print("\nAll adaptive icons created successfully!")
    print("\nNext steps:")
    print("1. Run: npx cap sync android")
    print("2. Run: cd android && .\\gradlew assembleDebug")
    print("3. Launch the app and see your beautiful adaptive icons!")

if __name__ == "__main__":
    main()
