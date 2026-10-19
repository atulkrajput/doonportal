import { useApi } from '../hooks/useApi';
import { useMeta } from '../hooks/useMeta';
import { StoryCard } from '../components/Cards';
import { ChipGroup, PageHeader, ResultsGrid, SelectFilter, useUrlFilters } from '../components/Listing';

const TYPES = [
    ['STORY', 'Stories'],
    ['GUIDE', 'Guides'],
    ['LIST', 'Lists'],
    ['NEWS', 'News'],
    ['INTERVIEW', 'Interviews'],
    ['HERITAGE', 'Heritage'],
];

export default function StoryList() {
    const filters = useUrlFilters();
    const { data: cats } = useApi('/categories', { type: 'story' });
    const state = useApi('/stories', { type: filters.get('type'), category: filters.get('category'), page: filters.get('page') });
    useMeta({ title: 'Doon Stories', description: 'Guides, heritage features, interviews and local stories from Dehradun.' });

    return (
        <>
            <PageHeader eyebrow="Stories" title="Doon Stories">
                People, places and the history of the valley.
            </PageHeader>
            <div className="container-page py-6">
                <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4">
                    <ChipGroup label="Type" value={filters.get('type')} onChange={(v) => filters.set('type', v)} options={TYPES} />
                    <SelectFilter
                        label="Theme"
                        value={filters.get('category')}
                        onChange={(v) => filters.set('category', v)}
                        options={[['', 'All themes'], ...(cats?.data ?? []).map((c) => [c.slug, c.name])]}
                    />
                </div>
                <ResultsGrid state={state} render={(s) => <StoryCard key={s.id} story={s} />} onPage={(p) => filters.set('page', p)} />
            </div>
        </>
    );
}
