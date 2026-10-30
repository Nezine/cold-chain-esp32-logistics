# API Contract — bản tích hợp

Base URL `/api`, JSON, chạy localhost:8000. Frontend polling mỗi 2 giây. Backend là nguồn xác định severity. Mọi lỗi validation trả 400 `{ "error": "..." }`; không tìm thấy trả 404. Không có xác thực trong demo.

## GET /health

200 `{ "status": "ok" }`.

## GET /shipments

200: mảng shipment. Cơ sở dữ liệu mới trả `[]`.

```json
{
  "id": 1, "name": "Hang lanh demo", "min": 2, "max": 8,
  "deviceId": "sensor-1", "vehicle": null, "status": "planned",
  "severity": "normal", "temperature": null, "lastReadingAt": null,
  "connection": "loading", "history": [], "alerts": []
}
```

`status`: planned/in_transit/delivered. `connection`: loading (chưa đo), ok (mới trong 30 giây), timeout (quá 30 giây). `history` tối đa 60 nhiệt độ gần nhất theo thứ tự thời gian. Severity và connection là hai khái niệm độc lập.

## POST /shipments

```json
{ "name": "Hang lanh demo", "min": 2, "max": 8, "deviceId": "sensor-1" }
```

201: shipment mới. Min/max hữu hạn, min < max. UI mặc định [2,8].

## POST /readings

```json
{
  "readingId": "unique-id-1", "shipmentId": 1, "deviceId": "sensor-1",
  "temperature": 9, "unit": "C", "time": "2026-10-28T06:00:00Z"
}
```

201: shipment cập nhật, có alerts. Khi thử cần thay `time` bằng giờ hiện tại; ví dụ cố định có thể bị coi là cũ. Không nhận timestamp tương lai/không có timezone; không nhận số đo cũ hơn hoặc bằng số đo cuối. `shipmentId` là số nguyên, phải tồn tại; sensor phải khớp.

Retry cùng readingId và cùng nội dung: trả 201 với trạng thái hiện tại, không ghi thêm. Cùng ID khác nội dung: 400. Unit khác C, bool/string/NaN thay số, thiếu field: 400. Chuyến delivered từ chối số đo mới.

## GET /shipments/:id/readings

200 `{ "shipmentId": 1, "readings": [...] }`. Mỗi reading có `id`, `shipment`, `device`, `temperature`, `time`. Lịch sử đầy đủ đã lưu, sắp tăng theo thời gian.

## POST /shipments/:id/dispatch

```json
{ "vehicle": "XE-LANH-01", "status": "in_transit" }
```

200: shipment cập nhật. Lần tiếp theo có thể chuyển delivered với mã xe. Chỉ planned → in_transit → delivered; hoàn tất cần nhiệt độ normal và số đo mới trong 30 giây. Mã xe bắt buộc; không có tối ưu tuyến hay kiểm tra lịch xe.

## POST /shipments/:id/responses

```json
{ "alertId": 1, "action": "moved_to_backup_cooler", "note": "Da chuyen sang thung du phong" }
```

200: shipment cập nhật, số đo giữ nguyên. alertId phải thuộc shipment. action/note bắt buộc. Có thể ghi nhiều phản ứng; API không coi retry response là idempotent.

Alert có `id`, `shipment`, `severity`, `opened`, `recovered`, `closure`, `responses`, `status`. `recovered` là thời điểm kết thúc đợt; `closure` phân biệt recovered (trở về normal) và superseded (đổi mức bất thường). Khi chưa đóng, status là open hoặc acknowledged. Response có id, alert, action, note, time.

## Quy tắc nhiệt độ

Normal: min ≤ t ≤ max. Warning: min−2 ≤ t < min hoặc max < t ≤ max+2. Critical: ngoài hai miền trên. Với [2,8], 0/10 là warning, 2/8 là normal. Không tạo alert mới khi vẫn cùng cấp; thay cấp sẽ kết thúc đợt cũ và mở đợt mới; normal xác nhận phục hồi.

## Tích hợp sensor

`send_demo.py` dùng contract camelCase này. Các ví dụ JSON/USB cũ dùng snake_case là bài tập ngoại tuyến và không được gửi thẳng vào API. Cần adapter ánh xạ trường, mã shipment số nguyên, timestamp UTC và readingId duy nhất nếu nối ESP32 sau này.
