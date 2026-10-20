import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { api } from '../api/client';
import { track } from '../lib/analytics';
import { useAuth } from './AuthContext';
import { Icon } from '../components/Icons';

const SavedContext = createContext(null);

const SAVE_EVENTS = { business: 'business_saved', event: 'event_saved' };

/** What the signed-in member has saved, as "type:id" keys, for heart buttons. */
export function SavedProvider({ children }) {
    const { user } = useAuth();
    const [keys, setKeys] = useState(() => new Set());
    const [loadedFor, setLoadedFor] = useState(null);

    if (!user && loadedFor !== null) {
        setLoadedFor(null);
        setKeys(new Set());
    }

    useEffect(() => {
        if (!user || loadedFor === user.id) {
            return;
        }
        api.get('/me/saved/keys')
            .then(({ data }) => {
                setKeys(new Set(data.data));
                setLoadedFor(user.id);
            })
            .catch(() => {});
    }, [user, loadedFor]);

    const toggle = useCallback(async (type, id) => {
        const key = `${type}:${id}`;
        const saving = !keys.has(key);
        const apply = (save) =>
            setKeys((prev) => {
                const next = new Set(prev);
                if (save) {
                    next.add(key);
                } else {
                    next.delete(key);
                }
                return next;
            });
        apply(saving);
        try {
            if (saving) {
                await api.put(`/me/saved/${type}/${id}`);
                if (SAVE_EVENTS[type]) {
                    track(SAVE_EVENTS[type], { type, id });
                }
            } else {
                await api.delete(`/me/saved/${type}/${id}`);
            }
        } catch {
            apply(!saving);
        }
        return saving;
    }, [keys]);

    const value = useMemo(() => ({ isSaved: (type, id) => keys.has(`${type}:${id}`), toggle }), [keys, toggle]);

    return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
    return useContext(SavedContext);
}

/** Heart button. Guests are sent to sign in and brought back here. */
export function SaveButton({ type, id, label = 'Save', className = 'btn-secondary' }) {
    const { user } = useAuth();
    const { isSaved, toggle } = useSaved();
    const navigate = useNavigate();
    const location = useLocation();
    const saved = isSaved(type, id);

    const onClick = () => {
        if (!user) {
            navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
            return;
        }
        toggle(type, id);
    };

    return (
        <button type="button" onClick={onClick} className={className} aria-pressed={saved}>
            <span className={saved ? 'text-accent-600' : undefined}>
                <Icon name="heart" size={16} filled={saved} />
            </span>
            {saved ? 'Saved' : label}
        </button>
    );
}
