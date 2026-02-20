import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../lib/supabase";

interface CashEntry {
  id: number;
  amount: number;
  date: string;
  type: string;
  operator_id: string;
}

interface TillEntry {
  id: number;
  amount: number;
  date: string;
  operator_id: string;
}

interface DebtEntry {
  id: number;
  customer_name: string;
  customer_phone: string;
  amount: number;
  sale_date: string;
  operator_id: string;
  status: string;
}

interface DailySummary {
  date: string;
  displayDate: string;
  cash: number;
  till: number;
  debts: number;
  total: number;
}

const formatKsh = (amount: number): string => {
  return `Ksh ${Math.floor(amount).toLocaleString()}`;
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return dateString;
  }
};

const formatDateForDisplay = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return dateString;
  }
};

const parseDateString = (dateStr: string): Date => {
  // Handle different date formats
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    // Format: MM/DD/YYYY or DD/MM/YYYY
    const month = parseInt(parts[0], 10) - 1;
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }

  // Try direct parsing
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // Default to current date if all else fails
  return new Date();
};

export default function StatementScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Summary data
  const [sevenDayCash, setSevenDayCash] = useState(0);
  const [sevenDayTill, setSevenDayTill] = useState(0);
  const [sevenDayDebts, setSevenDayDebts] = useState(0);

  // Daily data
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);

  // Modal states
  const [selectedDay, setSelectedDay] = useState<DailySummary | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [dayDetails, setDayDetails] = useState<{
    cash: CashEntry[];
    till: TillEntry[];
    debts: DebtEntry[];
  }>({ cash: [], till: [], debts: [] });

  // Date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await fetchSevenDaySummaries();
      await fetchDailySummaries();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const fetchSevenDaySummaries = async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString();

    // Fetch cash total for last 7 days
    const { data: cashData, error: cashError } = await supabase
      .from("cash")
      .select("amount")
      .gte("date", sevenDaysAgoStr);

    if (cashError) throw cashError;
    const cashTotal =
      cashData?.reduce((sum, item) => sum + item.amount, 0) || 0;
    setSevenDayCash(cashTotal);

    // Fetch till total for last 7 days
    const { data: tillData, error: tillError } = await supabase
      .from("till")
      .select("amount")
      .gte("date", sevenDaysAgoStr);

    if (tillError) throw tillError;
    const tillTotal =
      tillData?.reduce((sum, item) => sum + item.amount, 0) || 0;
    setSevenDayTill(tillTotal);

    // Fetch debts total for last 7 days
    const { data: debtsData, error: debtsError } = await supabase
      .from("debts")
      .select("amount")
      .gte("sale_date", sevenDaysAgoStr);

    if (debtsError) throw debtsError;
    const debtsTotal =
      debtsData?.reduce((sum, item) => sum + item.amount, 0) || 0;
    setSevenDayDebts(debtsTotal);
  };

  const fetchDailySummaries = async () => {
    // Get unique dates from all tables
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    // Fetch all cash entries
    const { data: cashData, error: cashError } = await supabase
      .from("cash")
      .select("*")
      .gte("date", thirtyDaysAgoStr)
      .order("date", { ascending: false });

    if (cashError) throw cashError;

    // Fetch all till entries
    const { data: tillData, error: tillError } = await supabase
      .from("till")
      .select("*")
      .gte("date", thirtyDaysAgoStr)
      .order("date", { ascending: false });

    if (tillError) throw tillError;

    // Fetch all debts
    const { data: debtsData, error: debtsError } = await supabase
      .from("debts")
      .select("*")
      .gte("sale_date", thirtyDaysAgoStr)
      .order("sale_date", { ascending: false });

    if (debtsError) throw debtsError;

    // Group by date
    const summariesMap = new Map<string, DailySummary>();

    // Process cash
    cashData?.forEach((item) => {
      try {
        const date = new Date(item.date).toLocaleDateString();
        if (!summariesMap.has(date)) {
          summariesMap.set(date, {
            date,
            displayDate: formatDateForDisplay(item.date),
            cash: 0,
            till: 0,
            debts: 0,
            total: 0,
          });
        }
        const summary = summariesMap.get(date)!;
        summary.cash += item.amount;
        summary.total += item.amount;
      } catch (error) {
        console.log("Error processing cash item:", error);
      }
    });

    // Process till
    tillData?.forEach((item) => {
      try {
        const date = new Date(item.date).toLocaleDateString();
        if (!summariesMap.has(date)) {
          summariesMap.set(date, {
            date,
            displayDate: formatDateForDisplay(item.date),
            cash: 0,
            till: 0,
            debts: 0,
            total: 0,
          });
        }
        const summary = summariesMap.get(date)!;
        summary.till += item.amount;
        summary.total += item.amount;
      } catch (error) {
        console.log("Error processing till item:", error);
      }
    });

    // Process debts
    debtsData?.forEach((item) => {
      try {
        const date = new Date(item.sale_date).toLocaleDateString();
        if (!summariesMap.has(date)) {
          summariesMap.set(date, {
            date,
            displayDate: formatDateForDisplay(item.sale_date),
            cash: 0,
            till: 0,
            debts: 0,
            total: 0,
          });
        }
        const summary = summariesMap.get(date)!;
        summary.debts += item.amount;
        summary.total += item.amount;
      } catch (error) {
        console.log("Error processing debt item:", error);
      }
    });

    // Convert to array and sort by date (most recent first)
    const sortedSummaries = Array.from(summariesMap.values()).sort((a, b) => {
      try {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } catch (error) {
        return 0;
      }
    });

    setDailySummaries(sortedSummaries);
  };

  const fetchDayDetails = async (date: string, summary: DailySummary) => {
    try {
      setLoadingDetails(true);
      setSelectedDay(summary);

      // Parse the date string safely
      const selectedDate = parseDateString(date);

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const startStr = startOfDay.toISOString();
      const endStr = endOfDay.toISOString();

      // Fetch cash for this day
      const { data: cashData } = await supabase
        .from("cash")
        .select("*")
        .gte("date", startStr)
        .lte("date", endStr);

      // Fetch till for this day
      const { data: tillData } = await supabase
        .from("till")
        .select("*")
        .gte("date", startStr)
        .lte("date", endStr);

      // Fetch debts for this day
      const { data: debtsData } = await supabase
        .from("debts")
        .select("*")
        .gte("sale_date", startStr)
        .lte("sale_date", endStr);

      setDayDetails({
        cash: cashData || [],
        till: tillData || [],
        debts: debtsData || [],
      });

      setModalVisible(true);
    } catch (error: any) {
      Alert.alert("Error", "Failed to load day details: " + error.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const generateFullStatementPDF = async () => {
    try {
      if (dailySummaries.length === 0) {
        Alert.alert("No Data", "No transactions to generate PDF");
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Full Payment Statement</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; }
              h1 { color: #4CAF50; text-align: center; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
              h2 { color: #333; margin-top: 20px; text-align: center; }
              .summary { background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
              .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
              .summary-item { font-size: 16px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #4CAF50; color: white; padding: 12px; text-align: left; }
              td { padding: 10px; border-bottom: 1px solid #ddd; }
              .cash { color: #4CAF50; font-weight: bold; }
              .till { color: #2196F3; font-weight: bold; }
              .debt { color: #FF4444; font-weight: bold; }
              .total-row { font-weight: bold; background-color: #f0f0f0; }
              .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
              .stats { display: flex; justify-content: space-around; margin: 20px 0; }
              .stat-box { background: #f8f8f8; padding: 15px; border-radius: 8px; text-align: center; flex: 1; margin: 0 5px; }
              .stat-label { font-size: 14px; color: #666; }
              .stat-value { font-size: 20px; font-weight: bold; margin-top: 5px; }
            </style>
          </head>
          <body>
            <h1>Full Payment Statement</h1>
            <h2>${new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</h2>
            
            <div class="stats">
              <div class="stat-box">
                <div class="stat-label">Total Cash (7 days)</div>
                <div class="stat-value" style="color: #4CAF50">${formatKsh(sevenDayCash)}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Total Till (7 days)</div>
                <div class="stat-value" style="color: #2196F3">${formatKsh(sevenDayTill)}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Total Debts (7 days)</div>
                <div class="stat-value" style="color: #FF4444">${formatKsh(sevenDayDebts)}</div>
              </div>
            </div>

            <h3>All Transactions (Last 30 Days)</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Cash in Hand</th>
                  <th>Cash in Till</th>
                  <th>Debts</th>
                  <th>Daily Total</th>
                </tr>
              </thead>
              <tbody>
                ${dailySummaries
                  .map(
                    (summary) => `
                  <tr>
                    <td>${summary.displayDate}</td>
                    <td class="cash">${formatKsh(summary.cash)}</td>
                    <td class="till">${formatKsh(summary.till)}</td>
                    <td class="debt">${formatKsh(summary.debts)}</td>
                    <td><strong>${formatKsh(summary.total)}</strong></td>
                  </tr>
                `,
                  )
                  .join("")}
                <tr class="total-row">
                  <td><strong>TOTAL</strong></td>
                  <td><strong class="cash">${formatKsh(dailySummaries.reduce((sum, d) => sum + d.cash, 0))}</strong></td>
                  <td><strong class="till">${formatKsh(dailySummaries.reduce((sum, d) => sum + d.till, 0))}</strong></td>
                  <td><strong class="debt">${formatKsh(dailySummaries.reduce((sum, d) => sum + d.debts, 0))}</strong></td>
                  <td><strong>${formatKsh(dailySummaries.reduce((sum, d) => sum + d.total, 0))}</strong></td>
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
          dialogTitle: "Full Payment Statement",
          UTI: "com.adobe.pdf",
        });
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to generate PDF: " + error.message);
    }
  };

  const generateDailyPDF = async (
    summary: DailySummary,
    details: typeof dayDetails,
  ) => {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Payment Statement - ${summary.displayDate}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
              h1 { color: #4CAF50; text-align: center; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
              h2 { color: #333; margin-top: 20px; }
              .summary { background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
              .summary-item { font-size: 16px; margin: 5px 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #4CAF50; color: white; padding: 10px; text-align: left; }
              td { padding: 8px; border-bottom: 1px solid #ddd; }
              .total-row { font-weight: bold; background-color: #f0f0f0; }
              .cash { color: #4CAF50; }
              .till { color: #2196F3; }
              .debt { color: #FF4444; }
              .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <h1>Payment Statement</h1>
            <h2>${summary.displayDate}</h2>
            
            <div class="summary">
              <div class="summary-item"><strong>Total Cash in Hand:</strong> ${formatKsh(summary.cash)}</div>
              <div class="summary-item"><strong>Total Cash in Till:</strong> ${formatKsh(summary.till)}</div>
              <div class="summary-item"><strong>Total Debts:</strong> ${formatKsh(summary.debts)}</div>
              <div class="summary-item" style="border-top: 2px solid #4CAF50; margin-top: 10px; padding-top: 10px;">
                <strong>Grand Total:</strong> ${formatKsh(summary.total)}
              </div>
            </div>

            ${
              details.cash.length > 0
                ? `
              <h3>Cash in Hand Details</h3>
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Amount</th>
                    <th>Operator</th>
                  </tr>
                </thead>
                <tbody>
                  ${details.cash
                    .map(
                      (item) => `
                    <tr>
                      <td>${new Date(item.date).toLocaleTimeString()}</td>
                      <td class="cash">${formatKsh(item.amount)}</td>
                      <td>${item.operator_id}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            `
                : ""
            }

            ${
              details.till.length > 0
                ? `
              <h3>Cash in Till Details</h3>
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Amount</th>
                    <th>Operator</th>
                  </tr>
                </thead>
                <tbody>
                  ${details.till
                    .map(
                      (item) => `
                    <tr>
                      <td>${new Date(item.date).toLocaleTimeString()}</td>
                      <td class="till">${formatKsh(item.amount)}</td>
                      <td>${item.operator_id}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            `
                : ""
            }

            ${
              details.debts.length > 0
                ? `
              <h3>Debts Details</h3>
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Amount</th>
                    <th>Operator</th>
                  </tr>
                </thead>
                <tbody>
                  ${details.debts
                    .map(
                      (item) => `
                    <tr>
                      <td>${item.customer_name}</td>
                      <td>${item.customer_phone}</td>
                      <td class="debt">${formatKsh(item.amount)}</td>
                      <td>${item.operator_id}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            `
                : ""
            }

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
          dialogTitle: `Payment Statement - ${summary.displayDate}`,
          UTI: "com.adobe.pdf",
        });
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to generate PDF: " + error.message);
    }
  };

  const deleteOldTransactions = () => {
    Alert.alert(
      "Delete Old Transactions",
      "⚠️ IMPORTANT: Make sure you have downloaded the PDF records before deleting.\n\nThis will permanently delete all transactions older than 30 days from cash, till, and debts tables.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: confirmDeleteOldTransactions,
        },
      ],
      { cancelable: false },
    );
  };

  const confirmDeleteOldTransactions = async () => {
    setDeleting(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

      // Delete old cash entries
      const { error: cashError } = await supabase
        .from("cash")
        .delete()
        .lt("date", thirtyDaysAgoStr);

      if (cashError) throw cashError;

      // Delete old till entries
      const { error: tillError } = await supabase
        .from("till")
        .delete()
        .lt("date", thirtyDaysAgoStr);

      if (tillError) throw tillError;

      // Delete old debts
      const { error: debtsError } = await supabase
        .from("debts")
        .delete()
        .lt("sale_date", thirtyDaysAgoStr);

      if (debtsError) throw debtsError;

      Alert.alert("Success", "Old transactions deleted successfully");

      // Refresh data
      await fetchData();
    } catch (error: any) {
      Alert.alert("Error", "Failed to delete transactions: " + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const searchByDate = async () => {
    setShowDatePicker(false);
    const dateStr = selectedDate.toLocaleDateString();

    // Find summary for selected date
    const summary = dailySummaries.find((s) => s.date === dateStr);

    if (summary) {
      await fetchDayDetails(dateStr, summary);
    } else {
      Alert.alert("No Data", "No transactions found for this date");
    }
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Payment Statement</Text>
        </View>

        {/* 7-Day Summary Cards */}
        <View style={styles.cardsContainer}>
          <View style={styles.card}>
            <View style={[styles.cardIcon, { backgroundColor: "#E8F5E9" }]}>
              <Ionicons name="cash" size={32} color="#4CAF50" />
            </View>
            <Text style={styles.cardLabel}>Cash in Hand (7d)</Text>
            <Text style={styles.cardValue}>{formatKsh(sevenDayCash)}</Text>
          </View>

          <View style={styles.card}>
            <View style={[styles.cardIcon, { backgroundColor: "#E3F2FD" }]}>
              <Ionicons name="business" size={32} color="#2196F3" />
            </View>
            <Text style={styles.cardLabel}>Cash in Till (7d)</Text>
            <Text style={styles.cardValue}>{formatKsh(sevenDayTill)}</Text>
          </View>

          <View style={styles.card}>
            <View style={[styles.cardIcon, { backgroundColor: "#FFEBEE" }]}>
              <Ionicons name="people" size={32} color="#FF4444" />
            </View>
            <Text style={styles.cardLabel}>Debts (7d)</Text>
            <Text style={styles.cardValue}>{formatKsh(sevenDayDebts)}</Text>
          </View>
        </View>

        {/* Date Picker Button - Moved below cards */}
        <View style={styles.datePickerContainer}>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={24} color="#4CAF50" />
            <Text style={styles.datePickerText}>Search by Date</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.fullStatementButton}
            onPress={generateFullStatementPDF}
          >
            <Ionicons name="document-text" size={24} color="#fff" />
            <Text style={styles.fullStatementButtonText}>
              Download Full Statement
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={deleteOldTransactions}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="trash" size={24} color="#fff" />
                <Text style={styles.deleteButtonText}>Delete Old (30d+)</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Daily Transactions */}
        <Text style={styles.sectionTitle}>Daily Transactions</Text>

        {dailySummaries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        ) : (
          dailySummaries.map((summary) => (
            <TouchableOpacity
              key={summary.date}
              style={styles.dailyCard}
              onPress={() => fetchDayDetails(summary.date, summary)}
            >
              <View style={styles.dailyHeader}>
                <Text style={styles.dailyDate}>{summary.displayDate}</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>

              <View style={styles.dailyStats}>
                <View style={styles.dailyStat}>
                  <Text style={styles.dailyStatLabel}>Cash</Text>
                  <Text style={[styles.dailyStatValue, { color: "#4CAF50" }]}>
                    {formatKsh(summary.cash)}
                  </Text>
                </View>
                <View style={styles.dailyStat}>
                  <Text style={styles.dailyStatLabel}>Till</Text>
                  <Text style={[styles.dailyStatValue, { color: "#2196F3" }]}>
                    {formatKsh(summary.till)}
                  </Text>
                </View>
                <View style={styles.dailyStat}>
                  <Text style={styles.dailyStatLabel}>Debts</Text>
                  <Text style={[styles.dailyStatValue, { color: "#FF4444" }]}>
                    {formatKsh(summary.debts)}
                  </Text>
                </View>
              </View>

              <View style={styles.dailyTotal}>
                <Text style={styles.dailyTotalLabel}>Total</Text>
                <Text style={styles.dailyTotalValue}>
                  {formatKsh(summary.total)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Date</Text>

              {Platform.OS === "ios" ? (
                <>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="spinner"
                    onChange={(event, date) => date && setSelectedDate(date)}
                    style={styles.datePicker}
                  />
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalCancelButton]}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalConfirmButton]}
                      onPress={searchByDate}
                    >
                      <Text style={styles.modalConfirmText}>OK</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      setSelectedDate(date);
                      searchByDate();
                    }
                  }}
                />
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Day Details Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDay?.displayDate || "Loading..."}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {loadingDetails ? (
              <View style={styles.loadingDetails}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Loading details...</Text>
              </View>
            ) : (
              <>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Summary */}
                  <View style={styles.detailSummary}>
                    <Text style={styles.detailSummaryItem}>
                      Cash in Hand:{" "}
                      <Text style={{ color: "#4CAF50" }}>
                        {formatKsh(selectedDay?.cash || 0)}
                      </Text>
                    </Text>
                    <Text style={styles.detailSummaryItem}>
                      Cash in Till:{" "}
                      <Text style={{ color: "#2196F3" }}>
                        {formatKsh(selectedDay?.till || 0)}
                      </Text>
                    </Text>
                    <Text style={styles.detailSummaryItem}>
                      Debts:{" "}
                      <Text style={{ color: "#FF4444" }}>
                        {formatKsh(selectedDay?.debts || 0)}
                      </Text>
                    </Text>
                    <View style={styles.detailTotal}>
                      <Text style={styles.detailTotalLabel}>Total:</Text>
                      <Text style={styles.detailTotalValue}>
                        {formatKsh(selectedDay?.total || 0)}
                      </Text>
                    </View>
                  </View>

                  {/* Cash Details */}
                  {dayDetails.cash.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>
                        Cash in Hand
                      </Text>
                      {dayDetails.cash.map((item, index) => (
                        <View key={index} style={styles.detailItem}>
                          <View>
                            <Text style={styles.detailItemTime}>
                              {new Date(item.date).toLocaleTimeString()}
                            </Text>
                            <Text style={styles.detailItemOperator}>
                              Operator: {item.operator_id}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.detailItemAmount,
                              { color: "#4CAF50" },
                            ]}
                          >
                            {formatKsh(item.amount)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Till Details */}
                  {dayDetails.till.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>
                        Cash in Till
                      </Text>
                      {dayDetails.till.map((item, index) => (
                        <View key={index} style={styles.detailItem}>
                          <View>
                            <Text style={styles.detailItemTime}>
                              {new Date(item.date).toLocaleTimeString()}
                            </Text>
                            <Text style={styles.detailItemOperator}>
                              Operator: {item.operator_id}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.detailItemAmount,
                              { color: "#2196F3" },
                            ]}
                          >
                            {formatKsh(item.amount)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Debt Details */}
                  {dayDetails.debts.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Debts</Text>
                      {dayDetails.debts.map((item, index) => (
                        <View key={index} style={styles.detailItem}>
                          <View>
                            <Text style={styles.detailItemTitle}>
                              {item.customer_name}
                            </Text>
                            <Text style={styles.detailItemSubtitle}>
                              {item.customer_phone}
                            </Text>
                            <Text style={styles.detailItemOperator}>
                              Operator: {item.operator_id}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.detailItemAmount,
                              { color: "#FF4444" },
                            ]}
                          >
                            {formatKsh(item.amount)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </ScrollView>

                {/* PDF Button */}
                <TouchableOpacity
                  style={styles.pdfButton}
                  onPress={() =>
                    selectedDay && generateDailyPDF(selectedDay, dayDetails)
                  }
                >
                  <Ionicons name="document-text" size={24} color="#fff" />
                  <Text style={styles.pdfButtonText}>Download PDF Report</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  cardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 5,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  datePickerContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  datePickerText: {
    color: "#4CAF50",
    marginLeft: 8,
    fontWeight: "600",
    fontSize: 16,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  fullStatementButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fullStatementButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 14,
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF4444",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  dailyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dailyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dailyDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  dailyStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dailyStat: {
    flex: 1,
    alignItems: "center",
  },
  dailyStatLabel: {
    fontSize: 11,
    color: "#666",
    marginBottom: 2,
  },
  dailyStatValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  dailyTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  dailyTotalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  dailyTotalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  datePicker: {
    height: 200,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  modalCancelButton: {
    backgroundColor: "#f0f0f0",
  },
  modalCancelText: {
    color: "#666",
    fontWeight: "600",
  },
  modalConfirmButton: {
    backgroundColor: "#4CAF50",
  },
  modalConfirmText: {
    color: "#fff",
    fontWeight: "600",
  },
  loadingDetails: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  detailSummary: {
    backgroundColor: "#f8f8f8",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  detailSummaryItem: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  detailTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#4CAF50",
  },
  detailTotalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  detailTotalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  detailItemTime: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
  },
  detailItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  detailItemSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  detailItemOperator: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  detailItemAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  pdfButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  pdfButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
});
