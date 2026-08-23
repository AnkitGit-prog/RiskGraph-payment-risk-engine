// ── Enumerations ──────────────────────────────────────────────────────────────

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskAction = "APPROVE" | "REVIEW" | "VERIFY" | "BLOCK";

// ── Request ───────────────────────────────────────────────────────────────────

export interface TransactionRequest {
  TransactionAmt: number;
  hour: number;
  day: number;
  card1: number;
  card2?: number;
  card3?: number;
  card4?: string;
  card5?: string;
  addr1?: number;
  addr2?: number;
  ProductCD?: string;
  P_emaildomain?: string;
  missing_count?: number;
  card1_txn_count?: number;
  card1_amount_mean?: number;
  device_changed?: number;
  transaction_id?: string;
  is_demo?: boolean;
}

// ── Response ──────────────────────────────────────────────────────────────────

export interface PredictionResponse {
  transaction_id: string;
  fraud_probability: number;
  risk_score: number;
  risk_level: RiskLevel;
  action: RiskAction;
  risk_factors: string[];
  mitigating_factors: string[];
  model_version: string;
  is_demo: boolean;
  timestamp: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export const RISK_COLORS: Record<RiskLevel, string> = {
  LOW:      "text-green-400",
  MEDIUM:   "text-amber-400",
  HIGH:     "text-red-400",
  CRITICAL: "text-violet-400",
};

export const RISK_BG: Record<RiskLevel, string> = {
  LOW:      "bg-green-500/10 border-green-500/20",
  MEDIUM:   "bg-amber-500/10 border-amber-500/20",
  HIGH:     "bg-red-500/10 border-red-500/20",
  CRITICAL: "bg-violet-500/10 border-violet-500/20",
};

export const ACTION_COLORS: Record<RiskAction, string> = {
  APPROVE: "text-green-400",
  REVIEW:  "text-amber-400",
  VERIFY:  "text-orange-400",
  BLOCK:   "text-red-400",
};

export const RISK_SCORE_COLOR = (score: number): string => {
  if (score < 30) return "#22c55e";
  if (score < 70) return "#f59e0b";
  if (score < 85) return "#ef4444";
  return "#7c3aed";
};
