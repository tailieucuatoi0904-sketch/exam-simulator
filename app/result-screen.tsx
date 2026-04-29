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
        <View style={[styles.resultCard, { backgroundColor: pass ? 'rgba(38, 194, 129, 0.08)' : 'rgba(235, 77, 75, 0.08)' }]}>
          <View style={[styles.statusIconBg, { backgroundColor: pass ? Theme.colors.success : Theme.colors.error }]}>
            <Ionicons 
              name={pass ? "checkmark-sharp" : "close-sharp"} 
              size={50} 
              color="#fff" 
            />
          </View>
          <Text style={[styles.resultStatus, { color: pass ? Theme.colors.success : Theme.colors.error }]}>
            {pass ? "CONGRATULATIONS!" : "KEEP TRYING!"}
          </Text>
          <Text style={styles.resultSubStatus}>
            {pass ? "You have passed the simulated exam." : "You did not reach the 70% threshold."}
          </Text>
        </View>

        {/* Score Stats Section */}
        <View style={styles.summaryStats}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>FINAL SCORE</Text>
            <Text style={[styles.summaryValue, { color: pass ? Theme.colors.success : Theme.colors.error }]}>
              {percentage.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>CORRECT</Text>
            <Text style={styles.summaryValue}>{correct} <Text style={{ fontSize: 14, color: Theme.colors.textLight }}>/ {total}</Text></Text>
          </View>
        </View>

        {/* Radar Analysis Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Performance by Domain</Text>
          <RadarChart 
            data={{
              people: (domainStats['People']?.correct / domainStats['People']?.total * 100) || 0,
              process: (domainStats['Process']?.correct / domainStats['Process']?.total * 100) || 0,
              business: (domainStats['Business Environment']?.correct / domainStats['Business Environment']?.total * 100) || 0,
            }} 
          />
        </View>

        {/* Domain Breakdown */}
        <Text style={styles.sectionTitle}>Detailed Breakdown</Text>
        {Object.entries(domainStats).map(([domain, stats]: [string, any]) => {
          const domainPercent = (stats.correct / stats.total) * 100;
          const isDomainPass = domainPercent >= 70;
          return (
            <View key={domain} style={styles.domainCard}>
              <View style={styles.domainHeader}>
                <View>
                  <Text style={styles.domainName}>{domain}</Text>
                  <Text style={styles.domainDetail}>{stats.correct} correct of {stats.total} questions</Text>
                </View>
                <View style={[styles.domainBadge, { backgroundColor: isDomainPass ? 'rgba(38, 194, 129, 0.1)' : 'rgba(241, 196, 15, 0.1)' }]}>
                  <Text style={[styles.domainBadgeText, { color: isDomainPass ? Theme.colors.success : Theme.colors.warning }]}>
                    {domainPercent.toFixed(0)}%
                  </Text>
                </View>
              </View>
              <View style={styles.progressBg}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${domainPercent}%`, backgroundColor: isDomainPass ? Theme.colors.success : Theme.colors.warning }
                  ]} 
                />
              </View>
            </View>
          );
        })}

        <View style={styles.actionButtons}>
          <CustomButton 
            title="Review Questions" 
            onPress={() => router.push('/review-screen')} 
            type="primary"
            style={styles.actionBtn}
          />
          <CustomButton 
            title="Back to Dashboard" 
            onPress={() => router.replace('/(tabs)')} 
            type="outline"
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
    borderColor: 'rgba(0,0,0,0.03)',
  },
  statusIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.m,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  resultStatus: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: Theme.spacing.s,
    letterSpacing: 1,
  },
  resultSubStatus: {
    fontSize: 14,
    color: Theme.colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.l,
    borderRadius: Theme.borderRadius.m,
    marginBottom: Theme.spacing.xl,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    alignItems: 'center',
  },
  summaryBox: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: '60%',
    backgroundColor: Theme.colors.border,
  },
  summaryLabel: {
    fontSize: 10,
    color: Theme.colors.textLight,
    marginBottom: 4,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  chartSection: {
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Theme.spacing.m,
    color: Theme.colors.text,
    paddingLeft: 4,
  },
  domainCard: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.l,
    borderRadius: Theme.borderRadius.m,
    marginBottom: Theme.spacing.m,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  domainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  domainName: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 2,
  },
  domainDetail: {
    fontSize: 12,
    color: Theme.colors.textLight,
  },
  domainBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  domainBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  progressBg: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionButtons: {
    marginTop: Theme.spacing.xl,
    gap: Theme.spacing.m,
  },
  actionBtn: {
    width: '100%',
  }
});
