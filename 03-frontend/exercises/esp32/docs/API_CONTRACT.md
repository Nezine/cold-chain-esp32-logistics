# Frontend ↔ Backend API

Contract triển khai dùng chung: [API v1 của C++ backend](../../../../02-domain-backend/docs/API_V1.md).

Frontend gọi /api qua src/setupProxy.js khi chạy npm start. Production cần reverse
proxy cùng origin; không thay port 8080 vào URL fetch của browser.

Các thay đổi so với contract mock cũ:

- Shipment có severity do backend phân loại; frontend không tự đặt ngưỡng khác.
- Reading cần thêm deviceId và readingId để kiểm tra nguồn và duplicate.
- POST /shipments/:id/responses cần alertId để chọn đúng cảnh báo.
- Phản hồi có status=responded; không đổi temperature hoặc xoá cảnh báo lịch sử.
- GET /alerts cung cấp lịch sử và responseStatus, thay vì suy ra alert từ latest temperature.
- Shipment mới có temperature=null, connection=loading và history=[].

API client trong services/shipmentService.js, polling trong hooks/useLogistics.js.
Không có mock fallback khi backend lỗi; UI giữ dữ liệu cũ kèm cảnh báo mất kết nối.
