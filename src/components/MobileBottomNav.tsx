import React from 'react';
import { Home, Map, Navigation, PhoneCall, Building2, PlusCircle, Shield } from 'lucide-react';
import { triggerHapticFeedback } from '../services/mobileUtils';
import { UserRole } from '../types';

interface MobileBottomNavProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenReportModal: (type: 'flood' | 'blocked_drain') => void;
  currentRole?: UserRole;
  setRole?: (role: UserRole) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  setActiveView,
  onOpenReportModal,
  currentRole,
  setRole,
}) => {
  const handleNav = (view: string) => {
    triggerHapticFeedback(20);
    if (view === 'authority' && setRole && currentRole !== 'AUTHORITY' && currentRole !== 'ADMIN') {
      setRole('AUTHORITY');
    }
    setActiveView(view);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 text-white pb-[env(safe-area-inset-bottom)] shadow-2xl font-sans">
      <div className="max-w-3xl mx-auto px-2">
        <div className={`grid ${currentRole === 'ADMIN' ? 'grid-cols-7' : 'grid-cols-6'} h-16 items-center`}>
          
          {/* Home */}
          <button
            onClick={() => handleNav('home')}
            className={`flex flex-col items-center justify-center h-full py-1 text-center transition-all ${
              activeView === 'home' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold leading-none">Home</span>
          </button>

          {/* Flood Map */}
          <button
            onClick={() => handleNav('map')}
            className={`flex flex-col items-center justify-center h-full py-1 text-center transition-all ${
              activeView === 'map' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Map className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold leading-none">Flood Map</span>
          </button>

          {/* Safe Route */}
          <button
            onClick={() => handleNav('route')}
            className={`flex flex-col items-center justify-center h-full py-1 text-center transition-all ${
              activeView === 'route' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Navigation className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold leading-none">Safe Route</span>
          </button>

          {/* Quick Report Center CTA */}
          <button
            onClick={() => {
              triggerHapticFeedback(35);
              onOpenReportModal('flood');
            }}
            className="flex flex-col items-center justify-center h-full py-1 text-center bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl -mt-3 shadow-lg active:scale-95 transition-transform"
          >
            <PlusCircle className="w-5 h-5 mb-0.5 text-white" />
            <span className="text-[10px] uppercase font-black leading-none">Report</span>
          </button>

          {/* Emergency Hotline & Help */}
          <button
            onClick={() => handleNav('emergency')}
            className={`flex flex-col items-center justify-center h-full py-1 text-center transition-all ${
              activeView === 'emergency' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <PhoneCall className="w-5 h-5 mb-0.5 text-red-400" />
            <span className="text-[10px] font-bold leading-none">Emergency</span>
          </button>

          {/* Authority Portal */}
          <button
            onClick={() => handleNav('authority')}
            className={`flex flex-col items-center justify-center h-full py-1 text-center transition-all ${
              activeView === 'authority' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-5 h-5 mb-0.5 text-emerald-400" />
            <span className="text-[10px] font-bold leading-none truncate max-w-[50px]">Authority</span>
          </button>

          {/* Admin (Optional) */}
          {currentRole === 'ADMIN' && (
            <button
              onClick={() => handleNav('admin')}
              className={`flex flex-col items-center justify-center h-full py-1 text-center transition-all ${
                activeView === 'admin' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-5 h-5 mb-0.5 text-indigo-400" />
              <span className="text-[10px] font-bold leading-none">Admin</span>
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
