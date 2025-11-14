import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Category,
  Transaction,
  Goal,
  UserSettings,
  TransactionFormData,
  GoalFormData,
  CategoryFormData,
} from '../types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Keep false for React Native
    flowType: 'pkce', // Use PKCE flow for better security with mobile apps
  },
});

// Auth methods
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: 'financetracker://auth/callback',
    },
  });
  if (error) throw error;

  // If signup successful, ensure default categories and settings exist
  // This is a fallback in case the database trigger fails
  if (data.user) {
    try {
      await ensureDefaultDataForUser(data.user.id);
    } catch (setupError) {
      console.warn('Warning: Could not create default data for user:', setupError);
      // Don't throw - allow signup to succeed even if default data creation fails
    }
  }

  return data;
};

// Helper function to ensure default categories and settings exist for a user
const ensureDefaultDataForUser = async (userId: string) => {
  // Check if user already has categories
  const { data: existingCategories } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  // If no categories exist, create default ones
  if (!existingCategories || existingCategories.length === 0) {
    const defaultCategories = [
      // Spending categories
      { user_id: userId, name: 'Food & Dining', type: 'spending', is_custom: false },
      { user_id: userId, name: 'Transportation', type: 'spending', is_custom: false },
      { user_id: userId, name: 'Shopping', type: 'spending', is_custom: false },
      { user_id: userId, name: 'Bills & Utilities', type: 'spending', is_custom: false },
      { user_id: userId, name: 'Entertainment', type: 'spending', is_custom: false },
      { user_id: userId, name: 'Healthcare', type: 'spending', is_custom: false },
      { user_id: userId, name: 'Education', type: 'spending', is_custom: false },
      { user_id: userId, name: 'Other', type: 'spending', is_custom: false },
      // Earning categories
      { user_id: userId, name: 'Salary', type: 'earning', is_custom: false },
      { user_id: userId, name: 'Freelance', type: 'earning', is_custom: false },
      { user_id: userId, name: 'Investment', type: 'earning', is_custom: false },
      { user_id: userId, name: 'Gift', type: 'earning', is_custom: false },
      { user_id: userId, name: 'Refund', type: 'earning', is_custom: false },
      { user_id: userId, name: 'Other', type: 'earning', is_custom: false },
    ];

    await supabase.from('categories').insert(defaultCategories);
  }

  // Check if user settings exist
  const { data: existingSettings } = await supabase
    .from('user_settings')
    .select('id')
    .eq('user_id', userId)
    .single();

  // If no settings exist, create default ones
  if (!existingSettings) {
    await supabase.from('user_settings').insert({
      user_id: userId,
      currency: 'USD',
      theme_mode: 'light',
      theme_color: 'mint',
      default_time_range: 'month',
    });
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Categories methods
export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
};

export const createCategory = async (category: CategoryFormData): Promise<Category> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('No user logged in');

  const { data, error } = await supabase
    .from('categories')
    .insert([{
      user_id: currentUser.id,
      name: category.name,
      type: category.type,
      is_custom: true,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCategory = async (id: string, name: string): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Transactions methods
export const fetchTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      category:categories(*)
    `)
    .order('transaction_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createTransaction = async (transaction: TransactionFormData): Promise<Transaction> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('No user logged in');

  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      user_id: currentUser.id,
      category_id: transaction.category_id,
      amount: parseFloat(transaction.amount),
      type: transaction.type,
      item_name: transaction.item_name || null,
      description: transaction.description || null,
      payment_method: transaction.payment_method,
      transaction_date: transaction.transaction_date.toISOString(),
    }])
    .select(`
      *,
      category:categories(*)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const updateTransaction = async (
  id: string,
  transaction: Partial<TransactionFormData>
): Promise<Transaction> => {
  const updateData: any = {};

  if (transaction.category_id) updateData.category_id = transaction.category_id;
  if (transaction.amount) updateData.amount = parseFloat(transaction.amount);
  if (transaction.type) updateData.type = transaction.type;
  if (transaction.item_name !== undefined) updateData.item_name = transaction.item_name || null;
  if (transaction.description !== undefined) updateData.description = transaction.description || null;
  if (transaction.payment_method) updateData.payment_method = transaction.payment_method;
  if (transaction.transaction_date) updateData.transaction_date = transaction.transaction_date.toISOString();

  const { data, error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      category:categories(*)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Goals methods
export const fetchGoals = async (): Promise<Goal[]> => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createGoal = async (goal: GoalFormData): Promise<Goal> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('No user logged in');

  const { data, error } = await supabase
    .from('goals')
    .insert([{
      user_id: currentUser.id,
      title: goal.title,
      target_amount: parseFloat(goal.target_amount),
      current_amount: parseFloat(goal.current_amount),
      deadline: goal.deadline ? goal.deadline.toISOString().split('T')[0] : null,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateGoal = async (id: string, goal: Partial<GoalFormData>): Promise<Goal> => {
  const updateData: any = {};

  if (goal.title) updateData.title = goal.title;
  if (goal.target_amount) updateData.target_amount = parseFloat(goal.target_amount);
  if (goal.current_amount) updateData.current_amount = parseFloat(goal.current_amount);
  if (goal.deadline !== undefined) {
    updateData.deadline = goal.deadline ? goal.deadline.toISOString().split('T')[0] : null;
  }

  const { data, error } = await supabase
    .from('goals')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteGoal = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// User Settings methods
export const fetchUserSettings = async (): Promise<UserSettings | null> => {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  return data;
};

export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<UserSettings> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('No user logged in');

  // First, try to fetch existing settings
  const existing = await fetchUserSettings();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('user_id', currentUser.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from('user_settings')
      .insert([{
        user_id: currentUser.id,
        ...settings,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Backup/Restore methods
export const backupAllData = async (
  categories: Category[],
  transactions: Transaction[],
  goals: Goal[]
): Promise<void> => {
  // Delete all existing data
  await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('goals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('categories').delete().eq('is_custom', true);

  // Insert categories (only custom ones, defaults are created on signup)
  const customCategories = categories.filter(c => c.is_custom);
  if (customCategories.length > 0) {
    const { error: catError } = await supabase
      .from('categories')
      .insert(customCategories.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        is_custom: c.is_custom,
      })));

    if (catError) throw catError;
  }

  // Insert transactions
  if (transactions.length > 0) {
    const { error: transError } = await supabase
      .from('transactions')
      .insert(transactions.map(t => ({
        id: t.id,
        category_id: t.category_id,
        amount: t.amount,
        type: t.type,
        item_name: t.item_name,
        description: t.description,
        payment_method: t.payment_method,
        transaction_date: t.transaction_date,
        created_at: t.created_at,
        updated_at: t.updated_at,
      })));

    if (transError) throw transError;
  }

  // Insert goals
  if (goals.length > 0) {
    const { error: goalError } = await supabase
      .from('goals')
      .insert(goals.map(g => ({
        id: g.id,
        title: g.title,
        target_amount: g.target_amount,
        current_amount: g.current_amount,
        deadline: g.deadline,
        created_at: g.created_at,
        updated_at: g.updated_at,
      })));

    if (goalError) throw goalError;
  }

  // Update last backup timestamp
  await updateUserSettings({ last_backup_timestamp: new Date().toISOString() });
};
