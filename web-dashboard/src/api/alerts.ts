import client from './client';

export interface Alert {
  id: string;
  station_id: string;
  station_name: string;
  timestamp: string;
  level: 'warning' | 'critical';
  message: string;
  value: number;
  parameter: string;
}

export const getAlerts = async (params?: { station_id?: string; from?: string; to?: string }) => {
  const response = await client.get('/alerts', { params });
  return response.data;
};
