import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, Polyline, useMap, Circle, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Compass, MapPin, Bike, User, Store, Plus, Minus, Database, Layers, Flame, Info, Phone, MessageSquare, Check } from 'lucide-react';

const CACHED_REGIONS = [
  { name: 'Khammam Central (Gandi Chowk)', center: [17.2473, 80.1514] as [number, number], radius: 1500, color: '#10B981', fill: '#10B9811A' },
  { name: 'Nizampet Express Hub', center: [17.2585, 80.1620] as [number, number], radius: 1000, color: '#F59E0B', fill: '#F59E0B1A' },
  { name: 'Mamillagudem Depot Zone', center: [17.2350, 80.1420] as [number, number], radius: 950, color: '#3B82F6', fill: '#3B82F61A' },
  { name: 'Khammam Bypass & Outer Ring', center: [17.2650, 80.1380] as [number, number], radius: 1300, color: '#8B5CF6', fill: '#8B5CF61A' }
];

// IndexedDB Caching Client for offline Tiles
class TileCacheDB {
  private db: IDBDatabase | null = null;
  private listeners: Set<() => void> = new Set();

  addListener(listener: () => void) {
    this.listeners.add(listener);
  }

  removeListener(listener: () => void) {
    this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('map-tile-cache', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('tiles')) {
          db.createObjectStore('tiles');
        }
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getTile(key: string): Promise<string | null> {
    const db = await this.init();
    return new Promise((resolve) => {
      const transaction = db.transaction('tiles', 'readonly');
      const store = transaction.objectStore('tiles');
      const r = store.get(key);
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = () => resolve(null);
    });
  }

  async saveTile(key: string, dataUrl: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('tiles', 'readwrite');
      const store = transaction.objectStore('tiles');
      store.put(dataUrl, key);
      transaction.oncomplete = () => {
        this.notify();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getCacheCount(): Promise<number> {
    const db = await this.init();
    return new Promise((resolve) => {
      const transaction = db.transaction('tiles', 'readonly');
      const store = transaction.objectStore('tiles');
      const r = store.count();
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => resolve(0);
    });
  }

  async clear(): Promise<void> {
    const db = await this.init();
    return new Promise((resolve) => {
      const transaction = db.transaction('tiles', 'readwrite');
      const store = transaction.objectStore('tiles');
      store.clear();
      transaction.oncomplete = () => {
        this.notify();
        resolve();
      };
    });
  }
}

export const tileCache = new TileCacheDB();

// Build custom Leaflet Offline Map Tile layer
const CustomOfflineTileLayer = (L.TileLayer as any).extend({
  createTile: function (coords: any, done: any) {
    const tile = document.createElement('img');
    const url = this.getTileUrl(coords);
    const mapStyle = this.options.mapStyle || 'Standard';
    const key = `${mapStyle}-${coords.z}-${coords.x}-${coords.y}`;

    L.DomEvent.on(tile, 'load', L.Util.bind((this as any)._tileOnLoad, this, done, tile));
    L.DomEvent.on(tile, 'error', L.Util.bind((this as any)._tileOnError, this, done, tile));

    if (this.options.crossOrigin || this.options.crossOrigin === '') {
      tile.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
    }

    tile.alt = '';
    tile.setAttribute('role', 'presentation');

    tileCache.getTile(key).then(cachedDataUrl => {
      if (cachedDataUrl) {
        tile.src = cachedDataUrl;
      } else {
        tile.src = url;
        // Background store
        if (navigator.onLine) {
          fetch(url)
            .then(res => {
              if (!res.ok) throw new Error("OSM server offline or ratelimited");
              return res.blob();
            })
            .then(blob => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const dataUrl = reader.result as string;
                tileCache.saveTile(key, dataUrl).catch(() => {});
              };
              reader.readAsDataURL(blob);
            })
            .catch(() => {});
        }
      }
    }).catch(() => {
      tile.src = url;
    });

    return tile;
  }
});

// React Leaflet Component Wrapper
function CachedTileLayer({ mapStyle }: { mapStyle: string }) {
  const map = useMap();

  useEffect(() => {
    let url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    
    if (mapStyle === 'Satellite') {
      url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
    } else if (mapStyle === 'Terrain') {
      url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";
      attribution = 'Tiles &copy; Esri &mdash; ESRI, USGS, NOAA';
    }

    const layer = new (CustomOfflineTileLayer as any)(url, {
      attribution: attribution,
      crossOrigin: 'anonymous',
      mapStyle: mapStyle
    });

    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, mapStyle]);

  return null;
}

// Fix for default marker icons in Leaflet with React
// We'll use custom SVG icons for a better look
const createCustomIcon = (type: 'customer' | 'vendor' | 'rider') => {
  const colors = {
    customer: '#F59E0B', // Yellow
    vendor: '#4F46E5',   // Indigo
    rider: '#10B981'     // Emerald
  };
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${colors[type]}; width: 32px; height: 32px; border-radius: 12px; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; color: white;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              ${type === 'customer' ? '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>' : 
                type === 'vendor' ? '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>' : 
                '<path d="M5.5 17.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0"></path><path d="M18.5 17.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0"></path><path d="M3 6h5.5l5 11h6.5"></path><path d="M13 10h4l-2 3h4"></path>'}
            </svg>
          </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

interface LiveMapProps {
  riderLoc?: [number, number];
  vendorLoc?: [number, number];
  customerLoc?: [number, number];
  zoom?: number;
  interactive?: boolean;
  autoCenter?: boolean;
  defaultMapStyle?: 'Standard' | 'Satellite' | 'Terrain';
  vendorName?: string;
  customerName?: string;
}

function MapUpdater({ center, zoom, autoCenter }: { center: [number, number], zoom: number, autoCenter: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (autoCenter) {
      map.setView(center, undefined, { animate: true });
    }
  }, [center, map, autoCenter]);
  return null;
}

function ZoomControls() {
  const map = useMap();
  return (
    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
      <button 
        type="button"
        onClick={() => map.zoomIn()}
        className="w-10 h-10 bg-white shadow-xl rounded-xl flex items-center justify-center text-gray-900 active:scale-90 transition-all border border-gray-100 cursor-pointer"
      >
        <Plus className="w-5 h-5" />
      </button>
      <button 
        type="button"
        onClick={() => map.zoomOut()}
        className="w-10 h-10 bg-white shadow-xl rounded-xl flex items-center justify-center text-gray-900 active:scale-90 transition-all border border-gray-100 cursor-pointer"
      >
        <Minus className="w-5 h-5" />
      </button>
    </div>
  );
}

export default function LiveMap({ riderLoc, vendorLoc, customerLoc, zoom = 15, interactive = true, autoCenter = true, defaultMapStyle = 'Standard', vendorName, customerName }: LiveMapProps) {
  const [mapZoom, setMapZoom] = useState(zoom);
  const center: [number, number] = riderLoc || vendorLoc || customerLoc || [17.2473, 80.1514]; // Default to Khammam
  const [cachedCount, setCachedCount] = useState(0);
  const [showCacheZones, setShowCacheZones] = useState(true);
  const [mapStyle, setMapStyle] = useState<'Standard' | 'Satellite' | 'Terrain'>(defaultMapStyle);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [selectedWaypoint, setSelectedWaypoint] = useState<'customer' | 'vendor' | null>(null);
  const [typedMessage, setTypedMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    const updateCount = () => {
      tileCache.getCacheCount().then(setCachedCount);
    };
    updateCount();
    tileCache.addListener(updateCount);
    return () => tileCache.removeListener(updateCount);
  }, []);
  
  // Simulated path between locations if they exist
  const path: [number, number][] = [];
  if (vendorLoc) path.push(vendorLoc);
  if (riderLoc) path.push(riderLoc);
  if (customerLoc) path.push(customerLoc);

  const heatmapSpots = [
    { center: [17.2482, 80.1501] as [number, number], weight: '98% order frequency' },
    { center: [17.2570, 80.1610] as [number, number], weight: '92% order frequency' },
    { center: [17.2341, 80.1415] as [number, number], weight: '88% order frequency' },
    { center: [17.2612, 80.1345] as [number, number], weight: '85% order frequency' }
  ];

  return (
    <div className="w-full h-full rounded-[2.5rem] overflow-hidden shadow-2xl relative border-2 border-slate-800">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        dragging={interactive}
        scrollWheelZoom={interactive}
        zoomControl={false}
      >
        <CachedTileLayer mapStyle={mapStyle} />
        
        <ZoomControls />

        {/* Heatmap Overlay */}
        {showHeatmap && heatmapSpots.map((spot, idx) => (
          <React.Fragment key={`heat-${idx}`}>
            {/* Outer buffer */}
            <Circle
              center={spot.center}
              radius={400}
              pathOptions={{
                color: '#ef4444',
                fillColor: '#f97316',
                fillOpacity: 0.1,
                weight: 0
              }}
            />
            {/* Mid high density */}
            <Circle
              center={spot.center}
              radius={250}
              pathOptions={{
                color: '#ef4444',
                fillColor: '#ea580c',
                fillOpacity: 0.25,
                weight: 0
              }}
            />
            {/* Core super high density */}
            <Circle
              center={spot.center}
              radius={100}
              pathOptions={{
                color: '#dc2626',
                fillColor: '#dc2626',
                fillOpacity: 0.45,
                weight: 1,
                dashArray: '3, 4'
              }}
            >
              <Tooltip permanent={false} direction="top">
                <span className="text-[9px] font-black uppercase text-red-600 font-mono">🔥 HOT ZONE: {spot.weight}</span>
              </Tooltip>
            </Circle>
          </React.Fragment>
        ))}

        {showCacheZones && CACHED_REGIONS.map((region, idx) => (
          <Circle
            key={idx}
            center={region.center}
            radius={region.radius}
            pathOptions={{
              color: region.color,
              fillColor: region.color,
              fillOpacity: 0.12,
              weight: 2.2,
              dashArray: '5, 8'
            }}
          >
            <Tooltip permanent={false} direction="top" opacity={0.9}>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-800 font-mono">
                💾 Offline Cache: {region.name}
              </div>
            </Tooltip>
          </Circle>
        ))}
        
        {vendorLoc && (
          <Marker 
            position={vendorLoc} 
            icon={createCustomIcon('vendor')}
            eventHandlers={{
              click: () => {
                setSelectedWaypoint('vendor');
              }
            }}
          >
            <Popup>Vendor: {vendorName || "Partner Merchant"}</Popup>
          </Marker>
        )}
        
        {riderLoc && (
          <Marker position={riderLoc} icon={createCustomIcon('rider')}>
            <Popup>Delivery Partner (GPS Active)</Popup>
          </Marker>
        )}
        
        {customerLoc && (
          <Marker 
            position={customerLoc} 
            icon={createCustomIcon('customer')}
            eventHandlers={{
              click: () => {
                setSelectedWaypoint('customer');
              }
            }}
          >
            <Popup>Customer: {customerName || "Customer Location"}</Popup>
          </Marker>
        )}
 
        {path.length > 1 && (
          <Polyline 
            positions={path} 
            color="#4F46E5" 
            dashArray="10, 10" 
            weight={4}
            opacity={0.6}
          />
        )}
        
        <MapUpdater center={center} zoom={mapZoom} autoCenter={autoCenter} />
      </MapContainer>

      {/* Map Overlays */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-1.5 flex-wrap justify-end max-w-[85%]">
        {/* Style selection chips */}
        <div className="bg-slate-900/90 backdrop-blur-md p-0.5 px-1 rounded-xl border border-white/10 flex items-center gap-1 shadow-lg shrink-0">
          <button 
            type="button"
            onClick={() => setMapStyle('Standard')}
            className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              mapStyle === 'Standard' ? 'bg-amber-500 text-slate-950 font-extrabold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Std
          </button>
          <button 
            type="button"
            onClick={() => setMapStyle('Satellite')}
            className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              mapStyle === 'Satellite' ? 'bg-amber-500 text-slate-950 font-extrabold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sat
          </button>
          <button 
            type="button"
            onClick={() => setMapStyle('Terrain')}
            className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              mapStyle === 'Terrain' ? 'bg-amber-500 text-slate-950 font-extrabold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Ter
          </button>
        </div>

        {/* Heatmap Toggle */}
        <button 
          type="button"
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`px-2.5 py-1.5 rounded-xl border font-mono text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all outline-none shrink-0 ${
            showHeatmap 
              ? 'bg-rose-600 text-white border-rose-500 active:scale-95 shadow-lg shadow-rose-950/20' 
              : 'bg-slate-900/90 backdrop-blur-md text-slate-450 border-white/5 hover:text-white'
          }`}
          title="Toggle high order density heatmap"
        >
          <Flame className={`w-3.5 h-3.5 ${showHeatmap ? 'animate-bounce text-yellow-300' : 'text-rose-400'}`} />
          <span>Heatmap: {showHeatmap ? 'ON' : 'OFF'}</span>
        </button>

        {/* Toggle Cache Overlay button */}
        <button 
          onClick={() => setShowCacheZones(!showCacheZones)}
          className={`px-2.5 py-1.5 rounded-xl border font-mono text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all outline-none shrink-0 ${
            showCacheZones 
              ? 'bg-emerald-500 font-extrabold text-slate-950 border-emerald-400 active:scale-95 shadow-md shadow-emerald-950/20' 
              : 'bg-slate-900/90 backdrop-blur-md text-slate-400 border-white/5 hover:text-white'
          }`}
          title="Toggle Pre-cached Offline Map Regions Overlay"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Zones: {showCacheZones ? 'ON' : 'OFF'}</span>
        </button>

        <div className="bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 text-emerald-400 shrink-0">
          <Database className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Local Cache: <span className="text-white font-mono">{cachedCount} tiles</span></span>
        </div>
        
        <button className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-slate-900 shadow-lg border border-white/50 active:scale-95 transition-all cursor-pointer shrink-0">
          <Compass className="w-6 h-6 text-slate-800" />
        </button>
      </div>

      {!interactive && (
        <div className="absolute inset-0 z-[1001] pointer-events-none bg-gradient-to-t from-black/20 to-transparent" />
      )}

      {/* Slide-up Contact Modal */}
      {selectedWaypoint && (
        <div className="absolute bottom-4 left-4 right-4 z-[1002] bg-slate-900/95 backdrop-blur-md rounded-[2rem] border border-white/10 p-5 shadow-2xl text-left text-white animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-[8px] font-black tracking-widest text-amber-500 uppercase font-mono">
                {selectedWaypoint === 'vendor' ? 'MERCHANT WAYPOINT CONTACT' : 'CUSTOMER WAYPOINT CONTACT'}
              </span>
              <h4 className="text-sm font-black text-white mt-1 uppercase flex items-center gap-1.5 leading-none">
                {selectedWaypoint === 'vendor' ? <Store className="w-4 h-4 text-amber-500" /> : <User className="w-4 h-4 text-emerald-400" />}
                {selectedWaypoint === 'vendor' ? (vendorName || "Partner Merchant Garden Kitchen") : (customerName || "Premium Family Customer Block")}
              </h4>
            </div>
            <button 
              type="button" 
              onClick={() => {
                setSelectedWaypoint(null);
                setTypedMessage('');
                setIsSent(false);
              }}
              className="w-7 h-7 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer animate-pulse"
            >
              <span className="text-xs font-bold font-mono">✕</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Quick action triggers */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  alert(`📞 Voice line connected successfully to ${selectedWaypoint === 'vendor' ? 'merchant' : 'customer'}. Contact window is encrypted.`);
                  if (typeof window !== 'undefined' && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                    const u = new SpeechSynthesisUtterance("Connecting telephone line");
                    window.speechSynthesis.speak(u);
                  }
                }}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
              >
                <Phone className="w-4 h-4 stroke-[3]" />
                One-Tap Phone Call
              </button>
              
              <button
                type="button"
                onClick={() => {
                  alert(`💬 Chat line established. Default messaging feed active.`);
                }}
                className="flex-1 py-3 bg-slate-950 hover:bg-slate-800 text-amber-500 border border-amber-500/25 font-black rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                Open Dispatch Chat
              </button>
            </div>

            {/* Quick Text Templates */}
            <div className="space-y-1.5 border-t border-white/5 pt-3">
              <span className="text-[8px] text-slate-505 font-mono uppercase tracking-wider block">PRE-COMPOSED RAPID TEMPLATES:</span>
              <div className="flex gap-1.5 flex-wrap">
                {(selectedWaypoint === 'vendor' 
                  ? [
                    "I am arriving for order pickup.",
                    "Is order packed? Please confirm.",
                    "Arriving in 2 minutes."
                  ]
                  : [
                    "I am outside the gate with your delivery.",
                    "Please share gate passcode.",
                    "Arriving at your location now."
                  ]
                ).map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTypedMessage(tpl)}
                    className="p-2 border border-white/5 hover:border-amber-500/20 bg-slate-950 hover:bg-amber-500/5 text-slate-400 hover:text-white rounded-xl text-[8.5px] text-left uppercase font-bold transition-all cursor-pointer flex-1 min-w-[45%]"
                  >
                    "{tpl}"
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Custom message box */}
            <div className="relative mt-2 flex gap-1.5">
              <input
                type="text"
                value={isSent ? '✓ MESSAGE DELIVERED SAFELY' : typedMessage}
                onChange={(e) => {
                  if (isSent) return;
                  setTypedMessage(e.target.value);
                }}
                placeholder="Compose custom memo..."
                disabled={isSent}
                className={`flex-1 bg-slate-950 border text-[10px] p-2.5 px-4 rounded-xl outline-none transition-all ${
                  isSent 
                    ? 'border-emerald-500/30 text-emerald-400 font-extrabold text-center' 
                    : 'border-white/15 focus:border-amber-500/30 text-slate-200'
                }`}
              />
              {!isSent && typedMessage && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSent(true);
                    if (typeof window !== 'undefined' && window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                      const u = new SpeechSynthesisUtterance("Message sent successfully");
                      window.speechSynthesis.speak(u);
                    }
                    setTimeout(() => {
                      setSelectedWaypoint(null);
                      setTypedMessage('');
                      setIsSent(false);
                    }, 2200);
                  }}
                  className="bg-amber-500 text-slate-950 px-4 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                >
                  SEND
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
