import { api } from '../api/client';

/**
 * Fire-and-forget interaction tracking. Never blocks the UI or surfaces errors.
 */
export function track(name, entity = null, properties = undefined) {
    const payload = { name };
    if (entity?.type && entity?.id) {
        payload.entity_type = entity.type;
        payload.entity_id = entity.id;
    }
    if (properties) {
        payload.properties = properties;
    }
    api.post('/analytics/events', payload).catch(() => {});
}
