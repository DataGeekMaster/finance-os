'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Wallet,
  Plus,
  Loader2,
  Trash2,
  Edit2,
  PiggyBank,
  CreditCard,
  Smartphone,
  Banknote,
  Gem,
  Building,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import AddEditWalletModal from '../components/AddEditWalletModal';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface WalletData {
  id: string;
  name: string;
  balance: number;
  icon: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export default function WalletsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletData | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (user) {
      fetchWallets();
    }
  }, [user]);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    setLoading(false);
  };

  const fetchWallets = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wallets:', error);
      return;
    }

    setWallets(data || []);
  };

  const handleAddWallet = () => {
    setEditingWallet(null);
    setIsModalOpen(true);
  };

  const handleEditWallet = (wallet: WalletData) => {
    setEditingWallet(wallet);
    setIsModalOpen(true);
  };

  const handleDeleteWallet = async (wallet: WalletData) => {
    if (!confirm(`Yakin ingin menghapus dompet "${wallet.name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      // Soft delete - set is_active to false
      const { error } = await supabase
        .from('wallets')
        .update({ is_active: false })
        .eq('id', wallet.id);

      if (error) throw error;

      // Remove from local state
      setWallets(prev => prev.filter(w => w.id !== wallet.id));
    } catch (error: any) {
      alert('Gagal menghapus: ' + (error.message || 'Unknown error'));
    }
  };

  const handleModalSuccess = () => {
    fetchWallets();
    setIsModalOpen(false);
    setEditingWallet(null);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const getIconComponent = (icon: string) => {
    const iconMap: Record<string, React.ElementType> = {
      '💵': PiggyBank,
      '🏦': Building,
      '📱': Smartphone,
      '💳': CreditCard,
      '🐷': PiggyBank,
      '💎': Gem,
      '💰': Banknote,
      '🏛️': Building,
    };
    return iconMap[icon] || Wallet;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#191919] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

  return (
    <div className="min-h-screen bg-[#191919] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <PageHeader
          title="Manajemen Dompet"
          subtitle="Kelola daftar rekening bank, e-wallet, dan uang tunai Anda"
          icon={<Wallet size={24} className="text-blue-500" />}
          actionElement={
            <button
              onClick={handleAddWallet}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20"
            >
              <Plus size={18} />
              <span className="hidden md:inline">Tambah Dompet</span>
            </button>
          }
        />

        {/* Total Balance Summary */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Wallet size={20} className="text-blue-400" />
            </div>
            <p className="text-gray-400 text-sm font-bold uppercase">Total Saldo Keseluruhan</p>
          </div>
          <p className="text-3xl font-bold font-mono text-white">
            {formatCurrency(totalBalance)}
          </p>
        </div>

        {/* Wallets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.length > 0 ? (
            wallets.map((wallet) => {
              const IconComponent = getIconComponent(wallet.icon);
              return (
                <div
                  key={wallet.id}
                  className="relative bg-[#232323] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all group overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${wallet.color}15 0%, #232323 100%)`,
                  }}
                >
                  {/* Color Accent Border */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                    style={{ backgroundColor: wallet.color }}
                  />

                  {/* Action Buttons */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditWallet(wallet)}
                      className="p-1.5 bg-white/5 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 rounded-lg transition-all"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteWallet(wallet)}
                      className="p-1.5 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-all"
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Icon */}
                  <div className="mb-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${wallet.color}20` }}
                    >
                      <span>{wallet.icon}</span>
                    </div>
                  </div>

                  {/* Wallet Name */}
                  <h3 className="text-lg font-bold text-white mb-1">{wallet.name}</h3>

                  {/* Balance */}
                  <p className="text-2xl font-bold font-mono text-white mb-2">
                    {formatCurrency(wallet.balance)}
                  </p>

                  {/* Color Dot Indicator */}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: wallet.color }}
                    />
                    <span className="text-xs text-gray-500">Aktif</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full bg-[#232323] border border-white/5 rounded-2xl p-12 text-center">
              <Wallet size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-500 text-sm mb-1">Belum ada dompet tersimpan</p>
              <p className="text-gray-600 text-xs mb-4">Mulai kelola keuanganmu dengan menambahkan dompet pertama</p>
              <button
                onClick={handleAddWallet}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 mx-auto font-medium text-sm"
              >
                <Plus size={16} />
                Tambah Dompet Pertama
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Wallet Modal */}
      {isModalOpen && (
        <AddEditWalletModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingWallet(null);
          }}
          onSuccess={handleModalSuccess}
          wallet={editingWallet}
          userId={user?.id}
        />
      )}
    </div>
  );
}
