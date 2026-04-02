type DashboardHeaderProps = {
  isLoading: boolean;
  lastRefresh: number | null;
  onReload: () => void;
};

export function DashboardHeader({
  isLoading,
  lastRefresh,
  onReload,
}: DashboardHeaderProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">NÔNG NGHIỆP THÔNG MINH</p>
        <h1>Dashboard IoT Nông Trại</h1>
        <p className="subtitle">
          Theo dõi ánh sáng, nhiệt độ, độ ẩm theo thời gian và nhận cảnh báo sớm.
        </p>
      </div>

      <div className="refresh-box">
        <button
          onClick={onReload}
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? "Đang tải..." : "Làm mới ngay"}
        </button>

        <span>
          Tự động cập nhật mỗi 5 phút
          <br />
          {lastRefresh
            ? `Lần gần nhất: ${new Date(lastRefresh).toLocaleString("vi-VN")}`
            : "Chưa có dữ liệu"}
        </span>
      </div>
    </header>
  );
}
