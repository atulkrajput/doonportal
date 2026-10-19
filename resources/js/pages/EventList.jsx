import { useApi } from '../hooks/useApi';
import { useMeta } from '../hooks/useMeta';
import { EventCard } from '../components/Cards';
import { ChipGroup, PageHeader, ResultsGrid, SelectFilter, useUrlFilters } from '../components/Listing';
import { EmptyState } from '../components/States';
import { useAreaOptions } from './BusinessList';

const WHEN = [
    ['today', 'Today'],
    ['tomorrow', 'Tomorrow'],
    ['weekend', 'This weekend'],
    ['week', 'Next 7 days'],
    ['month', 'Next 30 days'],
];

export default function EventList() {
    const filters = useUrlFilters();
    const areaOptions = useAreaOptions();
    const { data: cats } = useApi('/categories', { type: 'event' });
    const categoryOptions = [['', 'All categories'], ...(cats?.data ?? []).map((c) => [c.slug, c.name])];

    const state = useApi('/events', {
        when: filters.get('when'),
        category: filters.get('category'),
        area: filters.get('area'),
        free: filters.get('free'),
        page: filters.get('page'),
    });

    useMeta({ title: 'Events in Dehradun', description: 'Concerts, workshops, markets and community events happening in Doon.' });

    return (
        <>
            <PageHeader eyebrow="Events" title="What’s happening in Doon">
                Dates and times are shown in Indian Standard Time.
            </PageHeader>
            <div className="container-page py-6">
                <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4">
                    <ChipGroup label="When" value={filters.get('when')} onChange={(v) => filters.set('when', v)} options={WHEN} />
                    <div className="flex flex-wrap items-center gap-3">
                        <SelectFilter label="Category" value={filters.get('category')} onChange={(v) => filters.set('category', v)} options={categoryOptions} />
                        <SelectFilter label="Area" value={filters.get('area')} onChange={(v) => filters.set('area', v)} options={areaOptions} />
                        <ChipGroup label="Price" value={filters.get('free')} onChange={(v) => filters.set('free', v)} options={[['1', 'Free events']]} />
                    </div>
                </div>
                <ResultsGrid
                    state={state}
                    render={(e) => <EventCard key={e.id} event={e} />}
                    onPage={(p) => filters.set('page', p)}
                    empty={<EmptyState title="No events found for these dates">Try a wider date range or a different category.</EmptyState>}
                />
            </div>
        </>
    );
}
