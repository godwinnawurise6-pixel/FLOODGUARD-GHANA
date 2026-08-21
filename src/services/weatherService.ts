import { WeatherData } from '../types';
import { INITIAL_WEATHER_DATA } from '../data/ghanaData';

// WMO Weather Interpretation Codes (WW)
const WMO_CODE_MAP: Record<number, string> = {
  0: 'Clear Sky',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast Sky',
  45: 'Foggy',
  48: 'Depositing Rime Fog',
  51: 'Light Drizzle',
  53: 'Moderate Drizzle',
  55: 'Dense Drizzle',
  56: 'Light Freezing Drizzle',
  57: 'Dense Freezing Drizzle',
  61: 'Slight Rain',
  62: 'Moderate Rain',
  65: 'Heavy Rain',
  66: 'Light Freezing Rain',
  67: 'Heavy Freezing Rain',
  71: 'Slight Snow',
  73: 'Moderate Snow',
  75: 'Heavy Snow',
  80: 'Slight Rain Showers',
  81: 'Moderate Rain Showers',
  82: 'Violent Rain Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with Hail',
  99: 'Heavy Thunderstorm with Hail',
};

export function translateWmoCode(code: number): string {
  return WMO_CODE_MAP[code] || 'Variable Weather';
}

export interface GeocodedLocation {
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

/**
 * Searches locations in Ghana or globally using Open-Meteo Geocoding API.
 */
export async function searchLocations(query: string): Promise<GeocodedLocation[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];
    
    return data.results.map((item: any) => ({
      name: item.name,
      admin1: item.admin1 || item.country || '',
      country: item.country || 'Ghana',
      latitude: item.latitude,
      longitude: item.longitude,
    }));
  } catch (err) {
    console.warn('Geocoding search error:', err);
    return [];
  }
}

/**
 * Weather Service: Real-Time Weather Forecasting & Rainfall Rate Predictor.
 * Queries live meteorological satellite and station data via Open-Meteo High-Resolution API.
 */
export async function fetchGhanaWeather(
  lat: number = 5.5587,
  lng: number = -0.2072,
  locationName?: string
): Promise<WeatherData> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,showers,weather_code,wind_speed_10m,cloud_cover&hourly=precipitation,rain,showers,weather_code,precipitation_probability,temperature_2m&daily=weather_code,precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min&timezone=Africa%2FAccra`;
    
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      throw new Error(`Open-Meteo API returned HTTP status ${response.status}`);
    }

    const data = await response.json();
    
    // Parse current live weather metrics
    const currentRain = Number(data.current?.rain ?? 0);
    const currentShowers = Number(data.current?.showers ?? 0);
    const currentPrecip = Math.round((Number(data.current?.precipitation ?? (currentRain + currentShowers))) * 10) / 10;
    
    const currentTemp = Math.round(data.current?.temperature_2m ?? 28);
    const humidity = Math.round(data.current?.relative_humidity_2m ?? 82);
    const windSpeed = Math.round(data.current?.wind_speed_10m ?? 14);
    const cloudCover = Math.round(data.current?.cloud_cover ?? 60);
    const weatherCode = data.current?.weather_code ?? 0;
    const weatherConditionText = translateWmoCode(weatherCode);

    // Determine current rainfall intensity category
    let rainfallIntensity: WeatherData['rainfallIntensity'] = 'None';
    if (currentPrecip >= 35) rainfallIntensity = 'Torrential';
    else if (currentPrecip >= 15) rainfallIntensity = 'Heavy';
    else if (currentPrecip >= 5) rainfallIntensity = 'Moderate';
    else if (currentPrecip > 0.2) rainfallIntensity = 'Light';

    // Match hourly timestamps to find the current local hour
    const hourlyTimes: string[] = data.hourly?.time || [];
    const hourlyPrecip: number[] = data.hourly?.precipitation || [];
    const hourlyProbs: number[] = data.hourly?.precipitation_probability || [];
    const hourlyCodes: number[] = data.hourly?.weather_code || [];

    const nowIso = new Date().toISOString().slice(0, 13); // e.g., "2026-08-10T14"
    let startIndex = hourlyTimes.findIndex(t => t.startsWith(nowIso));
    if (startIndex < 0) startIndex = 0;

    // Generate 12-hour future rainfall prediction timeline
    const hourlyForecast = Array.from({ length: 12 }).map((_, i) => {
      const idx = startIndex + i;
      const rawTimeStr = hourlyTimes[idx];
      const timeLabel = rawTimeStr
        ? new Date(rawTimeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        : `${(12 + i) % 24}:00`;
      
      const precipVal = Math.round((hourlyPrecip[idx] ?? 0) * 10) / 10;
      const probVal = Math.round(hourlyProbs[idx] ?? 0);
      const condVal = translateWmoCode(hourlyCodes[idx] ?? 0);

      // Flood Risk Score formula: accounts for both predicted rainfall volume (mm/hr) and probability (%)
      const calculatedRisk = Math.min(100, Math.round(precipVal * 3.8 + probVal * 0.4));

      return {
        time: timeLabel,
        rainfallMm: precipVal,
        probability: probVal,
        condition: condVal,
        riskScore: calculatedRisk,
      };
    });

    // Parse 7-day daily rainfall outlook
    const dailyTimes: string[] = data.daily?.time || [];
    const dailyPrecipSum: number[] = data.daily?.precipitation_sum || [];
    const dailyProbMax: number[] = data.daily?.precipitation_probability_max || [];
    const dailyCodes: number[] = data.daily?.weather_code || [];
    const dailyMaxTemp: number[] = data.daily?.temperature_2m_max || [];
    const dailyMinTemp: number[] = data.daily?.temperature_2m_min || [];

    const dailyForecast = dailyTimes.slice(0, 7).map((dStr, idx) => ({
      date: new Date(dStr).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
      precipSumMm: Math.round((dailyPrecipSum[idx] ?? 0) * 10) / 10,
      maxProbability: Math.round(dailyProbMax[idx] ?? 0),
      weatherCondition: translateWmoCode(dailyCodes[idx] ?? 0),
      maxTempC: Math.round(dailyMaxTemp[idx] ?? 31),
      minTempC: Math.round(dailyMinTemp[idx] ?? 24),
    }));

    // Generate automated weather warning
    let weatherWarning: string | undefined = undefined;
    const maxPredictedNext3h = Math.max(...hourlyForecast.slice(0, 3).map(h => h.rainfallMm));
    if (currentPrecip > 20 || maxPredictedNext3h > 20) {
      weatherWarning = `⚠️ SEVERE WEATHER ALERT: High-intensity precipitation (${Math.max(currentPrecip, maxPredictedNext3h)}mm/hr) detected. Severe flash flooding predicted for Odaw channel, Circle, Alajo, and Kaneshie underpasses.`;
    } else if (currentPrecip > 8 || maxPredictedNext3h > 8) {
      weatherWarning = `🌧️ MODERATE RAIN WARNING: Heavy rain predicted over the next 3 hours. Road surfaces will be slick with localized gutter overflow in low-elevation Accra sectors.`;
    }

    const currentProb = hourlyForecast[0]?.probability ?? 60;

    return {
      city: locationName || 'Accra, Greater Accra Region',
      latitude: lat,
      longitude: lng,
      temperatureC: currentTemp,
      currentRainfallMm: currentPrecip,
      rainfallIntensity,
      humidity,
      windSpeedKmh: windSpeed,
      cloudCover,
      precipitationProbability: currentProb,
      weatherConditionText,
      weatherCode,
      lastUpdatedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      weatherWarning,
      hourlyForecast,
      dailyForecast,
    };
  } catch (error) {
    console.warn('Real-time weather fetch failed, serving resilient Ghana data:', error);
    return {
      ...INITIAL_WEATHER_DATA,
      latitude: lat,
      longitude: lng,
      city: locationName || INITIAL_WEATHER_DATA.city,
      lastUpdatedTime: 'Fallback Mode',
    };
  }
}
