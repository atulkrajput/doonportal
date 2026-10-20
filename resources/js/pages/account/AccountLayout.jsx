import { Navigate, NavLink, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/Icons';
import { PageLoading } from '../../components/States';

const NAV = [
    { to: '/account', label: 'Overview', icon: 'home', end: true },
    { to: '/account/saved', label: 'Saved', icon: 'heart' },
    { to: '/account/reviews', label: 'My reviews', icon: 'star' },
    { to: '/account/businesses', label: 'My businesses', icon: 'store' },
    { to: '/account/profile', label: 'Profile', icon: 'user' },
    { to: '/account/security', label: 'Sign-in & security', icon: 'shield' },
];

function initials(name = '') {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');
}

export function Avatar({ user, size = 'h-14 w-14 text-lg' }) {
    return user?.avatar_url ? (
        <img src={user.avatar_url} alt="" className={`${size} rounded-full object-cover`} />
    ) : (
        <span className={`${size} inline-flex shrink-0 items-center justify-center rounded-full bg-navy-700 font-display font-bold text-white`} aria-hidden="true">
            {initials(user?.name)}
        </span>
    );
}

/** Account pages need a signed-in member; guests go to sign in and come back. */
export default function AccountLayout() {
    const { user, ready } = useAuth();
    const location = useLocation();

    if (!ready) {
        return <PageLoading />;
    }
    if (!user) {
        return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
    }

    const linkClass = ({ isActive }) =>
        `flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors lg:rounded-xl ${isActive ? 'bg-navy-700 text-white' : 'text-stone-700 hover:bg-navy-50 hover:text-navy-700'}`;

    return (
        <div>
            <div className="border-b border-stone-200 bg-gradient-to-b from-navy-50 to-cream">
                <div className="container-page flex items-center gap-4 py-6 sm:py-8">
                    <Avatar user={user} />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold uppercase tracking-wide text-navy-600">My DoonPortal</p>
                        <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">{user.name}</h1>
                        <p className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
                            <span className="truncate">{user.email}</span>
                            {user.is_business_owner && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                                    <Icon name="store" size={12} /> Business owner
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </div>
            <div className="container-page grid gap-6 py-6 lg:grid-cols-[220px_1fr] lg:py-8">
                <nav aria-label="Account" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
                    <ul className="flex gap-1 lg:flex-col">
                        {NAV.map((item) => (
                            <li key={item.to}>
                                <NavLink to={item.to} end={item.end} className={linkClass}>
                                    <Icon name={item.icon} size={16} /> {item.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="min-w-0">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

/** Card used across account pages. */
export function Panel({ title, action, children, className = '' }) {
    return (
        <section className={`rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 ${className}`}>
            {(title || action) && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    {title && <h2 className="font-display text-xl font-bold">{title}</h2>}
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}
