# Đối chiếu báo cáo C++ — 30/10/2026

## Phiên bản được dùng

- Repository: https://github.com/Nezine/cold-chain-esp32-logistics
- Commit tham chiếu: `0a65a451af7f43424c4d11d9619e8fe9d68ee420` (`origin/main` tại lúc fetch).
- Source tham chiếu được giải nén riêng dưới `tmp/cpp-reference`, không ghi đè bản demo Python/SQLite local.
- Báo cáo đầu ra: `output/pdf/ColdChain_Technical_Report_2026_Updated.pdf` (12 trang).
- Script tái tạo: `05-qa-documentation/build_cpp_report.py`, cần Python, ReportLab và Arial trong `C:/Windows/Fonts`.
- PDF gốc trong Downloads được giữ nguyên.

## Kết quả đã chạy trên source tham chiếu

| Hạng mục | Lệnh | Kết quả |
|---|---|---|
| React | `npm.cmd test -- --watchAll=false --runInBand --cacheDirectory=node_modules/.cache/jest-cpp-report` (CI=true) | 4 suites, 18/18 PASS |
| Simulator | `python -m unittest discover -s 04-esp32-sensor/tests -v` | 3/3 PASS |
| Frontend build | `npm.cmd run build` (CI=true) | Compiled successfully |

Frontend tham chiếu sử dụng junction đến node_modules đã cài của bản local. Đây không phải bằng chứng clean-install bằng `npm ci` theo lockfile tham chiếu.

Đếm trong source: backend 11 + API/bridge 2 + legacy dispatch 8 + frontend 18 + simulator 3 = 42 test. Chỉ 21 test frontend/simulator được chạy lại trong lượt đối chiếu này. Không dùng 26 test của bản Python/SQLite để chứng minh bản C++.

`wsl --list --quiet` sau khi chạy ngoài sandbox không liệt kê distro Linux nào. Chưa chạy lại C++/JSON-C/POSIX backend, demo restart, browser smoke hay firmware build. Không tuyên bố CI xanh từ việc có file workflow; connector tra cứu PR workflow theo commit không trả run.

## Những sửa đổi quan trọng trong báo cáo

1. Giữ core C++17, HTTP adapter Python và JSON snapshot.
2. Giữ policy 2–8°C normal; 0–<2 hoặc >8–10°C warning; ngoài 0–10°C critical.
3. Sửa mô tả UI tạo shipment: App hiện tại không import ShipmentForm/useLogistics; Shipments chỉ liệt kê thẻ. Active shipmentService không export createShipment/recordResponse mà hook cũ import. Hướng dẫn tạo qua API cho phiên bản này.
4. Dùng App.js làm bằng chứng polling guard/queued refresh; không lấy hook không được dùng làm hành vi runtime.
5. Ghi rõ mỗi reading không an toàn tạo alert riêng; response không sửa nhiệt độ; hồi phục không tự xóa/đóng alert cũ.
6. Nêu đúng các lớp StateRepository, FileStateRepository, ReadingPublisher, ReadingObserver, AlertMonitor; card kiến trúc frontend chứa nhãn minh họa và số observer hard-code.
7. Tách số test có trong source khỏi test đã chạy; bỏ số dòng code, số thành viên, timing và firmware RAM/flash không được xác minh.
8. Nêu giới hạn timeout sensor, kiểm tra schema, fsync directory, môi trường POSIX và chức năng dispatch chỉ ghi phản ứng.
9. Không đưa ảnh tạo shipment của demo Python vào báo cáo như ảnh bản C++.

## Kiểm tra PDF

- Sinh bằng ReportLab với font Arial nhúng.
- Render đủ 12 trang bằng Poppler; xem ảnh toàn bộ các trang theo nhóm.
- Kiểm tra không tràn trang, không chồng chữ/bảng, số trang 01–12 đúng; pypdf xác nhận 12 trang và trích xuất text được.
- Ảnh render và source tham chiếu nằm trong `/tmp/` được gitignore; không commit dependency hay dữ liệu chạy thử.

## Git

Commit `7cb04e2` lưu phần demo Python/SQLite, sửa lỗi selection/filter khi tạo nhiều shipment, nội dung thuyết trình và ảnh demo trước đây. Báo cáo PDF này tham chiếu commit C++ ở trên; nhánh lưu công việc local không phải bản hợp nhất hai implementation.

Theo yêu cầu đưa công việc lên main, nội dung demo được bảo toàn tại `demos/python-sqlite/`, còn source C++ ở thư mục gốc được giữ theo origin/main. Báo cáo, script và ghi nhận kiểm tra nằm tại các đường dẫn gốc nêu trên. Các commit trên nhánh cũ là nguồn lịch sử trước khi chuyển nội dung sang main.
