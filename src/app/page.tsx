'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend
} from 'recharts';
import {
  Plus, TrendingUp, TrendingDown, Wallet, CreditCard,
  Banknote, Target, ShieldAlert, LayoutDashboard,
  Settings, Trash2, Edit2, X, Database, ShieldCheck,
  RotateCcw, CalendarDays, ArrowUpDown, Download,
  Zap, List, Sparkles, Bot, RefreshCw,
  PiggyBank, Users, LineChart as LineChartIcon
} from 'lucide-react';
import Link from 'next/link';

import { createClient } from '@supabase/supabase-js';
import UserProfileModal from './components/UserProfileModal';
import PageHeader from './components/PageHeader';

// UBAH INI KE 'false' JIKA INGIN MENGGUNAKAN DATA SUPABASE ASLI
const USE_MOCK_DATA = false;

// Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// 1. TYPE DEFINITIONS & SCHEMAS (Sync with SQL)
// ==========================================

type FinancialTag = 'needs' | 'wants' | 'savings' | 'liabilities';
type TransactionType = 'income' | 'expense';
type AssetClass = 'stock' | 'crypto' | 'gold' | 'cash' | 'bond';
type TabId = 'dashboard' | 'cashflow' | 'goals_debts' | 'analytics';

interface Wallet {
  id: string;
  user_id?: string;
  name: string;
  balance: number;
  icon: string;
  color: string;
  is_active: boolean;
}

interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  type: TransactionType;
  category: string;
  financial_tag: FinancialTag;
  wallet_id?: string;
  split_from_id?: string;
  is_split?: boolean;
  split_total_amount?: number;
  split_participants?: number;
  reference_id?: string;
  reference_type?: string;
}

interface Debt {
  id: string;
  name: string;
  total_amount: number;
  paid_amount: number;
  type: 'payable' | 'receivable';
  due_date: string;
  notes?: string;
}

interface Subscription {
  id: string;
  name: string;
  cost: number;
  billing_cycle: 'monthly' | 'yearly';
  next_payment_date: string;
  category: string;
  is_active: boolean;
}

interface Asset {
  id: string;
  ticker: string;
  name: string;
  class: AssetClass;
  current_price: number;
}

interface Trade {
  id: string;
  asset_id: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  date: string;
  fee: number;
}

interface PortfolioPosition {
  asset: Asset;
  quantity: number;
  avgBuyPrice: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPct: number;
  allocation: number;
}

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  emoji: string; // Kita gunakan Emoji agar user bebas berekspresi
  due_date?: string;
}

interface UserSettings {
  user_id: string;
  needs_pct: number;
  wants_pct: number;
  savings_pct: number;
  liabilities_pct: number;
}

// User Profile untuk Personalisasi AI Advisor
interface UserProfile {
  user_id?: string;
  occupation?: 'student' | 'employee' | 'entrepreneur' | 'freelancer' | 'other';
  occupation_label?: string; // Custom label (misal: "Mahasiswa Semester 5")
  monthly_income?: number;
  has_debt?: boolean;
  financial_goals?: string; // String biasa agar user bisa ketik spasi
  risk_profile?: 'not_started' | 'conservative' | 'moderate' | 'aggressive';
  notes?: string; // Catatan tambahan untuk AI
}

interface WaterfallItem {
  name: string;
  value: number;
  color: string;
  percentage?: string;
}

interface WaterfallComparisonItem {
  name: string;
  actual: number;
  ideal: number;
}

// ==========================================
// 2. CONSTANTS & THEME
// ==========================================

const INCOME_CATEGORIES = [
  'Uang jajan dari ortu',
  'Gaji',
  'Bonus / Tunjangan',
  'Profit Bisnis',
  'Dividen / Investasi',
  'Pemberian / Hadiah',
  'Penjualan Aset',
  'Lainnya'
];

const EXPENSE_CATEGORIES = [
  'Makanan & Minuman',
  'Transportasi',
  'Rumah & Sewa',
  'Listrik, Air & Data',
  'Belanja & Kebutuhan',
  'Kesehatan',
  'Pendidikan',
  'Hiburan',
  'Cicilan Utang',
  'Investasi (Keluar)',
  'Amal / Donasi',
  'Lainnya'
];

const COLORS = {
  needs: '#3b82f6',
  wants: '#8b5cf6',
  savings: '#22c55e',
  liabilities: '#f97316',
  Background: '#191919',
  CardBg: '#232323',
  TextPrimary: '#ffffff',
  TextSecondary: '#9ca3af',
};

// ==========================================
// 3. MOCK DATA (Untuk Pratinjau Visual)
// ==========================================

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', title: 'Gaji Bulanan', amount: 15000000, date: '2023-11-01', type: 'income', category: 'Gaji', financial_tag: 'savings' },
  { id: '2', title: 'Sewa Apartemen', amount: 4000000, date: '2023-03-02', type: 'expense', category: 'Rumah', financial_tag: 'needs' },
  { id: '3', title: 'Belanja Mingguan', amount: 1200000, date: new Date().toISOString().split('T')[0], type: 'expense', category: 'Makanan', financial_tag: 'needs' },
  { id: '4', title: 'Cicilan Motor', amount: 1500000, date: '2023-08-10', type: 'expense', category: 'Transportasi', financial_tag: 'liabilities' },
  { id: '5', title: 'Makan Malam Mewah', amount: 800000, date: new Date().toISOString().split('T')[0], type: 'expense', category: 'Hiburan', financial_tag: 'wants' },
];

const MOCK_SUBSCRIPTIONS: Subscription[] = [
  { id: 's1', name: 'Netflix Premium', cost: 186000, billing_cycle: 'monthly', next_payment_date: '2023-11-20', category: 'Hiburan', is_active: true },
  { id: 's2', name: 'Spotify Family', cost: 86000, billing_cycle: 'monthly', next_payment_date: '2023-11-25', category: 'Hiburan', is_active: true },
  { id: 's3', name: 'Server Hosting', cost: 1200000, billing_cycle: 'yearly', next_payment_date: '2024-01-15', category: 'Software', is_active: true },
];

const MOCK_GOALS: Goal[] = [
  { id: 'g1', name: 'MacBook Pro M3', target_amount: 25000000, current_amount: 5000000, emoji: '💻', due_date: '2023-12-31' },
  { id: 'g2', name: 'Liburan ke Jepang', target_amount: 30000000, current_amount: 12500000, emoji: '🌸', due_date: '2024-05-01' },
  { id: 'g3', name: 'Dana Darurat', target_amount: 100000000, current_amount: 45000000, emoji: '🛡️' },
];

const MOCK_DEBTS: Debt[] = [
  { id: 'd1', name: 'Pinjaman Bank', total_amount: 50000000, paid_amount: 15000000, type: 'payable', due_date: '2025-12-01' },
  { id: 'd2', name: 'Piutang Teman', total_amount: 2000000, paid_amount: 500000, type: 'receivable', due_date: '2023-12-20' },
];

const MOCK_ASSETS: Asset[] = [
  { id: 'a1', ticker: 'BBCA', name: 'Bank Central Asia', class: 'stock', current_price: 9200 },
  { id: 'a2', ticker: 'BTC', name: 'Bitcoin', class: 'crypto', current_price: 650000000 },
];

const MOCK_TRADES: Trade[] = [
  { id: 't1', asset_id: 'a1', type: 'BUY', quantity: 1000, price: 8500, date: '2023-01-10', fee: 0 },
  { id: 't2', asset_id: 'a2', type: 'BUY', quantity: 0.02, price: 450000000, date: '2023-03-15', fee: 0 },
];

const MOCK_WALLETS: Wallet[] = [
  { id: 'w1', name: 'Tunai', balance: 2500000, icon: '💵', color: '#22c55e', is_active: true },
  { id: 'w2', name: 'BCA', balance: 15000000, icon: '🏦', color: '#3b82f6', is_active: true },
  { id: 'w3', name: 'GoPay', balance: 750000, icon: '📱', color: '#0ea5e9', is_active: true },
  { id: 'w4', name: 'Tabungan', balance: 50000000, icon: '🐷', color: '#8b5cf6', is_active: true },
];

// ==========================================
// 4. HELPER FUNCTIONS
// ==========================================

const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
const formatCompact = (num: number) => new Intl.NumberFormat('id-ID', { notation: "compact", compactDisplay: "short" }).format(num);

// Format harga saham dengan bilangan asli (contoh: 2.390, 218, 11.280)
const formatStockPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

const calculatePortfolio = (assets: Asset[], trades: Trade[]): PortfolioPosition[] => {
  const positions: Record<string, PortfolioPosition> = {};
  trades.forEach(trade => {
    const asset = assets.find(a => a.id === trade.asset_id);
    if (!asset) return;
    if (!positions[asset.id]) {
      positions[asset.id] = { asset, quantity: 0, avgBuyPrice: 0, currentValue: 0, unrealizedPnL: 0, unrealizedPnLPct: 0, allocation: 0 };
    }
    const pos = positions[asset.id];
    if (trade.type === 'BUY') {
      const totalCost = (pos.quantity * pos.avgBuyPrice) + (trade.quantity * trade.price);
      const totalQty = pos.quantity + trade.quantity;
      pos.avgBuyPrice = totalQty > 0 ? totalCost / totalQty : 0;
      pos.quantity = totalQty;
    } else {
      pos.quantity -= trade.quantity;
    }
  });
  let totalPortfolioValue = 0;
  const result = Object.values(positions).filter(p => p.quantity > 0).map(p => {
    p.currentValue = p.quantity * p.asset.current_price;
    p.unrealizedPnL = p.currentValue - (p.quantity * p.avgBuyPrice);
    p.unrealizedPnLPct = p.avgBuyPrice > 0 ? (p.unrealizedPnL / (p.quantity * p.avgBuyPrice)) * 100 : 0;
    totalPortfolioValue += p.currentValue;
    return p;
  });
  result.forEach(p => p.allocation = totalPortfolioValue > 0 ? (p.currentValue / totalPortfolioValue) * 100 : 0);
  return result;
};

// ==========================================
// 5. COMPONENTS
// ==========================================

const StatCard = ({ title, value, type, icon: Icon, subtext }: any) => (
  <div className="bg-[#232323] border border-white/5 rounded-2xl p-4 relative overflow-hidden group hover:border-white/10 transition-all">
    <div className="absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity"><Icon size={40} /></div>
    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
    <div className={`text-2xl font-bold font-mono ${type === 'pos' ? 'text-green-400' : type === 'neg' ? 'text-red-400' : 'text-white'}`}>{value}</div>
    {subtext && <div className="mt-2 text-xs text-gray-500">{subtext}</div>}
  </div>
);

const SectionHeader = ({ title, icon: Icon, action }: any) => (
  <div className="flex justify-between items-center mb-4">
    <div className="flex items-center gap-2">
      {Icon && <Icon size={18} className="text-blue-500" />}
      <h3 className="text-white font-medium text-lg tracking-tight">{title}</h3>
    </div>
    {action}
  </div>
);

// ==========================================
// 5.4. NEW COMPONENT: SUBSCRIPTION MODULE
// ==========================================

const SubscriptionModule = ({
  subscriptions,
  onAddClick,
  onDelete // <--- Props Baru
}: {
  subscriptions: Subscription[],
  onAddClick: () => void,
  onDelete: (id: string) => void // <--- Type def
}) => {
  const totalMonthlyFixedCost = subscriptions
    .filter(s => s.is_active)
    .reduce((acc, curr) => {
      const monthlyCost = curr.billing_cycle === 'yearly' ? curr.cost / 12 : curr.cost;
      return acc + monthlyCost;
    }, 0);

  return (
    <div className="bg-[#232323] border border-white/5 rounded-2xl p-6 shadow-lg h-full flex flex-col relative group">
      <button
        onClick={onAddClick}
        className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all z-10"
        title="Tambah Langganan"
      >
        <Plus size={16} />
      </button>

      <div className="mb-4 pr-10">
        <div className="flex items-center gap-2 mb-1">
          <RotateCcw size={18} className="text-yellow-500" />
          <h3 className="text-white font-medium text-lg tracking-tight">Langganan</h3>
        </div>
        <div className="text-[10px] text-gray-500 uppercase font-bold">
          Beban Tetap: <span className="text-white font-mono text-sm ml-1">{formatCurrency(totalMonthlyFixedCost)}/bln</span>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar max-h-[300px]">
        {subscriptions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-6 min-h-[150px]">
            <div className="bg-blue-500/10 p-3 rounded-full mb-2">
              <CalendarDays size={24} className="text-blue-500" />
            </div>
            <p className="text-gray-500 text-xs">Belum ada langganan aktif.</p>
          </div>
        ) : (
          subscriptions.map((sub) => (
            <div key={sub.id} className="p-3 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-all group/item flex items-center justify-between">

              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${sub.is_active ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-800 text-gray-500'}`}>
                  <Zap size={18} fill={sub.is_active ? "currentColor" : "none"} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white flex items-center gap-2">
                    {sub.name}
                    {sub.billing_cycle === 'yearly' && (
                      <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">TAHUNAN</span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                    <CalendarDays size={10} />
                    Next: {new Date(sub.next_payment_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-white">{formatCompact(sub.cost)}</div>
                  <div className="text-[10px] text-gray-500 uppercase">/{sub.billing_cycle === 'monthly' ? 'bln' : 'thn'}</div>
                </div>

                {/* TOMBOL DELETE */}
                <button
                  onClick={() => onDelete(sub.id)}
                  className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                  title="Hapus"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ==========================================
// 5.5. UPDATED COMPONENT: TRANSACTION MODAL (ADD & EDIT)
// ==========================================

const TransactionModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
  userId,
  wallets = []
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (t: Transaction, action: 'create' | 'update') => void;
  initialData?: Transaction | null;
  userId?: string;
  wallets?: Wallet[];
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Default state dengan kategori awal yang valid
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as TransactionType,
    category: EXPENSE_CATEGORIES[0], // Default category
    financial_tag: 'needs' as FinancialTag | '',
    wallet_id: wallets[0]?.id || ''
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title,
          amount: String(initialData.amount),
          date: initialData.date,
          type: initialData.type,
          category: initialData.category,
          financial_tag: initialData.financial_tag || '',
          wallet_id: initialData.wallet_id || wallets[0]?.id || ''
        });
      } else {
        // Reset form saat modal dibuka untuk tambah data baru
        setFormData({
          title: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          type: 'expense',
          category: EXPENSE_CATEGORIES[0],
          financial_tag: 'needs',
          wallet_id: wallets[0]?.id || ''
        });
      }
    }
  }, [isOpen, initialData, wallets]);

  if (!isOpen) return null;
  const isEditMode = !!initialData;

  // Handler saat tombol Pemasukan/Pengeluaran diklik
  const handleTypeChange = (newType: TransactionType) => {
    setFormData(prev => ({
      ...prev,
      type: newType,
      financial_tag: newType === 'income' ? '' : 'needs',
      // Reset kategori agar sesuai dengan tipe baru
      category: newType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.title || !formData.amount) throw new Error("Mohon lengkapi data");
      if (!formData.wallet_id) throw new Error("Pilih dompet/sumber dana terlebih dahulu");

      if (!USE_MOCK_DATA && !userId) {
        throw new Error("Anda harus login untuk menyimpan data.");
      }

      const payload = {
        title: formData.title,
        amount: Number(formData.amount),
        date: formData.date,
        type: formData.type,
        category: formData.category,
        financial_tag: formData.type === 'income' ? null : formData.financial_tag,
        user_id: userId,
        wallet_id: formData.wallet_id
      };

      if (USE_MOCK_DATA) {
        setTimeout(() => {
          const mockResponse = { ...payload, id: isEditMode ? initialData.id : Math.random().toString() };
          onSuccess(mockResponse as Transaction, isEditMode ? 'update' : 'create');
          onClose();
          setIsLoading(false);
        }, 500);
      } else {
        let data, error;

        if (isEditMode) {
          const res = await supabase
            .from('transactions')
            .update(payload)
            .eq('id', initialData.id)
            .select()
            .single();
          data = res.data;
          error = res.error;
        } else {
          const res = await supabase
            .from('transactions')
            .insert([payload])
            .select()
            .single();
          data = res.data;
          error = res.error;
        }

        if (error) throw error;
        onSuccess(data as Transaction, isEditMode ? 'update' : 'create');
        onClose();
        setIsLoading(false);
      }

    } catch (error: any) {
      alert('Gagal menyimpan: ' + (error.message || 'Unknown error'));
      setIsLoading(false);
    }
  };

  const inputClass = "w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all text-sm";
  const labelClass = "block text-[11px] text-gray-400 mb-1.5 uppercase font-bold tracking-wider";

  // Tentukan list kategori berdasarkan tipe yang dipilih
  const currentCategories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl relative flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-[#252525] rounded-t-3xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {isEditMode ? <Edit2 size={18} className="text-yellow-500" /> : <Plus size={18} className="text-blue-500" />}
            {isEditMode ? 'Edit Transaksi' : 'Tambah Transaksi'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white bg-white/5 p-1.5 rounded-full hover:bg-white/10"><X size={18} /></button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Type Selector */}
            <div className="p-1 bg-black/40 rounded-xl flex border border-white/5">
              {(['expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${formData.type === t
                    ? (t === 'income' ? 'bg-green-600 text-white' : 'bg-red-600 text-white')
                    : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                  {t === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {t === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                </button>
              ))}
            </div>

            <div>
              <label className={labelClass}>Nominal (IDR)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">Rp</span>
                <input
                  type="number" required className={`${inputClass} pl-10 text-lg font-mono tracking-wide`}
                  value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Judul</label>
                <input type="text" required className={inputClass} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Tanggal</label>
                <input type="date" required className={`${inputClass} [color-scheme:dark]`} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>
            </div>

            {/* Wallet Selection */}
            <div>
              <label className={labelClass}>Dompet / Sumber Dana</label>
              <select
                required
                className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition-colors text-sm cursor-pointer appearance-none"
                value={formData.wallet_id}
                onChange={e => setFormData({ ...formData, wallet_id: e.target.value })}
              >
                <option value="" disabled>-- Pilih Dompet --</option>
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.icon} {w.name} (Saldo: {formatCurrency(w.balance)})
                  </option>
                ))}
              </select>
              {wallets.length === 0 && (
                <p className="text-[10px] text-amber-400 mt-1">
                  ⚠️ Belum ada dompet. Silakan tambahkan dompet di halaman Dompet.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={labelClass}>Kategori</label>
                <select
                  className={inputClass}
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  {/* Mapping Kategori Dinamis */}
                  {currentCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {formData.type === 'expense' && (
                <div>
                  <label className={labelClass}>Tag Keuangan</label>
                  <select required className={`${inputClass} border-l-4 border-l-blue-500`} value={formData.financial_tag} onChange={e => setFormData({ ...formData, financial_tag: e.target.value as FinancialTag })}>
                    <option value="needs">Needs (Kebutuhan)</option>
                    <option value="wants">Wants (Keinginan)</option>
                    <option value="savings">Savings (Tabungan)</option>
                    <option value="liabilities">Liabilities (Utang)</option>
                  </select>
                </div>
              )}
            </div>

            <button type="submit" disabled={isLoading} className={`w-full font-bold py-3.5 rounded-xl mt-6 transition-all ${formData.type === 'income' ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'
              } text-white`}>
              {isLoading ? 'Menyimpan...' : (isEditMode ? 'Update Transaksi' : 'Simpan Transaksi')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5.6. NEW COMPONENT: SUBSCRIPTION MODAL
// ==========================================
const SubscriptionModal = ({ isOpen, onClose, onSuccess, userId }: { isOpen: boolean; onClose: () => void; onSuccess: (s: Subscription) => void; userId?: string }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    billing_cycle: 'monthly' as 'monthly' | 'yearly',
    next_payment_date: new Date().toISOString().split('T')[0],
    category: 'Hiburan'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.name || !formData.cost) throw new Error("Lengkapi data");
      if (!USE_MOCK_DATA && !userId) throw new Error("Login diperlukan.");

      const newSub = {
        name: formData.name,
        cost: Number(formData.cost),
        billing_cycle: formData.billing_cycle,
        next_payment_date: formData.next_payment_date,
        category: formData.category,
        is_active: true,
        user_id: userId // <--- INJECT USER ID
      };

      if (USE_MOCK_DATA) {
        setTimeout(() => {
          onSuccess({ ...newSub, id: Math.random().toString() } as Subscription);
          onClose();
          setIsLoading(false);
        }, 500);
      } else {
        const { data, error } = await supabase.from('subscriptions').insert([newSub]).select().single();
        if (error) throw error;
        onSuccess(data as Subscription);
        onClose();
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      if (!USE_MOCK_DATA) setIsLoading(false);
    }
  };

  const inputClass = "w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition-colors text-sm";
  const labelClass = "block text-[11px] text-gray-400 mb-1.5 uppercase font-bold tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl relative p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><RotateCcw size={20} className="text-yellow-500" /> Tambah Langganan</h2>
          <button onClick={onClose}><X size={18} className="text-gray-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ... Input forms sama seperti sebelumnya ... */}
          <div>
            <label className={labelClass}>Nama Layanan</label>
            <input type="text" className={inputClass} placeholder="Netflix, Spotify, AWS..." value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Biaya</label>
              <input type="number" className={inputClass} placeholder="0" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}>Siklus Tagihan</label>
              <select className={inputClass} value={formData.billing_cycle} onChange={e => setFormData({ ...formData, billing_cycle: e.target.value as any })}>
                <option value="monthly">Bulanan</option>
                <option value="yearly">Tahunan</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Tanggal Tagihan Berikutnya</label>
            <input type="date" className={`${inputClass} [color-scheme:dark]`} value={formData.next_payment_date} onChange={e => setFormData({ ...formData, next_payment_date: e.target.value })} required />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 shadow-lg shadow-yellow-900/20 text-white font-bold py-3 rounded-xl mt-4 transition-all">
            {isLoading ? 'Menyimpan...' : 'Simpan Langganan'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 5.7. NEW COMPONENT: DEBT PAYMENT MODAL (SMART SLIDER)
// ==========================================

const DebtPaymentModal = ({
  debt,
  onClose,
  onSuccess,
  userId // <--- PROPS BARU
}: {
  debt: Debt | null;
  onClose: () => void;
  onSuccess: (debtId: string, amount: number, transaction: Transaction) => void;
  userId?: string; // <--- TYPE DEF
}) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [percentage, setPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (debt) {
      setAmount('');
      setPercentage(0);
    }
  }, [debt]);

  if (!debt) return null;

  const remaining = debt.total_amount - debt.paid_amount;
  const isPayable = debt.type === 'payable';

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = Number(e.target.value);
    setPercentage(pct);
    const calculatedAmount = Math.round(remaining * (pct / 100));
    setAmount(calculatedAmount);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (val > remaining) return;
    setAmount(val);
    const pct = remaining > 0 ? (val / remaining) * 100 : 0;
    setPercentage(Math.min(100, Math.max(0, pct)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return alert("Masukkan nominal pembayaran");

    // GUARD: Cek Login
    if (!USE_MOCK_DATA && !userId) return alert("Login diperlukan.");

    setIsLoading(true);

    const finalAmount = Number(amount);
    const txTitle = isPayable ? `Bayar Cicilan: ${debt.name}` : `Terima Pembayaran: ${debt.name}`;
    const txType: TransactionType = isPayable ? 'expense' : 'income';
    const txCategory = isPayable ? 'Cicilan Utang' : 'Pelunasan Piutang';
    const txTag: FinancialTag | null = isPayable ? 'liabilities' : null;

    const transactionPayload = {
      title: txTitle,
      amount: finalAmount,
      date: new Date().toISOString().split('T')[0],
      type: txType,
      category: txCategory,
      financial_tag: txTag,
      user_id: userId // <--- INJECT USER ID
    };

    try {
      if (USE_MOCK_DATA) {
        setTimeout(() => {
          const mockTx = { ...transactionPayload, id: Math.random().toString() } as Transaction;
          onSuccess(debt.id, finalAmount, mockTx);
          onClose();
          setIsLoading(false);
        }, 800);
      } else {
        // 1. Update Debt
        const { error: debtError } = await supabase
          .from('debts')
          .update({ paid_amount: debt.paid_amount + finalAmount })
          .eq('id', debt.id);
        if (debtError) throw debtError;

        // 2. Insert Transaction
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .insert([transactionPayload])
          .select()
          .single();
        if (txError) throw txError;

        onSuccess(debt.id, finalAmount, txData as Transaction);
        onClose();
        setIsLoading(false);
      }
    } catch (error: any) {
      alert("Error: " + error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl relative p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {isPayable ? <ShieldAlert className="text-orange-500" size={20} /> : <ShieldCheck className="text-green-500" size={20} />}
              {isPayable ? 'Bayar Cicilan' : 'Terima Pembayaran'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">Untuk: <span className="text-white font-medium">{debt.name}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={18} className="text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-black/30 rounded-xl p-4 flex justify-between items-center border border-white/5">
            <span className="text-xs text-gray-400 uppercase font-bold">Sisa {isPayable ? 'Utang' : 'Piutang'}</span>
            <span className="text-lg font-mono font-bold text-white">{formatCompact(remaining)}</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400 font-bold mb-1">
              <span>0%</span>
              <span className="text-blue-400">{percentage.toFixed(0)}%</span>
              <span>100%</span>
            </div>
            <input type="range" min="0" max="100" step="1" value={percentage} onChange={handleSliderChange} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all" />
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1.5 uppercase font-bold">Nominal Pembayaran (IDR)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">Rp</span>
              <input type="number" className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-blue-500 focus:outline-none text-lg font-mono font-bold" placeholder="0" value={amount} onChange={handleAmountChange} required />
            </div>
          </div>

          <button type="submit" disabled={isLoading || Number(amount) <= 0} className={`w-full font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg ${isPayable ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 shadow-orange-900/20' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-900/20'} disabled:opacity-50 disabled:cursor-not-allowed`}>
            {isLoading ? 'Memproses...' : (isPayable ? 'Bayar Sekarang' : 'Catat Penerimaan')}
          </button>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 5.8. UPDATED: TRADE ASSET MODAL
// ==========================================

const TradeModal = ({
  isOpen,
  onClose,
  onSuccess,
  assets,
  portfolio,
  userId // <--- NEW PROP
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (trade: Trade, transaction: Transaction | null, newAsset?: Asset) => void;
  assets: Asset[];
  portfolio: PortfolioPosition[];
  userId?: string; // <--- TYPE DEF
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
  const [percentage, setPercentage] = useState(0);

  // STATE BARU: Menandai apakah ini data lama
  const [isHistorical, setIsHistorical] = useState(false);

  const [formData, setFormData] = useState({
    ticker: '',
    name: '',
    class: 'stock' as AssetClass,
    asset_id: '',
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    price: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ticker: '', name: '', class: 'stock',
        asset_id: '',
        date: new Date().toISOString().split('T')[0],
        quantity: '',
        price: ''
      });
      setType('BUY');
      setPercentage(0);
      setIsHistorical(false); // Reset checkbox
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedPosition = type === 'SELL' ? portfolio.find(p => p.asset.id === formData.asset_id) : null;
  const maxSellable = selectedPosition ? selectedPosition.quantity : 0;
  const quantity = parseFloat(formData.quantity) || 0;
  const price = parseFloat(formData.price) || 0;
  const total = quantity * price;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = Number(e.target.value);
    setPercentage(pct);
    if (maxSellable > 0) {
      const calculatedQty = (maxSellable * (pct / 100));
      setFormData(prev => ({ ...prev, quantity: parseFloat(calculatedQty.toFixed(6)).toString() }));
    }
  };

  const handleQtyChange = (val: string) => {
    setFormData(prev => ({ ...prev, quantity: val }));
    const numVal = parseFloat(val);
    if (type === 'SELL' && maxSellable > 0 && !isNaN(numVal)) {
      const pct = (numVal / maxSellable) * 100;
      setPercentage(Math.min(100, Math.max(0, pct)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0 || price <= 0) return alert("Mohon isi jumlah dan harga dengan benar.");

    // GUARD: Cek Login
    if (!USE_MOCK_DATA && !userId) return alert("Login diperlukan untuk menyimpan data investasi.");

    if (type === 'SELL') {
      if (!formData.asset_id) return alert("Pilih aset yang ingin dijual.");
      if (quantity > maxSellable) return alert(`Saldo tidak cukup. Max: ${formatCompact(maxSellable)}`);
    } else {
      if (!formData.ticker || !formData.name) return alert("Lengkapi data aset (Ticker & Nama).");
    }

    setIsLoading(true);

    try {
      let finalAssetId = formData.asset_id;
      let finalAssetData: Asset | undefined = undefined;

      // STEP A: Handle Asset Creation (Jika BUY asset baru)
      if (type === 'BUY') {
        const existingAsset = assets.find(a => a.ticker.toUpperCase() === formData.ticker.toUpperCase());
        if (existingAsset) {
          finalAssetId = existingAsset.id;
          finalAssetData = existingAsset;
        } else {
          const newAssetPayload = {
            ticker: formData.ticker.toUpperCase(),
            name: formData.name,
            class: formData.class,
            current_price: price,
            user_id: userId // <--- INJECT USER ID KE TABLE ASSETS
          };

          if (USE_MOCK_DATA) {
            finalAssetId = Math.random().toString();
            finalAssetData = { ...newAssetPayload, id: finalAssetId } as Asset;
          } else {
            const { data: assetData, error: assetError } = await supabase.from('assets').insert([newAssetPayload]).select().single();
            if (assetError) throw assetError;
            finalAssetId = assetData.id;
            finalAssetData = assetData as Asset;
          }
        }
      } else {
        finalAssetData = assets.find(a => a.id === finalAssetId);
      }

      // STEP B: Insert Trade
      const tradePayload = {
        asset_id: finalAssetId,
        type: type,
        quantity: quantity,
        price: price,
        date: formData.date,
        fee: 0,
        user_id: userId // <--- INJECT USER ID KE TABLE TRADES
      };

      // STEP C: Insert Transaction (HANYA JIKA BUKAN DATA HISTORIS)
      let transactionResult: Transaction | null = null;

      if (!isHistorical) {
        const transactionPayload = {
          title: `${type === 'BUY' ? 'Beli' : 'Jual'} ${finalAssetData?.ticker || 'Aset'}`,
          amount: total,
          date: formData.date,
          type: type === 'BUY' ? 'expense' : 'income' as TransactionType,
          category: type === 'BUY' ? 'Investasi' : 'Profit Investasi',
          financial_tag: 'savings' as FinancialTag,
          reference_type: 'trade',
          user_id: userId // <--- INJECT USER ID KE TABLE TRANSACTIONS
        };

        if (USE_MOCK_DATA) {
          transactionResult = { ...transactionPayload, id: Math.random().toString() } as Transaction;
        } else {
          const { data: txData, error: txError } = await supabase.from('transactions').insert([transactionPayload]).select().single();
          if (txError) throw txError;
          transactionResult = txData as Transaction;
        }
      }

      // FINAL EXECUTION FOR TRADE
      if (USE_MOCK_DATA) {
        setTimeout(() => {
          const mockTrade = { ...tradePayload, id: Math.random().toString() } as Trade;
          onSuccess(mockTrade, transactionResult, finalAssetData);
          onClose();
          setIsLoading(false);
        }, 800);
      } else {
        const { data: tradeData, error: tradeError } = await supabase.from('trades').insert([tradePayload]).select().single();
        if (tradeError) throw tradeError;

        onSuccess(tradeData as Trade, transactionResult, finalAssetData);
        onClose();
        setIsLoading(false);
      }

    } catch (error: any) {
      alert("Error: " + error.message);
      setIsLoading(false);
    }
  };

  const inputClass = "w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition-colors text-sm placeholder-gray-600";
  const labelClass = "block text-[11px] text-gray-400 mb-1.5 uppercase font-bold tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl relative p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp size={20} className={type === 'BUY' ? 'text-green-500' : 'text-red-500'} />
            Trade Aset
          </h2>
          <button onClick={onClose}><X size={18} className="text-gray-500 hover:text-white" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="bg-black/40 p-1 rounded-xl flex border border-white/5">
            <button type="button" onClick={() => { setType('BUY'); setFormData(p => ({ ...p, asset_id: '' })); }} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'BUY' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>BELI (INVEST)</button>
            <button type="button" onClick={() => { setType('SELL'); setFormData(p => ({ ...p, ticker: '', name: '' })); }} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'SELL' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>JUAL (CAIRKAN)</button>
          </div>

          {/* CHECKBOX DATA HISTORIS (FEATURE BARU) */}
          {type === 'BUY' && (
            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex items-center gap-3">
              <input
                type="checkbox"
                id="isHistorical"
                checked={isHistorical}
                onChange={e => setIsHistorical(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isHistorical" className="text-xs text-gray-300 cursor-pointer select-none">
                <span className="font-bold text-blue-400 block mb-0.5">Input Aset Lama?</span>
                Jangan catat pengeluaran (Saldo tidak berkurang).
              </label>
            </div>
          )}

          {/* Form Fields Sesuai Tipe */}
          {type === 'BUY' ? (
            <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className={labelClass}>Kode/Ticker</label>
                  <input type="text" className={inputClass} placeholder="BBCA" value={formData.ticker} onChange={e => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })} required />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Nama Aset</label>
                  <input type="text" className={inputClass} placeholder="Bank Central Asia" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className={labelClass}>Kategori</label>
                <select className={inputClass} value={formData.class} onChange={e => setFormData({ ...formData, class: e.target.value as AssetClass })}>
                  <option value="stock">Saham (Stock)</option>
                  <option value="crypto">Kripto (Crypto)</option>
                  <option value="gold">Emas (Gold)</option>
                  <option value="bond">Obligasi (Bond)</option>
                  <option value="cash">Kas / Reksadana Pasar Uang</option>
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className={labelClass}>Pilih Aset untuk Dijual</label>
              <select className={inputClass} value={formData.asset_id} onChange={e => { setFormData({ ...formData, asset_id: e.target.value, quantity: '' }); setPercentage(0); }}>
                <option value="">-- Pilih Aset --</option>
                {portfolio.filter(p => p.quantity > 0).map(p => (
                  <option key={p.asset.id} value={p.asset.id}>{p.asset.ticker} - Sisa: {formatCompact(p.quantity)}</option>
                ))}
              </select>
            </div>
          )}

          {/* Common Fields */}
          <div className="h-px bg-white/5"></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tanggal</label>
              <input type="date" className={`${inputClass} [color-scheme:dark]`} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}>Jumlah Unit</label>
              <input type="number" step="0.000001" className={inputClass} placeholder="0" value={formData.quantity} onChange={e => handleQtyChange(e.target.value)} required />
            </div>
          </div>

          {type === 'SELL' && maxSellable > 0 && (
            <div className="bg-black/20 p-3 rounded-lg border border-white/5">
              <div className="flex justify-between text-[10px] text-gray-400 font-bold mb-1.5">
                <span>0%</span>
                <span className="text-blue-400">{percentage.toFixed(0)}%</span>
                <span>100% ({formatCompact(maxSellable)})</span>
              </div>
              <input type="range" min="0" max="100" step="1" value={percentage} onChange={handleSliderChange} className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500 hover:accent-red-400 transition-all" />
            </div>
          )}

          <div>
            <label className={labelClass}>Harga {type === 'BUY' ? 'Beli' : 'Jual'} per Unit</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Rp</span>
              <input type="number" className={`${inputClass} pl-8`} placeholder="0" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
            </div>
          </div>

          <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
            <span className="text-xs text-gray-400 font-bold uppercase">Total Transaksi</span>
            <span className={`text-xl font-mono font-bold ${type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(total)}</span>
          </div>

          <button type="submit" disabled={isLoading} className={`w-full font-bold py-3.5 rounded-xl mt-2 transition-all flex items-center justify-center gap-2 shadow-lg ${type === 'BUY' ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-900/20' : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-900/20'}`}>
            {isLoading ? 'Memproses...' : (type === 'BUY' ? (isHistorical ? 'Simpan Aset Lama' : 'Konfirmasi Beli') : 'Konfirmasi Jual')}
          </button>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 5.9. NEW COMPONENT: WATERFALL SETTINGS MODAL
// ==========================================

const WaterfallSettingsModal = ({
  isOpen,
  onClose,
  currentSettings,
  onSave
}: {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: { needs: number; wants: number; savings: number; liabilities: number };
  onSave: (settings: { needs: number; wants: number; savings: number; liabilities: number }) => void;
}) => {
  const [values, setValues] = useState(currentSettings);

  useEffect(() => {
    if (isOpen) setValues(currentSettings);
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const total = values.needs + values.wants + values.savings + values.liabilities;
  const isValid = total === 100;

  const handleChange = (key: keyof typeof values, val: string) => {
    setValues(prev => ({ ...prev, [key]: Number(val) }));
  };

  const inputClass = "w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none text-sm text-right font-mono";
  const labelClass = "text-xs text-gray-400 uppercase font-bold mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl relative p-6 animate-in fade-in zoom-in duration-200">

        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Target size={20} className="text-blue-500" /> Atur Budget Ideal
          </h2>
          <button onClick={onClose}><X size={18} className="text-gray-500 hover:text-white" /></button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={{ color: COLORS.needs }}>Needs (%)</label>
              <input type="number" className={inputClass} value={values.needs} onChange={e => handleChange('needs', e.target.value)} />
            </div>
            <div>
              <label className={labelClass} style={{ color: COLORS.wants }}>Wants (%)</label>
              <input type="number" className={inputClass} value={values.wants} onChange={e => handleChange('wants', e.target.value)} />
            </div>
            <div>
              <label className={labelClass} style={{ color: COLORS.savings }}>Savings (%)</label>
              <input type="number" className={inputClass} value={values.savings} onChange={e => handleChange('savings', e.target.value)} />
            </div>
            <div>
              <label className={labelClass} style={{ color: COLORS.liabilities }}>Liabilities (%)</label>
              <input type="number" className={inputClass} value={values.liabilities} onChange={e => handleChange('liabilities', e.target.value)} />
            </div>
          </div>

          <div className={`p-3 rounded-xl border flex justify-between items-center ${isValid ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            <span className="text-xs font-bold uppercase">Total Alokasi</span>
            <span className="font-mono font-bold">{total}%</span>
          </div>

          <button
            onClick={() => {
              if (!isValid) return alert("Total persentase harus 100%");
              onSave(values);
              onClose();
            }}
            disabled={!isValid}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl mt-2 transition-all"
          >
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5.10. NEW COMPONENT: DATABASE MODAL (FULL HISTORY)
// ==========================================
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'; // Pastikan import ini ada

const DatabaseModal = ({
  isOpen,
  onClose,
  transactions,
  onEdit,
  onDelete
}: {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (!isOpen) return null;

  // 1. Filtering Logic
  const filteredData = transactions.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' ? true : t.type === typeFilter;
    const matchCategory = categoryFilter === 'all' ? true : t.category === categoryFilter;
    return matchSearch && matchType && matchCategory;
  });

  // 2. Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Extract Unique Categories for Filter
  const categories = Array.from(new Set(transactions
    .filter(t => typeFilter === 'all' ? true : t.type === typeFilter)
    .map(t => t.category)
  )).sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-[#191919] w-full max-w-5xl h-[85vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* HEADER */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#232323]">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Database size={20} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Database Transaksi</h2>
              <p className="text-xs text-gray-500">{filteredData.length} data ditemukan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* FILTERS TOOLBAR */}
        <div className="p-4 border-b border-white/5 bg-[#1e1e1e] flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Cari transaksi..."
              className="w-full bg-[#151515] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              className="bg-[#151515] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none appearance-none cursor-pointer min-w-[120px]"
              value={typeFilter}
              onChange={(e) => { 
                setTypeFilter(e.target.value as any); 
                setCategoryFilter('all'); // Reset kategori saat tipe berubah
                setCurrentPage(1); 
              }}
            >
              <option value="all">Semua Tipe</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>

            <select
              className="bg-[#151515] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none appearance-none cursor-pointer min-w-[140px]"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">
                {typeFilter === 'all' ? 'Semua Kategori' : typeFilter === 'income' ? 'Semua Pemasukan' : 'Semua Pengeluaran'}
              </option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* TABLE CONTENT */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#232323] z-10 text-xs uppercase text-gray-500 font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-white/5">Tanggal</th>
                <th className="px-6 py-4 border-b border-white/5">Judul</th>
                <th className="px-6 py-4 border-b border-white/5">Kategori</th>
                <th className="px-6 py-4 border-b border-white/5">Tag</th>
                <th className="px-6 py-4 border-b border-white/5 text-right">Nominal</th>
                <th className="px-6 py-4 border-b border-white/5 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5 text-sm">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedData.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-3 text-gray-400 font-mono whitespace-nowrap">{t.date}</td>
                    <td className="px-6 py-3 text-white font-medium">{t.title}</td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-1 rounded text-xs bg-white/5 text-gray-300 border border-white/5">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {t.financial_tag && (
                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${t.financial_tag === 'needs' ? 'bg-blue-500/10 text-blue-400' :
                          t.financial_tag === 'wants' ? 'bg-purple-500/10 text-purple-400' :
                            t.financial_tag === 'savings' ? 'bg-green-500/10 text-green-400' :
                              'bg-orange-500/10 text-orange-400'
                          }`}>
                          {t.financial_tag}
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-3 text-right font-mono font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCompact(t.amount)}
                    </td>

                    {/* BAGIAN AKSI YANG DIPERBAIKI (VISIBLE ON MOBILE) */}
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEdit(t)}
                          // Perbaikan: Hapus opacity-0, ganti hover menjadi warna solid lembut
                          className="p-2 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-white rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus transaksi "${t.title}"?`)) onDelete(t.id);
                          }}
                          // Perbaikan: Hapus opacity-0, ganti hover menjadi warna solid lembut
                          className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-4 border-t border-white/5 bg-[#232323] flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Halaman {currentPage} dari {totalPages || 1}
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5.11. NEW COMPONENT: FINANCIAL GOALS WIDGET
// ==========================================

const FinancialGoalsWidget = ({
  goals,
  onOpenAddSavings,
  onOpenCreateGoal,
  onDelete // <--- Props Baru
}: {
  goals: Goal[];
  onOpenAddSavings: (goal: Goal) => void;
  onOpenCreateGoal: () => void;
  onDelete: (id: string) => void; // <--- Type def
}) => {
  return (
    <div className="bg-[#232323] border border-white/5 rounded-2xl p-6 shadow-lg h-full flex flex-col">
      <SectionHeader
        title="Financial Goals (Sinking Funds)"
        icon={Target}
        action={
          <button
            onClick={onOpenCreateGoal}
            className="text-xs text-blue-500 hover:text-blue-400 font-bold hover:underline flex items-center gap-1"
          >
            <Plus size={14} /> Goal Baru
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[300px] pr-2">
        {goals.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8 opacity-50">
            <Target size={32} className="mb-2" />
            <p className="text-sm">Belum ada target keuangan.</p>
            <button onClick={onOpenCreateGoal} className="mt-2 text-xs text-blue-400 underline">Buat sekarang</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => {
              const progress = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
              const isCompleted = progress >= 100;

              return (
                <div key={goal.id} className="bg-black/20 border border-white/5 rounded-xl p-4 relative group hover:border-white/10 transition-all">

                  {/* TOMBOL DELETE (Pojok Kanan Atas Absolute) */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(goal.id); }}
                    className="absolute top-2 right-2 p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Hapus Goal"
                  >
                    <Trash2 size={14} />
                  </button>

                  {/* Header Card */}
                  <div className="flex justify-between items-start mb-3 pr-6"> {/* pr-6 agar tidak tertutup tombol delete */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#2a2a2a] flex items-center justify-center text-2xl shadow-inner">
                        {goal.emoji}
                      </div>
                      <div>
                        <h4 className="text-white font-medium text-sm truncate max-w-[120px]">{goal.name}</h4>
                        <div className="text-[10px] text-gray-500">
                          Target: {formatCompact(goal.target_amount)}
                        </div>
                      </div>
                    </div>

                    {!isCompleted && (
                      <button
                        onClick={() => onOpenAddSavings(goal)}
                        className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all"
                        title="Tabung Uang"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-white font-bold">{formatCompact(goal.current_amount)}</span>
                      <span className={isCompleted ? 'text-green-400' : 'text-blue-400'}>
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-blue-600 to-cyan-400'}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 5.12. UPDATED COMPONENT: CREATE GOAL MODAL
// ==========================================

const GoalModal = ({
  isOpen,
  onClose,
  onSuccess,
  userId // <--- PROPS BARU
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (goal: Goal) => void;
  userId?: string; // <--- TYPE DEF
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', target_amount: '', current_amount: '', emoji: '🎯', due_date: '' });
  const commonEmojis = ['🏠', '🚗', '💍', '👶', '💻', '📱', '✈️', '🎓', '🏥', '💰', '🕋', '🏖️'];

  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', target_amount: '', current_amount: '', emoji: '🎯', due_date: '' });
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.name || !formData.target_amount) throw new Error("Nama dan Target wajib diisi");
      if (!USE_MOCK_DATA && !userId) throw new Error("Login diperlukan");

      const payload = {
        name: formData.name,
        target_amount: Number(formData.target_amount),
        current_amount: Number(formData.current_amount) || 0,
        emoji: formData.emoji || '🎯',
        due_date: formData.due_date || null,
        user_id: userId // <--- INJECT USER ID
      };

      if (USE_MOCK_DATA) {
        setTimeout(() => { onSuccess({ ...payload, id: Math.random().toString() } as Goal); setIsLoading(false); onClose(); }, 500);
      } else {
        const { data, error } = await supabase.from('goals').insert([payload]).select().single();
        if (error) throw error;
        onSuccess(data as Goal);
        setIsLoading(false);
        onClose();
      }
    } catch (error: any) { alert('Error: ' + error.message); setIsLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl relative p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Target size={20} className="text-blue-500" /> Goal Baru</h2>
          <button onClick={onClose} type="button"><X size={18} className="text-gray-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] text-gray-400 mb-1.5 uppercase font-bold tracking-wider">Ikon / Emoji</label>
            <div className="flex gap-3 mb-3">
              <div className="relative w-16 h-14">
                <input type="text" className="w-full h-full bg-[#151515] border border-blue-500 rounded-xl text-center text-3xl focus:outline-none" value={formData.emoji} onChange={(e) => setFormData({ ...formData, emoji: e.target.value })} maxLength={5} />
                <div className="absolute -bottom-5 left-0 w-full text-center text-[9px] text-blue-400">Custom</div>
              </div>
              <div className="flex-1 flex gap-2 overflow-x-auto pb-2 custom-scrollbar items-center">
                {commonEmojis.map(em => (
                  <button key={em} type="button" onClick={() => setFormData({ ...formData, emoji: em })} className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-xl transition-all border ${formData.emoji === em ? 'bg-blue-600 border-blue-400 text-white scale-110 shadow-lg' : 'bg-white/5 border-transparent hover:bg-white/10'}`}>{em}</button>
                ))}
              </div>
            </div>
          </div>
          <div><label className="block text-[11px] text-gray-400 mb-1.5 uppercase font-bold tracking-wider">Nama Impian</label><input type="text" className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition-colors text-sm" placeholder="Contoh: Rumah Impian, Nikah..." value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[11px] text-gray-400 mb-1.5 uppercase font-bold tracking-wider">Target (IDR)</label><input type="number" className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition-colors text-sm" placeholder="0" value={formData.target_amount} onChange={e => setFormData({ ...formData, target_amount: e.target.value })} required /></div>
            <div><label className="block text-[11px] text-gray-400 mb-1.5 uppercase font-bold tracking-wider">Sudah Terkumpul</label><input type="number" className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition-colors text-sm" placeholder="0 (Opsional)" value={formData.current_amount} onChange={e => setFormData({ ...formData, current_amount: e.target.value })} /></div>
          </div>
          <div><label className="block text-[11px] text-gray-400 mb-1.5 uppercase font-bold tracking-wider">Target Tercapai Pada (Opsional)</label><input type="date" className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition-colors text-sm [color-scheme:dark]" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} /></div>
          <div className="flex gap-3 mt-6"><button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/20 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">{isLoading ? 'Menyimpan...' : 'Buat Goal'}</button></div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 5.13. UPDATED COMPONENT: ADD SAVINGS MODAL
// ==========================================

const AddSavingsModal = ({
  goal,
  onClose,
  onSuccess,
  userId // <--- NEW PROP
}: {
  goal: Goal | null;
  onClose: () => void;
  onSuccess: (goalId: string, amount: number, transaction: Transaction) => void;
  userId?: string; // <--- TYPE DEF
}) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [percentage, setPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (goal) {
      setAmount('');
      setPercentage(0);
      setIsLoading(false);
    }
  }, [goal]);

  if (!goal) return null;

  const remaining = goal.target_amount - goal.current_amount;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = Number(e.target.value);
    setPercentage(pct);
    setAmount(Math.round(remaining * (pct / 100)));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setAmount(val);
    const pct = remaining > 0 ? (val / remaining) * 100 : 0;
    setPercentage(Math.min(100, Math.max(0, pct)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return alert("Masukkan nominal tabungan");

    // GUARD: Cek Login
    if (!USE_MOCK_DATA && !userId) return alert("Login diperlukan.");

    setIsLoading(true);

    const finalAmount = Number(amount);
    const newCurrentAmount = goal.current_amount + finalAmount;

    const transactionPayload = {
      title: `Tabungan: ${goal.name} ${goal.emoji}`,
      amount: finalAmount,
      date: new Date().toISOString().split('T')[0],
      type: 'expense' as TransactionType,
      category: 'Tabungan & Investasi',
      financial_tag: 'savings' as FinancialTag,
      user_id: userId // <--- INJECT USER ID
    };

    try {
      if (USE_MOCK_DATA) {
        setTimeout(() => {
          const mockTx = { ...transactionPayload, id: Math.random().toString() } as Transaction;
          onSuccess(goal.id, finalAmount, mockTx);
          setIsLoading(false);
          onClose();
        }, 800);
      } else {
        // 1. Update Goal
        // RLS biasanya mengizinkan update jika user owns the goal, jadi user_id di payload update opsional
        // tapi user_id di Insert Transaction WAJIB.
        const { error: goalError } = await supabase
          .from('goals')
          .update({ current_amount: newCurrentAmount })
          .eq('id', goal.id);
        if (goalError) throw goalError;

        // 2. Insert Transaction
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .insert([transactionPayload])
          .select()
          .single();
        if (txError) throw txError;

        onSuccess(goal.id, finalAmount, txData as Transaction);
        setIsLoading(false);
        onClose();
      }
    } catch (error: any) {
      alert("Error: " + error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl relative p-6 animate-in fade-in zoom-in duration-200">

        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="text-green-500" size={20} />
              Tambah Tabungan
            </h2>
            <p className="text-xs text-gray-500 mt-1">Untuk: <span className="text-white font-medium">{goal.emoji} {goal.name}</span></p>
          </div>
          <button onClick={onClose} type="button"><X size={18} className="text-gray-400 hover:text-white" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="bg-black/30 rounded-xl p-4 flex justify-between items-center border border-white/5">
            <span className="text-xs text-gray-400 uppercase font-bold">Kekurangan Dana</span>
            <span className="text-lg font-mono font-bold text-white">{formatCompact(remaining)}</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400 font-bold mb-1">
              <span>0%</span>
              <span className="text-green-400">Isi {percentage.toFixed(0)}% dari kekurangan</span>
              <span>100%</span>
            </div>
            <input
              type="range" min="0" max="100" step="1"
              value={percentage} onChange={handleSliderChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500 hover:accent-green-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1.5 uppercase font-bold">Nominal Ditabung (IDR)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">Rp</span>
              <input
                type="number"
                className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-blue-500 focus:outline-none text-lg font-mono font-bold"
                placeholder="0"
                value={amount}
                onChange={handleAmountChange}
                required
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 font-bold py-3.5 rounded-xl transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || Number(amount) <= 0}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-900/20 font-bold py-3.5 rounded-xl transition-all shadow-lg text-white disabled:opacity-50"
            >
              {isLoading ? 'Memproses...' : 'Simpan Tabungan'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

// ==========================================
// 5.14. UPDATED COMPONENT: CREATE DEBT MODAL
// ==========================================

const DebtModal = ({
  isOpen,
  onClose,
  onSuccess,
  userId // <--- NEW PROP
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (debt: Debt) => void;
  userId?: string; // <--- TYPE DEF
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    total_amount: '',
    type: 'payable' as 'payable' | 'receivable',
    due_date: ''
  });

  // Reset form saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', total_amount: '', type: 'payable', due_date: '' });
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.name || !formData.total_amount) throw new Error("Nama dan Jumlah wajib diisi");

      // GUARD: Cek Login
      if (!USE_MOCK_DATA && !userId) throw new Error("Login diperlukan untuk menyimpan data.");

      const payload = {
        name: formData.name,
        total_amount: Number(formData.total_amount),
        paid_amount: 0, // Default 0 saat baru dibuat
        type: formData.type,
        due_date: formData.due_date || null,
        user_id: userId // <--- INJECT USER ID
      };

      if (USE_MOCK_DATA) {
        setTimeout(() => {
          onSuccess({ ...payload, id: Math.random().toString() } as Debt);
          setIsLoading(false);
          onClose();
        }, 500);
      } else {
        const { data, error } = await supabase.from('debts').insert([payload]).select().single();
        if (error) throw error;
        onSuccess(data as Debt);
        setIsLoading(false);
        onClose();
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
      setIsLoading(false);
    }
  };

  const inputClass = "w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition-colors text-sm";
  const labelClass = "block text-[11px] text-gray-400 mb-1.5 uppercase font-bold tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl relative p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert size={20} className={formData.type === 'payable' ? "text-orange-500" : "text-green-500"} />
            {formData.type === 'payable' ? 'Catat Hutang Baru' : 'Catat Piutang Baru'}
          </h2>
          <button onClick={onClose} type="button"><X size={18} className="text-gray-500 hover:text-white" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Toggle Type */}
          <div className="p-1 bg-black/40 rounded-xl flex border border-white/5 mb-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'payable' })}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.type === 'payable' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Hutang (Saya Berhutang)
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'receivable' })}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.type === 'receivable' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Piutang (Orang Berhutang)
            </button>
          </div>

          <div>
            <label className={labelClass}>Nama / Keterangan</label>
            <input type="text" className={inputClass} placeholder={formData.type === 'payable' ? "Pinjaman Bank / Kartu Kredit" : "Nama Teman / Klien"} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          </div>

          <div>
            <label className={labelClass}>Total Jumlah (IDR)</label>
            <input type="number" className={inputClass} placeholder="0" value={formData.total_amount} onChange={e => setFormData({ ...formData, total_amount: e.target.value })} required />
          </div>

          <div>
            <label className={labelClass}>Jatuh Tempo (Opsional)</label>
            <input type="date" className={`${inputClass} [color-scheme:dark]`} value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full font-bold py-3 rounded-xl transition-all disabled:opacity-50 text-white shadow-lg ${formData.type === 'payable'
                ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 shadow-orange-900/20'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-900/20'
                }`}
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 5.15. NEW COMPONENT: AUTH MODAL (LOGIN/SIGNUP)
// ==========================================

const AuthModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Registrasi berhasil! Silakan cek email untuk verifikasi (jika diaktifkan) atau langsung login.');
        setMode('signin');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose(); // Tutup modal setelah login sukses
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {mode === 'signin' ? 'Login Akun' : 'Daftar Baru'}
          </h2>
          <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-white" /></button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase font-bold">Email</label>
            <input
              type="email"
              required
              className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase font-bold">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'Memproses...' : (mode === 'signin' ? 'Masuk' : 'Daftar')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            {mode === 'signin' ? "Belum punya akun? " : "Sudah punya akun? "}
            <button
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-blue-400 hover:underline font-bold"
            >
              {mode === 'signin' ? "Daftar di sini" : "Login di sini"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5.16. NEW COMPONENT: AI INSIGHT WIDGET
// ==========================================

const AIInsightWidget = ({
  insight,
  isLoading,
  onGenerate,
  onOpenProfile
}: {
  insight: string;
  isLoading: boolean;
  onGenerate: () => void;
  onOpenProfile: () => void;
}) => {
  return (
    <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-2xl p-6 shadow-lg mb-6 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
            <Bot size={20} />
          </div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            AI Financial Advisor <Sparkles size={14} className="text-yellow-400 animate-pulse" />
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-2 py-1.5 rounded-lg transition-all"
            title="Setel profil agar saran lebih personal"
          >
            <Settings size={12} />
            <span className="hidden sm:inline">Profil</span>
          </button>
          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
          >
            {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {isLoading ? 'Menganalisis...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="relative z-10">
        {insight ? (
          <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-line animate-in fade-in slide-in-from-bottom-2 duration-500">
            {insight}
          </div>
        ) : (
          <div className="text-gray-500 text-sm italic flex flex-col gap-2">
            <p>Klik tombol refresh untuk mendapatkan analisis keuangan pribadi berdasarkan data transaksi, utang, dan investasi Anda saat ini.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 6. MAIN APPLICATION
// ==========================================

export default function FinancialFreedomOS() {
  // ========== STATE MANAGEMENT ==========
  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Data States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // UI States
  const [dateFilter, setDateFilter] = useState<'thisMonth' | 'all'>('thisMonth');
  const [tooltipPos, setTooltipPos] = useState<{ x: number, y: number } | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isWaterfallSettingsOpen, setIsWaterfallSettingsOpen] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isAddSavingsModalOpen, setIsAddSavingsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [hoverAngle, setHoverAngle] = useState(0);
  const [aiInsight, setAiInsight] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSplitBillModalOpen, setIsSplitBillModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Navigation States - Updated with new tab IDs
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Settings
  const [idealAllocation, setIdealAllocation] = useState({
    needs: 50,
    wants: 30,
    savings: 20,
    liabilities: 0
  });

  // Navigation Items Configuration - Updated
  const NAVIGATION_ITEMS = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cashflow' as const, label: 'Arus Kas', icon: ArrowUpDown },
    { id: 'goals_debts' as const, label: 'Target & Kewajiban', icon: Target },
  ] as const;

  // 1. EFFECT: CEK STATUS USER
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsAuthChecking(false); // [BARU] Stop loading setelah cek selesai
    };
    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthChecking(false); // [BARU] Stop loading jika status berubah
    });
    return () => subscription.unsubscribe();
  }, []);

  // 2. EFFECT: LOAD DATA (HYBRID LOGIC)
  useEffect(() => {
    let assetsChannel: ReturnType<typeof supabase.channel> | null = null;

    const loadData = async () => {
      // KONDISI A: TIDAK ADA USER (GUEST) -> LOAD MOCK DATA
      if (!user) {
        console.log("👤 Guest Mode: Loading Mock Data (Read Only)");
        setTransactions(MOCK_TRANSACTIONS);
        setDebts(MOCK_DEBTS);
        setAssets(MOCK_ASSETS);
        setTrades(MOCK_TRADES);
        setSubscriptions(MOCK_SUBSCRIPTIONS || []);
        setGoals(MOCK_GOALS);
        setWallets(MOCK_WALLETS);
      }
      // KONDISI B: ADA USER (LOGIN) -> LOAD REAL DATA BY USER_ID
      else {
        console.log("🔐 User Logged In:", user.email);
        try {
          // Fetch semua tabel filter berdasarkan user_id
          const { data: tx } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false });
          if (tx) setTransactions(tx as any);

          const { data: dt } = await supabase.from('debts').select('*').eq('user_id', user.id);
          if (dt) setDebts(dt as any);

          const { data: as } = await supabase.from('assets').select('*').eq('user_id', user.id);
          if (as) setAssets(as as any);

          const { data: tr } = await supabase.from('trades').select('*').eq('user_id', user.id);
          if (tr) setTrades(tr as any);

          const { data: sb } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('is_active', true);
          if (sb) setSubscriptions(sb as any);

          const { data: gl } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
          if (gl) setGoals(gl as any);

          // Load Wallets
          const { data: wl } = await supabase.from('wallets').select('*').eq('user_id', user.id).eq('is_active', true);
          if (wl) setWallets(wl as any);

          // Load User Settings
          const { data: settings } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (settings) {
            setIdealAllocation({
              needs: settings.needs_pct,
              wants: settings.wants_pct,
              savings: settings.savings_pct,
              liabilities: settings.liabilities_pct
            });
          }

          // [BARU] SETUP REALTIME SUBSCRIPTION UNTUK ASSETS
          // Subscribe ke perubahan tabel assets untuk user ini
          assetsChannel = supabase
            .channel(`assets:${user.id}`)
            .on(
              'postgres_changes',
              {
                event: '*', // Listen untuk INSERT, UPDATE, DELETE
                schema: 'public',
                table: 'assets',
                filter: `user_id=eq.${user.id}`
              },
              (payload) => {
                console.log('🔄 Realtime asset update:', payload);
                
                if (payload.eventType === 'INSERT') {
                  setAssets(prev => [...prev, payload.new as Asset]);
                } else if (payload.eventType === 'UPDATE') {
                  setAssets(prev => prev.map(a => a.id === payload.new.id ? { ...a, ...payload.new } : a));
                } else if (payload.eventType === 'DELETE') {
                  setAssets(prev => prev.filter(a => a.id !== payload.old.id));
                }
              }
            )
            .subscribe();

        } catch (err) {
          console.error("Gagal load data user:", err);
        }
      }
    };

    if (!isAuthChecking) {
      loadData();
      loadUserProfile(); // Load user profile untuk personalisasi AI
    }

    // Cleanup subscription saat component unmount atau user berubah
    return () => {
      if (assetsChannel) {
        supabase.removeChannel(assetsChannel);
      }
    };
  }, [user, isAuthChecking]); // Re-run saat status 'user' berubah

  // ==========================================
  // HANDLERS (Hybrid Logic)
  // ==========================================

  // [BARU] HANDLER SAVE SETTINGS KE DB
  const handleSaveWaterfallSettings = async (newSettings: typeof idealAllocation) => {
    // 1. Update Tampilan (Lokal)
    setIdealAllocation(newSettings);

    // 2. Simpan ke Database (Jika Login)
    if (user && !USE_MOCK_DATA) {
      const { error } = await supabase.from('user_settings').upsert({
        user_id: user.id,
        needs_pct: newSettings.needs,
        wants_pct: newSettings.wants,
        savings_pct: newSettings.savings,
        liabilities_pct: newSettings.liabilities
      }, { onConflict: 'user_id' });

      if (error) {
        alert("Gagal menyimpan pengaturan: " + error.message);
      }
    }
  };

  // [BARU] HANDLER SAVE USER PROFILE
  const handleSaveUserProfile = async (profile: UserProfile) => {
    // 1. Update state lokal
    setUserProfile(profile);

    // 2. Simpan ke Database (Jika Login)
    if (user && !USE_MOCK_DATA) {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          occupation: profile.occupation,
          occupation_label: profile.occupation_label,
          monthly_income: profile.monthly_income,
          has_debt: profile.has_debt,
          financial_goals: profile.financial_goals,
          risk_profile: profile.risk_profile,
          notes: profile.notes,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        alert("Gagal menyimpan profil: " + error.message);
      } else {
        alert("✅ Profil berhasil disimpan! AI Advisor sekarang lebih personal.");
      }
    } else {
      // Mock mode
      alert("✅ Profil berhasil disimpan (Mock Mode)");
    }
  };

  // [BARU] HANDLER LOAD USER PROFILE
  const loadUserProfile = async () => {
    if (!user || USE_MOCK_DATA) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setUserProfile(data);
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
    }
  };

  // --- AI HANDLER (PERSONALIZED DENGAN USER PROFILE) ---
  const generateAIInsight = async () => {
    setIsAiLoading(true);

    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    if (!apiKey || apiKey === 'undefined') {
      alert("API Key Groq belum disetting! Pastikan ada di .env.local dan restart server.");
      setIsAiLoading(false);
      return;
    }

    // Siapkan Data
    const safeGoals = goals.map(g => {
      const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount * 100) : 0;
      return `${g.name} (${pct.toFixed(0)}%)`;
    });

    // User Profile Context
    const userProfileContext = userProfile ? {
      occupation: userProfile.occupation_label || userProfile.occupation || 'Tidak diketahui',
      monthly_income: userProfile.monthly_income ? formatCurrency(userProfile.monthly_income) : 'Tidak ada penghasilan tetap',
      has_debt: userProfile.has_debt ? 'Ya' : 'Tidak',
      financial_goals: userProfile.financial_goals || 'Belum diset',
      risk_profile: userProfile.risk_profile || 'Tidak diketahui',
      notes: userProfile.notes || '-'
    } : {
      occupation: 'Tidak diketahui',
      monthly_income: 'Tidak ada data',
      has_debt: 'Tidak diketahui',
      financial_goals: 'Belum diset',
      risk_profile: 'Tidak diketahui',
      notes: '-'
    };

    const contextData = {
      profile: userProfileContext,
      netWorth: formatCompact(netWorth),
      cashFlow: formatCompact(cashFlow),
      assets: formatCompact(totalAssetsValue),
      debt: formatCompact(debts.reduce((acc, d) => acc + (d.total_amount - d.paid_amount), 0)),
      expenses: filteredTransactions
        .filter(t => t.type === 'expense')
        .slice(0, 3)
        .map(t => `${t.title} (${formatCompact(t.amount)})`),
      budget: waterfallData.map(w => `${w.name}: ${formatCompact(w.value)}`),
      goals: safeGoals
    };

    // --- PROMPT PERSONALIZED ---
    const prompt = `
      KONTEKS USER:
      ${JSON.stringify(userProfileContext, null, 2)}

      DATA KEUANGAN:
      ${JSON.stringify(contextData, null, 2)}

      ---

      Bertindaklah sebagai penasihat keuangan pribadi yang profesional namun ramah dan mudah dipahami.

      TUGAS:
      Berikan 1 paragraf singkat (maksimal 3-4 kalimat) yang berisi:
      1. Evaluasi cepat kondisi keuangan SESUAI PROFIL USER (misal: mahasiswa → fokus ke pengelolaan uang jajan, karyawan → fokus ke investasi)
      2. Peringatan JIKA ADA pengeluaran boros atau utang yang mengkhawatirkan
      3. Satu saran aksi konkret yang RELEVAN dengan profil dan kondisi user

      PANDUAN PERSONALISASI:
      - Jika user adalah MAHASISWA: Fokus ke pengelolaan uang jajan, hindari saran investasi besar, sarankan menabung kecil-kecilan
      - Jika user adalah KARYAWAN: Bisa sarankan investasi rutin, dana darurat, atau pembayaran utang
      - Jika user adalah ENTREPRENEUR: Fokus ke cashflow bisnis, pemisahan keuangan pribadi dan bisnis
      - Jika PENGHASILAN KECIL (< 3jt): Sarankan prioritas kebutuhan dasar, hindari saran investasi besar
      - Jika PENGHASILAN MENENGAH (3-10jt): Bisa sarankan alokasi 10-20% untuk tabungan/investasi
      - Jika PENGHASILAN BESAR (> 10jt): Bisa sarankan diversifikasi investasi, tax planning

      GAYA BAHASA:
      - Gunakan bahasa Indonesia yang santai namun tetap sopan
      - Gunakan emoji secukupnya agar menarik
      - Jangan menggurui atau menghakimi
      - Langsung ke inti masalah dan solusi
      - JANGAN gunakan markdown

      CONTOH OUTPUT YANG BAIK:
      "💰 Sebagai mahasiswa, cashflow Rp365rb kamu sudah cukup baik! Tapi wants 65% masih terlalu tinggi. Coba alokasikan Rp50rb/hari untuk tabungan kecil-kecilan. Dalam 1 tahun bisa jadi Rp1,8jt untuk modal investasi awalmu! 🎯"
    `;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'moonshotai/kimi-k2-instruct-0905',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        setAiInsight(data.choices[0].message.content);
      } else {
        throw new Error('No valid response from AI');
      }
    } catch (error: any) {
      console.error("AI Error:", error);
      setAiInsight(`Waduh, otakku lagi error nih. 🤯 Coba refresh sebentar lagi ya! (${error.message})`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Trigger AI otomatis saat pertama kali data siap (Optional, matikan jika ingin manual saja)
  useEffect(() => {
    if (!isAuthChecking && user && transactions.length > 0 && !aiInsight) {
      // Uncomment baris di bawah jika ingin auto-generate saat load
      generateAIInsight();
    }
  }, [isAuthChecking, user, transactions.length]);

  // Handler Sukses Tambah Utang
  const handleCreateDebt = (newDebt: Debt) => {
    setDebts(prev => [...prev, newDebt]);
  };

  // HANDLER BARU: TRADE SUCCESS (UPDATED)
  // newTx sekarang bisa null jika user memilih "Input Aset Lama"
  const handleNewTrade = (newTrade: Trade, newTx: Transaction | null, newAsset?: Asset) => {
    // 1. Jika ada aset baru (User beli saham baru), tambahkan ke state Assets
    if (newAsset) {
      setAssets(prev => [...prev, newAsset]);
    }

    // 2. Update List Trades
    setTrades(prev => [...prev, newTrade]);

    // 3. Update List Transaksi (HANYA JIKA ADA TRANSAKSI BARU)
    if (newTx) {
      setTransactions(prev => [newTx, ...prev]);
    }
  };

  // --- HANDLERS DELETE BARU ---

  // 1. Delete Goal
  const handleDeleteGoal = async (id: string) => {
    if (!window.confirm("Yakin ingin menghapus goal ini?")) return;
    try {
      if (USE_MOCK_DATA) {
        setGoals(prev => prev.filter(g => g.id !== id));
      } else {
        const { error } = await supabase.from('goals').delete().eq('id', id);
        if (error) throw error;
        setGoals(prev => prev.filter(g => g.id !== id));
      }
    } catch (err: any) {
      alert("Gagal hapus: " + err.message);
    }
  };

  // 2. Delete Subscription
  const handleDeleteSubscription = async (id: string) => {
    if (!window.confirm("Hapus langganan ini?")) return;
    try {
      if (USE_MOCK_DATA) {
        setSubscriptions(prev => prev.filter(s => s.id !== id));
      } else {
        const { error } = await supabase.from('subscriptions').delete().eq('id', id);
        if (error) throw error;
        setSubscriptions(prev => prev.filter(s => s.id !== id));
      }
    } catch (err: any) {
      alert("Gagal hapus: " + err.message);
    }
  };

  // 3. Delete Debt
  const handleDeleteDebt = async (id: string) => {
    if (!window.confirm("Hapus catatan utang ini?")) return;
    try {
      if (USE_MOCK_DATA) {
        setDebts(prev => prev.filter(d => d.id !== id));
      } else {
        const { error } = await supabase.from('debts').delete().eq('id', id);
        if (error) throw error;
        setDebts(prev => prev.filter(d => d.id !== id));
      }
    } catch (err: any) {
      alert("Gagal hapus: " + err.message);
    }
  };

  // ==========================================
  // NEW FEATURE HANDLERS
  // ==========================================

  // 5. Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Title', 'Type', 'Amount', 'Category', 'Wallet', 'Financial Tag'];
    const csvData = transactions.map(t => [
      t.date,
      `"${t.title.replace(/"/g, '""')}"`,
      t.type,
      t.amount,
      t.category,
      wallets.find(w => w.id === t.wallet_id)?.name || 'N/A',
      t.financial_tag || 'N/A'
    ]);

    const csv = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 6. Split Bill Handler
  const handleSplitBill = (transaction: Partial<Transaction>, participants: number, participantNames: string[]) => {
    if (!transaction.amount || !transaction.title) return alert("Data transaksi tidak valid");
    if (participants < 2) return alert("Minimal 2 peserta untuk split bill");

    const splitAmount = Math.round(transaction.amount / participants);
    const newDebts: Debt[] = [];

    // Create receivable debts for each participant
    for (let i = 0; i < participants; i++) {
      newDebts.push({
        id: `split-${Date.now()}-${i}`,
        name: `${transaction.title} - ${participantNames[i] || `Peserta ${i + 1}`}`,
        total_amount: splitAmount,
        paid_amount: 0,
        type: 'receivable',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: `Split bill dari ${transaction.title}`
      });
    }

    // Add debts
    setDebts(prev => [...prev, ...newDebts]);

    // Update transaction with split info
    const splitTransaction: Transaction = {
      ...transaction as Transaction,
      is_split: true,
      split_total_amount: transaction.amount,
      split_participants: participants
    };

    // If creating new transaction, add it
    if (!transaction.id) {
      setTransactions(prev => [splitTransaction, ...prev]);
    }

    alert(`✅ Split bill berhasil! ${participants} piutang dibuat sebesar ${formatCurrency(splitAmount)} per orang.`);
  };

  // 7. Wallet Handlers
  const handleCreateWallet = (wallet: Omit<Wallet, 'id'>) => {
    const newWallet: Wallet = {
      ...wallet,
      id: Math.random().toString(36).substr(2, 9)
    };
    setWallets(prev => [...prev, newWallet]);
  };

  const handleDeleteWallet = async (id: string) => {
    if (!window.confirm("Hapus dompet ini? Saldo akan menjadi 0.")) return;
    try {
      if (USE_MOCK_DATA) {
        setWallets(prev => prev.filter(w => w.id !== id));
      } else {
        const { error } = await supabase.from('wallets').delete().eq('id', id);
        if (error) throw error;
        setWallets(prev => prev.filter(w => w.id !== id));
      }
    } catch (err: any) {
      alert("Gagal hapus wallet: " + err.message);
    }
  };

  const handleUpdateWalletBalance = (walletId: string, amount: number) => {
    setWallets(prev => prev.map(w => 
      w.id === walletId ? { ...w, balance: w.balance + amount } : w
    ));
  };

  // --- HANDLER DATABASE ACTIONS ---

  // 1. Handle Trigger Edit (Dari DatabaseModal)
  const handleEditClick = (t: Transaction) => {
    setEditingTransaction(t); // Set data yang mau diedit
    setIsModalOpen(true);     // Buka Modal Transaksi (Form)
    // Opsional: setIsDatabaseModalOpen(false); // Kalau mau tutup database saat edit
  };

  // 2. Handle Save Transaction (Create OR Update)
  const handleSaveTransaction = (savedTx: Transaction, action: 'create' | 'update') => {
    if (action === 'create') {
      setTransactions(prev => [savedTx, ...prev]);
    } else {
      setTransactions(prev => prev.map(t => t.id === savedTx.id ? savedTx : t));
    }
    // Reset editing state
    setEditingTransaction(null);
  };

  // 3. Handle Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    try {
      if (USE_MOCK_DATA) {
        setTransactions(prev => prev.filter(t => t.id !== id));
      } else {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
        setTransactions(prev => prev.filter(t => t.id !== id));
      }
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  // Handle Tambah Subscription
  const handleNewSubscription = (newSub: Subscription) => {
    setSubscriptions(prev => [...prev, newSub]);
  };

  // HANDLE PAY DEBT (Dual Action)
  const handlePayDebt = async (debt: Debt) => {
    // 1. Ambil Input
    const sisaUtang = debt.total_amount - debt.paid_amount;
    const input = window.prompt(`Bayar cicilan untuk "${debt.name}"?\nSisa Utang: ${formatCompact(sisaUtang)}\n\nMasukkan nominal pembayaran:`);

    if (!input) return; // Cancel
    const amount = Number(input.replace(/\D/g, '')); // Hapus non-digit jika user iseng ketik "Rp"

    if (!amount || amount <= 0) return alert("Nominal tidak valid");
    if (amount > sisaUtang) {
      const confirmOver = window.confirm("Nominal melebihi sisa utang. Lanjutkan?");
      if (!confirmOver) return;
    }

    const newPaidAmount = debt.paid_amount + amount;

    // Payload Transaksi Otomatis
    const transactionPayload = {
      title: `Bayar Cicilan: ${debt.name}`,
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      type: 'expense' as TransactionType,
      category: 'Cicilan Utang',
      financial_tag: 'liabilities' as FinancialTag // Penting untuk Waterfall
    };

    try {
      if (USE_MOCK_DATA) {
        // --- MOCK LOGIC ---
        // 1. Update State Debt
        setDebts(prev => prev.map(d => d.id === debt.id ? { ...d, paid_amount: newPaidAmount } : d));

        // 2. Insert State Transaction
        const mockTx = { ...transactionPayload, id: Math.random().toString() };
        setTransactions(prev => [mockTx as Transaction, ...prev]);

        alert("Pembayaran berhasil dicatat (Mock Mode)");
      } else {
        // --- REAL SUPABASE LOGIC ---

        // 1. Update Table Debts
        const { error: debtError } = await supabase
          .from('debts')
          .update({ paid_amount: newPaidAmount })
          .eq('id', debt.id);

        if (debtError) throw debtError;

        // 2. Insert Table Transactions (Auto-Sync Cashflow)
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .insert([transactionPayload])
          .select()
          .single();

        if (txError) throw txError;

        // 3. Update Local State (Agar UI refresh tanpa reload page)
        setDebts(prev => prev.map(d => d.id === debt.id ? { ...d, paid_amount: newPaidAmount } : d));
        setTransactions(prev => [txData as Transaction, ...prev]);
      }
    } catch (error: any) {
      alert("Gagal memproses pembayaran: " + error.message);
    }
  };

  // Handler tombol klik (Buka Modal)
  const openDebtModal = (debt: Debt) => {
    setSelectedDebt(debt);
  };

  // Handler Sukses Pembayaran (Callback dari Modal)
  const handleDebtPaymentSuccess = (debtId: string, amountPaid: number, newTx: Transaction) => {
    // 1. Update State Debt Lokal
    setDebts(prev => prev.map(d => d.id === debtId ? { ...d, paid_amount: d.paid_amount + amountPaid } : d));

    // 2. Update State Transaksi Lokal
    setTransactions(prev => [newTx, ...prev]);
  };

  // --- HANDLER GOALS BARU (MODAL VERSION) ---

  // 1. Handler Sukses Buat Goal Baru
  const handleCreateGoal = (newGoal: Goal) => {
    setGoals(prev => [...prev, newGoal]);
  };

  // 2. Handler Sukses Menabung (Dari Modal Slider)
  const handleSavingsSuccess = (goalId: string, amount: number, newTx: Transaction) => {
    // Update list Goal lokal
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, current_amount: g.current_amount + amount } : g));

    // Tambah transaksi pengeluaran otomatis
    setTransactions(prev => [newTx, ...prev]);
  };

  // 3. Wrapper untuk membuka modal savings
  const openAddSavingsModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsAddSavingsModalOpen(true);
  };

  const portfolio = useMemo(() => calculatePortfolio(assets, trades), [assets, trades]);
  const totalAssetsValue = portfolio.reduce((acc, p) => acc + p.currentValue, 0);

  // ==========================================
  // FILTERING LOGIC (BARU)
  // ==========================================
  const filteredTransactions = useMemo(() => {
    if (dateFilter === 'all') return transactions;

    const now = new Date();
    // Mendapatkan format YYYY-MM untuk bulan ini agar aman dari masalah Timezone
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return transactions.filter(t => t.date.startsWith(currentMonthPrefix));
  }, [transactions, dateFilter]);

  // ==========================================
  // UPDATED CALCULATIONS (Menggunakan filteredTransactions)
  // ==========================================

  // 1. Update Waterfall Data
  const waterfallData: WaterfallItem[] = useMemo(() => {
    // Ubah 'transactions' menjadi 'filteredTransactions'
    const grouped = filteredTransactions.reduce((acc, curr) => {
      if (curr.financial_tag) acc[curr.financial_tag] = (acc[curr.financial_tag] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    const total = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    return [
      { name: 'Needs (Kebutuhan)', value: grouped['needs'] || 0, color: COLORS.needs, percentage: total > 0 ? `${((grouped['needs'] || 0) / total * 100).toFixed(0)}%` : '0%' },
      { name: 'Liabilities (Kewajiban)', value: grouped['liabilities'] || 0, color: COLORS.liabilities, percentage: total > 0 ? `${((grouped['liabilities'] || 0) / total * 100).toFixed(0)}%` : '0%' },
      { name: 'Wants (Keinginan)', value: grouped['wants'] || 0, color: COLORS.wants, percentage: total > 0 ? `${((grouped['wants'] || 0) / total * 100).toFixed(0)}%` : '0%' },
      { name: 'Savings (Tabungan)', value: grouped['savings'] || 0, color: COLORS.savings, percentage: total > 0 ? `${((grouped['savings'] || 0) / total * 100).toFixed(0)}%` : '0%' },
    ].filter(i => i.value > 0);
  }, [filteredTransactions]); // Dependency berubah jadi filteredTransactions

  // Data untuk Bar Chart Comparison (Actual vs Ideal)
  const waterfallComparisonData: WaterfallComparisonItem[] = useMemo(() => {
    const total = waterfallData.reduce((acc, i) => acc + i.value, 0) || 1;
    return [
      { 
        name: 'Needs', 
        actual: Math.round(((waterfallData.find(d => d.name.includes('Needs'))?.value || 0) / total) * 100),
        ideal: idealAllocation.needs 
      },
      { 
        name: 'Wants', 
        actual: Math.round(((waterfallData.find(d => d.name.includes('Wants'))?.value || 0) / total) * 100),
        ideal: idealAllocation.wants 
      },
      { 
        name: 'Savings', 
        actual: Math.round(((waterfallData.find(d => d.name.includes('Savings'))?.value || 0) / total) * 100),
        ideal: idealAllocation.savings 
      },
      { 
        name: 'Liabilities', 
        actual: Math.round(((waterfallData.find(d => d.name.includes('Liabilities'))?.value || 0) / total) * 100),
        ideal: idealAllocation.liabilities 
      },
    ];
  }, [waterfallData, idealAllocation]);

  // Analytics Data - Net Worth Trend Over Time
  const analyticsData = useMemo(() => {
    // Group transactions by date
    const groupedByDate = transactions.reduce((acc, t) => {
      const dateKey = t.date;
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          dateRaw: t.date,
          income: 0,
          expense: 0,
          netWorth: 0
        };
      }
      if (t.type === 'income') {
        acc[dateKey].income += t.amount;
      } else {
        acc[dateKey].expense += t.amount;
      }
      return acc;
    }, {} as Record<string, { date: string; dateRaw: string; income: number; expense: number; netWorth: number }>);

    // Calculate cumulative net worth and convert to array
    let cumulativeNetWorth = 0;
    const trendData = Object.values(groupedByDate)
      .sort((a, b) => new Date(a.dateRaw).getTime() - new Date(b.dateRaw).getTime())
      .map(item => {
        cumulativeNetWorth += item.income - item.expense;
        return {
          ...item,
          netWorth: cumulativeNetWorth
        };
      });

    return trendData;
  }, [transactions]);

  // Total Wallets Balance
  const totalWalletBalance = useMemo(() => {
    return wallets.reduce((acc, w) => acc + w.balance, 0);
  }, [wallets]);

  // Data untuk Pie Chart "Ideal"
  const idealWaterfallData = [
    { name: 'Needs', value: idealAllocation.needs, color: COLORS.needs },
    { name: 'Liabilities', value: idealAllocation.liabilities, color: COLORS.liabilities },
    { name: 'Wants', value: idealAllocation.wants, color: COLORS.wants },
    { name: 'Savings', value: idealAllocation.savings, color: COLORS.savings },
  ].filter(i => i.value > 0);

  // 2. Update Totals (Income, Expense, Cashflow)
  // Ubah 'transactions' menjadi 'filteredTransactions' di sini
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  
  // Total Income for current month (used in dashboard)
  const totalIncomeCurrentMonth = transactions
    .filter(t => {
      const now = new Date();
      const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return t.type === 'income' && t.date.startsWith(currentMonthPrefix);
    })
    .reduce((acc, t) => acc + t.amount, 0);

  const cashFlow = totalIncome - totalExpense;

  // Net Worth (Aset + Cashflow Filtered - Utang)
  const netWorth = totalAssetsValue + (totalIncome - totalExpense) - debts.filter(d => d.type === 'payable').reduce((acc, d) => acc + (d.total_amount - d.paid_amount), 0);

  const onPieEnter = (data: any) => {
    const { cx, cy, midAngle, outerRadius } = data;
    const radius = outerRadius + 50;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
    setTooltipPos({ x, y });
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#191919] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-400 text-sm font-mono animate-pulse">Memuat Data...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER CONTENT BASED ON ACTIVE TAB
  // ==========================================
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* AI INSIGHT WIDGET */}
            <AIInsightWidget
              insight={aiInsight}
              isLoading={isAiLoading}
              onGenerate={generateAIInsight}
              onOpenProfile={() => setIsProfileModalOpen(true)}
            />

            {/* STAT CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatCard title="Kekayaan Bersih" value={formatCompact(netWorth)} type="neutral" icon={Wallet} subtext="Aset - Kewajiban" />
              <StatCard title="Total Income" value={formatCompact(totalIncomeCurrentMonth)} type="pos" icon={TrendingUp} subtext="Bulan Ini" />
              <StatCard title="Pengeluaran" value={formatCompact(totalExpense)} type="neg" icon={TrendingDown} subtext="Bulan Ini" />
              <StatCard
                title="Arus Kas"
                value={formatCompact(cashFlow)}
                type={cashFlow >= 0 ? 'pos' : 'neg'}
                icon={ArrowUpDown}
                subtext={cashFlow >= 0 ? 'Surplus (Pemasukan > Pengeluaran)' : 'Defisit (Pengeluaran > Pemasukan)'}
              />
            </div>

            {/* WATERFALL & DEBTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-[#232323] border border-white/5 rounded-2xl p-4 md:p-6 shadow-lg h-auto">
                <SectionHeader
                  title="Metode Waterfall Pengeluaran"
                  icon={Target}
                  action={
                    <button
                      onClick={() => setIsWaterfallSettingsOpen(true)}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-white"
                      title="Atur Persentase Ideal"
                    >
                      <Settings size={18} />
                    </button>
                  }
                />
                {/* Waterfall Chart Content */}
                <div className="flex flex-col md:flex-row gap-6 pb-2">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-2">
                    {/* Pie Chart - Waterfall Distribution */}
                    <div className="relative h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={waterfallData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                            onMouseEnter={onPieEnter}
                            onMouseLeave={() => setTooltipPos(undefined)}
                          >
                            {waterfallData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={[COLORS.needs, COLORS.wants, COLORS.savings, COLORS.liabilities][index % 4]} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-[#1a1a1a] border border-white/10 p-2 rounded-lg shadow-xl">
                                    <p className="text-xs font-bold text-white">{data.name}</p>
                                    <p className="text-sm font-mono text-blue-400">{formatCurrency(data.value)}</p>
                                    <p className="text-xs text-gray-500">{data.percentage}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 font-bold">Total</p>
                          <p className="text-sm font-mono font-bold text-white">{formatCompact(totalExpense)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bar Chart - Actual vs Ideal */}
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={waterfallComparisonData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                          <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0]?.payload;
                                const color = [COLORS.needs, COLORS.wants, COLORS.savings, COLORS.liabilities][
                                  waterfallComparisonData.findIndex(item => item.name === data?.name) % 4
                                ];
                                return (
                                  <div className="bg-[#1a1a1a] border border-white/10 p-2 rounded-lg shadow-xl">
                                    <p className="text-xs font-bold text-white mb-1">{data?.name}</p>
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                                      <p className="text-xs font-bold" style={{ color }}>Aktual: {payload[0]?.value}%</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-sm border border-dashed" style={{ borderColor: color, backgroundColor: `${color}4D` }} />
                                      <p className="text-xs text-gray-400">Ideal: {payload[1]?.value}%</p>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="actual" name="Aktual">
                            {waterfallComparisonData.map((entry, index) => {
                              const color = [COLORS.needs, COLORS.wants, COLORS.savings, COLORS.liabilities][index % 4];
                              return (
                                <Cell
                                  key={`cell-actual-${index}`}
                                  fill={color}
                                  stroke={color}
                                  strokeWidth={1}
                                />
                              );
                            })}
                          </Bar>
                          <Bar dataKey="ideal" name="Ideal">
                            {waterfallComparisonData.map((entry, index) => {
                              const color = [COLORS.needs, COLORS.wants, COLORS.savings, COLORS.liabilities][index % 4];
                              return (
                                <Cell
                                  key={`cell-ideal-${index}`}
                                  fill={`${color}4D`}
                                  fillOpacity={0.3}
                                  stroke={color}
                                  strokeDasharray="3 3"
                                  strokeWidth={2}
                                />
                              );
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="w-full md:w-48 space-y-2">
                    {waterfallData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: [COLORS.needs, COLORS.wants, COLORS.savings, COLORS.liabilities][index % 4] }}></div>
                          <span className="text-gray-400">{item.name}</span>
                        </div>
                        <span className="font-mono text-white font-bold">{item.percentage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Debts Widget */}
              <div className="bg-[#232323] border border-white/5 rounded-2xl p-4 md:p-6 shadow-lg">
                <SectionHeader
                  title="Utang & Piutang"
                  icon={CreditCard}
                  action={
                    <button
                      onClick={() => setIsDebtModalOpen(true)}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-white"
                      title="Tambah Utang"
                    >
                      <Plus size={18} />
                    </button>
                  }
                />
                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {debts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-6">
                      <div className="bg-blue-500/10 p-3 rounded-full mb-2">
                        <CreditCard size={24} className="text-blue-500" />
                      </div>
                      <p className="text-gray-500 text-xs">Belum ada utang.</p>
                    </div>
                  ) : (
                    debts.map((debt) => {
                      const progress = (debt.paid_amount / debt.total_amount) * 100;
                      const remaining = debt.total_amount - debt.paid_amount;
                      return (
                        <div key={debt.id} className="p-3 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-sm font-bold text-white">{debt.name}</p>
                              <p className="text-[10px] text-gray-500 uppercase">{debt.type === 'payable' ? 'Harus Dibayar' : 'Piutang'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-mono font-bold text-white">{formatCompact(remaining)}</p>
                              <p className="text-[9px] text-gray-500">Sisa</p>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${debt.type === 'payable' ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${progress}%` }}></div>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <button
                              onClick={() => openDebtModal(debt)}
                              className="text-[10px] bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded transition-all"
                            >
                              Bayar
                            </button>
                            <button
                              onClick={() => handleDeleteDebt(debt.id)}
                              className="p-1 text-gray-600 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* TREND CHARTS SECTION - Moved from Analytics */}
            <div className="bg-[#232323] border border-white/5 rounded-2xl p-4 md:p-6 shadow-lg">
              <SectionHeader title="Trend Keuangan" icon={LineChartIcon} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                {/* Net Worth Trend */}
                <div className="bg-[#1a1a1a] rounded-xl p-4">
                  <h4 className="text-sm font-bold text-white mb-3">Trend Kekayaan Bersih</h4>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v) => formatCompact(v)} />
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload?.length) {
                              return (
                                <div className="bg-[#1a1a1a] border border-white/10 p-2 rounded-lg">
                                  <p className="text-xs text-gray-400 mb-1">{payload[0]?.payload.date}</p>
                                  <p className="text-sm font-bold text-white">
                                    {formatCurrency(payload[0]?.value as number)}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="netWorth"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={false}
                          name="Kekayaan Bersih"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Income vs Expense */}
                <div className="bg-[#1a1a1a] rounded-xl p-4">
                  <h4 className="text-sm font-bold text-white mb-3">Pemasukan vs Pengeluaran</h4>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v) => formatCompact(v)} />
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload?.length) {
                              return (
                                <div className="bg-[#1a1a1a] border border-white/10 p-2 rounded-lg">
                                  <p className="text-xs text-gray-400 mb-1">{payload[0]?.payload.date}</p>
                                  {payload.map((p: any, i: number) => (
                                    <p key={i} className="text-xs font-bold" style={{ color: p.color }}>
                                      {p.name}: {formatCurrency(p.value)}
                                    </p>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Bar dataKey="income" fill="#22c55e" name="Pemasukan" />
                        <Bar dataKey="expense" fill="#ef4444" name="Pengeluaran" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM ROW: RECENT ACTIVITY & GOALS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="lg:col-span-1 bg-[#232323] border border-white/5 rounded-2xl p-4 md:p-6 shadow-lg">
                <SectionHeader
                  title="Aktivitas Terakhir"
                  icon={RotateCcw}
                  action={
                    <button
                      onClick={() => setIsDatabaseModalOpen(true)}
                      className="text-xs bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded-lg transition-all flex items-center gap-1"
                    >
                      <Database size={12} /> <span className="hidden sm:inline">Lihat Semua</span>
                    </button>
                  }
                />
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {filteredTransactions.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex justify-between items-center p-2 hover:bg-white/5 rounded-lg transition-all group">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {t.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white">{t.title}</p>
                          <p className="text-[10px] text-gray-500">{new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                        </div>
                      </div>
                      <div className={`text-xs font-mono font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCompact(t.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Goals Widget */}
              <div className="lg:col-span-2">
                <FinancialGoalsWidget
                  goals={goals}
                  onOpenAddSavings={openAddSavingsModal}
                  onOpenCreateGoal={() => setIsGoalModalOpen(true)}
                  onDelete={handleDeleteGoal}
                />
              </div>
            </div>
          </div>
        );

      case 'cashflow':
        return (
          <div className="space-y-6">
            {/* Wallet Cards */}
            <div>
              <SectionHeader
                title="Dompet & Akun"
                icon={Wallet}
                action={
                  <button onClick={() => setIsWalletModalOpen(true)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-white">
                    <Plus size={18} />
                  </button>
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {wallets.map(wallet => (
                  <div key={wallet.id} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-white/5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{wallet.icon}</span>
                        <div>
                          <h3 className="text-white font-bold">{wallet.name}</h3>
                          <p className="text-xs text-gray-500">Dompet Digital</p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteWallet(wallet.id)} className="text-gray-500 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="text-2xl font-bold font-mono text-white">
                      {formatCurrency(wallet.balance)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transactions Header */}
            <div className="bg-[#232323] border border-white/5 rounded-2xl p-4 md:p-6 shadow-lg">
              <SectionHeader
                title="Riwayat Transaksi"
                icon={ArrowUpDown}
                action={
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-xs bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                  >
                    <Plus size={14} /> Tambah
                  </button>
                }
              />
              <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                {filteredTransactions.map((t) => (
                  <div key={t.id} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {t.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{t.title}</p>
                        <p className="text-xs text-gray-500">{t.category} • {new Date(t.date).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                    <div className={`text-sm font-mono font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'goals_debts':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Goals */}
            <FinancialGoalsWidget
              goals={goals}
              onOpenAddSavings={openAddSavingsModal}
              onOpenCreateGoal={() => setIsGoalModalOpen(true)}
              onDelete={handleDeleteGoal}
            />

            {/* Subscriptions & Debts */}
            <div className="space-y-6">
              <SubscriptionModule
                subscriptions={subscriptions}
                onAddClick={() => setIsSubModalOpen(true)}
                onDelete={handleDeleteSubscription}
              />

              {/* Debts with Split Bill */}
              <div className="bg-[#232323] border border-white/5 rounded-2xl p-4 md:p-6 shadow-lg">
                <SectionHeader
                  title="Utang & Piutang"
                  icon={CreditCard}
                  action={
                    <button
                      onClick={() => setIsDebtModalOpen(true)}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-white"
                    >
                      <Plus size={18} />
                    </button>
                  }
                />
                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {debts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-6">
                      <div className="bg-blue-500/10 p-3 rounded-full mb-2">
                        <CreditCard size={24} className="text-blue-500" />
                      </div>
                      <p className="text-gray-500 text-xs">Belum ada utang.</p>
                    </div>
                  ) : (
                    debts.map((debt) => {
                      const progress = (debt.paid_amount / debt.total_amount) * 100;
                      const remaining = debt.total_amount - debt.paid_amount;
                      return (
                        <div key={debt.id} className="p-3 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-sm font-bold text-white">{debt.name}</p>
                              <p className="text-[10px] text-gray-500 uppercase">{debt.type === 'payable' ? 'Harus Dibayar' : 'Piutang'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-mono font-bold text-white">{formatCompact(remaining)}</p>
                              <p className="text-[9px] text-gray-500">Sisa</p>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${debt.type === 'payable' ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${progress}%` }}></div>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <button
                              onClick={() => openDebtModal(debt)}
                              className="text-[10px] bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded transition-all"
                            >
                              Bayar
                            </button>
                            <button
                              onClick={() => handleDeleteDebt(debt.id)}
                              className="p-1 text-gray-600 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Page Header */}
      <PageHeader
        title="Dashboard Overview"
        subtitle="Ringkasan kondisi finansialmu saat ini"
        icon={<LayoutDashboard size={24} className="text-blue-500" />}
        filterElement={
          <div className="bg-[#232323] p-1 rounded-lg border border-white/5 flex text-xs font-medium">
            <button
              onClick={() => setDateFilter('thisMonth')}
              className={`px-3 py-1.5 rounded-md transition-all ${dateFilter === 'thisMonth' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${dateFilter === 'all' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Semua
            </button>
          </div>
        }
        actionElement={
          <>
            {!user && (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all border border-white/10"
              >
                Login / Daftar
              </button>
            )}
            <button
              onClick={() => {
                if (!user) {
                  alert("Mode Read-Only: Silakan Login untuk menambah/mengedit data.");
                  setIsAuthModalOpen(true);
                } else {
                  setIsModalOpen(true);
                }
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/20 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
            >
              <Plus size={16} /> <span className="hidden sm:inline">Tambah Data</span>
            </button>
          </>
        }
      />

      {/* Page Content */}
      {renderContent()}

        {/* MODALS */}
        <TransactionModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }}
          onSuccess={handleSaveTransaction}
          initialData={editingTransaction}
          userId={user?.id}
          wallets={wallets}
        />

        <SubscriptionModal
          isOpen={isSubModalOpen}
          onClose={() => setIsSubModalOpen(false)}
          onSuccess={handleNewSubscription}
          userId={user?.id}
        />

        <DebtPaymentModal
          debt={selectedDebt}
          onClose={() => setSelectedDebt(null)}
          onSuccess={handleDebtPaymentSuccess}
          userId={user?.id}
        />

        <TradeModal
          isOpen={isTradeModalOpen}
          onClose={() => setIsTradeModalOpen(false)}
          onSuccess={handleNewTrade}
          assets={assets}
          portfolio={portfolio}
          userId={user?.id}
        />

        <WaterfallSettingsModal
          isOpen={isWaterfallSettingsOpen}
          onClose={() => setIsWaterfallSettingsOpen(false)}
          currentSettings={idealAllocation}
          onSave={handleSaveWaterfallSettings}
        />

        <DatabaseModal
          isOpen={isDatabaseModalOpen}
          onClose={() => setIsDatabaseModalOpen(false)}
          transactions={transactions}
          onEdit={handleEditClick}
          onDelete={handleDeleteTransaction}
        />

        <GoalModal
          isOpen={isGoalModalOpen}
          onClose={() => setIsGoalModalOpen(false)}
          onSuccess={handleCreateGoal}
          userId={user?.id}
        />

        <AddSavingsModal
          goal={selectedGoal}
          onClose={() => {
            setIsAddSavingsModalOpen(false);
            setSelectedGoal(null);
          }}
          onSuccess={handleSavingsSuccess}
          userId={user?.id}
        />

        <DebtModal
          isOpen={isDebtModalOpen}
          onClose={() => setIsDebtModalOpen(false)}
          onSuccess={handleCreateDebt}
          userId={user?.id}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />

        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onSave={handleSaveUserProfile}
          initialProfile={userProfile}
        />

        {/* MODE INDICATOR */}
        {USE_MOCK_DATA && (
          <div className="fixed bottom-4 right-4 z-50 bg-yellow-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg animate-pulse">
            MODE DEMO / MOCK
          </div>
        )}

        {/* ANIMATION STYLES */}
        <style dangerouslySetInnerHTML={{
          __html: `
        @keyframes flyOutRadial {
          0% {
            opacity: 0;
            transform: translate(var(--x-start), var(--y-start)) scale(0.5);
          }
          100% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
        }
      `}} />
      </div>
  );
}