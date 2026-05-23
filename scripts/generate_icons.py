#!/usr/bin/env python3
"""Generate all PNG icon sizes required by PWABuilder + Android/iOS stores.

Sizes generated (covers PWABuilder, Play Store, App Store, Microsoft Store):
  any:       72, 96, 128, 144, 152, 192, 256, 384, 512, 1024
  maskable:  192, 512 (with safe-area padding so the icon doesn't get clipped
             by Android's adaptive shape masks)
  splash:    Apple touch icon 180
"""
from pathlib import Path
import cairosvg
from PIL import Image, ImageDraw
import io

ROOT = Path("/app/frontend/public")
SVG = ROOT / "icon.svg"
OUT = ROOT / "icons"
OUT.mkdir(exist_ok=True)

# Sizes used by PWABuilder + Google Play + iOS App Store
ANY_SIZES = [48, 72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512, 1024]
MASKABLE_SIZES = [192, 512]


def render(size: int) -> Image.Image:
    """Render the SVG at the given pixel size."""
    png_bytes = cairosvg.svg2png(
        url=str(SVG), output_width=size, output_height=size
    )
    return Image.open(io.BytesIO(png_bytes)).convert("RGBA")


def save(img: Image.Image, name: str):
    path = OUT / name
    img.save(path, format="PNG", optimize=True)
    print(f"  -> {path.relative_to(ROOT)} ({path.stat().st_size//1024} KB)")


def make_maskable(size: int) -> Image.Image:
    """Maskable icons need a safe inner area (80%) and a solid background that
    fills the entire square — Android's adaptive icon mask can crop up to 20%
    of the outer edges. We composite the original icon centered at 80% scale
    on top of the brand cream background."""
    bg = Image.new("RGBA", (size, size), (245, 239, 225, 255))  # #F5EFE1 cream
    inner = int(size * 0.78)
    inner_img = render(inner)
    offset = ((size - inner) // 2, (size - inner) // 2)
    bg.paste(inner_img, offset, inner_img)
    return bg


def main():
    print("Rendering ANY icons:")
    for s in ANY_SIZES:
        save(render(s), f"icon-{s}.png")

    print("Rendering MASKABLE icons (with safe-area):")
    for s in MASKABLE_SIZES:
        save(make_maskable(s), f"icon-maskable-{s}.png")

    # Convenience aliases at /public root for legacy references
    print("Creating root aliases:")
    for s in (192, 512):
        src = OUT / f"icon-{s}.png"
        dst = ROOT / f"icon-{s}.png"
        dst.write_bytes(src.read_bytes())
        print(f"  -> {dst.relative_to(ROOT)}")

    # Apple touch icon
    print("Creating Apple touch icon:")
    apple = ROOT / "apple-touch-icon.png"
    apple.write_bytes((OUT / "icon-180.png").read_bytes())
    print(f"  -> {apple.relative_to(ROOT)}")

    # Favicon
    print("Creating favicon:")
    favicon_sizes = [16, 32, 48]
    favicon_imgs = [render(s) for s in favicon_sizes]
    favicon_path = ROOT / "favicon.ico"
    favicon_imgs[0].save(favicon_path, format="ICO",
                         sizes=[(s, s) for s in favicon_sizes])
    print(f"  -> {favicon_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
