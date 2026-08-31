#!/usr/bin/env python3
"""
gate_cycle.py — safe decrypt / re-encrypt cycle for the staticrypt-gated
BizColab pages (HQ, cohort member pages, recap pages, /concepts/* mockups).

Why this exists: hand-rolling the staticrypt template is easy to get wrong in a
way that produces a page which LOOKS fine but never unlocks. This script builds
the template from the live page itself and refuses to write output unless the
gate shell comes back byte-identical (modulo the encrypted blob) AND the
re-encrypted page round-trip-decrypts to the exact bytes you fed it.

Run it in the Composio sandbox (it needs `npx staticrypt` and network).
The Cowork container cannot push to the repo; the sandbox can.

USAGE
  # 1. recover the exact plaintext of a live gated page
  python3 tools/gate_cycle.py decrypt <gated.html> <plain.html> [--password PW]

  # 2. patch plain.html with a python script of `assert count==1` replacements
  #    (never rewrite the page, never re-transfer it through a model)

  # 3. re-gate it, verified
  python3 tools/gate_cycle.py encrypt <plain.html> <original-gated.html> <out.html> [--password PW]

Then: git fetch, confirm the remote file's md5 still matches what you started
from (other sessions edit this repo concurrently), commit, push, and verify by
curling the LIVE url from the sandbox and decrypting that.

NEVER cat/grep -o/sed a range of a gated file — the encrypted blob is ~70k of
hex on one line and will flood a model's context. Print booleans and md5s.
"""
import argparse, hashlib, json, os, re, shutil, subprocess, sys, tempfile

SALT = "927547544ff55e56970951a0e7855a92"   # shared across all bizcolab.com gates
DEFAULT_PW = "BizColab001"
ERR_MSG = "Bad password!"
REMEMBER_DAYS = "90"

BLOB = re.compile(r'"[0-9a-f]{200,}"')


def md5(p):
    return hashlib.md5(open(p, "rb").read()).hexdigest()


def shell(p):
    """The gate page with its encrypted payload replaced by a sentinel."""
    return BLOB.sub('"<BLOB>"', open(p, encoding="utf-8").read())


def run(cmd, cwd):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit("staticrypt failed:\n" + r.stdout[-2000:] + r.stderr[-2000:])


def workdir():
    d = tempfile.mkdtemp(prefix="gate_")
    with open(os.path.join(d, ".staticrypt.json"), "w") as f:
        json.dump({"salt": SALT}, f)
    return d


def decrypt(gated, out, pw):
    d = workdir()
    src = os.path.join(d, "g.html")
    shutil.copy(gated, src)
    run(["npx", "staticrypt", "g.html", "--decrypt", "-p", pw, "--short", "-d", "o"], d)
    shutil.copy(os.path.join(d, "o", "g.html"), out)
    print("decrypted ->", out, md5(out), os.path.getsize(out), "bytes")


def build_template(orig, dest):
    """Turn a live gated page back into a staticrypt template.

    Only the VALUES become placeholders. Replacing the whole
    `isRememberEnabled = true,` line emits a bare `true,` inside the const
    declaration list — a SyntaxError that silently breaks the gate.
    """
    s = open(orig, encoding="utf-8").read()
    subs = [
        ('const templateError = "%s",' % ERR_MSG,
         'const templateError = "/*[|template_error|]*/0",'),
        ("    isRememberEnabled = true,",
         "    isRememberEnabled = /*[|is_remember_enabled|]*/ 0,"),
    ]
    for a, b in subs:
        if s.count(a) != 1:
            sys.exit("template anchor not found exactly once: %r (%d)" % (a, s.count(a)))
        s = s.replace(a, b)
    m = re.search(r"    staticryptConfig = \{.*?\};", s, re.S)
    if not m:
        sys.exit("staticryptConfig block not found")
    s = s[:m.start()] + "    staticryptConfig = /*[|staticrypt_config|]*/ 0;" + s[m.end():]
    open(dest, "w", encoding="utf-8").write(s)


def encrypt(plain, orig, out, pw):
    d = workdir()
    shutil.copy(plain, os.path.join(d, "p.html"))
    build_template(orig, os.path.join(d, "tpl.html"))
    run(["npx", "staticrypt", "p.html", "-p", pw, "-t", "tpl.html",
         "--template-error", ERR_MSG, "--remember", REMEMBER_DAYS,
         "--short", "-d", "enc"], d)
    made = os.path.join(d, "enc", "p.html")

    if shell(made) != shell(orig):
        sys.exit("ABORT: gate shell drifted from the original page. "
                 "Diff the sentinel-replaced shells before pushing.")

    # round trip: the gate must give back exactly what we put in
    shutil.copy(made, os.path.join(d, "rt.html"))
    run(["npx", "staticrypt", "rt.html", "--decrypt", "-p", pw, "--short", "-d", "rt"], d)
    if md5(os.path.join(d, "rt", "rt.html")) != md5(plain):
        sys.exit("ABORT: round-trip decrypt did not reproduce the plaintext.")

    shutil.copy(made, out)
    print("shell identical to original : True")
    print("round-trip md5 matches plain: True", md5(plain))
    print("encrypted ->", out, os.path.getsize(out), "bytes")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("decrypt"); a.add_argument("gated"); a.add_argument("out")
    a.add_argument("--password", default=DEFAULT_PW)
    b = sub.add_parser("encrypt"); b.add_argument("plain"); b.add_argument("orig")
    b.add_argument("out"); b.add_argument("--password", default=DEFAULT_PW)
    n = ap.parse_args()
    if n.cmd == "decrypt":
        decrypt(n.gated, n.out, n.password)
    else:
        encrypt(n.plain, n.orig, n.out, n.password)
