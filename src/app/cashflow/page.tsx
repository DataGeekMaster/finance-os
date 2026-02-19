'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowUpDown,
  Download,
  Filter,
  CalendarDays,
  Wallet,
  TrendingUp,
  TrendingDown,
  Loader2,
  X,
  RotateCcw,
  Tags,
  ChevronDown,
  Search,
  Edit2,
  Trash2,
} from 'lucide-react';

import Link from 'next/link';
import PageHeader from '../components/PageHeader';
import TransactionModal from '../components/TransactionModal';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Transaction {
  id?: string;
  title: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  category: string;
  wallet_id?: string;
  financial_tag?: 'needs' | 'wants' | 'savings' | 'liabilities' | null;
}

interface Wallet {
  id: string;
  name: string;
  icon: string;
}

export default function CashflowPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom dropdown states
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  
  // Transaction modal state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.category-dropdown') && !target.closest('.wallet-dropdown')) {
        setIsCategoryOpen(false);
        setIsWalletOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    setLoading(false);
  };

  const fetchData = async () => {
    if (!user) return;

    // Fetch transactions
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (txError) {
      console.error('Error fetching transactions:', txError);
      return;
    }

    // Fetch wallets
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id);

    if (walletError) {
      console.error('Error fetching wallets:', walletError);
      return;
    }

    setTransactions(txData || []);
    setWallets(walletData || []);

    // Set default date range (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  };

  // Get unique categories from transactions
  const categories = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.category))).sort();
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!t.title.toLowerCase().includes(query) && 
            !t.category.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Date filter
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;

      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(t.category)) return false;

      // Wallet filter
      if (selectedWallets.length > 0 && !selectedWallets.includes(t.wallet_id || '')) return false;

      return true;
    });
  }, [transactions, startDate, endDate, selectedCategories, selectedWallets, searchQuery]);

  // Summary calculations
  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Tanggal', 'Judul', 'Tipe', 'Kategori', 'Wallet', 'Jumlah'];
    const rows = filteredTransactions.map(t => {
      const wallet = wallets.find(w => w.id === t.wallet_id);
      return [
        t.date,
        t.title,
        t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        t.category,
        wallet?.name || '-',
        t.amount.toString()
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cashflow_${startDate}_to_${endDate}.csv`;
    link.click();
  };

  // Clear filters
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedCategories([]);
    setSelectedWallets([]);
    setSearchQuery('');
    setIsFilterOpen(false);
  };

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Toggle wallet selection
  const toggleWallet = (walletId: string) => {
    setSelectedWallets(prev =>
      prev.includes(walletId)
        ? prev.filter(w => w !== walletId)
        : [...prev, walletId]
    );
  };

  // Handle edit transaction
  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsTransactionModalOpen(true);
  };

  // Handle delete transaction
  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (!confirm(`Yakin ingin menghapus transaksi "${transaction.title}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== transaction.id));
    } catch (error: any) {
      alert('Gagal menghapus: ' + (error.message || 'Unknown error'));
    }
  };

  // Handle save transaction (create/update)
  const handleSaveTransaction = (updatedTransaction: Transaction, action?: 'create' | 'update') => {
    if (action === 'update') {
      setTransactions(prev => prev.map(t => 
        t.id === updatedTransaction.id ? updatedTransaction : t
      ));
    } else {
      setTransactions(prev => [updatedTransaction, ...prev]);
    }
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  };

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return startDate !== '' || endDate !== '' || selectedCategories.length > 0 || selectedWallets.length > 0;
  }, [startDate, endDate, selectedCategories, selectedWallets]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

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
          title="Arus Kas"
          subtitle="Pantau pemasukan dan pengeluaranmu"
          icon={<ArrowUpDown size={24} className="text-blue-500" />}
        />

        {/* Search Bar and Filter Toggle */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Cari transaksi berdasarkan judul atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all outline-none placeholder-gray-600"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1A1A1A] border border-white/10 rounded-xl hover:bg-white/5 transition-all text-sm font-bold text-gray-300 hover:text-white cursor-pointer"
          >
            <Filter size={18} />
            <span>Filter</span>
            {hasActiveFilters && (
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#232323] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp size={20} className="text-green-500" />
              </div>
              <p className="text-gray-400 text-xs font-bold uppercase">Total Pemasukan</p>
            </div>
            <p className="text-2xl font-bold font-mono text-green-400">
              {formatCurrency(summary.income)}
            </p>
          </div>

          <div className="bg-[#232323] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <TrendingDown size={20} className="text-red-500" />
              </div>
              <p className="text-gray-400 text-xs font-bold uppercase">Total Pengeluaran</p>
            </div>
            <p className="text-2xl font-bold font-mono text-red-400">
              {formatCurrency(summary.expense)}
            </p>
          </div>

          <div className="bg-[#232323] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <ArrowUpDown size={20} className="text-blue-500" />
              </div>
              <p className="text-gray-400 text-xs font-bold uppercase">Saldo Bersih</p>
            </div>
            <p className={`text-2xl font-bold font-mono ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {summary.balance >= 0 ? '+' : ''}{formatCurrency(summary.balance)}
            </p>
          </div>
        </div>

        {/* Advanced Filter Panel */}
        {isFilterOpen && (
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-5 md:p-6 mb-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Date Range Start */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#121212] border border-white/5 hover:border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-blue-500 focus:outline-none [color-scheme:dark]"
                />
              </div>

              {/* Date Range End */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#121212] border border-white/5 hover:border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-blue-500 focus:outline-none [color-scheme:dark]"
                />
              </div>

              {/* Category Custom Multi-Select */}
              <div className="flex flex-col gap-2 relative category-dropdown">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Kategori
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="w-full bg-[#121212] border border-white/5 hover:border-white/10 rounded-xl px-4 py-3.5 text-sm text-left text-white flex justify-between items-center transition-colors"
                >
                  <span className={selectedCategories.length > 0 ? 'text-white' : 'text-gray-500'}>
                    {selectedCategories.length > 0
                      ? `${selectedCategories.length} Terpilih`
                      : 'Semua Kategori'}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Category Dropdown Menu */}
                {isCategoryOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl p-2 max-h-48 overflow-y-auto custom-scrollbar z-50">
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <label
                          key={category}
                          className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer text-sm text-gray-300"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category)}
                            onChange={() => toggleCategory(category)}
                            className="w-4 h-4 rounded border-white/20 bg-[#121212] text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                          />
                          <span>{category}</span>
                        </label>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-sm text-gray-500">
                        Belum ada kategori
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Wallet Custom Multi-Select */}
              <div className="flex flex-col gap-2 relative wallet-dropdown">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Wallet
                </label>
                <button
                  type="button"
                  onClick={() => setIsWalletOpen(!isWalletOpen)}
                  className="w-full bg-[#121212] border border-white/5 hover:border-white/10 rounded-xl px-4 py-3.5 text-sm text-left text-white flex justify-between items-center transition-colors"
                >
                  <span className={selectedWallets.length > 0 ? 'text-white' : 'text-gray-500'}>
                    {selectedWallets.length > 0
                      ? `${selectedWallets.length} Terpilih`
                      : 'Semua Wallet'}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform ${isWalletOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Wallet Dropdown Menu */}
                {isWalletOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl p-2 max-h-48 overflow-y-auto custom-scrollbar z-50">
                    {wallets.length > 0 ? (
                      wallets.map((wallet) => (
                        <label
                          key={wallet.id}
                          className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer text-sm text-gray-300"
                        >
                          <input
                            type="checkbox"
                            checked={selectedWallets.includes(wallet.id)}
                            onChange={() => toggleWallet(wallet.id)}
                            className="w-4 h-4 rounded border-white/20 bg-[#121212] text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                          />
                          <span>{wallet.icon} {wallet.name}</span>
                        </label>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-sm text-gray-500">
                        Belum ada wallet
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end items-center gap-3 mt-6 pt-5 border-t border-white/5">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <RotateCcw size={14} />
                Reset
              </button>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        )}

        {/* Export Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-sm font-medium"
          >
            <Download size={18} />
            Download CSV
          </button>
        </div>

        {/* Transactions Table */}
        <div className="bg-[#232323] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1a1a1a] border-b border-white/5">
                <tr className="text-gray-500">
                  <th className="px-6 py-4 font-medium">Tanggal</th>
                  <th className="px-6 py-4 font-medium">Judul</th>
                  <th className="px-6 py-4 font-medium">Kategori</th>
                  <th className="px-6 py-4 font-medium">Wallet</th>
                  <th className="px-6 py-4 font-medium text-right">Jumlah</th>
                  <th className="px-6 py-4 font-medium text-center w-16">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((t) => {
                    const wallet = wallets.find(w => w.id === t.wallet_id);
                    return (
                      <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 text-gray-300">
                          <div className="flex items-center gap-2">
                            <CalendarDays size={16} className="text-gray-500" />
                            {formatDate(t.date)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">{t.title}</p>
                          <p className={`text-xs mt-1 ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                            {t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{t.category}</td>
                        <td className="px-6 py-4">
                          {wallet ? (
                            <div className="flex items-center gap-2">
                              <span>{wallet.icon}</span>
                              <span className="text-gray-300">{wallet.name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className={`px-6 py-4 text-right font-bold font-mono pr-6 ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditTransaction(t)}
                              className="text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10 transition-colors p-2 rounded-lg"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(t)}
                              className="text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors p-2 rounded-lg"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <Filter size={48} className="mb-4 opacity-20" />
                        <p className="text-sm">Tidak ada transaksi yang sesuai dengan filter</p>
                        <button
                          onClick={clearFilters}
                          className="mt-2 text-blue-400 hover:text-blue-300 text-xs"
                        >
                          Reset Filter
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
        </div>
      </div>

      {/* Transaction Modal */}
      {isTransactionModalOpen && (
        <TransactionModal
          isOpen={isTransactionModalOpen}
          onClose={() => {
            setIsTransactionModalOpen(false);
            setEditingTransaction(null);
          }}
          onSuccess={handleSaveTransaction}
          initialData={editingTransaction}
          userId={user?.id}
          wallets={wallets}
        />
      )}
    </div>
  );
}
