'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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

interface Transaction {
  id?: string;
  title: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  category: string;
  financial_tag?: 'needs' | 'wants' | 'savings' | 'liabilities' | null;
  wallet_id?: string;
}

interface Wallet {
  id: string;
  name: string;
  icon: string;
  balance?: number;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (t: Transaction, action: 'create' | 'update') => void;
  initialData?: Transaction | null;
  userId?: string;
  wallets: Wallet[];
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
  userId,
  wallets = []
}: TransactionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as 'income' | 'expense',
    category: EXPENSE_CATEGORIES[0],
    financial_tag: 'needs' as 'needs' | 'wants' | 'savings' | 'liabilities' | '',
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

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setFormData(prev => ({
      ...prev,
      type: newType,
      financial_tag: newType === 'income' ? '' : 'needs',
      category: newType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.title || !formData.amount) throw new Error("Mohon lengkapi data");
      if (!formData.wallet_id) throw new Error("Pilih dompet/sumber dana terlebih dahulu");

      if (!userId) {
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

      let data, error;

      if (isEditMode && initialData?.id) {
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

    } catch (error: any) {
      alert('Gagal menyimpan: ' + (error.message || 'Unknown error'));
      setIsLoading(false);
    }
  };

  const inputClass = "w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all text-sm";
  const labelClass = "block text-[11px] text-gray-400 mb-1.5 uppercase font-bold tracking-wider";

  const currentCategories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl relative flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-[#252525] rounded-t-3xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {isEditMode ? <Edit2 size={18} className="text-yellow-500" /> : <Plus size={18} className="text-blue-500" />}
            {isEditMode ? 'Edit Transaksi' : 'Tambah Transaksi'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white bg-white/5 p-1.5 rounded-full hover:bg-white/10">
            <X size={18} />
          </button>
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
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    formData.type === t
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
                  type="number" required 
                  className={`${inputClass} pl-10 text-lg font-mono tracking-wide`}
                  value={formData.amount} 
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Judul</label>
                <input 
                  type="text" required 
                  className={inputClass} 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                />
              </div>
              <div>
                <label className={labelClass}>Tanggal</label>
                <input 
                  type="date" required 
                  className={`${inputClass} [color-scheme:dark]`} 
                  value={formData.date} 
                  onChange={e => setFormData({ ...formData, date: e.target.value })} 
                />
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
                    {w.icon} {w.name} (Saldo: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(w.balance || 0)})
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
                  {currentCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {formData.type === 'expense' && (
                <div>
                  <label className={labelClass}>Tag Keuangan</label>
                  <select 
                    required 
                    className={`${inputClass} border-l-4 border-l-blue-500`} 
                    value={formData.financial_tag} 
                    onChange={e => setFormData({ ...formData, financial_tag: e.target.value as any })}
                  >
                    <option value="needs">Needs (Kebutuhan)</option>
                    <option value="wants">Wants (Keinginan)</option>
                    <option value="savings">Savings (Tabungan)</option>
                    <option value="liabilities">Liabilities (Utang)</option>
                  </select>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className={`w-full font-bold py-3.5 rounded-xl mt-6 transition-all disabled:opacity-50 ${
                formData.type === 'income' 
                  ? 'bg-green-600 hover:bg-green-500 text-white' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {isLoading ? 'Menyimpan...' : (isEditMode ? 'Update Transaksi' : 'Simpan Transaksi')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
