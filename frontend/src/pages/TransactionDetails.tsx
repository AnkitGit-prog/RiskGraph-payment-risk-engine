/**
 * Transaction details page — full breakdown of a single transaction assessment.
 */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import RiskScoreGauge from "../components/risk/RiskScoreGauge";
import RiskFactorsList from "../components/risk/RiskFactorsList";
import { RiskLevelBadge, RiskActionBadge } from "../components/risk/RiskBadge";
import riskApi from "../services/api";
import type { TransactionRecord } from "../types/transaction";

export default function TransactionDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [txn, setTxn] = useState<TransactionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    riskApi
      .getTransaction(id)
      .then(setTxn)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center gap-2 text-slate-400 py-12">
        <Loader2 className="animate-spin" size={16} /> Loading…
      </div>
    );

  if (error)
    return (
      <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
        <AlertTriangle size={14} /> {error}
      </div>
    );

  if (!txn) return null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Transaction Details"
        subtitle={txn.transaction_id}
        actions={
          <button onClick={() => navigate(-1)} className="btn-secondary" id="txn-detail-back-btn">
            <ArrowLeft size={14} /> Back
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Risk gauge */}
        <div className="card flex flex-col">
          {txn.is_demo && (
            <div className="demo-banner justify-center mb-3">DEMO TRANSACTION</div>
          )}
          <RiskScoreGauge
            score={txn.risk_score}
            riskLevel={txn.risk_level}
            action={txn.action}
            probability={txn.fraud_probability}
          />
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-4">Transaction Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Transaction ID", <span className="font-mono text-brand-400">{txn.transaction_id}</span>],
                ["Amount", <span className="font-mono font-bold">${txn.amount.toFixed(2)}</span>],
                ["Risk Score", <span className="font-mono font-bold">{txn.risk_score} / 100</span>],
                ["Fraud Probability", <span className="font-mono">{(txn.fraud_probability * 100).toFixed(2)}%</span>],
                ["Risk Level", <RiskLevelBadge level={txn.risk_level} />],
                ["Recommended Action", <RiskActionBadge action={txn.action} />],
                ["Model", <span className="text-slate-300 text-xs">{txn.model_version}</span>],
                ["Timestamp", <span className="text-slate-400 text-xs">{new Date(txn.timestamp).toLocaleString()}</span>],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex flex-col gap-0.5">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-3">Risk Explanation</h3>
            <RiskFactorsList
              riskFactors={txn.risk_factors}
              mitigatingFactors={[]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
