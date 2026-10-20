import { useState } from 'react';
import { Link } from 'react-router';
import { api, errorMessage, fieldErrors } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { ErrorState } from '../../components/States';
import { StatusPill } from '../../components/Form';
import { Stars } from '../../components/Reviews';
import { Pagination, useAdminFilters } from './ResourceList';
import { formatDateTime, humanize } from '../lib';

function StatusTabs({ statuses, filters, fallback }) {
    const current = filters.get('status') || fallback;
    return (
        <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Status">
            {statuses.map((s) => (
                <button
                    key={s}
                    type="button"
                    role="tab"
                    aria-selected={current === s}
                    onClick={() => filters.set('status', s === fallback ? '' : s)}
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${current === s ? 'bg-navy-700 text-white' : 'border border-stone-300 bg-white'}`}
                >
                    {s === 'ALL' ? 'All' : humanize(s)}
                </button>
            ))}
        </div>
    );
}

/** Approve / reject with a note (required to reject: the member sees it). */
function Decision({ endpoint, onDone, approveLabel = 'Approve', rejectLabel = 'Reject' }) {
    const [notes, setNotes] = useState('');
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState(null);

    const decide = async (action) => {
        setBusy(action);
        setError(null);
        try {
            await api.post(`${endpoint}/${action}`, { notes: notes || null });
            onDone();
        } catch (err) {
            const fe = fieldErrors(err);
            setError(fe.notes?.[0] || Object.values(fe)[0]?.[0] || errorMessage(err));
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className="mt-4 space-y-2 border-t border-stone-100 pt-4">
            <label className="block">
                <span className="text-sm font-medium text-stone-700">Note to the member</span>
                <textarea className="input mt-1" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Required when rejecting. Shown in their account." maxLength={2000} />
            </label>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-primary" disabled={Boolean(busy)} onClick={() => decide('approve')}>
                    {busy === 'approve' ? 'Approving…' : approveLabel}
                </button>
                <button type="button" className="btn-secondary hover:!border-red-600 hover:!text-red-700" disabled={Boolean(busy)} onClick={() => decide('reject')}>
                    {busy === 'reject' ? 'Rejecting…' : rejectLabel}
                </button>
            </div>
        </div>
    );
}

function Person({ user }) {
    if (!user) {
        return <span className="text-stone-500">Deleted account</span>;
    }
    return (
        <span>
            <Link to={`/admin/members/${user.id}`} className="font-semibold text-navy-700 hover:underline">
                {user.name}
            </Link>{' '}
            <span className="text-stone-600">
                · {user.email}
                {user.phone && ` · ${user.phone}`}
            </span>
        </span>
    );
}

function Decided({ item }) {
    if (item.status === 'PENDING') {
        return null;
    }
    return (
        <p className="mt-3 rounded-xl bg-stone-50 p-3 text-sm text-stone-700">
            {humanize(item.status)}
            {item.reviewer && ` by ${item.reviewer.name}`}
            {item.reviewed_at && ` on ${formatDateTime(item.reviewed_at)}`}
            {item.review_notes && <>. Note: {item.review_notes}</>}
        </p>
    );
}

export function ClaimsQueue() {
    const filters = useAdminFilters();
    const [version, setVersion] = useState(0);
    const status = filters.get('status') || 'PENDING';
    const { data, error, loading } = useApi('/admin/claims', { ...filters.all, status: status === 'ALL' ? '' : status, v: version || undefined });

    return (
        <div>
            <h1 className="mb-1 font-display text-2xl font-bold">Ownership claims</h1>
            <p className="mb-4 text-sm text-stone-600">
                Check the claimant really runs the business before approving: call the listed business number, compare names on the evidence, or check their official page. Approving makes them the owner and lets them propose edits and reply to reviews.
            </p>
            <StatusTabs statuses={['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'ALL']} filters={filters} fallback="PENDING" />
            <input className="input mb-4 w-full sm:w-72" placeholder="Search business or member" value={filters.get('q')} onChange={(e) => filters.set('q', e.target.value)} aria-label="Search" />
            {error && <ErrorState error={error} />}
            {loading && <p className="text-sm text-stone-500">Loading…</p>}
            {data && !data.data.length && <p className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-600">Nothing here.</p>}
            <ul className="space-y-4">
                {(data?.data || []).map((c) => (
                    <li key={c.id} className="rounded-2xl border border-stone-200 bg-white p-5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <p className="font-display text-lg font-bold">
                                    {c.business ? (
                                        <Link to={`/admin/businesses/${c.business.id}`} className="hover:text-navy-700">
                                            {c.business.name}
                                        </Link>
                                    ) : (
                                        'Listing removed'
                                    )}
                                </p>
                                <p className="text-xs text-stone-500">Sent {formatDateTime(c.created_at)}</p>
                            </div>
                            <StatusPill status={c.status} />
                        </div>
                        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[140px_1fr]">
                            <dt className="text-stone-500">Member</dt>
                            <dd>
                                <Person user={c.user} />
                            </dd>
                            <dt className="text-stone-500">Role</dt>
                            <dd className="capitalize">{c.claimant_role}</dd>
                            <dt className="text-stone-500">Contact</dt>
                            <dd>
                                <a href={`tel:${c.contact_phone}`} className="text-navy-700 underline">
                                    {c.contact_phone}
                                </a>{' '}
                                ·{' '}
                                <a href={`mailto:${c.contact_email}`} className="text-navy-700 underline">
                                    {c.contact_email}
                                </a>
                            </dd>
                            {c.message && (
                                <>
                                    <dt className="text-stone-500">Their note</dt>
                                    <dd className="whitespace-pre-line">{c.message}</dd>
                                </>
                            )}
                            {c.evidence_links?.length > 0 && (
                                <>
                                    <dt className="text-stone-500">Evidence</dt>
                                    <dd className="space-y-1">
                                        {c.evidence_links.map((l) => (
                                            <a key={l} href={l} target="_blank" rel="noopener noreferrer nofollow" className="block break-all text-navy-700 underline">
                                                {l}
                                            </a>
                                        ))}
                                    </dd>
                                </>
                            )}
                            {c.business?.owner_id && c.status === 'PENDING' && (
                                <>
                                    <dt className="text-stone-500">Warning</dt>
                                    <dd className="font-semibold text-red-700">This listing already has an owner.</dd>
                                </>
                            )}
                        </dl>
                        {c.status === 'PENDING' ? <Decision endpoint={`/admin/claims/${c.id}`} onDone={() => setVersion((v) => v + 1)} approveLabel="Approve: make them owner" /> : <Decided item={c} />}
                    </li>
                ))}
            </ul>
            <Pagination meta={data?.meta} onPage={(p) => filters.set('page', p)} />
        </div>
    );
}

function Value({ value }) {
    if (value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length)) {
        return <span className="text-stone-400">—</span>;
    }
    if (Array.isArray(value) && value.every((v) => typeof v !== 'object')) {
        return <span>{value.join(', ')}</span>;
    }
    if (typeof value === 'object') {
        return <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded bg-stone-50 p-2 text-xs">{JSON.stringify(value, null, 2)}</pre>;
    }
    return <span className="whitespace-pre-line break-words">{String(value)}</span>;
}

function SubmissionDetail({ id, onDone }) {
    const { data, error, loading } = useApi(`/admin/submissions/${id}`);
    if (loading) {
        return <p className="mt-3 text-sm text-stone-500">Loading…</p>;
    }
    if (error) {
        return <ErrorState error={error} />;
    }
    const s = data.data;
    const ctx = s.context || {};

    return (
        <div className="mt-4">
            {s.type === 'OWNER_EDIT' ? (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-sm">
                        <thead>
                            <tr className="text-left text-stone-500">
                                <th className="py-2 pr-3 font-medium">Field</th>
                                <th className="py-2 pr-3 font-medium">Live now</th>
                                <th className="py-2 font-medium">Proposed</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 align-top">
                            {Object.entries(s.payload).map(([field, value]) => (
                                <tr key={field}>
                                    <th scope="row" className="py-2 pr-3 text-left font-semibold">
                                        {humanize(field)}
                                    </th>
                                    <td className="py-2 pr-3 text-stone-600">
                                        <Value value={ctx.current?.[field]} />
                                    </td>
                                    <td className="bg-emerald-50/60 py-2 pl-2">
                                        <Value value={value} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[140px_1fr]">
                    {Object.entries({ ...s.payload, category_id: ctx.category ?? s.payload.category_id, area_id: ctx.area ?? s.payload.area_id }).map(([k, v]) => (
                        <div key={k} className="contents">
                            <dt className="text-stone-500">{humanize(k.replace(/_id$/, ''))}</dt>
                            <dd>
                                <Value value={v} />
                            </dd>
                        </div>
                    ))}
                </dl>
            )}
            {ctx.possible_duplicates?.length > 0 && (
                <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
                    <p className="font-semibold text-amber-900">Possible duplicates already listed</p>
                    <ul className="mt-1 list-disc pl-5">
                        {ctx.possible_duplicates.map((d) => (
                            <li key={d.id}>
                                <Link to={`/admin/businesses/${d.id}`} className="text-navy-700 underline">
                                    {d.name}
                                </Link>
                                {d.locality && ` · ${d.locality}`}
                                {d.is_claimed && ' · already claimed'}
                            </li>
                        ))}
                    </ul>
                    <p className="mt-1 text-amber-900">If it’s the same business, reject this and ask them to claim the existing listing.</p>
                </div>
            )}
            {s.status === 'PENDING' ? (
                <Decision endpoint={`/admin/submissions/${s.id}`} onDone={onDone} approveLabel={s.type === 'BUSINESS' ? 'Approve: publish & make them owner' : 'Approve: apply changes'} />
            ) : (
                <Decided item={s} />
            )}
        </div>
    );
}

export function SubmissionsQueue() {
    const filters = useAdminFilters();
    const [version, setVersion] = useState(0);
    const [open, setOpen] = useState(null);
    const status = filters.get('status') || 'PENDING';
    const { data, error, loading } = useApi('/admin/submissions', { ...filters.all, status: status === 'ALL' ? '' : status, v: version || undefined });

    return (
        <div>
            <h1 className="mb-1 font-display text-2xl font-bold">Submissions</h1>
            <p className="mb-4 text-sm text-stone-600">New listings from members (approving publishes them and makes the member the owner) and owners’ changes to their listings (approving applies them).</p>
            <StatusTabs statuses={['PENDING', 'APPROVED', 'REJECTED', 'ALL']} filters={filters} fallback="PENDING" />
            <div className="mb-4 flex flex-wrap gap-2">
                <select className="input w-auto" value={filters.get('type')} onChange={(e) => filters.set('type', e.target.value)} aria-label="Type">
                    <option value="">All types</option>
                    <option value="BUSINESS">New listings</option>
                    <option value="OWNER_EDIT">Owner changes</option>
                </select>
                <input className="input w-full sm:w-64" placeholder="Search member" value={filters.get('q')} onChange={(e) => filters.set('q', e.target.value)} aria-label="Search member" />
            </div>
            {error && <ErrorState error={error} />}
            {loading && <p className="text-sm text-stone-500">Loading…</p>}
            {data && !data.data.length && <p className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-600">Nothing here.</p>}
            <ul className="space-y-4">
                {(data?.data || []).map((s) => (
                    <li key={s.id} className="rounded-2xl border border-stone-200 bg-white p-5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-navy-600">{s.type === 'BUSINESS' ? 'New listing' : 'Owner changes'}</p>
                                <p className="font-display text-lg font-bold">{s.type === 'BUSINESS' ? s.payload?.name : s.business?.name ?? 'Listing removed'}</p>
                                <p className="text-sm">
                                    <Person user={s.user} />
                                </p>
                                <p className="text-xs text-stone-500">Sent {formatDateTime(s.updated_at || s.created_at)}</p>
                            </div>
                            <StatusPill status={s.status} />
                        </div>
                        {open === s.id ? (
                            <SubmissionDetail
                                id={s.id}
                                onDone={() => {
                                    setOpen(null);
                                    setVersion((v) => v + 1);
                                }}
                            />
                        ) : (
                            <button type="button" className="btn-secondary mt-3" onClick={() => setOpen(s.id)}>
                                {s.status === 'PENDING' ? 'Review' : 'View'}
                            </button>
                        )}
                    </li>
                ))}
            </ul>
            <Pagination meta={data?.meta} onPage={(p) => filters.set('page', p)} />
        </div>
    );
}

export function ReviewsQueue() {
    const filters = useAdminFilters();
    const [version, setVersion] = useState(0);
    const [errors, setErrors] = useState({});
    const status = filters.get('status') || 'PENDING';
    const { data, error, loading } = useApi('/admin/reviews', { ...filters.all, status: status === 'ALL' ? '' : status, v: version || undefined });

    const act = async (review, run) => {
        setErrors((e) => ({ ...e, [review.id]: null }));
        try {
            await run();
            setVersion((v) => v + 1);
        } catch (err) {
            setErrors((e) => ({ ...e, [review.id]: errorMessage(err) }));
        }
    };

    return (
        <div>
            <h1 className="mb-1 font-display text-2xl font-bold">Reviews</h1>
            <p className="mb-4 text-sm text-stone-600">
                Publish genuine first-hand reviews, positive or negative. Reject spam, abuse, personal details, conflicts of interest or anything against the{' '}
                <Link to="/community-guidelines" className="underline" target="_blank">
                    community guidelines
                </Link>
                . Ratings only count published reviews.
            </p>
            <StatusTabs statuses={['PENDING', 'PUBLISHED', 'REJECTED', 'HIDDEN', 'ALL']} filters={filters} fallback="PENDING" />
            <input className="input mb-4 w-full sm:w-64" placeholder="Search text" value={filters.get('q')} onChange={(e) => filters.set('q', e.target.value)} aria-label="Search review text" />
            {error && <ErrorState error={error} />}
            {loading && <p className="text-sm text-stone-500">Loading…</p>}
            {data && !data.data.length && <p className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-600">Nothing here.</p>}
            <ul className="space-y-4">
                {(data?.data || []).map((r) => (
                    <li key={r.id} className="rounded-2xl border border-stone-200 bg-white p-5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <p className="font-semibold">
                                    {r.listing?.slug ? (
                                        <a href={`/${r.listing.type}/${r.listing.slug}`} target="_blank" rel="noreferrer" className="hover:text-navy-700">
                                            {r.listing.name}
                                        </a>
                                    ) : (
                                        r.listing?.name ?? 'Listing removed'
                                    )}
                                </p>
                                <p className="text-sm text-stone-600">
                                    by {r.author?.name ?? 'Member'} · {formatDateTime(r.updated_at)}
                                </p>
                            </div>
                            <StatusPill status={r.status} />
                        </div>
                        <div className="mt-2">
                            <Stars rating={r.rating} size="text-sm" />
                        </div>
                        {r.title && <p className="mt-1 font-medium">{r.title}</p>}
                        <p className="mt-1 whitespace-pre-line text-sm text-stone-700">{r.body}</p>
                        {r.owner_reply && (
                            <div className="mt-3 rounded-xl bg-stone-50 p-3 text-sm">
                                <p className="font-semibold">Owner’s reply</p>
                                <p className="mt-1 whitespace-pre-line">{r.owner_reply}</p>
                                <button type="button" className="mt-2 text-sm font-semibold text-red-700 underline" onClick={() => act(r, () => api.delete(`/admin/reviews/${r.id}/reply`))}>
                                    Remove reply
                                </button>
                            </div>
                        )}
                        {errors[r.id] && <p role="alert" className="mt-2 text-sm text-red-700">{errors[r.id]}</p>}
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
                            {r.status !== 'PUBLISHED' && (
                                <button type="button" className="btn-primary" onClick={() => act(r, () => api.post(`/admin/reviews/${r.id}/status`, { status: 'PUBLISHED' }))}>
                                    Publish
                                </button>
                            )}
                            {r.status === 'PENDING' && (
                                <button type="button" className="btn-secondary" onClick={() => act(r, () => api.post(`/admin/reviews/${r.id}/status`, { status: 'REJECTED' }))}>
                                    Reject
                                </button>
                            )}
                            {r.status === 'PUBLISHED' && (
                                <button type="button" className="btn-secondary" onClick={() => act(r, () => api.post(`/admin/reviews/${r.id}/status`, { status: 'HIDDEN' }))}>
                                    Hide
                                </button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
            <Pagination meta={data?.meta} onPage={(p) => filters.set('page', p)} />
        </div>
    );
}
