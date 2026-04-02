import type { ChartPoint, SensorPoint } from "../types";
import { formatDateTime } from "./date";

export async function fetchMetricData(path: string): Promise<ChartPoint[]> {
  const response = await fetch(`${path}?t=${Date.now()}`);

  if (!response.ok) {
    throw new Error(`Không thể tải dữ liệu: ${path}`);
  }

  const rawData = (await response.json()) as SensorPoint[];

  return rawData
    .map((item) => {
      const timestamp = new Date(item.created_at).getTime();

      return {
        timestamp,
        timeLabel: formatDateTime(timestamp),
        value: Number(item.value),
      };
    })
    .filter(
      (item) => Number.isFinite(item.timestamp) && Number.isFinite(item.value),
    )
    .sort((a, b) => a.timestamp - b.timestamp);
}
