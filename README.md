# Portfolio — Yamin Haque

Static site built with [Astro](https://astro.build), content edited through
[Sveltia CMS](https://sveltiacms.app) at `/admin`. No server, no database — the
CMS writes Markdown and JSON straight to this repository, and a push rebuilds
the site.

Full design rationale: [docs/Portfolio-Build-Spec.md](docs/Portfolio-Build-Spec.md).

---

## Running it locally

Node 24 is installed at `~/.local/bin` (not system-wide). Add it to your PATH:

```bash
export PATH="$HOME/.local/bin:$PATH"     # add to ~/.zshrc to make it permanent
```

Then:

```bash
npm install
npm run dev        # http://localhost:4321
npm run verify     # build + run the build checks
```

| Script | Does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Static build into `dist/` |
| `npm run preview` | Serve the built site locally |
| `npm run check` | TypeScript / Astro type check |
| `npm run verify` | Build, then assert drafts didn't leak, admin isn't indexed, pages are within budget, CV is present |

---

## Editing content

Two ways, and they're equivalent — both end up as files in this repo:

**In the browser** at `https://yoursite.com/admin`. Sign in with a GitHub
personal access token ("Sign In with Token" on the login screen — no OAuth app
needed for a single user). Saving commits to `main` and the site rebuilds in
about a minute.

**In an editor** — the files are plain Markdown under `src/content/`.

### Content layout

```
src/content/projects/*.md      Project case studies
src/content/posts/*.md         Engineering notes (blog)
src/content/experience/*.md    Roles
src/content/education/*.md     Qualifications
src/data/site.json             Name, bio, links, hero copy, section toggles
src/data/skills.json           Skill groups
public/resume/                 CV PDF
public/uploads/                Images uploaded through the CMS
```

### Publishing rules

- `published: false` → no page is generated at all. Not hidden, not
  unreachable-by-URL — it does not exist in the build.
- `publishedAt` in the future → same thing, until that date passes.
- Ordering is `featured` first, then `order` ascending, then newest.
- The filename is the URL slug. **Renaming a file changes the URL**, so don't
  rename one you've already put on a CV.

`npm run verify` enforces the first two rules on every build.

---

## Going live

Configured for **https://yamin1999.github.io**, served from the root of a repo
named `Yamin1999.github.io`.

### One-time setup

```bash
# 1. Create the repo on GitHub named exactly: Yamin1999.github.io  (public)
# 2. Push
git remote add origin https://github.com/Yamin1999/Yamin1999.github.io.git
git push -u origin main
```

Then in the repo: **Settings → Pages → Source → "GitHub Actions"**.

The workflow in `.github/workflows/deploy.yml` builds, runs the checks, and
deploys. First deploy takes a couple of minutes; after that every push to `main`
redeploys — including the commits the CMS makes when you save from `/admin`.

If a push asks for a password, use a personal access token, not your account
password. The same token works for the CMS.

### Still open

- **CV PDF** — `public/resume/Yamin_Haque_Resume.pdf` is publicly downloadable
  and contains your phone number and your reference's name, phone and email.
  Export a web version without the References section and replace it.
- **Contact form** — set `contact.formEndpoint` in `src/data/site.json` to a
  [Formspree](https://formspree.io) URL to switch the form on. Left empty, the
  contact page shows your email address instead of a form that would silently
  swallow messages.
- **Custom domain** — if you buy one, change `site` in `astro.config.mjs`, the
  `Sitemap:` line in `public/robots.txt`, and add it under Settings → Pages.

### Note on renaming

The repo name and the URL are tied together. `Yamin1999.github.io` serves from
the root, which is why no `base` path is configured. Renaming the repo to
anything else moves the site to a subpath and every internal link breaks until
`base` is set in `astro.config.mjs` and threaded through each link.

---

## Stack

| | |
|---|---|
| Astro 7 | Static site generator |
| Sveltia CMS | Git-based admin panel, loaded from CDN at `/admin` |
| `@astrojs/sitemap` | Sitemap generation |
| Plain CSS | Custom properties, light/dark, no framework |

No client-side JavaScript framework. The only JS shipped is the theme toggle and
the project filter, both inlined and a few hundred bytes each.
