import client from './client';

export const startSimulation = async (scenario: string) => {
  const response = await client.post('/simulation/start', { scenario });
  return response.data;
};

export const stopSimulation = async () => {
  const response = await client.post('/simulation/stop');
  return response.data;
};

export const getSimulationStatus = async () => {
  const response = await client.get('/simulation/status');
  return response.data;
};
