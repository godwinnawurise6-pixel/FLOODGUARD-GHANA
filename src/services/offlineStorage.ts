import { FloodReport } from '../types';

const OFFLINE_REPORTS_KEY = 'floodguard_offline_draft_reports';

export function saveOfflineReport(report: Omit<FloodReport, 'id' | 'createdAt' | 'updatedAt' | 'verificationScore' | 'confidenceFactors' | 'upvotes' | 'status'>): FloodReport {
  const existing = getOfflineReports();
  const draftReport: FloodReport = {
    ...report,
    id: `draft-${Date.now()}`,
    status: 'pending',
    verificationScore: 50,
    confidenceFactors: ['Saved while offline', 'Awaiting network sync'],
    upvotes: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  existing.push(draftReport);
  localStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(existing));
  return draftReport;
}

export function getOfflineReports(): FloodReport[] {
  try {
    const raw = localStorage.getItem(OFFLINE_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to parse offline reports:', err);
    return [];
  }
}

export function clearOfflineReports(): void {
  localStorage.removeItem(OFFLINE_REPORTS_KEY);
}
