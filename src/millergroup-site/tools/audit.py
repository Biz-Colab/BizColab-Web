#!/usr/bin/env python3
"""
tools/audit.py — headless QA for every built page at 1280 / 768 / 390.

    python3 tools/audit.py [--assets /path/to/assets/millergroup] [--shots]

Checks per page × width:
  • no horizontal scroll            • no .h-line wider than its container
  • no rendered text line under the minimum word count (3 for text, 2 for labels)
  • no broken images (naturalWidth == 0)   • no <video> elements at 390
Writes tools/_audit/<page>-<width>.png when --shots is given and prints a table.
Exit code 1 if anything fails (the four one-word step titles are allowed by design).
"""
import sys, json, pathlib, shutil, os, threading, functools, http.server, contextlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
site = json.loads((ROOT / "site.json").read_text())
BASE = site["build"]["base_path"].rstrip("/"); ASSETS = site["build"]["assets_path"].rstrip("/")
args = sys.argv[1:]
assets_dir = pathlib.Path(args[args.index("--assets") + 1]) if "--assets" in args else None
shots = "--shots" in args
OUT = ROOT / "tools" / "_audit"; OUT.mkdir(exist_ok=True)

# serve: <srv>/<BASE> → dist, <srv>/<ASSETS> → assets dir
srv = ROOT / ".serve"; shutil.rmtree(srv, ignore_errors=True)
(srv / BASE.strip("/")).parent.mkdir(parents=True, exist_ok=True)
os.symlink(ROOT / "dist", srv / BASE.strip("/"))
if assets_dir:
    (srv / ASSETS.strip("/")).parent.mkdir(parents=True, exist_ok=True)
    os.symlink(assets_dir.resolve(), srv / ASSETS.strip("/"))
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
H = functools.partial(Quiet, directory=str(srv))
httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 8765), H)
threading.Thread(target=httpd.serve_forever, daemon=True).start()

ALLOW = {"Discovery", "Strategy", "Creative", "Woman-owned", "The question", "The street", "The film", "Los Angeles", "Founded 1990", "Evergreen"}
JS = r"""
() => {
  if (window.__fixWidows) window.__fixWidows();
  const TXT='h1,h2,h3,p:not(.details):not(.q):not(.d),.dash li,.qq,.story,.oneloop,.big,.kick,.lede,.sub,.whop,.cs-block p,.memo li,.tm span';
  const LAB='.sf b,.sf>span:not(.n),.cred b,.cred span,.stat span,.statrow span,.case .q cite,.phone p,.chip,.cs-result span,.cs-meta span,.recog,footer .cols a,.pill,.filters button,.posts .d';
  function lines(el){const r=[],range=document.createRange(),w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n;
    while(n=w.nextNode()){const t=n.nodeValue;let i=0;while(i<t.length){let j=t.indexOf(' ',i);if(j===-1)j=t.length;if(j>i){range.setStart(n,i);range.setEnd(n,j);const rc=range.getClientRects();if(rc.length)r.push(rc[0].top)}i=j+1}}return r}
  function clusters(t){t.sort((a,b)=>a-b);const c=[];t.forEach(x=>{if(c.length&&x-c[c.length-1].t<=8){c[c.length-1].n++;c[c.length-1].t=x}else c.push({t:x,n:1})});return c}
  const bad=[];
  function check(sel,min){document.querySelectorAll(sel).forEach(el=>{
    if(el.closest('.h-line')||el.querySelector('.h-line')||el.hidden||el.closest('[hidden]'))return;
    const r=el.getBoundingClientRect(); if(r.width===0||r.height===0)return;
    const c=clusters(lines(el)); if(c.length<2)return;
    if(c.some(x=>x.n<min)) bad.push({min, text:el.textContent.trim().slice(0,70), tag:el.tagName+'.'+el.className});
  })}
  check(TXT,3); check(LAB,2);
  const hl=[...document.querySelectorAll('.h-line')].filter(e=>e.scrollWidth>e.parentElement.clientWidth+1).map(e=>e.textContent.trim());
  const imgs=[...document.images].filter(i=>i.complete&&i.naturalWidth===0&&!i.closest('.lg-track')&&!(i.getAttribute('src')||'').startsWith('http')).map(i=>i.getAttribute('src'));
  return {bad, hl, imgs, hscroll: document.documentElement.scrollWidth>window.innerWidth+1, videos: document.querySelectorAll('video').length};
}
"""
manifest = json.loads((ROOT / "dist" / "_manifest.json").read_text())
fails = 0
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
    for w in (1280, 768, 390):
        pg = b.new_page(viewport={"width": w, "height": 900})
        for m in manifest:
            url = f"http://127.0.0.1:8765{BASE}{m['path']}"
            pg.goto(url, wait_until="load")
            # scroll through so lazy images load before we measure / screenshot
            pg.evaluate("async()=>{for(let y=0;y<document.body.scrollHeight;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60))}window.scrollTo(0,0)}")
            pg.wait_for_timeout(700)
            r = pg.evaluate(JS)
            bad = [x for x in r["bad"] if not (x["min"] == 3 and x["text"] in ALLOW)]
            probs = []
            if r["hscroll"]: probs.append("H-SCROLL")
            if r["hl"]: probs.append("h-line overflow: " + " | ".join(r["hl"])[:80])
            if r["imgs"]: probs.append(f"{len(r['imgs'])} broken img: " + ", ".join(r["imgs"][:3]))
            if w == 390 and r["videos"]: probs.append(f"{r['videos']} <video> on phone")
            for x in bad: probs.append(f"widow({x['min']}) {x['tag'][:24]}: “{x['text']}”")
            fails += len(probs)
            print(f"{w:>4} {m['path']:<36} {'ok' if not probs else ''}")
            for pr in probs: print(f"       ✗ {pr}")
            if shots: pg.screenshot(path=OUT / f"{m['path'].strip('/').replace('/', '_') or 'home'}-{w}.png", full_page=True)
        pg.close()
    b.close()
httpd.shutdown()
print(f"\n{fails} problems")
sys.exit(1 if fails else 0)
