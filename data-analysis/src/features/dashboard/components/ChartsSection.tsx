import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { METRIC_KEYS, METRIC_META } from "../constants";
import type { MetricDataMap } from "../types";

type ChartsSectionProps = {
  data: MetricDataMap;
};

export function ChartsSection({ data }: ChartsSectionProps) {
  return (
    <section className="charts-grid">
      {METRIC_KEYS.map((metric) => {
        const meta = METRIC_META[metric];

        return (
          <article className="panel chart-card" key={metric}>
            <h3>Biểu đồ {meta.label}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data[metric]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8decf" />
                <XAxis
                  dataKey="timeLabel"
                  tick={{ fontSize: 12 }}
                  minTickGap={20}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={`${meta.label} (${meta.unit})`}
                  stroke={meta.color}
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </article>
        );
      })}
    </section>
  );
}
