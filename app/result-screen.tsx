import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Theme } from '../constants/theme';
import { CustomButton } from '../components/CustomButton';
import { Ionicons } from '@expo/vector-icons';
import { examStorage } from '../services/storage';
import { RadarChart } from '../components/RadarChart';

export default function ResultScreen() {
  const [examData, setExamData] = React.useState<any>(null);

  React.useEffect(() => {
    const loadData = () => {
      const data = examStorage.getExamData();
      if (data) setExamData(data);
    };
    loadData();
  }, []);

  if (!examData) return <View style={styles.loading}><Text>Đang tải kết quả...</Text></View>;
  
  // Chuẩn hóa dữ liệu: Hỗ trợ cả cấu trúc cũ (flat) và mới (nested in results)
  const results = examData.results || {
    total: examData.totalQuestions || 0,
    correct: examData.correctAnswers || 0,
    percentage: examData.percentage || 0,
    pass: examData.pass || (examData.percentage >= 70),
    domainStats: examData.domainStats || examData.domainBreakdown || {}
  };
  
  const { total, correct, percentage, pass, domainStats = {} } = results;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Pass/Fail Banner */}
        <View style={[styles.resultCard, { backgroundColor: pass ? 'rgba(38, 194, 129, 0.1)' : 'rgba(235, 77, 75, 0.1)' }]}>
          <Ionicons 
            name={pass ? "checkmark-circle" : "close-circle"} 
            size={80} 
            color={pass ? Theme.colors.success : Theme.colors.error} 
          />
          <Text style={[styles.resultStatus, { color: pass ? Theme.colors.success : Theme.colors.error }]}>
            {pass ? "CONGRATULATIONS!" : "KEEP TRYING!"}
          </Text>
          <Text style={styles.resultSubStatus}>
            {pass ? "You have passed the simulated exam." : "You did not reach the 70% threshold."}
          </Text>
        </View>



        {/* Radar Analysis Chart */}
        <Text style={styles.sectionTitle}>PMI Domain Balance</Text>
        <RadarChart 
          data={{
            people: (domainStats['People']?.correct / domainStats['People']?.total * 100) || 0,
            process: (domainStats['Process']?.correct / domainStats['Process']?.total * 100) || 0,
            business: (domainStats['Business Environment']?.correct / domainStats['Business Environment']?.total * 100) || 0,
          }} 
        />

        {/* Score Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={[styles.statValue, { color: Theme.colors.primary }]}>{percentage.toFixed(0)}%</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Correct</Text>
            <Text style={styles.statValue}>{correct}/{total}</Text>
          </View>
        </View>

        {/* Domain Analysis */}
        <Text style={styles.sectionTitle}>Domain Analysis</Text>
        {Object.entries(domainStats).map(([domain, stats]: [string, any]) => {
          const domainPercent = (stats.correct / stats.total) * 100;
          return (
            <View key={domain} style={styles.domainCard}>
              <View style={styles.domainHeader}>
                <Text style={styles.domainName}>{domain}</Text>
                <Text style={styles.domainScore}>{domainPercent.toFixed(0)}%</Text>
              </View>
              <View style={styles.progressBg}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${domainPercent}%`, backgroundColor: domainPercent >= 70 ? Theme.colors.success : Theme.colors.warning }
                  ]} 
                />
              </View>
              <Text style={styles.domainDetail}>{stats.correct} correct out of {stats.total} questions</Text>
            </View>
          );
        })}

        <View style={styles.actionButtons}>
          <CustomButton 
            title="Review Questions" 
            onPress={() => router.push('/review-screen')} 
            type="outline"
            style={styles.actionBtn}
          />
          <CustomButton 
            title="Back to Dashboard" 
            onPress={() => router.replace('/(tabs)')} 
            style={styles.actionBtn}
          />
        </View>

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
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  content: { padding: Theme.spacing.l, paddingBottom: 40 },
  resultCard: {
    alignItems: 'center',
    padding: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.l,
    marginBottom: Theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  resultStatus: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: Theme.spacing.m,
  },
  resultSubStatus: {
    fontSize: 14,
    color: Theme.colors.textLight,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.l,
    marginBottom: Theme.spacing.xl,
  },
  statBox: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.l,
    borderRadius: Theme.borderRadius.m,
    alignItems: 'center',
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Theme.colors.textLight,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  sectionTitle: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: 'bold',
    marginBottom: Theme.spacing.m,
    color: Theme.colors.text,
  },
  domainCard: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.l,
    borderRadius: Theme.borderRadius.m,
    marginBottom: Theme.spacing.m,
    elevation: 1,
  },
  domainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  domainName: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  domainScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  progressBg: {
    height: 8,
    backgroundColor: Theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  domainDetail: {
    fontSize: 12,
    color: Theme.colors.textLight,
  },
  actionButtons: {
    marginTop: Theme.spacing.xl,
    gap: Theme.spacing.m,
  },
  actionBtn: {
    width: '100%',
  }
});
