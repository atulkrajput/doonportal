import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import DOMPurify from 'dompurify';
import { api, errorMessage, fieldErrors } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { ErrorState, PageLoading } from '../../components/States';
import { EntityPicker, Field } from '../components/Fields';
import { SeoPanel } from '../components/SeoBits';
import { StatusBadge } from './ResourceList';
import { useStaff } from '../StaffContext';
import { PERMISSIONS, TRANSITIONS, can, formatDateTime, humanize, toLocalInput } from '../lib';

const EMPTY_BY_TYPE = { repeater: [], entities: [], relations: [], tags: [], checkbox: false };
const ANNOUNCED = ['PUBLISHED', 'CANCELLED'];
/** Record types with public pages, which get the Search & sharing panel. */
const SEO_TYPES = ['business', 'place', 'event', 'story', 'collection', 'area'];

function initialValues(resource, record) {
    const values = {};
    for (const f of resource.fields) {
        if (!record) {
            values[f.name] = resource.defaults?.[f.name] ?? EMPTY_BY_TYPE[f.type] ?? '';
        } else if (f.fromRecord) {
            values[f.name] = f.fromRecord(record);
        } else if (f.type === 'relations') {
            values[f.name] = (record[f.from] || []).map((r) => r.id);
        } else if (f.type === 'repeater') {
            values[f.name] = (record[f.from || f.name] || []).map((row) =>
                Object.fromEntries(f.fields.map((s) => [s.name, s.type === 'time' && row[s.name] ? row[s.name].slice(0, 5) : row[s.name] ?? null])),
            );
        } else if (f.type === 'datetime') {
            values[f.name] = toLocalInput(record[f.name], record.timezone || 'Asia/Kolkata');
        } else if (f.type === 'date') {
            values[f.name] = record[f.name] ? String(record[f.name]).slice(0, 10) : '';
        } else {
            values[f.name] = record[f.name] ?? EMPTY_BY_TYPE[f.type] ?? '';
        }
    }
    return values;
}

function buildPayload(resource, values, record) {
    const payload = {};
    const announced = record && ANNOUNCED.includes(record.status);
    for (const f of resource.fields) {
        if ((f.createOnly && record) || (f.lockedWhenAnnounced && announced)) {
            continue;
        }
        let v = values[f.name];
        if (f.type === 'tags') {
            v = (v || []).filter(Boolean);
            // Empty means "none" (null), so an untouched field is not reported as a change.
            v = v.length ? v : null;
        } else if (f.type === 'entities') {
            v = (v || []).map(({ type, id }) => ({ type, id }));
        } else if (f.type === 'repeater') {
            v = (v || []).map((row) => Object.fromEntries(f.fields.map((s) => [s.name, row[s.name] === '' ? null : row[s.name]])));
        } else if (v === '') {
            v = null;
        }
        if (f.name === 'slug' && v === null) {
            continue;
        }
        payload[f.name] = v;
    }
    return payload;
}

function StatusPanel({ resourceKey, resource, record, onChanged }) {
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState(null);
    const next = TRANSITIONS[resource.transitions]?.[record.status] || [];
    const isEvent = resource.type === 'event';

    const go = async (status) => {
        if (isEvent && status === 'CANCELLED' && !note.trim()) {
            setError('Give a reason before cancelling — readers will see it.');
            return;
        }
        setBusy(status);
        setError(null);
        try {
            const { data } = await api.post(`/admin/${resourceKey}/${record.id}/status`, { status, note: note.trim() || null });
            setNote('');
            onChanged(data.data);
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setBusy(null);
        }
    };

    return (
        <section className="rounded-2xl border border-stone-200 bg-white p-4">
            <h2 className="font-semibold">Status</h2>
            <p className="mt-2 flex items-center gap-2 text-sm">
                Current: <StatusBadge status={record.status} />
            </p>
            {record.cancellation_reason && <p className="mt-1 text-sm text-red-800">Cancelled: {record.cancellation_reason}</p>}
            {next.length > 0 ? (
                <>
                    <label className="mt-3 block text-xs font-medium text-stone-600" htmlFor="status-note">
                        {isEvent ? 'Note (required when cancelling)' : 'Note (optional, kept in the audit log)'}
                    </label>
                    <input id="status-note" className="input mt-1" value={note} onChange={(e) => setNote(e.target.value)} maxLength={255} />
                    <div className="mt-3 flex flex-wrap gap-2">
                        {next.map((s) => (
                            <button key={s} type="button" className={s === 'CANCELLED' || s === 'SUSPENDED' ? 'btn-secondary text-red-700' : 'btn-secondary'} disabled={Boolean(busy)} onClick={() => go(s)}>
                                {busy === s ? 'Saving…' : `→ ${humanize(s)}`}
                            </button>
                        ))}
                    </div>
                </>
            ) : (
                <p className="mt-2 text-sm text-stone-500">No further status changes are possible.</p>
            )}
            {error && (
                <p className="mt-2 text-sm text-red-700" role="alert">
                    {error}
                </p>
            )}
        </section>
    );
}

function ReschedulePanel({ record, onChanged }) {
    const tz = record.timezone || 'Asia/Kolkata';
    const [startsAt, setStartsAt] = useState(toLocalInput(record.starts_at, tz));
    const [endsAt, setEndsAt] = useState(toLocalInput(record.ends_at, tz));
    const [reason, setReason] = useState('');
    const [state, setState] = useState({ busy: false, error: null });

    const submit = async (e) => {
        e.preventDefault();
        setState({ busy: true, error: null });
        try {
            const { data } = await api.post(`/admin/events/${record.id}/reschedule`, { starts_at: startsAt, ends_at: endsAt || null, reason: reason || null });
            setReason('');
            onChanged(data.data);
            setState({ busy: false, error: null });
        } catch (err) {
            setState({ busy: false, error: Object.values(fieldErrors(err)).flat()[0] || errorMessage(err) });
        }
    };

    return (
        <form onSubmit={submit} className="rounded-2xl border border-stone-200 bg-white p-4">
            <h2 className="font-semibold">Reschedule</h2>
            <p className="mt-1 text-xs text-stone-500">
                Times are in {tz}. The first announced start is kept and shown to readers
                {record.original_starts_at ? ` (originally ${formatDateTime(record.original_starts_at, tz)})` : ''}.
            </p>
            <div className="mt-3 grid gap-2">
                <label className="text-xs font-medium text-stone-600">
                    Starts
                    <input type="datetime-local" className="input mt-1" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
                </label>
                <label className="text-xs font-medium text-stone-600">
                    Ends
                    <input type="datetime-local" className="input mt-1" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
                </label>
                <label className="text-xs font-medium text-stone-600">
                    Reason (audit log)
                    <input className="input mt-1" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
                </label>
            </div>
            <button type="submit" className="btn-primary mt-3" disabled={state.busy}>
                {state.busy ? 'Saving…' : 'Reschedule'}
            </button>
            {state.error && (
                <p className="mt-2 text-sm text-red-700" role="alert">
                    {state.error}
                </p>
            )}
        </form>
    );
}

function CollectionItemsPanel({ record, onChanged }) {
    const initial = useMemo(
        () => (record.items || []).map((i) => ({ type: i.item_type, id: i.item_id, note: i.note || '', label: i.item?.name || i.item?.title || '(deleted)' })),
        [record.items],
    );
    const [items, setItems] = useState(initial);
    const [state, setState] = useState({ busy: false, error: null, saved: false });

    const save = async () => {
        setState({ busy: true, error: null, saved: false });
        try {
            const { data } = await api.put(`/admin/collections/${record.id}/items`, { items: items.map(({ type, id, note }) => ({ type, id, note: note || null })) });
            onChanged(data.data);
            setState({ busy: false, error: null, saved: true });
        } catch (e) {
            setState({ busy: false, error: Object.values(fieldErrors(e)).flat()[0] || errorMessage(e), saved: false });
        }
    };

    return (
        <section className="rounded-2xl border border-stone-200 bg-white p-4 xl:col-span-2">
            <h2 className="font-semibold">Items ({items.length})</h2>
            <p className="mb-3 mt-1 text-xs text-stone-500">Order here is the order readers see. Only public entities are shown on the site.</p>
            <EntityPicker types={['business', 'place', 'event', 'story']} value={items} onChange={setItems} withNotes />
            <div className="mt-3 flex items-center gap-3">
                <button type="button" className="btn-primary" onClick={save} disabled={state.busy}>
                    {state.busy ? 'Saving…' : 'Save items'}
                </button>
                {state.saved && <span className="text-sm text-navy-700">Saved.</span>}
                {state.error && (
                    <span className="text-sm text-red-700" role="alert">
                        {state.error}
                    </span>
                )}
            </div>
        </section>
    );
}

function EditForm({ resourceKey, resource, record, onSaved }) {
    const navigate = useNavigate();
    const [values, setValues] = useState(() => initialValues(resource, record));
    const [errors, setErrors] = useState({});
    const [state, setState] = useState({ busy: false, message: null, tone: 'ok' });
    const announced = record && ANNOUNCED.includes(record.status);

    const submit = async (e) => {
        e.preventDefault();
        setState({ busy: true, message: null, tone: 'ok' });
        setErrors({});
        try {
            const payload = buildPayload(resource, values, record);
            const { data } = record ? await api.patch(`/admin/${resourceKey}/${record.id}`, payload) : await api.post(`/admin/${resourceKey}`, payload);
            setState({ busy: false, message: 'Saved.', tone: 'ok' });
            if (record) {
                setValues(initialValues(resource, data.data));
                onSaved(data.data);
            } else {
                navigate(`/admin/${resourceKey}/${data.data.id}`, { replace: true });
            }
        } catch (err) {
            setErrors(fieldErrors(err));
            setState({ busy: false, message: errorMessage(err), tone: 'error' });
        }
    };

    return (
        <form onSubmit={submit} noValidate className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
                {resource.fields
                    .filter((f) => !(f.createOnly && record))
                    .map((f) => (
                        <Field
                            key={f.name}
                            field={f.lockedWhenAnnounced && announced ? { ...f, help: 'Use Reschedule to change the dates of an announced event.' } : f}
                            value={values[f.name]}
                            values={values}
                            record={record}
                            disabled={f.lockedWhenAnnounced && announced}
                            onChange={(v) => setValues((prev) => ({ ...prev, [f.name]: v }))}
                            error={errors[f.name]?.[0] || Object.entries(errors).find(([k]) => k.startsWith(`${f.name}.`) && f.type !== 'repeater')?.[1]?.[0]}
                            errors={errors}
                        />
                    ))}
            </div>
            <div className="sticky bottom-0 -mx-4 mt-6 flex items-center gap-3 border-t border-stone-200 bg-white/95 px-4 py-3 sm:-mx-6 sm:px-6">
                <button type="submit" className="btn-primary" disabled={state.busy}>
                    {state.busy ? 'Saving…' : record ? 'Save changes' : `Create ${resource.singular.toLowerCase()}`}
                </button>
                {state.message && (
                    <span role={state.tone === 'error' ? 'alert' : 'status'} className={`text-sm ${state.tone === 'error' ? 'text-red-700' : 'text-navy-700'}`}>
                        {state.message}
                    </span>
                )}
            </div>
        </form>
    );
}

function DangerZone({ resourceKey, resource, record, onChanged }) {
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    const remove = async () => {
        if (!window.confirm(`Delete this ${resource.singular.toLowerCase()}? It is hidden from the site and can be restored later.`)) {
            return;
        }
        try {
            await api.delete(`/admin/${resourceKey}/${record.id}`);
            navigate(`/admin/${resourceKey}`);
        } catch (e) {
            setError(Object.values(fieldErrors(e)).flat()[0] || errorMessage(e));
        }
    };
    const restore = async () => {
        try {
            const { data } = await api.post(`/admin/${resourceKey}/${record.id}/restore`);
            onChanged(data.data);
        } catch (e) {
            setError(errorMessage(e));
        }
    };

    return (
        <section className="rounded-2xl border border-red-200 bg-white p-4">
            <h2 className="font-semibold text-red-800">{record.is_trashed ? 'Deleted' : 'Delete'}</h2>
            {record.is_trashed ? (
                <button type="button" className="btn-secondary mt-3" onClick={restore}>
                    Restore
                </button>
            ) : (
                <button type="button" className="btn-secondary mt-3 text-red-700" onClick={remove}>
                    Delete (soft)
                </button>
            )}
            {error && (
                <p className="mt-2 text-sm text-red-700" role="alert">
                    {error}
                </p>
            )}
        </section>
    );
}

export default function ResourceEdit({ resourceKey, resource }) {
    const { id } = useParams();
    const { user } = useStaff();
    const isNew = id === 'new';
    const { data, error, loading } = useApi(isNew ? null : `/admin/${resourceKey}/${id}`);
    const [override, setOverride] = useState(null);
    const record = isNew ? null : override?.id === id ? override : data?.data;

    if (!isNew && error) {
        return <ErrorState error={error} />;
    }
    if (!isNew && (loading || !record)) {
        return <PageLoading />;
    }

    const title = record ? (resource.recordTitle ? resource.recordTitle(record) : record[resource.titleKey]) : `New ${resource.singular.toLowerCase()}`;
    const storyBody = resource.type === 'story' && record?.body ? DOMPurify.sanitize(record.body) : null;

    return (
        <div>
            <nav className="text-sm text-stone-500">
                <Link to={`/admin/${resourceKey}`} className="hover:underline">
                    {resource.label}
                </Link>{' '}
                / {record ? 'Edit' : 'New'}
            </nav>
            <div className="mb-4 mt-1 flex flex-wrap items-center gap-3">
                <h1 className="font-display text-2xl font-bold">{title}</h1>
                {record?.status && <StatusBadge status={record.status} />}
                {record?.is_demo && <span className="rounded bg-accent-100 px-2 py-0.5 text-xs text-amber-800">Demo data</span>}
                {record && resource.publicPath && !record.is_trashed && (
                    <a href={resource.publicPath(record)} target="_blank" rel="noreferrer" className="text-sm font-semibold text-navy-700 hover:underline">
                        View on site ↗
                    </a>
                )}
            </div>
            <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
                <EditForm key={record ? record.id : 'new'} resourceKey={resourceKey} resource={resource} record={record} onSaved={setOverride} />
                {record && (
                    <aside className="space-y-4">
                        {resource.transitions && <StatusPanel resourceKey={resourceKey} resource={resource} record={record} onChanged={setOverride} />}
                        {resource.type === 'event' && <ReschedulePanel key={record.updated_at} record={record} onChanged={setOverride} />}
                        <section className="rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-600">
                            <p>Created {formatDateTime(record.created_at)}</p>
                            <p>Updated {formatDateTime(record.updated_at)}</p>
                            {can(user, PERMISSIONS.audit) && (
                                <Link to={`/admin/audit-logs?auditable_type=${resource.type}&auditable_id=${record.id}`} className="mt-2 inline-block font-semibold text-navy-700 hover:underline">
                                    History →
                                </Link>
                            )}
                        </section>
                        {SEO_TYPES.includes(resource.type) && can(user, PERMISSIONS.seo) && <SeoPanel resource={resource} record={record} />}
                        {!resource.noDelete && <DangerZone resourceKey={resourceKey} resource={resource} record={record} onChanged={setOverride} />}
                    </aside>
                )}
                {record && resource.hasItems && <CollectionItemsPanel key={record.updated_at} record={record} onChanged={setOverride} />}
                {storyBody && (
                    <section className="rounded-2xl border border-stone-200 bg-white p-4 xl:col-span-2">
                        <h2 className="mb-2 font-semibold">Saved body (as sanitized by the server)</h2>
                        <div className="prose-story" dangerouslySetInnerHTML={{ __html: storyBody }} />
                    </section>
                )}
            </div>
        </div>
    );
}
