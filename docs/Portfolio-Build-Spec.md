# Portfolio — Build Spec

**Owner:** Yamin Haque · **Version:** 3.0 · **Date:** 2026-08-12
**Status:** Built. This documents what exists and why.

Operational instructions (running, editing, deploying) are in
[README.md](../README.md). This document is the reasoning behind the decisions —
read it when you're wondering *why* something works the way it does, or before
changing it.

---

## §0 — What this is

> A continuously evolving engineering profile that happens to include a CV.

Not a website containing a CV. Everything that will change over the next 5–10
years is content, not code.

| | |
|---|---|
| Site | Astro 7, static output |
| Admin | Sveltia CMS at `/admin`, commits Markdown to the repo |
| Storage | Git. No database. |
| Hosting | Cloudflare Pages (free) |
| Styling | Plain CSS with custom properties |
| Client JS | Theme toggle + project filter, inlined, a few hundred bytes |
| Dependencies | 2 (`astro`, `@astrojs/sitemap`) |

### Why this and not Laravel

The first two versions of this spec described a Laravel + Filament + MySQL CMS.
That would have worked and matched the PHP/MySQL on the CV, but it needs a paid
server, a database, an auth system to secure, and backups to maintain.

The static path delivers the same requirement — *edit content without touching
code* — with none of that. Sveltia CMS gives a real admin panel that writes to
the repo instead of a database. Git history is the backup. There is no login
system to get wrong because there is no server. Hosting is free.

**GitHub Pages was the question that prompted the change.** It can't run PHP or
MySQL, so a Laravel admin panel there is structurally impossible. A static site
runs there fine — though Cloudflare Pages is the better free host: no
public-repo requirement, free custom domains, faster builds.

### Audiences, in priority order

1. **Hiring managers** — 40–90 seconds, want to know what you build and to get
   the CV. They set the performance budget.
2. **Engineers reading a case study** — 5–15 minutes, want technical substance.
   They set the case-study structure.
3. **You** — want to add a project in under 10 minutes without opening an editor.
   You set the CMS config.

---

## §1 — Positioning

Primary identity: **embedded software, Linux, networking, low-level systems.**

The CNN thesis is a real research result with real numbers and it stays on the
site, but as a project — not the headline. The headline is Embedded C on ARM
carrier Ethernet switches, because that's where the three years of professional
depth are.

### The confidentiality constraint

Your strongest work — ERPS/G.8032, CFM/OAM, MSTP on BDCOM switches — was done for
an employer. Product internals, source, register maps and customer specifics are
not yours to publish.

Every project has an optional `confidentiality` field that renders as one italic
line. Professional case studies are written as:

> what I built · which standard it implements · how I debugged it · what improved

never as *here is the code*. That framing is both publishable and more impressive
than a code dump — it demonstrates judgement as well as skill.

The two seeded professional projects already follow this. Keep new ones the same.

---

## §2 — Content model

Four collections plus two settings files. Schemas live in
[`src/content.config.ts`](../src/content.config.ts) and are the contract between
the CMS and the site — if `public/admin/config.yml` and the schema disagree, the
build fails rather than publishing something broken. That's deliberate.

```
src/content/projects/*.md      case studies
src/content/posts/*.md         engineering notes
src/content/experience/*.md    roles
src/content/education/*.md     qualifications
src/data/site.json             profile, links, hero copy, section toggles
src/data/skills.json           skill groups
```

### Publishing gate

One rule, one code path, in [`src/lib/content.ts`](../src/lib/content.ts):

```ts
const isLive = (entry) =>
  entry.data.published && entry.data.publishedAt.getTime() <= Date.now();
```

A draft generates **no page at all** — not a hidden one, not one reachable by
guessing the URL. Same for a future `publishedAt`, which gives you scheduled
publishing for free. `npm run verify` asserts both on every build.

### Ordering

`featured` first, then `order` ascending, then newest. Two independent controls,
both editable in the CMS.

### Slugs

The filename is the URL. Renaming a file changes the URL and breaks any link you
already sent someone — including a CV PDF from three months ago. Don't rename
published files.

### Case studies are one Markdown field

No block editor, no section table. You write headings. The suggested outline,
which the seeded projects follow:

```
## Overview   ## Problem   ## Approach   ## Implementation
## Debugging  ## Results   ## Lessons learned
```

Different projects can deviate — a research project has *Dataset* and
*Methodology* instead of *Debugging*. That flexibility is exactly why this is
Markdown rather than fixed fields.

---

## §3 — Design

Blue-biased neutrals with a desaturated teal accent; monospace used structurally
for labels, metadata and eyebrows rather than only for code. The intent is
instrument panel, not brochure — appropriate to someone who works in a terminal
against packet captures.

Deliberate omissions, each of which is a credibility decision:

- **No skill percentage bars.** "C ████ 95%" is a number you assigned yourself.
  Skills are grouped lists, and the case studies are the evidence.
- **No typewriter effect, particles, or scroll-jacking.** Restraint reads senior.
- **No cover images on the blog index.** Text scans faster.
- **No self-hosted video.** Anything over 15 seconds goes to YouTube.

Light and dark are both first-class: tokens are defined on bare `:root`,
redefined under `prefers-color-scheme: dark`, and again under `[data-theme]` so
the toggle wins in both directions. The theme is applied by an inline script
before first paint, so dark-mode visitors never see a white flash.

---

## §4 — Performance

Budget: **LCP < 1.5s, JS under 30 KB, Lighthouse ≥ 95.**

Actual, measured on the build:

| | Result |
|---|---|
| Homepage HTML | 3.0 KB gzipped |
| Largest page (ERPS post) | 4.5 KB gzipped |
| CSS | 2.8 KB gzipped |
| JS bundles | 0 — both scripts inline, well under Astro's inlining threshold |

This is what static generation with no client framework buys you. It is the
default outcome here, not an optimisation project.

`npm run verify` fails the build if any page exceeds 25 KB gzipped, so this
doesn't quietly regress.

Rules that keep it there: system font stack (zero font bytes), images converted
to WebP with explicit dimensions before committing, no client framework, no
third-party scripts.

---

## §5 — Security

A static site has almost no attack surface — no server, no database, no session
handling, no upload endpoint. What remains:

| Concern | Handling |
|---|---|
| CMS access | GitHub PAT, scoped to this repo. Treat it like an SSH key. |
| Admin indexing | `noindex` meta tag, `Disallow: /admin` in robots.txt, excluded from sitemap — all three asserted by `npm run verify` |
| Contact spam | Honeypot field, plus whatever filtering Formspree applies |
| Dependency risk | 2 direct dependencies; Sveltia loads from CDN at `/admin` only, never on public pages |
| Secrets | None in the repo. Nothing to leak. |

The CMS token is the only credential in the system. If it leaks, revoke it on
GitHub — there's nothing else to rotate.

---

## §6 — SEO

The goal is narrow and worth stating: **own the search result for your own name.**
Not ranking for "embedded engineer" — ranking for *Yamin Haque*.

- Title format `{Page} — Yamin Haque`; homepage is
  *Yamin Haque — Embedded Software Engineer*, never "Portfolio".
- `Person` JSON-LD on the homepage with `sameAs` pointing at GitHub, LinkedIn,
  Codeforces and LeetCode. That array is what ties the site to your other
  profiles in Google's entity graph.
- `CreativeWork` / `SoftwareSourceCode` on projects, `BlogPosting` on notes.
- Canonical URLs, Open Graph and Twitter cards on every page.
- Sitemap generated at build, `/admin` filtered out.

Buy the domain. `yaminhaque.com` on your own domain beats
`portfolio-abc123.pages.dev` for this purpose, and it's a few dollars a year.

---

## §7 — What's built

```
[x] Astro project, Node 24 installed at ~/.local (no sudo needed)
[x] Content schemas for projects, posts, experience, education
[x] Publishing gate — drafts and future dates generate nothing
[x] CV content seeded: 4 projects, 1 role, 1 qualification, full skills, 1 post
[x] Design system, light/dark, responsive
[x] Pages: home, about, experience, projects index + detail, blog index +
    detail, contact, 404
[x] Sveltia CMS at /admin, matched field-for-field to the schemas
[x] SEO: JSON-LD, OG tags, canonicals, sitemap, robots
[x] npm run verify — 10 build checks
[x] Cloudflare Pages + GitHub Pages deploy paths
```

### Before it goes live

Five things, all in the README's checklist: set the repo in
`public/admin/config.yml`, the domain in `astro.config.mjs` and `robots.txt`,
your real GitHub and LinkedIn URLs in `site.json`, and optionally a Formspree
endpoint for the contact form.

### Add later, only if you miss it

Tag pages (`/tag/erps` listing projects and posts together) · RSS feed · site
search · image galleries · project metrics as stat tiles · analytics
(Cloudflare Web Analytics — one toggle, no code) · reading progress · related
posts.

Every one is additive. None needs a rewrite.

---

## §8 — The honest caveat

You now have a CMS *and* a git repo, which means two ways to edit the same
files. That's fine — they're the same files — but if a year from now you notice
you always edit in the terminal and never open `/admin`, delete
`public/admin/` and you've lost nothing. The site doesn't depend on it.

The reverse is also true: if you find yourself publishing from a phone while
travelling, the CMS is the reason that's possible, and it cost 2 files.
