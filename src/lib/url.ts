/**
 * Base-aware internal links.
 *
 * Astro rewrites bundled asset URLs when `base` is set, but it does NOT touch
 * hand-written hrefs — a literal href="/projects" points at the domain root and
 * 404s on a project-path deploy. Every internal link goes through here instead,
 * so the site works whether it's served from the root or from a subpath.
 *
 * import.meta.env.BASE_URL is "/" when no base is configured, and "/Portfolio/"
 * when it is.
 */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}
