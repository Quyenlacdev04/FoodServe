# 📝 Git Commit Message

```bash
git add .
git commit -m "feat: Add real-time GPS tracking with route drawing

✨ Features:
- Add real-time shipper GPS tracking (5s interval)
- Auto route drawing with Leaflet Routing Machine + OSRM
- Shipper marker with pulse animation
- Distance & ETA display
- Socket.io broadcasting for live updates

🐛 Bug Fixes:
- Fix black screen error (removed unsupported 'vi' language in formatter)
- Fix 'orders is not defined' error in ShipperDashboardPage

🔧 Technical:
- New API: POST /api/shipper/update-location
- New backend route: server/routes/shipper.js
- Update ShipperDashboardPage to send GPS every 5s
- Improved SimpleMapView route rendering logic

📄 Documentation:
- GPS_TRACKING_COMPLETE.md - Complete feature guide
- VOUCHER_FIX.md - Voucher NaN fix
- VOUCHER_NOTIFICATIONS.md - Smart notifications
- TEST_VOUCHER_SCENARIOS.md - Test scenarios
"

git push origin main
```

## Các file đã thay đổi:

### Mới tạo:
- `server/routes/shipper.js`
- `GPS_TRACKING_COMPLETE.md`
- `VOUCHER_FIX.md`
- `VOUCHER_NOTIFICATIONS.md`
- `TEST_VOUCHER_SCENARIOS.md`
- `FIXES_SUMMARY.md`

### Đã sửa:
- `server/index.js` (register shipper routes)
- `src/pages/ShipperDashboardPage.jsx` (GPS tracking)
- `src/components/tracking/SimpleMapView.jsx` (fix formatter bug)
- `src/components/cart/CartSidebar.jsx` (voucher fixes)
- `src/store/slices/cartSlice.js` (discount validation)
- `server/routes/vouchers.js` (shortage calculation)
