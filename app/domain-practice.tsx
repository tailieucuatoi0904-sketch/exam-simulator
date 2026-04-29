import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, TouchableOpacity, TextInput, Switch } from 'react-native';
import { Theme } from '../constants/theme';
import { CustomButton } from '../components/CustomButton';
import { pmpDomains } from '../services/mockData';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DomainPracticeModal() {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [excludeCorrect, setExcludeCorrect] = useState(false);

  const handleStartExam = () => {
    if (!selectedDomain) {
      Alert.alert('Lỗi', 'Vui lòng chọn 1 Domain để luyện tập.');
      return;
    }

    const numQuestions = parseInt(questionCount);
    const numTime = parseInt(timeLimit);

    if (isNaN(numQuestions) || numQuestions <= 0) {
      Alert.alert('Lỗi', 'Số lượng câu hỏi không hợp lệ.');
      return;
    }

    if (isNaN(numTime) || numTime <= 0) {
      Alert.alert('Lỗi', 'Thời gian làm bài không hợp lệ.');
      return;
    }

    router.push({
      pathname: '/exam-screen',
      params: {
        mode: 'domain',
        questionCount: numQuestions,
        timeLimit: numTime,
        selectedDomains: selectedDomain,
        excludeCorrect: excludeCorrect.toString()
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Luyện tập theo Domain</Text>
      <Text style={styles.subtitle}>Tập trung giải bài tập chuyên sâu theo từng Lĩnh vực.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Thông số chung</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Số lượng câu hỏi</Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={questionCount} onChangeText={setQuestionCount} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Thời gian (Phút)</Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={timeLimit} onChangeText={setTimeLimit} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Chọn 1 Lĩnh vực (Domain)</Text>
        
        {pmpDomains.map(domain => {
          const isSelected = selectedDomain === domain;
          return (
            <TouchableOpacity 
              key={domain} 
              style={[styles.itemCard, isSelected && styles.itemCardSelected]}
              onPress={() => setSelectedDomain(domain)}
              activeOpacity={0.7}
            >
              <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>{domain}</Text>
              {isSelected && <Ionicons name="checkmark-circle" size={24} color={Theme.colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Tùy chọn nâng cao</Text>
        <View style={styles.switchRow}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.switchLabel}>Gạch bỏ câu đã làm đúng</Text>
            <Text style={styles.switchSubtitle}>Chỉ bốc những câu bạn chưa làm hoặc đã từng làm sai.</Text>
          </View>
          <Switch
            value={excludeCorrect}
            onValueChange={setExcludeCorrect}
            trackColor={{ false: Theme.colors.border, true: Theme.colors.success }}
          />
        </View>
      </View>

      <CustomButton 
        title="Bắt đầu Luyện tập" 
        onPress={handleStartExam} 
        style={styles.startButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.l,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: Theme.typography.h2.fontSize,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Theme.typography.body.fontSize,
    color: Theme.colors.textLight,
    marginBottom: Theme.spacing.xl,
  },
  section: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.l,
    borderRadius: Theme.borderRadius.m,
    marginBottom: Theme.spacing.l,
    shadowColor: Theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  sectionTitle: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    marginBottom: Theme.spacing.m,
  },
  inputGroup: {
    marginBottom: Theme.spacing.m,
  },
  label: {
    fontSize: Theme.typography.body.fontSize,
    color: Theme.colors.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.s,
    padding: Theme.spacing.m,
    fontSize: Theme.typography.body.fontSize,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.m,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.m,
    marginBottom: Theme.spacing.s,
  },
  itemCardSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(67, 97, 238, 0.05)',
  },
  itemText: {
    fontSize: Theme.typography.body.fontSize,
    color: Theme.colors.text,
  },
  itemTextSelected: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.s,
  },
  switchLabel: {
    fontSize: Theme.typography.body.fontSize,
    color: Theme.colors.text,
    fontWeight: '600',
  },
  switchSubtitle: {
    fontSize: 11,
    color: Theme.colors.textLight,
    marginTop: 2,
  },
  startButton: {
    marginTop: Theme.spacing.m,
  }
});
