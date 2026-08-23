/**
 * Centralized API client for RiskGraph backend.
 * All requests go through this module — easy to swap base URL.
 */
import axios from "axios";
import type {
  HealthResponse,
  MetricsResponse,
  ModelInfoResponse,
  TransactionListResponse,
  TransactionRecord,
} from "../types/transaction";
import type { PredictionResponse, TransactionRequest } from "../types/risk";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

// ── Response interceptor — normalize errors ────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err?.response?.data?.detail;
    const message =
      (typeof detail === "object" ? detail?.message : detail) ??
      err?.message ??
      "An unknown error occurred";
    return Promise.reject(new Error(message));
  }
);

// ── Endpoints ─────────────────────────────────────────────────────────────────

export const riskApi = {
  health: (): Promise<HealthResponse> =>
    api.get("/health").then((r) => r.data),

  predict: (payload: TransactionRequest): Promise<PredictionResponse> =>
    api.post("/api/v1/risk/predict", payload).then((r) => r.data),

  getTransactions: (params?: {
    page?: number;
    page_size?: number;
    risk_level?: string;
    action?: string;
  }): Promise<TransactionListResponse> =>
    api.get("/api/v1/transactions/", { params }).then((r) => r.data),

  getTransaction: (id: string): Promise<TransactionRecord> =>
    api.get(`/api/v1/transactions/${id}`).then((r) => r.data),

  modelInfo: (): Promise<ModelInfoResponse> =>
    api.get("/api/v1/model/info").then((r) => r.data),

  metrics: (): Promise<MetricsResponse> =>
    api.get("/api/v1/metrics").then((r) => r.data),
};

export default riskApi;
