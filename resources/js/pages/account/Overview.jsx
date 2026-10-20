import { Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { Icon } from '../../components/Icons';
import { StatusPill } from '../../components/Form';
import { Panel } from './AccountLayout';

function Stat({ to, icon, label, value }) {
    return (
        <Link to={to} className="group flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-navy-500">
            <span className="icon-badge">
                <Icon name={icon} size={20} />
            </span>
            <span>
                <span className="block font-display text-2xl font-bold leading-none">{value ?? '–'}</span>
                <span className="text-sm text-stone-600 group-hover:text-navy-700">{label}</span>
            </span>
        </Link>
    );
}

export default function Overview() {
    const { user } = useAuth();
    const { data: saved } = useApi('/me/saved', { per_page: 1 });
    const { data: reviews } = useApi('/me/reviews', { per_page: 1 });
    const { data: businesses } = useApi('/me/businesses');
    const { data: claims } = useApi('/me/claims', { per_page: 5 });
    const { data: submissions } = useApi('/me/submissions', { per_page: 5 });

    const todo = [
        !user.phone && { to: '/account/profile', text: 'Add your mobile number' },
        !user.address?.city && { to: '/account/profile', text: 'Add your address' },
        !user.has_password && { to: '/account/security', text: 'Set a password so you can also sign in with email' },
    ].filter(Boolean);

    const open = [
        ...(claims?.data || []).filter((c) => c.status === 'PENDING').map((c) => ({ id: c.id, text: `Ownership claim for ${c.business?.name ?? 'a listing'}`, status: c.status })),
        ...(submissions?.data || []).filter((s) => s.status === 'PENDING').map((s) => ({
            id: s.id,
            text: s.type === 'BUSINESS' ? `New listing: ${s.payload?.name}` : `Changes to ${s.business?.name ?? 'your listing'}`,
            status: s.status,
        })),
    ];
    const owned = businesses?.data || [];

    return (
        <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
                <Stat to="/account/saved" icon="heart" label="Saved" value={saved?.meta?.total} />
                <Stat to="/account/reviews" icon="star" label="Reviews" value={reviews?.meta?.total} />
                <Stat to="/account/businesses" icon="store" label="Businesses" value={businesses ? owned.length : undefined} />
            </div>

            {todo.length > 0 && (
                <Panel title="Finish setting up">
                    <ul className="space-y-2">
                        {todo.map((t) => (
                            <li key={t.text}>
                                <Link to={t.to} className="flex items-center justify-between gap-3 rounded-xl bg-cream px-4 py-3 text-sm font-medium hover:text-navy-700">
                                    {t.text} <Icon name="chevron" size={16} />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Panel>
            )}

            {open.length > 0 && (
                <Panel title="Waiting for review" action={<Link to="/account/businesses" className="text-sm font-semibold text-navy-700">See all</Link>}>
                    <ul className="divide-y divide-stone-100">
                        {open.map((item) => (
                            <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                                <span>{item.text}</span>
                                <StatusPill status={item.status} />
                            </li>
                        ))}
                    </ul>
                    <p className="mt-3 text-xs text-stone-500">Our team usually reviews requests within 2 working days.</p>
                </Panel>
            )}

            {owned.length > 0 ? (
                <Panel title="Your businesses" action={<Link to="/account/businesses" className="text-sm font-semibold text-navy-700">Manage</Link>}>
                    <ul className="grid gap-3 sm:grid-cols-2">
                        {owned.map((b) => (
                            <li key={b.id}>
                                <Link to={`/account/businesses/${b.id}`} className="block rounded-xl border border-stone-200 p-4 hover:border-navy-500">
                                    <p className="font-semibold">{b.name}</p>
                                    <p className="mt-1 text-sm text-stone-600">
                                        {b.last_30_days.views} views · {b.last_30_days.actions} calls, chats & visits in 30 days
                                    </p>
                                    {b.unanswered_reviews > 0 && <p className="mt-1 text-sm font-semibold text-accent-600">{b.unanswered_reviews} review{b.unanswered_reviews > 1 ? 's' : ''} to reply to</p>}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Panel>
            ) : (
                <div className="rounded-2xl bg-navy-900 p-6 text-white">
                    <p className="font-display text-xl font-bold">Own a business in Dehradun?</p>
                    <p className="mt-1 text-navy-100">Claim your listing or add it for free. Keep hours and contact details right, reply to reviews and see how people find you.</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Link to="/account/businesses/new" className="btn-accent">
                            <Icon name="store" size={16} /> Add a business
                        </Link>
                        <Link to="/businesses" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-4 py-2 text-sm font-semibold hover:bg-white/10">
                            Find your listing to claim
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
