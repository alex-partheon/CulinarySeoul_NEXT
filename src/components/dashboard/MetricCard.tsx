"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  subtext?: string;
  variant?: "primary" | "success" | "warning" | "danger";
  prefix?: string;
  suffix?: string;
  animate?: boolean;
}

const variantStyles = {
  primary: {
    bg: "bg-gradient-to-br from-purple-50 to-purple-100/50",
    text: "text-purple-900",
    changePositive: "text-green-600",
    changeNegative: "text-red-600",
    icon: "text-purple-600",
  },
  success: {
    bg: "bg-gradient-to-br from-green-50 to-green-100/50",
    text: "text-green-900",
    changePositive: "text-green-600",
    changeNegative: "text-red-600",
    icon: "text-green-600",
  },
  warning: {
    bg: "bg-gradient-to-br from-yellow-50 to-yellow-100/50",
    text: "text-yellow-900",
    changePositive: "text-green-600",
    changeNegative: "text-red-600",
    icon: "text-yellow-600",
  },
  danger: {
    bg: "bg-gradient-to-br from-red-50 to-red-100/50",
    text: "text-red-900",
    changePositive: "text-green-600",
    changeNegative: "text-red-600",
    icon: "text-red-600",
  },
};

export default function MetricCard({
  title,
  value,
  change,
  changeLabel,
  subtext,
  variant = "primary",
  prefix = "",
  suffix = "",
  animate = true,
}: MetricCardProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const styles = variantStyles[variant];

  useEffect(() => {
    if (!animate || typeof value !== "number") {
      return;
    }

    const duration = 1000;
    const steps = 60;
    const stepValue = value / steps;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setAnimatedValue(Math.round(stepValue * currentStep));
      } else {
        clearInterval(timer);
        setAnimatedValue(value);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, animate]);

  const displayValue = animate && typeof value === "number" ? animatedValue : value;

  const getTrendIcon = () => {
    if (!change || change === 0) return <Minus className="w-4 h-4" />;
    return change > 0 ? (
      <TrendingUp className="w-4 h-4" />
    ) : (
      <TrendingDown className="w-4 h-4" />
    );
  };

  const getChangeColor = () => {
    if (!change) return "text-gray-500";
    return change > 0 ? styles.changePositive : styles.changeNegative;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.02 }}
      className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {change !== undefined && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={cn("flex items-center gap-1", getChangeColor())}
          >
            {getTrendIcon()}
            <span className="text-sm font-medium">
              {change > 0 ? "+" : ""}
              {change}%
            </span>
          </motion.div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-1">
          {prefix && <span className="text-2xl font-semibold text-gray-900">{prefix}</span>}
          <motion.span
            className="text-3xl font-bold text-gray-900"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {displayValue.toLocaleString()}
          </motion.span>
          {suffix && <span className="text-2xl font-semibold text-gray-900">{suffix}</span>}
        </div>

        {changeLabel && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={cn("text-sm font-medium", getChangeColor())}
          >
            {changeLabel}
          </motion.p>
        )}

        {subtext && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-gray-500 mt-1"
          >
            {subtext}
          </motion.p>
        )}
      </div>

      <div className={cn("absolute inset-0 rounded-2xl opacity-10 pointer-events-none", styles.bg)} />
    </motion.div>
  );
}