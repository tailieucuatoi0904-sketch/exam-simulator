import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, Alert, ScrollView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Theme } from '../constants/theme';
import { QuestionCard } from '../components/QuestionCard';
import { ProgressBar } from '../components/ProgressBar';
import { calculateScore, expandCaseSetQuestions } from '../services/examEngine';
import { Ionicons } from '@expo/vector-icons';
import { firebaseService } from '../services/firebaseService';

export default function AssignmentExamScreen() {
  const params = useLocalSearchParams();
  const assignmentId = params.id as string;
  
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Đang khởi tạo...');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [showGrid, setShowGrid] = useState(false);
  
  // Review Mode States
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [scoreInfo, setScoreInfo] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      if (!assignmentId) {
        if (isMounted) {
          Alert.alert("Lỗi", "Không tìm thấy thông tin bài tập.");
          router.back();
        }
        return;
      }

      setLoading(true);
      setLoadingText('Đang kết nối...');
      
      const withTimeout = (promise: Promise<any>, timeoutMs: number) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))
        ]);
      };

      try {
        // 1. Lấy metadata bài tập
        const allAssigns = await withTimeout(firebaseService.getAllAssignments(), 8000);
        const meta = allAssigns.find((a: any) => a.id === assignmentId);
        
        if (!meta) {
          if (isMounted) {
            setLoading(false);
            Alert.alert("Lỗi", "Bài tập không tồn tại.");
            router.back();
          }
          return;
        }

        // 2. Kiểm tra trạng thái nộp bài (Review Mode Check)
        if (isMounted) setLoadingText('Kiểm tra lịch sử...');
        const submission = await withTimeout(firebaseService.getAssignmentSubmission(assignmentId), 5000).catch(() => null);

        // 3. Tải câu hỏi
        if (isMounted) setLoadingText('Đang tải câu hỏi...');
        let qs = await withTimeout(firebaseService.getAssignmentQuestions(assignmentId), 15000);
        
        if (!qs || qs.length === 0) {
          if (isMounted) {
            setLoading(false);
            Alert.alert("Lỗi", "Nội dung bài tập đang trống.");
            router.back();
          }
          return;
        }

        if (isMounted) {
          if (submission) {
            // Chế độ CHỮA BÀI
            setIsReviewMode(true);
            setScoreInfo({
              score: submission.score,
              correct: submission.correct,
              total: submission.total,
              submittedAt: submission.submittedAt
            });
            setUserAnswers(submission.answers || {});
          } else {
            // Chế độ LÀM BÀI - Kiểm tra deadline
            const deadline = new Date(meta.deadline);
            if (deadline < new Date()) {
              setLoading(false);
              Alert.alert('Hết hạn', 'Bài tập này đã quá hạn nộp.');
              router.back();
              return;
            }
          }
          setAssignment({ ...meta, questions: qs });
        }
      } catch (error: any) {
        console.error("Lỗi khởi tạo:", error);
        if (isMounted) {
          setLoading(false);
          Alert.alert("Thông báo", "Không thể tải bài tập. Vui lòng thử lại.");
          router.back();
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();
    return () => { isMounted = false; };
  }, [assignmentId]);

  const handleSelectOption = (optionId: string) => {
    if (isReviewMode) return; // Không cho chọn trong mode review
    const currentQuestion = assignment?.questions[currentIndex];
    if (!currentQuestion) return;

    if (currentQuestion.type === 'single' || currentQuestion.type === 'hotspot' || currentQuestion.type === 'fill_blank') {
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
    const currentQuestion = assignment?.questions[currentIndex];
    if (!currentQuestion) return;
    setFlags(prev => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }));
  };

  const handleInteractiveAnswer = (answer: any) => {
    if (isReviewMode) return;
    const currentQuestion = assignment?.questions[currentIndex];
    if (!currentQuestion) return;
    setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const confirmSubmit = () => {
    if (isReviewMode) {
      router.back();
      return;
    }
    const total = assignment?.questions.length || 0;
    const answered = Object.keys(userAnswers).length;
    const unanswered = total - answered;
    
    let message = unanswered > 0 
      ? `Bạn chưa làm xong ${unanswered} câu. Vẫn muốn nộp bài?` 
      : `Bạn đã hoàn thành ${total} câu. Xác nhận nộp bài?`;

    if (Platform.OS === 'web') {
      if (window.confirm(message)) finishExam();
    } else {
      Alert.alert("Xác nhận", message, [
        { text: "Làm tiếp", style: "cancel" },
        { text: "Nộp bài", onPress: finishExam }
      ]);
    }
  };

  const finishExam = async () => {
    if (!assignment) return;
    
    setLoading(true);
    setLoadingText('Đang nộp bài...');
    try {
      const scoreResults = calculateScore(assignment.questions, userAnswers);
      const examData = { userAnswers, results: scoreResults };
      
      const success = await Promise.race([
        firebaseService.submitAssignment(assignmentId, examData),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 12000))
      ]).catch(() => false);
      
      setLoading(false);
      const msg = success 
        ? `Nộp bài thành công! Điểm: ${scoreResults.percentage.toFixed(1)}%` 
        : "Nộp bài thất bại, vui lòng thử lại.";

      if (Platform.OS === 'web') {
        window.alert(msg);
        if (success) router.replace('/(tabs)');
      } else {
        Alert.alert("Kết quả", msg, [
          { text: "Về trang chủ", onPress: () => success && router.replace('/(tabs)') }
        ]);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi nộp bài.");
    }
  };

  if (loading || !assignment) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={{ marginTop: 12, color: Theme.colors.textLight, fontWeight: '500' }}>{loadingText}</Text>
      </View>
    );
  }

  const currentQuestion = assignment.questions[currentIndex];
  const progress = (currentIndex + 1) / assignment.questions.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.exitButton}>
          <Ionicons name="close" size={24} color={Theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {isReviewMode ? `Chữa bài: ${assignment.title}` : assignment.title}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowGrid(true)} style={styles.gridButton}>
          <Ionicons name="grid-outline" size={24} color={Theme.colors.primary} />
        </TouchableOpacity>

        {isReviewMode ? (
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreBadgeText}>{scoreInfo?.score?.toFixed(1)}%</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={confirmSubmit} style={styles.submitHeaderButton}>
            <Text style={styles.submitHeaderButtonText}>Nộp bài</Text>
          </TouchableOpacity>
        )}
      </View>

      <ProgressBar 
        progress={progress} 
        height={4} 
        color={isReviewMode ? Theme.colors.secondary : Theme.colors.primary} 
      />

      <ScrollView style={styles.content}>
        {isReviewMode && (
          <View style={styles.reviewBanner}>
            <Ionicons name="information-circle" size={18} color={Theme.colors.secondary} />
            <Text style={styles.reviewBannerText}>
              Chế độ chữa bài: Bạn đúng {scoreInfo?.correct}/{scoreInfo?.total} câu.
            </Text>
          </View>
        )}
        
        <QuestionCard 
          key={currentQuestion.id}
          questionId={currentQuestion.id}
          questionNumber={currentIndex + 1}
          totalQuestions={assignment.questions.length}
          questionText={currentQuestion.questionText}
          options={currentQuestion.options || []}
          selectedOptionIds={userAnswers[currentQuestion.id] || []}
          onSelectOption={handleSelectOption}
          isMultipleChoice={currentQuestion.type === 'multiple' || currentQuestion.type === 'case_set'}
          type={currentQuestion.type}
          mediaUrl={currentQuestion.mediaUrl}
          interactiveData={currentQuestion.interactiveData}
          onInteractiveAnswer={handleInteractiveAnswer}
          showAnswers={isReviewMode}
          correctAnswers={currentQuestion.correctAnswers || []}
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.navButton, currentIndex === 0 && styles.disabledNav]} 
          onPress={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
        >
          <Ionicons name="chevron-back" size={24} color={currentIndex === 0 ? Theme.colors.border : Theme.colors.primary} />
          <Text style={[styles.navText, currentIndex === 0 && { color: Theme.colors.border }]}>Trước</Text>
        </TouchableOpacity>
        
        {!isReviewMode && (
          <TouchableOpacity style={styles.flagButton} onPress={toggleFlag}>
            <Ionicons name={flags[currentQuestion.id] ? "flag" : "flag-outline"} size={24} color={flags[currentQuestion.id] ? Theme.colors.warning : Theme.colors.textLight} />
          </TouchableOpacity>
        )}

        {currentIndex === assignment.questions.length - 1 ? (
          <TouchableOpacity 
            style={[styles.navButton, { backgroundColor: isReviewMode ? Theme.colors.primary : Theme.colors.success, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 }]} 
            onPress={isReviewMode ? () => router.back() : confirmSubmit}
          >
            <Text style={[styles.navText, { color: '#fff' }]}>{isReviewMode ? 'Thoát' : 'Nộp bài'}</Text>
            <Ionicons name={isReviewMode ? "exit-outline" : "checkmark-done"} size={20} color="#fff" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.navButton} onPress={() => setCurrentIndex(prev => Math.min(assignment.questions.length - 1, prev + 1))}>
            <Text style={styles.navText}>Tiếp</Text>
            <Ionicons name="chevron-forward" size={24} color={Theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

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
                {assignment.questions.map((q: Question, index: number) => {
                  const isAnswered = !!userAnswers[q.id];
                  const isCurrent = index === currentIndex;
                  return (
                    <TouchableOpacity key={q.id} style={[styles.gridItem, isAnswered && styles.gridItemAnswered, isCurrent && styles.gridItemCurrent]} onPress={() => { setCurrentIndex(index); setShowGrid(false); }}>
                      <Text style={[styles.gridItemText, (isAnswered || isCurrent) && { color: Theme.colors.textInverse }]}>{index + 1}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Theme.colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Theme.spacing.l, paddingVertical: Theme.spacing.m, backgroundColor: Theme.colors.surface, elevation: 4, zIndex: 10 },
  titleContainer: { flex: 1, marginHorizontal: 12 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.text, textAlign: 'center' },
  exitButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: Theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  gridButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: Theme.colors.background, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  scoreBadge: { backgroundColor: Theme.colors.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  scoreBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  submitHeaderButton: { backgroundColor: Theme.colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  submitHeaderButtonText: { color: Theme.colors.textInverse, fontWeight: '800', fontSize: 13, textTransform: 'uppercase' },
  content: { flex: 1, padding: Theme.spacing.m },
  reviewBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255, 159, 67, 0.1)', padding: 10, borderRadius: 8, marginBottom: 12 },
  reviewBannerText: { fontSize: 13, color: Theme.colors.secondary, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Theme.spacing.l, paddingVertical: Theme.spacing.m, backgroundColor: Theme.colors.surface, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  navButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(67, 97, 238, 0.05)' },
  disabledNav: { opacity: 0.3 },
  navText: { fontSize: 15, fontWeight: '700', color: Theme.colors.primary },
  flagButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.03)', justifyContent: 'center', alignItems: 'center' },
  gridModalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  gridModalContent: { backgroundColor: Theme.colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '80%', padding: Theme.spacing.l },
  gridModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.l, borderBottomWidth: 1, borderBottomColor: Theme.colors.border, paddingBottom: Theme.spacing.m },
  gridModalTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.text },
  gridScroll: { paddingBottom: 20 },
  gridWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' },
  gridItem: { width: 45, height: 45, borderRadius: 8, backgroundColor: Theme.colors.border, justifyContent: 'center', alignItems: 'center' },
  gridItemAnswered: { backgroundColor: Theme.colors.primary },
  gridItemCurrent: { backgroundColor: Theme.colors.secondary, transform: [{ scale: 1.1 }] },
  gridItemText: { fontWeight: 'bold', color: Theme.colors.text },
});
