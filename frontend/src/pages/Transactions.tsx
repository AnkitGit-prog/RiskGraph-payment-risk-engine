/**
 * Transactions list page with filtering and pagination.
 */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import { RiskLevelBadge, RiskActionBadge } from "../components/risk/RiskBadge";
import riskApi from "../services/api";
import type { TransactionRecord } from "../types/transaction";

const PAGE_SIZE = 20;

export default function Transactions() {
  const navigate = useNavigate();
  const [data, setData] = useState<{ transactions: TransactionRecord[]; total: number }>({
    transactions: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filterLevel, setFilterLevel] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await riskApi.getTransactions({
        page,
        page_size: PAGE_SIZE,
        risk_level: filterLevel || undefined,
        action: filterAction || undefined,
      });
      setData({ transactions: res.transactions, total: res.total });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, filterLevel, filterAction]);

  const totalPages = Math.ceil(data.total / PAGE_SIZE);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Transactions"
        subtitle={`${data.total} transactions assessed`}
        actions={
          <button onClick={load} className="btn-secondary" id="txns-refresh-btn">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <Filter size={14} className="text-slate-500" />
        <select
          className="form-input w-auto text-xs"
          value={filterLevel}
          onChange={(e) => { setFilterLevel(e.target.value); setPage(1); }}
          id="filter-risk-level"
        >
          <option value="">All Risk Levels</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>
        <select
          className="form-input w-auto text-xs"
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
          id="filter-action"
        >
          <option value="">All Actions</option>
          <option value="APPROVE">APPROVE</option>
          <option value="REVIEW">REVIEW</option>
          <option value="VERIFY">VERIFY</option>
          <option value="BLOCK">BLOCK</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Amount</th>
              <th>Risk Score</th>
              <th>Fraud Prob</th>
              <th>Risk Level</th>
              <th>Action</th>
              <th>Demo</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center text-slate-500 py-8">
                  Loading…
                </td>
              </tr>
            ) : data.transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-slate-500 py-8">
                  No transactions found. Try the Risk Analyzer to generate some.
                </td>
              </tr>
            ) : (
              data.transactions.map((t) => (
                <tr
                  key={t.transaction_id}
                  className="cursor-pointer hover:bg-white/[0.03]"
                  onClick={() => navigate(`/transactions/${t.transaction_id}`)}
                >
                  <td className="font-mono text-xs text-brand-400 hover:underline">
                    {t.transaction_id}
                  </td>
                  <td className="font-mono">${t.amount.toFixed(2)}</td>
                  <td>
                    <span className="font-mono font-bold text-white">{t.risk_score}</span>
                    <span className="text-slate-500">/100</span>
                  </td>
                  <td className="font-mono text-slate-300">
                    {(t.fraud_probability * 100).toFixed(1)}%
                  </td>
                  <td><RiskLevelBadge level={t.risk_level} /></td>
                  <td><RiskActionBadge action={t.action} /></td>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages} · {data.total} total
          </p>
          <div className="flex gap-2">
            <button
              className="btn-secondary py-1.5 px-3 text-xs"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              id="txns-prev-btn"
            >
              <ChevronLeft size={12} />
            </button>
            <button
              className="btn-secondary py-1.5 px-3 text-xs"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              id="txns-next-btn"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
