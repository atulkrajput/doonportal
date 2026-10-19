import { useState } from 'react';
import { Link } from 'react-router';
import { useApi } from '../../hooks/useApi';
import { ErrorState, PageLoading } from '../../components/States';
import { Bars, RangePicker, RankList, StatCard } from '../components/Charts';
import { formatMoney, formatNumber, humanize } from '../lib';
import { PageIntro } from './Settings';

function monthsAgoStart(n) {
    const now = new Date();
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - n, 1));
    return d.toISOString().slice(0, 10);
}

const RANGES = [
    ['3', '3 months'],
    ['6', '6 months'],
    ['12', '12 months'],
    ['24', '24 months'],
];

export default function Revenue() {
    const [range, setRange] = useState('12');
    const { data, error, loading } = useApi('/admin/revenue', { from: monthsAgoStart(Number(range) - 1) });
    const r = data?.data;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <PageIntro title="Revenue">
                    Built only from payments recorded in{' '}
                    <Link to="/admin/subscriptions" className="font-semibold text-navy-700 underline">
                        Subscriptions
                    </Link>{' '}
                    (amount + paid date). There is no online payment gateway yet, so nothing here is estimated.
                </PageIntro>
                <RangePicker value={range} onChange={setRange} options={RANGES} />
            </div>
            {error && <ErrorState error={error} />}
            {loading && <PageLoading />}
            {r && (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard label="Revenue in range" value={formatMoney(r.total_paise)} hint={`${formatNumber(r.payments)} payments · ${r.from} → ${r.to}`} />
                        <StatCard label="Monthly recurring revenue" value={formatMoney(r.mrr_paise)} hint="Active monthly + yearly plans, per month" tone="accent" />
                        <StatCard label="Active subscriptions" value={formatNumber(r.active_subscriptions)} hint={r.one_time_active ? `${r.one_time_active} one-time` : undefined} tone="green" />
                        <StatCard label="Pending subscriptions" value={formatNumber(r.pending_subscriptions)} hint="Awaiting payment or activation" tone="stone" />
                    </div>
                    <section className="rounded-2xl border border-stone-200 bg-white p-4">
                        <h2 className="mb-3 font-semibold">Revenue by month (IST)</h2>
                        <Bars items={r.by_month.map((m) => ({ key: m.month, label: m.month, value: m.amount_paise }))} label="Revenue by month" format={(v) => formatMoney(v)} accent />
                    </section>
                    <div className="grid gap-4 lg:grid-cols-3">
                        <RankList title="By plan" rows={r.by_plan.map((p) => ({ key: p.plan, label: p.plan, value: p.amount_paise, display: formatMoney(p.amount_paise) }))} empty="No payments in this range." />
                        <RankList title="By payment method" rows={r.by_method.map((m) => ({ key: m.method, label: humanize(m.method), value: m.amount_paise, display: formatMoney(m.amount_paise) }))} empty="No payments in this range." />
                        <section className="rounded-2xl border border-stone-200 bg-white p-4">
                            <h2 className="font-semibold">Renewals in the next 30 days</h2>
                            {r.upcoming_renewals.length === 0 ? (
                                <p className="mt-3 text-sm text-stone-500">None due.</p>
                            ) : (
                                <ul className="mt-3 divide-y divide-stone-100 text-sm">
                                    {r.upcoming_renewals.map((s) => (
                                        <li key={s.id} className="flex justify-between gap-3 py-2">
                                            <Link to={`/admin/subscriptions/${s.id}`} className="min-w-0 truncate text-navy-700 hover:underline">
                                                {s.business} <span className="text-xs text-stone-500">· {s.plan}</span>
                                            </Link>
                                            <span className="shrink-0 text-stone-600">{s.ends_on}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>
                </>
            )}
        </div>
    );
}
