import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
import { supabase } from "../lib/supabase";

interface Defect {
  id: number;
  employee_name: string;
  description: string;
  amount: string;
  date: string;
  operator_id: string;
}

const formatKsh = (amount: string): string => {
  const numAmount = parseFloat(amount);
  return `Ksh ${Math.floor(numAmount).toLocaleString()}`;
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return dateString;
  }
};

export default function DefectsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [defects, setDefects] = useState<Defect[]>([]);

  useEffect(() => {
    fetchDefects();
  }, []);

  const fetchDefects = async () => {
    try {
      const { data, error } = await supabase
        .from("defects")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;

      if (data) {
        setDefects(data);
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
    fetchDefects();
  };

  const getTotalDefectsAmount = () => {
    return defects.reduce((sum, defect) => sum + parseFloat(defect.amount), 0);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFA500" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Defects Report</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="warning" size={40} color="#FFA500" />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Total Defects Value</Text>
            <Text style={styles.summaryAmount}>
              {formatKsh(getTotalDefectsAmount().toString())}
            </Text>
            <Text style={styles.summarySubtitle}>
              {defects.length} recorded defect{defects.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Defects List */}
        {defects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            <Text style={styles.emptyText}>No defects recorded</Text>
            <Text style={styles.emptySubtext}>
              All operations are running smoothly
            </Text>
          </View>
        ) : (
          defects.map((defect) => (
            <View key={defect.id} style={styles.defectCard}>
              <View style={styles.defectHeader}>
                <View style={styles.employeeIcon}>
                  <Ionicons name="person" size={20} color="#FFA500" />
                </View>
                <Text style={styles.employeeName}>{defect.employee_name}</Text>
                <View style={styles.amountBadge}>
                  <Text style={styles.amountText}>
                    {formatKsh(defect.amount)}
                  </Text>
                </View>
              </View>

              <View style={styles.defectBody}>
                <View style={styles.descriptionContainer}>
                  <Ionicons name="chatbubble-outline" size={16} color="#666" />
                  <Text style={styles.descriptionText}>
                    {defect.description}
                  </Text>
                </View>

                <View style={styles.metaContainer}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color="#999" />
                    <Text style={styles.metaText}>
                      {formatDate(defect.date)}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="id-card-outline" size={14} color="#999" />
                    <Text style={styles.metaText}>
                      Operator: {defect.operator_id} *
                    </Text>
                  </View>
                </View>
              </View>
            </View>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#FFA500",
  },
  summaryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFA500",
    marginBottom: 2,
  },
  summarySubtitle: {
    fontSize: 12,
    color: "#999",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4CAF50",
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
  },
  defectCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  defectHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  employeeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  employeeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  amountBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  amountText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFA500",
  },
  defectBody: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
  },
  descriptionContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  descriptionText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    lineHeight: 20,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    color: "#999",
    marginLeft: 4,
  },
});
