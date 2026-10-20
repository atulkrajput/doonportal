import { Route, Routes } from 'react-router';
import AccountLayout from './AccountLayout';
import Overview from './Overview';
import Profile from './Profile';
import Saved from './Saved';
import Reviews from './Reviews';
import Security from './Security';
import Businesses from './Businesses';
import AddBusiness from './AddBusiness';
import ManageBusiness from './ManageBusiness';
import NotFound from '../NotFound';

/** /account/* — members' area, loaded as its own chunk. */
export default function AccountApp() {
    return (
        <Routes>
            <Route element={<AccountLayout />}>
                <Route index element={<Overview />} />
                <Route path="profile" element={<Profile />} />
                <Route path="saved" element={<Saved />} />
                <Route path="reviews" element={<Reviews />} />
                <Route path="security" element={<Security />} />
                <Route path="businesses" element={<Businesses />} />
                <Route path="businesses/new" element={<AddBusiness />} />
                <Route path="businesses/:id" element={<ManageBusiness />} />
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    );
}
