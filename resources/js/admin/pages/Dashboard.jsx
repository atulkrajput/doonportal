import { Link } from 'react-router';
import { useApi } from '../../hooks/useApi';
import { ErrorState, PageLoading } from '../../components/States';
import { formatDateTime, formatMoney, formatNumber, humanize } from '../lib';

const QUEUE_LINKS = {
    claims_pending: '/admin/claims',
    submissions_pending: '/admin/submissions',
    reviews_pending: '/admin/reviews',
};

function Card({ title, to, total, children }) {
    return (
        <section className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-semibold">{title}</h2>
                {to && (
                    <Link to={to} className="text-sm font-semibold text-navy-700 hover:underline">
                        Manage →
                    </Link>
                )}
            </div>
            {total !== undefined && <p className="mt-2 font-display text-3xl font-bold tabular-nums">{total}</p>}
            {children}
        </section>
    );
}

function StatusCounts({ counts, to }) {
    const entries = Object.entries(counts || {});
    if (!entries.length) {
        return <p className="mt-2 text-sm text-stone-500">None yet.</p>;
    }
    return (
        <ul className="mt-2 flex flex-wrap gap-1.5 text-xs">
            {entries.map(([status, n]) => (
                <li key={status}>
                    <Link to={`${to}?status=${status}`} className="chip py-0.5 text-xs">
                        {humanize(status)} <span className="font-semibold tabular-nums">{n}</span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}

export default function Dashboard() {
    const { data, error, loading } = useApi('/admin/dashboard');
    if (error) {
        return <ErrorState error={error} />;
    }
    if (loading || !data) {
        return <PageLoading />;
    }
    const d = data.data;

    return (
        <div>
            <h1 className="mb-4 font-display text-2xl font-bold">Dashboard</h1>
            {d.setup?.map((item) => (
                <div key={item.key} role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <span>
                        <strong>Setup needed:</strong> {item.message}
                    </span>
                    <Link to={item.link} className="btn-secondary">
                        Fill in details
                    </Link>
                </div>
            ))}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {d.businesses && (
                    <Card title="Businesses" to="/admin/businesses" total={d.businesses.total}>
                        <p className="text-sm text-stone-600">{d.businesses.published} published</p>
                        <StatusCounts counts={d.businesses.by_status} to="/admin/businesses" />
                    </Card>
                )}
                {d.places && (
                    <Card title="Places" to="/admin/places" total={d.places.total}>
                        <StatusCounts counts={d.places.by_status} to="/admin/places" />
                    </Card>
                )}
                {d.events && (
                    <Card title="Events" to="/admin/events" total={d.events.total}>
                        <p className="text-sm text-stone-600">{d.events.upcoming_public} upcoming on the site</p>
                        <StatusCounts counts={d.events.by_status} to="/admin/events" />
                    </Card>
                )}
                {d.stories && (
                    <Card title="Stories" to="/admin/stories" total={d.stories.total}>
                        <StatusCounts counts={d.stories.by_status} to="/admin/stories" />
                    </Card>
                )}
                {d.collections && (
                    <Card title="Collections" to="/admin/collections" total={d.collections.total}>
                        <StatusCounts counts={d.collections.by_status} to="/admin/collections" />
                    </Card>
                )}
                {d.taxonomy && (
                    <Card title="Taxonomy">
                        <p className="mt-2 text-sm">
                            <Link to="/admin/areas" className="font-semibold text-navy-700 hover:underline">
                                {d.taxonomy.areas} areas
                            </Link>{' '}
                            ·{' '}
                            <Link to="/admin/categories" className="font-semibold text-navy-700 hover:underline">
                                {d.taxonomy.categories} categories
                            </Link>
                        </p>
                    </Card>
                )}
                {d.users && <Card title="Members" to="/admin/members" total={d.users.total} />}
                {d.monetization && (
                    <Card title="Revenue this month" to="/admin/revenue" total={formatMoney(d.monetization.revenue_this_month_paise)}>
                        <p className="text-sm text-stone-600">{d.monetization.active_subscriptions} active subscriptions · recorded payments</p>
                    </Card>
                )}
                {d.traffic && (
                    <Card title="Traffic, last 7 days" to="/admin/analytics" total={formatNumber(d.traffic.page_views_7d)}>
                        <p className="text-sm text-stone-600">page views · {formatNumber(d.traffic.visitors_7d)} visitor-days</p>
                    </Card>
                )}
                {d.moderation && (
                    <Card title="Moderation queues">
                        <ul className="mt-2 space-y-1 text-sm">
                            {Object.entries(d.moderation).map(([k, n]) => (
                                <li key={k} className="flex justify-between">
                                    {QUEUE_LINKS[k] ? (
                                        <Link to={QUEUE_LINKS[k]} className="text-navy-700 hover:underline">
                                            {humanize(k)}
                                        </Link>
                                    ) : (
                                        <span>{humanize(k)}</span>
                                    )}
                                    <span className={`font-semibold tabular-nums ${n > 0 && QUEUE_LINKS[k] ? 'text-accent-600' : ''}`}>{n}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
            </div>
            {d.recent_activity && (
                <section className="mt-6">
                    <div className="mb-2 flex items-baseline justify-between">
                        <h2 className="font-semibold">Recent activity</h2>
                        <Link to="/admin/audit-logs" className="text-sm font-semibold text-navy-700 hover:underline">
                            Full audit log →
                        </Link>
                    </div>
                    <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white text-sm">
                        {d.recent_activity.length === 0 && <li className="px-4 py-3 text-stone-500">No activity yet.</li>}
                        {d.recent_activity.map((log) => (
                            <li key={log.id} className="flex flex-wrap justify-between gap-2 px-4 py-2">
                                <span>
                                    <span className="font-medium">{log.actor?.name || 'System'}</span> · {humanize(log.action)}
                                </span>
                                <span className="text-stone-500">{formatDateTime(log.created_at)}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
