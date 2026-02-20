import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface DrinkDetail {
  drink_name: string;
  bottles_sold: number;
  total_amount: number;
  price: number;
}

interface DailySummary {
  date: string;
  displayDate: string;
  totalBottles: number;
  totalAmount: number;
  drinks: {
    [key: string]: DrinkDetail;
  };
}

interface Props {
  summary: DailySummary;
  isExpanded: boolean;
  onToggle: () => void;
  onDownloadPDF: () => void;
}

// Helper function to format currency in Ksh - NO DECIMALS
const formatKsh = (amount: number): string => {
  return `Ksh ${Math.floor(amount).toLocaleString()}`;
};

export default function DailySalesSummary({
  summary,
  isExpanded,
  onToggle,
  onDownloadPDF,
}: Props) {
  const drinkList = Object.values(summary.drinks);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.summaryCard}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.summaryHeader}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar" size={20} color="#4CAF50" />
            <Text style={styles.dateText}>{summary.displayDate}</Text>
          </View>
          <View style={styles.expandIcon}>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              color="#666"
            />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Bottles</Text>
            <Text style={styles.statValue}>{summary.totalBottles}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Revenue</Text>
            <Text style={styles.statValue}>
              {formatKsh(summary.totalAmount)}
            </Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.drinksHeader}>
              <Text style={styles.drinksTitle}>Drink Breakdown</Text>
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={onDownloadPDF}
              >
                <Ionicons name="download" size={18} color="#fff" />
                <Text style={styles.downloadButtonText}>PDF</Text>
              </TouchableOpacity>
            </View>

            {drinkList.map((drink, index) => (
              <View key={index} style={styles.drinkRow}>
                <View style={styles.drinkInfo}>
                  <Text style={styles.drinkName}>{drink.drink_name}</Text>
                  <Text style={styles.drinkPrice}>
                    {formatKsh(drink.price)} each
                  </Text>
                </View>
                <View style={styles.drinkStats}>
                  <Text style={styles.drinkBottles}>
                    {drink.bottles_sold} bottles
                  </Text>
                  <Text style={styles.drinkTotal}>
                    {formatKsh(drink.total_amount)}
                  </Text>
                </View>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatKsh(summary.totalAmount)}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  expandIcon: {
    padding: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#ddd",
  },
  expandedContent: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 15,
  },
  drinksHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  drinksTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  downloadButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  downloadButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  drinkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  drinkInfo: {
    flex: 1,
  },
  drinkName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  drinkPrice: {
    fontSize: 12,
    color: "#666",
  },
  drinkStats: {
    alignItems: "flex-end",
  },
  drinkBottles: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  drinkTotal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: "#4CAF50",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
});
