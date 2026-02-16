import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  BeerBottle,
  CalendarBlank,
  TrendUp,
  CaretDown,
  CaretUp,
  X,
  ChartLine,
  Calendar,
  Info,
} from 'phosphor-react-native';

interface Sale {
  id: number;
  drink_id: string;
  drink_name: string;
  price: number;
  "buying-price": number;
  bottles_sold: number;
  total_amount: number;
  sale_date: string;
  profit_per_bottle?: number;
  total_profit?: number;
}

interface DailyProfit {
  date: string;
  dayName: string;
  dayNumber: number;
  month: string;
  year: number;
  sales: Sale[];
  totalBottles: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
}

interface MonthlyProfit {
  month: string;
  year: number;
  totalBottles: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
}

export default function ProfitScreen() {
  const [weeklyProfits, setWeeklyProfits] = useState<DailyProfit[]>([]);
  const [monthlyProfits, setMonthlyProfits] = useState<MonthlyProfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    weeklyTotal: 0,
    weeklyProfit: 0,
    weeklyMargin: 0,
    monthlyTotal: 0,
    monthlyProfit: 0,
    monthlyMargin: 0,
  });

  useEffect(() => {
    fetchProfitData();
  }, []);

  const fetchProfitData = async () => {
    try {
      // Fetch all sales
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('sale_date', { ascending: false });

      if (error) throw error;

      // Calculate profit per bottle for each sale using the buying price at time of sale
      const salesWithProfit = (data || []).map((sale: any) => ({
        ...sale,
        profit_per_bottle: sale.price - sale["buying-price"],
        total_profit: (sale.price - sale["buying-price"]) * sale.bottles_sold
      }));

      // Group by day for weekly view (last 7 days from current date)
      const weekly = groupByDay(salesWithProfit, 7);
      setWeeklyProfits(weekly);

      // Group by month for monthly view (last 30 days from current date)
      const monthly = groupByMonth(salesWithProfit, 30);
      setMonthlyProfits(monthly);

      // Calculate summaries
      calculateSummaries(weekly, monthly);

    } catch (error) {
      console.error('Error fetching profit data:', error);
      Alert.alert('Error', 'Failed to load profit data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const groupByDay = (sales: Sale[], days: number): DailyProfit[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - days);

    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= cutoffDate;
    });
    
    const grouped: { [key: string]: any } = {};

    filteredSales.forEach(sale => {
      const date = new Date(sale.sale_date);
      const dateKey = date.toDateString();
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: sale.sale_date,
          dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
          dayNumber: date.getDate(),
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          year: date.getFullYear(),
          sales: [],
          totalBottles: 0,
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
          profitMargin: 0,
        };
      }
      
      grouped[dateKey].sales.push(sale);
      grouped[dateKey].totalBottles += sale.bottles_sold;
      grouped[dateKey].totalRevenue += sale.total_amount;
      grouped[dateKey].totalCost += sale.bottles_sold * sale["buying-price"];
      grouped[dateKey].totalProfit += sale.total_profit!;
    });

    // Calculate profit margin for each day
    Object.values(grouped).forEach((day: any) => {
      day.profitMargin = day.totalRevenue > 0 
        ? (day.totalProfit / day.totalRevenue) * 100 
        : 0;
    });

    // Sort by date (most recent first)
    return Object.values(grouped).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const groupByMonth = (sales: Sale[], days: number): MonthlyProfit[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - days);

    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= cutoffDate;
    });
    
    const grouped: { [key: string]: any } = {};

    filteredSales.forEach(sale => {
      const date = new Date(sale.sale_date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'long' });
      const year = date.getFullYear();
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          month: monthName,
          year: year,
          totalBottles: 0,
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
          profitMargin: 0,
        };
      }
      
      grouped[monthKey].totalBottles += sale.bottles_sold;
      grouped[monthKey].totalRevenue += sale.total_amount;
      grouped[monthKey].totalCost += sale.bottles_sold * sale["buying-price"];
      grouped[monthKey].totalProfit += sale.total_profit!;
    });

    // Calculate profit margin for each month
    Object.values(grouped).forEach((month: any) => {
      month.profitMargin = month.totalRevenue > 0 
        ? (month.totalProfit / month.totalRevenue) * 100 
        : 0;
    });

    // Sort by date (most recent first)
    return Object.values(grouped).sort((a, b) => 
      b.year - a.year || b.month.localeCompare(a.month)
    );
  };

  const calculateSummaries = (weekly: DailyProfit[], monthly: MonthlyProfit[]) => {
    const weeklyTotal = weekly.reduce((sum, day) => sum + day.totalRevenue, 0);
    const weeklyProfit = weekly.reduce((sum, day) => sum + day.totalProfit, 0);
    const weeklyMargin = weeklyTotal > 0 ? (weeklyProfit / weeklyTotal) * 100 : 0;

    const monthlyTotal = monthly.reduce((sum, month) => sum + month.totalRevenue, 0);
    const monthlyProfit = monthly.reduce((sum, month) => sum + month.totalProfit, 0);
    const monthlyMargin = monthlyTotal > 0 ? (monthlyProfit / monthlyTotal) * 100 : 0;

    setSummary({
      weeklyTotal,
      weeklyProfit,
      weeklyMargin,
      monthlyTotal,
      monthlyProfit,
      monthlyMargin,
    });
  };

  const toggleDayExpand = (dateKey: string) => {
    if (expandedDay === dateKey) {
      setExpandedDay(null);
    } else {
      setExpandedDay(dateKey);
    }
  };

  const toggleMonthExpand = (monthKey: string) => {
    if (expandedMonth === monthKey) {
      setExpandedMonth(null);
    } else {
      setExpandedMonth(monthKey);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Ksh. ${amount.toLocaleString('en-KE')}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfitData();
  };

  const getProfitColor = (profit: number) => {
    return profit >= 0 ? '#4CAF50' : '#FF4444';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A80F0" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Profit Analysis</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <TrendUp size={22} color="#4A80F0" weight="bold" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
 

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          {/* Weekly Summary Card */}
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: '#E8F0FE' }]}>
              <Calendar size={24} color="#4A80F0" weight="duotone" />
            </View>
            <Text style={styles.summaryLabel}>7 Days Profit</Text>
            <Text style={[styles.summaryValue, { color: getProfitColor(summary.weeklyProfit) }]}>
              {formatCurrency(summary.weeklyProfit)}
            </Text>
            <View style={styles.summaryDetail}>
              <Text style={styles.summaryDetailText}>
                Revenue: {formatCurrency(summary.weeklyTotal)}
              </Text>
              <Text style={styles.summaryDetailText}>
                Margin: {formatPercentage(summary.weeklyMargin)}
              </Text>
            </View>
          </View>

          {/* Monthly Summary Card */}
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: '#E8F7E8' }]}>
              <ChartLine size={24} color="#4CAF50" weight="duotone" />
            </View>
            <Text style={styles.summaryLabel}>30 Days Profit</Text>
            <Text style={[styles.summaryValue, { color: getProfitColor(summary.monthlyProfit) }]}>
              {formatCurrency(summary.monthlyProfit)}
            </Text>
            <View style={styles.summaryDetail}>
              <Text style={styles.summaryDetailText}>
                Revenue: {formatCurrency(summary.monthlyTotal)}
              </Text>
              <Text style={styles.summaryDetailText}>
                Margin: {formatPercentage(summary.monthlyMargin)}
              </Text>
            </View>
          </View>
        </View>

        {/* Weekly Profits Section */}
        <Text style={styles.sectionTitle}>Last 7 Days Profit</Text>
        
        {weeklyProfits.length === 0 ? (
          <View style={styles.emptyState}>
            <CalendarBlank size={48} color="#ccc" weight="duotone" />
            <Text style={styles.emptyStateText}>No profit data for the past week</Text>
          </View>
        ) : (
          weeklyProfits.map((day, index) => {
            const dateKey = `${day.dayName}-${day.dayNumber}-${day.month}-${day.year}`;
            const isExpanded = expandedDay === dateKey;
            
            return (
              <View key={index} style={styles.dayCard}>
                {/* Collapsed View */}
                <TouchableOpacity 
                  style={styles.dayHeader}
                  onPress={() => toggleDayExpand(dateKey)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayName}>{day.dayName}</Text>
                    <Text style={styles.dayDate}>{day.month} {day.dayNumber}, {day.year}</Text>
                  </View>
                  
                  <View style={styles.daySummary}>
                    <View style={styles.daySummaryItem}>
                      <Text style={styles.daySummaryLabel}>Bottles</Text>
                      <Text style={styles.daySummaryValue}>{day.totalBottles}</Text>
                    </View>
                    <View style={styles.daySummaryDivider} />
                    <View style={styles.daySummaryItem}>
                      <Text style={styles.daySummaryLabel}>Profit. '</Text>
                      <Text style={[styles.daySummaryProfit, { color: getProfitColor(day.totalProfit) }]}>
                        {formatCurrency(day.totalProfit)}
                      </Text>
                    </View>
                    <View style={styles.daySummaryDivider} />
                    <View style={styles.daySummaryItem}>
                      <Text style={styles.daySummaryLabel}>Margin. '</Text>
                      <Text style={styles.daySummaryMargin}>{formatPercentage(day.profitMargin)}</Text>
                    </View>
                    {isExpanded ? (
                      <CaretUp size={18} color="#4A80F0" weight="bold" />
                    ) : (
                      <CaretDown size={18} color="#4A80F0" weight="bold" />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Expanded View */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {/* Headers */}
                    <View style={styles.profitHeaderRow}>
                      <Text style={[styles.profitHeaderText, styles.profitHeaderDrink]}>Drink</Text>
                      <Text style={[styles.profitHeaderText, styles.profitHeaderBottles]}>Btls</Text>
                      <Text style={[styles.profitHeaderText, styles.profitHeaderPerBottle]}>Profit per Btl</Text>
                      <Text style={[styles.profitHeaderText, styles.profitHeaderTotalProfit]}>Total Profit</Text>
                    </View>

                    <View style={styles.profitsList}>
                      {day.sales.map((sale: Sale, idx: number) => (
                        <View key={idx} style={styles.profitItemContainer}>
                          <View style={styles.profitRow}>
                            {/* Drink Name */}
                            <View style={styles.profitDrinkCell}>
                              <BeerBottle size={14} color="#4A80F0" weight="duotone" />
                              <Text style={styles.profitDrinkName} numberOfLines={1}>
                                {sale.drink_name}
                              </Text>
                            </View>
                            
                            {/* Bottles */}
                            <View style={styles.profitBottlesCell}>
                              <Text style={styles.profitBottles}>{sale.bottles_sold}</Text>
                            </View>
                            
                            {/* Profit Per Bottle */}
                            <View style={styles.profitPerBottleCell}>
                              <Text style={styles.profitPerBottle}>
                                {formatCurrency(sale.profit_per_bottle!)}
                              </Text>
                            </View>
                            
                            {/* Total Profit */}
                            <View style={styles.profitTotalProfitCell}>
                              <Text style={[styles.profitTotalProfit, { color: getProfitColor(sale.total_profit!) }]}>
                                {formatCurrency(sale.total_profit!)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* Day Totals */}
                    <View style={styles.dayTotalsRow}>
                      <Text style={styles.dayTotalsLabel}>Day Total:</Text>
                      <View style={styles.dayTotalsValues}>
                        <Text style={styles.dayTotalsBottles}>{day.totalBottles}</Text>
                        <Text style={styles.dayTotalsSpacer}></Text>
                        <Text style={[styles.dayTotalsTotalProfit, { color: getProfitColor(day.totalProfit) }]}>
                          {formatCurrency(day.totalProfit)}
                        </Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={() => setExpandedDay(null)}
                    >
                      <X size={16} color="#666" />
                      <Text style={styles.closeButtonText}>Close Details</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
              </View>
            );
          })
        )}

        {/* Monthly Profits Section */}
        <Text style={[styles.sectionTitle, styles.monthlySectionTitle]}>Last 30 Days Profit</Text>
        
        {monthlyProfits.length === 0 ? (
          <View style={styles.emptyState}>
            <CalendarBlank size={48} color="#ccc" weight="duotone" />
            <Text style={styles.emptyStateText}>No profit data for the past 30 days</Text>
          </View>
        ) : (
          monthlyProfits.map((month, index) => {
            const monthKey = `${month.month}-${month.year}`;
            const isExpanded = expandedMonth === monthKey;
            
            return (
              <View key={index} style={styles.monthCard}>
                {/* Collapsed View */}
                <TouchableOpacity 
                  style={styles.monthHeader}
                  onPress={() => toggleMonthExpand(monthKey)}
                  activeOpacity={0.7}
                >
                  <View style={styles.monthInfo}>
                    <Text style={styles.monthName}>{month.month} {month.year}</Text>
                  </View>
                  
                  <View style={styles.monthSummary}>
                    <View style={styles.monthSummaryItem}>
                      <Text style={styles.monthSummaryLabel}>Bottles</Text>
                      <Text style={styles.monthSummaryValue}>{month.totalBottles}</Text>
                    </View>
                    <View style={styles.monthSummaryDivider} />
                    <View style={styles.monthSummaryItem}>
                      <Text style={styles.monthSummaryLabel}>Profit *</Text>
                      <Text style={[styles.monthSummaryProfit, { color: getProfitColor(month.totalProfit) }]}>
                        {formatCurrency(month.totalProfit)}
                      </Text>
                    </View>
                    <View style={styles.monthSummaryDivider} />
                    <View style={styles.monthSummaryItem}>
                      <Text style={styles.monthSummaryLabel}>Margin '</Text>
                      <Text style={styles.monthSummaryMargin}>{formatPercentage(month.profitMargin)}</Text>
                    </View>
                    {isExpanded ? (
                      <CaretUp size={18} color="#4A80F0" weight="bold" />
                    ) : (
                      <CaretDown size={18} color="#4A80F0" weight="bold" />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Expanded View - Monthly Summary */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <View style={styles.monthlyTotals}>
                      <View style={styles.monthlyTotalRow}>
                        <Text style={styles.monthlyTotalLabel}>Total Revenue:</Text>
                        <Text style={styles.monthlyTotalValue}>{formatCurrency(month.totalRevenue)}</Text>
                      </View>
                      <View style={styles.monthlyTotalRow}>
                        <Text style={styles.monthlyTotalLabel}>Total Cost:</Text>
                        <Text style={styles.monthlyTotalValue}>{formatCurrency(month.totalCost)}</Text>
                      </View>
                      <View style={styles.monthlyTotalRow}>
                        <Text style={styles.monthlyTotalLabel}>Total Profit:</Text>
                        <Text style={[styles.monthlyTotalValue, { color: getProfitColor(month.totalProfit) }]}>
                          {formatCurrency(month.totalProfit)}
                        </Text>
                      </View>
                      <View style={styles.monthlyTotalRow}>
                        <Text style={styles.monthlyTotalLabel}>Profit Margin:</Text>
                        <Text style={styles.monthlyTotalValue}>{formatPercentage(month.profitMargin)}</Text>
                      </View>
                      <View style={styles.monthlyTotalRow}>
                        <Text style={styles.monthlyTotalLabel}>Total Bottles:</Text>
                        <Text style={styles.monthlyTotalValue}>{month.totalBottles}</Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={() => setExpandedMonth(null)}
                    >
                      <X size={16} color="#666" />
                      <Text style={styles.closeButtonText}>Close Details</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
               {/* Info Note */}
        <View style={styles.infoContainer}>
          <Info size={16} color="#4A80F0" weight="duotone" />
          <Text style={styles.infoText}>
            Profits are calculated using the buying price from the drinks table at the time each sale was made. 
            This ensures price changes don't affect historical profit calculations.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#E8F0FE',
    borderRadius: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8F0FE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    gap: 8,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#4A80F0',
    lineHeight: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryDetail: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  summaryDetailText: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  monthlySectionTitle: {
    marginTop: 24,
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  monthCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  dayHeader: {
    padding: 12,
  },
  monthHeader: {
    padding: 12,
  },
  dayInfo: {
    marginBottom: 8,
  },
  monthInfo: {
    marginBottom: 8,
  },
  dayName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  monthName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dayDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  daySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  daySummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  monthSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  daySummaryDivider: {
    width: 1,
    height: 25,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 4,
  },
  monthSummaryDivider: {
    width: 1,
    height: 25,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 4,
  },
  daySummaryLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
  },
  monthSummaryLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
  },
  daySummaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  monthSummaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  daySummaryProfit: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  monthSummaryProfit: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  daySummaryMargin: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9500',
  },
  monthSummaryMargin: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9500',
  },
  expandedContent: {
    padding: 12,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  profitHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  profitHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  profitHeaderDrink: {
    flex: 2.2,
  },
  profitHeaderBottles: {
    flex: 0.8,
    textAlign: 'center',
  },
  profitHeaderPerBottle: {
    flex: 1.5,
    textAlign: 'right',
  },
  profitHeaderTotalProfit: {
    flex: 1.5,
    textAlign: 'right',
    paddingRight: 4,
  },
  profitsList: {
    marginBottom: 10,
  },
  profitItemContainer: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  profitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  profitDrinkCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 2.2,
  },
  profitDrinkName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  profitBottlesCell: {
    flex: 0.8,
    alignItems: 'center',
  },
  profitBottles: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A80F0',
  },
  profitPerBottleCell: {
    flex: 1.5,
    alignItems: 'flex-end',
  },
  profitPerBottle: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  profitTotalProfitCell: {
    flex: 1.5,
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  profitTotalProfit: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayTotalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 4,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  dayTotalsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  dayTotalsValues: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  dayTotalsBottles: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A80F0',
    flex: 0.8,
    textAlign: 'center',
  },
  dayTotalsSpacer: {
    flex: 3,
  },
  dayTotalsTotalProfit: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1.5,
    textAlign: 'right',
    paddingRight: 4,
  },
  monthlyTotals: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  monthlyTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  monthlyTotalLabel: {
    fontSize: 13,
    color: '#666',
  },
  monthlyTotalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    gap: 4,
    marginTop: 8,
  },
  closeButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});