# API Contract — Cold Chain Monitor (Frontend ↔ Backend)

Base URL: `/api` (đổi trong `src/services/shipmentService.js` khi backend có domain thật).

## GET /shipments
Trả danh sách shipment hiện tại.

Response 200:
```json
[
  { "id": 1, "name": "Vaccine Batch A", "min": 2, "max": 8, "temperature": 3.4,
    "history": [3.1, 3.2, 3.3, 3.4], "connection": "ok" }
]
```
- `connection`: `"ok" | "loading" | "timeout" | "error"`

## GET /shipments/:id/readings
Lịch sử nhiệt độ chi tiết của một shipment.

Response 200: `{ "shipmentId": 1, "readings": [{ "temperature": 3.4, "time": "2026-09-24T10:00:00Z" }] }`

## POST /readings
Sensor gửi một điểm đo mới (mock qua `useSensorSimulation`, sau này ESP32 gọi thật).

Request:
```json
{ "shipmentId": 1, "temperature": 3.6, "unit": "C", "time": "2026-09-24T10:00:05Z" }
```
Response 201: shipment đã cập nhật. Response 400 khi thiếu `shipmentId`/`temperature`.

## POST /shipments/:id/responses
Ghi lại hành động dispatcher đã thực hiện cho một alert.

Request: `{ "action": "moved_to_backup_cooler", "note": "" }`
Response 200: `{ "shipmentId": 1, "status": "resolved" }`. Response 404 nếu shipment không tồn tại.

## POST /shipments
Tạo shipment mới.

Request: `{ "name": "Milk Container", "min": 2, "max": 6 }`
Response 201: shipment vừa tạo. Response 400 khi thiếu `name`/`min`/`max`.

## ngưỡng cảnh báo (warning/critical) hiện đang tính ở frontend (domain/status.js), backend chỉ cần gửi số đo thô + min/max. Tránh trường hợp hai bên tự tính severity theo cách khác nhau.

## Thống nhất tên field và đơn vị (temperature, unit: "C", connection: "ok"|"loading"|"timeout"|"error") — vì logic getStatus/getSeverity trong domain/status.js đang dựa hoàn toàn vào các tên field này, nếu backend trả khác tên sẽ vỡ UI.