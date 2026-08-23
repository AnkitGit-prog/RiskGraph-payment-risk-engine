/**
 * Overview Dashboard — summary stats and charts.
 */
import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import {
  RiskDistributionChart,
  DecisionDonutChart,
} from "../components/charts/Charts";
import { RiskLevelBadge, RiskActionBadge } from "../components/risk/RiskBadge";
import riskApi from "../services/api";
import type { TransactionRecord } from "../types/transaction";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Stats {
  total: number;
  fraudDetected: number;
  highRisk: number;
  reviewQueue: number;
  approved: number;
  fraudRate: number;
  approvalRate: number;
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await riskApi.getTransactions({ page: 1, page_size: 100 });
      setTransactions(res.transactions);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Derived stats ───────────────────────────────────────────────────────────
  const stats: Stats = React.useMemo(() => {
    const total = transactions.length;
    const fraudDetected = transactions.filter(
      (t) => t.risk_level === "HIGH" || t.risk_level === "CRITICAL"
    ).length;
    const highRisk = transactions.filter((t) => t.risk_score >= 70).length;
    const reviewQueue = transactions.filter(
      (t) => t.action === "REVIEW" || t.action === "VERIFY"
    ).length;
    const approved = transactions.filter((t) => t.action === "APPROVE").length;
    return {
      total,
      fraudDetected,
      highRisk,
      reviewQueue,
      approved,
      fraudRate: total ? (fraudDetected / total) * 100 : 0,
      approvalRate: total ? (approved / total) * 100 : 0,
    };
  }, [transactions]);

  const distData = [
    { name: "LOW",      count: transactions.filter((t) => t.risk_level === "LOW").length,      color: "#22c55e" },
    { name: "MEDIUM",   count: transactions.filter((t) => t.risk_level === "MEDIUM").length,   color: "#f59e0b" },
    { name: "HIGH",     count: transactions.filter((t) => t.risk_level === "HIGH").length,     color: "#ef4444" },
    { name: "CRITICAL", count: transactions.filter((t) => t.risk_level === "CRITICAL").length, color: "#7c3aed" },
  ];

  const decisionData = [
    { name: "Approve", value: transactions.filter((t) => t.action === "APPROVE").length, color: "#22c55e" },
    { name: "Review",  value: transactions.filter((t) => t.action === "REVIEW").length,  color: "#f59e0b" },
    { name: "Verify",  value: transactions.filter((t) => t.action === "VERIFY").length,  color: "#f97316" },
    { name: "Block",   value: transactions.filter((t) => t.action === "BLOCK").length,   color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const recentTxns = transactions.slice(0, 8);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Overview"
        subtitle="Real-time payment risk intelligence"
        actions={
          <button onClick={load} className="btn-secondary" id="dashboard-refresh-btn">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle size={14} />
          {error} — Make sure the backend is running on port 8000.
        </div>
      )}

      {/* ── Stats grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Total Analyzed",
            value: stats.total.toLocaleString(),
            icon: <Activity size={16} className="text-brand-400" />,
            sub: "transactions",
          },
          {
            label: "High/Critical Risk",
            value: stats.fraudDetected.toLocaleString(),
            icon: <AlertTriangle size={16} className="text-red-400" />,
            sub: `${stats.fraudRate.toFixed(1)}% fraud rate`,
          },
          {
            label: "Review Queue",
            value: stats.reviewQueue.toLocaleString(),
            icon: <Clock size={16} className="text-amber-400" />,
            sub: "pending review",
          },
          {
            label: "Approval Rate",
            value: `${stats.approvalRate.toFixed(1)}%`,
            icon: <CheckCircle2 size={16} className="text-green-400" />,
            sub: `${stats.approved} approved`,
          },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">{s.label}</span>
              {s.icon}
            </div>
            <p className="stat-value">{s.value}</p>
            <p className="text-xs text-slate-500">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={14} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">Risk Distribution</h3>
          </div>
          {transactions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-12">
              No transactions yet. Submit one via Risk Analyzer.
            </p>
          ) : (
            <RiskDistributionChart data={distData} />
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">Decision Distribution</h3>
          </div>
          {decisionData.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-12">
              No decisions yet.
            </p>
          ) : (
            <DecisionDonutChart data={decisionData} />
          )}
        </div>
      </div>

      {/* ── Recent transactions ─────────────────────────────────────────────── */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Recent Transactions</h3>
        {recentTxns.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No transactions yet — use the Risk Analyzer to assess your first transaction.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Amount</th>
                  <th>Risk Score</th>
                  <th>Risk Level</th>
                  <th>Action</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentTxns.map((t) => (
                  <tr key={t.transaction_id}>
                    <td>
                      <span className="font-mono text-xs text-slate-300">{t.transaction_id}</span>
                      {t.is_demo && <span className="demo-banner ml-2">DEMO</span>}
                    </td>
                    <td className="font-mono">${t.amount.toFixed(2)}</td>
                    <td>
                      <span className="font-mono font-semibold text-white">{t.risk_score}</span>
                      <span className="text-slate-500">/100</span>
                    </td>
                    <td><RiskLevelBadge level={t.risk_level} /></td>
                    <td><RiskActionBadge action={t.action} /></td>
                    <td className="text-slate-500 text-xs">
                      {new Date(t.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
