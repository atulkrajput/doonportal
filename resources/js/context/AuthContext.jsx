import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(() => !getToken());

    useEffect(() => {
        if (!getToken()) {
            return;
        }
        api.get('/auth/me')
            .then((r) => setUser(r.data.data))
            .catch(() => setToken(null))
            .finally(() => setReady(true));
    }, []);

    const login = useCallback(async (credentials) => {
        const { data } = await api.post('/auth/login', credentials);
        setToken(data.token);
        setUser(data.user);
        return data.user;
    }, []);

    const loginWithGoogle = useCallback(async (credential) => {
        const { data } = await api.post('/auth/google', { credential });
        setToken(data.token);
        setUser(data.user);
        return data.user;
    }, []);

    /** Reload the signed-in user (after profile changes, a new role…). */
    const refresh = useCallback(async () => {
        const { data } = await api.get('/auth/me');
        setUser(data.data);
        return data.data;
    }, []);

    const register = useCallback(async (details) => {
        const { data } = await api.post('/auth/register', details);
        setToken(data.token);
        setUser(data.user);
        return data.user;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            setToken(null);
            setUser(null);
        }
    }, []);

    const value = useMemo(
        () => ({ user, ready, login, loginWithGoogle, register, logout, refresh, setUser }),
        [user, ready, login, loginWithGoogle, register, logout, refresh],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
