# The Miller Group — site source

Data-driven static site. **Words live in `content/`, design lives in `assets/site.css`, one command builds everything.**

```
site.json              global: nav, footer, contact, stats, logos, CTA band, tracking (GTM id), build paths
content/home.json      one file per page — "template" picks the layout, everything else is copy
content/work.json      case order + featured four + industry filters
content/cases/*.json   one file per case study (14). Add a file → it appears on /work/ and gets its own page
content/why.json       concept-only positioning memo (dropped from the build when concept_mode = false)
templates/             Jinja2. base.html = <head>/nav/footer; partials/ = reusable blocks (case card, CTA band, stats…)
assets/site.css        the ONLY stylesheet, inlined into every page. Tokens at the top — change a color once
assets/site.js         nav toggle, phone-safe video, work filters, contact form, widow fixer
build.py               python3 build.py  → dist/  (21 pages, ~40 KB each, self-contained)
tools/audit.py         headless QA at 1280/768/390: widows, overflow, broken images, video on phones
tools/deploy.py        gate every page with staticrypt + push to BizColab-Web (see below)
```

## Everyday edits

| Want to… | Edit | Then |
|---|---|---|
| Change a headline, paragraph, CTA label | the page's `content/*.json` | `python3 build.py` |
| Add / reorder / feature a case study | `content/cases/<slug>.json` + `content/work.json` → `order`, `featured` | build |
| Change a color, font size, radius, spacing | `:root` tokens in `assets/site.css` | build |
| Change nav, footer, phone, email, Calendly, stats | `site.json` | build |
| Turn on Google Tag Manager | `site.json` → `tracking.gtm_id` | build |
| Wire the contact form to a real endpoint | `site.json` → `contact.form_endpoint` (POST JSON) — empty = mailto fallback | build |
| Go live (no gate, no “why” memo, no concept chip) | `site.json` → `build.concept_mode: false`, `base_path: ""`, `noindex: false` | build → copy `dist/` to the web root |

Rules the build enforces: sentence-per-line display type via `.h-line`; no rendered line under 3 words (2 for labels) — the fixer in `site.js` binds trailing words and `tools/audit.py` verifies; phones never download video; every image `loading="lazy"`; every number on the site is published on millergroup.com or marked `*` unverified.

## Deploy (concept, gated, on bizcolab.com)

Runs in the Composio sandbox (the only place with push rights):

```bash
cd /home/user && rm -rf bcw && git clone --depth 1 -q "https://x-access-token:$T@github.com/Biz-Colab/BizColab-Web.git" bcw
cd bcw/src/millergroup-site && python3 tools/deploy.py --repo /home/user/bcw --push -m "millergroup-site: <what changed>"
# deploy.py is resumable: it gates ~6 pages per 45 s; re-run until it says "all 21 pages gated", then pass --push
```

Live: `https://bizcolab.com/cohort-losangeles-001/concepts/millergroup-site/` · password `BizColab001` (same remember-me as the other cohort pages).

## WordPress later

Each `content/*.json` maps 1:1 to ACF field groups; each template maps to a PHP template part. Nothing is written twice.
