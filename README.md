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

## Before you go live

1. **`public/admin/config.yml`** — set `repo:` to `your-username/portfolio`.
   The CMS cannot save until this is right.
2. **`astro.config.mjs`** — set `site:` to your real domain. It drives canonical
   URLs, Open Graph tags and the sitemap.
3. **`public/robots.txt`** — update the `Sitemap:` line to the same domain.
4. **`src/data/site.json`** — replace the placeholder GitHub and LinkedIn URLs
   with your actual profiles. Codeforces and LeetCode are already correct.
5. **Contact form** — set `contact.formEndpoint` to a
   [Formspree](https://formspree.io) URL to switch the form on. Left empty, the
   contact page shows your email address instead of a form that would silently
   swallow messages.

---

## Deploying

### Cloudflare Pages (recommended)

Free, custom domains included, no public-repo requirement.

1. Push this repo to GitHub.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → connect the repo.
3. Build command `npm run build`, output directory `dist`.
4. Add your custom domain under the project's Custom Domains tab.

Every push to `main` redeploys — including the commits the CMS makes when you
save, so publishing from `/admin` just works.

### GitHub Pages (alternative)

`.github/workflows/deploy.yml` is ready to go: enable Settings → Pages → Source
→ "GitHub Actions".

Two caveats: on the free plan Pages sites must come from a **public** repo, and
if the repo isn't named `<username>.github.io` the site is served from a
subpath, so you must set `base: '/<repo-name>'` in `astro.config.mjs`.

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
