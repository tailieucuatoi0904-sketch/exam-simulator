import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity, Alert, FlatList } from 'react-native';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { bigMockQuestions } from '../../services/questionsData';
import { ExcelImporter } from '../../components/ExcelImporter';
import { examStorage } from '../../services/storage';
import { Question } from '../../services/types';

export default function QuestionManagementScreen() {
  const [questions, setQuestions] = useState<Question[]>(() => {
    return [...bigMockQuestions, ...examStorage.getCustomQuestions()];
  });

  const handleImported = (newQuestions: Question[]) => {
    examStorage.saveCustomQuestions(newQuestions);
    setQuestions(prev => [...prev, ...newQuestions]);
  };

  // Tính toán thống kê
  const stats = {
    people: questions.filter(q => q.domain === 'People').length,
    process: questions.filter(q => q.domain === 'Process').length,
    business: questions.filter(q => q.domain === 'Business Environment').length,
  };

  const renderQuestionItem = ({ item }: { item: Question }) => (
    <View style={styles.qItem}>
      <View style={styles.qHeader}>
        <Text style={styles.qDomain}>{item.domain}</Text>
        <Text style={styles.qId}>ID: {item.id.substring(0, 8)}...</Text>
      </View>
      <Text style={styles.qText} numberOfLines={2}>
        {item.questionText}
      </Text>
      <Text style={styles.qTask}>Task: {item.ecoTask}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Quản lý Câu hỏi</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.importSection}>
            <ExcelImporter onDataImported={handleImported} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatVal}>{stats.people}</Text>
              <Text style={styles.miniStatLabel}>People</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatVal}>{stats.process}</Text>
              <Text style={styles.miniStatLabel}>Process</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatVal}>{stats.business}</Text>
              <Text style={styles.miniStatLabel}>Business</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Danh sách câu hỏi ({questions.length})</Text>
          
          <FlatList
            data={questions}
            renderItem={renderQuestionItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Theme.colors.background },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.l,
    backgroundColor: Theme.colors.surface,
    elevation: 2,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.text },
  content: { flex: 1, padding: Theme.spacing.l },
  importSection: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.l,
    padding: Theme.spacing.s,
    marginBottom: Theme.spacing.l,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Theme.spacing.l },
  miniStat: { 
    flex: 1, 
    backgroundColor: Theme.colors.surface, 
    padding: Theme.spacing.m, 
    borderRadius: Theme.borderRadius.m,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  miniStatVal: { fontSize: 20, fontWeight: 'bold', color: Theme.colors.primary },
  miniStatLabel: { fontSize: 12, color: Theme.colors.textLight },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: Theme.spacing.m, color: Theme.colors.text },
  listContent: { paddingBottom: 20 },
  qItem: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.m,
    borderRadius: Theme.borderRadius.m,
    marginBottom: Theme.spacing.s,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.primary,
  },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  qDomain: { fontSize: 10, fontWeight: 'bold', color: Theme.colors.primary, textTransform: 'uppercase' },
  qId: { fontSize: 10, color: Theme.colors.textLight },
  qText: { fontSize: 14, color: Theme.colors.text, marginBottom: 4, fontWeight: '500' },
  qTask: { fontSize: 11, color: Theme.colors.textLight, fontStyle: 'italic' },
});
