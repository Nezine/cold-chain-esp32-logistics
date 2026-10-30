# Backend — bản tích hợp

Python 3.12+, thư viện chuẩn, SQLite. Chạy từ gốc dự án:

```powershell
python 02-domain-backend/src/server.py
python -m unittest discover -s 02-domain-backend/tests -v
```

Server: localhost:8000. Tùy chọn `--port` và `--database`. Nếu đã build React, server cũng phục vụ giao diện.

- `src/domain.py`: Shipment, TemperatureReading, TemperaturePolicy, ReadingSubject, TemperatureMonitor.
- `src/service.py`: create, ingest, respond, dispatch và transaction.
- `src/repository.py`: SQLite adapter, khóa ngoại và truy vấn.
- `src/server.py`: HTTP routing và JSON.
- `tests/test_system.py`: unit, integration, persistence và HTTP tests.

Ngưỡng demo đã chọn: [2,8] normal; [0,2) hoặc (8,10] warning; ngoài [0,10] critical. Xem [báo cáo](../shared/architecture/BAO_CAO_DU_AN.md) và [hướng dẫn chạy](../README.md). Các tài liệu notes/exercises cũ phản ánh quá trình chuẩn bị, không phải trạng thái triển khai hiện tại.
