import fs from "node:fs";

const USERNAME = "name";
const AIO_KEY = "key";

// Danh sách các Feed cần lấy dữ liệu
const FEEDS = [
  { key: "humid-test1", fileName: "du_lieu_do_am.json" },
  { key: "luminor-test1", fileName: "du_lieu_anh_sang.json" },
  { key: "temp-test1", fileName: "du_lieu_nhiet_do.json" },
];

async function fetchDataFromAllFeeds(targetCount) {
  console.log(`🚀 Bắt đầu lấy dữ liệu (${targetCount} bản ghi mỗi loại)...`);

  for (const feed of FEEDS) {
    console.log(`\n--- Đang xử lý feed: ${feed.key} ---`);

    // Cấu hình URL: Giới hạn targetCount bản ghi
    const url = `https://io.adafruit.com/api/v2/${USERNAME}/feeds/${feed.key}/data?limit=${targetCount}`;

    try {
      const response = await fetch(url, {
        headers: { "X-AIO-Key": AIO_KEY },
      });

      if (!response.ok) {
        throw new Error(
          `Lỗi HTTP ${response.status}: Không thể lấy dữ liệu cho ${feed.key}`,
        );
      }

      const data = await response.json();

      // Lưu file cho từng feed
      fs.writeFileSync(feed.fileName, JSON.stringify(data, null, 2));

      console.log(`✅ Thành công! Đã lấy ${data.length} bản ghi.`);
      console.log(`💾 Đã lưu vào file: ${feed.fileName}`);

      if (data.length > 0) {
        console.log(
          `📍 Mới nhất: ${data[0].created_at} -> Giá trị: ${data[0].value}`,
        );
      }
    } catch (error) {
      console.error(`❌ Lỗi khi xử lý feed ${feed.key}:`, error.message);
    }
  }

  console.log("\n✨ HOÀN THÀNH TẤT CẢ!");
}

// Chạy hàm lấy 30 bản ghi cho mỗi feed
fetchDataFromAllFeeds(1000000);
