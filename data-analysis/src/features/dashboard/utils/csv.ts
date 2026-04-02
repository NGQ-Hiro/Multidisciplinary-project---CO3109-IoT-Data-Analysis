import { METRIC_KEYS, METRIC_META } from "../constants";
import type { MetricDataMap } from "../types";
import { formatDateForCsv } from "./date";

export const downloadDashboardCsv = (data: MetricDataMap) => {
  const rows: string[] = ["thoi_gian,chi_so,gia_tri,don_vi,muc_do"];

  for (const metric of METRIC_KEYS) {
    const meta = METRIC_META[metric];

    for (const point of data[metric]) {
      const level =
        point.value > meta.criticalMax
          ? "Nguy hiểm"
          : point.value > meta.warningMax
            ? "Cảnh báo"
            : "Bình thường";

      rows.push(
        `${formatDateForCsv(point.timestamp)},${meta.label},${point.value},${meta.unit},${level}`,
      );
    }
  }

  const blob = new Blob([rows.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `du-lieu-iot-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  URL.revokeObjectURL(url);
};
