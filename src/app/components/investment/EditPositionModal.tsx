'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Edit2, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const ASSET_TYPES = [
  'Stock',
  'Mutual Fund',
  'Bond',
  'Deposit',
  'Crypto',
  'Gold',
  'ETF',
  'Others',
];

interface Asset {
  id: string;
  ticker: string;
  name: string;
  asset_type: string;
  sector: string;
  current_price: number;
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

interface EditPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  position: PortfolioPosition | null;
  userId?: string;
}

export default function EditPositionModal({
  isOpen,
  onClose,
  onSuccess,
  position,
  userId,
}: EditPositionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    asset_type: 'Stock',
    sector: '',
    quantity: '',
    avgBuyPrice: '',
    totalFee: '',
  });

  const [sectorOptions, setSectorOptions] = useState<string[]>([]);
  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false);
  const sectorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && position) {
      fetchSectorOptions();
      // Initialize form with position data
      setFormData({
        name: position.asset.name,
        asset_type: position.asset.asset_type,
        sector: position.asset.sector,
        quantity: position.quantity.toString(),
        avgBuyPrice: position.avgBuyPrice.toString(),
        totalFee: '0', // Will be calculated from trades
      });
    }
  }, [isOpen, position]);

  const fetchSectorOptions = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('assets')
      .select('sector')
      .eq('user_id', userId)
      .not('sector', 'is', null);

    if (!error && data) {
      const uniqueSectors = Array.from(
        new Set(data.map((item) => item.sector).filter(Boolean))
      ) as string[];
      setSectorOptions(uniqueSectors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!position || !userId) {
      alert('Data tidak valid');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Update asset information (name, type, sector)
      const assetPayload = {
        name: formData.name,
        asset_type: formData.asset_type,
        sector: formData.sector,
        updated_at: new Date().toISOString(),
      };

      const { error: assetError } = await supabase
        .from('assets')
        .update(assetPayload)
        .eq('id', position.asset.id);

      if (assetError) throw assetError;

      // Step 2: Delete all existing trades for this asset
      const { error: deleteError } = await supabase
        .from('trades')
        .delete()
        .eq('asset_id', position.asset.id)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Step 3: Insert ONE consolidated BUY trade with new values
      const consolidatedTrade = {
        asset_id: position.asset.id,
        type: 'BUY' as const,
        quantity: Number(formData.quantity),
        price: Number(formData.avgBuyPrice),
        fee: Number(formData.totalFee) || 0,
        date: new Date().toISOString().split('T')[0],
        user_id: userId,
      };

      const { error: insertError } = await supabase
        .from('trades')
        .insert([consolidatedTrade]);

      if (insertError) throw insertError;

      onSuccess();
      onClose();
    } catch (error: any) {
      alert('Gagal menyimpan: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !position) return null;

  const inputClass =
    'w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all text-sm';
  const labelClass =
    'block text-[11px] text-gray-400 mb-1.5 uppercase font-bold tracking-wider';

  // Filter sector options based on input
  const filteredSectorOptions = sectorOptions.filter((option) =>
    option.toLowerCase().includes(formData.sector.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl relative flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-[#252525] rounded-t-3xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Edit2 size={18} className="text-yellow-500" />
            Edit Posisi: {position.asset.ticker}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white bg-white/5 p-1.5 rounded-full hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Ticker (Read-only) */}
            <div>
              <label className={labelClass}>Ticker</label>
              <input
                type="text"
                disabled
                className={`${inputClass} opacity-50 cursor-not-allowed`}
                value={position.asset.ticker}
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Ticker tidak dapat diubah
              </p>
            </div>

            {/* Name */}
            <div>
              <label className={labelClass}>Nama Aset *</label>
              <input
                type="text"
                required
                className={inputClass}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            {/* Asset Type */}
            <div>
              <label className={labelClass}>Tipe Aset *</label>
              <select
                className={inputClass}
                value={formData.asset_type}
                onChange={(e) =>
                  setFormData({ ...formData, asset_type: e.target.value })
                }
              >
                {ASSET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Sector (Creatable Select) */}
            <div className="relative">
              <label className={labelClass}>Sektor</label>
              <input
                ref={sectorInputRef}
                type="text"
                className={inputClass}
                placeholder="Pilih atau ketik sektor baru"
                value={formData.sector}
                onChange={(e) => {
                  setFormData({ ...formData, sector: e.target.value });
                  setIsSectorDropdownOpen(true);
                }}
                onFocus={() => setIsSectorDropdownOpen(true)}
              />
              {isSectorDropdownOpen && filteredSectorOptions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-[#151515] border border-white/10 rounded-xl max-h-48 overflow-y-auto shadow-xl">
                  {filteredSectorOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors first:rounded-t-xl last:rounded-b-xl"
                      onClick={() => {
                        setFormData({ ...formData, sector: option });
                        setIsSectorDropdownOpen(false);
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-gray-500 mt-1">
                Pilih dari daftar atau ketik manual
              </p>
            </div>

            {/* Total Quantity */}
            <div>
              <label className={labelClass}>Total Quantity *</label>
              <input
                type="number"
                required
                step="0.00000001"
                className={inputClass}
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Total unit yang dimiliki saat ini
              </p>
            </div>

            {/* Average Buy Price */}
            <div>
              <label className={labelClass}>Harga Rata-rata Beli (IDR) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono">
                  Rp
                </span>
                <input
                  type="number"
                  required
                  className={`${inputClass} pl-10`}
                  value={formData.avgBuyPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, avgBuyPrice: e.target.value })
                  }
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Harga rata-rata per unit saat membeli
              </p>
            </div>

            {/* Total Broker Fee */}
            <div>
              <label className={labelClass}>Total Broker Fee (IDR)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono">
                  Rp
                </span>
                <input
                  type="number"
                  className={`${inputClass} pl-10`}
                  value={formData.totalFee}
                  onChange={(e) =>
                    setFormData({ ...formData, totalFee: e.target.value })
                  }
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Total fee dari semua transaksi
              </p>
            </div>

            {/* Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-[10px] text-yellow-400">
                ⚠️ <strong>Perhatian:</strong> Mengedit posisi ini akan menghapus semua riwayat transaksi dan menggantinya dengan satu transaksi terkonsolidasi.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-yellow-900/20"
            >
              {isLoading && <Loader2 className="animate-spin" size={18} />}
              {isLoading ? 'Menyimpan...' : 'SIMPAN PERUBAHAN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
