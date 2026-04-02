import type { ChartPoint, MetricDataMap } from "../types";

type Granularity = "day" | "week" | "month";

const getBucketStart = (timestamp: number, granularity: Granularity) => {
  const date = new Date(timestamp);

  if (granularity === "day") {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    ).getTime();
  }

  if (granularity === "week") {
    const mondayOffset = (date.getDay() + 6) % 7;
    const monday = new Date(date);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(date.getDate() - mondayOffset);
    return monday.getTime();
  }

  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
};

const getBucketLabel = (timestamp: number, granularity: Granularity) => {
  const date = new Date(timestamp);

  if (granularity === "day") {
    return date.toLocaleDateString("vi-VN");
  }

  if (granularity === "week") {
    const start = new Date(timestamp);
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    return `${start.toLocaleDateString("vi-VN")} - ${end.toLocaleDateString("vi-VN")}`;
  }

  return date.toLocaleDateString("vi-VN", {
    month: "2-digit",
    year: "numeric",
  });
};

const aggregateSeries = (
  points: ChartPoint[],
  granularity: Granularity,
): ChartPoint[] => {
  const grouped = new Map<number, { total: number; count: number }>();

  for (const point of points) {
    const bucketStart = getBucketStart(point.timestamp, granularity);
    const current = grouped.get(bucketStart);

    if (current) {
      current.total += point.value;
      current.count += 1;
    } else {
      grouped.set(bucketStart, { total: point.value, count: 1 });
    }
  }

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left - right)
    .map(([bucketStart, stats]) => ({
      timestamp: bucketStart,
      timeLabel: getBucketLabel(bucketStart, granularity),
      value: Number((stats.total / stats.count).toFixed(2)),
    }));
};

export const aggregateMetricData = (
  data: MetricDataMap,
  granularity: Granularity,
): MetricDataMap => ({
  temperature: aggregateSeries(data.temperature, granularity),
  humidity: aggregateSeries(data.humidity, granularity),
  light: aggregateSeries(data.light, granularity),
});
