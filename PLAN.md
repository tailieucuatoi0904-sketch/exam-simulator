# Kế hoạch Triển khai: Ứng dụng Ôn thi PMP (PMP Prep App)

Đây là tài liệu đặc tả nghiệp vụ đã được nâng cấp dựa trên cấu trúc đề thi PMI 2026, chuyển hướng từ một ứng dụng thi thử đơn thuần sang một **Hệ thống Ôn luyện PMP toàn diện**.

## Cần Bạn Duyệt (User Review Required)
> [!IMPORTANT]
> **Về Cấu trúc Dữ liệu Câu hỏi:** 
> Để ứng dụng có thể tạo bài thi theo đúng Domain hoặc ECO Task, file Excel import của Admin BẮT BUỘC phải có thêm 2 cột mới là `Domain` và `ECO_Task`. 
> *(Ví dụ: Cột Domain ghi "People", cột ECO_Task ghi "Task 1: Manage conflict").* Bạn có đồng ý với cấu trúc Excel này không?
> 
> **Về Thời gian đếm ngược (Timer):**
> Khi học viên tự tạo bài thi ngẫu nhiên (ví dụ 50 câu), hệ thống sẽ tính thời gian như thế nào? (Ví dụ: Trung bình 1.2 phút/câu => 50 câu = 60 phút, hay để học viên tự chọn thời gian?). Bạn cho ý kiến ở phần này nhé!

---

## 1. Phân hệ Quản trị viên (Admin Role)
*(Vẫn giữ nguyên chức năng Quản lý Học viên và Quản lý Câu hỏi, nhưng cấu trúc Import Excel sẽ thay đổi).*

### 1.1. Cấu trúc Import Câu hỏi Mới (Excel Template)
Admin khi import câu hỏi cần phân loại cực kỳ chi tiết theo chuẩn PMI 2026:
- **Domain (Lĩnh vực):** People, Process, Business Environment.
- **ECO Task:** Có tổng cộng 26 ECO Tasks (Ví dụ: Task 1 - Manage Conflict, Task 2 - Lead a team...).
- **Nội dung:** Câu hỏi, Các đáp án, Đáp án đúng, Giải thích.

---

## 2. Phân hệ Học viên (Student Role - PMP Prep)

Thay vì chỉ có 1 nút "Bắt đầu làm bài", Màn hình của Học viên sẽ là một **Trạm Ôn tập (Quiz Builder)** với 3 chế độ luyện thi cốt lõi:

### 2.1. Luyện tập theo Domain (Domain-based Practice)
Học viên chọn 1 trong 3 Domain (People, Process, Business Environment) để làm bài.
- **Tùy biến:** Học viên tự do nhập Số lượng câu hỏi và Thời gian làm bài mong muốn.
- Ứng dụng sẽ lọc toàn bộ câu hỏi thuộc Domain đó trong kho dữ liệu để người dùng làm.

### 2.2. Luyện tập theo ECO Task (Task-based Practice)
- Hiển thị danh sách 26 ECO Tasks.
- **Tùy biến:** Học viên tự do nhập Số lượng câu hỏi và Thời gian làm bài mong muốn.
- Học viên cảm thấy yếu ở Task nào (Ví dụ: Build a team) thì click vào Task đó để làm 1 bài Mini-test.

### 2.3. Tạo Đề thi Tùy chỉnh / Thi Thử (Custom Mock Exam)
Học viên tự thiết kế bài thi của mình bằng form tuỳ chọn:
- **Số lượng câu hỏi:** Tuỳ chọn nhập số (Ví dụ: 10, 50, 100, tối đa 230).
- **Thời gian làm bài:** Học viên tự do nhập thời gian mong muốn (Ví dụ: 60 phút, 120 phút).
- **Cơ chế lọc câu hỏi thông minh:** Hệ thống sẽ tự động GẠCH BỎ những câu hỏi học viên đã từng làm đúng trước đó để tránh trùng lặp, đảm bảo mỗi lần thi là một bộ đề mới.
- **Cơ chế trộn đề (Tỷ lệ chuẩn):** Khi tạo một bài test tuỳ chỉnh hoặc Full, hệ thống sẽ tự động bốc ngẫu nhiên câu hỏi (chưa từng làm) theo ĐÚNG TỶ LỆ:
  - **People:** 33% số lượng câu hỏi.
  - **Process:** 41% số lượng câu hỏi.
  - **Business Environment:** 26% số lượng câu hỏi.
- **Lưu trữ & Thi lại (Retake):** Bài test do học viên tự Build sẽ được lưu lại trong Lịch sử. Học viên được phép **Thi lại (Retake) nguyên bộ đề này tối đa 5 lần** để theo dõi sự tiến bộ của bản thân trước khi tạo một bộ đề mới hoàn toàn.

### 2.4. Chế độ Ôn luyện Đặc biệt (Special Practice)
- **Làm lại câu sai (Review Incorrect Answers):** Một chế độ học tập riêng biệt chỉ bốc ra những câu hỏi học viên đã từng làm sai trong quá khứ để bắt buộc họ ôn lại cho đến khi làm đúng thì thôi. 

### 2.5. Trải nghiệm Làm bài thi (Exam Engine)
- Giao diện làm bài chuyên nghiệp với các tính năng:
  - Đồng hồ đếm ngược.
  - Lưới câu hỏi (Question Grid) để nhảy nhanh tới các câu chưa làm.
  - Cắm cờ xem lại (Mark for Review).

### 2.6. Chấm điểm, Phân tích & Chữa bài (Analytics & Review)
- **Tổng kết điểm:** Tính điểm Pass/Fail dựa trên tỷ lệ % (tuỳ chỉnh theo số lượng câu hỏi).
- **Lịch sử Bài thi (Exam History):** Lưu trữ danh sách toàn bộ các đề thi học viên đã nộp để họ có thể xem lại điểm số bất kỳ lúc nào.
- **Phân tích điểm số (Radar Chart/Bar Chart):** Hiển thị cho học viên biết họ đang làm tốt ở Domain nào (Ví dụ: People 80%, Process 40%) để biết đường ôn tập lại.
- **Chế độ Chữa bài (Review Mode):** ĐÂY LÀ TÍNH NĂNG BẮT BUỘC. Ngay sau khi nộp bài hoặc khi xem lại từ Lịch sử, học viên được quyền "Xem lại toàn bộ bài thi". Ứng dụng sẽ hiển thị lại từng câu hỏi kèm theo:
  - Đáp án học viên đã chọn (Đánh dấu Đỏ nếu sai, Xanh nếu đúng).
  - Đáp án chính xác của hệ thống.
  - **Khung Giải thích chi tiết (Explanation):** Giải thích rõ ràng tại sao đáp án đó lại đúng dựa trên dữ liệu Excel Admin đã import, giúp học viên học từ lỗi sai.

---

## 3. Kiến trúc Dữ liệu & Công nghệ
- **Ngôn ngữ:** React Native (Expo).
- **Thuật toán sinh đề (Exam Generator Engine):** Xây dựng một Hàm (Function) chuyên lọc (Filter) và xáo trộn (Shuffle) danh sách câu hỏi dựa trên tham số (Domain, Task, Limit) học viên yêu cầu.
- **Dữ liệu Mock (Giai đoạn 1):** Sẽ tạo giả lập cấu trúc JSON bao gồm đầy đủ thuộc tính `domain` và `eco_task` để code luồng tạo bài thi.

## 4. Lộ trình triển khai (Đã Cập nhật)
- **Giai đoạn 1:** Cấu hình Data Mock (Bổ sung Domain, ECO Task) & Code màn hình Đăng nhập.
- **Giai đoạn 2 (Student Dashboard):** Xây dựng Màn hình "Quiz Builder" cho phép học viên tự chọn chế độ thi (Theo Domain, Theo Task, Ngẫu nhiên).
- **Giai đoạn 3 (Exam Engine):** Xây dựng bộ não sinh đề thi ngẫu nhiên và Màn hình làm bài (Sử dụng lại giao diện Component đã tạo ở phần trước).
- **Giai đoạn 4 (Admin):** Xây dựng tính năng Import Excel.
