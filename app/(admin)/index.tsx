import React from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Theme } from '../../constants/theme';
import { ModeCard } from '../../components/ModeCard';
import { CustomButton } from '../../components/CustomButton';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, ActivityIndicator } from 'react-native';
import { firebaseService } from '../../services/firebaseService';
import { getAllQuestions } from '../../services/questionsData';
import { auth } from '../../config/firebaseConfig';
import { signOut } from 'firebase/auth';

export default function AdminDashboardScreen() {
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    totalQuestions: 0,
    totalStudents: 0,
    totalExams: 0
  });

  React.useEffect(() => {
    const loadDashboardStats = async () => {
      setLoading(true);
      try {
        // 1. Đếm câu hỏi (Lấy từ Cloud)
        const cloudQuestions = await firebaseService.getQuestionsFromCloud();
        const totalQuestionsCount = cloudQuestions.length;
        
        // 2. Đếm học viên
        const users = await firebaseService.getAllUsers();
        const studentCount = users.filter(u => u.role === 'student').length;

        // 3. Đếm lượt thi
        const exams = await firebaseService.getAllExamHistory();

        setStats({
          totalQuestions: totalQuestionsCount,
          totalStudents: studentCount,
          totalExams: exams.length
        });
      } catch (e) {
        console.error("Lỗi tải dashboard stats:", e);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardStats();
  }, []);

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm("Bạn có chắc chắn muốn đăng xuất?");
      if (confirm) {
        try {
          await signOut(auth);
          // Ép tải lại toàn bộ trang để xóa sạch cache session
          window.location.href = '/';
        } catch (e) {
          console.error("Lỗi đăng xuất:", e);
          window.location.href = '/';
        }
      }
    } else {
      Alert.alert(
        "Đăng xuất",
        "Bạn có chắc chắn muốn thoát?",
        [
          { text: "Hủy", style: "cancel" },
          { text: "Đăng xuất", onPress: async () => {
            await signOut(auth);
            router.replace('/');
          }}
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Quản trị Hệ thống</Text>
            <Text style={styles.subtitle}>PMP Exam Portal</Text>
          </View>
          <View style={styles.avatar}>
            <Ionicons name="shield-checkmark" size={24} color={Theme.colors.warning} />
          </View>
        </View>

        {/* System Overview Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="server" size={24} color={Theme.colors.textInverse} />
            <Text style={styles.summaryTitle}>Tổng quan Dữ liệu</Text>
          </View>
          
          {loading ? (
            <View style={{ padding: 20 }}>
              <ActivityIndicator color={Theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.totalQuestions}</Text>
                <Text style={styles.statLabel}>Tổng câu hỏi</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.totalStudents}</Text>
                <Text style={styles.statLabel}>Học viên</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.totalExams}</Text>
                <Text style={styles.statLabel}>Tổng lượt thi</Text>
              </View>
            </View>
          )}
        </View>

        {/* Management Tools */}
        <Text style={styles.sectionTitle}>Công cụ Quản trị</Text>
        
        <ModeCard 
          title="Quản lý Câu hỏi (Upload Excel)"
          description="Thêm, sửa, xóa hoặc tải lên hàng loạt câu hỏi từ file Excel."
          iconName="document-text"
          color={Theme.colors.primary}
          onPress={() => router.push('/(admin)/question-management')}
        />

        <ModeCard 
          title="Quản lý Học viên"
          description="Tạo tài khoản mới và theo dõi tiến độ thi của học viên."
          iconName="people"
          color={Theme.colors.secondary}
          onPress={() => router.push('/(admin)/student-management')}
        />

        <ModeCard 
          title="Phân tích Điểm số"
          description="Xem biểu đồ thống kê Pass/Fail chung của toàn bộ trung tâm."
          iconName="pie-chart"
          color={Theme.colors.success}
          onPress={() => router.push('/(admin)/analytics')}
        />

        <CustomButton 
          title="Đăng xuất" 
          type="outline" 
          onPress={handleLogout} 
          style={styles.logoutButton}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: Theme.spacing.l,
    paddingBottom: Theme.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  greeting: {
    fontSize: Theme.typography.h2.fontSize,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Theme.typography.body.fontSize,
    color: Theme.colors.textLight,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(247, 183, 49, 0.1)', // warning light
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.l,
    padding: Theme.spacing.l,
    marginBottom: Theme.spacing.xl,
    shadowColor: Theme.colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.m,
  },
  summaryTitle: {
    color: Theme.colors.text,
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: 'bold',
    marginLeft: Theme.spacing.s,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: Theme.borderRadius.m,
    padding: Theme.spacing.m,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: Theme.colors.primary,
    fontSize: Theme.typography.h2.fontSize,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: Theme.colors.textLight,
    fontSize: Theme.typography.caption.fontSize,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    height: '100%',
  },
  sectionTitle: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.m,
  },
  logoutButton: {
    marginTop: Theme.spacing.xl,
  }
});
