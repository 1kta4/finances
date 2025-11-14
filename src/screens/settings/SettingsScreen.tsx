import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  Platform,
  TouchableOpacity,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { NeomorphicCard, NeomorphicButton, NeomorphicInput, NeomorphicSwitch, NeomorphicChip } from '../../components/neomorphic';
import { ThemeColor, Category, Goal } from '../../types';
import { AVAILABLE_CURRENCIES, THEME_COLORS } from '../../utils/constants';

export const SettingsScreen: React.FC = () => {
  const { colors, themeMode, themeColor, toggleTheme, setThemeColor } = useTheme();
  const { user, signOut } = useAuth();
  const {
    backupToSupabase,
    restoreFromSupabase,
    clearLocalData,
    settings,
    updateSettings,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
  } = useData();
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Category modal state
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<'spending' | 'earning'>('spending');

  // Goal modal state
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalCurrentAmount, setGoalCurrentAmount] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [showGoalDatePicker, setShowGoalDatePicker] = useState(false);
  const [selectedGoalDate, setSelectedGoalDate] = useState(new Date());

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      await backupToSupabase();
      Alert.alert('Success', 'Data backed up successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to backup data');
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = async () => {
    Alert.alert(
      'Restore Data',
      'This will replace your local data with data from Supabase. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setRestoring(true);
            try {
              await restoreFromSupabase();
              Alert.alert('Success', 'Data restored successfully!');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to restore data');
            } finally {
              setRestoring(false);
            }
          },
        },
      ]
    );
  };

  const handleClearData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all transactions and goals. This action cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearLocalData();
              Alert.alert('Success', 'All data cleared successfully!');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const handleCurrencyChange = async (currencyCode: string) => {
    try {
      await updateSettings({ currency: currencyCode });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update currency');
    }
  };

  // Category handlers
  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryType('spending');
    setCategoryModalVisible(true);
  };

  const openEditCategoryModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryType(category.type);
    setCategoryModalVisible(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryName.trim());
      } else {
        await addCategory({
          name: categoryName.trim(),
          type: categoryType,
        });
      }
      setCategoryModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = (category: Category) => {
    if (!category.is_custom) {
      Alert.alert('Error', 'Cannot delete default categories');
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  // Goal handlers
  const openAddGoalModal = () => {
    setEditingGoal(null);
    setGoalTitle('');
    setGoalTargetAmount('');
    setGoalCurrentAmount('0');
    setGoalDeadline('');
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1); // Default to 1 month from now
    setSelectedGoalDate(futureDate);
    setGoalModalVisible(true);
  };

  const openEditGoalModal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalTitle(goal.title);
    setGoalTargetAmount(goal.target_amount.toString());
    setGoalCurrentAmount(goal.current_amount.toString());
    const deadline = goal.deadline ? new Date(goal.deadline) : new Date();
    setSelectedGoalDate(deadline);
    setGoalDeadline(goal.deadline ? deadline.toISOString().split('T')[0] : '');
    setGoalModalVisible(true);
  };

  const handleGoalDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowGoalDatePicker(false);
    }

    if (date) {
      setSelectedGoalDate(date);
      setGoalDeadline(date.toISOString().split('T')[0]);
    }
  };

  const handleSaveGoal = async () => {
    if (!goalTitle.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }
    if (!goalTargetAmount || parseFloat(goalTargetAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }

    try {
      const goalData = {
        title: goalTitle.trim(),
        target_amount: goalTargetAmount,
        current_amount: goalCurrentAmount || '0',
        deadline: goalDeadline ? new Date(goalDeadline) : undefined,
      };

      if (editingGoal) {
        await updateGoal(editingGoal.id, goalData);
      } else {
        await addGoal(goalData);
      }
      setGoalModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save goal');
    }
  };

  const handleDeleteGoal = (goal: Goal) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(goal.id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete goal');
            }
          },
        },
      ]
    );
  };

  const themeColors: ThemeColor[] = ['mint', 'purple', 'emerald', 'lightblue'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        </View>

        {/* Account Section */}
        <NeomorphicCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          <View style={styles.accountInfo}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <Text style={[styles.value, { color: colors.text }]}>{user?.email}</Text>
          </View>
          <NeomorphicButton
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutButton}
          />
        </NeomorphicCard>

        {/* Appearance Section */}
        <NeomorphicCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Dark Mode
            </Text>
            <NeomorphicSwitch
              value={themeMode === 'dark'}
              onValueChange={toggleTheme}
            />
          </View>

          <Text style={[styles.themeLabel, { color: colors.textSecondary }]}>
            Theme Color
          </Text>
          <View style={styles.themeColorContainer}>
            {themeColors.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.themeColorButton,
                  {
                    backgroundColor: THEME_COLORS[color][themeMode].accent,
                    borderWidth: themeColor === color ? 3 : 0,
                    borderColor: colors.text,
                  },
                ]}
                onPress={() => setThemeColor(color)}
              />
            ))}
          </View>

          <Text style={[styles.themeLabel, { color: colors.textSecondary }]}>
            Currency
          </Text>
          <View style={styles.currencyContainer}>
            {AVAILABLE_CURRENCIES.map((currency) => (
              <NeomorphicChip
                key={currency.code}
                label={currency.symbol}
                selected={settings?.currency === currency.code}
                onPress={() => handleCurrencyChange(currency.code)}
                style={styles.currencyChip}
              />
            ))}
          </View>
        </NeomorphicCard>

        {/* Data Management Section */}
        <NeomorphicCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Data Management
          </Text>

          {settings?.last_backup_timestamp && (
            <Text style={[styles.backupInfo, { color: colors.textSecondary }]}>
              Last backup: {new Date(settings.last_backup_timestamp).toLocaleString()}
            </Text>
          )}

          <NeomorphicButton
            title={backingUp ? 'Backing up...' : 'Backup to Cloud'}
            onPress={handleBackup}
            disabled={backingUp}
            style={styles.dataButton}
            variant="secondary"
          />

          <NeomorphicButton
            title={restoring ? 'Restoring...' : 'Restore from Cloud'}
            onPress={handleRestore}
            disabled={restoring}
            style={styles.dataButton}
            variant="secondary"
          />

          <NeomorphicButton
            title="Clear All Local Data"
            onPress={handleClearData}
            style={styles.dataButton}
            variant="outline"
          />
        </NeomorphicCard>

        {/* Categories Management */}
        <NeomorphicCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
            <NeomorphicButton
              title="+ Add"
              onPress={openAddCategoryModal}
              variant="secondary"
              style={styles.addButton}
            />
          </View>

          {categories.length === 0 ? (
            <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
              No categories yet
            </Text>
          ) : (
            <View style={styles.listContainer}>
              {categories.map((category) => (
                <View
                  key={category.id}
                  style={[styles.listItem, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.listItemContent}>
                    <Text style={[styles.listItemTitle, { color: colors.text }]}>
                      {category.name}
                    </Text>
                    <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                      {category.type} {category.is_custom ? '(Custom)' : '(Default)'}
                    </Text>
                  </View>
                  <View style={styles.listItemActions}>
                    {category.is_custom && (
                      <>
                        <NeomorphicButton
                          title="Edit"
                          onPress={() => openEditCategoryModal(category)}
                          variant="secondary"
                          style={styles.actionButton}
                        />
                        <NeomorphicButton
                          title="Delete"
                          onPress={() => handleDeleteCategory(category)}
                          variant="outline"
                          style={styles.actionButton}
                        />
                      </>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </NeomorphicCard>

        {/* Goals Management */}
        <NeomorphicCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Goals</Text>
            <NeomorphicButton
              title="+ Add"
              onPress={openAddGoalModal}
              variant="secondary"
              style={styles.addButton}
            />
          </View>

          {goals.length === 0 ? (
            <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
              No goals yet
            </Text>
          ) : (
            <View style={styles.listContainer}>
              {goals.map((goal) => (
                <View
                  key={goal.id}
                  style={[styles.listItem, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.listItemContent}>
                    <Text style={[styles.listItemTitle, { color: colors.text }]}>
                      {goal.title}
                    </Text>
                    <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                      ${goal.current_amount.toFixed(2)} / ${goal.target_amount.toFixed(2)}
                      {goal.deadline && ` • Due: ${new Date(goal.deadline).toLocaleDateString()}`}
                    </Text>
                  </View>
                  <View style={styles.listItemActions}>
                    <NeomorphicButton
                      title="Edit"
                      onPress={() => openEditGoalModal(goal)}
                      variant="secondary"
                      style={styles.actionButton}
                    />
                    <NeomorphicButton
                      title="Delete"
                      onPress={() => handleDeleteGoal(goal)}
                      variant="outline"
                      style={styles.actionButton}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </NeomorphicCard>
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={categoryModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </Text>

            <NeomorphicInput
              label="Category Name"
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder="Enter category name"
            />

            {!editingCategory && (
              <View style={styles.typeSelector}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Type</Text>
                <View style={styles.typeButtons}>
                  <NeomorphicChip
                    label="Spending"
                    selected={categoryType === 'spending'}
                    onPress={() => setCategoryType('spending')}
                    style={styles.typeChip}
                  />
                  <NeomorphicChip
                    label="Earning"
                    selected={categoryType === 'earning'}
                    onPress={() => setCategoryType('earning')}
                    style={styles.typeChip}
                  />
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <NeomorphicButton
                title="Cancel"
                onPress={() => setCategoryModalVisible(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <NeomorphicButton
                title="Save"
                onPress={handleSaveCategory}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Goal Modal */}
      <Modal
        visible={goalModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingGoal ? 'Edit Goal' : 'Add Goal'}
            </Text>

            <NeomorphicInput
              label="Goal Title"
              value={goalTitle}
              onChangeText={setGoalTitle}
              placeholder="Enter goal title"
            />

            <NeomorphicInput
              label="Target Amount"
              value={goalTargetAmount}
              onChangeText={setGoalTargetAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />

            <NeomorphicInput
              label="Current Amount"
              value={goalCurrentAmount}
              onChangeText={setGoalCurrentAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />

            {/* Deadline Selection */}
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>Deadline (Optional)</Text>
            <View style={styles.dateContainer}>
              <NeomorphicButton
                title="📅 Pick Date"
                onPress={() => setShowGoalDatePicker(true)}
                variant="secondary"
                style={styles.calendarButton}
              />
              <View style={styles.dateInputContainer}>
                <NeomorphicInput
                  value={goalDeadline}
                  onChangeText={(text) => {
                    setGoalDeadline(text);
                    // Try to parse and update selectedGoalDate if valid
                    const parsedDate = new Date(text);
                    if (!isNaN(parsedDate.getTime())) {
                      setSelectedGoalDate(parsedDate);
                    }
                  }}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>

            {showGoalDatePicker && (
              <DateTimePicker
                value={selectedGoalDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleGoalDateChange}
                minimumDate={new Date()}
              />
            )}

            {Platform.OS === 'ios' && showGoalDatePicker && (
              <NeomorphicButton
                title="Done"
                onPress={() => setShowGoalDatePicker(false)}
                style={{ marginTop: 8 }}
              />
            )}

            <View style={styles.modalButtons}>
              <NeomorphicButton
                title="Cancel"
                onPress={() => setGoalModalVisible(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <NeomorphicButton
                title="Save"
                onPress={handleSaveGoal}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  accountInfo: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  themeLabel: {
    fontSize: 14,
    marginBottom: 12,
    marginTop: 8,
  },
  themeColorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  themeColorButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  currencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  currencyChip: {
    flex: 1,
  },
  backupInfo: {
    fontSize: 12,
    marginBottom: 16,
  },
  dataButton: {
    marginBottom: 12,
  },
  placeholder: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContainer: {
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 12,
  },
  listItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  typeSelector: {
    marginTop: 16,
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  typeChip: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  calendarButton: {
    minWidth: 120,
  },
  dateInputContainer: {
    flex: 1,
  },
});
