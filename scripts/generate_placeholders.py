#!/usr/bin/env python3
"""
Dev utility: generates placeholder imagery for MJ Oswal Exports into the
exact folder structure the site expects (see /assets/data/images.json).
Not part of the shipped site — safe to re-run or delete once real photos
are supplied. Placeholders render as .webp (matches the format the real
product photography will be delivered in, so dropping a real file in
just means overwriting the same filename — no path changes needed).

HOW TO REPLACE A PLACEHOLDER WITH A REAL PHOTO:
  1. Save your photo into the matching folder under /assets/images/
     using the SAME filename this script writes (e.g. hero-01.webp).
     If your source photo is a .jpg/.png, convert it to .webp first
     (any image editor, or `cwebp photo.jpg -o hero-01.webp`) — or, if
     you'd rather keep it as .jpg/.png, just update the matching "src"
     path in /assets/data/images.json (or /assets/data/machines.json /
     /assets/data/catalog_items.json) to match your file's extension.
  2. Re-run `python3 scripts/build_site.py` if you changed any .json
     data file — the HTML pages are generated from that data.
No other code changes are needed.
"""
import os
from PIL import Image, ImageDraw, ImageFont

OUT_ROOT = os.path.join(os.path.dirname(__file__), "..", "assets", "images")
LABEL = "MJ Oswal Exports"
SUBLABEL = "Placeholder Image"

# (relative_path, width, height, hue_start, hue_end)
IMAGES = [
    # Hero slider — 5 slides
    ("hero/hero-01.webp", 1600, 2000, 222, 250),
    ("hero/hero-02.webp", 1600, 2000, 205, 235),
    ("hero/hero-03.webp", 1600, 2000, 235, 260),
    ("hero/hero-04.webp", 1600, 2000, 195, 222),
    ("hero/hero-05.webp", 1600, 2000, 215, 245),

    # Products — one hero image per top-level gender hub (Men's / Women's).
    # Per-subcategory images are appended programmatically below via
    # PRODUCT_CATEGORY_HUES, matching assets/data/product_subcategories.json.
    ("products/product-mens-01.webp", 900, 1100, 210, 238),
    ("products/product-womens-01.webp", 900, 1100, 220, 248),

    # Machines — see assets/data/machines.json. Only the machines without a
    # real photo yet get a placeholder (Circular Knitting Machines and
    # Automatic Screen Printing Machines already use a real photo from the
    # company profile PDF — see images.json / manufacturing.printing).
    ("machines/machine-interlock-knitting-01.webp", 900, 700, 220, 246),
    ("machines/machine-flat-knitting-01.webp", 900, 700, 200, 228),
    ("machines/machine-manual-printing-01.webp", 900, 700, 230, 255),
    ("machines/machine-curing-01.webp", 900, 700, 205, 232),
    ("machines/machine-laser-cutting-01.webp", 900, 700, 215, 240),
    ("machines/machine-plotter-01.webp", 900, 700, 195, 220),
    ("machines/machine-embroidery-01.webp", 900, 700, 225, 250),

    # Manufacturing departments — only the ones without a real photo yet
    # (see assets/data/images.json — most departments now use a real photo
    # extracted from the company profile PDF instead of this placeholder).
    ("manufacturing/manufacturing-cutting-01.webp", 1400, 1000, 220, 246),
    ("manufacturing/manufacturing-embroidery-01.webp", 1400, 1000, 230, 255),

    # Facility — same: only slots without a real photo yet.
    ("facility/facility-technology-01.webp", 1400, 1000, 200, 228),
    ("facility/facility-capacity-01.webp", 1400, 1000, 230, 255),

    # Certificates — placeholder slots only, no names implied
    ("certificates/certificate-01.webp", 900, 700, 220, 246),
    ("certificates/certificate-02.webp", 900, 700, 210, 238),
    ("certificates/certificate-03.webp", 900, 700, 230, 255),
    ("certificates/certificate-04.webp", 900, 700, 200, 228),

    # Partners — placeholder logo slots only
    ("partners/partner-01.webp", 400, 200, 218, 244),
    ("partners/partner-02.webp", 400, 200, 208, 234),
    ("partners/partner-03.webp", 400, 200, 228, 252),
    ("partners/partner-04.webp", 400, 200, 198, 224),
    ("partners/partner-05.webp", 400, 200, 212, 238),
    ("partners/partner-06.webp", 400, 200, 222, 248),

    # Team — all slots now use real photos (see assets/data/images.json);
    # nothing left to generate here.

    # Projects
    ("projects/project-01.webp", 1400, 1000, 220, 248),
    ("projects/project-02.webp", 1400, 1000, 200, 228),

    # Insights
    ("insights/insight-01.webp", 900, 700, 215, 240),
    ("insights/insight-02.webp", 900, 700, 195, 222),
]

# Reproduces the real M.J. Oswal Group visiting-card mark: a four-colour
# "MJO" pinwheel (coral / blue / purple-magenta / green wedges). To use a
# real photo/vector of the logo instead, save it as this same filename and
# skip re-running this script (or delete this LOGO_SVG block).
LOGO_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="MJO — M.J. Oswal Group logo mark">
  <circle cx="100" cy="100" r="94" fill="#ffffff"/>
  <path d="M100,100 L8.00,100.00 A92,92 0 0 1 146.00,20.33 Z" fill="#ee9268"/>
  <path d="M100,100 L146.00,20.33 A92,92 0 0 1 192.00,100.00 Z" fill="#7fa0d6"/>
  <path d="M100,100 L192.00,100.00 A92,92 0 0 1 20.33,146.00 Z" fill="#b15aa0"/>
  <path d="M100,100 L20.33,146.00 A92,92 0 0 1 8.00,100.00 Z" fill="#8fc47c"/>
  <text x="100" y="138" text-anchor="middle" font-family="'Arial Black', Arial, Helvetica, sans-serif" font-weight="900" font-size="84" letter-spacing="-4" fill="#141c2e">MJO</text>
</svg>
"""

FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def _hsl_to_rgb(h, s, l):
    """Same HSL model the old inline-SVG gradients used (h in degrees)."""
    import colorsys
    r, g, b = colorsys.hls_to_rgb((h % 360) / 360.0, l, s)
    return (round(r * 255), round(g * 255), round(b * 255))


def render_placeholder(w, h, h1, h2, label, sublabel):
    """Renders the same look the old placeholder SVGs had (diagonal
    3-stop gradient, faint grid, top sheen, corner watermark) as a
    raster image, so it can ship as .webp."""
    c0 = _hsl_to_rgb(h1, 0.32, 0.16)
    c1 = _hsl_to_rgb(h2, 0.38, 0.24)
    c2 = _hsl_to_rgb(h1, 0.30, 0.10)

    # Build the diagonal gradient on a small thumbnail, then upscale —
    # far cheaper than a per-pixel loop at full resolution.
    thumb = 48
    grad = Image.new("RGB", (thumb, thumb))
    px = grad.load()
    for y in range(thumb):
        for x in range(thumb):
            t = (x + y) / (2 * (thumb - 1))
            if t <= 0.55:
                tt = t / 0.55
                col = tuple(round(c0[i] + (c1[i] - c0[i]) * tt) for i in range(3))
            else:
                tt = (t - 0.55) / 0.45
                col = tuple(round(c1[i] + (c2[i] - c1[i]) * tt) for i in range(3))
            px[x, y] = col
    base = grad.resize((w, h), Image.BICUBIC).convert("RGBA")

    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)
    for x in range(0, w, 64):
        odraw.line([(x, 0), (x, h)], fill=(255, 255, 255, 12))
    for y in range(0, h, 64):
        odraw.line([(0, y), (w, y)], fill=(255, 255, 255, 12))

    sheen_mask = Image.new("L", (1, h))
    for y in range(h):
        sheen_mask.putpixel((0, y), round(15 * (1 - y / h)))
    sheen_mask = sheen_mask.resize((w, h))
    sheen = Image.new("RGBA", (w, h), (255, 255, 255, 0))
    sheen.putalpha(sheen_mask)
    overlay = Image.alpha_composite(overlay, sheen)

    # Small corner watermark only — bottom-right, well clear of any real
    # headline/caption text this image sits behind in the page layout.
    odraw = ImageDraw.Draw(overlay)
    small = max(14, min(w, h) // 42)
    try:
        font = ImageFont.truetype(FONT_PATH, small)
    except OSError:
        font = ImageFont.load_default()
    text = f"{label} — {sublabel}"
    bbox = odraw.textbbox((0, 0), text, font=font)
    margin = max(20, min(w, h) // 22)
    tx = w - margin - (bbox[2] - bbox[0])
    ty = h - margin - (bbox[3] - bbox[1])
    odraw.text((tx, ty), text, font=font, fill=(255, 255, 255, 97))

    return Image.alpha_composite(base, overlay).convert("RGB")

# Per-category product catalog images — 3 per category, used by the
# /products/<category>/ gallery pages and their individual product pages
# (see assets/data/catalog_items.json). Slugs must match the "category"
# slugs used in assets/data/products.json.
PRODUCT_CATEGORY_HUES = {
    "mens-lounge-wear": (210, 238), "polo": (220, 248), "mens-t-shirts": (230, 255),
    "sweatshirts": (195, 220), "lowers": (208, 235), "suits": (198, 226),
    "outerwear": (218, 244), "mens-track-suits": (225, 250),
    "tops": (205, 232), "womens-t-shirts": (215, 240), "dresses": (228, 252),
    "womens-lounge-wear": (212, 238), "onesies": (222, 248), "athleisure": (202, 230),
    "bottoms": (232, 256), "womens-track-suits": (206, 233), "panties": (216, 242),
}
for cat, (h1, h2) in PRODUCT_CATEGORY_HUES.items():
    for i in range(1, 7):
        offset = (i - 1) * 5
        IMAGES.append((f"products/{cat}/{cat}-0{i}.webp", 900, 1100, h1 + offset, h2 + offset))

logo_path = os.path.join(OUT_ROOT, "logo/mj-oswal-exports-mark.svg")
os.makedirs(os.path.dirname(logo_path), exist_ok=True)
with open(logo_path, "w") as f:
    f.write(LOGO_SVG)
print("wrote", logo_path)

for rel, w, h, h1, h2 in IMAGES:
    path = os.path.join(OUT_ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img = render_placeholder(w, h, h1, h2, LABEL, SUBLABEL)
    img.save(path, "WEBP", quality=82, method=4)
    print("wrote", path)
