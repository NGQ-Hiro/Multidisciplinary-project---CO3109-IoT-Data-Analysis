export type MetricKey = "temperature" | "humidity" | "light";

export type TimeFilter = "raw" | "day" | "week" | "month";

export type SensorPoint = {
  value: string;
  created_at: string;
};

export type ChartPoint = {
  timestamp: number;
  timeLabel: string;
  value: number;
};

export type MetricDataMap = Record<MetricKey, ChartPoint[]>;

export type AlertLevel = "warning" | "critical";

export type AlertItem = {
  metric: MetricKey;
  label: string;
  value: number;
  warningMax: number;
  criticalMax: number;
  level: AlertLevel;
};

export type MetricMeta = {
  label: string;
  unit: string;
  filePath: string;
  color: string;
  warningMax: number;
  criticalMax: number;
};
