import React from "react";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface Props {
  riskFactors: string[];
  mitigatingFactors: string[];
}

export default function RiskFactorsList({ riskFactors, mitigatingFactors }: Props) {
  return (
    <div className="space-y-4">
      {/* Why risky */}
      {riskFactors.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-red-400" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Risk factors
            </p>
          </div>
          <ul className="space-y-1.5">
            {riskFactors.map((factor, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-200">
                <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-400" />
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mitigating */}
      {mitigatingFactors.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={14} className="text-green-400" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Mitigating factors
            </p>
          </div>
          <ul className="space-y-1.5">
            {mitigatingFactors.map((factor, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-green-400" />
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {riskFactors.length === 0 && mitigatingFactors.length === 0 && (
        <p className="text-sm text-slate-500 italic">No explanation factors available.</p>
      )}
    </div>
  );
}
