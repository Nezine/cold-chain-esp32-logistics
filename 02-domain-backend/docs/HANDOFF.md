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

Backend trả JSON ngay để nối giao diện. Làm trên nhánh frontend:

1. Cấu hình CRA proxy bằng field `"proxy":"http://127.0.0.1:8080"` trong package.json,
   khởi động lại dev server. Fetch `/api/...` cùng origin; không gọi port khác
   trực tiếp vì adapter không bật CORS wildcard. Cấu hình reverse proxy tương
   đương khi triển khai build production, hiện chưa có deployment production.
2. shipmentService gọi GET /api/shipments. Khi API mode, tắt useSensorSimulation;
   không để timer mock ghi đè dữ liệu thật. Poll API 2 giây/lần là đủ cho demo.
3. Hiển thị `severity` backend trả, giữ ưu tiên connection loading/timeout/error.
   Lưu ý shipment mới có temperature=null, history=[], severity=normal.
4. Lấy GET /api/alerts cho alertId thực; nút xử lý gọi POST /shipments/:id/responses
   kèm alertId/action/note. Không tự sửa nhiệt độ trong resolveShipment.
5. ResponseStatus=responded chỉ là đã xử lý; chờ reading tiếp theo để hiển thị
   nhiệt độ thực. Dùng /shipments/:id/readings cho lịch sử đầy đủ.

Code frontend hiện vẫn dùng mock; đây là phần Bảo tiếp tục. Backend không tự sửa
frontend hoặc hợp đồng cũ của bạn ấy trong lần bàn giao này.

## Trang — test và thuyết trình với Bảo

Chạy check.sh và demo.py trước khi test UI. Các tình huống cần kiểm tra trên UI:
shipment mới/loading; 5°C bình thường; 9°C warning; 12°C critical; ghi response;
khởi động lại server; reading trùng; request lỗi; sensor mất kết nối (timeout là
phần chưa triển khai tự động). UI hiện có test starter lỗi matchMedia và assertion
learn-react cũ; sửa sau khi chốt hành vi frontend, không coi đó là backend lỗi.

Có 21 backend/API/bridge/legacy dispatch tests + 3 simulator tests hiện có.
Firmware compile được kiểm tra riêng; kiểm thử USB thật vẫn cần board vật lý.
Workflow .github/workflows/backend.yml chạy build/check/demo và compile firmware
ở hai job. Chưa khẳng định GitHub Actions xanh cho đến khi run trên GitHub kết thúc.

## NA — slide + báo cáo

Có thể dùng [giải thích OOP](OOP_WALKTHROUGH.md) và demo.py cho kịch bản trình bày.
Tách rõ bằng chứng: core C++ chạy thật, API adapter Python, sensor mô phỏng,
firmware compile, UI đang nối API. Không ghi “đã triển khai DDD đầy đủ” hoặc “real-time
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
