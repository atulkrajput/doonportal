import { Link, useSearchParams } from 'react-router';
import { EmptyState, ErrorState, SkeletonCards } from './States';
import { CardGrid } from './Cards';

export function PageHeader({ eyebrow, title, children }) {
    return (
        <div className="border-b border-stone-200 bg-gradient-to-b from-forest-50 to-cream">
            <div className="container-page py-8 sm:py-10">
                {eyebrow && <div className="text-sm font-semibold uppercase tracking-wide text-forest-600">{eyebrow}</div>}
                <h1 className="mt-1 font-display text-3xl font-bold text-ink sm:text-4xl">{title}</h1>
                {children && <div className="mt-2 max-w-2xl text-stone-600">{children}</div>}
            </div>
        </div>
    );
}

export function Section({ title, to, linkLabel = 'See all', children, subtitle }) {
    return (
        <section className="container-page py-8">
            <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                    <h2 className="font-display text-2xl font-bold">{title}</h2>
                    {subtitle && <p className="mt-1 text-sm text-stone-600">{subtitle}</p>}
                </div>
                {to && (
                    <Link to={to} className="shrink-0 text-sm font-semibold text-forest-700 hover:underline">
                        {linkLabel} →
                    </Link>
                )}
            </div>
            {children}
        </section>
    );
}

/** Reads and writes filters in the URL so every filtered view is shareable. */
export function useUrlFilters() {
    const [params, setParams] = useSearchParams();
    const get = (key) => params.get(key) ?? '';
    const set = (key, value) => {
        const next = new URLSearchParams(params);
        if (value === '' || value == null || value === false) {
            next.delete(key);
        } else {
            next.set(key, String(value));
        }
        if (key !== 'page') {
            next.delete('page');
        }
        setParams(next);
    };
    return { params, get, set, all: Object.fromEntries(params.entries()) };
}

export function ChipGroup({ label, options, value, onChange }) {
    return (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
            {options.map(([optionValue, optionLabel]) => {
                const active = value === optionValue;
                return (
                    <button
                        key={optionValue || 'all'}
                        type="button"
                        aria-pressed={active}
                        className={`chip ${active ? 'chip-active' : ''}`}
                        onClick={() => onChange(active ? '' : optionValue)}
                    >
                        {optionLabel}
                    </button>
                );
            })}
        </div>
    );
}

export function SelectFilter({ label, value, onChange, options }) {
    return (
        <label className="flex items-center gap-2 text-sm text-stone-700">
            <span className="sr-only sm:not-sr-only">{label}</span>
            <select className="input w-auto py-1.5" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
                {options.map(([v, l]) => (
                    <option key={v} value={v}>
                        {l}
                    </option>
                ))}
            </select>
        </label>
    );
}

export function Pagination({ meta, onPage }) {
    if (!meta || meta.last_page <= 1) {
        return null;
    }
    return (
        <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
            <button type="button" className="btn-secondary" disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)}>
                Previous
            </button>
            <span className="text-sm text-stone-600">
                Page {meta.current_page} of {meta.last_page}
            </span>
            <button type="button" className="btn-secondary" disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)}>
                Next
            </button>
        </nav>
    );
}

/** Loading / error / empty / grid + pagination for a paginated API response. */
export function ResultsGrid({ state, render, empty, onPage }) {
    const { data, loading, error } = state;
    if (loading) {
        return <SkeletonCards count={8} />;
    }
    if (error) {
        return <ErrorState error={error} />;
    }
    if (!data?.data?.length) {
        return empty || <EmptyState title="No results match these filters">Try removing a filter or searching for something else.</EmptyState>;
    }
    return (
        <>
            {data.meta && <p className="mb-3 text-sm text-stone-600">{data.meta.total} result{data.meta.total === 1 ? '' : 's'}</p>}
            <CardGrid>{data.data.map(render)}</CardGrid>
            <Pagination meta={data.meta} onPage={onPage} />
        </>
    );
}
