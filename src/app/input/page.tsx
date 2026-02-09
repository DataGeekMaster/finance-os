'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus, TrendingUp, TrendingDown, X, CheckCircle,
    Loader2, LogIn
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- SUPABASE CONFIG ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- TYPES ---
type TransactionType = 'income' | 'expense';
type FinancialTag = 'needs' | 'wants' | 'savings' | 'liabilities';

// ==========================================
// DAFTAR KATEGORI
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

// ==========================================
// COMPONENT: AUTH MODAL (Embedded)
// ==========================================
const AuthModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) => {
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
                alert('Cek email untuk verifikasi!');
                setMode('signin');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">
                        {mode === 'signin' ? 'Login' : 'Daftar'}
                    </h2>
                    <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-white" /></button>
                </div>
                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1 font-bold">EMAIL</label>
                        <input
                            type="email" required
                            className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none"
                            value={email} onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1 font-bold">PASSWORD</label>
                        <input
                            type="password" required minLength={6}
                            className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit" disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                    >
                        {loading ? 'Memproses...' : (mode === 'signin' ? 'Masuk' : 'Daftar')}
                    </button>
                </form>
                <p className="mt-4 text-center text-xs text-gray-500">
                    <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="text-blue-400 hover:underline">
                        {mode === 'signin' ? "Belum punya akun? Daftar" : "Sudah punya akun? Login"}
                    </button>
                </p>
            </div>
        </div>
    );
};

// ==========================================
// MAIN PAGE: INPUT ONLY (COMPACT / NOTION FRIENDLY)
// ==========================================
export default function InputPage() {
    const [user, setUser] = useState<any>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // Form State
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Default form data
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        type: 'expense' as TransactionType,
        category: EXPENSE_CATEGORIES[0],
        financial_tag: 'needs' as FinancialTag | ''
    });

    // Check Session
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoadingAuth(false);
        };
        checkSession();
    }, []);

    const handleTypeChange = (newType: TransactionType) => {
        setFormData(prev => ({
            ...prev,
            type: newType,
            financial_tag: newType === 'income' ? '' : 'needs',
            category: newType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.amount) return alert("Mohon lengkapi data");
        if (!user) return setIsAuthModalOpen(true);

        setIsLoading(true);

        const payload = {
            title: formData.title,
            amount: Number(formData.amount),
            date: formData.date,
            type: formData.type,
            category: formData.category,
            financial_tag: formData.type === 'income' ? null : formData.financial_tag,
            user_id: user.id
        };

        try {
            const { error } = await supabase.from('transactions').insert([payload]);
            if (error) throw error;

            setIsSuccess(true);

            setTimeout(() => {
                setIsSuccess(false);
                setFormData(prev => ({
                    ...prev,
                    title: '',
                    amount: '',
                    category: prev.type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
                    date: new Date().toISOString().split('T')[0]
                }));
            }, 2000);

        } catch (error: any) {
            alert('Gagal menyimpan: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // --- STYLES (COMPACT VERSION) ---
    // Mengurangi padding (p-2.5) dan ukuran font agar lebih pas di iframe kecil
    const inputClass = "w-full bg-[#151515] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all text-sm";
    const labelClass = "block text-[10px] text-gray-400 mb-1 uppercase font-bold tracking-wider";
    const currentCategories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    // --- LOADING VIEW ---
    if (loadingAuth) {
        return (
            <div className="min-h-screen bg-[#191919] flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" />
            </div>
        );
    }

    // --- LOGIN REQUIRED VIEW ---
    if (!user) {
        return (
            <div className="min-h-screen bg-[#191919] flex flex-col items-center justify-center p-4 text-center">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <LogIn size={24} />
                </div>
                <h1 className="text-white font-bold text-lg mb-1">Akses Terbatas</h1>
                <p className="text-gray-500 text-xs mb-4">Login untuk input data.</p>
                <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-all text-sm"
                >
                    Login Sekarang
                </button>
                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                    onSuccess={() => window.location.reload()}
                />
            </div>
        );
    }

    // --- MAIN FORM VIEW ---
    return (
        // [PERBAIKAN] Menghapus 'flex items-center justify-center' agar form menempel di atas dan tidak terpotong jika iframe pendek.
        // [PERBAIKAN] Menggunakan 'w-full' tanpa max-width agar responsif penuh.
        <div className="min-h-screen bg-[#191919] text-white">
            <div className="w-full relative">

                {/* SUCCESS OVERLAY */}
                {isSuccess && (
                    <div className="absolute inset-0 z-50 bg-[#191919]/95 backdrop-blur flex flex-col items-center justify-center animate-in fade-in duration-300 h-full min-h-[400px]">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                            <CheckCircle size={32} className="text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Tersimpan!</h2>
                    </div>
                )}

                {/* HEADER (Compact) */}
                <div className="px-4 py-3 border-b border-white/5 bg-[#252525] sticky top-0 z-10">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <Plus size={16} className="text-blue-500" /> Input Transaksi
                    </h2>
                </div>

                {/* FORM (Compact Spacing) */}
                <div className="p-4">
                    <form onSubmit={handleSubmit} className="space-y-3"> {/* Jarak antar elemen dikurangi dari 5 ke 3 */}

                        {/* TYPE SELECTOR */}
                        <div className="p-1 bg-black/40 rounded-xl flex border border-white/5">
                            {(['expense', 'income'] as const).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => handleTypeChange(t)}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${formData.type === t
                                        ? (t === 'income' ? 'bg-green-600 text-white' : 'bg-red-600 text-white')
                                        : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    {t === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    {t === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                </button>
                            ))}
                        </div>

                        {/* AMOUNT */}
                        <div>
                            <label className={labelClass}>NOMINAL (IDR)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-base">Rp</span>
                                <input
                                    type="number" inputMode="numeric" required
                                    className={`${inputClass} pl-10 text-lg font-mono tracking-wide font-bold`}
                                    placeholder="0"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* JUDUL */}
                        <div>
                            <label className={labelClass}>JUDUL</label>
                            <input
                                type="text" required
                                className={inputClass}
                                placeholder={formData.type === 'expense' ? "Contoh: Makan Siang" : "Contoh: Bonus"}
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        {/* [GRID LAYOUT] TANGGAL & KATEGORI (Agar tidak memanjang ke bawah) */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>TANGGAL</label>
                                <input
                                    type="date" required
                                    className={`${inputClass} [color-scheme:dark]`}
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>KATEGORI</label>
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
                        </div>

                        {/* TAG KEUANGAN (Hanya Expense) */}
                        {formData.type === 'expense' && (
                            <div>
                                <label className={labelClass}>TAG</label>
                                <select required className={`${inputClass} border-l-4 border-l-blue-500`} value={formData.financial_tag} onChange={e => setFormData({ ...formData, financial_tag: e.target.value as FinancialTag })}>
                                    <option value="needs">Needs (Butuh)</option>
                                    <option value="wants">Wants (Ingin)</option>
                                    <option value="savings">Savings (Tabung)</option>
                                    <option value="liabilities">Utang</option>
                                </select>
                            </div>
                        )}

                        {/* SUBMIT BUTTON */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full font-bold py-3 rounded-xl mt-2 transition-all text-sm shadow-lg ${formData.type === 'income'
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-900/20'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/20'
                                } text-white disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                        >
                            {isLoading && <Loader2 className="animate-spin" size={18} />}
                            {isLoading ? '...' : 'SIMPAN'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}