import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, FlatList,
  TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, ScrollView, Platform
} from 'react-native';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { firebaseService } from '../../services/firebaseService';

interface StudentStats {
  examCount: number;
  passCount: number;
  avgScore: number;
}

export default function StudentManagementScreen() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);

  // Map: userId -> Stats tính từ lịch sử thi Cloud
  const [statsMap, setStatsMap] = useState<Record<string, StudentStats>>({});
  const [totalExams, setTotalExams] = useState(0);

  // State cho Modal tạo học viên
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', password: '' });
  const [isCreating, setIsCreating] = useState(false);

  // State cho Modal chi tiết học viên
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Lấy danh sách users thật từ Firebase
        const allUsers = await firebaseService.getAllUsers();
        const studentList = allUsers.filter(u => u.role === 'student');
        setStudents(studentList);

        // 2. Lấy toàn bộ lịch sử thi từ Realtime DB
        const allHistory = await firebaseService.getAllExamHistory();
        setTotalExams(allHistory.length);

        // 3. Tổng hợp thống kê theo từng userId
        const map: Record<string, StudentStats> = {};
        allHistory.forEach((record: any) => {
          const uid = record.userId || 'unknown';
          if (!map[uid]) map[uid] = { examCount: 0, passCount: 0, avgScore: 0 };
          map[uid].examCount++;
          if (record.results?.pass) map[uid].passCount++;
          map[uid].avgScore += record.results?.percentage || 0;
        });

        // 4. Tính điểm trung bình
        Object.keys(map).forEach(uid => {
          if (map[uid].examCount > 0) {
            map[uid].avgScore = map[uid].avgScore / map[uid].examCount;
          }
        });

        setStatsMap(map);
      } catch (e) {
        console.error('Lỗi load dữ liệu:', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateStudent = async () => {
    if (!newStudent.name || !newStudent.email || !newStudent.password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (newStudent.password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải từ 6 ký tự trở lên.');
      return;
    }

    setIsCreating(true);
    const result = await firebaseService.createStudentAccount(
      newStudent.email,
      newStudent.password,
      newStudent.name
    );
    setIsCreating(false);

    if (result.success) {
      Alert.alert('Thành công', `Đã tạo tài khoản cho ${newStudent.name}`);
      setShowCreateModal(false);
      setNewStudent({ name: '', email: '', password: '' });
      // Reload danh sách
      const allUsers = await firebaseService.getAllUsers();
      setStudents(allUsers.filter(u => u.role === 'student'));
    } else {
      Alert.alert('Lỗi', result.error || 'Không thể tạo tài khoản.');
    }
  };

  const handleViewStudent = (item: any) => {
    setSelectedStudent(item);
    setShowDetailModal(true);
  };

  const handleDeleteHistory = async () => {
    if (!selectedStudent) return;

    const confirm = Platform.OS === 'web' 
      ? window.confirm(`Bạn có chắc chắn muốn xóa toàn bộ lịch sử thi của ${selectedStudent.name}?`)
      : true;
    
    if (confirm) {
      setIsDeletingHistory(true);
      const success = await firebaseService.deleteUserHistory(selectedStudent.id);
      setIsDeletingHistory(false);

      if (success) {
        Alert.alert('Thành công', 'Đã xóa lịch sử thi học viên.');
        // Cập nhật lại statsMap cục bộ
        setStatsMap(prev => {
          const newMap = { ...prev };
          delete newMap[selectedStudent.id];
          return newMap;
        });
        setShowDetailModal(false);
      }
    }
  };

  const renderStudentItem = ({ item }: { item: any }) => {
    const stats = statsMap[item.id];
    const examCount = stats?.examCount ?? 0;
    const passRate = examCount > 0 ? ((stats.passCount / examCount) * 100).toFixed(0) : '0';

    return (
      <TouchableOpacity style={styles.studentCard} onPress={() => handleViewStudent(item)}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentEmail}>{item.email || item.username}</Text>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.statsLabel}>Đề thi</Text>
          <Text style={styles.statsValue}>{examCount}</Text>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.statsLabel}>Pass Rate</Text>
          <Text style={[styles.statsValue, {
            color: Number(passRate) >= 70 ? Theme.colors.success : Theme.colors.error
          }]}>
            {passRate}%
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={Theme.colors.border} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Quản lý Học viên</Text>
          <TouchableOpacity onPress={() => setShowCreateModal(true)}>
            <Ionicons name="person-add" size={24} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryVal}>{students.length}</Text>
              <Text style={styles.summaryLabel}>Tổng học viên</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={[styles.summaryVal, { color: Theme.colors.warning }]}>{totalExams}</Text>
              <Text style={styles.summaryLabel}>Lượt thi (Cloud)</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={[styles.summaryVal, { color: Theme.colors.success }]}>
                {Object.values(statsMap).filter(s => s.examCount > 0).length}
              </Text>
              <Text style={styles.summaryLabel}>Đã làm bài</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Danh sách học viên</Text>

          {loading ? (
            <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={students}
              renderItem={renderStudentItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Chưa có học viên nào tham gia.</Text>
              }
            />
          )}
        </View>

        {/* Modal Tạo Học viên */}
        <Modal visible={showCreateModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Thêm Học viên mới</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <Ionicons name="close" size={24} color={Theme.colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Họ và tên</Text>
                  <TextInput 
                    style={styles.input} 
                    value={newStudent.name}
                    onChangeText={t => setNewStudent(p => ({ ...p, name: t }))}
                    placeholder="Ví dụ: Nguyễn Văn A"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email (Tài khoản)</Text>
                  <TextInput 
                    style={styles.input} 
                    value={newStudent.email}
                    onChangeText={t => setNewStudent(p => ({ ...p, email: t }))}
                    placeholder="student@gmail.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mật khẩu</Text>
                  <TextInput 
                    style={styles.input} 
                    value={newStudent.password}
                    onChangeText={t => setNewStudent(p => ({ ...p, password: t }))}
                    placeholder="Ít nhất 6 ký tự"
                    secureTextEntry
                  />
                </View>

                {isCreating ? (
                  <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginVertical: 20 }} />
                ) : (
                  <TouchableOpacity style={styles.createBtn} onPress={handleCreateStudent}>
                    <Text style={styles.createBtnText}>Tạo tài khoản</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal Chi tiết Học viên & Xóa lịch sử */}
        <Modal visible={showDetailModal} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chi tiết Học viên</Text>
                <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                  <Ionicons name="close" size={24} color={Theme.colors.text} />
                </TouchableOpacity>
              </View>

              {selectedStudent && (
                <View style={styles.modalBody}>
                  <View style={styles.detailAvatar}>
                    <Text style={styles.detailAvatarText}>{selectedStudent.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.detailName}>{selectedStudent.name}</Text>
                  <Text style={styles.detailEmail}>{selectedStudent.email || selectedStudent.username}</Text>

                  <View style={styles.detailStatsRow}>
                    <View style={styles.detailStatBox}>
                      <Text style={styles.detailStatVal}>{statsMap[selectedStudent.id]?.examCount || 0}</Text>
                      <Text style={styles.detailStatLabel}>Đề đã làm</Text>
                    </View>
                    <View style={styles.detailStatBox}>
                      <Text style={styles.detailStatVal}>{(statsMap[selectedStudent.id]?.avgScore || 0).toFixed(1)}%</Text>
                      <Text style={styles.detailStatLabel}>Điểm TB</Text>
                    </View>
                  </View>

                  <View style={styles.dangerZone}>
                    <Text style={styles.dangerTitle}>Vùng nguy hiểm</Text>
                    <TouchableOpacity 
                      style={styles.deleteHistoryBtn} 
                      onPress={handleDeleteHistory}
                      disabled={isDeletingHistory}
                    >
                      {isDeletingHistory ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="trash-outline" size={18} color="#fff" />
                          <Text style={styles.deleteHistoryText}>Xóa toàn bộ lịch sử thi</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <Text style={styles.dangerHint}>Hành động này không thể hoàn tác.</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.text },
  content: { flex: 1, padding: Theme.spacing.l },
  summaryRow: { flexDirection: 'row', gap: Theme.spacing.s, marginBottom: Theme.spacing.xl },
  summaryBox: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.m,
    borderRadius: Theme.borderRadius.m,
    alignItems: 'center',
    elevation: 2,
  },
  summaryVal: { fontSize: 22, fontWeight: 'bold', color: Theme.colors.primary },
  summaryLabel: { fontSize: 10, color: Theme.colors.textLight, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: Theme.spacing.m, color: Theme.colors.text },
  listContent: { paddingBottom: 20 },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.m,
    borderRadius: Theme.borderRadius.m,
    marginBottom: Theme.spacing.s,
    elevation: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(67, 97, 238, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.m,
  },
  avatarText: { color: Theme.colors.primary, fontWeight: 'bold', fontSize: 16 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '600', color: Theme.colors.text },
  studentEmail: { fontSize: 11, color: Theme.colors.textLight, marginTop: 2 },
  statsContainer: { alignItems: 'center', marginRight: Theme.spacing.m },
  statsLabel: { fontSize: 9, color: Theme.colors.textLight, textTransform: 'uppercase' },
  statsValue: { fontSize: 14, fontWeight: 'bold', color: Theme.colors.secondary },
  emptyText: { textAlign: 'center', marginTop: 50, color: Theme.colors.textLight },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Theme.spacing.l,
  },
  modalContent: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.l,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.text },
  modalBody: { padding: Theme.spacing.l },
  inputGroup: { marginBottom: Theme.spacing.m },
  label: { fontSize: 14, color: Theme.colors.text, marginBottom: 8, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.m,
    padding: Theme.spacing.m,
    fontSize: 16,
    backgroundColor: Theme.colors.background,
  },
  createBtn: {
    backgroundColor: Theme.colors.primary,
    padding: Theme.spacing.l,
    borderRadius: Theme.borderRadius.m,
    alignItems: 'center',
    marginTop: Theme.spacing.m,
    marginBottom: 20,
  },
  createBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  // Detail Modal Styles
  detailAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(67, 97, 238, 0.1)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: Theme.spacing.m },
  detailAvatarText: { fontSize: 24, fontWeight: 'bold', color: Theme.colors.primary },
  detailName: { fontSize: 20, fontWeight: 'bold', color: Theme.colors.text, textAlign: 'center' },
  detailEmail: { fontSize: 14, color: Theme.colors.textLight, textAlign: 'center', marginBottom: Theme.spacing.xl },
  detailStatsRow: { flexDirection: 'row', gap: Theme.spacing.m, marginBottom: Theme.spacing.xl },
  detailStatBox: { flex: 1, backgroundColor: Theme.colors.background, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border },
  detailStatVal: { fontSize: 20, fontWeight: 'bold', color: Theme.colors.primary },
  detailStatLabel: { fontSize: 11, color: Theme.colors.textLight },
  dangerZone: { borderTopWidth: 1, borderTopColor: Theme.colors.border, paddingTop: Theme.spacing.l, marginTop: Theme.spacing.m },
  dangerTitle: { fontSize: 14, fontWeight: 'bold', color: Theme.colors.error, marginBottom: Theme.spacing.m },
  deleteHistoryBtn: { backgroundColor: Theme.colors.error, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  deleteHistoryText: { color: '#fff', fontWeight: 'bold' },
  dangerHint: { fontSize: 11, color: Theme.colors.textLight, textAlign: 'center', marginTop: 8 },
});
