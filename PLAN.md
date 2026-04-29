# Kế hoạch Triển khai: Ứng dụng Ôn thi PMP (PMP Prep App)

Đây là tài liệu đặc tả nghiệp vụ đã được nâng cấp dựa trên cấu trúc đề thi PMI 2026, chuyển hướng từ một ứng dụng thi thử đơn thuần sang một **Hệ thống Ôn luyện PMP toàn diện**.

## Thông tin Triển khai
- **Hosting:** https://pmp-exam-simulator-7d8dd.web.app
- **GitHub:** https://github.com/tailieucuatoi0904-sketch/exam-simulator
- **Firebase Project:** `pmp-exam-simulator-7d8dd`
- **Tech Stack:** React Native (Expo Router) + Firebase Realtime Database + Firebase Auth
- **Trạng thái:** ✅ Đã triển khai Production — Đang vận hành

---

## 1. Phân hệ Quản trị viên (Admin Role) ✅

### 1.1. Import Câu hỏi từ Excel
- Admin upload file `.xlsx` với các cột: `Domain`, `ECO_Task`, `Question`, `A`, `B`, `C`, `D`, `Correct`, `Explanation`, `Type`
- **Kiểm tra trùng lặp tự động:** So sánh 100 ký tự đầu (case-insensitive) để tránh import trùng
- **Thông báo kết quả:** Hiển thị số câu mới thêm và số câu bị bỏ qua do trùng

### 1.2. Quản lý Kho câu hỏi
- Tìm kiếm theo nội dung, ID, Domain, ECO Task
- Sửa/Xóa từng câu hỏi (chỉnh sửa đầy đủ các trường)
- **Xóa trùng lặp:** Phát hiện và xóa câu hỏi trùng trong kho dữ liệu Cloud
- **Xóa toàn bộ:** Dọn sạch kho câu hỏi (có xác nhận 2 lần)
- Thống kê số câu theo Domain (People / Process / Business) — **case-insensitive**

### 1.3. Quản lý Học viên
- Xem danh sách toàn bộ học viên đã đăng ký
- Thống kê chi tiết: số bài thi, câu đúng, câu chinh phục thành công
- Đồng bộ dữ liệu real-time từ Firebase Cloud

---

## 2. Phân hệ Học viên (Student Role) ✅

### 2.1. Luyện tập theo Domain (Domain-based Practice)
- Chọn 1 trong 3 Domain: People, Process, Business Environment
- Tùy biến: Số lượng câu hỏi + Thời gian làm bài
- Lọc câu hỏi đã làm đúng (Exclude Correct)

### 2.2. Luyện tập theo ECO Task (Task-based Practice)
- Hiển thị danh sách ECO Tasks phân nhóm theo Domain (Accordion)
- Tìm kiếm ECO Task theo tên
- Hỗ trợ cả 3 Domain: People, Process, **Business Environment** (case-insensitive)
- Tùy biến: Số lượng câu hỏi + Thời gian làm bài

### 2.3. Tạo Đề thi Tùy chỉnh (Custom Mock Exam)
- Số lượng câu hỏi: Tùy chọn (tối đa toàn bộ kho)
- Thời gian làm bài: Tùy chọn
- Cơ chế trộn đề theo tỷ lệ PMI: 33% People, 41% Process, 26% Business Environment
- Lọc câu hỏi đã làm đúng

### 2.4. Làm lại câu sai (Review Incorrect)
- Tự động lọc câu hỏi đã từng làm sai
- Cho phép ôn luyện lại cho đến khi chinh phục

### 2.5. Trải nghiệm Làm bài thi (Exam Engine)
- Đồng hồ đếm ngược
- Lưới câu hỏi (Question Grid) — nhảy nhanh tới câu chưa làm
- Cắm cờ xem lại (Mark for Review)
- Nộp bài tự động khi hết giờ

### 2.6. Chấm điểm, Phân tích & Chữa bài
- Tổng kết điểm Pass/Fail
- Biểu đồ Radar phân tích điểm mạnh/yếu theo Domain
- Lịch sử bài thi (xem lại điểm số bất kỳ lúc nào)
- Chế độ Review Mode: Xem lại đáp án + Giải thích chi tiết

---

## 3. Kiến trúc & Công nghệ ✅

| Thành phần | Công nghệ |
|---|---|
| Frontend | React Native (Expo Router) |
| Backend | Firebase Realtime Database |
| Auth | Firebase Authentication (Email/Password) |
| Hosting | Firebase Hosting |
| Build | `npx expo export -p web` → `firebase deploy` |
| Source Control | GitHub |

### Cấu trúc dữ liệu chính
- **Câu hỏi:** `{ id, domain, ecoTask, questionText, options[], correctAnswers[], explanation, type }`
- **Lịch sử thi:** `{ examId, userId, score, answers[], timestamp, mode }`
- **Câu sai:** `{ questionId, userId, wrongCount }`
- **Câu đúng:** `{ questionId, userId }`

---

## 4. Lưu ý Kỹ thuật Quan trọng

### Firebase Hosting (`firebase.json`)
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "/node_modules/**"
    ]
  }
}
```
> ⚠️ **KHÔNG dùng `**/node_modules/**`** — sẽ bỏ qua font files trong `dist/assets/node_modules/` khiến icon hiện ô vuông.

### So sánh Domain
> ⚠️ Luôn dùng `.trim().toLowerCase()` khi so sánh domain. Dữ liệu Excel có thể là `"Business"`, `"business"`, hoặc `"Business Environment"`.

### Alert trên Web
> ⚠️ `Alert.alert()` với nhiều nút không hoạt động trên Web. Dùng `window.confirm()` thay thế khi `Platform.OS === 'web'`.

---

## 5. Công việc còn lại (TODO)
- [ ] Kiểm thử lỗi toàn diện trên nhiều trình duyệt (Chrome, Firefox, Safari)
- [ ] Tối ưu hiệu năng cho danh sách câu hỏi lớn (>1000 câu)
- [ ] Tính năng Retake bài thi (tối đa 5 lần/đề)
- [ ] Đóng gói ứng dụng cho iOS/Android (nếu cần)
