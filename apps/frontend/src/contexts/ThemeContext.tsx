'use client';

import { createContext, useContext, ReactNode } from 'react';

interface ThemeContextType {
    theme: 'light';
    toggleTheme: () => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    return (
        <ThemeContext.Provider value={{ theme: 'light', toggleTheme: () => { }, isDark: false }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

// Dark Mode Toggle Component - Now a dummy component that returns null or a hidden placeholder
export function DarkModeToggle() {
    return null;
}
