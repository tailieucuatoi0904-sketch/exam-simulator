import { Question } from './types';

const tasks = [
  "1. Develop a common vision",
  "2. Manage conflicts",
  "3. Lead the project team",
  "4. Engage stakeholders",
  "5. Align stakeholder expectations",
  "6. Manage stakeholder expectations",
  "7. Help ensure knowledge transfer",
  "8. Plan and manage communication",
  "9. Develop an integrated project management plan and plan delivery",
  "10. Develop and manage project scope",
  "11. Help ensure value-based delivery",
  "12. Plan and manage resources",
  "13. Plan and manage procurement",
  "14. Plan and manage finance",
  "15. Plan and optimize quality of products/deliverables",
  "16. Plan and manage schedule",
  "17. Evaluate project status",
  "18. Manage project closure",
  "19. Define and establish project governance",
  "20. Plan and manage project compliance",
  "21. Manage and control changes",
  "22. Remove impediments and manage issues",
  "23. Plan and manage risk",
  "24. Continuous improvement",
  "25. Support organizational change",
  "26. Evaluate external business environment changes"
];

const getDomain = (index: number) => {
  if (index < 7) return "People";
  if (index < 23) return "Process";
  return "Business Environment";
};

const generateMockQuestions = (): Question[] => {
  const allQuestions: Question[] = [];
  
  tasks.forEach((task, tIndex) => {
    const domain = getDomain(tIndex);
    
    for (let i = 1; i <= 10; i++) {
      allQuestions.push({
        id: `q-${tIndex + 1}-${i}`,
        domain: domain,
        ecoTask: task,
        questionText: `[Câu hỏi ${i}] Đây là câu hỏi tình huống mẫu cho Task: ${task}. Trong trường hợp này, Project Manager nên làm gì để tối ưu hóa kết quả dự án?`,
        type: i % 5 === 0 ? 'multiple' : 'single', // Cứ mỗi 5 câu có 1 câu chọn nhiều đáp án
        options: [
          { id: 'A', text: `Phương án A cho câu hỏi về ${task}` },
          { id: 'B', text: `Phương án B: Đưa ra giải pháp chủ động` },
          { id: 'C', text: `Phương án C: Thảo luận với Stakeholders` },
          { id: 'D', text: `Phương án D: Cập nhật tài liệu dự án` }
        ],
        correctAnswers: i % 5 === 0 ? ['B', 'C'] : ['B'],
        explanation: `Giải thích cho câu hỏi ${i} của Task ${tIndex + 1}: PM cần tuân thủ quy trình chuẩn của PMI để xử lý tình huống liên quan đến ${task}.`
      });
    }
  });
  
  return allQuestions;
};

export const bigMockQuestions = generateMockQuestions();

// Hàm lấy toàn bộ câu hỏi (bao gồm cả câu hỏi mẫu và câu hỏi custom nếu có)
export const getAllQuestions = () => {
  return bigMockQuestions;
};
