# BizColab website — bizcolab.com

Static site on GitHub Pages (repo Biz-Colab/BizColab-Web, branch `main`), behind Cloudflare. Pushing to `main` goes live in about 2–3 minutes.

## How to work
- Patch existing pages. Never rebuild a page from scratch unless Michael asks.
- Preview locally first (`python3 -m http.server 8000`), then commit and push only after Michael approves.
- Always `git pull` before editing — other sessions edit this repo too.
- Keep short, plain answers. Show Michael the result, not the process.

## BizColab rules
- BizColab is separate from AMRE, Haps Club and Compass. No real estate, referral asks, addresses, license numbers or Compass email anywhere.
- Say "business advisor", never "coach".
- First names only for members on dashboards and cohort pages. Reviewers = first name + last initial.
- Never invent testimonials or quotes.
- Write "Los Angeles", never "LA".
- Messaging: "empowering entrepreneurs through collaboration", "community". Cohorts: 6 participants + 1 facilitator.

## Design rules
- No black or dark section backgrounds — white or light gray.
- Card grids of three = one row of three columns.
- Titles, subtitles and paragraph text each on their own line; never a bold title running inline into text.
- Never leave a single word alone on a line (keep the no-widows CSS+JS pass on every page).
- No visible version labels on live pages. Top-left logo always links to the homepage.
- Palette: blue + saturated orange/yellow accent (not coral).
- Every new page gets the shared sticky `.topbar` (50px); private pages get `robots noindex`.
- Copy: straightforward, tactical, relatable, fun, professional. No clever or abstract phrasing.

## Password-gated pages (staticrypt)
- Use `tools/gate_cycle.py` — never hand-roll staticrypt:
  - `python3 tools/gate_cycle.py decrypt <gated.html> plain.html`
  - patch plain.html with exact replacements (`assert text.count(old) == 1`)
  - `python3 tools/gate_cycle.py encrypt plain.html <gated.html> new-gated.html`
- The staticrypt salt must never change. Each gate keeps its own remember-key suffix (`_hq`, `_member`, `_facilitator`, `_recap`, `_cohort01`…); new gated pages get a new suffix.
- Never print gated files (huge hex blob). Print counts, md5s or small slices only.
- Grepping an encrypted page for text always returns 0 — decrypt first.
- Verify: gate shell byte-identical apart from the blob, round-trip decrypt matches, then check the live page after deploy.
- HQ and facilitator pages now live in the private repo Biz-Colab/BizColab-Dash (~/Documents/Sites/BizColab-Dash), served at dashboard.bizcolab.com behind Cloudflare Access: /ops/, /growth/, /facilitator/. Old URLs here are redirect stubs. Never link them from a member-facing page; no staticrypt for HQ.
- Passwords live in CLAUDE.local.md (not committed). Never commit passwords — this repo is public.

## Concept pages
- `/concepts/*` pages have "Why this page?" rationale blocks and a footer version chip. Any content change updates the rationale and bumps the chip.
