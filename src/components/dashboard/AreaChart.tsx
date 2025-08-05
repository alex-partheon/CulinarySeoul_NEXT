"use client";

import React, { useState } from "react";
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

interface DataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

interface AreaChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
  color?: string;
  gradientId?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showTimeFilter?: boolean;
  dataKey?: string;
  formatValue?: (value: number) => string;
  formatXAxis?: (value: string) => string;
  onTimeRangeChange?: (range: string) => void;
}

const timeRanges = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 3 months", value: "3m" },
];

export default function AreaChart({
  data,
  title,
  height = 300,
  color = "#6366f1",
  gradientId = "colorGradient",
  showGrid = true,
  showTooltip = true,
  showTimeFilter = true,
  dataKey = "value",
  formatValue = (value) => value.toLocaleString(),
  formatXAxis = (value) => value,
  onTimeRangeChange,
}: AreaChartProps) {
  const [selectedRange, setSelectedRange] = useState("30d");

  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
    onTimeRangeChange?.(range);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Value: <span className="font-semibold">{formatValue(payload[0].value)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {(title || showTimeFilter) && (
        <div className="flex items-center justify-between mb-6">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          
          {showTimeFilter && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => handleRangeChange(range.value)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                    selectedRange === range.value
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f3f4f6"
              vertical={false}
            />
          )}

          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickFormatter={formatXAxis}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickFormatter={formatValue}
          />

          {showTooltip && <Tooltip content={<CustomTooltip />} />}

          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            animationDuration={1000}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}