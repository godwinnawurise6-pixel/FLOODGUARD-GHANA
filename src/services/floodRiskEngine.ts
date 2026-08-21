import { RiskLevel, FloodReport, FloodZone } from '../types';

export interface CalculateRiskParams {
  rainfallIntensityMmHr: number;
  rainfallAccumulationMm24h: number;
  historicalFrequencyPerYr: number;
  elevationMeters: number;
  blockedDrainsNearby: number;
  activeReportsNearby: number;
}

export interface RiskCalculationResult {
  score: number; // 0 - 100
  level: RiskLevel;
  displayColor: string;
  badgeBg: string;
  badgeText: string;
  iconSymbol: string;
  advice: string;
  breakdown: {
    rainfallFactor: number;
    elevationFactor: number;
    drainageFactor: number;
    historyFactor: number;
    reportsFactor: number;
  };
}

export function calculateFloodRiskScore(params: CalculateRiskParams): RiskCalculationResult {
  // 1. Rainfall intensity factor (0 - 100)
  // 0mm/h = 0, 10mm/h = 30, 30mm/h = 70, 50+mm/h = 100
  const rainfallIntensityFactor = Math.min(100, (params.rainfallIntensityMmHr / 50) * 100);

  // 2. Rainfall accumulation factor (0 - 100)
  // 0mm = 0, 30mm = 40, 70mm = 80, 100+mm = 100
  const rainfallAccumulationFactor = Math.min(100, (params.rainfallAccumulationMm24h / 100) * 100);

  const totalRainfallScore = (rainfallIntensityFactor * 0.5) + (rainfallAccumulationFactor * 0.5);

  // 3. Historical frequency factor (0 - 100)
  // 0 = 0, 15+ per year = 100
  const historyFactor = Math.min(100, (params.historicalFrequencyPerYr / 15) * 100);

  // 4. Elevation risk factor (0 - 100)
  // Sea level / low elevation (< 5m) = high risk (100). Higher elevation (> 50m) = low risk (0)
  const elevationFactor = Math.max(0, Math.min(100, 100 - (params.elevationMeters * 2)));

  // 5. Drainage condition factor based on nearby blocked drains (0 - 100)
  // 0 drains = 0, 5+ blocked drains nearby = 100
  const drainageFactor = Math.min(100, params.blockedDrainsNearby * 20);

  // 6. Active reports nearby factor (0 - 100)
  // 0 = 0, 4+ active flood reports = 100
  const reportsFactor = Math.min(100, params.activeReportsNearby * 25);

  // Weighted combination
  const score = Math.round(
    (totalRainfallScore * 0.35) +
    (historyFactor * 0.20) +
    (elevationFactor * 0.15) +
    (drainageFactor * 0.15) +
    (reportsFactor * 0.15)
  );

  let level: RiskLevel = 'LOW';
  let displayColor = '#10B981'; // Emerald Green
  let badgeBg = 'bg-emerald-100 text-emerald-900 border-emerald-300';
  let badgeText = 'LOW FLOOD RISK';
  let iconSymbol = '🟢';
  let advice = 'No immediate flood risk detected. Standard weather conditions.';

  if (score >= 81) {
    level = 'SEVERE';
    displayColor = '#EF4444'; // Red
    badgeBg = 'bg-red-100 text-red-900 border-red-400 font-bold animate-pulse';
    badgeText = '🔴 SEVERE FLOOD RISK';
    iconSymbol = '🚨';
    advice = 'Flash flooding likely or actively occurring in low-lying roads & drains. Avoid flooded roads and seek safe high ground.';
  } else if (score >= 61) {
    level = 'HIGH';
    displayColor = '#F97316'; // Orange
    badgeBg = 'bg-orange-100 text-orange-900 border-orange-400 font-semibold';
    badgeText = '🟠 HIGH FLOOD RISK';
    iconSymbol = '🟠';
    advice = 'Heavy rainfall accumulated. Waterlogging likely near gutters & underpasses. Drivers exercise extreme caution.';
  } else if (score >= 31) {
    level = 'MODERATE';
    displayColor = '#F59E0B'; // Amber
    badgeBg = 'bg-amber-100 text-amber-900 border-amber-300';
    badgeText = '🟡 MODERATE FLOOD RISK';
    iconSymbol = '🟡';
    advice = 'Moderate rain expected. Check local drainage status before commuting.';
  }

  return {
    score,
    level,
    displayColor,
    badgeBg,
    badgeText,
    iconSymbol,
    advice,
    breakdown: {
      rainfallFactor: Math.round(totalRainfallScore),
      elevationFactor: Math.round(elevationFactor),
      drainageFactor: Math.round(drainageFactor),
      historyFactor: Math.round(historyFactor),
      reportsFactor: Math.round(reportsFactor),
    }
  };
}

/**
 * Calculates distance in kilometers between two GPS coordinates using Haversine formula
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get nearest flood zone and active reports summary for a user's coordinate
 */
export function evaluateLocationContext(
  userLat: number,
  userLng: number,
  reports: FloodReport[],
  zones: FloodZone[]
) {
  let nearestReportDistKm = Infinity;
  let nearestReport: FloodReport | null = null;
  let activeReportsNearby = 0;
  let blockedDrainsNearby = 0;

  reports.forEach(r => {
    if (r.status === 'rejected' || r.status === 'resolved') return;
    const dist = haversineDistanceKm(userLat, userLng, r.latitude, r.longitude);
    if (dist <= 3.0) {
      if (r.type === 'flood') activeReportsNearby++;
      if (r.type === 'blocked_drain') blockedDrainsNearby++;
    }
    if (dist < nearestReportDistKm) {
      nearestReportDistKm = dist;
      nearestReport = r;
    }
  });

  let nearestZone: FloodZone | null = null;
  let nearestZoneDist = Infinity;

  zones.forEach(z => {
    const dist = haversineDistanceKm(userLat, userLng, z.latitude, z.longitude);
    if (dist < nearestZoneDist) {
      nearestZoneDist = dist;
      nearestZone = z;
    }
  });

  return {
    nearestReportDistKm: Number.isFinite(nearestReportDistKm) ? Math.round(nearestReportDistKm * 10) / 10 : null,
    nearestReport,
    activeReportsNearby,
    blockedDrainsNearby,
    nearestZone,
  };
}
