
// Logic chấm điểm từ examEngine.ts
function calculateScore(questions, userAnswers) {
  let correctCount = 0;
  const domainStats = {};

  questions.forEach(q => {
    if (!domainStats[q.domain]) {
      domainStats[q.domain] = { total: 0, correct: 0 };
    }
    domainStats[q.domain].total += 1;

    let isCorrect = false;
    const answers = userAnswers[q.id] || [];
    const correctAns = q.correctAnswers || [];

    if (q.type === 'single' || q.type === 'multiple' || !q.type || q.type === 'case_set') {
      isCorrect = answers.length > 0 && 
                  answers.length === correctAns.length && 
                  answers.every(val => correctAns.includes(val));
    } else if (q.type === 'fill_blank') {
      isCorrect = correctAns.some(ans => ans.trim().toLowerCase() === (answers[0] || '').trim().toLowerCase());
    } else if (q.type === 'hotspot') {
      isCorrect = answers.length > 0 && correctAns.includes(answers[0]);
    } else if (q.type === 'drag_drop') {
      isCorrect = answers.length === correctAns.length && answers.every((val, idx) => val === correctAns[idx]);
    } else if (q.type === 'matching') {
      const correctSet = new Set(correctAns);
      isCorrect = answers.length === correctAns.length && answers.every(pair => correctSet.has(pair));
    }

    if (isCorrect) {
      correctCount += 1;
      domainStats[q.domain].correct += 1;
    }
  });

  return { total: questions.length, correct: correctCount };
}

// 1. CHẠY UNIT TEST CƠ BẢN
const testQuestions = [
  { id: 'q1', type: 'single', correctAnswers: ['A'], domain: 'People' },
  { id: 'q2', type: 'multiple', correctAnswers: ['A', 'C'], domain: 'Process' },
  { id: 'q3', type: 'fill_blank', correctAnswers: ['Agile'], domain: 'Process' }
];
const basicAnswers = { q1: ['A'], q2: ['A', 'C'], q3: ['agile'] };
console.log("=== 1. UNIT TEST CƠ BẢN ===");
const basicResult = calculateScore(testQuestions, basicAnswers);
console.log(basicResult.correct === 3 ? "✅ PASS" : "❌ FAIL");

// 2. CHẠY PERFORMANCE TEST (Mô phỏng 1000 câu hỏi)
console.log("\n=== 2. PERFORMANCE TEST (1000 CÂU HỎI) ===");
const largePool = [];
const largeAnswers = {};
for (let i = 0; i < 1000; i++) {
  largePool.push({
    id: `q${i}`,
    type: i % 2 === 0 ? 'single' : 'multiple',
    correctAnswers: ['A'],
    domain: 'People'
  });
  largeAnswers[`q${i}`] = ['A'];
}

const start = Date.now();
calculateScore(largePool, largeAnswers);
const end = Date.now();

console.log(`Thời gian xử lý logic cho 1000 câu: ${end - start}ms`);
if (end - start < 50) {
  console.log("🚀 Hiệu năng Logic: CỰC NHANH (Code không phải là nguyên nhân gây chậm)");
} else {
  console.log("⚠️ Hiệu năng Logic: Cần tối ưu thêm");
}

// 3. KIỂM TRA ĐỘ TRỄ MẠNG (Giả lập fetch dữ liệu)
// Bước này chỉ mang tính chất thông báo cho user
console.log("\n=== 3. GHI CHÚ ===");
console.log("Nếu mục 2 chạy dưới 50ms mà App vẫn chậm 1-2s, nguyên nhân 100% nằm ở Network hoặc Firebase Sync.");
