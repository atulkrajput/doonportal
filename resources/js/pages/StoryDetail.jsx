import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router';
import DOMPurify from 'dompurify';
import { useApi } from '../hooks/useApi';
import { track } from '../lib/analytics';
import { formatDate } from '../lib/format';
import { Cover, EntityCard } from '../components/Cards';
import { DemoBadge } from '../components/Badges';
import { Breadcrumbs, DetailGate } from '../components/Detail';
import { SaveButton } from '../context/SavedContext';

const ALLOWED_TAGS = ['p', 'h2', 'h3', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'blockquote', 'br', 'figure', 'figcaption', 'img'];

function StoryView({ story }) {
    const crumbs = [['/', 'Home'], ['/stories', 'Stories'], [null, story.title]];
    // Defence in depth: bodies are sanitized again in the browser before rendering.
    const html = useMemo(
        () => DOMPurify.sanitize(story.body ?? '', { ALLOWED_TAGS, ALLOWED_ATTR: ['href', 'src', 'alt', 'title'] }),
        [story.body],
    );

    useEffect(() => {
        track('story_read', { type: 'story', id: story.id });
    }, [story.id]);

    return (
        <article className="container-page max-w-3xl py-8">
            <Breadcrumbs items={crumbs} />
            <div className="mt-4 flex items-center gap-2">
                <span className="text-sm font-semibold uppercase tracking-wide text-navy-600">{story.story_type.toLowerCase()}</span>
                <DemoBadge show={story.is_demo} />
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-5xl">{story.title}</h1>
            {story.excerpt && <p className="mt-3 text-lg text-stone-600">{story.excerpt}</p>}
            <p className="mt-4 text-sm text-stone-500">
                {[story.author?.name && `By ${story.author.name}`, formatDate(story.published_at), story.reading_minutes && `${story.reading_minutes} min read`].filter(Boolean).join(' · ')}
            </p>
            <div className="mt-4">
                <SaveButton type="story" id={story.id} label="Save for later" />
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl">
                <Cover src={story.cover?.url} alt={story.cover?.alt} title={story.title} type="story" className="aspect-[16/9]" />
            </div>
            <div className="prose-story mt-8 text-[17px] text-stone-800" dangerouslySetInnerHTML={{ __html: html }} />
            {story.categories?.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2">
                    {story.categories.map((c) => (
                        <Link key={c.id} to={`/stories?category=${c.slug}`} className="chip">
                            {c.name}
                        </Link>
                    ))}
                </div>
            )}
            {story.linked_entities?.length > 0 && (
                <section className="mt-10">
                    <h2 className="font-display text-xl font-bold">Mentioned in this story</h2>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {story.linked_entities.map((card) => (
                            <EntityCard key={`${card.type}-${card.id}`} card={card} />
                        ))}
                    </div>
                </section>
            )}
        </article>
    );
}

export default function StoryDetail() {
    const { slug } = useParams();
    const state = useApi(`/stories/${slug}`);
    return <DetailGate state={state}>{(story) => <StoryView key={story.id} story={story} />}</DetailGate>;
}
