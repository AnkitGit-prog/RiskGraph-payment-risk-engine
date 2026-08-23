import React from "react";
import { FlaskConical, ChevronRight } from "lucide-react";
import { DEMO_TRANSACTIONS, type DemoTransaction } from "../../data/demoTransactions";
import clsx from "clsx";

interface Props {
  onLoad: (demo: DemoTransaction) => void;
}

const RISK_COLORS = {
  LOW:      "border-green-500/20 hover:border-green-500/40 hover:bg-green-500/5",
  MEDIUM:   "border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/5",
  HIGH:     "border-red-500/20   hover:border-red-500/40   hover:bg-red-500/5",
  CRITICAL: "border-violet-500/20 hover:border-violet-500/40 hover:bg-violet-500/5",
};

const RISK_DOT = {
  LOW:      "bg-green-400",
  MEDIUM:   "bg-amber-400",
  HIGH:     "bg-red-400",
  CRITICAL: "bg-violet-400",
};

export default function DemoTransactionLoader({ onLoad }: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <FlaskConical size={14} className="text-amber-400" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Demo Transactions
        </span>
        <span className="demo-banner ml-1">Synthetic Data</span>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {DEMO_TRANSACTIONS.map((demo) => (
          <button
            key={demo.payload.transaction_id}
            onClick={() => onLoad(demo)}
            className={clsx(
              "text-left px-3 py-2.5 rounded-lg border bg-transparent",
              "transition-all duration-150 cursor-pointer group",
              RISK_COLORS[demo.expectedRisk],
            )}
            id={`demo-btn-${demo.expectedRisk.toLowerCase()}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={clsx("w-2 h-2 rounded-full flex-shrink-0", RISK_DOT[demo.expectedRisk])} />
                <span className="text-sm font-medium text-slate-200">{demo.label}</span>
              </div>
              <ChevronRight size={14} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5 ml-4">{demo.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
