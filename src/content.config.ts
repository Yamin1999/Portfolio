import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * These schemas are the contract between the CMS and the site.
 * Every field here must match a field in public/admin/config.yml —
 * if they drift, the build fails instead of shipping a broken page.
 */

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
    organization: z.string().optional(),
    role: z.string().optional(),
    started: z.date(),
    ended: z.date().optional(),
    ongoing: z.boolean().default(false),
    tech: z.array(z.string()).default([]),
    standards: z.array(z.string()).default([]),
    cover: z.string().optional(),
    repo: z.string().url().optional(),
    demo: z.string().url().optional(),
    docs: z.string().url().optional(),
    video: z.string().url().optional(),
    // Rendered as a single italic line. See §5 of the build spec.
    confidentiality: z.string().optional(),
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
    cover: z.string().optional(),
    featured: z.boolean().default(false),
    published: z.boolean().default(false),
    publishedAt: z.date(),
  }),
});

const experience = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/experience' }),
  schema: z.object({
    company: z.string(),
    companyUrl: z.string().url().optional(),
    position: z.string(),
    employmentType: z
      .enum(['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'])
      .default('Full-time'),
    location: z.string().optional(),
    started: z.date(),
    ended: z.date().optional(),
    current: z.boolean().default(false),
    summary: z.string().optional(),
    responsibilities: z.array(z.string()).default([]),
    tech: z.array(z.string()).default([]),
    order: z.number().default(0),
  }),
});

const education = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/education' }),
  schema: z.object({
    institution: z.string(),
    institutionUrl: z.string().url().optional(),
    degree: z.string(),
    field: z.string().optional(),
    location: z.string().optional(),
    started: z.date(),
    ended: z.date().optional(),
    grade: z.string().optional(),
    gradeScale: z.string().optional(),
    order: z.number().default(0),
  }),
});

export const collections = { projects, posts, experience, education };
