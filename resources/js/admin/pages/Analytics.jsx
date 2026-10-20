import { useState } from 'react';
import { Link } from 'react-router';
import { useApi } from '../../hooks/useApi';
import { ErrorState, PageLoading } from '../../components/States';
import { Bars, RangePicker, RankList, StatCard, daysAgo } from '../components/Charts';
import { formatNumber, humanize, PERMISSIONS, can } from '../lib';
import { useStaff } from '../StaffContext';
import { PageIntro } from './Settings';

const RANGES = [
    ['7', '7 days'],
    ['30', '30 days'],
    ['90', '90 days'],
    ['365', '12 months'],
];
const ENTITY_ADMIN = { business: 'businesses', place: 'places', event: 'events', story: 'stories', collection: 'collections' };

export default function Analytics() {
    const { user } = useStaff();
    const [range, setRange] = useState('30');
    const { data, error, loading } = useApi('/admin/analytics', { from: daysAgo(Number(range) - 1), to: daysAgo(0) });

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <PageIntro title="Analytics">
                    First-party, privacy-friendly analytics: no IP addresses or user agents are stored, visitors are an anonymous hash that changes daily. For Google Analytics or Clarity, add their IDs in{' '}
                    {can(user, PERMISSIONS.settings) ? (
                        <Link to="/admin/tracking" className="font-semibold text-navy-700 underline">
                            Tracking codes
                        </Link>
                    ) : (
                        'Tracking codes'
                    )}
                    .
                </PageIntro>
                <RangePicker value={range} onChange={setRange} options={RANGES} />
            </div>

            {error && <ErrorState error={error} />}
            {loading && <PageLoading />}
            {data && <Report report={data.data} />}
        </div>
    );
}

function Report({ report }) {
    const daily = report.daily.map((d) => ({ key: d.date, label: d.date, value: d.page_views }));
    const visitors = report.daily.map((d) => ({ key: d.date, label: d.date, value: d.visitors }));

    return (
        <>
            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Page views" value={formatNumber(report.totals.page_views)} hint={`${report.from} → ${report.to} (IST)`} />
                <StatCard label="Visitor-days" value={formatNumber(report.daily.reduce((n, d) => n + d.visitors, 0))} hint="Unique anonymous visitors per day, summed" tone="accent" />
                <StatCard label="Tracked interactions" value={formatNumber(report.totals.events)} hint="Views, clicks, searches, saves…" tone="green" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-2xl border border-stone-200 bg-white p-4">
                    <h2 className="mb-3 font-semibold">Page views per day</h2>
                    <Bars items={daily} label="Page views per day" format={formatNumber} />
                </section>
                <section className="rounded-2xl border border-stone-200 bg-white p-4">
                    <h2 className="mb-3 font-semibold">Visitors per day</h2>
                    <Bars items={visitors} label="Visitors per day" format={formatNumber} accent />
                </section>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <RankList title="Top pages" rows={report.top_pages.map((p) => ({ key: p.path, label: p.path, value: p.views }))} valueLabel="views" />
                <RankList
                    title="Most viewed listings"
                    rows={report.top_entities.map((e) => ({
                        key: `${e.type}:${e.id}`,
                        label: ENTITY_ADMIN[e.type] ? (
                            <Link to={`/admin/${ENTITY_ADMIN[e.type]}/${e.id}`} className="text-navy-700 hover:underline">
                                {e.label} <span className="text-xs text-stone-500">· {e.type}</span>
                            </Link>
                        ) : (
                            e.label
                        ),
                        value: e.total,
                    }))}
                    valueLabel="events"
                />
                <RankList title="Top searches" rows={report.top_searches.map((s) => ({ key: s.query, label: `“${s.query}”`, value: s.searches }))} />
                <RankList title="Interactions by type" rows={report.by_event.map((e) => ({ key: e.name, label: humanize(e.name), value: e.total }))} />
            </div>
            <p className="text-xs text-stone-500">{report.note}</p>
        </>
    );
}
