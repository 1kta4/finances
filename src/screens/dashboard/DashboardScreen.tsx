import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { AnimatedPieChart } from '../../components/charts/AnimatedPieChart';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { NeomorphicCard, NeomorphicChip } from '../../components/neomorphic';
import { TimeRange, Transaction } from '../../types';
import { formatCurrency, getMonthYearString, getDateRangeFromTimeRange } from '../../utils/helpers';
import { TIME_RANGE_OPTIONS } from '../../utils/constants';

const screenWidth = Dimensions.get('window').width;

export const DashboardScreen: React.FC = () => {
  const { colors } = useTheme();
  const {
    getBalanceData,
    getTransactionsByDateRange,
    goals,
    settings
  } = useData();
  const [timeRange, setTimeRange] = useState<TimeRange>(settings?.default_time_range || 'month');
  const [spendingChartMode, setSpendingChartMode] = useState<'items' | 'categories' | 'payment'>('items');
  const [earningChartMode, setEarningChartMode] = useState<'items' | 'categories' | 'payment'>('items');
  const [trendsChartMode, setTrendsChartMode] = useState<'comparison' | 'netBalance'>('comparison');
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);

  // Animation values
  const trendsScale = useRef(new Animated.Value(1)).current;
  const goalOpacity = useRef(new Animated.Value(1)).current;
  const lineChartAnimValue = useRef(new Animated.Value(1)).current;

  const balanceData = getBalanceData(timeRange);

  // Animate line chart on data change
  React.useEffect(() => {
    lineChartAnimValue.setValue(0);
    Animated.timing(lineChartAnimValue, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [timeRange, trendsChartMode]);

  // Cycle spending chart mode
  const handleSpendingChartToggle = () => {
    setSpendingChartMode(prev => {
      if (prev === 'items') return 'categories';
      if (prev === 'categories') return 'payment';
      return 'items';
    });
  };

  // Cycle earning chart mode
  const handleEarningChartToggle = () => {
    setEarningChartMode(prev => {
      if (prev === 'items') return 'categories';
      if (prev === 'categories') return 'payment';
      return 'items';
    });
  };

  // Toggle trends chart mode with transform animation
  const handleTrendsChartToggle = () => {
    Animated.sequence([
      Animated.timing(trendsScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(trendsScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      setTrendsChartMode(prev => prev === 'comparison' ? 'netBalance' : 'comparison');
    }, 200);
  };

  // Get current goal based on index
  const currentGoal = goals && goals.length > 0 ? goals[currentGoalIndex] : null;

  const goalPercentage = currentGoal
    ? Math.min((currentGoal.current_amount / currentGoal.target_amount) * 100, 100)
    : 0;

  // Handle goal cycling with animation
  const handleGoalClick = () => {
    if (goals && goals.length > 1) {
      Animated.sequence([
        Animated.timing(goalOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(goalOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      setCurrentGoalIndex((prev) => (prev + 1) % goals.length);
    }
  };

  // Prepare spending pie chart data - grouped by items, categories, or payment method
  const pieChartData = useMemo(() => {
    const { startDate, endDate } = getDateRangeFromTimeRange(timeRange);
    const transactions = getTransactionsByDateRange(startDate, endDate)
      .filter(t => t.type === 'spending');

    if (transactions.length === 0) return [];

    if (spendingChartMode === 'payment') {
      // Group by payment method
      const paymentTotals: Record<string, number> = {
        'Cash': 0,
        'Card': 0,
      };

      transactions.forEach(transaction => {
        const method = transaction.payment_method === 'cash' ? 'Cash' : 'Card';
        paymentTotals[method] += transaction.amount;
      });

      const colors = ['#4CAF50', '#2196F3'];

      return Object.entries(paymentTotals)
        .filter(([_, total]) => total > 0)
        .map(([name, total], index) => ({
          name,
          amount: total,
          color: colors[index % colors.length],
          legendFontColor: '#7F7F7F',
          legendFontSize: 12,
        }));
    }

    if (spendingChartMode === 'categories') {
      // Group by category
      const categoryTotals: Record<string, number> = {};

      transactions.forEach(transaction => {
        const key = transaction.category?.name || 'Uncategorized';
        if (!categoryTotals[key]) {
          categoryTotals[key] = 0;
        }
        categoryTotals[key] += transaction.amount;
      });

      const sortedCategories = Object.entries(categoryTotals)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total);

      const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E91E63', '#C9CBCF'];

      return sortedCategories.slice(0, 8).map((item, index) => ({
        name: item.name,
        amount: item.total,
        color: colors[index % colors.length],
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      }));
    }

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
  }, [timeRange, spendingChartMode, getTransactionsByDateRange, getDateRangeFromTimeRange]);

  // Prepare earning pie chart data - grouped by items, categories, or payment method
  const earningPieChartData = useMemo(() => {
    const { startDate, endDate } = getDateRangeFromTimeRange(timeRange);
    const transactions = getTransactionsByDateRange(startDate, endDate)
      .filter(t => t.type === 'earning');

    if (transactions.length === 0) return [];

    if (earningChartMode === 'payment') {
      // Group by payment method
      const paymentTotals: Record<string, number> = {
        'Cash': 0,
        'Card': 0,
      };

      transactions.forEach(transaction => {
        const method = transaction.payment_method === 'cash' ? 'Cash' : 'Card';
        paymentTotals[method] += transaction.amount;
      });

      const colors = ['#8BC34A', '#00BCD4'];

      return Object.entries(paymentTotals)
        .filter(([_, total]) => total > 0)
        .map(([name, total], index) => ({
          name,
          amount: total,
          color: colors[index % colors.length],
          legendFontColor: '#7F7F7F',
          legendFontSize: 12,
        }));
    }

    if (earningChartMode === 'categories') {
      // Group by category
      const categoryTotals: Record<string, number> = {};

      transactions.forEach(transaction => {
        const key = transaction.category?.name || 'Uncategorized';
        if (!categoryTotals[key]) {
          categoryTotals[key] = 0;
        }
        categoryTotals[key] += transaction.amount;
      });

      const sortedCategories = Object.entries(categoryTotals)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total);

      const colors = ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#00BCD4', '#03A9F4'];

      return sortedCategories.slice(0, 8).map((item, index) => ({
        name: item.name,
        amount: item.total,
        color: colors[index % colors.length],
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      }));
    }

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
  }, [timeRange, earningChartMode, getTransactionsByDateRange, getDateRangeFromTimeRange]);

  // Prepare line chart data - comparison OR net balance
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

    // Get data points and format based on time range
    const getDataPointsForRange = (range: TimeRange) => {
      switch(range) {
        case 'week': return { points: 7, format: 'MM/DD' };
        case 'month': return { points: 15, format: 'MM/DD' };
        case 'year': return { points: 12, format: 'MMM' };
        case 'all': return { points: 20, format: 'MM/YY' };
      }
    };

    const config = getDataPointsForRange(timeRange);

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

    // Sample data points based on time range
    const step = Math.max(1, Math.floor(sortedDates.length / config.points));
    const sampledDates = sortedDates.filter((_, i) => i % step === 0).slice(0, config.points);

    const labels = sampledDates.map(date => {
      const d = new Date(date);
      if (config.format === 'MMM') {
        // For year view, show month abbreviation
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[d.getMonth()];
      } else if (config.format === 'MM/YY') {
        // For all time, show month/year
        return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
      } else {
        // For week/month, show month/day
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }
    });

    if (trendsChartMode === 'netBalance') {
      // Calculate cumulative net balance
      let cumulativeBalance = 0;
      const netBalanceData = sampledDates.map(date => {
        const dayNet = dailyData[date].earnings - dailyData[date].spending;
        cumulativeBalance += dayNet;
        return cumulativeBalance;
      });

      return {
        labels,
        datasets: [
          {
            data: netBalanceData.length > 0 ? netBalanceData : [0],
            color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
            strokeWidth: 2,
            withDots: true,
          },
        ],
        legend: ['Net Balance'],
      };
    }

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
  }, [timeRange, trendsChartMode, getTransactionsByDateRange, getDateRangeFromTimeRange]);

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
            <NeomorphicChip
              key={option.value}
              label={option.label}
              selected={timeRange === option.value}
              onPress={() => setTimeRange(option.value as TimeRange)}
              style={styles.timeRangeChip}
            />
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
          <TouchableOpacity onPress={handleGoalClick} activeOpacity={0.8}>
            <Animated.View style={{ opacity: goalOpacity }}>
              <NeomorphicCard style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <Text style={[styles.goalTitle, { color: colors.text }]}>
                  Current Goal {goals && goals.length > 1 && `(${currentGoalIndex + 1}/${goals.length})`}
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
            </Animated.View>
          </TouchableOpacity>
        )}

        {/* Spending & Earning Trend Chart */}
        <TouchableOpacity
          onPress={handleTrendsChartToggle}
          activeOpacity={0.8}
        >
          <Animated.View style={{ transform: [{ scale: trendsScale }] }}>
            <NeomorphicCard style={styles.chartCard}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {trendsChartMode === 'comparison' ? 'Spending & Earning Trends' : 'Net Balance Trend'}
              </Text>
          {lineChartData.labels.length > 0 && lineChartData.labels[0] !== 'No Data' ? (
            <Animated.View 
              style={{ 
                opacity: lineChartAnimValue,
                transform: [{ 
                  translateY: lineChartAnimValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  })
                }]
              }}
            >
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
                    labelColor: (_opacity = 1) => colors.textSecondary,
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
            </Animated.View>
          ) : (
            <View style={styles.emptyChartContainer}>
              <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>
                No transaction data for this period
              </Text>
            </View>
          )}
            </NeomorphicCard>
          </Animated.View>
        </TouchableOpacity>

        {/* Item Spending Chart */}
        {pieChartData.length > 0 && (
          <TouchableOpacity
            onPress={handleSpendingChartToggle}
            activeOpacity={0.8}
          >
            <NeomorphicCard style={styles.chartCard}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  {spendingChartMode === 'items' && 'Top Spending Items'}
                  {spendingChartMode === 'categories' && 'Spending by Category'}
                  {spendingChartMode === 'payment' && 'Spending by Payment Method'}
                </Text>
            <AnimatedPieChart
              data={pieChartData}
              width={screenWidth - 60}
              height={250}
              accessor="amount"
              backgroundColor="transparent"
              chartKey={`spending-${spendingChartMode}`}
            />
            </NeomorphicCard>
          </TouchableOpacity>
        )}

        {/* Item Earning Chart */}
        {earningPieChartData.length > 0 && (
          <TouchableOpacity
            onPress={handleEarningChartToggle}
            activeOpacity={0.8}
          >
            <NeomorphicCard style={styles.chartCard}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  {earningChartMode === 'items' && 'Top Earning Sources'}
                  {earningChartMode === 'categories' && 'Earnings by Category'}
                  {earningChartMode === 'payment' && 'Earnings by Payment Method'}
                </Text>
            <AnimatedPieChart
              data={earningPieChartData}
              width={screenWidth - 60}
              height={250}
              accessor="amount"
              backgroundColor="transparent"
              chartKey={`earning-${earningChartMode}`}
            />
            </NeomorphicCard>
          </TouchableOpacity>
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
    gap: 8,
  },
  timeRangeChip: {
    flex: 1,
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
});
