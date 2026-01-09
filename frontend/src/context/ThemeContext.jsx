import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'system'; // Default to system to follow OS
        }
        return 'system';
    });

    // Apply theme to DOM whenever theme changes
    useEffect(() => {
        const root = document.documentElement;

        // Clear existing theme classes
        root.classList.remove('light', 'dark');

        let effectiveTheme = theme;

        if (theme === 'system') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            effectiveTheme = isDark ? 'dark' : 'light';
        }

        // Apply the effective theme class
        root.classList.add(effectiveTheme);

        // Persist to localStorage
        localStorage.setItem('theme', theme);

        console.log('Theme applied:', effectiveTheme, 'on <html>');
    }, [theme]);

    // Listen for system theme changes when in 'system' mode
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e) => {
            const root = document.documentElement;
            root.classList.remove('light', 'dark');
            root.classList.add(e.matches ? 'dark' : 'light');
            console.log('System theme changed to:', e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    const value = {
        theme,
        setTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
