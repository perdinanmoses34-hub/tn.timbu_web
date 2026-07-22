/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Church,
  Calendar,
  BookOpen,
  User,
  Menu,
  Shield,
} from 'lucide-react';
import { Role } from '../types';

interface BottomNavProps {
  currentTab: string;
  setTab: (tab: string) => void;
  userRole: Role;
  openAdminMenu?: () => void;
}

export default function BottomNav({
  currentTab,
  setTab,
  userRole,
  openAdminMenu,
}: BottomNavProps) {
  const isJemaatTab = currentTab.startsWith('jemaat_');

  const navItems = [
    { id: 'jemaat_home', label: 'Beranda', icon: Church },
    { id: 'jemaat_schedule', label: 'Jadwal', icon: Calendar },
    { id: 'jemaat_devotions', label: 'Renungan', icon: BookOpen },
    { id: 'jemaat_profile', label: 'Profil', icon: User },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 z-40 safe-padding-bottom shadow-lg shadow-black/10 rounded-t-2xl px-2"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors relative"
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-brand bg-brand/10 scale-110'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[9px] font-medium tracking-tight mt-0.5 ${
                  isActive ? 'text-brand font-semibold' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
              
              {/* Highlight bar underneath active */}
              {isActive && (
                <span className="absolute bottom-0 w-8 h-1 bg-brand rounded-full" />
              )}
            </button>
          );
        })}

        {/* Menu or Admin portal button */}
        {userRole !== 'JEMAAT' ? (
          <>
            <button
              onClick={() => {
                if (!currentTab.startsWith('admin_')) {
                  setTab('admin_dashboard');
                } else if (openAdminMenu) {
                  openAdminMenu();
                }
              }}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center relative cursor-pointer"
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  currentTab.startsWith('admin_')
                    ? 'text-amber-600 bg-amber-50 scale-110'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Shield className="w-5 h-5" />
              </div>
              <span
                className={`text-[9px] font-medium tracking-tight mt-0.5 ${
                  currentTab.startsWith('admin_') ? 'text-amber-600 font-semibold' : 'text-gray-400'
                }`}
              >
                Panel Admin
              </span>
              {currentTab.startsWith('admin_') && (
                <span className="absolute bottom-0 w-8 h-1 bg-amber-500 rounded-full" />
              )}
            </button>

            <button
              onClick={openAdminMenu}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center relative cursor-pointer"
            >
              <div className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 transition-all">
                <Menu className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-medium tracking-tight mt-0.5 text-gray-400">
                Menu Lain
              </span>
            </button>
          </>
        ) : (
          <button
            onClick={openAdminMenu}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center relative"
          >
            <div className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 transition-all">
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-medium tracking-tight mt-0.5 text-gray-400">
              Menu Lain
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}
