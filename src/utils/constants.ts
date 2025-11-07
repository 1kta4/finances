import { ThemeColor, ThemeMode, TransactionType } from '../types';

// Default Categories
export const DEFAULT_SPENDING_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Healthcare',
  'Education',
  'Other',
];

export const DEFAULT_EARNING_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Gift',
  'Refund',
  'Other',
];

// Theme Colors
interface ThemeColorScheme {
  light: {
    background: string;
    surface: string;
    accent: string;
  };
  dark: {
    background: string;
    surface: string;
    accent: string;
  };
}

export const THEME_COLORS: Record<ThemeColor, ThemeColorScheme> = {
  mint: {
    light: {
      background: '#E8F5F3',
      surface: '#D5EBE8',
      accent: '#3FDFCD',
    },
    dark: {
      background: '#1A2F2E',
      surface: '#243D3C',
      accent: '#3FDFCD',
    },
  },
  purple: {
    light: {
      background: '#F3E8F5',
      surface: '#E8D5EB',
      accent: '#9B59B6',
    },
    dark: {
      background: '#2E1A2F',
      surface: '#3D243D',
      accent: '#9B59B6',
    },
  },
  emerald: {
    light: {
      background: '#E8F5EB',
      surface: '#D5EBD9',
      accent: '#2ECC71',
    },
    dark: {
      background: '#1A2F21',
      surface: '#243D2C',
      accent: '#2ECC71',
    },
  },
  lightblue: {
    light: {
      background: '#E8F1F5',
      surface: '#D5E3EB',
      accent: '#3498DB',
    },
    dark: {
      background: '#1A252F',
      surface: '#24333D',
      accent: '#3498DB',
    },
  },
};

// Neomorphic Shadow Configurations
export const SHADOW_CONFIG = {
  light: {
    elevation: {
      shadowColor: '#000000',
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    depression: {
      shadowColor: '#FFFFFF',
      shadowOffset: { width: -2, height: -2 },
      shadowOpacity: 0.7,
      shadowRadius: 4,
      elevation: 2,
    },
  },
  dark: {
    elevation: {
      shadowColor: '#000000',
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 4,
    },
    depression: {
      shadowColor: '#FFFFFF',
      shadowOffset: { width: -2, height: -2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
  },
};

// Currency Symbols
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  BAM: 'KM',
  GBP: '£',
  JPY: '¥',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  CNY: '¥',
  SEK: 'kr',
  NZD: 'NZ$',
};

// Available Currencies for Selection
export const AVAILABLE_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'BAM', name: 'Bosnian Mark', symbol: 'KM' },
];

// Common Currencies (full list)
export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'BAM', name: 'Bosnian Mark', symbol: 'KM' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
];

// Category Icons/Colors (you can expand this)
export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#FF6B6B',
  'Transportation': '#4ECDC4',
  'Shopping': '#FFD93D',
  'Bills & Utilities': '#95E1D3',
  'Entertainment': '#F38181',
  'Healthcare': '#AA96DA',
  'Education': '#6C5CE7',
  'Other': '#A8A8A8',
  'Salary': '#2ECC71',
  'Freelance': '#3498DB',
  'Investment': '#9B59B6',
  'Gift': '#E74C3C',
  'Refund': '#F39C12',
};

// Time Range Options
export const TIME_RANGE_OPTIONS = [
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
  { label: 'All Time', value: 'all' },
];

// Payment Method Options
export const PAYMENT_METHODS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Card', value: 'card' },
];

// Chart Configuration
export const CHART_CONFIG = {
  backgroundColor: 'transparent',
  backgroundGradientFrom: 'transparent',
  backgroundGradientTo: 'transparent',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(63, 223, 205, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
  },
};
