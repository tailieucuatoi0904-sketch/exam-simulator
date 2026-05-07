import React from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView, Platform, StatusBar, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../../constants/theme';
import { ModeCard } from '../../components/ModeCard';
import { CustomButton } from '../../components/CustomButton';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Alert } from 'react-native';
import { examStorage } from '../../services/storage';
import { auth } from '../../config/firebaseConfig';
import { signOut } from 'firebase/auth';
import { firebaseService } from '../../services/firebaseService';

export default function StudentDashboardScreen() {
  const [stats, setStats] = React.useState({
    totalExams: 0,
    passRate: 0,
    incorrectCount: 0,
    totalPoolQuestions: 0,
    domainStats: {} as Record<string, import('../../services/analyticsService').DomainProficiency>
  });
  const [loading, setLoading] = React.useState(true);

  const user = auth.currentUser;
  const userEmail = user?.email || 'Học viên';

  const [assignments, setAssignments] = React.useState<any[]>([]);
  const [myClasses, setMyClasses] = React.useState<any[]>([]);

  // Tự động cập nhật stats mỗi khi quay lại màn hình này
  useFocusEffect(
    React.useCallback(() => {
      const loadStats = async () => {
        setLoading(true);
        try {
          const [cloudHistory, cloudIncorrects, cloudQuestionCount, myAssignments, myClassesData] = await Promise.all([
            firebaseService.getUserHistory(),
            firebaseService.getIncorrectQuestions(),
            firebaseService.getQuestionCount(),
            firebaseService.getStudentAssignments(),
            firebaseService.getStudentClasses()
          ]);
          
          setAssignments(myAssignments || []);
          setMyClasses(myClassesData || []);

          // Phân tích năng lực theo Domain
          const { calculateDomainProficiency } = await import('../../services/analyticsService');
          const domainProficiency = calculateDomainProficiency(cloudHistory);

          const baseStats = {
            totalExams: cloudHistory.length,
            passRate: 0,
            incorrectCount: cloudIncorrects.length,
            totalPoolQuestions: cloudQuestionCount,
            domainStats: domainProficiency
          };

          if (cloudHistory.length > 0) {
            const passCount = cloudHistory.filter((h: any) => {
              // Hỗ trợ cả cấu trúc mới (h.results.pass) và cũ (h.pass)
              return h.results?.pass === true || h.pass === true;
            }).length;
            const rate = (passCount / cloudHistory.length) * 100;
            setStats({
              ...baseStats,
              passRate: Math.round(rate)
            });
          } else {
            setStats(baseStats);
          }
        } catch (error) {
          console.error("Lỗi khi tải stats:", error);
        } finally {
          setLoading(false);
        }
      };
      loadStats();
    }, [])
  );

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        await signOut(auth);
      } catch (e) {
        console.error(e);
      }
      if (Platform.OS === 'web') {
        window.location.href = '/';
      } else {
        router.replace('/');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        await doLogout();
      }
    } else {
      Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn thoát?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', onPress: doLogout }
      ]);
    }
  };

  const handleStartAssignment = (assignment: any) => {
    const deadline = new Date(assignment.deadline);
    if (deadline < new Date()) {
      Alert.alert('Đã quá hạn', 'Bài tập này đã quá hạn nộp, bạn không thể làm nữa.');
      return;
    }
    // Navigate to assignment exam screen, pass assignment ID
    router.push({
      pathname: '/assignment-exam',
      params: { id: assignment.id }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{userEmail.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>Xin chào! 👋</Text>
              <Text style={styles.subtitle}>{userEmail}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.headerRight} 
            onPress={() => Alert.alert('Thông báo', 'Hiện tại bạn không có thông báo mới.')}
          >
            <Ionicons name="notifications-outline" size={24} color={Theme.colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Progress Summary Card with Gradient */}
        <LinearGradient
          colors={Theme.colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <>
              <View style={styles.summaryHeader}>
                <View style={styles.summaryIconBox}>
                  <Ionicons name="analytics" size={24} color={Theme.colors.primary} />
                </View>
                <Text style={styles.summaryTitle}>Tiến độ tự học</Text>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{stats.totalExams}</Text>
                  <Text style={styles.statLabel}>Bài thi</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{stats.passRate}%</Text>
                  <Text style={styles.statLabel}>Tỉ lệ Đạt</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{stats.totalPoolQuestions}</Text>
                  <Text style={styles.statLabel}>Câu hỏi</Text>
                </View>
              </View>
            </>
          )}
        </LinearGradient>

        {/* Domain Proficiency Radar */}
        {Object.keys(stats.domainStats).length > 0 && stats.totalExams > 0 && (
          <View style={styles.radarCard}>
            <View style={styles.radarHeader}>
              <Ionicons name="pie-chart" size={20} color={Theme.colors.primary} />
              <Text style={styles.radarTitle}>Bản đồ Năng lực (Theo chuẩn PMI)</Text>
            </View>
            
            {['People', 'Process', 'Business Environment'].map(domain => {
              const dStat = stats.domainStats[domain];
              if (!dStat) return null;
              
              return (
                <View key={domain} style={styles.domainRow}>
                  <View style={styles.domainInfo}>
                    <Text style={styles.domainName}>{domain}</Text>
                    <Text style={[styles.domainLevel, { color: dStat.levelColor }]}>
                      {dStat.level} ({dStat.percentage}%)
                    </Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${dStat.percentage}%`, backgroundColor: dStat.levelColor }]} />
                  </View>
                </View>
              );
            })}
            
            <Text style={styles.radarAdvice}>
              💡 Gợi ý: Hãy tập trung ôn luyện Domain có màu đỏ (Needs Improvement) hoặc vàng (Below Target).
            </Text>
          </View>
        )}

        {/* Lớp học của tôi & Bài tập Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lớp học của tôi</Text>
          <Ionicons name="business-outline" size={20} color={Theme.colors.primary} />
        </View>

        {myClasses.length > 0 ? (
          myClasses.map(cls => {
            const classAssignments = assignments.filter(a => a.classId === cls.id);

            return (
              <View key={cls.id} style={styles.classCardContainer}>
                <View style={styles.classCardHeader}>
                  <View style={styles.classIconBg}>
                    <Ionicons name="school" size={18} color={Theme.colors.primary} />
                  </View>
                  <Text style={styles.classCardTitle}>{cls.name}</Text>
                </View>
                
                {classAssignments.length > 0 ? (
                  classAssignments.map(item => {
                    const deadlineDate = new Date(item.deadline);
                    const isOverdue = deadlineDate < new Date();
                    
                    return (
                      <ModeCard 
                        key={item.id}
                        title={item.title}
                        description={`Hạn nộp: ${deadlineDate.toLocaleDateString('vi-VN')} ${deadlineDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
                        iconName="clipboard"
                        color={isOverdue ? Theme.colors.error : Theme.colors.warning}
                        onPress={() => handleStartAssignment(item)}
                      />
                    );
                  })
                ) : (
                  <View style={styles.emptyClassAssignment}>
                    <Ionicons name="information-circle-outline" size={16} color={Theme.colors.textLight} />
                    <Text style={styles.emptyClassAssignmentText}>Chưa có bài tập nào được giao.</Text>
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <Text style={styles.noClassText}>Bạn chưa tham gia lớp học nào.</Text>
        )}

        {/* Practice Modes Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lộ trình Ôn luyện tự do</Text>
          <Ionicons name="rocket-outline" size={20} color={Theme.colors.primary} />
        </View>
        
        <ModeCard 
          title="Thiết kế Đề thi"
          description="Tùy chỉnh số lượng câu hỏi và thời gian theo ý muốn."
          iconName="options"
          color={Theme.colors.primary}
          onPress={() => router.push('/quiz-builder')}
        />

        <ModeCard 
          title="Học theo Domain"
          description="People, Process, Business Environment."
          iconName="bookmarks"
          color={Theme.colors.secondary}
          onPress={() => router.push('/domain-practice')}
        />

        <ModeCard 
          title="Học theo ECO Task"
          description="26 nhiệm vụ chuẩn PMI cần nắm vững."
          iconName="checkmark-done-circle"
          color="#06D6A0"
          onPress={() => router.push('/eco-task-practice')}
        />

        {/* Special Practice Mode */}
        <View style={[styles.sectionHeader, { marginTop: Theme.spacing.l }]}>
          <Text style={styles.sectionTitle}>Củng cố Kiến thức</Text>
          <Ionicons name="shield-checkmark-outline" size={20} color={Theme.colors.warning} />
        </View>
        
        <ModeCard 
          title="Làm lại Câu Sai"
          description="Tập trung khắc phục các lỗ hổng kiến thức."
          iconName="flash"
          color={Theme.colors.accent}
          onPress={() => router.push('/review-incorrect')}
        />

        <ModeCard 
          title="Lịch sử Học tập"
          description="Xem lại chi tiết tất cả các bài thi đã làm."
          iconName="calendar"
          color={Theme.colors.textLight}
          onPress={() => router.push('/exam-history')}
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: Theme.colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.textLight,
    marginTop: 2,
  },
  classChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Theme.spacing.l,
  },
  classChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: Theme.colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  classChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  noClassText: {
    fontSize: 14,
    color: Theme.colors.textLight,
    fontStyle: 'italic',
    marginBottom: Theme.spacing.l,
  },
  headerRight: {
    padding: 8,
  },
  summaryCard: {
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xl,
    marginBottom: Theme.spacing.xl,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  summaryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTitle: {
    color: Theme.colors.textInverse,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: Theme.spacing.m,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Theme.borderRadius.l,
    padding: Theme.spacing.m,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: Theme.colors.textInverse,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    height: '70%',
    alignSelf: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.m,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: Theme.colors.text,
    letterSpacing: -0.3,
  },
  radarCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.l,
    padding: Theme.spacing.l,
    marginBottom: Theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  radarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.l,
    gap: 8,
  },
  radarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  domainRow: {
    marginBottom: Theme.spacing.m,
  },
  domainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  noClassText: {
    fontSize: 14,
    color: Theme.colors.textLight,
    fontStyle: 'italic',
    marginBottom: Theme.spacing.l,
  },
  classCardContainer: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: Theme.borderRadius.l,
    padding: Theme.spacing.m,
    marginBottom: Theme.spacing.l,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  classCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.m,
    gap: 10,
    paddingHorizontal: 4,
  },
  classIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  classCardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  emptyClassAssignment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: Theme.spacing.m,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: Theme.borderRadius.m,
    justifyContent: 'center',
  },
  emptyClassAssignmentText: {
    color: Theme.colors.textLight,
    fontSize: 13,
    fontStyle: 'italic',
  },
  domainName: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  domainLevel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  radarAdvice: {
    fontSize: 12,
    color: Theme.colors.textLight,
    fontStyle: 'italic',
    marginTop: Theme.spacing.s,
  }
});
