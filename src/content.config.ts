import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * These schemas are the contract between the CMS and the site.
 * Every field here must match a field in public/admin/config.yml -
 * if they drift, the build fails instead of shipping a broken page.
 */

/**
 * The CMS writes `''` for optional fields you leave blank, and an empty string
 * is not a valid URL - so a plain `.url().optional()` fails the build the first
 * time you save a project without a repo link. Treat blank as absent.
 */
const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalUrl = z.preprocess(blankToUndefined, z.string().url().optional());
const optionalText = z.preprocess(blankToUndefined, z.string().optional());

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().max(320),
    category: z.enum([
      'Embedded Systems',
      'Networking & Protocols',
      'Systems Programming',
      'Machine Learning',
      'Web',
      'Tools',
    ]),
    context: z.enum(['professional', 'academic', 'personal', 'oss']),
    organization: optionalText,
    role: optionalText,
    started: z.date(),
    ended: z.date().optional(),
    ongoing: z.boolean().default(false),
    tech: z.array(z.string()).default([]),
    standards: z.array(z.string()).default([]),
    cover: optionalText,
    repo: optionalUrl,
    demo: optionalUrl,
    docs: optionalUrl,
    video: optionalUrl,
    // Rendered as a single italic line. See §5 of the build spec.
    confidentiality: optionalText,
    featured: z.boolean().default(false),
    order: z.number().default(0),
    published: z.boolean().default(false),
    publishedAt: z.date(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string().max(320),
    category: z.string().default('Engineering notes'),
    tech: z.array(z.string()).default([]),
    cover: optionalText,
    featured: z.boolean().default(false),
    published: z.boolean().default(false),
    publishedAt: z.date(),
  }),
});

const experience = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/experience' }),
  schema: z.object({
    company: z.string(),
    companyUrl: optionalUrl,
    position: z.string(),
    employmentType: z
      .enum(['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'])
      .default('Full-time'),
    location: optionalText,
    started: z.date(),
    ended: z.date().optional(),
    current: z.boolean().default(false),
    summary: optionalText,
    responsibilities: z.array(z.string()).default([]),
    tech: z.array(z.string()).default([]),
    order: z.number().default(0),
  }),
});

const education = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/education' }),
  schema: z.object({
    institution: z.string(),
    institutionUrl: optionalUrl,
    degree: z.string(),
    field: optionalText,
    location: optionalText,
    started: z.date(),
    ended: z.date().optional(),
    grade: optionalText,
    gradeScale: optionalText,
    order: z.number().default(0),
  }),
});

export const collections = { projects, posts, experience, education };
