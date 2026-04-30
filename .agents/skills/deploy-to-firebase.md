# Skill: Deploy PMP Exam Simulator lên Firebase Hosting

## Mục đích
Skill này hướng dẫn AI thực hiện đúng quy trình đồng bộ code lên GitHub và deploy lên Firebase Hosting cho project `exam-simulator`.

---

## Bước 1 — Commit & Push lên GitHub

```powershell
# Stage tất cả thay đổi
git add -A

# Commit với message mô tả rõ thay đổi
git commit -m "<type>: <mô tả ngắn gọn>"

# Push lên nhánh main
git push origin main
```

**Lưu ý:**
- Dùng `;` thay vì `&&` khi chạy lệnh PowerShell (Windows)
- Commit message tuân theo convention: `feat`, `fix`, `chore`, `refactor`, `docs`

---

## Bước 2 — Build Expo Web

```powershell
npx expo export --platform web
```

**Sau khi build xong, kiểm tra bắt buộc:**
```powershell
# Phải tìm thấy file .ttf — nếu không có → icon sẽ bị ô vuông trên Hosting
Get-ChildItem dist -Recurse -Include "*.ttf" | Measure-Object
```

> ⚠️ **CẢNH BÁO:** Nếu không tìm thấy file `.ttf` trong `dist/`, DỪNG LẠI và kiểm tra `firebase.json`.

---

## Bước 3 — Deploy lên Firebase Hosting

```powershell
firebase deploy --only hosting
```

**Đọc output và kiểm tra:**
- ✅ `found 64 files in dist` → ĐÚNG (hoặc số tương đương)
- ❌ `found 27 files in dist` → SAI — ignore rule trong `firebase.json` đang chặn font

---

## Bước 4 — Verify sau deploy (bắt buộc)

1. Mở trình duyệt **Incognito** (Ctrl+Shift+N)
2. Truy cập: `https://pmp-exam-simulator-7d8dd.web.app`
3. Mở **DevTools** (F12) → tab **Network** → lọc **"Font"**
4. Kiểm tra: tất cả font request trả về **status 200**
5. Kiểm tra Console: không có lỗi `Failed to decode downloaded font`

---

## Cấu hình firebase.json chuẩn

Nếu gặp lỗi icon, kiểm tra `firebase.json` — ignore rule phải là:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "/node_modules/**"
    ],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

> **Quan trọng:** `/node_modules/**` (bắt đầu bằng `/`) chứ KHÔNG phải `**/node_modules/**`

---

## Thông tin project

| Thông tin | Giá trị |
|-----------|---------|
| Project ID | `pmp-exam-simulator-7d8dd` |
| Hosting URL | https://pmp-exam-simulator-7d8dd.web.app |
| GitHub Repo | https://github.com/tailieucuatoi0904-sketch/exam-simulator |
| Firebase Console | https://console.firebase.google.com/project/pmp-exam-simulator-7d8dd |
| Thư mục build | `dist/` |
| Số file build chuẩn | ~64 files |

---

## Xử lý lỗi thường gặp

### Icon ô vuông sau deploy
```
Nguyên nhân: firebase.json ignore rule chặn font trong dist/
Fix: Đổi "**/node_modules/**" → "/node_modules/**" trong firebase.json
```

### Màn hình trắng sau deploy
```
Nguyên nhân: app/+html.tsx import từ react-native (không hỗ trợ SSR)
Fix: Xóa file +html.tsx hoặc chỉ dùng HTML/React thuần
```

### Số file < 50 khi deploy
```
Nguyên nhân: firebase.json đang ignore nhầm file
Fix: Kiểm tra lại ignore rules trong firebase.json
```
