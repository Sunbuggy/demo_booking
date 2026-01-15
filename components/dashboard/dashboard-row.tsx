"use client";

import React from "react";
import { cn } from "@/lib/utils"; // Assuming you have standard shadcn utility
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface Metric {
  label: string;
  value: string | number;
}

interface DashboardRowProps {
  /** The main large text on the left (e.g., "Nellis Dunes XX") */
  title: React.ReactNode;
  
  /** Optional smaller text below title */
  subtitle?: React.ReactNode;
  
  /** Array of data points to show in badges (e.g., "4 People", "2 Vehicles") */
  metrics?: Metric[];
  
  /** * Contextual coloring:
   * - default: Standard White/Grey row
   * - active: Blue tint (Good for running tours)
   * - alert: Red tint (Good for maintenance/issues)
   */
  status?: "default" | "active" | "alert";
  
  /** The buttons to render on the right side */
  actions?: React.ReactNode;
  
  /** Optional click handler for the whole row */
  onClick?: () => void;
  
  className?: string;
}

export default function DashboardRow({
  title,
  subtitle,
  metrics = [],
  status = "default",
  actions,
  onClick,
  className,
}: DashboardRowProps) {
  
  // 1. Dynamic Status Styles
  const statusStyles = {
    default: "border-zinc-200 dark:border-zinc-800",
    active: "border-blue-500/50 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-500",
    alert: "border-red-500/50 bg-red-50/50 dark:bg-red-900/20 dark:border-red-500",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        // Base Class from globals.css
        "dashboard-row", 
        // Layout specifics
        "flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer relative overflow-hidden",
        // Status Application
        statusStyles[status],
        className
      )}
    >
      {/* STATUS STRIP (Left Edge Visual Indicator) */}
      {status !== "default" && (
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-1",
          status === "active" ? "bg-blue-500" : "bg-red-500"
        )} />
      )}

      {/* LEFT: Main Content */}
      <div className="flex flex-col min-w-0 gap-1 pl-2">
        <div className="flex items-center gap-2">
          {/* Optional Icons based on status */}
          {status === "alert" && <AlertCircle className="w-4 h-4 text-red-600" />}
          {status === "active" && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
          
          <h3 className="text-lg font-bold truncate text-zinc-900 dark:text-zinc-100">
            {title}
          </h3>
        </div>
        
        {subtitle && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium truncate">
            {subtitle}
          </p>
        )}
      </div>

      {/* MIDDLE: Metrics Badges (Hidden on tiny screens if crowded, or wrapped) */}
      {metrics.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {metrics.map((m, i) => (
            <span key={i} className="metric-badge">
              <span className="opacity-70 mr-1 font-normal">{m.label}:</span>
              {m.value}
            </span>
          ))}
        </div>
      )}

      {/* RIGHT: Actions */}
      {actions && (
        <div className="flex items-center gap-2 mt-2 sm:mt-0 justify-end w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100 dark:border-zinc-800">
          {actions}
        </div>
      )}
    </div>
  );
}