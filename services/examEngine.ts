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
export const generateExam = (config: ExamConfig, excludeIds: string[] = [], questionsPool?: Question[]): ExamSession => {
  let pool = questionsPool || [...mockPmpQuestions];

  // 1. Lọc theo chế độ
  if (config.mode === 'domain' && config.selectedDomains) {
    pool = pool.filter(q => config.selectedDomains?.includes(q.domain));
  } else if (config.mode === 'eco' && config.selectedEcoTask) {
    const targetTask = config.selectedEcoTask.trim().toLowerCase();
    pool = pool.filter(q => (q.ecoTask || '').trim().toLowerCase() === targetTask);
  } else if (config.mode === 'incorrect') {
    const incorrectIds = examStorage.getIncorrectQuestions();
    pool = pool.filter(q => incorrectIds.includes(q.id));
  }

  // 2. Gạch bỏ câu đã làm đúng (theo yêu cầu của học viên)
  if (excludeIds.length > 0) {
    pool = pool.filter(q => !excludeIds.includes(q.id));
  }

  let finalQuestions: Question[] = [];

  if (config.mode === 'custom') {
    // 3. Trộn đề theo tỷ lệ PMI (33% People, 41% Process, 26% Business)
    const peopleTarget = Math.floor(config.questionCount * 0.33);
    const processTarget = Math.floor(config.questionCount * 0.41);
    const businessTarget = config.questionCount - peopleTarget - processTarget;

    const peoplePool = shuffle(pool.filter(q => q.domain === 'People'));
    const processPool = shuffle(pool.filter(q => q.domain === 'Process'));
    const businessPool = shuffle(pool.filter(q => q.domain === 'Business Environment'));

    // Lấy theo tỷ lệ
    let selected = [
      ...peoplePool.slice(0, peopleTarget),
      ...processPool.slice(0, processTarget),
      ...businessPool.slice(0, businessTarget)
    ];

    // Nếu vẫn chưa đủ số lượng yêu cầu (do một số domain bị thiếu hụt), 
    // bốc thêm từ những câu còn lại trong pool chung
    if (selected.length < config.questionCount) {
      const selectedIds = selected.map(s => s.id);
      const remainingPool = shuffle(pool.filter(q => !selectedIds.includes(q.id)));
      const extraNeeded = config.questionCount - selected.length;
      selected = [...selected, ...remainingPool.slice(0, extraNeeded)];
    }
    
    finalQuestions = selected;
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
