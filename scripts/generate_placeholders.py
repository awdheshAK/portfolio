#!/usr/bin/env python3
"""One-off dev utility: generates original SVG placeholder imagery for the
MJ Oswal homepage build (gradient field + monogram + label). Not part of the
shipped site; safe to delete once real photography is supplied."""
import os

OUT_ROOT = os.path.join(os.path.dirname(__file__), "..", "assets", "images")

# (relative_path, width, height, hue_start, hue_end, label, sublabel)
IMAGES = [
    ("hero/hero-main.svg", 1600, 2000, 222, 258, "MJ OSWAL", "Hero Visual — Placeholder"),
    ("intro/intro-visual.svg", 1200, 1500, 210, 240, "MJ", "Introduction Visual — Placeholder"),
    ("business/business-01.svg", 900, 1100, 200, 230, "01", "Business Vertical — Placeholder"),
    ("business/business-02.svg", 900, 1100, 215, 245, "02", "Business Vertical — Placeholder"),
    ("business/business-03.svg", 900, 1100, 230, 260, "03", "Business Vertical — Placeholder"),
    ("business/business-04.svg", 900, 1100, 195, 225, "04", "Business Vertical — Placeholder"),
    ("why/why-visual.svg", 1100, 1350, 205, 235, "MJO", "Why MJ Oswal — Placeholder"),
    ("projects/project-01.svg", 1400, 1000, 220, 250, "01", "Featured Project — Placeholder"),
    ("projects/project-02.svg", 1400, 1000, 235, 260, "02", "Featured Project — Placeholder"),
    ("projects/project-03.svg", 1400, 1000, 200, 228, "03", "Featured Project — Placeholder"),
    ("sustainability/sustainability-visual.svg", 1600, 1100, 150, 190, "MJO", "Sustainability Visual — Placeholder"),
    ("insights/insight-01.svg", 900, 700, 210, 240, "01", "Insights Article — Placeholder"),
    ("insights/insight-02.svg", 900, 700, 225, 250, "02", "Insights Article — Placeholder"),
    ("insights/insight-03.svg", 900, 700, 195, 220, "03", "Insights Article — Placeholder"),
    ("cta/cta-visual.svg", 1800, 1000, 218, 248, "MJ OSWAL", "CTA Visual — Placeholder"),
]

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

for rel, w, h, h1, h2, label, sublabel in IMAGES:
    path = os.path.join(OUT_ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    small = max(14, min(w, h) // 42)
    px = w - max(20, min(w, h) // 22)
    py = h - max(20, min(w, h) // 22)
    svg = SVG_TEMPLATE.format(
        w=w, h=h, h1=h1, h2=h2, small=small, px=px, py=py,
        label=label, sublabel=sublabel,
        aria=f"{label} {sublabel}",
    )
    with open(path, "w") as f:
        f.write(svg)
    print("wrote", path)
