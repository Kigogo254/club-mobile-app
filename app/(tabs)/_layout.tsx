import { Tabs } from 'expo-router';
import React from 'react';
import { House, Users, ClipboardText, Info, Storefront } from 'phosphor-react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: colorScheme === 'dark' ? '#38383A' : '#E5E5EA',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <House 
              size={24} 
              color={color} 
              weight={focused ? 'fill' : 'regular'} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Sales',
          tabBarIcon: ({ color, focused }) => (
            <ClipboardText 
              size={24} 
              color={color} 
              weight={focused ? 'fill' : 'regular'} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stock"
        options={{
          title: 'Stock',
          tabBarIcon: ({ color, focused }) => (
            <Storefront 
              size={24} 
              color={color} 
              weight={focused ? 'fill' : 'regular'} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ color, focused }) => (
            <Info 
              size={24} 
              color={color} 
              weight={focused ? 'fill' : 'regular'} 
            />
          ),
        }}
      />
    </Tabs>
  );
}