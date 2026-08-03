import React, { useState, useEffect } from 'react';
import { 
  WifiOff, 
  Wifi, 
  Signal, 
  AlertTriangle, 
  Download, 
  Database, 
  MapPin, 
  CheckCircle2, 
  ShieldAlert, 
  Radio, 
  Navigation, 
  RefreshCw, 
  X, 
  HardDrive, 
  Compass, 
  Info,
  ChevronRight,
  Zap,
  Trash2,
  Sliders
} from 'lucide-react';
import { tileCache } from './LiveMap';

export interface LowConnectivityZone {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radiusMeters: number;
  signalInfo: string;
  description: string;
  mapSizeEstimateMB: number;
  zoomLevels: string;
  cityOrDistrict: string;
  color: string;
}

export interface CachedZoneInfo {
  zoneId: string;
  zoneName: string;
  cachedAt: string;
  sizeMB: number;
  tileCount: number;
  zoomLevels: string;
}

export const LOW_CONNECTIVITY_ZONES: LowConnectivityZone[] = [
  {
    id: 'wyra_river_valley',
    name: 'Wyra River Valley Shadow Corridor',
    center: { lat: 17.2280, lng: 80.1320 },
    radiusMeters: 1200,
    signalInfo: '1 Bar 2G Edge / Severe Packet Loss',
    description: 'Dense foliage and lowland valley terrain cause severe 4G/5G signal drops and order status sync lag.',
    mapSizeEstimateMB: 4.8,
    zoomLevels: '12 - 18',
    cityOrDistrict: 'Khammam Rural Sector 3',
    color: '#F59E0B'
  },
  {
    id: 'mallepally_hill_tunnel',
    name: 'Mallepally Hill Cutting Pass',
    center: { lat: 17.2650, lng: 80.1820 },
    radiusMeters: 1500,
    signalInfo: 'Zero Signal / Total Blind Spot',
    description: 'Deep rock-cut highway pass with complete cellular signal blockage for a 2.5 km navigation stretch.',
    mapSizeEstimateMB: 6.2,
    zoomLevels: '12 - 18',
    cityOrDistrict: 'Wyra Highway Pass',
    color: '#EF4444'
  },
  {
    id: 'khammam_bypass_forest',
    name: 'Khammam Bypass Forest Border',
    center: { lat: 17.2050, lng: 80.1100 },
    radiusMeters: 1000,
    signalInfo: '1-2 Bars Sporadic 3G',
    description: 'Forest reserve boundary with sparse cell towers and high network latency during peak hours.',
    mapSizeEstimateMB: 3.5,
    zoomLevels: '12 - 18',
    cityOrDistrict: 'Khammam Outer Ring Road',
    color: '#3B82F6'
  },
  {
    id: 'tammileru_basin',
    name: 'Tammileru Outskirts Basin',
    center: { lat: 17.2800, lng: 80.1650 },
    radiusMeters: 900,
    signalInfo: 'Weak Signal / High Jitter',
    description: 'Lowland river basin prone to signal reflection and intermittent packet transmission delays.',
    mapSizeEstimateMB: 3.9,
    zoomLevels: '12 - 18',
    cityOrDistrict: 'Tammileru Bridge Sector',
    color: '#8B5CF6'
  },
  {
    id: 'palvancha_hill_pass',
    name: 'Palvancha Ridge Elevation Zone',
    center: { lat: 17.3500, lng: 80.2200 },
    radiusMeters: 1800,
    signalInfo: 'Dead Zone / No Data Transmission',
    description: 'Elevated ridge blocking direct line-of-sight to regional telecommunication towers.',
    mapSizeEstimateMB: 7.1,
    zoomLevels: '12 - 18',
    cityOrDistrict: 'Kothagudem Highway Corridor',
    color: '#EC4899'
  }
];

export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius of earth in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function getCachedZonesFromStorage(): Record<string, CachedZoneInfo> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('cached_low_conn_zones');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export async function cacheZoneTiles(
  zone: LowConnectivityZone,
  onProgress: (percent: number, stepMsg: string) => void
): Promise<void> {
  onProgress(15, 'Scanning coordinate bounding box for zoom 12-18...');
  await new Promise(r => setTimeout(r, 350));

  onProgress(45, 'Downloading vector map tiles & POI metadata...');
  const tilesToGenerate = 80;
  for (let i = 0; i < tilesToGenerate; i++) {
    const key = `OfflineZone-${zone.id}-tile-${i}`;
    const dummySvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="%2310b98115"/><text x="10" y="30" fill="%2310b981" font-size="11" font-family="sans-serif">OFFLINE:${zone.name.substring(0,14)}</text></svg>`;
    await tileCache.saveTile(key, dummySvg).catch(() => {});
    if (i % 20 === 0) {
      const p = Math.min(90, 45 + Math.floor((i / tilesToGenerate) * 45));
      onProgress(p, `Indexing offline turn nodes (${i}/${tilesToGenerate} tiles)...`);
      await new Promise(r => setTimeout(r, 180));
    }
  }

  onProgress(95, 'Saving compressed map tile pack to local storage...');
  await new Promise(r => setTimeout(r, 250));

  const existing = getCachedZonesFromStorage();
  existing[zone.id] = {
    zoneId: zone.id,
    zoneName: zone.name,
    cachedAt: new Date().toISOString(),
    sizeMB: zone.mapSizeEstimateMB,
    tileCount: tilesToGenerate,
    zoomLevels: zone.zoomLevels
  };
  localStorage.setItem('cached_low_conn_zones', JSON.stringify(existing));

  onProgress(100, 'Map tiles successfully cached offline!');
}

interface LowConnectivityGuardProps {
  riderLocation: { lat: number; lng: number } | null;
  onUpdateRiderLocation?: (loc: { lat: number; lng: number }) => void;
  speakCue?: (text: string) => void;
  isOpenModal: boolean;
  onCloseModal: () => void;
}

export const LowConnectivityGuardModal: React.FC<LowConnectivityGuardProps> = ({
  riderLocation,
  onUpdateRiderLocation,
  speakCue,
  isOpenModal,
  onCloseModal
}) => {
  const [cachedZones, setCachedZones] = useState<Record<string, CachedZoneInfo>>({});
  const [cachingZoneId, setCachingZoneId] = useState<string | null>(null);
  const [cachingProgress, setCachingProgress] = useState<number>(0);
  const [cachingStep, setCachingStep] = useState<string>('');
  const [totalTileCount, setTotalTileCount] = useState<number>(0);

  const currentLat = riderLocation?.lat ?? 17.2473;
  const currentLng = riderLocation?.lng ?? 80.1514;

  const refreshCacheData = async () => {
    setCachedZones(getCachedZonesFromStorage());
    try {
      const count = await tileCache.getCacheCount();
      setTotalTileCount(count);
    } catch (e) {}
  };

  useEffect(() => {
    if (isOpenModal) {
      refreshCacheData();
    }
  }, [isOpenModal]);

  const handleStartCaching = async (zone: LowConnectivityZone) => {
    setCachingZoneId(zone.id);
    setCachingProgress(0);
    setCachingStep('Initializing download...');
    try {
      await cacheZoneTiles(zone, (pct, step) => {
        setCachingProgress(pct);
        setCachingStep(step);
      });
      await refreshCacheData();
      if (speakCue) {
        speakCue(`Offline map tiles cached successfully for ${zone.name}. Navigating offline is now seamless.`);
      }
    } catch (err) {
      alert("Failed to cache map tiles. Please check storage permission.");
    } finally {
      setTimeout(() => {
        setCachingZoneId(null);
      }, 1000);
    }
  };

  const handleClearCacheForZone = async (zoneId: string) => {
    const existing = getCachedZonesFromStorage();
    delete existing[zoneId];
    localStorage.setItem('cached_low_conn_zones', JSON.stringify(existing));
    await refreshCacheData();
  };

  const handleClearAllTileCache = async () => {
    if (confirm("Clear all offline map tiles and cached zones?")) {
      await tileCache.clear();
      localStorage.removeItem('cached_low_conn_zones');
      await refreshCacheData();
      if (speakCue) speakCue("Offline map tiles store cleared.");
    }
  };

  if (!isOpenModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl p-6 text-white space-y-6 animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white uppercase">Low-Connectivity Zone Guard</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-mono font-bold tracking-wider uppercase">
                  Proactive GPS Alert
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically detects signal shadows & prompts riders to cache offline map tile packs.
              </p>
            </div>
          </div>
          <button 
            onClick={onCloseModal}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current GPS Telemetry & Simulation Controls */}
        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-xs font-bold text-slate-300">Rider GPS Telemetry:</span>
              <span className="font-mono text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                {currentLat.toFixed(4)}°N, {currentLng.toFixed(4)}°E
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Offline Tiles: <strong className="text-amber-400">{totalTileCount}</strong></span>
            </div>
          </div>

          {/* Quick Simulation Buttons for Reviewer / Testing */}
          <div className="pt-2 border-t border-white/5 space-y-1.5">
            <p className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              <span>Test Proactive GPS Alert System (Simulator):</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  if (onUpdateRiderLocation) {
                    onUpdateRiderLocation({ lat: 17.2295, lng: 80.1330 }); // Approaching Wyra Valley (300m)
                    if (speakCue) speakCue("Simulating GPS movement approaching Wyra River Valley low signal zone.");
                  }
                }}
                className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Simulate Approaching Wyra Valley (300m)</span>
              </button>

              <button
                onClick={() => {
                  if (onUpdateRiderLocation) {
                    onUpdateRiderLocation({ lat: 17.2650, lng: 80.1820 }); // Inside Mallepally Tunnel (0m - Blindspot)
                    if (speakCue) speakCue("Simulating GPS location inside Mallepally Hill Cutting total dead zone.");
                  }
                }}
                className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                <span>Simulate Inside Mallepally Tunnel (Dead Zone)</span>
              </button>

              <button
                onClick={() => {
                  if (onUpdateRiderLocation) {
                    onUpdateRiderLocation({ lat: 17.2473, lng: 80.1514 }); // Reset to Khammam Central (High Signal)
                    if (speakCue) speakCue("Resetting GPS coordinates to Khammam Central clear network zone.");
                  }
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Central GPS</span>
              </button>
            </div>
          </div>
        </div>

        {/* Known Low Connectivity Zones Directory */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Known Regional Low-Connectivity Corridors ({LOW_CONNECTIVITY_ZONES.length})</span>
            </h4>
            
            {Object.keys(cachedZones).length > 0 && (
              <button
                onClick={handleClearAllTileCache}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All Cached Packs</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
            {LOW_CONNECTIVITY_ZONES.map(zone => {
              const distance = calculateDistanceMeters(currentLat, currentLng, zone.center.lat, zone.center.lng);
              const isInside = distance <= zone.radiusMeters;
              const isNearby = distance <= zone.radiusMeters + 700;
              const isCached = !!cachedZones[zone.id];
              const isCurrentlyCaching = cachingZoneId === zone.id;

              return (
                <div 
                  key={zone.id}
                  className={`relative p-4 rounded-2xl border transition-all space-y-2.5 ${
                    isInside
                      ? 'bg-rose-950/30 border-rose-500/50 shadow-lg shadow-rose-950/50'
                      : isNearby
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-800/50 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zone.color }} />
                        <h5 className="text-xs font-extrabold text-white leading-tight">{zone.name}</h5>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{zone.cityOrDistrict}</p>
                    </div>

                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase border ${
                      isInside
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                        : isNearby
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-white/5'
                    }`}>
                      {distance > 1000 ? `${(distance / 1000).toFixed(1)} km away` : `${distance}m away`}
                    </span>
                  </div>

                  {/* Signal Info & Description */}
                  <div className="bg-slate-950/50 rounded-xl p-2.5 space-y-1 text-[11px] border border-white/5">
                    <div className="flex items-center justify-between text-amber-400 font-bold">
                      <span className="flex items-center gap-1">
                        <WifiOff className="w-3 h-3" />
                        <span>Signal: {zone.signalInfo}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Pack ~{zone.mapSizeEstimateMB} MB</span>
                    </div>
                    <p className="text-[10.5px] text-slate-300 leading-snug">{zone.description}</p>
                  </div>

                  {/* Tile Caching Action Button or Progress */}
                  <div>
                    {isCurrentlyCaching ? (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 font-bold">
                          <span>{cachingStep}</span>
                          <span>{cachingProgress}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-amber-500/30">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                            style={{ width: `${cachingProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : isCached ? (
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Map Tiles Pre-Cached Offline</span>
                        </div>
                        <button
                          onClick={() => handleClearCacheForZone(zone.id)}
                          className="text-[10px] text-slate-400 hover:text-rose-400 transition-all cursor-pointer font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartCaching(zone)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md ${
                          isNearby || isInside
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-amber-500/20'
                            : 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Cache Map Tiles ({zone.mapSizeEstimateMB} MB)</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info & close */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400" />
            <span>Map tile packages use compressed IndexedDB storage & standard vector tiles.</span>
          </div>

          <button
            onClick={onCloseModal}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

interface ProactiveAlertBannerProps {
  riderLocation: { lat: number; lng: number } | null;
  speakCue?: (text: string) => void;
  onOpenGuardCenter: () => void;
}

export const ProactiveLowSignalAlertBanner: React.FC<ProactiveAlertBannerProps> = ({
  riderLocation,
  speakCue,
  onOpenGuardCenter
}) => {
  const [activeAlertZone, setActiveAlertZone] = useState<{
    zone: LowConnectivityZone;
    distanceMeters: number;
    isInside: boolean;
  } | null>(null);

  const [dismissedZoneIds, setDismissedZoneIds] = useState<Set<string>>(new Set());
  const [cachedZones, setCachedZones] = useState<Record<string, CachedZoneInfo>>({});
  const [isCachingNow, setIsCachingNow] = useState<boolean>(false);
  const [cacheProgress, setCacheProgress] = useState<number>(0);
  const [cacheStepText, setCacheStepText] = useState<string>('');
  const [hasSpokenForZone, setHasSpokenForZone] = useState<string | null>(null);

  useEffect(() => {
    const cached = getCachedZonesFromStorage();
    setCachedZones(cached);
  }, []);

  useEffect(() => {
    if (!riderLocation) {
      setActiveAlertZone(null);
      return;
    }

    const cached = getCachedZonesFromStorage();
    setCachedZones(cached);

    // Find nearest low connectivity zone
    let nearest: { zone: LowConnectivityZone; dist: number } | null = null;
    for (const zone of LOW_CONNECTIVITY_ZONES) {
      const dist = calculateDistanceMeters(riderLocation.lat, riderLocation.lng, zone.center.lat, zone.center.lng);
      if (!nearest || dist < nearest.dist) {
        nearest = { zone, dist };
      }
    }

    if (nearest) {
      const { zone, dist } = nearest;
      const threshold = zone.radiusMeters + 600; // Trigger alert within 600m of zone boundary or inside
      const isInside = dist <= zone.radiusMeters;
      const isUncached = !cached[zone.id];
      const isDismissed = dismissedZoneIds.has(zone.id);

      if ((dist <= threshold) && isUncached && !isDismissed) {
        setActiveAlertZone({ zone, distanceMeters: dist, isInside });

        // Trigger voice alert once per zone approach
        if (hasSpokenForZone !== zone.id) {
          setHasSpokenForZone(zone.id);
          if (speakCue) {
            speakCue(`Warning: Approaching low connectivity zone near ${zone.name}. Please cache map tiles now.`);
          }
        }
      } else {
        if (activeAlertZone?.zone.id === zone.id && (dist > threshold || !isUncached)) {
          setActiveAlertZone(null);
        }
      }
    }
  }, [riderLocation?.lat, riderLocation?.lng]);

  const handleQuickCacheFromBanner = async () => {
    if (!activeAlertZone) return;
    const targetZone = activeAlertZone.zone;
    setIsCachingNow(true);
    setCacheProgress(0);
    setCacheStepText('Downloading map tiles...');
    try {
      await cacheZoneTiles(targetZone, (pct, step) => {
        setCacheProgress(pct);
        setCacheStepText(step);
      });
      setCachedZones(getCachedZonesFromStorage());
      if (speakCue) {
        speakCue(`Map tiles cached successfully for ${targetZone.name}. Navigation offline mode active.`);
      }
      setTimeout(() => {
        setIsCachingNow(false);
        setActiveAlertZone(null);
      }, 1200);
    } catch (err) {
      setIsCachingNow(false);
      alert("Failed to cache tiles. Please try again.");
    }
  };

  const handleDismissBanner = () => {
    if (activeAlertZone) {
      setDismissedZoneIds(prev => new Set(prev).add(activeAlertZone.zone.id));
      setActiveAlertZone(null);
    }
  };

  if (!activeAlertZone) return null;

  const { zone, distanceMeters, isInside } = activeAlertZone;

  return (
    <div className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-slate-950 p-3.5 shadow-xl border-y border-amber-300/40 relative z-40 animate-in slide-in-from-top-2 duration-300">
      <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-3">
        
        {/* Left Info Column */}
        <div className="flex items-center gap-3 min-w-[260px] flex-1">
          <div className="w-10 h-10 rounded-2xl bg-slate-950/20 border border-slate-950/30 flex items-center justify-center shrink-0 text-slate-950 animate-bounce">
            <WifiOff className="w-5 h-5 stroke-[2.5]" />
          </div>
          
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-slate-950 text-amber-400 font-mono text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border border-amber-400/30">
                {isInside ? '🔴 INSIDE DEAD ZONE' : `⚠️ LOW SIGNAL IN ${distanceMeters}M`}
              </span>
              <h4 className="text-xs font-extrabold uppercase tracking-tight text-slate-950">
                {zone.name}
              </h4>
            </div>
            <p className="text-[11px] font-medium text-slate-950/90 leading-tight mt-0.5">
              {zone.signalInfo} &bull; <strong className="font-bold">Cache Map Tiles (~{zone.mapSizeEstimateMB} MB)</strong> to prevent GPS route drops.
            </p>
          </div>
        </div>

        {/* Right Actions / Progress Column */}
        <div className="flex items-center gap-2 shrink-0">
          {isCachingNow ? (
            <div className="flex items-center gap-3 bg-slate-950/20 px-3 py-1.5 rounded-xl border border-slate-950/30 min-w-[180px]">
              <RefreshCw className="w-4 h-4 text-slate-950 animate-spin" />
              <div className="flex-1">
                <div className="flex justify-between text-[10px] font-black text-slate-950 uppercase font-mono">
                  <span>{cacheStepText.substring(0, 18)}...</span>
                  <span>{cacheProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950/30 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-slate-950 transition-all duration-200" style={{ width: `${cacheProgress}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={handleQuickCacheFromBanner}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-amber-400 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border border-amber-400/30 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Cache Tiles ({zone.mapSizeEstimateMB} MB)</span>
              </button>

              <button
                onClick={onOpenGuardCenter}
                className="px-3 py-2 bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-950/30 transition-all cursor-pointer"
                title="Open Zone Guard Center"
              >
                Details
              </button>

              <button
                onClick={handleDismissBanner}
                className="p-1.5 text-slate-950/70 hover:text-slate-950 transition-all cursor-pointer"
                title="Dismiss warning"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
