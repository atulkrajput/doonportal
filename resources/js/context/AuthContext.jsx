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

    const value = useMemo(() => ({ user, ready, login, register, logout }), [user, ready, login, register, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
