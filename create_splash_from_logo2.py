#!/usr/bin/env python3
"""
Script to create splash screen from logo2.png for Android app
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
logo_path = "public/logo2.png"
output_base = "android/app/src/main/res"

# Background color (white)
bg_color = (255, 255, 255, 255)

# Splash screen sizes for different densities and orientations
splash_sizes = {
    # Portrait orientations
    "drawable-port-mdpi": (320, 480),
    "drawable-port-hdpi": (480, 800),
    "drawable-port-xhdpi": (720, 1280),
    "drawable-port-xxhdpi": (1080, 1920),
    "drawable-port-xxxhdpi": (1440, 2560),
    
    # Landscape orientations
    "drawable-land-mdpi": (480, 320),
    "drawable-land-hdpi": (800, 480),
    "drawable-land-xhdpi": (1280, 720),
    "drawable-land-xxhdpi": (1920, 1080),
    "drawable-land-xxxhdpi": (2560, 1440),
    
    # Default drawable
    "drawable": (2732, 2732),
}

def create_splash(logo_path, output_path, size, bg_color):
    """Create a splash screen with centered logo"""
    width, height = size
    
    # Create background
    splash = Image.new('RGBA', size, bg_color)
    
    # Open and resize logo
    logo = Image.open(logo_path).convert('RGBA')
    
    # Calculate logo size (40% of the shorter dimension)
    logo_size = int(min(width, height) * 0.4)
    
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
    x = (width - logo_width) // 2
    y = (height - logo_height) // 2
    
    # Paste logo onto splash
    splash.paste(logo, (x, y), logo)
    
    # Convert to RGB (remove alpha) and save
    splash = splash.convert('RGB')
    splash.save(output_path, 'PNG', quality=95)
    print(f"Created: {output_path}")

def main():
    print("Creating splash screens with logo2.png for GetFit app...\n")
    
    # Check if logo exists
    if not os.path.exists(logo_path):
        print(f"Error: Logo not found at {logo_path}")
        return
    
    # Create all splash screens
    for folder, size in splash_sizes.items():
        output_dir = os.path.join(output_base, folder)
        os.makedirs(output_dir, exist_ok=True)
        
        output_path = os.path.join(output_dir, "splash.png")
        create_splash(logo_path, output_path, size, bg_color)
    
    print("\nAll splash screens created successfully with logo2.png!")
    print("\nNext steps:")
    print("1. Run: npx cap sync android")
    print("2. Run: cd android && .\\gradlew installDebug")
    print("3. Launch the app and see your new logo2 splash screen!")

if __name__ == "__main__":
    main()
