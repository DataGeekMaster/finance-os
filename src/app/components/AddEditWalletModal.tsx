'use client';

import React, { useState } from 'react';
import { X, Loader2, Check } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Icon Options
const ICON_OPTIONS = [
  { emoji: '💵', label: 'Uang Tunai' },
  { emoji: '🏦', label: 'Bank' },
  { emoji: '📱', label: 'E-Wallet' },
  { emoji: '💳', label: 'Kartu' },
  { emoji: '🐷', label: 'Tabungan' },
  { emoji: '💎', label: 'Investasi' },
  { emoji: '💰', label: 'Dompet' },
  { emoji: '🏛️', label: 'Lembaga' },
];

// Color Options with predefined aesthetic colors
const COLOR_OPTIONS = [
  { hex: '#3B82F6', name: 'Blue (BCA)' },
  { hex: '#10B981', name: 'Green (GoPay)' },
  { hex: '#8B5CF6', name: 'Purple (OVO)' },
  { hex: '#F59E0B', name: 'Orange (Shopee)' },
  { hex: '#EF4444', name: 'Red (Kartu)' },
  { hex: '#06B6D4', name: 'Cyan (Dana)' },
  { hex: '#EC4899', name: 'Pink' },
  { hex: '#6366F1', name: 'Indigo' },
];

interface Wallet {
  id: string;
  name: string;
  balance: number;
  icon: string;
  color: string;
  is_active: boolean;
}

interface AddEditWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  wallet: Wallet | null;
  userId?: string;
}

export default function AddEditWalletModal({
  isOpen,
  onClose,
  onSuccess,
  wallet,
  userId,
}: AddEditWalletModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: wallet?.name || '',
    balance: wallet?.balance?.toString() || '',
    icon: wallet?.icon || '💵',
    color: wallet?.color || '#3B82F6',
  });

  const isEditing = !!wallet;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.balance) {
      alert('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    if (!userId) {
      alert('Login diperlukan untuk menyimpan data');
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        balance: Number(formData.balance),
        icon: formData.icon,
        color: formData.color,
        user_id: userId,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      let error;

      if (isEditing && wallet) {
        // Update existing wallet
        const result = await supabase
          .from('wallets')
          .update(payload)
          .eq('id', wallet.id)
          .select()
          .single();
        error = result.error;
      } else {
        // Insert new wallet
        payload.created_at = new Date().toISOString();
        const result = await supabase
          .from('wallets')
          .insert([payload])
          .select()
          .single();
        error = result.error;
      }

      if (error) throw error;

      onSuccess();
    } catch (error: any) {
      alert('Gagal menyimpan: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClass =
    'w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all text-sm';
  const labelClass =
    'block text-[11px] text-gray-400 mb-1.5 uppercase font-bold tracking-wider';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-[#252525] rounded-t-3xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-2xl">{formData.icon}</span>
            {isEditing ? 'Edit Dompet' : 'Tambah Dompet Baru'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white bg-white/5 p-1.5 rounded-full hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Input */}
            <div>
              <label className={labelClass}>Nama Dompet *</label>
              <input
                type="text"
                required
                className={inputClass}
                placeholder="Contoh: BCA, GoPay, Tunai"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Balance Input */}
            <div>
              <label className={labelClass}>Saldo {isEditing ? 'Saat Ini' : 'Awal'} (IDR) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono">
                  Rp
                </span>
                <input
                  type="number"
                  required
                  className={`${inputClass} pl-10`}
                  placeholder="0"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                />
              </div>
            </div>

            {/* Icon Selector */}
            <div>
              <label className={labelClass}>Ikon</label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((option) => (
                  <button
                    key={option.emoji}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: option.emoji })}
                    className={`relative p-3 rounded-xl transition-all ${
                      formData.icon === option.emoji
                        ? 'bg-blue-600/20 border-2 border-blue-500'
                        : 'bg-[#151515] border-2 border-white/5 hover:border-white/10'
                    }`}
                    title={option.label}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    {formData.icon === option.emoji && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selector */}
            <div>
              <label className={labelClass}>Warna Tema</label>
              <div className="flex flex-wrap gap-3">
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.hex}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: option.hex })}
                    className={`relative w-10 h-10 rounded-full transition-all ${
                      formData.color === option.hex
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1E1E1E] scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: option.hex }}
                    title={option.name}
                  >
                    {formData.color === option.hex && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check size={16} className="text-white drop-shadow-lg" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full font-bold py-3.5 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg ${
                isEditing
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/20 text-white'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-900/20 text-white'
              }`}
            >
              {isLoading && <Loader2 className="animate-spin" size={18} />}
              {isLoading ? 'Menyimpan...' : isEditing ? 'Update Dompet' : 'Buat Dompet'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
