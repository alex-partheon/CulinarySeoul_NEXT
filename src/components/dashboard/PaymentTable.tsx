"use client";

import React from "react";
import { cn } from "@/lib/utils";
import DataTable, { renderTag } from "./DataTable";

interface PaymentData {
  id: string;
  status: "success" | "failed" | "pending" | "processing";
  email: string;
  amount: number;
  date: Date;
}

interface PaymentTableProps {
  data: PaymentData[];
  onRowClick?: (payment: PaymentData) => void;
  actions?: {
    label: string;
    onClick: (payment: PaymentData) => void;
  }[];
}

export default function PaymentTable({ data, onRowClick, actions }: PaymentTableProps) {
  const columns = [
    {
      key: "status" as keyof PaymentData,
      header: "Status",
      render: (value: PaymentData["status"]) => {
        const statusConfig = {
          success: { label: "Success", color: "green" },
          failed: { label: "Failed", color: "red" },
          pending: { label: "Pending", color: "yellow" },
          processing: { label: "Processing", color: "blue" },
        };

        const config = statusConfig[value];
        return renderTag(config.label, config.color);
      },
    },
    {
      key: "email" as keyof PaymentData,
      header: "Email",
      render: (value: string) => (
        <span className="font-medium text-gray-900">{value}</span>
      ),
    },
    {
      key: "amount" as keyof PaymentData,
      header: "Amount",
      render: (value: number) => (
        <span className="font-semibold text-gray-900">
          ${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "date" as keyof PaymentData,
      header: "Date",
      render: (value: Date) => (
        <span className="text-gray-600">
          {new Date(value).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      onRowClick={onRowClick}
      actions={actions}
      pageSize={10}
    />
  );
}

// 상태별 통계를 계산하는 유틸리티 함수
export function getPaymentStats(payments: PaymentData[]) {
  const stats = {
    total: payments.length,
    success: payments.filter((p) => p.status === "success").length,
    failed: payments.filter((p) => p.status === "failed").length,
    pending: payments.filter((p) => p.status === "pending").length,
    processing: payments.filter((p) => p.status === "processing").length,
    totalAmount: payments
      .filter((p) => p.status === "success")
      .reduce((sum, p) => sum + p.amount, 0),
  };

  return stats;
}

// 상태별 배지 컴포넌트
export function PaymentStatusBadge({ status }: { status: PaymentData["status"] }) {
  const statusConfig = {
    success: { 
      label: "Success", 
      className: "bg-green-100 text-green-700 border-green-200" 
    },
    failed: { 
      label: "Failed", 
      className: "bg-red-100 text-red-700 border-red-200" 
    },
    pending: { 
      label: "Pending", 
      className: "bg-yellow-100 text-yellow-700 border-yellow-200" 
    },
    processing: { 
      label: "Processing", 
      className: "bg-blue-100 text-blue-700 border-blue-200" 
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {config.label}
    </span>
  );
}