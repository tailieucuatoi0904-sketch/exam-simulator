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
  const [newStudent, setNewStudent] = useState({ name: '', email: '', password: '', role: 'student' as 'student' | 'admin' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);

  // State cho Modal chi tiết học viên
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'admin'>('student');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Lấy danh sách users thật từ Firebase
        const allUsers = await firebaseService.getAllUsers();
        setStudents(allUsers);

        // 2. Lấy toàn bộ lịch sử thi từ Realtime DB
        const allHistory = await firebaseService.getAllExamHistory();
        setTotalExams(allHistory.length);

        // 3. Tổng hợp thống kê theo từng userId
        const map: Record<string, StudentStats & { correctCount: number; domainStats?: any }> = {};
        
        // Fetch correct counts for each student using firebaseService
        const correctCounts = await Promise.all(studentList.map(async (s) => {
          const ids = await firebaseService.getCorrectQuestions(s.id);
          return { id: s.id, count: ids.length };
        }));

        const countsMap: Record<string, number> = {};
        correctCounts.forEach(c => countsMap[c.id] = c.count);

        const historyByUser: Record<string, any[]> = {};

        allHistory.forEach((record: any) => {
          const uid = record.userId || 'unknown';
          if (!historyByUser[uid]) historyByUser[uid] = [];
          historyByUser[uid].push(record);

          if (!map[uid]) map[uid] = { examCount: 0, passCount: 0, avgScore: 0, correctCount: countsMap[uid] || 0 };
          map[uid].examCount++;
          if (record.results?.pass) map[uid].passCount++;
          map[uid].avgScore += record.results?.percentage || 0;
        });

        const { calculateDomainProficiency } = await import('../../services/analyticsService');

        // 4. Tính điểm trung bình và phân tích Năng lực
        Object.keys(map).forEach(uid => {
          if (map[uid].examCount > 0) {
            map[uid].avgScore = map[uid].avgScore / map[uid].examCount;
            if (historyByUser[uid]) {
              map[uid].domainStats = calculateDomainProficiency(historyByUser[uid]);
            }
          }
        });

        setStatsMap(map as any);
      } catch (e) {
        console.error('Lỗi load dữ liệu:', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateStudent = async () => {
    const newErrors: Record<string, string> = {};
    if (!newStudent.name.trim()) newErrors.name = 'Vui lòng nhập họ tên.';
    if (!newStudent.email.trim()) newErrors.email = 'Vui lòng nhập email.';
    if (!newStudent.password.trim()) {
      newErrors.password = 'Vui lòng nhập mật khẩu.';
    } else if (newStudent.password.length < 6) {
      newErrors.password = 'Mật khẩu phải từ 6 ký tự trở lên.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    setIsCreating(true);
    const result = await firebaseService.createAccount(
      newStudent.email,
      newStudent.password,
      newStudent.name,
      newStudent.role
    );
    setIsCreating(false);

    if (result.success) {
      Alert.alert('Thành công', `Đã tạo tài khoản cho ${newStudent.name}`);
      setShowCreateModal(false);
      setNewStudent({ name: '', email: '', password: '', role: 'student' });
      // Reload danh sách
      const allUsers = await firebaseService.getAllUsers();
      setStudents(allUsers);
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.studentName}>{item.name}</Text>
            {item.role === 'admin' && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>
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

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.m }}>
            <Text style={styles.sectionTitle}>Danh sách người dùng</Text>
            <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20, padding: 2 }}>
              <TouchableOpacity 
                style={[styles.filterChip, filterRole === 'student' && styles.filterChipActive]} 
                onPress={() => setFilterRole('student')}
              >
                <Text style={[styles.filterChipText, filterRole === 'student' && { color: '#fff' }]}>Học viên</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, filterRole === 'all' && styles.filterChipActive]} 
                onPress={() => setFilterRole('all')}
              >
                <Text style={[styles.filterChipText, filterRole === 'all' && { color: '#fff' }]}>Tất cả</Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={students.filter(u => filterRole === 'all' ? true : u.role === filterRole)}
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
                  <Text style={[styles.label, errors.name && { color: Theme.colors.error }]}>Họ và tên</Text>
                  <TextInput 
                    style={[styles.input, errors.name && styles.inputError]} 
                    value={newStudent.name}
                    onChangeText={t => {
                      setNewStudent(p => ({ ...p, name: t }));
                      if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder="Ví dụ: Nguyễn Văn A"
                  />
                  {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, errors.email && { color: Theme.colors.error }]}>Email (Tài khoản)</Text>
                  <TextInput 
                    style={[styles.input, errors.email && styles.inputError]} 
                    value={newStudent.email}
                    onChangeText={t => {
                      setNewStudent(p => ({ ...p, email: t }));
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    placeholder="student@gmail.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, errors.password && { color: Theme.colors.error }]}>Mật khẩu</Text>
                  <TextInput 
                    style={[styles.input, errors.password && styles.inputError]} 
                    value={newStudent.password}
                    onChangeText={t => {
                      setNewStudent(p => ({ ...p, password: t }));
                      if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                    }}
                    placeholder="Ít nhất 6 ký tự"
                    secureTextEntry
                  />
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phân loại tài khoản</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity 
                      style={[styles.roleChip, newStudent.role === 'student' && styles.roleChipSelected]}
                      onPress={() => setNewStudent(p => ({ ...p, role: 'student' }))}
                    >
                      <Ionicons name="people" size={16} color={newStudent.role === 'student' ? '#fff' : Theme.colors.textLight} />
                      <Text style={[styles.roleChipText, newStudent.role === 'student' && { color: '#fff' }]}>Học viên</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.roleChip, newStudent.role === 'admin' && styles.roleChipSelectedAdmin]}
                      onPress={() => setNewStudent(p => ({ ...p, role: 'admin' }))}
                    >
                      <Ionicons name="shield-checkmark" size={16} color={newStudent.role === 'admin' ? '#fff' : Theme.colors.textLight} />
                      <Text style={[styles.roleChipText, newStudent.role === 'admin' && { color: '#fff' }]}>Quản trị viên</Text>
                    </TouchableOpacity>
                  </View>
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

                  {/* Phân tích Năng lực (Domain Analysis) */}
                  {statsMap[selectedStudent.id]?.domainStats && (
                    <View style={styles.analysisZone}>
                      <Text style={styles.analysisTitle}><Ionicons name="analytics" size={16} color={Theme.colors.primary} /> Phân tích Năng lực</Text>
                      
                      {(() => {
                        const dStats = Object.values(statsMap[selectedStudent.id].domainStats as Record<string, any>);
                        if (dStats.length === 0) return <Text style={styles.dangerHint}>Chưa có đủ dữ liệu để phân tích.</Text>;
                        
                        // Sort by percentage to find strongest and weakest
                        const sorted = [...dStats].sort((a, b) => b.percentage - a.percentage);
                        const strongest = sorted[0];
                        const weakest = sorted[sorted.length - 1];

                        return (
                          <View style={styles.analysisBox}>
                            <View style={styles.analysisItem}>
                              <Text style={styles.analysisLabel}>Mạnh nhất</Text>
                              <Text style={[styles.analysisValue, { color: Theme.colors.success }]}>{strongest.domain}</Text>
                              <Text style={styles.analysisSub}>({strongest.percentage}%) - {strongest.level}</Text>
                            </View>
                            <View style={styles.analysisDivider} />
                            <View style={styles.analysisItem}>
                              <Text style={styles.analysisLabel}>Yếu nhất</Text>
                              <Text style={[styles.analysisValue, { color: Theme.colors.error }]}>{weakest.domain}</Text>
                              <Text style={styles.analysisSub}>({weakest.percentage}%) - {weakest.level}</Text>
                            </View>
                          </View>
                        );
                      })()}
                    </View>
                  )}

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
  inputError: {
    borderColor: Theme.colors.error,
    backgroundColor: 'rgba(238, 67, 67, 0.05)',
  },
  errorText: {
    color: Theme.colors.error,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
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
  analysisZone: { backgroundColor: '#f8f9fa', borderRadius: Theme.borderRadius.m, padding: Theme.spacing.m, marginBottom: Theme.spacing.m, borderWidth: 1, borderColor: Theme.colors.border },
  analysisTitle: { fontSize: 14, fontWeight: 'bold', color: Theme.colors.primary, marginBottom: Theme.spacing.m },
  analysisBox: { flexDirection: 'row', justifyContent: 'space-between' },
  analysisItem: { flex: 1, alignItems: 'center' },
  analysisLabel: { fontSize: 11, color: Theme.colors.textLight, textTransform: 'uppercase', marginBottom: 4 },
  analysisValue: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  analysisSub: { fontSize: 11, color: Theme.colors.textLight, marginTop: 2, textAlign: 'center' },
  analysisDivider: { width: 1, backgroundColor: Theme.colors.border, marginHorizontal: Theme.spacing.m },
  dangerZone: { borderTopWidth: 1, borderTopColor: Theme.colors.border, paddingTop: Theme.spacing.l, marginTop: Theme.spacing.m },
  dangerTitle: { fontSize: 14, fontWeight: 'bold', color: Theme.colors.error, marginBottom: Theme.spacing.m },
  deleteHistoryBtn: { backgroundColor: Theme.colors.error, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  deleteHistoryText: { color: '#fff', fontWeight: 'bold' },
  dangerHint: { fontSize: 11, color: Theme.colors.textLight, textAlign: 'center', marginTop: 8 },
  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.m,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.background,
  },
  roleChipSelected: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  roleChipSelectedAdmin: {
    backgroundColor: Theme.colors.warning,
    borderColor: Theme.colors.warning,
  },
  roleChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textLight,
  },
  adminBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Theme.colors.warning,
  },
  adminBadgeText: {
    color: Theme.colors.warning,
    fontSize: 10,
    fontWeight: 'bold',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 18,
  },
  filterChipActive: {
    backgroundColor: Theme.colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: Theme.colors.textLight,
    fontWeight: '600',
  }
});
