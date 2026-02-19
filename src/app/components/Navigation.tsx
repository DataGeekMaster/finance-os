'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import {
  Wallet,
  LayoutDashboard,
  ArrowUpDown,
  Target,
  TrendingUp,
  List,
  X,
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Navigation Items Configuration
const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { id: 'wallets', label: 'Dompet', href: '/wallets', icon: Wallet },
  { id: 'cashflow', label: 'Arus Kas', href: '/cashflow', icon: ArrowUpDown },
  { id: 'goals_debts', label: 'Target & Kewajiban', href: '/goals_debts', icon: Target },
] as const;

export default function Navigation() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkSession();
  }, []);

  // Helper to check if a route is active
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname === href;
  };

  return (
    <>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* DESKTOP SIDEBAR - Hidden on mobile */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1e1e1e] border-r border-white/5 overflow-hidden">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-white/5">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Wallet className="text-blue-500" size={20} />
            FinanceOS
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-blue-600/20 text-blue-500 border-r-2 border-blue-500'
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
          {/* Investment Link - Separate */}
          <Link
            href="/investment"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-gray-500 hover:text-white hover:bg-white/5`}
          >
            <TrendingUp size={18} />
            Investasi
          </Link>
        </nav>

        {/* User Section */}
        {user && (
          <div className="p-4 border-t border-white/5">
            <div className="text-xs text-gray-500 font-mono mb-2 truncate">{user.email}</div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-2 rounded-lg text-xs font-bold transition-all border border-red-500/20"
            >
              Logout
            </button>
          </div>
        )}
      </aside>

      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#1e1e1e] border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <Wallet className="text-blue-500" size={20} />
          FinanceOS
        </h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-400 hover:text-white"
        >
          {isMobileMenuOpen ? <X size={24} /> : <List size={24} />}
        </button>
      </div>

      {/* MOBILE SLIDE-OUT MENU */}
      {isMobileMenuOpen && (
        <div className="fixed top-0 left-0 bottom-0 w-64 bg-[#1e1e1e] z-50 md:hidden animate-in slide-in-from-left duration-200">
          <div className="p-6 border-b border-white/5">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Wallet className="text-blue-500" size={20} />
              FinanceOS
            </h1>
          </div>
          <nav className="p-4 space-y-1">
            {NAVIGATION_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-blue-600/20 text-blue-500 border-r-2 border-blue-500'
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
            {/* Investment Link - Separate */}
            <Link
              href="/investment"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-gray-500 hover:text-white hover:bg-white/5`}
            >
              <TrendingUp size={18} />
              Investasi
            </Link>
          </nav>
          {user && (
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
              <div className="text-xs text-gray-500 font-mono mb-2 truncate">{user.email}</div>
              <button
                onClick={() => supabase.auth.signOut()}
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-2 rounded-lg text-xs font-bold transition-all border border-red-500/20"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
