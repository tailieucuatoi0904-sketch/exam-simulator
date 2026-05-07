import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity, Alert, FlatList, TextInput, Modal, ActivityIndicator, Platform } from 'react-native';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { bigMockQuestions } from '../../services/questionsData';
import { ExcelImporter } from '../../components/ExcelImporter';
import { examStorage } from '../../services/storage';
import { Question } from '../../services/types';
import { firebaseService } from '../../services/firebaseService';
import { QuestionFormModal } from '../../components/QuestionFormModal';

// Tối ưu hóa render từng câu hỏi
const QuestionItem = React.memo(({ item, onEdit, onDelete }: { item: Question, onEdit: (q: Question) => void, onDelete: (id: string) => void }) => (
  <View style={styles.qItem}>
    <View style={styles.qHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.qDomain}>{item.domain}</Text>
        <Text style={styles.qId}>ID: {item.id.substring(0, 12)}</Text>
      </View>
      <View style={styles.qActions}>
        <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionBtn}>
          <Ionicons name="create-outline" size={20} color={Theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.actionBtn}>
          <Ionicons name="trash-outline" size={20} color={Theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
    <Text style={styles.qText}>{item.questionText}</Text>
    <Text style={styles.qTask}>Task: {item.ecoTask}</Text>
  </View>
));

export default function QuestionManagementScreen() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      const cloudQs = await firebaseService.getQuestionsFromCloud();
      // Nếu cloud trống, lấy từ local dự phòng
      if (cloudQs.length > 0) {
        setQuestions(cloudQs);
      } else {
        const localQs = [...bigMockQuestions, ...examStorage.getCustomQuestions()];
        setQuestions(localQs);
      }
      setLoading(false);
    };
    loadQuestions();
  }, []);

  const handleImported = async (newQuestions: Question[]) => {
    if (newQuestions.length === 0) return;

    const updatedPool = [...questions, ...newQuestions];
    setQuestions(updatedPool);
    await firebaseService.saveQuestionsToCloud(updatedPool);
    examStorage.saveCustomQuestions(updatedPool.filter(q => q.id.startsWith('imported')));
    
    Alert.alert('Thành công', `Đã thêm ${newQuestions.length} câu hỏi mới vào hệ thống Cloud.`);
  };

  const filteredQuestions = questions.filter(q => 
    q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.ecoTask.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = React.useCallback((id: string) => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn xóa câu hỏi này khỏi hệ thống Cloud?", [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa", style: "destructive", onPress: async () => {
        const newQuestions = questions.filter(q => q.id !== id);
        setQuestions(newQuestions);
        await firebaseService.saveQuestionsToCloud(newQuestions);
        examStorage.saveCustomQuestions(newQuestions.filter(q => q.id.startsWith('imported')));
      }}
    ]);
  }, [questions]);

  // Tính toán thống kê (case-insensitive, hỗ trợ cả "Business" và "Business Environment")
  const stats = {
    people: questions.filter(q => q.domain.trim().toLowerCase() === 'people').length,
    process: questions.filter(q => q.domain.trim().toLowerCase() === 'process').length,
    business: questions.filter(q => {
      const d = q.domain.trim().toLowerCase();
      return d === 'business' || d === 'business environment';
    }).length,
  };

  const handleUpdateQuestion = async (updated: Question) => {
    const newQuestions = questions.map(q => q.id === updated.id ? updated : q);
    setQuestions(newQuestions);
    await firebaseService.saveQuestionsToCloud(newQuestions);
    examStorage.saveCustomQuestions(newQuestions.filter(q => q.id.startsWith('imported')));
    setEditingQuestion(null);
    Alert.alert("Thành công", "Đã cập nhật câu hỏi lên hệ thống Cloud.");
  };

  const handleRemoveDuplicates = async () => {
    const normalize = (text: string) => text.trim().toLowerCase().replace(/\s+/g, ' ').substring(0, 100);
    const seen = new Set<string>();
    const unique: Question[] = [];
    for (const q of questions) {
      const key = normalize(q.questionText);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(q);
      }
    }
    const removed = questions.length - unique.length;
    if (removed === 0) {
      if (Platform.OS === 'web') {
        window.alert('Không phát hiện câu hỏi trùng lặp nào.');
      } else {
        Alert.alert('Thông báo', 'Không phát hiện câu hỏi trùng lặp nào.');
      }
      return;
    }

    const doRemove = async () => {
      setQuestions(unique);
      await firebaseService.saveQuestionsToCloud(unique);
      examStorage.saveCustomQuestions(unique.filter(q => q.id.startsWith('imported')));
      const msg = `Đã xóa ${removed} câu hỏi trùng lặp. Còn lại ${unique.length} câu.`;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Thành công', msg);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Phát hiện ${removed} câu hỏi trùng lặp. Bạn có muốn xóa chúng?`)) {
        await doRemove();
      }
    } else {
      Alert.alert('Xác nhận', `Phát hiện ${removed} câu hỏi trùng lặp.`, [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: doRemove },
      ]);
    }
  };

  const handleDeleteAll = async () => {
    if (questions.length === 0) {
      if (Platform.OS === 'web') {
        window.alert('Kho câu hỏi đã trống.');
      } else {
        Alert.alert('Thông báo', 'Kho câu hỏi đã trống.');
      }
      return;
    }

    const doDelete = async () => {
      setQuestions([]);
      await firebaseService.saveQuestionsToCloud([]);
      examStorage.saveCustomQuestions([]);
      const msg = 'Đã xóa toàn bộ câu hỏi khỏi hệ thống Cloud.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Hoàn tất', msg);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Bạn có chắc chắn muốn xóa TẤT CẢ ${questions.length} câu hỏi? Hành động này KHÔNG THỂ HOÀN TÁC.`)) {
        await doDelete();
      }
    } else {
      Alert.alert('⚠️ XÓA TOÀN BỘ', `Xóa tất cả ${questions.length} câu hỏi?`, [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa tất cả', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const handleCreateNewQuestion = () => {
    setEditingQuestion({
      id: `manual-${Date.now()}`,
      domain: 'People',
      ecoTask: 'Task 1.1',
      questionText: '',
      type: 'single',
      options: [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' },
      ],
      correctAnswers: ['A'],
      explanation: '',
    });
  };

  const renderQuestionItem = React.useCallback(({ item }: { item: Question }) => (
    <QuestionItem 
      item={item} 
      onEdit={setEditingQuestion} 
      onDelete={handleDelete} 
    />
  ), [handleDelete]);

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
            <ExcelImporter onDataImported={handleImported} existingQuestions={questions} />
          </View>

          <View style={styles.adminActions}>
            <TouchableOpacity style={styles.createBtn} onPress={handleCreateNewQuestion}>
              <Ionicons name="add-circle-outline" size={16} color="#fff" />
              <Text style={styles.createBtnText}>Tạo thủ công</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dedupBtn} onPress={handleRemoveDuplicates}>
              <Ionicons name="copy-outline" size={16} color="#e67e22" />
              <Text style={styles.dedupBtnText}>Xóa trùng</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteAllBtn} onPress={handleDeleteAll}>
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={styles.deleteAllBtnText}>Xóa tất cả</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={Theme.colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm theo nội dung, ID, Domain..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={Theme.colors.textLight} />
              </TouchableOpacity>
            )}
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

          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={Theme.colors.primary} />
              <Text style={{ marginTop: 10, color: Theme.colors.textLight }}>Đang tải kho câu hỏi từ Cloud...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Danh sách câu hỏi ({filteredQuestions.length})</Text>
              
              <FlatList
                data={filteredQuestions}
                renderItem={renderQuestionItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={Platform.OS === 'android'}
              />
            </>
          )}
        </View>
      </View>

      <QuestionFormModal
        question={editingQuestion}
        onChange={(q) => setEditingQuestion(q)}
        onSave={handleUpdateQuestion}
        onClose={() => setEditingQuestion(null)}
      />
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
  adminActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginBottom: Theme.spacing.m,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.s,
    backgroundColor: Theme.colors.primary,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  dedupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.s,
    borderWidth: 1,
    borderColor: '#e67e22',
    backgroundColor: '#fef9f3',
  },
  dedupBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e67e22',
  },
  deleteAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.s,
    backgroundColor: '#e74c3c',
  },
  deleteAllBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
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
  qActions: { flexDirection: 'row' },
  actionBtn: { marginLeft: Theme.spacing.s, padding: 4 },
  optionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionPrefix: {
    width: 30,
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  qText: { fontSize: 14, color: Theme.colors.text, marginBottom: 4, fontWeight: '500' },
  qTask: { fontSize: 11, color: Theme.colors.textLight, fontStyle: 'italic' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.m,
    borderRadius: Theme.borderRadius.m,
    marginBottom: Theme.spacing.l,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    height: 45,
  },
  searchInput: {
    flex: 1,
    marginLeft: Theme.spacing.s,
    fontSize: 14,
    color: Theme.colors.text,
  },
  note: {
    fontSize: 12,
    color: Theme.colors.textLight,
    marginTop: Theme.spacing.l,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
 
