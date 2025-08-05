"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  sparklineData?: number[];
  className?: string;
}

export default function StatCard({
  title,
  value,
  change,
  sparklineData,
  className,
}: StatCardProps) {
  const maxValue = sparklineData ? Math.max(...sparklineData) : 0;
  const minValue = sparklineData ? Math.min(...sparklineData) : 0;
  const range = maxValue - minValue;

  const generateSparklinePath = () => {
    if (!sparklineData || sparklineData.length === 0) return "";

    const width = 80;
    const height = 30;
    const points = sparklineData.map((val, index) => {
      const x = (index / (sparklineData.length - 1)) * width;
      const y = height - ((val - minValue) / range) * height;
      return `${x},${y}`;
    });

    return `M${points.join(" L")}`;
  };

  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>

        {sparklineData && (
          <div className="w-20 h-8">
            <svg
              viewBox="0 0 80 30"
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={generateSparklinePath()}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={`${generateSparklinePath()} L80,30 L0,30 Z`}
                fill="url(#sparklineGradient)"
              />
            </svg>
          </div>
        )}
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          {change > 0 ? (
            <TrendingUp className="w-3 h-3 text-green-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-500" />
          )}
          <span
            className={cn(
              "text-xs font-medium",
              change > 0 ? "text-green-600" : "text-red-600"
            )}
          >
            {change > 0 ? "+" : ""}
            {change}%
          </span>
          <span className="text-xs text-gray-500">vs last period</span>
        </div>
      )}
    </div>
  );
}