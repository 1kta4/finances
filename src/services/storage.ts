import * as SQLite from 'expo-sqlite';
import {
  Category,
  Transaction,
  Goal,
  UserSettings,
  TransactionFormData,
  GoalFormData,
  CategoryFormData,
  LocalTransaction,
  LocalCategory,
} from '../types';
import { generateUUID } from '../utils/helpers';
import { DEFAULT_SPENDING_CATEGORIES, DEFAULT_EARNING_CATEGORIES } from '../utils/constants';

const DB_NAME = 'financeTracker.db';

// VERIFICATION: This should appear in Metro logs if new code is loaded
console.log('🔧 STORAGE.TS LOADED - NEW VERSION WITH FIXES');

// Helper function to convert SQLite boolean values
// SQLite stores booleans as integers (0/1), but they may come back as numbers or strings
const sqliteBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value === '1';
  return false;
};

// Database instance (singleton)
let dbInstance: SQLite.SQLiteDatabase | null = null;

// Open database
export const openDatabase = (): SQLite.SQLiteDatabase => {
  if (!dbInstance) {
    try {
      dbInstance = SQLite.openDatabaseSync(DB_NAME);
      console.log('✅ Database opened successfully');
    } catch (error) {
      console.error('❌ Error opening database:', error);
      throw error;
    }
  }
  return dbInstance;
};

// Initialize database with tables
export const initDatabase = async (): Promise<void> => {
  const db = openDatabase();

  // Create categories table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('earning', 'spending')),
      is_custom INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      synced INTEGER DEFAULT 0
    );
  `);

  // Create transactions table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      amount REAL NOT NULL CHECK (amount > 0),
      type TEXT NOT NULL CHECK (type IN ('earning', 'spending')),
      item_name TEXT,
      description TEXT,
      payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card')),
      transaction_date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  // Create goals table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      target_amount REAL NOT NULL CHECK (target_amount > 0),
      current_amount REAL DEFAULT 0 CHECK (current_amount >= 0),
      deadline TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      synced INTEGER DEFAULT 0
    );
  `);

  // Create user_settings table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY,
      currency TEXT DEFAULT 'USD',
      theme_mode TEXT DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark')),
      theme_color TEXT DEFAULT 'mint' CHECK (theme_color IN ('mint', 'purple', 'emerald', 'lightblue')),
      default_time_range TEXT DEFAULT 'month' CHECK (default_time_range IN ('week', 'month', 'year', 'all')),
      last_backup_timestamp TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Add subscription columns if they don't exist (migration)
  try {
    await db.execAsync(`
      ALTER TABLE transactions ADD COLUMN is_subscription INTEGER DEFAULT 0;
    `);
  } catch (e) {
    // Column already exists, ignore error
  }

  try {
    await db.execAsync(`
      ALTER TABLE transactions ADD COLUMN subscription_interval TEXT;
    `);
  } catch (e) {
    // Column already exists, ignore error
  }

  try {
    await db.execAsync(`
      ALTER TABLE transactions ADD COLUMN subscription_custom_months INTEGER;
    `);
  } catch (e) {
    // Column already exists, ignore error
  }

  try {
    await db.execAsync(`
      ALTER TABLE transactions ADD COLUMN subscription_parent_id TEXT;
    `);
  } catch (e) {
    // Column already exists, ignore error
  }

  try {
    await db.execAsync(`
      ALTER TABLE transactions ADD COLUMN next_occurrence TEXT;
    `);
  } catch (e) {
    // Column already exists, ignore error
  }

  // Create indexes for better query performance
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_subscription ON transactions(is_subscription);
  `);

  // Initialize default categories if database is empty
  const categories = await getAllCategories();
  if (categories.length === 0) {
    await initDefaultCategories();
  }

  // Initialize default settings if not exists
  const settings = await getUserSettings();
  if (!settings) {
    await initDefaultSettings();
  }
};

// Initialize default categories
const initDefaultCategories = async (): Promise<void> => {
  const db = openDatabase();
  const timestamp = new Date().toISOString();

  const spendingCategories = DEFAULT_SPENDING_CATEGORIES.map(name => ({
    id: generateUUID(),
    name,
    type: 'spending',
    is_custom: 0,
    created_at: timestamp,
    synced: 0,
  }));

  const earningCategories = DEFAULT_EARNING_CATEGORIES.map(name => ({
    id: generateUUID(),
    name,
    type: 'earning',
    is_custom: 0,
    created_at: timestamp,
    synced: 0,
  }));

  const allCategories = [...spendingCategories, ...earningCategories];

  for (const category of allCategories) {
    await db.runAsync(
      'INSERT INTO categories (id, name, type, is_custom, created_at, synced) VALUES (?, ?, ?, ?, ?, ?)',
      [category.id, category.name, category.type, category.is_custom, category.created_at, category.synced]
    );
  }
};

// Initialize default settings
const initDefaultSettings = async (): Promise<void> => {
  const db = openDatabase();
  const id = generateUUID();
  const timestamp = new Date().toISOString();

  await db.runAsync(
    'INSERT INTO user_settings (id, currency, theme_mode, theme_color, default_time_range, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, 'USD', 'light', 'mint', 'month', timestamp, timestamp]
  );
};

// Categories CRUD operations
export const getAllCategories = async (): Promise<Category[]> => {
  const db = openDatabase();
  const result = await db.getAllAsync<any>(
    'SELECT id, name, type, is_custom, created_at FROM categories ORDER BY name'
  );
  return result.map(cat => ({
    id: cat.id,
    user_id: '', // Local DB doesn't have user_id
    name: cat.name,
    type: cat.type,
    is_custom: sqliteBoolean(cat.is_custom),
    created_at: cat.created_at,
  })) as Category[];
};

export const getCategoriesByType = async (type: 'earning' | 'spending'): Promise<Category[]> => {
  const db = openDatabase();
  const result = await db.getAllAsync<any>(
    'SELECT id, name, type, is_custom, created_at FROM categories WHERE type = ? ORDER BY name',
    [type]
  );
  return result.map(cat => ({
    id: cat.id,
    user_id: '', // Local DB doesn't have user_id
    name: cat.name,
    type: cat.type,
    is_custom: sqliteBoolean(cat.is_custom),
    created_at: cat.created_at,
  })) as Category[];
};

export const addCategory = async (category: CategoryFormData): Promise<Category> => {
  try {
    console.log('📝 Adding category:', category);
    const db = openDatabase();
    const id = generateUUID();
    const timestamp = new Date().toISOString();

    console.log('📝 Prepared values:', { id, name: category.name, type: category.type, timestamp });

    // Use execAsync for INSERT without result
    const statement = db.prepareSync(
      'INSERT INTO categories (id, name, type, is_custom, created_at, synced) VALUES (?, ?, ?, ?, ?, ?)'
    );
    await statement.executeAsync([id, category.name, category.type, 1, timestamp, 0]);
    await statement.finalizeAsync();

    console.log('✅ Category added successfully');

    return {
      id,
      user_id: '',
      name: category.name,
      type: category.type,
      is_custom: true,
      created_at: timestamp,
    } as Category;
  } catch (error) {
    console.error('❌ Error in addCategory:', error);
    throw error;
  }
};

export const updateCategoryInDB = async (id: string, name: string): Promise<Category> => {
  const db = openDatabase();

  await db.runAsync('UPDATE categories SET name = ?, synced = 0 WHERE id = ?', [name, id]);

  const result = await db.getFirstAsync<any>(
    'SELECT id, name, type, is_custom, created_at FROM categories WHERE id = ?',
    [id]
  );
  return {
    id: result.id,
    user_id: '', // Local DB doesn't have user_id
    name: result.name,
    type: result.type,
    is_custom: sqliteBoolean(result.is_custom),
    created_at: result.created_at,
  } as Category;
};

export const deleteCategoryFromDB = async (id: string): Promise<void> => {
  const db = openDatabase();

  // Check if category is custom before deleting
  const category = await db.getFirstAsync<any>(
    'SELECT id, is_custom FROM categories WHERE id = ?',
    [id]
  );
  if (category && !sqliteBoolean(category.is_custom)) {
    throw new Error('Cannot delete default categories');
  }

  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
};

// Transactions CRUD operations
export const getAllTransactions = async (): Promise<Transaction[]> => {
  const db = openDatabase();
  const result = await db.getAllAsync<any>(
    `SELECT t.id, t.category_id, t.amount, t.type,
            t.item_name, t.description, t.payment_method,
            t.transaction_date, t.created_at, t.updated_at,
            t.is_subscription, t.subscription_interval, t.subscription_custom_months,
            t.subscription_parent_id, t.next_occurrence,
            c.id as category_id_joined,
            c.name as category_name,
            c.type as category_type,
            c.is_custom as category_is_custom,
            c.created_at as category_created_at
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     ORDER BY t.transaction_date DESC`
  );

  return result.map((row: any) => ({
    id: row.id,
    user_id: '', // Local DB doesn't have user_id
    category_id: row.category_id,
    amount: row.amount,
    type: row.type,
    item_name: row.item_name,
    description: row.description,
    payment_method: row.payment_method,
    transaction_date: row.transaction_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_subscription: sqliteBoolean(row.is_subscription),
    subscription_interval: row.subscription_interval,
    subscription_custom_months: row.subscription_custom_months,
    subscription_parent_id: row.subscription_parent_id,
    next_occurrence: row.next_occurrence,
    category: row.category_id_joined ? {
      id: row.category_id_joined,
      user_id: '', // Local DB doesn't have user_id
      name: row.category_name,
      type: row.category_type,
      is_custom: sqliteBoolean(row.category_is_custom),
      created_at: row.category_created_at,
    } : undefined,
  })) as Transaction[];
};

export const getTransactionsByType = async (type: 'earning' | 'spending'): Promise<Transaction[]> => {
  const db = openDatabase();
  const result = await db.getAllAsync<any>(
    `SELECT t.id, t.category_id, t.amount, t.type,
            t.item_name, t.description, t.payment_method,
            t.transaction_date, t.created_at, t.updated_at,
            t.is_subscription, t.subscription_interval, t.subscription_custom_months,
            t.subscription_parent_id, t.next_occurrence,
            c.id as category_id_joined,
            c.name as category_name,
            c.type as category_type,
            c.is_custom as category_is_custom,
            c.created_at as category_created_at
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.type = ?
     ORDER BY t.transaction_date DESC`,
    [type]
  );

  return result.map((row: any) => ({
    id: row.id,
    user_id: '', // Local DB doesn't have user_id
    category_id: row.category_id,
    amount: row.amount,
    type: row.type,
    item_name: row.item_name,
    description: row.description,
    payment_method: row.payment_method,
    transaction_date: row.transaction_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_subscription: sqliteBoolean(row.is_subscription),
    subscription_interval: row.subscription_interval,
    subscription_custom_months: row.subscription_custom_months,
    subscription_parent_id: row.subscription_parent_id,
    next_occurrence: row.next_occurrence,
    category: row.category_id_joined ? {
      id: row.category_id_joined,
      user_id: '', // Local DB doesn't have user_id
      name: row.category_name,
      type: row.category_type,
      is_custom: sqliteBoolean(row.category_is_custom),
      created_at: row.category_created_at,
    } : undefined,
  })) as Transaction[];
};

export const getTransactionsByDateRange = async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
  const db = openDatabase();
  const result = await db.getAllAsync<any>(
    `SELECT t.id, t.category_id, t.amount, t.type,
            t.item_name, t.description, t.payment_method,
            t.transaction_date, t.created_at, t.updated_at,
            t.is_subscription, t.subscription_interval, t.subscription_custom_months,
            t.subscription_parent_id, t.next_occurrence,
            c.id as category_id_joined,
            c.name as category_name,
            c.type as category_type,
            c.is_custom as category_is_custom,
            c.created_at as category_created_at
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.transaction_date BETWEEN ? AND ?
     ORDER BY t.transaction_date DESC`,
    [startDate.toISOString(), endDate.toISOString()]
  );

  return result.map((row: any) => ({
    id: row.id,
    user_id: '', // Local DB doesn't have user_id
    category_id: row.category_id,
    amount: row.amount,
    type: row.type,
    item_name: row.item_name,
    description: row.description,
    payment_method: row.payment_method,
    transaction_date: row.transaction_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_subscription: sqliteBoolean(row.is_subscription),
    subscription_interval: row.subscription_interval,
    subscription_custom_months: row.subscription_custom_months,
    subscription_parent_id: row.subscription_parent_id,
    next_occurrence: row.next_occurrence,
    category: row.category_id_joined ? {
      id: row.category_id_joined,
      user_id: '', // Local DB doesn't have user_id
      name: row.category_name,
      type: row.category_type,
      is_custom: sqliteBoolean(row.category_is_custom),
      created_at: row.category_created_at,
    } : undefined,
  })) as Transaction[];
};

export const addTransaction = async (transaction: TransactionFormData): Promise<Transaction> => {
  const db = openDatabase();
  const id = generateUUID();
  const timestamp = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO transactions (id, category_id, amount, type, item_name, description, payment_method, transaction_date, created_at, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      transaction.category_id,
      parseFloat(transaction.amount),
      transaction.type,
      transaction.item_name || null,
      transaction.description || null,
      transaction.payment_method,
      transaction.transaction_date.toISOString(),
      timestamp,
      timestamp,
      0,
    ]
  );

  const result = await db.getFirstAsync<any>(
    `SELECT t.id, t.category_id, t.amount, t.type,
            t.item_name, t.description, t.payment_method,
            t.transaction_date, t.created_at, t.updated_at,
            c.id as category_id_joined,
            c.name as category_name,
            c.type as category_type,
            c.is_custom as category_is_custom,
            c.created_at as category_created_at
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.id = ?`,
    [id]
  );

  return {
    id: result.id,
    user_id: '', // Local DB doesn't have user_id
    category_id: result.category_id,
    amount: result.amount,
    type: result.type,
    item_name: result.item_name,
    description: result.description,
    payment_method: result.payment_method,
    transaction_date: result.transaction_date,
    created_at: result.created_at,
    updated_at: result.updated_at,
    category: result.category_id_joined ? {
      id: result.category_id_joined,
      user_id: '', // Local DB doesn't have user_id
      name: result.category_name,
      type: result.category_type,
      is_custom: sqliteBoolean(result.category_is_custom),
      created_at: result.category_created_at,
    } : undefined,
  } as Transaction;
};

export const updateTransactionInDB = async (
  id: string,
  transaction: Partial<TransactionFormData>
): Promise<Transaction> => {
  const db = openDatabase();
  const timestamp = new Date().toISOString();

  const updates: string[] = [];
  const values: any[] = [];

  if (transaction.category_id) {
    updates.push('category_id = ?');
    values.push(transaction.category_id);
  }
  if (transaction.amount) {
    updates.push('amount = ?');
    values.push(parseFloat(transaction.amount));
  }
  if (transaction.type) {
    updates.push('type = ?');
    values.push(transaction.type);
  }
  if (transaction.item_name !== undefined) {
    updates.push('item_name = ?');
    values.push(transaction.item_name || null);
  }
  if (transaction.description !== undefined) {
    updates.push('description = ?');
    values.push(transaction.description || null);
  }
  if (transaction.payment_method) {
    updates.push('payment_method = ?');
    values.push(transaction.payment_method);
  }
  if (transaction.transaction_date) {
    updates.push('transaction_date = ?');
    values.push(transaction.transaction_date.toISOString());
  }

  updates.push('updated_at = ?');
  values.push(timestamp);
  updates.push('synced = ?');
  values.push(0);

  values.push(id);

  await db.runAsync(
    `UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  const result = await db.getFirstAsync<any>(
    `SELECT t.id, t.category_id, t.amount, t.type,
            t.item_name, t.description, t.payment_method,
            t.transaction_date, t.created_at, t.updated_at,
            c.id as category_id_joined,
            c.name as category_name,
            c.type as category_type,
            c.is_custom as category_is_custom,
            c.created_at as category_created_at
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.id = ?`,
    [id]
  );

  return {
    id: result.id,
    user_id: '', // Local DB doesn't have user_id
    category_id: result.category_id,
    amount: result.amount,
    type: result.type,
    item_name: result.item_name,
    description: result.description,
    payment_method: result.payment_method,
    transaction_date: result.transaction_date,
    created_at: result.created_at,
    updated_at: result.updated_at,
    category: result.category_id_joined ? {
      id: result.category_id_joined,
      user_id: '', // Local DB doesn't have user_id
      name: result.category_name,
      type: result.category_type,
      is_custom: sqliteBoolean(result.category_is_custom),
      created_at: result.category_created_at,
    } : undefined,
  } as Transaction;
};

export const deleteTransactionFromDB = async (id: string): Promise<void> => {
  const db = openDatabase();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
};

// Goals CRUD operations
export const getAllGoals = async (): Promise<Goal[]> => {
  const db = openDatabase();
  const result = await db.getAllAsync<any>(
    'SELECT id, title, target_amount, current_amount, deadline, created_at, updated_at FROM goals ORDER BY created_at DESC'
  );
  return result.map(goal => ({
    id: goal.id,
    user_id: '', // Local DB doesn't have user_id
    title: goal.title,
    target_amount: goal.target_amount,
    current_amount: goal.current_amount,
    deadline: goal.deadline,
    created_at: goal.created_at,
    updated_at: goal.updated_at,
  })) as Goal[];
};

export const getCurrentGoal = async (): Promise<Goal | null> => {
  const db = openDatabase();
  const result = await db.getFirstAsync<any>(
    'SELECT id, title, target_amount, current_amount, deadline, created_at, updated_at FROM goals ORDER BY created_at DESC LIMIT 1'
  );
  if (!result) return null;
  return {
    id: result.id,
    user_id: '', // Local DB doesn't have user_id
    title: result.title,
    target_amount: result.target_amount,
    current_amount: result.current_amount,
    deadline: result.deadline,
    created_at: result.created_at,
    updated_at: result.updated_at,
  } as Goal;
};

export const addGoal = async (goal: GoalFormData): Promise<Goal> => {
  const db = openDatabase();
  const id = generateUUID();
  const timestamp = new Date().toISOString();

  await db.runAsync(
    'INSERT INTO goals (id, title, target_amount, current_amount, deadline, created_at, updated_at, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      id,
      goal.title,
      parseFloat(goal.target_amount),
      parseFloat(goal.current_amount),
      goal.deadline ? goal.deadline.toISOString() : null,
      timestamp,
      timestamp,
      0,
    ]
  );

  return {
    id,
    user_id: '',
    title: goal.title,
    target_amount: parseFloat(goal.target_amount),
    current_amount: parseFloat(goal.current_amount),
    deadline: goal.deadline ? goal.deadline.toISOString() : undefined,
    created_at: timestamp,
    updated_at: timestamp,
  } as Goal;
};

export const updateGoalInDB = async (id: string, goal: Partial<GoalFormData>): Promise<Goal> => {
  const db = openDatabase();
  const timestamp = new Date().toISOString();

  const updates: string[] = [];
  const values: any[] = [];

  if (goal.title) {
    updates.push('title = ?');
    values.push(goal.title);
  }
  if (goal.target_amount) {
    updates.push('target_amount = ?');
    values.push(parseFloat(goal.target_amount));
  }
  if (goal.current_amount) {
    updates.push('current_amount = ?');
    values.push(parseFloat(goal.current_amount));
  }
  if (goal.deadline !== undefined) {
    updates.push('deadline = ?');
    values.push(goal.deadline ? goal.deadline.toISOString() : null);
  }

  updates.push('updated_at = ?');
  values.push(timestamp);
  updates.push('synced = ?');
  values.push(0);

  values.push(id);

  await db.runAsync(
    `UPDATE goals SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  const result = await db.getFirstAsync<any>(
    'SELECT id, title, target_amount, current_amount, deadline, created_at, updated_at FROM goals WHERE id = ?',
    [id]
  );
  return {
    id: result.id,
    user_id: '', // Local DB doesn't have user_id
    title: result.title,
    target_amount: result.target_amount,
    current_amount: result.current_amount,
    deadline: result.deadline,
    created_at: result.created_at,
    updated_at: result.updated_at,
  } as Goal;
};

export const deleteGoalFromDB = async (id: string): Promise<void> => {
  const db = openDatabase();
  await db.runAsync('DELETE FROM goals WHERE id = ?', [id]);
};

// User Settings operations
export const getUserSettings = async (): Promise<UserSettings | null> => {
  const db = openDatabase();
  const result = await db.getFirstAsync<any>(
    'SELECT id, currency, theme_mode, theme_color, default_time_range, last_backup_timestamp, created_at, updated_at FROM user_settings LIMIT 1'
  );
  if (!result) return null;
  return {
    id: result.id,
    user_id: '', // Local DB doesn't have user_id
    currency: result.currency,
    theme_mode: result.theme_mode,
    theme_color: result.theme_color,
    default_time_range: result.default_time_range,
    last_backup_timestamp: result.last_backup_timestamp,
    created_at: result.created_at,
    updated_at: result.updated_at,
  } as UserSettings;
};

export const updateUserSettingsInDB = async (settings: Partial<UserSettings>): Promise<UserSettings> => {
  const db = openDatabase();
  const timestamp = new Date().toISOString();

  const current = await getUserSettings();

  if (!current) {
    // Create new settings
    const id = generateUUID();
    await db.runAsync(
      'INSERT INTO user_settings (id, currency, theme_mode, theme_color, default_time_range, last_backup_timestamp, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        settings.currency || 'USD',
        settings.theme_mode || 'light',
        settings.theme_color || 'mint',
        settings.default_time_range || 'month',
        settings.last_backup_timestamp || null,
        timestamp,
        timestamp,
      ]
    );

    return {
      id,
      user_id: '',
      currency: settings.currency || 'USD',
      theme_mode: settings.theme_mode || 'light',
      theme_color: settings.theme_color || 'mint',
      default_time_range: settings.default_time_range || 'month',
      last_backup_timestamp: settings.last_backup_timestamp,
      created_at: timestamp,
      updated_at: timestamp,
    } as UserSettings;
  } else {
    // Update existing settings
    const updates: string[] = [];
    const values: any[] = [];

    if (settings.currency) {
      updates.push('currency = ?');
      values.push(settings.currency);
    }
    if (settings.theme_mode) {
      updates.push('theme_mode = ?');
      values.push(settings.theme_mode);
    }
    if (settings.theme_color) {
      updates.push('theme_color = ?');
      values.push(settings.theme_color);
    }
    if (settings.default_time_range) {
      updates.push('default_time_range = ?');
      values.push(settings.default_time_range);
    }
    if (settings.last_backup_timestamp !== undefined) {
      updates.push('last_backup_timestamp = ?');
      values.push(settings.last_backup_timestamp);
    }

    updates.push('updated_at = ?');
    values.push(timestamp);

    values.push(current.id);

    await db.runAsync(
      `UPDATE user_settings SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const result = await db.getFirstAsync<any>(
      'SELECT id, currency, theme_mode, theme_color, default_time_range, last_backup_timestamp, created_at, updated_at FROM user_settings WHERE id = ?',
      [current.id]
    );
    return {
      id: result.id,
      user_id: '', // Local DB doesn't have user_id
      currency: result.currency,
      theme_mode: result.theme_mode,
      theme_color: result.theme_color,
      default_time_range: result.default_time_range,
      last_backup_timestamp: result.last_backup_timestamp,
      created_at: result.created_at,
      updated_at: result.updated_at,
    } as UserSettings;
  }
};

// Clear all local data
export const clearAllData = async (): Promise<void> => {
  const db = openDatabase();

  await db.execAsync(`
    DELETE FROM transactions;
    DELETE FROM goals;
    DELETE FROM categories WHERE is_custom = 1;
  `);

  // Reinitialize default categories
  await initDefaultCategories();
};

// Get recent items (for quick re-add feature)
// Bulk insert functions for restore operations
export const bulkInsertCategories = async (categories: Category[]): Promise<void> => {
  const db = openDatabase();

  for (const category of categories) {
    await db.runAsync(
      `INSERT OR REPLACE INTO categories (id, name, type, is_custom, created_at, synced)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        category.id,
        category.name,
        category.type,
        category.is_custom ? 1 : 0,
        category.created_at,
        1, // Mark as synced since it's from Supabase
      ]
    );
  }
};

export const bulkInsertTransactions = async (transactions: Transaction[]): Promise<void> => {
  const db = openDatabase();

  for (const transaction of transactions) {
    await db.runAsync(
      `INSERT OR REPLACE INTO transactions
       (id, category_id, amount, type, item_name, description, payment_method, transaction_date, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.id,
        transaction.category_id,
        transaction.amount,
        transaction.type,
        transaction.item_name || null,
        transaction.description || null,
        transaction.payment_method,
        transaction.transaction_date,
        transaction.created_at,
        transaction.updated_at,
        1, // Mark as synced since it's from Supabase
      ]
    );
  }
};

export const bulkInsertGoals = async (goals: Goal[]): Promise<void> => {
  const db = openDatabase();

  for (const goal of goals) {
    await db.runAsync(
      `INSERT OR REPLACE INTO goals (id, title, target_amount, current_amount, deadline, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        goal.id,
        goal.title,
        goal.target_amount,
        goal.current_amount,
        goal.deadline || null,
        goal.created_at,
        goal.updated_at,
        1, // Mark as synced since it's from Supabase
      ]
    );
  }
};

export const getRecentItems = async (categoryId?: string, limit: number = 10): Promise<{ item_name: string; category_id: string; amount: number }[]> => {
  const db = openDatabase();

  let query = `
    SELECT DISTINCT item_name, category_id, amount
    FROM transactions
    WHERE item_name IS NOT NULL AND item_name != ''
  `;

  const params: any[] = [];

  if (categoryId) {
    query += ' AND category_id = ?';
    params.push(categoryId);
  }

  query += ' ORDER BY transaction_date DESC LIMIT ?';
  params.push(limit);

  const result = await db.getAllAsync<{ item_name: string; category_id: string; amount: number }>(query, params);
  return result;
};

// Subscription operations
export const addSubscriptionTransaction = async (transaction: TransactionFormData): Promise<Transaction> => {
  const db = openDatabase();
  const id = generateUUID();
  const timestamp = new Date().toISOString();

  // Calculate next occurrence based on interval
  let nextOccurrence: string | null = null;
  if (transaction.is_subscription && transaction.subscription_interval) {
    const nextDate = new Date(transaction.transaction_date);

    switch (transaction.subscription_interval) {
      case '2weeks':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'month':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'year':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case 'custom':
        if (transaction.subscription_custom_months) {
          nextDate.setMonth(nextDate.getMonth() + transaction.subscription_custom_months);
        }
        break;
    }

    nextOccurrence = nextDate.toISOString();
  }

  await db.runAsync(
    `INSERT INTO transactions
     (id, category_id, amount, type, item_name, description, payment_method, transaction_date,
      is_subscription, subscription_interval, subscription_custom_months, next_occurrence,
      created_at, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      transaction.category_id,
      parseFloat(transaction.amount),
      transaction.type,
      transaction.item_name || null,
      transaction.description || null,
      transaction.payment_method,
      transaction.transaction_date.toISOString(),
      transaction.is_subscription ? 1 : 0,
      transaction.subscription_interval || null,
      transaction.subscription_custom_months || null,
      nextOccurrence,
      timestamp,
      timestamp,
      0,
    ]
  );

  const result = await db.getFirstAsync<any>(
    `SELECT t.id, t.category_id, t.amount, t.type,
            t.item_name, t.description, t.payment_method,
            t.transaction_date, t.created_at, t.updated_at,
            t.is_subscription, t.subscription_interval, t.subscription_custom_months,
            t.subscription_parent_id, t.next_occurrence,
            c.id as category_id_joined,
            c.name as category_name,
            c.type as category_type,
            c.is_custom as category_is_custom,
            c.created_at as category_created_at
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.id = ?`,
    [id]
  );

  return {
    id: result.id,
    user_id: '',
    category_id: result.category_id,
    amount: result.amount,
    type: result.type,
    item_name: result.item_name,
    description: result.description,
    payment_method: result.payment_method,
    transaction_date: result.transaction_date,
    created_at: result.created_at,
    updated_at: result.updated_at,
    is_subscription: sqliteBoolean(result.is_subscription),
    subscription_interval: result.subscription_interval,
    subscription_custom_months: result.subscription_custom_months,
    subscription_parent_id: result.subscription_parent_id,
    next_occurrence: result.next_occurrence,
    category: result.category_id_joined ? {
      id: result.category_id_joined,
      user_id: '',
      name: result.category_name,
      type: result.category_type,
      is_custom: sqliteBoolean(result.category_is_custom),
      created_at: result.category_created_at,
    } : undefined,
  } as Transaction;
};

export const getActiveSubscriptions = async (): Promise<Transaction[]> => {
  const db = openDatabase();
  const result = await db.getAllAsync<any>(
    `SELECT t.id, t.category_id, t.amount, t.type,
            t.item_name, t.description, t.payment_method,
            t.transaction_date, t.created_at, t.updated_at,
            t.is_subscription, t.subscription_interval, t.subscription_custom_months,
            t.subscription_parent_id, t.next_occurrence,
            c.id as category_id_joined,
            c.name as category_name,
            c.type as category_type,
            c.is_custom as category_is_custom,
            c.created_at as category_created_at
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.is_subscription = 1 AND t.subscription_parent_id IS NULL
     ORDER BY t.next_occurrence ASC`
  );

  return result.map((row: any) => ({
    id: row.id,
    user_id: '',
    category_id: row.category_id,
    amount: row.amount,
    type: row.type,
    item_name: row.item_name,
    description: row.description,
    payment_method: row.payment_method,
    transaction_date: row.transaction_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_subscription: sqliteBoolean(row.is_subscription),
    subscription_interval: row.subscription_interval,
    subscription_custom_months: row.subscription_custom_months,
    subscription_parent_id: row.subscription_parent_id,
    next_occurrence: row.next_occurrence,
    category: row.category_id_joined ? {
      id: row.category_id_joined,
      user_id: '',
      name: row.category_name,
      type: row.category_type,
      is_custom: sqliteBoolean(row.category_is_custom),
      created_at: row.category_created_at,
    } : undefined,
  })) as Transaction[];
};

export const getDueSubscriptions = async (): Promise<Transaction[]> => {
  const db = openDatabase();
  const now = new Date().toISOString();

  const result = await db.getAllAsync<any>(
    `SELECT t.id, t.category_id, t.amount, t.type,
            t.item_name, t.description, t.payment_method,
            t.transaction_date, t.created_at, t.updated_at,
            t.is_subscription, t.subscription_interval, t.subscription_custom_months,
            t.subscription_parent_id, t.next_occurrence,
            c.id as category_id_joined,
            c.name as category_name,
            c.type as category_type,
            c.is_custom as category_is_custom,
            c.created_at as category_created_at
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.is_subscription = 1
       AND t.subscription_parent_id IS NULL
       AND t.next_occurrence IS NOT NULL
       AND t.next_occurrence <= ?
     ORDER BY t.next_occurrence ASC`,
    [now]
  );

  return result.map((row: any) => ({
    id: row.id,
    user_id: '',
    category_id: row.category_id,
    amount: row.amount,
    type: row.type,
    item_name: row.item_name,
    description: row.description,
    payment_method: row.payment_method,
    transaction_date: row.transaction_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_subscription: sqliteBoolean(row.is_subscription),
    subscription_interval: row.subscription_interval,
    subscription_custom_months: row.subscription_custom_months,
    subscription_parent_id: row.subscription_parent_id,
    next_occurrence: row.next_occurrence,
    category: row.category_id_joined ? {
      id: row.category_id_joined,
      user_id: '',
      name: row.category_name,
      type: row.category_type,
      is_custom: sqliteBoolean(row.category_is_custom),
      created_at: row.category_created_at,
    } : undefined,
  })) as Transaction[];
};

export const createSubscriptionOccurrence = async (subscriptionId: string): Promise<Transaction> => {
  const db = openDatabase();

  // Get the parent subscription
  const parent = await db.getFirstAsync<any>(
    `SELECT * FROM transactions WHERE id = ?`,
    [subscriptionId]
  );

  if (!parent || !sqliteBoolean(parent.is_subscription)) {
    throw new Error('Invalid subscription');
  }

  const newId = generateUUID();
  const timestamp = new Date().toISOString();
  const occurrenceDate = parent.next_occurrence || timestamp;

  // Create the new occurrence
  await db.runAsync(
    `INSERT INTO transactions
     (id, category_id, amount, type, item_name, description, payment_method, transaction_date,
      is_subscription, subscription_parent_id, created_at, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId,
      parent.category_id,
      parent.amount,
      parent.type,
      parent.item_name,
      parent.description,
      parent.payment_method,
      occurrenceDate,
      0, // Child transactions are not subscriptions themselves
      subscriptionId,
      timestamp,
      timestamp,
      0,
    ]
  );

  // Calculate and update next occurrence for parent
  const nextDate = new Date(occurrenceDate);

  switch (parent.subscription_interval) {
    case '2weeks':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'month':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'year':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case 'custom':
      if (parent.subscription_custom_months) {
        nextDate.setMonth(nextDate.getMonth() + parent.subscription_custom_months);
      }
      break;
  }

  await db.runAsync(
    `UPDATE transactions SET next_occurrence = ?, updated_at = ? WHERE id = ?`,
    [nextDate.toISOString(), timestamp, subscriptionId]
  );

  // Fetch and return the newly created transaction
  const result = await db.getFirstAsync<any>(
    `SELECT t.id, t.category_id, t.amount, t.type,
            t.item_name, t.description, t.payment_method,
            t.transaction_date, t.created_at, t.updated_at,
            t.is_subscription, t.subscription_parent_id,
            c.id as category_id_joined,
            c.name as category_name,
            c.type as category_type,
            c.is_custom as category_is_custom,
            c.created_at as category_created_at
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.id = ?`,
    [newId]
  );

  return {
    id: result.id,
    user_id: '',
    category_id: result.category_id,
    amount: result.amount,
    type: result.type,
    item_name: result.item_name,
    description: result.description,
    payment_method: result.payment_method,
    transaction_date: result.transaction_date,
    created_at: result.created_at,
    updated_at: result.updated_at,
    is_subscription: sqliteBoolean(result.is_subscription),
    subscription_parent_id: result.subscription_parent_id,
    category: result.category_id_joined ? {
      id: result.category_id_joined,
      user_id: '',
      name: result.category_name,
      type: result.category_type,
      is_custom: sqliteBoolean(result.category_is_custom),
      created_at: result.category_created_at,
    } : undefined,
  } as Transaction;
};

export const deleteSubscription = async (subscriptionId: string): Promise<void> => {
  const db = openDatabase();

  // Delete all child transactions first
  await db.runAsync(
    'DELETE FROM transactions WHERE subscription_parent_id = ?',
    [subscriptionId]
  );

  // Then delete the parent subscription
  await db.runAsync(
    'DELETE FROM transactions WHERE id = ?',
    [subscriptionId]
  );
};
