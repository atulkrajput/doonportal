import { CONTENT_PERMISSIONS, PERMISSIONS } from './lib';

/**
 * Admin left menu: groups with sub-items. Items the viewer has no permission
 * for are hidden, and so are groups left empty. `permission: null` = any staff.
 */
export const MENU = [
    {
        id: 'overview',
        label: 'Overview',
        icon: 'home',
        items: [
            { to: '/admin', label: 'Dashboard', end: true, permission: null },
            { to: '/admin/analytics', label: 'Analytics', permission: PERMISSIONS.analytics },
        ],
    },
    {
        id: 'directory',
        label: 'Directory',
        icon: 'store',
        items: [
            { to: '/admin/businesses', label: 'Businesses', permission: PERMISSIONS.businesses },
            { to: '/admin/places', label: 'Places', permission: PERMISSIONS.places },
            { to: '/admin/areas', label: 'Areas', permission: PERMISSIONS.taxonomy },
            { to: '/admin/categories', label: 'Categories', permission: PERMISSIONS.taxonomy },
        ],
    },
    {
        id: 'events',
        label: 'Events',
        icon: 'calendar',
        items: [
            { to: '/admin/events', label: 'All events', permission: PERMISSIONS.events },
            { to: '/admin/venues', label: 'Venues', permission: PERMISSIONS.events },
            { to: '/admin/organizers', label: 'Organizers', permission: PERMISSIONS.events },
        ],
    },
    {
        id: 'content',
        label: 'Content',
        icon: 'layers',
        items: [
            { to: '/admin/stories', label: 'Stories', permission: PERMISSIONS.stories },
            { to: '/admin/collections', label: 'Collections', permission: PERMISSIONS.collections },
            { to: '/admin/media', label: 'Media library', permission: CONTENT_PERMISSIONS },
        ],
    },
    {
        id: 'monetization',
        label: 'Monetization',
        icon: 'rupee',
        items: [
            { to: '/admin/revenue', label: 'Revenue', permission: PERMISSIONS.monetization },
            { to: '/admin/subscriptions', label: 'Subscriptions', permission: PERMISSIONS.monetization },
            { to: '/admin/plans', label: 'Plans', permission: PERMISSIONS.monetization },
        ],
    },
    {
        id: 'marketing',
        label: 'Marketing & SEO',
        icon: 'chart',
        items: [
            { to: '/admin/seo', label: 'SEO settings', end: true, permission: PERMISSIONS.seo },
            { to: '/admin/seo/pages', label: 'Page SEO', permission: PERMISSIONS.seo },
            { to: '/admin/seo/audit', label: 'SEO audit', permission: PERMISSIONS.seo },
            { to: '/admin/social', label: 'Social media', permission: PERMISSIONS.settings },
            { to: '/admin/tracking', label: 'Tracking codes', permission: PERMISSIONS.settings },
        ],
    },
    {
        id: 'site',
        label: 'Site & legal',
        icon: 'list',
        items: [
            { to: '/admin/pages', label: 'Site pages', permission: PERMISSIONS.pages },
            { to: '/admin/legal', label: 'Legal details', permission: PERMISSIONS.settings },
        ],
    },
    {
        id: 'administration',
        label: 'Administration',
        icon: 'shield',
        items: [
            { to: '/admin/users', label: 'Users & roles', permission: PERMISSIONS.users },
            { to: '/admin/audit-logs', label: 'Audit log', permission: PERMISSIONS.audit },
            { to: '/admin/account', label: 'My account', permission: null },
        ],
    },
];
