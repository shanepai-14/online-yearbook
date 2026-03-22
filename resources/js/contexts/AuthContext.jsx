import axios from 'axios';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchCurrentUser = useCallback(async () => {
        try {
            const response = await axios.get('/api/me');
            setUser(response.data.user ?? null);
        } catch (error) {
            if (error.response?.status !== 401) {
                console.error(error);
            }
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCurrentUser();
    }, [fetchCurrentUser]);

    const login = useCallback(async (payload) => {
        const response = await axios.post('/api/login', payload);
        const nextUser = response.data.user;
        setUser(nextUser);
        return nextUser;
    }, []);

    const logout = useCallback(async () => {
        await axios.post('/api/logout');
        setUser(null);
    }, []);

    const refreshUser = useCallback(async () => {
        await fetchCurrentUser();
    }, [fetchCurrentUser]);

    const value = useMemo(
        () => ({
            user,
            loading,
            isAuthenticated: Boolean(user),
            login,
            logout,
            refreshUser,
        }),
        [user, loading, login, logout, refreshUser],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
