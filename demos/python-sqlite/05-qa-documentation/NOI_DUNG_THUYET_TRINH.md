# Nội dung thuyết trình — G2: Domain-Driven IoT Cold Chain Logistics

Tài liệu dành cho **1 hoặc 2 người thuyết trình**, gồm dàn ý, lời thoại, thao tác demo và câu hỏi phản biện. Không yêu cầu slide. Thời lượng gợi ý 10–12 phút, có thể rút còn 5 phút theo phần cuối. Phân chia người nói không phải xác nhận ai đã viết phần nào.

## Cách sử dụng với 1 hoặc 2 người

**Nếu 2 người:** người 1 trình bày phần 1–3 (bài toán, mô hình miền, kiến trúc và pattern), khoảng 4 phút 30 giây. Người 2 trình bày phần 4–6 (giao diện, mô phỏng, demo, kiểm thử và kết luận), khoảng 4 phút 30 giây; dành thêm 1–3 phút cho thao tác và chuyển tiếp. Chỉ chuyển người nói một lần sau phần 3. Trong demo, người 2 vừa thao tác vừa giải thích; người 1 có thể hỗ trợ thao tác nếu đã tập trước. Khi hỏi đáp, người 1 ưu tiên câu hỏi kiến trúc/nghiệp vụ, người 2 ưu tiên demo/kiểm thử; cả hai cần nắm luồng tổng thể.![[NOI_DUNG_THUYET_TRINH]]

**Nếu 1 người:** đọc liên tục phần 1–6, bỏ câu mời người tiếp theo ở cuối phần 3 và dùng câu chuyển ý dành cho một người. Khi demo, nói ngắn mục đích → thao tác → chờ kết quả → giải thích kết quả; không đọc đoạn dài trong lúc nhập dữ liệu. Phần 7 dùng để chuẩn bị trả lời, không đọc hết trong bài nói.

## 1. Mở đầu và bài toán — người 1, khoảng 1 phút

**Ý chính:** Hàng nhạy cảm nhiệt độ cần được theo dõi trong suốt quá trình vận chuyển. Phát hiện bất thường phải đi cùng phản ứng của người điều phối.

**Lời trình bày:**

“Nhóm em thực hiện đề tài G2: hệ thống quản lý và điều phối chuỗi lạnh theo hướng Domain-Driven Design, kết hợp dữ liệu IoT.

Trong quá trình vận chuyển hàng nhạy cảm với nhiệt độ, việc biết xe đã giao đến đâu chưa đủ. Người quản lý còn cần biết điều kiện bảo quản có phù hợp hay không. Nếu chỉ ghi nhiệt độ mà không có cảnh báo và quy trình xử lý, dữ liệu đó chưa hỗ trợ tốt cho người điều phối.

Vì vậy, nhóm xây dựng một quy trình từ tạo chuyến hàng, phân xe, tiếp nhận nhiệt độ, phát hiện bất thường, ghi nhận hành động xử lý, đến hoàn tất giao hàng. Với phạm vi bài tập, nhóm sử dụng một sản phẩm lạnh giả định và dữ liệu cảm biến mô phỏng. Cách này giúp nhóm tập trung vào chất lượng phần mềm và các mẫu thiết kế mà đề yêu cầu.”

**Chuyển lời:** “Tiếp theo, chúng em trình bày cách chuyển bài toán này thành các đối tượng và quy tắc nghiệp vụ.”

## 2. Mô hình miền và quy tắc — người 1, khoảng 1 phút 30 giây

**Ý chính:** Shipment, TemperatureReading, TemperaturePolicy, Alert, DispatchResponse; dùng cùng thuật ngữ xuyên suốt giao diện, API và mã nguồn.

**Lời trình bày:**

“Đối tượng trung tâm là Shipment, đại diện cho một chuyến hàng. Mỗi chuyến có định danh, cảm biến liên kết, khoảng nhiệt độ và trạng thái vận chuyển. TemperatureReading là một số đo tại một thời điểm, có mã riêng để tránh ghi trùng. Khi số đo bất thường, hệ thống tạo Alert. Khi người điều phối phản ứng, hệ thống lưu DispatchResponse gồm hành động, ghi chú và thời gian.

Nhóm chọn khoảng an toàn từ 2 đến 8 độ C, tính cả hai đầu mút. Từ 0 đến dưới 2 độ, hoặc trên 8 đến 10 độ là cảnh báo. Dưới 0 hoặc trên 10 độ là nguy hiểm. Đây là quy tắc minh họa của bài tập, không đại diện cho mọi loại hàng hóa.

Điểm quan trọng là nhiệt độ quá thấp cũng gây bất thường. Vì vậy hệ thống kiểm tra cả hai phía. Các giá trị 2 và 8 vẫn bình thường; 0 và 10 thuộc mức cảnh báo.

Chuyến hàng chuyển lần lượt từ planned sang in_transit rồi delivered. Backend chỉ chấp nhận hoàn tất khi có số đo còn mới và nằm trong khoảng an toàn. Quy tắc này được đặt trong đối tượng miền Shipment, thay vì chỉ vô hiệu hóa nút trên giao diện.”

**Có thể chỉ mã:** `domain.py`: Shipment, TemperatureReading và TemperaturePolicy.

## 3. Kiến trúc và mẫu thiết kế — người 1, khoảng 2 phút

**Ý chính:** Tách giao diện, use case, nghiệp vụ và lưu trữ; giải thích bằng luồng thực tế.

**Lời trình bày:**

“Ứng dụng gồm giao diện React, API viết bằng Python và cơ sở dữ liệu SQLite. Python sử dụng thư viện chuẩn để việc chạy demo ít phụ thuộc hơn. React hiển thị dữ liệu và gửi các thao tác; backend mới là nơi quyết định số đo hợp lệ hay mức độ cảnh báo.

Khi một số đo đến API, ColdChainService kiểm tra chuyến và cảm biến, xác nhận dữ liệu hợp lệ, rồi lưu số đo. Sau đó ReadingSubject phát thông báo đến TemperatureMonitor. Monitor sử dụng TemperaturePolicy để xác định normal, warning hoặc critical và cập nhật cảnh báo. Đây là Observer Pattern: bên phát sự kiện không trực tiếp chứa toàn bộ logic phản ứng. Bản hiện tại có một observer backend; khi cần có thể bổ sung observer khác với trách nhiệm riêng.

Repository Pattern được thể hiện qua ShipmentRepository. Lớp này tập trung thao tác SQLite: lưu chuyến, đọc lịch sử, tạo cảnh báo và ghi phản ứng. Quy tắc phân loại nhiệt độ không chứa câu lệnh SQL. Nhờ vậy nhóm dễ kiểm tra nghiệp vụ và có vị trí rõ ràng để thay đổi cách lưu trữ.

Số đo và thay đổi cảnh báo được ghi trong cùng transaction. Nếu observer gặp lỗi, cả hai được rollback, tránh tình huống có số đo nguy hiểm nhưng thiếu bản ghi cảnh báo.

DDD được áp dụng bằng cách xuất phát từ thuật ngữ và quy tắc nghiệp vụ, đưa vòng đời vào thực thể Shipment và tách policy ra khỏi giao diện. Với quy mô bài tập, nhóm xây dựng một ứng dụng thống nhất, chưa tách thành microservice.”

**Cần nói chính xác:** Cảnh báo được xử lý ngay khi API nhận số đo; giao diện lấy dữ liệu mỗi 2 giây. Đây là gần thời gian thực, chưa dùng WebSocket.

**Chuyển sang người 2:** “Đó là mô hình nghiệp vụ và cách nhóm tổ chức phần mềm. Sau đây, bạn cùng nhóm sẽ giới thiệu giao diện và minh họa toàn bộ quy trình bằng một chuyến hàng.”

**Nếu chỉ 1 người:** “Từ kiến trúc vừa trình bày, em sẽ chuyển sang giao diện và minh họa toàn bộ quy trình bằng một chuyến hàng.”

## 4. Giao diện và cảm biến mô phỏng — người 2, khoảng 1 phút

**Giới thiệu giao diện:**

“Trên Dashboard, người dùng có thể tạo chuyến, phân xe, gửi dữ liệu thử và theo dõi trạng thái. Khi chọn một chuyến, phần chi tiết hiển thị nhiệt độ, lịch sử, thời gian số đo cuối và nhật ký xử lý. Giao diện cũng thể hiện khi chưa có dữ liệu, không kết nối được backend hoặc đã quá 30 giây không nhận số đo mới. Dữ liệu được lấy từ backend và được lưu lại sau khi khởi động lại ứng dụng.”

**Giới thiệu cảm biến mô phỏng — cùng người nói:**

“Đề cho phép dùng mocking nên nhóm xây dựng cảm biến giả lập gửi HTTP. Mỗi số đo vẫn có đầy đủ mã cảm biến, mã chuyến, mã số đo, nhiệt độ, đơn vị và thời gian. Chuỗi demo được chọn cố định là 5, 9, 12 rồi 5 độ C, tương ứng bình thường, cảnh báo, nguy hiểm và phục hồi. Nhờ kịch bản cố định, nhóm có thể lặp lại demo và kiểm thử. Phần ESP32/USB trong dự án là thử nghiệm riêng; bản tích hợp hiện tại không phụ thuộc phần cứng đó.”

## 5. Demo trực tiếp — người 2 vừa thao tác vừa giải thích, khoảng 2 phút

Hướng dẫn thao tác chi tiết và phần kiểm tra nhiều shipment: [HUONG_DAN_DEMO.md](HUONG_DAN_DEMO.md). Khi có thêm thời gian, tạo hai chuyến A/B trước để chứng minh quản lý nhiều chuyến; dropdown và chi tiết hiện dùng chung một chuyến đang chọn.

**Chuyển vào demo:** “Em sẽ tạo một chuyến mới và lần lượt đưa nhiệt độ qua các mức bình thường, cảnh báo, nguy hiểm rồi phục hồi để thấy hệ thống phản ứng như thế nào.”

Chuẩn bị trước: build giao diện, chạy `python 02-domain-backend/src/server.py`, mở `http://127.0.0.1:8000`. Dùng một chuyến mới để tránh trạng thái delivered từ lần trước. Cần thao tác liên tục, hoặc gửi lại 5°C trước lúc giao hàng nếu đã quá 30 giây.

| Bước | Thao tác | Kết quả phải thấy | Lời nói gợi ý |
|---|---|---|---|
| 1 | Tạo “Chuyến demo nhóm G2” | Xuất hiện chuyến planned; chưa có số đo | “Dữ liệu chuyến được tạo qua API và lưu vào SQLite.” |
| 2 | Nhập mã xe, bấm Phân xe & xuất phát | in_transit, có mã xe | “Đây là thao tác điều phối, tách biệt với giám sát nhiệt độ.” |
| 3 | Chọn thẻ chuyến ở danh sách, gửi 5°C | normal | “Số đo nằm trong khoảng 2–8 độ.” |
| 4 | Gửi 9°C | warning, có alert | “Hệ thống tạo cảnh báo khi vượt khoảng an toàn.” |
| 5 | Gửi 12°C | critical; đợt warning cũ superseded | “Mức bất thường tăng lên nên hệ thống ghi một đợt nguy hiểm mới.” |
| 6 | Thử Hoàn tất giao hàng | Thông báo từ chối | “Quy tắc ở backend ngăn hoàn tất khi điều kiện chưa phù hợp.” |
| 7 | Chọn hành động, ghi “Đã chuyển sang thùng dự phòng”, bấm Ghi nhận xử lý | acknowledged; vẫn 12°C | “Ghi nhận hành động không có nghĩa là giả định hàng đã an toàn.” |
| 8 | Gửi 5°C | normal; alert recovered | “Chỉ số đo mới xác nhận điều kiện đã phục hồi.” |
| 9 | Hoàn tất giao hàng | delivered | “Chuyến được hoàn tất sau khi đáp ứng điều kiện.” |
| 10 | Tải lại trang, chọn lại chuyến | Vẫn có chuyến, nhiệt độ và nhật ký | “Dữ liệu nằm trong cơ sở dữ liệu, không chỉ trong bộ nhớ trình duyệt.” |

Nếu còn thời gian: tạo một chuyến khác, gửi -1°C để chứng minh cảnh báo phía nhiệt độ thấp. Muốn minh họa timeout, ngừng gửi số đo hơn 30 giây; nói rõ đây là mất dữ liệu mới, không phải nhiệt độ đã thay đổi.

**Dự phòng khi thao tác giao diện gặp vấn đề:** chạy `python 04-esp32-sensor/examples/send_demo.py` trong terminal thứ hai. Script đi qua các API và in normal → warning → critical → recorded response → normal → delivered. Có thể dùng kết quả kiểm thử đã ghi trong `shared/testing/KET_QUA_KIEM_THU.md`, nhưng không trình bày log kiểm thử như video demo giao diện.

## 6. Kiểm thử, hạn chế và kết luận — người 2, khoảng 1 phút 30 giây

**Chuyển ý sau demo:** “Vừa rồi là luồng sử dụng hoàn chỉnh. Để kiểm tra cả các trường hợp không xuất hiện trong demo, nhóm còn xây dựng các kiểm thử sau.”

**Lời trình bày:**

“Nhóm kiểm thử theo cả đường đi thành công và các trường hợp dữ liệu không hợp lệ. Các test bao gồm giá trị đúng biên 0, 2, 8, 10; giá trị vừa vượt biên; số đo trùng; sensor không khớp; thời gian thiếu múi giờ, ở tương lai hoặc sai thứ tự. Nhóm cũng kiểm tra khi nhiệt độ giữ ở cùng một mức bất thường thì không sinh cảnh báo liên tục, và khi có số đo bình thường mới thì cảnh báo được xác nhận phục hồi.

Một kiểm thử đi xuyên suốt từ tạo chuyến, xuất phát, phát sinh cảnh báo, ghi phản ứng, phục hồi đến giao hàng và mở lại cơ sở dữ liệu để kiểm tra khả năng lưu trữ. Một kiểm thử khác làm observer thất bại để xác nhận transaction không để lại dữ liệu dở dang.

Bản hiện tại đáp ứng phạm vi demo phần mềm: có quản lý chuyến, dữ liệu cảm biến mô phỏng, cảnh báo, điều phối và lưu trữ. Các giới hạn còn lại là chưa có xác thực người dùng, chưa quản lý lịch xe và tài xế, chưa tích hợp GPS hoặc ESP32 trực tiếp. Giao diện đang polling mỗi 2 giây. Nếu mở rộng, nhóm sẽ bổ sung MQTT, xác thực, WebSocket và adapter lưu trữ phù hợp hơn.

Kết quả chính là một quy trình có thể chạy và kiểm chứng từ dữ liệu cảm biến đến hành động của người điều phối. Ba yêu cầu DDD, Observer và Repository đều có vị trí cụ thể trong mã nguồn để giải thích và kiểm thử. Nhóm em xin kết thúc phần trình bày và nhận câu hỏi.”

Trước khi nói số lượng test, đối chiếu file kết quả kiểm thử hiện tại; không cộng số dòng parameterized và số hàm test lẫn nhau.

## 7. Câu hỏi phản biện và câu trả lời gợi ý

**1. DDD khác chia thư mục MVC như thế nào?**

DDD bắt đầu từ mô hình và quy tắc nghiệp vụ. Trong bài này, Shipment giữ vòng đời và điều kiện giao hàng; TemperaturePolicy thể hiện quy tắc nhiệt độ. Chia lớp chỉ là phương tiện để bảo vệ và diễn đạt mô hình. Bản này áp dụng DDD ở mức nhỏ, chưa có tất cả aggregate/repository interface hoàn chỉnh.

**2. Observer ở đâu, có thực sự được gọi không?**

Trong ColdChainService, TemperatureMonitor được đăng ký vào ReadingSubject. Khi ingest một số đo mới hợp lệ, service gọi subject.notify. Monitor cập nhật severity và cảnh báo. Kiểm thử observer failure chứng minh nó nằm trong đường xử lý thật và lỗi của nó làm rollback.

**3. Sao không gọi thẳng TemperatureMonitor?**

Với một subscriber thì gọi trực tiếp cũng đơn giản. Subject giúp tách publisher khỏi danh sách subscriber và đáp ứng nhu cầu mở rộng phản ứng. Đổi lại phải quản lý thứ tự, lỗi và transaction. Hiện dùng observer đồng bộ; không gọi dịch vụ SMS bên ngoài trong transaction này.

**4. Repository có lợi gì nếu vẫn dùng SQLite?**

SQL có một nơi chịu trách nhiệm, các use case không tự viết truy vấn. Policy được test không cần DB. Tuy nhiên application service hiện vẫn biết transaction SQLite, nên muốn thay hẳn storage cần bổ sung abstraction Unit of Work.

**5. Bấm xử lý rồi tại sao vẫn đỏ?**

Đỏ phản ánh số đo nguy hiểm. Acknowledged chỉ xác nhận con người đã ghi hành động. Khi số đo mới về khoảng an toàn thì mới recovered. Đổi nhiệt độ chỉ vì bấm nút sẽ làm sai dữ liệu.

**6. Làm sao tránh bắn cảnh báo liên tục?**

Cùng mức bất thường trong cùng đợt thì tái sử dụng alert đang mở. Thay cấp thì đóng đợt cũ với superseded và mở đợt mới. Về normal thì recovered. Bài này chưa có ngưỡng thời gian duy trì hoặc hysteresis.

**7. Nếu sensor gửi lại một bản tin?**

readingId là khóa duy nhất. ID và nội dung giống hệt được chấp nhận như retry, không lưu thêm. Cùng ID khác nội dung bị từ chối để phát hiện xung đột.

**8. Vì sao từ chối dữ liệu đến muộn?**

Để số đo cũ không ghi đè trạng thái hiện tại trong bản demo. Trong hệ thống thực, có thể lưu riêng sự kiện đến muộn và tính toán theo event time; đây là phần mở rộng.

**9. Tại sao dùng mock mà vẫn gọi IoT?**

Đề cho phép mô phỏng luồng cảm biến. Payload và đường truyền HTTP vẫn mô tả thiết bị, số đo và thời gian. Nhóm đang chứng minh phần mềm xử lý dữ liệu IoT, chưa tuyên bố đã triển khai hệ thống phần cứng thật.

**10. Hệ thống có điều phối thực sự hay chỉ dashboard?**

Có phân mã xe, xuất phát, kiểm soát vòng đời giao hàng và ghi phản ứng khi có sự cố. Chưa có thuật toán tối ưu tuyến hay kiểm tra xe đang bận. Đây là phạm vi điều phối cơ bản đã xác định.

**11. Có phải thời gian thực tuyệt đối không?**

Không. Backend xử lý cảnh báo ngay khi nhận request, UI polling 2 giây. Độ trễ hiển thị còn phụ thuộc mạng và thời gian xử lý. Muốn cập nhật đẩy cần WebSocket hoặc SSE.

**12. Vì sao chọn ngưỡng 2–8°C?**

Đó là quy tắc minh họa đã chọn cho hàng lạnh giả định của bài. Không áp dụng cho mọi vaccine, thực phẩm hay sản phẩm cụ thể. API lưu min/max theo chuyến để mô hình có thể mở rộng.

## 8. Bản rút gọn 5 phút

Nếu 2 người: người 1 trình bày ba mục đầu (2 phút 30 giây); người 2 demo và kết luận ở hai mục cuối (2 phút 30 giây). Nếu 1 người: trình bày liên tục cả năm mục.

- 30 giây: bài toán và mục tiêu từ cảm biến đến xử lý.
- 45 giây: đối tượng miền và các ngưỡng.
- 75 giây: luồng API → service → subject/monitor → repository → SQLite.
- 90 giây: demo 5 → 9 → 12 → ghi phản ứng → 5 → delivered.
- 60 giây: kiểm thử chính, giới hạn và hướng mở rộng.

## 9. Checklist tập nói

Người trình bày phải giải thích được các lớp và luồng trong phần mình nói, biết mở đúng file và hiểu vì sao có quy tắc đó. Nếu 2 người, tập câu chuyển tiếp sau phần 3 và thống nhất ai điều khiển máy lúc demo. Nếu 1 người, mở sẵn ứng dụng và tài liệu cần thiết để tránh ngắt quãng khi đổi cửa sổ. Chạy thử demo trước buổi báo cáo; kiểm tra cổng 8000, build mới nhất, tạo chuyến mới, không để số đo quá 30 giây khi bấm hoàn tất. Không nói đã có GPS/MQTT/email nếu chưa triển khai. Không điền tên thành viên hay tỷ lệ đóng góp nếu nhóm chưa xác nhận.
