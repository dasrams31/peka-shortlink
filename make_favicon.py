#!/usr/bin/env python3
"""Favicons for SnaPeka + Piko.
SnaPeka: yellow rounded square + black bold "S" (matches the .logo-mark
yellow square in the header). Piko: real ICO from the robot logo so the
default /favicon.ico path works (the <link> to robot-logo.png already exists).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

YELLOW = (255, 214, 10)
BLACK = (17, 17, 17)

def snapeka_mark(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = int(size * 0.22)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=YELLOW + (255,))
    f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", int(size * 0.66))
    bb = d.textbbox((0, 0), "S", font=f)
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    d.text(((size - w) / 2 - bb[0], (size - h) / 2 - bb[1]), "S", font=f, fill=BLACK + (255,))
    return img

# --- SnaPeka (Next.js App Router: app/icon.png + app/apple-icon.png + public/favicon.ico)
base = Path("/home/hatch/workspace/peka-shortlink")
mark512 = snapeka_mark(512)
mark512.save(base / "app" / "icon.png", "PNG")
print("wrote", base / "app" / "icon.png")
mark512.resize((180, 180), Image.LANCZOS).save(base / "app" / "apple-icon.png", "PNG")
print("wrote", base / "app" / "apple-icon.png")
(base / "public").mkdir(exist_ok=True)
mark512.save(base / "public" / "favicon.ico", "ICO", sizes=[(16, 16), (32, 32), (48, 48)])
print("wrote", base / "public" / "favicon.ico")

# --- Piko (Flask static_folder, static_url_path="": static/favicon.ico -> /favicon.ico)
robot = Image.open("/home/hatch/workspace/piko-app/static/robot-logo.png").convert("RGBA")
robot.save("/home/hatch/workspace/piko-app/static/favicon.ico", "ICO", sizes=[(16, 16), (32, 32), (48, 48)])
print("wrote /home/hatch/workspace/piko-app/static/favicon.ico")
