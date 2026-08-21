import { RouteOption, FloodReport, RiskLevel } from '../types';
import { haversineDistanceKm } from './floodRiskEngine';

export interface CalculateRouteParams {
  fromName: string;
  fromLat: number;
  fromLng: number;
  toName: string;
  toLat: number;
  toLng: number;
  activeReports: FloodReport[];
}

export function calculateFloodAwareRoutes(params: CalculateRouteParams): RouteOption[] {
  const { fromLat, fromLng, toLat, toLng, activeReports } = params;

  // Direct distance between origin and destination
  const directDistKm = haversineDistanceKm(fromLat, fromLng, toLat, toLng);
  
  // Find severe flood reports near direct path
  const midLat = (fromLat + toLat) / 2;
  const midLng = (fromLng + toLng) / 2;

  const nearbyHazards = activeReports.filter(r => {
    if (r.status === 'rejected' || r.status === 'resolved') return false;
    const dist = haversineDistanceKm(midLat, midLng, r.latitude, r.longitude);
    return dist <= 1.8 && (r.severity === 'SEVERE' || r.severity === 'HIGH' || r.roadPassable === 'no');
  });

  const hasSevereObstruction = nearbyHazards.some(h => h.severity === 'SEVERE' || h.roadPassable === 'no');

  // Direct / Standard Route
  const routeA_dist = Math.round((directDistKm * 1.25) * 10) / 10;
  const routeA_mins = Math.round(routeA_dist * 3.5);
  const routeA_hazards = nearbyHazards.map(h => `⚠️ ${h.severity} Flooding reported at ${h.address} (${h.waterDepthCm}cm depth - Road Passable: ${h.roadPassable.toUpperCase()})`);

  let routeA_risk: RiskLevel = 'LOW';
  if (hasSevereObstruction) routeA_risk = 'SEVERE';
  else if (nearbyHazards.length > 0) routeA_risk = 'HIGH';

  // Safe Detour Route (Detours around Odaw drain / Circle / Kaneshie underpass hotspots)
  const routeB_dist = Math.round((routeA_dist * 1.2) * 10) / 10;
  const routeB_mins = Math.round(routeA_mins + 8);
  const routeB_hazards = routeA_hazards.length > 0 
    ? ['✅ Bypasses Nkrumah Circle / Odawna flood basin via Ring Road Bypass', '✅ Uses elevated bypass bridges']
    : ['Safe clear route with no reported drainage obstructions'];

  // Waypoints generation for map rendering
  const waypointsA: [number, number][] = [
    [fromLat, fromLng],
    [midLat + 0.003, midLng - 0.002],
    [toLat, toLng]
  ];

  const waypointsB: [number, number][] = [
    [fromLat, fromLng],
    [fromLat + 0.008, fromLng - 0.008], // Detour northward away from low basin
    [toLat + 0.004, toLng + 0.002],
    [toLat, toLng]
  ];

  const routeA: RouteOption = {
    id: 'route-direct',
    name: `Direct Route (via Main Arterial Road)`,
    distanceKm: routeA_dist,
    durationMins: routeA_mins,
    riskLevel: routeA_risk,
    isRecommended: !hasSevereObstruction,
    hazardWarnings: routeA_hazards.length > 0 ? routeA_hazards : ['Standard traffic conditions'],
    waypoints: waypointsA
  };

  const routeB: RouteOption = {
    id: 'route-safe-detour',
    name: `Flood-Aware Safe Route (Elevated Bypass)`,
    distanceKm: routeB_dist,
    durationMins: routeB_mins,
    riskLevel: 'LOW',
    isRecommended: hasSevereObstruction || routeA_risk === 'HIGH',
    hazardWarnings: routeB_hazards,
    waypoints: waypointsB
  };

  return [routeA, routeB];
}
