import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useApi } from '../../hooks/useApi';
import { useSaved } from '../../context/SavedContext';
import { Icon } from '../../components/Icons';
import { EmptyState, ErrorState, SkeletonCards } from '../../components/States';
import { Cover } from '../../components/Cards';

const TABS = [
    ['', 'All'],
    ['business', 'Businesses'],
    ['place', 'Places'],
    ['event', 'Events'],
    ['story', 'Stories'],
];

const TYPE_LABEL = { business: 'Business', place: 'Place', event: 'Event', story: 'Story' };

export default function Saved() {
    const [params, setParams] = useSearchParams();
    const type = params.get('type') || '';
    const page = Number(params.get('page') || 1);
    const { toggle } = useSaved();
    const [removed, setRemoved] = useState(() => new Set());
    const { data, loading, error } = useApi('/me/saved', { type, page, per_page: 24 });

    const remove = async (item) => {
        setRemoved((prev) => new Set(prev).add(`${item.type}:${item.id}`));
        await toggle(item.type, item.id);
    };
    const items = (data?.data || []).filter((i) => !removed.has(`${i.type}:${i.id}`));

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Saved types">
                {TABS.map(([value, label]) => (
                    <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={type === value}
                        onClick={() => setParams(value ? { type: value } : {})}
                        className={`rounded-full px-3 py-1.5 text-sm font-semibold ${type === value ? 'bg-navy-700 text-white' : 'border border-stone-300 bg-white text-stone-700 hover:border-navy-500'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {loading && <SkeletonCards count={3} />}
            {error && <ErrorState error={error} />}
            {data && items.length === 0 && (
                <EmptyState title="Nothing saved yet" action={<Link to="/places" className="btn-primary">Start exploring</Link>}>
                    Tap <Icon name="heart" size={14} className="inline" /> Save on any business, place, event or story to keep it here.
                </EmptyState>
            )}

            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                    <li key={`${item.type}:${item.id}`} className="relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white">
                        {item.card ? (
                            <Link to={item.card.path} className="group flex flex-1 flex-col">
                                <Cover src={item.card.image} title={item.card.title} type={item.type} className="aspect-[16/9]" />
                                <div className="flex-1 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-navy-600">{TYPE_LABEL[item.type]}</p>
                                    <p className="mt-1 font-semibold group-hover:text-navy-700">{item.card.title}</p>
                                    {item.card.area && <p className="text-sm text-stone-600">{item.card.area}</p>}
                                </div>
                            </Link>
                        ) : (
                            <div className="flex-1 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{TYPE_LABEL[item.type]}</p>
                                <p className="mt-1 text-sm text-stone-600">This listing is no longer available.</p>
                            </div>
                        )}
                        <button type="button" onClick={() => remove(item)} className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-stone-700 shadow hover:text-red-700">
                            <Icon name="close" size={14} /> Remove
                        </button>
                    </li>
                ))}
            </ul>

            {data?.meta?.last_page > 1 && (
                <nav className="flex items-center justify-center gap-3" aria-label="Pages">
                    <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => setParams({ ...(type && { type }), page: page - 1 })}>
                        Previous
                    </button>
                    <span className="text-sm text-stone-600">
                        Page {page} of {data.meta.last_page}
                    </span>
                    <button type="button" className="btn-secondary" disabled={page >= data.meta.last_page} onClick={() => setParams({ ...(type && { type }), page: page + 1 })}>
                        Next
                    </button>
                </nav>
            )}
        </div>
    );
}
