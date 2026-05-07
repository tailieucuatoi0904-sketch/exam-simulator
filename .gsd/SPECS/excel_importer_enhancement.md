# Đặc tả: Nâng cấp Công cụ Nhập dữ liệu (Excel Importer)

## 🎯 Mục tiêu
Biến công cụ nhập dữ liệu từ Excel thành một tính năng chuyên nghiệp, có giao diện đẹp và khả năng xử lý lỗi thông minh.

## 🎨 Giao diện (UI)
- **Nút bấm**: Sử dụng `CustomButton` đã được nâng cấp (có Gradient).
- **Trạng thái**: Hiển thị thanh tiến trình hoặc vòng xoay (Spinner) chuyên nghiệp khi đang xử lý.
- **File mẫu**: Cung cấp nút tải file mẫu rõ ràng hơn.

## 🛠 Các thay đổi kỹ thuật

### 1. Kiểm tra dữ liệu (Validation)
- Kiểm tra xem file tải lên có đúng các cột bắt buộc không (`Question`, `A`, `B`, `C`, `D`, `Correct`).
- Nếu thiếu cột, hiển thị thông báo lỗi chi tiết thay vì bị crash app.
- Kiểm tra xem đáp án `Correct` có nằm trong danh sách [A, B, C, D] không.

### 2. Xử lý thông minh
- Tự động loại bỏ các câu hỏi bị trùng lặp (dựa trên nội dung câu hỏi).
- Hỗ trợ thêm cột `ID` nếu người dùng muốn cập nhật câu hỏi cũ.

### 3. Trải nghiệm người dùng (UX)
- Cho phép người dùng xem trước (Preview) một vài câu hỏi đầu tiên trước khi nhấn "Xác nhận nhập".
- Hiển thị báo cáo sau khi nhập: "Nhập thành công 50 câu, bỏ qua 2 câu trùng".

## ✅ Kế hoạch Kiểm tra
- [ ] Nhập thử file Excel đúng định dạng.
- [ ] Nhập thử file Excel thiếu cột để kiểm tra thông báo lỗi.
- [ ] Kiểm tra tính năng lọc trùng lặp.
