import { Link } from 'react-router';
import { useMeta } from '../hooks/useMeta';
import SearchBox from '../components/SearchBox';

export default function NotFound() {
    useMeta({ title: 'Page not found' });
    return (
        <div className="container-page py-20 text-center">
            <p className="font-display text-6xl font-bold text-forest-200">404</p>
            <h1 className="mt-2 font-display text-3xl font-bold">We couldn’t find that page</h1>
            <p className="mt-2 text-stone-600">It may have moved, or the listing is no longer public.</p>
            <div className="mx-auto mt-6 max-w-lg">
                <SearchBox />
            </div>
            <Link to="/" className="btn-secondary mt-6">
                Back to home
            </Link>
        </div>
    );
}
