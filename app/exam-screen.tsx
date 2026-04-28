import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, Alert, ScrollView, Platform, StatusBar } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Theme } from '../constants/theme';
import { QuestionCard } from '../components/QuestionCard';
import { ProgressBar } from '../components/ProgressBar';
import { generateExam, ExamConfig, Question, calculateScore } from '../services/examEngine';
import { Ionicons } from '@expo/vector-icons';
import { examStorage } from '../services/storage';
import { firebaseService } from '../services/firebaseService';

export default function ExamScreen() {
  const params = useLocalSearchParams();
  
  // Parse config from params
  const config = useMemo(() => ({
    mode: params.mode as any || 'custom',
    questionCount: parseInt(params.questionCount as string) || 50,
    timeLimit: parseInt(params.timeLimit as string) || 60,
    selectedDomains: params.selectedDomains ? (params.selectedDomains as string).split(',') : undefined,
    selectedEcoTask: params.selectedEcoTask as string || undefined,
  }), [params]);

  const [session, setSession] = useState<{ questions: Question[], timeLimit: number } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(config.timeLimit * 60); // seconds
  const [showGrid, setShowGrid] = useState(false); // Trạng thái ẩn hiện lưới câu hỏi

  // Initialize Exam - Chỉ chạy 1 lần duy nhất khi Mount
  useEffect(() => {
    if (!session) {
      const newSession = generateExam(config);
      setSession(newSession);
    }
  }, []); // Bỏ config khỏi dependency để tránh re-shuffle khi render lại

  // Timer Logic
  useEffect(() => {
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const handleSelectOption = (optionId: string) => {
    const currentQuestion = session?.questions[currentIndex];
    if (!currentQuestion) return;

    if (currentQuestion.type === 'single') {
      setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: [optionId] }));
    } else {
      const currentSelected = userAnswers[currentQuestion.id] || [];
      const newSelected = currentSelected.includes(optionId)
        ? currentSelected.filter(id => id !== optionId)
        : [...currentSelected, optionId];
      setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: newSelected }));
    }
  };

  const toggleFlag = () => {
    const currentQuestion = session?.questions[currentIndex];
    if (!currentQuestion) return;
    setFlags(prev => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }));
  };

  const handleAutoSubmit = () => {
    Alert.alert("Hết giờ!", "Hệ thống tự động nộp bài làm của bạn.");
    finishExam();
  };

  const confirmSubmit = () => {
    const total = session!.questions.length;
    const answered = Object.keys(userAnswers).length;
    const unanswered = total - answered;
    
    let message = "";
    if (unanswered > 0) {
      message = `Bạn vẫn còn ${unanswered} câu chưa chọn đáp án. Bạn có chắc chắn muốn nộp bài ngay không?`;
    } else {
      message = `Chúc mừng! Bạn đã hoàn thành tất cả ${total} câu hỏi. Bạn có muốn nộp bài để xem kết quả ngay không?`;
    }

    if (Platform.OS === 'web') {
      const confirm = window.confirm(message);
      if (confirm) finishExam();
    } else {
      Alert.alert(
        "Xác nhận nộp bài",
        message,
        [
          { text: "Làm tiếp", style: "cancel" },
          { text: "Nộp bài ngay", onPress: finishExam }
        ]
      );
    }
  };

  const finishExam = async () => {
    if (!session) return;
    
    try {
      const scoreResults = calculateScore(session.questions, userAnswers);
      
      // Phân tích câu đúng/sai để cập nhật danh sách "Làm lại câu sai"
      const incorrectIds: string[] = [];
      const correctIds: string[] = [];
      
      session.questions.forEach(q => {
        const answers = userAnswers[q.id] || [];
        const isCorrect = answers.length === q.correctAnswers.length && answers.every(val => q.correctAnswers.includes(val));
        if (isCorrect) {
          correctIds.push(q.id);
        } else {
          incorrectIds.push(q.id);
        }
      });

      // Lưu câu sai lên Cloud, xóa câu đúng khỏi danh sách sai trên Cloud
      if (incorrectIds.length > 0) {
        await firebaseService.saveIncorrectQuestions(incorrectIds);
      }
      
      for (const id of correctIds) {
        await firebaseService.removeIncorrectQuestion(id);
      }

      const examData = {
        questions: session.questions,
        userAnswers: userAnswers,
        results: scoreResults
      };
      
      examStorage.saveExamData(examData);
      examStorage.saveToHistory(examData);
      
      // MỚI: Lưu lên Firebase Cloud
      await firebaseService.saveExamResult(examData);
      
      router.replace('/result-screen');
    } catch (error) {
      console.error("Lỗi khi nộp bài:", error);
      Alert.alert("Lỗi", "Không thể nộp bài. Vui lòng thử lại.");
    }
  };

  if (!session) return <View style={styles.loading}><Text>Đang khởi tạo đề thi...</Text></View>;

  const currentQuestion = session.questions[currentIndex];
  const progress = (currentIndex + 1) / session.questions.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with Timer & Exit */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.exitButton}>
          <Ionicons name="close" size={24} color={Theme.colors.text} />
        </TouchableOpacity>
        
        <View style={styles.timerContainer}>
          <Ionicons name="time-outline" size={20} color={timeLeft < 300 ? Theme.colors.error : Theme.colors.primary} />
          <Text style={[styles.timerText, timeLeft < 300 && { color: Theme.colors.error }]}>
            {formatTime(timeLeft)}
          </Text>
        </View>

        <TouchableOpacity onPress={() => setShowGrid(true)} style={styles.gridButton}>
          <Ionicons name="grid-outline" size={24} color={Theme.colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={confirmSubmit} style={styles.submitHeaderButton}>
          <Text style={styles.submitHeaderButtonText}>Nộp bài</Text>
        </TouchableOpacity>
      </View>

      <ProgressBar progress={progress} height={4} />

      <ScrollView style={styles.content}>
        <QuestionCard 
          questionNumber={currentIndex + 1}
          totalQuestions={session.questions.length}
          questionText={currentQuestion.questionText}
          options={currentQuestion.options}
          selectedOptionIds={userAnswers[currentQuestion.id] || []}
          onSelectOption={handleSelectOption}
          isMultipleChoice={currentQuestion.type === 'multiple'}
        />
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.navButton, currentIndex === 0 && styles.disabledNav]} 
          onPress={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
        >
          <Ionicons name="chevron-back" size={24} color={currentIndex === 0 ? Theme.colors.border : Theme.colors.primary} />
          <Text style={[styles.navText, currentIndex === 0 && { color: Theme.colors.border }]}>Trước</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.flagButton} onPress={toggleFlag}>
          <Ionicons 
            name={flags[currentQuestion.id] ? "flag" : "flag-outline"} 
            size={24} 
            color={flags[currentQuestion.id] ? Theme.colors.warning : Theme.colors.textLight} 
          />
        </TouchableOpacity>

        {currentIndex === session.questions.length - 1 ? (
          <TouchableOpacity 
            style={[styles.navButton, { backgroundColor: Theme.colors.success, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 }]} 
            onPress={confirmSubmit}
          >
            <Text style={[styles.navText, { color: '#fff' }]}>Nộp bài</Text>
            <Ionicons name="checkmark-done" size={20} color="#fff" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => setCurrentIndex(prev => Math.min(session.questions.length - 1, prev + 1))}
          >
            <Text style={styles.navText}>Tiếp</Text>
            <Ionicons name="chevron-forward" size={24} color={Theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Question Grid Modal */}
      {showGrid && (
        <View style={styles.gridModalOverlay}>
          <View style={styles.gridModalContent}>
            <View style={styles.gridModalHeader}>
              <Text style={styles.gridModalTitle}>Danh sách câu hỏi</Text>
              <TouchableOpacity onPress={() => setShowGrid(false)}>
                <Ionicons name="close" size={24} color={Theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.gridScroll}>
              <View style={styles.gridWrapper}>
                {session.questions.map((q, index) => {
                  const isAnswered = !!userAnswers[q.id];
                  const isFlagged = !!flags[q.id];
                  const isCurrent = index === currentIndex;
                  
                  return (
                    <TouchableOpacity 
                      key={q.id} 
                      style={[
                        styles.gridItem,
                        isAnswered && styles.gridItemAnswered,
                        isFlagged && styles.gridItemFlagged,
                        isCurrent && styles.gridItemCurrent
                      ]}
                      onPress={() => {
                        setCurrentIndex(index);
                        setShowGrid(false);
                      }}
                    >
                      <Text style={[
                        styles.gridItemText,
                        (isAnswered || isCurrent) && { color: Theme.colors.textInverse }
                      ]}>
                        {index + 1}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.gridLegend}>
              <View style={styles.legendItem}><View style={[styles.legendDot, styles.gridItemAnswered]} /><Text style={styles.legendText}>Đã làm</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, styles.gridItemFlagged]} /><Text style={styles.legendText}>Cắm cờ</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, styles.gridItemCurrent]} /><Text style={styles.legendText}>Hiện tại</Text></View>
            </View>
          </View>
        </View>
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
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.l,
    paddingVertical: Theme.spacing.m,
    backgroundColor: Theme.colors.surface,
  },
  exitButton: { padding: 4 },
  gridButton: { padding: 4 },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(67, 97, 238, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  submitHeaderButton: {
    backgroundColor: Theme.colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  submitHeaderButtonText: {
    color: Theme.colors.textInverse,
    fontWeight: 'bold',
    fontSize: 14,
  },
  progressBar: {
    height: 4,
  },
  content: {
    flex: 1,
    padding: Theme.spacing.l,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.l,
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  disabledNav: { opacity: 0.5 },
  navText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  flagButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Grid Modal Styles
  gridModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  gridModalContent: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    padding: Theme.spacing.l,
  },
  gridModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    paddingBottom: Theme.spacing.m,
  },
  gridModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  gridScroll: {
    paddingBottom: 20,
  },
  gridWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
  },
  gridItem: {
    width: 45,
    height: 45,
    borderRadius: 8,
    backgroundColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItemAnswered: {
    backgroundColor: Theme.colors.primary,
  },
  gridItemFlagged: {
    borderWidth: 2,
    borderColor: Theme.colors.warning,
  },
  gridItemCurrent: {
    backgroundColor: Theme.colors.secondary,
    transform: [{ scale: 1.1 }],
  },
  gridItemText: {
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  gridLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    marginTop: Theme.spacing.m,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: Theme.colors.textLight,
  }
});
