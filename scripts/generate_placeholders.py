#!/usr/bin/env python3
"""
Dev utility: generates placeholder imagery for MJ Oswal Exports into the
exact folder structure the site expects (see /assets/data/images.json).
Not part of the shipped site — safe to re-run or delete once real photos
are supplied.

HOW TO REPLACE A PLACEHOLDER WITH A REAL PHOTO:
  1. Save your photo into the matching folder under /assets/images/
     using the SAME filename this script writes (e.g. hero-01.jpg).
  2. If your file extension differs (.jpg/.png instead of .svg), update
     the matching "src" path in /assets/data/images.json (or
     /assets/data/machines.json for machine photos) to match.
  3. Re-run `python3 scripts/build_site.py` if you changed any .json
     data file — the HTML pages are generated from that data.
No other code changes are needed.
"""
import os

OUT_ROOT = os.path.join(os.path.dirname(__file__), "..", "assets", "images")
LABEL = "MJ Oswal Exports"
SUBLABEL = "Placeholder Image"

# (relative_path, width, height, hue_start, hue_end)
IMAGES = [
    # Hero slider — 5 slides
    ("hero/hero-01.svg", 1600, 2000, 222, 250),
    ("hero/hero-02.svg", 1600, 2000, 205, 235),
    ("hero/hero-03.svg", 1600, 2000, 235, 260),
    ("hero/hero-04.svg", 1600, 2000, 195, 222),
    ("hero/hero-05.svg", 1600, 2000, 215, 245),

    # Products — one hero image per top-level gender hub (Men's / Women's).
    # Per-subcategory images are appended programmatically below via
    # PRODUCT_CATEGORY_HUES, matching assets/data/product_subcategories.json.
    ("products/product-mens-01.svg", 900, 1100, 210, 238),
    ("products/product-womens-01.svg", 900, 1100, 220, 248),

    # Machines — see assets/data/machines.json. Only the machines without a
    # real photo yet get a placeholder (Circular Knitting Machines and
    # Automatic Screen Printing Machines already use a real photo from the
    # company profile PDF — see images.json / manufacturing.printing).
    ("machines/machine-interlock-knitting-01.svg", 900, 700, 220, 246),
    ("machines/machine-flat-knitting-01.svg", 900, 700, 200, 228),
    ("machines/machine-manual-printing-01.svg", 900, 700, 230, 255),
    ("machines/machine-curing-01.svg", 900, 700, 205, 232),
    ("machines/machine-laser-cutting-01.svg", 900, 700, 215, 240),
    ("machines/machine-plotter-01.svg", 900, 700, 195, 220),
    ("machines/machine-embroidery-01.svg", 900, 700, 225, 250),

    # Manufacturing departments — only the ones without a real photo yet
    # (see assets/data/images.json — most departments now use a real photo
    # extracted from the company profile PDF instead of this placeholder).
    ("manufacturing/manufacturing-cutting-01.svg", 1400, 1000, 220, 246),
    ("manufacturing/manufacturing-embroidery-01.svg", 1400, 1000, 230, 255),

    # Facility — same: only slots without a real photo yet.
    ("facility/facility-technology-01.svg", 1400, 1000, 200, 228),
    ("facility/facility-capacity-01.svg", 1400, 1000, 230, 255),

    # Certificates — placeholder slots only, no names implied
    ("certificates/certificate-01.svg", 900, 700, 220, 246),
    ("certificates/certificate-02.svg", 900, 700, 210, 238),
    ("certificates/certificate-03.svg", 900, 700, 230, 255),
    ("certificates/certificate-04.svg", 900, 700, 200, 228),

    # Partners — placeholder logo slots only
    ("partners/partner-01.svg", 400, 200, 218, 244),
    ("partners/partner-02.svg", 400, 200, 208, 234),
    ("partners/partner-03.svg", 400, 200, 228, 252),
    ("partners/partner-04.svg", 400, 200, 198, 224),
    ("partners/partner-05.svg", 400, 200, 212, 238),
    ("partners/partner-06.svg", 400, 200, 222, 248),

    # Team — all slots now use real photos (see assets/data/images.json);
    # nothing left to generate here.

    # Projects
    ("projects/project-01.svg", 1400, 1000, 220, 248),
    ("projects/project-02.svg", 1400, 1000, 200, 228),

    # Insights
    ("insights/insight-01.svg", 900, 700, 215, 240),
    ("insights/insight-02.svg", 900, 700, 195, 222),
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

SVG_TEMPLATE = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{aria}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="hsl({h1}, 32%, 16%)"/>
      <stop offset="55%" stop-color="hsl({h2}, 38%, 24%)"/>
      <stop offset="100%" stop-color="hsl({h1}, 30%, 10%)"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
      <path d="M 64 0 L 0 0 0 64" fill="none" stroke="#ffffff" stroke-opacity="0.045" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="{w}" height="{h}" fill="url(#g)"/>
  <rect width="{w}" height="{h}" fill="url(#grid)"/>
  <rect width="{w}" height="{h}" fill="url(#sheen)"/>
  <!-- Small corner watermark only — bottom-right, well clear of any real
       headline/caption text this image sits behind in the page layout. -->
  <text x="{px}" y="{py}" text-anchor="end" dominant-baseline="auto" font-family="Arial, Helvetica, sans-serif" font-size="{small}" fill="#ffffff" fill-opacity="0.38" letter-spacing="1.5">{label} — {sublabel}</text>
</svg>
"""

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
    for i in (1, 2, 3):
        offset = (i - 1) * 5
        IMAGES.append((f"products/{cat}/{cat}-0{i}.svg", 900, 1100, h1 + offset, h2 + offset))

logo_path = os.path.join(OUT_ROOT, "logo/mj-oswal-exports-mark.svg")
os.makedirs(os.path.dirname(logo_path), exist_ok=True)
with open(logo_path, "w") as f:
    f.write(LOGO_SVG)
print("wrote", logo_path)

for rel, w, h, h1, h2 in IMAGES:
    path = os.path.join(OUT_ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    small = max(14, min(w, h) // 42)
    px = w - max(20, min(w, h) // 22)
    py = h - max(20, min(w, h) // 22)
    svg = SVG_TEMPLATE.format(
        w=w, h=h, h1=h1, h2=h2, small=small, px=px, py=py,
        label=LABEL, sublabel=SUBLABEL,
        aria=f"{LABEL} {SUBLABEL}",
    )
    with open(path, "w") as f:
        f.write(svg)
    print("wrote", path)
