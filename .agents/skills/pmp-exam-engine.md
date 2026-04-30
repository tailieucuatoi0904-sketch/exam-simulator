---
name: pmp-exam-engine
description: Quản lý logic lõi của bộ máy thi PMP, bao gồm xáo trộn câu hỏi, tính giờ, chấm điểm và lưu lịch sử. Sử dụng skill này khi cần chỉnh sửa cách tính điểm, thay đổi logic tạo đề thi (Random/Domain-based) hoặc xử lý dữ liệu kết quả thi.
---

# PMP Exam Engine

Skill này hướng dẫn cách vận hành và bảo trì bộ máy thi (Exam Engine) của ứng dụng.

## 🏗️ Cấu trúc Logic

### 1. Khởi tạo đề thi (`examEngine.ts`)
- **Shuffle:** Sử dụng thuật toán Fisher-Yates để xáo trộn danh sách câu hỏi.
- **Selection:** Lọc câu hỏi theo Domain hoặc số lượng yêu cầu (ví dụ: 180 câu cho Full Mock).
- **State:** Khởi tạo mảng `userAnswers` với giá trị `null`.

### 2. Quản lý phiên thi
- **Timer:** Đếm ngược (thường là 230 phút cho 180 câu). Phải xử lý được trường hợp người dùng thoát app giữa chừng (lưu state vào LocalStorage/AsyncStorage).
- **Navigation:** Cho phép "Mark for Review" để người dùng quay lại các câu chưa chắc chắn.

### 3. Chấm điểm & Kết quả
- **Scoring:** So sánh `userAnswers` với `correctAnswer`.
- **Analytics:** Phân tích tỷ lệ đúng theo từng Domain (People, Process, Business Environment).
- **Save History:** Lưu object kết quả vào Firebase node `examHistory/{userId}/` bao gồm:
  - `score`, `totalQuestions`, `correctCount`
  - `duration`, `timestamp`
  - `breakdown` (đúng/sai theo domain)

## 🎨 UI/UX Requirements
- Hiển thị Progress Bar rõ ràng.
- Cảnh báo khi thời gian còn dưới 10 phút.
- Màn hình Result phải có biểu đồ (Pie chart/Bar chart) tóm tắt hiệu suất.

## 🛠️ Maintenance
- Khi cập nhật ngân hàng câu hỏi, đảm bảo các ID câu hỏi trong `examHistory` không bị sai lệch nếu người dùng xem lại (Review) bài thi cũ.
