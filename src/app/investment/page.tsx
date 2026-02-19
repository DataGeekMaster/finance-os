'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Landmark,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Loader2,
  Trash2,
  RefreshCcw,
  Edit2,
} from 'lucide-react';

import HeroMetrics from '../components/investment/HeroMetrics';
import AllocationCharts from '../components/investment/AllocationCharts';
import AddTransactionModal from '../components/investment/AddTransactionModal';
import EditPositionModal from '../components/investment/EditPositionModal';
import PageHeader from '../components/PageHeader';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Asset {
  id: string;
  ticker: string;
  name: string;
  asset_type: string;
  sector: string;
  current_price: number;
  class: string;
}

interface Trade {
  id: string;
  asset_id: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  fee: number;
  date: string;
}

interface PortfolioPosition {
  asset: Asset;
  quantity: number;
  avgBuyPrice: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPct: number;
  allocation: number;
  totalInvested: number;
}

interface AllocationData {
  name: string;
  value: number;
  percentage: number;
}

export default function InvestmentPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<PortfolioPosition | null>(null);

  // Metrics
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [totalCapitalInvested, setTotalCapitalInvested] = useState(0);
  const [totalProfitLoss, setTotalProfitLoss] = useState(0);
  const [profitLossPercentage, setProfitLossPercentage] = useState(0);
  const [remainingInvestmentFunds, setRemainingInvestmentFunds] = useState(0);

  // Allocation data
  const [byAssetType, setByAssetType] = useState<AllocationData[]>([]);
  const [bySector, setBySector] = useState<AllocationData[]>([]);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    setLoading(false);
  };

  const fetchData = async () => {
    if (!user) return;

    // Fetch assets
    const { data: assetsData, error: assetsError } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', user.id)
      .order('ticker');

    if (assetsError) {
      console.error('Error fetching assets:', assetsError);
      return;
    }

    // Fetch trades
    const { data: tradesData, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (tradesError) {
      console.error('Error fetching trades:', tradesError);
      return;
    }

    setAssets(assetsData || []);
    setTrades(tradesData || []);

    // Calculate portfolio positions
    calculatePortfolio(assetsData || [], tradesData || []);
  };

  const calculatePortfolio = (assetsList: Asset[], tradesList: Trade[]) => {
    const positionsMap: Record<string, PortfolioPosition> = {};
    let totalInvestedWithFees = 0;
    let totalReturned = 0;

    // Process each trade
    tradesList.forEach((trade) => {
      const asset = assetsList.find((a) => a.id === trade.asset_id);
      if (!asset) return;

      if (!positionsMap[asset.id]) {
        positionsMap[asset.id] = {
          asset,
          quantity: 0,
          avgBuyPrice: 0,
          currentValue: 0,
          unrealizedPnL: 0,
          unrealizedPnLPct: 0,
          allocation: 0,
          totalInvested: 0,
        };
      }

      const pos = positionsMap[asset.id];
      const tradeValue = trade.quantity * trade.price;
      const tradeFee = trade.fee || 0;

      if (trade.type === 'BUY') {
        // Calculate new average buy price including fee
        const totalCost =
          pos.quantity * pos.avgBuyPrice + tradeValue + tradeFee;
        const totalQty = pos.quantity + trade.quantity;
        pos.avgBuyPrice = totalQty > 0 ? totalCost / totalQty : 0;
        pos.quantity = totalQty;
        pos.totalInvested += tradeValue + tradeFee;
        totalInvestedWithFees += tradeValue + tradeFee;
      } else {
        // SELL
        const sellValue = tradeValue - tradeFee;
        totalReturned += sellValue;
        pos.quantity -= trade.quantity;
        // Reduce invested proportionally
        const costBasis = trade.quantity * pos.avgBuyPrice + tradeFee;
        pos.totalInvested -= costBasis;
      }
    });

    // Calculate current values and filter out zero quantities
    let totalValue = 0;
    const result = Object.values(positionsMap)
      .filter((p) => p.quantity > 0)
      .map((p) => {
        p.currentValue = p.quantity * p.asset.current_price;
        p.unrealizedPnL = p.currentValue - p.totalInvested;
        p.unrealizedPnLPct =
          p.totalInvested > 0
            ? (p.unrealizedPnL / p.totalInvested) * 100
            : 0;
        totalValue += p.currentValue;
        return p;
      });

    // Calculate allocation percentages
    result.forEach((p) => {
      p.allocation = totalValue > 0 ? (p.currentValue / totalValue) * 100 : 0;
    });

    setPositions(result);
    setTotalPortfolioValue(totalValue);

    // Calculate total capital invested (including fees, minus returns from sells)
    const netInvested = totalInvestedWithFees - totalReturned;
    setTotalCapitalInvested(netInvested);

    // Calculate profit/loss
    const profitLoss = totalValue - netInvested;
    setTotalProfitLoss(profitLoss);
    setProfitLossPercentage(
      netInvested > 0 ? (profitLoss / netInvested) * 100 : 0
    );

    // Calculate remaining investment funds (from wallet or settings)
    calculateRemainingFunds(netInvested);

    // Calculate allocation by asset type and sector
    calculateAllocations(result);
  };

  const calculateRemainingFunds = (netInvested: number) => {
    // You can fetch this from a separate investment wallet or settings
    // For now, we'll set it to 0 or fetch from user settings
    setRemainingInvestmentFunds(0);
  };

  const calculateAllocations = (positionsList: PortfolioPosition[]) => {
    // By Asset Type
    const assetTypeMap: Record<string, number> = {};
    positionsList.forEach((p) => {
      const type = p.asset.asset_type || 'Others';
      assetTypeMap[type] = (assetTypeMap[type] || 0) + p.currentValue;
    });

    const totalValue = positionsList.reduce(
      (acc, p) => acc + p.currentValue,
      0
    );

    const assetTypeData: AllocationData[] = Object.entries(assetTypeMap).map(
      ([name, value]) => ({
        name,
        value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      })
    );

    setByAssetType(assetTypeData);

    // By Sector
    const sectorMap: Record<string, number> = {};
    positionsList.forEach((p) => {
      const sector = p.asset.sector || 'General';
      sectorMap[sector] = (sectorMap[sector] || 0) + p.currentValue;
    });

    const sectorData: AllocationData[] = Object.entries(sectorMap).map(
      ([name, value]) => ({
        name,
        value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      })
    );

    setBySector(sectorData);
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Yakin ingin menghapus aset ini? Semua transaksi trade terkait juga akan terhapus.')) {
      return;
    }

    try {
      // Delete associated trades first
      await supabase.from('trades').delete().eq('asset_id', assetId);
      
      // Delete the asset
      const { error } = await supabase.from('assets').delete().eq('id', assetId);
      
      if (error) throw error;
      
      // Refresh data
      fetchData();
    } catch (error: any) {
      alert('Gagal menghapus: ' + (error.message || 'Unknown error'));
    }
  };

  const handleUpdatePrice = async (assetId: string, currentPrice: number) => {
    const newPrice = prompt('Masukkan harga pasar terbaru:', currentPrice.toString());
    if (!newPrice || newPrice === currentPrice.toString()) return;

    try {
      const { error } = await supabase
        .from('assets')
        .update({ current_price: Number(newPrice), updated_at: new Date().toISOString() })
        .eq('id', assetId);

      if (error) throw error;

      // Refresh data
      fetchData();
    } catch (error: any) {
      alert('Gagal update harga: ' + (error.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#191919] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#191919] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <PageHeader
          title="Portofolio Investasi"
          subtitle="Pantau pertumbuhan aset dan sahammu"
          icon={<Landmark size={24} className="text-blue-500" />}
          actionElement={
            <button
              onClick={() => setIsAddTransactionModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20"
            >
              <Plus size={18} />
              <span className="hidden md:inline">Tambah Transaksi</span>
            </button>
          }
        />

        {/* Hero Metrics */}
        <HeroMetrics
          totalPortfolioValue={totalPortfolioValue}
          totalCapitalInvested={totalCapitalInvested}
          totalProfitLoss={totalProfitLoss}
          profitLossPercentage={profitLossPercentage}
          remainingInvestmentFunds={remainingInvestmentFunds}
        />

        {/* Allocation Charts */}
        <AllocationCharts byAssetType={byAssetType} bySector={bySector} />

        {/* Portfolio Positions Table */}
        <div className="mt-8 bg-[#232323] border border-white/5 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Daftar Aset
            </h3>
            <button
              onClick={fetchData}
              className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-all"
              title="Refresh data"
            >
              <RefreshCcw size={16} />
            </button>
          </div>

          {positions.length > 0 ? (
            <div className="overflow-x-auto custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              <table className="w-full text-left text-sm min-w-[800px]">
                <thead className="sticky top-0 bg-[#232323] z-10 shadow-sm shadow-black/20">
                  <tr className="text-gray-500 border-b border-white/5">
                    <th className="pb-3 pt-2 font-medium">Aset</th>
                    <th className="pb-3 pt-2 font-medium text-right">Tipe</th>
                    <th className="pb-3 pt-2 font-medium text-right">Sektor</th>
                    <th className="pb-3 pt-2 font-medium text-right">Qty</th>
                    <th className="pb-3 pt-2 font-medium text-right">
                      Avg Beli
                    </th>
                    <th className="pb-3 pt-2 font-medium text-right">
                      Harga Sekarang
                    </th>
                    <th className="pb-3 pt-2 font-medium text-right">
                      Nilai Sekarang
                    </th>
                    <th className="pb-3 pt-2 font-medium text-center">PnL</th>
                    <th className="pb-3 pt-2 font-medium text-center w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {positions.map((p) => (
                    <tr
                      key={p.asset.id}
                      className="group hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3">
                        <div className="font-bold text-white">
                          {p.asset.ticker}
                        </div>
                        <div className="text-xs text-gray-500">
                          {p.asset.name}
                        </div>
                      </td>
                      <td className="py-3 text-right text-gray-300">
                        {p.asset.asset_type}
                      </td>
                      <td className="py-3 text-right text-gray-300">
                        {p.asset.sector}
                      </td>
                      <td className="py-3 text-right text-gray-300 font-mono">
                        {p.quantity}
                      </td>
                      <td className="py-3 text-right text-gray-300 font-mono">
                        {formatCurrency(p.avgBuyPrice)}
                      </td>
                      <td
                        className="py-3 text-right font-bold text-white font-mono cursor-pointer hover:text-blue-400 decoration-dotted underline underline-offset-4"
                        onClick={() =>
                          handleUpdatePrice(p.asset.id, p.asset.current_price)
                        }
                        title="Klik untuk update harga pasar manual"
                      >
                        {formatCurrency(p.asset.current_price)}
                      </td>
                      <td className="py-3 text-right text-white font-mono font-bold">
                        {formatCurrency(p.currentValue)}
                      </td>
                      <td className="py-3 text-right pr-6">
                        <div className="flex flex-col items-end gap-0.5">
                          <div
                            className={`font-mono font-bold ${
                              p.unrealizedPnL >= 0
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}
                          >
                            {p.unrealizedPnL >= 0 ? '+' : ''}
                            {formatCurrency(p.unrealizedPnL)}
                          </div>
                          <div
                            className={`text-[10px] ${
                              p.unrealizedPnLPct >= 0
                                ? 'text-green-500'
                                : 'text-red-500'
                            }`}
                          >
                            {p.unrealizedPnLPct.toFixed(2)}%
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingPosition(p);
                              setIsEditModalOpen(true);
                            }}
                            className="text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10 transition-colors p-2 rounded-lg"
                            title="Edit Posisi"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(p.asset.id)}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors p-2 rounded-lg"
                            title="Hapus Aset"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center text-gray-500">
              <Landmark size={48} className="mb-3 opacity-20" />
              <p className="text-sm">Belum ada aset dalam portofolio</p>
              <p className="text-xs mt-1">
                Tambahkan aset dan transaksi trade untuk memulai
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddTransactionModalOpen}
        onClose={() => setIsAddTransactionModalOpen(false)}
        onSuccess={() => fetchData()}
        existingAssets={assets}
        userId={user?.id}
      />

      <EditPositionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPosition(null);
        }}
        onSuccess={() => {
          fetchData();
          setIsEditModalOpen(false);
          setEditingPosition(null);
        }}
        position={editingPosition}
        userId={user?.id}
      />
    </div>
  );
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
