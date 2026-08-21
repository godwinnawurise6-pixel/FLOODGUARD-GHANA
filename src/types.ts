export type UserRole = 'USER' | 'DRIVER' | 'AUTHORITY' | 'ADMIN';

export type PreferredLanguage = 'en' | 'tw' | 'ga' | 'ee';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';

export type IncidentSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE' | 'LIFE_THREATENING';

export type ReportStatus = 'pending' | 'under_review' | 'verified' | 'rejected' | 'resolved';

export type RoadAccessibility = 'yes' | 'caution' | 'no';

export type DrainProblemType = 
  | 'blocked_gutter'
  | 'garbage_overflow'
  | 'broken_drain'
  | 'collapsed_culvert'
  | 'missing_cover'
  | 'damaged_infrastructure';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  profilePhoto?: string;
  preferredLanguage: PreferredLanguage;
  homeLocation?: {
    name: string;
    latitude: number;
    longitude: number;
  };
  notificationPreferences: {
    pushEnabled: boolean;
    smsEnabled: boolean;
    highRiskOnly: boolean;
  };
}

export interface FloodReport {
  id: string;
  userId: string;
  reporterName?: string;
  reporterPhone?: string;
  isAnonymous: boolean;
  type: 'flood' | 'blocked_drain';
  latitude: number;
  longitude: number;
  address: string;
  suburb: string; // e.g., 'Alajo', 'Circle', 'Kaneshie', 'Odawna', 'Dansoman'
  description: string;
  severity: IncidentSeverity;
  waterDepthCm: number;
  roadPassable: RoadAccessibility;
  housesAffected: boolean;
  drainProblemType?: DrainProblemType;
  imageUrl?: string;
  audioUrl?: string;
  hasVoiceNote?: boolean;
  status: ReportStatus;
  verificationScore: number; // 0 to 100
  confidenceFactors: string[];
  assignedTo?: string;
  upvotes: number;
  createdAt: string;
  updatedAt: string;
}

export interface FloodZone {
  id: string;
  name: string;
  district: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  riskScore: number; // 0 to 100
  riskLevel: RiskLevel;
  historicalFrequency: number; // incidents per year
  elevationMeters: number;
  recentIncidentsCount: number;
}

export interface WeatherData {
  city: string;
  latitude?: number;
  longitude?: number;
  temperatureC: number;
  currentRainfallMm: number;
  rainfallIntensity: 'None' | 'Light' | 'Moderate' | 'Heavy' | 'Torrential';
  humidity: number;
  windSpeedKmh: number;
  precipitationProbability?: number;
  cloudCover?: number;
  weatherConditionText?: string;
  weatherCode?: number;
  lastUpdatedTime?: string;
  weatherWarning?: string;
  hourlyForecast: {
    time: string;
    rainfallMm: number;
    riskScore: number;
    probability?: number;
    condition?: string;
  }[];
  dailyForecast?: {
    date: string;
    precipSumMm: number;
    maxProbability: number;
    weatherCondition: string;
    maxTempC: number;
    minTempC: number;
  }[];
}

export interface SavedLocation {
  id: string;
  userId: string;
  name: string; // e.g., 'Home', 'Work', 'School'
  address: string;
  latitude: number;
  longitude: number;
  currentRiskLevel: RiskLevel;
  lastUpdated: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  category: 'disaster_nadmo' | 'police' | 'fire' | 'hospital' | 'shelter';
  phone: string;
  address: string;
  details: string;
  isOfficial: boolean;
  latitude?: number;
  longitude?: number;
}

export interface RouteOption {
  id: string;
  name: string;
  distanceKm: number;
  durationMins: number;
  riskLevel: RiskLevel;
  isRecommended: boolean;
  hazardWarnings: string[];
  waypoints: [number, number][]; // [lat, lng]
}

export interface SystemAnalytics {
  totalReports: number;
  pendingVerification: number;
  verifiedCount: number;
  resolvedCount: number;
  blockedDrainsCount: number;
  avgResponseTimeHours: number;
  incidentsByDistrict: { district: string; count: number }[];
  incidentsByMonth: { month: string; flood: number; drain: number }[];
  severityDistribution: { severity: string; count: number }[];
}

export interface ResponseTask {
  id: string;
  reportId: string;
  assignedTeam: string;
  status: 'assigned' | 'en_route' | 'responding' | 'resolved';
  notes: string;
  assignedAt: string;
  updatedAt: string;
}
