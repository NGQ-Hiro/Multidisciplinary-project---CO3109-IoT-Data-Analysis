import type { MetricDataMap, MetricKey, MetricMeta, TimeFilter } from "./types";

export const METRIC_KEYS: MetricKey[] = ["temperature", "humidity", "light"];

export const METRIC_META: Record<MetricKey, MetricMeta> = {
  temperature: {
    label: "Nhiệt độ",
    unit: "°C",
    filePath: "/atest_data/du_lieu_nhiet_do.json",
    color: "#d45a19",
    warningMax: 32,
    criticalMax: 36,
  },
  humidity: {
    label: "Độ ẩm",
    unit: "%",
    filePath: "/atest_data/du_lieu_do_am.json",
    color: "#0d887e",
    warningMax: 75,
    criticalMax: 85,
  },
  light: {
    label: "Ánh sáng",
    unit: "lux",
    filePath: "/atest_data/du_lieu_anh_sang.json",
    color: "#cf9100",
    warningMax: 85,
    criticalMax: 92,
  },
};

export const EMPTY_DATA: MetricDataMap = {
  temperature: [],
  humidity: [],
  light: [],
};

export const PERIOD_MS: Record<TimeFilter, number> = {
  raw: 0,
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
};
