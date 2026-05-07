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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [excludeCorrect, setExcludeCorrect] = useState(false);

  const handleStartExam = () => {
    const newErrors: Record<string, string> = {};
    const numQuestions = parseInt(questionCount);
    const numTime = parseInt(timeLimit);

    if (!selectedDomain) {
      newErrors.domain = 'Vui lòng chọn 1 Domain để luyện tập.';
    }

    if (isNaN(numQuestions) || numQuestions <= 0) {
      newErrors.questionCount = 'Số lượng câu hỏi không hợp lệ.';
    }

    if (isNaN(numTime) || numTime <= 0) {
      newErrors.timeLimit = 'Thời gian không hợp lệ.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    router.push({
      pathname: '/exam-screen',
      params: {
        mode: 'domain',
        questionCount: numQuestions,
        timeLimit: numTime,
        selectedDomains: selectedDomain!,
        excludeCorrect: excludeCorrect.toString()
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Luyện tập theo Domain</Text>
      <Text style={styles.subtitle}>Tập trung giải bài tập chuyên sâu theo từng Lĩnh vực.</Text>

      <View style={[styles.section, (errors.questionCount || errors.timeLimit) && { borderColor: Theme.colors.error, borderWidth: 1 }]}>
        <Text style={styles.sectionTitle}>1. Thông số chung</Text>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, errors.questionCount && { color: Theme.colors.error }]}>Số lượng câu hỏi</Text>
          <TextInput 
            style={[styles.input, errors.questionCount && styles.inputError]} 
            keyboardType="number-pad" 
            value={questionCount} 
            onChangeText={(val) => {
              setQuestionCount(val);
              if (errors.questionCount) setErrors(prev => ({ ...prev, questionCount: '' }));
            }} 
          />
          {errors.questionCount && <Text style={styles.errorText}>{errors.questionCount}</Text>}
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, errors.timeLimit && { color: Theme.colors.error }]}>Thời gian (Phút)</Text>
          <TextInput 
            style={[styles.input, errors.timeLimit && styles.inputError]} 
            keyboardType="number-pad" 
            value={timeLimit} 
            onChangeText={(val) => {
              setTimeLimit(val);
              if (errors.timeLimit) setErrors(prev => ({ ...prev, timeLimit: '' }));
            }} 
          />
          {errors.timeLimit && <Text style={styles.errorText}>{errors.timeLimit}</Text>}
        </View>
      </View>

      <View style={[styles.section, errors.domain && { borderColor: Theme.colors.error, borderWidth: 1 }]}>
        <Text style={[styles.sectionTitle, errors.domain && { color: Theme.colors.error }]}>2. Chọn 1 Lĩnh vực (Domain)</Text>
        {errors.domain && <Text style={[styles.errorText, { marginBottom: 10 }]}>{errors.domain}</Text>}
        
        {pmpDomains.map(domain => {
          const isSelected = selectedDomain === domain;
          return (
            <TouchableOpacity 
              key={domain} 
              style={[styles.itemCard, isSelected && styles.itemCardSelected, errors.domain && !isSelected && { borderColor: 'rgba(238, 67, 67, 0.3)' }]}
              onPress={() => {
                setSelectedDomain(domain);
                if (errors.domain) setErrors(prev => ({ ...prev, domain: '' }));
              }}
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
  inputError: {
    borderColor: Theme.colors.error,
    backgroundColor: 'rgba(238, 67, 67, 0.05)',
  },
  errorText: {
    color: Theme.colors.error,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
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
