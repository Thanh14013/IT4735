import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStations } from '../../api/stations';
import StationCard from './StationCard';
import { RefreshCw } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { data: stations, isLoading, isError, refetch } = useQuery({
    queryKey: ['stations'],
    queryFn: getStations,
    refetchInterval: 10000, // Auto refresh every 10s
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Failed to load stations data</p>
        <button 
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-700">Monitoring Stations</h2>
        <button 
          onClick={() => refetch()}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          title="Refresh data"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stations?.map((station) => (
          <StationCard key={station.id} station={station} />
        ))}
      </div>

      {stations?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No stations found.
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
