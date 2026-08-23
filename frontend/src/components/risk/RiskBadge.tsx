import React from "react";
import clsx from "clsx";
import type { RiskLevel, RiskAction } from "../../types/risk";

interface RiskLevelBadgeProps { level: RiskLevel; }
interface RiskActionBadgeProps { action: RiskAction; }

export function RiskLevelBadge({ level }: RiskLevelBadgeProps) {
  return (
    <span className={clsx(
      "badge",
      level === "LOW"      && "badge-low",
      level === "MEDIUM"   && "badge-medium",
      level === "HIGH"     && "badge-high",
      level === "CRITICAL" && "badge-critical",
    )}>
      {level}
    </span>
  );
}

export function RiskActionBadge({ action }: RiskActionBadgeProps) {
  return (
    <span className={clsx(
      "badge",
      action === "APPROVE" && "badge-approve",
      action === "REVIEW"  && "badge-review",
      action === "VERIFY"  && "badge-verify",
      action === "BLOCK"   && "badge-block",
    )}>
      {action}
    </span>
  );
}
