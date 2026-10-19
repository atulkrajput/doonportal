import { useEffect, useId, useRef, useState } from 'react';
import { api, errorMessage } from '../../api/client';
import { useApi } from '../../hooks/useApi';

const RELATION_LIMIT = 100;

/** Options for relation selects: the first 100 records of an admin list, sorted by name. */
function useOptions(relation, extraParams) {
    const params = { per_page: RELATION_LIMIT, sort: 'name', ...(relation.params || {}), ...(extraParams || {}) };
    const { data, loading, error } = useApi(relation.endpoint, params);
    const options = (data?.data || []).map((r) => ({ id: r.id, label: r[relation.label] || r.title || r.name || r.id }));
    return { options, loading, error, truncated: (data?.meta?.total || 0) > RELATION_LIMIT };
}

export function FieldShell({ field, error, children, id }) {
    return (
        <div className={field.span === 'full' || field.type === 'media' ? 'sm:col-span-2' : ''}>
            {field.type !== 'checkbox' && (
                <label htmlFor={id} className="mb-1 block text-sm font-medium text-stone-800">
                    {field.label}
                    {field.required && <span className="text-red-600"> *</span>}
                </label>
            )}
            {children}
            {field.help && <p className="mt-1 text-xs text-stone-500">{field.help}</p>}
            {error && (
                <p className="mt-1 text-xs text-red-700" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

function RelationSelect({ field, value, onChange, id, values }) {
    const extra = field.relation.dependsOn ? { [field.relation.dependsOn]: values?.[field.relation.dependsOn] } : undefined;
    const { options, loading, truncated } = useOptions(field.relation, extra);
    return (
        <>
            <select id={id} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} disabled={loading}>
                <option value="">{loading ? 'Loading…' : '— None —'}</option>
                {options.map((o) => (
                    <option key={o.id} value={o.id}>
                        {o.label}
                    </option>
                ))}
            </select>
            {truncated && <p className="mt-1 text-xs text-amber-700">Showing the first {RELATION_LIMIT} options.</p>}
        </>
    );
}

function RelationChecklist({ field, value, onChange }) {
    const { options, loading, truncated } = useOptions(field.relation);
    const selected = new Set(value || []);
    const toggle = (id) => {
        const next = new Set(selected);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        onChange([...next]);
    };
    if (loading) {
        return <p className="text-sm text-stone-500">Loading…</p>;
    }
    if (!options.length) {
        return <p className="text-sm text-stone-500">No options yet.</p>;
    }
    return (
        <div className="max-h-48 overflow-y-auto rounded-xl border border-stone-200 bg-white p-2">
            <div className="grid gap-1 sm:grid-cols-2">
                {options.map((o) => (
                    <label key={o.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-stone-50">
                        <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggle(o.id)} />
                        {o.label}
                    </label>
                ))}
            </div>
            {truncated && <p className="mt-1 text-xs text-amber-700">Showing the first {RELATION_LIMIT} options.</p>}
        </div>
    );
}

export function MediaField({ value, preview, onChange, id }) {
    const [current, setCurrent] = useState(preview || null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const input = useRef(null);

    const upload = async (file) => {
        if (!file) {
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const form = new FormData();
            form.append('file', file);
            const { data } = await api.post('/admin/media', form);
            setCurrent(data.data);
            onChange(data.data.id);
        } catch (e) {
            setError(e?.response?.data?.errors?.file?.[0] || errorMessage(e));
        } finally {
            setBusy(false);
            if (input.current) {
                input.current.value = '';
            }
        }
    };

    const shown = value && current && current.id === value ? current : value ? { id: value, url: preview?.url } : null;

    return (
        <div className="flex items-start gap-3">
            <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-stone-100 text-xs text-stone-500">
                {shown?.url ? <img src={shown.url} alt="" className="h-full w-full object-cover" /> : value ? 'Selected' : 'No image'}
            </div>
            <div className="space-y-2 text-sm">
                <input ref={input} id={id} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => upload(e.target.files?.[0])} disabled={busy} className="block w-full text-sm" />
                <p className="text-xs text-stone-500">JPEG, PNG, WebP or GIF, up to 5 MB.</p>
                {value && (
                    <button type="button" className="text-xs font-semibold text-red-700 hover:underline" onClick={() => onChange(null)}>
                        Remove
                    </button>
                )}
                {busy && <p className="text-xs text-stone-500">Uploading…</p>}
                {error && (
                    <p className="text-xs text-red-700" role="alert">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
}

const ENTITY_ENDPOINTS = { business: 'businesses', place: 'places', event: 'events', story: 'stories', area: 'areas' };

/** Pick {type, id} links from other admin lists (story links, collection items). */
export function EntityPicker({ types, value, onChange, withNotes = false }) {
    const [type, setType] = useState(types[0]);
    const [q, setQ] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const items = value || [];

    useEffect(() => {
        if (q.trim().length < 2) {
            return undefined;
        }
        const controller = new AbortController();
        const timer = setTimeout(() => {
            setSearching(true);
            api.get(`/admin/${ENTITY_ENDPOINTS[type]}`, { params: { q, per_page: 8 }, signal: controller.signal })
                .then((r) => setResults(r.data.data))
                .catch(() => {})
                .finally(() => setSearching(false));
        }, 250);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [q, type]);

    const add = (record) => {
        if (items.some((i) => i.type === type && i.id === record.id)) {
            return;
        }
        onChange([...items, { type, id: record.id, label: record.name || record.title, note: '' }]);
    };
    const move = (index, delta) => {
        const next = [...items];
        const target = index + delta;
        if (target < 0 || target >= next.length) {
            return;
        }
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    };

    return (
        <div className="space-y-3">
            {items.length > 0 ? (
                <ol className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
                    {items.map((item, i) => (
                        <li key={`${item.type}:${item.id}`} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                            <span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs uppercase text-stone-600">{item.type}</span>
                            <span className="min-w-0 flex-1 truncate font-medium">{item.label || item.id}</span>
                            {withNotes && (
                                <input
                                    className="input max-w-xs"
                                    placeholder="Note (optional)"
                                    value={item.note || ''}
                                    onChange={(e) => onChange(items.map((it, j) => (j === i ? { ...it, note: e.target.value } : it)))}
                                />
                            )}
                            <button type="button" className="px-1 text-stone-500 hover:text-ink" onClick={() => move(i, -1)} aria-label="Move up">
                                ↑
                            </button>
                            <button type="button" className="px-1 text-stone-500 hover:text-ink" onClick={() => move(i, 1)} aria-label="Move down">
                                ↓
                            </button>
                            <button type="button" className="text-xs font-semibold text-red-700 hover:underline" onClick={() => onChange(items.filter((_, j) => j !== i))}>
                                Remove
                            </button>
                        </li>
                    ))}
                </ol>
            ) : (
                <p className="text-sm text-stone-500">Nothing linked yet.</p>
            )}
            <div className="flex flex-wrap gap-2">
                <select className="input w-auto" value={type} onChange={(e) => setType(e.target.value)} aria-label="Type to add">
                    {types.map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </select>
                <input className="input min-w-0 flex-1" placeholder={`Search ${ENTITY_ENDPOINTS[type]} to add…`} value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {q.trim().length >= 2 && (
                <ul className="rounded-xl border border-stone-200 bg-white text-sm">
                    {searching && <li className="px-3 py-2 text-stone-500">Searching…</li>}
                    {!searching && results.length === 0 && <li className="px-3 py-2 text-stone-500">No matches.</li>}
                    {results.map((r) => (
                        <li key={r.id}>
                            <button type="button" className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-stone-50" onClick={() => add(r)}>
                                <span>{r.name || r.title}</span>
                                <span className="text-xs text-stone-500">{r.status || ''} + Add</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function Repeater({ field, value, onChange, errors }) {
    const rows = value || [];
    const update = (i, key, v) => onChange(rows.map((row, j) => (j === i ? { ...row, [key]: v } : row)));
    return (
        <div className="space-y-2">
            {rows.map((row, i) => (
                <div key={i} className="grid items-end gap-2 rounded-xl border border-stone-200 bg-white p-3 sm:grid-cols-[repeat(auto-fit,minmax(8rem,1fr))_auto]">
                    {field.fields.map((sub) => {
                        const subError = errors?.[`${field.name}.${i}.${sub.name}`]?.[0];
                        return (
                            <div key={sub.name}>
                                <label className="mb-1 block text-xs font-medium text-stone-600">{sub.label}</label>
                                <Input field={sub} value={row[sub.name]} onChange={(v) => update(i, sub.name, v)} />
                                {subError && <p className="mt-1 text-xs text-red-700">{subError}</p>}
                            </div>
                        );
                    })}
                    <button type="button" className="text-xs font-semibold text-red-700 hover:underline" onClick={() => onChange(rows.filter((_, j) => j !== i))}>
                        Remove
                    </button>
                </div>
            ))}
            <button type="button" className="btn-secondary" onClick={() => onChange([...rows, { ...field.newRow }])}>
                + Add row
            </button>
        </div>
    );
}

/** A bare input for simple field types (also used inside repeater rows). */
export function Input({ field, value, onChange, id, disabled }) {
    switch (field.type) {
        case 'textarea':
            return <textarea id={id} className="input min-h-24" value={value ?? ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} />;
        case 'html':
            return <textarea id={id} className="input min-h-72 font-mono text-xs" value={value ?? ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} spellCheck />;
        case 'checkbox':
            return (
                <label className="flex items-center gap-2 text-sm font-medium text-stone-800">
                    <input id={id} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
                    {field.label}
                </label>
            );
        case 'select':
            return (
                <select
                    id={id}
                    className="input"
                    value={value ?? ''}
                    onChange={(e) => onChange(e.target.value === '' ? null : field.number ? Number(e.target.value) : e.target.value)}
                    disabled={disabled}
                >
                    {field.options.map(([v, label]) => (
                        <option key={String(v)} value={v}>
                            {label}
                        </option>
                    ))}
                </select>
            );
        case 'number':
            return <input id={id} type="number" step={field.step || '1'} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} disabled={disabled} />;
        case 'money':
            return (
                <input
                    id={id}
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    value={value == null ? '' : value / 100}
                    onChange={(e) => onChange(e.target.value === '' ? null : Math.round(Number(e.target.value) * 100))}
                    disabled={disabled}
                />
            );
        case 'tags':
            return (
                <input
                    id={id}
                    className="input"
                    value={(value || []).join(', ')}
                    onChange={(e) =>
                        onChange(
                            e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter((s, i, all) => s !== '' || i === all.length - 1),
                        )
                    }
                    disabled={disabled}
                />
            );
        case 'datetime':
            return <input id={id} type="datetime-local" className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} disabled={disabled} />;
        case 'date':
            return <input id={id} type="date" className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} disabled={disabled} />;
        case 'time':
            return <input id={id} type="time" className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} disabled={disabled} />;
        default:
            return <input id={id} type={field.type === 'text' ? 'text' : field.type} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} />;
    }
}

export function Field({ field, value, onChange, error, errors, record, values, disabled }) {
    const id = useId();
    let control;
    switch (field.type) {
        case 'relation':
            control = <RelationSelect field={field} value={value} onChange={onChange} id={id} values={values} />;
            break;
        case 'relations':
            control = <RelationChecklist field={field} value={value} onChange={onChange} />;
            break;
        case 'media':
            control = <MediaField value={value} preview={record?.[field.preview]} onChange={onChange} id={id} />;
            break;
        case 'repeater':
            control = <Repeater field={field} value={value} onChange={onChange} errors={errors} />;
            break;
        case 'entities':
            control = <EntityPicker types={field.types} value={value} onChange={onChange} />;
            break;
        default:
            control = <Input field={field} value={value} onChange={onChange} id={id} disabled={disabled} />;
    }
    return (
        <FieldShell field={field} error={error} id={id}>
            {control}
        </FieldShell>
    );
}
