import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "@app_auth";
const SESSION_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = async (): Promise<boolean> => {
    try {
      const authData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);

      if (!authData) {
        setIsAuthenticated(false);
        return false;
      }

      const { timestamp } = JSON.parse(authData);
      const now = Date.now();
      const elapsed = now - timestamp;

      // Check if session has expired (more than 1 hour)
      if (elapsed > SESSION_DURATION) {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        setIsAuthenticated(false);
        return false;
      }

      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error("Error checking auth:", error);
      setIsAuthenticated(false);
      return false;
    }
  };

  const login = async () => {
    try {
      const authData = {
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error saving auth:", error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error removing auth:", error);
    }
  };

  // Check auth status when app starts
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
