# Kết quả kiểm thử — 28/10/2026

## Các lệnh đã thực hiện

| Hạng mục | Lệnh | Kết quả |
|---|---|---|
| Backend | `python -m unittest discover -s 02-domain-backend/tests -v` | PASS: 10 test |
| Simulator JSON cũ | `python -m unittest discover -s 04-esp32-sensor/tests -v` | PASS: 3 test |
| React | `npm.cmd test -- --watchAll=false --runInBand --cacheDirectory=node_modules/.cache/jest` | PASS: 11 test |
| Production build | `npm.cmd run build` | Compiled successfully |
| Demo HTTP | `python 04-esp32-sensor/examples/send_demo.py` | normal → warning → critical → phản ứng giữ 12°C → normal → delivered |
| Browser demo | Ứng dụng build trên localhost:8000 | Tạo chuyến, phân xe, nhận 5/9/12, từ chối delivered, acknowledged, phục hồi 5, delivered đều đúng |

Tổng cộng 24 test tự động đạt. Một số test dùng subTest để kiểm tra nhiều dữ liệu biên bên trong; không cộng các subcase vào tổng test Python.

Trong môi trường thực hiện, test HTTP cần quyền kết nối localhost; test Jest chuyển cache vào node_modules để tránh giới hạn ghi thư mục temp. Các lỗi môi trường ban đầu đã được khắc phục trước khi ghi kết quả PASS. Cài dependency có cảnh báo deprecated của react-scripts; build vẫn thành công, chưa kiểm toán bảo mật toàn bộ dependency.

## Đối chiếu yêu cầu

| ID | Bằng chứng | Kết quả |
|---|---|---|
| FR01 | create trong test_complete_flow_and_persistence; tạo chuyến trên browser | PASS |
| FR02 | test_state_machine_and_validation, test_complete_flow_and_persistence; phân xe và giao hàng browser | PASS |
| FR03 | test_http_contract, send_demo.py | PASS |
| FR04 | test_boundaries; 7 ca phân loại frontend | PASS |
| FR05 | test_sustained_alert_and_escalation; test_complete_flow_and_persistence; browser acknowledged vẫn 12°C | PASS |
| FR06 | Đóng connection rồi mở lại DB trong test_complete_flow_and_persistence | PASS |
| FR07 | test_duplicate_and_conflicting_id, test_invalid_readings, test_out_of_order_and_missing_shipment | PASS |
| FR08 | React test màn hình trống/lỗi; browser hiển thị dữ liệu, nhật ký; backend test_stale_and_empty | PASS trong phạm vi các ca đã chạy |
| FR09 | Script HTTP tạo chuyến riêng và hoàn thành quy trình | PASS |
| Observer | test_observer_failure_rolls_back; frontend subscribe/unsubscribe test | PASS |

## Nhật ký demo tự động thực tế

```text
Shipment 2: 5 C -> normal
Shipment 2: 9 C -> warning
Shipment 2: 12 C -> critical
Response recorded; temperature still 12 C
Shipment 2: 5 C -> normal
Shipment 2: delivered; history and responses saved.
```

## Những phần chưa kiểm chứng

- ESP32 vật lý và adapter USB/MQTT đi vào API.
- Hiệu năng tải lớn, nhiều thiết bị thực, mất điện khi ghi dữ liệu.
- Tất cả trình duyệt, viewport điện thoại và accessibility đầy đủ.
- Xác thực/phân quyền, danh tính người điều phối, chống trùng lịch xe: ngoài phạm vi đã triển khai.

Đây là kết quả kiểm tra kỹ thuật đã chạy trong phiên hoàn thiện, không phải biên bản nghiệm thu của giảng viên hay xác nhận mọi thành viên đã review.

## Bổ sung kiểm thử nhiều shipment — 30/10/2026

- Trước sửa: tạo TEST-3010-A/B/C (#3/#4/#5) thành công trên browser. Tái hiện dropdown chọn C nhưng chi tiết vẫn A; khi tìm A, C bị ẩn trong danh sách. Không tái hiện lỗi API giới hạn một shipment.
- Sau sửa: tạo DEMO-3010-A (#6), sau đó tìm A và tạo DEMO-3010-B (#7). Bộ lọc tự xóa, hiển thị 7/7 chuyến, dropdown và chi tiết cùng chọn B.
- Chọn A qua dropdown, phân XE-DEMO-A, gửi 5/9/12°C: normal/warning/critical; thử delivered bị từ chối; ghi phản ứng vẫn giữ 12°C; gửi 5°C rồi delivered thành công.
- Chọn B bằng thẻ chuyến và gửi -1°C: dropdown/chi tiết cùng B; B critical, A vẫn delivered và giữ lịch sử riêng.
- Reload: 7 chuyến còn nguyên, A giữ nhật ký 5 → 9 → 12 → 5 và phản ứng đã ghi.
- Backend: 10/10 test PASS, đã mở rộng test_http_contract với ba POST tạo cùng tên, kiểm tra ba ID khác nhau và GET đủ số lượng.
- Frontend: 13/13 test PASS, gồm hai test mới cho tạo liên tiếp, bộ lọc, đồng bộ selection và gửi đúng shipment.
- Production build: Compiled successfully. `git diff --check` không có lỗi whitespace.
- Bằng chứng: `multiple-shipments-before.png`, `multiple-shipments-after.png` trong cùng thư mục.

Chưa có log hoặc thao tác chính xác từ máy người báo lỗi. Hai lỗi giao diện trên được xác nhận bằng tái hiện tại localhost; chưa thể khẳng định đó là toàn bộ nguyên nhân trên máy của người đó. Ba test simulator cũ không chạy lại trong lượt này vì không thay đổi simulator.
