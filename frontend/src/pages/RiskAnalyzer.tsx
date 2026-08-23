/**
 * Risk Analyzer — transaction submission form + real-time results.
 */
import React, { useState } from "react";
import { ScanLine, Loader2, AlertTriangle, FlaskConical } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import RiskScoreGauge from "../components/risk/RiskScoreGauge";
import RiskFactorsList from "../components/risk/RiskFactorsList";
import DemoTransactionLoader from "../components/risk/DemoTransactionLoader";
import riskApi from "../services/api";
import type { PredictionResponse, TransactionRequest } from "../types/risk";
import type { DemoTransaction } from "../data/demoTransactions";

const PRODUCT_CODES = ["W", "H", "C", "S", "R"];
const CARD_NETWORKS = ["visa", "mastercard", "american express", "discover"];
const EMAIL_DOMAINS = [
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
  "icloud.com", "live.com", "aol.com", "protonmail.com",
];

interface FormState {
  TransactionAmt: string;
  hour: string;
  day: string;
  card1: string;
  card2: string;
  card3: string;
  card4: string;
  card5: string;
  addr1: string;
  addr2: string;
  ProductCD: string;
  P_emaildomain: string;
  missing_count: string;
  card1_txn_count: string;
  card1_amount_mean: string;
  device_changed: string;
  transaction_id?: string;
}

const INITIAL_FORM: FormState = {
  TransactionAmt: "",
  hour: "12",
  day: "1",
  card1: "",
  card2: "0",
  card3: "150",
  card4: "visa",
  card5: "226",
  addr1: "0",
  addr2: "0",
  ProductCD: "W",
  P_emaildomain: "gmail.com",
  missing_count: "0",
  card1_txn_count: "0",
  card1_amount_mean: "0",
  device_changed: "0",
  transaction_id: "",
};

export default function RiskAnalyzer() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setIsDemo(false);
  };

  const handleDemoLoad = (demo: DemoTransaction) => {
    const p = demo.payload;
    setForm({
      TransactionAmt: String(p.TransactionAmt),
      hour: String(p.hour),
      day: String(p.day),
      card1: String(p.card1),
      card2: String(p.card2 ?? 0),
      card3: String(p.card3 ?? 0),
      card4: p.card4 ?? "visa",
      card5: p.card5 ?? "226",
      addr1: String(p.addr1 ?? 0),
      addr2: String(p.addr2 ?? 0),
      ProductCD: p.ProductCD ?? "W",
      P_emaildomain: p.P_emaildomain ?? "gmail.com",
      missing_count: String(p.missing_count ?? 0),
      card1_txn_count: String(p.card1_txn_count ?? 0),
      card1_amount_mean: String(p.card1_amount_mean ?? 0),
      device_changed: String(p.device_changed ?? 0),
      transaction_id: p.transaction_id,
    });
    setIsDemo(true);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const payload: TransactionRequest = {
      TransactionAmt: parseFloat(form.TransactionAmt),
      hour: parseInt(form.hour),
      day: parseInt(form.day),
      card1: parseFloat(form.card1),
      card2: parseFloat(form.card2),
      card3: parseFloat(form.card3),
      card4: form.card4 || undefined,
      card5: form.card5 || undefined,
      addr1: parseFloat(form.addr1),
      addr2: parseFloat(form.addr2),
      ProductCD: form.ProductCD || undefined,
      P_emaildomain: form.P_emaildomain || undefined,
      missing_count: parseFloat(form.missing_count),
      card1_txn_count: parseFloat(form.card1_txn_count),
      card1_amount_mean: parseFloat(form.card1_amount_mean),
      device_changed: parseInt(form.device_changed),
      transaction_id: isDemo ? form.transaction_id : undefined,
      is_demo: isDemo,
    };

    try {
      const res = await riskApi.predict(payload);
      setResult(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Risk Analyzer"
        subtitle="Submit a transaction for real-time AI risk assessment"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Form ─────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Demo loader */}
          <div className="card">
            <DemoTransactionLoader onLoad={handleDemoLoad} />
          </div>

          {isDemo && (
            <div className="demo-banner w-full justify-center py-2">
              <FlaskConical size={12} />
              DEMO TRANSACTION — Synthetic data loaded. Not a real payment.
            </div>
          )}

          {/* Input form */}
          <form onSubmit={handleSubmit} className="card space-y-5" id="risk-analyzer-form">
            <h3 className="text-sm font-semibold text-white border-b border-white/[0.06] pb-3">
              Transaction Details
            </h3>

            {/* Core */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="form-group col-span-2 md:col-span-1">
                <label className="form-label" htmlFor="TransactionAmt">Amount (USD) *</label>
                <input
                  id="TransactionAmt" name="TransactionAmt" type="number" step="0.01" min="0.01"
                  className="form-input" placeholder="150.00"
                  value={form.TransactionAmt} onChange={handleChange} required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="hour">Hour (0–23)</label>
                <input id="hour" name="hour" type="number" min="0" max="23"
                  className="form-input" value={form.hour} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="day">Day of Week (0=Mon)</label>
                <input id="day" name="day" type="number" min="0" max="6"
                  className="form-input" value={form.day} onChange={handleChange} required />
              </div>
            </div>

            {/* Card */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="form-group">
                <label className="form-label" htmlFor="card1">Card ID 1 *</label>
                <input id="card1" name="card1" type="number"
                  className="form-input" placeholder="9499"
                  value={form.card1} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="card2">Card ID 2</label>
                <input id="card2" name="card2" type="number"
                  className="form-input" value={form.card2} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="card3">Card ID 3</label>
                <input id="card3" name="card3" type="number"
                  className="form-input" value={form.card3} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="card4">Card Network</label>
                <select id="card4" name="card4" className="form-input" value={form.card4} onChange={handleChange}>
                  {CARD_NETWORKS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="card5">Card Type Code</label>
                <input id="card5" name="card5" type="text"
                  className="form-input" placeholder="226"
                  value={form.card5} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ProductCD">Product Code</label>
                <select id="ProductCD" name="ProductCD" className="form-input" value={form.ProductCD} onChange={handleChange}>
                  {PRODUCT_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Address + Email */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="form-group">
                <label className="form-label" htmlFor="addr1">Address ID 1</label>
                <input id="addr1" name="addr1" type="number"
                  className="form-input" value={form.addr1} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="addr2">Address ID 2</label>
                <input id="addr2" name="addr2" type="number"
                  className="form-input" value={form.addr2} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="P_emaildomain">Email Domain</label>
                <select id="P_emaildomain" name="P_emaildomain" className="form-input" value={form.P_emaildomain} onChange={handleChange}>
                  {EMAIL_DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Behavioral signals */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 border-b border-white/[0.06] pb-2">
                Behavioural Signals
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="form-group">
                  <label className="form-label" htmlFor="card1_txn_count">Card Txn Count</label>
                  <input id="card1_txn_count" name="card1_txn_count" type="number" min="0"
                    className="form-input" value={form.card1_txn_count} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="card1_amount_mean">Card Avg Amount</label>
                  <input id="card1_amount_mean" name="card1_amount_mean" type="number" min="0" step="0.01"
                    className="form-input" value={form.card1_amount_mean} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="missing_count">Missing Fields</label>
                  <input id="missing_count" name="missing_count" type="number" min="0"
                    className="form-input" value={form.missing_count} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="device_changed">Device Changed</label>
                  <select id="device_changed" name="device_changed" className="form-input" value={form.device_changed} onChange={handleChange}>
                    <option value="0">No (0)</option>
                    <option value="1">Yes (1)</option>
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full justify-center py-2.5"
              id="analyze-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Analyzing…</>
              ) : (
                <><ScanLine size={16} /> Analyze Transaction Risk</>
              )}
            </button>
          </form>
        </div>

        {/* ── Results panel ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {result ? (
            <div className="animate-slide-up space-y-4">
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white">Risk Assessment</h3>
                  {result.is_demo && <span className="demo-banner">DEMO</span>}
                </div>
                <RiskScoreGauge
                  score={result.risk_score}
                  riskLevel={result.risk_level}
                  action={result.action}
                  probability={result.fraud_probability}
                />
              </div>

              <div className="card">
                <h3 className="text-sm font-semibold text-white mb-3">Why this score?</h3>
                <RiskFactorsList
                  riskFactors={result.risk_factors}
                  mitigatingFactors={result.mitigating_factors}
                />
              </div>

              <div className="card-sm">
                <p className="text-xs text-slate-500 font-mono">
                  TXN: {result.transaction_id}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Model: {result.model_version}
                </p>
              </div>
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <ScanLine size={32} className="text-slate-700 mb-3" />
              <p className="text-sm text-slate-400">
                Submit a transaction to see its risk assessment
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Try a demo transaction to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
