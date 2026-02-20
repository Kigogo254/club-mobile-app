import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import DailySalesSummary from "../components/DailySalesSummary";

interface Sale {
  id: number;
  drink_name: string;
  price: string;
  bottles_sold: number;
  total_amount: string;
  sale_date: string;
  created_at: string;
  "buying-price": string;
  drink_id: string;
}

interface DailySummary {
  date: string;
  displayDate: string;
  totalBottles: number;
  totalAmount: number;
  drinks: {
    [key: string]: {
      drink_name: string;
      bottles_sold: number;
      total_amount: number;
      price: number;
    };
  };
}

export default function SalesScreen() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDays, setExpandedDays] = useState<string[]>([]);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .order("sale_date", { ascending: false });

      if (error) throw error;

      if (data) {
        setSales(data);
        processDailySummaries(data);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSales();
  };

  const processDailySummaries = (salesData: Sale[]) => {
    const summaries: { [key: string]: DailySummary } = {};

    salesData.forEach((sale) => {
      const date = new Date(sale.sale_date).toLocaleDateString();
      const displayDate = new Date(sale.sale_date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!summaries[date]) {
        summaries[date] = {
          date,
          displayDate,
          totalBottles: 0,
          totalAmount: 0,
          drinks: {},
        };
      }

      summaries[date].totalBottles += sale.bottles_sold;
      summaries[date].totalAmount += parseFloat(sale.total_amount);

      if (!summaries[date].drinks[sale.drink_name]) {
        summaries[date].drinks[sale.drink_name] = {
          drink_name: sale.drink_name,
          bottles_sold: 0,
          total_amount: 0,
          price: parseFloat(sale.price),
        };
      }

      summaries[date].drinks[sale.drink_name].bottles_sold += sale.bottles_sold;
      summaries[date].drinks[sale.drink_name].total_amount += parseFloat(
        sale.total_amount,
      );
    });

    // Convert to array and sort by date (most recent first)
    const sortedSummaries = Object.values(summaries).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    setDailySummaries(sortedSummaries);
  };

  const toggleDayExpansion = (date: string) => {
    setExpandedDays((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date],
    );
  };

  const generatePDF = async (summary: DailySummary) => {
    try {
      // Helper function to format as KSH with no decimals
      const formatKSH = (amount: number): string => {
        return `KSH ${Math.floor(amount).toLocaleString()}`;
      };

      const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Sales Report - ${summary.displayDate}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              color: #4CAF50;
              text-align: center;
              border-bottom: 2px solid #4CAF50;
              padding-bottom: 10px;
            }
            h2 {
              color: #333;
              margin-top: 20px;
            }
            .summary {
              background-color: #f5f5f5;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .summary-item {
              font-size: 16px;
              margin: 5px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #4CAF50;
              color: white;
              padding: 10px;
              text-align: left;
            }
            td {
              padding: 8px;
              border-bottom: 1px solid #ddd;
            }
            .total-row {
              font-weight: bold;
              background-color: #f0f0f0;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <h1>Sales Report</h1>
          <h2>${summary.displayDate}</h2>
          
          <div class="summary">
            <div class="summary-item"><strong>Total Bottles Sold:</strong> ${summary.totalBottles.toLocaleString()}</div>
            <div class="summary-item"><strong>Total Revenue:</strong> ${formatKSH(summary.totalAmount)}</div>
          </div>

          <h3>Breakdown by Drink</h3>
          <table>
            <thead>
              <tr>
                <th>Drink Name</th>
                <th>Bottles Sold</th>
                <th>Price per Bottle</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${Object.values(summary.drinks)
                .map(
                  (drink) => `
                <tr>
                  <td>${drink.drink_name}</td>
                  <td>${drink.bottles_sold.toLocaleString()}</td>
                  <td>${formatKSH(drink.price)}</td>
                  <td>${formatKSH(drink.total_amount)}</td>
                </tr>
              `,
                )
                .join("")}
              <tr class="total-row">
                <td colspan="3"><strong>Total</strong></td>
                <td><strong>${formatKSH(summary.totalAmount)}</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;

      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Sales Report - ${summary.displayDate}`,
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Success", `PDF saved to: ${uri}`);
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to generate PDF: " + error.message);
    }
  };

  const navigateToSubmitSales = () => {
    router.push("/submit-sales");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Sales</Text>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={navigateToSubmitSales}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.submitButtonText}>Submit Today's Sales</Text>
          </TouchableOpacity>
        </View>

        {dailySummaries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No sales recorded</Text>
          </View>
        ) : (
          dailySummaries.map((summary) => (
            <DailySalesSummary
              key={summary.date}
              summary={summary}
              isExpanded={expandedDays.includes(summary.date)}
              onToggle={() => toggleDayExpansion(summary.date)}
              onDownloadPDF={() => generatePDF(summary)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 5,
    fontSize: 14,
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
