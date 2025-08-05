"use client";

import React from "react";
import {
  MetricCard,
  AreaChart,
  DataTable,
  StatCard,
  CalendarWidget,
  PaymentTable,
  renderTag,
  renderBadge,
} from "@/components/dashboard";

// 샘플 데이터
const chartData = [
  { name: "Jan", value: 4000 },
  { name: "Feb", value: 3000 },
  { name: "Mar", value: 5000 },
  { name: "Apr", value: 2780 },
  { name: "May", value: 1890 },
  { name: "Jun", value: 2390 },
  { name: "Jul", value: 3490 },
];

const tableData = [
  {
    id: "1",
    header: "Introduction",
    sectionType: "Cover page",
    target: 18,
    limit: 25,
    reviewer: "John Doe",
  },
  {
    id: "2",
    header: "Chapter 1",
    sectionType: "Table of contents",
    target: 29,
    limit: 30,
    reviewer: "Jane Smith",
  },
  {
    id: "3",
    header: "Chapter 2",
    sectionType: "Introduction",
    target: 10,
    limit: 15,
    reviewer: "Mike Johnson",
  },
  {
    id: "4",
    header: "Conclusion",
    sectionType: "Summary",
    target: 22,
    limit: 25,
    reviewer: "Sarah Wilson",
  },
  {
    id: "5",
    header: "References",
    sectionType: "Bibliography",
    target: 15,
    limit: 20,
    reviewer: "Tom Brown",
  },
];

const paymentData = [
  {
    id: "1",
    status: "success" as const,
    email: "john.doe@example.com",
    amount: 1250.00,
    date: new Date("2025-06-01"),
  },
  {
    id: "2",
    status: "failed" as const,
    email: "jane.smith@example.com",
    amount: 890.50,
    date: new Date("2025-06-02"),
  },
  {
    id: "3",
    status: "pending" as const,
    email: "mike.johnson@example.com",
    amount: 2100.00,
    date: new Date("2025-06-03"),
  },
  {
    id: "4",
    status: "processing" as const,
    email: "sarah.wilson@example.com",
    amount: 1500.00,
    date: new Date("2025-06-04"),
  },
  {
    id: "5",
    status: "success" as const,
    email: "tom.brown@example.com",
    amount: 3200.00,
    date: new Date("2025-06-05"),
  },
];

const calendarActivityData = {
  "2025-06-01": 0.8,
  "2025-06-02": 0.6,
  "2025-06-03": 0.9,
  "2025-06-04": 0.3,
  "2025-06-05": 0.7,
  "2025-06-06": 1.0,
  "2025-06-07": 0.5,
  "2025-06-08": 0.4,
  "2025-06-09": 0.8,
  "2025-06-10": 0.6,
  "2025-06-11": 0.9,
  "2025-06-12": 0.7,
  "2025-06-13": 0.5,
  "2025-06-14": 0.8,
  "2025-06-15": 0.4,
};

export default function DashboardComponentsPage() {
  const tableColumns = [
    { key: "header" as const, header: "Header" },
    {
      key: "sectionType" as const,
      header: "Section Type",
      render: (value: string) => renderTag(value, "purple"),
    },
    {
      key: "target" as const,
      header: "Target",
      render: (value: number) => renderBadge(value),
    },
    {
      key: "limit" as const,
      header: "Limit",
      render: (value: number) => renderBadge(value),
    },
    { key: "reviewer" as const, header: "Reviewer" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Components</h1>

        {/* Metric Cards */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Metric Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Revenue"
              value={1250.00}
              prefix="$"
              change={12.5}
              changeLabel="Trending up this month"
              subtext="Compared to last month"
              variant="primary"
            />
            <MetricCard
              title="New Customers"
              value={1234}
              change={-20}
              changeLabel="Down this period"
              subtext="Compared to last period"
              variant="success"
            />
            <MetricCard
              title="Active Accounts"
              value={45678}
              change={8.2}
              changeLabel="Steady growth"
              subtext="Active in last 30 days"
              variant="warning"
            />
            <MetricCard
              title="Growth Rate"
              value={4.5}
              suffix="%"
              change={2.1}
              changeLabel="Above target"
              subtext="YoY growth rate"
              variant="danger"
            />
          </div>
        </section>

        {/* Area Chart */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Area Chart</h2>
          <AreaChart
            data={chartData}
            title="Revenue Overview"
            height={350}
            onTimeRangeChange={(range) => console.log("Time range changed:", range)}
          />
        </section>

        {/* Stat Cards */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Stat Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Sales"
              value="$12,345"
              change={5.2}
              sparklineData={[10, 20, 15, 25, 30, 35, 40]}
            />
            <StatCard
              title="Conversion Rate"
              value="3.4%"
              change={-1.2}
              sparklineData={[40, 35, 30, 25, 20, 15, 10]}
            />
            <StatCard
              title="Avg Order Value"
              value="$156"
              change={12.8}
              sparklineData={[20, 22, 25, 23, 28, 30, 35]}
            />
            <StatCard
              title="Active Users"
              value="2,456"
              change={8.9}
              sparklineData={[15, 18, 20, 22, 25, 28, 30]}
            />
          </div>
        </section>

        {/* Data Table */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Table</h2>
          <DataTable
            data={tableData}
            columns={tableColumns}
            actions={[
              { label: "Edit", onClick: (row) => console.log("Edit", row) },
              { label: "Delete", onClick: (row) => console.log("Delete", row) },
              { label: "View", onClick: (row) => console.log("View", row) },
            ]}
          />
        </section>

        {/* Calendar Widget */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Calendar Widget</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CalendarWidget
              selectedDates={[new Date("2025-06-15")]}
              goal={{ label: "Move Goal", value: "350 CALORIES/DAY" }}
              activityData={calendarActivityData}
              onDateSelect={(date) => console.log("Date selected:", date)}
            />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Calendar Info</h3>
              <p className="text-gray-600">
                The calendar widget displays a monthly view with activity data visualization.
                Click on any date to select it. The purple bars show daily activity levels.
              </p>
            </div>
          </div>
        </section>

        {/* Payment Table */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Table</h2>
          <PaymentTable
            data={paymentData}
            onRowClick={(payment) => console.log("Payment clicked:", payment)}
            actions={[
              { label: "View Details", onClick: (payment) => console.log("View", payment) },
              { label: "Refund", onClick: (payment) => console.log("Refund", payment) },
              { label: "Send Receipt", onClick: (payment) => console.log("Send receipt", payment) },
            ]}
          />
        </section>
      </div>
    </div>
  );
}