import { mockPmpQuestions } from './mockData';
import { Question, ExamConfig } from './types';
import { examStorage } from './storage';

export interface ExamSession {
  questions: Question[];
  timeLimit: number;
  config: ExamConfig;
}

/**
 * Thuật toán sinh đề thi
 */
export const generateExam = (config: ExamConfig): ExamSession => {
  let pool = [...mockPmpQuestions];

  // 1. Lọc theo chế độ
  if (config.mode === 'domain' && config.selectedDomains) {
    pool = pool.filter(q => config.selectedDomains?.includes(q.domain));
  } else if (config.mode === 'eco' && config.selectedEcoTask) {
    pool = pool.filter(q => q.ecoTask === config.selectedEcoTask);
  } else if (config.mode === 'incorrect') {
    const incorrectIds = examStorage.getIncorrectQuestions();
    pool = pool.filter(q => incorrectIds.includes(q.id));
  }

  // 2. Logic gạch bỏ câu đã làm đúng (Giả lập: Hiện tại dùng toàn bộ pool)
  // Sau này khi có Firebase, pool = pool.filter(q => !userCorrectIds.includes(q.id))

  let finalQuestions: Question[] = [];

  if (config.mode === 'custom') {
    // 3. Trộn đề theo tỷ lệ PMI (33% People, 41% Process, 26% Business)
    const peopleCount = Math.floor(config.questionCount * 0.33);
    const processCount = Math.floor(config.questionCount * 0.41);
    const businessCount = config.questionCount - peopleCount - processCount;

    const peoplePool = shuffle(pool.filter(q => q.domain === 'People'));
    const processPool = shuffle(pool.filter(q => q.domain === 'Process'));
    const businessPool = shuffle(pool.filter(q => q.domain === 'Business Environment'));

    finalQuestions = [
      ...peoplePool.slice(0, peopleCount),
      ...processPool.slice(0, processCount),
      ...businessPool.slice(0, businessCount)
    ];
  } else {
    // Các chế độ khác chỉ đơn giản là lấy ngẫu nhiên từ pool đã lọc
    finalQuestions = shuffle(pool).slice(0, config.questionCount);
  }

  // Trộn lại lần cuối để các domain không nằm cụm một chỗ
  finalQuestions = shuffle(finalQuestions);

  return {
    questions: finalQuestions,
    timeLimit: config.timeLimit,
    config
  };
};

/**
 * Hàm chấm điểm bài thi
 */
export const calculateScore = (questions: Question[], userAnswers: Record<string, string[]>) => {
  let correctCount = 0;
  const domainStats: Record<string, { total: number, correct: number }> = {};

  questions.forEach(q => {
    // Khởi tạo stats cho domain nếu chưa có
    if (!domainStats[q.domain]) {
      domainStats[q.domain] = { total: 0, correct: 0 };
    }
    domainStats[q.domain].total += 1;

    const answers = userAnswers[q.id] || [];
    const isCorrect = 
      answers.length === q.correctAnswers.length && 
      answers.every(val => q.correctAnswers.includes(val));

    if (isCorrect) {
      correctCount += 1;
      domainStats[q.domain].correct += 1;
    }
  });

  const percentage = (correctCount / questions.length) * 100;

  return {
    total: questions.length,
    correct: correctCount,
    percentage,
    pass: percentage >= 70, // Ngưỡng đỗ mặc định 70%
    domainStats
  };
};

/**
 * Hàm xáo trộn mảng
 */
function shuffle<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}
