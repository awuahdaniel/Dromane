import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken, getUser } from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [authStatus, setAuthStatus] = useState('loading');
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    const checkAuth = useCallback(() => {
        try {
            const storedToken = getToken();
            const storedUser = getUser();

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(storedUser);
                setAuthStatus('authenticated');
            } else {
                setToken(null);
                setUser(null);
                setAuthStatus('unauthenticated');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setToken(null);
            setUser(null);
            setAuthStatus('unauthenticated');
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const updateAuth = useCallback((newToken, newUser) => {
        if (newToken && newUser) {
            setToken(newToken);
            setUser(newUser);
            setAuthStatus('authenticated');
        } else {
            setToken(null);
            setUser(null);
            setAuthStatus('unauthenticated');
        }
    }, []);

    const clearAuth = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setAuthStatus('unauthenticated');
    }, []);

    const value = {
        authStatus,
        user,
        token,
        isAuthenticated: authStatus === 'authenticated',
        isLoading: authStatus === 'loading',
        updateAuth,
        clearAuth,
        checkAuth,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};