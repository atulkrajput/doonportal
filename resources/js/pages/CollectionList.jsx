import { useApi } from '../hooks/useApi';
import { CollectionCard } from '../components/Cards';
import { PageHeader, ResultsGrid, useUrlFilters } from '../components/Listing';
import { EmptyState } from '../components/States';

export default function CollectionList() {
    const filters = useUrlFilters();
    const state = useApi('/collections', { page: filters.get('page') });

    return (
        <>
            <PageHeader eyebrow="Collections" title="Best of Doon">
                Curated lists of real places and businesses, each with the criteria used to pick them.
            </PageHeader>
            <div className="container-page py-6">
                <ResultsGrid
                    state={state}
                    render={(c) => <CollectionCard key={c.id} collection={c} />}
                    onPage={(p) => filters.set('page', p)}
                    empty={<EmptyState title="No collections published yet" />}
                />
            </div>
        </>
    );
}
