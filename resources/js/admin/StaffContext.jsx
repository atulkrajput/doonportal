import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getAdminToken, setAdminToken } from '../api/client';

const StaffContext = createContext(null);

/**
 * The signed-in DoonPortal staff member. Separate from the member session
 * (AuthContext): staff sign in at /admin/login with a staff account.
 */
export function StaffProvider({ children }) {
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(() => !getAdminToken());

    useEffect(() => {
        if (!getAdminToken()) {
            return;
        }
        api.get('/admin/auth/me')
            .then((r) => setUser(r.data.data))
            .catch(() => setAdminToken(null))
            .finally(() => setReady(true));
    }, []);

    const login = useCallback(async (credentials) => {
        const { data } = await api.post('/admin/auth/login', credentials);
        setAdminToken(data.token);
        setUser(data.user);
        return data.user;
    }, []);

    const refresh = useCallback(async () => {
        const { data } = await api.get('/admin/auth/me');
        setUser(data.data);
        return data.data;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post('/admin/auth/logout');
        } finally {
            setAdminToken(null);
            setUser(null);
        }
    }, []);

    const value = useMemo(() => ({ user, ready, login, logout, refresh }), [user, ready, login, logout, refresh]);

    return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}

export function useStaff() {
    return useContext(StaffContext);
}
