import { Link } from 'react-router';
import { useApi } from '../hooks/useApi';
import { useMeta } from '../hooks/useMeta';
import { PageHeader } from '../components/Listing';
import { ErrorState, SkeletonCards } from '../components/States';

const SERVICE_GROUPS = ['home-services', 'professional-services', 'lifestyle', 'automotive', 'education', 'healthcare'];

function CategoryTree({ categories, base }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((parent) => (
                <div key={parent.id} className="rounded-2xl border border-stone-200 bg-white p-5">
                    <Link to={`${base}/${parent.slug}`} className="font-display text-lg font-bold hover:text-navy-700">
                        {parent.name}
                    </Link>
                    {parent.children?.length > 0 && (
                        <ul className="mt-3 flex flex-wrap gap-2">
                            {parent.children.map((c) => (
                                <li key={c.id}>
                                    <Link to={`${base}/${c.slug}`} className="chip">
                                        {c.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
        </div>
    );
}

function useCategories(type) {
    return useApi('/categories', { type });
}

export function Explore() {
    const businesses = useCategories('business');
    const places = useCategories('place');
    useMeta({ title: 'All categories', description: 'Browse every category of businesses and places in Dehradun.' });

    return (
        <>
            <PageHeader eyebrow="Directory" title="Explore Doon" />
            <div className="container-page space-y-10 py-8">
                <section>
                    <h2 className="mb-4 font-display text-2xl font-bold">Businesses & services</h2>
                    {businesses.loading && <SkeletonCards />}
                    {businesses.error && <ErrorState error={businesses.error} />}
                    {businesses.data && <CategoryTree categories={businesses.data.data} base="/businesses" />}
                </section>
                <section>
                    <h2 className="mb-4 font-display text-2xl font-bold">Places & attractions</h2>
                    {places.data && <CategoryTree categories={places.data.data} base="/places" />}
                </section>
            </div>
        </>
    );
}

export function Services() {
    const { data, loading, error } = useCategories('business');
    useMeta({ title: 'Services in Dehradun', description: 'Home, professional, lifestyle, automotive, education and healthcare services.' });
    const groups = (data?.data ?? []).filter((c) => SERVICE_GROUPS.includes(c.slug));

    return (
        <>
            <PageHeader eyebrow="Services" title="Local services">
                Healthcare listings are only marked verified after manual checks.
            </PageHeader>
            <div className="container-page py-8">
                {loading && <SkeletonCards />}
                {error && <ErrorState error={error} />}
                {data && <CategoryTree categories={groups} base="/businesses" />}
            </div>
        </>
    );
}
