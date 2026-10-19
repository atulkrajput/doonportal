import { Link } from 'react-router';
import { DemoBadge, OpenBadge, Rating, VerifiedBadge } from './Badges';
import { Icon } from './Icons';
import { formatEventDate, priceLabel, priceRange } from '../lib/format';

const TYPE_STYLE = {
    business: 'from-forest-500 to-forest-700',
    place: 'from-emerald-400 to-teal-700',
    event: 'from-saffron-400 to-orange-600',
    story: 'from-stone-500 to-stone-800',
    collection: 'from-forest-700 to-forest-900',
    area: 'from-teal-500 to-forest-700',
};

/** Real image when we have one; otherwise an honest typographic placeholder. */
export function Cover({ src, alt = '', title, type = 'business', className = 'aspect-[4/3]', initial = true }) {
    if (src) {
        return <img src={src} alt={alt} loading="lazy" className={`${className} w-full object-cover`} />;
    }
    return (
        <div className={`${className} flex w-full items-end bg-gradient-to-br ${TYPE_STYLE[type] || TYPE_STYLE.business} p-4`} aria-hidden="true">
            {initial && <span className="font-display text-4xl font-bold text-white/80">{title?.trim()?.[0]?.toUpperCase()}</span>}
        </div>
    );
}

function CardShell({ to, children }) {
    return (
        <Link
            to={to}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            {children}
        </Link>
    );
}

export function BusinessCard({ business }) {
    const category = business.categories?.[0]?.name;
    return (
        <CardShell to={`/business/${business.slug}`}>
            <Cover src={business.cover?.url} alt={business.cover?.alt} title={business.name} type="business" />
            <div className="flex flex-1 flex-col gap-1.5 p-4">
                <div className="flex flex-wrap items-center gap-1.5">
                    <VerifiedBadge show={business.is_verified} />
                    <DemoBadge show={business.is_demo} />
                </div>
                <h3 className="font-semibold leading-snug text-ink group-hover:text-forest-700">{business.name}</h3>
                <p className="text-sm text-stone-600">
                    {[category, business.area?.name, priceRange(business.price_range)].filter(Boolean).join(' · ')}
                </p>
                <div className="mt-auto flex items-center justify-between pt-2">
                    <Rating rating={business.rating} />
                    <OpenBadge open={business.open_now} />
                </div>
            </div>
        </CardShell>
    );
}

export function PlaceCard({ place }) {
    return (
        <CardShell to={`/place/${place.slug}`}>
            <Cover src={place.cover?.url} alt={place.cover?.alt} title={place.name} type="place" />
            <div className="flex flex-1 flex-col gap-1.5 p-4">
                <DemoBadge show={place.is_demo} />
                <h3 className="font-semibold leading-snug group-hover:text-forest-700">{place.name}</h3>
                <p className="line-clamp-2 text-sm text-stone-600">{place.summary}</p>
                <p className="mt-auto pt-2 text-xs text-stone-500">
                    {[place.categories?.[0]?.name, place.area?.name, place.entry?.is_free ? 'Free entry' : null].filter(Boolean).join(' · ')}
                </p>
            </div>
        </CardShell>
    );
}

export function EventCard({ event }) {
    const price = priceLabel(event.price);
    return (
        <CardShell to={`/event/${event.slug}`}>
            <Cover src={event.cover?.url} alt={event.cover?.alt} title={event.title} type="event" />
            <div className="flex flex-1 flex-col gap-1.5 p-4">
                <div className="flex flex-wrap items-center gap-1.5">
                    {event.is_cancelled && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">Cancelled</span>}
                    {event.phase === 'LIVE' && <span className="rounded-full bg-forest-100 px-2 py-0.5 text-xs font-semibold text-forest-700">Happening now</span>}
                    <DemoBadge show={event.is_demo} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-saffron-500">{formatEventDate(event.starts_at, event.timezone)}</p>
                <h3 className={`font-semibold leading-snug group-hover:text-forest-700 ${event.is_cancelled ? 'line-through decoration-stone-400' : ''}`}>{event.title}</h3>
                <p className="mt-auto pt-2 text-sm text-stone-600">{[event.venue?.name || event.area?.name, price].filter(Boolean).join(' · ')}</p>
            </div>
        </CardShell>
    );
}

export function StoryCard({ story }) {
    return (
        <CardShell to={`/story/${story.slug}`}>
            <Cover src={story.cover?.url} alt={story.cover?.alt} title={story.title} type="story" className="aspect-[16/9]" />
            <div className="flex flex-1 flex-col gap-1.5 p-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-forest-600">{story.story_type?.toLowerCase()}</span>
                    <DemoBadge show={story.is_demo} />
                </div>
                <h3 className="font-display text-lg font-semibold leading-snug group-hover:text-forest-700">{story.title}</h3>
                <p className="line-clamp-2 text-sm text-stone-600">{story.excerpt}</p>
            </div>
        </CardShell>
    );
}

export function CollectionCard({ collection }) {
    return (
        <CardShell to={`/collection/${collection.slug}`}>
            <Cover src={collection.cover?.url} title={collection.title} type="collection" className="aspect-[16/9]" />
            <div className="flex flex-1 flex-col gap-1.5 p-4">
                <DemoBadge show={collection.is_demo} />
                <h3 className="font-display text-lg font-semibold group-hover:text-forest-700">{collection.title}</h3>
                <p className="line-clamp-2 text-sm text-stone-600">{collection.description}</p>
                {collection.items_count != null && <p className="mt-auto pt-2 text-xs text-stone-500">{collection.items_count} picks</p>}
            </div>
        </CardShell>
    );
}

/** Generic card for mixed entity lists (search results, collections, linked entities). */
export function EntityCard({ card }) {
    return (
        <Link to={card.path} className="group flex gap-3 rounded-2xl border border-stone-200 bg-white p-3 hover:border-forest-500">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                <Cover src={card.image} title={card.title} type={card.type} className="h-20" />
            </div>
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">{card.type}</span>
                    {card.is_verified && <Icon name="check" size={14} className="text-forest-600" label="Verified" />}
                    <DemoBadge show={card.is_demo} />
                </div>
                <p className="truncate font-semibold group-hover:text-forest-700">{card.title}</p>
                <p className="line-clamp-2 text-sm text-stone-600">
                    {card.type === 'event' && card.starts_at ? `${formatEventDate(card.starts_at)} · ` : ''}
                    {card.summary || card.area}
                </p>
            </div>
        </Link>
    );
}

export function CardGrid({ children }) {
    return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}
