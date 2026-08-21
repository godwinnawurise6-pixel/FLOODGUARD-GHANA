import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FloodReport, FloodZone, EmergencyContact } from '../types';
import { Search, Filter, Layers, Info, CheckCircle, Clock, AlertTriangle, Crosshair, Navigation, Volume2, ShieldCheck } from 'lucide-react';

interface FloodMapProps {
  reports: FloodReport[];
  zones: FloodZone[];
  emergencyContacts: EmergencyContact[];
  userLat: number;
  userLng: number;
  lowDataMode: boolean;
  onSelectReport?: (report: FloodReport) => void;
  onOpenReportModal: (type: 'flood' | 'blocked_drain') => void;
}

export const FloodMap: React.FC<FloodMapProps> = ({
  reports,
  zones,
  emergencyContacts,
  userLat,
  userLng,
  lowDataMode,
  onSelectReport,
  onOpenReportModal,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [filterType, setFilterType] = useState<'all' | 'flood' | 'blocked_drain'>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [showZones, setShowZones] = useState<boolean>(true);
  const [showShelters, setShowShelters] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<FloodReport | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // map already created

    const map = L.map(mapContainerRef.current, {
      center: [userLat, userLng],
      zoom: 13,
      zoomControl: true,
    });

    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors | FloodGuard Ghana',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userLat, userLng]);

  // Handle Recenter to User GPS Location
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLat, userLng], 14, { animate: true });
    }
  };

  // Update Map Markers & Overlay Circles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing layers
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // Add User Current Location Marker
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `<div style="background-color: #2563EB; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 12px rgba(37,99,235,0.9); animation: pulse 2s infinite;"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    L.marker([userLat, userLng], { icon: userIcon })
      .bindPopup(`<div style="font-family: sans-serif; padding: 4px;"><b>📍 Your Current GPS Position</b><br/><span style="color: #475569; font-size: 11px;">Monitored for local rainfall & flood risk</span></div>`)
      .addTo(map);

    // Render High Risk Zones overlay circles
    if (showZones) {
      zones.forEach((z) => {
        let color = '#10B981';
        if (z.riskLevel === 'SEVERE') color = '#EF4444';
        else if (z.riskLevel === 'HIGH') color = '#F97316';
        else if (z.riskLevel === 'MODERATE') color = '#F59E0B';

        L.circle([z.latitude, z.longitude], {
          color,
          fillColor: color,
          fillOpacity: 0.18,
          radius: z.radiusMeters,
          weight: 2,
        })
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
              <strong style="color: ${color}; font-size: 14px;">${z.name}</strong><br/>
              <b>District:</b> ${z.district}<br/>
              <b>Risk Level:</b> ${z.riskLevel} (${z.riskScore}/100)<br/>
              <b>Historical Flood Freq:</b> ${z.historicalFrequency} per year<br/>
              <b>Elevation:</b> ${z.elevationMeters}m
            </div>
          `)
          .addTo(map);
      });
    }

    // Filter reports
    const filteredReports = reports.filter((r) => {
      if (filterType !== 'all' && r.type !== filterType) return false;
      if (filterSeverity !== 'all' && r.severity !== filterSeverity) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return r.suburb.toLowerCase().includes(query) || r.address.toLowerCase().includes(query) || r.description.toLowerCase().includes(query);
      }
      return true;
    });

    // Render Report Pins
    filteredReports.forEach((report) => {
      let pinColor = '#F59E0B'; // Amber
      if (report.severity === 'SEVERE' || report.severity === 'LIFE_THREATENING') pinColor = '#DC2626'; // Red
      if (report.severity === 'HIGH') pinColor = '#EA580C'; // Orange
      if (report.type === 'blocked_drain') pinColor = '#9333EA'; // Purple for drain

      const symbol = report.type === 'flood' ? '🌊' : '🕳️';

      const customIcon = L.divIcon({
        className: 'custom-report-marker',
        html: `<div style="background-color: ${pinColor}; color: white; border-radius: 18px; padding: 5px 10px; font-weight: 800; font-size: 11px; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 4px; cursor: pointer;">
                <span>${symbol}</span><span>${report.suburb}</span>
               </div>`,
        iconSize: [85, 28],
        iconAnchor: [42, 14],
      });

      const marker = L.marker([report.latitude, report.longitude], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        setSelectedReport(report);
        if (onSelectReport) onSelectReport(report);
      });
    });

    // Render Emergency Shelters
    if (showShelters) {
      emergencyContacts
        .filter((c) => c.category === 'shelter' && c.latitude && c.longitude)
        .forEach((shelter) => {
          const shelterIcon = L.divIcon({
            className: 'shelter-marker',
            html: `<div style="background-color: #059669; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); cursor: pointer;">⛺</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          L.marker([shelter.latitude!, shelter.longitude!], { icon: shelterIcon })
            .bindPopup(`<b>⛺ Designated Emergency Shelter</b><br/>${shelter.name}<br/>Phone: ${shelter.phone}`)
            .addTo(map);
        });
    }
  }, [reports, zones, emergencyContacts, filterType, filterSeverity, showZones, showShelters, searchQuery, userLat, userLng]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 font-sans">
      
      {/* Friendly Explanatory Banner & Quick Legend */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 font-extrabold text-[11px] rounded-full uppercase">
                Interactive GIS Map
              </span>
              <span className="text-xs text-slate-500 font-medium">Updated Real-Time</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">
              Accra Community Flood Hazard & Incident Map
            </h2>
          </div>

          <button
            onClick={handleRecenter}
            className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-colors flex items-center gap-2 shrink-0"
          >
            <Crosshair className="w-4 h-4 text-blue-600" />
            <span>Center My Location</span>
          </button>
        </div>

        {/* Visual Map Legend Bar */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Map Legend — What the colored pins mean:
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow shrink-0"></span>
              <span className="font-bold text-slate-800">Your Location</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
              <span className="text-sm">🌊</span>
              <div>
                <span className="font-bold text-slate-800 block">Flood Report</span>
                <span className="text-[10px] text-red-600 font-bold">Red / Orange</span>
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
              <span className="text-sm">🕳️</span>
              <div>
                <span className="font-bold text-slate-800 block">Blocked Drain</span>
                <span className="text-[10px] text-purple-600 font-bold">Purple Pin</span>
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-amber-500 bg-amber-500/20 shrink-0"></span>
              <div>
                <span className="font-bold text-slate-800 block">Risk Basin</span>
                <span className="text-[10px] text-slate-500">Shaded Circle</span>
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
              <span className="text-sm">⛺</span>
              <div>
                <span className="font-bold text-slate-800 block">Safe Shelter</span>
                <span className="text-[10px] text-emerald-600 font-bold">Green Icon</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Map Search & Filter Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3">
        
        {/* Suburb Search */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search suburb (Circle, Alajo, Kaneshie)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 text-slate-900 text-xs font-semibold pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Quick Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <select
            value={filterType}
            onChange={(e: any) => setFilterType(e.target.value)}
            className="bg-slate-50 text-slate-800 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">All Incident Types</option>
            <option value="flood">🌊 Floods Only</option>
            <option value="blocked_drain">🕳️ Blocked Drains Only</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-50 text-slate-800 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">All Severity Levels</option>
            <option value="SEVERE">🔴 Severe / Life-Threatening</option>
            <option value="HIGH">🟠 High</option>
            <option value="MODERATE">🟡 Moderate</option>
          </select>

          <button
            onClick={() => setShowZones(!showZones)}
            className={`px-3 py-2.5 text-xs font-bold rounded-xl border transition-all ${
              showZones ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <span>High Risk Basins</span>
          </button>

          <button
            onClick={() => setShowShelters(!showShelters)}
            className={`px-3 py-2.5 text-xs font-bold rounded-xl border transition-all ${
              showShelters ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <span>⛺ Shelters</span>
          </button>
        </div>

      </div>

      {/* Main Map Canvas & Selected Item Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leaflet Map Canvas */}
        <div className="lg:col-span-2 relative h-[520px] rounded-3xl border border-slate-200 shadow-sm overflow-hidden bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Report CTA Buttons */}
          <div className="absolute bottom-5 right-5 z-10 flex gap-2">
            <button
              onClick={() => onOpenReportModal('flood')}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <span>🚨 Report Flood</span>
            </button>
            <button
              onClick={() => onOpenReportModal('blocked_drain')}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <span>🕳️ Report Gutter</span>
            </button>
          </div>
        </div>

        {/* Sidebar Inspector / Incident Detail Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 max-h-[520px] overflow-y-auto">
          {selectedReport ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className={`text-xs px-2.5 py-1 rounded-full font-extrabold uppercase ${
                  selectedReport.severity === 'SEVERE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedReport.type === 'flood' ? '🌊 FLOOD INCIDENT' : '🕳️ BLOCKED DRAINT'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {new Date(selectedReport.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{selectedReport.address}</h3>
                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mt-0.5">{selectedReport.suburb}, Greater Accra</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <p className="text-xs font-medium text-slate-700 leading-relaxed">{selectedReport.description}</p>

                {(selectedReport.hasVoiceNote || selectedReport.audioUrl) && (
                  <div className="bg-amber-100 border border-amber-300 rounded-2xl p-3 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                      <span className="flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4 text-amber-800" />
                        <span>Citizen Voice Recording</span>
                      </span>
                    </div>
                    <audio
                      src={selectedReport.audioUrl || 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg'}
                      controls
                      className="w-full h-8 mt-1"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Water Depth</span>
                    <span className="font-extrabold text-slate-900 text-sm">{selectedReport.waterDepthCm || 0} cm</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Passability</span>
                    <span className={`font-bold uppercase ${selectedReport.roadPassable === 'no' ? 'text-red-600' : 'text-amber-600'}`}>
                      {selectedReport.roadPassable === 'no' ? '🚫 Impassable' : '⚠️ Caution'}
                    </span>
                  </div>
                </div>
              </div>

              {selectedReport.imageUrl && !lowDataMode && (
                <div className="rounded-2xl border border-slate-200 max-h-40 overflow-hidden">
                  <img src={selectedReport.imageUrl} alt="Incident Photo" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Verification Score */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Verification Score:</span>
                  <span className="font-mono font-bold text-emerald-600">{selectedReport.verificationScore} / 100</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${selectedReport.verificationScore}%` }} />
                </div>
                <div className="text-[10px] font-medium text-slate-500 pt-1">
                  Confidence Factors: {selectedReport.confidenceFactors.join(' • ')}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">Reporter: {selectedReport.isAnonymous ? 'Anonymous Citizen' : selectedReport.reporterName}</span>
                <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg font-mono font-bold">
                  👍 {selectedReport.upvotes} Upvotes
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 space-y-3 text-slate-400">
              <Info className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">Click Any Map Pin To Inspect</h4>
              <p className="text-xs max-w-xs mx-auto text-slate-500 font-medium leading-relaxed">
                Tap on any colored marker on the map to view water depth, citizen audio recordings, disaster verification scores, and response status.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
