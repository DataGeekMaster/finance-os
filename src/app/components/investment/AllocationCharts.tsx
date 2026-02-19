'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
} from 'recharts';

interface AllocationData {
  name: string;
  value: number;
  percentage: number;
}

interface AllocationChartsProps {
  byAssetType: AllocationData[];
  bySector: AllocationData[];
}

// Professional color palettes
const ASSET_TYPE_COLORS = [
  '#3b82f6', // blue - Stock
  '#8b5cf6', // purple - Mutual Fund
  '#f97316', // orange - Bond
  '#22c55e', // green - Deposit
  '#eab308', // yellow - Crypto
  '#ec4899', // pink - Others
];

const SECTOR_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#f97316', // orange
  '#22c55e', // green
  '#06b6d4', // cyan
  '#eab308', // yellow
  '#ec4899', // pink
  '#ef4444', // red
  '#14b8a6', // teal
  '#6366f1', // indigo
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#1E1E1E] border border-white/10 rounded-xl p-3 shadow-xl">
        <p className="text-white font-bold text-sm mb-1">{data.name}</p>
        <p className="text-blue-400 font-mono text-sm">
          {formatCurrency(data.value)}
        </p>
        <p className="text-gray-400 text-xs mt-1">{data.percentage.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  name: string;
  value: number;
  percentage: number;
}

const CustomLabel = ({ name, percentage }: CustomLabelProps) => {
  return `${name} (${percentage.toFixed(1)}%)`;
};

export default function AllocationCharts({
  byAssetType,
  bySector,
}: AllocationChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie Chart - Asset Type */}
      <div className="bg-[#232323] border border-white/5 rounded-2xl p-6 shadow-lg">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          Alokasi Berdasarkan Tipe Aset
        </h3>
        <div className="h-[300px]">
          {byAssetType.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byAssetType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }: any) =>
                    `${name} (${percentage.toFixed(1)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#232323"
                  strokeWidth={2}
                >
                  {byAssetType.map((entry, index) => (
                    <Cell
                      key={`cell-asset-${index}`}
                      fill={
                        ASSET_TYPE_COLORS[index % ASSET_TYPE_COLORS.length]
                      }
                    />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-gray-300 text-sm">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              Belum ada data alokasi
            </div>
          )}
        </div>
      </div>

      {/* Pie Chart - Sector */}
      <div className="bg-[#232323] border border-white/5 rounded-2xl p-6 shadow-lg">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Alokasi Berdasarkan Sektor
        </h3>
        <div className="h-[300px]">
          {bySector.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bySector}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }: any) =>
                    `${name} (${percentage.toFixed(1)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#232323"
                  strokeWidth={2}
                >
                  {bySector.map((entry, index) => (
                    <Cell
                      key={`cell-sector-${index}`}
                      fill={SECTOR_COLORS[index % SECTOR_COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-gray-300 text-sm">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              Belum ada data alokasi
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
