import { bigMockQuestions } from './questionsData';

// Mock dữ liệu người dùng
export const mockUsers = [
  {
    id: '1',
    username: 'admin',
    password: '123',
    role: 'admin',
    name: 'Quản trị viên'
  },
  {
    id: '2',
    username: 'student',
    password: '123',
    role: 'student',
    name: 'Học viên Test'
  }
];

// Mock dữ liệu câu hỏi PMP (Sử dụng kho 260 câu mới tạo)
export const mockPmpQuestions = bigMockQuestions;

// Danh sách Domains và Tasks (Dùng cho dropdown/picker)
export const pmpDomains = ['People', 'Process', 'Business Environment'];
export const pmpEcoTasks = [
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
