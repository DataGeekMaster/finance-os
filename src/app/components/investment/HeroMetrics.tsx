'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface HeroMetricsProps {
  totalPortfolioValue: number;
  totalCapitalInvested: number;
  totalProfitLoss: number;
  profitLossPercentage: number;
  remainingInvestmentFunds?: number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export default function HeroMetrics({
  totalPortfolioValue,
  totalCapitalInvested,
  totalProfitLoss,
  profitLossPercentage,
  remainingInvestmentFunds = 0,
}: HeroMetricsProps) {
  const isProfit = totalProfitLoss >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Total Portfolio Value */}
      <div className="bg-[#232323] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-all">
        <div className="absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Wallet size={40} />
        </div>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
          Total Nilai Portofolio
        </p>
        <div className="text-2xl md:text-3xl font-bold font-mono text-white">
          {formatCurrency(totalPortfolioValue)}
        </div>
        {remainingInvestmentFunds > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            Dana Investasi Tersisa: {formatCurrency(remainingInvestmentFunds)}
          </div>
        )}
      </div>

      {/* Total Profit/Loss (Nominal) */}
      <div
        className={`bg-[#232323] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-all ${
          isProfit ? 'hover:border-green-500/30' : 'hover:border-red-500/30'
        }`}
      >
        <div
          className={`absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity ${
            isProfit ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {isProfit ? <TrendingUp size={40} /> : <TrendingDown size={40} />}
        </div>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
          Total Profit/Loss
        </p>
        <div
          className={`text-2xl md:text-3xl font-bold font-mono ${
            isProfit ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {isProfit ? '+' : ''}
          {formatCurrency(totalProfitLoss)}
        </div>
        <div
          className={`mt-2 text-xs font-bold ${
            isProfit ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {isProfit ? '+' : ''}
          {profitLossPercentage.toFixed(2)}% dari modal
        </div>
      </div>

      {/* Total Capital Invested */}
      <div className="bg-[#232323] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-all">
        <div className="absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Wallet size={40} />
        </div>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
          Total Modal Invested
        </p>
        <div className="text-2xl md:text-3xl font-bold font-mono text-white">
          {formatCurrency(totalCapitalInvested)}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Dana yang telah diinvestasikan
        </div>
      </div>
    </div>
  );
}
