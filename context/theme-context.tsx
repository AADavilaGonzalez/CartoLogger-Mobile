import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useStorage } from '@/hooks/use-storage';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const storage = useStorage();
  
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference from database on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await storage.settings.get('theme');
        setThemeModeState(savedTheme as ThemeMode);
      } catch (error) {
        console.log('Using default theme (system)');
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, [storage]);

  // Determine if we're in dark mode
  const isDark = 
    themeMode === 'dark' || 
    (themeMode === 'system' && systemColorScheme === 'dark');

  // Update theme in database and state
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await storage.settings.set('theme', mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  if (isLoading) {
    return null; // or return a loading screen
  }

  return (
    <ThemeContext.Provider value={{ themeMode, isDark, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeContextProvider');
  }
  return context;
}
