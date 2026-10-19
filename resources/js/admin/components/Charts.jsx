/**
 * Minimal bar chart (no chart library): one bar per item, value in the tooltip
 * and in a visually hidden table for screen readers.
 */
export function Bars({ items, label, format = (v) => v, height = 160, accent = false }) {
    const max = Math.max(1, ...items.map((i) => i.value));
    return (
        <figure>
            <div className="flex items-end gap-[2px] border-b border-stone-200" style={{ height }} aria-hidden="true">
                {items.map((i) => (
                    <div key={i.key} className="group relative flex h-full flex-1 items-end">
                        <div
                            className={`w-full rounded-t ${accent ? 'bg-accent-500' : 'bg-navy-600'} transition-opacity group-hover:opacity-80`}
                            style={{ height: `${Math.max(i.value > 0 ? 2 : 0, (i.value / max) * 100)}%` }}
                        />
                        <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-navy-900 px-2 py-1 text-xs text-white group-hover:block">
                            {i.label}: {format(i.value)}
                        </span>
                    </div>
                ))}
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-stone-500" aria-hidden="true">
                <span>{items[0]?.label}</span>
                <span>{items[items.length - 1]?.label}</span>
            </div>
            <table className="sr-only">
                <caption>{label}</caption>
                <tbody>
                    {items.map((i) => (
                        <tr key={i.key}>
                            <th scope="row">{i.label}</th>
                            <td>{format(i.value)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </figure>
    );
}

export function StatCard({ label, value, hint, tone = 'navy' }) {
    const tones = { navy: 'border-l-navy-600', accent: 'border-l-accent-500', green: 'border-l-emerald-600', stone: 'border-l-stone-400' };
    return (
        <div className={`rounded-2xl border border-l-4 border-stone-200 bg-white p-4 ${tones[tone]}`}>
            <p className="text-sm text-stone-600">{label}</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums text-ink">{value}</p>
            {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
        </div>
    );
}

/** Simple two-column ranked list. */
export function RankList({ title, rows, empty = 'No data yet.', valueLabel }) {
    const max = Math.max(1, ...rows.map((r) => r.value));
    return (
        <section className="rounded-2xl border border-stone-200 bg-white p-4">
            <h2 className="font-semibold">{title}</h2>
            {rows.length === 0 ? (
                <p className="mt-3 text-sm text-stone-500">{empty}</p>
            ) : (
                <ol className="mt-3 space-y-2 text-sm">
                    {rows.map((r) => (
                        <li key={r.key}>
                            <div className="flex justify-between gap-3">
                                <span className="min-w-0 truncate">{r.label}</span>
                                <span className="shrink-0 tabular-nums text-stone-700">
                                    {r.display ?? r.value}
                                    {valueLabel ? ` ${valueLabel}` : ''}
                                </span>
                            </div>
                            <div className="mt-1 h-1.5 rounded-full bg-stone-100">
                                <div className="h-1.5 rounded-full bg-accent-500" style={{ width: `${(r.value / max) * 100}%` }} />
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}

export function RangePicker({ value, onChange, options }) {
    return (
        <div className="inline-flex rounded-full border border-stone-300 bg-white p-0.5 text-sm" role="group" aria-label="Date range">
            {options.map(([key, label]) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => onChange(key)}
                    aria-pressed={value === key}
                    className={`rounded-full px-3 py-1 ${value === key ? 'bg-navy-700 font-semibold text-white' : 'text-stone-700 hover:text-navy-700'}`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

/** YYYY-MM-DD for "n days ago" in IST. */
export function daysAgo(n) {
    const d = new Date(Date.now() - n * 86400000);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
}
