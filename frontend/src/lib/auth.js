import { AUTH_API_URL } from './config';

export const login = async (email, password) => {
    try {
        const response = await fetch(`${AUTH_API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        } else {
            throw new Error(data.message || data.error || 'Login failed');
        }
        return data;
    } catch (error) {
        // Handle network errors separately
        if (error.message === 'Failed to fetch') {
            throw new Error('Cannot connect to server. Ensure Backend is running.');
        }
        throw error;
    }
};

export const register = async (name, email, password) => {
    const response = await fetch(`${AUTH_API_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || data.error || 'Registration failed');
    }
    return data;
};

// Safe logout - clears state and navigates
export const logout = (navigate, clearAuth) => {
    // Clear localStorage first
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Clear auth context if provided
    if (clearAuth) {
        clearAuth();
    }

    // Navigate with replace to prevent back button issues
    if (navigate) {
        navigate('/login', { replace: true });
    } else {
        window.location.href = '/login';
    }
};

export const getToken = () => localStorage.getItem("token");

export const getUser = () => {
    try {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
};

export const googleLogin = async (googleData) => {
    const response = await fetch(`${AUTH_API_URL}/google_auth.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleData),
    });

    const data = await response.json();
    if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
    } else {
        throw new Error(data.message || data.error || 'Google login failed');
    }
    return data;
};

export const githubLogin = async (githubData) => {
    const response = await fetch(`${AUTH_API_URL}/github_auth.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(githubData),
    });

    const data = await response.json();
    if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
    } else {
        throw new Error(data.message || data.error || 'GitHub login failed');
    }
    return data;
};
