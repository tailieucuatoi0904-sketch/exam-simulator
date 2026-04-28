import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Theme } from '../constants/theme';
import { examStorage } from '../services/storage';
import { firebaseService } from '../services/firebaseService';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton } from '../components/CustomButton';

export default function ReviewIncorrectScreen() {
  const [incorrectCount, setIncorrectCount] = useState(0);

  useEffect(() => {
    const loadIncorrects = async () => {
      const ids = await firebaseService.getIncorrectQuestions();
      setIncorrectCount(ids.length);
    };
    loadIncorrects();
  }, []);

  const handleStart = () => {
    if (incorrectCount === 0) return;
    
    router.push({
      pathname: '/exam-screen',
      params: {
        mode: 'incorrect',
        questionCount: incorrectCount,
        timeLimit: Math.max(10, Math.ceil(incorrectCount * 1.2)) // 1.2 phút mỗi câu
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Luyện tập câu sai</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="alert-circle" size={80} color={Theme.colors.error} />
          <Text style={styles.countText}>{incorrectCount}</Text>
          <Text style={styles.label}>Câu hỏi bạn đã làm sai</Text>
          <Text style={styles.description}>
            Hệ thống đã tự động lưu lại những câu bạn trả lời chưa chính xác trong các lần thi trước. Hãy luyện tập lại để nắm vững kiến thức!
          </Text>
        </View>

        <CustomButton 
          title="Bắt đầu luyện tập" 
          onPress={handleStart}
          disabled={incorrectCount === 0}
          style={styles.startBtn}
        />
        
        {incorrectCount === 0 && (
          <Text style={styles.emptyHint}>Tuyệt vời! Hiện tại bạn không có câu hỏi sai nào.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.l,
    backgroundColor: Theme.colors.surface,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.text },
  content: { flex: 1, padding: Theme.spacing.xl, alignItems: 'center', justifyContent: 'center' },
  infoCard: {
    backgroundColor: Theme.colors.surface,
    width: '100%',
    padding: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.l,
    alignItems: 'center',
    elevation: 4,
    marginBottom: Theme.spacing.xxl,
  },
  countText: { fontSize: 64, fontWeight: 'bold', color: Theme.colors.error, marginVertical: Theme.spacing.m },
  label: { fontSize: 18, fontWeight: '600', color: Theme.colors.text, marginBottom: Theme.spacing.m },
  description: { fontSize: 14, color: Theme.colors.textLight, textAlign: 'center', lineHeight: 22 },
  startBtn: { width: '100%' },
  emptyHint: { marginTop: Theme.spacing.l, color: Theme.colors.success, fontWeight: '500' }
});
