import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

// Dashboard Screen
const DashboardScreen = () => (
  <View style={styles.screenContainer}>
    <Text style={styles.screenTitle}>Dashboard</Text>
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Welcome Back!</Text>
      <Text style={styles.cardContent}>
        This is your dashboard overview. You can add charts, stats, or any other
        content here.
      </Text>
    </View>
    <View style={styles.statsContainer}>
      <View style={styles.statBox}>
        <Ionicons name="stats-chart" size={32} color="#4CAF50" />
        <Text style={styles.statNumber}>1,234</Text>
        <Text style={styles.statLabel}>Total Views</Text>
      </View>
      <View style={styles.statBox}>
        <Ionicons name="people" size={32} color="#2196F3" />
        <Text style={styles.statNumber}>567</Text>
        <Text style={styles.statLabel}>Users</Text>
      </View>
    </View>
  </View>
);

// Profile Screen
const ProfileScreen = () => (
  <View style={styles.screenContainer}>
    <Text style={styles.screenTitle}>Profile</Text>
    <View style={styles.profileCard}>
      <Ionicons name="person-circle" size={100} color="#666" />
      <Text style={styles.profileName}>John Doe</Text>
      <Text style={styles.profileEmail}>john.doe@example.com</Text>
      <View style={styles.profileInfo}>
        <Text style={styles.infoText}>Member since: 2024</Text>
        <Text style={styles.infoText}>Last active: Today</Text>
      </View>
    </View>
  </View>
);

// Settings Screen
const SettingsScreen = () => (
  <View style={styles.screenContainer}>
    <Text style={styles.screenTitle}>Settings</Text>
    <View style={styles.settingsCard}>
      <View style={styles.settingItem}>
        <Ionicons name="notifications" size={24} color="#666" />
        <Text style={styles.settingText}>Notifications</Text>
        <Ionicons name="chevron-forward" size={24} color="#666" />
      </View>
      <View style={styles.settingItem}>
        <Ionicons name="lock-closed" size={24} color="#666" />
        <Text style={styles.settingText}>Privacy</Text>
        <Ionicons name="chevron-forward" size={24} color="#666" />
      </View>
      <View style={styles.settingItem}>
        <Ionicons name="color-palette" size={24} color="#666" />
        <Text style={styles.settingText}>Theme</Text>
        <Ionicons name="chevron-forward" size={24} color="#666" />
      </View>
      <View style={styles.settingItem}>
        <Ionicons name="language" size={24} color="#666" />
        <Text style={styles.settingText}>Language</Text>
        <Ionicons name="chevron-forward" size={24} color="#666" />
      </View>
    </View>
  </View>
);

const Tab = createBottomTabNavigator();

export default function HomeScreen() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline";
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#4CAF50",
        tabBarInactiveTintColor: "gray",
        headerShown: true,
        headerStyle: {
          backgroundColor: "#4CAF50",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  cardContent: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
  },
  profileEmail: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  profileInfo: {
    marginTop: 20,
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
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
});
