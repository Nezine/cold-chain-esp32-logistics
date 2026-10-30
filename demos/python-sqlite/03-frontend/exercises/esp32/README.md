# Frontend tích hợp — Cold Chain Monitor

React dashboard sử dụng Python API và SQLite. Xem hướng dẫn đầy đủ tại [README gốc](../../../README.md).

```powershell
npm.cmd ci
npm.cmd start
```

Trước đó chạy backend từ thư mục gốc: `python 02-domain-backend/src/server.py`. React dev server proxy `/api` sang `http://127.0.0.1:8000`.

Để demo bằng một server: `npm.cmd run build`, sau đó mở `http://127.0.0.1:8000`.

- `services/shipmentService.js`: gọi HTTP thật, không trả mock.
- `components/Operations.jsx`: tạo chuyến, điều phối, gửi số đo demo.
- `components/DetailPanel.jsx`: lịch sử và ghi nhận xử lý cảnh báo.
- `domain/status.js`: ưu tiên severity của backend; fallback cùng quy tắc 2–8/0–10.
- `domain/AlertObserver.js`: subject cho feed, một subscriber trong App.
- `hooks/useSensorSimulation.js`, `data/shipments.js`, `pages/Settings.jsx`: ví dụ cũ được giữ lại, không còn được App sử dụng.

Kiểm thử: `npm.cmd test -- --watchAll=false --runInBand --cacheDirectory=node_modules/.cache/jest`.
API hiện hành: [API_CONTRACT.md](docs/API_CONTRACT.md).
