import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { examStorage } from '../services/storage';
import { CustomButton } from '../components/CustomButton';

export default function ReviewScreen() {
  const [examData, setExamData] = React.useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  React.useEffect(() => {
    const loadData = () => {
      const data = examStorage.getExamData();
      if (data) setExamData(data);
    };
    loadData();
  }, []);

  if (!examData) return <View style={styles.loading}><Text>Đang tải dữ liệu chữa bài...</Text></View>;
  
  const { questions = [], userAnswers = {} } = examData;

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chữa Bài Chi Tiết</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <Ionicons name="alert-circle-outline" size={64} color={Theme.colors.textLight} />
          <Text style={{ marginTop: 16, textAlign: 'center', color: Theme.colors.textLight }}>
            Rất tiếc, bài thi này được thực hiện trên phiên bản cũ nên không lưu chi tiết câu hỏi để chữa bài.
          </Text>
          <CustomButton title="Quay lại" onPress={() => router.back()} style={{ marginTop: 24, width: '100%' }} />
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentIndex];
  const userAnswer = userAnswers[currentQuestion?.id] || [];
  
  const isCorrect = 
    userAnswer.length === currentQuestion.correctAnswers.length && 
    userAnswer.every((val: string) => currentQuestion.correctAnswers.includes(val));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chữa Bài Chi Tiết</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.questionHeader}>
          <Text style={styles.qNumber}>Câu {currentIndex + 1} / {questions.length}</Text>
          <View style={[styles.statusBadge, { backgroundColor: isCorrect ? 'rgba(38, 194, 129, 0.1)' : 'rgba(235, 77, 75, 0.1)' }]}>
            <Text style={[styles.statusText, { color: isCorrect ? Theme.colors.success : Theme.colors.error }]}>
              {isCorrect ? 'Đúng' : 'Sai'}
            </Text>
          </View>
        </View>

        <Text style={styles.questionText}>{currentQuestion.questionText}</Text>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option: any) => {
            const isSelected = userAnswer.includes(option.id);
            const isRightAnswer = currentQuestion.correctAnswers.includes(option.id);
            
            let borderColor = Theme.colors.border;
            let bgColor = Theme.colors.surface;
            
            if (isRightAnswer) {
              borderColor = Theme.colors.success;
              bgColor = 'rgba(38, 194, 129, 0.05)';
            } else if (isSelected && !isRightAnswer) {
              borderColor = Theme.colors.error;
              bgColor = 'rgba(235, 77, 75, 0.05)';
            }

            return (
              <View key={option.id} style={[styles.optionBox, { borderColor, backgroundColor: bgColor }]}>
                <View style={styles.optionHeader}>
                   <Text style={[styles.optionId, isRightAnswer && { color: Theme.colors.success }, isSelected && !isRightAnswer && { color: Theme.colors.error }]}>
                    {option.id}
                  </Text>
                  {isRightAnswer && <Ionicons name="checkmark-circle" size={20} color={Theme.colors.success} />}
                  {isSelected && !isRightAnswer && <Ionicons name="close-circle" size={20} color={Theme.colors.error} />}
                </View>
                <Text style={styles.optionText}>{option.text}</Text>
              </View>
            );
          })}
        </View>

        {/* Explanation Box */}
        <View style={styles.explanationBox}>
          <View style={styles.explanationHeader}>
            <Ionicons name="bulb" size={20} color={Theme.colors.primary} />
            <Text style={styles.explanationTitle}>Giải thích chi tiết</Text>
          </View>
          <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
        </View>

        <View style={styles.metaBox}>
          <Text style={styles.metaText}>Domain: {currentQuestion.domain}</Text>
          <Text style={styles.metaText}>Task: {currentQuestion.ecoTask}</Text>
        </View>
      </ScrollView>

      {/* Navigation Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.navBtn, currentIndex === 0 && { opacity: 0.3 }]} 
          onPress={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
        >
          <Ionicons name="chevron-back" size={24} color={Theme.colors.primary} />
          <Text style={styles.navBtnText}>Câu trước</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navBtn, currentIndex === questions.length - 1 && { opacity: 0.3 }]} 
          onPress={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
          disabled={currentIndex === questions.length - 1}
        >
          <Text style={styles.navBtnText}>Câu sau</Text>
          <Ionicons name="chevron-forward" size={24} color={Theme.colors.primary} />
        </TouchableOpacity>
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.l,
    backgroundColor: Theme.colors.surface,
    elevation: 2,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.text },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  content: { padding: Theme.spacing.l, paddingBottom: 40 },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.m,
  },
  qNumber: { fontSize: 14, fontWeight: 'bold', color: Theme.colors.textLight },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.text,
    lineHeight: 26,
    marginBottom: Theme.spacing.xl,
  },
  optionsContainer: { gap: Theme.spacing.m, marginBottom: Theme.spacing.xl },
  optionBox: {
    padding: Theme.spacing.m,
    borderRadius: Theme.borderRadius.m,
    borderWidth: 2,
  },
  optionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  optionId: { fontWeight: 'bold', fontSize: 16 },
  optionText: { fontSize: 15, color: Theme.colors.text },
  explanationBox: {
    backgroundColor: 'rgba(67, 97, 238, 0.05)',
    padding: Theme.spacing.l,
    borderRadius: Theme.borderRadius.m,
    marginBottom: Theme.spacing.l,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.primary,
  },
  explanationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  explanationTitle: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.primary },
  explanationText: { fontSize: 14, color: Theme.colors.text, lineHeight: 22 },
  metaBox: {
    padding: Theme.spacing.m,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: Theme.borderRadius.s,
  },
  metaText: { fontSize: 12, color: Theme.colors.textLight, marginBottom: 2 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Theme.spacing.l,
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navBtnText: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.primary },
});
