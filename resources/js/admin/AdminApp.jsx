import { useState } from 'react';
import { Link, Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useMeta } from '../hooks/useMeta';
import { PageLoading } from '../components/States';
import { Icon } from '../components/Icons';
import { CONTENT_PERMISSIONS, PERMISSIONS, can, humanize, isStaff } from './lib';
import { NAV, RESOURCES } from './resources';
import Dashboard from './pages/Dashboard';
import ResourceList from './pages/ResourceList';
import ResourceEdit from './pages/ResourceEdit';
import { UserDetail, UserList } from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import MediaLibrary from './pages/MediaLibrary';

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

function Sidebar({ user, onNavigate }) {
    const link = ({ isActive }) => `block rounded-lg px-3 py-1.5 text-sm ${isActive ? 'bg-forest-600 font-semibold text-white' : 'text-stone-700 hover:bg-forest-50'}`;
    const groups = NAV.map((keys) => keys.filter((k) => can(user, RESOURCES[k].permission))).filter((g) => g.length);

    return (
        <nav aria-label="Admin" className="space-y-4" onClick={onNavigate}>
            <NavLink to="/admin" end className={link}>
                Dashboard
            </NavLink>
            {groups.map((keys) => (
                <ul key={keys[0]} className="space-y-0.5">
                    {keys.map((k) => (
                        <li key={k}>
                            <NavLink to={`/admin/${k}`} className={link}>
                                {RESOURCES[k].label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            ))}
            <ul className="space-y-0.5">
                {can(user, CONTENT_PERMISSIONS) && (
                    <li>
                        <NavLink to="/admin/media" className={link}>
                            Media
                        </NavLink>
                    </li>
                )}
                {can(user, PERMISSIONS.users) && (
                    <li>
                        <NavLink to="/admin/users" className={link}>
                            Users & roles
                        </NavLink>
                    </li>
                )}
                {can(user, PERMISSIONS.audit) && (
                    <li>
                        <NavLink to="/admin/audit-logs" className={link}>
                            Audit log
                        </NavLink>
                    </li>
                )}
            </ul>
        </nav>
    );
}

function AdminLayout() {
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    useMeta({ title: 'Admin' });

    return (
        <div className="min-h-screen bg-stone-50">
            <header className="sticky top-0 z-30 border-b border-stone-200 bg-white">
                <div className="flex h-14 items-center gap-3 px-4">
                    <button type="button" className="rounded p-1 lg:hidden" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="admin-nav" aria-label="Menu">
                        <Icon name={open ? 'close' : 'menu'} />
                    </button>
                    <Link to="/admin" className="whitespace-nowrap font-display text-lg font-bold text-forest-700">
                        DOON<span className="text-saffron-500">PORTAL</span> <span className="hidden text-sm font-semibold text-stone-500 sm:inline">Admin</span>
                    </Link>
                    <div className="ml-auto flex items-center gap-3 whitespace-nowrap text-sm">
                        <span className="hidden text-stone-600 sm:inline">
                            {user.name} · {user.roles.filter((r) => r !== 'USER').map(humanize).join(', ')}
                        </span>
                        <Link to="/" className="font-semibold text-forest-700 hover:underline">
                            View site
                        </Link>
                        <button type="button" className="text-stone-600 hover:text-ink" onClick={logout}>
                            Sign out
                        </button>
                    </div>
                </div>
            </header>
            <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
                <aside id="admin-nav" className={`${open ? 'block' : 'hidden'} fixed inset-x-0 top-14 z-20 max-h-[calc(100vh-3.5rem)] overflow-y-auto border-b border-stone-200 bg-white p-4 lg:static lg:block lg:w-52 lg:shrink-0 lg:border-0 lg:bg-transparent lg:p-0`}>
                    <Sidebar user={user} onNavigate={() => setOpen(false)} />
                </aside>
                <main className="min-w-0 flex-1">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

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
                <Route
                    path="media"
                    element={
                        <Require permission={CONTENT_PERMISSIONS}>
                            <MediaLibrary />
                        </Require>
                    }
                />
                <Route
                    path="users"
                    element={
                        <Require permission={PERMISSIONS.users}>
                            <UserList />
                        </Require>
                    }
                />
                <Route
                    path="users/:id"
                    element={
                        <Require permission={PERMISSIONS.users}>
                            <UserDetail />
                        </Require>
                    }
                />
                <Route
                    path="audit-logs"
                    element={
                        <Require permission={PERMISSIONS.audit}>
                            <AuditLogs />
                        </Require>
                    }
                />
                <Route path="*" element={<Forbidden title="Page not found." />} />
            </Route>
        </Routes>
    );
}
