/**
 * Review Queue — transactions requiring REVIEW or VERIFY action.
 */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, RefreshCw, AlertTriangle } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import { RiskLevelBadge, RiskActionBadge } from "../components/risk/RiskBadge";
import riskApi from "../services/api";
import type { TransactionRecord } from "../types/transaction";

type QueueFilter = "ALL" | "REVIEW" | "VERIFY";

export default function ReviewQueue() {
  const navigate = useNavigate();
  const [items, setItems] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<QueueFilter>("ALL");
  const [sortByRisk, setSortByRisk] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch REVIEW
      const [reviewRes, verifyRes] = await Promise.all([
        riskApi.getTransactions({ action: "REVIEW", page_size: 100 }),
        riskApi.getTransactions({ action: "VERIFY", page_size: 100 }),
      ]);
      setItems([...reviewRes.transactions, ...verifyRes.transactions]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = items
    .filter((t) => filter === "ALL" || t.action === filter)
    .sort((a, b) => sortByRisk ? b.risk_score - a.risk_score : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Review Queue"
        subtitle={`${filtered.length} items requiring attention`}
        actions={
          <button onClick={load} className="btn-secondary" id="queue-refresh-btn">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex rounded-lg overflow-hidden border border-white/[0.08]">
          {(["ALL", "REVIEW", "VERIFY"] as QueueFilter[]).map((f) => (
            <button
              key={f}
              id={`queue-filter-${f.toLowerCase()}`}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-brand-500 text-white"
                  : "bg-surface-800 text-slate-400 hover:text-white"
              }`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          className="btn-secondary py-1.5 text-xs"
          id="queue-sort-btn"
          onClick={() => setSortByRisk((s) => !s)}
        >
          Sort by: {sortByRisk ? "Risk Score ↓" : "Newest ↓"}
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {filtered.length === 0 && !loading ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList size={32} className="text-slate-700 mb-3" />
          <p className="text-sm text-slate-400">No items in the review queue.</p>
          <p className="text-xs text-slate-600 mt-1">
            Transactions requiring REVIEW or VERIFY will appear here.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Amount</th>
                <th>Risk Score</th>
                <th>Risk Level</th>
                <th>Action Required</th>
                <th>Primary Reason</th>
                <th>Demo</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center text-slate-500 py-8">Loading…</td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr
                    key={t.transaction_id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/transactions/${t.transaction_id}`)}
                  >
                    <td className="font-mono text-xs text-brand-400 hover:underline">
                      {t.transaction_id}
                    </td>
                    <td className="font-mono">${t.amount.toFixed(2)}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${(t.risk_score / 100) * 48}px`,
                            backgroundColor:
                              t.risk_score >= 85 ? "#7c3aed" :
                              t.risk_score >= 70 ? "#ef4444" :
                              "#f59e0b",
                          }}
                        />
                        <span className="font-mono font-bold text-white text-xs">{t.risk_score}</span>
                      </div>
                    </td>
                    <td><RiskLevelBadge level={t.risk_level} /></td>
                    <td><RiskActionBadge action={t.action} /></td>
                    <td className="text-slate-300 text-xs max-w-[200px] truncate">
                      {t.risk_factors[0] ?? "—"}
                    </td>
                    <td>{t.is_demo && <span className="demo-banner">DEMO</span>}</td>
                    <td className="text-slate-500 text-xs">
                      {new Date(t.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
