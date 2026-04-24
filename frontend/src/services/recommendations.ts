import { api } from './api';

export interface Recommendation {
  id: number;
  message: string;
  created_at: string;
}

export const getLatestRecommendation = async () => {
  const response = await api.get<{ data: Recommendation | null }>('/recommendations/latest');
  return response.data.data;
};

export const refreshRecommendation = async () => {
  const response = await api.post<{ data: Recommendation }>('/recommendations/refresh');
  return response.data.data;
};
