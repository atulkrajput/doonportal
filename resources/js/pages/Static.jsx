import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/Listing';
import { EmptyState } from '../components/States';

export function Saved() {
    const { user, ready, logout } = useAuth();

    if (!ready) {
        return null;
    }
    if (!user) {
        return (
            <>
                <PageHeader eyebrow="Saved" title="My DoonPortal" />
                <div className="container-page py-8">
                    <EmptyState title="Sign in to save places, events and businesses" action={<Link to="/login" className="btn-primary">Sign in</Link>} />
                </div>
            </>
        );
    }
    return (
        <>
            <PageHeader eyebrow="Saved" title={`Hi, ${user.name}`} />
            <div className="container-page space-y-6 py-8">
                <EmptyState title="Saving is coming soon">Favourites, reviews and your submissions will appear here.</EmptyState>
                <button type="button" className="btn-secondary" onClick={logout}>
                    Sign out
                </button>
            </div>
        </>
    );
}

export function BusinessPortal() {
    return (
        <>
            <PageHeader eyebrow="For business" title="Your business on DoonPortal">
                A free, accurate listing that helps people in Dehradun find you.
            </PageHeader>
            <div className="container-page grid gap-6 py-8 md:grid-cols-3">
                {[
                    ['List for free', 'Basic profile, contact details, map location and photos.'],
                    ['Claim your listing', 'Already listed? Verify ownership to update hours, photos and offers.'],
                    ['See what works', 'Owners will get simple analytics on calls, directions and website visits.'],
                ].map(([title, text]) => (
                    <div key={title} className="rounded-2xl border border-stone-200 bg-white p-6">
                        <h2 className="font-display text-xl font-bold">{title}</h2>
                        <p className="mt-2 text-stone-600">{text}</p>
                    </div>
                ))}
                <div className="rounded-2xl bg-accent-100 p-6 md:col-span-3">
                    <p className="font-semibold">The business portal is being built.</p>
                    <p className="mt-1 text-stone-700">Listing submissions and ownership claims open in an upcoming release. Create an account now and you’ll be ready.</p>
                    <Link to="/register" className="btn-primary mt-4">
                        Create an account
                    </Link>
                </div>
            </div>
        </>
    );
}
