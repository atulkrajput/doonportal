import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import PageLayout from '@/components/layouts/PageLayout';
import Button from '@/components/ui/Button';
import { getPostBySlug, getAllSlugs, getAllPosts } from '@/lib/blog';
import { buildBlogPostingJsonLd, buildBreadcrumbJsonLd } from '@/data/seo';
import BlogContent from './BlogContent';

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

function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 220));
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
  const readingTime = estimateReadingTime(post.content);
  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Related posts: same tags, exclude current
  const allPosts = getAllPosts();
  const relatedPosts = allPosts
    .filter((p) => p.slug !== slug && p.tags?.some((t) => post.tags?.includes(t)))
    .slice(0, 3);

  const shareUrl = `${SITE_URL}/blog/${slug}`;

  return (
    <PageLayout seo={seo}>
      <BlogContent>
        <article>
          {/* Breadcrumb — pt-24 md:pt-28 clears the fixed navbar */}
          <div className="mx-auto max-w-4xl px-4 pt-24 md:pt-28 sm:px-6 lg:px-8">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-neutral-400">
              <Link href="/" className="hover:text-brand-600 transition-colors">Home</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-brand-600 transition-colors">Blog</Link>
              <span>/</span>
              <span className="text-neutral-600 truncate max-w-[200px]">{post.title}</span>
            </nav>
          </div>

          {/* Hero */}
          <header className="mx-auto max-w-4xl px-4 pb-8 pt-10 sm:px-6 lg:px-8">
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-600 ring-1 ring-brand-200/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-neutral-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              {post.title}
            </h1>

            <p className="mt-4 text-lg leading-relaxed text-neutral-500">
              {post.excerpt}
            </p>

            {/* Meta row */}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-neutral-200 pb-6">
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
                  {post.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{post.author}</p>
                  <p className="text-xs text-neutral-400">
                    <time dateTime={post.date}>{formattedDate}</time>
                  </p>
                </div>
              </div>

              <span className="hidden sm:block h-5 w-px bg-neutral-200" />

              {/* Reading time */}
              <span className="flex items-center gap-1.5 text-sm text-neutral-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                </svg>
                {readingTime} min read
              </span>

              {/* Share */}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Share</span>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-brand-50 hover:text-brand-600"
                  aria-label="Share on Twitter"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-brand-50 hover:text-brand-600"
                  aria-label="Share on LinkedIn"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(post.title + ' ' + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-green-50 hover:text-green-600"
                  aria-label="Share on WhatsApp"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <div className="relative aspect-[21/9] overflow-hidden rounded-2xl bg-neutral-100 shadow-lg ring-1 ring-neutral-900/5">
                <Image
                  src={post.featuredImage}
                  alt={`${post.title} - featured image`}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 896px"
                />
              </div>
            </div>
          )}

          {/* Body */}
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-12">
              {/* Main content */}
              <div className="min-w-0">
                <div
                  className="
                    prose prose-lg prose-neutral max-w-none
                    prose-headings:scroll-mt-24 prose-headings:font-extrabold prose-headings:tracking-tight
                    prose-h2:mt-14 prose-h2:mb-5 prose-h2:text-2xl prose-h2:border-b prose-h2:border-neutral-200 prose-h2:pb-3
                    prose-h3:mt-10 prose-h3:mb-4 prose-h3:text-xl
                    prose-p:leading-[1.8] prose-p:text-neutral-600
                    prose-a:text-brand-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-a:decoration-brand-300
                    prose-strong:text-neutral-900
                    prose-li:text-neutral-600 prose-li:leading-[1.8]
                    prose-ul:my-6 prose-ol:my-6
                    prose-blockquote:border-l-brand-500 prose-blockquote:bg-brand-50/50 prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-neutral-700
                    prose-img:rounded-xl prose-img:shadow-md
                    prose-hr:my-10 prose-hr:border-neutral-200
                  "
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />

                {/* Author card */}
                <div className="mt-14 flex items-start gap-4 rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white">
                    {post.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Written by</p>
                    <p className="mt-0.5 text-lg font-bold text-neutral-900">{post.author}</p>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                      Sharing insights on business automation, school management, and technology solutions at DoonPortal.
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-12 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-center shadow-xl sm:p-10">
                  <h2 className="text-2xl font-extrabold text-white sm:text-3xl">Ready to Get Started?</h2>
                  <p className="mx-auto mt-3 max-w-md text-brand-100">
                    See how DoonPortal can automate your operations with a free, personalized demo.
                  </p>
                  <div className="mt-7 flex flex-wrap justify-center gap-3">
                    <Button href="/book-demo" variant="secondary" size="lg">
                      Book Free Demo
                    </Button>
                    <Button href="/solutions" variant="ghost" size="lg" className="text-white hover:bg-white/10">
                      Explore Solutions
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sidebar — TOC (sticky on desktop) */}
              {headings.length > 2 && (
                <aside className="hidden lg:block">
                  <div className="sticky top-28">
                    <nav aria-label="Table of contents" className="rounded-xl border border-neutral-200 bg-white p-5">
                      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-400">On this page</h2>
                      <ul className="space-y-2">
                        {headings.map((heading) => (
                          <li key={heading.id}>
                            <a
                              href={`#${heading.id}`}
                              className={`block text-[13px] leading-snug transition-colors hover:text-brand-600 ${
                                heading.level === 3
                                  ? 'pl-3 text-neutral-400 hover:text-brand-500'
                                  : 'font-medium text-neutral-600'
                              }`}
                            >
                              {heading.text}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </div>
                </aside>
              )}
            </div>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="border-t border-neutral-200 bg-neutral-50">
              <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
                <h2 className="text-center text-xs font-bold uppercase tracking-wider text-neutral-400">Related Articles</h2>
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedPosts.map((rp) => (
                    <Link key={rp.slug} href={`/blog/${rp.slug}`} className="group block">
                      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-lg">
                        {rp.featuredImage && (
                          <div className="relative aspect-video bg-neutral-100">
                            <Image src={rp.featuredImage} alt={rp.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 640px) 100vw, 33vw" loading="lazy" />
                          </div>
                        )}
                        <div className="p-4">
                          <p className="text-xs text-neutral-400">
                            {new Date(rp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <h3 className="mt-1 text-sm font-semibold leading-snug text-neutral-900 line-clamp-2 group-hover:text-brand-600 transition-colors">
                            {rp.title}
                          </h3>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Back to blog */}
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <Link href="/blog" className="group inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors">
              <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1">←</span>
              All articles
            </Link>
          </div>
        </article>
      </BlogContent>
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

/** Markdown to HTML converter with heading IDs, lists, blockquotes, code, images, and hr */
function markdownToHtml(markdown: string): string {
  let html = markdown
    // Headings with IDs
    .replace(/^### (.+)$/gm, (_m, text) => {
      const id = text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return `<h3 id="${id}">${text}</h3>`;
    })
    .replace(/^## (.+)$/gm, (_m, text) => {
      const id = text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return `<h2 id="${id}">${text}</h2>`;
    })
    .replace(/^# (.+)$/gm, (_m, text) => {
      const id = text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return `<h2 id="${id}">${text}</h2>`;
    })
    // Horizontal rules
    .replace(/^---$/gm, '<hr />')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    // Bold & italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  // Process blocks
  const blocks = html.split(/\n\n+/);
  const processed: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;

    // Already an HTML element
    if (block.startsWith('<h') || block.startsWith('<hr')) {
      processed.push(block);
      continue;
    }

    // Blockquote
    if (block.startsWith('&gt;') || block.startsWith('>')) {
      const text = block.replace(/^(?:&gt;|>)\s?/gm, '');
      processed.push(`<blockquote><p>${text}</p></blockquote>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(block)) {
      const items = block.split('\n').map(line => {
        const m = line.match(/^\d+\.\s+(.+)$/);
        return m ? `<li>${m[1]}</li>` : '';
      }).join('');
      processed.push(`<ol>${items}</ol>`);
      continue;
    }

    // Unordered list
    if (block.startsWith('- ') || block.startsWith('* ')) {
      const items = block.split('\n').map(line => {
        const m = line.match(/^[-*]\s+(.+)$/);
        return m ? `<li>${m[1]}</li>` : '';
      }).join('');
      processed.push(`<ul>${items}</ul>`);
      continue;
    }

    // Paragraph
    processed.push(`<p>${block.replace(/\n/g, '<br />')}</p>`);
  }

  return processed.join('\n');
}
