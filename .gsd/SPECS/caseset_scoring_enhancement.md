# Specification: Case Set Stabilization & Scoring Enhancement

## 1. Tổng quan
Nâng cấp hệ thống câu hỏi Case Set (Bộ câu hỏi) để hỗ trợ hiển thị tập trung và chấm điểm từng phần, thay vì tính cả bộ là 1 câu.

## 2. Thay đổi Logic (Logic Changes)
- **Scoring Engine**: Chỉnh sửa `examEngine.ts` -> `calculateScore`.
    - Duyệt qua từng câu hỏi trong đề.
    - Nếu là `case_set`, đếm số lượng câu hỏi con (`subQuestions`).
    - Mỗi câu trả lời đúng của học viên trong sub-question được tính là 1 điểm.
    - Tổng điểm bài thi = Tổng số câu hỏi đơn + Tổng số câu hỏi con của các Case Set.
- **Data Integrity**: Thêm xác nhận khi xóa sub-question và cảnh báo khi đóng modal mà chưa lưu.

## 3. Thay đổi giao diện (UI Changes)
- **QuestionCard**: 
    - Hiển thị kịch bản (`scenario`) ở trên đầu.
    - Render toàn bộ danh sách câu hỏi con bên dưới kịch bản đó.
    - Sử dụng `subAnswers` để quản lý trạng thái chọn của từng câu con.
- **Admin Modal**:
    - Thêm nút [Debug JSON] để kiểm tra dữ liệu thô.
    - Cho phép chỉnh sửa trực tiếp Zone ID cho Hotspot để khớp với đáp án.

## 4. Dữ liệu (Data Changes)
- `interactiveData` của Case Set chứa:
    - `scenario`: Chuỗi văn bản/HTML mô tả tình huống.
    - `subQuestions`: Mảng các đối tượng câu hỏi con (mỗi câu có id, question, options).

## 5. Xác minh (Verification)
- Kiểm tra một bài tập có 15 câu, trong đó có 1 Case Set 3 câu con -> Tổng điểm phải là 17.
- Kiểm tra việc lưu và tải lại bài làm đảm bảo các lựa chọn của sub-questions không bị mất.
