import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, Polyline, useMap, Circle, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Compass, MapPin, Bike, User, Store, Plus, Minus, Database, Layers } from 'lucide-react';

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
    const key = `${coords.z}-${coords.x}-${coords.y}`;

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
function CachedTileLayer() {
  const map = useMap();

  useEffect(() => {
    const url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const layer = new (CustomOfflineTileLayer as any)(url, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      crossOrigin: 'anonymous'
    });

    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map]);

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
        onClick={() => map.zoomIn()}
        className="w-10 h-10 bg-white shadow-xl rounded-xl flex items-center justify-center text-gray-900 active:scale-90 transition-all border border-gray-100"
      >
        <Plus className="w-5 h-5" />
      </button>
      <button 
        onClick={() => map.zoomOut()}
        className="w-10 h-10 bg-white shadow-xl rounded-xl flex items-center justify-center text-gray-900 active:scale-90 transition-all border border-gray-100"
      >
        <Minus className="w-5 h-5" />
      </button>
    </div>
  );
}

export default function LiveMap({ riderLoc, vendorLoc, customerLoc, zoom = 15, interactive = true, autoCenter = true }: LiveMapProps) {
  const [mapZoom, setMapZoom] = useState(zoom);
  const center: [number, number] = riderLoc || vendorLoc || customerLoc || [17.2473, 80.1514]; // Default to Khammam
  const [cachedCount, setCachedCount] = useState(0);
  const [showCacheZones, setShowCacheZones] = useState(true);

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
        <CachedTileLayer />
        
        <ZoomControls />

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
          <Marker position={vendorLoc} icon={createCustomIcon('vendor')}>
            <Popup>Vendor Location</Popup>
          </Marker>
        )}
        
        {riderLoc && (
          <Marker position={riderLoc} icon={createCustomIcon('rider')}>
            <Popup>Delivery Partner</Popup>
          </Marker>
        )}
        
        {customerLoc && (
          <Marker position={customerLoc} icon={createCustomIcon('customer')}>
            <Popup>Customer Location</Popup>
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
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-1.5 flex-wrap justify-end">
        {/* Toggle Cache Overlay button */}
        <button 
          onClick={() => setShowCacheZones(!showCacheZones)}
          className={`px-2.5 py-1.5 rounded-xl border font-mono text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ml-auto cursor-pointer transition-all outline-none ${
            showCacheZones 
              ? 'bg-emerald-500 font-extrabold text-slate-950 border-emerald-400 active:scale-95 shadow-md shadow-emerald-950/20' 
              : 'bg-slate-905/90 backdrop-blur-md text-slate-400 border-[#ffffff1a] hover:text-white'
          }`}
          title="Toggle Pre-cached Offline Map Regions Overlay"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Zones: {showCacheZones ? 'ON' : 'OFF'}</span>
        </button>

        <div className="bg-slate-905/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 text-emerald-400">
          <Database className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Local Cache: <span className="text-white font-mono">{cachedCount} tiles</span></span>
        </div>
        <button className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-indigo-600 shadow-lg border border-white/50 active:scale-95 transition-all">
          <Compass className="w-6 h-6" />
        </button>
      </div>

      {!interactive && (
        <div className="absolute inset-0 z-[1001] pointer-events-none bg-gradient-to-t from-black/20 to-transparent" />
      )}
    </div>
  );
}
