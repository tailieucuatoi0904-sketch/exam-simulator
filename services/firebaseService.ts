import { db, auth } from '../config/firebaseConfig';
import { ref, push, get, query, orderByChild, set } from 'firebase/database';
import { Question } from './types';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

// Bộ nhớ đệm cục bộ để tăng tốc độ truy xuất dữ liệu từ Firebase
const serviceCache: Record<string, {data: any, timestamp: number}> = {};

export const firebaseService = {

  // 0. Tạo tài khoản (Admin tạo)
  // Sử dụng một app instance phụ để tránh làm Admin bị đăng xuất
  createAccount: async (email: string, pass: string, name: string, role: 'student' | 'admin' = 'student') => {
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
        role: role,
        displayName: name,
        createdAt: new Date().toISOString()
      });

      // Đăng xuất app phụ ngay lập tức để không xung đột
      await signOut(secondaryAuth);
      return { success: true };
    } catch (e: any) {
      console.error("Lỗi tạo tài khoản:", e);
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
        // Lưu bản sao questions để review
        questions: (resultData.questions || []),
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

  // 4b. Lưu danh sách câu hỏi ĐÃ LÀM ĐÚNG lên Cloud (để gạch bỏ trong tương lai)
  saveCorrectQuestions: async (questionIds: string[]) => {
    const user = auth.currentUser;
    if (!user || questionIds.length === 0) return;
    try {
      const correctRef = ref(db, `correct_questions/${user.uid}`);
      const snapshot = await get(correctRef);
      let currentIds: string[] = snapshot.exists() ? snapshot.val() : [];
      
      const newIds = Array.from(new Set([...currentIds, ...questionIds]));
      await set(correctRef, newIds);
    } catch (e) {
      console.error("Lỗi lưu câu hỏi đúng:", e);
    }
  },

  // 4c. Lấy danh sách ID câu hỏi đã làm đúng từ Cloud
  getCorrectQuestions: async (uid?: string): Promise<string[]> => {
    const targetUid = uid || auth.currentUser?.uid;
    if (!targetUid) return [];
    try {
      const correctRef = ref(db, `correct_questions/${targetUid}`);
      const snapshot = await get(correctRef);
      return snapshot.exists() ? snapshot.val() : [];
    } catch (e) {
      console.error("Lỗi lấy danh sách câu đúng:", e);
      return [];
    }
  },

  getUserProfile: async (uid: string) => {
    const cacheKey = `profile_${uid}`;
    const now = Date.now();
    if (serviceCache[cacheKey] && now - serviceCache[cacheKey].timestamp < 30000) {
      return serviceCache[cacheKey].data;
    }
    
    try {
      const userRef = ref(db, `users/${uid}`);
      const snapshot = await get(userRef);
      const data = snapshot.exists() ? snapshot.val() : null;
      // Lưu cache 30 giây
      serviceCache[cacheKey] = { data, timestamp: now };
      return data;
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
    await firebaseService.removeIncorrectQuestions([questionId]);
  },

  // 9b. Xóa NHIỀU câu hỏi khỏi danh sách câu sai (Tối ưu performance)
  removeIncorrectQuestions: async (questionIds: string[]) => {
    const user = auth.currentUser;
    if (!user || questionIds.length === 0) return;
    try {
      const incorrectRef = ref(db, `incorrect_questions/${user.uid}`);
      const snapshot = await get(incorrectRef);
      if (snapshot.exists()) {
        const currentIds: string[] = snapshot.val();
        const newIds = currentIds.filter(id => !questionIds.includes(id));
        await set(incorrectRef, newIds);
      }
    } catch (e) {
      console.error("Lỗi xóa danh sách câu hỏi sai:", e);
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
  },

  // 11. Lưu TOÀN BỘ kho câu hỏi lên Cloud (Dành cho Admin)
  saveQuestionsToCloud: async (questions: Question[]) => {
    try {
      const qRef = ref(db, 'questions_pool');
      await set(qRef, questions);
      return true;
    } catch (e) {
      console.error("Lỗi lưu kho câu hỏi lên Cloud:", e);
      return false;
    }
  },

  // 4. Lấy danh sách câu hỏi từ Cloud
  getQuestionsFromCloud: async (): Promise<Question[]> => {
    try {
      const questionsRef = ref(db, 'questions_pool');
      const snapshot = await get(questionsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.values(data);
      }
      return [];
    } catch (e) {
      console.error("Lỗi lấy câu hỏi từ Cloud:", e);
      return [];
    }
  },

  // 4b. Chỉ lấy SỐ LƯỢNG câu hỏi (Tối ưu hiệu năng)
  getQuestionCount: async (): Promise<number> => {
    try {
      const questionsRef = ref(db, 'questions_pool');
      const snapshot = await get(questionsRef);
      if (snapshot.exists()) {
        return Object.keys(snapshot.val()).length;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  },

  // ================= MODULE LỚP HỌC & BÀI TẬP =================

  // 13. Tạo Lớp học mới
  createClass: async (name: string, description: string) => {
    try {
      const classRef = ref(db, `classes`);
      const newClassRef = push(classRef);
      await set(newClassRef, {
        id: newClassRef.key,
        name,
        description,
        createdAt: new Date().toISOString()
      });
      return { success: true, id: newClassRef.key };
    } catch (e) {
      console.error("Lỗi tạo lớp học:", e);
      return { success: false };
    }
  },

  // 14. Lấy danh sách toàn bộ Lớp học
  getAllClasses: async () => {
    try {
      const classRef = ref(db, 'classes');
      const snapshot = await get(classRef);
      if (!snapshot.exists()) return [];
      const data = snapshot.val();
      return Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val }));
    } catch (e) {
      console.error("Lỗi lấy danh sách lớp học:", e);
      return [];
    }
  },

  // 15. Gán học viên vào Lớp học
  addStudentToClass: async (classId: string, studentId: string) => {
    try {
      const mappingRef = ref(db, `class_students/${classId}/${studentId}`);
      await set(mappingRef, true);
      return true;
    } catch (e) {
      console.error("Lỗi gán học viên vào lớp:", e);
      return false;
    }
  },

  // 16. Xóa học viên khỏi lớp
  removeStudentFromClass: async (classId: string, studentId: string) => {
    try {
      const mappingRef = ref(db, `class_students/${classId}/${studentId}`);
      await set(mappingRef, null);
      return true;
    } catch (e) {
      console.error("Lỗi xóa học viên khỏi lớp:", e);
      return false;
    }
  },

  // 17. Lấy danh sách học viên của một lớp
  getClassStudents: async (classId: string) => {
    try {
      const mappingRef = ref(db, `class_students/${classId}`);
      const snapshot = await get(mappingRef);
      if (!snapshot.exists()) return [];
      const data = snapshot.val();
      return Object.keys(data); // Trả về mảng studentId
    } catch (e) {
      console.error("Lỗi lấy ds học viên của lớp:", e);
      return [];
    }
  },

  // 18. Tạo Bài tập mới (Assignment)
  createAssignment: async (classId: string, title: string, deadline: string, questions: any[]) => {
    try {
      const assignmentRef = ref(db, `assignments`);
      const newRef = push(assignmentRef);
      const assignmentId = newRef.key;

      // 1. Lưu metadata vào nút assignments (SIÊU NHẸ)
      await set(newRef, {
        id: assignmentId,
        classId,
        title,
        deadline, // ISO String
        questionCount: questions.length,
        createdAt: new Date().toISOString(),
        status: 'active'
      });

      // 2. Lưu nội dung câu hỏi vào nút riêng assignment_questions (CHỈ TẢI KHI LÀM BÀI)
      if (assignmentId) {
        const questionsRef = ref(db, `assignment_questions/${assignmentId}`);
        await set(questionsRef, questions);
      }

      return { success: true, id: assignmentId };
    } catch (e) {
      console.error("Lỗi tạo bài tập:", e);
      return { success: false };
    }
  },

  // 18b. Cập nhật Bài tập (Admin dùng)
  updateAssignment: async (assignmentId: string, data: { classId?: string; title?: string; deadline?: string; questions?: any[] }) => {
    try {
      const { questions, ...metadata } = data;

      // 1. Cập nhật metadata (Đảm bảo không lưu questions vào nút assignments)
      const assignRef = ref(db, `assignments/${assignmentId}`);
      const snapshot = await get(assignRef);
      if (!snapshot.exists()) return { success: false };
      
      const { questions: oldQs, ...currentMetadata } = snapshot.val();
      const finalMetadata = { 
        ...currentMetadata, 
        ...metadata,
        updatedAt: new Date().toISOString()
      };
      
      if (questions !== undefined) {
        finalMetadata.questionCount = Array.isArray(questions) ? questions.length : Object.keys(questions || {}).length;
      }
      
      await set(assignRef, finalMetadata);

      // 2. Cập nhật questions nếu có (nếu mảng rỗng thì xóa node cũ)
      if (questions !== undefined) {
        const questionsRef = ref(db, `assignment_questions/${assignmentId}`);
        await set(questionsRef, (questions && questions.length > 0) ? questions : null);
      }

      return { success: true };
    } catch (e) {
      console.error('Lỗi cập nhật bài tập:', e);
      return { success: false };
    }
  },

  // 18c. Xóa Bài tập (Admin dùng)
  deleteAssignment: async (assignmentId: string) => {
    try {
      const assignRef = ref(db, `assignments/${assignmentId}`);
      const questionsRef = ref(db, `assignment_questions/${assignmentId}`);
      const resultsRef = ref(db, `assignment_results/${assignmentId}`);
      
      await Promise.all([
        set(assignRef, null),
        set(questionsRef, null),
        set(resultsRef, null)
      ]);
      
      return { success: true };
    } catch (e) {
      console.error('Lỗi xóa bài tập:', e);
      return { success: false };
    }
  },

  // 19. Lấy toàn bộ Bài tập (Admin dùng) - CHỈ LẤY METADATA
  getAllAssignments: async () => {
    try {
      const refDB = ref(db, 'assignments');
      const snapshot = await get(refDB);
      if (!snapshot.exists()) return [];
      const data = snapshot.val();
      return Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) {
      console.error("Lỗi lấy danh sách bài tập:", e);
      return [];
    }
  },

  // 19b. Lấy CHI TIẾT câu hỏi của một bài tập
  getAssignmentQuestions: async (assignmentId: string): Promise<any[]> => {
    try {
      const questionsRef = ref(db, `assignment_questions/${assignmentId}`);
      const snapshot = await get(questionsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Array.isArray(data) ? data : Object.values(data);
      }
      
      // Fallback: Nếu bài cũ vẫn còn questions bên trong metadata
      const assignRef = ref(db, `assignments/${assignmentId}/questions`);
      const oldSnapshot = await get(assignRef);
      return oldSnapshot.exists() ? oldSnapshot.val() : [];
    } catch (e) {
      console.error("Lỗi lấy câu hỏi bài tập:", e);
      return [];
    }
  },

  // 20. Lấy danh sách Bài tập của Học viên (Student dùng)
  // Quy trình: Tìm các lớp student tham gia -> Lấy bài tập của các lớp đó
  getStudentAssignments: async () => {
    try {
      const user = auth.currentUser;
      if (!user) return [];

      // Bước 1: Tìm lớp học của học viên này
      const myClassIds = await firebaseService.getStudentClassIds(user.uid);
      if (myClassIds.length === 0) return [];

      // Bước 2: Lấy bài tập của các lớp này
      const assignmentsRef = ref(db, 'assignments');
      const aSnapshot = await get(assignmentsRef);
      if (!aSnapshot.exists()) return [];

      const aData = aSnapshot.val();
      const myAssignments: any[] = [];
      Object.keys(aData).forEach(id => {
        const assignment = aData[id];
        if (myClassIds.includes(assignment.classId) && assignment.status !== 'closed') {
          // Loại bỏ mảng questions nếu nó còn tồn tại ở bản ghi cũ để giảm dung lượng tải
          const { questions, ...lightAssignment } = assignment;
          myAssignments.push({ id, ...lightAssignment });
        }
      });

      return myAssignments.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    } catch (e) {
      console.error("Lỗi lấy bài tập cho học viên:", e);
      return [];
    }
  },

  // 20b. Lấy danh sách ID lớp học của học viên
  getStudentClassIds: async (uid: string) => {
    try {
      const classStudentsRef = ref(db, 'class_students');
      const csSnapshot = await get(classStudentsRef);
      if (!csSnapshot.exists()) return [];
      
      const csData = csSnapshot.val();
      const myClassIds: string[] = [];
      Object.keys(csData).forEach(classId => {
        if (csData[classId][uid]) {
          myClassIds.push(classId);
        }
      });
      return myClassIds;
    } catch (e) {
      console.error("Lỗi lấy ID lớp của học viên:", e);
      return [];
    }
  },

  // 20c. Lấy thông tin chi tiết các lớp học viên tham gia
  getStudentClasses: async () => {
    try {
      const user = auth.currentUser;
      if (!user) return [];
      
      const myClassIds = await firebaseService.getStudentClassIds(user.uid);
      if (myClassIds.length === 0) return [];

      const classesRef = ref(db, 'classes');
      const snapshot = await get(classesRef);
      if (!snapshot.exists()) return [];

      const allClassData = snapshot.val();
      return myClassIds
        .map(id => allClassData[id] ? { id, ...allClassData[id] } : null)
        .filter(c => c !== null);
    } catch (e) {
      console.error("Lỗi lấy thông tin lớp học viên:", e);
      return [];
    }
  },

  // 21. Nộp bài tập
  submitAssignment: async (assignmentId: string, resultData: any) => {
    try {
      const user = auth.currentUser;
      if (!user) return false;

      const resultRef = ref(db, `assignment_results/${assignmentId}/${user.uid}`);
      await set(resultRef, {
        studentId: user.uid,
        studentName: user.email?.split('@')[0] || 'Student',
        score: resultData.results.percentage || 0,
        correct: resultData.results.correct || 0,
        total: resultData.results.total || 0,
        answers: resultData.userAnswers || {},
        submittedAt: new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.error("Lỗi nộp bài tập:", e);
      return false;
    }
  },

  // 22. Kiểm tra trạng thái nộp bài của 1 bài tập (Student dùng)
  getAssignmentSubmission: async (assignmentId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      const resultRef = ref(db, `assignment_results/${assignmentId}/${user.uid}`);
      const snapshot = await get(resultRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (e) {
      return null;
    }
  },

  // 23. Lấy toàn bộ kết quả nộp bài của 1 bài tập (Admin dùng)
  getAssignmentResults: async (assignmentId: string) => {
    try {
      const resultRef = ref(db, `assignment_results/${assignmentId}`);
      const snapshot = await get(resultRef);
      if (!snapshot.exists()) return [];
      const data = snapshot.val();
      return Object.values(data);
    } catch (e) {
      console.error("Lỗi lấy danh sách nộp bài:", e);
      return [];
    }
  },

  // --- PHASE 4: GAMIFICATION & NOTES ---

  // 24. Ghi chú cá nhân (Personal Notes)
  saveQuestionNote: async (questionId: string, noteText: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return false;
      const noteRef = ref(db, `user_notes/${user.uid}/${questionId}`);
      if (noteText.trim() === '') {
        await set(noteRef, null); // Xóa nếu rỗng
      } else {
        await set(noteRef, noteText);
      }
      return true;
    } catch (e) {
      console.error("Lỗi lưu ghi chú:", e);
      return false;
    }
  },

  getQuestionNote: async (questionId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return '';
      const noteRef = ref(db, `user_notes/${user.uid}/${questionId}`);
      const snapshot = await get(noteRef);
      return snapshot.exists() ? snapshot.val() : '';
    } catch (e) {
      return '';
    }
  },

  // 25. Bảng xếp hạng (Leaderboard)
  getLeaderboardData: async () => {
    try {
      const usersRef = ref(db, 'users');
      const uSnapshot = await get(usersRef);
      if (!uSnapshot.exists()) return [];
      const allUsers = uSnapshot.val();

      const correctRef = ref(db, 'correct_questions');
      const cSnapshot = await get(correctRef);
      const allCorrects = cSnapshot.exists() ? cSnapshot.val() : {};

      const leaderboard = Object.keys(allUsers)
        .filter(uid => allUsers[uid].role === 'student')
        .map(uid => {
          const userObj = allUsers[uid];
          const correctMap = allCorrects[uid] || {};
          const score = Object.keys(correctMap).length;
          
          return {
            uid,
            name: userObj.displayName || userObj.email?.split('@')[0] || 'Học viên ẩn danh',
            score
          };
        })
        .filter(u => u.score > 0)
        .sort((a, b) => b.score - a.score);

      return leaderboard;
    } catch (e) {
      console.error("Lỗi lấy Leaderboard:", e);
      return [];
    }
  },
};
