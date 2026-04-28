# PMP Exam Portal - Work Breakdown Structure (WBS)

Bản đồ tiến độ dự án xây dựng ứng dụng mô phỏng thi PMP chuẩn quốc tế.

## 📊 Tổng quan Tiến độ
- **Trạng thái:** Đang thực hiện Giai đoạn 7 (Firebase Integration)
- **Hoàn thành:** ~92%

---

## 🟢 Giai đoạn 1: Khởi tạo & Thiết lập (Setup) [100%]
- [x] 1.1 Khởi tạo dự án React Native (Expo)
- [x] 1.2 Thiết lập hệ thống Theme (Màu sắc, Font chữ, Spacing)
- [x] 1.3 Cài đặt thư viện bổ trợ (Icons, Navigation, Firebase SDK)

## 🟢 Giai đoạn 2: Xác thực & Dữ liệu giả lập (Auth & MockData) [100%]
- [x] 2.1 Xây dựng cấu trúc dữ liệu câu hỏi chuẩn PMI (Domain, ECO Task)
- [x] 2.2 Xây dựng màn hình Đăng nhập (Login)
- [x] 2.3 Phân quyền truy cập (Admin vs Student)

## 🟢 Giai đoạn 3: Thiết kế Giao diện (UI Design) [100%]
- [x] 3.1 Giao diện Dashboard Học viên (Thống kê real-time, Các thẻ Mode chọn đề)
- [x] 3.2 Form tùy chỉnh đề thi (Số câu, Thời gian, Domain)
- [x] 3.3 Form chọn Domain & ECO Task chi tiết
- [x] 3.4 Giao diện Dashboard Admin & các màn hình quản trị cơ bản
- [x] 3.5 Màn hình Làm bài thi thực tế (Exam Interface - Timer, Flag, Grid)

## 🟢 Giai đoạn 4: Bộ não Sinh đề (Exam Engine) [100%]
- [x] 4.1 Thuật toán lọc câu hỏi (hỗ trợ mode: incorrect, domain, eco, full)
- [x] 4.2 Thuật toán trộn đề theo tỷ lệ PMI (33% People, 41% Process, 26% BE)
- [x] 4.3 Logic đếm ngược thời gian và xử lý nộp bài tự động
- [x] 4.4 Hệ thống chấm điểm tự động (đơn lựa chọn & đa lựa chọn)

## 🟢 Giai đoạn 5: Phân hệ Quản trị (Admin Module) [100%]
- [x] 5.1 Giao diện Quản lý câu hỏi (Hiển thị 260 câu thực tế bằng FlatList)
- [x] 5.2 Logic Import câu hỏi từ file Excel (.xlsx) + Tải file mẫu
- [x] 5.3 Quản lý danh sách Học viên (Đồng bộ stats từ Firebase Cloud)

## 🟢 Giai đoạn 6: Kết quả & Chữa bài (Review Mode) [100%]
- [x] 6.1 Màn hình Thống kê kết quả sau thi (Pass/Fail, Domain breakdown)
- [x] 6.2 Biểu đồ Radar phân tích điểm mạnh/yếu theo Domain PMI
- [x] 6.3 Chế độ Review Mode (Xem lại đáp án & Giải thích chi tiết)
- [x] 6.4 Lịch sử bài thi (Retake / Xem lại kết quả cũ)
- [x] 6.5 Luyện tập câu sai (Tự động lọc & ghi nhớ câu làm sai)

## 🟡 Giai đoạn 7: Tích hợp Backend (Firebase Integration) [80%]
- [x] 7.1 Cấu hình Firebase Project (Auth + Firestore)
- [x] 7.2 Đăng nhập thật bằng Email/Password (Firebase Auth)
- [x] 7.3 Lưu lịch sử thi của học viên lên Cloud (Firestore)
- [x] 7.4 Admin xem toàn bộ lịch sử thi của tất cả học viên
- [ ] 7.5 ⚠️ Cần anh cung cấp firebaseConfig thực tế để kích hoạt

## ⚪ Giai đoạn 8: Hoàn thiện & Đóng gói (Polish) [0%]
- [ ] 8.1 Kiểm thử lỗi (Bug Fixing)
- [ ] 8.2 Tối ưu hóa hiệu năng & Giao diện trên thiết bị thật (iOS/Android)
- [ ] 8.3 Đẩy mã nguồn lên GitHub
