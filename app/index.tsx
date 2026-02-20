import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

const { width } = Dimensions.get("window");
const PIN_LENGTH = 4;

interface Counter {
  id: number;
  name: string;
  phone: string;
  operator_id: string;
  pin: string;
  salary: string;
}

export default function PinScreen() {
  const [pin, setPin] = useState<string[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);
  const [operatorName, setOperatorName] = useState<string | null>(null);

  useEffect(() => {
    fetchCounters();
  }, []);

  const fetchCounters = async () => {
    try {
      const { data, error } = await supabase.from("counters").select("*");

      if (error) throw error;

      if (data) {
        setCounters(data);
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to load operators: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNumberPress = (number: string) => {
    if (pin.length < PIN_LENGTH) {
      const newPin = [...pin, number];
      setPin(newPin);

      if (newPin.length === PIN_LENGTH) {
        verifyPin(newPin.join(""));
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const verifyPin = (enteredPin: string) => {
    // Find counter with matching PIN
    const matchedCounter = counters.find(
      (counter) => counter.pin === enteredPin,
    );

    if (matchedCounter) {
      setPin([]);
      setOperatorName(matchedCounter.name);

      // Store operator info in global state or async storage if needed
      // For now, we'll just show a welcome message
      Alert.alert("Welcome", `Welcome back, ${matchedCounter.name}!`, [
        {
          text: "Continue",
          onPress: () => router.replace("/(tabs)/dashboard"),
        },
      ]);
    } else {
      Alert.alert("Error", "Invalid PIN. Please try again.", [
        { text: "Try Again", onPress: () => setPin([]) },
      ]);
    }
  };

  const renderPinDots = () => {
    return (
      <View style={styles.pinContainer}>
        {[...Array(PIN_LENGTH)].map((_, index) => (
          <View
            key={index}
            style={[styles.pinDot, index < pin.length && styles.pinDotFilled]}
          />
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const numbers = [
      ["1", "2", "3"],
      ["4", "5", "6"],
      ["7", "8", "9"],
      ["", "0", "⌫"],
    ];

    return (
      <View style={styles.keypadContainer}>
        {numbers.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((item, colIndex) => {
              if (item === "") {
                return <View key={colIndex} style={styles.keypadButton} />;
              }

              return (
                <TouchableOpacity
                  key={colIndex}
                  style={styles.keypadButton}
                  onPress={() =>
                    item === "⌫" ? handleDelete() : handleNumberPress(item)
                  }
                >
                  <Text style={styles.keypadText}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading operators... *</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter PIN</Text>
      <Text style={styles.subtitle}>
        {counters.length > 0
          ? "Enter your 4-digit PIN to continue"
          : "No operators registered. Please contact administrator."}
      </Text>

      {renderPinDots()}
      {renderKeypad()}

      {operatorName && (
        <Text style={styles.welcomeText}>Welcome, {operatorName}!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 40,
    textAlign: "center",
  },
  pinContainer: {
    flexDirection: "row",
    marginBottom: 50,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#333",
    marginHorizontal: 10,
  },
  pinDotFilled: {
    backgroundColor: "#333",
  },
  keypadContainer: {
    width: width * 0.8,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  keypadButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  keypadText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
  },
  welcomeText: {
    marginTop: 30,
    fontSize: 18,
    color: "#4CAF50",
    fontWeight: "600",
  },
});
