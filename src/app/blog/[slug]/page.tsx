import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import PageLayout from '@/components/layouts/PageLayout';
import SectionWrapper from '@/components/ui/SectionWrapper';
import Button from '@/components/ui/Button';
import { getPostBySlug, getAllSlugs } from '@/lib/blog';
import { buildBlogPostingJsonLd, buildBreadcrumbJsonLd } from '@/data/seo';

const SITE_URL = 'https://doonportal.com';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} | DoonPortal Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.featuredImage ? [post.featuredImage] : [],
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
    alternates: {
      canonical: `${SITE_URL}/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return notFound();

  const seo = {
    title: `${post.title} | DoonPortal Blog`,
    description: post.excerpt,
    canonical: `${SITE_URL}/blog/${slug}`,
    jsonLd: [
      buildBlogPostingJsonLd({
        title: post.title,
        description: post.excerpt,
        url: `${SITE_URL}/blog/${slug}`,
        datePublished: post.date,
        author: post.author,
        image: post.featuredImage,
      }),
      buildBreadcrumbJsonLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Blog', url: `${SITE_URL}/blog` },
        { name: post.title, url: `${SITE_URL}/blog/${slug}` },
      ]),
    ],
  };

  const htmlContent = markdownToHtml(post.content);
  const headings = extractHeadings(post.content);

  return (
    <PageLayout seo={seo}>
      <main>
        <article>
          <SectionWrapper className="bg-gradient-to-br from-brand-50 via-white to-brand-100">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
                {post.title}
              </h1>
              <div className="mt-4 flex items-center justify-center gap-4 text-neutral-500">
                <span>{post.author}</span>
                <span>·</span>
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </div>
              {post.tags && post.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </SectionWrapper>

          {post.featuredImage && (
            <SectionWrapper className="py-0 md:py-0">
              <div className="relative mx-auto aspect-video max-w-4xl overflow-hidden rounded-2xl bg-neutral-100">
                <Image
                  src={post.featuredImage}
                  alt={`${post.title} - featured image`}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 896px"
                />
              </div>
            </SectionWrapper>
          )}

          <SectionWrapper>
            <div className="mx-auto max-w-3xl">
              {/* Table of Contents */}
              {headings.length > 2 && (
                <nav className="mb-10 rounded-xl border border-neutral-200 bg-neutral-50 p-6" aria-label="Table of contents">
                  <h2 className="mb-3 text-lg font-semibold text-neutral-900">Table of Contents</h2>
                  <ul className="space-y-2">
                    {headings.map((heading) => (
                      <li key={heading.id} className={heading.level === 3 ? 'ml-4' : ''}>
                        <a href={`#${heading.id}`} className="text-sm text-brand-600 hover:text-brand-800">
                          {heading.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}

              {/* Article content */}
              <div
                className="prose prose-lg prose-neutral prose-headings:font-bold prose-a:text-brand-600"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />

              {/* CTA at bottom of blog post */}
              <div className="mt-12 rounded-2xl border border-brand-200 bg-brand-50 p-8 text-center">
                <h2 className="text-xl font-bold text-neutral-900">Ready to Get Started?</h2>
                <p className="mt-2 text-neutral-600">
                  See how DoonPortal can automate your operations with a free demo.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-4">
                  <Button href="/book-demo" variant="primary" size="md">
                    Book Free Demo
                  </Button>
                  <Button href="/solutions" variant="outline" size="md">
                    Explore Solutions
                  </Button>
                </div>
              </div>

              {/* Internal links */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/products/school-management" className="group text-sm text-brand-600 hover:text-brand-800">
                  School Management{' '}
                  <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
                </Link>
                <Link href="/products/inventory-pos" className="group text-sm text-brand-600 hover:text-brand-800">
                  Inventory POS{' '}
                  <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
                </Link>
                <Link href="/products/dairy-management" className="group text-sm text-brand-600 hover:text-brand-800">
                  Dairy Management{' '}
                  <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
                </Link>
                <Link href="/blog" className="text-sm text-brand-600 hover:text-brand-800">
                  ← Back to Blog
                </Link>
              </div>
            </div>
          </SectionWrapper>
        </article>
      </main>
    </PageLayout>
  );
}

/** Extract headings from markdown for table of contents */
function extractHeadings(markdown: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  const lines = markdown.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      headings.push({ id, text, level: match[1].length });
    }
  }
  return headings;
}

/** Markdown to HTML converter with heading IDs for anchor links */
function markdownToHtml(markdown: string): string {
  return markdown
    .replace(/^### (.+)$/gm, (_match, text) => {
      const id = text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return `<h3 id="${id}">${text}</h3>`;
    })
    .replace(/^## (.+)$/gm, (_match, text) => {
      const id = text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return `<h2 id="${id}">${text}</h2>`;
    })
    .replace(/^# (.+)$/gm, (_match, text) => {
      const id = text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return `<h2 id="${id}">${text}</h2>`;
    })
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol')) {
        return trimmed;
      }
      if (trimmed.includes('<li>')) {
        return `<ul>${trimmed}</ul>`;
      }
      return `<p>${trimmed}</p>`;
    })
    .join('\n');
}
