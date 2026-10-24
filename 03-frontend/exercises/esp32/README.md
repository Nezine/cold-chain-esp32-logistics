# Cold Chain Monitor — Frontend

Giao diện React kết nối C++ backend: tạo shipment, đọc nhiệt độ/cảnh báo, chọn
cảnh báo để ghi phản hồi và giữ lịch sử sau khi server khởi động lại.

## Chạy từ repo đã clone

Terminal 1, tại repository root (lần đầu chạy setup):

```bash
bash 02-domain-backend/tools/setup.sh
bash 02-domain-backend/tools/start.sh
```

Terminal 2:

```bash
cd 03-frontend/exercises/esp32
npm ci
BROWSER=none HOST=127.0.0.1 npm start
```

src/setupProxy.js chuyển /api sang backend local port 8080. Không cần đổi CORS
hoặc thêm field proxy trong package.json. Khi triển khai production, reverse
proxy của host phải chuyển /api sang backend; npm run build chỉ tạo static files.

Tạo shipment bằng form trong Dashboard. Shipment mới hiển thị LOADING cho đến
reading đầu tiên. Dữ liệu được tải lại tuần tự khoảng 2 giây/lần; không có timer
frontend tự sửa nhiệt độ. Nếu backend mất kết nối, UI báo lỗi, giữ bản dữ liệu
cuối cùng và cho Retry connection; không tự chuyển sang dữ liệu mock.

Gửi fixture từ repository root, thay --shipment-id bằng ID shipment đã tạo:

```bash
python3 02-domain-backend/tools/sensor_bridge.py --shipment-id 1 --session-id demo-boot \
  < 02-domain-backend/examples/firmware-demo.jsonl
```

Fixture tạo 5°C normal, 9°C warning, 12°C critical cho khoảng 2–8°C, margin 2.
Chọn shipment rồi chọn alert cụ thể, action và note để Record response. UI lưu
response thật qua API và không sửa số đo để giả lập phục hồi. Alerts hiển thị
cả lịch sử pending/responded; response không xoá alert khi nhiệt độ trở về bình thường.

## Kiểm thử

```bash
CI=true npm test -- --watchAll=false --runInBand
npm run build
```

8 tests kiểm tra dữ liệu backend, tạo shipment, chọn đúng alert, không đổi nhiệt
độ khi phản hồi, lỗi kết nối, polling/retry và định dạng request. Test starter
learn-react cũ đã được thay bằng kiểm thử hành vi ứng dụng.

Có thêm smoke test Chromium dùng backend C++ thật. Cần Playwright 1.58.0 và
Chromium được cài trên máy. Giữ frontend dev server đang chạy nhưng dừng backend
của bạn trước khi chạy, vì smoke test tự mở backend riêng port 8080 với data tạm:

```bash
python3 tools/browser_smoke.py
# Có thể chỉ định --frontend-url và --chromium nếu port/path khác.
```

Smoke test không xoá data server thật, không intercept/mock HTTP. Nó kiểm tra tạo
shipment từ UI, 5/9/12°C, lưu phản hồi, không drift sau 4 giây, mất kết nối, restart
API và reload trang vẫn giữ response/số đo.

## Cấu trúc và contract

- src/services/shipmentService.js: HTTP repository client, không fallback mock.
- src/hooks/useLogistics.js: polling, bảo vệ snapshot cũ và refresh sau mutation.
- src/domain/status.js: dùng severity backend trả; ưu tiên connection khi chưa có dữ liệu.
- src/domain/AlertObserver.js: thông báo cho live feed khi thấy alert ID mới.
- src/components/DetailPanel.jsx: chọn alert và ghi action/note.
- src/data/shipments.js và useSensorSimulation.js: fixture/bài tập cũ, không dùng trong App.

[Contract API chuẩn](../../../02-domain-backend/docs/API_V1.md).
Không có auth, deploy production hoặc phát hiện sensor timeout tự động trong bản demo này.
