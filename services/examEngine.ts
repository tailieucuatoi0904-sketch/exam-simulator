import { mockPmpQuestions } from './mockData';
import { Question, ExamConfig } from './types';
import { examStorage } from './storage';

/**
 * Giãn các câu hỏi loại case_set thành nhiều sub-question riêng lẻ.
 * Mỗi sub-question sẽ mang theo thông tin scenario của parent để hiển thị.
 * Với Phương án A: Mỗi sub-question = 1 điểm riêng biệt.
 */
export const expandCaseSetQuestions = (questions: Question[]): Question[] => {
  const result: Question[] = [];
  for (const q of questions) {
    const type = (q.type || '').toLowerCase();
    if (type !== 'case_set') {
      result.push(q);
      continue;
    }
    // Parse interactiveData
    let data: any = {};
    try {
      data = typeof q.interactiveData === 'string'
        ? JSON.parse(q.interactiveData)
        : (q.interactiveData || {});
    } catch { }

    const scenario: string = data.scenario || '';
    const subQuestions: any[] = data.subQuestions || [];

    if (subQuestions.length === 0) {
      // Fallback: treat as single question if no subquestions defined
      result.push(q);
      continue;
    }

    // Expand: tạo một Question entry cho mỗi sub-question
    subQuestions.forEach((sq: any, idx: number) => {
      // Xác định type thực tế của sub-question (mặc định là single nếu không có)
      const subType = sq.type || (sq.options?.length > 0 ? 'single' : 'fill_blank');
      
      result.push({
        id: `${q.id}__sq${idx}`,          // ID duy nhất
        domain: q.domain,
        ecoTask: q.ecoTask,
        questionText: sq.questionText || `Câu hỏi ${idx + 1}`,
        options: sq.options || [],
        correctAnswers: sq.correctAnswers || [],
        explanation: sq.explanation || q.explanation || '',
        type: subType as any,             
        interactiveData: JSON.stringify({ scenario, isExpanded: true }), // Đóng gói scenario vào JSON string
        mediaUrl: q.mediaUrl,
        // Đánh dấu đây là sub-question (số thứ tự trong case set)
        _caseSetTitle: `[Tình huống ${idx + 1}/${subQuestions.length}] `,
      } as any);
    });
  }
  return result;
};

export interface ExamSession {
  questions: Question[];
  timeLimit: number;
  config: ExamConfig;
}

/**
 * Thuật toán sinh đề thi
 */
export const generateExam = (config: ExamConfig, excludeIds: string[] = [], questionsPool?: Question[], forceIncludeIds?: string[]): ExamSession => {
  let pool = questionsPool || [...mockPmpQuestions];

  // 1. Lọc theo chế độ hoặc Domains đã chọn
  if (config.selectedDomains && config.selectedDomains.length > 0) {
    pool = pool.filter(q => config.selectedDomains?.includes(q.domain));
  } else if (config.mode === 'domain' && config.selectedDomains) {
    pool = pool.filter(q => config.selectedDomains?.includes(q.domain));
  } else if (config.mode === 'eco' && config.selectedEcoTask) {
    const targetTask = config.selectedEcoTask.trim().toLowerCase();
    pool = pool.filter(q => (q.ecoTask || '').trim().toLowerCase() === targetTask);
  } else if (config.mode === 'incorrect') {
    const incorrectIds = forceIncludeIds || examStorage.getIncorrectQuestions();
    pool = pool.filter(q => incorrectIds.includes(q.id));
  }

  // 2. Gạch bỏ câu đã làm đúng (theo yêu cầu của học viên)
  if (excludeIds.length > 0) {
    pool = pool.filter(q => !excludeIds.includes(q.id));
  }

  let finalQuestions: Question[] = [];

  if (config.mode === 'custom' && !config.selectedDomains) {
    // 3. Trộn đề theo tỷ lệ PMI (Chỉ khi không chọn domain cụ thể)
    const peopleTarget = Math.floor(config.questionCount * 0.33);
    const processTarget = Math.floor(config.questionCount * 0.41);
    const businessTarget = config.questionCount - peopleTarget - processTarget;

    const peoplePool = shuffle(pool.filter(q => q.domain.includes('People')));
    const processPool = shuffle(pool.filter(q => q.domain.includes('Process')));
    const businessPool = shuffle(pool.filter(q => q.domain.includes('Business')));

    finalQuestions = [
      ...peoplePool.slice(0, peopleTarget),
      ...processPool.slice(0, processTarget),
      ...businessPool.slice(0, businessTarget)
    ];

    // Nếu không đủ theo tỷ lệ, bù đắp từ phần còn lại của pool
    if (finalQuestions.length < config.questionCount) {
      const remaining = shuffle(pool.filter(q => !finalQuestions.find(fq => fq.id === q.id)));
      finalQuestions = [...finalQuestions, ...remaining.slice(0, config.questionCount - finalQuestions.length)];
    }
  } else {
    // Pick randomly from the filtered pool
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
  let totalPoints = 0;
  const domainStats: Record<string, { total: number, correct: number }> = {};

  questions.forEach(q => {
    // Khởi tạo stats cho domain nếu chưa có
    if (!domainStats[q.domain]) {
      domainStats[q.domain] = { total: 0, correct: 0 };
    }

    const answers = userAnswers[q.id] || [];
    const correctAns = q.correctAnswers || [];
    const type = (q.type || '').toLowerCase();

    if (type === 'case_set') {
      let data: any = {};
      try { data = typeof q.interactiveData === 'string' ? JSON.parse(q.interactiveData) : (q.interactiveData || {}); } catch { }
      const subQuestions: any[] = data.subQuestions || [];
      
      if (subQuestions.length > 0) {
        // Mỗi câu hỏi con tính là 1 điểm riêng
        const subAnswers = (answers && typeof answers === 'object' && !Array.isArray(answers)) ? answers : {};
        
        subQuestions.forEach(sq => {
          totalPoints += 1;
          domainStats[q.domain].total += 1;
          
          const sqAns = (subAnswers as any)[sq.id] || [];
          const sqCorrect = sq.correctAnswers || [];
          const isSqCorrect = Array.isArray(sqAns) && sqAns.length > 0 && 
                             sqAns.length === sqCorrect.length && 
                             sqAns.every((v: string) => sqCorrect.includes(v));
          
          if (isSqCorrect) {
            correctCount += 1;
            domainStats[q.domain].correct += 1;
          }
        });
      } else {
        // Fallback
        totalPoints += 1;
        domainStats[q.domain].total += 1;
        const safeAnswers = Array.isArray(answers) ? answers : [];
        const isCorrect = safeAnswers.length > 0 && 
                        safeAnswers.length === correctAns.length && 
                        safeAnswers.every(val => correctAns.includes(val));
        if (isCorrect) {
          correctCount += 1;
          domainStats[q.domain].correct += 1;
        }
      }
    } else {
      // Câu hỏi bình thường
      totalPoints += 1;
      domainStats[q.domain].total += 1;
      let isCorrect = false;

      if (type === 'single' || type === 'multiple' || !type) {
        isCorrect = answers.length > 0 && 
                    answers.length === correctAns.length && 
                    answers.every(val => correctAns.includes(val));
      } else if (type === 'fill_blank') {
        isCorrect = correctAns.some(ans => ans.trim().toLowerCase() === (answers[0] || '').trim().toLowerCase());
      } else if (type === 'hotspot') {
        isCorrect = answers.length > 0 && correctAns.includes(answers[0]);
      } else if (type === 'drag_drop') {
        isCorrect = answers.length === correctAns.length && answers.every((val, idx) => val === correctAns[idx]);
      } else if (type === 'matching') {
        const correctSet = new Set(correctAns);
        isCorrect = answers.length === correctAns.length && answers.every(pair => correctSet.has(pair));
      }

      if (isCorrect) {
        correctCount += 1;
        domainStats[q.domain].correct += 1;
      }
    }
  });

  const percentage = totalPoints > 0 ? (correctCount / totalPoints) * 100 : 0;

  return {
    total: totalPoints,
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
