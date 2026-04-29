import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, TouchableOpacity, TextInput, Switch, ActivityIndicator } from 'react-native';
import { Theme } from '../constants/theme';
import { CustomButton } from '../components/CustomButton';
import { mockPmpQuestions } from '../services/mockData';
import { firebaseService } from '../services/firebaseService';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function EcoTaskPracticeModal() {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [excludeCorrect, setExcludeCorrect] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDomain, setExpandedDomain] = useState<string | null>('People');
  const [dynamicTasks, setDynamicTasks] = useState<Record<string, string[]>>({
    'People': [],
    'Process': [],
    'Business Environment': []
  });
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadPool = async () => {
      setLoading(true);
      const questions = await firebaseService.getQuestionsFromCloud();
      const pool = questions.length > 0 ? questions : mockPmpQuestions;
      
      const groups: Record<string, Set<string>> = {
        'People': new Set(),
        'Process': new Set(),
        'Business Environment': new Set()
      };

      pool.forEach(q => {
        if (groups[q.domain]) {
          groups[q.domain].add(q.ecoTask);
        }
      });

      setDynamicTasks({
        'People': Array.from(groups['People']).sort(),
        'Process': Array.from(groups['Process']).sort(),
        'Business Environment': Array.from(groups['Business Environment']).sort()
      });
      setLoading(false);
    };
    loadPool();
  }, []);

  const handleStartExam = () => {
    if (!selectedTask) {
      Alert.alert('Lỗi', 'Vui lòng chọn 1 ECO Task để luyện tập.');
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
        mode: 'eco',
        questionCount: numQuestions,
        timeLimit: numTime,
        selectedEcoTask: selectedTask,
        excludeCorrect: excludeCorrect.toString()
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Luyện tập theo ECO Task</Text>
      <Text style={styles.subtitle}>Khắc phục điểm yếu theo từng Task chuẩn PMI 2026.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Thông số chung</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Số lượng câu hỏi</Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={questionCount} onChangeText={setQuestionCount} placeholder="Ví dụ: 10" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Thời gian (Phút)</Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={timeLimit} onChangeText={setTimeLimit} placeholder="Ví dụ: 15" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Chọn 1 ECO Task</Text>
        
        {/* Thanh tìm kiếm Task */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Theme.colors.textLight} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Tìm tên task..." 
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator color={Theme.colors.primary} />
            <Text style={{ marginTop: 8, fontSize: 12, color: Theme.colors.textLight }}>Đang tải danh sách Task từ Cloud...</Text>
          </View>
        ) : (
          Object.entries(dynamicTasks).map(([domain, tasks]) => {
            const filteredTasks = tasks.filter(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
            if (filteredTasks.length === 0) return null;

            const isExpanded = expandedDomain === domain;

            return (
              <View key={domain} style={styles.domainGroup}>
                <TouchableOpacity 
                  style={styles.domainHeader} 
                  onPress={() => setExpandedDomain(isExpanded ? null : domain)}
                >
                  <Text style={styles.domainTitle}>{domain} ({filteredTasks.length})</Text>
                  <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={Theme.colors.textLight} />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.taskContainer}>
                    {filteredTasks.map(task => {
                      const isSelected = selectedTask === task;
                      return (
                        <TouchableOpacity 
                          key={task} 
                          style={[styles.taskItem, isSelected && styles.taskItemSelected]}
                          onPress={() => setSelectedTask(task)}
                        >
                          <Text style={[styles.taskText, isSelected && styles.taskTextSelected]} numberOfLines={2}>
                            {task}
                          </Text>
                          {isSelected && <Ionicons name="checkmark-circle" size={18} color={Theme.colors.success} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })
        )}
        
        {!loading && Object.values(dynamicTasks).every(t => t.length === 0) && (
          <Text style={{ textAlign: 'center', color: Theme.colors.error, marginTop: 10 }}>
            Chưa có câu hỏi nào trong kho dữ liệu Cloud.
          </Text>
        )}
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
    color: Theme.colors.success,
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
  itemTextSelected: {
    color: Theme.colors.success,
    fontWeight: 'bold',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    paddingHorizontal: Theme.spacing.m,
    borderRadius: Theme.borderRadius.m,
    marginBottom: Theme.spacing.m,
    height: 40,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: Theme.spacing.s,
    fontSize: 14,
  },
  domainGroup: {
    marginBottom: Theme.spacing.s,
    borderRadius: Theme.borderRadius.m,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  domainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.m,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  domainTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  taskContainer: {
    padding: Theme.spacing.s,
    backgroundColor: Theme.colors.surface,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.m,
    borderRadius: Theme.borderRadius.s,
    marginBottom: 4,
  },
  taskItemSelected: {
    backgroundColor: 'rgba(38, 194, 129, 0.1)',
  },
  taskText: {
    flex: 1,
    fontSize: 13,
    color: Theme.colors.text,
    paddingRight: 8,
  },
  taskTextSelected: {
    color: Theme.colors.success,
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
