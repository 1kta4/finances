import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeContextType, ThemeMode, ThemeColor, ThemeColors } from '../types';
import { THEME_COLORS } from '../utils/constants';
import { getUserSettings, updateUserSettingsInDB } from '../services/storage';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [themeColor, setThemeColorState] = useState<ThemeColor>('mint');

  useEffect(() => {
    loadThemeFromStorage();
  }, []);

  const loadThemeFromStorage = async () => {
    try {
      const settings = await getUserSettings();
      if (settings) {
        setThemeMode(settings.theme_mode);
        setThemeColorState(settings.theme_color);
      }
    } catch (error: any) {
      // Silently ignore database errors during initialization
      // The database might not be ready yet, we'll use default theme values
      if (!error.message?.includes('no such table')) {
        console.error('Error loading theme settings:', error);
      }
    }
  };

  const toggleTheme = async () => {
    const newMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    try {
      await updateUserSettingsInDB({ theme_mode: newMode });
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const setThemeColor = async (color: ThemeColor) => {
    setThemeColorState(color);
    try {
      await updateUserSettingsInDB({ theme_color: color });
    } catch (error) {
      console.error('Error saving theme color:', error);
    }
  };

  const getColors = (): ThemeColors => {
    const colorScheme = THEME_COLORS[themeColor][themeMode];

    if (themeMode === 'light') {
      return {
        background: colorScheme.background,
        surface: colorScheme.surface,
        card: colorScheme.surface,
        text: '#1A1A1A',
        textSecondary: '#666666',
        accent: colorScheme.accent,
        border: '#E0E0E0',
        success: '#2ECC71',
        error: '#E74C3C',
        warning: '#F39C12',
        shadowLight: 'rgba(255, 255, 255, 0.7)',
        shadowDark: 'rgba(0, 0, 0, 0.1)',
      };
    } else {
      return {
        background: colorScheme.background,
        surface: colorScheme.surface,
        card: colorScheme.surface,
        text: '#FFFFFF',
        textSecondary: '#B0B0B0',
        accent: colorScheme.accent,
        border: '#404040',
        success: '#2ECC71',
        error: '#E74C3C',
        warning: '#F39C12',
        shadowLight: 'rgba(255, 255, 255, 0.05)',
        shadowDark: 'rgba(0, 0, 0, 0.5)',
      };
    }
  };

  const colors = getColors();

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        themeColor,
        colors,
        toggleTheme,
        setThemeColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
