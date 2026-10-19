import { Link, useParams } from 'react-router';
import { useApi } from '../hooks/useApi';
import { BusinessCard } from '../components/Cards';
import { ChipGroup, PageHeader, ResultsGrid, SelectFilter, useUrlFilters } from '../components/Listing';

const SORTS = [
    ['popular', 'Most popular'],
    ['rating', 'Top rated'],
    ['newest', 'Newest'],
    ['name', 'A–Z'],
];

export function useAreaOptions() {
    const { data } = useApi('/areas');
    return [['', 'All areas'], ...(data?.data ?? []).map((a) => [a.slug, a.name])];
}

export default function BusinessList() {
    const { category } = useParams();
    const filters = useUrlFilters();
    const areaOptions = useAreaOptions();
    const { data: categoryData } = useApi(category ? `/categories/${category}` : null);
    const cat = categoryData?.data;
    const parent = cat?.parent;
    const siblings = (parent ? null : cat?.children) ?? [];

    const state = useApi('/businesses', {
        category,
        area: filters.get('area'),
        price: filters.get('price'),
        min_rating: filters.get('min_rating'),
        open_now: filters.get('open_now'),
        verified: filters.get('verified'),
        new: filters.get('new'),
        q: filters.get('q'),
        sort: filters.get('sort'),
        page: filters.get('page'),
    });

    const title = cat?.name ?? (filters.get('new') ? 'New in Doon' : 'Businesses in Dehradun');

    return (
        <>
            <PageHeader eyebrow={parent ? <Link to={`/businesses/${parent.slug}`}>{parent.name}</Link> : 'Directory'} title={title}>
                {cat?.description}
            </PageHeader>
            <div className="container-page py-6">
                {siblings.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        {siblings.map((c) => (
                            <Link key={c.id} to={`/businesses/${c.slug}`} className="chip">
                                {c.name}
                            </Link>
                        ))}
                    </div>
                )}
                <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <SelectFilter label="Area" value={filters.get('area')} onChange={(v) => filters.set('area', v)} options={areaOptions} />
                        <SelectFilter label="Sort" value={filters.get('sort') || 'popular'} onChange={(v) => filters.set('sort', v === 'popular' ? '' : v)} options={SORTS} />
                        <SelectFilter
                            label="Rating"
                            value={filters.get('min_rating')}
                            onChange={(v) => filters.set('min_rating', v)}
                            options={[['', 'Any rating'], ['3', '3+ stars'], ['4', '4+ stars'], ['4.5', '4.5+ stars']]}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <ChipGroup label="Price" value={filters.get('price')} onChange={(v) => filters.set('price', v)} options={[['1', '₹'], ['2', '₹₹'], ['3', '₹₹₹'], ['4', '₹₹₹₹']]} />
                        <span className="mx-1 hidden h-6 w-px bg-stone-200 sm:block" />
                        <ChipGroup label="Open now" value={filters.get('open_now')} onChange={(v) => filters.set('open_now', v)} options={[['1', 'Open now']]} />
                        <ChipGroup label="Verified" value={filters.get('verified')} onChange={(v) => filters.set('verified', v)} options={[['1', 'Verified only']]} />
                        <ChipGroup label="New" value={filters.get('new')} onChange={(v) => filters.set('new', v)} options={[['1', 'New in Doon']]} />
                    </div>
                </div>
                <ResultsGrid state={state} render={(b) => <BusinessCard key={b.id} business={b} />} onPage={(p) => filters.set('page', p)} />
            </div>
        </>
    );
}
