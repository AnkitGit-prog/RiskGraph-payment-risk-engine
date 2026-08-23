import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import RiskAnalyzer from "./pages/RiskAnalyzer";
import Transactions from "./pages/Transactions";
import TransactionDetails from "./pages/TransactionDetails";
import ReviewQueue from "./pages/ReviewQueue";
import ModelIntelligence from "./pages/ModelIntelligence";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar />
        <main
          className="flex-1 ml-[240px] p-6 overflow-y-auto"
          style={{ minHeight: "100vh" }}
        >
          <div className="max-w-6xl mx-auto">
            <Routes>
              <Route path="/"                          element={<Dashboard />} />
              <Route path="/analyze"                   element={<RiskAnalyzer />} />
              <Route path="/transactions"              element={<Transactions />} />
              <Route path="/transactions/:id"          element={<TransactionDetails />} />
              <Route path="/review-queue"              element={<ReviewQueue />} />
              <Route path="/model"                     element={<ModelIntelligence />} />
              <Route path="*"                          element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
