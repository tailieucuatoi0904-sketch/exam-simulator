---
name: import-pmp-data
description: Hướng dẫn import câu hỏi luyện thi PMP từ file Excel vào Firebase Realtime Database. Sử dụng skill này khi người dùng muốn thêm câu hỏi mới từ file Excel, xử lý trùng lặp câu hỏi, hoặc cấu hình lại logic import.
---

# Import PMP Data

Skill này giúp Agent thực hiện quy trình import dữ liệu câu hỏi từ Excel vào hệ thống PMP Exam Simulator một cách an toàn và chính xác.

## 🛠️ Công cụ hỗ trợ
- **ExcelImporter (Component):** Chứa logic parse file Excel.
- **firebaseService.ts:** Chứa hàm `importQuestions` và `checkDuplicateQuestion`.

## 📋 Quy trình thực hiện

### 1. Phân tích cấu trúc file Excel
Đảm bảo file Excel có các cột sau (theo chuẩn dự án):
- `Question`: Nội dung câu hỏi.
- `Option A`, `Option B`, `Option C`, `Option D`: Các lựa chọn.
- `Correct Answer`: Đáp án đúng (A, B, C, hoặc D).
- `Explanation`: Giải thích đáp án.
- `Domain/Task`: (Tùy chọn) Để phân loại câu hỏi.

### 2. Kiểm tra trùng lặp (Duplicate Detection)
Trước khi lưu, phải kiểm tra xem câu hỏi đã tồn tại trong database chưa:
- So sánh nội dung `Question` (loại bỏ khoảng trắng và viết hoa/thường).
- Nếu trùng -> Bỏ qua hoặc cập nhật (tùy yêu cầu user).
- **Lưu ý:** Luôn báo cáo số lượng câu hỏi mới được thêm và số lượng câu hỏi bị bỏ qua do trùng lặp.

### 3. Thực hiện Import
Sử dụng hàm `firebaseService.saveQuestion(questionData)` để đẩy từng câu lên Realtime Database tại node `questions/`.

## ⚠️ Lưu ý quan trọng
- **Batching:** Nếu số lượng câu hỏi > 100, nên thực hiện import theo từng đợt để tránh nghẽn mạng.
- **Validation:** Kiểm tra kỹ các trường bắt buộc (Question, Answer). Nếu thiếu -> Skip và log lỗi cho user.
- **Backup:** Khuyên người dùng backup database (Export JSON từ Firebase Console) trước khi thực hiện import lớn.

## 🐛 Troubleshooting
- **Lỗi Font:** Nếu nội dung có ký tự đặc biệt, đảm bảo encoding khi parse là UTF-8.
- **Lỗi Logic:** Nếu đáp án đúng không khớp với các Options (ví dụ Answer là 'E' mà chỉ có 4 lựa chọn) -> Phải báo lỗi ngay.
