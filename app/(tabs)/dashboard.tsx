import { BeerBottle } from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

const { width } = Dimensions.get("window");
const cardWidth = (width - 50) / 2; // 20 padding on sides + 10 gap between cards

interface Drink {
  id: number;
  name: string;
  count_in_stock: number;
  price: number;
}

export default function DashboardScreen() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDrinks = async () => {
    try {
      const { data, error } = await supabase
        .from("drinks")
        .select("*")
        .order("name");

      if (error) {
        throw error;
      }

      if (data) {
        setDrinks(data);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDrinks();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchDrinks();
  }, []);

  const getStockColor = (count: number) => {
    if (count < 10) return "#FF4444"; // Red for low stock
    if (count <= 20) return "#333333"; // Black for medium stock
    return "#4CAF50"; // Green for high stock
  };

  const getStockText = (count: number) => {
    return `${count} left`;
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  // Split drinks into rows of 2 for grid layout
  const getDrinkRows = () => {
    const rows = [];
    for (let i = 0; i < drinks.length; i += 2) {
      rows.push(drinks.slice(i, i + 2));
    }
    return rows;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screenContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>Current Stock</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome Back!</Text>
        <Text style={styles.cardContent}>
          This is your current stock. You can view and request for stock and
          make sales etc.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Available Drinks</Text>

      {drinks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <BeerBottle size={50} color="#ccc" />
          <Text style={styles.emptyText}>No drinks available</Text>
        </View>
      ) : (
        <View style={styles.gridContainer}>
          {getDrinkRows().map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((drink) => (
                <View
                  key={drink.id}
                  style={[styles.drinkCard, { width: cardWidth }]}
                >
                  {/* Price Sticker - Top Right */}
                  <View style={styles.priceSticker}>
                    <Text style={styles.priceText}>
                      {formatPrice(drink.price)}
                    </Text>
                  </View>

                  {/* Bottle Icon */}
                  <View style={styles.iconContainer}>
                    <BeerBottle size={48} color="#666" weight="fill" />
                  </View>

                  {/* Drink Name */}
                  <Text style={styles.drinkName} numberOfLines={2}>
                    {drink.name}
                  </Text>

                  {/* Stock Count */}
                  <Text
                    style={[
                      styles.stockCount,
                      { color: getStockColor(drink.count_in_stock) },
                    ]}
                  >
                    {getStockText(drink.count_in_stock)}
                  </Text>

                  {/* Low Stock Warning */}
                  {drink.count_in_stock < 10 && (
                    <View style={styles.lowStockBadge}>
                      <Text style={styles.lowStockText}>Low Stock</Text>
                    </View>
                  )}
                </View>
              ))}

              {/* If row has only one item, add an empty View to maintain grid layout */}
              {row.length === 1 && (
                <View style={[styles.drinkCard, { width: cardWidth }]} />
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    marginTop: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  cardContent: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  gridContainer: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  drinkCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
    position: "relative",
    minHeight: 180,
  },
  priceSticker: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  priceText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  iconContainer: {
    marginTop: 15,
    marginBottom: 10,
  },
  drinkName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  stockCount: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  lowStockBadge: {
    backgroundColor: "#FFE5E5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
  },
  lowStockText: {
    fontSize: 11,
    color: "#FF4444",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 10,
  },
});
