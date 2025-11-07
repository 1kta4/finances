import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { NeomorphicCard, NeomorphicButton, NeomorphicInput } from '../../components/neomorphic';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { Transaction, Category } from '../../types';

export const SpendingScreen: React.FC = () => {
  const { colors } = useTheme();
  const {
    getTransactionsByType,
    settings,
    getCategoriesByType,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useData();

  const spendingTransactions = getTransactionsByType('spending');
  const spendingCategories = getCategoriesByType('spending');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('card');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const openAddModal = () => {
    setEditingTransaction(null);
    setSelectedCategory(spendingCategories[0]?.id || '');
    setAmount('');
    setItemName('');
    setDescription('');
    setPaymentMethod('card');
    const today = new Date();
    setSelectedDate(today);
    setTransactionDate(today.toISOString().split('T')[0]);
    setModalVisible(true);
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setSelectedCategory(transaction.category_id);
    setAmount(transaction.amount.toString());
    setItemName(transaction.item_name || '');
    setDescription(transaction.description || '');
    setPaymentMethod(transaction.payment_method);
    const date = new Date(transaction.transaction_date);
    setSelectedDate(date);
    setTransactionDate(date.toISOString().split('T')[0]);
    setModalVisible(true);
  };

  const openRepeatModal = (transaction: Transaction) => {
    setEditingTransaction(null); // This is a new transaction
    setSelectedCategory(transaction.category_id);
    setAmount(transaction.amount.toString());
    setItemName(transaction.item_name || '');
    setDescription(transaction.description || '');
    setPaymentMethod(transaction.payment_method);
    const today = new Date();
    setSelectedDate(today);
    setTransactionDate(today.toISOString().split('T')[0]);
    setModalVisible(true);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date);
      setTransactionDate(date.toISOString().split('T')[0]);
    }
  };

  const handleSave = async () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      const transactionData = {
        category_id: selectedCategory,
        amount,
        type: 'spending' as const,
        item_name: itemName || undefined,
        description: description || undefined,
        payment_method: paymentMethod,
        transaction_date: new Date(transactionDate),
      };

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, transactionData);
      } else {
        await addTransaction(transactionData);
      }
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save transaction');
    }
  };

  const handleDelete = (transaction: Transaction) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transaction.id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete transaction');
            }
          },
        },
      ]
    );
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    return (
      <NeomorphicCard style={styles.transactionCard}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => openEditModal(item)}
          onLongPress={() => handleDelete(item)}
        >
          <View style={styles.transactionRow}>
            <View style={styles.transactionLeft}>
              <Text style={[styles.itemName, { color: colors.text }]}>
                {item.item_name || 'No Description'}
              </Text>
              <Text style={[styles.categoryName, { color: colors.textSecondary }]}>
                {item.category?.name || 'Unknown Category'}
              </Text>
              <Text style={[styles.date, { color: colors.textSecondary }]}>
                {formatDateTime(item.transaction_date)}
              </Text>
            </View>

            <View style={styles.transactionRight}>
              <Text style={[styles.amount, { color: colors.error }]}>
                -{formatCurrency(item.amount, settings?.currency)}
              </Text>
              <Text style={[styles.paymentMethod, { color: colors.textSecondary }]}>
                {item.payment_method === 'cash' ? '💵 Cash' : '💳 Card'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.repeatButton, { backgroundColor: colors.accent }]}
          onPress={() => openRepeatModal(item)}
        >
          <Text style={styles.repeatButtonText}>🔁 Repeat</Text>
        </TouchableOpacity>
      </NeomorphicCard>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Spending</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {spendingTransactions.length} transactions
        </Text>
      </View>

      {spendingTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No spending transactions yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Tap + to add your first transaction
          </Text>
        </View>
      ) : (
        <FlatList
          data={spendingTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={openAddModal}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Transaction Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingTransaction ? 'Edit Transaction' : 'Add Spending'}
              </Text>

              {/* Category Selector */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {spendingCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor:
                          selectedCategory === cat.id ? colors.accent : colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: selectedCategory === cat.id ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <NeomorphicInput
                label="Amount"
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              <NeomorphicInput
                label="Item Name (Optional)"
                value={itemName}
                onChangeText={setItemName}
                placeholder="e.g., Groceries"
              />

              <NeomorphicInput
                label="Description (Optional)"
                value={description}
                onChangeText={setDescription}
                placeholder="Add notes..."
                multiline
              />

              {/* Payment Method */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Payment Method</Text>
              <View style={styles.paymentMethodButtons}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === 'cash' && { backgroundColor: colors.accent },
                    { borderColor: colors.border },
                  ]}
                  onPress={() => setPaymentMethod('cash')}
                >
                  <Text
                    style={[
                      styles.paymentMethodText,
                      { color: paymentMethod === 'cash' ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    💵 Cash
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === 'card' && { backgroundColor: colors.accent },
                    { borderColor: colors.border },
                  ]}
                  onPress={() => setPaymentMethod('card')}
                >
                  <Text
                    style={[
                      styles.paymentMethodText,
                      { color: paymentMethod === 'card' ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    💳 Card
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Date Selection */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Date</Text>
              <View style={styles.dateContainer}>
                <TouchableOpacity
                  style={[styles.calendarButton, { backgroundColor: colors.accent }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.calendarButtonText}>📅 Pick Date</Text>
                </TouchableOpacity>
                <View style={styles.dateInputContainer}>
                  <NeomorphicInput
                    value={transactionDate}
                    onChangeText={(text) => {
                      setTransactionDate(text);
                      // Try to parse and update selectedDate if valid
                      const parsedDate = new Date(text);
                      if (!isNaN(parsedDate.getTime())) {
                        setSelectedDate(parsedDate);
                      }
                    }}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}

              {Platform.OS === 'ios' && showDatePicker && (
                <NeomorphicButton
                  title="Done"
                  onPress={() => setShowDatePicker(false)}
                  style={{ marginTop: 8 }}
                />
              )}

              <View style={styles.modalButtons}>
                <NeomorphicButton
                  title="Cancel"
                  onPress={() => setModalVisible(false)}
                  variant="outline"
                  style={styles.modalButton}
                />
                <NeomorphicButton
                  title="Save"
                  onPress={handleSave}
                  style={styles.modalButton}
                />
              </View>

              {editingTransaction && (
                <NeomorphicButton
                  title="Delete Transaction"
                  onPress={() => {
                    setModalVisible(false);
                    handleDelete(editingTransaction);
                  }}
                  variant="outline"
                  style={[styles.deleteButton, { borderColor: '#E74C3C' }]}
                />
              )}
            </ScrollView>
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
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  transactionCard: {
    marginBottom: 12,
    padding: 16,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionLeft: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    marginTop: 16,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentMethodButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  paymentMethodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '500',
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
    alignItems: 'center',
  },
  calendarButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dateInputContainer: {
    flex: 1,
  },
  repeatButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  repeatButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    marginTop: 16,
  },
});
