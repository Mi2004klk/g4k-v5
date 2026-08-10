import os
from PIL import Image

def main():
    public_dir = os.path.join(os.path.dirname(__file__), 'public')
    icon_path = os.path.join(public_dir, 'icon.png')
    
    if not os.path.exists(icon_path):
        print("icon.png not found")
        return

    with Image.open(icon_path) as img:
        img = img.convert("RGBA")
        
        # Create 192x192
        img_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
        img_192.save(os.path.join(public_dir, 'icon-192.png'))
        print("Saved icon-192.png")
        
        # Create 512x512
        img_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
        img_512.save(os.path.join(public_dir, 'icon-512.png'))
        print("Saved icon-512.png")
        
        # Create apple-icon.png (usually 180x180)
        img_180 = img.resize((180, 180), Image.Resampling.LANCZOS)
        img_180.save(os.path.join(public_dir, 'apple-icon.png'))
        print("Saved apple-icon.png")
        
        # Create maskable icon
        bg_color = (138, 43, 226, 255) # #8A2BE2
        maskable = Image.new("RGBA", (512, 512), bg_color)
        
        # Scale original to 80% (409x409)
        img_scaled = img.resize((409, 409), Image.Resampling.LANCZOS)
        
        # Calculate offset
        offset = ((512 - 409) // 2, (512 - 409) // 2)
        
        maskable.paste(img_scaled, offset, img_scaled)
        maskable.save(os.path.join(public_dir, 'maskable-icon.png'))
        print("Saved maskable-icon.png")

if __name__ == '__main__':
    main()
