import { useState } from 'react';
import { Link } from 'react-router';
import { api, errorMessage } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { formatDate } from '../../lib/format';
import { Icon } from '../../components/Icons';
import { StatusPill } from '../../components/Form';
import { VerifiedBadge } from '../../components/Badges';
import { ErrorState, PageLoading } from '../../components/States';
import { Panel } from './AccountLayout';

function OwnedList({ businesses }) {
    if (!businesses.length) {
        return null;
    }
    return (
        <Panel title="Businesses you manage">
            <ul className="grid gap-4 md:grid-cols-2">
                {businesses.map((b) => (
                    <li key={b.id} className="flex flex-col rounded-2xl border border-stone-200 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <VerifiedBadge show={b.is_verified} />
                            {!b.is_published && <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-semibold">Not public</span>}
                            {b.has_pending_edit && <StatusPill status="PENDING" />}
                        </div>
                        <p className="mt-2 font-display text-lg font-bold">{b.name}</p>
                        <p className="text-sm text-stone-600">{[b.category, b.area].filter(Boolean).join(' · ')}</p>
                        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-xl bg-cream p-2">
                                <dt className="text-xs text-stone-600">Views (30d)</dt>
                                <dd className="font-display text-xl font-bold">{b.last_30_days.views}</dd>
                            </div>
                            <div className="rounded-xl bg-cream p-2">
                                <dt className="text-xs text-stone-600">Actions (30d)</dt>
                                <dd className="font-display text-xl font-bold">{b.last_30_days.actions}</dd>
                            </div>
                            <div className="rounded-xl bg-cream p-2">
                                <dt className="text-xs text-stone-600">Rating</dt>
                                <dd className="font-display text-xl font-bold">{b.rating.count ? b.rating.average : '–'}</dd>
                            </div>
                        </dl>
                        {b.unanswered_reviews > 0 && <p className="mt-2 text-sm font-semibold text-accent-600">{b.unanswered_reviews} review{b.unanswered_reviews > 1 ? 's' : ''} waiting for your reply</p>}
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Link to={`/account/businesses/${b.id}`} className="btn-primary">
                                <Icon name="settings" size={16} /> Manage
                            </Link>
                            <Link to={`/business/${b.slug}`} className="btn-secondary">
                                View listing
                            </Link>
                        </div>
                    </li>
                ))}
            </ul>
        </Panel>
    );
}

function Requests({ claims, submissions, onChanged }) {
    const [error, setError] = useState(null);
    const rows = [
        ...claims.map((c) => ({
            key: `c-${c.id}`,
            kind: 'Ownership claim',
            title: c.business?.name ?? 'Listing removed',
            link: c.business ? `/business/${c.business.slug}` : null,
            status: c.status,
            date: c.created_at,
            notes: c.review_notes,
            action: c.status === 'PENDING' ? { label: 'Cancel claim', run: () => api.post(`/me/claims/${c.id}/cancel`) } : null,
        })),
        ...submissions.map((s) => ({
            key: `s-${s.id}`,
            kind: s.type === 'BUSINESS' ? 'New listing' : 'Listing changes',
            title: s.type === 'BUSINESS' ? s.payload?.name : (s.business?.name ?? 'Listing removed'),
            link: s.business ? (s.type === 'BUSINESS' ? `/business/${s.business.slug}` : `/account/businesses/${s.business.id}`) : null,
            status: s.status,
            date: s.created_at,
            notes: s.review_notes,
            action: s.status === 'PENDING' ? { label: 'Withdraw', run: () => api.delete(`/me/submissions/${s.id}`) } : null,
        })),
    ].sort((a, b) => (a.date < b.date ? 1 : -1));

    if (!rows.length) {
        return null;
    }
    return (
        <Panel title="Your requests">
            {error && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            <ul className="divide-y divide-stone-100">
                {rows.map((r) => (
                    <li key={r.key} className="flex flex-wrap items-start justify-between gap-3 py-3">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{r.kind}</p>
                            <p className="font-semibold">{r.link ? <Link to={r.link} className="hover:text-navy-700">{r.title}</Link> : r.title}</p>
                            <p className="text-xs text-stone-500">Sent {formatDate(r.date)}</p>
                            {r.notes && <p className="mt-1 text-sm text-stone-700">Note from our team: {r.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                            <StatusPill status={r.status} />
                            {r.action && (
                                <button
                                    type="button"
                                    className="text-sm font-semibold text-stone-600 underline hover:text-red-700"
                                    onClick={async () => {
                                        setError(null);
                                        try {
                                            await r.action.run();
                                            onChanged();
                                        } catch (err) {
                                            setError(errorMessage(err));
                                        }
                                    }}
                                >
                                    {r.action.label}
                                </button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </Panel>
    );
}

export default function Businesses() {
    const [version, setVersion] = useState(0);
    const v = version || undefined;
    const owned = useApi('/me/businesses', { v });
    const claims = useApi('/me/claims', { per_page: 50, v });
    const submissions = useApi('/me/submissions', { per_page: 50, v });

    if (owned.loading && !owned.data) {
        return <PageLoading />;
    }
    if (owned.error) {
        return <ErrorState error={owned.error} />;
    }
    const businesses = owned.data?.data || [];

    return (
        <div className="space-y-6">
            <OwnedList businesses={businesses} />
            <Requests claims={claims.data?.data || []} submissions={submissions.data?.data || []} onChanged={() => setVersion((n) => n + 1)} />

            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-stone-200 bg-white p-5">
                    <span className="icon-badge icon-badge-accent">
                        <Icon name="flag" />
                    </span>
                    <h2 className="mt-3 font-display text-xl font-bold">Already on DoonPortal?</h2>
                    <p className="mt-1 text-sm text-stone-600">Find your business and choose “Claim this listing”. We’ll check you’re the owner, then you can update it.</p>
                    <Link to="/businesses" className="btn-secondary mt-4">
                        Find your listing
                    </Link>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white p-5">
                    <span className="icon-badge">
                        <Icon name="store" />
                    </span>
                    <h2 className="mt-3 font-display text-xl font-bold">Not listed yet?</h2>
                    <p className="mt-1 text-sm text-stone-600">Add your business for free. Once approved, it’s yours to manage.</p>
                    <Link to="/account/businesses/new" className="btn-primary mt-4">
                        Add a business
                    </Link>
                </div>
            </div>
        </div>
    );
}
