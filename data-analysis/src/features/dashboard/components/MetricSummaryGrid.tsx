import { METRIC_KEYS, METRIC_META } from "../constants";
import type { MetricKey } from "../types";

type MetricSummaryGridProps = {
  statusByMetric: Record<MetricKey, "normal" | "warning" | "critical">;
  latestValues: Partial<Record<MetricKey, { value: number }>>;
};

const STATUS_LABELS = {
  normal: "Bình thường",
  warning: "Cảnh báo",
  critical: "Nguy hiểm",
} as const;

export function MetricSummaryGrid({
  statusByMetric,
  latestValues,
}: MetricSummaryGridProps) {
  return (
    <section className="summary-grid">
      {METRIC_KEYS.map((metric) => {
        const meta = METRIC_META[metric];
        const latest = latestValues[metric];
        const status = statusByMetric[metric];
        const valueText = latest
          ? `${latest.value} ${meta.unit}`
          : "Chưa có dữ liệu";

        return (
          <article className="panel metric-card" key={metric}>
            <p>{meta.label}</p>
            <h2>{valueText}</h2>
            <span className={`status status-${status}`}>
              {STATUS_LABELS[status]}
            </span>
          </article>
        );
      })}
    </section>
  );
}
