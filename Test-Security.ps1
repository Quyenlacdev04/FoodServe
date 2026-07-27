# 🧪 Security Test Script - PowerShell Version
# Tạo cuộc tấn công giả để test AI Security Monitor
# Usage: .\Test-Security.ps1

# Màu sắc
function Write-ColorText {
    param($Color, $Emoji, $Text)
    Write-Host "$Emoji $Text" -ForegroundColor $Color
}

Clear-Host
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   🛡️  SECURITY TEST - Tạo cuộc tấn công giả" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-ColorText Yellow "📋" "Script này sẽ tạo các cuộc tấn công giả để test AI Security"
Write-ColorText Yellow "🎯" "Mở Admin Dashboard trước khi chạy để xem real-time!"
Write-Host ""
Write-ColorText Magenta "⏰" "Bắt đầu trong 3 giây..."
Start-Sleep -Seconds 3
Write-Host ""

$API_BASE = "http://localhost:5000"

# 1. SQL Injection
Write-ColorText Red "💉" "[1/6] SQL Injection Attack..."
$payloads = @(
    @{ email = "admin' OR '1'='1"; password = "pass" },
    @{ email = "'; DROP TABLE users--"; password = "pass" },
    @{ email = "' UNION SELECT * FROM users--"; password = "pass" },
    @{ email = "admin' AND 1=1--"; password = "pass" }
)

foreach ($payload in $payloads) {
    try {
        $body = $payload | ConvertTo-Json
        Invoke-WebRequest -Uri "$API_BASE/api/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -ErrorAction SilentlyContinue | Out-Null
        Write-ColorText Yellow "   ↳" "SQL Injection: $($payload.email)"
        Start-Sleep -Milliseconds 500
    } catch {}
}
Write-ColorText Green "   ✅" "Hoàn tất!"
Start-Sleep -Seconds 2

# 2. XSS Attack
Write-Host ""
Write-ColorText Red "⚠️ " "[2/6] XSS Attack..."
$xssPayloads = @(
    @{ name = "<script>alert('XSS')</script>" },
    @{ name = "<img src=x onerror=alert(1)>" },
    @{ name = "javascript:alert('XSS')" },
    @{ name = "<iframe src='javascript:alert(1)'></iframe>" }
)

foreach ($payload in $xssPayloads) {
    try {
        $body = $payload | ConvertTo-Json
        Invoke-WebRequest -Uri "$API_BASE/api/restaurants" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -ErrorAction SilentlyContinue | Out-Null
        Write-ColorText Yellow "   ↳" "XSS: $($payload.name)"
        Start-Sleep -Milliseconds 500
    } catch {}
}
Write-ColorText Green "   ✅" "Hoàn tất!"
Start-Sleep -Seconds 2

# 3. Brute Force
Write-Host ""
Write-ColorText Red "🔨" "[3/6] Brute Force Attack..."
$passwords = @("123456", "password", "123456789", "qwerty", "abc123", "password123", "111111", "123123")

foreach ($pass in $passwords) {
    try {
        $body = @{ email = "admin@foodserve.vn"; password = $pass } | ConvertTo-Json
        Invoke-WebRequest -Uri "$API_BASE/api/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -ErrorAction SilentlyContinue | Out-Null
        Write-ColorText Yellow "   ↳" "Brute Force: Thử password `"$pass`""
        Start-Sleep -Milliseconds 300
    } catch {}
}
Write-ColorText Green "   ✅" "Hoàn tất!"
Start-Sleep -Seconds 2

# 4. DDoS Attack
Write-Host ""
Write-ColorText Red "🌊" "[4/6] DDoS Attack..."
$jobs = @()
for ($i = 1; $i -le 105; $i++) {
    $jobs += Start-Job -ScriptBlock {
        param($url)
        try {
            Invoke-WebRequest -Uri $url -UseBasicParsing -ErrorAction SilentlyContinue | Out-Null
        } catch {}
    } -ArgumentList "$API_BASE/api/restaurants"
}
$jobs | Wait-Job -Timeout 10 | Out-Null
$jobs | Remove-Job -Force
Write-ColorText Yellow "   ↳" "DDoS: Gửi 105 requests đồng thời"
Write-ColorText Green "   ✅" "Hoàn tất!"
Start-Sleep -Seconds 2

# 5. Path Traversal
Write-Host ""
Write-ColorText Red "📁" "[5/6] Path Traversal Attack..."
$paths = @(
    "../../../../etc/passwd",
    "..\..\..\..\windows\system32\config\sam",
    "%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    "....//....//etc/passwd"
)

foreach ($path in $paths) {
    try {
        Invoke-WebRequest -Uri "$API_BASE/api/restaurants/$path" -UseBasicParsing -ErrorAction SilentlyContinue | Out-Null
        Write-ColorText Yellow "   ↳" "Path Traversal: $path"
        Start-Sleep -Milliseconds 500
    } catch {}
}
Write-ColorText Green "   ✅" "Hoàn tất!"
Start-Sleep -Seconds 2

# 6. Suspicious Activity
Write-Host ""
Write-ColorText Red "👁️ " "[6/6] Suspicious Activity..."
$activities = @(
    @{ method = "DELETE"; endpoint = "/api/users/all" },
    @{ method = "POST"; endpoint = "/api/admin/delete-database" },
    @{ method = "GET"; endpoint = "/api/users/passwords" }
)

foreach ($activity in $activities) {
    try {
        Invoke-WebRequest -Uri "$API_BASE$($activity.endpoint)" -Method $activity.method -UseBasicParsing -ErrorAction SilentlyContinue | Out-Null
        Write-ColorText Yellow "   ↳" "Suspicious: $($activity.method) $($activity.endpoint)"
        Start-Sleep -Milliseconds 500
    } catch {}
}
Write-ColorText Green "   ✅" "Hoàn tất!"
Write-Host ""

# Kết thúc
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-ColorText Green "✅" "HOÀN TẤT! Tất cả các cuộc tấn công giả đã được tạo"
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

Write-ColorText Yellow "📊" "Giờ hãy kiểm tra Admin Dashboard:"
Write-ColorText Yellow "   " "1. Vào http://localhost:3000/admin-login.html"
Write-ColorText Yellow "   " "2. Đăng nhập: admin@foodserve.vn / admin123"
Write-ColorText Yellow "   " "3. Nhấn '🛡️ AI Security Monitor'"
Write-ColorText Yellow "   " "4. Bạn sẽ thấy tất cả các cuộc tấn công!"
Write-Host ""

Write-ColorText Cyan "💡" "Thử nhấn 'Chi tiết' và '⚡ Tự động sửa lỗi' để test AI!"
Write-Host ""

Read-Host "Nhấn Enter để thoát"
