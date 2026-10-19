import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
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
import { BusinessPortal, InfoPage, Saved } from './pages/Static';
import NotFound from './pages/NotFound';

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
            <AuthProvider>
                <Routes>
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
                        <Route path="about" element={<InfoPage page="about" />} />
                        <Route path="privacy" element={<InfoPage page="privacy" />} />
                        <Route path="terms" element={<InfoPage page="terms" />} />
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
