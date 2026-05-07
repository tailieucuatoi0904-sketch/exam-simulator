import { Question, normalizeDomain } from './examEngine';

// Định dạng dữ liệu trả về cho từng Domain
export interface DomainProficiency {
  domain: string;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  level: 'Needs Improvement' | 'Below Target' | 'Target' | 'Above Target';
  levelColor: string; // Hex color để vẽ UI
}

// Xếp loại dựa trên tỷ lệ phần trăm
export const getProficiencyLevel = (percentage: number): DomainProficiency['level'] => {
  if (percentage < 60) return 'Needs Improvement';
  if (percentage < 70) return 'Below Target';
  if (percentage < 85) return 'Target';
  return 'Above Target';
};

// Lấy màu sắc chuẩn PMI cho từng Level
export const getLevelColor = (level: DomainProficiency['level']): string => {
  switch (level) {
    case 'Needs Improvement': return '#EF476F'; // Đỏ/Hồng đậm
    case 'Below Target': return '#FFD166'; // Vàng cam
    case 'Target': return '#06D6A0'; // Xanh lá
    case 'Above Target': return '#118AB2'; // Xanh dương
    default: return '#cbd5e1';
  }
};

/**
 * Hàm phân tích toàn bộ lịch sử thi và trả về bản đồ năng lực theo từng Domain.
 * @param history Mảng các bài thi đã làm từ Firebase (exam_history)
 */
export const calculateDomainProficiency = (history: any[]): Record<string, DomainProficiency> => {
  // 1. Khởi tạo kho đếm
  const rawStats: Record<string, { total: number; correct: number }> = {
    'People': { total: 0, correct: 0 },
    'Process': { total: 0, correct: 0 },
    'Business Environment': { total: 0, correct: 0 },
    'Other': { total: 0, correct: 0 },
  };

  // 2. Quét toàn bộ bài thi
  history.forEach(exam => {
    // Ưu tiên lấy questions từ results nếu có (đảm bảo đồng bộ)
    const questions = exam.questions || exam.results?.questions || [];
    const userAnswers = exam.userAnswers || {};
    
    if (questions.length === 0) return;

    questions.forEach((q: Question) => {
      const normalizedDomain = normalizeDomain(q.domain || '');
      const userAns = userAnswers[q.id] || [];
      const correctAns = q.correctAnswers || [];
      
      // Logic kiểm tra câu đúng (hỗ trợ các loại câu hỏi cơ bản)
      let isCorrect = false;
      if (userAns.length > 0 && userAns.length === correctAns.length) {
        isCorrect = userAns.every((val: string) => correctAns.includes(val));
      }

      // Cộng dồn vào domain tương ứng (nếu không nằm trong 3 domain chính thì vào 'Other')
      const targetDomain = rawStats[normalizedDomain] ? normalizedDomain : 'Other';
      rawStats[targetDomain].total += 1;
      if (isCorrect) {
        rawStats[targetDomain].correct += 1;
      }
    });
  });

  // 3. Tính toán và Trả về kết quả
  const result: Record<string, DomainProficiency> = {};
  
  Object.keys(rawStats).forEach(domain => {
    const stat = rawStats[domain];
    const percentage = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
    const level = stat.total > 0 ? getProficiencyLevel(percentage) : 'Needs Improvement';

    result[domain] = {
      domain,
      totalQuestions: stat.total,
      correctAnswers: stat.correct,
      percentage,
      level,
      levelColor: getLevelColor(level)
    };
  });

  return result;
};
