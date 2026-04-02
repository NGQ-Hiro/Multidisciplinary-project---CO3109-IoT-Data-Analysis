import { useCallback, useEffect, useMemo, useState } from "react";
import { EMPTY_DATA, METRIC_KEYS, METRIC_META } from "../constants";
import type { AlertItem, MetricDataMap, MetricKey, TimeFilter } from "../types";
import { aggregateMetricData } from "../utils/aggregate";
import { downloadDashboardCsv } from "../utils/csv";
import {
  parseDateRangeEnd,
  parseDateRangeStart,
} from "../utils/date";
import { fetchMetricData } from "../utils/fetchMetricData";

type StatusMap = Record<MetricKey, "normal" | "warning" | "critical">;
type AiRecommendationStatus = "idle" | "loading" | "ready" | "error";

type LatestMetricValue = Partial<Record<MetricKey, { value: number }>>;

const LLM_API_URL = (
  import.meta.env.VITE_LLM_RECOMMENDATION_URL as string | undefined
)?.trim();

const buildPrompt = (payload: {
  latestValues: LatestMetricValue;
  alerts: AlertItem[];
  localRecommendation: string;
}) => {
  const temperature = payload.latestValues.temperature?.value ?? "không có";
  const humidity = payload.latestValues.humidity?.value ?? "không có";
  const light = payload.latestValues.light?.value ?? "không có";

  return `Bạn là trợ lý nông nghiệp. Hãy trả lời ngắn gọn bằng tiếng Việt, tối đa 3 câu.
Đọc dữ liệu sau và đề xuất hành động cho nông dân.

Nhiệt độ hiện tại: ${temperature}
Độ ẩm hiện tại: ${humidity}
Ánh sáng hiện tại: ${light}
Số cảnh báo đang có: ${payload.alerts.length}
Gợi ý nội bộ: ${payload.localRecommendation}

Chỉ trả về một đoạn recommendation ngắn, không thêm tiêu đề.`;
};

const parseRecommendationText = (rawText: string) => {
  const trimmed = rawText.trim();

  if (!trimmed) {
    return "";
  }

  if (!trimmed.startsWith("{")) {
    return trimmed;
  }

  try {
    const parsed = JSON.parse(trimmed) as {
      recommendation?: string;
      content?: string;
      message?: string;
      data?: { recommendation?: string };
    };

    return (
      parsed.recommendation ??
      parsed.content ??
      parsed.message ??
      parsed.data?.recommendation ??
      trimmed
    );
  } catch {
    return trimmed;
  }
};

export function useSensorDashboard() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("raw");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [data, setData] = useState<MetricDataMap>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);
  const [aiRecommendation, setAiRecommendation] = useState("");
  const [aiRecommendationStatus, setAiRecommendationStatus] =
    useState<AiRecommendationStatus>("idle");
  const [aiRecommendationSource, setAiRecommendationSource] =
    useState("Gợi ý nội bộ");

  const reloadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [temperature, humidity, light] = await Promise.all([
        fetchMetricData(METRIC_META.temperature.filePath),
        fetchMetricData(METRIC_META.humidity.filePath),
        fetchMetricData(METRIC_META.light.filePath),
      ]);

      setData({ temperature, humidity, light });
      setLastRefresh(Date.now());
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi tải dữ liệu.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadData();
  }, [reloadData]);

  useEffect(() => {
    const refreshTimer = window.setInterval(
      () => {
        void reloadData();
      },
      5 * 60 * 1000,
    );

    return () => window.clearInterval(refreshTimer);
  }, [reloadData]);

  const detailData = useMemo(() => {
    const rangeStart = parseDateRangeStart(fromDate);
    const rangeEnd = parseDateRangeEnd(toDate);

    return {
      temperature: data.temperature.filter(
        (item) => item.timestamp >= rangeStart && item.timestamp <= rangeEnd,
      ),
      humidity: data.humidity.filter(
        (item) => item.timestamp >= rangeStart && item.timestamp <= rangeEnd,
      ),
      light: data.light.filter(
        (item) => item.timestamp >= rangeStart && item.timestamp <= rangeEnd,
      ),
    };
  }, [data, fromDate, toDate]);

//   const filterSummary = useMemo(() => {
//     const granularityLabel =
//       timeFilter === "raw"
//         ? "chi tiết theo ngày giờ phút giây"
//         : timeFilter === "day"
//           ? "trung bình theo ngày"
//           : timeFilter === "week"
//             ? "trung bình theo tuần"
//             : "trung bình theo tháng";

//     const rangeLabel =
//       fromDate && toDate
//         ? `${formatDateOnly(new Date(`${fromDate}T00:00:00`).getTime())} - ${formatDateOnly(new Date(`${toDate}T00:00:00`).getTime())}`
//         : fromDate
//           ? `Từ ${formatDateOnly(new Date(`${fromDate}T00:00:00`).getTime())}`
//           : toDate
//             ? `Đến ${formatDateOnly(new Date(`${toDate}T00:00:00`).getTime())}`
//             : "Chưa chọn khoảng ngày";

//     return `${granularityLabel} | ${rangeLabel}`;
//   }, [timeFilter, fromDate, toDate]);

  const filteredData = useMemo(() => {
    if (timeFilter === "raw") {
      return detailData;
    }

    return aggregateMetricData(detailData, timeFilter);
  }, [detailData, timeFilter]);

  const latestValues = useMemo<LatestMetricValue>(() => {
    return {
      temperature: detailData.temperature.at(-1) ?? data.temperature.at(-1),
      humidity: detailData.humidity.at(-1) ?? data.humidity.at(-1),
      light: detailData.light.at(-1) ?? data.light.at(-1),
    };
  }, [detailData, data]);

  const alerts = useMemo<AlertItem[]>(() => {
    const result: AlertItem[] = [];

    for (const metric of METRIC_KEYS) {
      const latestPoint = latestValues[metric];

      if (!latestPoint) {
        continue;
      }

      const meta = METRIC_META[metric];

      if (latestPoint.value > meta.warningMax) {
        result.push({
          metric,
          label: meta.label,
          value: latestPoint.value,
          warningMax: meta.warningMax,
          criticalMax: meta.criticalMax,
          level: latestPoint.value > meta.criticalMax ? "critical" : "warning",
        });
      }
    }

    return result;
  }, [latestValues]);

  const recommendation = useMemo(() => {
    if (alerts.length === 0) {
      return "Các chỉ số đang ổn định. Duy trì lịch tưới và kiểm tra cảm biến định kỳ mỗi ngày.";
    }

    const criticalAlert = alerts.find((item) => item.level === "critical");

    if (criticalAlert) {
      if (criticalAlert.metric === "temperature") {
        return "Nhiệt độ quá cao. Nên tăng thông gió, che bớt nắng và tưới bổ sung vào sáng sớm.";
      }

      if (criticalAlert.metric === "humidity") {
        return "Độ ẩm quá cao. Giảm tưới, thoát nước tốt hơn để hạn chế nấm bệnh cho cây.";
      }

      return "Ánh sáng vượt ngưỡng cao. Cân nhắc dùng lưới che nắng để tránh cháy lá.";
    }

    return "Đã có chỉ số vượt ngưỡng cảnh báo. Nên kiểm tra khu vực canh tác và theo dõi thêm 1-2 giờ tới.";
  }, [alerts]);

  useEffect(() => {
    let isActive = true;

    const fetchAiRecommendation = async () => {
      if (!LLM_API_URL) {
        setAiRecommendation(recommendation);
        setAiRecommendationStatus("idle");
        setAiRecommendationSource("Gợi ý nội bộ do chưa cấu hình API LLM");
        return;
      }

      try {
        setAiRecommendationStatus("loading");
        setAiRecommendationSource("LLM bên ngoài");

        const response = await fetch(LLM_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: buildPrompt({
              latestValues,
              alerts,
              localRecommendation: recommendation,
            }),
            latestValues,
            alerts,
            language: "vi",
          }),
        });

        if (!response.ok) {
          throw new Error(`LLM API trả về lỗi ${response.status}`);
        }

        const recommendationText = parseRecommendationText(
          await response.text(),
        );

        if (isActive) {
          setAiRecommendation(recommendationText || recommendation);
          setAiRecommendationStatus("ready");
        }
      } catch {
        if (isActive) {
          setAiRecommendation(recommendation);
          setAiRecommendationStatus("error");
          setAiRecommendationSource("LLM lỗi, đang dùng gợi ý nội bộ");
        }
      }
    };

    void fetchAiRecommendation();

    return () => {
      isActive = false;
    };
  }, [alerts, latestValues, recommendation]);

  const exportCsv = useCallback(() => {
    downloadDashboardCsv(detailData);
  }, [detailData]);

  const statusByMetric = useMemo<StatusMap>(() => {
    return METRIC_KEYS.reduce<StatusMap>(
      (accumulator, metric) => {
        const latestPoint = latestValues[metric];
        const meta = METRIC_META[metric];

        accumulator[metric] = latestPoint
          ? latestPoint.value > meta.criticalMax
            ? "critical"
            : latestPoint.value > meta.warningMax
              ? "warning"
              : "normal"
          : "normal";

        return accumulator;
      },
      {
        temperature: "normal",
        humidity: "normal",
        light: "normal",
      },
    );
  }, [latestValues]);

  return {
    timeFilter,
    setTimeFilter,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    filteredData,
    detailData,
    // filterSummary,
    latestValues,
    alerts,
    recommendation,
    aiRecommendation,
    aiRecommendationStatus,
    aiRecommendationSource,
    statusByMetric,
    isLoading,
    errorMessage,
    lastRefresh,
    reloadData,
    exportCsv,
  };
}
