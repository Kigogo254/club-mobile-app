import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../lib/supabase";

interface Debt {
  id: number;
  customer_name: string;
  customer_phone: string;
  amount: number;
  sale_date: string;
  operator_id: string;
  status: string;
}

interface GroupedDebtor {
  phone: string;
  name: string;
  totalAmount: number;
  debts: Debt[];
}

const formatKsh = (amount: number): string => {
  return `Ksh ${Math.floor(amount).toLocaleString()}`;
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return dateString;
  }
};

export default function DebtsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [groupedDebtors, setGroupedDebtors] = useState<GroupedDebtor[]>([]);
  const [expandedPhones, setExpandedPhones] = useState<string[]>([]);

  // Payment modal
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<GroupedDebtor | null>(
    null,
  );
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      const { data, error } = await supabase
        .from("debts")
        .select("*")
        .eq("status", "pending")
        .order("sale_date", { ascending: false });

      if (error) throw error;

      if (data) {
        setDebts(data);
        groupDebtsByPhone(data);
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
    fetchDebts();
  };

  const groupDebtsByPhone = (debtsData: Debt[]) => {
    const grouped = debtsData.reduce(
      (acc: { [key: string]: GroupedDebtor }, debt) => {
        if (!acc[debt.customer_phone]) {
          acc[debt.customer_phone] = {
            phone: debt.customer_phone,
            name: debt.customer_name,
            totalAmount: 0,
            debts: [],
          };
        }
        acc[debt.customer_phone].debts.push(debt);
        acc[debt.customer_phone].totalAmount += debt.amount;
        return acc;
      },
      {},
    );

    const sorted = Object.values(grouped).sort(
      (a, b) => b.totalAmount - a.totalAmount,
    );
    setGroupedDebtors(sorted);
  };

  const toggleExpand = (phone: string) => {
    setExpandedPhones((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone],
    );
  };

  const handleDeleteDebt = (debt: Debt) => {
    Alert.alert(
      "Delete Debt",
      `Are you sure you want to delete this debt of ${formatKsh(debt.amount)} from ${debt.customer_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => confirmDeleteDebt(debt),
        },
      ],
    );
  };

  const confirmDeleteDebt = async (debt: Debt) => {
    try {
      const { error } = await supabase.from("debts").delete().eq("id", debt.id);

      if (error) throw error;

      Alert.alert("Success", "Debt deleted successfully");
      fetchDebts();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handlePayPartial = (debtor: GroupedDebtor, debt?: Debt) => {
    setSelectedDebtor(debtor);
    setSelectedDebt(debt || null);
    setPaymentAmount("");
    setPaymentModalVisible(true);
  };

  const processPayment = async () => {
    if (!selectedDebtor) return;

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (selectedDebt && amount > selectedDebt.amount) {
      Alert.alert(
        "Error",
        `Payment amount cannot exceed ${formatKsh(selectedDebt.amount)}`,
      );
      return;
    }

    if (!selectedDebt && amount > selectedDebtor.totalAmount) {
      Alert.alert(
        "Error",
        `Payment amount cannot exceed total outstanding ${formatKsh(selectedDebtor.totalAmount)}`,
      );
      return;
    }

    setProcessingPayment(true);

    try {
      if (selectedDebt) {
        // Pay specific debt
        const remainingAmount = selectedDebt.amount - amount;

        if (remainingAmount <= 0) {
          // Delete the debt if fully paid
          const { error } = await supabase
            .from("debts")
            .delete()
            .eq("id", selectedDebt.id);

          if (error) throw error;
        } else {
          // Update the debt amount
          const { error } = await supabase
            .from("debts")
            .update({ amount: remainingAmount })
            .eq("id", selectedDebt.id);

          if (error) throw error;
        }
      } else {
        // Pay across all debts for this customer
        let remainingToPay = amount;

        for (const debt of selectedDebtor.debts.sort(
          (a, b) => a.amount - b.amount,
        )) {
          if (remainingToPay <= 0) break;

          if (debt.amount <= remainingToPay) {
            // Delete fully paid debt
            const { error } = await supabase
              .from("debts")
              .delete()
              .eq("id", debt.id);

            if (error) throw error;
            remainingToPay -= debt.amount;
          } else {
            // Update partially paid debt
            const newAmount = debt.amount - remainingToPay;
            const { error } = await supabase
              .from("debts")
              .update({ amount: newAmount })
              .eq("id", debt.id);

            if (error) throw error;
            remainingToPay = 0;
          }
        }
      }

      Alert.alert("Success", "Payment recorded successfully");
      setPaymentModalVisible(false);
      fetchDebts();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setProcessingPayment(false);
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Debtors Management</Text>
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
          <Text style={styles.summaryTitle}>Total Outstanding</Text>
          <Text style={styles.summaryAmount}>
            {formatKsh(
              groupedDebtors.reduce((sum, d) => sum + d.totalAmount, 0),
            )}
          </Text>
          <Text style={styles.summarySubtitle}>
            {groupedDebtors.length} active debtors
          </Text>
        </View>

        {/* Debtors List */}
        {groupedDebtors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No outstanding debts</Text>
            <Text style={styles.emptySubtext}>All debts have been cleared</Text>
          </View>
        ) : (
          groupedDebtors.map((debtor) => (
            <View key={debtor.phone} style={styles.debtorCard}>
              {/* Debtor Header */}
              <TouchableOpacity
                style={styles.debtorHeader}
                onPress={() => toggleExpand(debtor.phone)}
              >
                <View style={styles.debtorInfo}>
                  <View style={styles.debtorIcon}>
                    <Ionicons name="person" size={24} color="#FF4444" />
                  </View>
                  <View>
                    <Text style={styles.debtorName}>{debtor.name}</Text>
                    <Text style={styles.debtorPhone}>{debtor.phone}</Text>
                  </View>
                </View>
                <View style={styles.debtorActions}>
                  <Text style={styles.debtorTotal}>
                    {formatKsh(debtor.totalAmount)}
                  </Text>
                  <Ionicons
                    name={
                      expandedPhones.includes(debtor.phone)
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={24}
                    color="#666"
                  />
                </View>
              </TouchableOpacity>

              {/* Expanded Debts */}
              {expandedPhones.includes(debtor.phone) && (
                <View style={styles.debtsContainer}>
                  {debtor.debts.map((debt) => (
                    <View key={debt.id} style={styles.debtItem}>
                      <View style={styles.debtDetails}>
                        <Text style={styles.debtDate}>
                          {formatDate(debt.sale_date)}
                        </Text>
                        <Text style={styles.debtAmount}>
                          {formatKsh(debt.amount)}
                        </Text>
                      </View>
                      <View style={styles.debtItemActions}>
                        <TouchableOpacity
                          style={[styles.debtActionButton, styles.payButton]}
                          onPress={() => handlePayPartial(debtor, debt)}
                        >
                          <Ionicons name="cash" size={16} color="#fff" />
                          <Text style={styles.payButtonText}>Pay</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.debtActionButton, styles.deleteButton]}
                          onPress={() => handleDeleteDebt(debt)}
                        >
                          <Ionicons name="trash" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  {/* Pay All Button */}
                  <TouchableOpacity
                    style={styles.payAllButton}
                    onPress={() => handlePayPartial(debtor)}
                  >
                    <Ionicons name="cash-outline" size={20} color="#4CAF50" />
                    <Text style={styles.payAllText}>Make Payment</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={paymentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Make Payment</Text>

            {selectedDebtor && (
              <>
                <Text style={styles.modalSubtitle}>
                  Customer: {selectedDebtor.name}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Phone: {selectedDebtor.phone}
                </Text>
                {selectedDebt ? (
                  <Text style={styles.modalSubtitle}>
                    Debt Amount: {formatKsh(selectedDebt.amount)}
                  </Text>
                ) : (
                  <Text style={styles.modalSubtitle}>
                    Total Outstanding: {formatKsh(selectedDebtor.totalAmount)}
                  </Text>
                )}

                <TextInput
                  style={styles.paymentInput}
                  placeholder="Enter payment amount"
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  keyboardType="numeric"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalCancelButton]}
                    onPress={() => setPaymentModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalConfirmButton]}
                    onPress={processPayment}
                    disabled={processingPayment}
                  >
                    {processingPayment ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.modalConfirmText}>
                        Record Payment
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
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
    backgroundColor: "#FF4444",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
    marginBottom: 5,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  summarySubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 5,
  },
  debtorCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  debtorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  debtorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  debtorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  debtorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  debtorPhone: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  debtorActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  debtorTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF4444",
    marginRight: 10,
  },
  debtsContainer: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  debtItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  debtDetails: {
    flex: 1,
  },
  debtDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  debtAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF4444",
  },
  debtItemActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  debtActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  payButton: {
    backgroundColor: "#4CAF50",
  },
  payButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: "#FF4444",
  },
  payAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  payAllText: {
    color: "#4CAF50",
    fontWeight: "600",
    marginLeft: 8,
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  paymentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    marginVertical: 15,
    backgroundColor: "#f9f9f9",
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalCancelButton: {
    backgroundColor: "#f0f0f0",
  },
  modalCancelText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 16,
  },
  modalConfirmButton: {
    backgroundColor: "#4CAF50",
  },
  modalConfirmText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
