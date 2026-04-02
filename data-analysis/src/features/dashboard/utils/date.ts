export const formatDateTime = (timestamp: number) =>
  new Date(timestamp).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });

export const formatDateOnly = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString("vi-VN");

export const formatMonthLabel = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString("vi-VN", {
    month: "2-digit",
    year: "numeric",
  });

export const formatDateRangeLabel = (
  startTimestamp: number,
  endTimestamp: number,
) =>
  `${new Date(startTimestamp).toLocaleDateString("vi-VN")} - ${new Date(endTimestamp).toLocaleDateString("vi-VN")}`;

export const formatDateForCsv = (timestamp: number) =>
  new Date(timestamp).toISOString();

export const parseDateRangeStart = (date: string) =>
  date ? new Date(`${date}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;

export const parseDateRangeEnd = (date: string) =>
  date ? new Date(`${date}T23:59:59`).getTime() : Number.POSITIVE_INFINITY;
