from PIL import Image, ImageDraw, ImageFont
import os

# --- CONFIGURATION ---
SIZE = (16, 16)             # Tiny size = Blurry retro look
BG_COLOR = "#0A0A0A"        # Endfield Black
TEXT_COLOR = "#F2D930"      # Endfield Yellow
TEXT = "G"

# Create the canvas
img = Image.new('RGB', SIZE, color=BG_COLOR)
d = ImageDraw.Draw(img)

# We use a basic font. If 'arial.ttf' isn't found, it falls back to a default.
try:
    # We draw it slightly larger then resize? 
    # No, drawing direct to small canvas gives the best "crunchy" blur.
    # We try to center the "G" manually.
    font = ImageFont.truetype("arial.ttf", 14) 
except IOError:
    font = ImageFont.load_default()

# Calculate position to center it
bbox = d.textbbox((0, 0), TEXT, font=font)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]
x = (SIZE[0] - text_width) / 2
y = (SIZE[1] - text_height) / 2 - 2 # Nudge it up a bit

# Draw the Asset
d.text((x, y), TEXT, font=font, fill=TEXT_COLOR)

# Save it directly to your static folder
output_path = os.path.join("static", "favicon.png")
img.save(output_path)

print(f"✅ TACTICAL ASSET GENERATED: {output_path}")