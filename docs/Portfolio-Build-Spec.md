# Portfolio & CMS — Build Spec

**Owner:** Yamin Haque · **Version:** 2.0 (simplified) · **Date:** 2026-08-12

A portfolio site plus an admin panel, so you can add projects, posts and CV updates without touching code.

**8 tables. 2 packages. One phase.** Everything cut from v1 is listed in §12 — add it later only if you actually miss it.

---

## §1 — Stack

```
PHP 8.4  +  Laravel 13        framework
Filament v5                   admin panel — generated, not hand-built
Blade + Tailwind              public site
MySQL 8                       database
league/commonmark             Markdown → HTML
```

That's the whole dependency list: **Filament and CommonMark.** Everything else is Laravel or the OS.

**Why:** PHP, Composer and MySQL are already on your machine, and PHP/MySQL are on your CV — you're productive in week one. Filament generates the entire admin panel from config classes, which is the difference between three weeks and three months. Blade renders plain HTML, so a fast site is the default rather than a project.

**The one call worth understanding:** hand-write the public site, generate the admin. Visitors judge the public pages, so those get your attention. Nobody but you sees `/admin`, so it should cost as little time as possible.

---

## §2 — Setup

Three gaps on your machine (verified 2026-08-12): PHP is 8.3.6, `pdo_mysql` and `intl` are missing, and there's no Node.

Target **PHP 8.4** — Laravel 13 runs on 8.3, but several packages are already 8.4-only, so you'd be pinning to old majors on day one.

```bash
# 1. PHP 8.4 + missing extensions (Ubuntu 24.04)
sudo add-apt-repository ppa:ondrej/php && sudo apt update
sudo apt install php8.4-cli php8.4-fpm php8.4-mysql php8.4-mbstring \
  php8.4-xml php8.4-curl php8.4-gd php8.4-zip php8.4-intl

# 2. Node 20 (for Tailwind's build step)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install nodejs

# 3. Project
composer create-project laravel/laravel portfolio
cd portfolio
composer require filament/filament league/commonmark
php artisan filament:install --panels
git init && git add -A && git commit -m "Initial"
```

`php8.4-mysql` supplies the missing `pdo_mysql`; without it Laravel can't reach your MySQL 8.0.46.

**Don't want npm?** Use the Tailwind standalone binary — one executable, no JS toolchain. Docker 29.6.2 is also already installed if you'd rather run everything in containers (`php artisan sail:install`).

---

## §3 — Database

Eight tables, plus Laravel's own (`sessions`, `cache`, `jobs`). All have `id` and timestamps.

### `site_settings` — one row, edited in admin

```
name, title, tagline, bio (markdown), location, email, photo_path
github_url, linkedin_url, codeforces_url, leetcode_url
codeforces_note, leetcode_note        -- "Solved 100+ problems"
hero_title, hero_subtitle, current_focus
resume_path, resume_label, resume_downloads (int)
seo_title, seo_description, og_image_path
show_blog, show_experience, show_education (bool)   -- toggles nav + route
```

A single row with real columns beats a key/value table — no casting, no helper, and Filament edits it with an ordinary form.

### `projects`

```
slug (unique), title, summary (varchar 320)
body_md (longtext), body_html (longtext)      -- render cache
category (varchar)          -- Embedded Systems | Networking | Systems | ML | Web
context (enum)              -- professional | academic | personal | oss
organization, role
started_on, ended_on (date, nullable), is_ongoing
tech (json)                 -- ["C", "Embedded Linux", "ERPS", "G.8032"]
cover_path, gallery (json)  -- array of image paths
repo_url, demo_url, docs_url, video_url
confidentiality_note        -- see §5
is_published, is_featured, sort_order
published_at
```

### `posts`

```
slug (unique), title, excerpt, body_md, body_html
category, tech (json), cover_path
reading_minutes, is_published, is_featured, published_at
```

### `experiences`

```
company, company_url, position, employment_type, location
started_on, ended_on (nullable), is_current
summary (text), responsibilities (json)   -- array of bullet strings
tech (json), sort_order
```

### `education`

```
institution, degree, field, location
started_on, ended_on, grade, grade_scale
description (text), sort_order
```

### `skills`

```
category (varchar), name, is_featured, sort_order
```

No proficiency level, no years. See §6.4 for why.

### `messages`

```
name, email, subject, body (text)
is_read, is_archived, created_at
```

### `users`

Laravel's default. One row — you.

**What's deliberately not here:** no media table, no tag tables, no category tables, no analytics tables, no polymorphic pivots. Images are path strings written by Filament's file upload. Tech tags are a JSON array, filterable with `whereJsonContains('tech', 'ERPS')`. Categories are plain strings.

---

## §4 — Routes

### Public

| Path | Page |
|---|---|
| `/` | Home |
| `/about` | About + skills + education |
| `/experience` | Timeline |
| `/projects` | Index, filter via `?category=` / `?tech=` |
| `/projects/{slug}` | Case study |
| `/blog`, `/blog/{slug}` | Posts (hidden when `show_blog` is off) |
| `/contact` (GET, POST) | Form |
| `/resume` | Redirects to the PDF, increments `resume_downloads` |
| `/sitemap.xml`, `/robots.txt` | ~20 lines each, no package needed |

Sections toggled off in settings return **404**, not just a hidden menu link.

### Admin — `/admin/*`, all behind `auth`

Filament generates these from resource classes: dashboard, projects, posts, experiences, education, skills, messages, settings.

---

## §5 — Content rules

**Publishing:** one `is_published` boolean plus `published_at`. Drafts are invisible to guests and have no URL. Every public query goes through one scope:

```php
public function scopePublished(Builder $q): Builder
{
    return $q->where('is_published', true)
             ->whereNotNull('published_at')
             ->where('published_at', '<=', now());
}
```

**Slugs** are generated from the title on first save, then frozen — editing a title never breaks a URL you already sent someone.

**Ordering:** `is_featured DESC, sort_order ASC, published_at DESC`.

**Case studies are one Markdown field.** No block editor, no section table — you write headings. Use this outline for technical projects:

```markdown
## Overview
## Problem
## Approach
## Implementation
## Debugging
## Results
## Lessons learned
```

Markdown is rendered to `body_html` on save, never per request. CommonMark with GFM tables, **raw HTML disabled**. Code blocks are highlighted server-side — never ship a client-side highlighter to render a C snippet.

**Confidentiality.** Your best work — ERPS/G.8032, CFM/OAM, MSTP — belongs to BDCOM. Product internals, source and customer specifics aren't yours to publish. Write those case studies as *what I built, which standard it implements, how I debugged it, what improved* — never as code. That framing is also simply more impressive than a code dump. The `confidentiality_note` field renders as one italic line when set.

---

## §6 — Public pages

### 6.1 Shell

Header: name left, nav right, theme toggle. Footer: social links, copyright. Light/dark via `prefers-color-scheme` with a toggle in `localStorage` — set the theme class in an inline `<head>` script so dark-mode users don't get a white flash.

### 6.2 Home

Hero (name, title, tagline, 2–3 sentence intro, photo) → CTAs (View projects · Download CV · GitHub · LinkedIn) → 3 featured projects → current focus → skills digest → latest posts (if blog is on) → contact line.

Draft hero copy:

> **Yamin Haque** — Embedded Software Engineer
> I build and debug C for ARM-based carrier Ethernet switches running embedded Linux and VxWorks — Layer 2 protocols, standards-compliant implementations, and the kernel tracing it takes to make them converge reliably.

No typewriter effect, no particles, no scroll-jacking. Server-rendered HTML.

### 6.3 Projects

**Index:** filter bar (category, tech) + card grid — 3 columns ≥1024px, 2 ≥640px, 1 below. Card = cover, title, category, summary, up to 4 tech chips, dates.

**Detail:** title and dates → "at a glance" list (role · duration · stack · standards) → resource buttons, rendered only where a URL exists → confidentiality note → rendered Markdown → related projects → prev/next.

### 6.4 Skills

Grouped lists, **never percentage bars**:

```
PROGRAMMING     C · Embedded C · C++ · PHP
SYSTEMS         Embedded Linux · Linux · VxWorks · FreeRTOS
MICROCONTROLLERS  STM32 · ARM · low-power modes
PERIPHERALS     GPIO · SPI · I2C · UART · Ethernet
NETWORKING      TCP · UDP · TFTP · VLAN · STP/RSTP/MSTP · LLDP
                ERPS (G.8032) · EAPS · SNMP · CFM/OAM
MESSAGING       MQTT · HTTP/HTTPS
DEBUGGING       GDB · Wireshark · trace-cmd · KernelShark · ftrace · Scapy
WEB             HTML · CSS · Bootstrap · jQuery · JavaScript
DATA            MySQL · Git · SVN
```

Self-rated bars ("C ████ 95%") are the most common credibility leak on engineer portfolios. A list that a reader can connect to a case study proves more than a number you assigned yourself.

### 6.5 Other pages

**About:** summary, education, location, interests. **Experience:** timeline, newest first, with responsibility bullets and tech chips. **Blog:** title, date, reading time, excerpt — no cover images in the list, text scans faster. Post body at `max-width: 68ch`. **Contact:** name, email, subject, message, plus a honeypot; show your email in plain text too, since many recruiters just use their own mail client.

**Accessibility:** contrast ≥4.5:1 in both themes, keyboard reachable, `alt` on images, real heading order.

---

## §7 — Admin

Filament gives you the dashboard, tables, forms, uploads, drag-ordering, search and validation. You write one resource class per model — roughly 60 lines each.

**Project form:** title, auto-slug, summary, category, context, organization, role, dates, tech (TagsInput → JSON), cover upload, gallery upload, the four link fields, confidentiality note, Markdown body, and a sidebar with published / featured / sort order / published-at.

**Everything else** is a plain table + form: posts, experiences, education, skills, messages (with unread filter and a badge count), settings (single-record form).

**Uploads:** `FileUpload::make('cover_path')->image()->maxSize(4096)->disk('public')->directory('projects')`. Filament handles storage, validation and preview.

**On mobile,** three flows matter — read a message, toggle a project's featured/published state, upload an image. Full case-study writing on a phone isn't a goal.

---

## §8 — Security

Short list, all of it cheap, none of it optional.

| Control | How |
|---|---|
| Admin auth | Whole `/admin` group inside `middleware('auth')` |
| No public registration | Delete the register routes; create your account with `php artisan make:filament-user` |
| Password hashing | Laravel default (bcrypt), 12+ character password |
| CSRF | Laravel default, no route exclusions |
| Validation | Form Requests / Filament rules — never read raw input |
| Upload validation | Extension allow-list, real MIME check, 4 MB images / 15 MB PDF, **no SVG** (it's executable XML) |
| Filenames | Filament generates them; the user's filename never touches disk |
| Login throttle | `throttle:5,1` on login |
| Contact throttle | `throttle:3,60` + honeypot + 3-second minimum fill time |
| Sessions | `HttpOnly`, `Secure`, `SameSite=Lax`; regenerate on login |
| Headers | `X-Content-Type-Options: nosniff`, `Referrer-Policy`, HSTS |
| Admin indexing | `X-Robots-Tag: noindex`, `/admin` disallowed in robots.txt |
| Secrets | `.env` git-ignored, `APP_DEBUG=false` in production |

**Never ship `/admin` without the auth middleware.** One test enforces it permanently — see §10.

Deliberately skipped for now: 2FA, nonce-based CSP, HIBP password checks, audit logging. Add 2FA if the site ever holds anything worth stealing; right now it holds a public CV.

---

## §9 — Performance

Targets: **Lighthouse ≥ 95 mobile, LCP < 1.5s, JS under 30 KB.**

Five rules get you there:

1. **No client framework.** Alpine (~15 KB, ships with Filament) covers the nav, theme toggle and filters.
2. **Images:** convert to WebP on upload, max 1600px wide, always set `width`/`height` (stops layout shift), `loading="lazy"` below the fold.
3. **Fonts:** self-host woff2, two weights max, `font-display: swap` — or use a system font stack and spend zero bytes.
4. **Eager-load relations.** Turn on `Model::preventLazyLoading()` in dev so N+1 queries throw while you're writing them.
5. **Cache the rendered Markdown** (already in `body_html`) and run `php artisan optimize` on deploy.

No video on the homepage. Demos over 15 seconds go to YouTube, embedded as a click-to-load poster image, so no third-party JS loads until someone asks for it.

---

## §10 — Tests

Five tests. Not coverage — just the failures that actually hurt.

```
1. A guest hitting any /admin route gets redirected.       ← iterate the route list
2. An unpublished project 404s for a guest.
3. Uploading shell.php (or shell.php.jpg) is rejected.
4. POST /contact without a CSRF token returns 419.
5. php artisan db:seed produces a complete, browsable site.
```

Test 1 iterates every registered admin route, so a new screen can't ship unprotected.

---

## §11 — Deploy, backup, analytics

**Host:** one small VPS (2 vCPU / 2 GB) with Caddy (automatic TLS) + PHP-FPM + MySQL, behind Cloudflare. Buy `yaminhaque.com` — the SEO goal is owning the search result for your own name.

**Deploy:** `git pull && composer install --no-dev -o && npm run build && php artisan migrate --force && php artisan optimize`.

**Backup** — a cron line, not a package:

```bash
0 3 * * * mysqldump -u portfolio portfolio | gzip > /backups/db-$(date +\%F).sql.gz && \
          find /backups -name 'db-*' -mtime +30 -delete
```

Copy `/backups` and `storage/app/public` off the server weekly (rclone to Backblaze B2 or R2). **Restore once, for real, before you need it** — an untested backup is a hypothesis.

**Analytics:** Cloudflare Web Analytics. Free, cookieless, one script tag, nothing to build or store. `resume_downloads` on the settings row covers the number you'll actually care about.

**SEO:** per-page `<title>` as `{Page} — Yamin Haque` (homepage: *Yamin Haque — Embedded Software Engineer*), meta description, canonical, OG tags, and a `Person` JSON-LD block on the homepage with `sameAs` pointing at GitHub, LinkedIn, Codeforces and LeetCode. That `sameAs` is what ties the site to your other profiles in search.

---

## §12 — Build order

Schema first, then admin, then public. Building the public site first means rebuilding it once the real data shape appears.

```
[ ] 1.  Laravel + Filament installed, git initialised, MySQL connected
[ ] 2.  All 8 migrations, written at once
[ ] 3.  Models, Published scope, slug trait, Markdown-render-on-save
[ ] 4.  Admin user, auth on /admin, register routes deleted, test #1
[ ] 5.  Filament resources: projects, posts, experiences, education, skills, settings, messages
[ ] 6.  Seeder from your CV (§13)
[ ] 7.  Public layout: header, nav, footer, theme toggle, 404
[ ] 8.  Home, projects index, project detail
[ ] 9.  About, experience, contact + mail notification
[ ] 10. Blog (or leave it off in settings until you write the first post)
[ ] 11. SEO tags, sitemap, robots, resume download
[ ] 12. Deploy, TLS, backup cron, Cloudflare Analytics
```

**Done when** you can add a full case study end-to-end without opening an editor, the site scores ≥95 on mobile, and a guest can't reach `/admin` or any draft.

### Add later, only if you miss it

Media library with reuse · proper tag tables and `/tag/{slug}` pages · typed section blocks · scheduled publishing · 2FA · custom analytics · site search · JSON API · GitHub repo sync · RSS · activity log · multiple editors · drag-and-drop reordering beyond `sort_order`.

Every one of these is additive against the schema above. None needs a rewrite.

---

## §13 — Seed content from your CV

Ship this as `DatabaseSeeder` so a fresh install is never an empty site.

**Settings:** Yamin Haque · Software Engineer (R&D) · Mirpur, Dhaka 1216 · yaminhaque1999@gmail.com · GitHub, LinkedIn, Codeforces `Yamin1999` ("Solved 100+ problems"), LeetCode `Yamin1999` ("Solved 70+ problems") · `Yamin_Haque_Resume.pdf` (already in this folder).

**Experience:** Software Engineer (R&D), Shanghai BDCOM Information Technology Co., Ltd. (Bangladesh office), Banani, Dhaka — 2023-04 → 2026-07. Bullets from the CV: Layer 2 features in Embedded C for ARM-based carrier Ethernet switches on embedded Linux and VxWorks, command-line/no-IDE with GCC and GDB; interpreting and implementing networking standards and RFCs for compliance; diagnosing issues with performance analysis and kernel tracing (Wireshark, trace-cmd, KernelShark, ftrace); agile collaboration in English with the overseas R&D team.

**Education:** B.Sc. Computer Science & Engineering, RUET, 2017–2022, CGPA 3.11/4.0.

**Projects** (all featured to start):

| Project | Context | Category |
|---|---|---|
| Layer 2 protocol development for carrier Ethernet switches | professional | Networking |
| Embedded C & low-level development | professional | Embedded Systems |
| TFTP server module (RFC 1350 / 2348 / 7440) | professional | Systems |
| Deep CNN for malaria parasite detection | academic | Machine Learning |

Write the **TFTP server** case study first — it's the one with a public GitHub link already on your CV, so it can carry real code. Thesis numbers for the results section: 27,578 single-cell images, five-fold cross-validation, 96.41% common accuracy, 13-layer CNN, simpler and more computationally efficient than the transfer-learning baselines compared against.

**Skills:** exactly the list in §6.4.

---

## Appendix — Requirements coverage

Shipping now: hero and home (1), about (2), experience (3), projects (4), project detail (5), dashboard (6), project editor (7), Markdown content (8), featured/order/publish (9), skills admin (10), skills display (11), education (12), thesis as a project (13), coding profiles (14), blog (15, 16), resume management (17), site settings (18), section toggles (19), contact (20), SEO (22), performance (23), admin security (24), backup (26), responsive (27), architecture (28), schema (29), phasing (30).

Simplified: analytics (21) is Cloudflare's, not custom. Media library (25) is per-entity upload without a reuse browser.

*The thesis (13) is a project row with `context = 'academic'`, not its own page type — a dedicated table for one record is debt you'd carry forever.*
