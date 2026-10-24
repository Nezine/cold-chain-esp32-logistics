# Bàn giao phần HAnh — 19/10/2026

Mục tiêu: các thành viên có backend C++ chạy được để tích hợp, fixture sensor,
script setup/check/demo, hợp đồng API và CI. Phần người khác không bị coi là đã
hoàn thành. API Python là adapter tham chiếu để không chờ quyết định ngôn ngữ API.

## Chạy nhanh từ repo root (Linux/WSL)

Yêu cầu Python 3.10+, g++ hỗ trợ C++17, Git, make, pkg-config; cần mạng khi setup.

```bash
bash 02-domain-backend/tools/setup.sh
bash 02-domain-backend/tools/check.sh
python3 02-domain-backend/tools/demo.py
bash 02-domain-backend/tools/start.sh
```

Ba lệnh đầu kết thúc; start giữ terminal để chạy server. Dữ liệu server thật nằm
trong `02-domain-backend/build/data/state.json`; demo và tests dùng temp riêng,
không xoá data của người dùng. Dừng bằng Ctrl+C rồi chạy start lại để kiểm tra lưu
trữ. Đổi port bằng `start.sh --port 8081`; đổi kho bằng `--state /path/new.json`
với thư mục cha đã tồn tại. Không chạy server dev trên mạng công cộng.

Nếu thiếu g++/make/pkg-config trên Ubuntu cá nhân: cài bằng package manager của
máy trước. setup không cần sudo và không đổi cấu hình hệ thống. Trên Windows dùng
WSL Ubuntu, vì repository sử dụng flock của hệ điều hành. macOS cần toolchain,
pkg-config, Python phù hợp; chưa được kiểm thử trong phiên này.

## Dũng — API + sensor

1. Đọc [API_V1.md](API_V1.md); dùng adapter sẵn có để chạy thử ngay.
2. Chọn ngôn ngữ API cùng nhóm. Dùng bảng mapping endpoint -> CLI để gọi nghiệp
   vụ C++; API không cần viết lại policy hoặc persistence.
3. Chốt field và đồng hồ sensor theo contract. Fixture Python cũ dùng snake_case
   và reading_id/timestamp khác API; không gửi nguyên fixture đó lên API.
4. Gửi firmware-format fixture bằng bridge (tạo shipment trước):

```bash
python3 02-domain-backend/tools/sensor_bridge.py --shipment-id 1 --session-id demo-boot \
  < 02-domain-backend/examples/firmware-demo.jsonl
```

Bridge ánh xạ label shipment1 -> ID số được chỉ định, thêm UTC receive time và
readingId=device:session:sequence. Device mặc định device1, có thể chỉ định
--device-id. Với USB thật, kích hoạt toolchain rồi chạy:

```bash
source 02-domain-backend/build/env.sh
python3 02-domain-backend/tools/sensor_bridge.py --shipment-id 1 --port /dev/ttyUSB0
```

Đóng PlatformIO Monitor trước. Session tự tạo mới mỗi lần bridge khởi động; sau
khi board reboot, khởi động lại bridge để không trùng sequence. Cần cùng session
ID khi cố tình replay để thử duplicate. Chưa có durable retry/boot ID do firmware
cấp, không bảo đảm exactly-once qua mọi lần reboot. Không đổi uptime thành UTC.

## Bảo — frontend

Frontend đã được nối API trên main, giữ bố cục của branch frontend commit
7fcd7cb. Đọc README của frontend để chạy. Các điểm đã triển khai:

1. setupProxy.js route /api về backend port 8080, hỗ trợ cả HOST=127.0.0.1.
2. shipmentService dùng HTTP thật; useLogistics poll khoảng 2 giây, giữ dữ liệu
   cũ kèm cảnh báo khi mất kết nối. App không dùng useSensorSimulation.
3. Form tạo shipment; severity lấy từ backend, connection loading được hiển thị
   riêng; shipment mới chưa có nhiệt độ không được tính là normal trong dashboard.
4. GET /alerts cung cấp alertId thực. DetailPanel chọn cảnh báo pending và gửi
   action/note; phản hồi không sửa nhiệt độ. Trang Alerts giữ lịch sử responded.
5. Live feed nhận alert ID mới, không lặp lại mỗi lần poll.

Bảo có thể tiếp tục cải thiện bố cục, UX, lịch sử chi tiết và hiển thị cảnh báo.
Khi cập nhật branch frontend, merge main để lấy thay đổi tích hợp; không thay
lớp API mới bằng service mock cũ.

## Trang — test và thuyết trình với Bảo

Chạy check.sh và demo.py trước khi test UI. Các tình huống cần kiểm tra trên UI:
shipment mới/loading; 5°C bình thường; 9°C warning; 12°C critical; ghi response;
khởi động lại server; reading trùng; request lỗi; sensor mất kết nối (timeout là
phần chưa triển khai tự động). Frontend hiện có 8 tests hành vi và smoke test Chromium dùng backend thật.
Test starter cũ đã được thay; không có timer mock sửa dữ liệu trong App.

Có 21 backend/API/bridge/legacy dispatch tests + 3 simulator tests hiện có.
Firmware compile được kiểm tra riêng; kiểm thử USB thật vẫn cần board vật lý.
Workflow .github/workflows/backend.yml chạy build/check/demo và compile firmware
ở hai job. Chưa khẳng định GitHub Actions xanh cho đến khi run trên GitHub kết thúc.

## NA — slide + báo cáo

Có thể dùng demo.py và các lớp trong src/backend.h cho kịch bản trình bày.
Tách rõ bằng chứng: core C++ chạy thật, API adapter Python, sensor mô phỏng,
firmware compile, UI đã nối API. Không ghi “đã triển khai DDD đầy đủ” hoặc “real-time
qua WebSocket”: đây là phân tách nghiệp vụ/lưu trữ nhỏ và Observer đồng bộ nội bộ.

## HAnh — tích hợp và Git

Từ repo sạch, mỗi người tạo nhánh riêng rồi mở PR vào main:

```bash
git switch main
git pull --ff-only origin main
git switch -c ten-ban/ten-cong-viec
# Sửa phần của mình, chạy checks thích hợp, commit.
git push -u origin HEAD
```

Không dùng reset --hard hoặc force-push khi có thay đổi đồng đội. Review contract
khi thay field/status; giữ các test lỗi để phát hiện hồi quy. Khi merge PR mới,
chạy lại demo, checks và firmware build nếu có thay đổi firmware/platform.

## Lưu trữ và giới hạn

Kho backend mới là snapshot JSON version=1; file .lock điều phối nhiều process,
write-temp+fsync+rename thay snapshot trong một transaction. Có test concurrent
create/respond. Không sửa tay file trong lúc server chạy, không xoá file .lock.
Đây là kho nhỏ để demo, chưa có database server, migration, phân trang, index,
backup tự động hay bảo đảm giao dịch qua mọi tình huống mất điện/NFS.

CLI `dispatch` và JSONL của bài trước vẫn dùng được nhưng độc lập với snapshot
backend. Không trộn ID hoặc file JSONL cũ vào state.json; backend không tự import
lịch sử đó. `backend` + API là luồng tích hợp mới; `dispatch` là demo học tập cũ.
