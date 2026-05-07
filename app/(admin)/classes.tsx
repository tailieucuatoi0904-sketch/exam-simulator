import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/theme';
import { firebaseService } from '../../services/firebaseService';
import { CustomButton } from '../../components/CustomButton';

export default function ClassManagementScreen() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal tạo lớp
  const [modalVisible, setModalVisible] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal quản lý học viên
  const [studentModalVisible, setStudentModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [classStudentIds, setClassStudentIds] = useState<string[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    const data = await firebaseService.getAllClasses();
    setClasses(data);
    setLoading(false);
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      setErrors({ name: 'Vui lòng nhập tên lớp học' });
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    const res = await firebaseService.createClass(newClassName, newClassDesc);
    setIsSubmitting(false);
    if (res.success) {
      Alert.alert('Thành công', 'Đã tạo lớp học mới!');
      setModalVisible(false);
      setNewClassName('');
      setNewClassDesc('');
      loadClasses();
    } else {
      Alert.alert('Lỗi', 'Không thể tạo lớp học');
    }
  };

  const openStudentManager = async (cls: any) => {
    setSelectedClass(cls);
    setStudentModalVisible(true);
    setIsLoadingStudents(true);
    
    // Load all students
    const users = await firebaseService.getAllUsers();
    const students = users.filter((u: any) => u.role === 'student');
    setAllStudents(students);
    
    // Load current students in this class
    const currentStudentIds = await firebaseService.getClassStudents(cls.id);
    setClassStudentIds(currentStudentIds);
    
    setIsLoadingStudents(false);
  };

  const toggleStudent = async (studentId: string) => {
    if (!selectedClass) return;
    
    const isEnrolled = classStudentIds.includes(studentId);
    let success = false;
    
    if (isEnrolled) {
      success = await firebaseService.removeStudentFromClass(selectedClass.id, studentId);
      if (success) {
        setClassStudentIds(prev => prev.filter(id => id !== studentId));
      }
    } else {
      success = await firebaseService.addStudentToClass(selectedClass.id, studentId);
      if (success) {
        setClassStudentIds(prev => [...prev, studentId]);
      }
    }
    
    if (!success) {
      Alert.alert('Lỗi', 'Không thể cập nhật danh sách học viên');
    }
  };

  const renderClassItem = ({ item }: { item: any }) => (
    <View style={styles.classCard}>
      <View style={styles.classInfo}>
        <Text style={styles.className}>{item.name}</Text>
        <Text style={styles.classDesc}>{item.description}</Text>
        <Text style={styles.classDate}>Ngày tạo: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
      </View>
      <TouchableOpacity 
        style={styles.manageButton}
        onPress={() => openStudentManager(item)}
      >
        <Ionicons name="people-outline" size={20} color={Theme.colors.primary} />
        <Text style={styles.manageBtnText}>Học viên</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStudentItem = ({ item }: { item: any }) => {
    const isEnrolled = classStudentIds.includes(item.id);
    return (
      <View style={styles.studentRow}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.displayName || item.name}</Text>
          <Text style={styles.studentEmail}>{item.email}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.toggleBtn, isEnrolled ? styles.enrolledBtn : styles.notEnrolledBtn]}
          onPress={() => toggleStudent(item.id)}
        >
          <Text style={[styles.toggleBtnText, { color: isEnrolled ? Theme.colors.error : Theme.colors.success }]}>
            {isEnrolled ? 'Xóa' : 'Thêm'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý Lớp học</Text>
        <CustomButton 
          title="+ Tạo Lớp" 
          onPress={() => setModalVisible(true)} 
          style={styles.addButton}
          textStyle={{ fontSize: 14 }}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={classes}
          renderItem={renderClassItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>Chưa có lớp học nào.</Text>}
        />
      )}

      {/* Modal Tạo Lớp */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tạo Lớp học mới</Text>
            
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Tên lớp (VD: Lớp PMP K10)"
              value={newClassName}
              onChangeText={t => {
                setNewClassName(t);
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Mô tả lớp học"
              value={newClassDesc}
              onChangeText={setNewClassDesc}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalActions}>
              <CustomButton 
                title="Hủy" 
                type="outline" 
                onPress={() => setModalVisible(false)} 
                style={styles.modalBtn} 
              />
              <CustomButton 
                title={isSubmitting ? "Đang tạo..." : "Tạo Lớp"} 
                onPress={handleCreateClass} 
                disabled={isSubmitting}
                style={styles.modalBtn} 
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Quản lý Học viên */}
      <Modal visible={studentModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.largeModal]}>
            <Text style={styles.modalTitle}>Học viên: {selectedClass?.name}</Text>
            <Text style={styles.modalSubtitle}>Sĩ số: {classStudentIds.length}</Text>
            
            {isLoadingStudents ? (
              <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginVertical: 30 }} />
            ) : (
              <FlatList
                data={allStudents}
                renderItem={renderStudentItem}
                keyExtractor={item => item.id}
                style={styles.studentList}
              />
            )}
            
            <CustomButton 
              title="Đóng" 
              type="primary" 
              onPress={() => setStudentModalVisible(false)} 
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
  classCard: {
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
  classInfo: { flex: 1 },
  className: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.text },
  classDesc: { fontSize: 14, color: Theme.colors.textLight, marginTop: 4 },
  classDate: { fontSize: 12, color: Theme.colors.textLight, marginTop: 8 },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
    padding: 8,
    borderRadius: 8,
    gap: 4
  },
  manageBtnText: { color: Theme.colors.primary, fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 50, color: Theme.colors.textLight, fontSize: 16 },
  
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
  modalSubtitle: { fontSize: 14, color: Theme.colors.textLight, marginBottom: Theme.spacing.m },
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
    backgroundColor: 'rgba(238, 67, 67, 0.05)',
  },
  errorText: {
    color: Theme.colors.error,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    fontWeight: '600',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Theme.spacing.m },
  modalBtn: { minWidth: 100, paddingVertical: 10 },
  
  studentList: { flexGrow: 0 },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.text },
  studentEmail: { fontSize: 14, color: Theme.colors.textLight },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  enrolledBtn: { borderColor: Theme.colors.error, backgroundColor: 'rgba(239, 35, 60, 0.05)' },
  notEnrolledBtn: { borderColor: Theme.colors.success, backgroundColor: 'rgba(76, 201, 240, 0.05)' },
  toggleBtnText: { fontWeight: 'bold', fontSize: 13 },
});
