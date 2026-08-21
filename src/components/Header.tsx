import React from 'react';
import { UserRole, PreferredLanguage } from '../types';
import { ShieldAlert, Wifi, WifiOff, Bookmark, Smartphone } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  language: PreferredLanguage;
  setLanguage: (lang: PreferredLanguage) => void;
  isOffline: boolean;
  lowDataMode: boolean;
  setLowDataMode: (val: boolean) => void;
  onOpenSavedLocations: () => void;
  onOpenMobileInstall: () => void;
  demoDataActive: boolean;
  toggleDemoData: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  setRole,
  language,
  setLanguage,
  isOffline,
  lowDataMode,
  setLowDataMode,
  onOpenSavedLocations,
  onOpenMobileInstall,
  demoDataActive,
  toggleDemoData,
  activeView,
  setActiveView,
}) => {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveView('home')}>
            <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-sm flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  FloodGuard <span className="text-amber-600">Ghana</span>
                </h1>
                {demoDataActive && (
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-200">
                    DEMO
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-slate-500">
                Accra Flood Early Warning & Safe Navigation
              </p>
            </div>
          </div>

          {/* Controls: Role, Language, Connectivity */}
          <div className="flex items-center space-x-2">
            
            {/* Offline Status */}
            <div className={`flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
              isOffline ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {isOffline ? (
                <>
                  <WifiOff className="w-3 h-3 mr-1" />
                  <span>OFFLINE</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3 mr-1" />
                  <span>LIVE</span>
                </>
              )}
            </div>

            {/* Low Data Mode Toggle */}
            <button
              onClick={() => setLowDataMode(!lowDataMode)}
              title="Toggle Low Data Mode for constrained bandwidth"
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
                lowDataMode ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span className="hidden md:inline">LOW DATA:</span>
              <span>{lowDataMode ? 'ON' : 'OFF'}</span>
            </button>

            {/* Install Mobile App CTA */}
            <button
              onClick={onOpenMobileInstall}
              title="Install FloodGuard App on iOS (iPhone) or Android"
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-[10px] flex items-center gap-1 shadow-sm transition-all"
            >
              <Smartphone className="w-3 h-3" />
              <span className="hidden sm:inline">App</span>
            </button>

            {/* Saved Locations Modal trigger */}
            <button
              onClick={onOpenSavedLocations}
              className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              title="Manage Saved Locations (Home, Work, School)"
            >
              <Bookmark className="w-4 h-4 text-amber-600" />
            </button>

            {/* Role Switcher */}
            <div className="relative">
              <select
                value={currentRole}
                onChange={(e) => {
                  const newRole = e.target.value as UserRole;
                  setRole(newRole);
                  if (newRole === 'AUTHORITY') setActiveView('authority');
                  else if (newRole === 'ADMIN') setActiveView('admin');
                  else if (activeView === 'authority' || activeView === 'admin') setActiveView('home');
                }}
                className="bg-slate-100 text-slate-800 text-xs font-bold rounded-xl px-2.5 py-1 focus:outline-none cursor-pointer"
              >
                <option value="USER">👤 Citizen</option>
                <option value="DRIVER">🚗 Driver</option>
                <option value="AUTHORITY">🏢 Authority</option>
                <option value="ADMIN">🛡️ Admin</option>
              </select>
            </div>

            {/* Language Switcher */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as PreferredLanguage)}
              className="bg-slate-100 text-slate-800 text-xs font-bold rounded-xl px-2.5 py-1 focus:outline-none cursor-pointer"
            >
              <option value="en">🇬🇭 EN</option>
              <option value="tw">🇬🇭 Twi</option>
              <option value="ga">🇬🇭 Ga</option>
              <option value="ee">🇬🇭 Ewe</option>
            </select>
          </div>

        </div>
      </div>
    </header>
  );
};
