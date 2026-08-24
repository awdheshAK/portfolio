#!/usr/bin/env python3
"""
MJ Oswal static-site generator.

This is the site's "component system" for a plain HTML/CSS/JS stack with no
client-side framework: one canonical page manifest + a handful of shared
render functions (head/header/nav/breadcrumb/footer + reusable content
blocks) produce every page as a real, standalone HTML file. Re-run this
script any time the manifest changes:

    python3 scripts/build_site.py

Nothing at runtime depends on this script — the output is ordinary static
HTML that works with JS disabled for content/navigation.
"""
import os
import re

ROOT = os.path.join(os.path.dirname(__file__), "..")
BASE_URL = "https://www.mjoswal.com"
SITE_NAME = "MJ Oswal"

# =============================================================================
# 1. IMAGE POOL — reuse the existing placeholder SVGs across all new pages
# =============================================================================
IMG = {
    "hero": "/assets/images/hero/hero-main.svg",
    "intro": "/assets/images/intro/intro-visual.svg",
    "biz1": "/assets/images/business/business-01.svg",
    "biz2": "/assets/images/business/business-02.svg",
    "biz3": "/assets/images/business/business-03.svg",
    "biz4": "/assets/images/business/business-04.svg",
    "why": "/assets/images/why/why-visual.svg",
    "proj1": "/assets/images/projects/project-01.svg",
    "proj2": "/assets/images/projects/project-02.svg",
    "proj3": "/assets/images/projects/project-03.svg",
    "sustain": "/assets/images/sustainability/sustainability-visual.svg",
    "insight1": "/assets/images/insights/insight-01.svg",
    "insight2": "/assets/images/insights/insight-02.svg",
    "insight3": "/assets/images/insights/insight-03.svg",
    "cta": "/assets/images/cta/cta-visual.svg",
}
IMG_CYCLE = ["biz1", "biz2", "biz3", "biz4", "proj1", "proj2", "proj3",
             "insight1", "insight2", "insight3", "intro", "why", "sustain"]

def cycle_img(index):
    return IMG[IMG_CYCLE[index % len(IMG_CYCLE)]]

# =============================================================================
# 2. TOP-LEVEL NAV — curated subset of children shown in the nav panel.
#    Hub pages (below) list ALL children; this is just the quick-access menu.
# =============================================================================
NAV = [
    {"label": "Home", "url": "/", "card": "default"},
    {"label": "About Us", "url": "/about/", "card": "about", "children": [
        {"label": "Our Story", "url": "/about/our-story/"},
        {"label": "Leadership", "url": "/about/leadership/"},
        {"label": "Our Values", "url": "/about/our-values/"},
        {"label": "Milestones", "url": "/about/milestones/"},
        {"label": "About overview", "url": "/about/"},
    ]},
    {"label": "Our Businesses", "url": "/businesses/", "card": "businesses", "children": [
        {"label": "[Business Vertical 01]", "url": "/businesses/business-01/"},
        {"label": "[Business Vertical 02]", "url": "/businesses/business-02/"},
        {"label": "[Business Vertical 03]", "url": "/businesses/business-03/"},
        {"label": "View all businesses", "url": "/businesses/"},
    ]},
    {"label": "Products & Services", "url": "/products-services/", "card": "products", "children": [
        {"label": "[Product Category 01]", "url": "/products-services/category-01/"},
        {"label": "[Product Category 02]", "url": "/products-services/category-02/"},
        {"label": "[Product Category 03]", "url": "/products-services/category-03/"},
        {"label": "View all products & services", "url": "/products-services/"},
    ]},
    {"label": "Projects", "url": "/projects/", "card": "projects", "children": [
        {"label": "[Project Name 01]", "url": "/projects/project-01/"},
        {"label": "[Project Name 02]", "url": "/projects/project-02/"},
        {"label": "View all projects", "url": "/projects/"},
    ]},
    {"label": "Sustainability", "url": "/sustainability/", "card": "sustainability", "children": [
        {"label": "Environment", "url": "/sustainability/environment/"},
        {"label": "Community", "url": "/sustainability/community/"},
        {"label": "People & Safety", "url": "/sustainability/people-safety/"},
        {"label": "View all", "url": "/sustainability/"},
    ]},
    {"label": "Insights", "url": "/insights/", "card": "insights", "children": [
        {"label": "News", "url": "/insights/news/"},
        {"label": "Blog", "url": "/insights/blog/"},
        {"label": "Insights overview", "url": "/insights/"},
    ]},
    {"label": "Careers", "url": "/careers/", "card": "careers", "children": [
        {"label": "Life at MJ Oswal", "url": "/careers/life-at-mj-oswal/"},
        {"label": "Career Opportunities", "url": "/careers/opportunities/"},
        {"label": "Employee Culture", "url": "/careers/culture/"},
        {"label": "Careers overview", "url": "/careers/"},
    ]},
    {"label": "Contact Us", "url": "/contact/", "card": "contact"},
]

NAV_CARD_IMAGES = {
    "default": (IMG["hero"], "MJ Oswal", "Enterprise built on trust"),
    "about": (IMG["intro"], "About Us", "Our story, leadership & governance"),
    "businesses": (IMG["biz1"], "Our Businesses", "Diversified, disciplined, dependable"),
    "products": (IMG["biz2"], "Products & Services", "Engineered for quality"),
    "projects": (IMG["proj1"], "Projects", "A portfolio in progress"),
    "sustainability": (IMG["sustain"], "Sustainability", "Growth, responsibly delivered"),
    "insights": (IMG["insight1"], "Insights", "News & perspectives"),
    "careers": (IMG["biz3"], "Careers", "Build your future with us"),
    "contact": (IMG["why"], "Contact Us", "Let's start a conversation"),
}

FOOTER_COLUMNS = [
    ("Company", [
        ("About Us", "/about/"), ("Leadership", "/about/leadership/"),
        ("Our Values", "/about/our-values/"), ("Careers", "/careers/"),
    ]),
    ("Businesses", [
        ("[Business Vertical 01]", "/businesses/business-01/"),
        ("[Business Vertical 02]", "/businesses/business-02/"),
        ("[Business Vertical 03]", "/businesses/business-03/"),
        ("View all businesses", "/businesses/"),
    ]),
    ("Resources", [
        ("Insights & News", "/insights/"), ("Projects", "/projects/"),
        ("Sustainability", "/sustainability/"), ("Sitemap", "/sitemap/"),
    ]),
]

# =============================================================================
# 3. PAGE MANIFEST
# =============================================================================
PAGES = []

def add(**kw):
    kw.setdefault("kind", "detail")
    PAGES.append(kw)
    return kw

# --- HOME -------------------------------------------------------------------
add(path="/", title="MJ Oswal — Building Enduring Value, Responsibly", kind="home",
    category=None, heading="Enterprise built on trust.",
    description="MJ Oswal is a diversified Indian business group building enduring value across industries through engineering discipline, quality and long-term trust.")

# --- ABOUT --------------------------------------------------------------------
add(path="/about/", title="About MJ Oswal", kind="hub", category="about",
    heading="About MJ Oswal", eyebrow="About Us",
    lede="A diversified Indian business group built on engineering discipline, quality and long-term trust. [Add verified company introduction here.]",
    children=[
        {"href": "/about/our-story/", "title": "Our Story", "text": "[How MJ Oswal was founded and how the group has grown over time.]"},
        {"href": "/about/leadership/", "title": "Leadership", "text": "[Introduce the leadership team once verified profiles are available.]"},
        {"href": "/about/our-values/", "title": "Our Values", "text": "[The principles that guide every MJ Oswal business.]"},
        {"href": "/about/vision-mission/", "title": "Vision & Mission", "text": "[MJ Oswal's long-term vision and guiding mission statement.]"},
        {"href": "/about/group-overview/", "title": "Group Overview", "text": "[A structural overview of the MJ Oswal group of companies.]"},
        {"href": "/about/milestones/", "title": "Milestones", "text": "[Key milestones across the group's history.]"},
        {"href": "/about/certifications/", "title": "Certifications", "text": "[Quality, safety and industry certifications held by the group.]"},
    ])
ABOUT_SUB = [
    ("our-story", "Our Story", "A legacy in motion", "[Add the verified history and founding story of MJ Oswal here — key dates, founders, and how the group has grown.]"),
    ("leadership", "Leadership", "The people steering MJ Oswal", "[Add verified leadership profiles — names, titles and short biographies — once available.]"),
    ("our-values", "Our Values", "What we stand for", "[Describe the core values that guide decision-making across every MJ Oswal business.]"),
    ("vision-mission", "Vision & Mission", "Where we are headed", "[Add MJ Oswal's official vision and mission statements here.]"),
    ("group-overview", "Group Overview", "How MJ Oswal is structured", "[Provide a structural overview of the group's businesses, subsidiaries and leadership.]"),
    ("milestones", "Milestones", "A timeline of growth", "[List verified milestones — founding year, expansions, major achievements — in chronological order.]"),
    ("certifications", "Certifications", "Quality and compliance", "[List verified certifications, accreditations and industry recognitions held by MJ Oswal.]"),
]
for slug, title, heading, lede in ABOUT_SUB:
    add(path=f"/about/{slug}/", title=f"{title} — MJ Oswal", kind="detail", category="about",
        heading=heading, eyebrow="About Us", lede=lede,
        highlights=[
            {"title": "[Highlight One]", "text": "[Short supporting detail once confirmed.]"},
            {"title": "[Highlight Two]", "text": "[Short supporting detail once confirmed.]"},
            {"title": "[Highlight Three]", "text": "[Short supporting detail once confirmed.]"},
            {"title": "[Highlight Four]", "text": "[Short supporting detail once confirmed.]"},
        ],
        related=[{"title": t, "href": f"/about/{s}/"} for s, t, *_ in ABOUT_SUB if s != slug][:3])

# --- BUSINESSES ---------------------------------------------------------------
BIZ_COUNT = 8
add(path="/businesses/", title="Our Businesses", kind="hub", category="businesses",
    heading="Our Businesses", eyebrow="What We Do",
    lede="A diversified portfolio of enterprises, each held to the same standard of quality and long-term thinking.",
    children=[
        {"href": f"/businesses/business-{i:02d}/", "title": f"[Business Vertical {i:02d}]",
         "text": "[Short description of this business vertical.]", "image": cycle_img(i)}
        for i in range(1, BIZ_COUNT + 1)
    ])
for i in range(1, BIZ_COUNT + 1):
    slug = f"business-{i:02d}"
    add(path=f"/businesses/{slug}/", title=f"[Business Vertical {i:02d}] — MJ Oswal", kind="detail", category="businesses",
        heading=f"[Business Vertical {i:02d}]", eyebrow="Our Businesses",
        lede="[Add a verified overview of this business vertical — what it does, its scale, and its market position.]",
        highlights=[
            {"title": "Focus Area", "text": "[Primary focus area of this business.]"},
            {"title": "Capability", "text": "[Key capability or strength.]"},
            {"title": "Reach", "text": "[Geographic or market reach.]"},
            {"title": "Standards", "text": "[Quality or compliance standards followed.]"},
        ],
        related=[{"title": f"[Business Vertical {j:02d}]", "href": f"/businesses/business-{j:02d}/"}
                 for j in range(1, BIZ_COUNT + 1) if j != i][:3],
        hero_image=cycle_img(i))

# --- PRODUCTS & SERVICES -------------------------------------------------------
PROD_COUNT = 8
add(path="/products-services/", title="Products & Services", kind="hub", category="products",
    heading="Products & Services", eyebrow="What We Offer",
    lede="Engineered products and services delivered to a consistent standard of quality across every category.",
    children=[
        {"href": f"/products-services/category-{i:02d}/", "title": f"[Product Category {i:02d}]",
         "text": "[Short description of this product or service category.]", "image": cycle_img(i + 3)}
        for i in range(1, PROD_COUNT + 1)
    ])
for i in range(1, PROD_COUNT + 1):
    slug = f"category-{i:02d}"
    add(path=f"/products-services/{slug}/", title=f"[Product Category {i:02d}] — MJ Oswal", kind="detail", category="products",
        heading=f"[Product Category {i:02d}]", eyebrow="Products & Services",
        lede="[Add a verified description of this product or service category, its applications, and its quality standards.]",
        highlights=[
            {"title": "Application", "text": "[Primary application or use case.]"},
            {"title": "Quality", "text": "[Quality assurance approach.]"},
            {"title": "Availability", "text": "[Markets or regions served.]"},
            {"title": "Support", "text": "[Customer or technical support offered.]"},
        ],
        related=[{"title": f"[Product Category {j:02d}]", "href": f"/products-services/category-{j:02d}/"}
                 for j in range(1, PROD_COUNT + 1) if j != i][:3],
        hero_image=cycle_img(i + 3))

# --- PROJECTS -------------------------------------------------------------------
PROJ_COUNT = 7
add(path="/projects/", title="Projects", kind="hub", category="projects",
    heading="Featured Projects", eyebrow="Our Work",
    lede="A growing portfolio of projects delivered with engineering discipline and long-term quality in mind.",
    children=[
        {"href": f"/projects/project-{i:02d}/", "title": f"[Project Name {i:02d}]",
         "text": "[Short project description.]", "category": "[Sector]", "image": cycle_img(i + 6)}
        for i in range(1, PROJ_COUNT + 1)
    ])
for i in range(1, PROJ_COUNT + 1):
    slug = f"project-{i:02d}"
    add(path=f"/projects/{slug}/", title=f"[Project Name {i:02d}] — MJ Oswal Projects", kind="detail", category="projects",
        heading=f"[Project Name {i:02d}]", eyebrow="[Sector] — Projects",
        lede="[Add a verified project overview — scope, location, timeline and outcome — once available.]",
        highlights=[
            {"title": "Location", "text": "[Project location.]"},
            {"title": "Scope", "text": "[Scope of work.]"},
            {"title": "Timeline", "text": "[Project timeline.]"},
            {"title": "Outcome", "text": "[Key outcome or impact.]"},
        ],
        related=[{"title": f"[Project Name {j:02d}]", "href": f"/projects/project-{j:02d}/"}
                 for j in range(1, PROJ_COUNT + 1) if j != i][:3],
        hero_image=cycle_img(i + 6))

# --- SUSTAINABILITY ---------------------------------------------------------------
SUSTAIN_SUB = [
    ("environment", "Environment", "Protecting the environment we build in", "[Describe MJ Oswal's environmental commitments and initiatives.]"),
    ("responsible-manufacturing", "Responsible Manufacturing", "Manufacturing with discipline", "[Describe responsible-manufacturing practices and standards followed.]"),
    ("energy-efficiency", "Energy & Efficiency", "Doing more with less", "[Describe energy-efficiency initiatives across operations.]"),
    ("community", "Community", "Investing in the communities around us", "[Describe community engagement and development programmes.]"),
    ("people-safety", "People & Safety", "People first, always", "[Describe workplace safety standards and people-first policies.]"),
    ("governance", "Governance", "Governed with integrity", "[Describe governance structures and ethical business practices.]"),
    ("initiatives", "Sustainability Initiatives", "Programmes in action", "[List specific sustainability programmes and initiatives once confirmed.]"),
]
add(path="/sustainability/", title="Sustainability", kind="hub", category="sustainability",
    heading="Sustainability", eyebrow="Sustainability & Innovation",
    lede="We believe growth and responsibility move together. [Add MJ Oswal's sustainability commitments here.]",
    children=[{"href": f"/sustainability/{s}/", "title": t, "text": lede, "image": cycle_img(i)}
              for i, (s, t, _, lede) in enumerate(SUSTAIN_SUB)])
for i, (slug, title, heading, lede) in enumerate(SUSTAIN_SUB):
    add(path=f"/sustainability/{slug}/", title=f"{title} — Sustainability — MJ Oswal", kind="detail", category="sustainability",
        heading=heading, eyebrow="Sustainability",
        lede=lede,
        highlights=[
            {"title": "Commitment", "text": "[A specific, verified commitment in this area.]"},
            {"title": "Programme", "text": "[A named programme or initiative.]"},
            {"title": "Progress", "text": "[Verified progress or metric, once available.]"},
            {"title": "Partnership", "text": "[Partner organisations involved, if any.]"},
        ],
        related=[{"title": t, "href": f"/sustainability/{s}/"} for s, t, *_ in SUSTAIN_SUB if s != slug][:3],
        hero_image=cycle_img(i))

# --- INSIGHTS ---------------------------------------------------------------------
add(path="/insights/", title="Insights", kind="hub", category="insights",
    heading="Insights", eyebrow="Insights",
    lede="News, updates and perspectives from across MJ Oswal.",
    children=[
        {"href": "/insights/news/", "title": "News", "text": "[Company announcements and press coverage.]", "image": IMG["insight1"]},
        {"href": "/insights/blog/", "title": "Blog", "text": "[Perspectives and long-form articles from MJ Oswal.]", "image": IMG["insight2"]},
    ])

NEWS_COUNT = 3
add(path="/insights/news/", title="News", kind="listing", category="insights", parent=("News", "/insights/news/"),
    heading="News", eyebrow="Insights",
    lede="The latest announcements and press coverage from MJ Oswal.",
    items=[{"href": f"/insights/news/article-{i:02d}/", "title": f"[News Headline {i:02d}]",
            "text": "[Short summary of this news item.]", "category": "[Category]",
            "date": "[Month Year]", "image": cycle_img(i)} for i in range(1, NEWS_COUNT + 1)])
for i in range(1, NEWS_COUNT + 1):
    slug = f"article-{i:02d}"
    add(path=f"/insights/news/{slug}/", title=f"[News Headline {i:02d}] — MJ Oswal News", kind="article", category="insights",
        parent=("News", "/insights/news/"), heading=f"[News Headline {i:02d}]", eyebrow="[Category]",
        date="[Month Year]",
        lede="[Opening summary of this news article.]",
        body=[
            "[Add the verified body copy for this news article once available. This placeholder paragraph stands in for real, fact-checked content.]",
            "[A second paragraph can expand on background, quotes, or additional context once supplied.]",
        ],
        related=[{"title": f"[News Headline {j:02d}]", "href": f"/insights/news/article-{j:02d}/"}
                 for j in range(1, NEWS_COUNT + 1) if j != i],
        hero_image=cycle_img(i))

BLOG_COUNT = 3
add(path="/insights/blog/", title="Blog", kind="listing", category="insights", parent=("Blog", "/insights/blog/"),
    heading="Blog", eyebrow="Insights",
    lede="Perspectives, ideas and long-form writing from across MJ Oswal.",
    items=[{"href": f"/insights/blog/article-{i:02d}/", "title": f"[Blog Article {i:02d}]",
            "text": "[Short summary of this article.]", "category": "[Topic]",
            "date": "[Month Year]", "image": cycle_img(i + 5)} for i in range(1, BLOG_COUNT + 1)])
for i in range(1, BLOG_COUNT + 1):
    slug = f"article-{i:02d}"
    add(path=f"/insights/blog/{slug}/", title=f"[Blog Article {i:02d}] — MJ Oswal Blog", kind="article", category="insights",
        parent=("Blog", "/insights/blog/"), heading=f"[Blog Article {i:02d}]", eyebrow="[Topic]",
        date="[Month Year]",
        lede="[Opening summary of this blog article.]",
        body=[
            "[Add the verified body copy for this article once available. This placeholder paragraph stands in for real content.]",
            "[A second paragraph can expand further once supplied.]",
        ],
        related=[{"title": f"[Blog Article {j:02d}]", "href": f"/insights/blog/article-{j:02d}/"}
                 for j in range(1, BLOG_COUNT + 1) if j != i],
        hero_image=cycle_img(i + 5))

# --- CAREERS ------------------------------------------------------------------------
add(path="/careers/", title="Careers", kind="hub", category="careers",
    heading="Careers at MJ Oswal", eyebrow="Careers",
    lede="Build your future with a diversified group that invests in its people. [Add verified careers overview here.]",
    children=[
        {"href": "/careers/life-at-mj-oswal/", "title": "Life at MJ Oswal", "text": "[What it's like to work across MJ Oswal's businesses.]", "image": IMG["biz3"]},
        {"href": "/careers/opportunities/", "title": "Career Opportunities", "text": "[Current open positions across the group.]", "image": IMG["biz4"]},
        {"href": "/careers/culture/", "title": "Employee Culture", "text": "[The culture and values that shape everyday work at MJ Oswal.]", "image": IMG["intro"]},
    ])
add(path="/careers/life-at-mj-oswal/", title="Life at MJ Oswal — Careers", kind="detail", category="careers",
    heading="Life at MJ Oswal", eyebrow="Careers",
    lede="[Describe day-to-day life, benefits, and what makes MJ Oswal a place to build a career.]",
    highlights=[
        {"title": "Growth", "text": "[Learning and career-growth opportunities.]"},
        {"title": "Benefits", "text": "[Employee benefits once confirmed.]"},
        {"title": "Culture", "text": "[What defines the day-to-day culture.]"},
        {"title": "Community", "text": "[Employee community and engagement programmes.]"},
    ],
    related=[{"title": "Career Opportunities", "href": "/careers/opportunities/"},
             {"title": "Employee Culture", "href": "/careers/culture/"}],
    hero_image=IMG["biz3"])
add(path="/careers/culture/", title="Employee Culture — Careers", kind="detail", category="careers",
    heading="Employee Culture", eyebrow="Careers",
    lede="[Describe the values and behaviours that define MJ Oswal's workplace culture.]",
    highlights=[
        {"title": "Collaboration", "text": "[How teams work together across the group.]"},
        {"title": "Recognition", "text": "[How achievement is recognised.]"},
        {"title": "Diversity", "text": "[Diversity and inclusion commitments.]"},
        {"title": "Wellbeing", "text": "[Employee wellbeing initiatives.]"},
    ],
    related=[{"title": "Life at MJ Oswal", "href": "/careers/life-at-mj-oswal/"},
             {"title": "Career Opportunities", "href": "/careers/opportunities/"}],
    hero_image=IMG["intro"])

JOB_COUNT = 2
add(path="/careers/opportunities/", title="Career Opportunities", kind="listing", category="careers",
    parent=("Career Opportunities", "/careers/opportunities/"),
    heading="Career Opportunities", eyebrow="Careers",
    lede="Current open positions across MJ Oswal's businesses. [Add verified openings as they become available.]",
    items=[{"href": f"/careers/opportunities/job-{i:02d}/", "title": f"[Job Title {i:02d}]",
            "text": "[Department] · [Location] · [Employment Type]", "category": "[Department]",
            "date": "[Posted Month Year]", "image": cycle_img(i + 2)} for i in range(1, JOB_COUNT + 1)])
for i in range(1, JOB_COUNT + 1):
    slug = f"job-{i:02d}"
    add(path=f"/careers/opportunities/{slug}/", title=f"[Job Title {i:02d}] — Careers — MJ Oswal", kind="job", category="careers",
        parent=("Career Opportunities", "/careers/opportunities/"), heading=f"[Job Title {i:02d}]", eyebrow="[Department]",
        meta=[("Location", "[Office Location]"), ("Type", "[Employment Type]"), ("Department", "[Department Name]")],
        lede="[Add a verified role summary once this position is confirmed.]",
        body=[
            "[Add verified role responsibilities once available.]",
            "[Add verified candidate requirements once available.]",
        ],
        hero_image=cycle_img(i + 2))

# --- CONTACT ----------------------------------------------------------------------
add(path="/contact/", title="Contact Us", kind="contact", category="contact",
    heading="Contact Us", eyebrow="Get in Touch",
    lede="We would love to hear from you. [Add verified contact details once confirmed.]")
add(path="/contact/locations/", title="Offices & Locations — Contact", kind="locations", category="contact",
    heading="Offices & Locations", eyebrow="Get in Touch",
    lede="[Add verified office locations once confirmed.]",
    offices=[
        {"name": "[Head Office]", "address": "[Registered Office Address, City, State — PIN], India",
         "phone": "+91 22 XXXX XXXX", "email": "info@mjoswal.com"},
        {"name": "[Regional Office 01]", "address": "[Office Address, City, State — PIN], India",
         "phone": "+91 XX XXXX XXXX", "email": "info@mjoswal.com"},
        {"name": "[Regional Office 02]", "address": "[Office Address, City, State — PIN], India",
         "phone": "+91 XX XXXX XXXX", "email": "info@mjoswal.com"},
    ])
add(path="/contact/enquiry/", title="General Enquiry — Contact", kind="enquiry", category="contact",
    heading="General Enquiry", eyebrow="Get in Touch",
    lede="Have a question for MJ Oswal? Send us a general enquiry and our team will get back to you.")
add(path="/contact/thank-you/", title="Thank You — MJ Oswal", kind="thanks", category="contact",
    heading="Thank you.", eyebrow="Get in Touch",
    lede="Your message has been received. A member of the MJ Oswal team will be in touch shortly.")

# --- LEGAL / UTILITY ---------------------------------------------------------------
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
# Build a lookup + category metadata (label used in nav/breadcrumbs)
# =============================================================================
CATEGORY_LABEL = {
    "about": "About Us", "businesses": "Our Businesses", "products": "Products & Services",
    "projects": "Projects", "sustainability": "Sustainability", "insights": "Insights",
    "careers": "Careers", "contact": "Contact Us", "legal": "Legal",
}
CATEGORY_HUB = {
    "about": "/about/", "businesses": "/businesses/", "products": "/products-services/",
    "projects": "/projects/", "sustainability": "/sustainability/", "insights": "/insights/",
    "careers": "/careers/", "contact": "/contact/",
}
PAGES_BY_PATH = {p["path"]: p for p in PAGES}

# =============================================================================
# 4. HTML ESCAPE + SMALL HELPERS
# =============================================================================
def esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;"))

ARROW_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'

def breadcrumb_trail(page):
    """Return list of (label, url|None) tuples, self last with url=None."""
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
# 5. SHARED SHELL: <head>, header, nav panel, footer
# =============================================================================
def render_head(page):
    url = BASE_URL + page["path"]
    title = page["title"] if page["kind"] == "home" else f'{page["title"]}'
    desc = page.get("description") or page.get("lede") or f'{page.get("heading", SITE_NAME)} — {SITE_NAME}.'
    desc = re.sub(r"\s+", " ", desc).strip()
    og_image = BASE_URL + page.get("hero_image", IMG["hero"])
    is_home = page["kind"] == "home"
    robots = "noindex, follow" if page["path"] == "/404.html" else "index, follow"

    schema_blocks = []
    if is_home:
        schema_blocks.append("""  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Corporation",
    "name": "MJ Oswal",
    "url": "%s/",
    "logo": "%s/favicon.svg",
    "sameAs": [
      "https://www.linkedin.com/company/mjoswal",
      "https://www.instagram.com/mjoswal",
      "https://x.com/mjoswal"
    ],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "[Registered Office Address]",
      "addressLocality": "[City]",
      "addressRegion": "[State]",
      "postalCode": "[PIN]",
      "addressCountry": "IN"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "info@mjoswal.com"
    }
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MJ Oswal",
    "url": "%s/"
  }
  </script>""" % (BASE_URL, BASE_URL, BASE_URL))
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
  <meta property="og:site_name" content="MJ Oswal">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(desc)}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{og_image}">
  <meta property="og:locale" content="en_IN">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(title)}">
  <meta name="twitter:description" content="{esc(desc)}">
  <meta name="twitter:image" content="{og_image}">

  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/favicon.svg">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
{'  <link rel="preload" as="image" href="' + page.get("hero_image", IMG["hero"]) + '" fetchpriority="high">' if is_home else ''}
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
      <a href="/" class="site-header__logo" aria-label="MJ Oswal — Home">
        <svg class="site-header__mark" viewBox="0 0 40 40" aria-hidden="true">
          <rect x="1" y="1" width="38" height="38" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
          <path d="M10 27V13h3.1l4.4 9.4 4.4-9.4H25v14h-2.9V17.7l-3.9 8.3h-2.4l-3.9-8.3V27H10Z" fill="currentColor"/>
        </svg>
        <span class="site-header__wordmark">MJ Oswal</span>
      </a>

      <div class="site-header__actions">
        <a href="/contact/" class="btn btn--ghost site-header__cta" data-track="cta_click" data-track-label="header_contact">
          <span>Contact Us</span>
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
            <a href="mailto:info@mjoswal.com" data-track="email_click">info@mjoswal.com</a>
            <a href="tel:+912200000000" data-track="phone_click">+91 22 XXXX XXXX</a>
          </div>
          <div class="site-nav__meta-block">
            <p class="site-nav__meta-label">Follow</p>
            <div class="site-nav__social">
              <a href="https://www.linkedin.com/company/mjoswal" aria-label="MJ Oswal on LinkedIn" target="_blank" rel="noopener">LinkedIn</a>
              <a href="https://www.instagram.com/mjoswal" aria-label="MJ Oswal on Instagram" target="_blank" rel="noopener">Instagram</a>
              <a href="https://x.com/mjoswal" aria-label="MJ Oswal on X" target="_blank" rel="noopener">X</a>
            </div>
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
        <a href="/" class="site-footer__logo" aria-label="MJ Oswal — Home">
          <svg viewBox="0 0 40 40" aria-hidden="true">
            <rect x="1" y="1" width="38" height="38" rx="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10 27V13h3.1l4.4 9.4 4.4-9.4H25v14h-2.9V17.7l-3.9 8.3h-2.4l-3.9-8.3V27H10Z" fill="currentColor"/>
          </svg>
          <span>MJ Oswal</span>
        </a>
        <p class="site-footer__tagline">Building enduring value, responsibly.</p>
        <div class="site-footer__social">
          <a href="https://www.linkedin.com/company/mjoswal" aria-label="MJ Oswal on LinkedIn" target="_blank" rel="noopener">LinkedIn</a>
          <a href="https://www.instagram.com/mjoswal" aria-label="MJ Oswal on Instagram" target="_blank" rel="noopener">Instagram</a>
          <a href="https://x.com/mjoswal" aria-label="MJ Oswal on X" target="_blank" rel="noopener">X</a>
        </div>
      </div>
{chr(10).join(cols)}
      <div class="site-footer__col site-footer__col--contact">
        <h3>Contact</h3>
        <address>
          <span class="placeholder">[Registered Office Address, City, State — PIN]</span>, India<br>
          <a href="tel:+912200000000" data-track="phone_click">+91 22 XXXX XXXX</a><br>
          <a href="mailto:info@mjoswal.com" data-track="email_click">info@mjoswal.com</a>
        </address>
      </div>
    </div>

    <div class="container site-footer__bottom">
      <p>&copy; <span data-current-year>2026</span> MJ Oswal. All rights reserved.</p>
      <ul class="site-footer__legal">
        <li><a href="/privacy-policy/">Privacy Policy</a></li>
        <li><a href="/terms-of-use/">Terms of Use</a></li>
        <li><a href="/sitemap/">Sitemap</a></li>
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
{breadcrumb}      <p class="eyebrow">{esc(page.get("eyebrow", CATEGORY_LABEL.get(page.get("category"), "MJ Oswal")))}</p>
      <h1 class="page-header__heading">{page.get("heading", page["title"])}</h1>{lede_html}
    </div>
  </div>
'''


# =============================================================================
# 6. REUSABLE CONTENT BLOCKS
# =============================================================================
def block_tile_grid(items, columns=None):
    cols_class = f" tile-grid--{columns}" if columns else ""
    cards = []
    for i, it in enumerate(items):
        img = it.get("image", cycle_img(i))
        cat = f'<span class="tile-card__category placeholder">{esc(it["category"])}</span>' if it.get("category") else ""
        cards.append(f'''        <a class="tile-card" href="{it["href"]}" data-reveal="fade-up" data-reveal-delay="{min(i, 4) * 80}">
          <span class="tile-card__frame">
            <img src="{img}" alt="" width="900" height="1100" loading="lazy">
          </span>
          <span class="tile-card__body">
            {cat}
            <span class="tile-card__title placeholder">{esc(it["title"])}</span>
            <span class="tile-card__text placeholder">{esc(it["text"])}</span>
            <span class="tile-card__cta"><span>Explore</span>{ARROW_SVG}</span>
          </span>
        </a>''')
    return f'''    <section class="section">
      <div class="container">
        <div class="tile-grid{cols_class}">
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
            <span class="why__item-text placeholder">{esc(it["text"])}</span>
          </li>''')
    return f'''    <section class="section section--ink">
      <div class="container">
        <ul class="why__list why__list--standalone">
{chr(10).join(lis)}
        </ul>
      </div>
    </section>
'''


def block_related(items, heading="Related"):
    if not items:
        return ""
    links = "\n".join(
        f'          <li><a class="link-arrow" href="{it["href"]}"><span class="placeholder">{esc(it["title"])}</span>{ARROW_SVG}</a></li>'
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


def block_cta(heading="Let's build what's next.", text="Connect with the MJ Oswal team to explore partnerships, careers and opportunities.",
              primary=("Contact Us", "/contact/"), secondary=("Careers", "/careers/")):
    return f'''    <section class="cta-band">
      <img class="cta-band__bg" src="{IMG['cta']}" alt="" width="1800" height="1000" loading="lazy">
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


def block_form(kind):
    fields = [
        form_field("Full Name", "name"),
        form_field("Email Address", "email", "email"),
        form_field("Phone Number", "phone", "tel", required=False),
    ]
    if kind == "enquiry":
        fields.append(form_field("Subject", "subject"))
    fields.append(form_field("Message", "message", textarea=True))
    return f'''        <form class="contact-form" action="/contact/thank-you/" method="get" data-track-form="{kind}">
{chr(10).join(fields)}
          <button type="submit" class="btn btn--primary">
            <span>Send Message</span>{ARROW_SVG}
          </button>
          <p class="contact-form__note">This form is a working front-end demo — connect it to a real endpoint before launch.</p>
        </form>
'''

# =============================================================================
# 7. PER-KIND PAGE BODIES
# =============================================================================
def body_hub(page):
    out = block_tile_grid(page["children"])
    out += block_cta()
    return out


def body_detail(page):
    out = ""
    if page.get("hero_image"):
        out += block_hero_image(page["hero_image"])
    if page.get("highlights"):
        out += block_highlights(page["highlights"])
    if page.get("related"):
        out += block_related(page["related"], f'More from {CATEGORY_LABEL.get(page.get("category"), "MJ Oswal")}')
    out += block_cta()
    return out


def body_listing(page):
    out = block_tile_grid(page["items"])
    out += block_cta(heading="Don't see what you're looking for?", text="Get in touch and our team will point you in the right direction.")
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


def body_job(page):
    out = block_hero_image(page["hero_image"])
    meta_items = "\n".join(f'          <div class="job-meta__item"><dt>{esc(k)}</dt><dd class="placeholder">{esc(v)}</dd></div>' for k, v in page["meta"])
    paras = "\n".join(f'          <p class="article-body__text">{esc(p)}</p>' for p in page["body"])
    out += f'''    <section class="section">
      <div class="container container--article">
        <dl class="job-meta">
{meta_items}
        </dl>
        <div class="article-body">
{paras}
        </div>
        <a href="mailto:careers@mjoswal.com?subject={esc(page["heading"])}" class="btn btn--primary" data-track="cta_click" data-track-label="job_apply">
          <span>Apply for this Role</span>{ARROW_SVG}
        </a>
      </div>
    </section>
'''
    out += block_cta(heading="Explore more opportunities", text="See every open position across MJ Oswal's businesses.",
                      primary=("Career Opportunities", "/careers/opportunities/"), secondary=("Life at MJ Oswal", "/careers/life-at-mj-oswal/"))
    return out


def body_contact(page):
    return f'''    <section class="section">
      <div class="container contact-grid">
        <div class="contact-grid__info">
          <p class="eyebrow">Reach Us Directly</p>
          <address>
            <span class="placeholder">[Registered Office Address, City, State — PIN]</span>, India
          </address>
          <a href="tel:+912200000000" class="contact-grid__link" data-track="phone_click">+91 22 XXXX XXXX</a>
          <a href="mailto:info@mjoswal.com" class="contact-grid__link" data-track="email_click">info@mjoswal.com</a>
          <ul class="related-list">
            <li><a class="link-arrow" href="/contact/locations/"><span>Offices &amp; Locations</span>{ARROW_SVG}</a></li>
            <li><a class="link-arrow" href="/contact/enquiry/"><span>General Enquiry</span>{ARROW_SVG}</a></li>
          </ul>
        </div>
        <div class="contact-grid__form">
          <p class="eyebrow">Send a Message</p>
{block_form("contact")}
        </div>
      </div>
    </section>
'''


def body_locations(page):
    cards = []
    for o in page["offices"]:
        cards.append(f'''        <div class="office-card">
          <p class="office-card__name placeholder">{esc(o["name"])}</p>
          <address class="office-card__address placeholder">{esc(o["address"])}</address>
          <a href="tel:{esc(o["phone"].replace(" ", ""))}" data-track="phone_click">{esc(o["phone"])}</a>
          <a href="mailto:{esc(o["email"])}" data-track="email_click">{esc(o["email"])}</a>
        </div>''')
    return f'''    <section class="section">
      <div class="container">
        <div class="office-grid">
{chr(10).join(cards)}
        </div>
      </div>
    </section>
''' + block_cta()


def body_enquiry(page):
    return f'''    <section class="section">
      <div class="container container--form">
{block_form("enquiry")}
      </div>
    </section>
'''


def body_thanks(page):
    return f'''    <section class="section section--center">
      <div class="container">
        <a href="/" class="btn btn--primary"><span>Return to Homepage</span>{ARROW_SVG}</a>
      </div>
    </section>
'''


def body_legal(page):
    secs = []
    for heading, text in page["sections"]:
        secs.append(f'''        <div class="legal-section">
          <h2>{esc(heading)}</h2>
          <p class="placeholder">{esc(text)}</p>
        </div>''')
    return f'''    <section class="section">
      <div class="container container--article">
{chr(10).join(secs)}
      </div>
    </section>
'''

BODY_RENDERERS = {
    "hub": body_hub, "detail": body_detail, "listing": body_listing,
    "article": body_article, "job": body_job, "contact": body_contact,
    "locations": body_locations, "enquiry": body_enquiry, "thanks": body_thanks,
    "legal": body_legal,
}


def assemble_page(page, body_html):
    return render_head(page) + "<body>\n" + render_header(page["path"]) + '  <main id="main">\n' + render_page_header(page) + body_html + "  </main>\n" + render_footer()


# =============================================================================
# 8. WRITE FILES
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
    page = {"path": "/sitemap/", "title": "Sitemap — MJ Oswal", "kind": "detail", "category": None,
            "heading": "Sitemap", "eyebrow": "MJ Oswal", "lede": "A complete index of every page on the MJ Oswal website."}
    return page, body


def build_404():
    page = {"path": "/404.html", "title": "Page Not Found — MJ Oswal", "kind": "detail", "category": None,
            "heading": "Page not found.", "eyebrow": "Error 404",
            "lede": "The page you are looking for may have moved or no longer exists."}
    body = f'''    <section class="section section--center">
      <div class="container">
        <a href="/" class="btn btn--primary"><span>Return to Homepage</span>{ARROW_SVG}</a>
      </div>
    </section>
'''
    return page, body


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

    # sitemap.xml — every generated page + hand-authored home
    urls = ["/"] + [p["path"] for p in PAGES if p["kind"] != "home"] + ["/sitemap/"]
    entries = "\n".join(
        f'  <url>\n    <loc>{BASE_URL}{u}</loc>\n    <lastmod>2026-08-24</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>{"1.0" if u == "/" else "0.7"}</priority>\n  </url>'
        for u in urls
    )
    sitemap_xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{entries}
</urlset>
'''
    with open(os.path.join(ROOT, "sitemap.xml"), "w") as f:
        f.write(sitemap_xml)

    print(f"Generated {count} pages + sitemap.xml ({len(urls)} URLs) + 404.html")


# =============================================================================
# 9. HOMEPAGE (hero slider + section rebuild, real internal links throughout)
# =============================================================================
HERO_SLIDES = [
    {"eyebrow": "MJ Oswal", "headline": "Enterprise built on trust.<br>Vision built to last.",
     "text": 'MJ Oswal is a diversified Indian business group building enduring value across <span class="placeholder">[core industries]</span> — engineered for quality, scaled for impact.',
     "primary": ("Explore Our Businesses", "/businesses/"), "secondary": ("About MJ Oswal", "/about/"), "image": IMG["hero"]},
    {"eyebrow": "Our Businesses", "headline": "A diversified portfolio.<br>One standard of quality.",
     "text": "Every MJ Oswal business is held to the same standard of engineering discipline and long-term thinking.",
     "primary": ("View Our Businesses", "/businesses/"), "secondary": ("Products & Services", "/products-services/"), "image": IMG["biz1"]},
    {"eyebrow": "Engineering & Quality", "headline": "Precision engineering.<br>Proven discipline.",
     "text": "From concept to delivery, quality is engineered in — not inspected in afterward.",
     "primary": ("Our Projects", "/projects/"), "secondary": ("Products & Services", "/products-services/"), "image": IMG["proj1"]},
    {"eyebrow": "Sustainability", "headline": "Growth and responsibility,<br>moving together.",
     "text": "We believe long-term growth and environmental responsibility are not in conflict — they're the same goal.",
     "primary": ("Our Approach to Sustainability", "/sustainability/"), "secondary": ("Read Insights", "/insights/"), "image": IMG["sustain"]},
    {"eyebrow": "Careers", "headline": "Build your future<br>with MJ Oswal.",
     "text": "Join a group that invests in engineering discipline, quality, and the people behind both.",
     "primary": ("Explore Careers", "/careers/"), "secondary": ("Contact Us", "/contact/"), "image": IMG["biz3"]},
]


def render_hero_slider():
    slides = []
    for i, s in enumerate(HERO_SLIDES):
        active = " is-active" if i == 0 else ""
        # Exactly one <h1> per page: only the first (initially active) slide
        # uses a real heading element — the rest use a <p> with the same
        # class so styling is identical but the heading hierarchy stays valid.
        heading_tag = "h1" if i == 0 else "p"
        slides.append(f'''      <div class="hero-slider__slide{active}" data-slide role="group" aria-roledescription="slide" aria-label="{i + 1} of {len(HERO_SLIDES)}">
        <div class="hero-slider__media">
          <img src="{s['image']}" alt="" width="1600" height="2000"{' fetchpriority="high"' if i == 0 else ' loading="lazy"'}>
          <div class="hero-slider__scrim" aria-hidden="true"></div>
        </div>
        <div class="hero-slider__content">
          <p class="eyebrow hero-slider__eyebrow">{esc(s['eyebrow'])}</p>
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

    return f'''    <section class="hero-slider" data-hero-slider aria-roledescription="carousel" aria-label="MJ Oswal highlights">
{chr(10).join(slides)}
      <div class="hero-slider__controls">
        <div class="hero-slider__nav">
          <button type="button" class="hero-slider__nav-btn" data-slide-prev aria-label="Previous slide">
            <svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button type="button" class="hero-slider__nav-btn" data-slide-next aria-label="Next slide">
            <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
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
    biz_items = [{"href": f"/businesses/business-{i:02d}/", "title": f"[Business Vertical {i:02d}]",
                  "text": "[Short description of this business vertical.]", "image": cycle_img(i)} for i in range(1, 5)]
    insight_items = [{"href": "/insights/news/article-01/", "title": "[News Headline 01]", "text": "[Short summary of this news item.]", "category": "[Category]", "image": IMG["insight1"]},
                      {"href": "/insights/news/article-02/", "title": "[News Headline 02]", "text": "[Short summary of this news item.]", "category": "[Category]", "image": IMG["insight2"]},
                      {"href": "/insights/blog/article-01/", "title": "[Blog Article 01]", "text": "[Short summary of this article.]", "category": "[Topic]", "image": IMG["insight3"]}]

    biz_cards = []
    for i, it in enumerate(biz_items):
        biz_cards.append(f'''          <a class="tile-card" href="{it["href"]}" data-reveal="fade-up" data-reveal-delay="{i * 80}">
            <span class="tile-card__frame">
              <img src="{it["image"]}" alt="" width="900" height="1100" loading="lazy">
            </span>
            <span class="tile-card__body">
              <span class="tile-card__title placeholder">{esc(it["title"])}</span>
              <span class="tile-card__text placeholder">{esc(it["text"])}</span>
              <span class="tile-card__cta"><span>Explore</span>{ARROW_SVG}</span>
            </span>
          </a>''')
    biz_cards_html = "\n".join(biz_cards)

    project_cards = []
    for i in range(1, 4):
        project_cards.append(f'''        <a class="project-card" href="/projects/project-{i:02d}/" data-reveal="fade-up" data-reveal-delay="{(i - 1) * 80}">
          <span class="project-card__frame"><img src="{cycle_img(i + 6)}" alt="" width="1400" height="1000" loading="lazy"></span>
          <span class="project-card__meta">
            <span class="project-card__category placeholder">[Sector]</span>
            <span class="project-card__title placeholder">[Project Name {i:02d}]</span>
            <span class="project-card__text placeholder">[Short project description.]</span>
          </span>
        </a>''')
    project_cards_html = "\n".join(project_cards)

    insight_cards = []
    for i, it in enumerate(insight_items):
        insight_cards.append(f'''          <a class="tile-card" href="{it["href"]}" data-reveal="fade-up" data-reveal-delay="{i * 80}">
            <span class="tile-card__frame"><img src="{it["image"]}" alt="" width="900" height="700" loading="lazy"></span>
            <span class="tile-card__body">
              <span class="tile-card__category placeholder">{esc(it["category"])}</span>
              <span class="tile-card__title placeholder">{esc(it["title"])}</span>
              <span class="tile-card__text placeholder">{esc(it["text"])}</span>
              <span class="tile-card__cta"><span>Read more</span>{ARROW_SVG}</span>
            </span>
          </a>''')
    insight_cards_html = "\n".join(insight_cards)

    return render_hero_slider() + f'''
    <!-- ============ INTRODUCTION ============ -->
    <section class="intro" id="intro" aria-labelledby="intro-heading">
      <div class="container intro__grid">
        <div class="intro__copy">
          <p class="eyebrow" data-reveal="fade-up">Who We Are</p>
          <h2 class="intro__heading" id="intro-heading" data-reveal="fade-up" data-reveal-delay="80">
            A legacy in motion, built one enterprise at a time.
          </h2>
          <p class="intro__text" data-reveal="fade-up" data-reveal-delay="160">
            For <span class="placeholder">[XX]</span> years, MJ Oswal has built businesses that stand
            the test of time — combining engineering discipline with an entrepreneurial spirit.
            <span class="placeholder">[Add verified company introduction and history here.]</span>
          </p>
          <a href="/about/" class="link-arrow" data-reveal="fade-up" data-reveal-delay="220"><span>Learn more about us</span>{ARROW_SVG}</a>
        </div>
        <figure class="intro__visual" data-reveal="clip-up" data-reveal-delay="120">
          <img src="{IMG['intro']}" alt="Portrait-oriented editorial image representing MJ Oswal's people and craftsmanship" width="1200" height="1500" loading="lazy">
        </figure>
      </div>
    </section>

    <!-- ============ OUR BUSINESSES ============ -->
    <section class="businesses" id="businesses" aria-labelledby="businesses-heading">
      <div class="container">
        <div class="section-head section-head--split">
          <div>
            <p class="eyebrow" data-reveal="fade-up">What We Do</p>
            <h2 class="section-head__title" id="businesses-heading" data-reveal="fade-up" data-reveal-delay="80">Our Businesses</h2>
          </div>
          <a href="/businesses/" class="link-arrow" data-reveal="fade-up" data-reveal-delay="120"><span>View all businesses</span>{ARROW_SVG}</a>
        </div>
        <div class="tile-grid">
{biz_cards_html}
        </div>
      </div>
    </section>

    <!-- ============ WHY MJ OSWAL ============ -->
    <section class="why" aria-labelledby="why-heading">
      <div class="container why__grid">
        <figure class="why__visual" data-reveal="clip-up">
          <img src="{IMG['why']}" alt="Editorial image representing MJ Oswal's operational scale" width="1100" height="1350" loading="lazy">
        </figure>
        <div class="why__content">
          <p class="eyebrow" data-reveal="fade-up">Why MJ Oswal</p>
          <h2 class="why__heading" id="why-heading" data-reveal="fade-up" data-reveal-delay="80">Six commitments behind every enterprise we build.</h2>
          <ul class="why__list">
            <li class="why__item" data-reveal="fade-up" data-reveal-delay="0"><span class="why__item-title">Expertise</span><span class="why__item-text">Leadership steeped in operational depth across core industries.</span></li>
            <li class="why__item" data-reveal="fade-up" data-reveal-delay="60"><span class="why__item-title">Quality</span><span class="why__item-text">Rigorous standards applied consistently, at every scale.</span></li>
            <li class="why__item" data-reveal="fade-up" data-reveal-delay="120"><span class="why__item-title">Innovation</span><span class="why__item-text">Modern methods applied to enduring business fundamentals.</span></li>
            <li class="why__item" data-reveal="fade-up" data-reveal-delay="180"><span class="why__item-title">Scale</span><span class="why__item-text">Infrastructure and reach built to support long-term growth.</span></li>
            <li class="why__item" data-reveal="fade-up" data-reveal-delay="240"><span class="why__item-title">Trust</span><span class="why__item-text">Relationships with partners and communities built over time.</span></li>
            <li class="why__item" data-reveal="fade-up" data-reveal-delay="300"><span class="why__item-title">Sustainability</span><span class="why__item-text">Growth pursued alongside environmental and social responsibility.</span></li>
          </ul>
          <dl class="stat-row" data-reveal="fade-up" data-reveal-delay="360">
            <div class="stat-row__item"><dt class="stat-row__number placeholder">[XX]+</dt><dd class="stat-row__label">Years of Enterprise</dd></div>
            <div class="stat-row__item"><dt class="stat-row__number placeholder">[XX]+</dt><dd class="stat-row__label">Projects Delivered</dd></div>
            <div class="stat-row__item"><dt class="stat-row__number placeholder">[XX]+</dt><dd class="stat-row__label">People Employed</dd></div>
            <div class="stat-row__item"><dt class="stat-row__number placeholder">[XX]</dt><dd class="stat-row__label">States Present In</dd></div>
          </dl>
          <p class="stat-row__note">Statistics shown are placeholders pending confirmed MJ Oswal business data.</p>
        </div>
      </div>
    </section>

    <!-- ============ FEATURED PROJECTS ============ -->
    <section class="projects" id="projects" aria-labelledby="projects-heading">
      <div class="container">
        <div class="section-head section-head--split">
          <div><p class="eyebrow" data-reveal="fade-up">Our Work</p><h2 class="section-head__title" id="projects-heading" data-reveal="fade-up" data-reveal-delay="80">Featured Projects</h2></div>
          <a href="/projects/" class="link-arrow" data-reveal="fade-up" data-reveal-delay="120"><span>View all projects</span>{ARROW_SVG}</a>
        </div>
      </div>
      <div class="projects__track" data-projects-track>
{project_cards_html}
      </div>
    </section>

    <!-- ============ SUSTAINABILITY ============ -->
    <section class="sustainability" id="sustainability" aria-labelledby="sustainability-heading">
      <figure class="sustainability__visual" data-reveal="clip-up">
        <img src="{IMG['sustain']}" alt="Wide editorial image representing MJ Oswal's sustainability commitments" width="1600" height="1100" loading="lazy">
      </figure>
      <div class="sustainability__content">
        <p class="eyebrow" data-reveal="fade-up">Sustainability &amp; Innovation</p>
        <h2 class="sustainability__heading" id="sustainability-heading" data-reveal="fade-up" data-reveal-delay="80">Growth and responsibility, moving together.</h2>
        <p class="sustainability__text" data-reveal="fade-up" data-reveal-delay="160"><span class="placeholder">[Add MJ Oswal's sustainability commitments, ESG initiatives and impact focus areas here.]</span></p>
        <a href="/sustainability/" class="btn btn--outline btn--light" data-reveal="fade-up" data-reveal-delay="220" data-track="cta_click" data-track-label="sustainability_approach"><span>Our Approach to Sustainability</span>{ARROW_SVG}</a>
      </div>
    </section>

    <!-- ============ INSIGHTS ============ -->
    <section class="insights" id="insights" aria-labelledby="insights-heading">
      <div class="container">
        <div class="section-head"><p class="eyebrow" data-reveal="fade-up">Insights</p><h2 class="section-head__title" id="insights-heading" data-reveal="fade-up" data-reveal-delay="80">News &amp; Perspectives</h2></div>
        <div class="tile-grid">
{insight_cards_html}
        </div>
      </div>
    </section>

''' + block_cta()


def assemble_home():
    page = {"path": "/", "title": "MJ Oswal — Building Enduring Value, Responsibly", "kind": "home",
            "category": None, "hero_image": IMG["hero"],
            "description": "MJ Oswal is a diversified Indian business group building enduring value across industries through engineering discipline, quality and long-term trust."}
    return render_head(page) + "<body>\n" + render_header("/", overlay=True) + '  <main id="main">\n' + body_home() + "  </main>\n" + render_footer()


if __name__ == "__main__":
    main()
