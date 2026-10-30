# G2 — Domain-Driven IoT Cold Chain Logistics

Bài tập nhóm: giám sát hàng nhạy cảm với nhiệt độ và điều phối giao hàng. Bản demo tích hợp React + Python HTTP API + SQLite; chạy được bằng cảm biến mô phỏng, không cần ESP32.

## Chạy ứng dụng

Yêu cầu: Python 3.12+ và Node.js/npm. Tại thư mục gốc dự án:

```powershell
cd 03-frontend/exercises/esp32
npm.cmd ci
npm.cmd run build
cd ../../..
python 02-domain-backend/src/server.py
```

Mở http://127.0.0.1:8000. Backend phục vụ cả API và giao diện đã build. Dữ liệu tự lưu ở `02-domain-backend/coldchain.sqlite3`, không đưa vào Git. Ctrl+C để dừng.

Khi phát triển giao diện: chạy backend như trên, mở terminal khác, vào `03-frontend/exercises/esp32` và chạy `npm.cmd start`. React proxy `/api` sang cổng 8000.

Muốn demo trên cơ sở dữ liệu mới mà không mất dữ liệu cũ:

```powershell
python 02-domain-backend/src/server.py --database 02-domain-backend/demo-session-02.sqlite3
```

## Demo nhanh

Xem [hướng dẫn demo từng bước cho 1–2 người](05-qa-documentation/HUONG_DAN_DEMO.md), bao gồm tạo nhiều shipment và xử lý các tình huống thường gặp.

1. Tạo chuyến hàng trên Dashboard; chọn chuyến trong bảng thao tác.
2. Phân xe và xuất phát; bấm vào thẻ chuyến trong danh sách để mở chi tiết.
3. Gửi lần lượt 5°C, 9°C, 12°C: normal → warning → critical.
4. Trong chi tiết chuyến, chọn hành động và nhập ghi chú, bấm **Ghi nhận xử lý**. Nhiệt độ vẫn là 12°C; cảnh báo chuyển acknowledged.
5. Gửi 5°C: cảnh báo được xác nhận recovered.
6. Hoàn tất giao hàng. Refresh hoặc khởi động lại server để kiểm tra dữ liệu vẫn còn.

Có thể chạy toàn bộ chuỗi bằng terminal thứ hai:

```powershell
python 04-esp32-sensor/examples/send_demo.py
```

Script tạo chuyến riêng mỗi lần chạy. `simulate_sensor.py` là bài tập JSON ngoại tuyến cũ; `send_demo.py` mới là mô phỏng gửi HTTP tích hợp.

## Quy tắc đã chọn

- 2 ≤ t ≤ 8°C: normal.
- 0 ≤ t < 2°C hoặc 8 < t ≤ 10°C: warning.
- t < 0°C hoặc t > 10°C: critical.
- Không có số đo: loading; số đo cuối quá 30 giây: timeout.
- `planned → in_transit → delivered`. Chỉ giao xong khi có số đo mới trong 30 giây và severity normal.
- Xác nhận xử lý không sửa số đo. Chỉ số đo mới xác nhận phục hồi.

Đây là ngưỡng minh họa cho hàng lạnh giả định trong lớp học.

## Kiểm thử

```powershell
python -m unittest discover -s 02-domain-backend/tests -v
python -m unittest discover -s 04-esp32-sensor/tests -v
cd 03-frontend/exercises/esp32
npm.cmd test -- --watchAll=false --runInBand
npm.cmd run build
```

## Tài liệu bàn giao

- [Báo cáo kỹ thuật, yêu cầu, DDD, kiến trúc và giới hạn](shared/architecture/BAO_CAO_DU_AN.md)
- [API contract](03-frontend/exercises/esp32/docs/API_CONTRACT.md)
- [Nội dung thuyết trình, lời thoại, demo và hỏi đáp](05-qa-documentation/NOI_DUNG_THUYET_TRINH.md)
- [Kiểm thử và đối chiếu yêu cầu](shared/testing/KET_QUA_KIEM_THU.md)

Các thư mục exercises và notes cũ được giữ làm tài liệu quá trình; mô tả triển khai hiện tại nằm trong các tài liệu liên kết ở trên. Bản ESP32/USB là nhánh thử nghiệm tùy chọn, chưa nối trực tiếp với HTTP API. Không có xác thực, tối ưu tuyến đường hoặc triển khai sản xuất trong phạm vi bài này.
