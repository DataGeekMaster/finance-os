'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Loader2, ChevronDown, Check } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_ASSET_TYPES = [
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

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (asset: Asset, trade: Trade) => void;
  existingAssets: Asset[];
  userId?: string;
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  existingAssets,
  userId,
}: AddTransactionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    ticker: '',
    name: '',
    asset_type: 'Stock',
    sector: '',
    transaction_type: 'BUY' as 'BUY' | 'SELL',
    quantity: '',
    price: '',
    fee: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Toggle states
  const [useExistingAsset, setUseExistingAsset] = useState(false);
  const [isHistoricalData, setIsHistoricalData] = useState(false);

  // Dropdown states
  const [sectorOptions, setSectorOptions] = useState<string[]>([]);
  const [assetTypeOptions, setAssetTypeOptions] = useState<string[]>(DEFAULT_ASSET_TYPES);
  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false);
  const [isAssetTypeDropdownOpen, setIsAssetTypeDropdownOpen] = useState(false);
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  
  const sectorInputRef = useRef<HTMLInputElement>(null);
  const assetTypeInputRef = useRef<HTMLInputElement>(null);
  const assetDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSectorOptions();
      fetchAssetTypeOptions();
      resetForm();
    }
  }, [isOpen]);

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

  const fetchAssetTypeOptions = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('assets')
      .select('asset_type')
      .eq('user_id', userId)
      .not('asset_type', 'is', null);

    if (!error && data) {
      const uniqueTypes = Array.from(
        new Set([...DEFAULT_ASSET_TYPES, ...data.map((item) => item.asset_type).filter(Boolean)])
      ) as string[];
      setAssetTypeOptions(uniqueTypes);
    }
  };

  const resetForm = () => {
    setFormData({
      ticker: '',
      name: '',
      asset_type: 'Stock',
      sector: '',
      transaction_type: 'BUY',
      quantity: '',
      price: '',
      fee: '',
      date: new Date().toISOString().split('T')[0],
    });
    setUseExistingAsset(false);
    setIsHistoricalData(false);
  };

  const handleSelectExistingAsset = (asset: Asset) => {
    setFormData({
      ...formData,
      ticker: asset.ticker,
      name: asset.name,
      asset_type: asset.asset_type,
      sector: asset.sector,
    });
    setIsAssetDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.ticker || !formData.name || !formData.quantity || !formData.price) {
      alert('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    if (!userId) {
      alert('Anda harus login untuk menyimpan data');
      return;
    }

    setIsLoading(true);

    try {
      const tickerUpper = formData.ticker.toUpperCase();
      
      // Step 1: Check if asset already exists
      const existingAsset = existingAssets.find(a => a.ticker === tickerUpper);
      let assetId: string;

      if (existingAsset) {
        // Asset exists, use existing ID
        assetId = existingAsset.id;
      } else {
        // Asset doesn't exist, create new asset first
        const assetPayload = {
          ticker: tickerUpper,
          name: formData.name,
          asset_type: formData.asset_type,
          sector: formData.sector || 'General',
          current_price: Number(formData.price),
          user_id: userId,
          class: 'stock',
          updated_at: new Date().toISOString(),
        };

        const { data: assetData, error: assetError } = await supabase
          .from('assets')
          .insert([assetPayload])
          .select()
          .single();

        if (assetError) throw assetError;
        assetId = assetData.id;
      }

      // Step 2: Insert trade transaction
      const tradePayload = {
        asset_id: assetId,
        type: formData.transaction_type,
        quantity: Number(formData.quantity),
        price: Number(formData.price),
        fee: Number(formData.fee) || 0,
        date: formData.date,
        user_id: userId,
      };

      const { data: tradeData, error: tradeError } = await supabase
        .from('trades')
        .insert([tradePayload])
        .select()
        .single();

      if (tradeError) throw tradeError;

      // Step 3: Update asset current price if it's a new asset
      if (!existingAsset) {
        const asset = existingAssets.find(a => a.id === assetId);
        if (asset) {
          onSuccess(asset, tradeData as Trade);
        } else {
          const newAsset: Asset = {
            id: assetId,
            ticker: tickerUpper,
            name: formData.name,
            asset_type: formData.asset_type,
            sector: formData.sector || 'General',
            current_price: Number(formData.price),
          };
          onSuccess(newAsset, tradeData as Trade);
        }
      } else {
        onSuccess(existingAsset, tradeData as Trade);
      }
      
      resetForm();
      onClose();
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

  const filteredSectorOptions = sectorOptions.filter((option) =>
    option.toLowerCase().includes(formData.sector.toLowerCase())
  );

  const filteredAssetTypeOptions = assetTypeOptions.filter((option) =>
    option.toLowerCase().includes(formData.asset_type.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl relative flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-[#252525] rounded-t-3xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus size={18} className="text-blue-500" />
            Tambah Transaksi
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
            {/* Select Existing Asset Toggle */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={useExistingAsset}
                    onChange={(e) => {
                      setUseExistingAsset(e.target.checked);
                      if (!e.target.checked) {
                        setFormData({ ...formData, ticker: '', name: '', asset_type: 'Stock', sector: '' });
                      }
                    }}
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${useExistingAsset ? 'bg-blue-600' : 'bg-gray-600'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${useExistingAsset ? 'left-5' : 'left-1'}`} />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">Pilih dari aset yang sudah ada</span>
                  <span className="text-[10px] text-gray-500">Gunakan data aset yang tersimpan</span>
                </div>
              </label>
            </div>

            {/* Asset Selection (Conditional) */}
            {useExistingAsset ? (
              <div className="relative" ref={assetDropdownRef}>
                <label className={labelClass}>Pilih Aset *</label>
                <button
                  type="button"
                  onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                  className={`w-full ${inputClass} flex items-center justify-between text-left`}
                >
                  <span className={formData.ticker ? 'text-white' : 'text-gray-600'}>
                    {formData.ticker ? `${formData.ticker} - ${formData.name}` : 'Pilih aset...'}
                  </span>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>
                {isAssetDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-[#151515] border border-white/10 rounded-xl max-h-60 overflow-y-auto shadow-xl">
                    {existingAssets.length > 0 ? (
                      existingAssets.map((asset) => (
                        <button
                          key={asset.id}
                          type="button"
                          className="w-full text-left px-3 py-3 hover:bg-white/5 transition-colors first:rounded-t-xl last:rounded-b-xl border-b border-white/5 last:border-0"
                          onClick={() => handleSelectExistingAsset(asset)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white">{asset.ticker}</span>
                            {formData.ticker === asset.ticker && (
                              <Check size={14} className="text-green-500" />
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{asset.name}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-sm text-gray-500">
                        Belum ada aset tersimpan
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Ticker */}
                <div>
                  <label className={labelClass}>Ticker / Kode *</label>
                  <input
                    type="text"
                    required
                    className={inputClass}
                    placeholder="Contoh: BBCA, TLKM, BTC"
                    value={formData.ticker}
                    onChange={(e) =>
                      setFormData({ ...formData, ticker: e.target.value })
                    }
                  />
                  {existingAssets.find(a => a.ticker === formData.ticker.toUpperCase()) && (
                    <p className="text-[10px] text-green-400 mt-1 flex items-center gap-1">
                      ✓ Aset sudah ada, akan menambah transaksi
                    </p>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className={labelClass}>Nama Aset *</label>
                  <input
                    type="text"
                    required
                    className={inputClass}
                    placeholder="Contoh: Bank Central Asia, Bitcoin"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            {/* Asset Type (Creatable Combobox) */}
            <div className="relative">
              <label className={labelClass}>Tipe Aset *</label>
              <input
                ref={assetTypeInputRef}
                type="text"
                className={inputClass}
                placeholder="Pilih atau ketik tipe aset baru"
                value={formData.asset_type}
                onChange={(e) => {
                  setFormData({ ...formData, asset_type: e.target.value });
                  setIsAssetTypeDropdownOpen(true);
                }}
                onFocus={() => setIsAssetTypeDropdownOpen(true)}
                readOnly={useExistingAsset}
              />
              <button
                type="button"
                onClick={() => setIsAssetTypeDropdownOpen(!isAssetTypeDropdownOpen)}
                className="absolute right-3 top-[34px] text-gray-500 hover:text-white"
              >
                <ChevronDown size={16} />
              </button>
              {isAssetTypeDropdownOpen && filteredAssetTypeOptions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-[#151515] border border-white/10 rounded-xl max-h-48 overflow-y-auto shadow-xl">
                  {filteredAssetTypeOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors first:rounded-t-xl last:rounded-b-xl"
                      onClick={() => {
                        setFormData({ ...formData, asset_type: option });
                        setIsAssetTypeDropdownOpen(false);
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-gray-500 mt-1">
                Pilih dari daftar atau ketik manual untuk tipe baru
              </p>
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
                readOnly={useExistingAsset}
              />
              <button
                type="button"
                onClick={() => setIsSectorDropdownOpen(!isSectorDropdownOpen)}
                className="absolute right-3 top-[34px] text-gray-500 hover:text-white"
              >
                <ChevronDown size={16} />
              </button>
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
                Pilih dari daftar atau ketik manual untuk sektor baru
              </p>
            </div>

            {/* Transaction Type */}
            <div>
              <label className={labelClass}>Tipe Transaksi *</label>
              <div className="grid grid-cols-2 gap-2">
                {(['BUY', 'SELL'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, transaction_type: type })}
                    className={`py-2.5 text-sm font-bold rounded-xl transition-all border ${
                      formData.transaction_type === type
                        ? type === 'BUY'
                          ? 'bg-green-600 text-white border-green-500'
                          : 'bg-red-600 text-white border-red-500'
                        : 'bg-[#151515] text-gray-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {type === 'BUY' ? 'BELI' : 'JUAL'}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity and Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Jumlah *</label>
                <input
                  type="number"
                  required
                  step="0.00000001"
                  className={inputClass}
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Harga per Unit (IDR) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono">
                    Rp
                  </span>
                  <input
                    type="number"
                    required
                    className={`${inputClass} pl-10`}
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Broker Fee */}
            <div>
              <label className={labelClass}>Broker Fee (IDR)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono">
                  Rp
                </span>
                <input
                  type="number"
                  className={`${inputClass} pl-10`}
                  placeholder="0"
                  value={formData.fee}
                  onChange={(e) =>
                    setFormData({ ...formData, fee: e.target.value })
                  }
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Fee transaksi broker (opsional)
              </p>
            </div>

            {/* Date */}
            <div>
              <label className={labelClass}>Tanggal *</label>
              <input
                type="date"
                required
                className={inputClass}
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>

            {/* Historical Data Checkbox - Only show for BUY transactions */}
            {formData.transaction_type === 'BUY' && (
              <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30">
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative flex items-center mt-0.5">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-amber-500/50 bg-[#151515] text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                      checked={isHistoricalData}
                      onChange={(e) => setIsHistoricalData(e.target.checked)}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-amber-400">Input Data Lama / Historis</span>
                    <span className="text-[10px] text-amber-200/70">
                      Jangan potong saldo arus kas. Hanya mencatat data aset dan trade tanpa mempengaruhi saldo wallet.
                    </span>
                  </div>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full font-bold py-3 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg ${
                formData.transaction_type === 'BUY'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-900/20 text-white'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-900/20 text-white'
              }`}
            >
              {isLoading && <Loader2 className="animate-spin" size={18} />}
              {isLoading ? 'Menyimpan...' : 'SIMPAN TRANSAKSI'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
