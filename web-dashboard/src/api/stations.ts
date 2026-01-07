import client from "./client";

export interface Station {
  id: string;
  name: string;
  location?: {
    lat: number;
    lng: number;
  };
  status: "online" | "offline";
  last_update: string;
  readings?: {
    pm25: number;
    temperature: number;
    humidity: number;
    aqi: number;
    aqi_category: string;
    air_value: number;
  };
}

export const getStations = async (): Promise<Station[]> => {
  const response = await client.get("/stations");
  return response.data;
};

export const getStationLatest = async (id: string) => {
  const response = await client.get(`/stations/${id}/latest`);
  return response.data;
};

export const getStationHistory = async (
  id: string,
  from?: string,
  to?: string
) => {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);

  const response = await client.get(`/stations/${id}/history`, { params });
  return response.data;
};
