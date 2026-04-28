import { db, auth } from '../config/firebaseConfig';
import { ref, push, get, query, orderByChild, set } from 'firebase/database';
import { Question } from './types';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

export const firebaseService = {

  // 0. Tạo tài khoản học viên (Admin tạo)
  // Sử dụng một app instance phụ để tránh làm Admin bị đăng xuất
  createStudentAccount: async (email: string, pass: string, name: string) => {
    let secondaryApp;
    try {
      const config = getApp().options;
      secondaryApp = getApps().find(app => app.name === 'Secondary') || initializeApp(config, 'Secondary');
      const secondaryAuth = getAuth(secondaryApp);
      
      // Tạo user mới
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
      const newUser = userCredential.user;
      
      // Lưu profile vào database
      await firebaseService.saveUserProfile(newUser.uid, {
        email: newUser.email,
        role: 'student',
        displayName: name,
        createdAt: new Date().toISOString()
      });

      // Đăng xuất app phụ ngay lập tức để không xung đột
      await signOut(secondaryAuth);
      return { success: true };
    } catch (e: any) {
      console.error("Lỗi tạo học viên:", e);
      return { success: false, error: e.message };
    }
  },

  // 1. Lưu kết quả thi của học viên lên Cloud
  saveExamResult: async (resultData: any) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('Chưa đăng nhập, bỏ qua lưu Cloud.');
        return null;
      }

      const examRef = ref(db, `exam_history/${user.uid}`);
      const newRecord = {
        userId: user.uid,
        userEmail: user.email || 'unknown',
        date: new Date().toISOString(),
        // Giữ nguyên cấu trúc object 'results' để đồng bộ với logic hiển thị
        results: {
          total: resultData.questions?.length || 0,
          correct: resultData.results?.correct || 0,
          percentage: resultData.results?.percentage || 0,
          pass: resultData.results?.pass || false,
          domainStats: resultData.results?.domainStats || {}
        },
        // Lưu thêm bản sao questions để review
        questions: resultData.questions || [],
        userAnswers: resultData.userAnswers || {}
      };

      await push(examRef, newRecord);
      console.log('✅ Đã lưu kết quả thi lên Firebase!');
      return true;
    } catch (e) {
      console.error("Lỗi lưu kết quả thi:", e);
      return null;
    }
  },

  // 2. Lấy lịch sử thi của học viên hiện tại
  getUserHistory: async () => {
    try {
      const user = auth.currentUser;
      if (!user) return [];

      const historyRef = ref(db, `exam_history/${user.uid}`);
      const snapshot = await get(historyRef);

      if (!snapshot.exists()) return [];

      const data = snapshot.val();
      // Chuyển object thành array và sort theo ngày mới nhất
      return Object.entries(data)
        .map(([id, val]: [string, any]) => ({ id, ...val }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (e) {
      console.error("Lỗi lấy lịch sử thi:", e);
      return [];
    }
  },

  // 3. Lấy TOÀN BỘ lịch sử thi (Dành cho Admin)
  getAllExamHistory: async () => {
    try {
      const allHistoryRef = ref(db, 'exam_history');
      const snapshot = await get(allHistoryRef);

      if (!snapshot.exists()) return [];

      const data = snapshot.val();
      const result: any[] = [];

      // Duyệt qua từng user
      Object.entries(data).forEach(([userId, userHistory]: [string, any]) => {
        Object.entries(userHistory).forEach(([examId, record]: [string, any]) => {
          result.push({ id: examId, userId, ...record });
        });
      });

      // Sort theo ngày mới nhất
      return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (e) {
      console.error("Lỗi lấy toàn bộ lịch sử:", e);
      return [];
    }
  },

  // 4. Lưu profile user (role: admin/student)
  saveUserProfile: async (uid: string, profileData: any) => {
    try {
      const userRef = ref(db, `users/${uid}`);
      await set(userRef, {
        ...profileData,
        createdAt: new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.error("Lỗi lưu profile:", e);
      return false;
    }
  },

  // 5. Lấy profile user (để check role)
  getUserProfile: async (uid: string) => {
    try {
      const userRef = ref(db, `users/${uid}`);
      const snapshot = await get(userRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (e) {
      console.error("Lỗi lấy profile:", e);
      return null;
    }
  },

  // 6. Lấy danh sách TOÀN BỘ người dùng
  getAllUsers: async () => {
    try {
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      if (!snapshot.exists()) return [];
      
      const data = snapshot.val();
      return Object.entries(data).map(([id, val]: [string, any]) => ({
        id,
        ...val,
        name: val.displayName || val.email?.split('@')[0] || 'User'
      }));
    } catch (e) {
      console.error("Lỗi lấy danh sách users:", e);
      return [];
    }
  },

  // 7. Xóa lịch sử thi của MỘT học viên (Admin dọn dẹp theo acc)
  deleteUserHistory: async (uid: string) => {
    try {
      // Xóa cả lịch sử thi và danh sách câu sai trên Cloud
      const userHistoryRef = ref(db, `exam_history/${uid}`);
      const incorrectRef = ref(db, `incorrect_questions/${uid}`);
      
      await Promise.all([
        set(userHistoryRef, null),
        set(incorrectRef, null)
      ]);
      
      return true;
    } catch (e) {
      console.error("Lỗi xóa lịch sử học viên:", e);
      return false;
    }
  },

  // 8. Lưu danh sách câu hỏi sai lên Cloud
  saveIncorrectQuestions: async (questionIds: string[]) => {
    const user = auth.currentUser;
    if (!user || questionIds.length === 0) return;
    try {
      const incorrectRef = ref(db, `incorrect_questions/${user.uid}`);
      // Lấy danh sách cũ
      const snapshot = await get(incorrectRef);
      let currentIds: string[] = snapshot.exists() ? snapshot.val() : [];
      
      // Hợp nhất và loại bỏ trùng lặp
      const newIds = Array.from(new Set([...currentIds, ...questionIds]));
      await set(incorrectRef, newIds);
    } catch (e) {
      console.error("Lỗi lưu câu hỏi sai:", e);
    }
  },

  // 9. Xóa câu hỏi đã làm đúng khỏi danh sách câu sai trên Cloud
  removeIncorrectQuestion: async (questionId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const incorrectRef = ref(db, `incorrect_questions/${user.uid}`);
      const snapshot = await get(incorrectRef);
      if (snapshot.exists()) {
        const currentIds: string[] = snapshot.val();
        const newIds = currentIds.filter(id => id !== questionId);
        await set(incorrectRef, newIds);
      }
    } catch (e) {
      console.error("Lỗi xóa câu hỏi sai:", e);
    }
  },

  // 10. Lấy danh sách ID câu hỏi sai từ Cloud
  getIncorrectQuestions: async (): Promise<string[]> => {
    const user = auth.currentUser;
    if (!user) return [];
    try {
      const incorrectRef = ref(db, `incorrect_questions/${user.uid}`);
      const snapshot = await get(incorrectRef);
      return snapshot.exists() ? snapshot.val() : [];
    } catch (e) {
      console.error("Lỗi lấy danh sách câu sai:", e);
      return [];
    }
  }
};
