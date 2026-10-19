import { PERMISSIONS } from './lib';

/**
 * Declarative description of each CMS resource: API path, permission, list
 * columns, filters and form fields. ResourceList / ResourceEdit render these.
 *
 * Field types: text, textarea, html, number, money (₹ in the form, paise in the
 * API), checkbox, select, date, datetime, url, email, tel, tags, media,
 * relation (one id), relations (many ids), repeater (rows of sub-fields) and
 * entities ({type, id} links picked from other admin lists).
 */

const BUSINESS_STATUSES = ['UNVERIFIED', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'CLAIMED', 'SUSPENDED', 'CLOSED'];
const EVENT_STATUSES = ['DRAFT', 'SUBMITTED', 'REVIEW', 'PUBLISHED', 'CANCELLED', 'ARCHIVED'];
const PUBLICATION_STATUSES = ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SOCIAL = ['facebook', 'instagram', 'x', 'youtube', 'linkedin', 'whatsapp', 'zomato', 'swiggy', 'google_maps', 'other'];

const areaRelation = { endpoint: '/admin/areas', label: 'name' };
const categoryRelation = (type) => ({ endpoint: '/admin/categories', params: { type }, label: 'name' });

const coordinates = [
    { name: 'latitude', label: 'Latitude', type: 'number', step: 'any', help: 'Send both or neither.' },
    { name: 'longitude', label: 'Longitude', type: 'number', step: 'any' },
];
const source = [
    { name: 'source_name', label: 'Source name', type: 'text', help: 'Where this information was verified.' },
    { name: 'source_url', label: 'Source URL', type: 'url' },
];

const nameColumn = (key = 'name') => ({ key, label: key === 'title' ? 'Title' : 'Name', primary: true });
const statusColumn = { key: 'status', label: 'Status', status: true };
const updatedColumn = { key: 'updated_at', label: 'Updated', datetime: true };

export const RESOURCES = {
    businesses: {
        label: 'Businesses',
        singular: 'Business',
        type: 'business',
        permission: PERMISSIONS.businesses,
        titleKey: 'name',
        publicPath: (r) => `/business/${r.slug}`,
        statuses: BUSINESS_STATUSES,
        transitions: 'business',
        filters: ['status', 'is_published', 'area_id', 'trashed'],
        columns: [nameColumn(), statusColumn, { key: 'is_published', label: 'Published', boolean: true }, { key: 'primary_area.name', label: 'Area' }, updatedColumn],
        fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'slug', label: 'Slug', type: 'text', help: 'Leave blank to generate from the name.' },
            { name: 'tagline', label: 'Tagline', type: 'text' },
            { name: 'description', label: 'Description', type: 'textarea', span: 'full' },
            { name: 'is_published', label: 'Published on the site', type: 'checkbox' },
            { name: 'is_featured', label: 'Featured', type: 'checkbox' },
            { name: 'category_ids', label: 'Categories', type: 'relations', from: 'categories', relation: categoryRelation('business'), span: 'full' },
            { name: 'primary_category_id', label: 'Primary category', type: 'relation', relation: categoryRelation('business'), fromRecord: (r) => r.categories?.find((c) => c.pivot?.is_primary)?.id ?? '' },
            { name: 'primary_area_id', label: 'Primary area', type: 'relation', relation: areaRelation },
            { name: 'area_ids', label: 'Also serves areas', type: 'relations', from: 'areas', relation: areaRelation, span: 'full' },
            { name: 'address_line', label: 'Address', type: 'text' },
            { name: 'locality', label: 'Locality', type: 'text' },
            { name: 'pincode', label: 'PIN code', type: 'text' },
            ...coordinates,
            { name: 'phone', label: 'Phone', type: 'tel' },
            { name: 'whatsapp', label: 'WhatsApp', type: 'tel' },
            { name: 'email', label: 'Email', type: 'email' },
            { name: 'website', label: 'Website', type: 'url' },
            { name: 'price_range', label: 'Price range', type: 'select', options: [['', '—'], [1, '₹ Budget'], [2, '₹₹'], [3, '₹₹₹'], [4, '₹₹₹₹ Premium']] },
            { name: 'opened_on', label: 'Opened on', type: 'date' },
            { name: 'amenities', label: 'Amenities', type: 'tags', help: 'Comma-separated, e.g. wifi, parking' },
            { name: 'payment_methods', label: 'Payment methods', type: 'tags' },
            { name: 'logo_media_id', label: 'Logo', type: 'media', preview: 'logo' },
            { name: 'cover_media_id', label: 'Cover image', type: 'media', preview: 'cover' },
            {
                name: 'hours',
                label: 'Opening hours (Asia/Kolkata)',
                type: 'repeater',
                span: 'full',
                help: 'Overnight slots are allowed (closes before it opens). A day with no rows is "hours unknown".',
                newRow: { day_of_week: 1, opens_at: '09:00', closes_at: '18:00', is_closed: false },
                fields: [
                    { name: 'day_of_week', label: 'Day', type: 'select', options: DAYS.map((d, i) => [i, d]), number: true },
                    { name: 'opens_at', label: 'Opens', type: 'time' },
                    { name: 'closes_at', label: 'Closes', type: 'time' },
                    { name: 'is_closed', label: 'Closed all day', type: 'checkbox' },
                ],
            },
            {
                name: 'services',
                label: 'Services & prices',
                type: 'repeater',
                span: 'full',
                newRow: { name: '', description: '', price_min_paise: null, price_max_paise: null },
                fields: [
                    { name: 'name', label: 'Service', type: 'text' },
                    { name: 'description', label: 'Description', type: 'text' },
                    { name: 'price_min_paise', label: 'From (₹)', type: 'money' },
                    { name: 'price_max_paise', label: 'To (₹)', type: 'money' },
                ],
            },
            {
                name: 'social_links',
                from: 'social_links',
                label: 'Social links',
                type: 'repeater',
                span: 'full',
                newRow: { platform: 'instagram', url: '' },
                fields: [
                    { name: 'platform', label: 'Platform', type: 'select', options: SOCIAL.map((s) => [s, s]) },
                    { name: 'url', label: 'URL', type: 'url' },
                ],
            },
            { name: 'last_verified_at', label: 'Last verified', type: 'date' },
            ...source,
        ],
    },

    places: {
        label: 'Places',
        singular: 'Place',
        type: 'place',
        permission: PERMISSIONS.places,
        titleKey: 'name',
        publicPath: (r) => `/place/${r.slug}`,
        statuses: PUBLICATION_STATUSES,
        transitions: 'publication',
        filters: ['status', 'area_id', 'trashed'],
        columns: [nameColumn(), statusColumn, { key: 'primary_area.name', label: 'Area' }, updatedColumn],
        fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'slug', label: 'Slug', type: 'text', help: 'Leave blank to generate from the name.' },
            { name: 'summary', label: 'Summary', type: 'textarea', span: 'full' },
            { name: 'description', label: 'Description', type: 'textarea', span: 'full' },
            { name: 'is_featured', label: 'Featured', type: 'checkbox' },
            { name: 'category_ids', label: 'Categories', type: 'relations', from: 'categories', relation: categoryRelation('place'), span: 'full' },
            { name: 'primary_area_id', label: 'Primary area', type: 'relation', relation: areaRelation },
            { name: 'area_ids', label: 'Areas', type: 'relations', from: 'areas', relation: areaRelation, span: 'full' },
            { name: 'address_line', label: 'Address', type: 'text' },
            ...coordinates,
            { name: 'timings', label: 'Timings', type: 'text', help: 'Free text, e.g. "Sunrise to sunset"' },
            { name: 'best_time_to_visit', label: 'Best time to visit', type: 'text' },
            { name: 'is_free', label: 'Free entry', type: 'checkbox' },
            { name: 'has_parking', label: 'Parking available', type: 'checkbox' },
            { name: 'entry_fee_min_paise', label: 'Entry fee from (₹)', type: 'money' },
            { name: 'entry_fee_max_paise', label: 'Entry fee to (₹)', type: 'money' },
            { name: 'entry_fee_notes', label: 'Fee notes', type: 'text' },
            { name: 'accessibility_notes', label: 'Accessibility notes', type: 'textarea', span: 'full' },
            { name: 'cover_media_id', label: 'Cover image', type: 'media', preview: 'cover' },
            {
                name: 'facilities',
                label: 'Facilities',
                type: 'repeater',
                span: 'full',
                newRow: { name: '', notes: '' },
                fields: [
                    { name: 'name', label: 'Facility', type: 'text' },
                    { name: 'notes', label: 'Notes', type: 'text' },
                ],
            },
            { name: 'last_verified_at', label: 'Last verified', type: 'date' },
            ...source,
        ],
    },

    events: {
        label: 'Events',
        singular: 'Event',
        type: 'event',
        permission: PERMISSIONS.events,
        titleKey: 'title',
        publicPath: (r) => `/event/${r.slug}`,
        statuses: EVENT_STATUSES,
        transitions: 'event',
        filters: ['status', 'area_id', 'trashed'],
        sorts: [['newest', 'Newest'], ['starts_at', 'Start date'], ['name', 'Title'], ['updated', 'Recently updated']],
        columns: [nameColumn('title'), statusColumn, { key: 'starts_at', label: 'Starts', datetime: true }, { key: 'venue.name', label: 'Venue' }],
        fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'slug', label: 'Slug', type: 'text', help: 'Leave blank to generate from the title.' },
            { name: 'summary', label: 'Summary', type: 'textarea', span: 'full' },
            { name: 'description', label: 'Description', type: 'textarea', span: 'full' },
            { name: 'starts_at', label: 'Starts', type: 'datetime', lockedWhenAnnounced: true, span: 'full' },
            { name: 'ends_at', label: 'Ends', type: 'datetime', lockedWhenAnnounced: true, span: 'full' },
            { name: 'timezone', label: 'Time zone', type: 'text', help: 'IANA name; times above are in this zone.' },
            { name: 'is_all_day', label: 'All day', type: 'checkbox' },
            { name: 'is_featured', label: 'Featured', type: 'checkbox' },
            { name: 'category_ids', label: 'Categories', type: 'relations', from: 'categories', relation: categoryRelation('event'), span: 'full' },
            { name: 'venue_id', label: 'Venue', type: 'relation', relation: { endpoint: '/admin/venues', label: 'name' } },
            { name: 'organizer_id', label: 'Organizer', type: 'relation', relation: { endpoint: '/admin/organizers', label: 'name' } },
            { name: 'area_id', label: 'Area', type: 'relation', relation: areaRelation },
            { name: 'online_url', label: 'Online link', type: 'url' },
            { name: 'is_free', label: 'Free', type: 'checkbox' },
            { name: 'price_min_paise', label: 'Price from (₹)', type: 'money' },
            { name: 'price_max_paise', label: 'Price to (₹)', type: 'money' },
            { name: 'ticket_url', label: 'Tickets URL', type: 'url' },
            { name: 'age_restriction', label: 'Age restriction', type: 'text' },
            { name: 'contact_phone', label: 'Contact phone', type: 'tel' },
            { name: 'contact_email', label: 'Contact email', type: 'email' },
            { name: 'cover_media_id', label: 'Cover image', type: 'media', preview: 'cover' },
            ...source,
        ],
        defaults: { timezone: 'Asia/Kolkata' },
    },

    venues: {
        label: 'Venues',
        singular: 'Venue',
        type: 'venue',
        permission: PERMISSIONS.events,
        titleKey: 'name',
        filters: ['area_id', 'trashed'],
        columns: [nameColumn(), { key: 'area.name', label: 'Area' }, { key: 'events_count', label: 'Events' }, updatedColumn],
        fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'slug', label: 'Slug', type: 'text' },
            { name: 'address_line', label: 'Address', type: 'text' },
            { name: 'area_id', label: 'Area', type: 'relation', relation: areaRelation },
            ...coordinates,
            { name: 'capacity', label: 'Capacity', type: 'number' },
            { name: 'business_id', label: 'Linked business', type: 'relation', relation: { endpoint: '/admin/businesses', label: 'name' } },
            { name: 'place_id', label: 'Linked place', type: 'relation', relation: { endpoint: '/admin/places', label: 'name' } },
        ],
    },

    organizers: {
        label: 'Organizers',
        singular: 'Organizer',
        type: 'organizer',
        permission: PERMISSIONS.events,
        titleKey: 'name',
        filters: ['trashed'],
        columns: [nameColumn(), { key: 'email', label: 'Email' }, { key: 'events_count', label: 'Events' }, updatedColumn],
        fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'slug', label: 'Slug', type: 'text' },
            { name: 'description', label: 'Description', type: 'textarea', span: 'full' },
            { name: 'email', label: 'Email', type: 'email' },
            { name: 'phone', label: 'Phone', type: 'tel' },
            { name: 'website', label: 'Website', type: 'url' },
            { name: 'business_ids', label: 'Linked businesses', type: 'relations', from: 'businesses', relation: { endpoint: '/admin/businesses', label: 'name' }, span: 'full' },
        ],
    },

    stories: {
        label: 'Stories',
        singular: 'Story',
        type: 'story',
        permission: PERMISSIONS.stories,
        titleKey: 'title',
        publicPath: (r) => `/${r.type === 'GUIDE' ? 'guide' : 'story'}/${r.slug}`,
        statuses: PUBLICATION_STATUSES,
        transitions: 'publication',
        filters: ['status', 'story_type', 'trashed'],
        columns: [nameColumn('title'), statusColumn, { key: 'type', label: 'Type' }, { key: 'author.name', label: 'Author' }, { key: 'published_at', label: 'Published', datetime: true }],
        fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'slug', label: 'Slug', type: 'text' },
            { name: 'type', label: 'Type', type: 'select', options: ['STORY', 'GUIDE', 'LIST', 'NEWS', 'INTERVIEW', 'HERITAGE'].map((t) => [t, t]) },
            { name: 'excerpt', label: 'Excerpt', type: 'textarea', span: 'full' },
            {
                name: 'body',
                label: 'Body (HTML)',
                type: 'html',
                span: 'full',
                help: 'Allowed: headings, paragraphs, lists, links, quotes, images (https), tables. Everything else is stripped on save.',
            },
            { name: 'is_featured', label: 'Featured', type: 'checkbox' },
            { name: 'published_at', label: 'Publish date', type: 'datetime', help: 'Optional. A future date schedules a published story.' },
            { name: 'reading_minutes', label: 'Reading minutes', type: 'number', help: 'Blank = estimated from the body.' },
            { name: 'category_ids', label: 'Categories', type: 'relations', from: 'categories', relation: categoryRelation('story'), span: 'full' },
            {
                name: 'linked_entities',
                label: 'Linked places, businesses, events and areas',
                type: 'entities',
                span: 'full',
                types: ['business', 'place', 'event', 'area'],
                fromRecord: (r) => (r.entity_links || []).map((l) => ({ type: l.entity_type, id: l.entity_id, label: l.entity?.name || l.entity?.title })),
            },
            { name: 'cover_media_id', label: 'Cover image', type: 'media', preview: 'cover' },
            { name: 'seo_title', label: 'SEO title', type: 'text' },
            { name: 'seo_description', label: 'SEO description', type: 'textarea' },
        ],
    },

    collections: {
        label: 'Collections',
        singular: 'Collection',
        type: 'collection',
        permission: PERMISSIONS.collections,
        titleKey: 'title',
        publicPath: (r) => `/collection/${r.slug}`,
        statuses: PUBLICATION_STATUSES,
        transitions: 'publication',
        filters: ['status', 'trashed'],
        columns: [nameColumn('title'), statusColumn, { key: 'items_count', label: 'Items' }, { key: 'curator.name', label: 'Curator' }, updatedColumn],
        fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'slug', label: 'Slug', type: 'text' },
            { name: 'description', label: 'Description', type: 'textarea', span: 'full' },
            { name: 'selection_criteria', label: 'How items were selected', type: 'textarea', span: 'full', help: 'Shown to readers so the list is transparent.' },
            { name: 'is_featured', label: 'Featured', type: 'checkbox' },
            { name: 'cover_media_id', label: 'Cover image', type: 'media', preview: 'cover' },
        ],
        hasItems: true,
    },

    areas: {
        label: 'Areas',
        singular: 'Area',
        type: 'area',
        permission: PERMISSIONS.taxonomy,
        titleKey: 'name',
        publicPath: (r) => `/area/${r.slug}`,
        filters: ['is_published', 'trashed'],
        columns: [nameColumn(), { key: 'is_published', label: 'Published', boolean: true }, { key: 'businesses_count', label: 'Businesses' }, { key: 'places_count', label: 'Places' }, { key: 'sort_order', label: 'Order' }],
        fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'slug', label: 'Slug', type: 'text' },
            { name: 'summary', label: 'Summary', type: 'textarea', span: 'full' },
            { name: 'description', label: 'Description', type: 'textarea', span: 'full' },
            ...coordinates,
            { name: 'is_published', label: 'Published', type: 'checkbox' },
            { name: 'sort_order', label: 'Sort order', type: 'number' },
            { name: 'cover_media_id', label: 'Cover image', type: 'media', preview: 'cover' },
        ],
        defaults: { is_published: true },
    },

    categories: {
        label: 'Categories',
        singular: 'Category',
        type: 'category',
        permission: PERMISSIONS.taxonomy,
        titleKey: 'name',
        filters: ['category_type', 'is_published', 'trashed'],
        columns: [nameColumn(), { key: 'type', label: 'Type' }, { key: 'parent.name', label: 'Parent' }, { key: 'is_active', label: 'Active', boolean: true }, { key: 'children_count', label: 'Children' }],
        fields: [
            { name: 'type', label: 'Type', type: 'select', options: ['business', 'place', 'event', 'story'].map((t) => [t, t]), createOnly: true, required: true },
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'slug', label: 'Slug', type: 'text' },
            { name: 'parent_id', label: 'Parent (top-level of the same type)', type: 'relation', relation: { endpoint: '/admin/categories', label: 'name', dependsOn: 'type' } },
            { name: 'description', label: 'Description', type: 'textarea', span: 'full' },
            { name: 'icon', label: 'Icon key', type: 'text' },
            { name: 'is_active', label: 'Active', type: 'checkbox' },
            { name: 'sort_order', label: 'Sort order', type: 'number' },
        ],
        defaults: { type: 'business', is_active: true },
    },
};

/** Sidebar order. */
export const NAV = [
    ['businesses', 'places', 'events', 'venues', 'organizers'],
    ['stories', 'collections'],
    ['areas', 'categories'],
];
