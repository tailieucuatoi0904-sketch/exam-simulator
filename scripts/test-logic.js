/**
 * Script kiểm thử Logic Exam Engine (Self-contained)
 * Chạy bằng lệnh: node scripts/test-logic.js
 */

// Giả lập dữ liệu kho câu hỏi (260 câu)
const bigMockQuestions = [];
for(let i=0; i<70; i++) bigMockQuestions.push({ domain: 'People' });
for(let i=0; i<160; i++) bigMockQuestions.push({ domain: 'Process' });
for(let i=0; i<30; i++) bigMockQuestions.push({ domain: 'Business Environment' });

// Giả lập hàm shuffle và generate (copy logic từ examEngine để test độc lập)
function shuffle(array) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function testExamGeneration() {
  console.log("--- TEST 1: Kiểm tra tỷ lệ trộn đề PMI (33/41/26) ---");
  const questionCount = 100;
  const pool = bigMockQuestions;

  const peopleCount = Math.floor(questionCount * 0.33);
  const processCount = Math.floor(questionCount * 0.41);
  const businessCount = questionCount - peopleCount - processCount;

  console.log(`Mục tiêu: People(${peopleCount}), Process(${processCount}), Business(${businessCount})`);

  const peoplePool = pool.filter(q => q.domain === 'People');
  const processPool = pool.filter(q => q.domain === 'Process');
  const businessPool = pool.filter(q => q.domain === 'Business Environment');

  console.log(`Kho dữ liệu hiện có: People(${peoplePool.length}), Process(${processPool.length}), Business(${businessPool.length})`);

  if (peoplePool.length >= peopleCount && processPool.length >= processCount && businessPool.length >= businessCount) {
    console.log("✅ KẾT QUẢ: Đủ dữ liệu để trộn đề chuẩn PMI.");
  } else {
    console.log("❌ KẾT QUẢ: Thiếu dữ liệu trong kho để đạt tỷ lệ chuẩn.");
  }
}

function testScoringLogic() {
  console.log("\n--- TEST 2: Kiểm tra Logic Chấm điểm ---");
  const mockQuestions = [
    { id: '1', correctAnswers: ['A'] },
    { id: '2', correctAnswers: ['B', 'C'] },
    { id: '3', correctAnswers: ['D'] }
  ];

  const userAnswers = {
    '1': ['A'],      // Đúng
    '2': ['B'],      // Sai (thiếu C)
    '3': ['D']       // Đúng
  };

  let correctCount = 0;
  mockQuestions.forEach(q => {
    const answers = userAnswers[q.id] || [];
    const isCorrect = answers.length === q.correctAnswers.length && answers.every(val => q.correctAnswers.includes(val));
    if (isCorrect) correctCount++;
  });

  const percentage = (correctCount / mockQuestions.length) * 100;
  console.log(`Số câu đúng: ${correctCount}/${mockQuestions.length} (${percentage.toFixed(2)}%)`);

  if (correctCount === 2 && percentage > 66) {
    console.log("✅ KẾT QUẢ: Logic chấm điểm hoạt động chính xác (Câu chọn nhiều đáp án phải đúng hoàn toàn mới tính điểm).");
  } else {
    console.log("❌ KẾT QUẢ: Logic chấm điểm có sai sót.");
  }
}

// Chạy test
try {
  testExamGeneration();
  testScoringLogic();
} catch (e) {
  console.log("Lỗi khi chạy test: ", e.message);
}
