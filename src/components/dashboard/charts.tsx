"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { ChartDataPoint } from "@/lib/actions/dashboard";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  prefix?: string;
}

function ChartTooltip({ active, payload, label, prefix = "GH₵" }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-foreground mb-0.5">{label}</p>
      <p className="text-primary font-bold">{prefix} {Number(payload[0].value).toFixed(2)}</p>
    </div>
  );
}

interface MonthlyChartProps {
  data: ChartDataPoint[];
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const chartData = MONTHS.map((month) => ({
    month,
    value: data.find((d) => d.month === month)?.value ?? 0,
  }));

  return (
    <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Spending</p>
        <h3 className="text-sm font-semibold text-foreground mt-0.5">This Year</h3>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} barSize={14}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₵${v}`}
            width={36}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
          <Bar
            dataKey="value"
            fill="var(--primary)"
            radius={[4, 4, 0, 0]}
            opacity={0.9}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface WeeklyChartProps {
  data: ChartDataPoint[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const chartData = DAYS.map((day) => ({
    day,
    value: data.find((d) => d.day?.trim().startsWith(day))?.value ?? 0,
  }));

  return (
    <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Weekly Activity</p>
        <h3 className="text-sm font-semibold text-foreground mt-0.5">Past 7 Days</h3>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₵${v}`}
            width={36}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeDasharray: "4 4" }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#weeklyGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
