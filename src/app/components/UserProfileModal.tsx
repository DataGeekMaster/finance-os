'use client';

import React, { useState, useEffect } from 'react';
import { X, PiggyBank } from 'lucide-react';

interface UserProfile {
  user_id?: string;
  occupation?: 'student' | 'employee' | 'entrepreneur' | 'freelancer' | 'other';
  occupation_label?: string;
  monthly_income?: number;
  has_debt?: boolean;
  financial_goals?: string; // String biasa agar bisa ketik spasi
  risk_profile?: 'not_started' | 'conservative' | 'moderate' | 'aggressive';
  notes?: string;
}

const UserProfileModal = ({
  isOpen,
  onClose,
  onSave,
  initialProfile
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
  initialProfile?: UserProfile | null;
}) => {
  const [formData, setFormData] = useState<UserProfile>({
    occupation: 'student',
    occupation_label: '',
    monthly_income: undefined,
    has_debt: false,
    financial_goals: '',
    risk_profile: 'not_started',
    notes: ''
  });

  useEffect(() => {
    if (initialProfile) {
      setFormData(initialProfile);
    }
  }, [initialProfile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const inputClass = "w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all text-sm";
  const labelClass = "block text-[11px] text-gray-400 mb-1.5 uppercase font-bold tracking-wider";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl relative flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-[#252525] rounded-t-3xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <PiggyBank size={18} className="text-blue-500" />
            Profil Keuangan Saya
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white bg-white/5 p-1.5 rounded-full hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Occupation */}
            <div>
              <label className={labelClass}>Status / Pekerjaan</label>
              <select
                className={inputClass}
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value as UserProfile['occupation'] })}
              >
                <option value="student">🎓 Mahasiswa/Pelajar</option>
                <option value="employee">💼 Karyawan Swasta</option>
                <option value="entrepreneur">👨‍💼 Pengusaha/Wiraswasta</option>
                <option value="freelancer">💻 Freelancer</option>
                <option value="other">🔹 Lainnya</option>
              </select>
            </div>

            {/* Occupation Label */}
            <div>
              <label className={labelClass}>Keterangan (Opsional)</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Contoh: Mahasiswa Semester 5, Karyawan IT, dll"
                value={formData.occupation_label || ''}
                onChange={(e) => setFormData({ ...formData, occupation_label: e.target.value })}
              />
            </div>

            {/* Monthly Income */}
            <div>
              <label className={labelClass}>Penghasilan Bulanan (IDR)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">Rp</span>
                <input
                  type="number"
                  className={`${inputClass} pl-10`}
                  placeholder="0"
                  value={formData.monthly_income || ''}
                  onChange={(e) => setFormData({ ...formData, monthly_income: Number(e.target.value) })}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Isi 0 jika belum berpenghasilan</p>
            </div>

            {/* Has Debt */}
            <div>
              <label className={labelClass}>Apakah Punya Utang?</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="has_debt"
                    checked={formData.has_debt === true}
                    onChange={() => setFormData({ ...formData, has_debt: true })}
                    className="w-4 h-4 text-blue-500"
                  />
                  <span className="text-white text-sm">Ya</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="has_debt"
                    checked={formData.has_debt === false}
                    onChange={() => setFormData({ ...formData, has_debt: false })}
                    className="w-4 h-4 text-blue-500"
                  />
                  <span className="text-white text-sm">Tidak</span>
                </label>
              </div>
            </div>

            {/* Risk Profile */}
            <div>
              <label className={labelClass}>Profil Risiko Investasi</label>
              <select
                className={inputClass}
                value={formData.risk_profile || 'not_started'}
                onChange={(e) => setFormData({ ...formData, risk_profile: e.target.value as UserProfile['risk_profile'] })}
              >
                <option value="not_started">📭 Belum mulai investasi</option>
                <option value="conservative">🛡️ Konservatif (Aman, return kecil)</option>
                <option value="moderate">⚖️ Moderat (Seimbang)</option>
                <option value="aggressive">🚀 Agresif (Berani rugi, return tinggi)</option>
              </select>
            </div>

            {/* Financial Goals */}
            <div>
              <label className={labelClass}>Tujuan Keuangan (Opsional)</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Contoh: Dana darurat, Beli rumah, Pensiun dini"
                value={formData.financial_goals || ''}
                onChange={(e) => setFormData({ ...formData, financial_goals: e.target.value })}
              />
              <p className="text-[10px] text-gray-500 mt-1">Pisahkan dengan koma jika lebih dari satu</p>
            </div>

            {/* Notes */}
            <div>
              <label className={labelClass}>Catatan Tambahan (Opsional)</label>
              <textarea
                className={inputClass}
                rows={3}
                placeholder="Ceritakan situasi keuanganmu atau target spesifik..."
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 font-bold py-3.5 rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/20 font-bold py-3.5 rounded-xl transition-all text-white"
              >
                Simpan Profil
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
