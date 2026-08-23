/**
 * Model Intelligence — validation metrics, feature importance, model metadata.
 */
import React, { useEffect, useState } from "react";
import { Brain, Info, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import { FeatureImportanceChart, MetricBar } from "../components/charts/Charts";
import riskApi from "../services/api";
import type { MetricsResponse, ModelInfoResponse } from "../types/transaction";

export default function ModelIntelligence() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [info, setInfo] = useState<ModelInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([riskApi.metrics(), riskApi.modelInfo()])
      .then(([m, i]) => { setMetrics(m); setInfo(i); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const featImportanceData = metrics
    ? Object.entries(metrics.feature_importance)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)
        .map(([feature, importance]) => ({ feature, importance }))
    : [];

  if (loading)
    return (
      <div className="flex items-center gap-2 text-slate-400 py-12">
        <Loader2 className="animate-spin" size={16} /> Loading model intelligence…
      </div>
    );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Model Intelligence"
        subtitle="XGBoost model metadata, validation metrics, and feature importance"
      />

      {/* Evaluation note */}
      <div className="flex items-start gap-3 px-4 py-3 mb-5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-sm text-brand-300">
        <Info size={16} className="flex-shrink-0 mt-0.5 text-brand-400" />
        <div>
          <p className="font-semibold text-brand-300 mb-0.5">Offline Evaluation Metrics</p>
          <p className="text-brand-400/80 text-xs">
            {metrics?.evaluation_note ??
              "These metrics were measured on the held-out validation set during development. They do not represent live production performance."}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle size={14} />
          {error} — Ensure the model is loaded and backend is running.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Model info */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={16} className="text-brand-400" />
              <h3 className="text-sm font-semibold text-white">Model Information</h3>
            </div>
            {info && (
              <div className="space-y-3 text-sm">
                {[
                  ["Type", info.model_type],
                  ["Version", info.model_version],
                  ["Features", String(info.features_count)],
                  ["Status", info.is_loaded ? "Loaded ✓" : "Not Loaded ✗"],
                  ["Loaded At", info.load_timestamp
                    ? new Date(info.load_timestamp).toLocaleString()
                    : "—"],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-slate-400 text-xs">{label}</span>
                    <span className={`text-xs font-medium ${
                      label === "Status" && val.includes("✓") ? "text-green-400" :
                      label === "Status" ? "text-red-400" :
                      "text-white"
                    }`}>{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metrics */}
          {metrics && (
            <div className="card space-y-4">
              <h3 className="text-sm font-semibold text-white">Validation Metrics</h3>
              <MetricBar label="PR-AUC" value={metrics.pr_auc} baseline={metrics.baseline_pr_auc} color="#3252f0" />
              <MetricBar label="ROC-AUC" value={metrics.roc_auc} baseline={metrics.baseline_roc_auc} color="#3252f0" />
              <MetricBar label="Precision" value={metrics.precision} color="#f59e0b" />
              <MetricBar label="Recall" value={metrics.recall} color="#f59e0b" />
              <MetricBar label="F1 Score" value={metrics.f1_score} color="#22c55e" />
            </div>
          )}

          {/* Risk policy */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-3">Risk Policy Thresholds</h3>
            <p className="text-xs text-slate-500 mb-3">
              Product-policy thresholds (not Razorpay production thresholds).
            </p>
            {[
              { range: "0–29",   level: "LOW",      action: "APPROVE", color: "text-green-400" },
              { range: "30–69",  level: "MEDIUM",   action: "REVIEW",  color: "text-amber-400" },
              { range: "70–84",  level: "HIGH",     action: "VERIFY",  color: "text-red-400" },
              { range: "85–100", level: "CRITICAL", action: "BLOCK",   color: "text-violet-400" },
            ].map((row) => (
              <div key={row.level} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0 text-xs">
                <span className="font-mono text-slate-400">{row.range}</span>
                <span className={`font-semibold ${row.color}`}>{row.level}</span>
                <span className="text-slate-400">{row.action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feature importance chart */}
        <div className="lg:col-span-2">
          <div className="card h-full">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-semibold text-white">Feature Importance (Gain)</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Relative importance of each feature as measured by the XGBoost booster's gain metric.
              Higher = feature contributes more to splitting quality in the ensemble.
            </p>
            {featImportanceData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Brain size={32} className="text-slate-700 mb-3" />
                <p className="text-sm text-slate-400">
                  Feature importance unavailable — model may not be loaded.
                </p>
              </div>
            ) : (
              <FeatureImportanceChart data={featImportanceData} />
            )}

            {/* Feature list */}
            {info && (
              <div className="mt-6 pt-4 border-t border-white/[0.06]">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Model Features ({info.features_count} total)
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {info.features.map((feat) => (
                    <span
                      key={feat}
                      className="px-2 py-0.5 rounded text-xs font-mono bg-surface-800 border border-white/[0.07] text-slate-300"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
