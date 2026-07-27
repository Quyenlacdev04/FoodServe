@echo off
chcp 65001 >nul
color 0E
cls

echo.
echo ================================================================
echo    🛡️  SECURITY TEST - Tạo cuộc tấn công giả
echo ================================================================
echo.
echo 📋 Script này sẽ tạo các cuộc tấn công giả để test AI Security
echo 🎯 Mở Admin Dashboard trước khi chạy để xem real-time!
echo.
echo ⏰ Bắt đầu trong 3 giây...
timeout /t 3 /nobreak >nul
echo.

echo 💉 [1/6] SQL Injection Attack...
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin' OR '1'='1\",\"password\":\"pass\"}" >nul
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"'; DROP TABLE users--\",\"password\":\"pass\"}" >nul
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"' UNION SELECT * FROM users--\",\"password\":\"pass\"}" >nul
echo    ✅ Hoàn tất!
timeout /t 2 /nobreak >nul

echo.
echo ⚠️  [2/6] XSS Attack...
curl -s -X POST http://localhost:5000/api/restaurants -H "Content-Type: application/json" -d "{\"name\":\"^<script^>alert('XSS')^</script^>\"}" >nul
curl -s -X POST http://localhost:5000/api/restaurants -H "Content-Type: application/json" -d "{\"name\":\"^<img src=x onerror=alert(1)^>\"}" >nul
curl -s -X POST http://localhost:5000/api/restaurants -H "Content-Type: application/json" -d "{\"name\":\"javascript:alert('XSS')\"}" >nul
echo    ✅ Hoàn tất!
timeout /t 2 /nobreak >nul

echo.
echo 🔨 [3/6] Brute Force Attack...
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@foodserve.vn\",\"password\":\"123456\"}" >nul
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@foodserve.vn\",\"password\":\"password\"}" >nul
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@foodserve.vn\",\"password\":\"123456789\"}" >nul
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@foodserve.vn\",\"password\":\"qwerty\"}" >nul
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@foodserve.vn\",\"password\":\"abc123\"}" >nul
echo    ✅ Hoàn tất!
timeout /t 2 /nobreak >nul

echo.
echo 🌊 [4/6] DDoS Attack...
for /L %%i in (1,1,50) do (
    start /B curl -s http://localhost:5000/api/restaurants >nul 2>&1
)
echo    ✅ Hoàn tất! (Gửi 50 requests đồng thời)
timeout /t 2 /nobreak >nul

echo.
echo 📁 [5/6] Path Traversal Attack...
curl -s http://localhost:5000/api/restaurants/../../../../etc/passwd >nul
curl -s http://localhost:5000/api/restaurants/..\\..\\..\\windows\\system32\\config\\sam >nul
curl -s http://localhost:5000/api/restaurants/%%2e%%2e%%2f%%2e%%2e%%2fetc%%2fpasswd >nul
echo    ✅ Hoàn tất!
timeout /t 2 /nobreak >nul

echo.
echo 👁️  [6/6] Suspicious Activity...
curl -s -X DELETE http://localhost:5000/api/users/all >nul
curl -s -X POST http://localhost:5000/api/admin/delete-database >nul
curl -s http://localhost:5000/api/users/passwords >nul
echo    ✅ Hoàn tất!
echo.

color 0A
echo ================================================================
echo    ✅ HOÀN TẤT! Tất cả các cuộc tấn công giả đã được tạo
echo ================================================================
echo.
color 0E
echo 📊 Giờ hãy kiểm tra Admin Dashboard:
echo    1. Vào http://localhost:3000/admin-login.html
echo    2. Đăng nhập: admin@foodserve.vn / admin123
echo    3. Nhấn "🛡️ AI Security Monitor"
echo    4. Bạn sẽ thấy tất cả các cuộc tấn công!
echo.
echo 💡 Thử nhấn "Chi tiết" và "⚡ Tự động sửa lỗi" để test AI!
echo.
pause
