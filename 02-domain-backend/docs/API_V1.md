# Hợp đồng tích hợp v1 — C++ backend của HAnh

Adapter chạy thử: `bash 02-domain-backend/tools/start.sh`, port 8080.
Mọi đường dẫn bên dưới có prefix `/api`. Body UTF-8 JSON, `Content-Type:
application/json`; giới hạn 64 KiB. Lỗi trả `{ "error": "..." }` và HTTP status.
Adapter Python chỉ nhận HTTP, gọi process C++ và chuyển kết quả ra HTTP; toàn bộ
nghiệp vụ và lưu dữ liệu nằm trong C++. Dũng có thể thay adapter này.

Đây là hợp đồng triển khai để đồng đội tích hợp; cần review cùng nhóm trước khi
chốt báo cáo. Tài liệu cũ trong frontend chưa được đồng bộ. Các khác biệt quan
trọng: reading có ID/device bắt buộc, response phải chọn alertId, trạng thái xử
lý là `responded`, và severity do backend trả. Không tự đổi số đo để “resolve”.

## Endpoint

| Method | Path | Thành công | Lõi C++ CLI |
| --- | --- | --- | --- |
| GET | /health | 200: `{status:"ok", backend:"cpp", shipments:0}` | shipments |
| GET | /shipments | 200: mảng shipment | shipments |
| POST | /shipments | 201: shipment mới | create-shipment |
| GET | /shipments/:id/readings | 200: `{shipmentId, readings:[...]}` | readings ID |
| POST | /readings | 201: shipment đã cập nhật | add-reading |
| GET | /alerts | 200: mảng alert | alerts |
| POST | /shipments/:id/responses | 200: phản hồi đã ghi | respond ID |

### POST /shipments

```json
{"name":"Demo shipment","min":2,"max":8,"criticalMargin":2}
```

`criticalMargin` mặc định 2. `name` 1–256 byte UTF-8, không được chỉ chứa khoảng
trắng. `-100 <= min < max <= 150`, `0 < criticalMargin <= 100`.

Response ví dụ:

```json
{"id":1,"name":"Demo shipment","min":2,"max":8,"criticalMargin":2,"temperature":null,"history":[],"connection":"loading","severity":"normal"}
```

ID là số nguyên dương do backend cấp, không phải chuỗi `shipment1` của firmware.
Trước reading đầu tiên: temperature null, connection loading. Sau đó connection
ok; phiên bản này chưa tính timeout tự động khi sensor ngừng gửi.

### POST /readings

```json
{"shipmentId":1,"deviceId":"device1","readingId":"device1:boot-a:1","temperature":9,"unit":"C","time":"2026-10-19T10:00:01Z"}
```

Tất cả field trên bắt buộc. `shipmentId` là số nguyên dương; `temperature` là số
hữu hạn trong [-100,150], không chấp nhận boolean/string. `unit` chỉ nhận C.
`deviceId`, `readingId` 1–256 byte. `readingId` phải duy nhất toàn bộ kho dữ liệu.
Time là UTC giây dạng chính xác `YYYY-MM-DDTHH:MM:SSZ`, kiểm tra ngày/tháng thật.
Reading mới có time nhỏ hơn reading đã nhận cho cùng shipment trả 409. Các time
bằng nhau được chấp nhận nếu readingId khác nhau (sensor có thể gửi trong cùng giây).
Duplicate trả 409, không tạo reading/cảnh báo mới; bên gửi có thể coi 409 duplicate
là đã gửi nhưng không được tự bỏ qua các loại 409 khác.

Response:

```json
{"id":1,"name":"Demo shipment","min":2,"max":8,"criticalMargin":2,"temperature":9,"history":[9],"connection":"ok","severity":"warning","lastReadingAt":"2026-10-19T10:00:01Z"}
```

`history` giữ tối đa 6 nhiệt độ gần nhất cho UI; endpoint /readings giữ toàn bộ
reading đã nhận, gồm các field request. Không có phân trang trong bản demo.

### Quy tắc severity của bản demo

| Điều kiện | Severity |
| --- | --- |
| min <= t <= max | normal |
| Ngoài [min,max] nhưng trong [min-criticalMargin,max+criticalMargin] | warning |
| Ngoài khoảng mở rộng trên | critical |

Với min=2,max=8,margin=2: 2 và 8 normal; 0,8.1,10 warning; -0.1,10.1 critical.
Đây là quy tắc lớp học, kế thừa proposal và C++ receiver với shipment 2–8°C.
Chưa phải tiêu chuẩn bảo quản sản phẩm thật. Mỗi reading không an toàn tạo một
alert riêng. Reading hồi phục không xoá alert cũ và không tự ghi dispatch response.

**Bảo:** frontend hiện có quy tắc `t > max` là critical, khác backend. Khi nối
API, dùng `shipment.severity`; connection khác ok vẫn ưu tiên hiển thị connection.
Không dùng logic mock để ghi đè giá trị backend.

### GET /alerts

```json
[{"id":1,"shipmentId":1,"readingId":"device1:boot-a:1","severity":"warning","temperature":9,"time":"2026-10-19T10:00:01Z","responseStatus":"pending"}]
```

ID ổn định trong kho dữ liệu này. Có thể lọc theo shipmentId ở client cho demo;
endpoint hiện trả toàn bộ. Khi đã phản hồi: responseStatus=responded, có thêm
`response` gồm alertId, shipmentId, action, note, recordedAt.

### POST /shipments/1/responses

```json
{"alertId":1,"action":"moved_to_backup_cooler","note":"Chuyển sang thùng dự phòng"}
```

`alertId` bắt buộc để tránh xử lý nhầm khi một shipment có nhiều cảnh báo.
`action` không trống, tối đa 256 byte; note tuỳ chọn, tối đa 4096 byte.
Mỗi alert tối đa một response trong demo. Response:

```json
{"shipmentId":1,"status":"responded","response":{"alertId":1,"shipmentId":1,"action":"moved_to_backup_cooler","note":"Chuyển sang thùng dự phòng","recordedAt":"2026-10-19T10:01:00Z"}}
```

recordedAt do server cấp. Trạng thái này có nghĩa đã ghi nhận hành động. Nhiệt độ,
severity và reading gốc vẫn nguyên vẹn; không thể khẳng định hàng an toàn từ thao
tác bấm nút. Không gửi `resolved` hoặc giả lập nhiệt độ trở về bình thường.

## Lỗi

- 400: thiếu/sai kiểu, time không hợp lệ, JSON lỗi, action trống.
- 404: route, shipment hoặc alert thuộc shipment đó không tồn tại.
- 409: readingId trùng, time sai thứ tự, alert đã có response.
- 413: body quá 64 KiB; 415: POST không có application/json.
- 500: state hỏng, không đọc/ghi được kho dữ liệu; không ghi đè state hỏng.
- 503: adapter không gọi được process C++ hoặc timeout.

HTTP adapter local dành cho demo, chưa có auth, TLS, giới hạn tổng kích thước
kho dữ liệu hay queue. Mặc định chỉ bind 127.0.0.1. API chưa có DELETE/reset.

## Dũng gọi lõi C++ từ API ngôn ngữ bất kỳ

```bash
printf '%s\n' '{"name":"Demo","min":2,"max":8}' \
  | 02-domain-backend/build/backend /path/to/state.json create-shipment
02-domain-backend/build/backend /path/to/state.json shipments
02-domain-backend/build/backend /path/to/state.json readings 1
```

CLI nhận body trên stdin, stdout đúng một JSON envelope `{ "status":201,
"body":{...} }`. Adapter lấy status làm HTTP status và body làm HTTP body.
Exit code 0 khi status <400, 1 khi lỗi. Gọi subprocess bằng mảng argument, không
ghép body/path thành shell command. Đặt đường dẫn state từ cấu hình server,
không lấy từ request người dùng. Mỗi lần gọi CLI là một transaction có khoá file.
API owner có thể bọc CLI trước rồi chuyển sang liên kết C++ trực tiếp sau.
