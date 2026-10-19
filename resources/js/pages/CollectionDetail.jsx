import { useParams } from 'react-router';
import { useApi } from '../hooks/useApi';
import { EntityCard } from '../components/Cards';
import { DemoBadge } from '../components/Badges';
import { Breadcrumbs, DetailGate } from '../components/Detail';
import { PageHeader } from '../components/Listing';
import { EmptyState } from '../components/States';

function CollectionView({ collection }) {

    return (
        <>
            <PageHeader eyebrow={<Breadcrumbs items={[['/', 'Home'], ['/collections', 'Best of Doon'], [null, collection.title]]} />} title={collection.title}>
                <DemoBadge show={collection.is_demo} />
                {collection.description && <p className="mt-2">{collection.description}</p>}
            </PageHeader>
            <div className="container-page max-w-3xl py-8">
                {collection.selection_criteria && (
                    <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-4 text-sm">
                        <p className="font-semibold">How we picked</p>
                        <p className="mt-1 text-stone-700">{collection.selection_criteria}</p>
                    </div>
                )}
                {collection.items?.length ? (
                    <ol className="space-y-3">
                        {collection.items.map((item, i) => (
                            <li key={`${item.entity.type}-${item.entity.id}`} className="flex gap-3">
                                <span className="mt-6 w-6 shrink-0 text-right font-display text-xl font-bold text-navy-600">{i + 1}</span>
                                <div className="min-w-0 flex-1">
                                    <EntityCard card={item.entity} />
                                    {item.note && <p className="mt-1 pl-1 text-sm italic text-stone-600">{item.note}</p>}
                                </div>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <EmptyState title="This collection is being curated" />
                )}
            </div>
        </>
    );
}

export default function CollectionDetail() {
    const { slug } = useParams();
    const state = useApi(`/collections/${slug}`);
    return <DetailGate state={state}>{(collection) => <CollectionView key={collection.id} collection={collection} />}</DetailGate>;
}
