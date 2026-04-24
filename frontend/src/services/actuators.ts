import { api } from './api';

export interface Actuator {
  id: string; // device_code
  device_id: number;
  device_code: string;
  name: string;
  type: string;
  status: 'ON' | 'OFF';
  mode: 'AUTO' | 'MANUAL';
  manual_expire_at: string | null;
  updated_at: string;
}

export interface ActuatorLog {
  id: number;
  actuator_device_id: number;
  actuator_code: string;
  actuator_type: string;
  user_id: number;
  action: string;
  trigger_source: string;
  action_time: string;
  note: string;
}

export const getActuators = async () => {
  const response = await api.get<{ data: Actuator[] }>('/actuators');
  return response.data.data;
};

export const toggleActuator = async (id: string, action: 'ON' | 'OFF', duration_min?: number) => {
  const response = await api.post(`/actuators/${id}/toggle`, { action, duration_min });
  return response.data;
};

export const getActuatorLogs = async () => {
  const response = await api.get<{ data: ActuatorLog[] }>('/actuators/logs');
  return response.data.data;
};
