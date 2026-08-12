import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * The single gate every public query goes through. A draft, or an entry with a
 * future publish date, is invisible to visitors — there is no second code path
 * that could accidentally leak one.
 */
const isLive = (entry: { data: { published: boolean; publishedAt: Date } }) =>
  entry.data.published && entry.data.publishedAt.getTime() <= Date.now();

/** featured first, then manual order, then newest. */
function byDisplayOrder(
  a: { data: { featured: boolean; order: number; publishedAt: Date } },
  b: { data: { featured: boolean; order: number; publishedAt: Date } },
) {
  if (a.data.featured !== b.data.featured) return a.data.featured ? -1 : 1;
  if (a.data.order !== b.data.order) return a.data.order - b.data.order;
  return b.data.publishedAt.getTime() - a.data.publishedAt.getTime();
}

export async function getProjects(): Promise<CollectionEntry<'projects'>[]> {
  const projects = await getCollection('projects', isLive);
  return projects.sort(byDisplayOrder);
}

export async function getFeaturedProjects(limit = 3) {
  const projects = await getProjects();
  const featured = projects.filter((p) => p.data.featured);
  return (featured.length ? featured : projects).slice(0, limit);
}

export async function getPosts(): Promise<CollectionEntry<'posts'>[]> {
  const posts = await getCollection('posts', isLive);
  return posts.sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime(),
  );
}

export async function getExperience() {
  const roles = await getCollection('experience');
  return roles.sort((a, b) => {
    if (a.data.order !== b.data.order) return a.data.order - b.data.order;
    return b.data.started.getTime() - a.data.started.getTime();
  });
}

export async function getEducation() {
  const entries = await getCollection('education');
  return entries.sort((a, b) => a.data.order - b.data.order);
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatRange(start: Date, end?: Date, ongoing = false): string {
  const from = formatMonthYear(start);
  if (ongoing || !end) return `${from} — Present`;
  return `${from} — ${formatMonthYear(end)}`;
}

/** "3 yr 4 mo" — shown beside role dates so duration doesn't need mental maths. */
export function formatDuration(start: Date, end?: Date): string {
  const to = end ?? new Date();
  let months =
    (to.getFullYear() - start.getFullYear()) * 12 +
    (to.getMonth() - start.getMonth());
  months = Math.max(months, 0) + 1;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years) parts.push(`${years} yr`);
  if (rest) parts.push(`${rest} mo`);
  return parts.join(' ') || '1 mo';
}

/** Rough reading time, used on posts. */
export function readingMinutes(body: string | undefined): number {
  const words = (body ?? '').trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
