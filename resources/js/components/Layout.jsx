import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Icon } from './Icons';
import { Logo } from './Brand';
import { SOCIAL_PROFILES, siteConfig } from '../lib/site';
import { openCookieSettings } from '../lib/consent';
import { isStaff } from '../admin/lib';

const NAV = [
    { to: '/places', label: 'Explore' },
    { to: '/businesses/food-drink', label: 'Eat' },
    { to: '/businesses/shopping', label: 'Shop' },
    { to: '/services', label: 'Services' },
    { to: '/events', label: 'Events' },
    { to: '/stories', label: 'Stories' },
];

const MOBILE_NAV = [
    { to: '/', label: 'Home', icon: 'home', end: true },
    { to: '/places', label: 'Explore', icon: 'compass' },
    { to: '/search', label: 'Search', icon: 'search' },
    { to: '/events', label: 'Events', icon: 'calendar' },
    { to: '/account/saved', label: 'Saved', icon: 'heart' },
];

function Header() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [lastPath, setLastPath] = useState(location.pathname);

    if (lastPath !== location.pathname) {
        setLastPath(location.pathname);
        setOpen(false);
    }

    const linkClass = ({ isActive }) =>
        `relative px-3 py-1.5 text-sm font-semibold uppercase tracking-wide transition-colors after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded after:bg-accent-500 ${isActive ? 'text-navy-700 after:opacity-100' : 'text-stone-600 after:opacity-0 hover:text-navy-700'}`;

    return (
        <header className="sticky top-0 z-30 border-t-4 border-b border-t-accent-500 border-b-stone-200/80 bg-cream/95 backdrop-blur">
            <div className="container-page flex h-16 items-center gap-4">
                <Logo tagline />
                <nav className="ml-4 hidden items-center gap-1 xl:flex" aria-label="Main">
                    {NAV.map((item) => (
                        <NavLink key={item.to} to={item.to} className={linkClass}>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="ml-auto flex items-center gap-2">
                    <button type="button" onClick={() => navigate('/search')} className="btn-secondary hidden whitespace-nowrap sm:inline-flex">
                        <Icon name="search" size={16} /> Search Doon
                    </button>
                    {isStaff(user) && (
                        <Link to="/admin" className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 sm:inline-flex">
                            Admin
                        </Link>
                    )}
                    <Link to="/business-portal" className="btn-primary hidden whitespace-nowrap md:inline-flex">
                        <Icon name="store" size={16} /> Business
                    </Link>
                    {user ? (
                        <Link to="/account" className="hidden items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-semibold text-stone-700 hover:bg-navy-50 hover:text-navy-700 sm:inline-flex" aria-label="My DoonPortal">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-navy-700 text-xs font-bold text-white" aria-hidden="true">
                                {user.name?.trim()?.[0]?.toUpperCase()}
                            </span>
                            <span className="hidden max-w-[8rem] truncate lg:inline">{user.name?.split(' ')[0]}</span>
                        </Link>
                    ) : (
                        <Link to="/login" className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-navy-50 hover:text-navy-700 sm:inline-flex">
                            Sign in
                        </Link>
                    )}
                    <button type="button" className="rounded-full p-2 xl:hidden" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="mobile-menu" aria-label="Menu">
                        <Icon name={open ? 'close' : 'menu'} />
                    </button>
                </div>
            </div>
            {open && (
                <nav id="mobile-menu" className="border-t border-stone-200 bg-cream xl:hidden" aria-label="Mobile">
                    <div className="container-page grid grid-cols-2 gap-1 py-3">
                        {[...NAV, { to: '/areas', label: 'Areas' }, { to: '/collections', label: 'Best of Doon' }, { to: '/business-portal', label: 'List your business' }, { to: user ? '/account' : '/login', label: user ? 'My DoonPortal' : 'Sign in' }, ...(isStaff(user) ? [{ to: '/admin', label: 'Admin' }] : [])].map((item) => (
                            <NavLink key={item.to + item.label} to={item.to} className={linkClass}>
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                </nav>
            )}
        </header>
    );
}

function MobileNav() {
    return (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Quick">
            <ul className="grid grid-cols-5">
                {MOBILE_NAV.map((item) => (
                    <li key={item.to}>
                        <NavLink
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-navy-700' : 'text-stone-500'}`}
                        >
                            <Icon name={item.icon} />
                            {item.label}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

function Footer() {
    const profiles = siteConfig().social || {};
    const social = SOCIAL_PROFILES.filter(([key]) => profiles[key]);
    const columns = [
        ['Discover', [['/places', 'Things to do'], ['/businesses/food-drink', 'Eat'], ['/businesses/shopping', 'Shop'], ['/services', 'Services'], ['/events', 'Events']]],
        ['Doon', [['/areas', 'Areas'], ['/stories', 'Stories'], ['/collections', 'Best of Doon'], ['/explore', 'All categories']]],
        ['For business', [['/business-portal', 'DoonPortal for business'], ['/account/businesses/new', 'List your business'], ['/businesses', 'Claim a listing']]],
        ['About', (siteConfig().footer_pages || []).map((p) => [p.path, p.title])],
    ];
    return (
        <footer className="torn-top mt-16 bg-navy-900 pb-24 pt-6 text-navy-100 md:pb-0">
            <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                    <Logo light />
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-navy-200">Discover. Connect. Belong.</p>
                    <p className="mt-3 font-script text-2xl leading-tight text-accent-400">Local stories. Real connections.</p>
                    {social.length > 0 && (
                        <div className="mt-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-white">Follow us</p>
                            <ul className="mt-2 flex gap-2">
                                {social.map(([key, label, icon]) => (
                                    <li key={key}>
                                        <a
                                            href={profiles[key]}
                                            target="_blank"
                                            rel="noopener noreferrer me"
                                            aria-label={`DoonPortal on ${label}`}
                                            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-navy-900 transition-colors hover:bg-accent-500 hover:text-white"
                                        >
                                            <Icon name={icon} size={18} />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                {columns.map(([heading, links]) => (
                    <div key={heading}>
                        <p className="text-sm font-semibold uppercase tracking-wide text-white">{heading}</p>
                        <ul className="mt-3 space-y-2 text-sm">
                            {links.map(([to, label]) => (
                                <li key={label}>
                                    <Link to={to} className="text-navy-200 hover:text-accent-400">
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <div className="border-t border-white/10">
                <div className="container-page flex flex-wrap items-center justify-between gap-3 py-4 text-xs text-navy-200">
                    <p>© {new Date().getFullYear()} DoonPortal · Dehradun, Uttarakhand</p>
                    <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <Link to="/privacy" className="hover:text-accent-400">
                            Privacy
                        </Link>
                        <Link to="/terms" className="hover:text-accent-400">
                            Terms
                        </Link>
                        <Link to="/cookies" className="hover:text-accent-400">
                            Cookies
                        </Link>
                        <button type="button" onClick={openCookieSettings} className="hover:text-accent-400">
                            Cookie settings
                        </button>
                    </nav>
                </div>
            </div>
        </footer>
    );
}

export default function Layout() {
    return (
        <div className="flex min-h-screen flex-col">
            <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
                Skip to content
            </a>
            <Header />
            <main id="main" className="flex-1">
                <Outlet />
            </main>
            <Footer />
            <MobileNav />
        </div>
    );
}
