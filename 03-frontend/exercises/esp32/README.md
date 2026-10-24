# Cold Chain Monitor — Frontend

Dashboard theo dõi và cảnh báo nhiệt độ cho hàng hoá cần bảo quản lạnh (vaccine, đồ tươi sống) trong quá trình vận chuyển.

## Chạy dự án

Chạy backend trước (từ thư mục gốc repo, xem `02-domain-backend/docs/HANDOFF.md`):

```bash
bash 02-domain-backend/tools/setup.sh   # lần đầu
bash 02-domain-backend/tools/start.sh   # port 8080
```

Rồi chạy frontend (proxy `/api` -> `127.0.0.1:8080` đã cấu hình trong `package.json`;
khởi động lại `npm start` nếu vừa đổi proxy):

```bash
npm install
npm start
npm test -- --watchAll=false
```

Không có backend? Chạy bằng dữ liệu mock: `REACT_APP_USE_MOCK=true npm start`.

## Cấu trúc

```
src/
├── components/    UI dùng lại (thẻ shipment, panel alert, sidebar...)
├── pages/         Dashboard, Shipments, Alerts, Reports, Settings
├── domain/        Logic nghiệp vụ độc lập UI (status.js, AlertObserver.js)
├── services/      shipmentService.js gọi API thật; mockBackend.js chỉ dùng ở chế độ mock
├── hooks/         useSensorSimulation (chỉ chế độ mock), useTheme
└── data/          Dữ liệu mẫu cho chế độ mock
```



## Trạng thái hiện tại

- Dữ liệu shipment và alert: lấy từ backend qua `services/shipmentService.js`, tải lại mỗi 2 giây
  (`GET /api/shipments`, `GET /api/alerts`). Mất kết nối thì giữ dữ liệu cũ và tự thử lại.
- Severity (`normal | warning | critical`) do backend trả về; UI không tự tính (`domain/status.js`).
- Nút "Record response" gửi `alertId`, `action`, `note` tới `POST /api/shipments/:id/responses`.
  Alert chuyển sang `RESPONDED`, số đo nhiệt độ giữ nguyên.
- Cảnh báo mới được thông báo bằng Observer pattern (`domain/AlertObserver.js`): Live Alert Feed đăng ký nhận.
- Chi tiết endpoint và quy tắc hiển thị: `docs/API_CONTRACT.md`.
