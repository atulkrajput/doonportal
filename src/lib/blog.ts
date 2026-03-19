import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { BlogPost } from '@/types';

const BLOG_DIR = path.join(process.cwd(), 'docs');

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));

  const posts = files
    .map((filename) => {
      const slug = filename.replace(/\.md$/, '');
      const filePath = path.join(BLOG_DIR, filename);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(fileContent);

      // Skip non-blog docs (no title or date in frontmatter)
      if (!data.title || !data.date) return null;

      return {
        slug,
        title: data.title || '',
        excerpt: data.excerpt || '',
        author: data.author || '',
        date: data.date || '',
        featuredImage: data.featuredImage || '',
        content,
        tags: data.tags || [],
      } as BlogPost;
    })
    .filter((post): post is BlogPost => post !== null);

  // Sort by date descending
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return undefined;

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  return {
    slug,
    title: data.title || '',
    excerpt: data.excerpt || '',
    author: data.author || '',
    date: data.date || '',
    featuredImage: data.featuredImage || '',
    content,
    tags: data.tags || [],
  };
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => {
      const content = fs.readFileSync(path.join(BLOG_DIR, f), 'utf-8');
      const { data } = matter(content);
      return data.title && data.date;
    })
    .map((f) => f.replace(/\.md$/, ''));
}
