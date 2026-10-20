import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/Listing';
import { Icon } from '../components/Icons';

export function BusinessPortal() {
    const { user } = useAuth();
    const addTo = user ? '/account/businesses/new' : `/register?next=${encodeURIComponent('/account/businesses/new')}`;
    const steps = [
        ['store', 'List for free', 'Add your business with its address, phone, WhatsApp and website. Our team checks it and it goes live, usually within 2 working days.'],
        ['flag', 'Claim your listing', 'Already on DoonPortal? Open your listing and choose “Claim this listing”. We verify you, then it’s yours to manage.'],
        ['settings', 'Keep it right', 'Update opening hours, services and menu, contact details and social links from your account. We check changes before they go live.'],
        ['star', 'Talk to customers', 'Reply publicly to reviews and show people you care.'],
        ['chart', 'See what works', 'Track listing views, calls, WhatsApp chats, direction requests and website visits.'],
        ['shield', 'Trusted by locals', 'Listings our team has checked get a verified badge, so people know the details are right.'],
    ];
    return (
        <>
            <PageHeader eyebrow="For business" title="Your business on DoonPortal">
                A free, accurate listing that helps people in Dehradun find you, call you and visit.
            </PageHeader>
            <div className="container-page space-y-8 py-8">
                <div className="flex flex-wrap gap-3">
                    <Link to={addTo} className="btn-primary">
                        <Icon name="store" size={16} /> Add your business
                    </Link>
                    <Link to="/businesses" className="btn-secondary">
                        <Icon name="search" size={16} /> Find your listing to claim
                    </Link>
                    {user?.is_business_owner && (
                        <Link to="/account/businesses" className="btn-secondary">
                            Go to my businesses
                        </Link>
                    )}
                </div>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {steps.map(([icon, title, text], i) => (
                        <li key={title} className="rounded-2xl border border-stone-200 bg-white p-6">
                            <span className={`icon-badge ${i % 2 ? 'icon-badge-accent' : ''}`}>
                                <Icon name={icon} />
                            </span>
                            <h2 className="mt-3 font-display text-xl font-bold">{title}</h2>
                            <p className="mt-2 text-stone-600">{text}</p>
                        </li>
                    ))}
                </ul>
                <div className="rounded-2xl bg-navy-900 p-6 text-white sm:p-8">
                    <p className="font-display text-2xl font-bold">How it works</p>
                    <ol className="mt-4 grid gap-4 text-navy-100 sm:grid-cols-3">
                        <li>
                            <span className="font-display text-3xl font-bold text-accent-400">1</span>
                            <p className="mt-1">Create a free account, with Google or your email.</p>
                        </li>
                        <li>
                            <span className="font-display text-3xl font-bold text-accent-400">2</span>
                            <p className="mt-1">Add your business or claim your existing listing.</p>
                        </li>
                        <li>
                            <span className="font-display text-3xl font-bold text-accent-400">3</span>
                            <p className="mt-1">Once approved, manage it any time from My businesses.</p>
                        </li>
                    </ol>
                </div>
            </div>
        </>
    );
}
