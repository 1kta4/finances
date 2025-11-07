import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { NeomorphicCard } from '../../components/neomorphic';
import { TimeRange, Transaction } from '../../types';
import { formatCurrency, getMonthYearString, getDateRangeFromTimeRange, formatDate } from '../../utils/helpers';
import { TIME_RANGE_OPTIONS } from '../../utils/constants';

const screenWidth = Dimensions.get('window').width;

export const DashboardScreen: React.FC = () => {
  const { colors } = useTheme();
  const {
    getBalanceData,
    getCurrentGoal,
    getCategorySpending,
    getTransactionsByDateRange,
    settings
  } = useData();
  const [timeRange, setTimeRange] = useState<TimeRange>(settings?.default_time_range || 'month');

  const balanceData = getBalanceData(timeRange);
  const currentGoal = getCurrentGoal();
  const categorySpending = getCategorySpending(timeRange);

  const goalPercentage = currentGoal
    ? Math.min((currentGoal.current_amount / currentGoal.target_amount) * 100, 100)
    : 0;

  // Prepare spending pie chart data - grouped by item names
  const pieChartData = useMemo(() => {
    const { startDate, endDate } = getDateRangeFromTimeRange(timeRange);
    const transactions = getTransactionsByDateRange(startDate, endDate)
      .filter(t => t.type === 'spending');

    if (transactions.length === 0) return [];

    // Group by item_name (or category if no item_name)
    const itemTotals: Record<string, number> = {};

    transactions.forEach(transaction => {
      const key = transaction.item_name && transaction.item_name.trim() !== ''
        ? transaction.item_name
        : transaction.category?.name || 'Uncategorized';

      if (!itemTotals[key]) {
        itemTotals[key] = 0;
      }
      itemTotals[key] += transaction.amount;
    });

    // Convert to array and sort by amount
    const sortedItems = Object.entries(itemTotals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);

    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E91E63', '#C9CBCF'];

    return sortedItems.slice(0, 8).map((item, index) => ({
      name: item.name,
      amount: item.total,
      color: colors[index % colors.length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
  }, [timeRange, getTransactionsByDateRange, getDateRangeFromTimeRange]);

  // Prepare earning pie chart data - grouped by item names
  const earningPieChartData = useMemo(() => {
    const { startDate, endDate } = getDateRangeFromTimeRange(timeRange);
    const transactions = getTransactionsByDateRange(startDate, endDate)
      .filter(t => t.type === 'earning');

    if (transactions.length === 0) return [];

    // Group by item_name (or category if no item_name)
    const itemTotals: Record<string, number> = {};

    transactions.forEach(transaction => {
      const key = transaction.item_name && transaction.item_name.trim() !== ''
        ? transaction.item_name
        : transaction.category?.name || 'Uncategorized';

      if (!itemTotals[key]) {
        itemTotals[key] = 0;
      }
      itemTotals[key] += transaction.amount;
    });

    // Convert to array and sort by amount
    const sortedItems = Object.entries(itemTotals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);

    const colors = ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#00BCD4', '#03A9F4'];

    return sortedItems.slice(0, 8).map((item, index) => ({
      name: item.name,
      amount: item.total,
      color: colors[index % colors.length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
  }, [timeRange, getTransactionsByDateRange, getDateRangeFromTimeRange]);

  // Prepare line chart data
  const lineChartData = useMemo(() => {
    const { startDate, endDate } = getDateRangeFromTimeRange(timeRange);
    const transactions = getTransactionsByDateRange(startDate, endDate);

    if (transactions.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [
          { data: [0], color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})` },
          { data: [0], color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})` },
        ],
      };
    }

    // Group transactions by date
    const dailyData: Record<string, { earnings: number; spending: number }> = {};

    transactions.forEach((t: Transaction) => {
      const date = new Date(t.transaction_date).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { earnings: 0, spending: 0 };
      }
      if (t.type === 'earning') {
        dailyData[date].earnings += t.amount;
      } else {
        dailyData[date].spending += t.amount;
      }
    });

    // Sort dates and get labels
    const sortedDates = Object.keys(dailyData).sort();

    // Limit to 7 data points for better readability
    const step = Math.max(1, Math.floor(sortedDates.length / 7));
    const sampledDates = sortedDates.filter((_, i) => i % step === 0).slice(0, 7);

    const labels = sampledDates.map(date => {
      const d = new Date(date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });

    const earningsData = sampledDates.map(date => dailyData[date].earnings);
    const spendingData = sampledDates.map(date => dailyData[date].spending);

    return {
      labels,
      datasets: [
        {
          data: earningsData.length > 0 ? earningsData : [0],
          color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
          strokeWidth: 2,
        },
        {
          data: spendingData.length > 0 ? spendingData : [0],
          color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ['Earnings', 'Spending'],
    };
  }, [timeRange, getTransactionsByDateRange, getDateRangeFromTimeRange]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {getMonthYearString()}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Financial Overview
          </Text>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {TIME_RANGE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.timeRangeButton,
                {
                  backgroundColor: timeRange === option.value ? colors.accent : colors.surface,
                },
              ]}
              onPress={() => setTimeRange(option.value as TimeRange)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  {
                    color: timeRange === option.value ? '#FFFFFF' : colors.text,
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Balance Cards */}
        <NeomorphicCard style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                Earnings
              </Text>
              <Text style={[styles.balanceAmount, { color: colors.success }]}>
                {formatCurrency(balanceData.totalEarnings, settings?.currency)}
              </Text>
            </View>

            <View style={styles.balanceItem}>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                Spending
              </Text>
              <Text style={[styles.balanceAmount, { color: colors.error }]}>
                {formatCurrency(balanceData.totalSpending, settings?.currency)}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.netBalanceContainer}>
            <Text style={[styles.netBalanceLabel, { color: colors.textSecondary }]}>
              Net Balance
            </Text>
            <Text
              style={[
                styles.netBalanceAmount,
                {
                  color:
                    balanceData.netBalance >= 0 ? colors.success : colors.error,
                },
              ]}
            >
              {formatCurrency(balanceData.netBalance, settings?.currency)}
            </Text>
          </View>
        </NeomorphicCard>

        {/* Goal Widget */}
        {currentGoal && (
          <NeomorphicCard style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={[styles.goalTitle, { color: colors.text }]}>
                Current Goal
              </Text>
              <Text style={[styles.goalPercentage, { color: colors.accent }]}>
                {goalPercentage.toFixed(0)}%
              </Text>
            </View>

            <Text style={[styles.goalName, { color: colors.text }]}>
              {currentGoal.title}
            </Text>

            <View style={styles.goalProgress}>
              <View
                style={[
                  styles.progressBar,
                  { backgroundColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${goalPercentage}%`,
                      backgroundColor: colors.accent,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.goalAmounts}>
              <Text style={[styles.goalAmountText, { color: colors.textSecondary }]}>
                {formatCurrency(currentGoal.current_amount, settings?.currency)} /{' '}
                {formatCurrency(currentGoal.target_amount, settings?.currency)}
              </Text>
            </View>
          </NeomorphicCard>
        )}

        {/* Spending & Earning Trend Chart */}
        <NeomorphicCard style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Spending & Earning Trends
          </Text>
          {lineChartData.labels.length > 0 && lineChartData.labels[0] !== 'No Data' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={lineChartData}
                width={Math.max(screenWidth - 60, lineChartData.labels.length * 60)}
                height={220}
                chartConfig={{
                  backgroundColor: colors.surface,
                  backgroundGradientFrom: colors.surface,
                  backgroundGradientTo: colors.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
                  labelColor: (opacity = 1) => colors.textSecondary,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                  },
                }}
                bezier
                style={styles.chart}
              />
            </ScrollView>
          ) : (
            <View style={styles.emptyChartContainer}>
              <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>
                No transaction data for this period
              </Text>
            </View>
          )}
        </NeomorphicCard>

        {/* Item Spending Chart */}
        {pieChartData.length > 0 && (
          <NeomorphicCard style={styles.chartCard}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              Top Spending Items
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <PieChart
                data={pieChartData}
                width={screenWidth - 60}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
              />
            </ScrollView>
            {/* Category Legend with amounts */}
            <View style={styles.legendContainer}>
              {pieChartData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendText, { color: colors.text }]}>
                    {item.name}: {formatCurrency(item.amount, settings?.currency)}
                  </Text>
                </View>
              ))}
            </View>
          </NeomorphicCard>
        )}

        {/* Item Earning Chart */}
        {earningPieChartData.length > 0 && (
          <NeomorphicCard style={styles.chartCard}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              Top Earning Sources
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <PieChart
                data={earningPieChartData}
                width={screenWidth - 60}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
              />
            </ScrollView>
            {/* Category Legend with amounts */}
            <View style={styles.legendContainer}>
              {earningPieChartData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendText, { color: colors.text }]}>
                    {item.name}: {formatCurrency(item.amount, settings?.currency)}
                  </Text>
                </View>
              ))}
            </View>
          </NeomorphicCard>
        )}
      </ScrollView>
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  balanceCard: {
    marginBottom: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  balanceItem: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  netBalanceContainer: {
    alignItems: 'center',
  },
  netBalanceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  netBalanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  goalCard: {
    marginBottom: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  goalPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  goalName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  goalProgress: {
    marginBottom: 12,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  goalAmounts: {
    alignItems: 'center',
  },
  goalAmountText: {
    fontSize: 14,
  },
  chartCard: {
    marginBottom: 20,
    paddingVertical: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyChartContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartText: {
    fontSize: 14,
    textAlign: 'center',
  },
  legendContainer: {
    marginTop: 16,
    paddingTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    flex: 1,
  },
});
