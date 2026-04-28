import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Switch, Alert } from 'react-native';
import { Theme } from '../constants/theme';
import { CustomButton } from '../components/CustomButton';
import { pmpDomains } from '../services/mockData';
import { router } from 'expo-router';

export default function QuizBuilderModal() {
  const [questionCount, setQuestionCount] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  
  // State for selected domains (default all true)
  const [selectedDomains, setSelectedDomains] = useState<Record<string, boolean>>(
    pmpDomains.reduce((acc, domain) => ({ ...acc, [domain]: true }), {})
  );

  const toggleDomain = (domain: string) => {
    setSelectedDomains(prev => ({
      ...prev,
      [domain]: !prev[domain]
    }));
  };

  const handleStartExam = () => {
    const numQuestions = parseInt(questionCount);
    const numTime = parseInt(timeLimit);

    if (isNaN(numQuestions) || numQuestions <= 0 || numQuestions > 230) {
      Alert.alert('Lỗi', 'Số lượng câu hỏi phải từ 1 đến 230.');
      return;
    }

    if (isNaN(numTime) || numTime <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập thời gian làm bài hợp lệ.');
      return;
    }

    const hasSelectedDomain = Object.values(selectedDomains).some(v => v);
    if (!hasSelectedDomain) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một Domain.');
      return;
    }

    // Chuyển sang màn hình thi thực tế
    router.push({
      pathname: '/exam-screen',
      params: {
        mode: 'custom',
        questionCount: numQuestions,
        timeLimit: numTime,
        selectedDomains: Object.keys(selectedDomains).filter(k => selectedDomains[k]).join(',')
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Tùy chỉnh Đề thi của bạn</Text>
      <Text style={styles.subtitle}>Cấu hình bài test theo nhu cầu ôn tập của bạn.</Text>

      {/* Cấu hình số lượng & thời gian */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Thông số chung</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Số lượng câu hỏi (Tối đa 230)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={questionCount}
            onChangeText={setQuestionCount}
            placeholder="Ví dụ: 50"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Thời gian làm bài (Phút)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={timeLimit}
            onChangeText={setTimeLimit}
            placeholder="Ví dụ: 60"
          />
        </View>
      </View>

      {/* Lựa chọn Domain */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Chọn Lĩnh vực (Domain)</Text>
        <Text style={styles.note}>*Tỷ lệ trộn chuẩn: People (33%), Process (41%), Business Environment (26%)</Text>
        
        {pmpDomains.map(domain => (
          <View key={domain} style={styles.switchRow}>
            <Text style={styles.switchLabel}>{domain}</Text>
            <Switch
              value={selectedDomains[domain]}
              onValueChange={() => toggleDomain(domain)}
              trackColor={{ false: Theme.colors.border, true: Theme.colors.primary }}
            />
          </View>
        ))}
      </View>

      <CustomButton 
        title="Bắt đầu Sinh Đề & Làm bài" 
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
    fontWeight: '500', // valid value
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.s,
    padding: Theme.spacing.m,
    fontSize: Theme.typography.body.fontSize,
  },
  note: {
    fontSize: Theme.typography.caption.fontSize,
    color: Theme.colors.warning,
    marginBottom: Theme.spacing.m,
    fontStyle: 'italic',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  switchLabel: {
    fontSize: Theme.typography.body.fontSize,
    color: Theme.colors.text,
  },
  startButton: {
    marginTop: Theme.spacing.m,
  }
});
