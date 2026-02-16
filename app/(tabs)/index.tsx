import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ShoppingBag,
  Users,
  CurrencyDollar,
  ChartLine,
  Plus,
  BeerBottle,
  SignOut,
  Coins,
} from 'phosphor-react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import DrinkCard from '../components/drink-card';
import { Drink, StockSummary } from '@/types/drink';

export default function DashboardScreen() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<StockSummary>({
    totalStockValue: 0,
    totalDrinks: 0,
    potentialRevenue: 0,
    estimatedProfit: 0,
  });

  const fetchDrinks = async () => {
    try {
      const { data, error } = await supabase
        .from('drinks')
        .select('*')
        .order('name');

      if (error) throw error;

      setDrinks(data || []);
      calculateSummary(data || []);
    } catch (error) {
      console.error('Error fetching drinks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateSummary = (drinksData: Drink[]) => {
    // Total Stock Value = sum of (count_in_stock × buying-price)
    const totalStockValue = drinksData.reduce((sum, drink) => 
      sum + (drink.count_in_stock * drink["buying-price"]), 0
    );
    
    const totalDrinks = drinksData.length;
    
    // Potential Sales = sum of (count_in_stock × price) [selling price]
    const potentialSales = drinksData.reduce((sum, drink) => 
      sum + (drink.count_in_stock * drink.price), 0
    );
    
    // Estimated Profit = Potential Sales - Total Stock Value
    const estimatedProfit = potentialSales - totalStockValue;

    setSummary({
      totalStockValue,
      totalDrinks,
      potentialRevenue: potentialSales,
      estimatedProfit,
    });
  };

  useFocusEffect(
    useCallback(() => {
      fetchDrinks();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDrinks();
  };

  const handleLogout = () => {
    router.replace('/pin-screen');
  };

  const handleAddDrink = () => {
    router.push('/new-drink');
  };

  const handleDrinkPress = (drink: Drink) => {
    router.push({
      pathname: '/drink-details',
      params: { id: drink.id }
    });
  };

const formatCurrency = (amount: number) => {
  return `Ksh. ${amount.toLocaleString('en-KE')}`;
};


  const stats = [
    { 
      title: 'Stock Cost ', 
      value: formatCurrency(summary.totalStockValue), 
      icon: ShoppingBag, 
      color: '#4A80F0',
      description: 'As per the the buying price',
      onPress: () => router.push('/stock')
    },
    { 
      title: 'Types of Drinks', 
      value: summary.totalDrinks.toString(), 
      icon: Users, 
      color: '#34C759',
      description: 'Available types',
      onPress: undefined
    },
    { 
      title: 'Potential Sales', 
      value: formatCurrency(summary.potentialRevenue), 
      icon: CurrencyDollar, 
      color: '#FF9500',
      description: 'Value at selling price',
      onPress: () => router.push('/sales')
    },
    { 
      title: 'Estimated Profit', 
      value: formatCurrency(summary.estimatedProfit), 
      icon: ChartLine, 
      color: summary.estimatedProfit >= 0 ? '#4CAF50' : '#FF4444',
      description: 'Potential sales - cost',
      onPress: () => router.push('/profit')
    },
  ];

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
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>Admin</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <SignOut size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.statCard, !stat.onPress && styles.statCardNonClickable]}
              onPress={stat.onPress}
              disabled={!stat.onPress}
              activeOpacity={stat.onPress ? 0.7 : 1}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${stat.color}20` }]}>
                <stat.icon size={24} color={stat.color} weight="duotone" />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
              <Text style={styles.statDescription}>{stat.description}</Text>
              {stat.onPress && (
                <View style={styles.clickableIndicator}>
                  <Text style={styles.clickableText}>Tap to view →</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.drinksHeader}>
          <Text style={styles.sectionTitle}>Drinks Inventory</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddDrink}>
            <Plus size={20} color="#fff" weight="bold" />
            <Text style={styles.addButtonText}>New Drink</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.drinksList}>
          {drinks.length === 0 ? (
            <View style={styles.emptyState}>
              <BeerBottle size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No drinks found</Text>
              <Text style={styles.emptyStateSubtext}>Tap the button above to add your first drink</Text>
            </View>
          ) : (
            drinks.map((drink) => (
              <DrinkCard 
                key={drink.id} 
                drink={drink} 
                onPress={() => handleDrinkPress(drink)}
              />
            ))
          )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardNonClickable: {
    opacity: 0.8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '600',
  },
  statDescription: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  clickableIndicator: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 6,
  },
  clickableText: {
    fontSize: 10,
    color: '#4A80F0',
    textAlign: 'right',
  },
  drinksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A80F0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  drinksList: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 10,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
    textAlign: 'center',
  },
});