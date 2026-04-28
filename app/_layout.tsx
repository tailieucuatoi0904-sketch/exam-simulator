import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="quiz-builder" options={{ presentation: 'modal', title: 'Tạo Đề Tùy Chỉnh' }} />
        <Stack.Screen name="domain-practice" options={{ presentation: 'modal', title: 'Theo Domain' }} />
        <Stack.Screen name="eco-task-practice" options={{ presentation: 'modal', title: 'Theo ECO Task' }} />
        <Stack.Screen name="review-incorrect" options={{ presentation: 'modal', title: 'Làm lại câu sai' }} />
        <Stack.Screen name="exam-history" options={{ presentation: 'modal', title: 'Lịch sử Bài thi' }} />
        <Stack.Screen name="exam-screen" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="result-screen" options={{ title: 'Kết quả thi', headerShown: false }} />
        <Stack.Screen name="review-screen" options={{ title: 'Chữa bài chi tiết', headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
