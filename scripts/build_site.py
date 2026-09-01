#!/usr/bin/env python3
"""
MJ Oswal Exports static-site generator.

One canonical page manifest + a handful of shared render functions
(head/header/nav/breadcrumb/footer + reusable content blocks) produce every
page as a real, standalone HTML file — no client-side framework involved.
Content lives in plain, human-editable JSON files under /assets/data/ so a
non-developer can update the site without touching this script:

  assets/data/images.json        — every image path + alt text
  assets/data/products.json      — product category cards
  assets/data/machines.json      — machinery flip-card data
  assets/data/certificates.json  — certification slider slots
  assets/data/partners.json      — partner logo slider slots

Re-run this file any time a JSON file or this script changes:

    python3 scripts/build_site.py
"""
import json
import os
import re

ROOT = os.path.join(os.path.dirname(__file__), "..")
DATA_DIR = os.path.join(ROOT, "assets", "data")

# Contact details below are sourced directly from the company's own
# profile document (M.J. Oswal Exports Pvt. Ltd., company profile PDF).
BASE_URL = "https://www.mjoswal.com"
SITE_NAME = "MJ Oswal Exports"
LEGAL_NAME = "M.J. Oswal Exports Private Limited"
LOCATION = "Ludhiana, Punjab, India"
ADDRESS = "Rahon Road, Mangat Village Khwajke, Ludhiana, Punjab - 141007"
PHONE = "+91 161 251 4367"
PHONE_HREF = "+911612514367"
EMAIL = "info@mjoswal.com"
# The PDF only gives a landline number. Using it here so the WhatsApp button
# is wired up end-to-end — confirm this is a WhatsApp-enabled number (or
# swap in the right one) before launch; wa.me links silently fail on a
# number with no WhatsApp account.
WHATSAPP_NUMBER = "911612514367"
FOUNDED_YEAR = "1994"


def load_json(name):
    with open(os.path.join(DATA_DIR, name), encoding="utf-8") as f:
        return json.load(f)


IMAGES = load_json("images.json")
PRODUCTS = load_json("products.json")["items"]  # the two gender hubs: Men's, Women's
SUBCATEGORIES = load_json("product_subcategories.json")["items"]
CATALOG_ITEMS = load_json("catalog_items.json")["items"]
MACHINES = load_json("machines.json")["items"]
CERTIFICATES = load_json("certificates.json")["items"]
PARTNERS = load_json("partners.json")["items"]

PRODUCTS_BY_SLUG = {p["slug"]: p for p in PRODUCTS}
SUBCATS_BY_GENDER = {}
for _sub in SUBCATEGORIES:
    SUBCATS_BY_GENDER.setdefault(_sub["gender"], []).append(_sub)
CATALOG_ITEMS_BY_CATEGORY = {}
for _item in CATALOG_ITEMS:
    CATALOG_ITEMS_BY_CATEGORY.setdefault(_item["category"], []).append(_item)

# =============================================================================
# NAV — top-level items per the requested structure. Every url is a real page.
# =============================================================================
NAV = [
    {"label": "Home", "url": "/", "card": "default"},
    {"label": "About", "url": "/about/", "card": "about", "children": [
        {"label": "Company", "url": "/about/company/"},
        {"label": "Capabilities", "url": "/about/capabilities/"},
        {"label": "Design & Development", "url": "/about/design-and-development/"},
        {"label": "Leadership", "url": "/about/leadership/"},
        {"label": "Our People", "url": "/about/our-people/"},
        {"label": "About overview", "url": "/about/"},
    ]},
    {"label": "Businesses", "url": "/businesses/", "card": "businesses", "children": [
        {"label": "Apparel", "url": "/businesses/apparel/"},
        {"label": "Knitwear", "url": "/businesses/knitwear/"},
        {"label": "Garments", "url": "/businesses/garments/"},
    ]},
    {"label": "Products", "url": "/products/", "card": "products", "children": [
        {"label": "Men's", "url": "/products/mens/"},
        {"label": "Women's", "url": "/products/womens/"},
        {"label": "View all products", "url": "/products/"},
    ]},
    {"label": "Manufacturing", "url": "/manufacturing/", "card": "manufacturing", "children": [
        {"label": "Knitting", "url": "/manufacturing/knitting/"},
        {"label": "Printing", "url": "/manufacturing/printing/"},
        {"label": "Stitching", "url": "/manufacturing/stitching/"},
        {"label": "View all departments", "url": "/manufacturing/"},
    ]},
    {"label": "Facility", "url": "/facility/", "card": "facility", "children": [
        {"label": "Machinery", "url": "/facility/machinery/"},
        {"label": "Production", "url": "/facility/production/"},
        {"label": "Quality Control", "url": "/facility/quality-control/"},
        {"label": "Facility overview", "url": "/facility/"},
    ]},
    {"label": "Quality", "url": "/quality/", "card": "quality"},
    {"label": "Sustainability", "url": "/sustainability/", "card": "sustainability", "children": [
        {"label": "Environment", "url": "/sustainability/environment/"},
        {"label": "People", "url": "/sustainability/people/"},
    ]},
    {"label": "Projects", "url": "/projects/", "card": "projects"},
    {"label": "Insights", "url": "/insights/", "card": "insights"},
    {"label": "Careers", "url": "/careers/", "card": "careers"},
    {"label": "Contact", "url": "/contact/", "card": "contact"},
]

NAV_CARD_IMAGES = {
    "default": (IMAGES["hero"][0]["src"], "MJ Oswal Exports", "Apparel manufacturing, built for scale"),
    "about": (IMAGES["team"]["our-people"]["src"], "About", "Who we are, in Ludhiana"),
    "businesses": (IMAGES["businesses"]["apparel"]["src"], "Businesses", "Apparel, knitwear and garments"),
    "products": (PRODUCTS[0]["image"], "Products", "Men's and women's circular knitted apparel"),
    "manufacturing": (IMAGES["manufacturing"]["stitching"]["src"], "Manufacturing", "From fabric to pack, under one roof"),
    "facility": (IMAGES["facility"]["overview"]["src"], "Facility", "Our production floor in Ludhiana"),
    "quality": (IMAGES["facility"]["quality-control"]["src"], "Quality", "Discipline at every stage"),
    "sustainability": (IMAGES["team"]["production-team"]["src"], "Sustainability", "Responsible manufacturing"),
    "projects": (IMAGES["projects"][0]["src"], "Projects", "Selected work"),
    "insights": (IMAGES["insights"][0]["src"], "Insights", "News and updates"),
    "careers": (IMAGES["team"]["manufacturing-team"]["src"], "Careers", "Build your career with us"),
    "contact": (IMAGES["facility"]["overview"]["src"], "Contact", "Get in touch"),
}

# Placeholder social links only — replace "#" with the real profile URL for
# each platform once confirmed. Never invent a real-looking URL.
SOCIAL_LINKS = [
    ("LinkedIn", "#", '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.66 4.78 6.12V21h-4v-5.6c0-1.34-.02-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97V21H9z"/></svg>'),
    ("Instagram", "#", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>'),
    ("Facebook", "#", '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.7c0-.93.26-1.56 1.6-1.56H16.7V3.35A21 21 0 0 0 14.24 3.2c-2.45 0-4.13 1.5-4.13 4.24v2.36H7.4V12.8h2.7v8z"/></svg>'),
    ("X", "#", '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 3l7.1 9.1L3.4 21H6l5.4-6.4L15.9 21H21l-7.4-9.5L20.3 3H17.7l-5 5.9L8.1 3z"/></svg>'),
]

FOOTER_COLUMNS = [
    ("Company", [
        ("About", "/about/"), ("Capabilities", "/about/capabilities/"),
        ("Design & Development", "/about/design-and-development/"),
        ("Leadership", "/about/leadership/"), ("Quality", "/quality/"),
    ]),
    ("Products", [
        ("Men's", "/products/mens/"), ("Women's", "/products/womens/"),
        ("Track Suits (Men's)", "/products/mens/mens-track-suits/"),
        ("Lounge Wear (Men's)", "/products/mens/mens-lounge-wear/"),
        ("Dresses (Women's)", "/products/womens/dresses/"),
        ("Athleisure (Women's)", "/products/womens/athleisure/"),
    ]),
    ("Manufacturing", [
        ("Knitting", "/manufacturing/knitting/"), ("Printing", "/manufacturing/printing/"),
        ("Embroidery", "/manufacturing/embroidery/"), ("Stitching", "/manufacturing/stitching/"),
        ("Finishing", "/manufacturing/finishing/"), ("Value Addition", "/manufacturing/value-addition/"),
    ]),
    ("Resources", [
        ("Facility", "/facility/"), ("Projects", "/projects/"), ("Insights", "/insights/"), ("Careers", "/careers/"),
    ]),
    ("Contact", [
        (ADDRESS, None), (PHONE, f"tel:{PHONE_HREF}"), (EMAIL, f"mailto:{EMAIL}"),
    ]),
]

# =============================================================================
# PAGE MANIFEST
# =============================================================================
PAGES = []

def add(**kw):
    kw.setdefault("kind", "detail")
    PAGES.append(kw)
    return kw

# --- HOME --------------------------------------------------------------------
add(path="/", title=f"{SITE_NAME} — Apparel Manufacturing in Ludhiana, Punjab", kind="home", category=None,
    description=f"{SITE_NAME} is an apparel and garment manufacturing company based in Ludhiana, Punjab, India, with integrated stitching, cutting, printing, embroidery and dispatch capabilities.")

# --- ABOUT ---------------------------------------------------------------------
add(path="/about/", title="About Us", kind="hub", category="about",
    heading="About MJ Oswal Exports", eyebrow="About Us",
    lede=f"{LEGAL_NAME} is a vertically integrated, export-oriented garment manufacturer based in {LOCATION}, founded in {FOUNDED_YEAR} and specialising in circular knitted garments.",
    children=[
        {"href": "/about/company/", "title": "Company", "text": "Who we are and what we manufacture.", "image": IMAGES["team"]["our-people"]["src"]},
        {"href": "/about/capabilities/", "title": "Capabilities", "text": "Our core strengths, built for scale.", "image": IMAGES["facility"]["overview"]["src"]},
        {"href": "/about/design-and-development/", "title": "Design & Development", "text": "From idea to finished garment.", "image": IMAGES["team"]["design-team"]["src"]},
        {"href": "/about/leadership/", "title": "Leadership", "text": "The people leading MJ Oswal Exports.", "image": IMAGES["team"]["leadership"]["src"]},
        {"href": "/about/our-people/", "title": "Our People", "text": "700+ people, one shared standard.", "image": IMAGES["team"]["production-team"]["src"]},
        {"href": "/about/design-team/", "title": "Design Team", "text": "In-house design and pattern-making.", "image": IMAGES["team"]["design-team"]["src"]},
        {"href": "/about/quality-team/", "title": "Quality Team", "text": "Quality control across every stage.", "image": IMAGES["team"]["quality-team"]["src"]},
        {"href": "/about/production-team/", "title": "Production Team", "text": "Running the production floor daily.", "image": IMAGES["team"]["production-team"]["src"]},
        {"href": "/about/manufacturing-team/", "title": "Manufacturing Team", "text": "Eight departments, one production line.", "image": IMAGES["team"]["manufacturing-team"]["src"]},
    ])

add(path="/about/capabilities/", title="Capabilities — About", kind="detail", category="about",
    heading="Capabilities", eyebrow="About Us", hero_image=IMAGES["facility"]["overview"]["src"],
    lede="Strength in scale. Excellence in delivery. Our integrated processes, infrastructure and expertise empower us to deliver consistent quality, at scale, every single day.",
    highlights=[
        {"title": "Scalable Operations", "text": "Built for scale — 30,000 pieces stitched per day"},
        {"title": "Reliable Processes", "text": "Vertically integrated from fabric to pack, under one roof"},
        {"title": "Consistent Quality", "text": "Checked at every critical stage of production"},
        {"title": "Timely Delivery", "text": "A production line organised for dependable turnaround"},
    ],
    body=[
        "Our core strengths are built for scale, designed for quality and committed to value: large-scale capacity, high-efficiency production, a robust supply chain, flexible and dependable operations, and a genuinely customer-focused approach.",
        "Large Scale Capacity — 20 circular and 2 interlock knitting machines, 4 flat knitting machines, 11 automatic screen printing machines and multi-head embroidery machines work together across our eight integrated departments.",
        "High Efficiency Production — approximately 9 tons of circular knitted fabric produced per day, feeding a stitching line capable of 30,000 pieces per day.",
        "Robust Supply Chain — knitting, cutting, printing, embroidery, stitching, finishing and value addition are all managed in-house, reducing dependency on external vendors at every stage.",
        "Flexible & Dependable — from small logos to complex, multicolour designs and detailed embroidery, our production line is built to handle a wide range of styles and value additions.",
        "Customer Focused — every stage of our process, from pattern to packing, is checked against defined standards so customers receive the product they approved.",
    ],
    related=[{"title": "Manufacturing", "href": "/manufacturing/"}, {"title": "Quality", "href": "/quality/"}, {"title": "Design & Development", "href": "/about/design-and-development/"}])

add(path="/about/design-and-development/", title="Design & Development — About", kind="detail", category="about",
    heading="Design & Development", eyebrow="About Us", hero_image=IMAGES["team"]["design-team"]["src"],
    lede="From idea to finished garment. At MJ Oswal, product development begins long before production — our design and development capabilities bring together fabric, construction, colour, print and garment expertise to transform ideas into commercially viable products.",
    highlights=[
        {"title": "Fabric Development", "text": "Circular knitted fabrics across constructions, weights, textures and finishes"},
        {"title": "Silhouette & Construction", "text": "Tops, bottoms, coordinated sets, Indian casual wear and contemporary garments"},
        {"title": "Print & Surface Design", "text": "Everyday graphics through to complex, detailed prints"},
        {"title": "Sampling & Prototyping", "text": "Ideas tested and refined before production"},
    ],
    body=[
        "With our vertically integrated manufacturing setup, we are able to develop and refine products with greater control — from fabric and silhouette to surface design and final finishing.",
        "Fabric Development — we develop and work with a wide range of circular knitted fabrics, exploring different constructions, weights, textures and finishes to achieve the desired look and performance.",
        "Silhouette & Construction — our teams work on tops, bottoms, coordinated sets, Indian casual wear and contemporary garments, with attention to fit, proportions, construction and functionality.",
        "Print & Surface Design — from clean everyday graphics to complex prints and detailed surface treatments, we develop designs with a focus on precision, placement and consistency.",
        "Sampling & Prototyping — ideas are translated into samples, tested and refined before moving into production, letting us evaluate fit, fabric behaviour, construction, print execution and finishing at every stage.",
        "Technical Development — our development process combines creative direction with technical understanding, ensuring designs are not only visually strong but also manufacturable, repeatable and commercially practical.",
        "Our strength lies in bringing design and manufacturing together. Because our capabilities extend from fabric to finished garment, we can experiment, develop and execute complex products while maintaining control over quality and consistency — where ideas are developed into garments.",
    ],
    related=[{"title": "Design Team", "href": "/about/design-team/"}, {"title": "Capabilities", "href": "/about/capabilities/"}, {"title": "Manufacturing", "href": "/manufacturing/"}])

add(path="/about/company/", title="Company — About", kind="detail", category="about",
    heading="Company", eyebrow="About Us", hero_image=IMAGES["team"]["our-people"]["src"],
    lede=f"{LEGAL_NAME}, trading as {SITE_NAME}, is an apparel and garment manufacturing company based in {LOCATION}. The company is associated with the brand Sweet Touch.",
    highlights=[
        {"title": "Legal Name", "text": LEGAL_NAME},
        {"title": "Location", "text": LOCATION},
        {"title": "Industry", "text": "Apparel, garment and textile manufacturing"},
        {"title": "Associated Brand", "text": "Sweet Touch"},
    ],
    body=[
        f"Founded in {FOUNDED_YEAR}, MJ Oswal began as a fabric manufacturing company, building a strong foundation in textiles, materials and manufacturing. As the business grew, we expanded into home products, deepening our understanding of textile applications and strengthening our capabilities in quality, production and sourcing.",
        "In 2010, we took a significant step forward and entered garment manufacturing — starting with tops, bottoms and Indian casual wear including kurtis, and gradually expanding our product range, capabilities and manufacturing expertise.",
        "Today, MJ Oswal Exports is an export-oriented garment manufacturer specialising in circular knitted garments, producing a wide range of tops, bottoms, coordinated sets and contemporary Indian casual wear.",
        "Our manufacturing units are vertically integrated from fabric to pack — from knitting and fabric development to cutting, printing, garment manufacturing, finishing, quality control and packing, we bring the key stages of production under one integrated system. That integration gives us greater control over quality, consistency, development, lead times and execution.",
        "Our vision is to be recognised as a dependable, quality-first manufacturing partner for domestic and export customers alike, built on the same integration and quality discipline that has carried us from a single fabric business to a complete garment manufacturing platform.",
        "Our mission is straightforward: manufacture apparel that meets consistent quality and delivery standards, through a production line that keeps knitting, design, cutting, printing, embroidery, stitching, finishing and dispatch under one roof.",
        "At MJ Oswal, quality is not simply an end result — it is a standard built into every stage of the process, from the first metre of fabric to the last piece packed for dispatch.",
    ],
    related=[{"title": "Capabilities", "href": "/about/capabilities/"}, {"title": "Leadership", "href": "/about/leadership/"}, {"title": "Our Manufacturing", "href": "/manufacturing/"}])

add(path="/about/leadership/", title="Leadership — About", kind="detail", category="about",
    heading="Leadership", eyebrow="About Us", hero_image=IMAGES["team"]["leadership"]["src"],
    lede="[Add verified leadership names, titles and biographies here. No names or positions are published until confirmed.]",
    highlights=[
        {"title": "[Leadership Name]", "text": "[Title / Role — to be confirmed]"},
        {"title": "[Leadership Name]", "text": "[Title / Role — to be confirmed]"},
    ],
    body=["This page is ready to present verified leadership profiles. [Provide names, titles and short biographies to complete this page.]"],
    related=[{"title": "Company", "href": "/about/company/"}, {"title": "Our People", "href": "/about/our-people/"}])

add(path="/about/our-people/", title="Our People — About", kind="detail", category="about",
    heading="Our People", eyebrow="About Us", hero_image=IMAGES["team"]["our-people"]["src"],
    lede="At MJ Oswal, our capabilities are powered by a team of 700+ people working together across manufacturing, management, design and business operations.",
    highlights=[
        {"title": "Total Workforce", "text": "700+ people"},
        {"title": "Organisation", "text": "General Management, Department Heads, Managers, Designers, Merchandising, Accounts, Quality, Production, Technical and Support Teams"},
        {"title": "Culture", "text": "Built around responsibility, teamwork, learning and continuous improvement"},
    ],
    body=[
        "From the production floor to the management team, every department plays an important role in delivering the standards we set for our products and our customers.",
        "Our management and department heads provide direction, planning and operational leadership, while our managers and technical teams ensure that processes are executed with discipline and consistency. Our design and development teams bring creativity and product understanding; our production and quality teams turn these ideas into finished garments, while our accounts, merchandising and support functions keep the business moving efficiently.",
        "With more than 700 employees, we believe our strength comes not only from our infrastructure and technology, but from the people who operate it every day — one integrated team, working to one shared standard.",
    ],
    related=[{"title": "Manufacturing Team", "href": "/about/manufacturing-team/"}, {"title": "Design Team", "href": "/about/design-team/"}, {"title": "Quality Team", "href": "/about/quality-team/"}])

add(path="/about/design-team/", title="Design Team — About", kind="detail", category="about",
    heading="Design Team", eyebrow="About Us", hero_image=IMAGES["team"]["design-team"]["src"],
    lede="Our design and development team brings together fabric, construction, colour, print and garment expertise to turn ideas into commercially viable products.",
    highlights=[
        {"title": "Fabric Development", "text": "Circular knitted fabrics across different constructions, weights, textures and finishes"},
        {"title": "Silhouette & Construction", "text": "Tops, bottoms, coordinated sets, Indian casual wear and contemporary garments"},
        {"title": "Print & Surface Design", "text": "From clean everyday graphics to complex prints and detailed surface treatments"},
        {"title": "Sampling & Prototyping", "text": "Ideas translated into samples, tested and refined before production"},
    ],
    body=["Our design process combines creative direction with technical understanding, so every design is not only visually strong but also manufacturable, repeatable and commercially practical — full detail on our Design & Development page."],
    related=[{"title": "Design & Development", "href": "/about/design-and-development/"}, {"title": "Quality Team", "href": "/about/quality-team/"}])

add(path="/about/quality-team/", title="Quality Team — About", kind="detail", category="about",
    heading="Quality Team", eyebrow="About Us", hero_image=IMAGES["team"]["quality-team"]["src"],
    lede="Quality is checked at multiple stages of production, not only at the end of the line — our quality team is built into the manufacturing process from the very beginning.",
    highlights=[
        {"title": "Focus", "text": "In-line and final quality checks across the full production line"},
        {"title": "Coverage", "text": "Fabric quality, production control, print & design precision, garment quality, final inspection, packing & dispatch"},
        {"title": "Standard", "text": "Consistency, control and confidence — from fabric to pack"},
    ],
    body=["Full detail on how quality is checked at every stage is covered on our Quality page."],
    related=[{"title": "Quality", "href": "/quality/"}, {"title": "Facility: Quality Control", "href": "/facility/quality-control/"}])

add(path="/about/production-team/", title="Production Team — About", kind="detail", category="about",
    heading="Production Team", eyebrow="About Us", hero_image=IMAGES["team"]["production-team"]["src"],
    lede="Our production and technical teams run the day-to-day floor across every manufacturing department, executing every process with discipline and consistency.",
    highlights=[
        {"title": "Departments Covered", "text": "Eight integrated departments, from knitting to dispatch"},
        {"title": "Production Capacity", "text": "30,000 pieces per day"},
        {"title": "Fabric Production", "text": "Approximately 9 tons per day"},
    ],
    body=["Managers and technical teams ensure every stage — from fabric to finished garment — is executed to the same standard, in sequence, across our integrated production line."],
    related=[{"title": "Manufacturing", "href": "/manufacturing/"}, {"title": "Facility: Production", "href": "/facility/production/"}])

add(path="/about/manufacturing-team/", title="Manufacturing Team — About", kind="detail", category="about",
    heading="Manufacturing Team", eyebrow="About Us", hero_image=IMAGES["team"]["manufacturing-team"]["src"],
    lede="Eight integrated departments work in sequence to take a garment from yarn to a finished, packed product.",
    highlights=[
        {"title": "Total Workforce", "text": "700+ people"},
        {"title": "Departments", "text": "Knitting, Cutting, Printing, Embroidery, Stitching, Finishing, Value Addition, Packing & Dispatch"},
    ],
    body=["Explore each department individually on our Manufacturing page for department-specific detail and figures."],
    related=[{"title": "Manufacturing Overview", "href": "/manufacturing/"}, {"title": "Facility", "href": "/facility/"}])

# --- BUSINESSES ------------------------------------------------------------------
add(path="/businesses/", title="Our Businesses", kind="hub", category="businesses",
    heading="Our Businesses", eyebrow="What We Do",
    lede="MJ Oswal Exports manufactures wearing apparel and knitted, ready-made garments, built on three connected capabilities: our own knitwear, the apparel we cut and print from it, and the finished garments we stitch, finish and dispatch.",
    children=[
        {"href": "/businesses/apparel/", "title": "Apparel", "text": "Ready-made apparel manufactured across our full Men's and Women's product range.", "image": IMAGES["businesses"]["apparel"]["src"]},
        {"href": "/businesses/knitwear/", "title": "Knitwear", "text": "Circular knitted fabric produced in-house, feeding directly into our cutting and stitching lines.", "image": IMAGES["businesses"]["knitwear"]["src"]},
        {"href": "/businesses/garments/", "title": "Garments", "text": "Full ready-made garment manufacturing, vertically integrated from fabric to pack.", "image": IMAGES["businesses"]["garments"]["src"]},
    ])
BUSINESS_SUB = [
    ("apparel", "Apparel", "Ready-made apparel manufacturing", "We manufacture circular knitted apparel across our full Men's and Women's range, produced through our integrated design, cutting, printing and stitching departments."),
    ("knitwear", "Knitwear", "Knitted garment manufacturing", "Our knitwear production starts on our own knitting floor — 20 circular and 2 interlock knitting machines, plus 4 flat knitting machines — feeding directly into our cutting and stitching lines."),
    ("garments", "Garments", "End-to-end garment manufacturing", "From raw fabric through to a packed, dispatch-ready garment, our eight manufacturing departments work as one integrated production line."),
]
for slug, title, heading, lede in BUSINESS_SUB:
    add(path=f"/businesses/{slug}/", title=f"{title} — Businesses", kind="detail", category="businesses",
        heading=heading, eyebrow="Our Businesses", lede=lede, hero_image=IMAGES["businesses"][slug]["src"],
        highlights=[
            {"title": "Manufactured In-House", "text": "Knitting, design, cutting, printing, embroidery and stitching"},
            {"title": "Production Capacity", "text": "30,000 pieces per day"},
            {"title": "Fabric Production", "text": "Approximately 9 tons of circular knitted fabric per day"},
        ],
        body=[f"See our Manufacturing page for a full, department-by-department breakdown of how our {title.lower()} business area operates."],
        related=[{"title": t, "href": f"/businesses/{s}/"} for s, t, *_ in BUSINESS_SUB if s != slug])

# --- PRODUCTS ---------------------------------------------------------------------
# Three real levels, matching the product range in the company's own
# profile document: Products (Men's / Women's) > subcategory (e.g. Track
# Suits) > individual product. Every level reuses the same "hub" /
# "catalog" / "product" renderers already built for this.
add(path="/products/", title="Products", kind="hub", category="products",
    heading="Products", eyebrow="What We Make",
    lede="MJ Oswal Exports manufactures circular knitted garments for men and women, produced through our integrated fabric-to-pack production line.",
    children=[{"href": f"/products/{p['slug']}/", "title": p["name"], "text": p["description"], "image": p["image"]} for p in PRODUCTS])

for p in PRODUCTS:
    subcats = SUBCATS_BY_GENDER.get(p["slug"], [])
    add(path=f"/products/{p['slug']}/", title=f"{p['name']} — Products", kind="hub", category="products",
        heading=p["name"], eyebrow="Products", lede=p["description"],
        children=[{"href": f"/products/{p['slug']}/{s['slug']}/", "title": s["name"], "text": s["description"], "image": s["image"]} for s in subcats])

    for sub in subcats:
        catalog_items = CATALOG_ITEMS_BY_CATEGORY.get(sub["slug"], [])
        add(path=f"/products/{p['slug']}/{sub['slug']}/", title=f"{sub['name']} — {p['name']} — Products", kind="catalog", category="products",
            heading=f"{p['name']} {sub['name']}", eyebrow=f'{p["name"]} — Products', lede=sub["description"], hero_image=sub["image"],
            catalog_items=catalog_items, parents=[(p["name"], f"/products/{p['slug']}/")])

        for item in catalog_items:
            others = [o for o in catalog_items if o["slug"] != item["slug"]]
            add(path=f"/products/{p['slug']}/{sub['slug']}/{item['slug']}/", title=f"{item['name']} — {p['name']} {sub['name']} — Products",
                kind="product", category="products",
                parents=[(p["name"], f"/products/{p['slug']}/"), (sub["name"], f"/products/{p['slug']}/{sub['slug']}/")],
                heading=item["name"], eyebrow=f'{p["name"]} {sub["name"]} — Products', lede=item["description"],
                hero_image=item["image"], item=item,
                related=[{"title": o["name"], "href": f"/products/{p['slug']}/{sub['slug']}/{o['slug']}/"} for o in others])

# --- MANUFACTURING -----------------------------------------------------------------
# Every figure below comes directly from the company's own profile document
# (M.J. Oswal Exports Pvt. Ltd.) — nothing here is estimated or invented.
MFG_PROCESS = ["Fabric Inspection", "Cutting", "Stitching", "Pressing",
               "Inspection", "Packing", "Quality Check", "Dispatch"]

MFG_DEPTS = [
    ("knitting", "Knitting", "From yarn to fabric, quality at every loop",
     "We knit our own circular knitted fabric in-house, giving us direct control over fabric quality from the very first stage of production — before a single garment is cut.",
     [("Circular & Interlock Knitting Machines", "20 circular and 2 interlock knitting machines — high-speed, computerised machines for consistent fabric quality and output"),
      ("Flat Knitting Machines", "4 machines for specialised fabrics, built for precision and versatility"),
      ("Machine Operators", "2 additional machine operators ensuring smooth operations and maximum machine efficiency"),
      ("Quality Checking", "Every roll is checked on 3 automatic checking tables for defects and quality"),
      ("Fitters", "2–3 experienced fitters ensuring machine maintenance, settings and uptime"),
      ("Fabric Production", "Approximately 9 tons of fabric per day")]),

    ("cutting", "Cutting", "Precision cutting for consistency",
     "Fabric is relaxed, checked and prepared before cutting, so every panel is cut to accurate measurements ahead of stitching.",
     [("Process", "Fabric preparation, relaxing and checking ahead of cutting"),
      ("Focus", "Accurate measurements and consistent panel quality for strength and fit")]),

    ("printing", "Printing", "Precise prints, vibrant designs, consistent quality",
     "Our printing process combines advanced technology, skilled manpower and robust systems to deliver vibrant, durable, high-quality prints for every collection.",
     [("Automatic Screen Printing Machines", "11 automatic screen printing machines, plus 1 manual printing machine"),
      ("Curing Machines", "2 gas curing machines, ensuring proper curing for long-lasting prints"),
      ("Fusing Machines", "4 machines used for stickers and patches"),
      ("Colours per Print", "Up to 7–8 colours per print, supporting vibrant, detailed multicolour designs"),
      ("Laser Cutting Machine", "1 machine for accurate, clean cutting of printed fabric"),
      ("Plotter Machine", "1 machine for precise plotting and design handling"),
      ("Print Tables", "10 tables for screen printing, plus 10 additional tables — capacity of around 100 gowns / 5,000 pieces in production"),
      ("Staffing", "Approximately 3–4 people, reviewed monthly to maintain efficiency")]),

    ("embroidery", "Embroidery", "Elevating every detail",
     "Embroidery adds elegance, texture and durability to every piece. Our advanced embroidery machines combine precision engineering with expert craftsmanship to ensure consistency and superior quality in every stitch.",
     [("Machines", "Multi-head embroidery machines for high-speed, efficient embroidery"),
      ("Production Speed", "High-speed production for maximum efficiency"),
      ("Design Range", "From small logos to complex, detailed patterns"),
      ("Quality", "Consistent quality maintained across every production run")]),

    ("stitching", "Stitching", "Bringing quality together, stitch by stitch",
     "Stitching brings every piece together with expertise and care. Our skilled workforce and advanced stitching technology ensure strength, comfort and a perfect finish in every garment.",
     [("Production Capacity", "30,000 pieces per day"),
      ("Process", "Fabric preparation, cutting, stitching, pressing, final check and ready to ship"),
      ("Focus", "Strong seams, consistent quality and comfort-focused finishing")]),

    ("finishing", "Finishing", "The final touch that defines quality",
     "Finishing gives our garments a refined look, enhanced comfort and long-lasting performance. Every detail is perfected to ensure our products reflect the highest standards.",
     [("Process", "Steaming, thread cleaning, pressing, final inspection and packing"),
      ("Focus", "Flawless appearance, enhanced comfort and durability"),
      ("Quality", "Every piece is inspected to meet our strict quality standards before packing")]),

    ("value-addition", "Value Addition", "Advanced finishing, superior quality, stronger brands",
     "Beyond the basics — DTF printing, heat labels, laser-cut logos and cut stickers add detail, durability and brand identity to a finished garment.",
     [("Techniques", "DTF printing, heat label application, laser-cut logos and cut stickers"),
      ("Applications", "Seamless, tagless labels for comfort, and precision-cut logos for a premium finish"),
      ("Journey", "Quality fabric, design & preparation, value-add application, finishing touch and quality check")]),

    ("dispatch", "Packing & Dispatch", "Careful packing, timely delivery",
     "Quality continues through the final stage — products are checked for correct assortment, labelling and presentation before careful packing and dispatch.",
     [("Process", "Correct assortment and labelling checked, then careful packing for product safety"),
      ("Focus", "Timely dispatch with complete reliability")]),
]

add(path="/manufacturing/", title="Manufacturing", kind="hub", category="manufacturing",
    heading="Manufacturing", eyebrow="How We Build",
    lede="Eight integrated departments carry every garment from yarn to a packed, dispatch-ready product — vertically integrated under one roof in Ludhiana.",
    children=[{"href": f"/manufacturing/{slug}/", "title": title, "text": lede2,
               "image": IMAGES["manufacturing"][slug]["src"]} for slug, title, _, lede2, _ in MFG_DEPTS],
    process=MFG_PROCESS)
for slug, title, heading, lede, stats in MFG_DEPTS:
    others = [(s, t) for s, t, *_ in MFG_DEPTS if s != slug][:3]
    add(path=f"/manufacturing/{slug}/", title=f"{title} — Manufacturing", kind="detail", category="manufacturing",
        heading=heading, eyebrow="Manufacturing", lede=lede, hero_image=IMAGES["manufacturing"][slug]["src"],
        highlights=[{"title": k, "text": v} for k, v in stats],
        body=["Figures on this page are drawn directly from our company profile document."],
        related=[{"title": t, "href": f"/manufacturing/{s}/"} for s, t in others] + [{"title": "Facility", "href": "/facility/"}])

# --- FACILITY ------------------------------------------------------------------
FACILITY_SUB = [
    ("overview", "Overview", "A single, integrated production facility", "Our Ludhiana facility houses every stage of production — from knitting and design through to packing and dispatch — under one roof."),
    ("machinery", "Machinery", "Equipment across eight departments", "Our machinery spans knitting, printing and embroidery equipment, alongside our stitching and finishing lines. Explore the full list on our Machinery showcase."),
    ("production", "Production", "How a garment moves through our floor", "Production moves in sequence — fabric inspection, cutting, stitching, pressing, inspection, packing, quality check, dispatch."),
    ("technology", "Technology", "Built for scale and precision", "Advanced machinery and integrated systems support real-time monitoring and quality control at every stage, from yarn to finished garment."),
    ("capacity", "Capacity", "Production at scale", "30,000 pieces stitched per day, supported by approximately 9 tons of in-house circular knitted fabric production per day."),
    ("quality-control", "Quality Control", "Checked at every stage, not just the end", "Quality is checked through the production line — fabric quality, production control, print & design precision, garment quality, final inspection, and packing & dispatch."),
]
add(path="/facility/", title="Facility", kind="hub", category="facility",
    heading="Our Facility", eyebrow="Where We Manufacture",
    lede=f"Our production facility is based in {LOCATION}, bringing together eight manufacturing departments under one roof.",
    children=[{"href": f"/facility/{s}/", "title": t, "text": lede2, "image": IMAGES["facility"][s]["src"]}
              for s, t, _, lede2 in FACILITY_SUB])
for slug, title, heading, lede in FACILITY_SUB:
    stats = {
        "overview": [("Location", LOCATION), ("Departments", "8 integrated manufacturing departments"), ("Workforce", "700+ people")],
        "machinery": [("Machine Types", "10 distinct machine types across knitting, printing and embroidery"), ("Core Lines", "Knitting, printing, embroidery, stitching, finishing")],
        "production": [("Production Capacity", "30,000 pieces per day"), ("Process", " → ".join(MFG_PROCESS))],
        "technology": [("Focus", "Advanced machinery, integrated systems and real-time quality monitoring"), ("Standard", "International standards, consistently delivered")],
        "capacity": [("Production Capacity", "30,000 pieces per day"), ("Fabric Production", "Approximately 9 tons per day")],
        "quality-control": [("Checkpoints", "In-line and final inspection"), ("Coverage", "Fabric, production, print & design, garment quality, packing & dispatch")],
    }[slug]
    add(path=f"/facility/{slug}/", title=f"{title} — Facility", kind="detail", category="facility",
        heading=heading, eyebrow="Facility", lede=lede, hero_image=IMAGES["facility"][slug]["src"],
        highlights=[{"title": k, "text": v} for k, v in stats],
        body=["Full department-by-department detail is available on our Manufacturing page."],
        related=[{"title": t2, "href": f"/facility/{s2}/"} for s2, t2, *_ in FACILITY_SUB if s2 != slug][:3])

# --- QUALITY ----------------------------------------------------------------------
add(path="/quality/", title="Quality", kind="detail", category=None,
    heading="Quality", eyebrow="Quality", hero_image=IMAGES["facility"]["quality-control"]["src"],
    lede="Quality is our standard, not our final check. At MJ Oswal, quality is built into the manufacturing process from the very beginning — our vertically integrated setup gives us greater control over every stage, from fabric development and knitting to the finished garment and final packing.",
    highlights=[
        {"title": "01 — Pattern", "text": "Expert patterning for perfect fit and design accuracy"},
        {"title": "02 — Material", "text": "Carefully selected fabrics and trims that meet our standards"},
        {"title": "03 — Production", "text": "Advanced technology and skilled workmanship ensure precision"},
        {"title": "04 — Verification", "text": "Multi-level inspection at every stage of production"},
        {"title": "05 — Assurance", "text": "Final quality assurance to deliver excellence you can trust"},
    ],
    body=[
        "Our approach is focused on delivering consistent quality, precise execution and reliable standards across every order, checked through six stages of production:",
        "Fabric Quality — we maintain control over fabric development and manufacturing to ensure consistency in construction, GSM, width, hand feel, colour and performance.",
        "Production Control — our integrated manufacturing process allows us to monitor production at every stage, helping identify and address variations before they reach the finished garment.",
        "Print & Design Precision — for value-added and complex designs, we focus on print placement, colour accuracy, construction details and finishing, ensuring the final product reflects the approved development.",
        "Garment Quality — each garment is evaluated for measurements, stitching, construction, appearance, finishing and overall workmanship against defined standards.",
        "Final Inspection — before packing, garments go through a structured quality inspection to ensure they meet the required specifications and approved standards.",
        "Packing & Dispatch — quality continues through the final stage; products are checked for correct assortment, labelling, presentation and packing before they leave our facility.",
        "Across the production floor, quality is checked at every critical stage: fabric inspection, cutting, stitching, pressing, inspection, packing, a final quality check, and dispatch.",
        "We believe every garment should not only look right, but also feel right, perform consistently and meet the standard our customers expect — consistency, control and confidence, built into every stage.",
    ],
    related=[{"title": "Facility: Quality Control", "href": "/facility/quality-control/"}, {"title": "Certifications", "href": "/certifications/"}, {"title": "Quality Team", "href": "/about/quality-team/"}])

# --- SUSTAINABILITY -----------------------------------------------------------------
add(path="/sustainability/", title="Sustainability", kind="hub", category="sustainability",
    heading="Sustainability", eyebrow="Sustainability",
    lede="[Add MJ Oswal Exports' verified sustainability commitments and initiatives here. No specific achievements are claimed until confirmed.]",
    children=[
        {"href": "/sustainability/environment/", "title": "Environment", "text": "[Add verified environmental initiatives here.]", "image": IMAGES["facility"]["overview"]["src"]},
        {"href": "/sustainability/people/", "title": "People", "text": "[Add verified people and workplace initiatives here.]", "image": IMAGES["team"]["our-people"]["src"]},
    ])
add(path="/sustainability/environment/", title="Environment — Sustainability", kind="detail", category="sustainability",
    heading="Environment", eyebrow="Sustainability", hero_image=IMAGES["facility"]["overview"]["src"],
    lede="[Add MJ Oswal Exports' verified environmental commitments and initiatives here.]",
    highlights=[{"title": "[Initiative]", "text": "[Add verified detail once confirmed.]"}],
    body=["No specific environmental claims are made until verified information is provided."],
    related=[{"title": "People", "href": "/sustainability/people/"}, {"title": "Quality", "href": "/quality/"}])
add(path="/sustainability/people/", title="People — Sustainability", kind="detail", category="sustainability",
    heading="People", eyebrow="Sustainability", hero_image=IMAGES["team"]["our-people"]["src"],
    lede="Our 700+ people are at the centre of everything we manufacture.",
    highlights=[
        {"title": "Workforce", "text": "700+ people"},
        {"title": "Departments", "text": "8 integrated manufacturing departments"},
    ],
    body=["[Add verified workplace, safety and people-development initiatives here.]"],
    related=[{"title": "Environment", "href": "/sustainability/environment/"}, {"title": "Our People", "href": "/about/our-people/"}])

# --- PROJECTS -----------------------------------------------------------------------
PROJECTS_DATA = [
    {"slug": "project-01", "title": "[Project Name 01]", "text": "[Short project description.]"},
    {"slug": "project-02", "title": "[Project Name 02]", "text": "[Short project description.]"},
]
add(path="/projects/", title="Projects", kind="hub", category="projects",
    heading="Projects", eyebrow="Our Work",
    lede="[Add verified project or case-study information here once available.]",
    children=[{"href": f"/projects/{pr['slug']}/", "title": pr["title"], "text": pr["text"],
               "image": IMAGES["projects"][i]["src"]} for i, pr in enumerate(PROJECTS_DATA)])
for i, pr in enumerate(PROJECTS_DATA):
    add(path=f"/projects/{pr['slug']}/", title=f"{pr['title']} — Projects", kind="detail", category="projects",
        heading=pr["title"], eyebrow="Projects", lede="[Add a verified project overview here.]",
        hero_image=IMAGES["projects"][i]["src"],
        highlights=[{"title": "Scope", "text": "[Add verified scope of work.]"}, {"title": "Category", "text": "[Add verified product category.]"}],
        body=["[Add verified project detail here once available.]"],
        related=[{"title": pr2["title"], "href": f"/projects/{pr2['slug']}/"} for pr2 in PROJECTS_DATA if pr2["slug"] != pr["slug"]])

# --- CERTIFICATIONS / PARTNERS / EXPORTS ---------------------------------------------
add(path="/certifications/", title="Certifications", kind="detail", category=None,
    heading="Certifications", eyebrow="Certifications", hero_image=IMAGES["facility"]["quality-control"]["src"],
    lede="This page is structured and ready to present our certifications. No certificate names, issuing bodies or years are shown until verified.",
    highlights=[{"title": c["name"], "text": f'{c["issuer"]} · {c["year"]}'} for c in CERTIFICATES],
    body=["[Add verified certification names, issuing organisations and years to complete this page.]"],
    related=[{"title": "Quality", "href": "/quality/"}, {"title": "Facility: Quality Control", "href": "/facility/quality-control/"}])

add(path="/partners/", title="Our Partners", kind="detail", category=None,
    heading="Our Partners", eyebrow="Partners", hero_image=IMAGES["facility"]["overview"]["src"],
    lede="This page is structured and ready to present our partners. No partner or client names are shown until verified and cleared for publication.",
    highlights=[{"title": p["name"], "text": "[Verified relationship detail pending.]"} for p in PARTNERS[:4]],
    body=["[Add verified, publication-cleared partner or client names and logos to complete this page.]"],
    related=[{"title": "Exports", "href": "/exports/"}, {"title": "About", "href": "/about/"}])

add(path="/exports/", title="Exports", kind="detail", category=None,
    heading="Exports", eyebrow="Exports", hero_image=IMAGES["facility"]["overview"]["src"],
    lede="MJ Oswal Exports is an export-oriented garment manufacturer, structured to serve both domestic and export requirements from our vertically integrated Ludhiana facility.",
    highlights=[
        {"title": "Production Capacity", "text": "30,000 pieces per day"},
        {"title": "Export Markets", "text": "[Add verified export markets once confirmed.]"},
        {"title": "Logistics", "text": "[Add verified logistics and shipping detail here.]"},
    ],
    body=["No specific export countries, client names or shipment volumes are claimed until verified."],
    related=[{"title": "Facility: Capacity", "href": "/facility/capacity/"}, {"title": "Contact", "href": "/contact/"}])

# --- INSIGHTS -----------------------------------------------------------------------
INSIGHTS_DATA = [
    {"slug": "article-01", "title": "[Insights Article 01]", "text": "[Short summary of this article.]"},
    {"slug": "article-02", "title": "[Insights Article 02]", "text": "[Short summary of this article.]"},
]
add(path="/insights/", title="Insights", kind="hub", category="insights",
    heading="Insights", eyebrow="Insights",
    lede="News and updates from MJ Oswal Exports.",
    children=[{"href": f"/insights/{a['slug']}/", "title": a["title"], "text": a["text"],
               "image": IMAGES["insights"][i]["src"]} for i, a in enumerate(INSIGHTS_DATA)])
for i, a in enumerate(INSIGHTS_DATA):
    add(path=f"/insights/{a['slug']}/", title=f"{a['title']} — Insights", kind="article", category="insights",
        heading=a["title"], eyebrow="[Category]", date="[Month Year]",
        lede="[Opening summary of this article.]", hero_image=IMAGES["insights"][i]["src"],
        body=["[Add the verified body copy for this article once available.]"],
        related=[{"title": a2["title"], "href": f"/insights/{a2['slug']}/"} for a2 in INSIGHTS_DATA if a2["slug"] != a["slug"]])

# --- CAREERS / CONTACT --------------------------------------------------------------
add(path="/careers/", title="Careers", kind="detail", category=None,
    heading="Careers", eyebrow="Careers", hero_image=IMAGES["team"]["manufacturing-team"]["src"],
    lede="Build your career with a manufacturing team of 700+ people across eight integrated departments.",
    highlights=[
        {"title": "Workforce", "text": "700+ people"},
        {"title": "Departments", "text": "Knitting, cutting, printing, embroidery, stitching, finishing, value addition, dispatch"},
        {"title": "Open Roles", "text": "[Add verified current openings here.]"},
    ],
    body=["[Add verified current job openings, application process and contact details here.]"],
    related=[{"title": "Our People", "href": "/about/our-people/"}, {"title": "Contact", "href": "/contact/"}])

add(path="/contact/", title="Contact Us", kind="contact", category=None,
    heading="Contact Us", eyebrow="Get in Touch",
    lede=f"We would love to hear from you. Reach out to discuss manufacturing, sourcing or partnership opportunities with our team in {LOCATION}.")

# --- LEGAL / UTILITY ------------------------------------------------------------------
add(path="/privacy-policy/", title="Privacy Policy", kind="legal", category="legal",
    heading="Privacy Policy", eyebrow="Legal",
    lede="[This is placeholder legal content and must be reviewed by qualified counsel before publication.]",
    sections=[
        ("Information We Collect", "[Describe the categories of information collected from visitors once confirmed.]"),
        ("How We Use Information", "[Describe how collected information is used.]"),
        ("Cookies & Tracking", "[Describe cookie and analytics usage — see assets/js/analytics.js for the tracking implementation this policy should describe.]"),
        ("Your Rights", "[Describe applicable data-protection rights and how to exercise them.]"),
        ("Contact", "[Provide a verified contact channel for privacy enquiries.]"),
    ])
add(path="/terms-of-use/", title="Terms of Use", kind="legal", category="legal",
    heading="Terms of Use", eyebrow="Legal",
    lede="[This is placeholder legal content and must be reviewed by qualified counsel before publication.]",
    sections=[
        ("Acceptance of Terms", "[Describe the terms under which this site may be used.]"),
        ("Intellectual Property", "[Describe ownership of site content and trademarks.]"),
        ("Limitation of Liability", "[Describe applicable liability limitations.]"),
        ("Governing Law", "[Specify the governing jurisdiction once confirmed.]"),
        ("Contact", "[Provide a verified contact channel for legal enquiries.]"),
    ])

# =============================================================================
# CATEGORY METADATA + LOOKUP
# =============================================================================
CATEGORY_LABEL = {
    "about": "About Us", "businesses": "Our Businesses", "products": "Products",
    "manufacturing": "Manufacturing", "facility": "Facility", "sustainability": "Sustainability",
    "projects": "Projects", "insights": "Insights", "legal": "Legal",
}
CATEGORY_HUB = {
    "about": "/about/", "businesses": "/businesses/", "products": "/products/",
    "manufacturing": "/manufacturing/", "facility": "/facility/", "sustainability": "/sustainability/",
    "projects": "/projects/", "insights": "/insights/",
}
PAGES_BY_PATH = {p["path"]: p for p in PAGES}

# =============================================================================
# HTML ESCAPE + SMALL HELPERS
# =============================================================================
def esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;"))

ARROW_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
CHEVRON_LEFT_SVG = '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
CHEVRON_RIGHT_SVG = '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'

def breadcrumb_trail(page):
    if page["kind"] == "home":
        return []
    trail = [("Home", "/")]
    cat = page.get("category")
    if cat and cat != "legal" and page["path"] != CATEGORY_HUB.get(cat):
        trail.append((CATEGORY_LABEL[cat], CATEGORY_HUB[cat]))
    # "parents" (a list) supports a multi-level chain, e.g. Products > Men's
    # > Track Suits; "parent" (a single tuple) is the older, simpler form
    # still used by pages that only need one intermediate crumb.
    parents = page.get("parents") or ([page["parent"]] if page.get("parent") else [])
    for p in parents:
        if p[1] != page["path"]:
            trail.append(p)
    trail.append((page.get("heading", page["title"]), None))
    return trail

# =============================================================================
# SHARED SHELL: <head>, header, nav panel, footer
# =============================================================================
def render_head(page):
    url = BASE_URL + page["path"]
    title = page["title"] if page["kind"] == "home" else page["title"]
    desc = page.get("description") or page.get("lede") or f'{page.get("heading", SITE_NAME)} — {SITE_NAME}.'
    desc = re.sub(r"\s+", " ", desc).strip()
    og_image = BASE_URL + page.get("hero_image", IMAGES["hero"][0]["src"])
    is_home = page["kind"] == "home"
    robots = "noindex, follow" if page["path"] == "/404.html" else "index, follow"

    schema_blocks = []
    if is_home:
        schema_blocks.append("""  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Corporation",
    "name": "%s",
    "legalName": "%s",
    "url": "%s/",
    "logo": "%s%s",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "%s",
      "addressLocality": "Ludhiana",
      "addressRegion": "Punjab",
      "postalCode": "141007",
      "addressCountry": "IN"
    },
    "telephone": "%s",
    "email": "%s"
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "%s",
    "url": "%s/"
  }
  </script>""" % (SITE_NAME, LEGAL_NAME, BASE_URL, BASE_URL, IMAGES["logo"]["src"], "Rahon Road, Mangat Village Khwajke", PHONE, EMAIL, SITE_NAME, BASE_URL))
    else:
        trail = breadcrumb_trail(page)
        if trail:
            items = []
            for i, (label, href) in enumerate(trail, start=1):
                item = '{"@type": "ListItem", "position": %d, "name": "%s"' % (i, esc(label))
                if href:
                    item += ', "item": "%s%s"' % (BASE_URL, href)
                item += "}"
                items.append(item)
            schema_blocks.append("""  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
%s
    ]
  }
  </script>""" % (",\n".join("      " + i for i in items)))

    return f"""<!DOCTYPE html>
<html lang="en-IN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(desc)}">
  <meta name="robots" content="{robots}">
  <link rel="canonical" href="{url}">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="{SITE_NAME}">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(desc)}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{og_image}">
  <meta property="og:locale" content="en_IN">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(title)}">
  <meta name="twitter:description" content="{esc(desc)}">
  <meta name="twitter:image" content="{og_image}">

  <link rel="icon" href="{IMAGES['logo']['src']}" type="image/svg+xml">
  <link rel="apple-touch-icon" href="{IMAGES['logo']['src']}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
{'  <link rel="preload" as="image" href="' + IMAGES["hero"][0]["src"] + '" fetchpriority="high">' if is_home else ''}
  <link rel="stylesheet" href="/assets/css/main.css">

  <!-- Google Tag Manager loads via assets/js/analytics.js (central GTM_ID/GA4_ID
       config + dataLayer events); GA4 is configured as a tag inside that GTM
       container so there is only one analytics script on the page. -->

{chr(10).join(schema_blocks)}
</head>
"""


def render_header(current_path="/", overlay=False):
    items = []
    for i, item in enumerate(NAV, start=1):
        children = item.get("children")
        card_attr = f' data-card="{item["card"]}"' if item.get("card") and item["card"] != "default" else ""
        is_current = item["url"] == current_path
        current_attr = ' aria-current="page"' if is_current else ""
        sub_html = ""
        if children:
            sub_lis = []
            for c in children:
                c_attr = ' aria-current="page"' if c["url"] == current_path else ""
                sub_lis.append(f'              <li><a href="{c["url"]}"{c_attr}>{esc(c["label"])}</a></li>')
            sub_items = "\n".join(sub_lis)
            sub_html = f'\n            <ul class="site-nav__sublist" data-nav-sublist>\n{sub_items}\n            </ul>'
        items.append(f'''          <li class="site-nav__item" data-nav-item>
            <a href="{item["url"]}" class="site-nav__link" data-nav-link{card_attr}{current_attr}>
              <span class="site-nav__index">{i:02d}</span>
              <span class="site-nav__text">{esc(item["label"])}</span>
              <span class="site-nav__arrow" aria-hidden="true">{ARROW_SVG}</span>
            </a>{sub_html}
          </li>''')

    cards = []
    for key, (img, eyebrow, title) in NAV_CARD_IMAGES.items():
        active = " is-active" if key == "default" else ""
        cards.append(f'''          <figure class="site-nav__card{active}" data-nav-card="{key}">
            <img src="{img}" alt="" width="900" height="1100" loading="lazy">
            <figcaption>
              <span class="site-nav__card-eyebrow">{esc(eyebrow)}</span>
              <span class="site-nav__card-title">{esc(title)}</span>
            </figcaption>
          </figure>''')

    return f"""  <a class="skip-link" href="#main">Skip to content</a>

  <!-- ============ HEADER ============ -->
  <header class="site-header{' site-header--overlay' if overlay else ''}" data-header>
    <div class="site-header__inner">
      <a href="/" class="site-header__logo" aria-label="{SITE_NAME} — Home">
        <img class="site-header__logo-mark" src="{IMAGES['logo']['src']}" alt="" width="44" height="44">
        <span class="site-header__logo-text">MJ Oswal Exports</span>
      </a>

      <div class="site-header__actions">
        <a href="/contact/" class="btn btn--ghost site-header__cta" data-track="cta_click" data-track-label="header_contact">
          <span>Contact</span>
        </a>
        <button type="button" class="menu-toggle" data-menu-toggle aria-expanded="false" aria-controls="site-nav" aria-label="Open menu">
          <span class="menu-toggle__box" aria-hidden="true">
            <span class="menu-toggle__line"></span>
            <span class="menu-toggle__line"></span>
          </span>
          <span class="menu-toggle__label" data-menu-label>Menu</span>
        </button>
      </div>
    </div>
  </header>

  <!-- ============ FULL-SCREEN NAVIGATION ============ -->
  <nav class="site-nav" id="site-nav" data-site-nav aria-label="Primary" aria-hidden="true" inert>
    <div class="site-nav__panel">
      <div class="site-nav__col site-nav__col--links">
        <ol class="site-nav__list" data-nav-list>
{chr(10).join(items)}
        </ol>

        <div class="site-nav__meta">
          <div class="site-nav__meta-block">
            <p class="site-nav__meta-label">Get in touch</p>
            <a href="/contact/" data-track="nav_contact">Contact us</a>
            <span class="site-nav__meta-note">{LOCATION}</span>
          </div>
        </div>
      </div>

      <div class="site-nav__col site-nav__col--visual" aria-hidden="true">
        <div class="site-nav__cards" data-nav-cards>
{chr(10).join(cards)}
        </div>
      </div>
    </div>

    <button type="button" class="site-nav__close" data-menu-close aria-label="Close menu">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
  </nav>
  <div class="site-nav__overlay" data-nav-overlay></div>
"""


def render_footer():
    cols = []
    for heading, links in FOOTER_COLUMNS:
        items = "\n".join(
            f'          <li><a href="{href}">{esc(label)}</a></li>' if href else f'          <li>{esc(label)}</li>'
            for label, href in links)
        cols.append(f'''        <nav class="site-footer__col" aria-label="{esc(heading)}">
          <h3>{esc(heading)}</h3>
          <ul>
{items}
          </ul>
        </nav>''')

    return f"""  <!-- ============ FOOTER ============ -->
  <footer class="site-footer" id="contact">
    <div class="container site-footer__top">
      <div class="site-footer__brand">
        <a href="/" class="site-footer__logo" aria-label="{SITE_NAME} — Home">
          <img class="site-footer__logo-mark" src="{IMAGES['logo']['src']}" alt="" width="40" height="40">
          <span>MJ Oswal Exports</span>
        </a>
        <p class="site-footer__tagline">From fabric to fashion, since {FOUNDED_YEAR}.</p>
        <p class="site-footer__note">Social links on this footer are shown as placeholders until the real profile URLs are confirmed. <span class="placeholder">[Add real social media URLs here.]</span></p>
        <div class="site-footer__social placeholder" aria-label="Social media — placeholder links, not yet confirmed">
{chr(10).join(f'          <a href="{href}" aria-label="{esc(label)}" rel="noopener">{icon}</a>' for label, href, icon in SOCIAL_LINKS)}
        </div>
      </div>
{chr(10).join(cols)}
    </div>

    <div class="container site-footer__bottom">
      <p>&copy; <span data-current-year>2026</span> {LEGAL_NAME}. All rights reserved.</p>
      <ul class="site-footer__legal">
        <li><a href="/privacy-policy/">Privacy Policy</a></li>
        <li><a href="/terms-of-use/">Terms of Use</a></li>
      </ul>
    </div>
  </footer>

  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

  <script src="https://cdn.jsdelivr.net/npm/jquery@4.0.0/dist/jquery.min.js" integrity="sha384-fgGyf7Mo7DURSOMnOy7ed+dkq5Job205Gnzu6QIg0BOHKaqt4D76Dt8VlDCzcMHV" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/lenis@1.1.14/dist/lenis.min.js" integrity="sha384-O55L/6rhHr9CFvrxqv5luxOCcmVaBmETbZbJDP+Do8T0pztTACsFBD/IXCNkj7DV" crossorigin="anonymous"></script>
  <script src="/assets/js/analytics.js"></script>
  <script src="/assets/js/smooth-scroll.js"></script>
  <script src="/assets/js/navigation.js"></script>
  <script src="/assets/js/hero-slider.js"></script>
  <script src="/assets/js/carousel.js"></script>
  <script src="/assets/js/lightbox.js"></script>
  <script src="/assets/js/cursor.js"></script>
  <script src="/assets/js/animations.js"></script>
  <script src="/assets/js/main.js"></script>
</body>
</html>
"""


def render_breadcrumb(page):
    trail = breadcrumb_trail(page)
    if not trail:
        return ""
    items = []
    for label, href in trail:
        if href:
            items.append(f'<li><a href="{href}">{esc(label)}</a></li>')
        else:
            items.append(f'<li aria-current="page">{esc(label)}</li>')
    return f'''      <nav class="breadcrumb" aria-label="Breadcrumb">
        <ol>
          {"".join(items)}
        </ol>
      </nav>
'''


def render_page_header(page):
    breadcrumb = render_breadcrumb(page)
    lede = page.get("lede", "")
    lede_html = f'\n        <p class="page-header__lede">{lede}</p>' if lede else ""
    return f'''  <!-- ============ PAGE HEADER ============ -->
  <div class="page-header">
    <div class="container">
{breadcrumb}      <p class="eyebrow">{esc(page.get("eyebrow", CATEGORY_LABEL.get(page.get("category"), SITE_NAME)))}</p>
      <h1 class="page-header__heading">{page.get("heading", page["title"])}</h1>{lede_html}
    </div>
  </div>
'''

# =============================================================================
# REUSABLE CONTENT BLOCKS
# =============================================================================
def block_tile_grid(items):
    cards = []
    for i, it in enumerate(items):
        img = it.get("image", IMAGES["hero"][0]["src"])
        cat = f'<span class="tile-card__category placeholder">{esc(it["category"])}</span>' if it.get("category") else ""
        cards.append(f'''        <a class="tile-card" href="{it["href"]}" data-reveal="fade-up" data-reveal-delay="{min(i, 4) * 80}">
          <span class="tile-card__frame">
            <img src="{img}" alt="" width="900" height="1100" loading="lazy">
          </span>
          <span class="tile-card__body">
            {cat}
            <span class="tile-card__title">{esc(it["title"])}</span>
            <span class="tile-card__text">{esc(it["text"])}</span>
            <span class="tile-card__cta"><span>Explore</span>{ARROW_SVG}</span>
          </span>
        </a>''')
    return f'''    <section class="section">
      <div class="container">
        <div class="tile-grid">
{chr(10).join(cards)}
        </div>
      </div>
    </section>
'''


def block_highlights(items):
    lis = []
    for i, it in enumerate(items):
        lis.append(f'''          <li class="why__item" data-reveal="fade-up" data-reveal-delay="{i * 60}">
            <span class="why__item-title">{esc(it["title"])}</span>
            <span class="why__item-text">{esc(it["text"])}</span>
          </li>''')
    return f'''    <section class="section section--ink">
      <div class="container">
        <ul class="why__list why__list--standalone">
{chr(10).join(lis)}
        </ul>
      </div>
    </section>
'''


def block_body(paragraphs):
    paras = "\n".join(f'          <p class="article-body__text">{esc(p)}</p>' for p in paragraphs)
    return f'''    <section class="section">
      <div class="container container--article">
        <div class="article-body">
{paras}
        </div>
      </div>
    </section>
'''


def block_related(items, heading="Related"):
    if not items:
        return ""
    links = "\n".join(
        f'          <li><a class="link-arrow" href="{it["href"]}"><span>{esc(it["title"])}</span>{ARROW_SVG}</a></li>'
        for it in items)
    return f'''    <section class="section">
      <div class="container">
        <p class="eyebrow">{esc(heading)}</p>
        <ul class="related-list">
{links}
        </ul>
      </div>
    </section>
'''


def block_cta(heading="Let's talk production.", text="Get in touch with the MJ Oswal Exports team about your next order.",
              primary=("Contact Us", "/contact/"), secondary=("Manufacturing", "/manufacturing/")):
    return f'''    <section class="cta-band">
      <img class="cta-band__bg" src="{IMAGES['facility']['overview']['src']}" alt="" width="1800" height="1000" loading="lazy">
      <div class="container cta-band__content">
        <h2 class="cta-band__heading" data-reveal="fade-up">{esc(heading)}</h2>
        <p class="cta-band__text" data-reveal="fade-up" data-reveal-delay="80">{esc(text)}</p>
        <div class="cta-band__actions" data-reveal="fade-up" data-reveal-delay="160">
          <a href="{primary[1]}" class="btn btn--primary btn--light" data-track="cta_click" data-track-label="cta_primary"><span>{esc(primary[0])}</span>{ARROW_SVG}</a>
          <a href="{secondary[1]}" class="btn btn--text btn--light" data-track="cta_click" data-track-label="cta_secondary"><span>{esc(secondary[0])}</span></a>
        </div>
      </div>
    </section>
'''


def block_hero_image(img):
    return f'''    <figure class="detail-hero">
      <img src="{img}" alt="" width="1600" height="900" loading="eager" fetchpriority="high">
    </figure>
'''


def form_field(label, name, type_="text", required=True, textarea=False):
    req = " required" if required else ""
    req_star = " *" if required else ""
    field = (f'<textarea id="{name}" name="{name}" rows="5"{req}></textarea>' if textarea
             else f'<input type="{type_}" id="{name}" name="{name}"{req}>')
    return f'''          <div class="form-field">
            <label for="{name}">{esc(label)}{req_star}</label>
            {field}
          </div>'''


def block_form():
    name_row = f'''          <div class="form-row">
{form_field("First Name", "first_name")}
{form_field("Last Name", "last_name")}
          </div>'''
    fields = [name_row, form_field("Email Address", "email", "email"),
              form_field("Phone Number", "phone", "tel", required=False), form_field("Message", "message", textarea=True)]
    return f'''        <form class="contact-form" action="/contact/thank-you/" method="get" data-track-form="contact">
{chr(10).join(fields)}
          <button type="submit" class="btn btn--primary">
            <span>Send Message</span>{ARROW_SVG}
          </button>
          <p class="contact-form__note">This form is a working front-end demo — connect it to a real endpoint before launch.</p>
        </form>
'''


def block_legal_sections(sections):
    secs = []
    for heading, text in sections:
        secs.append(f'''        <div class="legal-section">
          <h2>{esc(heading)}</h2>
          <p>{esc(text)}</p>
        </div>''')
    return f'''    <section class="section">
      <div class="container container--article">
{chr(10).join(secs)}
      </div>
    </section>
'''


# --- Generic carousel (reused by Featured Products, Certifications, Partners) ------
def block_carousel(track_id, title_html, items_html_list, *, per_view="products", autoplay_ms=3500, aria_label="Carousel"):
    """items_html_list: list of already-rendered <div class="carousel__item">...</div> strings."""
    items = "\n".join(items_html_list)
    return f'''    <section class="section carousel-section" data-carousel-section>
      <div class="container">
{title_html}
      </div>
      <div class="carousel" data-carousel data-carousel-id="{track_id}" data-per-view="{per_view}" data-autoplay="{autoplay_ms}" aria-roledescription="carousel" aria-label="{esc(aria_label)}">
        <div class="carousel__viewport">
          <div class="carousel__track" data-carousel-track>
{items}
          </div>
        </div>
        <div class="carousel__controls">
          <button type="button" class="carousel__nav-btn" data-carousel-prev aria-label="Previous">{CHEVRON_LEFT_SVG}</button>
          <div class="carousel__dots" data-carousel-dots role="tablist" aria-label="Slide position"></div>
          <button type="button" class="carousel__nav-btn" data-carousel-next aria-label="Next">{CHEVRON_RIGHT_SVG}</button>
        </div>
      </div>
    </section>
'''


def product_carousel_item(p):
    return f'''            <div class="carousel__item">
              <a class="tile-card" href="/products/{p['slug']}/">
                <span class="tile-card__frame"><img src="{p['image']}" alt="" width="900" height="1100" loading="lazy"></span>
                <span class="tile-card__body">
                  <span class="tile-card__category">{esc(p['category'])}</span>
                  <span class="tile-card__title">{esc(p['name'])}</span>
                  <span class="tile-card__text">{esc(p['description'])}</span>
                  <span class="tile-card__cta"><span>View Products</span>{ARROW_SVG}</span>
                </span>
              </a>
            </div>'''


def catalog_item_carousel_item(item, category_label):
    """Featured Products home slider card — links straight to one item's own
    product detail page, e.g. /products/mens/mens-track-suits/mens-track-suits-01/."""
    return f'''            <div class="carousel__item">
              <a class="tile-card" href="/products/{item['gender']}/{item['category']}/{item['slug']}/">
                <span class="tile-card__frame"><img src="{item['image']}" alt="" width="900" height="1100" loading="lazy"></span>
                <span class="tile-card__body">
                  <span class="tile-card__category">{esc(category_label)}</span>
                  <span class="tile-card__title">{esc(item['name'])}</span>
                  <span class="tile-card__text">{esc(item['description'])}</span>
                  <span class="tile-card__cta"><span>View Details</span>{ARROW_SVG}</span>
                </span>
              </a>
            </div>'''


# --- Product catalog grid (category page) + product detail gallery ---------------
def block_product_grid(items, base_path):
    if not items:
        return f'''    <section class="section">
      <div class="container">
        <p class="placeholder">[No products have been added to this category yet — add entries to assets/data/catalog_items.json.]</p>
      </div>
    </section>
'''
    whatsapp_svg = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-1.5-.7-2.5-1.3-3.5-3-.3-.5.3-.4.7-1.5.1-.2 0-.3 0-.5C11 9.5 10.6 8 10.4 7.4c-.2-.5-.3-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.2.3-1 1-1 2.4s1 2.8 1.1 3c.1.2 2 3 4.8 4.3 2.8 1.2 2.8.8 3.3.8.5 0 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.2-.2-.5-.3zM12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.6 1.4 5.1L2 22l5-1.3c1.4.8 3.1 1.3 4.9 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>'
    cards = []
    for i, item in enumerate(items):
        wa_text = f"Hi, I'm interested in the {item['name']} — could you share more details?"
        wa_href = f"https://wa.me/{WHATSAPP_NUMBER}?text={wa_text}".replace(" ", "%20")
        cards.append(f'''        <div class="product-card" data-reveal="fade-up" data-reveal-delay="{min(i, 4) * 70}">
          <a class="product-card__link" href="{base_path}{item['slug']}/">
            <span class="product-card__frame">
              <img src="{item['image']}" alt="" width="900" height="1100" loading="lazy">
            </span>
            <span class="product-card__body">
              <span class="product-card__category">{esc(item['type'])}</span>
              <span class="product-card__title">{esc(item['name'])}</span>
              <span class="product-card__text">{esc(item['description'])}</span>
              <span class="product-card__cta"><span>View Details</span>{ARROW_SVG}</span>
            </span>
          </a>
          <a class="product-card__whatsapp" href="{wa_href}" target="_blank" rel="noopener" data-track="cta_click" data-track-label="product_whatsapp">
            {whatsapp_svg}<span>Enquire on WhatsApp</span>
          </a>
        </div>''')
    return f'''    <section class="section">
      <div class="container">
        <div class="product-grid">
{chr(10).join(cards)}
        </div>
      </div>
    </section>
'''


def block_product_gallery(item):
    """Gallery-grid-first product page: every image shown as its own tile
    (not one hero image + a thin thumbnail strip). Clicking any tile opens
    the same full-screen sliding lightbox at that exact image."""
    gallery = item.get("gallery") or [item["image"]]
    tiles = "\n".join(
        f'''          <button type="button" class="product-gallery-grid__item" data-gallery-thumb data-gallery-src="{img}" aria-label="Open image {i + 1} of {item['name']} in full screen">
            <img src="{img}" alt="" width="900" height="1100" loading="{'eager' if i == 0 else 'lazy'}">
            <span class="product-gallery-grid__zoom" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
          </button>'''
        for i, img in enumerate(gallery))
    close_svg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
    whatsapp_svg = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-1.5-.7-2.5-1.3-3.5-3-.3-.5.3-.4.7-1.5.1-.2 0-.3 0-.5C11 9.5 10.6 8 10.4 7.4c-.2-.5-.3-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.2.3-1 1-1 2.4s1 2.8 1.1 3c.1.2 2 3 4.8 4.3 2.8 1.2 2.8.8 3.3.8.5 0 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.2-.2-.5-.3zM12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.6 1.4 5.1L2 22l5-1.3c1.4.8 3.1 1.3 4.9 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>'
    wa_text = f"Hi, I'm interested in the {item['name']} — could you share more details?"
    wa_href = f"https://wa.me/{WHATSAPP_NUMBER}?text={wa_text}".replace(" ", "%20")
    return f'''    <section class="section product-detail" data-gallery>
      <div class="container">
        <div class="product-detail__header">
          <p class="eyebrow">{esc(item['type'])}</p>
          <h2 class="product-detail__title">{esc(item['name'])}</h2>
          <p class="product-detail__desc">{esc(item['description'])}</p>
        </div>

        <div class="product-gallery-grid">
{tiles}
        </div>

        <!-- Full-screen sliding gallery — opened by clicking any tile above.
             Auto-advances like every other slider on the site, with
             prev/next, its own thumbnail strip, swipe and keyboard support. -->
        <div class="lightbox" data-lightbox hidden>
          <div class="lightbox__backdrop" data-lightbox-close></div>
          <div class="lightbox__dialog" role="dialog" aria-modal="true" aria-label="{esc(item['name'])} image gallery">
            <button type="button" class="lightbox__close" data-lightbox-close aria-label="Close gallery">{close_svg}</button>
            <div class="lightbox__stage">
              <button type="button" class="lightbox__nav lightbox__nav--prev" data-lightbox-prev aria-label="Previous image">{CHEVRON_LEFT_SVG}</button>
              <img data-lightbox-image src="" alt="{esc(item['name'])}">
              <button type="button" class="lightbox__nav lightbox__nav--next" data-lightbox-next aria-label="Next image">{CHEVRON_RIGHT_SVG}</button>
            </div>
            <ul class="lightbox__thumbs" data-lightbox-thumbs></ul>
          </div>
        </div>

        <div class="product-detail__info">
          <dl class="product-detail__meta">
            <div><dt>Fabric</dt><dd class="placeholder">{esc(item['fabric'])}</dd></div>
            <div><dt>Available Styles</dt><dd class="placeholder">{esc(item['styles'])}</dd></div>
            <div><dt>Available Colours</dt><dd class="placeholder">{esc(item['colors'])}</dd></div>
            <div><dt>Manufacturing Capability</dt><dd>{esc(item['capability'])}</dd></div>
          </dl>
          <div class="product-detail__actions">
            <a href="/contact/" class="btn btn--primary" data-track="cta_click" data-track-label="product_enquiry"><span>Enquire About This Product</span>{ARROW_SVG}</a>
            <a href="{wa_href}" target="_blank" rel="noopener" class="btn btn--whatsapp" data-track="cta_click" data-track-label="product_whatsapp">{whatsapp_svg}<span>Enquire on WhatsApp</span></a>
            <a href="/contact/" class="btn btn--outline" data-track="cta_click" data-track-label="product_contact"><span>Contact Us</span></a>
          </div>
        </div>
      </div>
    </section>
'''


def certificate_carousel_item(c):
    return f'''            <div class="carousel__item">
              <div class="cert-card">
                <span class="cert-card__frame"><img src="{c['image']}" alt="{esc(c['name'])}" width="900" height="700" loading="lazy"></span>
                <span class="cert-card__name placeholder">{esc(c['name'])}</span>
                <span class="cert-card__meta placeholder">{esc(c['issuer'])} · {esc(c['year'])}</span>
              </div>
            </div>'''


def partner_carousel_item(p):
    return f'''            <div class="carousel__item carousel__item--logo">
              <div class="partner-card">
                <img src="{p['logo']}" alt="{esc(p['name'])}" width="400" height="200" loading="lazy">
              </div>
            </div>'''


# --- Machinery 3D flip-card slider ---------------------------------------------------
# Maps a machine's category tag to the manufacturing department page its
# "View Details" link should open.
MACHINE_CATEGORY_TO_DEPT = {
    "Knitting": "knitting", "Printing": "printing", "Embroidery": "embroidery",
}

def block_machine_slider():
    cards = []
    for m in MACHINES:
        dept_slug = MACHINE_CATEGORY_TO_DEPT.get(m["category"], "")
        dept_href = f"/manufacturing/{dept_slug}/" if dept_slug else "/facility/machinery/"
        cards.append(f'''            <div class="carousel__item">
              <div class="flip-card" tabindex="0">
                <div class="flip-card__inner">
                  <div class="flip-card__face flip-card__face--front">
                    <img src="{m['image']}" alt="" width="900" height="700" loading="lazy">
                    <span class="flip-card__category">{esc(m['category'])}</span>
                    <span class="flip-card__name">{esc(m['name'])}</span>
                  </div>
                  <div class="flip-card__face flip-card__face--back">
                    <span class="flip-card__back-category">{esc(m['category'])}</span>
                    <span class="flip-card__back-name">{esc(m['name'])}</span>
                    <p class="flip-card__back-desc">{esc(m['description'])}</p>
                    <p class="flip-card__back-details">{esc(m['details'])}</p>
                    <a href="{dept_href}" class="flip-card__back-link">View Details{ARROW_SVG}</a>
                  </div>
                </div>
              </div>
            </div>''')
    title = '''        <div class="section-head section-head--split">
          <div>
            <p class="eyebrow" data-reveal="fade-up">Our Machinery</p>
            <h2 class="section-head__title" data-reveal="fade-up" data-reveal-delay="80">46+ Machines, One Production Line</h2>
          </div>
          <a href="/facility/machinery/" class="link-arrow" data-reveal="fade-up" data-reveal-delay="120"><span>View all machinery</span>''' + ARROW_SVG + '''</a>
        </div>'''
    return block_carousel("machines", title, cards, per_view="machines", autoplay_ms=4500, aria_label="Machinery")


# --- Production process timeline ------------------------------------------------------
PROCESS_LINKS = {
    "Fabric Inspection": "/manufacturing/knitting/", "Cutting": "/manufacturing/cutting/",
    "Stitching": "/manufacturing/stitching/", "Pressing": "/manufacturing/finishing/",
    "Inspection": "/manufacturing/finishing/", "Packing": "/manufacturing/dispatch/",
    "Quality Check": "/quality/", "Dispatch": "/manufacturing/dispatch/",
}

PROCESS_ICONS = {
    "Fabric Inspection": '<circle cx="10" cy="10" r="6"/><path d="M20 20l-5.5-5.5"/>',
    "Cutting": '<circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><line x1="20" y1="4" x2="8.1" y2="15.9"/><line x1="14.5" y1="14.5" x2="20" y2="20"/><line x1="8.1" y1="8.1" x2="12" y2="12"/>',
    "Stitching": '<path d="M4 20c4-1 8-5 9-9 .5-2 2-6 6-7"/><circle cx="19" cy="4" r="1.4" fill="currentColor" stroke="none"/>',
    "Pressing": '<path d="M4 18h13a3 3 0 0 0 3-3v-2c0-3-2-6-6-6H9C6 7 4 10 4 13z"/><path d="M4 18l-1.5 3h17"/>',
    "Inspection": '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    "Packing": '<path d="M3 8l9-4 9 4-9 4-9-4z"/><path d="M3 8v9l9 4 9-4V8"/><path d="M12 12v9"/>',
    "Quality Check": '<path d="M12 2l3 2 4 .5-.5 4 2 3-2 3 .5 4-4 .5-3 2-3-2-4-.5.5-4-2-3 2-3-.5-4 4-.5z"/><path d="M9 12l2 2 4-4"/>',
    "Dispatch": '<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="18" cy="18" r="1.6"/>',
}


def block_process_timeline():
    steps = []
    for i, step in enumerate(MFG_PROCESS, start=1):
        href = PROCESS_LINKS.get(step, "/manufacturing/")
        icon_paths = PROCESS_ICONS.get(step, '<circle cx="12" cy="12" r="8"/>')
        steps.append(f'''        <a class="process-step" href="{href}" data-reveal="fade-up" data-reveal-delay="{min(i, 6) * 40}">
          <span class="process-step__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{icon_paths}</svg>
            <span class="process-step__index">{i:02d}</span>
          </span>
          <span class="process-step__label">{esc(step)}</span>
        </a>''')
    return f'''    <section class="section process-section" aria-labelledby="process-heading">
      <div class="container">
        <div class="section-head">
          <p class="eyebrow" data-reveal="fade-up">How We Build</p>
          <h2 class="section-head__title" id="process-heading" data-reveal="fade-up" data-reveal-delay="80">Our Production Process</h2>
          <p class="section-head__text" data-reveal="fade-up" data-reveal-delay="140">Every garment follows the same eight-step process. Select any step to see that department in detail.</p>
        </div>
        <div class="process-timeline" role="list">
{chr(10).join(steps)}
        </div>
      </div>
    </section>
'''

# =============================================================================
# PER-KIND PAGE BODIES
# =============================================================================
def body_hub(page):
    out = ""
    if page.get("process"):
        out += block_process_timeline()
    out += block_tile_grid(page["children"])
    out += block_cta()
    return out


def body_detail(page):
    out = ""
    if page.get("hero_image"):
        out += block_hero_image(page["hero_image"])
    if page.get("highlights"):
        out += block_highlights(page["highlights"])
    if page.get("body"):
        out += block_body(page["body"])
    if page.get("related"):
        out += block_related(page["related"], f'More from {CATEGORY_LABEL.get(page.get("category"), SITE_NAME)}')
    out += block_cta()
    return out


def body_catalog(page):
    out = block_product_grid(page.get("catalog_items", []), page["path"])
    out += block_cta()
    return out


def body_product(page):
    out = block_product_gallery(page["item"])
    if page.get("related"):
        out += block_related(page["related"], "More From This Category")
    out += block_cta()
    return out


def body_article(page):
    out = block_hero_image(page["hero_image"])
    paras = "\n".join(f'          <p class="article-body__text">{esc(p)}</p>' for p in page["body"])
    out += f'''    <section class="section">
      <div class="container container--article">
        <p class="article-body__meta">{esc(page.get("date", ""))}</p>
        <div class="article-body">
{paras}
        </div>
      </div>
    </section>
'''
    out += block_related(page.get("related", []), "Related Reading")
    out += block_cta()
    return out


def body_contact(page):
    map_query = "Rahon+Road,+Mangat+Village+Khwajke,+Ludhiana,+Punjab+141007,+India"
    phone_svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .7 3a2 2 0 0 1-.4 2.1L8 10.2a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2-.5c1 .4 2 .6 3 .7a2 2 0 0 1 1.7 2z"/></svg>'
    email_svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M4 6l8 7 8-7"/></svg>'
    address_svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s7-6.6 7-12a7 7 0 1 0-14 0c0 5.4 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>'
    return f'''    <section class="section">
      <div class="container contact-grid">
        <div class="contact-grid__info">
          <p class="eyebrow">Reach Us Directly</p>
          <div class="contact-map">
            <iframe src="https://www.google.com/maps?q={map_query}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="{esc(SITE_NAME)} — {esc(LOCATION)}"></iframe>
          </div>
          <div class="contact-info-cards">
            <div class="contact-info-card">
              <span class="contact-info-card__icon">{phone_svg}</span>
              <span class="contact-info-card__label">Phone</span>
              <a class="contact-info-card__value" href="tel:{PHONE_HREF}">{esc(PHONE)}</a>
            </div>
            <div class="contact-info-card">
              <span class="contact-info-card__icon">{email_svg}</span>
              <span class="contact-info-card__label">Email</span>
              <a class="contact-info-card__value" href="mailto:{EMAIL}">{esc(EMAIL)}</a>
            </div>
            <div class="contact-info-card">
              <span class="contact-info-card__icon">{address_svg}</span>
              <span class="contact-info-card__label">Address</span>
              <span class="contact-info-card__value">{esc(ADDRESS)}</span>
            </div>
          </div>
        </div>
        <div class="contact-grid__form">
          <p class="eyebrow">Send a Message</p>
{block_form()}
        </div>
      </div>
    </section>
''' + block_cta()


def body_legal(page):
    return block_legal_sections(page["sections"])


BODY_RENDERERS = {
    "hub": body_hub, "detail": body_detail, "article": body_article,
    "contact": body_contact, "legal": body_legal,
    "catalog": body_catalog, "product": body_product,
}


def assemble_page(page, body_html):
    return render_head(page) + "<body>\n" + render_header(page["path"]) + '  <main id="main">\n' + render_page_header(page) + body_html + "  </main>\n" + render_footer()


# =============================================================================
# WRITE FILES
# =============================================================================
def write_page(path, html):
    if path == "/":
        out_path = os.path.join(ROOT, "index.html")
    else:
        out_path = os.path.join(ROOT, path.strip("/"), "index.html")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w") as f:
        f.write(html)
    return out_path


def build_html_sitemap():
    groups = {}
    for p in PAGES:
        if p["kind"] == "home":
            continue
        cat = p.get("category") or "other"
        groups.setdefault(cat, []).append(p)
    sections = []
    for cat, pages in groups.items():
        items = "\n".join(f'          <li><a href="{p["path"]}">{esc(p.get("heading", p["title"]))}</a></li>' for p in pages)
        sections.append(f'''      <div class="sitemap-group">
        <h2>{esc(CATEGORY_LABEL.get(cat, cat.title()))}</h2>
        <ul>
{items}
        </ul>
      </div>''')
    body = f'''    <section class="section">
      <div class="container">
        <div class="sitemap-grid">
{chr(10).join(sections)}
        </div>
      </div>
    </section>
'''
    page = {"path": "/sitemap/", "title": f"Sitemap — {SITE_NAME}", "kind": "detail", "category": None,
            "heading": "Sitemap", "eyebrow": SITE_NAME, "lede": f"A complete index of every page on the {SITE_NAME} website."}
    return page, body


def build_404():
    page = {"path": "/404.html", "title": f"Page Not Found — {SITE_NAME}", "kind": "detail", "category": None,
            "heading": "Page not found.", "eyebrow": "Error 404",
            "lede": "The page you are looking for may have moved or no longer exists."}
    body = f'''    <section class="section section--center">
      <div class="container">
        <a href="/" class="btn btn--primary"><span>Return to Homepage</span>{ARROW_SVG}</a>
      </div>
    </section>
'''
    return page, body


# =============================================================================
# HOMEPAGE — hero slider + 16-section structure
# =============================================================================
HERO_SLIDES = [
    {"eyebrow": SITE_NAME, "headline": "Precision in<br>Every Stitch",
     "text": "Advanced apparel manufacturing built around quality, consistency and scale.",
     "primary": ("Our Manufacturing", "/manufacturing/"), "secondary": ("About Us", "/about/"), "image": IMAGES["hero"][0]["src"]},
    {"eyebrow": "Design to Delivery", "headline": "Designed for<br>Modern Apparel",
     "text": "From concept and design to finished garments.",
     "primary": ("View Products", "/products/"), "secondary": ("Our Businesses", "/businesses/"), "image": IMAGES["hero"][1]["src"]},
    {"eyebrow": "Integrated Production", "headline": "Built for Scale",
     "text": "Integrated production capabilities across multiple departments.",
     "primary": ("Our Facility", "/facility/"), "secondary": ("Machinery", "/facility/machinery/"), "image": IMAGES["hero"][2]["src"]},
    {"eyebrow": "Domestic &amp; Export", "headline": "Quality That<br>Travels",
     "text": "Reliable manufacturing for domestic and export requirements.",
     "primary": ("Exports", "/exports/"), "secondary": ("Quality", "/quality/"), "image": IMAGES["hero"][3]["src"]},
    {"eyebrow": "Ludhiana, Punjab", "headline": SITE_NAME,
     "text": "Manufacturing apparel with discipline, technology and craftsmanship.",
     "primary": ("Contact Us", "/contact/"), "secondary": ("Careers", "/careers/"), "image": IMAGES["hero"][4]["src"]},
]


def render_hero_slider():
    slides = []
    for i, s in enumerate(HERO_SLIDES):
        active = " is-active" if i == 0 else ""
        heading_tag = "h1" if i == 0 else "p"
        slides.append(f'''      <div class="hero-slider__slide{active}" data-slide role="group" aria-roledescription="slide" aria-label="{i + 1} of {len(HERO_SLIDES)}">
        <div class="hero-slider__media">
          <img src="{s['image']}" alt="" width="1600" height="2000"{' fetchpriority="high"' if i == 0 else ' loading="lazy"'}>
          <div class="hero-slider__scrim" aria-hidden="true"></div>
        </div>
        <div class="hero-slider__content">
          <p class="eyebrow hero-slider__eyebrow">{s['eyebrow']}</p>
          <{heading_tag} class="hero-slider__headline">{s['headline']}</{heading_tag}>
          <p class="hero-slider__text">{s['text']}</p>
          <div class="hero-slider__actions">
            <a href="{s['primary'][1]}" class="btn btn--primary" data-track="cta_click" data-track-label="hero_slide_{i + 1}_primary"><span>{esc(s['primary'][0])}</span>{ARROW_SVG}</a>
            <a href="{s['secondary'][1]}" class="btn btn--text" data-track="cta_click" data-track-label="hero_slide_{i + 1}_secondary"><span>{esc(s['secondary'][0])}</span></a>
          </div>
        </div>
      </div>''')

    dots = "\n".join(
        f'          <button type="button" class="hero-slider__dot{" is-active" if i == 0 else ""}" data-slide-dot="{i}" aria-current="{"true" if i == 0 else "false"}" aria-label="Go to slide {i + 1}"></button>'
        for i in range(len(HERO_SLIDES))
    )

    return f'''    <section class="hero-slider" data-hero-slider aria-roledescription="carousel" aria-label="{SITE_NAME} highlights">
{chr(10).join(slides)}
      <div class="hero-slider__controls">
        <div class="hero-slider__nav">
          <button type="button" class="hero-slider__nav-btn" data-slide-prev aria-label="Previous slide">{CHEVRON_LEFT_SVG}</button>
          <button type="button" class="hero-slider__nav-btn" data-slide-next aria-label="Next slide">{CHEVRON_RIGHT_SVG}</button>
        </div>
        <div class="hero-slider__indicators" role="tablist" aria-label="Slide progress">
{dots}
        </div>
        <span class="hero-slider__count"><span data-slide-current>01</span> / {len(HERO_SLIDES):02d}</span>
        <button type="button" class="hero-slider__pause" data-slide-pause aria-label="Pause autoplay" aria-pressed="false">
          <svg data-icon-pause viewBox="0 0 24 24"><path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor"/></svg>
          <svg data-icon-play viewBox="0 0 24 24" hidden><path d="M7 5l12 7-12 7V5z" fill="currentColor"/></svg>
        </button>
      </div>
    </section>
'''


def body_home():
    out = render_hero_slider()

    # 02 — Company Introduction
    out += f'''
    <section class="intro" id="intro" aria-labelledby="intro-heading">
      <div class="container intro__grid">
        <div class="intro__copy">
          <p class="eyebrow" data-reveal="fade-up">Who We Are</p>
          <h2 class="intro__heading" id="intro-heading" data-reveal="fade-up" data-reveal-delay="80">
            From fabric to fashion, built over three decades in {LOCATION}.
          </h2>
          <p class="intro__text" data-reveal="fade-up" data-reveal-delay="160">
            Founded in {FOUNDED_YEAR}, {LEGAL_NAME} began as a fabric manufacturing company and, in 2010, entered garment manufacturing. Today we're a vertically integrated, export-oriented manufacturer of circular knitted garments — from knitting and design through cutting, printing, embroidery, stitching and dispatch, all under one roof.
          </p>
          <a href="/about/company/" class="link-arrow" data-reveal="fade-up" data-reveal-delay="220"><span>Learn more about us</span>{ARROW_SVG}</a>
        </div>
        <figure class="intro__visual" data-reveal="clip-up" data-reveal-delay="120">
          <img src="{IMAGES['team']['our-people']['src']}" alt="{esc(IMAGES['team']['our-people']['alt'])}" width="1200" height="1500" loading="lazy">
        </figure>
      </div>
    </section>
'''

    # 03 — Our Businesses
    biz_items = [
        {"href": "/businesses/apparel/", "title": "Apparel", "text": "Ready-made apparel across a wide range of categories.", "image": IMAGES["businesses"]["apparel"]["src"]},
        {"href": "/businesses/knitwear/", "title": "Knitwear", "text": "Knitted garments produced through our integrated lines.", "image": IMAGES["businesses"]["knitwear"]["src"]},
        {"href": "/businesses/garments/", "title": "Garments", "text": "Full ready-made garment manufacturing, fabric to finish.", "image": IMAGES["businesses"]["garments"]["src"]},
    ]
    biz_cards = "\n".join(f'''          <a class="tile-card" href="{it['href']}" data-reveal="fade-up" data-reveal-delay="{i * 80}">
            <span class="tile-card__frame"><img src="{it['image']}" alt="" width="900" height="1100" loading="lazy"></span>
            <span class="tile-card__body">
              <span class="tile-card__title">{esc(it['title'])}</span>
              <span class="tile-card__text">{esc(it['text'])}</span>
              <span class="tile-card__cta"><span>Explore</span>{ARROW_SVG}</span>
            </span>
          </a>''' for i, it in enumerate(biz_items))
    out += f'''    <section class="businesses" id="businesses" aria-labelledby="businesses-heading">
      <div class="container">
        <div class="section-head section-head--split">
          <div><p class="eyebrow" data-reveal="fade-up">What We Do</p><h2 class="section-head__title" id="businesses-heading" data-reveal="fade-up" data-reveal-delay="80">Our Businesses</h2></div>
          <a href="/businesses/" class="link-arrow" data-reveal="fade-up" data-reveal-delay="120"><span>View all businesses</span>{ARROW_SVG}</a>
        </div>
        <div class="tile-grid">
{biz_cards}
        </div>
      </div>
    </section>
'''

    # 04 — Featured Products (autoplay carousel)
    product_title = '''        <div class="section-head section-head--split">
          <div>
            <p class="eyebrow" data-reveal="fade-up">What We Make</p>
            <h2 class="section-head__title" data-reveal="fade-up" data-reveal-delay="80">Featured Products</h2>
          </div>
          <a href="/products/" class="link-arrow" data-reveal="fade-up" data-reveal-delay="120"><span>View all products</span>''' + ARROW_SVG + '''</a>
        </div>'''
    subcat_label = {s["slug"]: s["name"] for s in SUBCATEGORIES}
    out += block_carousel("products", product_title,
                           [catalog_item_carousel_item(item, subcat_label.get(item["category"], item["category"]))
                            for item in CATALOG_ITEMS],
                           per_view="products", autoplay_ms=3500, aria_label="Featured Products")

    # 05 — Manufacturing Capabilities
    out += f'''    <section class="section section--ink" aria-labelledby="mfg-cap-heading">
      <div class="container why__grid">
        <figure class="why__visual" data-reveal="clip-up">
          <img src="{IMAGES['manufacturing']['overview']['src']}" alt="{esc(IMAGES['manufacturing']['overview']['alt'])}" width="1100" height="1350" loading="lazy">
        </figure>
        <div class="why__content">
          <p class="eyebrow" data-reveal="fade-up">Manufacturing Capabilities</p>
          <h2 class="why__heading" id="mfg-cap-heading" data-reveal="fade-up" data-reveal-delay="80">Eight departments. One integrated line.</h2>
          <p class="intro__text" data-reveal="fade-up" data-reveal-delay="140" style="color:rgba(255,255,255,.72);margin-bottom:1.6em;">
            Knitting, cutting, printing, embroidery, stitching, finishing, value addition and dispatch — every department works in sequence, from yarn to pack, under one roof in {LOCATION}.
          </p>
          <a href="/manufacturing/" class="btn btn--outline btn--light" data-reveal="fade-up" data-reveal-delay="200"><span>Explore Manufacturing</span>{ARROW_SVG}</a>
        </div>
      </div>
    </section>
'''

    # 06 — Machinery flip-card slider
    out += block_machine_slider()

    # 07 — Production Process
    out += block_process_timeline()

    # 08 — Facility / Factory Showcase
    gallery = IMAGES["facility"]["gallery"]
    gallery_html = "\n".join(f'''          <figure class="facility-gallery__item" data-reveal="fade-up" data-reveal-delay="{i * 60}">
            <img src="{g['src']}" alt="{esc(g['alt'])}" width="900" height="700" loading="lazy">
          </figure>''' for i, g in enumerate(gallery))
    out += f'''    <section class="section" aria-labelledby="facility-heading">
      <div class="container">
        <div class="section-head section-head--split">
          <div><p class="eyebrow" data-reveal="fade-up">Our Facility</p><h2 class="section-head__title" id="facility-heading" data-reveal="fade-up" data-reveal-delay="80">Inside the Factory</h2></div>
          <a href="/facility/" class="link-arrow" data-reveal="fade-up" data-reveal-delay="120"><span>Explore our facility</span>{ARROW_SVG}</a>
        </div>
        <div class="facility-gallery">
{gallery_html}
        </div>
      </div>
    </section>
'''

    # 09 — Quality
    out += f'''    <section class="sustainability" id="quality" aria-labelledby="quality-heading">
      <figure class="sustainability__visual" data-reveal="clip-up">
        <img src="{IMAGES['facility']['quality-control']['src']}" alt="{esc(IMAGES['facility']['quality-control']['alt'])}" width="1600" height="1100" loading="lazy">
      </figure>
      <div class="sustainability__content">
        <p class="eyebrow" data-reveal="fade-up">Quality</p>
        <h2 class="sustainability__heading" id="quality-heading" data-reveal="fade-up" data-reveal-delay="80">Checked at every stage, not just the end.</h2>
        <p class="sustainability__text" data-reveal="fade-up" data-reveal-delay="160">Quality is reviewed through the production line — at cutting, at stitching, and again before packing and dispatch.</p>
        <a href="/quality/" class="btn btn--outline btn--light" data-reveal="fade-up" data-reveal-delay="220"><span>Our Approach to Quality</span>{ARROW_SVG}</a>
      </div>
    </section>
'''

    # 10 — Certifications (auto slider)
    cert_title = '''        <div class="section-head">
          <p class="eyebrow" data-reveal="fade-up">Certifications</p>
          <h2 class="section-head__title" data-reveal="fade-up" data-reveal-delay="80">Certifications</h2>
          <p class="section-head__text" data-reveal="fade-up" data-reveal-delay="140">This section is ready to display verified certifications as they are confirmed.</p>
        </div>'''
    out += block_carousel("certificates", cert_title, [certificate_carousel_item(c) for c in CERTIFICATES],
                           per_view="certificates", autoplay_ms=4000, aria_label="Certifications")

    # 11 — Our Partners (auto slider)
    partner_title = '''        <div class="section-head">
          <p class="eyebrow" data-reveal="fade-up">Our Partners</p>
          <h2 class="section-head__title" data-reveal="fade-up" data-reveal-delay="80">Our Partners</h2>
          <p class="section-head__text" data-reveal="fade-up" data-reveal-delay="140">This section is ready to display verified, publication-cleared partner logos as they are confirmed.</p>
        </div>'''
    out += block_carousel("partners", partner_title, [partner_carousel_item(p) for p in PARTNERS],
                           per_view="partners", autoplay_ms=3000, aria_label="Our Partners")

    # 12 — Why MJ Oswal Exports
    out += '''    <section class="why" aria-labelledby="why-heading">
      <div class="container why__grid">
        <figure class="why__visual" data-reveal="clip-up">
          <img src="''' + IMAGES["facility"]["production"]["src"] + '''" alt="''' + esc(IMAGES["facility"]["production"]["alt"]) + '''" width="1100" height="1350" loading="lazy">
        </figure>
        <div class="why__content">
          <p class="eyebrow" data-reveal="fade-up">Why MJ Oswal Exports</p>
          <h2 class="why__heading" id="why-heading" data-reveal="fade-up" data-reveal-delay="80">Six commitments behind every garment.</h2>
          <ul class="why__list">
            <li class="why__item" data-reveal="fade-up" data-reveal-delay="0"><span class="why__item-title">Integrated Production</span><span class="why__item-text">Eight departments under one roof, from yarn to dispatch.</span></li>
            <li class="why__item" data-reveal="fade-up" data-reveal-delay="60"><span class="why__item-title">Quality Discipline</span><span class="why__item-text">Checked in-line, not only at the end of the process.</span></li>
            <li class="why__item" data-reveal="fade-up" data-reveal-delay="120"><span class="why__item-title">Design-Led</span><span class="why__item-text">An in-house design team taking concepts to production.</span></li>
            <li class="why__item" data-reveal="fade-up" data-reveal-delay="180"><span class="why__item-title">Built for Scale</span><span class="why__item-text">30,000 pieces stitched per day, at consistent quality.</span></li>
            <li class="why__item" data-reveal="fade-up" data-reveal-delay="240"><span class="why__item-title">Vertically Integrated</span><span class="why__item-text">We knit our own fabric — approximately 9 tons per day.</span></li>
            <li class="why__item" data-reveal="fade-up" data-reveal-delay="300"><span class="why__item-title">People-First</span><span class="why__item-text">700+ people across our production floor.</span></li>
          </ul>
        </div>
      </div>
    </section>
'''

    # 13 — Numbers / Capabilities (from the company's own profile document)
    stats = [
        ("30,000", "Pieces Stitched Per Day"),
        ("9 Tons", "Circular Knitted Fabric Per Day"),
        ("700+", "People"),
        ("46+", "Machines Across Knitting & Printing"),
    ]
    stat_html = "\n".join(f'''            <div class="stat-row__item"><dt class="stat-row__number">{esc(n)}</dt><dd class="stat-row__label">{l}</dd></div>'''
                           for n, l in stats)
    out += f'''    <section class="section section--ink">
      <div class="container">
        <p class="eyebrow" data-reveal="fade-up">Capabilities</p>
        <h2 class="section-head__title" data-reveal="fade-up" data-reveal-delay="80" style="margin-bottom:1.4em;">By the Numbers</h2>
        <dl class="stat-row" data-reveal="fade-up" data-reveal-delay="120">
{stat_html}
        </dl>
        <p class="stat-row__note">Founded in {FOUNDED_YEAR}, vertically integrated from fabric to pack in Ludhiana, Punjab.</p>
      </div>
    </section>
'''

    # 14 — Projects / Case Studies
    proj_cards = "\n".join(f'''          <a class="tile-card" href="/projects/{pr['slug']}/" data-reveal="fade-up" data-reveal-delay="{i * 80}">
            <span class="tile-card__frame"><img src="{IMAGES['projects'][i]['src']}" alt="" width="900" height="1100" loading="lazy"></span>
            <span class="tile-card__body">
              <span class="tile-card__title">{esc(pr['title'])}</span>
              <span class="tile-card__text">{esc(pr['text'])}</span>
              <span class="tile-card__cta"><span>View Project</span>{ARROW_SVG}</span>
            </span>
          </a>''' for i, pr in enumerate(PROJECTS_DATA))
    out += f'''    <section class="section" aria-labelledby="projects-heading">
      <div class="container">
        <div class="section-head section-head--split">
          <div><p class="eyebrow" data-reveal="fade-up">Our Work</p><h2 class="section-head__title" id="projects-heading" data-reveal="fade-up" data-reveal-delay="80">Projects &amp; Case Studies</h2></div>
          <a href="/projects/" class="link-arrow" data-reveal="fade-up" data-reveal-delay="120"><span>View all projects</span>{ARROW_SVG}</a>
        </div>
        <div class="tile-grid">
{proj_cards}
        </div>
      </div>
    </section>
'''

    # 15 — Insights / News
    insight_cards = "\n".join(f'''          <a class="tile-card" href="/insights/{a['slug']}/" data-reveal="fade-up" data-reveal-delay="{i * 80}">
            <span class="tile-card__frame"><img src="{IMAGES['insights'][i]['src']}" alt="" width="900" height="700" loading="lazy"></span>
            <span class="tile-card__body">
              <span class="tile-card__title">{esc(a['title'])}</span>
              <span class="tile-card__text">{esc(a['text'])}</span>
              <span class="tile-card__cta"><span>Read more</span>{ARROW_SVG}</span>
            </span>
          </a>''' for i, a in enumerate(INSIGHTS_DATA))
    out += f'''    <section class="section" aria-labelledby="insights-heading">
      <div class="container">
        <div class="section-head"><p class="eyebrow" data-reveal="fade-up">Insights</p><h2 class="section-head__title" id="insights-heading" data-reveal="fade-up" data-reveal-delay="80">News &amp; Insights</h2></div>
        <div class="tile-grid">
{insight_cards}
        </div>
      </div>
    </section>
'''

    # 16 — Contact CTA
    out += block_cta(heading="Let's talk about your next order.",
                      text=f"MJ Oswal Exports is based in {LOCATION}. Reach out to discuss manufacturing, sourcing or partnership opportunities.",
                      primary=("Contact Us", "/contact/"), secondary=("Careers", "/careers/"))

    return out


def assemble_home():
    page = {"path": "/", "title": f"{SITE_NAME} — Apparel Manufacturing in Ludhiana, Punjab", "kind": "home",
            "category": None, "hero_image": IMAGES["hero"][0]["src"],
            "description": f"{SITE_NAME} is an apparel and garment manufacturing company based in {LOCATION}, with integrated stitching, cutting, printing, embroidery and dispatch capabilities."}
    return render_head(page) + "<body>\n" + render_header("/", overlay=True) + '  <main id="main">\n' + body_home() + "  </main>\n" + render_footer()


# =============================================================================
# MAIN
# =============================================================================
def main():
    count = 0
    with open(os.path.join(ROOT, "index.html"), "w") as f:
        f.write(assemble_home())
    count += 1

    for page in PAGES:
        if page["kind"] == "home":
            continue
        renderer = BODY_RENDERERS[page["kind"]]
        html = assemble_page(page, renderer(page))
        write_page(page["path"], html)
        count += 1

    sitemap_page, sitemap_body = build_html_sitemap()
    write_page(sitemap_page["path"], assemble_page(sitemap_page, sitemap_body))
    count += 1

    e404_page, e404_body = build_404()
    html_404 = assemble_page(e404_page, e404_body)
    with open(os.path.join(ROOT, "404.html"), "w") as f:
        f.write(html_404)
    count += 1

    urls = ["/"] + [p["path"] for p in PAGES if p["kind"] != "home"] + ["/sitemap/"]
    entries = "\n".join(
        f'  <url>\n    <loc>{BASE_URL}{u}</loc>\n    <lastmod>2026-08-26</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>{"1.0" if u == "/" else "0.7"}</priority>\n  </url>'
        for u in urls
    )
    sitemap_xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{entries}
</urlset>
'''
    with open(os.path.join(ROOT, "sitemap.xml"), "w") as f:
        f.write(sitemap_xml)

    with open(os.path.join(ROOT, "robots.txt"), "w") as f:
        f.write(f"User-agent: *\nAllow: /\n\nSitemap: {BASE_URL}/sitemap.xml\n")

    print(f"Generated {count} pages + sitemap.xml ({len(urls)} URLs) + 404.html")
    print(f"Manifest: {len(PAGES)} pages | {len(PRODUCTS)} products | {len(MACHINES)} machines | {len(CERTIFICATES)} certificate slots | {len(PARTNERS)} partner slots")


if __name__ == "__main__":
    main()

