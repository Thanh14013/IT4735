import React from 'react';
import { Link } from 'react-router-dom';
import { Station } from '../../api/stations';
import { Wind, Droplets, Thermometer, Flame } from 'lucide-react';
import clsx from 'clsx';

interface StationCardProps {
  station: Station;
}

const getAQIColor = (aqi: number) => {
  if (aqi <= 50) return 'bg-green-500';
  if (aqi <= 100) return 'bg-yellow-500';
  if (aqi <= 150) return 'bg-orange-500';
  if (aqi <= 200) return 'bg-red-500';
  if (aqi <= 300) return 'bg-purple-500';
  return 'bg-rose-900';
};

const StationCard: React.FC<StationCardProps> = ({ station }) => {
  const { name, status, readings, id } = station;
  const isOnline = status === 'online';

  return (
    <Link 
      to={`/stations/${id}`}
      className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={clsx(
                "w-2 h-2 rounded-full",
                isOnline ? "bg-green-500" : "bg-gray-400"
              )} />
              <span className="text-sm text-gray-500 capitalize">{status}</span>
            </div>
          </div>
          {readings && (
            <div className={clsx(
              "px-3 py-1 rounded-lg text-white font-bold text-sm",
              getAQIColor(readings.aqi)
            )}>
              AQI {readings.aqi}
            </div>
          )}
        </div>

        {readings ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Wind size={18} className="text-blue-500" />
              <div>
                <p className="text-xs text-gray-400">PM2.5</p>
                <p className="font-medium">{readings.pm25} µg/m³</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <Thermometer size={18} className="text-red-500" />
              <div>
                <p className="text-xs text-gray-400">Temp</p>
                <p className="font-medium">{readings.temperature}°C</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Droplets size={18} className="text-cyan-500" />
              <div>
                <p className="text-xs text-gray-400">Humidity</p>
                <p className="font-medium">{readings.humidity}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600 col-span-2 mt-2 pt-2 border-t border-gray-50">
              <Flame size={18} className={readings.air_value > 300 ? "text-red-500" : "text-green-500"} />
              <div className="flex-1 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-400">Gas Status</p>
                  <p className={clsx("font-medium", readings.air_value > 300 ? "text-red-600" : "text-green-600")}>
                    {readings.air_value > 300 ? "Detected!" : "Normal"}
                  </p>
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  Val: {readings.air_value}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-400 text-sm">
            No data available
          </div>
        )}
      </div>
    </Link>
  );
};

export default StationCard;
