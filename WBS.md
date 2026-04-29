# PMP Exam Portal - Work Breakdown Structure (WBS)

Bản đồ tiến độ dự án xây dựng ứng dụng mô phỏng thi PMP chuẩn quốc tế.

## 📊 Tổng quan Tiến độ
- **Trạng thái:** Đã hoàn thành phát triển & triển khai lên Production
- **Hoàn thành:** ~98%
- **Hosting:** https://pmp-exam-simulator-7d8dd.web.app
- **GitHub:** https://github.com/tailieucuatoi0904-sketch/exam-simulator
- **Cập nhật lần cuối:** 29/04/2026

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
- [x] 3.3 Form chọn Domain & ECO Task chi tiết (Accordion & Search)
- [x] 3.4 Giao diện Dashboard Admin & các màn hình quản trị
- [x] 3.5 Màn hình Làm bài thi thực tế (Exam Interface - Timer, Flag, Grid)

## 🟢 Giai đoạn 4: Bộ não Sinh đề (Exam Engine) [100%]
- [x] 4.1 Thuật toán lọc câu hỏi (hỗ trợ mode: incorrect, domain, eco, full)
- [x] 4.2 Thuật toán lọc câu hỏi đã làm đúng (Exclude Correct)
- [x] 4.3 Thuật toán trộn đề theo tỷ lệ PMI (33% People, 41% Process, 26% BE)
- [x] 4.4 Logic đếm ngược thời gian và xử lý nộp bài tự động
- [x] 4.5 Hệ thống chấm điểm tự động (đơn lựa chọn & đa lựa chọn)
- [x] 4.6 So sánh ECO Task case-insensitive (hỗ trợ dữ liệu Excel không đồng nhất)

## 🟢 Giai đoạn 5: Phân hệ Quản trị (Admin Module) [100%]
- [x] 5.1 Giao diện Quản lý câu hỏi (FlatList hiệu năng cao)
- [x] 5.2 Logic Import câu hỏi từ file Excel (.xlsx) + Tải file mẫu
- [x] 5.3 Quản lý danh sách Học viên (Đồng bộ stats từ Firebase Cloud)
- [x] 5.4 Tìm kiếm câu hỏi trong Admin
- [x] 5.5 Sửa/Xóa câu hỏi chi tiết (Full fields)
- [x] 5.6 Thống kê học viên nâng cao (Số câu chinh phục thành công)
- [x] 5.7 **Kiểm tra trùng lặp khi Import** (so sánh 100 ký tự đầu, case-insensitive)
- [x] 5.8 **Nút "Xóa trùng lặp"** (phát hiện & xóa câu hỏi trùng trên Cloud)
- [x] 5.9 **Nút "Xóa toàn bộ"** (dọn sạch kho câu hỏi trên Cloud)
- [x] 5.10 **Đếm số câu hỏi Business chính xác** (hỗ trợ cả "Business" và "Business Environment")

## 🟢 Giai đoạn 6: Kết quả & Chữa bài (Review Mode) [100%]
- [x] 6.1 Màn hình Thống kê kết quả sau thi (Pass/Fail, Domain breakdown)
- [x] 6.2 Biểu đồ Radar phân tích điểm mạnh/yếu theo Domain PMI
- [x] 6.3 Chế độ Review Mode (Xem lại đáp án & Giải thích chi tiết)
- [x] 6.4 Lịch sử bài thi (Retake / Xem lại kết quả cũ)
- [x] 6.5 Luyện tập câu sai (Tự động lọc & ghi nhớ câu làm sai)

## 🟢 Giai đoạn 7: Tích hợp Backend (Firebase Integration) [100%]
- [x] 7.1 Cấu hình Firebase Project (Auth + Realtime Database)
- [x] 7.2 Đăng nhập bằng Email/Password (Firebase Auth)
- [x] 7.3 Lưu lịch sử thi lên Cloud
- [x] 7.4 Lưu câu hỏi sai lên Cloud
- [x] 7.5 Lưu câu hỏi ĐÃ LÀM ĐÚNG lên Cloud
- [x] 7.6 Admin xem toàn bộ lịch sử thi của tất cả học viên
- [x] 7.7 Kho câu hỏi đồng bộ hoàn toàn trên Cloud (Firebase Realtime Database)

## 🟢 Giai đoạn 8: Triển khai & Đóng gói (Deployment) [100%]
- [x] 8.1 Đẩy mã nguồn lên GitHub
- [x] 8.2 Build Expo Web (`npx expo export -p web`)
- [x] 8.3 Deploy lên Firebase Hosting (https://pmp-exam-simulator-7d8dd.web.app)
- [x] 8.4 Sửa lỗi Firebase ignore rule (`**/node_modules/**` → `/node_modules/**`)
- [x] 8.5 Xác nhận icon fonts hiển thị đúng trên Hosting (64 files deployed)
- [x] 8.6 Sử dụng `window.confirm()` thay `Alert.alert()` cho các hành động Admin trên Web

## 🟡 Giai đoạn 9: Hoàn thiện & Tối ưu (Polish) [30%]
- [x] 9.1 Sửa lỗi ECO Task Business Environment không hiện trên màn hình luyện tập
- [ ] 9.2 Kiểm thử lỗi toàn diện (Bug Fixing) trên nhiều trình duyệt
- [ ] 9.3 Tối ưu hóa hiệu năng & Giao diện trên thiết bị thật (iOS/Android)
- [ ] 9.4 Tính năng Retake bài thi (tối đa 5 lần/đề)

---

## 📝 Bài học kinh nghiệm (Lessons Learned)
> Xem chi tiết tại Knowledge Item: `firebase-hosting-expo-web-lessons`

1. **Firebase Hosting ignore rule:** Không dùng `**/node_modules/**` vì nó bỏ qua cả font files trong `dist/assets/node_modules/`
2. **Alert.alert() trên Web:** Nút xác nhận (multiple buttons) không hoạt động, cần dùng `window.confirm()`
3. **So sánh Domain case-insensitive:** Dữ liệu Excel thường không đồng nhất, phải dùng `.trim().toLowerCase()`
4. **Diagnose before fix:** Luôn kiểm tra gốc rễ vấn đề trước khi sửa code
