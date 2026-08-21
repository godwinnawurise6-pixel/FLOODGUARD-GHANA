import React, { useState } from 'react';
import { FloodReport, WeatherData, FloodZone } from '../types';
import { calculateFloodRiskScore, evaluateLocationContext } from '../services/floodRiskEngine';
import { MapPin, CloudRain, AlertTriangle, Shield, Navigation, Compass, PhoneCall, Radio, Volume2, RefreshCw, Share2, Smartphone, Info, ArrowRight, ShieldCheck, Waves, CheckCircle2, Search, Thermometer, Wind, Droplets, Cloud, Calendar, Sparkles } from 'lucide-react';
import { shareFloodInfo, triggerHapticFeedback } from '../services/mobileUtils';
import { searchLocations, GeocodedLocation } from '../services/weatherService';

interface HomeScreenProps {
  weather: WeatherData;
  reports: FloodReport[];
  zones: FloodZone[];
  userLat: number;
  userLng: number;
  userLocationName: string;
  onRequestLocation: () => void;
  onSelectLocation: (lat: number, lng: number, name: string) => void;
  onOpenReportModal: (type: 'flood' | 'blocked_drain') => void;
  onNavigateToView: (view: string) => void;
  onRefreshWeather: () => void;
}

const ACCRA_PRESETS = [
  { name: 'Kwame Nkrumah Circle', lat: 5.5587, lng: -0.2072 },
  { name: 'Alajo & Onyasia Basin', lat: 5.5892, lng: -0.2104 },
  { name: 'Kaneshie Market', lat: 5.5620, lng: -0.2310 },
  { name: 'Spintex Road Underpass', lat: 5.6230, lng: -0.1210 },
  { name: 'Darkuman Junction', lat: 5.5810, lng: -0.2450 },
  { name: 'Dansoman & Glefe', lat: 5.5410, lng: -0.2520 },
  { name: 'Tema Community 1', lat: 5.6420, lng: -0.0020 },
  { name: 'Kumasi Asafo', lat: 6.6885, lng: -1.6244 },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  weather,
  reports,
  zones,
  userLat,
  userLng,
  userLocationName,
  onRequestLocation,
  onSelectLocation,
  onOpenReportModal,
  onNavigateToView,
  onRefreshWeather,
}) => {
  const [audioAlertPlaying, setAudioAlertPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'hourly' | 'daily' | 'incidents' | 'contacts'>('hourly');

  // Weather Location Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodedLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Evaluate flood risk context at current location
  const context = evaluateLocationContext(userLat, userLng, reports, zones);
  const riskResult = calculateFloodRiskScore({
    rainfallIntensityMmHr: weather.currentRainfallMm,
    rainfallAccumulationMm24h: weather.currentRainfallMm * 1.5,
    historicalFrequencyPerYr: context.nearestZone ? context.nearestZone.historicalFrequency : 8,
    elevationMeters: context.nearestZone ? context.nearestZone.elevationMeters : 12,
    blockedDrainsNearby: context.blockedDrainsNearby,
    activeReportsNearby: context.activeReportsNearby,
  });

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchLocations(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
      setAudioAlertPlaying(true);
      setTimeout(() => setAudioAlertPlaying(false), 800);
    } catch (e) {
      console.log('Audio alert chime unavailable');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      
      {/* Clear Purpose Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold tracking-wide">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Greater Accra Community Flood Response System</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Predict Flood Risks. Avoid Inundated Roads. Save Lives.
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            FloodGuard Ghana provides live flood risk scores for your exact location in Greater Accra, helps commuters navigate around flooded underpasses (e.g. Circle, Alajo, Kaneshie), and allows citizens to submit crowd-sourced gutter blockage reports directly to NADMO authorities.
          </p>

          {/* 3 Step Pathways */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0">1</div>
              <div>
                <div className="text-xs font-bold text-white">Check Live Risk</div>
                <p className="text-[11px] text-slate-400">GPS location risk score</p>
              </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">2</div>
              <div>
                <div className="text-xs font-bold text-white">Plan Safe Commute</div>
                <p className="text-[11px] text-slate-400">Flood-free route guidance</p>
              </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">3</div>
              <div>
                <div className="text-xs font-bold text-white">Report Drain / Flood</div>
                <p className="text-[11px] text-slate-400">Voice note or text to NADMO</p>
              </div>
            </div>
          </div>

          {/* Quick Voice Note Banner for illiterate or non-typing citizens */}
          <div className="mt-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-950 text-amber-400 rounded-xl font-bold">
                🎤
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wide">Cannot Type? Send Voice Note in Local Language</div>
                <div className="text-[11px] font-bold opacity-90">Kasa kyerɛ yɛn wɔ Twi, Ga, Ewe, anaa English mu.</div>
              </div>
            </div>
            <button
              onClick={() => onOpenReportModal('flood')}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-extrabold uppercase shadow shrink-0 transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <span>Record Voice Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* REAL-TIME WEATHER FORECASTING & RAINFALL PREDICTOR PANEL */}
      <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
        
        {/* Header Bar with Live Indicator */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-xl">
                <CloudRain className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                REAL-TIME WEATHER FORECAST & RAINFALL RATE PREDICTOR
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Live Satellite Meteorological Forecast
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Open-Meteo Live API ({weather.lastUpdatedTime || 'Connected'})</span>
            </div>

            <button
              onClick={onRefreshWeather}
              title="Refresh Live Weather Data"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Location Selector & Geocoding Search Bar */}
        <div className="space-y-3 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>Predict Rainfall Rate for Any Location in Ghana:</span>
            </label>
            <span className="text-[11px] text-slate-400">Current: <strong className="text-white">{userLocationName}</strong></span>
          </div>

          {/* Quick Preset Location Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              onClick={onRequestLocation}
              className="px-2.5 py-1 bg-amber-500 text-slate-950 font-extrabold text-[11px] rounded-lg shadow-sm flex items-center gap-1 hover:bg-amber-400"
            >
              <Compass className="w-3 h-3" />
              <span>Use My GPS</span>
            </button>

            {ACCRA_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  triggerHapticFeedback(15);
                  onSelectLocation(preset.lat, preset.lng, preset.name);
                }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                  userLocationName.includes(preset.name.split(' ')[0])
                    ? 'bg-blue-600 text-white border-blue-500 shadow'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Geocoding Live Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative pt-1">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search any Ghana town or suburb (e.g., East Legon, Adenta, Kumasi, Cape Coast)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-slate-900 text-white text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isSearching ? 'Searching...' : 'Predict Weather'}</span>
              </button>
            </div>

            {/* Geocoding Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-30 overflow-hidden divide-y divide-slate-800">
                {searchResults.map((res, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSelectLocation(res.latitude, res.longitude, `${res.name}, ${res.admin1}`);
                      setSearchResults([]);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-3 hover:bg-slate-800 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{res.name}</span>
                      <span className="text-[11px] text-slate-400">{res.admin1}, {res.country}</span>
                    </div>
                    <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-300 font-mono">
                      {res.latitude.toFixed(2)}°, {res.longitude.toFixed(2)}°
                    </span>
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Real-Time Measured Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Main Rainfall Rate Metric */}
          <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl space-y-1">
            <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <CloudRain className="w-4 h-4 text-blue-400" />
                <span>Current Rain Rate</span>
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                weather.currentRainfallMm > 20 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : weather.currentRainfallMm > 5 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {weather.rainfallIntensity}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 pt-1">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                {weather.currentRainfallMm}
              </span>
              <span className="text-xs font-bold text-slate-400">mm/hr</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate pt-1">
              Condition: <strong className="text-slate-200">{weather.weatherConditionText || 'Overcast'}</strong>
            </p>
          </div>

          {/* Precipitation Chance */}
          <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl space-y-1">
            <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span>Rain Probability</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono pt-1">
              {weather.precipitationProbability ?? 75}%
            </div>
            <p className="text-[11px] text-slate-400 font-medium pt-1">
              Humidity: <strong className="text-slate-200">{weather.humidity}%</strong>
            </p>
          </div>

          {/* Temperature & Wind */}
          <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl space-y-1">
            <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Thermometer className="w-4 h-4 text-amber-400" />
              <span>Temperature</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono pt-1">
              {weather.temperatureC}°C
            </div>
            <p className="text-[11px] text-slate-400 font-medium pt-1 flex items-center gap-1">
              <Wind className="w-3 h-3 text-slate-400" />
              <span>Wind: <strong className="text-slate-200">{weather.windSpeedKmh} km/h</strong></span>
            </p>
          </div>

          {/* Calculated Flood Threat Level */}
          <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl space-y-1">
            <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Calculated Risk</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-black pt-1 ${
              riskResult.level === 'SEVERE' ? 'text-red-400' : riskResult.level === 'HIGH' ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {riskResult.score}/100
            </div>
            <p className="text-[11px] text-slate-400 font-medium pt-1 truncate">
              Level: <strong className="text-white">{riskResult.level}</strong>
            </p>
          </div>

        </div>

        {/* Forecast Visualizer Tabs (Hourly Prediction vs 7-Day Outlook) */}
        <div className="space-y-4 pt-2">
          <div className="flex border-b border-slate-800 space-x-6">
            <button
              onClick={() => setActiveTab('hourly')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 ${
                activeTab === 'hourly' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              🌧️ 12-Hour Hourly Rainfall Rate Timeline (mm/hr)
            </button>

            <button
              onClick={() => setActiveTab('daily')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 ${
                activeTab === 'daily' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              📅 7-Day Rainfall Outlook
            </button>
          </div>

          {/* Hourly Timeline */}
          {activeTab === 'hourly' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {weather.hourlyForecast.slice(0, 12).map((item, idx) => (
                <div key={idx} className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/80 flex flex-col items-center text-center space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 font-mono">{item.time}</span>
                  
                  {/* Bar Height Indicator */}
                  <div className="w-full bg-slate-900 rounded-xl h-20 relative my-1 flex items-end justify-center p-1 overflow-hidden border border-slate-800">
                    <div
                      className={`w-full rounded-lg transition-all ${
                        item.rainfallMm > 20
                          ? 'bg-gradient-to-t from-red-600 to-red-400'
                          : item.rainfallMm > 8
                          ? 'bg-gradient-to-t from-amber-500 to-yellow-400'
                          : item.rainfallMm > 0.5
                          ? 'bg-gradient-to-t from-blue-600 to-cyan-400'
                          : 'bg-slate-800'
                      }`}
                      style={{ height: `${Math.max(8, Math.min(100, (item.rainfallMm / 30) * 100))}%` }}
                    />
                  </div>

                  <span className="text-sm font-black text-white font-mono">{item.rainfallMm} <span className="text-[10px] font-normal text-slate-400">mm</span></span>
                  
                  {item.probability !== undefined && (
                    <span className="text-[10px] text-cyan-300 font-semibold">
                      💧 {item.probability}% prob
                    </span>
                  )}

                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    item.riskScore >= 75 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : item.riskScore >= 45 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                  }`}>
                    Risk: {item.riskScore}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 7-Day Daily Outlook */}
          {activeTab === 'daily' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(weather.dailyForecast || []).map((day, idx) => (
                <div key={idx} className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-white">
                    <span>{day.date}</span>
                    <span className="text-amber-400 font-mono">{day.maxTempC}°C / {day.minTempC}°C</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{day.weatherCondition}</span>
                    <span className="text-cyan-300 font-mono font-bold">{day.maxProbability}% Rain</span>
                  </div>

                  <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">Total Rain:</span>
                    <span className="font-mono font-bold text-blue-400 text-sm">{day.precipSumMm} mm</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* Main Location & Flood Risk Status Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Location Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monitored Location</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">GPS Connected</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                {userLocationName}
              </h2>
            </div>
          </div>

          <button
            onClick={onRequestLocation}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shrink-0"
          >
            <Compass className="w-4 h-4 text-slate-600" />
            <span>Update Location</span>
          </button>
        </div>

        {/* Primary Flood Risk Score Indicator */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{riskResult.iconSymbol}</span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">CURRENT FLOOD RISK STATUS</span>
                <div className="flex items-baseline gap-3">
                  <h2 className={`text-3xl sm:text-5xl font-black tracking-tight ${
                    riskResult.level === 'SEVERE' ? 'text-red-600' : riskResult.level === 'HIGH' ? 'text-amber-600' : riskResult.level === 'MODERATE' ? 'text-yellow-600' : 'text-emerald-600'
                  }`}>
                    {riskResult.badgeText}
                  </h2>
                  <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                    Score: {riskResult.score} / 100
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm font-medium text-slate-600 max-w-2xl pt-1 leading-relaxed">
              “{riskResult.advice}”
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                triggerHapticFeedback(25);
                shareFloodInfo(
                  `🚨 FloodGuard Ghana Risk Alert: ${riskResult.badgeText}`,
                  `Location: ${userLocationName}\nFlood Risk Score: ${riskResult.score}/100 (${riskResult.level})\nAdvice: ${riskResult.advice}\nRainfall: ${weather.currentRainfallMm}mm/hr`
                );
              }}
              className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow transition-all flex items-center gap-2"
            >
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>Share Alert</span>
            </button>

            <button
              onClick={playChime}
              className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-xs shadow transition-all flex items-center gap-2"
            >
              <Volume2 className={`w-4 h-4 ${audioAlertPlaying ? 'animate-bounce text-red-700' : ''}`} />
              <span>Test Chime</span>
            </button>
          </div>
        </div>

        {/* Live Weather Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
            <div className="flex items-center text-slate-500 text-xs font-bold gap-1.5 mb-1">
              <CloudRain className="w-4 h-4 text-blue-500" />
              <span>Rainfall Rate</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {weather.currentRainfallMm} <span className="text-xs font-normal text-slate-500">mm/hr</span>
            </div>
            <div className="text-[11px] font-semibold text-amber-600 mt-1">
              {weather.rainfallIntensity} Intensity
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
            <div className="flex items-center text-slate-500 text-xs font-bold gap-1.5 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Incidents Nearby</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {context.activeReportsNearby + context.blockedDrainsNearby}
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-1">
              Within 3km radius
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
            <div className="flex items-center text-slate-500 text-xs font-bold gap-1.5 mb-1">
              <Radio className="w-4 h-4 text-emerald-500" />
              <span>Closest Report</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {context.nearestReportDistKm !== null ? `${context.nearestReportDistKm} km` : 'None'}
            </div>
            <div className="text-[11px] font-medium text-slate-500 truncate mt-1">
              {context.nearestReport ? context.nearestReport.suburb : 'Area Clear'}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
              <span>Meteo Sync</span>
              <button onClick={onRefreshWeather} title="Refresh Weather">
                <RefreshCw className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>
            <div className="text-xl font-bold text-emerald-600 font-mono">
              LIVE
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-1">
              Accra Radar Station
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Core Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Primary Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <button
            onClick={() => onNavigateToView('map')}
            className="p-5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-sm transition-all flex items-center space-x-4 text-left group"
          >
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-105 transition-transform">
              <Waves className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Interactive Map</div>
              <p className="text-xs text-slate-500 mt-0.5">Accra GIS flood hazard zones</p>
            </div>
          </button>

          <button
            onClick={() => onOpenReportModal('flood')}
            className="p-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow transition-all flex items-center space-x-4 text-left group"
          >
            <div className="p-3 bg-white/20 rounded-xl text-white group-hover:scale-105 transition-transform">
              🚨
            </div>
            <div>
              <div className="text-sm font-bold text-white">Report Flood</div>
              <p className="text-xs text-red-100 mt-0.5">Voice note or photo upload</p>
            </div>
          </button>

          <button
            onClick={() => onOpenReportModal('blocked_drain')}
            className="p-5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl shadow transition-all flex items-center space-x-4 text-left group"
          >
            <div className="p-3 bg-slate-950/20 rounded-xl text-slate-950 group-hover:scale-105 transition-transform">
              🕳️
            </div>
            <div>
              <div className="text-sm font-bold text-slate-950">Report Blocked Gutter</div>
              <p className="text-xs text-slate-900 mt-0.5">Flag garbage or silt build-up</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateToView('route')}
            className="p-5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-sm transition-all flex items-center space-x-4 text-left group"
          >
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-105 transition-transform">
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Safe Commute Route</div>
              <p className="text-xs text-slate-500 mt-0.5">Avoid flooded underpasses</p>
            </div>
          </button>

        </div>
      </div>

      {/* Weather Alert Notice */}
      {weather.weatherWarning && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-900 flex items-start space-x-4">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs uppercase font-bold text-red-700 tracking-wider">⚠️ GHANA METEOROLOGICAL AGENCY BULLETIN</h4>
            <p className="text-sm mt-1 leading-relaxed font-semibold">
              {weather.weatherWarning}
            </p>
          </div>
        </div>
      )}

      {/* Tabbed Secondary Details (Incidents / Emergency Hotlines) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 space-x-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'incidents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            ⚠️ Active Reports ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'contacts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            📞 Emergency Hotlines
          </button>
        </div>

        {/* Tab 1: Nearby Incidents */}
        {activeTab === 'incidents' && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900">Recent Citizen & Authority Reports</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reports.slice(0, 4).map((report) => (
                <div key={report.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-900">{report.suburb}</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      report.severity === 'SEVERE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {report.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{report.description}</p>
                  {(report.hasVoiceNote || report.audioUrl) && (
                    <div className="bg-amber-100 border border-amber-300 rounded-xl p-2 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                        <span>🎤</span>
                        <span>Voice Note Attached</span>
                      </span>
                      <audio
                        src={report.audioUrl || 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg'}
                        controls
                        className="h-7 w-36"
                      />
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-200 flex justify-between">
                    <span>{report.address}</span>
                    <span>{report.waterDepthCm ? `${report.waterDepthCm}cm water` : 'Blocked Drain'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Emergency Hotlines */}
        {activeTab === 'contacts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">NADMO & Rescue Emergency Contacts</h4>
              <button
                onClick={() => onNavigateToView('emergency')}
                className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
              >
                <span>View All Shelters</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">NADMO Headquarters Hotline</div>
                  <div className="text-sm font-mono text-red-600 font-bold mt-0.5">0302-772926</div>
                </div>
                <a href="tel:0302772926" className="p-2.5 bg-red-600 text-white rounded-xl text-xs font-bold">Call</a>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Ghana National Fire & Rescue</div>
                  <div className="text-sm font-mono text-red-600 font-bold mt-0.5">192 / 0302-772446</div>
                </div>
                <a href="tel:192" className="p-2.5 bg-red-600 text-white rounded-xl text-xs font-bold">Call</a>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
