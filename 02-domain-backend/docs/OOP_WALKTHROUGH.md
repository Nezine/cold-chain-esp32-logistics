# HAnh giải thích phần C++ trước giảng viên

## Bắt đầu bằng câu chuyện

“Em tạo một shipment có khoảng nhiệt độ 2–8°C. Sensor gửi số đo 9°C. Backend kiểm
tra dữ liệu, lưu reading, thông báo cho monitor và tạo warning. Người điều phối
ghi hành động chuyển hàng sang thùng dự phòng. Hành động được lưu lại, số đo vẫn
là 9°C. Khởi động lại chương trình vẫn đọc được lịch sử.”

Chạy `python3 02-domain-backend/tools/demo.py` để chứng minh câu chuyện này,
với thêm số đo 5 và 12°C. Demo khởi động lại cả API rồi kiểm tra persistence.

## Đi theo code, đừng học thuộc định nghĩa

Trong src/backend.h:

1. `Shipment::classify`: quy tắc nhiệt độ cho một khoảng min/max và margin.
   Đây là nơi để giải thích encapsulation ở mức trách nhiệm nghiệp vụ; Shipment
   là struct dữ liệu đơn giản, chưa phải aggregate domain phức tạp.
2. `LogisticsService::addReading`: kiểm tra shipment, unit, ID, time; từ chối
   duplicate/out-of-order; thêm reading và cập nhật latest/history.
3. `ReadingPublisher::publish`: gọi `onReading` trên giao diện ReadingObserver.
   `AlertMonitor` triển khai giao diện, phân loại và tạo alert nếu không an toàn.
   Observer chạy đồng bộ trong process; không có thread hoặc WebSocket tự sinh.
4. `StateRepository`: giao diện với load/save và destructor virtual. Service
   phụ thuộc giao diện này. `FileStateRepository` triển khai bằng snapshot JSON.
   Có thể bổ sung SQLite implementation mà giữ nguyên logic service.
5. `FileStateRepository` giữ khoá suốt vòng đời qua RAII. Khi object ra khỏi
   scope hoặc exception, destructor giải phóng khoá. File snapshot được thay sau
   khi hoàn thành toàn bộ thay đổi; request bị từ chối không sửa snapshot.
6. src/backend_cli.cpp chỉ chuyển command/stdin sang lời gọi service, đổi Error
   thành status/body JSON. tools/dev_api.py chỉ đổi HTTP sang CLI rồi trả body.

Nói được bốn ý OOP bằng ví dụ cụ thể:

| Ý | Chỗ chỉ vào code |
| --- | --- |
| Đóng gói | state_, repository_ private trong LogisticsService; đổi dữ liệu qua phương thức |
| Trừu tượng hoá | StateRepository công bố load/save, giấu cơ chế lưu |
| Kế thừa | FileStateRepository : public StateRepository; AlertMonitor : public ReadingObserver |
| Đa hình | repository_.save() và observer.onReading() gọi implementation qua giao diện |

Không cần cố tạo kế thừa Shipment -> VaccineShipment nếu chưa có hành vi khác
nhau. Không cần nói struct tự động là “không OOP”: C++ struct cũng có method,
class/struct khác mặc định quyền truy cập.

## Vì sao chọn thiết kế này?

- ID reading không dùng riêng sequence: sequence reset khi reboot. Bridge kết
  hợp device, boot session và sequence; backend reject ID đã tồn tại.
- Shipment nhận ID số để khớp frontend. ID sensor là chuỗi riêng.
- Alert là sự kiện lịch sử, severity không đổi sau khi response được ghi.
- Response gắn alertId cụ thể vì shipment có thể có nhiều alert.
- Nhận reading và tạo alert cùng một snapshot: không có trạng thái lưu reading
  thành công nhưng mất alert do một file khác ghi thất bại.
- Một luồng demo nhỏ dùng JSON dễ đọc/giải thích; kho lớn hơn cần database thật.

## Câu hỏi tự luyện

1. Với min=2,max=8,margin=2: tại sao 10 warning nhưng 10.1 critical?
2. Nếu gửi lại cùng readingId, reading/history/alerts có tăng không? Test nào chứng minh?
3. Nếu nhận 12°C rồi 5°C, alert cũ có mất không? Nếu người dùng bấm xử lý thì sao?
4. Nếu hai API request phản hồi cùng một alert, vì sao chỉ một thành công?
5. Đổi JSON snapshot sang SQLite thì viết implementation nào? Có cần đổi class policy không?
6. Python đang làm gì trong dự án C++? Chỉ vận chuyển HTTP/serial, build và test;
   các quy tắc và thao tác nghiệp vụ chạy trong binary C++.
7. Phần nào chưa chạy thật? Cảm biến vật lý/USB, frontend integration và triển khai
   production; không được trình bày chúng như đã hoàn thành chỉ vì console chạy.
