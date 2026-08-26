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

# NOTE: no confirmed production domain was available when this site was
# built — update BASE_URL to the real domain before launch.
BASE_URL = "https://www.mjoswalexports.com"
SITE_NAME = "MJ Oswal Exports"
LEGAL_NAME = "M.J. Oswal Exports Private Limited"
LOCATION = "Ludhiana, Punjab, India"


def load_json(name):
    with open(os.path.join(DATA_DIR, name), encoding="utf-8") as f:
        return json.load(f)


IMAGES = load_json("images.json")
PRODUCTS = load_json("products.json")["items"]
MACHINES = load_json("machines.json")["items"]
CERTIFICATES = load_json("certificates.json")["items"]
PARTNERS = load_json("partners.json")["items"]

PRODUCTS_BY_SLUG = {p["slug"]: p for p in PRODUCTS}

# =============================================================================
# NAV — top-level items per the requested structure. Every url is a real page.
# =============================================================================
NAV = [
    {"label": "Home", "url": "/", "card": "default"},
    {"label": "About", "url": "/about/", "card": "about", "children": [
        {"label": "Company", "url": "/about/company/"},
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
        {"label": "Kids", "url": "/products/kids/"},
        {"label": "View all products", "url": "/products/"},
    ]},
    {"label": "Manufacturing", "url": "/manufacturing/", "card": "manufacturing", "children": [
        {"label": "Stitching", "url": "/manufacturing/stitching/"},
        {"label": "Cutting", "url": "/manufacturing/cutting/"},
        {"label": "Printing", "url": "/manufacturing/printing/"},
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
    "products": (PRODUCTS[3]["image"], "Products", "Men's, women's and kids' apparel"),
    "manufacturing": (IMAGES["manufacturing"]["stitching"]["src"], "Manufacturing", "Ten integrated departments"),
    "facility": (IMAGES["facility"]["overview"]["src"], "Facility", "Our production floor in Ludhiana"),
    "quality": (IMAGES["facility"]["quality-control"]["src"], "Quality", "Discipline at every stage"),
    "sustainability": (IMAGES["team"]["production-team"]["src"], "Sustainability", "Responsible manufacturing"),
    "projects": (IMAGES["projects"][0]["src"], "Projects", "Selected work"),
    "insights": (IMAGES["insights"][0]["src"], "Insights", "News and updates"),
    "careers": (IMAGES["team"]["manufacturing-team"]["src"], "Careers", "Build your career with us"),
    "contact": (IMAGES["facility"]["overview"]["src"], "Contact", "Get in touch"),
}

FOOTER_COLUMNS = [
    ("Company", [
        ("About", "/about/"), ("Leadership", "/about/leadership/"),
        ("Facility", "/facility/"), ("Quality", "/quality/"), ("Sustainability", "/sustainability/"),
    ]),
    ("Products", [
        ("Men's", "/products/mens/"), ("Women's", "/products/womens/"), ("Kids", "/products/kids/"),
        ("Loungewear", "/products/loungewear/"), ("Nightwear", "/products/nightwear/"),
        ("T-Shirts", "/products/tshirts/"), ("Sweatshirts", "/products/sweatshirts/"), ("Tracksuits", "/products/tracksuits/"),
    ]),
    ("Manufacturing", [
        ("Stitching", "/manufacturing/stitching/"), ("Cutting", "/manufacturing/cutting/"),
        ("Printing", "/manufacturing/printing/"), ("Embroidery", "/manufacturing/embroidery/"),
        ("Designing", "/manufacturing/designing/"), ("Dispatch", "/manufacturing/dispatch/"),
    ]),
    ("Resources", [
        ("Projects", "/projects/"), ("Insights", "/insights/"), ("Careers", "/careers/"), ("Contact", "/contact/"),
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
    lede=f"{LEGAL_NAME} is an apparel and garment manufacturing company based in {LOCATION}. [Add additional verified company background here.]",
    children=[
        {"href": "/about/company/", "title": "Company", "text": "Who we are and what we manufacture.", "image": IMAGES["team"]["our-people"]["src"]},
        {"href": "/about/leadership/", "title": "Leadership", "text": "The people leading MJ Oswal Exports.", "image": IMAGES["team"]["leadership"]["src"]},
        {"href": "/about/our-people/", "title": "Our People", "text": "The teams across every department.", "image": IMAGES["team"]["production-team"]["src"]},
        {"href": "/about/design-team/", "title": "Design Team", "text": "In-house design and pattern-making.", "image": IMAGES["team"]["design-team"]["src"]},
        {"href": "/about/quality-team/", "title": "Quality Team", "text": "Quality control across every stage.", "image": IMAGES["team"]["quality-team"]["src"]},
        {"href": "/about/production-team/", "title": "Production Team", "text": "Running the production floor daily.", "image": IMAGES["team"]["production-team"]["src"]},
        {"href": "/about/manufacturing-team/", "title": "Manufacturing Team", "text": "Ten departments, one production line.", "image": IMAGES["team"]["manufacturing-team"]["src"]},
    ])

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
        "MJ Oswal Exports manufactures wearing apparel and knitted, ready-made garments, with production spanning categories such as T-shirts, nightwear, loungewear, lowers, sweatshirts, tracksuits and kidswear.",
        "[Add additional verified company background, founding history and business scope here.]",
    ],
    related=[{"title": "Leadership", "href": "/about/leadership/"}, {"title": "Our Facility", "href": "/facility/"}, {"title": "Our Manufacturing", "href": "/manufacturing/"}])

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
    heading="Our People", eyebrow="About Us", hero_image=IMAGES["team"]["production-team"]["src"],
    lede="Behind every garment is a team — from design and cutting through to stitching, quality control and dispatch.",
    highlights=[
        {"title": "Total Workforce", "text": "Approximately 500–700 people (current working estimate)"},
        {"title": "Design & Pattern Making", "text": "Approximately 10 in-house designers and 3 tailors"},
        {"title": "Graphic Design", "text": "Approximately 5 dedicated workstations"},
        {"title": "Fabric Team", "text": "A dedicated 2-person team managing 50+ colours"},
    ],
    body=["Our people are organised across ten integrated manufacturing departments, described in full on our Manufacturing page. [Add further verified detail on team structure as it becomes available.]"],
    related=[{"title": "Manufacturing Team", "href": "/about/manufacturing-team/"}, {"title": "Design Team", "href": "/about/design-team/"}, {"title": "Quality Team", "href": "/about/quality-team/"}])

add(path="/about/design-team/", title="Design Team — About", kind="detail", category="about",
    heading="Design Team", eyebrow="About Us", hero_image=IMAGES["team"]["design-team"]["src"],
    lede="Our in-house design team takes garments from concept to production-ready pattern.",
    highlights=[
        {"title": "Designers", "text": "Approximately 10 in-house designers"},
        {"title": "Tailors", "text": "Approximately 3 tailors supporting sample development"},
        {"title": "Graphic Design", "text": "Approximately 5 PCs dedicated to graphic design"},
        {"title": "Monthly Output", "text": "Current working estimate of 150+ new designs per month"},
    ],
    body=["The design team works from 2 dedicated work tables and 10 additional tables, supported by a conference room used for design review and sign-off. [Add further verified detail as available.]"],
    related=[{"title": "Manufacturing: Designing", "href": "/manufacturing/designing/"}, {"title": "Quality Team", "href": "/about/quality-team/"}])

add(path="/about/quality-team/", title="Quality Team — About", kind="detail", category="about",
    heading="Quality Team", eyebrow="About Us", hero_image=IMAGES["team"]["quality-team"]["src"],
    lede="Quality is checked at multiple stages of production, not only at the end of the line.",
    highlights=[
        {"title": "Focus", "text": "In-line and final quality checks"},
        {"title": "Coverage", "text": "Applied across cutting, stitching and finishing"},
        {"title": "Standards", "text": "[Add verified quality standards or benchmarks here.]"},
    ],
    body=["[Add verified detail on the quality team's structure, checkpoints and standards here.]"],
    related=[{"title": "Quality", "href": "/quality/"}, {"title": "Facility: Quality Control", "href": "/facility/quality-control/"}])

add(path="/about/production-team/", title="Production Team — About", kind="detail", category="about",
    heading="Production Team", eyebrow="About Us", hero_image=IMAGES["team"]["production-team"]["src"],
    lede="The production team runs the day-to-day floor across every manufacturing department.",
    highlights=[
        {"title": "Departments Covered", "text": "Ten integrated departments, from fabric to dispatch"},
        {"title": "Styles Handled", "text": "Approximately 10–12 styles at a time (working estimate)"},
        {"title": "Line Structure", "text": "Working estimate of ~4–5 units per stitching line"},
    ],
    body=["[Add further verified detail on production team structure and shift patterns as available.]"],
    related=[{"title": "Manufacturing", "href": "/manufacturing/"}, {"title": "Facility: Production", "href": "/facility/production/"}])

add(path="/about/manufacturing-team/", title="Manufacturing Team — About", kind="detail", category="about",
    heading="Manufacturing Team", eyebrow="About Us", hero_image=IMAGES["team"]["manufacturing-team"]["src"],
    lede="Ten integrated departments work in sequence to take a garment from fabric to finished, packed product.",
    highlights=[
        {"title": "Total Workforce", "text": "Approximately 500–700 people (current working estimate)"},
        {"title": "Departments", "text": "Fabric, Designing, Cutting, Printing, Embroidery, Stitching, Heat Label, Pressing, Packing, Dispatch"},
    ],
    body=["Explore each department individually on our Manufacturing page for detailed, department-specific information."],
    related=[{"title": "Manufacturing Overview", "href": "/manufacturing/"}, {"title": "Facility", "href": "/facility/"}])

# --- BUSINESSES ------------------------------------------------------------------
add(path="/businesses/", title="Our Businesses", kind="hub", category="businesses",
    heading="Our Businesses", eyebrow="What We Do",
    lede="MJ Oswal Exports manufactures wearing apparel and knitted, ready-made garments across three core business areas.",
    children=[
        {"href": "/businesses/apparel/", "title": "Apparel", "text": "Ready-made apparel manufactured across a wide range of categories.", "image": IMAGES["businesses"]["apparel"]["src"]},
        {"href": "/businesses/knitwear/", "title": "Knitwear", "text": "Knitted garments produced through our integrated fabric and stitching lines.", "image": IMAGES["businesses"]["knitwear"]["src"]},
        {"href": "/businesses/garments/", "title": "Garments", "text": "Full ready-made garment manufacturing, from fabric to finished product.", "image": IMAGES["businesses"]["garments"]["src"]},
    ])
BUSINESS_SUB = [
    ("apparel", "Apparel", "Ready-made apparel manufacturing", "We manufacture wearing apparel across categories including T-shirts, nightwear, loungewear, sweatshirts, tracksuits and more, produced through our integrated design, cutting, printing and stitching departments."),
    ("knitwear", "Knitwear", "Knitted garment manufacturing", "Our knitwear production draws on a dedicated fabric team managing 50+ colours, feeding directly into our cutting and stitching lines."),
    ("garments", "Garments", "End-to-end garment manufacturing", "From raw fabric through to a packed, dispatch-ready garment, our ten manufacturing departments work as one integrated production line."),
]
for slug, title, heading, lede in BUSINESS_SUB:
    add(path=f"/businesses/{slug}/", title=f"{title} — Businesses", kind="detail", category="businesses",
        heading=heading, eyebrow="Our Businesses", lede=lede, hero_image=IMAGES["businesses"][slug]["src"],
        highlights=[
            {"title": "Manufactured In-House", "text": "Design, cutting, printing, embroidery and stitching"},
            {"title": "Fabric Range", "text": "50+ colours currently managed by our fabric team"},
            {"title": "Scale", "text": "Approximately 10–12 styles handled at a time (working estimate)"},
        ],
        body=[f"[Add further verified detail on the {title.lower()} business area here.]"],
        related=[{"title": t, "href": f"/businesses/{s}/"} for s, t, *_ in BUSINESS_SUB if s != slug])

# --- PRODUCTS ---------------------------------------------------------------------
add(path="/products/", title="Products", kind="hub", category="products",
    heading="Products", eyebrow="What We Make",
    lede="MJ Oswal Exports manufactures apparel across the following categories, produced through our integrated production departments.",
    children=[{"href": f"/products/{p['slug']}/", "title": p["name"], "text": p["description"],
               "category": p["category"], "image": p["image"]} for p in PRODUCTS])
for p in PRODUCTS:
    others = [o for o in PRODUCTS if o["slug"] != p["slug"]][:3]
    add(path=f"/products/{p['slug']}/", title=f"{p['name']} — Products", kind="detail", category="products",
        heading=p["name"], eyebrow=f'{p["category"]} — Products', lede=p["description"], hero_image=p["image"],
        highlights=[
            {"title": "Category", "text": p["category"]},
            {"title": "Manufactured At", "text": "Our Ludhiana facility"},
            {"title": "Production Route", "text": "Fabric → Design → Cutting → Printing/Embroidery → Stitching → Finishing"},
        ],
        body=[f"[Add further verified detail on {p['name'].lower()} — fabric options, sizing range and minimum order quantities — here.]"],
        related=[{"title": o["name"], "href": f"/products/{o['slug']}/"} for o in others])

# --- MANUFACTURING -----------------------------------------------------------------
# Content sourced from an internal production planning document. All figures
# are presented as approximate / working estimates, per that document's own
# caveat that they are not final production numbers.
MFG_PROCESS = ["Raw Material", "Fabric", "Design", "Cutting", "Printing / Embroidery",
               "Stitching", "Heat Label", "Pressing", "Quality", "Packing", "Dispatch"]

MFG_DEPTS = [
    ("stitching", "Stitching", "Where every garment comes together",
     "Our stitching department is the largest in the facility, running multiple styles at once across a large bank of machines.",
     [("Stitching Machines", "Approximately 125 machines currently in operation"),
      ("Thread Cutting Machines", "Approximately 10 machines"),
      ("Pressing Machines", "Approximately 10 machines"),
      ("Styles at a Time", "Approximately 10–12 styles (working estimate)"),
      ("Line Structure", "Working estimate of ~4–5 units per line")]),

    ("heat-label", "Heat Label", "Neck and care labelling",
     "Our heat label department applies neck and care labels to finished garments, with labels organised by size ahead of application.",
     [("Dedicated Machines", "Approximately 11 machines dedicated to neck labels"),
      ("Process", "Labels are ranked and sorted by size before application")]),

    ("fabric", "Fabric", "Sourcing and managing every colour",
     "A dedicated fabric team manages colour stock and availability across our full production range.",
     [("Team Size", "A dedicated 2-person team"),
      ("Colour Range", "50+ colours currently managed"),
      ("Software Systems", "2 dedicated software systems")]),

    ("dispatch", "Dispatch", "From packed goods to delivery",
     "Our dispatch department manages final packing, tagging and movement of finished goods ready for delivery.",
     [("Packing Machines", "1 packing machine"),
      ("Lifts", "2 lifts supporting the dispatch area"),
      ("Dispatch Capacity", "Current working estimate of approximately 6,000–7,000 pieces per month"),
      ("Software", "Great Eastern software, alongside an MRP tag system")]),

    ("designing", "Designing", "From concept to production-ready pattern",
     "Our in-house design team takes garments from concept through to a production-ready pattern, supported by a dedicated graphic design team.",
     [("Designers", "Approximately 10 in-house designers"),
      ("Tailors", "Approximately 3 tailors"),
      ("Work Tables", "2 dedicated design work tables"),
      ("Graphic Design", "Approximately 5 PCs, 10 tables and 1 conference room"),
      ("Monthly Output", "Current working estimate of 150+ new designs per month")]),

    ("embroidery", "Embroidery", "Detailed finishing work",
     "Our embroidery department handles logos, motifs and detailed garment work across multiple simultaneous jobs.",
     [("Machines", "Approximately 3–4 embroidery machines"),
      ("Software", "Managed through Wings embroidery software"),
      ("Jobs at a Time", "Approximately 10 jobs at a time (working estimate)")]),

    ("cutting", "Cutting", "Precision from fabric to pattern",
     "Our cutting department combines automated spreading equipment with CAD-driven pattern preparation.",
     [("Spreading / Cutting Machines", "3 spider-type fabric spreading and cutting machines"),
      ("Cutting Tables", "Approximately 4–8 cutting tables"),
      ("Dedicated Cutter", "1 dedicated cutter machine"),
      ("CAD System", "Audaces CAD")]),

    ("printing", "Printing", "Colour, detail and finish",
     "Our printing department runs a mix of automatic and manual equipment to support a wide range of print styles and colour counts.",
     [("Automatic Printing Machines", "Approximately 11 machines"),
      ("Manual Printing Machine", "1 machine"),
      ("Curing Machine", "1 machine"),
      ("Fusing Machines", "Approximately 4 machines"),
      ("Colours per Print", "Up to 7–8 colours"),
      ("Other Equipment", "DTP machine, plotter and supporting ERP systems")]),

    ("pressing", "Pressing", "Setting the final finish",
     "Pressing is carried out in-line within our stitching department to set seams and finish garments ahead of quality checks.",
     [("Pressing Machines", "Approximately 10 machines, operating within the stitching department")]),

    ("packing", "Packing", "Preparing garments for dispatch",
     "Finished, quality-checked garments are packed ahead of tagging and dispatch.",
     [("Packing Equipment", "1 dedicated packing machine"),
      ("Tagging", "MRP tag system used to label finished goods")]),
]

add(path="/manufacturing/", title="Manufacturing", kind="hub", category="manufacturing",
    heading="Manufacturing", eyebrow="How We Build",
    lede="Ten integrated departments carry every garment from raw fabric through to a packed, dispatch-ready product. Figures below are approximate, current working estimates from our internal production planning — not final production numbers.",
    children=[{"href": f"/manufacturing/{slug}/", "title": title, "text": lede2,
               "image": IMAGES["manufacturing"][slug]["src"]} for slug, title, _, lede2, _ in MFG_DEPTS],
    process=MFG_PROCESS)
for slug, title, heading, lede, stats in MFG_DEPTS:
    others = [(s, t) for s, t, *_ in MFG_DEPTS if s != slug][:3]
    add(path=f"/manufacturing/{slug}/", title=f"{title} — Manufacturing", kind="detail", category="manufacturing",
        heading=heading, eyebrow="Manufacturing", lede=lede, hero_image=IMAGES["manufacturing"][slug]["src"],
        highlights=[{"title": k, "text": v} for k, v in stats],
        body=["Figures on this page are approximate, current working estimates drawn from internal production planning — not final production numbers."],
        related=[{"title": t, "href": f"/manufacturing/{s}/"} for s, t in others] + [{"title": "Facility", "href": "/facility/"}])

# --- FACILITY ------------------------------------------------------------------
FACILITY_SUB = [
    ("overview", "Overview", "A single, integrated production facility", "Our Ludhiana facility houses every stage of production — from fabric and design through to packing and dispatch — under one roof."),
    ("machinery", "Machinery", "Equipment across ten departments", "Our machinery spans stitching, cutting, printing, embroidery and dispatch equipment. Explore the full list on our Machinery showcase."),
    ("production", "Production", "How a garment moves through our floor", "Production moves in sequence — fabric, design, cutting, printing or embroidery, stitching, heat label, pressing, quality, packing, dispatch."),
    ("technology", "Technology", "Software behind the machines", "Our production is supported by CAD (Audaces), embroidery software (Wings), and dispatch/ERP systems (Great Eastern, MRP tagging)."),
    ("capacity", "Capacity", "Current working estimates", "Capacity figures below are approximate, current working estimates — not final production numbers."),
    ("quality-control", "Quality Control", "Checked at every stage, not just the end", "Quality is checked through the production line, from cutting accuracy through to final pressing and packing."),
]
add(path="/facility/", title="Facility", kind="hub", category="facility",
    heading="Our Facility", eyebrow="Where We Manufacture",
    lede=f"Our production facility is based in {LOCATION}, bringing together ten manufacturing departments under one roof.",
    children=[{"href": f"/facility/{s}/", "title": t, "text": lede2, "image": IMAGES["facility"][s]["src"]}
              for s, t, _, lede2 in FACILITY_SUB])
for slug, title, heading, lede in FACILITY_SUB:
    stats = {
        "overview": [("Location", LOCATION), ("Departments", "10 integrated manufacturing departments"), ("Workforce", "Approximately 500–700 people (working estimate)")],
        "machinery": [("Machine Types", "20+ distinct machine and system types"), ("Core Lines", "Stitching, cutting, printing, embroidery, dispatch")],
        "production": [("Styles at a Time", "Approximately 10–12 (working estimate)"), ("Process", " → ".join(MFG_PROCESS))],
        "technology": [("Cutting/Pattern", "Audaces CAD"), ("Embroidery", "Wings software"), ("Dispatch", "Great Eastern software, MRP tag system")],
        "capacity": [("Dispatch Capacity", "Approximately 6,000–7,000 pieces/month (working estimate)"), ("Styles at a Time", "Approximately 10–12 (working estimate)"), ("Design Output", "150+ new designs/month (working estimate)")],
        "quality-control": [("Checkpoints", "In-line and final inspection"), ("Coverage", "Cutting, stitching, pressing and packing")],
    }[slug]
    add(path=f"/facility/{slug}/", title=f"{title} — Facility", kind="detail", category="facility",
        heading=heading, eyebrow="Facility", lede=lede, hero_image=IMAGES["facility"][slug]["src"],
        highlights=[{"title": k, "text": v} for k, v in stats],
        body=["[Add further verified facility detail here.]"],
        related=[{"title": t2, "href": f"/facility/{s2}/"} for s2, t2, *_ in FACILITY_SUB if s2 != slug][:3])

# --- QUALITY ----------------------------------------------------------------------
add(path="/quality/", title="Quality", kind="detail", category=None,
    heading="Quality", eyebrow="Quality", hero_image=IMAGES["facility"]["quality-control"]["src"],
    lede="Quality is built into our process, not inspected in at the end — checked at cutting, at stitching, and again before packing.",
    highlights=[
        {"title": "In-Line Checks", "text": "Quality reviewed at multiple production stages"},
        {"title": "Final Inspection", "text": "Checked again before packing and dispatch"},
        {"title": "Consistency", "text": "Applied across every product category we manufacture"},
        {"title": "Certifications", "text": "[Add verified certifications once confirmed — see our Certifications page.]"},
    ],
    body=["[Add further verified detail on quality standards, testing procedures or benchmarks here.]"],
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
    lede="Our approximately 500–700-strong workforce (current working estimate) is at the centre of everything we manufacture.",
    highlights=[
        {"title": "Workforce", "text": "Approximately 500–700 people (working estimate)"},
        {"title": "Departments", "text": "10 integrated manufacturing departments"},
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
    lede="MJ Oswal Exports is structured to serve both domestic and export requirements. [Add verified export markets, capacity and logistics detail here.]",
    highlights=[
        {"title": "Dispatch Capacity", "text": "Approximately 6,000–7,000 pieces/month (working estimate)"},
        {"title": "Export Markets", "text": "[Add verified export markets once confirmed.]"},
        {"title": "Logistics", "text": "[Add verified logistics and shipping detail here.]"},
    ],
    body=["No specific export countries, client names or volumes are claimed until verified."],
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
    lede="Build your career with a manufacturing team of approximately 500–700 people (current working estimate) across ten integrated departments.",
    highlights=[
        {"title": "Workforce", "text": "Approximately 500–700 people (working estimate)"},
        {"title": "Departments", "text": "Design, cutting, printing, embroidery, stitching, dispatch and more"},
        {"title": "Open Roles", "text": "[Add verified current openings here.]"},
    ],
    body=["[Add verified current job openings, application process and contact details here.]"],
    related=[{"title": "Our People", "href": "/about/our-people/"}, {"title": "Contact", "href": "/contact/"}])

add(path="/contact/", title="Contact Us", kind="contact", category=None,
    heading="Contact Us", eyebrow="Get in Touch",
    lede=f"We would love to hear from you. MJ Oswal Exports is based in {LOCATION}. [Add verified address, phone and email here.]")

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
    parent = page.get("parent")
    if parent and parent[1] != page["path"]:
        trail.append(parent)
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
      "addressLocality": "Ludhiana",
      "addressRegion": "Punjab",
      "addressCountry": "IN"
    }
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "%s",
    "url": "%s/"
  }
  </script>""" % (SITE_NAME, LEGAL_NAME, BASE_URL, BASE_URL, IMAGES["logo"]["src"], SITE_NAME, BASE_URL))
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
        <img class="site-header__logo-img" src="{IMAGES['logo']['src']}" alt="{esc(IMAGES['logo']['alt'])}" width="160" height="54">
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
        items = "\n".join(f'          <li><a href="{href}">{esc(label)}</a></li>' for label, href in links)
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
          <img src="{IMAGES['logo']['src']}" alt="{esc(IMAGES['logo']['alt'])}" width="150" height="50">
        </a>
        <p class="site-footer__tagline">Apparel manufacturing, built with discipline.</p>
        <p class="site-footer__note">Contact details, social links and legal information on this footer are shown only once verified. <span class="placeholder">[Add verified address, phone, email and social links here.]</span></p>
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
    fields = [form_field("Full Name", "name"), form_field("Email Address", "email", "email"),
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
    "Stitching": "stitching", "Heat Label": "heat-label", "Fabric": "fabric",
    "Dispatch": "dispatch", "Designing": "designing", "Embroidery": "embroidery",
    "Cutting": "cutting", "Printing": "printing",
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
            <h2 class="section-head__title" data-reveal="fade-up" data-reveal-delay="80">20+ Machines, One Production Line</h2>
          </div>
          <a href="/facility/machinery/" class="link-arrow" data-reveal="fade-up" data-reveal-delay="120"><span>View all machinery</span>''' + ARROW_SVG + '''</a>
        </div>'''
    return block_carousel("machines", title, cards, per_view="machines", autoplay_ms=4500, aria_label="Machinery")


# --- Production process timeline ------------------------------------------------------
PROCESS_LINKS = {
    "Raw Material": "/manufacturing/fabric/", "Fabric": "/manufacturing/fabric/",
    "Design": "/manufacturing/designing/", "Cutting": "/manufacturing/cutting/",
    "Printing / Embroidery": "/manufacturing/printing/", "Stitching": "/manufacturing/stitching/",
    "Heat Label": "/manufacturing/heat-label/", "Pressing": "/manufacturing/pressing/",
    "Quality": "/facility/quality-control/", "Packing": "/manufacturing/packing/",
    "Dispatch": "/manufacturing/dispatch/",
}

def block_process_timeline():
    steps = []
    for i, step in enumerate(MFG_PROCESS, start=1):
        href = PROCESS_LINKS.get(step, "/manufacturing/")
        steps.append(f'''        <a class="process-step" href="{href}" data-reveal="fade-up" data-reveal-delay="{min(i, 6) * 40}">
          <span class="process-step__index">{i:02d}</span>
          <span class="process-step__label">{esc(step)}</span>
        </a>''')
    return f'''    <section class="section process-section" aria-labelledby="process-heading">
      <div class="container">
        <div class="section-head">
          <p class="eyebrow" data-reveal="fade-up">How We Build</p>
          <h2 class="section-head__title" id="process-heading" data-reveal="fade-up" data-reveal-delay="80">Our Production Process</h2>
          <p class="section-head__text" data-reveal="fade-up" data-reveal-delay="140">Every garment follows the same eleven-step process. Select any step to see that department in detail.</p>
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
    return f'''    <section class="section">
      <div class="container contact-grid">
        <div class="contact-grid__info">
          <p class="eyebrow">Reach Us Directly</p>
          <address>{LOCATION}<br><span class="placeholder">[Add verified street address here.]</span></address>
          <p class="contact-grid__note placeholder">[Add verified phone number and email address here.]</p>
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
            An apparel manufacturer built on discipline, in {LOCATION}.
          </h2>
          <p class="intro__text" data-reveal="fade-up" data-reveal-delay="160">
            {LEGAL_NAME} manufactures wearing apparel and knitted, ready-made garments — from
            fabric and design through cutting, printing, embroidery, stitching and dispatch, all under one roof.
            <span class="placeholder">[Add further verified company introduction here.]</span>
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
    out += block_carousel("products", product_title, [product_carousel_item(p) for p in PRODUCTS],
                           per_view="products", autoplay_ms=3500, aria_label="Featured Products")

    # 05 — Manufacturing Capabilities
    out += f'''    <section class="section section--ink" aria-labelledby="mfg-cap-heading">
      <div class="container why__grid">
        <figure class="why__visual" data-reveal="clip-up">
          <img src="{IMAGES['manufacturing']['overview']['src']}" alt="{esc(IMAGES['manufacturing']['overview']['alt'])}" width="1100" height="1350" loading="lazy">
        </figure>
        <div class="why__content">
          <p class="eyebrow" data-reveal="fade-up">Manufacturing Capabilities</p>
          <h2 class="why__heading" id="mfg-cap-heading" data-reveal="fade-up" data-reveal-delay="80">Ten departments. One integrated line.</h2>
          <p class="intro__text" data-reveal="fade-up" data-reveal-delay="140" style="color:rgba(255,255,255,.72);margin-bottom:1.6em;">
            Fabric, design, cutting, printing, embroidery, stitching, heat label, pressing, packing and dispatch — every department works in sequence under one roof in {LOCATION}.
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
            <li class="why__item" data-reveal="fade-up" data-reveal-delay="0"><span class="why__item-title">Integrated Production</span><span class="why__item-text">Ten departments under one roof, from fabric to dispatch.</span></li>
            <li class="why__item" data-reveal="fade-up" data-reveal-delay="60"><span class="why__item-title">Quality Discipline</span><span class="why__item-text">Checked in-line, not only at the end of the process.</span></li>
            <li class="why__item" data-reveal="fade-up" data-reveal-delay="120"><span class="why__item-title">Design-Led</span><span class="why__item-text">An in-house design team taking concepts to production.</span></li>
            <li class="why__item" data-reveal="fade-up" data-reveal-delay="180"><span class="why__item-title">Built for Scale</span><span class="why__item-text">125+ stitching machines supporting multi-style production.</span></li>
            <li class="why__item" data-reveal="fade-up" data-reveal-delay="240"><span class="why__item-title">Technology-Backed</span><span class="why__item-text">CAD, ERP and embroidery software across every department.</span></li>
            <li class="why__item" data-reveal="fade-up" data-reveal-delay="300"><span class="why__item-title">People-First</span><span class="why__item-text">Approximately 500–700 people across our production floor.</span></li>
          </ul>
        </div>
      </div>
    </section>
'''

    # 13 — Numbers / Capabilities (approx figures from the PDF)
    stats = [
        ("125+", "Stitching Machines (approx.)"),
        ("500–700", "People Employed (working estimate)"),
        ("10", "Integrated Manufacturing Departments"),
        ("50+", "Fabric Colours Currently Managed"),
    ]
    stat_html = "\n".join(f'''            <div class="stat-row__item"><dt class="stat-row__number">{esc(n)}</dt><dd class="stat-row__label">{esc(l)}</dd></div>'''
                           for n, l in stats)
    out += f'''    <section class="section section--ink">
      <div class="container">
        <p class="eyebrow" data-reveal="fade-up">Capabilities</p>
        <h2 class="section-head__title" data-reveal="fade-up" data-reveal-delay="80" style="margin-bottom:1.4em;">By the Numbers</h2>
        <dl class="stat-row" data-reveal="fade-up" data-reveal-delay="120">
{stat_html}
        </dl>
        <p class="stat-row__note">Figures shown are approximate, current working estimates from internal production planning — not final production numbers.</p>
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

