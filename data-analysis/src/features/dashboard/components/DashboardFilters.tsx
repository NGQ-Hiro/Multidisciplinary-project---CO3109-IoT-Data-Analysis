import type { TimeFilter } from "../types";

type DashboardFiltersProps = {
  timeFilter: TimeFilter;
  fromDate: string;
  toDate: string;
  onTimeFilterChange: (value: TimeFilter) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onExportCsv: () => void;
};

export function DashboardFilters({
  timeFilter,
  fromDate,
  toDate,
  onTimeFilterChange,
  onFromDateChange,
  onToDateChange,
  onExportCsv,
}: DashboardFiltersProps) {
  return (
    <section className="panel filters">
      <div className="filter-row">
        <label>
          Khoảng lọc
          <select
            value={timeFilter}
            onChange={(event) =>
              onTimeFilterChange(event.target.value as TimeFilter)
            }
          >
            <option value="raw">Mặc định - chi tiết</option>
            <option value="day">Theo ngày</option>
            <option value="week">Theo tuần</option>
            <option value="month">Theo tháng</option>
          </select>
        </label>

        <label>
          Từ ngày
          <input
            type="date"
            value={fromDate}
            onChange={(event) => onFromDateChange(event.target.value)}
          />
        </label>

        <label>
          Đến ngày
          <input
            type="date"
            value={toDate}
            onChange={(event) => onToDateChange(event.target.value)}
          />
        </label>

        <button className="btn filter-action" onClick={onExportCsv}>
          Xuất CSV
        </button>

      </div>
    </section>
  );
}
