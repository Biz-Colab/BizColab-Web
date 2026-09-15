#!/usr/bin/env python3
"""
tools/deploy.py — publish the built site into the BizColab-Web repo, password-gated.

    python3 tools/deploy.py --repo /home/user/bcw [--budget 45] [--push -m "message"]

What it does
  1. python3 build.py                              (fresh dist/)
  2. for every page in dist/_manifest.json:
       skip if the repo already holds a gated copy whose decrypted md5 == this build   (resumable)
       else  tools/gate_cycle.py encrypt <plain> <donor> <repo>/<base_path>/<page>/index.html
     stops after --budget seconds and prints "N pages remaining" — just run it again.
  3. with --push: git add + commit + push.

Donor = the existing gated v2.8 concept page, so every page inherits the same password
(BizColab001) and the shared _cohort01 "remember me" keys → one login unlocks the whole site.
Un-gating for a public launch = copy dist/ to the web root; no gate step at all.
"""
import sys, json, pathlib, subprocess, hashlib, time, argparse, shutil

ROOT = pathlib.Path(__file__).resolve().parents[1]
ap = argparse.ArgumentParser()
ap.add_argument("--repo", required=True)
ap.add_argument("--budget", type=float, default=45)
ap.add_argument("--push", action="store_true")
ap.add_argument("-m", default="millergroup-site: rebuild")
ap.add_argument("--donor", default="cohort-losangeles-001/concepts/millergroup/index.html")
a = ap.parse_args()

repo = pathlib.Path(a.repo).resolve()
site = json.loads((ROOT / "site.json").read_text())
base = site["build"]["base_path"].strip("/")
gate = repo / "tools" / "gate_cycle.py"
donor = repo / a.donor
assert gate.exists() and donor.exists(), "repo must contain tools/gate_cycle.py and the donor page"

t0 = time.time()
subprocess.run([sys.executable, str(ROOT / "build.py")], check=True, stdout=subprocess.DEVNULL)
manifest = json.loads((ROOT / "dist" / "_manifest.json").read_text())
stamp = repo / base / ".build-md5.json"
done = json.loads(stamp.read_text()) if stamp.exists() else {}

md5 = lambda p: hashlib.md5(pathlib.Path(p).read_bytes()).hexdigest()
remaining = 0
for m in manifest:
    plain = ROOT / "dist" / m["file"]
    out = repo / base / m["file"]
    h = md5(plain)
    if out.exists() and done.get(m["path"]) == h:
        continue
    if time.time() - t0 > a.budget:
        remaining += 1; continue
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([sys.executable, str(gate), "encrypt", str(plain), str(donor), str(out)],
                   check=True, stdout=subprocess.DEVNULL)
    done[m["path"]] = h
    stamp.write_text(json.dumps(done, indent=1, sort_keys=True))
    print(f"  gated {m['path']}  ({out.stat().st_size} B)")

# drop gated pages that no longer exist in the build
for p in list(done):
    if p not in {m["path"] for m in manifest}:
        f = repo / base / p.strip("/") / "index.html"
        if f.exists(): f.unlink()
        done.pop(p)
stamp.write_text(json.dumps(done, indent=1, sort_keys=True))

if remaining:
    print(f"{remaining} pages remaining — run again"); sys.exit(2)
print(f"all {len(manifest)} pages gated in {repo / base}")
if a.push:
    subprocess.run(["git", "-C", str(repo), "add", "-A", base, "src/millergroup-site"], check=True)
    r = subprocess.run(["git", "-C", str(repo), "commit", "-q", "-m", a.m], capture_output=True, text=True)
    if r.returncode and "nothing to commit" in r.stdout + r.stderr:
        print("nothing to commit"); sys.exit(0)
    subprocess.run(["git", "-C", str(repo), "push", "-q"], check=True)
    print("pushed", subprocess.run(["git", "-C", str(repo), "rev-parse", "--short", "HEAD"], capture_output=True, text=True).stdout.strip())
