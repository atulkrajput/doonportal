import { useState } from 'react';
import { Link } from 'react-router';
import { api, errorMessage, fieldErrors } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { ErrorState, PageLoading } from '../../components/States';
import { Counter, DESCRIPTION_LIMIT, SerpPreview, TITLE_LIMIT, useSeoPreview } from '../components/SeoBits';
import { PageIntro, SettingsForm } from './Settings';
import { Pagination, useAdminFilters } from './ResourceList';
import { formatDateTime, formatNumber, humanize } from '../lib';

const ENTITY_ADMIN = { business: 'businesses', place: 'places', event: 'events', story: 'stories', collection: 'collections', area: 'areas' };

/** Paths that accept a page-level override (others are per record). */
const PAGE_PATHS = ['/', '/businesses', '/places', '/events', '/stories', '/collections', '/areas', '/explore', '/services', '/business-portal', '/about', '/privacy', '/terms'];

function PreviewTool() {
    const [input, setInput] = useState('/');
    const [path, setPath] = useState('/');
    const seo = useSeoPreview(path, 0);

    return (
        <section className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
            <h2 className="font-semibold">Check any URL</h2>
            <p className="mt-1 text-sm text-stone-600">See exactly what search engines and social apps receive for a page on the site.</p>
            <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    const value = input.trim();
                    setPath(value.startsWith('/') ? value : `/${value.replace(/^https?:\/\/[^/]+/, '').replace(/^\//, '')}`);
                }}
            >
                <input className="input font-mono text-sm" value={input} onChange={(e) => setInput(e.target.value)} placeholder="/business/some-cafe" aria-label="Path to check" />
                <button type="submit" className="btn-primary">
                    Check
                </button>
            </form>
            <div className="mt-4">{seo ? <SerpPreview seo={seo} /> : <p className="text-sm text-stone-500">Loading…</p>}</div>
        </section>
    );
}

export function SeoSettings() {
    return (
        <div className="space-y-4">
            <PageIntro title="SEO settings">
                Site-wide defaults for titles, descriptions and share images. Every public page gets its title, description, canonical URL, robots rule, Open Graph tags and structured data from the server, so search engines see them without running JavaScript. Fine-tune single pages in{' '}
                <Link to="/admin/seo/pages" className="font-semibold text-navy-700 underline">
                    Page SEO
                </Link>{' '}
                or on each record’s edit screen.
            </PageIntro>
            <div className="flex flex-wrap gap-2 text-sm">
                <a className="btn-secondary" href="/sitemap.xml" target="_blank" rel="noreferrer">
                    sitemap.xml
                </a>
                <a className="btn-secondary" href="/robots.txt" target="_blank" rel="noreferrer">
                    robots.txt
                </a>
            </div>
            <SettingsForm
                group="seo"
                sections={[
                    {
                        title: 'Titles',
                        fields: [
                            { name: 'site_name', label: 'Site name' },
                            { name: 'title_template', label: 'Title template', help: '%s is replaced by the page title, e.g. “%s | DoonPortal”.' },
                            { name: 'home_title', label: 'Homepage title', limit: TITLE_LIMIT, full: true },
                        ],
                    },
                    {
                        title: 'Descriptions & image',
                        fields: [
                            { name: 'home_description', label: 'Homepage description', type: 'textarea', limit: DESCRIPTION_LIMIT },
                            { name: 'default_description', label: 'Fallback description', type: 'textarea', limit: DESCRIPTION_LIMIT, help: 'Used when a page has no description of its own.' },
                            { name: 'default_image_media_id', label: 'Default share image', type: 'media', full: true, help: 'Shown when a shared page has no cover image. 1200×630 px works best.' },
                        ],
                    },
                    {
                        title: 'Indexing',
                        fields: [
                            {
                                name: 'allow_indexing',
                                label: 'Allow search engines to index the site',
                                type: 'checkbox',
                                full: true,
                                help: 'Turn off on staging or before launch: every page becomes noindex, robots.txt blocks crawling and the sitemap is emptied.',
                            },
                        ],
                    },
                ]}
            />
            <PreviewTool />
        </div>
    );
}

function OverrideForm({ initial, onDone, onCancel }) {
    const editing = Boolean(initial?.id);
    const [values, setValues] = useState({
        path: initial?.path ?? '/events',
        title: initial?.title ?? '',
        description: initial?.description ?? '',
        noindex: Boolean(initial?.noindex),
    });
    const [errors, setErrors] = useState({});
    const [state, setState] = useState({ busy: false, message: null });
    const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setState({ busy: true, message: null });
        setErrors({});
        const body = { title: values.title || null, description: values.description || null, noindex: values.noindex };
        try {
            if (editing) {
                await api.patch(`/admin/seo/${initial.id}`, body);
            } else {
                await api.post('/admin/seo', { ...body, path: values.path });
            }
            onDone();
        } catch (err) {
            setErrors(fieldErrors(err));
            setState({ busy: false, message: errorMessage(err) });
        }
    };

    return (
        <form onSubmit={submit} noValidate className="space-y-3 rounded-2xl border border-navy-200 bg-white p-4">
            <h2 className="font-semibold">{editing ? `Edit ${initial.path || initial.entity_label || 'override'}` : 'New page override'}</h2>
            {!editing && (
                <div>
                    <label htmlFor="o-path" className="text-sm font-medium">
                        Page
                    </label>
                    <input id="o-path" className="input mt-1 font-mono text-sm" list="seo-paths" value={values.path} onChange={set('path')} />
                    <datalist id="seo-paths">
                        {PAGE_PATHS.map((p) => (
                            <option key={p} value={p} />
                        ))}
                    </datalist>
                    <p className="mt-1 text-xs text-stone-500">A site page (e.g. /events) or a category page (e.g. /businesses/cafes). Individual records are edited from their own screen.</p>
                    {errors.path && <p className="mt-1 text-xs text-red-700">{errors.path[0]}</p>}
                </div>
            )}
            <div>
                <div className="flex justify-between">
                    <label htmlFor="o-title" className="text-sm font-medium">
                        Title
                    </label>
                    <Counter value={values.title} limit={TITLE_LIMIT} />
                </div>
                <input id="o-title" className="input mt-1" value={values.title} onChange={set('title')} maxLength={70} />
                {errors.title && <p className="mt-1 text-xs text-red-700">{errors.title[0]}</p>}
            </div>
            <div>
                <div className="flex justify-between">
                    <label htmlFor="o-desc" className="text-sm font-medium">
                        Description
                    </label>
                    <Counter value={values.description} limit={DESCRIPTION_LIMIT} />
                </div>
                <textarea id="o-desc" className="input mt-1 min-h-20" value={values.description} onChange={set('description')} maxLength={160} />
                {errors.description && <p className="mt-1 text-xs text-red-700">{errors.description[0]}</p>}
            </div>
            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={values.noindex} onChange={set('noindex')} /> Hide from search engines (noindex)
            </label>
            <div className="flex items-center gap-3">
                <button type="submit" className="btn-primary" disabled={state.busy}>
                    {state.busy ? 'Saving…' : 'Save'}
                </button>
                <button type="button" className="btn-secondary" onClick={onCancel}>
                    Cancel
                </button>
                {state.message && <span className="text-sm text-red-700">{state.message}</span>}
            </div>
        </form>
    );
}

export function SeoPages() {
    const filters = useAdminFilters();
    const [version, setVersion] = useState(0);
    const [editing, setEditing] = useState(null);
    const { data, error, loading } = useApi('/admin/seo', { ...filters.all, v: version || undefined });

    const remove = async (row) => {
        if (!window.confirm('Remove this override? The page goes back to its automatic title and description.')) {
            return;
        }
        await api.delete(`/admin/seo/${row.id}`);
        setVersion((v) => v + 1);
    };

    return (
        <div className="space-y-4">
            <PageIntro title="Page SEO">Custom titles, descriptions and noindex rules for site pages, category pages and individual records.</PageIntro>
            <div className="flex flex-wrap items-center gap-2">
                <input className="input w-full sm:w-64" type="search" placeholder="Search path or title…" value={filters.get('q')} onChange={(e) => filters.set('q', e.target.value)} aria-label="Search overrides" />
                <select className="input w-auto" value={filters.get('type')} onChange={(e) => filters.set('type', e.target.value)} aria-label="Type">
                    <option value="">All overrides</option>
                    <option value="path">Site & category pages</option>
                    {Object.keys(ENTITY_ADMIN).map((t) => (
                        <option key={t} value={t}>
                            {humanize(t)} records
                        </option>
                    ))}
                </select>
                <button type="button" className="btn-primary ml-auto" onClick={() => setEditing({})}>
                    + New page override
                </button>
            </div>
            {editing && (
                <OverrideForm
                    key={editing.id || 'new'}
                    initial={editing}
                    onCancel={() => setEditing(null)}
                    onDone={() => {
                        setEditing(null);
                        setVersion((v) => v + 1);
                    }}
                />
            )}
            {error ? (
                <ErrorState error={error} />
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                            <tr>
                                <th className="px-3 py-2">Page / record</th>
                                <th className="px-3 py-2">Title</th>
                                <th className="px-3 py-2">Description</th>
                                <th className="px-3 py-2">Index</th>
                                <th className="px-3 py-2">Updated</th>
                                <th className="px-3 py-2">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {loading && (
                                <tr>
                                    <td colSpan={6} className="px-3 py-6 text-center text-stone-500">
                                        Loading…
                                    </td>
                                </tr>
                            )}
                            {!loading && data?.data?.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-3 py-6 text-center text-stone-500">
                                        No overrides yet — every page uses its automatic metadata.
                                    </td>
                                </tr>
                            )}
                            {!loading &&
                                data?.data?.map((row) => (
                                    <tr key={row.id} className="align-top">
                                        <td className="px-3 py-2">
                                            {row.path ? (
                                                <span className="font-mono text-xs">{row.path}</span>
                                            ) : (
                                                <Link to={`/admin/${ENTITY_ADMIN[row.entity_type]}/${row.entity_id}`} className="font-semibold text-navy-700 hover:underline">
                                                    {row.entity_label || '(deleted record)'} <span className="text-xs font-normal text-stone-500">· {row.entity_type}</span>
                                                </Link>
                                            )}
                                        </td>
                                        <td className="max-w-56 px-3 py-2">{row.title || <span className="text-stone-400">Automatic</span>}</td>
                                        <td className="max-w-72 px-3 py-2 text-stone-600">{row.description || <span className="text-stone-400">Automatic</span>}</td>
                                        <td className="px-3 py-2">{row.noindex ? <span className="text-red-700">noindex</span> : 'index'}</td>
                                        <td className="whitespace-nowrap px-3 py-2">{formatDateTime(row.updated_at)}</td>
                                        <td className="whitespace-nowrap px-3 py-2 text-right">
                                            {row.path && (
                                                <button type="button" className="mr-3 text-xs font-semibold text-navy-700 hover:underline" onClick={() => setEditing(row)}>
                                                    Edit
                                                </button>
                                            )}
                                            <button type="button" className="text-xs font-semibold text-red-700 hover:underline" onClick={() => remove(row)}>
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            )}
            <Pagination meta={data?.meta} onPage={(p) => filters.set('page', p)} />
        </div>
    );
}

function Stat({ label, value, warn }) {
    return (
        <div className={`rounded-xl px-3 py-2 ${warn && value > 0 ? 'bg-amber-50 text-amber-900' : 'bg-stone-50'}`}>
            <p className="text-xs text-stone-600">{label}</p>
            <p className="text-lg font-semibold tabular-nums">{formatNumber(value)}</p>
        </div>
    );
}

export function SeoAudit() {
    const { data, error, loading } = useApi('/admin/seo/audit');
    if (error) {
        return <ErrorState error={error} />;
    }
    if (loading || !data) {
        return <PageLoading />;
    }

    return (
        <div className="space-y-4">
            <PageIntro title="SEO audit">
                Published records whose search snippets will look weak. A description of 120–160 characters and a cover image make results and shared links far more clickable. Titles over 60 characters get cut off in Google.
            </PageIntro>
            <div className="grid gap-4 lg:grid-cols-2">
                {Object.entries(data.data).map(([type, r]) => (
                    <section key={type} className="rounded-2xl border border-stone-200 bg-white p-4">
                        <div className="flex items-baseline justify-between">
                            <h2 className="font-semibold">{humanize(type)}</h2>
                            <span className="text-sm text-stone-500">{formatNumber(r.public)} public</span>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                            <Stat label="No description" value={r.missing_description} warn />
                            <Stat label="No image" value={r.missing_image} warn />
                            <Stat label="Long titles" value={r.long_titles} warn />
                        </div>
                        {r.examples.length > 0 && (
                            <ul className="mt-3 space-y-1 text-sm">
                                {r.examples.map((e) => (
                                    <li key={e.id}>
                                        <Link to={`/admin/${ENTITY_ADMIN[type]}/${e.id}`} className="text-navy-700 hover:underline">
                                            {e.title}
                                        </Link>{' '}
                                        <span className="text-xs text-stone-500">needs a description</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                ))}
            </div>
        </div>
    );
}
