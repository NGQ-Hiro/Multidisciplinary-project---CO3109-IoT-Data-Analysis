import { METRIC_META } from "../constants";
import type { AlertItem } from "../types";

type AlertPanelProps = {
  alerts: AlertItem[];
};

export function AlertPanel({ alerts }: AlertPanelProps) {
  return (
    <section className="panel alert-panel">
      <h3>Cảnh báo</h3>
      {alerts.length === 0 ? (
        <p className="ok">Không có chỉ số vượt ngưỡng.</p>
      ) : (
        <ul>
          {alerts.map((alert) => (
            <li key={alert.metric} className={alert.level}>
              {alert.label}: {alert.value} {METRIC_META[alert.metric].unit}{" "}
              (ngưỡng cảnh báo {alert.warningMax}, nguy hiểm {alert.criticalMax}
              )
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
