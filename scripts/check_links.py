#!/usr/bin/env python3
"""Fast filesystem-based internal-link + asset checker for the generated
site. Not part of the shipped site — a dev QA utility."""
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(__file__), "..")

def resolve(path):
    """Given a root-relative URL path, return True if a matching file exists."""
    path = path.split("#")[0].split("?")[0]
    if path == "":
        return True
    fs_path = os.path.join(ROOT, path.lstrip("/"))
    if os.path.isfile(fs_path):
        return True
    if path.endswith("/") and os.path.isfile(os.path.join(fs_path, "index.html")):
        return True
    if not path.endswith("/") and os.path.isfile(os.path.join(fs_path, "index.html")):
        return True  # tolerate missing trailing slash
    return False

html_files = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    if ".git" in dirpath:
        continue
    for fn in filenames:
        if fn.endswith(".html"):
            html_files.append(os.path.join(dirpath, fn))

print(f"Scanning {len(html_files)} HTML files...")

HREF_RE = re.compile(r'href="([^"]+)"')
SRC_RE = re.compile(r'src="([^"]+)"')

broken = []
missing_assets = []
checked_targets = {}

for f in html_files:
    with open(f, encoding="utf-8") as fh:
        content = fh.read()
    rel = os.path.relpath(f, ROOT)

    for m in HREF_RE.finditer(content):
        href = m.group(1)
        if href.startswith(("http://", "https://", "mailto:", "tel:", "#")):
            continue
        if href not in checked_targets:
            checked_targets[href] = resolve(href)
        if not checked_targets[href]:
            broken.append((rel, href))

    for m in SRC_RE.finditer(content):
        src = m.group(1)
        if src.startswith(("http://", "https://", "data:")):
            continue
        fs_path = os.path.join(ROOT, src.lstrip("/"))
        if not os.path.isfile(fs_path):
            missing_assets.append((rel, src))

print(f"Unique internal href targets: {len(checked_targets)}")
print(f"Broken internal links: {len(broken)}")
for rel, href in broken:
    print(f"  BROKEN  {rel}  ->  {href}")

print(f"Missing local assets (src=): {len(missing_assets)}")
for rel, src in missing_assets:
    print(f"  MISSING {rel}  ->  {src}")

if broken or missing_assets:
    sys.exit(1)
print("OK — no broken internal links or missing local assets.")
