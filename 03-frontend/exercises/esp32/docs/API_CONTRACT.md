# API Contract — Frontend dùng gì từ Backend

Nguồn chính thức: [`02-domain-backend/docs/API_V1.md`](../../../../02-domain-backend/docs/API_V1.md).
File này chỉ ghi lại phần **frontend thực sự gọi** và cách UI hiểu dữ liệu. Nếu hai
file khác nhau, API_V1.md đúng; hãy báo để sửa file này.

Base URL: `/api` (cùng origin). Khi chạy `npm start`, proxy trong `package.json`
(`"proxy": "http://127.0.0.1:8080"`) chuyển `/api` sang backend. Backend không bật CORS,
nên không gọi thẳng port 8080 từ trình duyệt. Khi triển khai thật cần reverse proxy
tương đương (hoặc đặt `REACT_APP_API_URL`).

Mọi code gọi API nằm trong `src/services/shipmentService.js`.

## Endpoint đang dùng

| Method | Path | Dùng ở đâu |
| --- | --- | --- |
| GET | `/shipments` | Dashboard, Shipments, Reports (poll 2 giây/lần) |
| GET | `/alerts` | Live Alerts, trang Alerts, Live Alert Feed, form phản hồi (poll cùng lúc) |
| POST | `/shipments/:id/responses` | Nút "Record response" trong Shipment details |

Chưa dùng: `GET /shipments/:id/readings` (lịch sử đầy đủ), `POST /shipments`,
`POST /readings` (sensor/bridge gọi, không phải UI).

## Quy tắc UI

- **Severity do backend quyết định** (`shipment.severity`: `normal | warning | critical`).
  Frontend không tự tính từ nhiệt độ (`domain/status.js` chỉ đọc). Giá trị thiếu hoặc lạ
  hiện là `ERROR`, không hiện `NORMAL`.
- **Connection ưu tiên hơn severity**: `connection` khác `ok` (`loading | timeout | error`)
  thì hiện trạng thái kết nối. Backend hiện chưa tự tính `timeout`.
- **Shipment mới**: `temperature: null`, `history: []`, `connection: "loading"` →
  UI hiện "Waiting for data..." và `—`, không đếm vào Normal/Warning/Critical.
- **Alert**: `responseStatus` là `pending` hoặc `responded` (kèm `response` gồm
  `action`, `note`, `recordedAt`). Số lượng alert chờ xử lý hiện trên chuông.
- **Phản hồi chỉ là ghi nhận hành động**, không phải "resolved". Request:
  `{ "alertId": 1, "action": "moved_to_backup_cooler", "note": "..." }` (`note` bỏ qua
  nếu để trống). Frontend không sửa nhiệt độ, severity hay reading; số đo mới do sensor
  gửi lên quyết định.
- Lỗi: backend trả `{ "error": "..." }` + HTTP status; UI hiện đúng thông điệp đó
  (ví dụ 409 khi alert đã có phản hồi). Mất kết nối thì giữ dữ liệu cũ và tự thử lại.

## Hành động phản hồi UI đang cho chọn

`moved_to_backup_cooler`, `contacted_driver`, `rerouted_to_cold_warehouse`
(`src/domain/responseActions.js`). Backend nhận mọi chuỗi không rỗng (tối đa 256 byte)
nên thêm giá trị mới chỉ cần sửa file này.

## Chế độ mock (không cần backend)

```bash
REACT_APP_USE_MOCK=true npm start      # Windows PowerShell: $env:REACT_APP_USE_MOCK="true"; npm start
```

`services/mockBackend.js` trả cùng dạng JSON như API_V1 (cùng quy tắc severity, alert,
responded) và `useSensorSimulation` chỉ chạy ở chế độ này. Mặc định (không đặt biến) là
chế độ API thật.
