import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

interface Drink {
  id: number;
  name: string;
  price: string;
  buying_price: string;
  count_in_stock: number;
}

interface DrinkSale {
  drink_id: number;
  drink_name: string;
  price: number;
  buying_price: number;
  bottles_sold: number;
  available_stock: number;
}

interface Debt {
  id: string;
  name: string;
  phone: string;
  amount: number;
}

interface Defect {
  id: string;
  employee_name: string;
  description: string;
  amount: number;
}

interface SaleSummary {
  drink_name: string;
  bottles_sold: number;
  total: number;
}

const formatKsh = (amount: number): string => {
  return `Ksh ${Math.floor(amount).toLocaleString()}`;
};

const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

export default function SubmitSalesScreen() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [drinkSales, setDrinkSales] = useState<DrinkSale[]>([]);
  const [operatorId, setOperatorId] = useState("");
  const [operatorValid, setOperatorValid] = useState<boolean | null>(null);
  const [operatorName, setOperatorName] = useState("");
  const [verifyingOperator, setVerifyingOperator] = useState(false);

  // Cash inputs
  const [cashInHand, setCashInHand] = useState("");
  const [cashInTill, setCashInTill] = useState("");

  // Debts
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [newDebt, setNewDebt] = useState<Debt>({
    id: "",
    name: "",
    phone: "",
    amount: 0,
  });

  // Defects/Spoiled
  const [defects, setDefects] = useState<Defect[]>([]);
  const [showDefectForm, setShowDefectForm] = useState(false);
  const [newDefect, setNewDefect] = useState<Defect>({
    id: "",
    employee_name: "",
    description: "",
    amount: 0,
  });

  // Calculations
  const [expectedTotal, setExpectedTotal] = useState(0);
  const [actualTotal, setActualTotal] = useState(0);
  const [balance, setBalance] = useState(0);
  const [totalBottles, setTotalBottles] = useState(0);

  useEffect(() => {
    fetchDrinks();
  }, []);

  useEffect(() => {
    calculateExpectedTotal();
  }, [drinkSales]);

  useEffect(() => {
    calculateActualTotal();
  }, [cashInHand, cashInTill, debts, defects]);

  const fetchDrinks = async () => {
    try {
      const { data, error } = await supabase
        .from("drinks")
        .select("id, name, price, buying-price, count_in_stock")
        .order("name");

      if (error) throw error;

      if (data) {
        const transformedData: Drink[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          buying_price: item["buying-price"],
          count_in_stock: item.count_in_stock,
        }));

        setDrinks(transformedData);

        const initialSales: DrinkSale[] = transformedData.map((drink) => ({
          drink_id: drink.id,
          drink_name: drink.name,
          price: parseFloat(drink.price),
          buying_price: parseFloat(drink.buying_price),
          bottles_sold: 0,
          available_stock: drink.count_in_stock,
        }));
        setDrinkSales(initialSales);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setInitialLoading(false);
    }
  };

  const verifyOperator = async () => {
    const trimmedId = operatorId.trim();
    if (!trimmedId) {
      setOperatorValid(false);
      setOperatorName("");
      return;
    }

    setVerifyingOperator(true);
    try {
      const { data, error } = await supabase
        .from("counters")
        .select("*")
        .eq("operator_id", trimmedId.toUpperCase())
        .single();

      if (error || !data) {
        setOperatorValid(false);
        setOperatorName("");
      } else {
        setOperatorValid(true);
        setOperatorName(data.name);
      }
    } catch (error: any) {
      setOperatorValid(false);
      setOperatorName("");
    } finally {
      setVerifyingOperator(false);
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^(07|01)\d{8}$/;
    return phoneRegex.test(phone);
  };

  const checkTodaySales = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
      const { data, error } = await supabase
        .from("sales")
        .select("id")
        .gte("sale_date", today.toISOString())
        .lt("sale_date", tomorrow.toISOString())
        .limit(1);

      if (error) throw error;

      return data && data.length > 0;
    } catch (error) {
      return false;
    }
  };

  const handleBottlesChange = (drinkId: number, value: string) => {
    const bottles = parseInt(value) || 0;
    const drink = drinkSales.find((d) => d.drink_id === drinkId);

    if (drink && bottles > drink.available_stock) {
      Alert.alert(
        "Insufficient Stock",
        `Today's stock is ${drink.available_stock} bottles. Please adjust the quantity.`,
      );
      return;
    }

    setDrinkSales((prev) =>
      prev.map((drink) =>
        drink.drink_id === drinkId
          ? { ...drink, bottles_sold: bottles }
          : drink,
      ),
    );
  };

  const calculateExpectedTotal = () => {
    const total = drinkSales.reduce(
      (sum, drink) => sum + drink.price * drink.bottles_sold,
      0,
    );
    const bottleCount = drinkSales.reduce(
      (sum, drink) => sum + drink.bottles_sold,
      0,
    );
    setExpectedTotal(total);
    setTotalBottles(bottleCount);
  };

  const calculateActualTotal = () => {
    const cash = parseFloat(cashInHand) || 0;
    const till = parseFloat(cashInTill) || 0;
    const debtsTotal = debts.reduce((sum, debt) => sum + debt.amount, 0);
    const defectsTotal = defects.reduce(
      (sum, defect) => sum + defect.amount,
      0,
    );
    const total = cash + till + debtsTotal + defectsTotal;
    setActualTotal(total);
    setBalance(total - expectedTotal);
  };

  const addDebt = () => {
    if (!newDebt.name) {
      Alert.alert("Error", "Please enter customer name");
      return;
    }

    if (!validatePhoneNumber(newDebt.phone)) {
      Alert.alert(
        "Error",
        "Phone number must be 10 digits starting with 07 or 01",
      );
      return;
    }

    if (newDebt.amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    setDebts([...debts, { ...newDebt, id: Date.now().toString() }]);
    setNewDebt({ id: "", name: "", phone: "", amount: 0 });
    setShowDebtForm(false);
  };

  const addDefect = () => {
    if (!newDefect.employee_name) {
      Alert.alert("Error", "Please enter employee name");
      return;
    }

    if (!newDefect.description) {
      Alert.alert("Error", "Please enter description");
      return;
    }

    if (newDefect.amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    setDefects([...defects, { ...newDefect, id: Date.now().toString() }]);
    setNewDefect({ id: "", employee_name: "", description: "", amount: 0 });
    setShowDefectForm(false);
  };

  const removeDebt = (id: string) => {
    setDebts(debts.filter((debt) => debt.id !== id));
  };

  const removeDefect = (id: string) => {
    setDefects(defects.filter((defect) => defect.id !== id));
  };

  const validateSubmission = (): boolean => {
    if (!operatorValid) {
      Alert.alert("Error", "Please enter a valid Operator ID");
      return false;
    }

    const hasSales = drinkSales.some((drink) => drink.bottles_sold > 0);
    if (!hasSales) {
      Alert.alert("Error", "No sales to submit");
      return false;
    }

    for (const drink of drinkSales) {
      if (drink.bottles_sold > drink.available_stock) {
        Alert.alert(
          "Insufficient Stock",
          `${drink.drink_name}: Today's stock is ${drink.available_stock} bottles. You entered ${drink.bottles_sold}.`,
        );
        return false;
      }
    }

    return true;
  };

  const prepareConfirmationSummary = () => {
    const salesSummary: SaleSummary[] = drinkSales
      .filter((d) => d.bottles_sold > 0)
      .map((d) => ({
        drink_name: d.drink_name,
        bottles_sold: d.bottles_sold,
        total: d.price * d.bottles_sold,
      }));

    return salesSummary;
  };

  const submitSales = async () => {
    if (!validateSubmission()) return;

    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    try {
      const hasTodaySales = await checkTodaySales();
      if (hasTodaySales) {
        Alert.alert("Error", "You have already submitted today's sales");
        setLoading(false);
        return;
      }

      const saleDate = new Date().toISOString();
      const trimmedOperatorId = operatorId.trim().toUpperCase();

      // Insert sales
      const salesToInsert = drinkSales
        .filter((drink) => drink.bottles_sold > 0)
        .map((drink) => ({
          drink_name: drink.drink_name,
          price: drink.price.toFixed(2),
          bottles_sold: drink.bottles_sold,
          sale_date: saleDate,
          "buying-price": drink.buying_price.toFixed(2),
          drink_id: drink.drink_id.toString(),
          operator_id: trimmedOperatorId,
        }));

      const { error: salesError } = await supabase
        .from("sales")
        .insert(salesToInsert);

      if (salesError) throw salesError;

      // Insert cash in hand
      if (cashInHand && parseFloat(cashInHand) > 0) {
        const { error: cashError } = await supabase.from("cash").insert({
          amount: parseFloat(cashInHand),
          date: saleDate,
          type: "hand",
          operator_id: trimmedOperatorId,
        });

        if (cashError) throw cashError;
      }

      // Insert cash in till
      if (cashInTill && parseFloat(cashInTill) > 0) {
        const { error: tillError } = await supabase.from("till").insert({
          amount: parseFloat(cashInTill),
          date: saleDate,
          operator_id: trimmedOperatorId,
        });

        if (tillError) throw tillError;
      }

      // Insert debts
      if (debts.length > 0) {
        const debtsToInsert = debts.map((debt) => ({
          customer_name: debt.name,
          customer_phone: debt.phone,
          amount: debt.amount,
          sale_date: saleDate,
          operator_id: trimmedOperatorId,
          status: "pending",
        }));

        const { error: debtsError } = await supabase
          .from("debts")
          .insert(debtsToInsert);

        if (debtsError) throw debtsError;
      }

      // Insert defects
      if (defects.length > 0) {
        const defectsToInsert = defects.map((defect) => ({
          employee_name: defect.employee_name,
          description: defect.description,
          amount: defect.amount,
          date: saleDate,
          operator_id: trimmedOperatorId,
        }));

        const { error: defectsError } = await supabase
          .from("defects")
          .insert(defectsToInsert);

        if (defectsError) throw defectsError;
      }

      // Update drink stock
      for (const sale of drinkSales.filter((d) => d.bottles_sold > 0)) {
        const drink = drinks.find((d) => d.id === sale.drink_id);
        if (drink) {
          const newStock = drink.count_in_stock - sale.bottles_sold;
          const { error: updateError } = await supabase
            .from("drinks")
            .update({ count_in_stock: newStock })
            .eq("id", sale.drink_id);

          if (updateError) throw updateError;
        }
      }

      Alert.alert("Success", "Sales submitted successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  const salesSummary = prepareConfirmationSummary();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Submit Today's Sales</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Operator ID Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operator Verification</Text>
          <View style={styles.operatorContainer}>
            <TextInput
              style={[
                styles.operatorInput,
                operatorValid === true && styles.operatorInputValid,
                operatorValid === false && styles.operatorInputInvalid,
              ]}
              placeholder="Enter Operator ID (e.g., OP001)"
              value={operatorId}
              onChangeText={setOperatorId}
              onSubmitEditing={verifyOperator}
              returnKeyType="done"
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.operatorVerifyButton}
              onPress={verifyOperator}
              disabled={verifyingOperator}
            >
              {verifyingOperator ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.operatorVerifyText}>OK</Text>
              )}
            </TouchableOpacity>
          </View>

          {operatorValid === true && (
            <View style={styles.operatorValidMessage}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.operatorValidText}>
                Welcome, {operatorName}
              </Text>
            </View>
          )}

          {operatorValid === false && (
            <View style={styles.operatorInvalidMessage}>
              <Ionicons name="alert-circle" size={16} color="#FF4444" />
              <Text style={styles.operatorInvalidText}>
                Invalid Operator ID
              </Text>
            </View>
          )}
        </View>
        {/* Drinks Sales Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Drink Sales</Text>
          {drinkSales.map((drink) => (
            <View key={drink.drink_id} style={styles.drinkRow}>
              <View style={styles.drinkInfo}>
                <Text style={styles.drinkName}>{drink.drink_name}</Text>
                <Text style={styles.drinkPrice}>{formatKsh(drink.price)}</Text>
                <Text style={styles.stockInfo}>
                  Today's Stock: {drink.available_stock} bottles
                </Text>
              </View>
              <View style={styles.bottlesContainer}>
                <TextInput
                  style={[
                    styles.bottlesInput,
                    drink.bottles_sold > drink.available_stock &&
                      styles.bottlesInputError,
                  ]}
                  value={drink.bottles_sold.toString()}
                  onChangeText={(value) =>
                    handleBottlesChange(drink.drink_id, value)
                  }
                  keyboardType="numeric"
                  placeholder="0"
                />
                {drink.bottles_sold > drink.available_stock && (
                  <Text style={styles.stockErrorText}>Exceeds stock!</Text>
                )}
              </View>
            </View>
          ))}
        </View>
        {/* Cash Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cash Collection</Text>

          <View style={styles.cashRow}>
            <Text style={styles.cashLabel}>Cash in Hand</Text>
            <TextInput
              style={styles.cashInput}
              value={cashInHand}
              onChangeText={setCashInHand}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>

          <View style={styles.cashRow}>
            <Text style={styles.cashLabel}>Cash in Till</Text>
            <TextInput
              style={styles.cashInput}
              value={cashInTill}
              onChangeText={setCashInTill}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
        </View>
        {/* Debts Section */}
        <View style={styles.section}>
          <View style={styles.debtsHeader}>
            <Text style={styles.sectionTitle}>Debts</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowDebtForm(true)}
            >
              <Ionicons name="add-circle" size={24} color="#4CAF50" />
              <Text style={styles.addButtonText}>Add Debt</Text>
            </TouchableOpacity>
          </View>

          {showDebtForm && (
            <View style={styles.formContainer}>
              <TextInput
                style={styles.formInput}
                placeholder="Customer Name"
                value={newDebt.name}
                onChangeText={(text) => setNewDebt({ ...newDebt, name: text })}
              />
              <TextInput
                style={styles.formInput}
                placeholder="Phone Number (e.g., 0712345678)"
                value={newDebt.phone}
                onChangeText={(text) => setNewDebt({ ...newDebt, phone: text })}
                keyboardType="phone-pad"
                maxLength={10}
              />
              <TextInput
                style={styles.formInput}
                placeholder="Amount"
                value={newDebt.amount ? newDebt.amount.toString() : ""}
                onChangeText={(text) =>
                  setNewDebt({ ...newDebt, amount: parseFloat(text) || 0 })
                }
                keyboardType="numeric"
              />
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => setShowDebtForm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.saveButton]}
                  onPress={addDebt}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {debts.map((debt) => (
            <View key={debt.id} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{debt.name}</Text>
                <Text style={styles.itemSubtitle}>{debt.phone}</Text>
              </View>
              <View style={styles.itemActions}>
                <Text style={styles.itemAmount}>{formatKsh(debt.amount)}</Text>
                <TouchableOpacity
                  onPress={() => removeDebt(debt.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
        {/* Defects/Spoiled Section */}
        <View style={styles.section}>
          <View style={styles.debtsHeader}>
            <Text style={styles.sectionTitle}>Spoiled/Defects</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowDefectForm(true)}
            >
              <Ionicons name="add-circle" size={24} color="#FFA500" />
              <Text style={styles.addButtonText}>Add Defect</Text>
            </TouchableOpacity>
          </View>

          {showDefectForm && (
            <View style={styles.formContainer}>
              <TextInput
                style={styles.formInput}
                placeholder="Employee Name"
                value={newDefect.employee_name}
                onChangeText={(text) =>
                  setNewDefect({ ...newDefect, employee_name: text })
                }
              />
              <TextInput
                style={styles.formInput}
                placeholder="Description (e.g., broke bottle)"
                value={newDefect.description}
                onChangeText={(text) =>
                  setNewDefect({ ...newDefect, description: text })
                }
              />
              <TextInput
                style={styles.formInput}
                placeholder="Amount"
                value={newDefect.amount ? newDefect.amount.toString() : ""}
                onChangeText={(text) =>
                  setNewDefect({ ...newDefect, amount: parseFloat(text) || 0 })
                }
                keyboardType="numeric"
              />
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => setShowDefectForm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.saveButton]}
                  onPress={addDefect}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {defects.map((defect) => (
            <View key={defect.id} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{defect.employee_name}</Text>
                <Text style={styles.itemSubtitle}>{defect.description}</Text>
              </View>
              <View style={styles.itemActions}>
                <Text style={[styles.itemAmount, { color: "#FFA500" }]}>
                  {formatKsh(defect.amount)}
                </Text>
                <TouchableOpacity
                  onPress={() => removeDefect(defect.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
        {/* Summary Section */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Bottles:</Text>
            <Text style={styles.summaryValue}>
              {formatNumber(totalBottles)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Expected Total:</Text>
            <Text style={styles.summaryValue}>{formatKsh(expectedTotal)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Actual Total:</Text>
            <Text style={styles.summaryValue}>{formatKsh(actualTotal)}</Text>
          </View>

          <View style={[styles.summaryRow, styles.balanceRow]}>
            <Text style={styles.balanceLabel}>Balance:</Text>
            <Text
              style={[
                styles.balanceValue,
                balance >= 0 ? styles.balancePositive : styles.balanceNegative,
              ]}
            >
              {formatKsh(Math.abs(balance))}
              {balance < 0 ? " (Short)" : balance > 0 ? " (Excess)" : ""}
            </Text>
          </View>
        </View>
        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (loading || !operatorValid || Math.abs(balance) > 0.01) &&
              styles.submitButtonDisabled,
          ]}
          onPress={submitSales}
          disabled={loading || !operatorValid || Math.abs(balance) > 0.01}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>Review & Submit</Text>
            </>
          )}
        </TouchableOpacity>
        {/* Instructions Section - Added for better scrolling */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>📋 How to Use This Form</Text>

          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.instructionText}>
              Verify Operator ID first - click OK after typing
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.instructionText}>
              Enter bottles sold for each drink (default is 0)
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.instructionText}>
              Add cash collected (in hand and in till)
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.instructionText}>
              Add debts if customers haven't paid
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.instructionText}>
              Balance should be zero before submitting
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Ionicons name="alert-circle" size={20} color="#FFA500" />
            <Text style={styles.instructionText}>
              You can only submit sales once per day
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Sales Submission</Text>

            <View style={styles.modalSummary}>
              <Text style={styles.modalSummaryText}>
                Total Bottles:{" "}
                <Text style={styles.modalSummaryBold}>
                  {formatNumber(totalBottles)}
                </Text>
              </Text>
              <Text style={styles.modalSummaryText}>
                Total Amount:{" "}
                <Text style={styles.modalSummaryBold}>
                  {formatKsh(expectedTotal)}
                </Text>
              </Text>
            </View>

            <Text style={styles.modalSubtitle}>Sales Breakdown:</Text>

            {salesSummary.map((sale, index) => (
              <View key={index} style={styles.modalSaleItem}>
                <Text style={styles.modalSaleName}>{sale.drink_name}</Text>
                <Text style={styles.modalSaleDetails}>
                  {sale.bottles_sold} bottles ×{" "}
                  {formatKsh(sale.total / sale.bottles_sold)} ={" "}
                  {formatKsh(sale.total)}
                </Text>
              </View>
            ))}

            {debts.length > 0 && (
              <>
                <Text style={styles.modalSubtitle}>Debts:</Text>
                {debts.map((debt, index) => (
                  <Text key={index} style={styles.modalDebtItem}>
                    {debt.name}: {formatKsh(debt.amount)}
                  </Text>
                ))}
              </>
            )}

            {defects.length > 0 && (
              <>
                <Text style={styles.modalSubtitle}>Defects:</Text>
                {defects.map((defect, index) => (
                  <Text key={index} style={styles.modalDefectItem}>
                    {defect.employee_name} - {defect.description}:{" "}
                    {formatKsh(defect.amount)}
                  </Text>
                ))}
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={confirmSubmit}
              >
                <Text style={styles.modalConfirmText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  operatorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  operatorInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    marginRight: 10,
  },
  operatorInputValid: {
    borderColor: "#4CAF50",
    borderWidth: 2,
  },
  operatorInputInvalid: {
    borderColor: "#FF4444",
    borderWidth: 2,
  },
  operatorVerifyButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  operatorVerifyText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  operatorValidMessage: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  operatorValidText: {
    color: "#4CAF50",
    marginLeft: 5,
    fontSize: 14,
  },
  operatorInvalidMessage: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  operatorInvalidText: {
    color: "#FF4444",
    marginLeft: 5,
    fontSize: 14,
  },
  drinkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  drinkInfo: {
    flex: 1,
  },
  drinkName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  drinkPrice: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  stockInfo: {
    fontSize: 12,
    color: "#4CAF50",
    marginTop: 2,
    fontWeight: "500",
  },
  bottlesContainer: {
    alignItems: "flex-end",
  },
  bottlesInput: {
    width: 80,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    textAlign: "center",
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  bottlesInputError: {
    borderColor: "#FF4444",
    borderWidth: 2,
  },
  stockErrorText: {
    color: "#FF4444",
    fontSize: 10,
    marginTop: 2,
  },
  cashRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cashLabel: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  cashInput: {
    width: 120,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    textAlign: "right",
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  debtsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  addButtonText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  formContainer: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  formButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  itemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  itemSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF4444",
    marginRight: 10,
  },
  deleteButton: {
    padding: 5,
  },
  summarySection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#666",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  balanceRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#4CAF50",
  },
  balanceLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  balancePositive: {
    color: "#4CAF50",
  },
  balanceNegative: {
    color: "#FF4444",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
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
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  modalSummary: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  modalSummaryText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  modalSummaryBold: {
    fontWeight: "bold",
    color: "#4CAF50",
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
    marginBottom: 5,
  },
  modalSaleItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalSaleName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  modalSaleDetails: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  modalDebtItem: {
    fontSize: 14,
    color: "#FF4444",
    marginBottom: 3,
  },
  modalDefectItem: {
    fontSize: 14,
    color: "#FFA500",
    marginBottom: 3,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
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
  instructionsSection: {
    backgroundColor: "#e8f5e9",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: "#1e4620",
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});
