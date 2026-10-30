# Hướng dẫn demo trực tiếp — 1 hoặc 2 người

## Chuẩn bị

Mở PowerShell tại thư mục gốc `C:\Users\Admin\Desktop\cold-chain-esp32-logistics`.

Nếu vừa lấy mã mới hoặc vừa sửa giao diện, build lại trước:

```powershell
cd C:\Users\Admin\Desktop\cold-chain-esp32-logistics\03-frontend\exercises\esp32
npm.cmd ci
npm.cmd run build
cd ../../..
python 02-domain-backend/src/server.py
```

Nếu đã cài dependency và build xong thì chỉ cần lệnh `python 02-domain-backend/src/server.py` từ thư mục gốc. Giữ terminal chạy, mở http://127.0.0.1:8000. Nếu cổng đang được ứng dụng này sử dụng, dùng server đang chạy thay vì khởi động lần hai. Sau khi build mới, tải lại trang bằng Ctrl+F5.

Muốn một cơ sở dữ liệu demo riêng, không ảnh hưởng dữ liệu đang có: dừng server bằng Ctrl+C và chạy `python 02-domain-backend/src/server.py --database 02-domain-backend/presentation-demo.sqlite3`. Tên file này được tái sử dụng ở lần chạy sau; chọn tên mới nếu cần bắt đầu trống.

## Kịch bản 4–5 phút

| Bước | Làm trên màn hình | Kết quả / lời nói |
|---|---|---|
| 1 | Dashboard → Tên chuyến: **DEMO-A**, bấm **Tạo chuyến (2–8°C)** | Thông báo mã chuyến mới, tổng số tăng. “Mỗi chuyến có một định danh riêng.” |
| 2 | Đổi Tên chuyến thành **DEMO-B**, bấm tạo lần nữa | Có cả A và B; dropdown và chi tiết cùng chọn B. “Hệ thống quản lý nhiều chuyến.” |
| 3 | Ở **Chọn chuyến**, chọn đúng mã DEMO-A | Chi tiết tự chuyển sang A. Nhập **XE-DEMO-A**, bấm **Phân xe & xuất phát** → in_transit. |
| 4 | Bấm **5°C**, rồi **9°C**, rồi **12°C**, chờ mỗi kết quả hiện ra | normal → warning → critical. “Backend áp dụng cùng quy tắc nhiệt độ cho mỗi số đo.” |
| 5 | Khi 12°C, bấm **Hoàn tất giao hàng** | Bị từ chối. “Chưa được hoàn tất khi điều kiện vận chuyển chưa an toàn.” |
| 6 | Kéo xuống chi tiết A. Chọn hành động, nhập **Đã chuyển sang thùng lạnh dự phòng**, bấm **Ghi nhận xử lý** | Cảnh báo acknowledged, số đo vẫn 12°C. “Ghi nhận hành động không làm giả dữ liệu cảm biến.” |
| 7 | Kéo lên bảng thao tác, gửi **5°C**, rồi bấm **Hoàn tất giao hàng** trong vòng 30 giây | normal, alert recovered, chuyến delivered. |
| 8 | Chọn DEMO-B; gửi **-1°C** | B vẫn là chuyến độc lập, hiện critical. “Nhiệt độ quá thấp cũng tạo cảnh báo.” |
| 9 | Tải lại trang, chọn lại A/B theo mã | Hai chuyến và nhật ký còn nguyên. “SQLite lưu trạng thái qua lần tải lại.” |

Nếu 1 người: nói mục đích ngắn, bấm, chờ kết quả rồi giải thích. Nếu 2 người: một người thao tác và giải thích demo; người còn lại phụ trách phần kiến trúc/hỏi đáp. Không cần chia từng nút cho từng người.

## Cách kiểm tra tạo nhiều shipment

- Bấm **Tạo chuyến** ở phần đầu để tạo mới. Chọn một mục trong dropdown chỉ đổi chuyến đang thao tác.
- Có thể dùng cùng tên, nhưng khi demo nên đặt A/B/C để dễ nhận biết. Kiểm tra mã #ID và tổng số chuyến.
- Mỗi lần tạo thành công có thông báo mã chuyến; phần chi tiết tự chuyển sang chuyến mới.
- Nếu đang tìm kiếm, số “Hiển thị x/y chuyến” cho biết danh sách bị lọc. Tạo/chọn chuyến sẽ xóa bộ lọc; cũng có thể xóa thủ công ô Search shipment.
- Các nút gửi số đo và điều phối bị khóa khi đang chọn chuyến **delivered** là đúng nghiệp vụ. Nút **Tạo chuyến** vẫn tạo chuyến mới được.
- Nếu bản giao diện không có thông báo tạo thành công và bộ đếm ở bảng thao tác, build lại và Ctrl+F5 để dùng bản sửa.
- Sau hơn 30 giây không nhận số đo mới, trạng thái kết nối thành TIMEOUT. Trước bước hoàn tất hãy gửi lại 5°C. Sau delivered, chuyến không nhận số đo mới; hãy tạo chuyến mới để diễn lại.

## Kết quả điều tra ngày 30/10/2026

Trên bản trước khi sửa, đã tạo thành công TEST-3010-A/B/C với mã #3/#4/#5. Không tái hiện giới hạn chỉ tạo được một chuyến trên localhost. Chưa có thông báo lỗi hoặc thao tác chính xác từ máy người test, nên không khẳng định nguyên nhân riêng trên máy đó.

Hai lỗi giao diện đã tái hiện trực tiếp:

1. App lưu selectedId cho chi tiết, Operations lưu selected riêng cho lệnh điều phối/số đo. Tạo B sau khi chọn A làm dropdown chọn B nhưng chi tiết vẫn A. Bấm thẻ chuyến cũng không đồng bộ dropdown, dẫn đến nguy cơ gửi số đo cho chuyến khác với chuyến đang xem.
2. Bộ lọc Search shipment giữ nguyên khi tạo mới. Tìm A rồi tạo C làm C bị ẩn trong danh sách; tổng số vẫn tăng và C vẫn được lưu.

Bản sửa dùng chung selectedId, chọn ngay chuyến được tạo từ kết quả POST, xóa bộ lọc khi tạo/chọn, hiển thị mã chuyến và thông báo thành công. Kiểm thử frontend bao gồm tạo chuyến thứ hai/thứ ba, trùng tên, xóa bộ lọc, đồng bộ chọn và gửi số đo đúng chuyến. Kiểm thử HTTP xác nhận ba POST tạo chuyến liên tiếp trả ba ID khác nhau.
