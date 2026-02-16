import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Wine, CurrencyDollar, Cube } from 'phosphor-react-native';
import { Drink } from '@/types/drink';

interface DrinkCardProps {
  drink: Drink;
  onPress?: () => void;
}

export default function DrinkCard({ drink, onPress }: DrinkCardProps) {
  const getBorderColor = () => {
    if (drink.count_in_stock < 10) return '#FF4444';
    if (drink.count_in_stock <= 50) return '#333333';
    return '#4CAF50';
  };

  const getProgressColor = () => {
    if (drink.count_in_stock < 10) return '#FF4444';
    if (drink.count_in_stock <= 50) return '#333333';
    return '#4CAF50';
  };

  const progressPercentage = (drink.count_in_stock / drink.max_stock) * 100;
  const totalValue = drink.count_in_stock * drink.price;

  return (
    <TouchableOpacity 
      style={[styles.card, { borderColor: getBorderColor() }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Wine size={32} color="#4A80F0" weight="duotone" />
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.drinkName}>{drink.name}</Text>
          <Text style={styles.drinkPrice}>Ksh.{drink.price.toLocaleString('en-KE')}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Cube size={16} color="#666" />
          <Text style={styles.statText}>
            In Stock: <Text style={styles.statValue}>{drink.count_in_stock} left "</Text>
          </Text>
        </View>
        <View style={styles.stat}>
          <CurrencyDollar size={16} color="#666" />
          <Text style={styles.statText}>
            Total: <Text style={styles.statValue}>Ksh.{totalValue.toLocaleString('en-KE')} "</Text>
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${Math.min(progressPercentage, 100)}%`,
                backgroundColor: getProgressColor()
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.min(progressPercentage, 100).toFixed(1)}% of max stock'
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nameContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  drinkName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  drinkPrice: {
    fontSize: 14,
    color: '#4A80F0',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontWeight: 'bold',
    color: '#333',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
});