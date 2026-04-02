# Tài liệu Chi Tiết Luồng Hoạt Động Dashboard IoT

## 1. Mục tiêu hệ thống

Dashboard dùng để theo dõi 3 chỉ số IoT trong nông nghiệp:

- Nhiệt độ
- Độ ẩm
- Ánh sáng

Mục tiêu chính:

- Trực quan hóa dữ liệu theo thời gian
- Cảnh báo khi chỉ số vượt ngưỡng
- Lọc dữ liệu theo khoảng ngày và độ mịn hiển thị
- Xuất dữ liệu CSV
- Đưa ra gợi ý canh tác (nội bộ + AI nếu có cấu hình API)

---

## 2. Kiến trúc tổng quan

Hệ thống gồm 2 phần chính:

1. Thu thập dữ liệu và lưu JSON cục bộ

- Script: `atest_data/data.js`
- Gọi Adafruit IO API, lấy dữ liệu theo feed
- Lưu thành các file JSON:
  - `atest_data/du_lieu_nhiet_do.json`
  - `atest_data/du_lieu_do_am.json`
  - `atest_data/du_lieu_anh_sang.json`

2. Frontend React + TypeScript hiển thị dashboard

- Framework: React + Vite + TypeScript
- Vẽ chart: Recharts
- Nạp dữ liệu trực tiếp từ các file JSON phía trên

---

## 3. Luồng dữ liệu end-to-end

### Bước A. Thu thập dữ liệu từ Adafruit

- Chạy script `node data.js` trong thư mục `atest_data`.
- Script duyệt từng feed trong mảng `FEEDS`.
- Mỗi feed gọi endpoint:
  - `https://io.adafruit.com/api/v2/{username}/feeds/{feed_key}/data?limit={targetCount}`
- Kết quả ghi ra file JSON tương ứng.

### Bước B. Frontend nạp dữ liệu vào dashboard

- Hook trung tâm: `src/features/dashboard/hooks/useSensorDashboard.ts`
- Hàm `reloadData` gọi song song 3 lần `fetchMetricData(...)`.
- Hàm `fetchMetricData` (ở `src/features/dashboard/utils/fetchMetricData.ts`):
  - Parse `created_at` -> `timestamp`
  - Parse `value` -> `number`
  - Tạo `timeLabel`
  - Lọc bản ghi không hợp lệ
  - Sort tăng dần theo thời gian

### Bước C. Lọc theo khoảng ngày

- State filter:
  - `fromDate`
  - `toDate`
- Dùng `parseDateRangeStart` và `parseDateRangeEnd` để cắt dữ liệu theo khoảng thời gian người dùng chọn.

### Bước D. Xử lý độ mịn dữ liệu

- `timeFilter` hỗ trợ:
  - `raw`: dữ liệu chi tiết (không gộp)
  - `day`: trung bình theo ngày
  - `week`: trung bình theo tuần
  - `month`: trung bình theo tháng
- Logic gộp nằm ở `src/features/dashboard/utils/aggregate.ts`.

### Bước E. Tính cảnh báo

- Mỗi chỉ số có ngưỡng trong `src/features/dashboard/constants.ts`:
  - `warningMax`
  - `criticalMax`
- Hook so sánh giá trị mới nhất để sinh danh sách `alerts`.

### Bước F. Recommendation

- Recommendation nội bộ (rule-based): tạo trong hook từ dữ liệu `alerts`.
- Recommendation AI:
  - Nếu có biến môi trường `VITE_LLM_RECOMMENDATION_URL`, frontend sẽ POST payload để lấy gợi ý.
  - Nếu lỗi hoặc chưa cấu hình API, fallback về recommendation nội bộ.

### Bước G. Export CSV

- Nút export gọi `downloadDashboardCsv(...)`.
- Hàm ở `src/features/dashboard/utils/csv.ts` tạo blob CSV và tải về máy người dùng.

---

## 4. Luồng UI theo component

### `src/App.tsx`

- Dùng `useSensorDashboard()` để lấy toàn bộ state + action.
- Truyền xuống các component trình bày.

### `src/features/dashboard/components/DashboardHeader.tsx`

- Nút làm mới thủ công
- Hiển thị thời điểm cập nhật gần nhất
- Thông báo tự động refresh mỗi 5 phút

### `src/features/dashboard/components/DashboardFilters.tsx`

- Chọn độ mịn (`raw/day/week/month`)
- Chọn khoảng ngày `fromDate` -> `toDate`
- Nút xuất CSV

### `src/features/dashboard/components/MetricSummaryGrid.tsx`

- 3 KPI card
- Trạng thái `Bình thường / Cảnh báo / Nguy hiểm`

### `src/features/dashboard/components/AlertPanel.tsx`

- Danh sách cảnh báo chi tiết khi vượt ngưỡng

### `src/features/dashboard/components/RecommendationCard.tsx`

- Hiển thị gợi ý canh tác

### `src/features/dashboard/components/ChartsSection.tsx`

- 3 biểu đồ cho nhiệt độ, độ ẩm, ánh sáng
- Nguồn data là `filteredData` sau khi áp dụng filter

---

## 5. State quan trọng trong hook

Trong `useSensorDashboard` có các state chính:

- `timeFilter`: mức độ mịn
- `fromDate`, `toDate`: khoảng thời gian
- `data`: dữ liệu gốc
- `filteredData`: dữ liệu sau lọc/gộp
- `latestValues`: bản ghi mới nhất cho từng metric
- `alerts`: danh sách cảnh báo
- `recommendation`: gợi ý nội bộ
- `aiRecommendation`, `aiRecommendationStatus`, `aiRecommendationSource`: gợi ý AI
- `isLoading`, `errorMessage`, `lastRefresh`

---

## 6. Cấu hình và chạy dự án

### Cài dependencies

```bash
npm install
```

### Chạy frontend

```bash
npm run dev
```

### Build production

```bash
npm run build
```

### Cập nhật dữ liệu mới từ Adafruit

```bash
cd atest_data
node data.js
```

---

## 7. Cấu hình LLM recommendation (tùy chọn)

Để bật recommendation từ API ngoài, thêm vào `.env`:

```env
VITE_LLM_RECOMMENDATION_URL=https://your-llm-endpoint
```

Backend/endpoint nên nhận JSON có `prompt`, `latestValues`, `alerts` và trả về text hoặc JSON có trường recommendation.

---

## 8. Các điểm cần lưu ý

- Không nên hardcode API key Adafruit trong code public.
- Nên chuyển phần gọi Adafruit sang backend/proxy để bảo mật tốt hơn.
- Dữ liệu càng lớn thì mode `raw` sẽ càng nặng; có thể bổ sung giới hạn điểm dữ liệu để tối ưu hiệu năng chart.

---

## 9. Đề xuất mở rộng

- Thêm bảng lịch sử cảnh báo có phân trang
- Lưu cấu hình ngưỡng cảnh báo theo người dùng
- Thêm so sánh nhiều khoảng thời gian (kỳ này vs kỳ trước)
- Gửi thông báo chủ động (email/telegram) khi `critical`

---

## 10. Tóm tắt một câu

Hệ thống hiện tại lấy dữ liệu IoT từ Adafruit -> lưu JSON -> frontend đọc JSON, lọc theo thời gian và độ mịn, cảnh báo vượt ngưỡng, hiển thị chart và recommendation, đồng thời cho phép export CSV.
