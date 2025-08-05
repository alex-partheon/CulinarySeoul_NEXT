"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarWidgetProps {
  onDateSelect?: (date: Date) => void;
  selectedDates?: Date[];
  goal?: {
    label: string;
    value: string;
  };
  activityData?: Record<string, number>; // YYYY-MM-DD -> 활동량
}

export default function CalendarWidget({
  onDateSelect,
  selectedDates = [],
  goal,
  activityData = {},
}: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const isSelectedDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return selectedDates.some(
      (d) =>
        d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear()
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const getActivityLevel = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const activity = activityData[dateKey] || 0;
    
    // 활동량을 0-1 사이의 값으로 정규화
    const maxActivity = Math.max(...Object.values(activityData), 1);
    return activity / maxActivity;
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button
            onClick={handleNextMonth}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Goal Display */}
      {goal && (
        <div className="mb-4 p-3 bg-purple-50 rounded-lg">
          <p className="text-sm font-medium text-purple-900">{goal.label}</p>
          <p className="text-lg font-bold text-purple-700">{goal.value}</p>
        </div>
      )}

      {/* Days of Week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDay }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {/* Days of the month */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const activityLevel = getActivityLevel(day);
          const isSelected = isSelectedDate(day);
          const isTodayDate = isToday(day);

          return (
            <div key={day} className="relative aspect-square">
              <button
                onClick={() => handleDateClick(day)}
                className={cn(
                  "absolute inset-0 flex flex-col items-center justify-center rounded-lg transition-all duration-200",
                  isSelected && "bg-purple-600 text-white",
                  !isSelected && isTodayDate && "bg-purple-100 text-purple-900",
                  !isSelected && !isTodayDate && "hover:bg-gray-100 text-gray-700"
                )}
              >
                <span className="text-sm font-medium">{day}</span>
              </button>

              {/* Activity Bar */}
              {activityLevel > 0 && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-4/5">
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        isSelected ? "bg-white/60" : "bg-purple-400"
                      )}
                      style={{ width: `${activityLevel * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}