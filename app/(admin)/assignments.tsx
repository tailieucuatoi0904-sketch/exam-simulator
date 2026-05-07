import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/theme';
import { firebaseService } from '../../services/firebaseService';
import { CustomButton } from '../../components/CustomButton';
import { ExcelImporter } from '../../components/ExcelImporter';
import { QuestionFormModal } from '../../components/QuestionFormModal';
import { Question } from '../../services/types';

// Tách component con và Memoize để tối ưu hiệu năng render FlatList
const AssignmentCard = React.memo(({ item, classes, onResults, onEdit, onDelete }: any) => {
  const className = classes.find((c: any) => c.id === item.classId)?.name || 'Lớp không tồn tại';
  const deadlineDate = new Date(item.deadline);
  const isOverdue = deadlineDate < new Date();

  return (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>Lớp: {className}</Text>
        <Text style={styles.subtitle}>Số câu: {item.questionCount || 0}</Text>
        <Text style={[styles.deadline, { color: isOverdue ? Theme.colors.error : Theme.colors.success }]}>
          Hạn: {deadlineDate.toLocaleDateString('vi-VN')} {deadlineDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.manageButton}
          onPress={() => onResults(item)}
        >
          <Ionicons name="bar-chart-outline" size={18} color={Theme.colors.primary} />
          <Text style={styles.manageBtnText}>Kết quả</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.manageButton, styles.editButton]}
          onPress={() => onEdit(item)}
        >
          <Ionicons name="create-outline" size={18} color="#f59e0b" />
          <Text style={[styles.manageBtnText, { color: '#f59e0b' }]}>Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.manageButton, styles.deleteButton]}
          onPress={() => onDelete(item)}
        >
          <Ionicons name="trash-outline" size={18} color={Theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default function AssignmentManagementScreen() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal tạo bài tập
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [questionCount, setQuestionCount] = useState('50');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Chế độ chọn câu hỏi
  const [assignmentMode, setAssignmentMode] = useState<'random' | 'manual' | 'excel' | 'create'>('random');
  const [globalQuestions, setGlobalQuestions] = useState<any[]>([]);
  const [selectedManualIds, setSelectedManualIds] = useState<string[]>([]);
  const [searchManual, setSearchManual] = useState('');
  const [importedQuestions, setImportedQuestions] = useState<any[]>([]);

  // State cho tab Tạo thủ công
  const [createdQuestions, setCreatedQuestions] = useState<Question[]>([]);
  const [editingNewQ, setEditingNewQ] = useState<Question | null>(null);

  // Modal kết quả
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // Modal sửa bài tập
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editClassId, setEditClassId] = useState('');
  const [editAssignmentMode, setEditAssignmentMode] = useState<'keep' | 'random' | 'manual' | 'excel' | 'create'>('keep');
  const [editQuestionCount, setEditQuestionCount] = useState('50');
  const [editSelectedManualIds, setEditSelectedManualIds] = useState<string[]>([]);
  const [editImportedQuestions, setEditImportedQuestions] = useState<any[]>([]);
  const [editCreatedQuestions, setEditCreatedQuestions] = useState<Question[]>([]);
  const [editSearchManual, setEditSearchManual] = useState('');
  const [editErrors, setEditErrors] = useState<{ [key: string]: string }>({});
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editingNewQForEdit, setEditingNewQForEdit] = useState<Question | null>(null);
  // Câu hỏi hiện tại của bài tập đang sửa (dùng cho tab 'keep')
  const [editCurrentQuestions, setEditCurrentQuestions] = useState<Question[]>([]);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    const [assigns, cls] = await Promise.all([
      firebaseService.getAllAssignments(),
      firebaseService.getAllClasses()
    ]);
    setAssignments(assigns);
    setClasses(cls);
    setLoading(false);
  }, []);

  const loadGlobalQuestions = async () => {
    if (globalQuestions.length > 0) return; // Đã tải rồi thì thôi
    const qs = await firebaseService.getQuestionsFromCloud();
    setGlobalQuestions(qs);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = () => {
    setModalVisible(true);
    setAssignmentMode('random');
    setTitle('');
    setDeadline('');
    setQuestionCount('50');
    setSelectedManualIds([]);
    setImportedQuestions([]);
    setCreatedQuestions([]);
    setSearchManual('');
    setErrors({});
    loadGlobalQuestions(); // Tải ngầm kho câu hỏi khi mở modal
  };

  const handleOpenEditModal = React.useCallback(async (assign: any) => {
    setEditingAssignment(assign);
    setEditTitle(assign.title || '');
    // Chuyển deadline ISO về số ngày còn lại
    const daysLeft = Math.max(0, Math.round((new Date(assign.deadline).getTime() - Date.now()) / 86400000));
    setEditDeadline(daysLeft > 0 ? String(daysLeft) : '');
    setEditClassId(assign.classId || '');
    setEditAssignmentMode('keep');
    setEditQuestionCount('50');
    setEditSelectedManualIds([]);
    setEditImportedQuestions([]);
    setEditCreatedQuestions([]);
    
    // Đảm bảo lấy đầy đủ câu hỏi (vì metadata trong list không chứa câu hỏi)
    let qs = assign.questions;
    if (!Array.isArray(qs) || qs.length === 0) {
      qs = await firebaseService.getAssignmentQuestions(assign.id);
    }
    setEditCurrentQuestions(Array.isArray(qs) ? qs.map((q: any) => ({ ...q })) : []);
    
    setEditSearchManual('');
    setEditErrors({});
    setEditModalVisible(true);
    loadGlobalQuestions();
  }, [globalQuestions.length]);

  const handleCloseEditModal = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Hủy bỏ các thay đổi đang thực hiện?')) {
        setEditModalVisible(false);
      }
    } else {
      Alert.alert(
        'Xác nhận',
        'Hủy bỏ các thay đổi?',
        [
          { text: 'Tiếp tục sửa', style: 'cancel' },
          { text: 'Hủy bỏ', style: 'destructive', onPress: () => setEditModalVisible(false) }
        ]
      );
    }
  };

  const handleUpdateAssignment = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!editClassId) newErrors.classId = 'Vui lòng chọn lớp học';
    if (!editTitle.trim()) newErrors.title = 'Vui lòng nhập tiêu đề bài tập';
    if (!editDeadline.trim()) newErrors.deadline = 'Bắt buộc';
    if (Object.keys(newErrors).length > 0) { setEditErrors(newErrors); return; }

    setEditErrors({});
    setIsEditSubmitting(true);
    try {
      let finalQuestions: any[] | undefined = undefined;

      if (editAssignmentMode === 'keep') {
        // Dùng bản danh sách câu hỏi đã chỉnh sửa tại chỗ
        finalQuestions = editCurrentQuestions;
      } else if (editAssignmentMode === 'random') {
        const num = parseInt(editQuestionCount);
        if (isNaN(num) || num <= 0) { setEditErrors({ questionCount: 'Số lượng không hợp lệ' }); setIsEditSubmitting(false); return; }
        if (globalQuestions.length < num) { Alert.alert('Lỗi', `Kho chỉ có ${globalQuestions.length} câu.`); setIsEditSubmitting(false); return; }
        finalQuestions = [...globalQuestions].sort(() => 0.5 - Math.random()).slice(0, num);
      } else if (editAssignmentMode === 'manual') {
        if (editSelectedManualIds.length === 0) { Alert.alert('Lỗi', 'Chọn ít nhất 1 câu hỏi'); setIsEditSubmitting(false); return; }
        finalQuestions = globalQuestions.filter(q => editSelectedManualIds.includes(q.id));
      } else if (editAssignmentMode === 'excel') {
        if (editImportedQuestions.length === 0) { Alert.alert('Lỗi', 'Vui lòng import Excel'); setIsEditSubmitting(false); return; }
        finalQuestions = editImportedQuestions;
      } else if (editAssignmentMode === 'create') {
        if (editCreatedQuestions.length === 0) { Alert.alert('Lỗi', 'Tạo ít nhất 1 câu hỏi'); setIsEditSubmitting(false); return; }
        finalQuestions = editCreatedQuestions;
      }

      const days = parseInt(editDeadline);
      const deadlineDate = new Date();
      if (!isNaN(days)) deadlineDate.setDate(deadlineDate.getDate() + days);

      const updateData: any = {
        classId: editClassId,
        title: editTitle,
        deadline: deadlineDate.toISOString(),
      };
      if (finalQuestions !== undefined) updateData.questions = finalQuestions;

      const res = await firebaseService.updateAssignment(editingAssignment.id, updateData);
      if (res.success) {
        Alert.alert('Thành công', 'Đã cập nhật bài tập!');
        setEditModalVisible(false);
        loadData();
      } else {
        Alert.alert('Lỗi', 'Không thể cập nhật bài tập');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi cập nhật');
    }
    setIsEditSubmitting(false);
  };

  const handleDeleteAssignment = React.useCallback((assign: any) => {
    if (Platform.OS === 'web') {
      if (!window.confirm(`Xóa bài tập "${assign.title}"? Hành động này không thể hoàn tác.`)) return;
      firebaseService.deleteAssignment(assign.id).then(res => {
        if (res.success) loadData();
        else Alert.alert('Lỗi', 'Không thể xóa bài tập');
      });
    } else {
      Alert.alert(
        'Xác nhận xóa',
        `Xóa bài tập "${assign.title}"? Hành động này không thể hoàn tác.`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xóa',
            style: 'destructive',
            onPress: async () => {
              const res = await firebaseService.deleteAssignment(assign.id);
              if (res.success) loadData();
              else Alert.alert('Lỗi', 'Không thể xóa bài tập');
            }
          }
        ]
      );
    }
  }, [loadData]);

  const handleCreateAssignment = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!selectedClassId) newErrors.classId = 'Vui lòng chọn lớp học';
    if (!title.trim()) newErrors.title = 'Vui lòng nhập tiêu đề bài tập';
    if (!deadline.trim()) newErrors.deadline = 'Bắt buộc';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      let finalQuestions: any[] = [];

      if (assignmentMode === 'random') {
        const numQuestions = parseInt(questionCount);
        if (isNaN(numQuestions) || numQuestions <= 0) {
          setErrors({ questionCount: 'Số lượng không hợp lệ' });
          setIsSubmitting(false);
          return;
        }
        if (globalQuestions.length < numQuestions) {
          Alert.alert('Lỗi', `Kho câu hỏi chỉ có ${globalQuestions.length} câu. Vui lòng nhập số nhỏ hơn.`);
          setIsSubmitting(false);
          return;
        }
        const shuffled = [...globalQuestions].sort(() => 0.5 - Math.random());
        finalQuestions = shuffled.slice(0, numQuestions);
      } else if (assignmentMode === 'manual') {
        if (selectedManualIds.length === 0) {
          Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 câu hỏi từ kho');
          setIsSubmitting(false);
          return;
        }
        finalQuestions = globalQuestions.filter(q => selectedManualIds.includes(q.id));
      } else if (assignmentMode === 'excel') {
        if (importedQuestions.length === 0) {
          Alert.alert('Lỗi', 'Vui lòng import dữ liệu từ Excel');
          setIsSubmitting(false);
          return;
        }
        finalQuestions = importedQuestions;
      } else if (assignmentMode === 'create') {
        if (createdQuestions.length === 0) {
          Alert.alert('Lỗi', 'Vui lòng tạo ít nhất 1 câu hỏi');
          setIsSubmitting(false);
          return;
        }
        finalQuestions = createdQuestions;
      }

      const days = parseInt(deadline);
      const deadlineDate = new Date();
      if (!isNaN(days)) {
        deadlineDate.setDate(deadlineDate.getDate() + days);
      }

      const res = await firebaseService.createAssignment(
        selectedClassId,
        title,
        deadlineDate.toISOString(),
        finalQuestions
      );

      if (res.success) {
        Alert.alert('Thành công', 'Đã giao bài tập mới!');
        setModalVisible(false);
        loadData();
      } else {
        Alert.alert('Lỗi', 'Không thể tạo bài tập');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tạo bài tập');
    }
    setIsSubmitting(false);
  };

  const handleCloseCreateModal = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Hủy bỏ bài tập đang tạo?')) {
        setModalVisible(false);
      }
    } else {
      Alert.alert(
        'Xác nhận',
        'Hủy bỏ bài tập đang tạo?',
        [
          { text: 'Tiếp tục', style: 'cancel' },
          { text: 'Hủy bỏ', style: 'destructive', onPress: () => setModalVisible(false) }
        ]
      );
    }
  };

  const openResultViewer = React.useCallback(async (assign: any) => {
    setSelectedAssignment(assign);
    setResultModalVisible(true);
    setIsLoadingResults(true);

    const res = await firebaseService.getAssignmentResults(assign.id);
    setResults(res);
    setIsLoadingResults(false);
  }, []);

  const renderAssignmentItem = React.useCallback(({ item }: { item: any }) => (
    <AssignmentCard 
      item={item} 
      classes={classes} 
      onResults={openResultViewer}
      onEdit={handleOpenEditModal}
      onDelete={handleDeleteAssignment}
    />
  ), [classes, openResultViewer, handleOpenEditModal, handleDeleteAssignment]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quản lý Bài tập</Text>
        </View>
        <CustomButton 
          title="+ Giao Bài" 
          onPress={handleOpenModal} 
          style={styles.addButton}
          textStyle={{ fontSize: 14 }}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={assignments}
          renderItem={renderAssignmentItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>Chưa có bài tập nào.</Text>}
        />
      )}

      {/* Modal Tạo Bài tập */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Giao Bài tập Mới</Text>
            
            <View style={{ marginBottom: Theme.spacing.m }}>
              <Text style={styles.label}>Chọn Lớp học:</Text>
              <View style={styles.classList}>
                {classes.map(c => (
                  <TouchableOpacity 
                    key={c.id} 
                    style={[styles.classChip, selectedClassId === c.id && styles.classChipSelected, errors.classId && !selectedClassId ? { borderColor: Theme.colors.error } : null]}
                    onPress={() => {
                      setSelectedClassId(c.id);
                      setErrors(prev => ({ ...prev, classId: '' }));
                    }}
                  >
                    <Text style={[styles.classChipText, selectedClassId === c.id && { color: '#fff' }]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.classId && <Text style={styles.errorText}>{errors.classId}</Text>}
            </View>

            <View style={styles.row}>
              <View style={{ flex: 2, marginRight: 8 }}>
                <Text style={styles.label}>Tiêu đề bài tập:</Text>
                <TextInput
                  style={[styles.input, errors.title && styles.inputError]}
                  placeholder="Nhập tiêu đề..."
                  value={title}
                  onChangeText={val => {
                    setTitle(val);
                    setErrors(prev => ({ ...prev, title: '' }));
                  }}
                />
                {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Hạn nộp (ngày):</Text>
                <TextInput
                  style={[styles.input, errors.deadline && styles.inputError]}
                  placeholder="Ví dụ: 7"
                  keyboardType="numeric"
                  value={deadline}
                  onChangeText={val => {
                    setDeadline(val);
                    setErrors(prev => ({ ...prev, deadline: '' }));
                  }}
                />
                {errors.deadline && <Text style={styles.errorText}>{errors.deadline}</Text>}
              </View>
            </View>

            {/* Tabs chọn nguồn câu hỏi */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tabBtn, assignmentMode === 'random' && styles.tabBtnActive]}
                onPress={() => setAssignmentMode('random')}
              >
                <Text style={[styles.tabText, assignmentMode === 'random' && styles.tabTextActive]}>Ngẫu nhiên</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabBtn, assignmentMode === 'manual' && styles.tabBtnActive]}
                onPress={() => setAssignmentMode('manual')}
              >
                <Text style={[styles.tabText, assignmentMode === 'manual' && styles.tabTextActive]}>Chọn từ kho</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabBtn, assignmentMode === 'excel' && styles.tabBtnActive]}
                onPress={() => setAssignmentMode('excel')}
              >
                <Text style={[styles.tabText, assignmentMode === 'excel' && styles.tabTextActive]}>Nhập Excel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabBtn, assignmentMode === 'create' && styles.tabBtnActive]}
                onPress={() => setAssignmentMode('create')}
              >
                <Ionicons name="pencil-outline" size={13} color={assignmentMode === 'create' ? '#fff' : Theme.colors.text} />
                <Text style={[styles.tabText, assignmentMode === 'create' && styles.tabTextActive]}>Tạo thủ công</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Nội dung Tab */}
            {assignmentMode === 'random' && (
              <View style={{ marginVertical: 8 }}>
                <Text style={styles.label}>Số lượng câu hỏi cần bốc ngẫu nhiên:</Text>
                <TextInput
                  style={[styles.input, errors.questionCount && styles.inputError]}
                  placeholder="50"
                  keyboardType="numeric"
                  value={questionCount}
                  onChangeText={val => {
                    setQuestionCount(val);
                    setErrors(prev => ({ ...prev, questionCount: '' }));
                  }}
                />
                {errors.questionCount && <Text style={styles.errorText}>{errors.questionCount}</Text>}
              </View>
            )}

            {assignmentMode === 'manual' && (
              <View style={styles.manualContainer}>
                <Text style={styles.label}>Chọn câu hỏi ({selectedManualIds.length} đã chọn):</Text>
                <TextInput
                  style={[styles.input, { paddingVertical: 8, marginBottom: 8 }]}
                  placeholder="Tìm theo ID, Domain, nội dung..."
                  value={searchManual}
                  onChangeText={setSearchManual}
                />
                <FlatList
                  data={globalQuestions.filter(q => 
                    q.questionText.toLowerCase().includes(searchManual.toLowerCase()) || 
                    q.domain.toLowerCase().includes(searchManual.toLowerCase()) ||
                    q.id.toLowerCase().includes(searchManual.toLowerCase())
                  )}
                  keyExtractor={item => item.id}
                  style={styles.questionList}
                  renderItem={({ item }) => {
                    const isSelected = selectedManualIds.includes(item.id);
                    return (
                      <TouchableOpacity 
                        style={[styles.qItem, isSelected && styles.qItemSelected]}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedManualIds(prev => prev.filter(id => id !== item.id));
                          } else {
                            setSelectedManualIds(prev => [...prev, item.id]);
                          }
                        }}
                      >
                        <Ionicons 
                          name={isSelected ? "checkbox" : "square-outline"} 
                          size={20} 
                          color={isSelected ? Theme.colors.primary : Theme.colors.textLight} 
                        />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.qText} numberOfLines={2}>{item.questionText}</Text>
                          <Text style={styles.qDomain}>{item.domain} - {item.ecoTask}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}

            {assignmentMode === 'excel' && (
              <View style={styles.excelContainer}>
                <Text style={styles.label}>Upload File Excel ({importedQuestions.length} câu đã tải):</Text>
                <ExcelImporter 
                  onDataImported={(qs) => {
                    setImportedQuestions(qs);
                    if (Platform.OS === 'web') {
                      window.alert(`Đã tải lên ${qs.length} câu hỏi thành công.`);
                    } else {
                      Alert.alert('Thành công', `Đã tải lên ${qs.length} câu hỏi.`);
                    }
                  }} 
                  existingQuestions={[]} // Không cần check trùng vì file này riêng cho bài tập
                />
              </View>
            )}

            {/* Tab Tạo thủ công */}
            {assignmentMode === 'create' && (
              <View style={styles.createContainer}>
                <View style={styles.createHeader}>
                  <Text style={styles.label}>✏️ Câu hỏi tự tạo ({createdQuestions.length} câu):</Text>
                  <TouchableOpacity
                    style={styles.addQBtn}
                    onPress={() => setEditingNewQ({
                      id: `manual-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                      domain: 'People',
                      ecoTask: 'Task 1.1',
                      questionText: '',
                      type: 'single',
                      options: [
                        { id: 'A', text: '' }, { id: 'B', text: '' },
                        { id: 'C', text: '' }, { id: 'D', text: '' },
                      ],
                      correctAnswers: ['A'],
                      explanation: '',
                    })}
                  >
                    <Ionicons name="add-circle" size={16} color="#fff" />
                    <Text style={styles.addQBtnText}>Thêm câu hỏi</Text>
                  </TouchableOpacity>
                </View>

                {createdQuestions.length === 0 ? (
                  <View style={styles.emptyCreate}>
                    <Ionicons name="document-text-outline" size={36} color={Theme.colors.textLight} />
                    <Text style={styles.emptyCreateText}>Chưa có câu hỏi nào.{"\n"}Bấm "Thêm câu hỏi" để bắt đầu.</Text>
                  </View>
                ) : (
                  createdQuestions.map((q, idx) => (
                    <View key={q.id} style={styles.createdQItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.createdQNum}>Câu {idx + 1} • {q.type.replace('_',' ').toUpperCase()}</Text>
                        <Text style={styles.createdQText} numberOfLines={2}>
                          {q.type === 'case_set' ? `[Case Set] ${q.questionText}` : q.questionText}
                        </Text>
                        <Text style={styles.createdQDomain}>{q.domain} • {q.ecoTask}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity onPress={() => setEditingNewQ(q)}>
                          <Ionicons name="create-outline" size={20} color={Theme.colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCreatedQuestions(prev => prev.filter(x => x.id !== q.id))}>
                          <Ionicons name="trash-outline" size={20} color={Theme.colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
            
            <View style={styles.modalActions}>
              <CustomButton 
                title="Hủy" 
                type="outline" 
                onPress={handleCloseCreateModal} 
                style={styles.modalBtn} 
              />
              <CustomButton 
                title={isSubmitting ? "Đang xử lý..." : "Giao Bài"} 
                onPress={handleCreateAssignment} 
                disabled={isSubmitting}
                style={styles.modalBtn} 
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Tạo câu hỏi thủ công (dùng QuestionFormModal dùng chung) */}
      <QuestionFormModal
        question={editingNewQ}
        onChange={(q) => setEditingNewQ(q)}
        title="Tạo câu hỏi cho bài tập"
        onClose={() => setEditingNewQ(null)}
        onSave={(q) => {
          setCreatedQuestions(prev => {
            const exists = prev.findIndex(x => x.id === q.id);
            if (exists >= 0) {
              const updated = [...prev];
              updated[exists] = q;
              return updated;
            }
            return [...prev, q];
          });
          setEditingNewQ(null);
        }}
      />

      {/* Modal SỬA Bài tập */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✏️ Sửa Bài tập</Text>

            <View style={{ marginBottom: Theme.spacing.m }}>
              <Text style={styles.label}>Chọn Lớp học:</Text>
              <View style={styles.classList}>
                {classes.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.classChip, editClassId === c.id && styles.classChipSelected, editErrors.classId && !editClassId ? { borderColor: Theme.colors.error } : null]}
                    onPress={() => { setEditClassId(c.id); setEditErrors(prev => ({ ...prev, classId: '' })); }}
                  >
                    <Text style={[styles.classChipText, editClassId === c.id && { color: '#fff' }]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {editErrors.classId && <Text style={styles.errorText}>{editErrors.classId}</Text>}
            </View>

            <View style={styles.row}>
              <View style={{ flex: 2, marginRight: 8 }}>
                <Text style={styles.label}>Tiêu đề bài tập:</Text>
                <TextInput
                  style={[styles.input, editErrors.title && styles.inputError]}
                  placeholder="Nhập tiêu đề..."
                  value={editTitle}
                  onChangeText={val => { setEditTitle(val); setEditErrors(prev => ({ ...prev, title: '' })); }}
                />
                {editErrors.title && <Text style={styles.errorText}>{editErrors.title}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Gia hạn thêm (ngày):</Text>
                <TextInput
                  style={[styles.input, editErrors.deadline && styles.inputError]}
                  placeholder="Ví dụ: 7"
                  keyboardType="numeric"
                  value={editDeadline}
                  onChangeText={val => { setEditDeadline(val); setEditErrors(prev => ({ ...prev, deadline: '' })); }}
                />
                {editErrors.deadline && <Text style={styles.errorText}>{editErrors.deadline}</Text>}
              </View>
            </View>

            {/* Tabs nguồn câu hỏi */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
              <TouchableOpacity style={[styles.tabBtn, editAssignmentMode === 'keep' && styles.tabBtnActive]} onPress={() => setEditAssignmentMode('keep')}>
                <Ionicons name="create-outline" size={13} color={editAssignmentMode === 'keep' ? Theme.colors.primary : Theme.colors.text} />
                <Text style={[styles.tabText, editAssignmentMode === 'keep' && styles.tabTextActive]}>Sửa từng câu</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabBtn, editAssignmentMode === 'random' && styles.tabBtnActive]} onPress={() => setEditAssignmentMode('random')}>
                <Text style={[styles.tabText, editAssignmentMode === 'random' && styles.tabTextActive]}>Ngẫu nhiên</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabBtn, editAssignmentMode === 'manual' && styles.tabBtnActive]} onPress={() => setEditAssignmentMode('manual')}>
                <Text style={[styles.tabText, editAssignmentMode === 'manual' && styles.tabTextActive]}>Chọn từ kho</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabBtn, editAssignmentMode === 'excel' && styles.tabBtnActive]} onPress={() => setEditAssignmentMode('excel')}>
                <Text style={[styles.tabText, editAssignmentMode === 'excel' && styles.tabTextActive]}>Nhập Excel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabBtn, editAssignmentMode === 'create' && styles.tabBtnActive]} onPress={() => setEditAssignmentMode('create')}>
                <Ionicons name="pencil-outline" size={13} color={editAssignmentMode === 'create' ? Theme.colors.primary : Theme.colors.text} />
                <Text style={[styles.tabText, editAssignmentMode === 'create' && styles.tabTextActive]}>Tạo thủ công</Text>
              </TouchableOpacity>
            </ScrollView>

            {editAssignmentMode === 'keep' && (
              <View style={styles.keepContainer}>
                <View style={styles.createHeader}>
                  <Text style={styles.label}>📋 Câu hỏi của bài tập ({editCurrentQuestions.length} câu):</Text>
                  <TouchableOpacity
                    style={styles.addQBtn}
                    onPress={() => setEditingNewQForEdit({
                      id: `manual-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                      domain: 'People', ecoTask: 'Task 1.1',
                      questionText: '', type: 'single',
                      options: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }],
                      correctAnswers: ['A'], explanation: '',
                    })}
                  >
                    <Ionicons name="add-circle" size={16} color="#fff" />
                    <Text style={styles.addQBtnText}>Thêm câu</Text>
                  </TouchableOpacity>
                </View>
                {editCurrentQuestions.length === 0 ? (
                  <View style={styles.emptyCreate}>
                    <Ionicons name="document-text-outline" size={36} color={Theme.colors.textLight} />
                    <Text style={styles.emptyCreateText}>Bài tập chưa có câu hỏi nào.</Text>
                  </View>
                ) : (
                  <ScrollView style={styles.keepQList} nestedScrollEnabled>
                    {editCurrentQuestions.map((q, idx) => (
                      <View key={q.id} style={styles.createdQItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.createdQNum}>Câu {idx + 1} • {(q.type || 'single').replace('_', ' ').toUpperCase()}</Text>
                          <Text style={styles.createdQText} numberOfLines={2}>
                            {q.type === 'case_set' ? `[Case Set] ${q.questionText}` : q.questionText}
                          </Text>
                          <Text style={styles.createdQDomain}>{q.domain} • {q.ecoTask}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity onPress={() => setEditingNewQForEdit({ ...q })}>
                            <Ionicons name="create-outline" size={20} color={Theme.colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setEditCurrentQuestions(prev => prev.filter(x => x.id !== q.id))}>
                            <Ionicons name="trash-outline" size={20} color={Theme.colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {editAssignmentMode === 'random' && (
              <View style={{ marginVertical: 8 }}>
                <Text style={styles.label}>Số lượng câu hỏi bốc ngẫu nhiên:</Text>
                <TextInput
                  style={[styles.input, editErrors.questionCount && styles.inputError]}
                  placeholder="50"
                  keyboardType="numeric"
                  value={editQuestionCount}
                  onChangeText={val => { setEditQuestionCount(val); setEditErrors(prev => ({ ...prev, questionCount: '' })); }}
                />
                {editErrors.questionCount && <Text style={styles.errorText}>{editErrors.questionCount}</Text>}
              </View>
            )}

            {editAssignmentMode === 'manual' && (
              <View style={styles.manualContainer}>
                <Text style={styles.label}>Chọn câu hỏi ({editSelectedManualIds.length} đã chọn):</Text>
                <TextInput
                  style={[styles.input, { paddingVertical: 8, marginBottom: 8 }]}
                  placeholder="Tìm theo ID, Domain, nội dung..."
                  value={editSearchManual}
                  onChangeText={setEditSearchManual}
                />
                <FlatList
                  data={globalQuestions.filter(q =>
                    q.questionText.toLowerCase().includes(editSearchManual.toLowerCase()) ||
                    q.domain.toLowerCase().includes(editSearchManual.toLowerCase()) ||
                    q.id.toLowerCase().includes(editSearchManual.toLowerCase())
                  )}
                  keyExtractor={item => item.id}
                  style={styles.questionList}
                  renderItem={({ item }) => {
                    const isSelected = editSelectedManualIds.includes(item.id);
                    return (
                      <TouchableOpacity
                        style={[styles.qItem, isSelected && styles.qItemSelected]}
                        onPress={() => {
                          if (isSelected) setEditSelectedManualIds(prev => prev.filter(id => id !== item.id));
                          else setEditSelectedManualIds(prev => [...prev, item.id]);
                        }}
                      >
                        <Ionicons name={isSelected ? 'checkbox' : 'square-outline'} size={20} color={isSelected ? Theme.colors.primary : Theme.colors.textLight} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.qText} numberOfLines={2}>{item.questionText}</Text>
                          <Text style={styles.qDomain}>{item.domain} - {item.ecoTask}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}

            {editAssignmentMode === 'excel' && (
              <View style={styles.excelContainer}>
                <Text style={styles.label}>Upload File Excel ({editImportedQuestions.length} câu đã tải):</Text>
                <ExcelImporter
                  onDataImported={(qs) => {
                    setEditImportedQuestions(qs);
                    if (Platform.OS === 'web') window.alert(`Đã tải ${qs.length} câu hỏi.`);
                    else Alert.alert('Thành công', `Đã tải ${qs.length} câu hỏi.`);
                  }}
                  existingQuestions={[]}
                />
              </View>
            )}

            {editAssignmentMode === 'create' && (
              <View style={styles.createContainer}>
                <View style={styles.createHeader}>
                  <Text style={styles.label}>✏️ Câu hỏi tự tạo ({editCreatedQuestions.length} câu):</Text>
                  <TouchableOpacity
                    style={styles.addQBtn}
                    onPress={() => setEditingNewQForEdit({
                      id: `manual-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                      domain: 'People', ecoTask: 'Task 1.1',
                      questionText: '', type: 'single',
                      options: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }],
                      correctAnswers: ['A'], explanation: '',
                    })}
                  >
                    <Ionicons name="add-circle" size={16} color="#fff" />
                    <Text style={styles.addQBtnText}>Thêm câu hỏi</Text>
                  </TouchableOpacity>
                </View>
                {editCreatedQuestions.length === 0 ? (
                  <View style={styles.emptyCreate}>
                    <Ionicons name="document-text-outline" size={36} color={Theme.colors.textLight} />
                    <Text style={styles.emptyCreateText}>Chưa có câu hỏi nào.{"\n"}Bấm "Thêm câu hỏi" để bắt đầu.</Text>
                  </View>
                ) : (
                  editCreatedQuestions.map((q, idx) => (
                    <View key={q.id} style={styles.createdQItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.createdQNum}>Câu {idx + 1} • {q.type.replace('_', ' ').toUpperCase()}</Text>
                        <Text style={styles.createdQText} numberOfLines={2}>
                          {q.type === 'case_set' ? `[Case Set] ${q.questionText}` : q.questionText}
                        </Text>
                        <Text style={styles.createdQDomain}>{q.domain} • {q.ecoTask}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity onPress={() => setEditingNewQForEdit(q)}>
                          <Ionicons name="create-outline" size={20} color={Theme.colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setEditCreatedQuestions(prev => prev.filter(x => x.id !== q.id))}>
                          <Ionicons name="trash-outline" size={20} color={Theme.colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            <View style={styles.modalActions}>
              <CustomButton title="Hủy" type="outline" onPress={handleCloseEditModal} style={styles.modalBtn} />
              <CustomButton
                title={isEditSubmitting ? 'Đang xử lý...' : 'Lưu thay đổi'}
                onPress={handleUpdateAssignment}
                disabled={isEditSubmitting}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* QuestionFormModal dành cho Edit modal (cả tab 'keep' và 'create') */}
      <QuestionFormModal
        question={editingNewQForEdit}
        onChange={(q) => setEditingNewQForEdit(q)}
        title="Chỉnh sửa câu hỏi"
        onClose={() => setEditingNewQForEdit(null)}
        onSave={(q) => {
          if (editAssignmentMode === 'keep') {
            // Cập nhật vào danh sách câu hiện tại
            setEditCurrentQuestions(prev => {
              const exists = prev.findIndex(x => x.id === q.id);
              if (exists >= 0) { const updated = [...prev]; updated[exists] = q; return updated; }
              return [...prev, q]; // Thêm mới nếu là câu vừa tạo
            });
          } else {
            // Cập nhật vào danh sách câu tự tạo
            setEditCreatedQuestions(prev => {
              const exists = prev.findIndex(x => x.id === q.id);
              if (exists >= 0) { const updated = [...prev]; updated[exists] = q; return updated; }
              return [...prev, q];
            });
          }
          setEditingNewQForEdit(null);
        }}
      />

      {/* Modal Xem kết quả */}
      <Modal visible={resultModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.largeModal]}>
            <Text style={styles.modalTitle}>Kết quả: {selectedAssignment?.title}</Text>
            
            {isLoadingResults ? (
              <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginVertical: 30 }} />
            ) : results.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có học viên nào nộp bài.</Text>
            ) : (
              <FlatList
                data={results}
                keyExtractor={item => item.studentId}
                renderItem={({ item }) => (
                  <View style={styles.resultRow}>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{item.studentName}</Text>
                      <Text style={styles.studentEmail}>Nộp lúc: {new Date(item.submittedAt).toLocaleString('vi-VN')}</Text>
                    </View>
                    <View style={styles.scoreBox}>
                      <Text style={styles.scoreText}>{item.score.toFixed(0)}%</Text>
                      <Text style={styles.scoreDetail}>{item.correct}/{item.total}</Text>
                    </View>
                  </View>
                )}
                style={styles.resultList}
              />
            )}
            
            <CustomButton 
              title="Đóng" 
              type="primary" 
              onPress={() => setResultModalVisible(false)} 
              style={{ marginTop: Theme.spacing.m }} 
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.l,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Theme.colors.text },
  addButton: { paddingVertical: 8, paddingHorizontal: 16 },
  listContainer: { padding: Theme.spacing.m },
  card: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.m,
    borderRadius: Theme.borderRadius.m,
    marginBottom: Theme.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  cardInfo: { flex: 1 },
  title: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.text },
  subtitle: { fontSize: 14, color: Theme.colors.textLight, marginTop: 4 },
  deadline: { fontSize: 13, fontWeight: 'bold', marginTop: 8 },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
    padding: 8,
    borderRadius: 8,
    gap: 4
  },
  editButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
  },
  manageBtnText: { color: Theme.colors.primary, fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 50, color: Theme.colors.textLight, fontSize: 16 },
  keepContainer: {
    marginTop: 8,
    maxHeight: 400,
  },
  keepQList: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.s,
    backgroundColor: '#fafafa',
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.l,
  },
  modalContent: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.l,
    padding: Theme.spacing.xl,
    width: '100%',
    maxWidth: 500,
  },
  largeModal: { maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: Theme.spacing.m, color: Theme.colors.text },
  label: { fontSize: 14, fontWeight: '600', color: Theme.colors.textLight, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.s,
    padding: Theme.spacing.m,
    marginBottom: Theme.spacing.m,
    fontSize: 16,
  },
  inputError: {
    borderColor: Theme.colors.error,
  },
  errorText: {
    color: Theme.colors.error,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  classList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Theme.spacing.m },
  classChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  classChipSelected: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  classChipText: { fontSize: 14, color: Theme.colors.text },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Theme.spacing.m, marginTop: Theme.spacing.m },
  modalBtn: { minWidth: 100, paddingVertical: 10 },
  
  resultList: { flexGrow: 0 },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.text },
  studentEmail: { fontSize: 12, color: Theme.colors.textLight, marginTop: 4 },
  scoreBox: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(76, 201, 240, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  scoreText: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.primary },
  scoreDetail: { fontSize: 12, color: Theme.colors.textLight },

  // New styles for tabs and manual selection
  tabContainer: {
    marginBottom: Theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    maxHeight: 45,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: Theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: Theme.colors.textLight,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Theme.colors.primary,
  },
  manualContainer: {
    height: 300,
    marginTop: 8,
  },
  questionList: {
    flex: 1,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.s,
    backgroundColor: '#fafafa',
  },
  qItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    alignItems: 'center',
  },
  qItemSelected: {
    backgroundColor: 'rgba(67, 97, 238, 0.05)',
  },
  qText: {
    fontSize: 13,
    color: Theme.colors.text,
  },
  qDomain: {
    fontSize: 11,
    color: Theme.colors.primary,
    marginTop: 2,
  },
  excelContainer: {
    marginTop: 8,
    minHeight: 150,
  },
  createContainer: {
    marginTop: 8,
    maxHeight: 400,
  },
  createHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addQBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addQBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyCreate: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderStyle: 'dashed',
  },
  emptyCreateText: {
    textAlign: 'center',
    color: Theme.colors.textLight,
    marginTop: 8,
    fontSize: 13,
  },
  createdQItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 8,
    gap: 8,
  },
  createdQNum: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    marginBottom: 2,
  },
  createdQText: {
    fontSize: 14,
    color: Theme.colors.text,
  },
  createdQDomain: {
    fontSize: 11,
    color: Theme.colors.textLight,
    marginTop: 4,
  }
});
