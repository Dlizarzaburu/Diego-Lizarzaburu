"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PALETTE = ["#8b5cf6", "#3b82f6", "#ec4899", "#22d3ee", "#f43f5e"];

const axisProps = {
  stroke: "#64748b",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

function money(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-ink-800 px-3 py-2 text-xs shadow-card">
      <p className="mb-1 font-medium text-slate-300">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold text-white">
          {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

export function SalesOverTimeChart({
  data,
}: {
  data: { date: string; revenueCents: number }[];
}) {
  if (data.length === 0) return <EmptyChart label="No sales yet" />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
      >
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#1b1b2b"
          vertical={false}
        />
        <XAxis dataKey="date" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={money} width={48} />
        <Tooltip
          content={<ChartTooltip formatter={money} />}
          cursor={{ stroke: "#8b5cf6", strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="revenueCents"
          stroke="#a78bfa"
          strokeWidth={2}
          fill="url(#rev)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TierBarChart({
  data,
}: {
  data: { name: string; sold: number }[];
}) {
  if (data.length === 0) return <EmptyChart label="No tiers" />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#1b1b2b"
          vertical={false}
        />
        <XAxis dataKey="name" {...axisProps} />
        <YAxis {...axisProps} width={32} allowDecimals={false} />
        <Tooltip
          content={<ChartTooltip formatter={(v: number) => `${v} sold`} />}
          cursor={{ fill: "rgba(139,92,246,0.08)" }}
        />
        <Bar dataKey="sold" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="grid h-[240px] place-items-center rounded-xl border border-dashed border-white/10 text-sm text-slate-500">
      {label}
    </div>
  );
}
