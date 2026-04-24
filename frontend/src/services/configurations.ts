import { api } from './api';

export interface Configuration {
  id: number;
  metric_name: number;
  ideal_min: number;
  ideal_max: number;
  critical_min: number;
  critical_max: number;
  created_at: string;
  updated_at: string;
}

export const getConfigurations = async () => {
  const response = await api.get<{ data: Configuration[] }>('/configurations');
  return response.data.data;
};

export const updateConfiguration = async (config: Partial<Configuration>) => {
  const response = await api.put<{ data: Configuration }>('/configurations', config);
  return response.data.data;
};
