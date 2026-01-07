import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStationLatest, getStationHistory } from '../../api/stations';
import Chart from '../../components/charts/Chart';
import { ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

const StationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('24h');

  const { data: latestData, isLoading: isLatestLoading } = useQuery({
    queryKey: ['station', id, 'latest'],
    queryFn: () => getStationLatest(id!),
    enabled: !!id,
    refetchInterval: 5000,
  });

  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['station', id, 'history', timeRange],
    queryFn: () => getStationHistory(id!, timeRange), // Need to implement timeRange logic in API
    enabled: !!id,
  });

  if (isLatestLoading || isHistoryLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!latestData) {
    return <div>Station not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{latestData.station_name || 'Station Detail'}</h1>
          <p className="text-gray-500 text-sm">Last updated: {new Date(latestData.timestamp).toLocaleString()}</p>
        </div>
      </div>

      {/* Real-time Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">AQI</p>
          <div className="flex items-end gap-2">
            <span className={clsx(
              "text-3xl font-bold",
              latestData.aqi > 100 ? "text-orange-500" : "text-green-500"
            )}>
              {latestData.aqi}
            </span>
            <span className="text-sm text-gray-500 mb-1">{latestData.aqi_category}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">PM2.5</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-900">{latestData.pm25}</span>
            <span className="text-sm text-gray-500 mb-1">µg/m³</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Temperature</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-900">{latestData.temperature}</span>
            <span className="text-sm text-gray-500 mb-1">°C</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Humidity</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-900">{latestData.humidity}</span>
            <span className="text-sm text-gray-500 mb-1">%</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Gas Status</p>
          <div className="flex items-end gap-2">
            <span className={clsx(
              "text-3xl font-bold",
              latestData.air_value > 300 ? "text-red-500" : "text-green-500"
            )}>
              {latestData.air_value > 300 ? "Detected" : "Normal"}
            </span>
            <span className="text-sm text-gray-500 mb-1">({latestData.air_value})</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AQI Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-900">AQI History</h3>
            <select 
              className="text-sm border-gray-200 rounded-lg"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>
          <Chart 
            data={historyData || []} 
            dataKey="aqi" 
            color="#10b981" 
            name="AQI" 
            unit="" 
          />
        </div>

        {/* PM2.5 Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-900">PM2.5 History</h3>
          </div>
          <Chart 
            data={historyData || []} 
            dataKey="pm25" 
            color="#3b82f6" 
            name="PM2.5" 
            unit="µg/m³" 
          />
        </div>

        {/* Temperature Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-900">Temperature History</h3>
          </div>
          <Chart 
            data={historyData || []} 
            dataKey="temperature" 
            color="#ef4444" 
            name="Temperature" 
            unit="°C" 
          />
        </div>

        {/* Humidity Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-900">Humidity History</h3>
          </div>
          <Chart 
            data={historyData || []} 
            dataKey="humidity" 
            color="#06b6d4" 
            name="Humidity" 
            unit="%" 
          />
        </div>
      </div>
    </div>
  );
};

export default StationDetailPage;
