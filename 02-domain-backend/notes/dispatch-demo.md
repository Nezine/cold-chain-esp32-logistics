# HAnh — Ghi nhận phản hồi cảnh báo bằng C++

Phần hoàn thành: đọc cảnh báo từ C++ receiver, ghi hành động xử lý, xem lại sau
khi chạy lại chương trình. Đây là module console, chưa phải HTTP API và chưa nối
frontend. Quy tắc demo bên dưới là lựa chọn cho module này, cần nhóm thống nhất
trước khi nối API; không thay thế hợp đồng frontend hiện có.

## Chạy trong cloud

Từ `/workspace/cold-chain-esp32-logistics`:

```bash
export PATH="/workspace/.venvs/cold-chain/bin:$PATH"
# Chạy khi chưa có dependency; có thể chạy lại an toàn.
bash 02-domain-backend/tools/setup_json_c.sh
export PKG_CONFIG_PATH=/workspace/deps/json-c-0.19/lib/pkgconfig
python3 04-esp32-sensor/tools/build_receiver.py
python3 02-domain-backend/tools/build_dispatch.py
python3 -m unittest discover -s 02-domain-backend/tests -v
```

Cần Python 3, g++, pkg-config, Git, CMake và json-c. Dùng json-c 0.19: bản 0.18
trong môi trường cũ từ chối UTF-8 tiếng Việt khi bật strict parsing. Script cài
bản chính thức vào workspace, kiểm tra commit, không sửa source dependency.
Không tắt strict parsing để che lỗi này.

## Demo một cảnh báo

```bash
demo_dir=$(mktemp -d)
printf '%s\n' '{"device_id":"device1","shipment_id":"shipment1","sequence":1,"uptime_ms":2000,"temperature":9,"unit":"C"}' \
  | 04-esp32-sensor/tools/build/serial_readings "$demo_dir/alerts.jsonl"
02-domain-backend/build/dispatch list "$demo_dir/alerts.jsonl" "$demo_dir/responses.jsonl"
alert_id=$(python3 -c 'import json,sys; print(json.loads(open(sys.argv[1]).readline())["alert_id"])' "$demo_dir/alerts.jsonl")
02-domain-backend/build/dispatch respond "$demo_dir/alerts.jsonl" "$demo_dir/responses.jsonl" \
  "$alert_id" moved_to_backup_cooler 'Chuyển sang thùng dự phòng'
# Chạy process mới: dữ liệu vẫn còn.
02-domain-backend/build/dispatch list "$demo_dir/alerts.jsonl" "$demo_dir/responses.jsonl"
```

Kết quả: `response_status` chuyển từ `pending` sang `responded`; số đo vẫn là
9°C, severity vẫn WARNING. Trạng thái `open` trong bản ghi gốc là trạng thái khi
cảnh báo được tạo, không phải trạng thái xử lý hiện tại. Không tuyên bố hàng đã
an toàn chỉ vì người dùng ghi nhận một hành động.

## Thiết kế để giải thích khi bảo vệ

- Receiver thêm `alert_id` ngẫu nhiên vào mỗi cảnh báo mới. Không dùng sequence
  làm ID vì sequence reset khi ESP32 khởi động lại. Xác suất trùng ID rất nhỏ;
  dispatch vẫn từ chối file có ID trùng. Chưa khử trùng các số đo gửi lại.
- `DispatchResponse` chứa alert ID, action, note và thời gian UTC do máy chủ ghi.
- `DispatchService` kiểm tra cảnh báo tồn tại, action không trống và cảnh báo chưa
  được phản hồi. Mỗi cảnh báo có tối đa một phản hồi trong demo này; action là
  chuỗi do người dùng nhập, chưa có danh sách hành động chuẩn.
- `ResponseRepository` là giao diện thuần ảo. Service dùng giao diện này thay vì
  biết chi tiết file. `JsonlResponseRepository` triển khai việc đọc/ghi JSONL.
  Đây là Repository Pattern và đa hình. Có thể thêm implementation SQLite sau.
- Observer hiện có vẫn tạo cảnh báo qua TemperatureMonitor. Không cần thêm một
  Observer chỉ để xử lý thao tác thủ công của người điều phối.
- CLI chỉ chuyển tham số vào service, in JSON và trả exit code khác 0 khi lỗi.

## Kiểm thử và giới hạn

8 kiểm thử tích hợp dùng receiver thật và CLI thật: tạo ID/cảnh báo, lưu và đọc
lại ở process mới, tiếng Việt/dấu nháy/xuống dòng, từ chối phản hồi trùng,
ID không tồn tại/action trống, lỗi đường dẫn lưu, file JSON hỏng, file nguồn và
đích trùng hoặc symlink, và cảnh báo cũ không có ID.

File cảnh báo cũ không có `alert_id` sẽ bị từ chối rõ ràng. Dùng file demo mới;
không tự gán lại ID hoặc xoá dữ liệu cũ. Chưa cung cấp migration.

Chỉ dùng một process ghi responses tại một thời điểm. File append + flush
không bảo đảm giao dịch, khoá đồng thời hoặc phục hồi sau mất điện. Giữ cặp file
alerts/responses cùng nhau; không xoá/cắt alert log mà giữ response log cũ.
Không có đăng nhập, danh tính người phản hồi, API hay xác minh hành động vật lý.

Câu hỏi bảo vệ: vì sao phản hồi không sửa nhiệt độ? Vì sao không dùng sequence
làm alert ID? Đổi JSONL sang SQLite thì class nào cần triển khai thêm? Điều gì
có thể xảy ra nếu hai process cùng phản hồi một cảnh báo?
