import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ThemeMode = 'modern' | 'cute';

interface ThemeStyles {
  id: ThemeMode;
  font: string;
  bg: string;
  card: string;
  cardHeader: string;
  text: {
    primary: string;
    secondary: string;
    accent: string;
    danger: string;
    success: string;
  };
  input: string;
  button: {
    primary: string;
    secondary: string;
    icon: string;
  };
  sidebar: string;
  sidebarItem: {
    active: string;
    inactive: string;
  };
}

const THEMES: Record<ThemeMode, ThemeStyles> = {
  modern: {
    id: 'modern',
    font: 'font-sans',
    bg: 'bg-slate-50/50',
    card: 'bg-white rounded-2xl shadow-sm border border-slate-200',
    cardHeader: 'border-b border-slate-100 bg-slate-50',
    text: {
      primary: 'text-slate-800',
      secondary: 'text-slate-500',
      accent: 'text-blue-600',
      danger: 'text-red-500',
      success: 'text-emerald-600',
    },
    input: 'bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 rounded-xl',
    button: {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow-sm transition-colors',
      secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors',
      icon: 'bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg',
    },
    sidebar: 'bg-slate-900 border-r border-slate-800',
    sidebarItem: {
      active: 'bg-blue-600 text-white shadow-md shadow-blue-900/20',
      inactive: 'text-slate-400 hover:bg-slate-800 hover:text-white',
    }
  },
  cute: {
    id: 'cute',
    font: 'font-quicksand',
    bg: 'bg-rose-50',
    card: 'bg-white rounded-[2rem] shadow-[0_4px_20px_rgb(255,228,230)] border-2 border-pink-100',
    cardHeader: 'border-b-2 border-pink-50 bg-pink-50/30',
    text: {
      primary: 'text-slate-700',
      secondary: 'text-rose-400',
      accent: 'text-pink-500',
      danger: 'text-orange-500',
      success: 'text-teal-500',
    },
    input: 'bg-white border-2 border-pink-100 focus:border-pink-300 focus:ring-4 focus:ring-pink-100 rounded-full font-quicksand',
    button: {
      primary: 'bg-pink-400 text-white hover:bg-pink-500 rounded-full shadow-[0_4px_0_rgb(244,114,182)] active:shadow-none active:translate-y-[4px] transition-all font-bold',
      secondary: 'bg-white text-pink-400 border-2 border-pink-200 hover:bg-pink-50 rounded-full font-bold',
      icon: 'bg-pink-100 text-pink-500 hover:bg-pink-200 rounded-full',
    },
    sidebar: 'bg-white border-r-2 border-pink-100',
    sidebarItem: {
      active: 'bg-pink-100 text-pink-600 border-2 border-pink-200 font-bold',
      inactive: 'text-slate-400 hover:bg-pink-50 hover:text-pink-400 font-medium',
    }
  }
};

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  styles: ThemeStyles;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('modern');

  const toggleTheme = () => {
    setMode(prev => prev === 'modern' ? 'cute' : 'modern');
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, styles: THEMES[mode] }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};