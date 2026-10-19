import { useEffect, useState } from 'react';
import { api, errorMessage, fieldErrors } from '../../api/client';

export const TITLE_LIMIT = 60;
export const DESCRIPTION_LIMIT = 160;

/** Character counter that turns amber near the limit and red past it. */
export function Counter({ value, limit }) {
    const n = (value || '').length;
    const tone = n > limit ? 'text-red-700' : n > limit * 0.9 ? 'text-amber-700' : 'text-stone-500';
    return (
        <span className={`text-xs tabular-nums ${tone}`}>
            {n}/{limit}
        </span>
    );
}

/** Approximate Google result: blue title, green URL, grey description. */
export function SerpPreview({ seo }) {
    if (!seo) {
        return null;
    }
    let url = seo.canonical;
    try {
        const u = new URL(seo.canonical);
        url = `${u.host}${u.pathname === '/' ? '' : u.pathname.replaceAll('/', ' › ')}`;
    } catch {
        // keep raw canonical
    }
    return (
        <div className="rounded-xl border border-stone-200 bg-white p-4 font-[Arial,sans-serif]">
            <p className="truncate text-xs text-emerald-800">{url}</p>
            <p className="mt-1 line-clamp-1 text-lg leading-snug text-[#1a0dab]">{seo.title}</p>
            <p className="mt-1 line-clamp-2 text-sm text-stone-700">{seo.description}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 ${seo.robots.startsWith('index') ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>{seo.robots}</span>
                {seo.status !== 200 && <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-800">HTTP {seo.status}</span>}
                <span className={`rounded-full px-2 py-0.5 ${seo.image ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{seo.image ? 'Share image set' : 'No share image'}</span>
                <span className={`rounded-full px-2 py-0.5 ${seo.json_ld ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>
                    {seo.json_ld ? `Structured data: ${seo.json_ld['@graph'].map((n) => n['@type']).join(', ')}` : 'No structured data'}
                </span>
            </div>
        </div>
    );
}

export function useSeoPreview(path, version) {
    const [state, setState] = useState({ path: null, seo: null });
    useEffect(() => {
        if (!path) {
            return undefined;
        }
        const controller = new AbortController();
        api.get('/admin/seo/preview', { params: { path, v: version }, signal: controller.signal })
            .then((r) => setState({ path, seo: r.data.data }))
            .catch(() => {});
        return () => controller.abort();
    }, [path, version]);
    return state.path === path ? state.seo : null;
}

/** Per-record SEO override on admin edit screens (title, description, noindex). */
export function SeoPanel({ resource, record }) {
    const [loaded, setLoaded] = useState(false);
    const [meta, setMeta] = useState(null);
    const [values, setValues] = useState({ title: '', description: '', noindex: false });
    const [errors, setErrors] = useState({});
    const [state, setState] = useState({ busy: false, message: null, tone: 'ok' });
    const [version, setVersion] = useState(0);
    const publicPath = resource.publicPath && !record.is_trashed ? resource.publicPath(record) : null;
    const preview = useSeoPreview(publicPath, version);

    useEffect(() => {
        const controller = new AbortController();
        api.get(`/admin/seo/entity/${resource.type}/${record.id}`, { signal: controller.signal })
            .then((r) => {
                const m = r.data.data;
                setMeta(m);
                setValues({ title: m?.title || '', description: m?.description || '', noindex: Boolean(m?.noindex) });
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
        return () => controller.abort();
    }, [resource.type, record.id]);

    const save = async (e) => {
        e.preventDefault();
        setErrors({});
        setState({ busy: true, message: null, tone: 'ok' });
        const body = { title: values.title || null, description: values.description || null, noindex: values.noindex };
        try {
            const { data } = meta
                ? await api.patch(`/admin/seo/${meta.id}`, body)
                : await api.post('/admin/seo', { ...body, entity_type: resource.type, entity_id: record.id });
            setMeta(data.data);
            setVersion((v) => v + 1);
            setState({ busy: false, message: 'Saved.', tone: 'ok' });
        } catch (err) {
            setErrors(fieldErrors(err));
            setState({ busy: false, message: errorMessage(err), tone: 'error' });
        }
    };

    return (
        <section className="rounded-2xl border border-stone-200 bg-white p-4">
            <h2 className="font-semibold">Search & sharing</h2>
            <p className="mt-1 text-xs text-stone-500">Leave blank to use the automatic title and description.</p>
            {!loaded ? (
                <p className="mt-3 text-sm text-stone-500">Loading…</p>
            ) : (
                <form onSubmit={save} className="mt-3 space-y-3" noValidate>
                    <div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="seo-title" className="text-xs font-medium text-stone-600">
                                SEO title
                            </label>
                            <Counter value={values.title} limit={TITLE_LIMIT} />
                        </div>
                        <input id="seo-title" className="input mt-1" value={values.title} maxLength={70} onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))} />
                        {errors.title && <p className="mt-1 text-xs text-red-700">{errors.title[0]}</p>}
                    </div>
                    <div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="seo-description" className="text-xs font-medium text-stone-600">
                                Meta description
                            </label>
                            <Counter value={values.description} limit={DESCRIPTION_LIMIT} />
                        </div>
                        <textarea id="seo-description" className="input mt-1 min-h-20" value={values.description} maxLength={160} onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))} />
                        {errors.description && <p className="mt-1 text-xs text-red-700">{errors.description[0]}</p>}
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={values.noindex} onChange={(e) => setValues((v) => ({ ...v, noindex: e.target.checked }))} />
                        Hide from search engines (noindex)
                    </label>
                    <div className="flex items-center gap-3">
                        <button type="submit" className="btn-primary" disabled={state.busy}>
                            {state.busy ? 'Saving…' : 'Save SEO'}
                        </button>
                        {state.message && <span className={`text-sm ${state.tone === 'error' ? 'text-red-700' : 'text-navy-700'}`}>{state.message}</span>}
                    </div>
                </form>
            )}
            {publicPath && (
                <div className="mt-4">
                    <p className="mb-1 text-xs font-medium text-stone-600">How it appears in search</p>
                    {preview ? <SerpPreview seo={preview} /> : <p className="text-sm text-stone-500">Loading preview…</p>}
                </div>
            )}
        </section>
    );
}
