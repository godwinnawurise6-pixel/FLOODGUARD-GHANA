import React, { useState } from 'react';
import { UserRole, FloodZone } from '../types';
import { Shield, Users, Radio, Sliders, Database, Key, Activity, Check, Trash2, AlertTriangle, Lock } from 'lucide-react';

interface AdminDashboardProps {
  zones: FloodZone[];
  onBroadcastAlert: (alertData: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  zones,
  onBroadcastAlert,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'zones' | 'alerts' | 'api'>('users');

  const [alertTitle, setAlertTitle] = useState('🔴 SEVERE FLOOD WARNING: ODAW DRAIN OVERFLOW');
  const [alertMessage, setAlertMessage] = useState('Heavy rain has caused significant water accumulation around Kwame Nkrumah Circle underpass and Odawna. Avoid low-lying roads.');
  const [alertBroadcastSent, setAlertBroadcastSent] = useState(false);

  const [usersList, setUsersList] = useState([
    { id: 'u1', name: 'Kofi Mensah', email: 'kofi@ghana.com', role: 'USER' as UserRole, phone: '0244123456', status: 'Active' },
    { id: 'u2', name: 'Ama Serwaa', email: 'ama@nadmo.gov.gh', role: 'AUTHORITY' as UserRole, phone: '0200987654', status: 'Active' },
    { id: 'u3', name: 'Kwaku Appiah', email: 'kwaku@driver.com', role: 'DRIVER' as UserRole, phone: '0277334455', status: 'Active' },
    { id: 'u4', name: 'Dr. Quaye', email: 'quaye@floodguard.gh', role: 'ADMIN' as UserRole, phone: '0266112233', status: 'Active' },
  ]);

  const handleRoleChange = (id: string, newRole: UserRole) => {
    setUsersList(usersList.map(u => u.id === id ? { ...u, role: newRole } : u));
  };

  const handleSendAlert = (e: React.FormEvent) => {
    e.preventDefault();
    onBroadcastAlert({
      title: alertTitle,
      message: alertMessage,
      createdAt: new Date().toISOString()
    });
    setAlertBroadcastSent(true);
    setTimeout(() => setAlertBroadcastSent(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Admin Title Header */}
      <div className="bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-yellow-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase text-black">SYSTEM ADMINISTRATOR & GOVERNANCE</h1>
            <p className="text-xs font-bold text-zinc-600 mt-0.5">
              Manage Access Control (RBAC), broadcast early warnings, update flood-risk zones, and monitor API keys.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-black space-x-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-4 -mb-[6px] ${
            activeTab === 'users' ? 'border-black text-black' : 'border-transparent text-zinc-400 hover:text-black'
          }`}
        >
          👥 User & Role Access
        </button>
        <button
          onClick={() => setActiveTab('zones')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-4 -mb-[6px] ${
            activeTab === 'zones' ? 'border-black text-black' : 'border-transparent text-zinc-400 hover:text-black'
          }`}
        >
          🗺️ Flood-Risk Zones
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-4 -mb-[6px] ${
            activeTab === 'alerts' ? 'border-black text-black' : 'border-transparent text-zinc-400 hover:text-black'
          }`}
        >
          📢 Broadcast Alert
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-4 -mb-[6px] ${
            activeTab === 'api' ? 'border-black text-black' : 'border-transparent text-zinc-400 hover:text-black'
          }`}
        >
          🔑 Security & API Keys
        </button>
      </div>

      {/* TAB 1: Users & RBAC */}
      {activeTab === 'users' && (
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <h3 className="text-base font-black uppercase text-black">Registered System Users & Access Privileges</h3>
          <div className="overflow-x-auto border-2 border-black">
            <table className="w-full text-left text-xs">
              <thead className="bg-black text-white font-mono font-black uppercase border-b-2 border-black">
                <tr>
                  <th className="p-3">User Name</th>
                  <th className="p-3">Email & Phone</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Modify Access</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50">
                    <td className="p-3 font-black text-black">{u.name}</td>
                    <td className="p-3 font-bold text-zinc-700">{u.email}<br/><span className="text-[10px] font-mono text-zinc-500">{u.phone}</span></td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 border border-black font-mono font-black text-[10px] uppercase ${
                        u.role === 'ADMIN' ? 'bg-black text-white' : u.role === 'AUTHORITY' ? 'bg-emerald-400 text-black' : 'bg-yellow-400 text-black'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-emerald-600 font-black uppercase">{u.status}</td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="bg-white text-black text-xs font-bold uppercase p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <option value="USER">USER (Citizen)</option>
                        <option value="DRIVER">DRIVER</option>
                        <option value="AUTHORITY">AUTHORITY (NADMO)</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Risk Zone Config */}
      {activeTab === 'zones' && (
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <h3 className="text-base font-black uppercase text-black">Configured Greater Accra Flood Risk Basins</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {zones.map((z) => (
              <div key={z.id} className="bg-zinc-50 p-4 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black uppercase text-black">{z.name}</span>
                  <span className="font-mono text-orange-600 font-black">{z.riskLevel}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-zinc-700">
                  <div>District: {z.district}</div>
                  <div>Historical Freq: {z.historicalFrequency}/yr</div>
                  <div>Elevation: {z.elevationMeters}m</div>
                  <div>Risk Score: {z.riskScore}/100</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Broadcast Warning Alerts */}
      {activeTab === 'alerts' && (
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <h3 className="text-base font-black uppercase text-black">Broadcast In-App Early Flood Warning</h3>
          
          <form onSubmit={handleSendAlert} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-black mb-1">Alert Headline / Title</label>
              <input
                type="text"
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                className="w-full bg-white text-black text-xs font-bold uppercase p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-black mb-1">Alert Message</label>
              <textarea
                rows={3}
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                className="w-full bg-white text-black text-xs font-bold p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            <button
              type="submit"
              className="py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs tracking-widest border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-colors"
            >
              🚀 Broadcast Warning Alert Now
            </button>

            {alertBroadcastSent && (
              <p className="text-xs text-emerald-600 font-black uppercase">
                ✅ Warning Alert broadcasted to all active citizens & drivers!
              </p>
            )}
          </form>
        </div>
      )}

      {/* TAB 4: API Configuration & Security */}
      {activeTab === 'api' && (
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4 text-xs font-bold">
          <h3 className="text-base font-black uppercase text-black">API Keys & Security Configuration</h3>
          <div className="bg-zinc-50 p-4 border-2 border-black space-y-3">
            <div className="flex justify-between items-center">
              <span>Gemini AI API Key (Server Proxy)</span>
              <span className="font-mono text-emerald-600 font-black">CONFIGURED IN .env.example</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Open-Meteo Weather API Integration</span>
              <span className="font-mono text-emerald-600 font-black">ACTIVE & SYNCED</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Firestore / Security Rules Audit</span>
              <span className="font-mono text-emerald-600 font-black">ENFORCED RBAC</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
