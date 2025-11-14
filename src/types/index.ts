// Core Types

export type TransactionType = 'earning' | 'spending';
export type PaymentMethod = 'cash' | 'card';
export type ThemeMode = 'light' | 'dark';
export type ThemeColor = 'mint' | 'purple' | 'emerald' | 'lightblue';
export type TimeRange = 'week' | 'month' | 'year' | 'all';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  is_custom: boolean;
  created_at: string;
}

export type SubscriptionInterval = '2weeks' | 'month' | 'year' | 'custom';

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  type: TransactionType;
  item_name?: string;
  description?: string;
  payment_method: PaymentMethod;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  is_subscription: boolean;
  subscription_interval?: SubscriptionInterval;
  subscription_custom_months?: number;
  subscription_parent_id?: string; // Links to the original subscription transaction
  next_occurrence?: string; // Date when next transaction should be created
  category?: Category; // Joined data
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  currency: string;
  theme_mode: ThemeMode;
  theme_color: ThemeColor;
  default_time_range: TimeRange;
  last_backup_timestamp?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
}

// Local storage types (for SQLite)
export interface LocalTransaction extends Omit<Transaction, 'user_id'> {
  synced: boolean;
}

export interface LocalCategory extends Omit<Category, 'user_id'> {
  synced: boolean;
}

// Chart data types
export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
  }[];
}

export interface PieChartData {
  name: string;
  amount: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

// Statistics types
export interface BalanceData {
  totalEarnings: number;
  totalSpending: number;
  netBalance: number;
}

export interface CategorySpending {
  category_id: string;
  category_name: string;
  total: number;
}

// Form types
export interface TransactionFormData {
  category_id: string;
  amount: string;
  type: TransactionType;
  item_name?: string;
  description?: string;
  payment_method: PaymentMethod;
  transaction_date: Date;
  is_subscription?: boolean;
  subscription_interval?: SubscriptionInterval;
  subscription_custom_months?: number;
}

export interface GoalFormData {
  title: string;
  target_amount: string;
  current_amount: string;
  deadline?: Date;
}

export interface CategoryFormData {
  name: string;
  type: TransactionType;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Spending: undefined;
  Earning: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  Categories: undefined;
  Goals: undefined;
  ThemeSettings: undefined;
};

// Context types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface ThemeContextType {
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  colors: ThemeColors;
  toggleTheme: () => void;
  setThemeColor: (color: ThemeColor) => void;
}

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  accent: string;
  border: string;
  success: string;
  error: string;
  warning: string;
  // Neomorphic shadows
  shadowLight: string;
  shadowDark: string;
}

export interface DataContextType {
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  settings: UserSettings | null;
  loading: boolean;
  // Transaction methods
  addTransaction: (transaction: TransactionFormData) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<TransactionFormData>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactionsByType: (type: TransactionType) => Transaction[];
  getTransactionsByDateRange: (startDate: Date, endDate: Date) => Transaction[];
  // Category methods
  addCategory: (category: CategoryFormData) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoriesByType: (type: TransactionType) => Category[];
  // Goal methods
  addGoal: (goal: GoalFormData) => Promise<void>;
  updateGoal: (id: string, goal: Partial<GoalFormData>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  getCurrentGoal: () => Goal | null;
  // Settings methods
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  // Sync methods
  backupToSupabase: () => Promise<void>;
  restoreFromSupabase: () => Promise<void>;
  clearLocalData: () => Promise<void>;
  // Utility methods
  getBalanceData: (timeRange: TimeRange) => BalanceData;
  getCategorySpending: (timeRange: TimeRange) => CategorySpending[];
  getRecentItems: (categoryId?: string) => { item_name: string; category_id: string; amount: number }[];
}
