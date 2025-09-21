'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartData {
  name: string;
  'Net Income': number;
  Expenses: number;
  'Net Balance': number;
}

export function TrendsChart({ data }: { data: ChartData[] }) {
  const formatYAxis = (tickItem: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      compactDisplay: 'short',
    }).format(tickItem);
  };

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={formatYAxis} />
          <Tooltip
            formatter={(value: number) =>
              new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value as number)
            }
          />
          <Legend />
          <Line type="monotone" dataKey="Net Income" stroke="#16a34a" activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="Expenses" stroke="#ef4444" />
          <Line type="monotone" dataKey="Net Balance" stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
