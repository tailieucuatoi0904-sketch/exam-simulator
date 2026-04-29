import React from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
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
    totalPoolQuestions: 0
  });

  const user = auth.currentUser;
  const userEmail = user?.email || 'Học viên';

  // Tự động cập nhật stats mỗi khi quay lại màn hình này
  useFocusEffect(
    React.useCallback(() => {
      const loadStats = async () => {
        // CHỈ lấy từ Firebase Cloud để đảm bảo tính đồng bộ chuẩn 100%
        const [cloudHistory, cloudIncorrects, cloudQuestions] = await Promise.all([
          firebaseService.getUserHistory(),
          firebaseService.getIncorrectQuestions(),
          firebaseService.getQuestionsFromCloud()
        ]);
        
        const baseStats = {
          totalExams: cloudHistory.length,
          passRate: 0,
          incorrectCount: cloudIncorrects.length,
          totalPoolQuestions: cloudQuestions.length
        };

        if (cloudHistory.length > 0) {
          const passCount = cloudHistory.filter((h: any) => h.pass).length;
          const rate = (passCount / cloudHistory.length) * 100;
          setStats({
            ...baseStats,
            passRate: Math.round(rate)
          });
        } else {
          setStats(baseStats);
        }
      };
      loadStats();
    }, [])
  );

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        await signOut(auth); // Đăng xuất khỏi Firebase Auth
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Chào mừng! 👋</Text>
            <Text style={styles.subtitle}>{userEmail}</Text>
          </View>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color={Theme.colors.primary} />
          </View>
        </View>

        {/* Progress Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="stats-chart" size={24} color={Theme.colors.textInverse} />
            <Text style={styles.summaryTitle}>Tổng quan ôn tập</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.totalExams}</Text>
              <Text style={styles.statLabel}>Đề đã làm</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.passRate}%</Text>
              <Text style={styles.statLabel}>Tỷ lệ Pass</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.totalPoolQuestions}</Text>
              <Text style={styles.statLabel}>Kho câu hỏi</Text>
            </View>
          </View>
        </View>

        {/* Practice Modes Section */}
        <Text style={styles.sectionTitle}>Trạm Ôn Tập (Quiz Builder)</Text>
        
        <ModeCard 
          title="Tạo Đề Tùy Chỉnh"
          description="Thiết kế đề thi riêng theo Domain, số lượng câu hỏi và thời gian."
          iconName="color-wand"
          color={Theme.colors.primary}
          onPress={() => router.push('/quiz-builder')}
        />

        <ModeCard 
          title="Luyện tập theo Domain"
          description="Tập trung giải bài tập theo 3 Domain (People, Process, Business)."
          iconName="library"
          color={Theme.colors.secondary}
          onPress={() => router.push('/domain-practice')}
        />

        <ModeCard 
          title="Luyện tập theo ECO Task"
          description="Ôn luyện chuyên sâu theo từng trong số 26 ECO Tasks chuẩn PMI."
          iconName="list-circle"
          color={Theme.colors.success}
          onPress={() => router.push('/eco-task-practice')}
        />

        {/* Special Practice Mode */}
        <Text style={[styles.sectionTitle, { marginTop: Theme.spacing.l }]}>Ôn luyện Đặc biệt</Text>
        
        <ModeCard 
          title="Làm Lại Câu Sai"
          description="Chế độ bốc lại các câu đã làm sai để củng cố kiến thức."
          iconName="refresh-circle"
          color={Theme.colors.warning}
          onPress={() => router.push('/review-incorrect')}
        />

        <ModeCard 
          title="Lịch sử Bài Thi"
          description="Xem lại chi tiết điểm số, số câu đúng/sai và lời giải của các đề đã nộp."
          iconName="time"
          color={Theme.colors.textLight}
          onPress={() => router.push('/exam-history')}
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
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.l,
    padding: Theme.spacing.l,
    marginBottom: Theme.spacing.xl,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.m,
  },
  summaryTitle: {
    color: Theme.colors.textInverse,
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: 'bold',
    marginLeft: Theme.spacing.s,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Theme.borderRadius.m,
    padding: Theme.spacing.m,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: Theme.colors.textInverse,
    fontSize: Theme.typography.h2.fontSize,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Theme.typography.caption.fontSize,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
