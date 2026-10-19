import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Icon } from './Icons';

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
    { to: '/saved', label: 'Saved', icon: 'heart' },
];

function Logo() {
    return (
        <Link to="/" className="flex items-baseline gap-1 font-display text-xl font-bold tracking-tight text-forest-700" aria-label="DoonPortal home">
            DOON<span className="text-saffron-500">PORTAL</span>
        </Link>
    );
}

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
        `rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${isActive ? 'bg-forest-50 text-forest-700' : 'text-stone-700 hover:text-forest-700'}`;

    return (
        <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-cream/95 backdrop-blur">
            <div className="container-page flex h-16 items-center gap-4">
                <Logo />
                <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Main">
                    {NAV.map((item) => (
                        <NavLink key={item.to} to={item.to} className={linkClass}>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="ml-auto flex items-center gap-2">
                    <button type="button" onClick={() => navigate('/search')} className="btn-secondary hidden sm:inline-flex">
                        <Icon name="search" size={16} /> Search Doon
                    </button>
                    <Link to="/business-portal" className="btn-primary hidden md:inline-flex">
                        <Icon name="store" size={16} /> Business
                    </Link>
                    <Link to={user ? '/saved' : '/login'} className="hidden rounded-full p-2 text-stone-700 hover:text-forest-700 sm:block" aria-label={user ? 'My DoonPortal' : 'Sign in'}>
                        <Icon name="user" />
                    </Link>
                    <button type="button" className="rounded-full p-2 lg:hidden" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="mobile-menu" aria-label="Menu">
                        <Icon name={open ? 'close' : 'menu'} />
                    </button>
                </div>
            </div>
            {open && (
                <nav id="mobile-menu" className="border-t border-stone-200 bg-cream lg:hidden" aria-label="Mobile">
                    <div className="container-page grid grid-cols-2 gap-1 py-3">
                        {[...NAV, { to: '/areas', label: 'Areas' }, { to: '/collections', label: 'Best of Doon' }, { to: '/business-portal', label: 'List your business' }, { to: user ? '/saved' : '/login', label: user ? 'My DoonPortal' : 'Sign in' }].map((item) => (
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
                            className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-forest-700' : 'text-stone-500'}`}
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
    const columns = [
        ['Discover', [['/places', 'Things to do'], ['/businesses/food-drink', 'Eat'], ['/businesses/shopping', 'Shop'], ['/services', 'Services'], ['/events', 'Events']]],
        ['Doon', [['/areas', 'Areas'], ['/stories', 'Stories'], ['/collections', 'Best of Doon'], ['/explore', 'All categories']]],
        ['For business', [['/business-portal', 'List your business'], ['/business-portal', 'Claim a listing']]],
        ['About', [['/about', 'About DoonPortal'], ['/privacy', 'Privacy'], ['/terms', 'Terms']]],
    ];
    return (
        <footer className="mt-16 border-t border-stone-200 bg-forest-900 pb-24 text-forest-100 md:pb-0">
            <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                    <p className="font-display text-xl font-bold text-white">
                        DOON<span className="text-saffron-400">PORTAL</span>
                    </p>
                    <p className="mt-2 text-sm text-forest-200">All things Doon. Discover. Connect. Belong.</p>
                </div>
                {columns.map(([heading, links]) => (
                    <div key={heading}>
                        <p className="text-sm font-semibold text-white">{heading}</p>
                        <ul className="mt-3 space-y-2 text-sm">
                            {links.map(([to, label]) => (
                                <li key={label}>
                                    <Link to={to} className="text-forest-200 hover:text-white">
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <div className="border-t border-white/10">
                <p className="container-page py-4 text-xs text-forest-200">© {new Date().getFullYear()} DoonPortal · Dehradun, Uttarakhand</p>
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
