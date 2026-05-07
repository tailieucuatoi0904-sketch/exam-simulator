import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../../constants/theme';
import { firebaseService } from '../../services/firebaseService';
import { examStorage } from '../../services/storage';

export default function HistoryTab() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        const cloudHistory = await firebaseService.getUserHistory();
        setHistory(cloudHistory);
        setLoading(false);
      };
      loadData();
    }, [])
  );

  const handleViewResult = (item: any) => {
    examStorage.saveExamData(item);
    router.push('/result-screen');
  };

  const handleRetake = (item: any) => {
    const doRetake = () => {
      examStorage.saveExamData(item);
      router.push({
        pathname: '/exam-screen',
        params: {
          mode: 'retake',
          timeLimit: item.results?.timeLimit || item.timeLimit || 60,
          questionCount: item.results?.total || item.totalQuestions || 0
        }
      });
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Bạn có muốn làm lại bài thi này với bộ câu hỏi cũ không?')) {
        doRetake();
      }
    } else {
      Alert.alert(
        'Làm lại bài thi',
        'Bạn có muốn làm lại bài thi này với bộ câu hỏi cũ không?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Bắt đầu', onPress: doRetake }
        ]
      );
    }
  };

  const formatDate = (date: any) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    const percentage = item.results?.percentage ?? item.percentage ?? 0;
    const correct = item.results?.correct ?? item.correctAnswers ?? 0;
    const total = item.results?.total ?? item.totalQuestions ?? 0;
    const isPass = item.results?.pass ?? item.pass ?? (percentage >= 70);

    return (
      <TouchableOpacity style={styles.historyCard} onPress={() => handleViewResult(item)}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
            <View style={styles.summaryInfo}>
              <Text style={styles.statsText}>{correct}/{total} Câu đúng</Text>
              <View style={[styles.badge, { backgroundColor: isPass ? 'rgba(38, 194, 129, 0.1)' : 'rgba(235, 77, 75, 0.1)' }]}>
                <Text style={[styles.badgeText, { color: isPass ? Theme.colors.success : Theme.colors.error }]}>
                  {isPass ? 'PASS' : 'FAIL'}
                </Text>
              </View>
            </View>
          </View>
          <Text style={[styles.percentageText, { color: isPass ? Theme.colors.success : Theme.colors.error }]}>
            {percentage.toFixed(0)}%
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity style={styles.footerBtn} onPress={() => handleRetake(item)}>
            <Ionicons name="refresh-circle" size={18} color={Theme.colors.success} />
            <Text style={[styles.footerBtnText, { color: Theme.colors.success }]}>Làm lại</Text>
          </TouchableOpacity>
          <View style={styles.footerDivider} />
          <TouchableOpacity style={styles.footerBtn} onPress={() => handleViewResult(item)}>
            <Text style={styles.footerBtnText}>Chi tiết</Text>
            <Ionicons name="chevron-forward" size={16} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch sử bài thi</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color={Theme.colors.border} />
              <Text style={styles.emptyText}>Bạn chưa thực hiện bài thi nào.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    padding: Theme.spacing.l,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Theme.colors.text },
  listContent: { padding: Theme.spacing.l },
  historyCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.l,
    marginBottom: Theme.spacing.m,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.m,
  },
  dateText: { fontSize: 13, color: Theme.colors.textLight, fontWeight: '600', marginBottom: 4 },
  summaryInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statsText: { fontSize: 14, color: Theme.colors.text, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  percentageText: { fontSize: 28, fontWeight: '800' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
    paddingTop: Theme.spacing.m,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  footerBtnText: { fontSize: 13, color: Theme.colors.primary, fontWeight: '700' },
  footerDivider: { width: 1, height: 16, backgroundColor: Theme.colors.border },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: Theme.colors.textLight },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: Theme.spacing.m,
    color: Theme.colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  }
});
