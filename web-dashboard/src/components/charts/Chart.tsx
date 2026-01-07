import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface ChartProps {
  data: any[];
  dataKey: string | string[];
  color: string | string[];
  name: string | string[];
  unit: string | string[];
  type?: 'line' | 'area';
}

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg">
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="font-semibold text-gray-900">
          {payload[0].value} {unit}
        </p>
      </div>
    );
  }
  return null;
};

const Chart: React.FC<ChartProps> = ({ data, dataKey, color, name, unit, type = 'area' }) => {
  const ChartComponent = type === 'area' ? AreaChart : LineChart;
  const DataComponent = type === 'area' ? Area : Line;

  const dataKeys = Array.isArray(dataKey) ? dataKey : [dataKey];
  const colors = Array.isArray(color) ? color : [color];
  const names = Array.isArray(name) ? name : [name];
  const units = Array.isArray(unit) ? unit : [unit];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {dataKeys.map((key, index) => (
              <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[index]} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={colors[index]} stopOpacity={0}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="timestamp" 
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            yAxisId={0}
          />
          {dataKeys.length > 1 && (
             <YAxis 
               yAxisId={1} 
               orientation="right"
               tick={{ fontSize: 12, fill: '#9ca3af' }}
               tickLine={false}
               axisLine={false}
             />
          )}
          <Tooltip content={<CustomTooltip unit={units[0]} />} />
          {dataKeys.map((key, index) => (
            <DataComponent
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index]}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#color${key})`}
              name={names[index]}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              yAxisId={index}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;
