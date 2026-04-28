import React from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { firebaseService } from '../../services/firebaseService';
import { ActivityIndicator } from 'react-native';

export default function AnalyticsScreen() {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState({
    total: 0,
    pass: 0,
    fail: 0,
    avgScore: 0
  });

  React.useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const allHistory = await firebaseService.getAllExamHistory();
        
        let passCount = 0;
        let totalScore = 0;

        allHistory.forEach((item: any) => {
          // Tính toán linh hoạt cho cả dữ liệu cũ và mới
          const percentage = item.results?.percentage ?? item.percentage ?? 0;
          const isPass = item.results?.pass ?? item.pass ?? (percentage >= 70);
          
          if (isPass) passCount++;
          totalScore += percentage;
        });

        setData({
          total: allHistory.length,
          pass: passCount,
          fail: allHistory.length - passCount,
          avgScore: allHistory.length > 0 ? (totalScore / allHistory.length) : 0
        });
      } catch (e) {
        console.error("Lỗi load analytics:", e);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const passPercent = data.total > 0 ? Math.round((data.pass / data.total) * 100) : 0;
  const failPercent = data.total > 0 ? (100 - passPercent) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Phân tích & Thống kê</Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.chartPlaceholder}>
              <Ionicons name="pie-chart" size={64} color={Theme.colors.primary} />
              <Text style={styles.chartText}>Tỷ lệ Pass/Fail Hệ thống</Text>
              <View style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: Theme.colors.success }]} />
                <Text style={styles.legendLabel}>Pass ({passPercent}%)</Text>
                <View style={[styles.dot, { backgroundColor: Theme.colors.error }]} />
                <Text style={styles.legendLabel}>Fail ({failPercent}%)</Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryVal}>{data.avgScore.toFixed(1)}%</Text>
                <Text style={styles.summaryLabel}>Điểm TB</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryVal}>{data.total}</Text>
                <Text style={styles.summaryLabel}>Tổng lượt thi</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Thông tin lưu ý</Text>
              <Text style={styles.infoText}>
                Dữ liệu phân tích dựa trên toàn bộ kết quả thi đã lưu trên Cloud. 
                Các bài thi cũ có thể thiếu chi tiết từng Domain nhưng vẫn được tính vào tỷ lệ chung.
              </Text>
            </View>
          </ScrollView>
        )}
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
  },
  title: { fontSize: Theme.typography.h3.fontSize, fontWeight: 'bold', color: Theme.colors.text },
  content: { padding: Theme.spacing.l },
  chartPlaceholder: {
    backgroundColor: Theme.colors.surface,
    padding: 30,
    borderRadius: Theme.borderRadius.l,
    alignItems: 'center',
    marginBottom: Theme.spacing.l,
    elevation: 3,
  },
  chartText: { fontSize: 16, fontWeight: 'bold', marginVertical: Theme.spacing.m },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, color: Theme.colors.textLight },
  summaryRow: { flexDirection: 'row', gap: Theme.spacing.m, marginBottom: Theme.spacing.l },
  summaryBox: { flex: 1, backgroundColor: Theme.colors.surface, padding: Theme.spacing.l, borderRadius: Theme.borderRadius.m, alignItems: 'center', elevation: 2 },
  summaryVal: { fontSize: 24, fontWeight: 'bold', color: Theme.colors.primary },
  summaryLabel: { fontSize: 12, color: Theme.colors.textLight },
  card: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.l,
    borderRadius: Theme.borderRadius.m,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: Theme.spacing.m },
  infoText: { fontSize: 14, color: Theme.colors.textLight, lineHeight: 20 },
});
