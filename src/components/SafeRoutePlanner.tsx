import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FloodReport, RouteOption } from '../types';
import { calculateFloodAwareRoutes } from '../services/routingService';
import { 
  Navigation, 
  AlertTriangle, 
  ShieldCheck, 
  MapPin, 
  ArrowRight, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  Compass, 
  Info, 
  Car, 
  Play, 
  Square, 
  Volume2, 
  VolumeX, 
  Layers, 
  CornerDownRight,
  Maximize2
} from 'lucide-react';

interface SafeRoutePlannerProps {
  userLat: number;
  userLng: number;
  userLocationName: string;
  activeReports: FloodReport[];
}

// Sub-component: Interactive Leaflet Map Guidance
interface InteractiveRouteMapProps {
  routes: RouteOption[];
  selectedRouteId: string;
  fromName: string;
  toName: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  activeReports: FloodReport[];
  onSelectRoute: (id: string) => void;
}

const InteractiveRouteMap: React.FC<InteractiveRouteMapProps> = ({
  routes,
  selectedRouteId,
  fromName,
  toName,
  fromLat,
  fromLng,
  toLat,
  toLng,
  activeReports,
  onSelectRoute,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Navigation simulation state
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [voiceMuted, setVoiceMuted] = useState<boolean>(false);
  const [guidancePrompt, setGuidancePrompt] = useState<string>('');
  
  const simulationTimerRef = useRef<any>(null);
  const carMarkerRef = useRef<L.Marker | null>(null);

  const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0];

  // Helper for voice audio guidance
  const speakInstruction = (text: string) => {
    if (voiceMuted) return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // cancel previous
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      // Ignore if speech API is blocked
    }
  };

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap | FloodGuard Ghana',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing vector layers & markers
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // Start Location Marker (Green Icon)
    const startIcon = L.divIcon({
      className: 'start-marker',
      html: `<div style="background-color: #10B981; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 16px; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">📍</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    L.marker([fromLat, fromLng], { icon: startIcon })
      .bindPopup(`<b>Start Point</b><br/>${fromName}`)
      .addTo(map);

    // Destination Marker (Red Flag Icon)
    const destIcon = L.divIcon({
      className: 'dest-marker',
      html: `<div style="background-color: #EF4444; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 16px; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">🏁</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    L.marker([toLat, toLng], { icon: destIcon })
      .bindPopup(`<b>Destination</b><br/>${toName}`)
      .addTo(map);

    // Draw Route Polylines
    const allBounds: L.LatLngBounds = L.latLngBounds([[fromLat, fromLng], [toLat, toLng]]);

    routes.forEach((route) => {
      const isSelected = route.id === selectedRouteId;
      const isRecommended = route.isRecommended;

      let lineColor = isRecommended ? '#10B981' : (route.riskLevel === 'SEVERE' ? '#EF4444' : '#F59E0B');
      let lineWeight = isSelected ? 7 : 4;
      let opacity = isSelected ? 0.9 : 0.4;
      let dashArray = route.riskLevel === 'SEVERE' ? '10, 10' : undefined;

      const polyline = L.polyline(route.waypoints, {
        color: lineColor,
        weight: lineWeight,
        opacity: opacity,
        dashArray: dashArray,
      }).addTo(map);

      polyline.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <b style="color: ${lineColor};">${route.name}</b><br/>
          <b>Distance:</b> ${route.distanceKm} km | <b>Duration:</b> ${route.durationMins} mins<br/>
          <b>Risk Status:</b> ${route.riskLevel}
        </div>
      `);

      route.waypoints.forEach(wp => allBounds.extend(wp));
    });

    // Draw active flood hazard points near the routes
    activeReports.forEach(report => {
      if (report.status === 'rejected' || report.status === 'resolved') return;

      const hazardIcon = L.divIcon({
        className: 'hazard-marker',
        html: `<div style="background-color: #DC2626; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); animation: pulse 1.5s infinite;">⚠️</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([report.latitude, report.longitude], { icon: hazardIcon })
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
            <b style="color: #DC2626;">🌊 Active Hazard: ${report.suburb}</b><br/>
            ${report.description}<br/>
            <b>Water Depth:</b> ${report.waterDepthCm} cm<br/>
            <b>Passability:</b> ${report.roadPassable.toUpperCase()}
          </div>
        `)
        .addTo(map);

      allBounds.extend([report.latitude, report.longitude]);
    });

    // Fit map view to encompass all waypoints smoothly
    map.fitBounds(allBounds, { padding: [40, 40] });

  }, [routes, selectedRouteId, fromLat, fromLng, toLat, toLng, activeReports]);

  // Handle Simulation Start/Stop
  const startSimulation = () => {
    if (!selectedRoute || selectedRoute.waypoints.length === 0) return;

    setIsNavigating(true);
    setCurrentStepIndex(0);

    const waypoints = selectedRoute.waypoints;
    const initialText = `Starting GPS navigation for ${selectedRoute.name}. Safe detour mode active.`;
    setGuidancePrompt(initialText);
    speakInstruction(initialText);

    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;

      // Create Car Icon
      const carIcon = L.divIcon({
        className: 'car-navigation-marker',
        html: `<div style="background-color: #2563EB; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 3px solid white; box-shadow: 0 4px 12px rgba(37,99,235,0.8);">🚗</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      if (carMarkerRef.current) {
        map.removeLayer(carMarkerRef.current);
      }

      carMarkerRef.current = L.marker(waypoints[0], { icon: carIcon }).addTo(map);
      map.panTo(waypoints[0]);

      let index = 0;
      clearInterval(simulationTimerRef.current);

      simulationTimerRef.current = setInterval(() => {
        index++;
        if (index >= waypoints.length) {
          clearInterval(simulationTimerRef.current);
          setIsNavigating(false);
          const endText = `You have arrived safely at ${toName}!`;
          setGuidancePrompt(endText);
          speakInstruction(endText);
          return;
        }

        const point = waypoints[index];
        setCurrentStepIndex(index);
        
        if (carMarkerRef.current) {
          carMarkerRef.current.setLatLng(point);
        }
        map.panTo(point, { animate: true });

        // Generate context-aware turn guidance messages
        let msg = '';
        if (index === 1) {
          msg = selectedRoute.isRecommended
            ? `Take elevated Ring Road bypass to clear low basin near Circle underpass.`
            : `Approaching main route segment. Watch out for potential standing water.`;
        } else if (index === waypoints.length - 1) {
          msg = `Approaching final destination ${toName}. Destination on right.`;
        } else {
          msg = `Proceeding along safe route (${selectedRoute.distanceKm} km total). Clear dry road ahead.`;
        }

        setGuidancePrompt(msg);
        speakInstruction(msg);

      }, 3500); // Step every 3.5 seconds
    }
  };

  const stopSimulation = () => {
    clearInterval(simulationTimerRef.current);
    setIsNavigating(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (carMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(carMarkerRef.current);
      carMarkerRef.current = null;
    }
    setGuidancePrompt('');
  };

  // Cleanup simulation timer on unmount
  useEffect(() => {
    return () => {
      clearInterval(simulationTimerRef.current);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Route Switcher Tabs on Map Top */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Map Path:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {routes.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                stopSimulation();
                onSelectRoute(r.id);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                r.id === selectedRouteId
                  ? r.isRecommended
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-red-600 text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{r.isRecommended ? '🟢 Safe Route' : '🔴 Direct Path'}</span>
              <span className="text-[10px] font-mono opacity-80">({r.durationMins}m)</span>
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-[420px] rounded-3xl border border-slate-200 shadow-md overflow-hidden bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Live GPS Guidance Overlay Banner */}
        {isNavigating && (
          <div className="absolute top-4 left-4 right-4 z-10 bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-blue-500/30 space-y-2 backdrop-blur animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Navigation className="w-4 h-4 animate-spin" />
                <span>Live Commute GPS Guidance Active</span>
              </div>

              <button
                onClick={() => setVoiceMuted(!voiceMuted)}
                className="p-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-300"
                title={voiceMuted ? 'Unmute Audio Voice' : 'Mute Voice'}
              >
                {voiceMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>

            <div className="text-sm font-black text-white flex items-start gap-2">
              <CornerDownRight className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{guidancePrompt || 'Following flood-free bypass trajectory...'}</span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800">
              <span>Origin: {fromName}</span>
              <span>Target: {toName}</span>
            </div>
          </div>
        )}

        {/* Floating Simulation Control Panel on Map */}
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur p-2 rounded-2xl shadow-xl border border-slate-200">
          {!isNavigating ? (
            <button
              onClick={startSimulation}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow transition-transform active:scale-95 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current text-white" />
              <span>Start Live GPS Navigation Simulation</span>
            </button>
          ) : (
            <button
              onClick={stopSimulation}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow transition-transform active:scale-95 flex items-center gap-2"
            >
              <Square className="w-4 h-4 fill-current text-white" />
              <span>Stop Navigation</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const SafeRoutePlanner: React.FC<SafeRoutePlannerProps> = ({
  userLat,
  userLng,
  userLocationName,
  activeReports,
}) => {
  const [fromName, setFromName] = useState<string>(userLocationName || 'Kwame Nkrumah Circle');
  const [fromLat, setFromLat] = useState<number>(userLat || 5.5587);
  const [fromLng, setFromLng] = useState<number>(userLng || -0.2072);

  const [toName, setToName] = useState<string>('Dansoman Control');
  const [toLat, setToLat] = useState<number>(5.5410);
  const [toLng, setToLng] = useState<number>(-0.2520);

  const [calculatedRoutes, setCalculatedRoutes] = useState<RouteOption[] | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const PRESET_COMMUTES = [
    { from: 'Kwame Nkrumah Circle', to: 'Dansoman Control', fromLat: 5.5587, fromLng: -0.2072, toLat: 5.5410, toLng: -0.2520 },
    { from: 'Kwame Nkrumah Circle', to: 'East Legon (American House)', fromLat: 5.5587, fromLng: -0.2072, toLat: 5.6380, toLng: -0.1540 },
    { from: 'Kaneshie First Light', to: 'Spintex Road (Kotobabi)', fromLat: 5.5620, fromLng: -0.2310, toLat: 5.6150, toLng: -0.1341 },
    { from: 'Alajo Junction', to: 'Ridge Hospital', fromLat: 5.5892, fromLng: -0.2104, toLat: 5.5580, toLng: -0.1980 },
    { from: 'Darkuman Junction', to: 'Tema Community 1', fromLat: 5.5810, fromLng: -0.2450, toLat: 5.6510, toLng: -0.0010 },
  ];

  React.useEffect(() => {
    // Initial route calculation
    const routes = calculateFloodAwareRoutes({
      fromName,
      fromLat,
      fromLng,
      toName,
      toLat,
      toLng,
      activeReports,
    });
    setCalculatedRoutes(routes);
    if (routes && routes.length > 0) {
      setSelectedRouteId(routes[0].id);
    }
  }, []);

  const handleCalculateRoute = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsCalculating(true);
    setTimeout(() => {
      const routes = calculateFloodAwareRoutes({
        fromName,
        fromLat,
        fromLng,
        toName,
        toLat,
        toLng,
        activeReports,
      });
      setCalculatedRoutes(routes);
      if (routes && routes.length > 0) {
        setSelectedRouteId(routes[0].id);
      }
      setIsCalculating(false);
    }, 250);
  };

  const handleSelectPresetCommute = (preset: typeof PRESET_COMMUTES[0]) => {
    setFromName(preset.from);
    setFromLat(preset.fromLat);
    setFromLng(preset.fromLng);
    setToName(preset.to);
    setToLat(preset.toLat);
    setToLng(preset.toLng);
    
    setIsCalculating(true);
    setTimeout(() => {
      const routes = calculateFloodAwareRoutes({
        fromName: preset.from,
        fromLat: preset.fromLat,
        fromLng: preset.fromLng,
        toName: preset.to,
        toLat: preset.toLat,
        toLng: preset.toLng,
        activeReports,
      });
      setCalculatedRoutes(routes);
      if (routes && routes.length > 0) {
        setSelectedRouteId(routes[0].id);
      }
      setIsCalculating(false);
    }, 200);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 font-sans">
      
      {/* Friendly Explanatory Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 shadow-xl border border-blue-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-400 text-slate-950 rounded-2xl font-black shrink-0 shadow">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300">Simple Commute Assistant</div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Safe Route Planner & Visual Map Guidance
            </h2>
          </div>
        </div>
        
        <p className="text-slate-200 text-xs sm:text-sm leading-relaxed max-w-3xl">
          When heavy rain causes Odaw River overflow or waterlogging at Circle, Alajo, or Kaneshie underpasses, this tool automatically recalculates elevated, flood-free detour roads so you can reach your destination safely without getting stranded.
        </p>

        {/* Easy How-It-Works Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 shrink-0"></span>
            <div>
              <div className="text-xs font-bold text-emerald-300">🟢 Recommended Safe Route</div>
              <div className="text-[11px] text-slate-300">Bypasses low-elevation flood points</div>
            </div>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-red-500 shrink-0"></span>
            <div>
              <div className="text-xs font-bold text-red-300">🔴 Flooded Direct Route</div>
              <div className="text-[11px] text-slate-300">Low underpass with active water overflow</div>
            </div>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0"></span>
            <div>
              <div className="text-xs font-bold text-amber-300">🟡 Slow Detour</div>
              <div className="text-[11px] text-slate-300">Slightly longer but guaranteed dry road</div>
            </div>
          </div>
        </div>
      </div>

      {/* Origin & Destination Inputs with Ghanaian Presets */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
        
        {/* Presets Bar */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            ⚡ Quick 1-Click Commute Routes in Accra:
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COMMUTES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPresetCommute(preset)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
                  fromName === preset.from && toName === preset.to
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{preset.from.split(' ')[0]}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span>{preset.to.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleCalculateRoute} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Origin */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Start Location (From)</span>
              </label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="e.g. Circle VIP Terminal, Alajo, Kaneshie..."
                className="w-full bg-slate-50 text-slate-900 text-sm font-semibold p-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Destination */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Destination (To)</span>
              </label>
              <input
                type="text"
                value={toName}
                onChange={(e) => setToName(e.target.value)}
                placeholder="e.g. Dansoman, Spintex, East Legon..."
                className="w-full bg-slate-50 text-slate-900 text-sm font-semibold p-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

          </div>

          <button
            type="submit"
            disabled={isCalculating}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            {isCalculating ? (
              <span>Checking Flood Data & Road Passability...</span>
            ) : (
              <>
                <Car className="w-5 h-5" />
                <span>Find Safe Alternate Routes & View Map</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Calculated Routes Cards & Visual Map Guidance */}
      {calculatedRoutes && selectedRouteId && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>Interactive Route Map & Guidance for:</span>
              <span className="text-blue-600">{fromName}</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span className="text-emerald-600">{toName}</span>
            </h3>
            <span className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-full">
              {calculatedRoutes.length} Paths Evaluated
            </span>
          </div>

          {/* Map Guidance Canvas */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" />
                <span>Live Route Guidance Map</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                GPS Voice Guidance Ready
              </span>
            </div>

            <InteractiveRouteMap
              routes={calculatedRoutes}
              selectedRouteId={selectedRouteId}
              fromName={fromName}
              toName={toName}
              fromLat={fromLat}
              fromLng={fromLng}
              toLat={toLat}
              toLng={toLng}
              activeReports={activeReports}
              onSelectRoute={(id) => setSelectedRouteId(id)}
            />
          </div>

          {/* Route Options Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {calculatedRoutes.map((route) => {
              const isSelected = selectedRouteId === route.id;

              return (
                <div
                  key={route.id}
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`p-6 rounded-3xl border-2 transition-all cursor-pointer space-y-4 relative ${
                    isSelected
                      ? route.isRecommended
                        ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-white border-red-500 shadow-md ring-2 ring-red-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  {route.isRecommended && (
                    <span className="absolute -top-3.5 right-6 bg-emerald-600 text-white font-black text-[11px] uppercase tracking-wider px-3 py-1 rounded-full shadow flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>RECOMMENDED SAFE ROUTE</span>
                    </span>
                  )}

                  <div className="flex items-start justify-between gap-2 pt-1">
                    <div>
                      <h4 className="text-lg font-black text-slate-900">{route.name}</h4>
                      <div className="flex items-center space-x-3 text-xs font-bold text-slate-500 mt-1">
                        <span className="flex items-center gap-1 text-slate-900 font-mono">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          {route.durationMins} mins
                        </span>
                        <span>•</span>
                        <span className="font-mono">{route.distanceKm} km</span>
                      </div>
                    </div>

                    <span className={`text-xs px-3 py-1.5 rounded-xl font-extrabold uppercase ${
                      route.riskLevel === 'SEVERE'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : route.riskLevel === 'HIGH'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {route.riskLevel} RISK
                    </span>
                  </div>

                  {/* Clear Why This Route Banner */}
                  <div className={`p-3.5 rounded-2xl text-xs space-y-1.5 ${
                    route.isRecommended ? 'bg-emerald-50 text-emerald-900 border border-emerald-100' : 'bg-slate-50 text-slate-800 border border-slate-100'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{route.isRecommended ? '✅ Why take this route:' : '⚠️ Caution regarding this route:'}</span>
                    </div>
                    {route.hazardWarnings.map((h, i) => (
                      <p key={i} className="text-xs leading-relaxed font-medium pl-2 border-l-2 border-current">
                        {h}
                      </p>
                    ))}
                  </div>

                  {/* Visual Step-by-Step Guidance */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Turn-by-Turn Navigation Steps:
                    </span>
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <div className="flex items-start gap-2">
                        <span className="p-1 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">1</span>
                        <span>Start at <strong>{fromName}</strong> and proceed along main elevated arterial road.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="p-1 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">2</span>
                        <span>
                          {route.isRecommended
                            ? `Bypass low drain underpass via ${route.name.split(' via ')[1] || 'elevated bypass flyover'}.`
                            : 'Drive with caution through potential low basin sections.'}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="p-1 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">3</span>
                        <span>Arrive safely at <strong>{toName}</strong>.</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRouteId(route.id);
                      window.scrollTo({ top: 350, behavior: 'smooth' });
                    }}
                    className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    <Navigation className="w-4 h-4 text-amber-400" />
                    <span>{isSelected ? 'Currently Loaded on Map Above' : 'View This Route on Map'}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Safety Warning Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">
              <strong className="font-bold">Golden Rule for Accra Commuters:</strong> Never drive or wade through fast-moving water over 15cm deep. If you encounter unexpected water accumulation on your route, turn around immediately and take an elevated bypass road.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
