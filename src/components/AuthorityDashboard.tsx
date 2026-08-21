import React, { useState } from 'react';
import { FloodReport, SystemAnalytics } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ShieldCheck, AlertCircle, CheckCircle, Clock, UserCheck, Users, FileText, Send, RefreshCw, BarChart2 } from 'lucide-react';

interface AuthorityDashboardProps {
  reports: FloodReport[];
  analytics: SystemAnalytics;
  onVerifyReport: (id: string, status: FloodReport['status'], verificationScore: number, assignedTo?: string, notes?: string) => void;
  onRefreshData: () => void;
}

export const AuthorityDashboard: React.FC<AuthorityDashboardProps> = ({
  reports,
  analytics,
  onVerifyReport,
  onRefreshData,
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'reports' | 'response' | 'analytics'>('overview');
  const [selectedReport, setSelectedReport] = useState<FloodReport | null>(reports[0] || null);
  const [assignTeam, setAssignTeam] = useState<string>('NADMO Rapid Response Team A');
  const [dispatchNotes, setDispatchNotes] = useState<string>('');
  const [verificationScoreInput, setVerificationScoreInput] = useState<number>(90);

  const COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#6366F1'];

  const pendingReports = reports.filter(r => r.status === 'pending' || r.status === 'under_review');
  const verifiedReports = reports.filter(r => r.status === 'verified');
  const resolvedReports = reports.filter(r => r.status === 'resolved');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Dashboard Top Header */}
      <div className="bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-black text-white text-[10px] px-2.5 py-1 font-mono font-bold uppercase border border-black">
              NADMO / AMA OFFICIAL CONTROL PORTAL
            </span>
            <span className="text-xs text-zinc-500 font-mono font-bold uppercase">LIVE SESSION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-black">RESPONSE & VERIFICATION CENTER</h1>
          <p className="text-xs font-bold text-zinc-600 mt-1">
            Verify citizen flood & drainage reports, assign emergency field teams, and track response metrics across Greater Accra.
          </p>
        </div>

        <button
          onClick={onRefreshData}
          className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4 text-black" />
          <span>Sync Incident Feed</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-[10px] uppercase font-black text-zinc-500 block">Total Reports</span>
          <span className="text-3xl font-black text-black">{analytics.totalReports}</span>
        </div>

        <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-[10px] uppercase font-black text-orange-600 block">Awaiting Action</span>
          <span className="text-3xl font-black text-orange-600">{pendingReports.length}</span>
        </div>

        <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-[10px] uppercase font-black text-emerald-600 block">Verified</span>
          <span className="text-3xl font-black text-emerald-600">{verifiedReports.length}</span>
        </div>

        <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-[10px] uppercase font-black text-purple-700 block">Blocked Drains</span>
          <span className="text-3xl font-black text-purple-700">{analytics.blockedDrainsCount}</span>
        </div>

        <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-[10px] uppercase font-black text-blue-600 block">Resolved</span>
          <span className="text-3xl font-black text-blue-600">{resolvedReports.length}</span>
        </div>

        <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-[10px] uppercase font-black text-zinc-500 block">Avg Response</span>
          <span className="text-3xl font-black text-black">{analytics.avgResponseTimeHours} <span className="text-xs font-bold text-zinc-500">hrs</span></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-black space-x-6 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedTab('overview')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-4 -mb-[6px] ${
            selectedTab === 'overview' ? 'border-black text-black' : 'border-transparent text-zinc-400 hover:text-black'
          }`}
        >
          📋 Incident Queue ({reports.length})
        </button>
        <button
          onClick={() => setSelectedTab('reports')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-4 -mb-[6px] ${
            selectedTab === 'reports' ? 'border-black text-black' : 'border-transparent text-zinc-400 hover:text-black'
          }`}
        >
          🔍 Verification Engine
        </button>
        <button
          onClick={() => setSelectedTab('response')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-4 -mb-[6px] ${
            selectedTab === 'response' ? 'border-black text-black' : 'border-transparent text-zinc-400 hover:text-black'
          }`}
        >
          🚒 Field Response Teams
        </button>
        <button
          onClick={() => setSelectedTab('analytics')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-4 -mb-[6px] ${
            selectedTab === 'analytics' ? 'border-black text-black' : 'border-transparent text-zinc-400 hover:text-black'
          }`}
        >
          📊 Analytics & Charts
        </button>
      </div>

      {/* TAB 1 & 2: Incident Verification Queue */}
      {(selectedTab === 'overview' || selectedTab === 'reports') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Incident Table */}
          <div className="lg:col-span-2 bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <h3 className="text-sm font-black uppercase text-black">Submitted Incident Queue</h3>
            <div className="overflow-x-auto border-2 border-black">
              <table className="w-full text-left text-xs">
                <thead className="bg-black text-white font-mono font-black uppercase border-b-2 border-black">
                  <tr>
                    <th className="p-3">Location</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Score</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black">
                  {reports.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedReport(r)}
                      className={`cursor-pointer hover:bg-yellow-100 transition-colors ${
                        selectedReport?.id === r.id ? 'bg-yellow-200 font-bold' : ''
                      }`}
                    >
                      <td className="p-3">
                        <div className="font-black text-black">{r.address}</div>
                        <div className="text-[10px] text-orange-600 uppercase font-black">{r.suburb} ({r.type === 'flood' ? 'Flood' : 'Drain'})</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 border border-black font-mono font-black text-[10px] uppercase ${
                          r.severity === 'SEVERE' ? 'bg-red-600 text-white' : 'bg-yellow-400 text-black'
                        }`}>
                          {r.severity}
                        </span>
                      </td>
                      <td className="p-3 uppercase font-mono font-bold text-[10px] text-zinc-700">
                        {r.status}
                      </td>
                      <td className="p-3 font-mono font-black text-black">
                        {r.verificationScore}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedReport(r)}
                          className="px-2.5 py-1 bg-black text-white hover:bg-zinc-800 border border-black text-[10px] font-black uppercase"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verification Panel */}
          <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
            {selectedReport ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">Reviewing ID: {selectedReport.id}</span>
                  <h3 className="text-lg font-black uppercase text-black">{selectedReport.address}</h3>
                  <p className="text-xs font-bold text-zinc-700 mt-1">{selectedReport.description}</p>
                </div>

                {/* Voice Note Audio Recording Player for Rescue Officers */}
                {(selectedReport.hasVoiceNote || selectedReport.audioUrl) && (
                  <div className="bg-amber-100 border-2 border-black p-3 space-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center justify-between text-xs font-black text-amber-950 uppercase">
                      <span className="flex items-center gap-1.5">
                        <span>🎤</span>
                        <span>Citizen Voice Audio Recording Attached</span>
                      </span>
                      <span className="bg-amber-300 px-2 py-0.5 rounded border border-black text-[10px]">Twi / Ga / English</span>
                    </div>
                    <audio
                      src={selectedReport.audioUrl || 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg'}
                      controls
                      className="w-full h-8 mt-1"
                    />
                  </div>
                )}

                <div className="bg-zinc-50 p-3.5 border-2 border-black space-y-2 text-xs">
                  <div className="flex justify-between font-black uppercase">
                    <span className="text-zinc-600">Verification Score:</span>
                    <span className="text-emerald-600">{selectedReport.verificationScore} / 100</span>
                  </div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">
                    Factors: {selectedReport.confidenceFactors.join(' • ')}
                  </div>
                </div>

                {/* Dispatch & Assign Form */}
                <div className="space-y-3 pt-3 border-t-2 border-black">
                  <label className="block text-xs font-black uppercase text-black">Assign Field Response Team</label>
                  <select
                    value={assignTeam}
                    onChange={(e) => setAssignTeam(e.target.value)}
                    className="w-full bg-white text-black text-xs font-bold uppercase p-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <option value="NADMO Rapid Response Team A">NADMO Rapid Response Team A (Circle)</option>
                    <option value="Accra Metropolitan Assembly Sanitation Unit">AMA Sanitation Unit (Drainage)</option>
                    <option value="Ghana Highway Authority District Office">Ghana Highway Authority (Pumping)</option>
                    <option value="Red Cross Rescue Unit">Red Cross Ghana Rescue</option>
                  </select>

                  <label className="block text-xs font-black uppercase text-black">Dispatch Instructions / Notes</label>
                  <textarea
                    rows={2}
                    placeholder="E.g., Deploy water pumps and seal off underpass..."
                    value={dispatchNotes}
                    onChange={(e) => setDispatchNotes(e.target.value)}
                    className="w-full bg-white text-black text-xs font-bold p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => onVerifyReport(selectedReport.id, 'verified', 95, assignTeam, dispatchNotes)}
                      className="py-2.5 bg-black text-white hover:bg-zinc-800 font-black uppercase text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      ✅ Verify & Dispatch
                    </button>
                    <button
                      onClick={() => onVerifyReport(selectedReport.id, 'rejected', 20)}
                      className="py-2.5 bg-red-600 text-white hover:bg-red-700 font-black uppercase text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      ❌ Reject Report
                    </button>
                  </div>
                  <button
                    onClick={() => onVerifyReport(selectedReport.id, 'resolved', 100)}
                    className="w-full py-2.5 bg-emerald-400 text-black hover:bg-emerald-300 font-black uppercase text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mt-2"
                  >
                    🟢 Mark Incident Resolved
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500 text-xs font-bold uppercase">
                Select an incident from the queue to verify or assign teams.
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: Response Field Teams Status */}
      {selectedTab === 'response' && (
        <div className="bg-white border-2 border-black p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-base font-black uppercase text-black">Active Field Response Assignments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.filter(r => r.assignedTo).map((r) => (
              <div key={r.id} className="bg-zinc-50 p-4 border-2 border-black space-y-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black uppercase text-black">{r.assignedTo}</span>
                  <span className="bg-black text-white font-mono text-[10px] px-2 py-0.5 border border-black uppercase font-bold">
                    Responding
                  </span>
                </div>
                <h4 className="text-sm font-black uppercase text-black">{r.address} ({r.suburb})</h4>
                <p className="text-xs font-bold text-zinc-700">{r.description}</p>
                <div className="text-[10px] font-mono font-bold text-zinc-500 pt-2 border-t-2 border-black flex justify-between">
                  <span>Assigned: {new Date(r.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-orange-600 font-black">Depth: {r.waterDepthCm} cm</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Recharts Data Visualization */}
      {selectedTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Incidents by District Bar Chart */}
          <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
            <h3 className="text-sm font-black uppercase text-black">Incidents by Greater Accra District</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.incidentsByDistrict}>
                  <XAxis dataKey="district" stroke="#000000" fontSize={10} fontWeight="bold" />
                  <YAxis stroke="#000000" fontSize={10} fontWeight="bold" />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#000000', color: '#000', fontWeight: 'bold' }} />
                  <Bar dataKey="count" fill="#000000" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Incidents Trend */}
          <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
            <h3 className="text-sm font-black uppercase text-black">Monthly Incidents Trend (Floods vs Drains)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.incidentsByMonth}>
                  <XAxis dataKey="month" stroke="#000000" fontSize={10} fontWeight="bold" />
                  <YAxis stroke="#000000" fontSize={10} fontWeight="bold" />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#000000', color: '#000', fontWeight: 'bold' }} />
                  <Bar dataKey="flood" fill="#DC2626" name="Floods" />
                  <Bar dataKey="drain" fill="#EAB308" name="Blocked Drains" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
