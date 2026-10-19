import { Link, useSearchParams } from 'react-router';
import { useApi } from '../../hooks/useApi';
import { ErrorState } from '../../components/States';
import { formatDateTime, humanize, statusTone } from '../lib';

function get(record, path) {
    return path.split('.').reduce((v, k) => (v == null ? v : v[k]), record);
}

export function StatusBadge({ status }) {
    if (!status) {
        return null;
    }
    return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone(status)}`}>{humanize(status)}</span>;
}

function Cell({ column, record }) {
    const value = get(record, column.key);
    if (column.status) {
        return <StatusBadge status={value} />;
    }
    if (column.boolean) {
        return value ? <span className="text-navy-700">Yes</span> : <span className="text-stone-400">No</span>;
    }
    if (column.datetime) {
        return <span className="whitespace-nowrap">{formatDateTime(value)}</span>;
    }
    return <span>{value ?? '—'}</span>;
}

export function Pagination({ meta, onPage }) {
    if (!meta || meta.last_page <= 1) {
        return null;
    }
    return (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
            <span className="text-stone-600">
                Page {meta.current_page} of {meta.last_page} · {meta.total} total
            </span>
            <div className="flex gap-2">
                <button type="button" className="btn-secondary" disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)}>
                    Previous
                </button>
                <button type="button" className="btn-secondary" disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)}>
                    Next
                </button>
            </div>
        </nav>
    );
}

/** URL-backed filter state so filtered admin views can be bookmarked and shared. */
export function useAdminFilters() {
    const [params, setParams] = useSearchParams();
    const get = (key) => params.get(key) ?? '';
    const set = (key, value) => {
        const next = new URLSearchParams(params);
        if (value === '' || value == null) {
            next.delete(key);
        } else {
            next.set(key, String(value));
        }
        if (key !== 'page') {
            next.delete('page');
        }
        setParams(next, { replace: true });
    };
    return { get, set, all: Object.fromEntries(params.entries()) };
}

function AreaFilter({ value, onChange }) {
    const { data } = useApi('/admin/areas', { per_page: 100, sort: 'name' });
    return (
        <select className="input w-auto" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Area">
            <option value="">All areas</option>
            {(data?.data || []).map((a) => (
                <option key={a.id} value={a.id}>
                    {a.name}
                </option>
            ))}
        </select>
    );
}

function Filters({ resource, filters }) {
    const select = (key, label, options) => (
        <select key={key} className="input w-auto" value={filters.get(key)} onChange={(e) => filters.set(key, e.target.value)} aria-label={label}>
            <option value="">{label}</option>
            {options.map(([v, l]) => (
                <option key={v} value={v}>
                    {l}
                </option>
            ))}
        </select>
    );

    return (
        <div className="flex flex-wrap gap-2">
            <input className="input w-full sm:w-64" type="search" placeholder="Search…" value={filters.get('q')} onChange={(e) => filters.set('q', e.target.value)} aria-label="Search" />
            {resource.filters.includes('status') && select('status', 'Any status', resource.statuses.map((s) => [s, humanize(s)]))}
            {resource.filters.includes('story_type') && select('type', 'Any type', ['STORY', 'GUIDE', 'LIST', 'NEWS', 'INTERVIEW', 'HERITAGE'].map((t) => [t, humanize(t)]))}
            {resource.filters.includes('category_type') && select('type', 'Any type', ['business', 'place', 'event', 'story'].map((t) => [t, humanize(t)]))}
            {resource.filters.includes('is_published') && select('is_published', resource.type === 'category' ? 'Active or not' : 'Published or not', [['1', 'Yes'], ['0', 'No']])}
            {resource.filters.includes('area_id') && <AreaFilter value={filters.get('area_id')} onChange={(v) => filters.set('area_id', v)} />}
            {select('sort', 'Sort: newest', (resource.sorts || [['oldest', 'Oldest'], ['name', 'Name'], ['updated', 'Recently updated']]).filter(([v]) => v !== 'newest'))}
            {resource.filters.includes('trashed') && select('trashed', 'Hide deleted', [['with', 'Include deleted'], ['only', 'Only deleted']])}
        </div>
    );
}

export default function ResourceList({ resourceKey, resource }) {
    const filters = useAdminFilters();
    const { data, error, loading } = useApi(`/admin/${resourceKey}`, filters.all);
    const rows = data?.data || [];

    return (
        <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h1 className="font-display text-2xl font-bold">{resource.label}</h1>
                <Link to={`/admin/${resourceKey}/new`} className="btn-primary">
                    + New {resource.singular.toLowerCase()}
                </Link>
            </div>
            <Filters resource={resource} filters={filters} />
            <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
                {error ? (
                    <div className="p-4">
                        <ErrorState error={error} />
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                            <tr>
                                {resource.columns.map((c) => (
                                    <th key={c.key} scope="col" className="px-3 py-2 font-semibold">
                                        {c.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100" aria-busy={loading}>
                            {loading && (
                                <tr>
                                    <td colSpan={resource.columns.length} className="px-3 py-6 text-center text-stone-500">
                                        Loading…
                                    </td>
                                </tr>
                            )}
                            {!loading && rows.length === 0 && (
                                <tr>
                                    <td colSpan={resource.columns.length} className="px-3 py-8 text-center text-stone-500">
                                        No {resource.label.toLowerCase()} match these filters.
                                    </td>
                                </tr>
                            )}
                            {!loading &&
                                rows.map((record) => (
                                    <tr key={record.id} className={record.is_trashed ? 'bg-red-50/40 text-stone-500' : 'hover:bg-stone-50'}>
                                        {resource.columns.map((c) => (
                                            <td key={c.key} className="px-3 py-2 align-top">
                                                {c.primary ? (
                                                    <Link to={`/admin/${resourceKey}/${record.id}`} className="font-semibold text-navy-700 hover:underline">
                                                        {get(record, c.key) || '(untitled)'}
                                                    </Link>
                                                ) : (
                                                    <Cell column={c} record={record} />
                                                )}
                                                {c.primary && record.is_demo && <span className="ml-2 rounded bg-accent-100 px-1.5 text-xs text-amber-800">Demo</span>}
                                                {c.primary && record.is_trashed && <span className="ml-2 rounded bg-red-100 px-1.5 text-xs text-red-800">Deleted</span>}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                )}
            </div>
            <Pagination meta={data?.meta} onPage={(p) => filters.set('page', p)} />
        </div>
    );
}
