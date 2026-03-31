# Edge và gửi dữ liệu
- Thiết bị và Cảm biến: Nhiệm vụ chính là thao tác trên ESP32 (hoặc script giả lập) để thu thập dữ liệu từ các cảm biến nhiệt độ, độ ẩm, ánh sáng và hồng ngoại.
- Truyền tải dữ liệu: Chịu trách nhiệm gửi các dữ liệu thu thập được lên Adafruit IO thông qua giao thức MQTT hoặc sử dụng HTTP GET
- Điều khiển thiết bị: Đảm bảo thiết bị ở Edge có khả năng nhận lệnh để điều khiển đổi màu đèn LED RGB, hiển thị màn hình LCD, bật quạt mini và động cơ bơm nước.

# Phân tích Dữ liệu ở Trung tâm
- Thu thập và Xử lý: Subscribe luồng dữ liệu từ Adafruit IO để tính toán mức độ ẩm trung bình và xác định xu hướng khô của đất.
- Phát hiện bất thường & Cảnh báo (UC3): Chịu trách nhiệm theo dõi để phát hiện các tình trạng bất thường (ví dụ: nhiệt độ cao bất thường, độ ẩm quá cao) để kích hoạt hệ thống gửi notification.
- Tưới cây tự động (UC1): Xây dựng logic phân tích, nếu các chỉ số rơi xuống dưới ngưỡng (threshold) cho phép, hệ thống sẽ đưa ra quyết định gửi lệnh (command) xuống gateway để bật bơm nước.
- Phân tích chuyên sâu (UC5): Thu thập dữ liệu theo thời gian để tìm ra thời gian đất khô nhanh nhất, từ đó đề xuất lịch tưới tiêu tối ưu nhất.

# Cân bằng tải
- Thiết kế luồng Load Balancing: Xây dựng cơ chế định tuyến (routing) để phân phối hiệu quả các request HTTP (kèm data trong body) về các server Backend khác nhau.
- Quản lý luồng MQTT: Thiết lập các dịch vụ trung gian để subscribe dữ liệu MQTT từ Adafruit, sau đó điều phối an toàn và cân bằng tải vào hệ thống xử lý nội bộ.

# Phát triển Hệ thống & Design Patterns
- Xây dựng API và Dashboard: Xây dựng API backend, ứng dụng Web/App Dashboard, và tích hợp Adafruit IO để hiển thị biểu đồ độ ẩm, nhiệt độ theo thời gian thực (UC2).
- Hỗ trợ Điều khiển từ xa (UC4): Lập trình luồng xử lý khi người dùng bấm "Bật tưới" trên ứng dụng, Backend sẽ đẩy command lên Adafruit IO để gửi về Gateway.
- Triển khai Design Patterns:
  - Observer Pattern: Đây là pattern quan trọng nhất, áp dụng cho luồng dữ liệu MQTT, trong đó Gateway sẽ đóng vai trò là publisher và Backend sẽ là subscriber.
  - Factory Pattern: Khởi tạo một SensorFactory để sản xuất ra các đối tượng cảm biến linh hoạt như SoilSensor (đất) và TempSensor (nhiệt độ).
  - Singleton Pattern: Ứng dụng để quản lý một instance duy nhất cho MQTT client trong việc kết nối tới Adafruit IO.

# Sơ đồ Kiến trúc tổng quát
```json
[Thiết bị Edge / Cảm biến] 
       │
       │ (Gửi dữ liệu qua MQTT / HTTP GET)
       ▼
[Adafruit IO (Message Broker / Đám mây)] 
       │
       │ (Load Balancer Subscribe MQTT)
       ▼
[Load Balancer] 
       │
       │ (Routing request HTTP kèm body data)
       ▼
[Các Server Backend (API / Data Analysis)] 
       │
       │ (Cung cấp API, Push Notification)
       ▼
[Ứng dụng Web / App (Dashboard điều khiển)]
```

# Luồng hoạt động chi tiết theo các Use Case
## Luồng 1: Thu thập dữ liệu và Giám sát (Dựa trên UC2 & UC5)
- *Bước 1*: Thiết bị Edge liên tục đọc dữ liệu từ các cảm biến: nhiệt độ, độ ẩm, ánh sáng và hồng ngoại.
- *Bước 2*: Thiết bị Edge đẩy gói dữ liệu này lên platform trung gian là Adafruit IO thông qua giao thức MQTT hoặc HTTP GET.
- *Bước 3*: Hệ thống Load Balancer sẽ subscribe luồng dữ liệu MQTT này từ Adafruit và đóng vai trò điều phối, phân giải các request HTTP có chứa dữ liệu về cho các Server Backend.
- *Bước 4*: Khối Data Analysis trên Backend nhận dữ liệu, thực hiện thu thập theo thời gian , tính toán mức độ ẩm trung bình và phân tích xu hướng đất khô.
- *Bước 5*: Người dùng mở ứng dụng (App/Web), Backend cung cấp dữ liệu từ Adafruit IO để ứng dụng vẽ biểu đồ độ ẩm, nhiệt độ theo thời gian thực.
## Luồng 2: Tưới cây tự động (UC1: Auto Watering)
- *Bước 1*: Trong quá trình phân tích luồng dữ liệu ở Bước 4 (Luồng 1), Backend liên tục đánh giá các chỉ số.
- *Bước 2*: Nếu phát hiện độ ẩm/nhiệt độ rơi xuống dưới ngưỡng cài đặt (threshold) , Backend lập tức tạo ra một quyết định điều khiển.
- *Bước 3*: Backend gửi một command (lệnh điều khiển) ngược lên Adafruit IO
- *Bước 4*: Gateway/Thiết bị Edge (đang đóng vai trò là Subscriber nghe từ Adafruit) nhận được lệnh và tự động kích hoạt động cơ bơm nước.
## Luồng 3: Điều khiển từ xa thủ công (UC4: Remote Control)
- *Bước 1*: Người dùng thao tác trên App, bấm nút “Bật tưới” hoặc điều chỉnh các thiết bị khác như đổi màu đèn LED, bật quạt.
- *Bước 2*: App gửi request qua Load Balancer đến API Backend.
- *Bước 3*: Backend xử lý request và đẩy command tương ứng lên Adafruit IO.
- *Bước 4*: Gateway nhận được command từ Adafruit IO và tiến hành bật bơm hoặc bật thiết bị.
## Luồng 4: Phát hiện bất thường và Cảnh báo (UC3: Alert System)
- *Bước 1*: Trong lúc xử lý dữ liệu realtime, hệ thống Data Analysis phát hiện các tình trạng nguy hiểm như: nhiệt độ cao bất thường hoặc độ ẩm quá cao.
- *Bước 2*: Ngay lập tức, hệ thống kích hoạt luồng cảnh báo.
- *Bước 3*: Backend gửi Notification trực tiếp đến App của người dùng để họ kịp thời xử lý.
