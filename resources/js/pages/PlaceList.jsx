import { Link, useParams } from 'react-router';
import { useApi } from '../hooks/useApi';
import { PlaceCard } from '../components/Cards';
import { ChipGroup, PageHeader, ResultsGrid, SelectFilter, useUrlFilters } from '../components/Listing';
import { useAreaOptions } from './BusinessList';

export default function PlaceList() {
    const { category } = useParams();
    const filters = useUrlFilters();
    const areaOptions = useAreaOptions();
    const { data: cats } = useApi('/categories', { type: 'place' });
    const { data: categoryData } = useApi(category ? `/categories/${category}` : null);

    const state = useApi('/places', {
        category,
        area: filters.get('area'),
        free: filters.get('free'),
        sort: filters.get('sort'),
        page: filters.get('page'),
    });

    const title = categoryData?.data?.name ?? 'Things to do in Doon';

    return (
        <>
            <PageHeader eyebrow="Explore" title={title}>
                Attractions, nature, heritage and quiet corners of the valley.
            </PageHeader>
            <div className="container-page py-6">
                <div className="mb-4 flex flex-wrap gap-2">
                    <Link to="/places" className={`chip ${!category ? 'chip-active' : ''}`}>
                        All
                    </Link>
                    {(cats?.data ?? []).flatMap((parent) => [parent, ...(parent.children ?? [])]).map((c) => (
                        <Link key={c.id} to={`/places/${c.slug}`} className={`chip ${category === c.slug ? 'chip-active' : ''}`}>
                            {c.name}
                        </Link>
                    ))}
                </div>
                <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4">
                    <SelectFilter label="Area" value={filters.get('area')} onChange={(v) => filters.set('area', v)} options={areaOptions} />
                    <SelectFilter label="Sort" value={filters.get('sort') || 'popular'} onChange={(v) => filters.set('sort', v === 'popular' ? '' : v)} options={[['popular', 'Most popular'], ['rating', 'Top rated'], ['newest', 'Newest'], ['name', 'A–Z']]} />
                    <ChipGroup label="Entry" value={filters.get('free')} onChange={(v) => filters.set('free', v)} options={[['1', 'Free entry']]} />
                </div>
                <ResultsGrid state={state} render={(p) => <PlaceCard key={p.id} place={p} />} onPage={(p) => filters.set('page', p)} />
            </div>
        </>
    );
}
