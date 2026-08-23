import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ScanLine,
  List,
  Brain,
  ClipboardList,
  Shield,
  Activity,
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { to: "/",              label: "Overview",         icon: LayoutDashboard },
  { to: "/analyze",       label: "Risk Analyzer",    icon: ScanLine },
  { to: "/transactions",  label: "Transactions",     icon: List },
  { to: "/review-queue",  label: "Review Queue",     icon: ClipboardList },
  { to: "/model",         label: "Model Intel",      icon: Brain },
];

export default function Sidebar() {
  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 flex flex-col w-[240px]
                 bg-surface-900 border-r border-white/[0.06]"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500">
          <Shield size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white tracking-tight">RISKGRAPH</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Risk Engine</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-1 text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
          Platform
        </p>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === "/"}>
            {({ isActive }) => (
              <span className={clsx(isActive ? "nav-item-active" : "nav-item", "flex")}>
                <Icon size={16} />
                {label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-green-400" />
          <span className="text-[11px] text-slate-500">v1.0.0 · Demo Platform</span>
        </div>
        <p className="text-[10px] text-slate-600 mt-1">
          Not affiliated with Razorpay
        </p>
      </div>
    </aside>
  );
}
