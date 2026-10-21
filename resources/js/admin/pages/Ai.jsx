import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api, errorMessage, fieldErrors } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { ErrorState, PageLoading } from '../../components/States';
import { DAYS } from '../../lib/format';
import { Pagination, useAdminFilters } from './ResourceList';
import { formatDateTime, formatNumber, humanize } from '../lib';

const KEY_LABELS = {
    groq_api_key: ['Groq API key', 'console.groq.com → API Keys'],
    openai_api_key: ['OpenAI API key', 'platform.openai.com → API keys'],
    tavily_api_key: ['Tavily API key (web search)', 'app.tavily.com → API keys. Free tier: 1,000 searches a month.'],
};

const FLAG_TEXT = {
    healthcare: 'Healthcare: check registration and details carefully',
    not_a_business: 'AI: may not be a business',
    wrong_category: 'AI: may be the wrong category',
    may_be_closed: 'AI: may have closed',
    chain_or_atm: 'AI: chain outlet / ATM',
};

function KeyField({ name, state, value, onChange, clear, onClear }) {
    const [label, help] = KEY_LABELS[name];
    return (
        <div>
            <label className="block">
                <span className="text-sm font-medium text-stone-700">{label}</span>
                <input
                    type="password"
                    autoComplete="off"
                    className="input mt-1"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={state.set ? `Saved (${state.hint}). Type to replace.` : 'Not set'}
                    disabled={clear}
                />
            </label>
            <p className="mt-1 text-xs text-stone-500">
                {state.set && state.source === 'env' ? 'Currently from the server .env file. ' : ''}
                {help}
            </p>
            {state.set && state.source === 'admin' && (
                <label className="mt-1 flex items-center gap-2 text-xs text-stone-600">
                    <input type="checkbox" checked={clear} onChange={(e) => onClear(e.target.checked)} /> Remove this key
                </label>
            )}
        </div>
    );
}

export function AiSettingsPage() {
    const { data, error, loading } = useApi('/admin/ai/settings');
    const [form, setForm] = useState(null);
    const [keys, setKeys] = useState({ groq_api_key: '', openai_api_key: '', tavily_api_key: '' });
    const [clear, setClear] = useState([]);
    const [state, setState] = useState({ busy: false, message: null, errors: {} });
    const [test, setTest] = useState(null);

    if (error) {
        return <ErrorState error={error} />;
    }
    if (loading || !data) {
        return <PageLoading />;
    }
    const current = form ?? data.data;
    const meta = data.data.meta;
    const keyState = (form ?? data.data).keys;
    const set = (k, v) => setForm({ ...current, [k]: v });

    const save = async (e) => {
        e.preventDefault();
        setState({ busy: true, message: null, errors: {} });
        try {
            const payload = {
                provider: current.provider,
                groq_model: current.groq_model,
                openai_model: current.openai_model,
                discovery_enabled: Boolean(current.discovery_enabled),
                per_category_limit: Number(current.per_category_limit),
                use_web_search: Boolean(current.use_web_search),
                ...keys,
                clear,
            };
            const { data: saved } = await api.put('/admin/ai/settings', payload);
            setForm(saved.data);
            setKeys({ groq_api_key: '', openai_api_key: '', tavily_api_key: '' });
            setClear([]);
            setState({ busy: false, message: { type: 'success', text: 'AI settings saved.' }, errors: {} });
        } catch (err) {
            setState({ busy: false, message: { type: 'error', text: errorMessage(err) }, errors: fieldErrors(err) });
        }
    };

    const runTest = async () => {
        setTest({ busy: true });
        try {
            const { data: r } = await api.post('/admin/ai/settings/test');
            setTest(r.data);
        } catch (err) {
            setTest({ error: errorMessage(err) });
        }
    };

    const maxDaily = Number(current.per_category_limit || 0) * meta.categories;

    return (
        <form onSubmit={save} className="max-w-3xl space-y-6">
            <div>
                <h1 className="font-display text-2xl font-bold">AI settings</h1>
                <p className="text-sm text-stone-600">The AI provider used by the data engine, and the nightly discovery of new Dehradun businesses.</p>
            </div>
            {state.message && (
                <p role={state.message.type === 'error' ? 'alert' : 'status'} className={`rounded-xl p-3 text-sm ${state.message.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>
                    {state.message.text}
                </p>
            )}

            <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
                <h2 className="font-semibold">AI provider</h2>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Provider">
                    {[
                        ['groq', 'Groq', 'Fast and low cost (Llama models)'],
                        ['openai', 'OpenAI', 'GPT models'],
                    ].map(([value, label, help]) => (
                        <label key={value} className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm ${current.provider === value ? 'border-navy-600 bg-navy-50' : 'border-stone-200'}`}>
                            <input type="radio" name="provider" className="mt-0.5" checked={current.provider === value} onChange={() => set('provider', value)} />
                            <span>
                                <span className="font-semibold">{label}</span>
                                <span className="block text-xs text-stone-500">{help}</span>
                            </span>
                        </label>
                    ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                        <span className="text-sm font-medium text-stone-700">Groq model</span>
                        <input className="input mt-1" value={current.groq_model ?? ''} onChange={(e) => set('groq_model', e.target.value)} />
                        {state.errors.groq_model && <span className="text-sm text-red-700">{state.errors.groq_model[0]}</span>}
                    </label>
                    <label className="block">
                        <span className="text-sm font-medium text-stone-700">OpenAI model</span>
                        <input className="input mt-1" value={current.openai_model ?? ''} onChange={(e) => set('openai_model', e.target.value)} />
                        {state.errors.openai_model && <span className="text-sm text-red-700">{state.errors.openai_model[0]}</span>}
                    </label>
                    {['groq_api_key', 'openai_api_key'].map((k) => (
                        <KeyField
                            key={k}
                            name={k}
                            state={keyState[k]}
                            value={keys[k]}
                            onChange={(v) => setKeys({ ...keys, [k]: v })}
                            clear={clear.includes(k)}
                            onClear={(on) => setClear(on ? [...clear, k] : clear.filter((c) => c !== k))}
                        />
                    ))}
                </div>
                <p className="text-xs text-stone-500">Keys are encrypted and never shown again in full. Daily AI budget: {formatNumber(meta.daily_token_budget)} tokens; AI steps pause when it is used up.</p>
            </section>

            <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
                <h2 className="font-semibold">Daily business discovery</h2>
                <label className="flex items-start gap-3 text-sm">
                    <input type="checkbox" className="mt-1 h-4 w-4" checked={Boolean(current.discovery_enabled)} onChange={(e) => set('discovery_enabled', e.target.checked)} />
                    <span>
                        <span className="font-semibold">Run every night at {meta.run_time}</span>
                        <span className="block text-stone-600">Finds Dehradun businesses DoonPortal doesn’t list yet and puts them in AI discoveries for your team to approve. Nothing is published automatically.</span>
                    </span>
                </label>
                <label className="block max-w-xs">
                    <span className="text-sm font-medium text-stone-700">New businesses per category per night</span>
                    <input type="number" min={1} max={meta.max_per_category} className="input mt-1" value={current.per_category_limit} onChange={(e) => set('per_category_limit', e.target.value)} />
                    {state.errors.per_category_limit && <span className="text-sm text-red-700">{state.errors.per_category_limit[0]}</span>}
                    <span className="mt-1 block text-xs text-stone-500">
                        At most {formatNumber(maxDaily)} a night across {meta.categories} categories. Usually fewer: only businesses not already listed are added.
                    </span>
                </label>
                <label className="flex items-start gap-3 text-sm">
                    <input type="checkbox" className="mt-1 h-4 w-4" checked={Boolean(current.use_web_search)} onChange={(e) => set('use_web_search', e.target.checked)} />
                    <span>
                        <span className="font-semibold">Top up from web search</span>
                        <span className="block text-stone-600">When OpenStreetMap has too few for a category, search the web and let the AI pick out businesses the pages name. Needs a Tavily key and an AI key.</span>
                    </span>
                </label>
                <KeyField
                    name="tavily_api_key"
                    state={keyState.tavily_api_key}
                    value={keys.tavily_api_key}
                    onChange={(v) => setKeys({ ...keys, tavily_api_key: v })}
                    clear={clear.includes('tavily_api_key')}
                    onClear={(on) => setClear(on ? [...clear, 'tavily_api_key'] : clear.filter((c) => c !== 'tavily_api_key'))}
                />
                <p className="text-xs text-stone-500">
                    Needs the server’s scheduler cron (every minute: <code>php artisan schedule:run</code>). Listings from OpenStreetMap are credited “© OpenStreetMap contributors”.
                </p>
            </section>

            <div className="flex flex-wrap items-center gap-3">
                <button type="submit" className="btn-primary" disabled={state.busy}>
                    {state.busy ? 'Saving…' : 'Save settings'}
                </button>
                <button type="button" className="btn-secondary" onClick={runTest} disabled={test?.busy}>
                    {test?.busy ? 'Testing…' : 'Test saved keys'}
                </button>
            </div>
            {test && !test.busy && (
                <div className="space-y-1 rounded-xl border border-stone-200 bg-white p-3 text-sm">
                    {test.error && <p className="text-red-700">{test.error}</p>}
                    {test.ai && <p className={test.ai.ok ? 'text-emerald-800' : 'text-red-700'}>AI: {test.ai.message}</p>}
                    {test.web_search && <p className={test.web_search.ok ? 'text-emerald-800' : 'text-red-700'}>Web search: {test.web_search.message}</p>}
                    {!test.error && !test.web_search && <p className="text-stone-500">Web search: no Tavily key saved.</p>}
                    {test.models && (
                        <div className="mt-2 border-t border-stone-100 pt-2">
                            {test.models.current_available ? (
                                <p className="text-emerald-800">Model “{test.models.current}” is available for this key.</p>
                            ) : (
                                <p className="font-semibold text-red-700">
                                    Model “{test.models.current}” isn’t available for this key (it may have been retired). Pick one below, then Save settings and test again.
                                </p>
                            )}
                            <p className="mt-1 text-xs text-stone-500">Models this key can use:</p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                                {test.models.available.map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => set(`${test.models.provider}_model`, m)}
                                        className={`rounded-full border px-2 py-0.5 text-xs ${current[`${test.models.provider}_model`] === m ? 'border-navy-600 bg-navy-50 font-semibold text-navy-700' : 'border-stone-300 hover:border-navy-500'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </form>
    );
}

function DiscoveryCard({ item, selected, onSelect, onChanged }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(null);
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState(null);
    const d = item.data || {};
    const flags = item.ai?.flags || [];

    const act = async (action, request) => {
        setBusy(action);
        setError(null);
        try {
            const { data } = await request();
            onChanged(data.data);
            setEditing(false);
        } catch (err) {
            const fe = fieldErrors(err);
            setError(Object.values(fe)[0]?.[0] || errorMessage(err));
        } finally {
            setBusy(null);
        }
    };

    const field = (name, label, props = {}) => (
        <label className="block">
            <span className="text-xs font-medium text-stone-600">{label}</span>
            <input className="input mt-0.5" value={draft[name] ?? ''} onChange={(e) => setDraft({ ...draft, [name]: e.target.value })} {...props} />
        </label>
    );

    const hours = (d.hours || []).reduce((acc, h) => {
        acc[h.day_of_week] = h.is_closed ? 'Closed' : [acc[h.day_of_week], `${h.opens_at}–${h.closes_at}`].filter((x) => x && x !== 'Closed').join(', ');
        return acc;
    }, {});

    return (
        <li className={`rounded-2xl border bg-white p-4 ${selected ? 'border-navy-500 ring-1 ring-navy-500' : 'border-stone-200'}`}>
            <div className="flex items-start gap-3">
                {item.status === 'PENDING' && <input type="checkbox" className="mt-1.5 h-4 w-4" checked={selected} onChange={(e) => onSelect(e.target.checked)} aria-label={`Select ${item.name}`} />}
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-lg font-bold">{item.name}</p>
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold">{item.category?.name ?? 'No category'}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.source === 'osm' ? 'bg-emerald-100 text-emerald-900' : 'bg-navy-50 text-navy-700'}`}>{item.source === 'osm' ? 'OpenStreetMap' : 'Web search'}</span>
                        {item.ai?.confidence != null && <span className="text-xs text-stone-500">AI confidence {Math.round(item.ai.confidence * 100)}%</span>}
                        {item.status !== 'PENDING' && <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-semibold">{humanize(item.status)}</span>}
                    </div>
                    {flags.length > 0 && (
                        <ul className="mt-1 flex flex-wrap gap-1.5">
                            {flags.map((f) => (
                                <li key={f} className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">
                                    {FLAG_TEXT[f] || f}
                                </li>
                            ))}
                        </ul>
                    )}

                    {editing ? (
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            {field('name', 'Name')}
                            {field('address_line', 'Address')}
                            {field('locality', 'Locality')}
                            {field('pincode', 'PIN code')}
                            {field('phone', 'Phone')}
                            {field('website', 'Website', { type: 'url' })}
                            <label className="block sm:col-span-2">
                                <span className="text-xs font-medium text-stone-600">Description</span>
                                <textarea className="input mt-0.5" rows={2} value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
                            </label>
                        </div>
                    ) : (
                        <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[110px_1fr]">
                            {d.description && (
                                <>
                                    <dt className="text-stone-500">About</dt>
                                    <dd>{d.description}</dd>
                                </>
                            )}
                            <dt className="text-stone-500">Address</dt>
                            <dd>{[d.address_line, d.locality, d.pincode].filter(Boolean).join(', ') || '—'}</dd>
                            <dt className="text-stone-500">Contact</dt>
                            <dd className="break-all">{[d.phone, d.email, d.website].filter(Boolean).join(' · ') || '—'}</dd>
                            {Object.keys(hours).length > 0 && (
                                <>
                                    <dt className="text-stone-500">Hours</dt>
                                    <dd className="text-xs">
                                        {DAYS.map((day, i) => hours[i] && `${day.slice(0, 3)} ${hours[i]}`)
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </dd>
                                </>
                            )}
                            {d.cuisine && (
                                <>
                                    <dt className="text-stone-500">Cuisine</dt>
                                    <dd>{d.cuisine}</dd>
                                </>
                            )}
                            <dt className="text-stone-500">Source</dt>
                            <dd>
                                <a href={item.evidence?.url} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-navy-700 underline">
                                    {item.evidence?.url}
                                </a>
                                {d.latitude != null && (
                                    <>
                                        {' · '}
                                        <a href={`https://www.openstreetmap.org/?mlat=${d.latitude}&mlon=${d.longitude}#map=18/${d.latitude}/${d.longitude}`} target="_blank" rel="noopener noreferrer" className="text-navy-700 underline">
                                            map
                                        </a>
                                    </>
                                )}
                            </dd>
                            {item.evidence?.snippet && (
                                <>
                                    <dt className="text-stone-500">Page says</dt>
                                    <dd className="text-xs italic text-stone-600">“{item.evidence.snippet}”</dd>
                                </>
                            )}
                        </dl>
                    )}

                    {item.business && (
                        <p className="mt-2 text-sm">
                            Published as{' '}
                            <Link to={`/admin/businesses/${item.business.id}`} className="font-semibold text-navy-700 underline">
                                {item.business.name}
                            </Link>
                        </p>
                    )}
                    {item.duplicate_of && <p className="mt-2 text-sm">Duplicate of {item.duplicate_of.name}</p>}
                    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}

                    {item.status === 'PENDING' && (
                        <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
                            {editing ? (
                                <>
                                    <button type="button" className="btn-primary" disabled={Boolean(busy)} onClick={() => act('save', () => api.patch(`/admin/ai/discoveries/${item.id}`, draft))}>
                                        {busy === 'save' ? 'Saving…' : 'Save changes'}
                                    </button>
                                    <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button type="button" className="btn-primary" disabled={Boolean(busy)} onClick={() => act('approve', () => api.post(`/admin/ai/discoveries/${item.id}/approve`))}>
                                        {busy === 'approve' ? 'Publishing…' : 'Approve & publish'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => {
                                            setDraft({ name: item.name, description: d.description, address_line: d.address_line, locality: d.locality, pincode: d.pincode, phone: d.phone, website: d.website });
                                            setEditing(true);
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button type="button" className="btn-secondary hover:!border-red-600 hover:!text-red-700" disabled={Boolean(busy)} onClick={() => act('reject', () => api.post(`/admin/ai/discoveries/${item.id}/reject`))}>
                                        Reject
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </li>
    );
}

export function AiDiscoveries() {
    const filters = useAdminFilters();
    const [version, setVersion] = useState(0);
    const [selected, setSelected] = useState([]);
    const [updated, setUpdated] = useState({});
    const [bulk, setBulk] = useState(null);
    const status = filters.get('status') || 'PENDING';
    const { data, error, loading } = useApi('/admin/ai/discoveries', { ...filters.all, status, per_page: 25, v: version || undefined });
    const { data: categories } = useApi('/admin/categories', { type: 'business', per_page: 100, sort: 'name' });
    const items = (data?.data || []).map((i) => updated[i.id] || i);
    const pending = items.filter((i) => i.status === 'PENDING');

    const runBulk = async (action) => {
        setBulk({ busy: action });
        try {
            const { data: r } = await api.post('/admin/ai/discoveries/bulk', { action, ids: selected });
            setBulk({ result: r.data, action });
            setSelected([]);
            setUpdated({});
            setVersion((v) => v + 1);
        } catch (err) {
            setBulk({ error: errorMessage(err) });
        }
    };

    return (
        <div>
            <h1 className="font-display text-2xl font-bold">AI discoveries</h1>
            <p className="mb-4 text-sm text-stone-600">
                Businesses the nightly run found that DoonPortal doesn’t list yet. Check each against its source. Approving publishes it as Unverified, credited to the source; verify it later as usual.
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
                {['PENDING', 'APPROVED', 'REJECTED', 'DUPLICATE', 'ALL'].map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => filters.set('status', s === 'PENDING' ? '' : s)}
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${status === s ? 'bg-navy-700 text-white' : 'border border-stone-300 bg-white'}`}
                    >
                        {s === 'ALL' ? 'All' : humanize(s)}
                        {data?.counts?.[s] != null && <span className="ml-1 opacity-70">{data.counts[s]}</span>}
                    </button>
                ))}
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
                <input className="input w-full sm:w-56" placeholder="Search name" value={filters.get('q')} onChange={(e) => filters.set('q', e.target.value)} aria-label="Search name" />
                <select className="input w-auto" value={filters.get('category_id')} onChange={(e) => filters.set('category_id', e.target.value)} aria-label="Category">
                    <option value="">All categories</option>
                    {(categories?.data || []).map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <select className="input w-auto" value={filters.get('source')} onChange={(e) => filters.set('source', e.target.value)} aria-label="Source">
                    <option value="">All sources</option>
                    <option value="osm">OpenStreetMap</option>
                    <option value="web">Web search</option>
                </select>
            </div>

            {pending.length > 0 && (
                <div className="sticky top-16 z-10 mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200 bg-white/95 p-3 backdrop-blur">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={selected.length === pending.length}
                            onChange={(e) => setSelected(e.target.checked ? pending.map((i) => i.id) : [])}
                        />
                        Select all on this page
                    </label>
                    <span className="text-sm text-stone-500">{selected.length} selected</span>
                    <button type="button" className="btn-primary ml-auto" disabled={!selected.length || Boolean(bulk?.busy)} onClick={() => runBulk('approve')}>
                        {bulk?.busy === 'approve' ? 'Publishing…' : 'Approve selected'}
                    </button>
                    <button type="button" className="btn-secondary" disabled={!selected.length || Boolean(bulk?.busy)} onClick={() => runBulk('reject')}>
                        Reject selected
                    </button>
                </div>
            )}
            {bulk?.result && (
                <div role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                    {bulk.action === 'approve' ? 'Published' : 'Rejected'} {bulk.result.done}.
                    {bulk.result.failed.length > 0 && <> Not done: {bulk.result.failed.map((f) => `${f.name} (${f.error})`).join('; ')}.</>}
                </div>
            )}
            {bulk?.error && <p role="alert" className="mb-4 text-sm text-red-700">{bulk.error}</p>}

            {error && <ErrorState error={error} />}
            {loading && !data && <p className="text-sm text-stone-500">Loading…</p>}
            {data && !items.length && (
                <p className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-600">
                    Nothing here. New finds arrive after the nightly run, or use <Link to="/admin/ai/runs" className="underline">Run now</Link>.
                </p>
            )}
            <ul className="space-y-3">
                {items.map((item) => (
                    <DiscoveryCard
                        key={item.id}
                        item={item}
                        selected={selected.includes(item.id)}
                        onSelect={(on) => setSelected(on ? [...selected, item.id] : selected.filter((s) => s !== item.id))}
                        onChanged={(next) => {
                            setUpdated((u) => ({ ...u, [next.id]: next }));
                            setSelected((s) => s.filter((id) => id !== next.id || next.status === 'PENDING'));
                        }}
                    />
                ))}
            </ul>
            <Pagination meta={data?.meta} onPage={(p) => filters.set('page', p)} />
        </div>
    );
}

function ago(iso) {
    if (!iso) {
        return 'never';
    }
    const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if (seconds < 90) {
        return `${seconds} seconds ago`;
    }
    if (seconds < 5400) {
        return `${Math.round(seconds / 60)} minutes ago`;
    }
    if (seconds < 129600) {
        return `${Math.round(seconds / 3600)} hours ago`;
    }
    return `${Math.round(seconds / 86400)} days ago`;
}

function StatusCard({ tone, title, children }) {
    const tones = {
        good: 'border-emerald-200 bg-emerald-50',
        bad: 'border-red-200 bg-red-50',
        neutral: 'border-stone-200 bg-white',
    };
    const dots = { good: 'bg-emerald-500', bad: 'bg-red-500', neutral: 'bg-stone-400' };
    return (
        <section className={`rounded-2xl border p-4 text-sm ${tones[tone]}`}>
            <h2 className="flex items-center gap-2 font-semibold">
                <span className={`h-2.5 w-2.5 rounded-full ${dots[tone]}`} aria-hidden="true" />
                {title}
            </h2>
            <div className="mt-2 space-y-1 text-stone-700">{children}</div>
        </section>
    );
}

export function AiRuns() {
    const filters = useAdminFilters();
    const [version, setVersion] = useState(0);
    const [category, setCategory] = useState('');
    const [state, setState] = useState(null);
    const [copied, setCopied] = useState(false);
    const { data, error, loading } = useApi('/admin/ai/runs', { ...filters.all, v: version || undefined });
    const { data: statusData } = useApi('/admin/ai/runs/status', { v: version || undefined });
    const { data: settings } = useApi('/admin/ai/settings');
    const status = statusData?.data;
    const active = status?.active;

    // While a run is going, refresh every 15 seconds to follow it.
    useEffect(() => {
        if (!active) {
            return undefined;
        }
        const timer = window.setInterval(() => setVersion((v) => v + 1), 15000);
        return () => window.clearInterval(timer);
    }, [active]);

    const runNow = async () => {
        if (!window.confirm('Run today’s discovery now? You can do this once a day. It takes a few minutes; this page updates as it goes.')) {
            return;
        }
        setState({ busy: true });
        try {
            await api.post('/admin/ai/runs', category ? { category_slug: category } : {});
            setState({ message: 'Started. Found businesses appear in AI discoveries as it goes.' });
            setVersion((v) => v + 1);
        } catch (err) {
            setState({ error: fieldErrors(err).run?.[0] || errorMessage(err) });
        }
    };

    const copyCommand = async () => {
        try {
            await navigator.clipboard.writeText(status.cron.command);
            setCopied(true);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div>
            <h1 className="font-display text-2xl font-bold">Discovery runs</h1>
            <p className="mb-4 text-sm text-stone-600">
                {settings?.data?.discovery_enabled
                    ? `Up to ${settings.data.per_category_limit} new businesses per category each night.`
                    : 'The nightly run is switched off.'}{' '}
                <Link to="/admin/ai/settings" className="underline">
                    AI settings
                </Link>
            </p>

            {status && (
                <div className="mb-4 grid gap-3 lg:grid-cols-3">
                    <StatusCard tone={status.cron.healthy ? 'good' : 'bad'} title={status.cron.healthy ? 'Cron is running' : 'Cron is not running'}>
                        <p>Scheduler last ran: {status.cron.last_seen_at ? `${ago(status.cron.last_seen_at)} (${formatDateTime(status.cron.last_seen_at)})` : 'never'}.</p>
                        {!status.cron.healthy && (
                            <>
                                <p>The nightly run needs it. In cPanel → Cron Jobs, add this to run every minute:</p>
                                <code className="block break-all rounded bg-white p-2 text-xs">{status.cron.command}</code>
                                <button type="button" className="text-xs font-semibold text-navy-700 underline" onClick={copyCommand}>
                                    {copied ? 'Copied' : 'Copy command'}
                                </button>
                            </>
                        )}
                    </StatusCard>
                    <StatusCard
                        tone={!status.nightly.enabled ? 'neutral' : status.nightly.last?.status === 'failed' ? 'bad' : 'good'}
                        title={status.nightly.enabled ? 'Nightly run is on' : 'Nightly run is off'}
                    >
                        {status.nightly.enabled && <p>Next: {formatDateTime(status.nightly.next_at)}.</p>}
                        <p>
                            Last nightly run:{' '}
                            {status.nightly.last
                                ? `${formatDateTime(status.nightly.last.started_at || status.nightly.last.created_at)}, ${humanize(status.nightly.last.status).toLowerCase()}, ${status.nightly.last.found_count} found`
                                : 'none yet'}
                            .
                        </p>
                        {!status.nightly.enabled && (
                            <p>
                                Switch it on in{' '}
                                <Link to="/admin/ai/settings" className="underline">
                                    AI settings
                                </Link>
                                .
                            </p>
                        )}
                    </StatusCard>
                    <StatusCard tone={active ? 'neutral' : status.manual.can_run ? 'good' : 'neutral'} title="Run manually (once a day)">
                        {active ? (
                            <p className="font-semibold text-amber-800">
                                A run is in progress (started {ago(active.started_at || active.created_at)}), {active.found_count} found so far.
                            </p>
                        ) : status.manual.today ? (
                            <p>
                                Used today at {formatDateTime(status.manual.today.created_at)}: {humanize(status.manual.today.status).toLowerCase()}, {status.manual.today.found_count} found.
                            </p>
                        ) : (
                            <p>Starts straight away, even if the cron isn’t set up.</p>
                        )}
                        {status.manual.can_run && (
                            <div className="flex flex-wrap items-end gap-2 pt-1">
                                <label className="block">
                                    <span className="text-xs text-stone-600">Category (optional)</span>
                                    <input className="input mt-0.5 w-40" placeholder="All, or e.g. cafes" value={category} onChange={(e) => setCategory(e.target.value.trim())} />
                                </label>
                                <button type="button" className="btn-primary" disabled={state?.busy} onClick={runNow}>
                                    {state?.busy ? 'Starting…' : 'Run today’s discovery'}
                                </button>
                            </div>
                        )}
                        {!status.manual.can_run && !active && <p className="text-xs text-stone-500">{status.manual.reason}</p>}
                        {state?.message && <p className="text-emerald-800">{state.message}</p>}
                        {state?.error && <p className="text-red-700">{state.error}</p>}
                    </StatusCard>
                </div>
            )}

            {error && <ErrorState error={error} />}
            {loading && !data && <p className="text-sm text-stone-500">Loading…</p>}
            <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                        <tr>
                            <th className="px-3 py-2">Started</th>
                            <th className="px-3 py-2">Trigger</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Found</th>
                            <th className="px-3 py-2">AI tokens</th>
                            <th className="px-3 py-2">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 align-top">
                        {(data?.data || []).map((r) => {
                            const errors = Object.entries(r.stats || {}).flatMap(([slug, s]) => (s.errors || []).map((e) => `${slug}: ${e}`));
                            return (
                                <tr key={r.id}>
                                    <td className="whitespace-nowrap px-3 py-2">{formatDateTime(r.started_at || r.created_at)}</td>
                                    <td className="px-3 py-2">
                                        {humanize(r.trigger)}
                                        {r.requested_by && <span className="block text-xs text-stone-500">by {r.requested_by}</span>}
                                        {r.category_slug && <span className="block text-xs text-stone-500">{r.category_slug} only</span>}
                                    </td>
                                    <td className={`px-3 py-2 font-semibold ${r.status === 'failed' ? 'text-red-700' : r.status === 'completed' ? 'text-emerald-800' : 'text-amber-800'}`}>{humanize(r.status)}</td>
                                    <td className="px-3 py-2 tabular-nums">{r.found_count}</td>
                                    <td className="px-3 py-2 tabular-nums">{formatNumber(r.ai_tokens)}</td>
                                    <td className="px-3 py-2 text-xs text-stone-600">
                                        {r.error && <p className={r.status === 'failed' ? 'text-red-700' : 'text-amber-800'}>{r.error}</p>}
                                        {Object.entries(r.stats || {})
                                            .filter(([, s]) => s.queued > 0)
                                            .map(([slug, s]) => `${slug} ${s.queued}`)
                                            .join(' · ')}
                                        {errors.length > 0 && <p className="mt-1 text-amber-800">{errors.slice(0, 3).join(' · ')}{errors.length > 3 ? ` (+${errors.length - 3} more)` : ''}</p>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <Pagination meta={data?.meta} onPage={(p) => filters.set('page', p)} />
        </div>
    );
}
