# Cold Chain Monitor — Frontend

Dashboard theo dõi và cảnh báo nhiệt độ cho hàng hoá cần bảo quản lạnh (vaccine, đồ tươi sống) trong quá trình vận chuyển.

## Chạy dự án

```bash
npm install
npm start
```

## Cấu trúc

```
src/
├── components/    UI dùng lại (thẻ shipment, panel alert, sidebar...)
├── pages/         Dashboard, Shipments, Alerts, Reports, Settings
├── domain/        Logic nghiệp vụ độc lập UI (status.js, AlertObserver.js)
├── services/      Lớp gọi dữ liệu (repository) — hiện trả mock data,
│                  sau này đổi thành gọi API thật theo docs/API_CONTRACT.md
├── hooks/         useSensorSimulation (mock cảm biến), useTheme
└── data/          Mock shipments dùng khi chưa có backend
```



## Trạng thái hiện tại

- Dữ liệu shipment: mock, lấy qua `services/shipmentService.js` (async, giả lập độ trễ mạng).
- Cảm biến: mô phỏng bằng `hooks/useSensorSimulation.js`, không cần phần cứng thật.
- Cảnh báo: dùng Observer pattern (`domain/AlertObserver.js`) — component đăng ký nhận cập nhật thay vì App gọi trực tiếp.
- Chưa nối API thật — xem `docs/API_CONTRACT.md` để biết endpoint backend cần cung cấp.

