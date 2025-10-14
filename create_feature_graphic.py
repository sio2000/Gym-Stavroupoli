#!/usr/bin/env python3
"""
Script to create Play Store Feature Graphic (1024x500) for GetFit
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
except ImportError:
    print("Installing required package: Pillow")
    import subprocess
    subprocess.check_call(["pip", "install", "Pillow"])
    from PIL import Image, ImageDraw, ImageFont
    import os

def create_feature_graphic(logo_path, output_path):
    """Create a 1024x500 Feature Graphic for Play Store"""
    
    print(f"Creating Feature Graphic from: {logo_path}")
    
    # Check if logo exists
    if not os.path.exists(logo_path):
        print(f"Error: Logo not found at {logo_path}")
        return False
    
    try:
        # Create canvas 1024x500
        width, height = 1024, 500
        graphic = Image.new('RGB', (width, height), '#1a1a1a')  # Dark background
        draw = ImageDraw.Draw(graphic)
        
        # Create gradient background
        for y in range(height):
            # Create gradient from dark to slightly lighter
            color_value = int(26 + (y / height) * 30)  # 26 to 56
            color = (color_value, color_value, color_value)
            draw.line([(0, y), (width, y)], fill=color)
        
        # Load and resize logo
        logo = Image.open(logo_path).convert('RGBA')
        
        # Calculate logo size (height should be about 40% of canvas height)
        logo_height = int(height * 0.4)
        logo_width = int(logo_height * (logo.width / logo.height))
        
        # Resize logo
        logo = logo.resize((logo_width, logo_height), Image.Resampling.LANCZOS)
        
        # Position logo on the left side
        logo_x = 50
        logo_y = (height - logo_height) // 2
        
        # Paste logo
        graphic.paste(logo, (logo_x, logo_y), logo)
        
        # Add text content
        text_x = logo_x + logo_width + 40
        
        # Try to load a font, fallback to default if not available
        try:
            # Try different font sizes
            title_font_size = 48
            subtitle_font_size = 24
            feature_font_size = 18
            
            # Use default font
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
            feature_font = ImageFont.load_default()
            
        except:
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
            feature_font = ImageFont.load_default()
        
        # Main title
        title_text = "GetFit"
        title_color = '#00C08B'  # Teal color
        draw.text((text_x, 80), title_text, font=title_font, fill=title_color)
        
        # Subtitle
        subtitle_text = "Σύστημα Διαχείρισης Γυμναστηρίου"
        subtitle_color = '#FFFFFF'
        draw.text((text_x, 130), subtitle_text, font=subtitle_font, fill=subtitle_color)
        
        # Features
        features = [
            "• QR Code Είσοδος",
            "• Ημερολόγιο Προπονήσεων", 
            "• Διαχείριση Συνδρομών",
            "• Ειδοποιήσεις"
        ]
        
        feature_y = 180
        for feature in features:
            draw.text((text_x, feature_y), feature, font=feature_font, fill='#CCCCCC')
            feature_y += 35
        
        # Add "ΔΩΡΕΑΝ" badge
        badge_x = width - 120
        badge_y = 30
        badge_width = 100
        badge_height = 40
        
        # Draw badge background
        draw.rounded_rectangle(
            [badge_x, badge_y, badge_x + badge_width, badge_y + badge_height],
            radius=8,
            fill='#FF6B35'
        )
        
        # Badge text
        draw.text((badge_x + 20, badge_y + 10), "ΔΩΡΕΑΝ", font=title_font, fill='#FFFFFF')
        
        # Add decorative elements
        # Small circles for decoration
        for i in range(5):
            circle_x = width - 60 - (i * 15)
            circle_y = height - 60
            draw.ellipse([circle_x, circle_y, circle_x + 8, circle_y + 8], fill='#00C08B', outline='#FFFFFF', width=1)
        
        # Save the graphic
        graphic.save(output_path, 'PNG', quality=95)
        print(f"Created Feature Graphic: {output_path}")
        
        # Show file info
        file_size = os.path.getsize(output_path)
        print(f"Size: {width}x{height} pixels")
        print(f"File size: {file_size / 1024:.1f} KB")
        
        return True
        
    except Exception as e:
        print(f"Error creating feature graphic: {e}")
        return False

def main():
    print("Creating Play Store Feature Graphic for GetFit\n")
    
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
    output_dir = "playstore-assets/graphics"
    os.makedirs(output_dir, exist_ok=True)
    
    # Create Feature Graphic
    output_path = os.path.join(output_dir, "feature-graphic-1024x500.png")
    success = create_feature_graphic(logo_path, output_path)
    
    if success:
        print("\nSUCCESS!")
        print(f"Your Feature Graphic is ready: {output_path}")
        print("\nNext steps:")
        print("1. Go to Google Play Console")
        print("2. Navigate to Store listing > Feature Graphic")
        print(f"3. Upload the file: {output_path}")
        print("4. The graphic should be 1024x500 pixels, PNG format")
        print("\nYour app will look great on the Play Store!")
    else:
        print("\nFailed to create Feature Graphic")
        print("Please check your logo file and try again")

if __name__ == "__main__":
    main()
