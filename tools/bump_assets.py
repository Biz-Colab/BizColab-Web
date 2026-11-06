#!/usr/bin/env python3
"""Bump the cache-busting version on the shared nav/footer asset links.

    python3 tools/bump_assets.py            # stamps today's date, e.g. ?v=20261106
    python3 tools/bump_assets.py 20261106b  # explicit version

Cloudflare caches /assets/*.js and *.css for hours, so after editing
site-nav.js/.css or site-footer.js/.css, run this and commit the result
alongside, or visitors keep the old copy until the cache expires."""
import datetime, pathlib, re, subprocess, sys

ASSETS = ("site-nav.css", "site-nav.js", "site-footer.css", "site-footer.js")
ver = sys.argv[1] if len(sys.argv) > 1 else datetime.date.today().strftime("%Y%m%d")
files = subprocess.run(["git", "ls-files", "*.html"], capture_output=True, text=True).stdout.split()
pat = re.compile(r'(/assets/(?:%s))(?:\?v=[A-Za-z0-9_.-]+)?(?=["\'])' % "|".join(re.escape(a) for a in ASSETS))
touched = 0
for f in files:
    p = pathlib.Path(f); s = p.read_text()
    n = pat.sub(lambda m: f"{m.group(1)}?v={ver}", s)
    if n != s:
        p.write_text(n); touched += 1
print(f"v={ver}: {touched} files updated")
