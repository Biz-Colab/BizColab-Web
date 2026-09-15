#!/usr/bin/env python3
"""
build.py — builds the whole Miller Group site into dist/ in one command.

    python3 build.py              # build everything
    python3 build.py --serve      # build, then serve dist/ at http://localhost:8000<base_path>/

How it fits together
  site.json            global settings: nav, footer, contact, stats, logos, CTA, tracking
  content/*.json       one file per page  → "template" says which template renders it
  content/cases/*.json one file per case study → all rendered with templates/case.html
  templates/           Jinja2 HTML. base.html holds <head>, nav, footer. partials/ = reusable blocks
  assets/site.css      the only stylesheet (inlined into every page at build time)
  assets/site.js       the only script     (inlined into every page at build time)
  dist/                output. Never edit by hand — it is overwritten on every build.

To add a page: copy a content/*.json, set "path" and "template", rebuild.
To add a case: copy a content/cases/*.json, rebuild. It appears on /work/ automatically.
"""
import json, sys, shutil, pathlib, http.server, functools, os
from jinja2 import Environment, FileSystemLoader, ChainableUndefined

ROOT = pathlib.Path(__file__).parent
DIST = ROOT / "dist"

def load(p): return json.loads(pathlib.Path(p).read_text(encoding="utf-8"))

def main():
    site = load(ROOT / "site.json")
    B = site["build"]
    base, assets = B["base_path"].rstrip("/"), B["assets_path"].rstrip("/")

    # ── content ────────────────────────────────────────────────────────────────────
    pages = [load(p) for p in sorted((ROOT / "content").glob("*.json"))]
    cases = [load(p) for p in sorted((ROOT / "content" / "cases").glob("*.json"))]
    work = next(p for p in pages if p["path"] == "/work/")
    order = work["order"]                                  # slugs, in display order
    by_slug = {c["slug"]: c for c in cases}
    missing = [s for s in order if s not in by_slug]
    if missing: sys.exit(f"work.json order names cases that do not exist: {missing}")
    cases = [by_slug[s] for s in order] + [c for c in cases if c["slug"] not in order]
    for i, c in enumerate(cases):
        c["path"] = f"/work/{c['slug']}/"
        c["template"] = "case.html"
        c["next"] = cases[(i + 1) % len(cases)]
    featured = [by_slug[s] for s in work.get("featured", order[:4])]

    # ── jinja ──────────────────────────────────────────────────────────────────────
    env = Environment(loader=FileSystemLoader(ROOT / "templates"), autoescape=False,
                      undefined=ChainableUndefined, trim_blocks=True, lstrip_blocks=True)
    env.filters["url"] = lambda p: p if p.startswith(("http", "tel:", "mailto:", "#")) else base + p
    env.filters["asset"] = lambda n: n if n.startswith("http") else f"{assets}/{n}"
    env.globals.update(site=site, cases=cases, featured=featured,
                       css=(ROOT / "assets" / "site.css").read_text(encoding="utf-8"),
                       js=(ROOT / "assets" / "site.js").read_text(encoding="utf-8"))

    # ── render ─────────────────────────────────────────────────────────────────────
    if DIST.exists(): shutil.rmtree(DIST)
    manifest = []
    for page in pages + cases:
        if page.get("concept_only") and not B["concept_mode"]: continue
        out = DIST / page["path"].strip("/") / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        html = env.get_template(page["template"]).render(page=page)
        out.write_text(html, encoding="utf-8")
        manifest.append({"path": page["path"], "file": str(out.relative_to(DIST)), "bytes": len(html.encode())})
        print(f"  {page['path']:<32} {len(html.encode()):>7} B")
    (DIST / "_manifest.json").write_text(json.dumps(manifest, indent=1))
    print(f"built {len(manifest)} pages → {DIST}")

    if "--serve" in sys.argv:
        # serve dist/ so that base_path resolves: symlink dist at <tmp>/<base_path>
        srv = ROOT / ".serve"; shutil.rmtree(srv, ignore_errors=True)
        (srv / base.strip("/")).parent.mkdir(parents=True, exist_ok=True)
        os.symlink(DIST, srv / base.strip("/"))
        os.symlink(pathlib.Path(assets).resolve() if pathlib.Path(assets).exists() else ROOT / "assets-local", srv / assets.strip("/"))
        H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(srv))
        print(f"serving http://localhost:8000{base}/  (Ctrl-C to stop)")
        http.server.ThreadingHTTPServer(("", 8000), H).serve_forever()

if __name__ == "__main__":
    main()
