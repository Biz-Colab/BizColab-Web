#!/usr/bin/env python3
"""
One-command publish for bizcolab.com gated pages.

  # patch an existing gated page
  python3 tools/publish.py patch <page.html> <patch.py> -m "message"
  # publish a NEW gated page from plaintext, using an existing gated page as the gate donor
  python3 tools/publish.py new <plain.html> <donor-gated.html> <out-page.html> -m "message"
  # patch an UNGATED page (facilitator, decks)
  python3 tools/publish.py plain <page.html> <patch.py> -m "message"

<patch.py> must define  def patch(s: str) -> str  and should assert s.count(old)==1 before every replace.
Password is picked from the path: dashboard/*  -> BizColab##11, everything else -> BizColab001 (override with --password).
Flow: git fetch + abort if the target moved since clone -> decrypt -> patch -> encrypt via gate_cycle (byte-identical
shell + round-trip check) -> commit -> push -> print SHA. Nothing is printed from the encrypted payload.
"""
import argparse, hashlib, importlib.util, os, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GC = os.path.join(ROOT, "tools", "gate_cycle.py")

def sh(cmd, check=True):
    r = subprocess.run(cmd, shell=True, cwd=ROOT, capture_output=True, text=True)
    if check and r.returncode:
        sys.exit(f"FAIL: {cmd}\n{r.stderr[-800:]}")
    return r.stdout.strip()

def md5(p):
    return hashlib.md5(open(p, "rb").read()).hexdigest()

def pw_for(path, override):
    if override: return override
    return "BizColab##11" if path.replace("\\", "/").startswith("dashboard/") else "BizColab001"

def load_patch(pyfile):
    spec = importlib.util.spec_from_file_location("p", pyfile); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    if not hasattr(m, "patch"): sys.exit("patch.py must define patch(s) -> s")
    return m.patch

def guard_unmoved(path):
    sh("git fetch -q origin main")
    local = sh(f"git rev-parse HEAD:{path}", check=False)
    remote = sh(f"git rev-parse origin/main:{path}", check=False)
    if local and remote and local != remote:
        sys.exit(f"ABORT: {path} changed on origin since clone (another session). Re-clone and re-apply.")

def commit_push(paths, msg):
    sh("git add " + " ".join(paths))
    sh(f'git -c user.name=Claude -c user.email=noreply@anthropic.com commit -qm "{msg}"')
    sh("git push -q origin main")
    return sh("git rev-parse --short HEAD")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["patch", "new", "plain"])
    ap.add_argument("args", nargs="+")
    ap.add_argument("-m", "--message", required=True)
    ap.add_argument("--password")
    ap.add_argument("--no-push", action="store_true")
    a = ap.parse_args()
    tmp = tempfile.mkdtemp()

    if a.mode == "patch":
        page, patchpy = a.args[:2]
        pw = pw_for(page, a.password)
        guard_unmoved(page)
        plain = os.path.join(tmp, "plain.html")
        sh(f"python3 {GC} decrypt {page} {plain} --password '{pw}'")
        s = open(plain, encoding="utf-8").read()
        s2 = load_patch(patchpy)(s)
        if s2 == s: sys.exit("ABORT: patch produced no change")
        p2 = os.path.join(tmp, "plain2.html"); open(p2, "w", encoding="utf-8").write(s2)
        out = os.path.join(tmp, "gated.html")
        print(sh(f"python3 {GC} encrypt {p2} {page} {out} --password '{pw}'").splitlines()[-2:])
        os.replace(out, os.path.join(ROOT, page))
        print("plain md5", md5(p2), "bytes", len(s2.encode()))
        paths = [page]

    elif a.mode == "new":
        plain, donor, page = a.args[:3]
        pw = pw_for(page, a.password)
        os.makedirs(os.path.dirname(os.path.join(ROOT, page)), exist_ok=True)
        out = os.path.join(tmp, "gated.html")
        print(sh(f"python3 {GC} encrypt {plain} {donor} {out} --password '{pw}'").splitlines()[-2:])
        os.replace(out, os.path.join(ROOT, page))
        print("plain md5", md5(plain))
        paths = [page]

    else:  # plain (ungated)
        page, patchpy = a.args[:2]
        guard_unmoved(page)
        full = os.path.join(ROOT, page)
        s = open(full, encoding="utf-8").read(); s2 = load_patch(patchpy)(s)
        if s2 == s: sys.exit("ABORT: patch produced no change")
        open(full, "w", encoding="utf-8").write(s2)
        paths = [page]

    if a.no_push:
        print("staged, not pushed:", paths); return
    print("pushed", commit_push(paths, a.message), paths)

if __name__ == "__main__":
    main()
