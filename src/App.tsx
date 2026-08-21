import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { FloodMap } from './components/FloodMap';
import { ReportModal } from './components/ReportModal';
import { SafeRoutePlanner } from './components/SafeRoutePlanner';
import { EmergencyScreen } from './components/EmergencyScreen';
import { AuthorityDashboard } from './components/AuthorityDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { SavedLocationsModal } from './components/SavedLocationsModal';
import { MobileInstallModal } from './components/MobileInstallModal';
import { MobileBottomNav } from './components/MobileBottomNav';

import { UserRole, PreferredLanguage, FloodReport, FloodZone, EmergencyContact, WeatherData, SystemAnalytics, SavedLocation } from './types';
import { INITIAL_DEMO_REPORTS, INITIAL_FLOOD_ZONES, OFFICIAL_EMERGENCY_CONTACTS, INITIAL_WEATHER_DATA, INITIAL_SYSTEM_ANALYTICS, INITIAL_SAVED_LOCATIONS } from './data/ghanaData';
import { fetchGhanaWeather } from './services/weatherService';
import { saveOfflineReport, getOfflineReports, clearOfflineReports } from './services/offlineStorage';

export default function App() {
  const [activeView, setActiveView] = useState<string>('home');
  const [currentRole, setRole] = useState<UserRole>('USER');
  const [language, setLanguage] = useState<PreferredLanguage>('en');
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [lowDataMode, setLowDataMode] = useState<boolean>(false);
  const [demoDataActive, setDemoDataActive] = useState<boolean>(true);

  // User GPS state (defaulting to Kwame Nkrumah Circle, Accra)
  const [userLat, setUserLat] = useState<number>(5.5587);
  const [userLng, setUserLng] = useState<number>(-0.2072);
  const [userLocationName, setUserLocationName] = useState<string>('Kwame Nkrumah Circle, Accra');

  // Application Data States
  const [reports, setReports] = useState<FloodReport[]>(INITIAL_DEMO_REPORTS);
  const [zones, setZones] = useState<FloodZone[]>(INITIAL_FLOOD_ZONES);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(OFFICIAL_EMERGENCY_CONTACTS);
  const [weather, setWeather] = useState<WeatherData>(INITIAL_WEATHER_DATA);
  const [analytics, setAnalytics] = useState<SystemAnalytics>(INITIAL_SYSTEM_ANALYTICS);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>(INITIAL_SAVED_LOCATIONS);

  // Modals & Banners
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportModalType, setReportModalType] = useState<'flood' | 'blocked_drain'>('flood');
  const [isSavedLocationsOpen, setIsSavedLocationsOpen] = useState<boolean>(false);
  const [isMobileInstallOpen, setIsMobileInstallOpen] = useState<boolean>(false);
  const [broadcastAlert, setBroadcastAlert] = useState<any>(null);

  // Detect Network Status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch Live Weather Data on Mount
  useEffect(() => {
    fetchGhanaWeather(userLat, userLng).then(w => setWeather(w));
  }, [userLat, userLng]);

  // Request GPS Location
  const handleRequestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const name = `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          setUserLat(lat);
          setUserLng(lng);
          setUserLocationName(name);
          fetchGhanaWeather(lat, lng, name).then(w => setWeather(w));
        },
        (err) => {
          alert('GPS location permission denied or unavailable. Using Accra Central coordinates.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Select Custom Location
  const handleSelectLocation = (lat: number, lng: number, name: string) => {
    setUserLat(lat);
    setUserLng(lng);
    setUserLocationName(name);
    fetchGhanaWeather(lat, lng, name).then(w => setWeather(w));
  };

  // Submit New Report
  const handleSubmitReport = (reportData: any) => {
    if (isOffline) {
      const draft = saveOfflineReport(reportData);
      setReports([draft, ...reports]);
      return;
    }

    fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...reportData, userId: 'user-current' })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.report) {
          setReports([data.report, ...reports]);
        }
      })
      .catch(err => {
        // Fallback local insertion if server endpoint is unavailable
        const localReport: FloodReport = {
          ...reportData,
          id: `rep-${Date.now()}`,
          status: 'pending',
          verificationScore: 65,
          confidenceFactors: ['Citizen Submission', 'Geolocated GPS match'],
          upvotes: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setReports([localReport, ...reports]);
      });
  };

  // Authority Verification
  const handleVerifyReport = (id: string, status: FloodReport['status'], verificationScore: number, assignedTo?: string, notes?: string) => {
    setReports(reports.map(r => r.id === id ? { ...r, status, verificationScore, assignedTo } : r));
    fetch(`/api/reports/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, verificationScore, assignedTo, notes })
    }).catch(e => console.warn('Sync verify error:', e));
  };

  // Saved Locations Management
  const handleAddSavedLocation = (name: string, address: string) => {
    const newLoc: SavedLocation = {
      id: `sl-${Date.now()}`,
      userId: 'user-current',
      name,
      address,
      latitude: userLat + 0.01,
      longitude: userLng + 0.01,
      currentRiskLevel: 'MODERATE',
      lastUpdated: 'Just now'
    };
    setSavedLocations([...savedLocations, newLoc]);
  };

  const handleDeleteSavedLocation = (id: string) => {
    setSavedLocations(savedLocations.filter(sl => sl.id !== id));
  };

  return (
    <div className="min-h-screen bg-white text-zinc-950 flex flex-col font-sans selection:bg-black selection:text-white">
      
      {/* Navigation Header */}
      <Header
        currentRole={currentRole}
        setRole={setRole}
        language={language}
        setLanguage={setLanguage}
        isOffline={isOffline}
        lowDataMode={lowDataMode}
        setLowDataMode={setLowDataMode}
        onOpenSavedLocations={() => setIsSavedLocationsOpen(true)}
        onOpenMobileInstall={() => setIsMobileInstallOpen(true)}
        demoDataActive={demoDataActive}
        toggleDemoData={() => setDemoDataActive(!demoDataActive)}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Broadcast Alert Banner if active */}
      {broadcastAlert && (
        <div className="bg-red-600 text-white font-black text-xs uppercase tracking-widest p-3 text-center border-b-2 border-black flex items-center justify-center gap-2 animate-pulse">
          <span>📢 {broadcastAlert.title}: {broadcastAlert.message}</span>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 pb-20 md:pb-12 bg-zinc-50">
        {activeView === 'home' && (
          <HomeScreen
            weather={weather}
            reports={reports}
            zones={zones}
            userLat={userLat}
            userLng={userLng}
            userLocationName={userLocationName}
            onRequestLocation={handleRequestLocation}
            onSelectLocation={handleSelectLocation}
            onOpenReportModal={(type) => {
              setReportModalType(type);
              setIsReportModalOpen(true);
            }}
            onNavigateToView={setActiveView}
            onRefreshWeather={() => fetchGhanaWeather(userLat, userLng, userLocationName).then(w => setWeather(w))}
          />
        )}

        {activeView === 'map' && (
          <FloodMap
            reports={reports}
            zones={zones}
            emergencyContacts={emergencyContacts}
            userLat={userLat}
            userLng={userLng}
            lowDataMode={lowDataMode}
            onOpenReportModal={(type) => {
              setReportModalType(type);
              setIsReportModalOpen(true);
            }}
          />
        )}

        {activeView === 'route' && (
          <SafeRoutePlanner
            userLat={userLat}
            userLng={userLng}
            userLocationName={userLocationName}
            activeReports={reports}
          />
        )}

        {activeView === 'emergency' && (
          <EmergencyScreen contacts={emergencyContacts} />
        )}

        {activeView === 'authority' && (
          <AuthorityDashboard
            reports={reports}
            analytics={analytics}
            onVerifyReport={handleVerifyReport}
            onRefreshData={() => {
              fetch('/api/reports')
                .then(r => r.json())
                .then(data => { if (data.reports) setReports(data.reports); });
            }}
          />
        )}

        {activeView === 'admin' && (
          <AdminDashboard
            zones={zones}
            onBroadcastAlert={(alert) => setBroadcastAlert(alert)}
          />
        )}
      </main>

      {/* Modals */}
      <ReportModal
        initialType={reportModalType}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        userLat={userLat}
        userLng={userLng}
        onSubmitReport={handleSubmitReport}
        isOffline={isOffline}
      />

      <SavedLocationsModal
        isOpen={isSavedLocationsOpen}
        onClose={() => setIsSavedLocationsOpen(false)}
        savedLocations={savedLocations}
        onAddLocation={handleAddSavedLocation}
        onDeleteLocation={handleDeleteSavedLocation}
      />

      <MobileInstallModal
        isOpen={isMobileInstallOpen}
        onClose={() => setIsMobileInstallOpen(false)}
      />

      {/* Sticky Bottom Navigation Bar (PC, iOS & Android) */}
      <MobileBottomNav
        activeView={activeView}
        setActiveView={setActiveView}
        currentRole={currentRole}
        setRole={setRole}
        onOpenReportModal={(type) => {
          setReportModalType(type);
          setIsReportModalOpen(true);
        }}
      />

      {/* Footer Bar */}
      <footer className="bg-black text-white border-t-2 border-black py-5 px-6 pb-24 text-center text-xs font-black uppercase tracking-widest flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="text-amber-400">FloodGuard Ghana Platform</span>
          <span className="hidden md:inline opacity-40">|</span>
          <span className="text-zinc-400 font-medium">“Know. Avoid. Report. Prevent.”</span>
        </div>
        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
          NADMO & AMA VERIFIED PLATFORM © 2026
        </div>
      </footer>

    </div>
  );
}
