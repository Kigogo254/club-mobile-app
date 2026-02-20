import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsScreen() {
  const navigateToStatement = () => {
    router.push("/statement");
  };

  const navigateToDebtors = () => {
    router.push("/debts");
  };

  const navigateToDefects = () => {
    router.push("/defects");
  };

  return (
    <ScrollView style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Settings</Text>

      <View style={styles.settingsCard}>
        {/* Financial Management Section */}
        <Text style={styles.sectionHeader}>Financial Management</Text>

        {/* View Statement Option */}
        <TouchableOpacity
          style={[styles.settingItem, styles.statementItem]}
          onPress={navigateToStatement}
        >
          <View style={styles.statementIconContainer}>
            <Ionicons name="cash" size={24} color="#4CAF50" />
          </View>
          <Text style={[styles.settingText, styles.statementText]}>
            Payment Statement
          </Text>
          <Ionicons name="chevron-forward" size={24} color="#4CAF50" />
        </TouchableOpacity>

        {/* Debtors Option */}
        <TouchableOpacity
          style={[styles.settingItem, styles.debtorsItem]}
          onPress={navigateToDebtors}
        >
          <View style={styles.debtorsIconContainer}>
            <Ionicons name="people" size={24} color="#FF4444" />
          </View>
          <Text style={[styles.settingText, styles.debtorsText]}>
            Manage Debtors
          </Text>
          <Ionicons name="chevron-forward" size={24} color="#FF4444" />
        </TouchableOpacity>

        {/* Defects Option */}
        <TouchableOpacity
          style={[styles.settingItem, styles.defectsItem]}
          onPress={navigateToDefects}
        >
          <View style={styles.defectsIconContainer}>
            <Ionicons name="warning" size={24} color="#FFA500" />
          </View>
          <Text style={[styles.settingText, styles.defectsText]}>
            View Defects
          </Text>
          <Ionicons name="chevron-forward" size={24} color="#FFA500" />
        </TouchableOpacity>
      </View>

      {/* Info Container */}
      <View style={styles.infoContainer}>
        <Ionicons name="information-circle" size={20} color="#666" />
        <Text style={styles.infoText}>
          View and manage financial records, debtors, and defect reports
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  settingsCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
    color: "#333",
  },
  statementItem: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginVertical: 2,
    borderBottomWidth: 0,
  },
  statementIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  statementText: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  debtorsItem: {
    backgroundColor: "#FFF5F5",
    borderRadius: 8,
    marginVertical: 2,
    borderBottomWidth: 0,
  },
  debtorsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
  },
  debtorsText: {
    color: "#FF4444",
    fontWeight: "600",
  },
  defectsItem: {
    backgroundColor: "#FFF9E6",
    borderRadius: 8,
    marginVertical: 2,
    borderBottomWidth: 0,
  },
  defectsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
  },
  defectsText: {
    color: "#FFA500",
    fontWeight: "600",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#1976D2",
    marginLeft: 10,
  },
});
