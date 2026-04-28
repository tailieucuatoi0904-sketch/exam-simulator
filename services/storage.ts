/**
 * Dịch vụ lưu trữ dữ liệu bài thi ổn định cho cả Web và Mobile
 * Thay thế cho AsyncStorage đang bị lỗi bundle trên Web
 */

export const examStorage = {
  saveExamData: (data: any) => {
    try {
      const jsonValue = JSON.stringify(data);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('last_exam_data', jsonValue);
      }
      // Lưu thêm vào bộ nhớ tạm của biến nếu cần
      (global as any).lastExamData = data;
    } catch (e) {
      console.error("Lỗi lưu trữ:", e);
    }
  },

  getExamData: () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const jsonValue = window.localStorage.getItem('last_exam_data');
        return jsonValue ? JSON.parse(jsonValue) : (global as any).lastExamData;
      }
      return (global as any).lastExamData;
    } catch (e) {
      console.error("Lỗi lấy dữ liệu:", e);
      return null;
    }
  },

  // Lưu một bản ghi vào lịch sử thi
  saveToHistory: (sessionData: any) => {
    try {
      const historyJson = window.localStorage.getItem('exam_history');
      let history = historyJson ? JSON.parse(historyJson) : [];
      
      const newRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        ...sessionData
      };
      
      history.unshift(newRecord); // Cho bài mới nhất lên đầu
      window.localStorage.setItem('exam_history', JSON.stringify(history.slice(0, 50))); // Lưu tối đa 50 bài gần nhất
    } catch (e) {
      console.error("Lỗi lưu lịch sử:", e);
    }
  },

  // Lấy danh sách lịch sử
  getHistory: () => {
    try {
      const historyJson = window.localStorage.getItem('exam_history');
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (e) {
      console.error("Lỗi lấy lịch sử:", e);
      return [];
    }
  },

  // Lưu danh sách câu hỏi sai (không trùng lặp)
  saveIncorrectQuestions: (questionIds: string[]) => {
    try {
      const existingJson = window.localStorage.getItem('incorrect_questions');
      let existing: string[] = existingJson ? JSON.parse(existingJson) : [];
      
      // Hợp nhất và loại bỏ trùng lặp
      const updated = Array.from(new Set([...existing, ...questionIds]));
      window.localStorage.setItem('incorrect_questions', JSON.stringify(updated));
    } catch (e) {
      console.error("Lỗi lưu câu sai:", e);
    }
  },

  // Lấy danh sách ID câu sai
  getIncorrectQuestions: (): string[] => {
    try {
      const json = window.localStorage.getItem('incorrect_questions');
      return json ? JSON.parse(json) : [];
    } catch (e) {
      console.error("Lỗi lấy câu sai:", e);
      return [];
    }
  },

  // Xóa một câu khỏi danh sách sai (khi đã làm đúng lại)
  removeIncorrectQuestion: (questionId: string) => {
    try {
      const json = window.localStorage.getItem('incorrect_questions');
      if (!json) return;
      let existing: string[] = JSON.parse(json);
      const updated = existing.filter(id => id !== questionId);
      window.localStorage.setItem('incorrect_questions', JSON.stringify(updated));
    } catch (e) {
      console.error("Lỗi xóa câu sai:", e);
    }
  },

  // Lưu danh sách câu hỏi do Admin import
  saveCustomQuestions: (questions: any[]) => {
    try {
      const existingJson = window.localStorage.getItem('custom_questions');
      let existing = existingJson ? JSON.parse(existingJson) : [];
      const updated = [...existing, ...questions];
      window.localStorage.setItem('custom_questions', JSON.stringify(updated));
    } catch (e) {
      console.error("Lỗi lưu câu hỏi tùy chỉnh:", e);
    }
  },

  // Lấy danh sách câu hỏi tùy chỉnh
  getCustomQuestions: () => {
    try {
      const json = window.localStorage.getItem('custom_questions');
      return json ? JSON.parse(json) : [];
    } catch (e) {
      console.error("Lỗi lấy câu hỏi tùy chỉnh:", e);
      return [];
    }
  }
};
