import { api } from './api';

export interface Alert {
  id: number;
  metric_name: string;
  severity: string;
  message: string;
  created_at: string;
  is_resolved: boolean;
}

export interface AlertSummary {
  open_count: number;
}

export const getAlerts = async (status?: 'open' | 'resolved') => {
  const params = status ? { status } : {};
  const response = await api.get<{ data: Alert[]; summary: AlertSummary }>('/alerts', { params });
  return response.data;
};

export const resolveAlert = async (alertId: number) => {
  const response = await api.post(`/alerts/read/${alertId}`);
  return response.data;
};
