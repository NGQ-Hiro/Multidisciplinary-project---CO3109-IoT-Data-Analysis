import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, Button } from "../../components";
import {
  getLatestTelemetry,
  getTelemetryHistory,
  type TelemetryReading,
  type TelemetryHistory,
} from "../../services";
import styles from "./Dashboard.module.css";

export const Dashboard: React.FC = () => {
  const [readings, setReadings] = useState<TelemetryReading[]>([]);
  const [history, setHistory] = useState<TelemetryHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Filters
  const [userId, _setUserId] = useState<string>("");
  const [start, setStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 60);
    return d.toISOString().slice(0, 16); // format for datetime-local
  });
  const [end, setEnd] = useState<string>(() =>
    new Date().toISOString().slice(0, 16),
  );
  const [aggregate, setAggregate] = useState<string>("hour");

  const fetchLatest = useCallback(async (isRefresh = false) => {
    if (isRefresh) setLoading(true);
    try {
      const data = await getLatestTelemetry();
      setReadings(data || []);
    } catch (error) {
      console.error("Failed to fetch latest telemetry", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setHistoryLoading(true);
      try {
        // Fetch all metrics by not passing metric filter
        const data = await getTelemetryHistory({
          user_id: userId ? parseInt(userId) : undefined,
          start: start || undefined,
          end: end || undefined,
          aggregate,
        });
        setHistory(data || []);
      } catch (error) {
        console.error("Failed to fetch history", error);
      } finally {
        setHistoryLoading(false);
      }
    },
    [userId, start, end, aggregate],
  );

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const groupDataByMetric = useCallback(
    (metricName: string) => {
      return history
        .filter((h) => h.metric_name === metricName)
        .map((h) => ({
          time: new Date(h.recorded_at).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          value: Number(h.value).toFixed(1),
          recorded_at: h.recorded_at,
        }))
        .sort(
          (a, b) =>
            new Date(a.recorded_at).getTime() -
            new Date(b.recorded_at).getTime(),
        );
    },
    [history],
  );

  const tempData = useMemo(
    () => groupDataByMetric("Temperature"),
    [groupDataByMetric],
  );
  const humidData = useMemo(
    () => groupDataByMetric("Humidity"),
    [groupDataByMetric],
  );
  const lightData = useMemo(
    () => groupDataByMetric("Light"),
    [groupDataByMetric],
  );

  const getMetricInfo = useCallback((metricId: string) => {
    switch (metricId) {
      case "0":
        return { label: "Temperature", unit: "°C", color: "#ff6b6b" };
      case "1":
        return { label: "Humidity", unit: "%", color: "#4dabf7" };
      case "2":
        return { label: "Light", unit: " lux", color: "#fcc419" };
      default:
        return { label: "Metric", unit: "", color: "var(--color-mongo-green)" };
    }
  }, []);

  return (
    <>
      <section className="section-dark">
        <div className="container">
          <p className="tech-label">REAL-TIME MONITORING</p>
          <h1
            style={{
              marginTop: "var(--space-1)",
              color: "var(--color-mongo-green)",
            }}
          >
            Dashboard
          </h1>
          <p
            style={{
              fontSize: "var(--font-size-body-large)",
              color: "var(--color-silver-teal)",
              maxWidth: "600px",
            }}
          >
            Monitor your agricultural sensor networks with high precision and
            historical depth.
          </p>
        </div>
      </section>

      <section
        className="section-light"
        style={{ backgroundColor: "var(--bg-secondary)" }}
      >
        <div className="container">
          {/* ... KPI Grid ... */}
          {/* (I'll keep the kpiGrid part but need to make sure I don't break the structure) */}
          <div className={styles.kpiGrid}>
            {loading ? (
              [1, 2, 3].map((i) => (
                <Card key={i}>
                  <p>Loading...</p>
                </Card>
              ))
            ) : readings.length === 0 ? (
              <Card>
                <p>No telemetry data available.</p>
              </Card>
            ) : (
              readings.map((reading, idx) => {
                const info = getMetricInfo(
                  reading.metric_name.toLowerCase().includes("temp")
                    ? "0"
                    : reading.metric_name.toLowerCase().includes("humid")
                      ? "1"
                      : "2",
                );
                return (
                  <Card key={idx} elevation="subtle" padding="standard">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      <p className="tech-label">{reading.device_code}</p>
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          backgroundColor: "var(--color-mongo-green)",
                          boxShadow: "0 0 10px var(--color-mongo-green)",
                          animation: "pulse 2s infinite",
                        }}
                      />
                    </div>
                    <h3
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "var(--font-size-caption)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {reading.metric_name}
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "6px",
                        margin: "var(--space-1) 0",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "var(--font-size-sub-hero)",
                          fontWeight: "800",
                          lineHeight: 1,
                          letterSpacing: "-0.04em",
                          color: "var(--text-primary)",
                        }}
                      >
                        {reading.value}
                      </span>
                      <span
                        style={{
                          fontSize: "var(--font-size-h2)",
                          color: "var(--text-secondary)",
                          fontWeight: "600",
                        }}
                      >
                        {info.unit}
                      </span>
                    </div>
                    <div
                      style={{
                        marginTop: "var(--space-2)",
                        paddingTop: "var(--space-1)",
                        borderTop: "1px solid var(--border-color)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          color: "var(--color-cool-gray)",
                          fontWeight: "500",
                        }}
                      >
                        LIVE DATA
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          color: "var(--color-cool-gray)",
                        }}
                      >
                        {new Date(reading.recorded_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          <Card padding="large" className={styles.analyticsCard}>
            <div className={styles.analyticsHeader}>
              <div>
                <h2 style={{ marginBottom: "4px" }}>Analytics History</h2>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "var(--font-size-caption)",
                  }}
                >
                  Visualize trends and patterns over time
                </p>
              </div>

              <div className={styles.filters}>
                <div className={styles.leftFilters}>
                  <div className={styles.filterGroup}>
                    <label>Aggregation</label>
                    <select
                      value={aggregate}
                      onChange={(e) => setAggregate(e.target.value)}
                    >
                      <option value="none">Raw Data</option>
                      <option value="minute">1 Minute</option>
                      <option value="hour">1 Hour</option>
                      <option value="day">1 Day</option>
                    </select>
                  </div>

                  <div className={styles.filterGroup}>
                    <label>Start Range</label>
                    <input
                      type="datetime-local"
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                    />
                  </div>

                  <div className={styles.filterGroup}>
                    <label>End Range</label>
                    <input
                      type="datetime-local"
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.rightActions}>
                  <Button
                    variant="outlined"
                    className={styles.actionButton}
                    onClick={() => {
                      fetchLatest(true);
                      fetchHistory(true);
                    }}
                  >
                    Refresh
                  </Button>

                  <Button
                    variant="primary"
                    className={styles.actionButton}
                    onClick={() => {
                      const baseUrl =
                        import.meta.env.VITE_API_URL ||
                        "http://localhost:4000/api/v1";
                      const token = localStorage.getItem("auth_token");
                      const url = `${baseUrl}/export/csv?start=${start}&end=${end}&aggregate=${aggregate}${token ? `&token=${token}` : ""}`;
                      window.open(url, "_blank");
                    }}
                  >
                    Export CSV
                  </Button>
                </div>
              </div>
            </div>

            <div className={styles.chartsGrid}>
              {[
                { data: tempData, info: getMetricInfo("0") },
                { data: humidData, info: getMetricInfo("1") },
                { data: lightData, info: getMetricInfo("2") },
              ].map((chart, index) => (
                <div key={index} className={styles.chartSection}>
                  <h4
                    style={{
                      marginBottom: "var(--space-2)",
                      color: chart.info.color,
                    }}
                  >
                    {chart.info.label} ({chart.info.unit.trim()})
                  </h4>
                  <div className={styles.chartContainer}>
                    {historyLoading ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "100%",
                          gap: "var(--space-2)",
                        }}
                      >
                        <div className="spinner" />
                        <p style={{ color: "var(--text-secondary)" }}>
                          Loading history data...
                        </p>
                      </div>
                    ) : chart.data.length === 0 ? (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "100%",
                        }}
                      >
                        <p style={{ color: "var(--text-secondary)" }}>
                          No data found.
                        </p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={chart.data}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="var(--color-border)"
                          />
                          <XAxis
                            dataKey="time"
                            tick={{
                              fontSize: 10,
                              fill: "var(--color-cool-gray)",
                            }}
                            axisLine={{ stroke: "var(--color-border)" }}
                            tickLine={false}
                            minTickGap={30}
                          />
                          <YAxis
                            tick={{
                              fontSize: 10,
                              fill: "var(--color-cool-gray)",
                            }}
                            axisLine={false}
                            tickLine={false}
                            domain={["auto", "auto"]}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--color-pure-white)",
                              border: "none",
                              borderRadius: "8px",
                              boxShadow: "var(--shadow-standard)",
                              fontSize: "12px",
                            }}
                            itemStyle={{ fontWeight: "600" }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            name={`${chart.info.label} (${chart.info.unit.trim()})`}
                            stroke={chart.info.color}
                            strokeWidth={3}
                            dot={false}
                            activeDot={{
                              r: 6,
                              strokeWidth: 0,
                              fill: chart.info.color,
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </>
  );
};
