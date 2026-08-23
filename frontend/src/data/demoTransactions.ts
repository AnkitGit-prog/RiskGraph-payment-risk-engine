/**
 * Demo transactions — clearly labelled synthetic data.
 * NOT real Razorpay transactions.
 */
import type { TransactionRequest } from "../types/risk";

export interface DemoTransaction {
  label: string;
  description: string;
  expectedRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  payload: TransactionRequest;
}

export const DEMO_TRANSACTIONS: DemoTransaction[] = [
  {
    label: "Low Risk — Routine Purchase",
    description: "Regular daytime transaction from a trusted card with consistent history.",
    expectedRisk: "LOW",
    payload: {
      TransactionAmt: 15.00,
      hour: 14,
      day: 2,
      card1: 10012,
      card2: 250.0,
      card3: 117.0,
      card4: "visa",
      card5: "226",
      addr1: 446.0,
      addr2: 97.0,
      ProductCD: "R",
      P_emaildomain: "yahoo.com",
      missing_count: 0,
      card1_txn_count: 54,
      card1_amount_mean: 25.0,
      device_changed: 0,
      transaction_id: "DEMO-LOW-001",
    },
  },
  {
    label: "Medium Risk — Elevated Amount",
    description: "Transaction amount is moderately above card's historical average.",
    expectedRisk: "MEDIUM",
    payload: {
      TransactionAmt: 2898.00,
      hour: 17,
      day: 0,
      card1: 11276,
      card2: 58.0,
      card3: 100.0,
      card4: "discover",
      card5: "224",
      addr1: 129.0,
      addr2: 82.0,
      ProductCD: "W",
      P_emaildomain: "hotmail.com",
      missing_count: 1,
      card1_txn_count: 76,
      card1_amount_mean: 43.3,
      device_changed: 0,
      transaction_id: "DEMO-MED-001",
    },
  },
  {
    label: "High Risk — Behavioural Anomaly",
    description: "Large amount from a rarely-used card with a device change detected.",
    expectedRisk: "HIGH",
    payload: {
      TransactionAmt: 2474.00,
      hour: 10,
      day: 1,
      card1: 16976,
      card2: 217.0,
      card3: 150.0,
      card4: "american express",
      card5: "166",
      addr1: 243.0,
      addr2: 88.0,
      ProductCD: "C",
      P_emaildomain: "anonymous.com",
      missing_count: 0,
      card1_txn_count: 66,
      card1_amount_mean: 474.55,
      device_changed: 0,
      transaction_id: "DEMO-HIGH-001",
    },
  },
  {
    label: "Critical Risk — Suspected Fraud",
    description: "Very high amount, new card, device changed, multiple missing fields, suspicious hour.",
    expectedRisk: "CRITICAL",
    payload: {
      TransactionAmt: 1097.00,
      hour: 16,
      day: 4,
      card1: 1869,
      card2: 574.0,
      card3: 117.0,
      card4: "discover",
      card5: "102",
      addr1: 329.0,
      addr2: 87.0,
      ProductCD: "C",
      P_emaildomain: "gmail.com",
      missing_count: 12,
      card1_txn_count: 20,
      card1_amount_mean: 352.09,
      device_changed: 1,
      transaction_id: "DEMO-CRIT-001",
    },
  },
];
