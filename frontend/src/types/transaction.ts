import type { RiskAction, RiskLevel } from "./risk";

export interface TransactionRecord {
  id: number;
  transaction_id: string;
  amount: number;
  risk_score: number;
  fraud_probability: number;
  risk_level: RiskLevel;
  action: RiskAction;
  risk_factors: string[];
  model_version: string;
  is_demo: boolean;
  timestamp: string;
}

export interface TransactionListResponse {
  total: number;
  page: number;
  page_size: number;
  transactions: TransactionRecord[];
}

export interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
  model_loaded: boolean;
  database_connected: boolean;
  timestamp: string;
}

export interface ModelInfoResponse {
  model_type: string;
  model_version: string;
  features_count: number;
  features: string[];
  is_loaded: boolean;
  load_timestamp: string | null;
}

export interface MetricsResponse {
  model_version: string;
  evaluation_note: string;
  pr_auc: number;
  roc_auc: number;
  precision: number;
  recall: number;
  f1_score: number;
  baseline_pr_auc: number;
  baseline_roc_auc: number;
  feature_importance: Record<string, number>;
}
