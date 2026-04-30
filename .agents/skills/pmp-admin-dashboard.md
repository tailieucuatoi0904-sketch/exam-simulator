---
name: pmp-admin-dashboard
description: Hướng dẫn quản lý hệ thống dành cho Admin, bao gồm quản lý học viên, duyệt tài khoản, quản lý ngân hàng câu hỏi và xem báo cáo tổng quát. Sử dụng khi cần thêm/sửa/xóa học viên hoặc làm sạch dữ liệu database.
---

# PMP Admin Dashboard

Skill này tập trung vào các tác vụ quản trị hệ thống (Back-office).

## 👥 Quản lý học viên (`student-management.tsx`)
- **Tạo tài khoản:** Chỉ Admin mới có quyền tạo (do đã bỏ nút đăng ký tự do).
- **Phân quyền:** Quản lý role (`admin` vs `student`).
- **Reset dữ liệu:** Tính năng xóa lịch sử thi của một học viên cụ thể để họ thi lại từ đầu.

## 📚 Quản lý câu hỏi (`question-management.tsx`)
- **CRUD:** Thêm, Sửa, Xóa câu hỏi trực tiếp trên giao diện.
- **Dọn dẹp (Cleanup):**
  - Tìm và xóa các câu hỏi bị trùng lặp nội dung.
  - Xóa toàn bộ database (Clear all) - **CẢNH BÁO:** Luôn yêu cầu xác nhận 2 bước trước khi thực hiện.
- **Thống kê:** Xem tổng số câu hỏi hiện có, phân loại theo độ khó hoặc domain.

## 📊 Báo cáo & Thống kê (`analytics.tsx`)
- Xem biểu đồ tăng trưởng học viên.
- Xem danh sách các câu hỏi "khó nhất" (tỷ lệ trả lời sai cao nhất từ tất cả học viên) để điều chỉnh nội dung giảng dạy.

## 🔐 Bảo mật (Security Rules)
- Đảm bảo Firebase Security Rules chỉ cho phép node `(admin)` được truy cập bởi user có `role === 'admin'`.
- Kiểm tra lại logic chuyển hướng tại `app/index.tsx` để ngăn học viên "mò" đường dẫn vào trang admin.
