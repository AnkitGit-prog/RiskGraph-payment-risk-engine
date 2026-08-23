/**
 * RiskScoreGauge — Circular gauge visualising risk score.
 * Accessible: uses text labels AND color AND icon.
 */
import React from "react";
import { RISK_SCORE_COLOR } from "../../types/risk";
import type { RiskLevel, RiskAction } from "../../types/risk";
import clsx from "clsx";
import {
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Ban,
} from "lucide-react";

interface Props {
  score: number;
  riskLevel: RiskLevel;
  action: RiskAction;
  probability: number;
}

const ACTION_ICONS: Record<RiskAction, React.ReactNode> = {
  APPROVE: <CheckCircle2 size={18} className="text-green-400" />,
  REVIEW:  <AlertCircle  size={18} className="text-amber-400" />,
  VERIFY:  <ShieldAlert  size={18} className="text-orange-400" />,
  BLOCK:   <Ban          size={18} className="text-red-400" />,
};

const LEVEL_LABELS: Record<RiskLevel, string> = {
  LOW:      "Low Risk",
  MEDIUM:   "Medium Risk",
  HIGH:     "High Risk",
  CRITICAL: "Critical Risk",
};

const ACTION_LABELS: Record<RiskAction, string> = {
  APPROVE: "Approve Payment",
  REVIEW:  "Flag for Review",
  VERIFY:  "Verify Payment",
  BLOCK:   "Block Transaction",
};

export default function RiskScoreGauge({ score, riskLevel, action, probability }: Props) {
  const color = RISK_SCORE_COLOR(score);

  // SVG arc parameters
  const R = 54;
  const cx = 70;
  const cy = 70;
  const startAngle = -210;
  const endAngle   = 30;
  const range = endAngle - startAngle;
  const progressAngle = startAngle + (score / 100) * range;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcX = (r: number, angle: number) => cx + r * Math.cos(toRad(angle));
  const arcY = (r: number, angle: number) => cy + r * Math.sin(toRad(angle));

  const describeArc = (r: number, aStart: number, aEnd: number) => {
    const largeArc = aEnd - aStart > 180 ? 1 : 0;
    return [
      `M ${arcX(r, aStart)} ${arcY(r, aStart)}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${arcX(r, aEnd)} ${arcY(r, aEnd)}`,
    ].join(" ");
  };

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      {/* SVG Gauge */}
      <svg width="140" height="120" viewBox="0 0 140 120" role="img" aria-label={`Risk score: ${score} out of 100`}>
        {/* Track */}
        <path
          d={describeArc(R, startAngle, endAngle)}
          fill="none"
          stroke="#1e2433"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Progress */}
        <path
          d={describeArc(R, startAngle, progressAngle)}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          style={{ transition: "d 0.6s ease-out, stroke 0.4s ease-out" }}
        />
        {/* Score text */}
        <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize="28" fontWeight="700" fontFamily="Inter">
          {score}
        </text>
        <text x={cx} y={cy + 20} textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="Inter">
          / 100
        </text>
      </svg>

      {/* Risk level badge */}
      <div
        className={clsx(
          "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold",
          riskLevel === "LOW"      && "bg-green-500/10  border-green-500/20  text-green-400",
          riskLevel === "MEDIUM"   && "bg-amber-500/10  border-amber-500/20  text-amber-400",
          riskLevel === "HIGH"     && "bg-red-500/10    border-red-500/20    text-red-400",
          riskLevel === "CRITICAL" && "bg-violet-500/10 border-violet-500/20 text-violet-400",
        )}
        role="status"
        aria-label={LEVEL_LABELS[riskLevel]}
      >
        {LEVEL_LABELS[riskLevel]}
      </div>

      {/* Fraud probability */}
      <p className="text-xs text-slate-400">
        Fraud probability: <span className="font-mono font-semibold text-white">{(probability * 100).toFixed(1)}%</span>
      </p>

      {/* Recommended action */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-800 border border-white/[0.08] w-full justify-center">
        {ACTION_ICONS[action]}
        <span className="text-sm font-semibold text-white">{ACTION_LABELS[action]}</span>
      </div>
    </div>
  );
}
