import { api } from './api';

export interface TelemetryReading {
  metric_name: string;
  metric: string;
  value: number;
  device_id: number;
  device_code: string;
  recorded_at: string;
}

export interface TelemetryHistory {
  metric_name: string;
  metric: string;
  value: number;
  device_id: number;
  recorded_at: string;
  aggregate?: string;
}

export const getLatestTelemetry = async (metric?: string) => {
  const params = metric ? { metric } : {};
  const response = await api.get<{ data: TelemetryReading[] }>('/telemetry/latest', { params });
  return response.data.data;
};

export const getTelemetryHistory = async (params?: { 
  metric?: string; 
  user_id?: number; 
  start?: string; 
  end?: string; 
  aggregate?: string 
}) => {
  const response = await api.get<{ data: TelemetryHistory[] }>('/telemetry/history', { params });
  return response.data.data;
};
