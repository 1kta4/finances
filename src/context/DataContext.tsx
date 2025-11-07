import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  DataContextType,
  Transaction,
  Category,
  Goal,
  UserSettings,
  TransactionFormData,
  GoalFormData,
  CategoryFormData,
  TransactionType,
  TimeRange,
  BalanceData,
  CategorySpending,
} from '../types';
import {
  getAllTransactions,
  getAllCategories,
  getAllGoals,
  getUserSettings,
  addTransaction as addTransactionToDB,
  updateTransactionInDB,
  deleteTransactionFromDB,
  addCategory as addCategoryToDB,
  updateCategoryInDB,
  deleteCategoryFromDB,
  addGoal as addGoalToDB,
  updateGoalInDB,
  deleteGoalFromDB,
  updateUserSettingsInDB,
  getRecentItems as getRecentItemsFromDB,
  clearAllData,
  getTransactionsByDateRange as getTransactionsByDateRangeFromDB,
} from '../services/storage';
import {
  fetchTransactions,
  fetchCategories,
  fetchGoals,
  backupAllData,
} from '../services/supabase';
import { useAuth } from './AuthContext';
import { getDateRangeFromTimeRange } from '../utils/helpers';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      // Clear data when user logs out
      setTransactions([]);
      setCategories([]);
      setGoals([]);
      setSettings(null);
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, categoriesData, goalsData, settingsData] = await Promise.all([
        getAllTransactions(),
        getAllCategories(),
        getAllGoals(),
        getUserSettings(),
      ]);

      // Deep ensure all boolean fields are actual booleans
      const sanitizedCategories = categoriesData.map(cat => ({
        ...cat,
        is_custom: Boolean(cat.is_custom) === true,
      }));

      setTransactions(transactionsData);
      setCategories(sanitizedCategories);
      setGoals(goalsData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Transaction methods
  const addTransaction = async (transaction: TransactionFormData) => {
    try {
      const newTransaction = await addTransactionToDB(transaction);
      setTransactions(prev => [newTransaction, ...prev]);
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (id: string, transaction: Partial<TransactionFormData>) => {
    try {
      const updatedTransaction = await updateTransactionInDB(id, transaction);
      setTransactions(prev =>
        prev.map(t => (t.id === id ? updatedTransaction : t))
      );
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await deleteTransactionFromDB(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  const getTransactionsByType = (type: TransactionType): Transaction[] => {
    return transactions.filter(t => t.type === type);
  };

  const getTransactionsByDateRange = (startDate: Date, endDate: Date): Transaction[] => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  };

  // Category methods
  const addCategory = async (category: CategoryFormData) => {
    try {
      const newCategory = await addCategoryToDB(category);
      setCategories(prev => [...prev, newCategory]);
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateCategory = async (id: string, name: string) => {
    try {
      const updatedCategory = await updateCategoryInDB(id, name);
      setCategories(prev =>
        prev.map(c => (c.id === id ? updatedCategory : c))
      );
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      // Check if there are transactions using this category
      const categoryTransactions = transactions.filter(t => t.category_id === id);
      if (categoryTransactions.length > 0) {
        throw new Error('Cannot delete category with existing transactions');
      }

      await deleteCategoryFromDB(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  const getCategoriesByType = (type: TransactionType): Category[] => {
    return categories.filter(c => c.type === type);
  };

  // Goal methods
  const addGoal = async (goal: GoalFormData) => {
    try {
      const newGoal = await addGoalToDB(goal);
      setGoals(prev => [newGoal, ...prev]);
    } catch (error) {
      console.error('Error adding goal:', error);
      throw error;
    }
  };

  const updateGoal = async (id: string, goal: Partial<GoalFormData>) => {
    try {
      const updatedGoal = await updateGoalInDB(id, goal);
      setGoals(prev =>
        prev.map(g => (g.id === id ? updatedGoal : g))
      );
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await deleteGoalFromDB(id);
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  };

  const getCurrentGoal = (): Goal | null => {
    return goals.length > 0 ? goals[0] : null;
  };

  // Settings methods
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const updatedSettings = await updateUserSettingsInDB(newSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  // Sync methods
  const backupToSupabase = async () => {
    try {
      if (!user) throw new Error('User not authenticated');

      await backupAllData(categories, transactions, goals);

      // Update local last backup timestamp
      const timestamp = new Date().toISOString();
      await updateUserSettingsInDB({ last_backup_timestamp: timestamp });
      setSettings(prev => prev ? { ...prev, last_backup_timestamp: timestamp } : null);
    } catch (error) {
      console.error('Error backing up to Supabase:', error);
      throw error;
    }
  };

  const restoreFromSupabase = async () => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Fetch data from Supabase
      const [transactionsData, categoriesData, goalsData] = await Promise.all([
        fetchTransactions(),
        fetchCategories(),
        fetchGoals(),
      ]);

      // Clear local data
      await clearAllData();

      // Save fetched data to local storage
      // Note: This is a simplified approach. In production, you'd want to handle
      // conflicts and merging more carefully

      setTransactions(transactionsData);
      setCategories(categoriesData);
      setGoals(goalsData);

      // Reload data from local storage to ensure consistency
      await loadData();
    } catch (error) {
      console.error('Error restoring from Supabase:', error);
      throw error;
    }
  };

  const clearLocalData = async () => {
    try {
      await clearAllData();
      setTransactions([]);
      setGoals([]);
      // Reload categories (defaults will be restored)
      const categoriesData = await getAllCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error clearing local data:', error);
      throw error;
    }
  };

  // Utility methods
  const getBalanceData = (timeRange: TimeRange): BalanceData => {
    const { startDate, endDate } = getDateRangeFromTimeRange(timeRange);
    const filteredTransactions = getTransactionsByDateRange(startDate, endDate);

    const totalEarnings = filteredTransactions
      .filter(t => t.type === 'earning')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSpending = filteredTransactions
      .filter(t => t.type === 'spending')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalEarnings,
      totalSpending,
      netBalance: totalEarnings - totalSpending,
    };
  };

  const getCategorySpending = (timeRange: TimeRange): CategorySpending[] => {
    const { startDate, endDate } = getDateRangeFromTimeRange(timeRange);
    const filteredTransactions = getTransactionsByDateRange(startDate, endDate)
      .filter(t => t.type === 'spending');

    const categoryTotals: Record<string, { name: string; total: number }> = {};

    filteredTransactions.forEach(transaction => {
      const categoryId = transaction.category_id;
      const category = categories.find(c => c.id === categoryId);

      if (category) {
        if (!categoryTotals[categoryId]) {
          categoryTotals[categoryId] = {
            name: category.name,
            total: 0,
          };
        }
        categoryTotals[categoryId].total += transaction.amount;
      }
    });

    return Object.entries(categoryTotals)
      .map(([category_id, data]) => ({
        category_id,
        category_name: data.name,
        total: data.total,
      }))
      .sort((a, b) => b.total - a.total);
  };

  const getRecentItems = (categoryId?: string): { item_name: string; category_id: string; amount: number }[] => {
    const items = transactions
      .filter(t => t.item_name && t.item_name.trim() !== '')
      .filter(t => !categoryId || t.category_id === categoryId)
      .slice(0, 10);

    // Remove duplicates based on item_name
    const uniqueItems = items.filter(
      (item, index, self) =>
        index === self.findIndex(t => t.item_name === item.item_name && t.category_id === item.category_id)
    );

    return uniqueItems.map(t => ({
      item_name: t.item_name!,
      category_id: t.category_id,
      amount: t.amount,
    }));
  };

  return (
    <DataContext.Provider
      value={{
        transactions,
        categories,
        goals,
        settings,
        loading,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        getTransactionsByType,
        getTransactionsByDateRange,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoriesByType,
        addGoal,
        updateGoal,
        deleteGoal,
        getCurrentGoal,
        updateSettings,
        backupToSupabase,
        restoreFromSupabase,
        clearLocalData,
        getBalanceData,
        getCategorySpending,
        getRecentItems,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
