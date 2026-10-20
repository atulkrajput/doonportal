import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { PageLoading } from '../components/States';
import { Icon } from '../components/Icons';
import { Logo } from '../components/Brand';
import { CONTENT_PERMISSIONS, PERMISSIONS, can, humanize, isStaff } from './lib';
import { RESOURCES } from './resources';
import { MENU } from './menu';
import Dashboard from './pages/Dashboard';
import ResourceList from './pages/ResourceList';
import ResourceEdit from './pages/ResourceEdit';
import { UserDetail, UserList } from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import MediaLibrary from './pages/MediaLibrary';
import Account from './pages/Account';
import Analytics from './pages/Analytics';
import Revenue from './pages/Revenue';
import { SeoAudit, SeoPages, SeoSettings } from './pages/Seo';
import { LegalSettings, SocialSettings, TrackingSettings } from './pages/Settings';
import { ClaimsQueue, ReviewsQueue, SubmissionsQueue } from './pages/Moderation';

function Forbidden({ title = 'You don’t have access to this section.' }) {
    return (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-sm text-stone-600">Ask an administrator if you need it.</p>
            <Link to="/admin" className="btn-secondary mt-4">
                Back to dashboard
            </Link>
        </div>
    );
}

/** Route-level guard. The API enforces the same permission on every request. */
function Require({ permission, children }) {
    const { user } = useAuth();
    return can(user, permission) ? children : <Forbidden />;
}

const OPEN_GROUPS_KEY = 'doonportal.admin.menu';

function readOpenGroups() {
    try {
        return JSON.parse(window.localStorage.getItem(OPEN_GROUPS_KEY) || '[]');
    } catch {
        return [];
    }
}

function isActive(item, pathname) {
    return item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
}

/** Collapsible grouped menu. The group holding the current page is always open. */
function Sidebar({ user, onNavigate }) {
    const { pathname } = useLocation();
    const [openGroups, setOpenGroups] = useState(readOpenGroups);
    const groups = MENU.map((g) => ({ ...g, items: g.items.filter((i) => i.permission === null || can(user, i.permission)) })).filter((g) => g.items.length);

    const toggle = (id) => {
        const next = openGroups.includes(id) ? openGroups.filter((g) => g !== id) : [...openGroups, id];
        setOpenGroups(next);
        try {
            window.localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(next));
        } catch {
            // Storage unavailable: the menu simply won't remember its state.
        }
    };

    return (
        <nav aria-label="Admin" className="space-y-1">
            {groups.map((group) => {
                const current = group.items.some((i) => isActive(i, pathname));
                const open = current || openGroups.includes(group.id);
                const panelId = `admin-menu-${group.id}`;
                return (
                    <div key={group.id}>
                        <button
                            type="button"
                            onClick={() => toggle(group.id)}
                            aria-expanded={open}
                            aria-controls={panelId}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${current ? 'text-white' : 'text-navy-100 hover:bg-white/5 hover:text-white'}`}
                        >
                            <span className={`flex h-7 w-7 items-center justify-center rounded-md ${current ? 'bg-accent-500 text-white' : 'bg-white/10 text-navy-100'}`}>
                                <Icon name={group.icon} size={16} />
                            </span>
                            <span className="flex-1">{group.label}</span>
                            <Icon name="chevron" size={14} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
                        </button>
                        {open && (
                            <ul id={panelId} className="mb-2 ml-6 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                                {group.items.map((item) => (
                                    <li key={item.to}>
                                        <NavLink
                                            to={item.to}
                                            end={item.end}
                                            onClick={onNavigate}
                                            className={({ isActive: active }) =>
                                                `block rounded-md px-3 py-1.5 text-sm transition-colors ${active ? 'bg-white font-semibold text-navy-900' : 'text-navy-100 hover:bg-white/5 hover:text-white'}`
                                            }
                                        >
                                            {item.label}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}

/** The staff area is never indexed; the server shell already says so, this keeps it on client navigation. */
function useNoIndex(title) {
    useEffect(() => {
        document.title = `${title} | DoonPortal admin`;
        let robots = document.head.querySelector('meta[name="robots"]');
        if (!robots) {
            robots = document.createElement('meta');
            robots.name = 'robots';
            document.head.appendChild(robots);
        }
        robots.content = 'noindex,nofollow';
    }, [title]);
}

function AdminLayout() {
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const { pathname } = useLocation();
    const sectionTitle =
        MENU.flatMap((g) => g.items)
            .filter((i) => isActive(i, pathname))
            .sort((a, b) => b.to.length - a.to.length)[0]?.label ?? 'Admin';
    useNoIndex(sectionTitle);

    return (
        <div className="min-h-screen bg-stone-100">
            {/* Left menu: fixed on large screens, a drawer on small ones. */}
            <aside
                id="admin-nav"
                className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy-900 text-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex h-16 shrink-0 items-center gap-2 border-b border-white/10 px-4">
                    <Logo to="/admin" light label="DoonPortal admin home" />
                    <span className="ml-auto rounded bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Admin</span>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-4">
                    <Sidebar user={user} onNavigate={() => setOpen(false)} />
                </div>
                <div className="border-t border-white/10 p-3 text-sm">
                    <Link to="/admin/account" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 hover:bg-white/5">
                        <span className="block truncate font-semibold">{user.name}</span>
                        <span className="block truncate text-xs text-navy-200">
                            {user.roles
                                .filter((r) => r !== 'USER')
                                .map(humanize)
                                .join(', ')}
                        </span>
                    </Link>
                </div>
            </aside>
            {open && <button type="button" className="fixed inset-0 z-30 bg-navy-900/50 lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)} />}

            <div className="lg:pl-64">
                <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-stone-200 bg-white/95 px-4 backdrop-blur sm:px-6">
                    <button type="button" className="rounded p-1 lg:hidden" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="admin-nav" aria-label="Menu">
                        <Icon name={open ? 'close' : 'menu'} />
                    </button>
                    <p className="truncate font-display text-lg font-semibold text-navy-700">{sectionTitle}</p>
                    <div className="ml-auto flex items-center gap-2 whitespace-nowrap text-sm">
                        <a href="/" target="_blank" rel="noreferrer" className="btn-secondary" aria-label="View site">
                            <Icon name="external" size={14} /> <span className="hidden sm:inline">View site</span>
                        </a>
                        <button type="button" className="btn-secondary" onClick={logout} aria-label="Sign out">
                            <Icon name="logout" size={14} /> <span className="hidden sm:inline">Sign out</span>
                        </button>
                    </div>
                </header>
                <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

/** Simple permission-guarded pages (path, permission, element). */
const PAGES = [
    ['media', CONTENT_PERMISSIONS, <MediaLibrary key="media" />],
    ['users', PERMISSIONS.users, <UserList key="users" />],
    ['users/:id', PERMISSIONS.users, <UserDetail key="user" />],
    ['audit-logs', PERMISSIONS.audit, <AuditLogs key="audit" />],
    ['analytics', PERMISSIONS.analytics, <Analytics key="analytics" />],
    ['revenue', PERMISSIONS.monetization, <Revenue key="revenue" />],
    ['seo', PERMISSIONS.seo, <SeoSettings key="seo" />],
    ['seo/pages', PERMISSIONS.seo, <SeoPages key="seo-pages" />],
    ['seo/audit', PERMISSIONS.seo, <SeoAudit key="seo-audit" />],
    ['social', PERMISSIONS.settings, <SocialSettings key="social" />],
    ['tracking', PERMISSIONS.settings, <TrackingSettings key="tracking" />],
    ['legal', PERMISSIONS.settings, <LegalSettings key="legal" />],
    ['claims', PERMISSIONS.claims, <ClaimsQueue key="claims" />],
    ['submissions', PERMISSIONS.submissions, <SubmissionsQueue key="submissions" />],
    ['reviews', PERMISSIONS.reviews, <ReviewsQueue key="reviews" />],
];

export default function AdminApp() {
    const { user, ready } = useAuth();
    const location = useLocation();

    if (!ready) {
        return <PageLoading />;
    }
    if (!user) {
        return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
    }
    if (!isStaff(user)) {
        return (
            <div className="container-page py-16">
                <Forbidden title="The admin area is for DoonPortal staff." />
            </div>
        );
    }

    return (
        <Routes>
            <Route element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                {Object.entries(RESOURCES).map(([key, resource]) => (
                    <Route key={key} path={key}>
                        <Route
                            index
                            element={
                                <Require permission={resource.permission}>
                                    <ResourceList key={key} resourceKey={key} resource={resource} />
                                </Require>
                            }
                        />
                        <Route
                            path=":id"
                            element={
                                <Require permission={resource.permission}>
                                    <ResourceEdit key={key} resourceKey={key} resource={resource} />
                                </Require>
                            }
                        />
                    </Route>
                ))}
                {PAGES.map(([path, permission, element]) => (
                    <Route key={path} path={path} element={<Require permission={permission}>{element}</Require>} />
                ))}
                <Route path="account" element={<Account />} />
                <Route path="*" element={<Forbidden title="Page not found." />} />
            </Route>
        </Routes>
    );
}
