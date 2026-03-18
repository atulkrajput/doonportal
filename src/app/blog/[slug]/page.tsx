import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import PageLayout from '@/components/layouts/PageLayout';
import SectionWrapper from '@/components/ui/SectionWrapper';
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
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return notFound();

  const seo = {
    title: `${post.title} | DoonPortal Blog`,
    description: post.excerpt,
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
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 896px"
                />
              </div>
            </SectionWrapper>
          )}

          <SectionWrapper>
            <div
              className="prose prose-lg prose-neutral mx-auto max-w-3xl prose-headings:font-bold prose-a:text-brand-600"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }}
            />
          </SectionWrapper>
        </article>
      </main>
    </PageLayout>
  );
}

/** Simple markdown to HTML converter for blog content */
function markdownToHtml(markdown: string): string {
  return markdown
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    // Paragraphs (double newlines)
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol')) {
        return trimmed;
      }
      return `<p>${trimmed}</p>`;
    })
    .join('\n');
}
