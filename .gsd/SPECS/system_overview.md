# Đặc tả Hệ thống: PMP Exam Simulator

Tài liệu này tổng hợp toàn bộ các tính năng, luồng nghiệp vụ và cấu trúc của dự án tính đến thời điểm hiện tại.

## 1. Tổng quan Kiến trúc (Architecture)
*   **Frontend:** Expo React Native (Hỗ trợ đa nền tảng Web, Android, iOS).
*   **UI/UX:** Giao diện cao cấp (Premium) sử dụng `expo-linear-gradient`, các icon từ `Ionicons`, màu sắc chủ đạo xanh tím.
*   **Backend & Cơ sở dữ liệu:** Firebase.
    *   `Authentication`: Quản lý tài khoản đăng nhập.
    *   `Realtime Database`: Lưu trữ toàn bộ dữ liệu (Câu hỏi, Lịch sử thi, Lớp học, Bài tập).

---

## 2. Phân hệ Học viên (Student Portal)

### 2.1. Trang chủ (Dashboard)
*   **Tiến độ tự học:** Hiển thị tổng quan Số bài đã làm, Tỉ lệ thi Đạt (Pass rate), và Tổng số câu hỏi trong kho.
*   **Phân tích Năng lực (Performance Analytics):** *(Phase 3)* Bản đồ Radar đánh giá năng lực học viên theo 3 Domain (People, Process, Business Environment) với 4 cấp độ (Needs Improvement, Below Target, Target, Above Target).
*   **Bài tập trên lớp (Assignments):** Ưu tiên hiển thị các bài tập do Admin giao. Có cảnh báo màu đỏ nếu bài tập đã quá hạn (Overdue) và khóa quyền nộp bài.

### 2.2. Lộ trình Ôn luyện tự do (Practice Modes)
*   **Thiết kế Đề thi (Quiz Builder):** Học viên tự thiết lập số lượng câu hỏi, thời gian thi, chọn Domain hoặc ECO Task cụ thể. Có tùy chọn "Gạch bỏ câu đã làm đúng" để tránh lặp lại.
*   **Học theo Domain:** Chia theo 3 Domain chuẩn PMI (People, Process, Business Environment).
*   **Học theo ECO Task:** Ôn luyện theo 26 nhiệm vụ cụ thể của Giám đốc dự án.

### 2.3. Củng cố Kiến thức (Review & History)
*   **Làm lại Câu Sai:** Tự động tổng hợp các câu hỏi học viên từng làm sai để thi lại. Khi trả lời đúng, câu hỏi sẽ tự động bị xóa khỏi danh sách "Câu Sai".
*   **Lịch sử Học tập:** Lưu trữ chi tiết tất cả các bài thi đã nộp, bao gồm điểm số, thời gian làm bài và chi tiết từng đáp án.

### 2.4. Màn hình Thi (Exam Engine) & Định dạng Câu hỏi
*   **Hỗ trợ đa dạng loại câu hỏi (Chuẩn PMP cập nhật từ tháng 7/2026):**
    *   *Multiple-Choice (Trắc nghiệm 1 đáp án)*: Định dạng tiêu chuẩn.
    *   *Multiple-Responses (Trắc nghiệm nhiều đáp án)*: Chọn 2-3 đáp án đúng.
    *   *Drag-and-drop (Kéo thả)*: Sắp xếp quy trình hoặc nối đáp án. *(Đang lên kế hoạch phát triển UI)*
    *   *Hotspot/Graphic-based*: Click vào biểu đồ/hình ảnh. *(Đang lên kế hoạch phát triển UI)*
    *   *Matching (Nối cột)*. *(Đang lên kế hoạch phát triển UI)*
    *   *Case Sets (Tình huống chuỗi)*: Đọc 1 case study dài và trả lời nhiều câu hỏi liên tiếp.
    *   *Fill-in-the-blank*: Điền từ vào chỗ trống (số lượng hạn chế).
*   Có đồng hồ đếm ngược, tự động nộp bài khi hết giờ.
*   Có thanh điều hướng, tính năng "Cắm cờ" (Flag) đánh dấu câu khó, và "Lưới câu hỏi" (Grid) để nhảy nhanh đến câu bất kỳ.

---

## 3. Phân hệ Quản trị viên (Admin Portal)

### 3.1. Admin Dashboard
*   Hiển thị thông số tổng quát toàn hệ thống: Tổng số câu hỏi, Tổng số học viên, Tổng lượt thi.

### 3.2. Quản lý Câu hỏi (Question Bank)
*   **Excel Importer V2:** Tính năng tải lên hàng loạt câu hỏi từ file Excel (Dành cho câu hỏi text-based 1 hoặc nhiều đáp án).
    *   *Validation & Duplicate Detection:* Kiểm tra cấu trúc file và tự động quét loại bỏ câu hỏi trùng lặp.
*   **Advanced Question Builder:** *(Phase 3)* Công cụ thiết kế câu hỏi thủ công hỗ trợ các định dạng tương tác chuẩn PMP 2026 (Drag-drop, Hotspot, Matching, Case Sets).
*   Tính năng xóa toàn bộ kho câu hỏi, xóa câu trùng lặp.

### 3.3. Quản lý Học viên (Student Management)
*   Admin trực tiếp tạo tài khoản cho học viên (Sử dụng Secondary App để Admin không bị đăng xuất).
*   Xem danh sách toàn bộ học viên và theo dõi lịch sử thi của họ.
*   **Báo cáo Phân tích Điểm yếu:** *(Phase 3)* Khi chọn 1 học viên, Admin có thể xem Domain yếu nhất/mạnh nhất của học viên đó để có chiến lược kèm cặp phù hợp.
*   Quyền Admin: Có thể xóa toàn bộ lịch sử thi / câu sai của một học viên để họ thi lại từ đầu.

### 3.4. Hệ thống LMS: Quản lý Lớp học & Bài tập
*   **Lớp học (Classes):** 
    *   Tạo lớp học mới.
    *   Gán học viên vào lớp (Một học viên có thể tham gia nhiều lớp).
*   **Giao bài tập (Assignments):**
    *   Tạo bài tập cho một lớp cụ thể.
    *   Thiết lập số lượng câu hỏi ngẫu nhiên và Hạn chót (Deadline - số ngày).
    *   Theo dõi bảng điểm (Scoreboard): Xem ai đã nộp, điểm số và thời gian nộp bài của từng học viên trong lớp.

---

## 4. Sơ đồ Dữ liệu (Firebase Database Schema)
1.  `questions_pool`: Lưu trữ kho câu hỏi gốc.
2.  `users`: Thông tin hồ sơ người dùng (Role: admin/student).
3.  `exam_history`: Lưu trữ chi tiết bài làm tự do của học viên.
4.  `incorrect_questions` / `correct_questions`: Mảng lưu ID câu hỏi để phục vụ tính năng "Làm lại câu sai" và "Gạch bỏ câu đúng".
5.  `classes`: Thông tin các lớp học.
6.  `class_students`: Bảng Mapping (Lớp -> Học viên).
7.  `assignments`: Thông tin bài tập được giao.
8.  `assignment_results`: Bảng điểm bài tập.
