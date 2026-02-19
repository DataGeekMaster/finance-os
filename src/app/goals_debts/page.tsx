'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Target,
  CreditCard,
  Plus,
  TrendingUp,
  CalendarDays,
  Loader2,
  Trash2,
  PiggyBank,
  Wallet,
  X,
  Edit2,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  emoji: string;
  due_date?: string;
  created_at: string;
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

interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  category: string;
}

export default function GoalsDebtsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Modal states
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

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

    // Fetch goals
    const { data: goalsData, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (goalsError) {
      console.error('Error fetching goals:', goalsError);
      return;
    }

    // Fetch debts
    const { data: debtsData, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });

    if (debtsError) {
      console.error('Error fetching debts:', debtsError);
      return;
    }

    // Fetch transactions for savings rate calculation
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(100);

    if (txError) {
      console.error('Error fetching transactions:', txError);
      return;
    }

    setGoals(goalsData || []);
    setDebts(debtsData || []);
    setTransactions(txData || []);
  };

  // Calculate monthly savings rate for ETA
  const monthlySavingsRate = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    
    const savingsTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      return t.type === 'income' && 
             t.category.includes('Tabungan') && 
             txDate >= sixMonthsAgo;
    });

    const totalSavings = savingsTransactions.reduce((acc, t) => acc + t.amount, 0);
    return totalSavings / 6; // Average per month
  }, [transactions]);

  // Calculate ETA for goals
  const calculateETA = (goal: Goal) => {
    if (!goal.target_amount || goal.target_amount <= goal.current_amount) return null;
    if (!monthlySavingsRate || monthlySavingsRate <= 0) return null;

    const remaining = goal.target_amount - goal.current_amount;
    const monthsNeeded = Math.ceil(remaining / monthlySavingsRate);
    const etaDate = new Date();
    etaDate.setMonth(etaDate.getMonth() + monthsNeeded);

    return {
      months: monthsNeeded,
      date: etaDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    };
  };

  // Delete handlers
  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Yakin ingin menghapus target ini?')) return;

    try {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (error: any) {
      alert('Gagal menghapus: ' + error.message);
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsGoalModalOpen(true);
  };

  const handleDeleteDebt = async (id: string) => {
    if (!confirm('Yakin ingin menghapus utang/piutang ini?')) return;

    try {
      const { error } = await supabase.from('debts').delete().eq('id', id);
      if (error) throw error;
      setDebts(prev => prev.filter(d => d.id !== id));
    } catch (error: any) {
      alert('Gagal menghapus: ' + error.message);
    }
  };

  const handleEditDebt = (debt: Debt) => {
    setEditingDebt(debt);
    setIsDebtModalOpen(true);
  };

  // Quick add handlers
  const openQuickAddGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsQuickAddModalOpen(true);
  };

  const openQuickAddDebt = (debt: Debt) => {
    setSelectedDebt(debt);
    setIsQuickAddModalOpen(true);
  };

  const handleQuickAdd = async (amount: number) => {
    if (!user) return;

    try {
      if (selectedGoal) {
        // Add to goal
        const newAmount = selectedGoal.current_amount + amount;
        const { error } = await supabase
          .from('goals')
          .update({ current_amount: newAmount })
          .eq('id', selectedGoal.id);

        if (error) throw error;

        // Also create transaction
        const txPayload = {
          user_id: user.id,
          title: `Tabungan: ${selectedGoal.name}`,
          amount: amount,
          date: new Date().toISOString().split('T')[0],
          type: 'expense' as const,
          category: 'Tabungan & Investasi',
          financial_tag: 'savings'
        };
        await supabase.from('transactions').insert([txPayload]);

        setGoals(prev => prev.map(g => 
          g.id === selectedGoal.id ? { ...g, current_amount: newAmount } : g
        ));
      } else if (selectedDebt) {
        // Pay debt
        const newPaidAmount = selectedDebt.paid_amount + amount;
        const { error } = await supabase
          .from('debts')
          .update({ paid_amount: newPaidAmount })
          .eq('id', selectedDebt.id);

        if (error) throw error;

        // Also create transaction
        const txPayload = {
          user_id: user.id,
          title: `Pembayaran: ${selectedDebt.name}`,
          amount: amount,
          date: new Date().toISOString().split('T')[0],
          type: 'expense' as const,
          category: selectedDebt.type === 'payable' ? 'Cicilan Utang' : 'Piutang',
          financial_tag: 'liabilities'
        };
        await supabase.from('transactions').insert([txPayload]);

        setDebts(prev => prev.map(d => 
          d.id === selectedDebt.id ? { ...d, paid_amount: newPaidAmount } : d
        ));
      }

      setIsQuickAddModalOpen(false);
      setSelectedGoal(null);
      setSelectedDebt(null);
    } catch (error: any) {
      alert('Gagal menyimpan: ' + error.message);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

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
          title="Target & Kewajiban"
          subtitle="Kelola tabungan impian dan daftar utangmu"
          icon={<Target size={24} className="text-blue-500" />}
        />

        {/* Goals Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <PiggyBank size={24} className="text-green-500" />
              Target Keuangan
            </h2>
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              Target Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.length > 0 ? (
              goals.map((goal) => {
                const progress = (goal.current_amount / goal.target_amount) * 100;
                const eta = calculateETA(goal);
                return (
                  <div
                    key={goal.id}
                    className="bg-[#232323] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{goal.emoji}</div>
                        <div>
                          <h3 className="font-bold text-white">{goal.name}</h3>
                          {goal.due_date && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <CalendarDays size={12} />
                              Target: {new Date(goal.due_date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditGoal(goal)}
                          className="p-1.5 text-gray-500 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-1.5 text-gray-600 hover:text-red-500 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-white font-bold">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Amount Info */}
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Terkumpul</p>
                        <p className="text-sm font-mono font-bold text-green-400">
                          {formatCurrency(goal.current_amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Target</p>
                        <p className="text-sm font-mono font-bold text-white">
                          {formatCurrency(goal.target_amount)}
                        </p>
                      </div>
                    </div>

                    {/* ETA */}
                    {eta && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 mb-3">
                        <p className="text-[10px] text-blue-400 flex items-center gap-1">
                          <TrendingUp size={12} />
                          Estimasi Tercapai: {eta.date}
                        </p>
                        <p className="text-[9px] text-blue-500 mt-0.5">
                          ({eta.months} bulan lagi dengan tabungan {formatCurrency(monthlySavingsRate)}/bulan)
                        </p>
                      </div>
                    )}

                    {/* Quick Add Button */}
                    <button
                      onClick={() => openQuickAddGoal(goal)}
                      className="w-full bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Plus size={16} />
                      Tambah Tabungan
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full bg-[#232323] border border-white/5 rounded-2xl p-8 text-center">
                <PiggyBank size={48} className="mx-auto mb-3 text-gray-600" />
                <p className="text-gray-500 text-sm">Belum ada target keuangan</p>
                <p className="text-gray-600 text-xs mt-1">Mulai menabung untuk impian Anda!</p>
              </div>
            )}
          </div>
        </div>

        {/* Debts Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard size={24} className="text-red-500" />
              Utang & Piutang
            </h2>
            <button
              onClick={() => setIsDebtModalOpen(true)}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              Tambah Utang
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {debts.length > 0 ? (
              debts.map((debt) => {
                const progress = (debt.paid_amount / debt.total_amount) * 100;
                const remaining = debt.total_amount - debt.paid_amount;
                const isPayable = debt.type === 'payable';

                return (
                  <div
                    key={debt.id}
                    className={`bg-[#232323] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all ${
                      isPayable ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-green-500'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-white">{debt.name}</h3>
                        <p className={`text-xs mt-1 ${isPayable ? 'text-red-400' : 'text-green-400'}`}>
                          {isPayable ? 'Harus Dibayar' : 'Piutang'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditDebt(debt)}
                          className="p-1.5 text-gray-500 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => openQuickAddDebt(debt)}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                          title="Tambah Pembayaran"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteDebt(debt.id)}
                          className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-400">Terbayar</span>
                        <span className="text-white font-bold">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isPayable ? 'bg-gradient-to-r from-red-500 to-orange-400' : 'bg-gradient-to-r from-green-500 to-emerald-400'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Amount Info */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Total Utang</p>
                        <p className="text-sm font-mono font-bold text-white">
                          {formatCurrency(debt.total_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Sisa</p>
                        <p className={`text-sm font-mono font-bold ${isPayable ? 'text-red-400' : 'text-green-400'}`}>
                          {formatCurrency(remaining)}
                        </p>
                      </div>
                    </div>

                    {/* Due Date */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <CalendarDays size={14} />
                      Jatuh Tempo: {new Date(debt.due_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>

                    {/* Notes */}
                    {debt.notes && (
                      <div className="bg-white/5 rounded-lg p-2 text-xs text-gray-400">
                        {debt.notes}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-full bg-[#232323] border border-white/5 rounded-2xl p-8 text-center">
                <CreditCard size={48} className="mx-auto mb-3 text-gray-600" />
                <p className="text-gray-500 text-sm">Belum ada utang/piutang</p>
                <p className="text-gray-600 text-xs mt-1">Bebas utang, hidup lebih tenang!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      {isQuickAddModalOpen && (
        <QuickAddModal
          isOpen={isQuickAddModalOpen}
          onClose={() => {
            setIsQuickAddModalOpen(false);
            setSelectedGoal(null);
            setSelectedDebt(null);
          }}
          onSubmit={handleQuickAdd}
          target={selectedGoal || selectedDebt}
          isGoal={!!selectedGoal}
        />
      )}

      {/* Goal Modal */}
      {isGoalModalOpen && (
        <GoalModal
          isOpen={isGoalModalOpen}
          onClose={() => {
            setIsGoalModalOpen(false);
            setEditingGoal(null);
          }}
          onSuccess={(goal) => {
            if (editingGoal) {
              setGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
            } else {
              setGoals(prev => [goal, ...prev]);
            }
            setIsGoalModalOpen(false);
            setEditingGoal(null);
          }}
          goal={editingGoal}
          userId={user?.id}
        />
      )}

      {/* Debt Modal */}
      {isDebtModalOpen && (
        <DebtModal
          isOpen={isDebtModalOpen}
          onClose={() => {
            setIsDebtModalOpen(false);
            setEditingDebt(null);
          }}
          onSuccess={(debt) => {
            if (editingDebt) {
              setDebts(prev => prev.map(d => d.id === debt.id ? debt : d));
            } else {
              setDebts(prev => [debt, ...prev]);
            }
            setIsDebtModalOpen(false);
            setEditingDebt(null);
          }}
          debt={editingDebt}
          userId={user?.id}
        />
      )}
    </div>
  );
}

// Quick Add Modal Component
function QuickAddModal({
  isOpen,
  onClose,
  onSubmit,
  target,
  isGoal
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
  target: any;
  isGoal: boolean;
}) {
  const [amount, setAmount] = useState('');

  if (!isOpen || !target) return null;

  const remaining = isGoal
    ? (target as Goal).target_amount - (target as Goal).current_amount
    : (target as Debt).total_amount - (target as Debt).paid_amount;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white">
            {isGoal ? 'Tambah Tabungan' : 'Tambah Pembayaran'}
          </h2>
          <button onClick={onClose}>
            <X size={18} className="text-gray-500 hover:text-white" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-1">{target.name}</p>
          <p className="text-xs text-gray-500">
            Sisa yang dibutuhkan: {isGoal ? 'terkumpul' : 'terbayar'}: {formatCurrency(remaining)}
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-[11px] text-gray-400 mb-1.5 uppercase font-bold">
            Jumlah
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono">
              Rp
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 pl-10 text-white text-lg font-mono focus:outline-none focus:border-blue-500"
              placeholder="0"
              autoFocus
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl transition-all"
          >
            Batal
          </button>
          <button
            onClick={() => {
              if (amount && Number(amount) > 0) {
                onSubmit(Number(amount));
              }
            }}
            className={`py-3 rounded-xl transition-all font-bold ${
              isGoal
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// Goal Modal Component
function GoalModal({
  isOpen,
  onClose,
  onSuccess,
  goal,
  userId
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (goal: Goal) => void;
  goal?: Goal | null;
  userId?: string;
}) {
  const [formData, setFormData] = useState({
    name: goal?.name || '',
    target_amount: goal?.target_amount?.toString() || '',
    emoji: goal?.emoji || '🎯',
    due_date: goal?.due_date || ''
  });
  const [loading, setLoading] = useState(false);

  const isEditing = !!goal;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.target_amount) {
      alert('Mohon lengkapi semua field yang wajib diisi');
      return;
    }
    if (!userId) {
      alert('Login diperlukan untuk menyimpan data');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        target_amount: Number(formData.target_amount),
        emoji: formData.emoji,
        due_date: formData.due_date ? formData.due_date : null,
        user_id: userId,
        updated_at: new Date().toISOString()
      };

      let data, error;

      if (isEditing && goal) {
        // Update existing goal
        const res = await supabase
          .from('goals')
          .update(payload)
          .eq('id', goal.id)
          .select()
          .single();
        data = res.data;
        error = res.error;
      } else {
        // Insert new goal
        payload.current_amount = 0;
        payload.created_at = new Date().toISOString();
        const res = await supabase
          .from('goals')
          .insert([payload])
          .select()
          .single();
        data = res.data;
        error = res.error;
      }

      if (error) throw error;
      onSuccess(data as Goal);
    } catch (error: any) {
      alert('Gagal menyimpan: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const emojis = ['🎯', '💰', '🏠', '🚗', '✈️', '💻', '📱', '🎓', '💍', '🛡️'];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <PiggyBank size={20} className="text-green-500" />
            Target Baru
          </h2>
          <button onClick={onClose}>
            <X size={18} className="text-gray-500 hover:text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] text-gray-400 mb-1.5 uppercase font-bold">
              Nama Target
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
              placeholder="Contoh: Liburan ke Jepang"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1.5 uppercase font-bold">
              Target Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono">
                Rp
              </span>
              <input
                type="number"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 pl-10 text-white font-mono focus:outline-none focus:border-blue-500"
                placeholder="0"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1.5 uppercase font-bold">
              Emoji
            </label>
            <div className="flex gap-2 flex-wrap">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, emoji })}
                  className={`text-2xl p-2 rounded-lg transition-all ${
                    formData.emoji === emoji
                      ? 'bg-green-500/20 border border-green-500'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1.5 uppercase font-bold">
              Tanggal Target (Opsional)
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white [color-scheme:dark] focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : (isEditing ? 'Update Target' : 'Buat Target')}
          </button>
        </form>
      </div>
    </div>
  );
}

// Debt Modal Component
function DebtModal({
  isOpen,
  onClose,
  onSuccess,
  debt,
  userId
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (debt: Debt) => void;
  debt?: Debt | null;
  userId?: string;
}) {
  const [formData, setFormData] = useState({
    name: debt?.name || '',
    total_amount: debt?.total_amount?.toString() || '',
    type: debt?.type || 'payable' as 'payable' | 'receivable',
    due_date: debt?.due_date || new Date().toISOString().split('T')[0],
    notes: debt?.notes || ''
  });
  const [loading, setLoading] = useState(false);

  const isEditing = !!debt;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.total_amount) {
      alert('Mohon lengkapi semua field yang wajib diisi');
      return;
    }
    if (!userId) {
      alert('Login diperlukan untuk menyimpan data');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        total_amount: Number(formData.total_amount),
        type: formData.type,
        due_date: formData.due_date ? formData.due_date : null,
        notes: formData.notes || null,
        user_id: userId,
        updated_at: new Date().toISOString()
      };

      let data, error;

      if (isEditing && debt) {
        // Update existing debt
        const res = await supabase
          .from('debts')
          .update(payload)
          .eq('id', debt.id)
          .select()
          .single();
        data = res.data;
        error = res.error;
      } else {
        // Insert new debt
        payload.paid_amount = 0;
        payload.created_at = new Date().toISOString();
        const res = await supabase
          .from('debts')
          .insert([payload])
          .select()
          .single();
        data = res.data;
        error = res.error;
      }

      if (error) throw error;
      onSuccess(data as Debt);
    } catch (error: any) {
      alert('Gagal menyimpan: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard size={20} className="text-red-500" />
            Tambah Utang/Piutang
          </h2>
          <button onClick={onClose}>
            <X size={18} className="text-gray-500 hover:text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'payable' })}
              className={`py-3 rounded-xl transition-all font-bold ${
                formData.type === 'payable'
                  ? 'bg-red-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Utang (Payable)
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'receivable' })}
              className={`py-3 rounded-xl transition-all font-bold ${
                formData.type === 'receivable'
                  ? 'bg-green-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Piutang (Receivable)
            </button>
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1.5 uppercase font-bold">
              Nama
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
              placeholder="Contoh: Pinjaman Bank"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1.5 uppercase font-bold">
              Total Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono">
                Rp
              </span>
              <input
                type="number"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 pl-10 text-white font-mono focus:outline-none focus:border-blue-500"
                placeholder="0"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1.5 uppercase font-bold">
              Jatuh Tempo
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white [color-scheme:dark] focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1.5 uppercase font-bold">
              Catatan (Opsional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
              rows={3}
              placeholder="Catatan tambahan..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-bold py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg ${
              formData.type === 'receivable'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-900/20 text-white'
                : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-red-900/20 text-white'
            }`}
          >
            {loading ? 'Menyimpan...' : (isEditing ? 'Update' : 'Simpan')}
          </button>
        </form>
      </div>
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
