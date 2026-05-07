import { Tabs, router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/theme';
import { Platform } from 'react-native';
import { auth } from '../../config/firebaseConfig';
import { firebaseService } from '../../services/firebaseService';

export default function TabLayout() {
  const [userRole, setUserRole] = useState<string>('student');

  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const uInfo = await firebaseService.getUserProfile(user.uid);
        if (uInfo && uInfo.role) {
          setUserRole(uInfo.role);
          // Nếu là admin thì đẩy về admin dashboard, tránh lạc vào giao diện học viên
          if (uInfo.role === 'admin') {
            router.replace('/(admin)');
          }
        }
      }
    };
    fetchRole();
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Theme.colors.primary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: 'rgba(0,0,0,0.05)',
          height: Platform.OS === 'web' ? 60 : 80,
          paddingBottom: Platform.OS === 'web' ? 8 : 25,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="home" color={color} />,
        }}
      />
      
      {/* Ẩn Tab Leaderboard nếu là Admin (chỉ có Học viên mới đua Top) */}
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Bảng vàng',
          tabBarIcon: ({ color }) => <Ionicons name="trophy" size={24} color={color} />,
          href: userRole === 'student' ? '/(tabs)/leaderboard' : null,
        }}
      />
      
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="person" color={color} />,
        }}
      />
      
      {/* Ẩn các file thừa khỏi thanh Tab */}
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      {/* Ẩn các file engine khỏi thanh tab */}
      <Tabs.Screen name="exam-screen" options={{ href: null }} />
      <Tabs.Screen name="review-screen" options={{ href: null }} />
      <Tabs.Screen name="review-incorrect" options={{ href: null }} />
      <Tabs.Screen name="domain-practice" options={{ href: null }} />
      <Tabs.Screen name="eco-task-practice" options={{ href: null }} />
      <Tabs.Screen name="quiz-builder" options={{ href: null }} />
      <Tabs.Screen name="result-screen" options={{ href: null }} />
      <Tabs.Screen name="assignment-exam" options={{ href: null }} />
      <Tabs.Screen name="exam-history" options={{ href: null }} />
    </Tabs>
  );
}
