import React from 'react';
import { EmergencyContact } from '../types';
import { PhoneCall, ShieldAlert, Building2, Flame, Cross, LifeBuoy, MapPin, ExternalLink } from 'lucide-react';

interface EmergencyScreenProps {
  contacts: EmergencyContact[];
}

export const EmergencyScreen: React.FC<EmergencyScreenProps> = ({ contacts }) => {
  const getCategoryIcon = (category: EmergencyContact['category']) => {
    switch (category) {
      case 'disaster_nadmo':
        return <ShieldAlert className="w-5 h-5 text-amber-400" />;
      case 'fire':
        return <Flame className="w-5 h-5 text-red-400" />;
      case 'police':
        return <ShieldAlert className="w-5 h-5 text-blue-400" />;
      case 'hospital':
        return <Cross className="w-5 h-5 text-emerald-400" />;
      case 'shelter':
        return <LifeBuoy className="w-5 h-5 text-purple-400" />;
      default:
        return <Building2 className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-red-600 text-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-2">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase text-white">EMERGENCY CONTACTS & SHELTERS</h1>
            <p className="text-xs font-bold text-red-100 uppercase tracking-wider">
              Disaster response services, medical trauma units, and designated high-ground shelters in Greater Accra.
            </p>
          </div>
        </div>
      </div>

      {/* Emergency Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-yellow-400 border-2 border-black text-black">
                    {getCategoryIcon(contact.category)}
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 border border-black bg-black text-white">
                    {contact.category.replace('_', ' ')}
                  </span>
                </div>
                {contact.isOfficial && (
                  <span className="text-[10px] bg-emerald-400 text-black border-2 border-black px-2 py-0.5 font-black uppercase">
                    OFFICIAL
                  </span>
                )}
              </div>

              <h3 className="text-lg font-black uppercase text-black">{contact.name}</h3>
              <p className="text-xs font-bold text-zinc-700 leading-relaxed">{contact.details}</p>

              <div className="flex items-center text-xs font-bold text-zinc-500 gap-1.5 pt-1">
                <MapPin className="w-4 h-4 text-black shrink-0" />
                <span>{contact.address}</span>
              </div>
            </div>

            <div className="pt-3 border-t-2 border-black">
              <a
                href={`tel:${contact.phone.split('/')[0].trim()}`}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Hotline: {contact.phone}</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Flood Emergency Survival Rules */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
        <h3 className="text-sm font-black uppercase text-black tracking-wider flex items-center gap-2">
          <span>⚠️ Essential Flood Emergency Safety Rules</span>
        </h3>
        <ul className="text-xs font-bold text-zinc-800 space-y-2.5 list-disc list-inside leading-relaxed">
          <li><strong className="uppercase font-black text-black">Turn Around Don't Drown:</strong> 15 cm of moving water can knock you off your feet; 30 cm can float a vehicle.</li>
          <li><strong className="uppercase font-black text-black">Avoid Odaw & Open Gutters:</strong> Drainage channels in Accra carry extreme water velocity during storms.</li>
          <li><strong className="uppercase font-black text-black">Disconnect Electricity:</strong> Switch off main circuit breakers if floodwaters enter your home or shop.</li>
          <li><strong className="uppercase font-black text-black">Move to High Ground:</strong> Head early to designated shelters like Achimota School Hall or Ridge West.</li>
        </ul>
      </div>

    </div>
  );
};
