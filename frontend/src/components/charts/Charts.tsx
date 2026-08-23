import React from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

// ── Shared styles ─────────────────────────────────────────────────────────────
const CHART_COLORS = {
  LOW:      "#22c55e",
  MEDIUM:   "#f59e0b",
  HIGH:     "#ef4444",
  CRITICAL: "#7c3aed",
  brand:    "#3252f0",
  muted:    "#1e2433",
};

const tooltipStyle = {
  backgroundColor: "#161b29",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "8px",
  color: "#e2e8f0",
  fontSize: "12px",
};

// ── Risk Distribution Bar Chart ────────────────────────────────────────────────

interface DistData { name: string; count: number; color: string; }

export function RiskDistributionChart({ data }: { data: DistData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barSize={28}>
        <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Decision Donut Chart ───────────────────────────────────────────────────────

interface PieData { name: string; value: number; color: string; }

export function DecisionDonutChart({ data }: { data: PieData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend
          formatter={(value) => (
            <span style={{ color: "#94a3b8", fontSize: 11 }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Feature Importance Bar Chart ──────────────────────────────────────────────

interface FeatData { feature: string; importance: number; }

export function FeatureImportanceChart({ data }: { data: FeatData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" barSize={14}>
        <XAxis
          type="number"
          tick={{ fill: "#64748b", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
        />
        <YAxis
          type="category"
          dataKey="feature"
          tick={{ fill: "#94a3b8", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: unknown) => [`${((v as number) * 100).toFixed(2)}%`, "Importance"] as [string, string]}
        />
        <Bar dataKey="importance" fill={CHART_COLORS.brand} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Simple metric comparison bar ───────────────────────────────────────────────
interface MetricBarProps { label: string; value: number; baseline?: number; color?: string; }
export function MetricBar({ label, value, baseline, color = CHART_COLORS.brand }: MetricBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-mono font-semibold text-white">{value.toFixed(4)}</span>
      </div>
      <div className="h-2 rounded-full bg-surface-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value * 100}%`, backgroundColor: color }}
        />
      </div>
      {baseline !== undefined && (
        <p className="text-[10px] text-slate-600">
          Baseline: {baseline.toFixed(4)}
        </p>
      )}
    </div>
  );
}
