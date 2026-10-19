# C++ backend — HAnh

Phần tích hợp chạy được: shipment → reading → Observer tạo alert → ghi dispatch
response → lưu và đọc lại sau restart. Nghiệp vụ và storage bằng C++17; HTTP
adapter tham chiếu bằng Python để đồng đội tích hợp ngay.

Từ repository root trên Linux/WSL có Python 3, g++, Git, make và pkg-config:

```bash
bash 02-domain-backend/tools/setup.sh
bash 02-domain-backend/tools/check.sh
python3 02-domain-backend/tools/demo.py
bash 02-domain-backend/tools/start.sh
```

- [Bàn giao theo thành viên, firmware bridge, Git và giới hạn](docs/HANDOFF.md)
- [Contract API v1 và cách Dũng gọi C++ từ ngôn ngữ API bất kỳ](docs/API_V1.md)
- [Giải thích OOP và câu hỏi bảo vệ cho HAnh](docs/OOP_WALKTHROUGH.md)
- [Demo JSONL dispatch cũ](notes/dispatch-demo.md) — độc lập với snapshot backend mới.

Dữ liệu/runtime/dependency nằm trong build/ đã ignore. Chưa nối frontend trong
thay đổi này; Bảo dùng contract trên. Chưa xác minh hardware sensor/USB vật lý.
