import { StrictMode, Suspense, lazy, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import SeoManager from './components/SeoManager';
import Home from './pages/Home';
import Search from './pages/Search';
import BusinessList from './pages/BusinessList';
import BusinessDetail from './pages/BusinessDetail';
import PlaceList from './pages/PlaceList';
import PlaceDetail from './pages/PlaceDetail';
import EventList from './pages/EventList';
import EventDetail from './pages/EventDetail';
import StoryList from './pages/StoryList';
import StoryDetail from './pages/StoryDetail';
import CollectionList from './pages/CollectionList';
import CollectionDetail from './pages/CollectionDetail';
import { AreaDetail, AreaList } from './pages/Areas';
import { Explore, Services } from './pages/Explore';
import { ForgotPassword, Login, Register, ResetPassword } from './pages/Auth';
import { BusinessPortal, Saved } from './pages/Static';
import SitePage from './pages/SitePage';
import CookieBanner from './components/CookieBanner';
import NotFound from './pages/NotFound';
import { PageLoading } from './components/States';

// Staff-only code is split into its own chunk and never loaded by public visitors.
const AdminApp = lazy(() => loadChunk(() => import('./admin/AdminApp')));

/**
 * A chunk can fail to load after a deploy (old file names) or a network blip.
 * Retry once, then reload the page once to pick up the new build; after that,
 * show a message instead of an endless spinner.
 */
async function loadChunk(factory) {
    try {
        const module = await factory();
        try {
            window.sessionStorage.removeItem('doonportal.chunk-reload');
        } catch {
            // Storage unavailable; nothing to reset.
        }
        return module;
    } catch {
        try {
            return await factory();
        } catch (error) {
            const key = 'doonportal.chunk-reload';
            let reloaded = false;
            try {
                reloaded = window.sessionStorage.getItem(key) === '1';
                window.sessionStorage.setItem(key, '1');
            } catch {
                reloaded = true;
            }
            if (!reloaded) {
                window.location.reload();
                return new Promise(() => {});
            }
            return {
                default: function ChunkError() {
                    return (
                        <div className="container-page py-16 text-center">
                            <p className="font-semibold">This part of DoonPortal didn’t load.</p>
                            <button type="button" className="btn-primary mt-4" onClick={() => window.location.reload()}>
                                Reload
                            </button>
                            <p className="sr-only">{String(error)}</p>
                        </div>
                    );
                },
            };
        }
    }
}

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

function App() {
    return (
        <BrowserRouter>
            <ScrollToTop />
            <SeoManager />
            <CookieBanner />
            <AuthProvider>
                <Routes>
                    <Route
                        path="admin/*"
                        element={
                            <Suspense fallback={<PageLoading />}>
                                <AdminApp />
                            </Suspense>
                        }
                    />
                    <Route element={<Layout />}>
                        <Route index element={<Home />} />
                        <Route path="search" element={<Search />} />
                        <Route path="explore" element={<Explore />} />
                        <Route path="services" element={<Services />} />
                        <Route path="businesses" element={<BusinessList />} />
                        <Route path="businesses/:category" element={<BusinessList />} />
                        <Route path="business/:slug" element={<BusinessDetail />} />
                        <Route path="places" element={<PlaceList />} />
                        <Route path="places/:category" element={<PlaceList />} />
                        <Route path="place/:slug" element={<PlaceDetail />} />
                        <Route path="events" element={<EventList />} />
                        <Route path="event/:slug" element={<EventDetail />} />
                        <Route path="areas" element={<AreaList />} />
                        <Route path="area/:slug" element={<AreaDetail />} />
                        <Route path="stories" element={<StoryList />} />
                        <Route path="story/:slug" element={<StoryDetail />} />
                        <Route path="guide/:slug" element={<StoryDetail />} />
                        <Route path="collections" element={<CollectionList />} />
                        <Route path="collection/:slug" element={<CollectionDetail />} />
                        <Route path="login" element={<Login />} />
                        <Route path="register" element={<Register />} />
                        <Route path="forgot-password" element={<ForgotPassword />} />
                        <Route path="reset-password" element={<ResetPassword />} />
                        <Route path="saved" element={<Saved />} />
                        <Route path="business-portal" element={<BusinessPortal />} />
                        {/* Editable site pages: /privacy, /terms, /cookies, /about, /contact… */}
                        <Route path=":slug" element={<SitePage />} />
                        <Route path="*" element={<NotFound />} />
                    </Route>
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

createRoot(document.getElementById('app')).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
