import React, { useState } from 'react';
import { SavedLocation } from '../types';
import { X, Bookmark, Plus, Trash2, MapPin, ShieldAlert } from 'lucide-react';

interface SavedLocationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedLocations: SavedLocation[];
  onAddLocation: (name: string, address: string) => void;
  onDeleteLocation: (id: string) => void;
}

export const SavedLocationsModal: React.FC<SavedLocationsModalProps> = ({
  isOpen,
  onClose,
  savedLocations,
  onAddLocation,
  onDeleteLocation,
}) => {
  if (!isOpen) return null;

  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddLocation(newName, newAddress || 'Accra Area');
    setNewName('');
    setNewAddress('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white border-2 border-black w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        
        <div className="bg-black px-5 py-4 flex items-center justify-between border-b-2 border-black">
          <div className="flex items-center space-x-2">
            <Bookmark className="w-5 h-5 text-yellow-400" />
            <h3 className="text-base font-black uppercase text-white">SAVED MONITORED LOCATIONS</h3>
          </div>
          <button onClick={onClose} className="p-1 text-white hover:text-yellow-400 border border-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          
          <p className="text-xs font-bold text-zinc-600">
            FloodGuard Ghana monitors saved locations (Home, School, Workplace) and triggers warnings if flood risk elevates.
          </p>

          <div className="space-y-2">
            {savedLocations.map((loc) => (
              <div
                key={loc.id}
                className="bg-zinc-50 border-2 border-black p-3 flex items-center justify-between text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <div>
                  <div className="font-black uppercase text-black flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-black" />
                    <span>{loc.name}</span>
                  </div>
                  <div className="text-zinc-600 text-[11px] font-bold mt-0.5">{loc.address}</div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 border border-black font-mono font-black text-[10px] uppercase ${
                    loc.currentRiskLevel === 'HIGH' ? 'bg-orange-500 text-white' : 'bg-emerald-400 text-black'
                  }`}>
                    {loc.currentRiskLevel} RISK
                  </span>
                  <button
                    onClick={() => onDeleteLocation(loc.id)}
                    className="p-1 text-black hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Form */}
          <form onSubmit={handleAdd} className="border-t-2 border-black pt-3 space-y-2">
            <span className="text-xs font-black uppercase text-black block">Add Monitored Location</span>
            <input
              type="text"
              placeholder="e.g., Home, Children's School, Family House"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-white text-black text-xs font-bold p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
            <input
              type="text"
              placeholder="Address / Suburb in Accra"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full bg-white text-black text-xs font-bold p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-xs tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1 mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Location to Risk Monitor</span>
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
