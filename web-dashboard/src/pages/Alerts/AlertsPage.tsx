import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAlerts, Alert } from '../../api/alerts';
import { AlertTriangle, AlertCircle, Filter } from 'lucide-react';
import clsx from 'clsx';

const AlertsPage: React.FC = () => {
  const [filterStation, setFilterStation] = useState('');
  
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts', filterStation],
    queryFn: () => getAlerts({ station_id: filterStation || undefined }),
  });

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading alerts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Alerts History</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter by Station ID" 
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={filterStation}
              onChange={(e) => setFilterStation(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-500">Severity</th>
              <th className="px-6 py-4 font-medium text-gray-500">Station</th>
              <th className="px-6 py-4 font-medium text-gray-500">Message</th>
              <th className="px-6 py-4 font-medium text-gray-500">Value</th>
              <th className="px-6 py-4 font-medium text-gray-500">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {alerts?.map((alert: Alert) => (
              <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <span className={clsx(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                    alert.level === 'critical' 
                      ? "bg-red-50 text-red-700" 
                      : "bg-orange-50 text-orange-700"
                  )}>
                    {alert.level === 'critical' ? <AlertCircle size={14} /> : <AlertTriangle size={14} />}
                    {alert.level.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {alert.station_name}
                  <span className="block text-xs text-gray-400 font-normal">{alert.station_id}</span>
                </td>
                <td className="px-6 py-4 text-gray-600">{alert.message}</td>
                <td className="px-6 py-4 font-medium">
                  {alert.value} <span className="text-gray-400 text-sm">{alert.parameter}</span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {new Date(alert.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
            {alerts?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No alerts found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlertsPage;
