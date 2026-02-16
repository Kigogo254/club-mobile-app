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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ArrowLeft,
  BeerBottle,
  CurrencyDollar,
  CalendarBlank,
  ShoppingBag,
  CaretDown,
  CaretUp,
  X,
  Trash,
  Calendar as CalendarIcon,
  TrashSimple,
  ArrowsClockwise,
} from 'phosphor-react-native';
import { DailySales } from '@/types/sales';

export default function SalesScreen() {
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [allSales, setAllSales] = useState<DailySales[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [showingAllSales, setShowingAllSales] = useState(false);
  const [weekSummary, setWeekSummary] = useState({
    totalSales: 0,
    totalBottles: 0,
    totalAmount: 0,
  });

  // Search state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchResults, setSearchResults] = useState<DailySales | null>(null);
  const [searching, setSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchInputText, setSearchInputText] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await Promise.all([
      fetchSales(),
      fetchAllSales()
    ]);
  };

  const fetchSales = async () => {
    try {
      // Calculate date 7 days ago
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .gte('sale_date', sevenDaysAgo.toISOString())
        .order('sale_date', { ascending: false });

      if (error) throw error;

      // Group sales by day
      const grouped = groupSalesByDay(data || []);
      setDailySales(grouped);
      
      // Calculate week summary
      calculateWeekSummary(grouped);
    } catch (error) {
      console.error('Error fetching sales:', error);
      Alert.alert('Error', 'Failed to load sales data');
    }
  };

  const fetchAllSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('sale_date', { ascending: false });

      if (error) throw error;

      // Group sales by day
      const grouped = groupSalesByDay(data || []);
      setAllSales(grouped);
    } catch (error) {
      console.error('Error fetching all sales:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const searchSalesByDate = async (date: Date) => {
    setSearching(true);
    try {
      // Get start and end of the selected day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .gte('sale_date', startOfDay.toISOString())
        .lte('sale_date', endOfDay.toISOString())
        .order('sale_date', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const grouped = groupSalesByDay(data);
        setSearchResults(grouped[0] || null);
        setShowSearchModal(true);
        
        // Format date for search input
        setSearchInputText(date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }));
      } else {
        Alert.alert('No Results', 'No sales found for the selected date');
        setSearchInputText('');
      }
    } catch (error) {
      console.error('Error searching sales:', error);
      Alert.alert('Error', 'Failed to search sales data');
    } finally {
      setSearching(false);
      setShowDatePicker(false);
    }
  };

  const groupSalesByDay = (sales: any[]): DailySales[] => {
    const grouped: { [key: string]: any } = {};

    sales.forEach(sale => {
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
          dailyTotal: 0,
          dailyBottles: 0,
        };
      }
      
      grouped[dateKey].sales.push(sale);
      grouped[dateKey].dailyTotal += sale.total_amount || (sale.price * sale.bottles_sold);
      grouped[dateKey].dailyBottles += sale.bottles_sold;
    });

    // Convert to array and sort by date (most recent first)
    return Object.values(grouped).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const calculateWeekSummary = (dailyData: DailySales[]) => {
    const totalBottles = dailyData.reduce((sum, day) => sum + day.dailyBottles, 0);
    const totalAmount = dailyData.reduce((sum, day) => sum + day.dailyTotal, 0);

    setWeekSummary({
      totalSales: dailyData.length,
      totalBottles,
      totalAmount,
    });
  };

  const toggleDayExpand = (dateKey: string) => {
    if (expandedDay === dateKey) {
      setExpandedDay(null);
    } else {
      setExpandedDay(dateKey);
    }
  };

  const getDrinkIcon = (drinkName: string) => {
    return <BeerBottle size={16} color="#4A80F0" weight="duotone" />;
  };

  const formatCurrency = (amount: number) => {
    return `Ksh. ${amount.toLocaleString('en-KE')}`;
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  const toggleSalesView = () => {
    setShowingAllSales(!showingAllSales);
    setExpandedDay(null);
  };

  const isOlderThan10Days = (dateString: string) => {
    const saleDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - saleDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 10;
  };

  const handleDeleteSale = (saleId: number, drinkName: string, date: string) => {
    Alert.alert(
      'Delete Sale',
      `Are you sure you want to delete this sale of ${drinkName} from ${new Date(date).toLocaleDateString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('sales')
                .delete()
                .eq('id', saleId);

              if (error) throw error;

              Alert.alert('Success', 'Sale deleted successfully');
              
              // Full page refresh - reload all data
              await loadAllData();
              
            } catch (error) {
              console.error('Error deleting sale:', error);
              Alert.alert('Error', 'Failed to delete sale');
            }
          },
        },
      ]
    );
  };

  const handleDeleteDaySales = (day: DailySales) => {
    Alert.alert(
      'Delete Day\'s Sales',
      `Are you sure you want to delete ALL sales for ${day.dayName}, ${day.month} ${day.dayNumber}, ${day.year}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get all sale IDs for this day
              const saleIds = day.sales.map(sale => sale.id);
              
              const { error } = await supabase
                .from('sales')
                .delete()
                .in('id', saleIds);

              if (error) throw error;

              Alert.alert('Success', `All sales for ${day.dayName} deleted successfully`);
              
              // Full page refresh - reload all data
              await loadAllData();
              
            } catch (error) {
              console.error('Error deleting day sales:', error);
              Alert.alert('Error', 'Failed to delete sales');
            }
          },
        },
      ]
    );
  };

  const handleCleanupOldSales = async () => {
    Alert.alert(
      'Clean Up Old Sales',
      'This will permanently delete all sales older than 30 days. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setCleaningUp(true);
            try {
              // Calculate date 30 days ago
              const today = new Date();
              const thirtyDaysAgo = new Date(today);
              thirtyDaysAgo.setDate(today.getDate() - 30);

              const { data, error } = await supabase
                .from('sales')
                .delete()
                .lt('sale_date', thirtyDaysAgo.toISOString())
                .select();

              if (error) throw error;

              const deletedCount = data?.length || 0;
              
              Alert.alert(
                'Cleanup Complete',
                `Successfully deleted ${deletedCount} sale records older than 30 days.`
              );

              // Full page refresh - reload all data
              await loadAllData();
              
            } catch (error) {
              console.error('Error cleaning up sales:', error);
              Alert.alert('Error', 'Failed to clean up old sales records');
            } finally {
              setCleaningUp(false);
            }
          },
        },
      ]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setSelectedDate(selectedDate);
      searchSalesByDate(selectedDate);
    } else {
      setShowDatePicker(false);
    }
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  const displaySales = showingAllSales ? allSales : dailySales;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Sales Report</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <TouchableOpacity 
        style={styles.searchBar}
        onPress={() => setShowDatePicker(true)}
        activeOpacity={0.7}
      >
        <CalendarIcon size={20} color="#4A80F0" weight="duotone" />
        <Text style={searchInputText ? styles.searchBarText : styles.searchBarPlaceholder}>
          {searchInputText || 'Search Specific Day'}
        </Text>
      </TouchableOpacity>

      {/* Refresh Button - Visible and Labeled */}
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <ArrowsClockwise size={18} color="#fff" weight="bold" />
        <Text style={styles.refreshButtonText}>Refresh Sales</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Week Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: '#E8F0FE' }]}>
              <CalendarBlank size={22} color="#4A80F0" weight="duotone" />
            </View>
            <Text style={styles.summaryLabel}>Sales Made '</Text>
            <Text style={styles.summaryValue}>Past {weekSummary.totalSales} days</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: '#E8F7E8' }]}>
              <BeerBottle size={22} color="#4CAF50" weight="duotone" />
            </View>
            <Text style={styles.summaryLabel}>Total Bottles</Text>
            <Text style={styles.summaryValue}>{weekSummary.totalBottles}</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: '#FFF3E0' }]}>
              <CurrencyDollar size={22} color="#FF9500" weight="duotone" />
            </View>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryValue}>{formatCurrency(weekSummary.totalAmount)}</Text>
          </View>
        </View>

        {/* View Toggle Buttons */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, !showingAllSales && styles.toggleButtonActive]}
            onPress={() => setShowingAllSales(false)}
          >
            <Text style={[styles.toggleButtonText, !showingAllSales && styles.toggleButtonTextActive]}>
              Last 7 Days
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.toggleButton, showingAllSales && styles.toggleButtonActive]}
            onPress={() => setShowingAllSales(true)}
          >
            <Text style={[styles.toggleButtonText, showingAllSales && styles.toggleButtonTextActive]}>
              All Sales
            </Text>
          </TouchableOpacity>
        </View>

        {/* 30-Day Cleanup Button */}
        <TouchableOpacity
          style={styles.cleanupButton}
          onPress={handleCleanupOldSales}
          disabled={cleaningUp}
        >
          {cleaningUp ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Trash size={18} color="#fff" weight="bold" />
              <Text style={styles.cleanupButtonText}>Delete Older Sales (30+ days)</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Sales Cards */}
        <Text style={styles.sectionTitle}>
          {showingAllSales ? 'All Sales History' : 'Last 7 Days'}
        </Text>
        
        {displaySales.length === 0 ? (
          <View style={styles.emptyState}>
            <CalendarBlank size={48} color="#ccc" weight="duotone" />
            <Text style={styles.emptyStateText}>No sales data found</Text>
          </View>
        ) : (
          displaySales.map((day, index) => {
            const dateKey = `${day.dayName}-${day.dayNumber}-${day.month}-${day.year}`;
            const isExpanded = expandedDay === dateKey;
            const isOld = isOlderThan10Days(day.date);
            
            return (
              <View key={index} style={[styles.dayCard, isOld && styles.dayCardOld]}>
                {/* Delete Day Button (appears on the card for old sales) */}
                {isOld && (
                  <TouchableOpacity
                    style={styles.deleteDayButton}
                    onPress={() => handleDeleteDaySales(day)}
                  >
                    <TrashSimple size={14} color="#FF4444" weight="bold" />
                    <Text style={styles.deleteDayText}>Delete Day</Text>
                  </TouchableOpacity>
                )}

                {/* Collapsed View - Always Visible */}
                <TouchableOpacity 
                  style={styles.dayHeader}
                  onPress={() => toggleDayExpand(dateKey)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayName}>{day.dayName}</Text>
                    <Text style={styles.dayDate}>{day.month} {day.dayNumber}, {day.year}</Text>
                    {isOld && (
                      <View style={styles.oldBadge}>
                        <Text style={styles.oldBadgeText}>10+ days</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.daySummary}>
                    <View style={styles.daySummaryItem}>
                      <Text style={styles.daySummaryLabel}>Bottles</Text>
                      <Text style={styles.daySummaryValue}>{day.dailyBottles}</Text>
                    </View>
                    <View style={styles.daySummaryDivider} />
                    <View style={styles.daySummaryItem}>
                      <Text style={styles.daySummaryLabel}>Total '</Text>
                      <Text style={styles.daySummaryAmount}>{formatCurrency(day.dailyTotal)}</Text>
                    </View>
                    {isExpanded ? (
                      <CaretUp size={18} color="#4A80F0" weight="bold" />
                    ) : (
                      <CaretDown size={18} color="#4A80F0" weight="bold" />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Expanded View - Shows Details in 4-Column Grid */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {/* Header for columns */}
                    <View style={styles.drinkHeaderRow}>
                      <Text style={[styles.drinkHeaderText, styles.drinkHeaderName]}>Drink</Text>
                      <Text style={[styles.drinkHeaderText, styles.drinkHeaderPrice]}>Price</Text>
                      <Text style={[styles.drinkHeaderText, styles.drinkHeaderBottles]}>Bottles</Text>
                      <Text style={[styles.drinkHeaderText, styles.drinkHeaderTotal]}>Total Per Drink</Text>
                    </View>

                    <View style={styles.drinksList}>
                      {day.sales.map((sale, idx) => {
                        const totalAmount = sale.total_amount || (sale.price * sale.bottles_sold);
                        
                        return (
                          <View key={idx} style={styles.drinkItemContainer}>
                            <View style={styles.drinkGridRow}>
                              {/* Column 1: Icon + Name */}
                              <View style={styles.drinkNameCell}>
                                {getDrinkIcon(sale.drink_name)}
                                <Text style={styles.drinkName} numberOfLines={1}>
                                  {sale.drink_name}
                                </Text>
                              </View>
                              
                              {/* Column 2: Price */}
                              <View style={styles.drinkPriceCell}>
                                <Text style={styles.drinkPrice}>
                                  Ksh.{sale.price.toLocaleString('en-KE')}
                                </Text>
                              </View>
                              
                              {/* Column 3: Bottles */}
                              <View style={styles.drinkBottlesCell}>
                                <Text style={styles.drinkBottles}>
                                  {sale.bottles_sold}
                                </Text>
                                <Text style={styles.drinkBottlesLabel}>btls</Text>
                              </View>
                              
                              {/* Column 4: Total */}
                              <View style={styles.drinkTotalCell}>
                                <Text style={styles.drinkTotal}>
                                  Ksh.{totalAmount.toLocaleString('en-KE')}
                                </Text>
                              </View>
                              
                              {/* Delete button for old sales */}
                              {isOld && (
                                <TouchableOpacity
                                  style={styles.gridDeleteButton}
                                  onPress={() => handleDeleteSale(sale.id, sale.drink_name, sale.sale_date)}
                                >
                                  <TrashSimple size={14} color="#FF4444" weight="bold" />
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        );
                      })}
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
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Search Results Modal */}
      <Modal
        visible={showSearchModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <CalendarIcon size={24} color="#4A80F0" weight="duotone" />
                <Text style={styles.modalTitle}>Search Results</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {searching ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#4A80F0" />
                <Text style={styles.modalLoadingText}>Searching...</Text>
              </View>
            ) : searchResults ? (
              <ScrollView style={styles.modalBody}>
                <View style={styles.searchResultCard}>
                  <View style={styles.searchResultHeader}>
                    <Text style={styles.searchResultDate}>
                      {formatDisplayDate(new Date(searchResults.date))}
                    </Text>
                  </View>

                  <View style={styles.searchResultSummary}>
                    <View style={styles.searchResultSummaryItem}>
                      <BeerBottle size={18} color="#4CAF50" weight="duotone" />
                      <Text style={styles.searchResultSummaryLabel}>Bottles '</Text>
                      <Text style={styles.searchResultSummaryValue}>{searchResults.dailyBottles}</Text>
                    </View>
                    <View style={styles.searchResultSummaryItem}>
                      <CurrencyDollar size={18} color="#FF9500" weight="duotone" />
                      <Text style={styles.searchResultSummaryLabel}>Total Amount '</Text>
                      <Text style={styles.searchResultSummaryValue}>
                        {formatCurrency(searchResults.dailyTotal)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.searchResultSubtitle}>Drink Sales</Text>
                  
                  {/* Header for columns in search results */}
                  <View style={styles.searchResultHeaderRow}>
                    <Text style={[styles.searchResultHeaderText, styles.drinkHeaderName]}>Drink</Text>
                    <Text style={[styles.searchResultHeaderText, styles.drinkHeaderPrice]}>Price</Text>
                    <Text style={[styles.searchResultHeaderText, styles.drinkHeaderBottles]}>Bottles</Text>
                    <Text style={[styles.searchResultHeaderText, styles.drinkHeaderTotal]}>Total</Text>
                  </View>
                  
                  {searchResults.sales.map((sale, idx) => {
                    const totalAmount = sale.total_amount || (sale.price * sale.bottles_sold);
                    
                    return (
                      <View key={idx} style={styles.searchResultDrinkItem}>
                        {/* Column 1: Icon + Name */}
                        <View style={styles.drinkNameCell}>
                          {getDrinkIcon(sale.drink_name)}
                          <Text style={styles.drinkName} numberOfLines={1}>
                            {sale.drink_name}
                          </Text>
                        </View>
                        
                        {/* Column 2: Price */}
                        <View style={styles.drinkPriceCell}>
                          <Text style={styles.drinkPrice}>
                            Ksh.{sale.price.toLocaleString('en-KE')}
                          </Text>
                        </View>
                        
                        {/* Column 3: Bottles */}
                        <View style={styles.drinkBottlesCell}>
                          <Text style={styles.drinkBottles}>
                            {sale.bottles_sold}
                          </Text>
                          <Text style={styles.drinkBottlesLabel}>bottles</Text>
                        </View>
                        
                        {/* Column 4: Total */}
                        <View style={styles.drinkTotalCell}>
                          <Text style={styles.drinkTotal}>
                            Ksh.{totalAmount.toLocaleString('en-KE')}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            ) : null}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSearchModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchBarText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  searchBarPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: '#999',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A80F0',
    marginHorizontal: 20,
    marginBottom: 10,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 3,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#4A80F0',
  },
  toggleButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  cleanupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4444',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
  },
  cleanupButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
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
    position: 'relative',
  },
  dayCardOld: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF4444',
  },
  deleteDayButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
    zIndex: 10,
  },
  deleteDayText: {
    fontSize: 11,
    color: '#FF4444',
    fontWeight: '500',
  },
  dayHeader: {
    padding: 12,
    paddingRight: 90,
  },
  dayInfo: {
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  dayDate: {
    fontSize: 11,
    color: '#999',
  },
  oldBadge: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  oldBadgeText: {
    fontSize: 9,
    color: '#FF4444',
    fontWeight: '500',
  },
  daySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  daySummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  daySummaryDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 6,
  },
  daySummaryLabel: {
    fontSize: 9,
    color: '#999',
    marginBottom: 1,
  },
  daySummaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  daySummaryAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4A80F0',
  },
  expandedContent: {
    padding: 12,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  drinkHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 4,
  },
  drinkHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  drinkHeaderName: {
    flex: 2.2,
    paddingLeft: 4,
  },
  drinkHeaderPrice: {
    flex: 1.2,
    textAlign: 'left',
  },
  drinkHeaderBottles: {
    flex: 1,
    textAlign: 'left',
  },
  drinkHeaderTotal: {
    flex: 1.5,
    textAlign: 'right',
    paddingRight: 4,
  },
  drinksList: {
    marginBottom: 10,
  },
  drinkItemContainer: {
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 6,
  },
  drinkGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  drinkNameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 2.2,
  },
  drinkName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  drinkPriceCell: {
    flex: 1.2,
    alignItems: 'flex-start',
  },
  drinkPrice: {
    fontSize: 11,
    color: '#666',
  },
  drinkBottlesCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  drinkBottles: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A80F0', // Blue for count value
  },
  drinkBottlesLabel: {
    fontSize: 10,
    color: '#999', // Grey for "btls" label
  },
  drinkTotalCell: {
    flex: 1.5,
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  drinkTotal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50', // Green for total values
  },
  gridDeleteButton: {
    marginLeft: 4,
    padding: 4,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    gap: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    padding: 16,
  },
  modalLoading: {
    padding: 30,
    alignItems: 'center',
  },
  modalLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  modalCloseButton: {
    margin: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  searchResultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  searchResultHeader: {
    marginBottom: 16,
  },
  searchResultDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  searchResultSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  searchResultSummaryItem: {
    alignItems: 'center',
  },
  searchResultSummaryLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 3,
  },
  searchResultSummaryValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 1,
  },
  searchResultSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  searchResultHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  searchResultHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  searchResultDrinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
});