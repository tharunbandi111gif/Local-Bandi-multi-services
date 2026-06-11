import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { 
  Bike, MapPin, Store, Settings, Target, Eye, 
  EyeOff, Crosshair, Users, Map as MapIcon, RotateCw, Navigation, AlertCircle 
} from 'lucide-react';

// --- CONFIG & GEOGRAPHIC HELPERS ---
const KHAMMAM_LAT = 17.2473;
const KHAMMAM_LNG = 80.1514;

// Generates stable deterministic coordinates around Khammam center
export const getDeterministicLocation = (id: string, indexOffset = 0): [number, number] => {
  let hash = 0;
  const seedString = id + "-" + indexOffset;
  for (let i = 0; i < seedString.length; i++) {
    hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Constrain coordinates to standard Khammam layout
  const latOffset = (Math.sin(hash) * 0.015); // max 1.5 - 2 km offset
  const lngOffset = (Math.cos(hash) * 0.018); 
  
  return [KHAMMAM_LAT + latOffset, KHAMMAM_LNG + lngOffset];
};

// Map Viewport Synchronizer & Auto-Panning Controller
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1.0 });
  }, [center, zoom, map]);
  return null;
}

// Custom DivIcon creator for highly customized map markers
const buildSvgMarker = (type: 'vendor' | 'customer' | 'rider-online' | 'rider-offline' | 'hotspot', textLabel?: string) => {
  const config = {
    vendor: {
      color: '#6366f1', // Indigo
      svgPath: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>',
      shadow: 'shadow-indigo-500/25'
    },
    customer: {
      color: '#f43f5e', // Rose / Red
      svgPath: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
      shadow: 'shadow-rose-500/25'
    },
    'rider-online': {
      color: '#10b981', // Emerald Green
      svgPath: '<path d="M5.5 17.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0"></path><path d="M18.5 17.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0"></path><path d="M3 6h5.5l5 11h6.5"></path><path d="M13 10h4l-2 3h4"></path>',
      shadow: 'shadow-emerald-500/40'
    },
    'rider-offline': {
      color: '#64748b', // Slate Grey
      svgPath: '<path d="M5.5 17.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0"></path><path d="M18.5 17.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0"></path><path d="M3 6h5.5l5 11h6.5"></path>',
      shadow: 'shadow-slate-500/10'
    },
    hotspot: {
      color: '#eab308', // Amber Warning Hotspot
      svgPath: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>',
      shadow: 'shadow-yellow-500/20'
    }
  };

  const selected = config[type];
  const pulseClass = type === 'rider-online' ? 'animate-pulse' : '';
  const isLabelEmpty = !textLabel ? 'hidden' : '';

  return L.divIcon({
    className: 'custom-map-marker-div',
    html: `
      <div class="relative flex flex-col items-center">
        <!-- Marker Circle -->
        <div class="w-10 h-10 rounded-2xl bg-slate-950 border-2 border-[${selected.color}] flex items-center justify-center text-white ${selected.shadow} hover:scale-110 transition-transform cursor-pointer relative z-10">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${selected.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="${pulseClass}">
            ${selected.svgPath}
          </svg>
          ${type === 'rider-online' ? `<span class="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-400 border border-slate-950 rounded-full animate-ping"></span>` : ''}
        </div>
        
        <!-- Label tooltip under marker -->
        <div class="${isLabelEmpty} mt-1.5 px-2.5 py-0.5 bg-slate-950/90 backdrop-blur-md rounded-lg text-[8px] font-black uppercase text-slate-200 border border-white/5 shadow-md whitespace-nowrap z-0 max-w-[110px] overflow-hidden truncate">
          ${textLabel || ''}
        </div>
      </div>
    `,
    iconSize: [42, 60],
    iconAnchor: [21, 30],
  });
};

interface LogisticsHeatmapProps {
  orders: any[];
  riders: any[];
  vendors: any[];
  onSelectOrder: (orderId: string) => void;
  onDispatchOrderToRider: (orderId: string, riderId: string) => void;
  selectedOrderId: string | null;
}

export default function LogisticsHeatmap({
  orders,
  riders,
  vendors,
  onSelectOrder,
  onDispatchOrderToRider,
  selectedOrderId
}: LogisticsHeatmapProps) {
  const [mapZoom, setMapZoom] = useState(14);
  const [showHeatGlow, setShowHeatGlow] = useState(true);
  const [showRiders, setShowRiders] = useState(true);
  const [showMatchingCoverage, setShowMatchingCoverage] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Parse Orders Geolocation Data
  const parsedOrders = useMemo(() => {
    return orders.map((ord, idx) => {
      // Extract from coordinates or fallback to deterministic offsets
      let lat = ord.deliveryLocation?.lat || ord.lat;
      let lng = ord.deliveryLocation?.lng || ord.lng;
      
      const needsCalculation = (!lat || !lng || lat < 5 || lat > 50);
      if (needsCalculation) {
        const [generatedLat, generatedLng] = getDeterministicLocation(ord.id, idx + 1);
        lat = generatedLat;
        lng = generatedLng;
      }

      // Vendor coordinates lookup
      let vLat = ord.vendorLocation?.lat;
      let vLng = ord.vendorLocation?.lng;
      if (!vLat || !vLng || vLat < 5 || vLat > 50) {
        const vRef = vendors.find(v => v.id === ord.vendorId);
        if (vRef?.lat && vRef?.lng) {
          vLat = vRef.lat;
          vLng = vRef.lng;
        } else {
          const [vGeneratedLat, vGeneratedLng] = getDeterministicLocation(ord.vendorId || 'v-default', 99);
          vLat = vGeneratedLat;
          vLng = vGeneratedLng;
        }
      }

      return {
        ...ord,
        lat,
        lng,
        vendorLat: vLat,
        vendorLng: vLng
      };
    });
  }, [orders, vendors]);

  // Parse Riders Geolocation Data
  const parsedRiders = useMemo(() => {
    return riders.map((r, idx) => {
      let lat = r.lat || r.coordinates?.lat || r.location?.lat;
      let lng = r.lng || r.coordinates?.lng || r.location?.lng;
      
      if (!lat || !lng || lat < 5 || lat > 50) {
        const [generatedLat, generatedLng] = getDeterministicLocation(r.id, idx + 40);
        lat = generatedLat;
        lng = generatedLng;
      }
      return {
        ...r,
        lat,
        lng
      };
    });
  }, [riders]);

  // Selected Order details
  const activeOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return parsedOrders.find(o => o.id === selectedOrderId);
  }, [selectedOrderId, parsedOrders]);

  // Set initial or responsive map focus
  const mapCenterCoords = useMemo((): [number, number] => {
    if (activeOrder) {
      return [activeOrder.lat, activeOrder.lng];
    }
    return [KHAMMAM_LAT, KHAMMAM_LNG];
  }, [activeOrder]);

  // Heatmap Clusters computation for diagnostics HUD overlay over map
  const heatDiagnostics = useMemo(() => {
    const pending = parsedOrders.filter(o => o.status === 'Pending');
    const totals = pending.length;
    
    // Sort riders based on online & distance if order is selected
    let nearestRiderName = 'None';
    let nearestDistanceStr = 'N/A';
    
    if (activeOrder && parsedRiders.length > 0) {
      const onlineList = parsedRiders.filter(r => r.isOnline && r.status === 'Approved');
      if (onlineList.length > 0) {
        let minDistanceSq = Infinity;
        let closestRider: any = null;
        onlineList.forEach(r => {
          const dSq = Math.pow(r.lat - activeOrder.lat, 2) + Math.pow(r.lng - activeOrder.lng, 2);
          if (dSq < minDistanceSq) {
            minDistanceSq = dSq;
            closestRider = r;
          }
        });

        if (closestRider) {
          nearestRiderName = closestRider.name;
          // Rough conversion from lat/lng degrees to meters
          const distanceMeters = Math.round(Math.sqrt(minDistanceSq) * 111320);
          nearestDistanceStr = distanceMeters >= 1000 
            ? `${(distanceMeters / 1000).toFixed(1)} km` 
            : `${distanceMeters}m`;
        }
      }
    }

    return {
      totalHotspots: totals,
      nearestRiderName,
      nearestDistanceStr
    };
  }, [parsedOrders, parsedRiders, activeOrder]);

  const handleManualTriggerSync = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  };

  return (
    <div className="bg-slate-950 border border-white/5 rounded-[2.5rem] overflow-hidden p-1 relative shadow-inner">
      
      {/* 1. Header Map Diagnostics Controls */}
      <div className="p-4 flex flex-wrap justify-between items-center gap-3 bg-slate-900 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping" />
          <h4 className="text-[10px] font-black uppercase text-slate-100 tracking-wider">
            Live High-Resolution Dispatch Matrix Maps
          </h4>
        </div>

        {/* Map Rendering Settings Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowHeatGlow(!showHeatGlow)}
            className={`px-3 py-1.5 rounded-xl text-[8.5px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${showHeatGlow ? 'bg-rose-500/20 text-rose-400 border border-rose-505/20' : 'bg-slate-950 text-slate-500 border border-white/5'}`}
          >
            {showHeatGlow ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Overlay Thermal Heat</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRiders(!showRiders)}
            className={`px-3 py-1.5 rounded-xl text-[8.5px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${showRiders ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-505/20' : 'bg-slate-950 text-slate-500 border border-white/5'}`}
          >
            {showRiders ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Fleet Indicators</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMatchingCoverage(!showMatchingCoverage)}
            className={`px-3 py-1.5 rounded-xl text-[8.5px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${showMatchingCoverage ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-505/20' : 'bg-slate-950 text-slate-500 border border-white/5'}`}
            title="Display circular match radiuses containing efficient pending items"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Show Coverage Rings</span>
          </button>

          <button
            type="button"
            onClick={handleManualTriggerSync}
            className="w-8 h-8 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center border border-white/5 active:scale-90 transition-all cursor-pointer"
            title="Force telemetry refresh"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-yellow-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Map Container Box */}
      <div className="h-[440px] md:h-[500px] w-full relative z-0">
        <MapContainer 
          center={mapCenterCoords} 
          zoom={mapZoom} 
          style={{ height: '100%', width: '100%', background: '#090d16' }}
          zoomControl={false}
          scrollWheelZoom={true}
        >
          {/* Custom Dark Theme OpenStreetMap background tiles */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          
          <MapController center={mapCenterCoords} zoom={mapZoom} />

          {/* Pending Order Heat Overlay (thermal glow effect using multiple overlapping fading circle rings) */}
          {showHeatGlow && parsedOrders.filter(o => o.status === 'Pending').map((ord) => (
            <React.Fragment key={`heat-${ord.id}`}>
              {/* Outer faint heat dissipation ripple */}
              <Circle
                center={[ord.lat, ord.lng]}
                radius={450}
                pathOptions={{
                  fillColor: '#ef4444',
                  fillOpacity: 0.12,
                  color: '#ef4444',
                  weight: 1,
                  opacity: 0.15,
                  dashArray: '5, 8'
                }}
              />
              {/* Mid dynamic core glow */}
              <Circle
                center={[ord.lat, ord.lng]}
                radius={220}
                pathOptions={{
                  fillColor: '#f97316',
                  fillOpacity: 0.28,
                  stroke: false
                }}
              />
              {/* Intense critical nuclear hotspot center */}
              <Circle
                center={[ord.lat, ord.lng]}
                radius={80}
                pathOptions={{
                  fillColor: '#eab308',
                  fillOpacity: 0.45,
                  stroke: false
                }}
              />
            </React.Fragment>
          ))}

          {/* Matches Coverage Radiuses */}
          {showMatchingCoverage && parsedOrders.filter(o => o.status === 'Pending').map((ord) => (
            <Circle
              key={`coverage-${ord.id}`}
              center={[ord.lat, ord.lng]}
              radius={1000} // standard 1km matching dispatch mesh
              pathOptions={{
                fill: false,
                color: '#4f46e5',
                weight: 1.5,
                opacity: 0.4,
                dashArray: '3, 6'
              }}
            />
          ))}

          {/* Render All Pending & Live Orders */}
          {parsedOrders.map((ord) => {
            const isSelected = selectedOrderId === ord.id;
            const isPending = ord.status === 'Pending';
            const iconType = isSelected ? 'hotspot' : 'customer';
            
            return (
              <Marker
                key={`marker-ord-${ord.id}`}
                position={[ord.lat, ord.lng]}
                icon={buildSvgMarker(iconType, `Order #${ord.id.slice(0, 4).toUpperCase()}`)}
                eventHandlers={{
                  click: () => onSelectOrder(ord.id)
                }}
              >
                <Popup className="custom-popup bg-slate-950 text-white rounded-2xl border border-white/10">
                  <div className="p-3 space-y-2 text-left bg-slate-950 font-sans text-xs">
                    <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                      <span className="font-extrabold text-indigo-400">ORDER DETS</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${isPending ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-350'}`}>
                        {ord.status}
                      </span>
                    </div>

                    <p className="font-bold text-slate-100 uppercase text-[10px]"># {ord.id.toUpperCase()}</p>
                    <p className="text-slate-400 text-[10px]">📍 {ord.address || ord.deliveryAddress || 'Khammam Handover'}</p>
                    <p className="font-semibold text-emerald-400">Total: ₹{ord.total}</p>
                    
                    <button
                      type="button"
                      onClick={() => onSelectOrder(ord.id)}
                      className="w-full mt-2 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-lg text-[9px] font-black uppercase tracking-wider text-center cursor-pointer transition-colors"
                    >
                      Focus Order
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Active Order routing markers & lines */}
          {activeOrder && (
            <>
              {/* Merchant / Store Location point */}
              <Marker
                position={[activeOrder.vendorLat, activeOrder.vendorLng]}
                icon={buildSvgMarker('vendor', `Store: ${activeOrder.vendorName || 'Hub'}`)}
              >
                <Popup>
                  <p className="font-bold text-xs">Merchant: {activeOrder.vendorName || 'Central Branch Hub'}</p>
                </Popup>
              </Marker>

              {/* Match Line connecting Store to Customer Delivery Location */}
              <Polyline
                positions={[[activeOrder.vendorLat, activeOrder.vendorLng], [activeOrder.lat, activeOrder.lng]]}
                pathOptions={{
                  color: '#fbbf24', // golden dashed dispatch lane
                  weight: 3.5,
                  opacity: 0.85,
                  dashArray: '12, 12'
                }}
              />
            </>
          )}

          {/* Render All Delivery Fleet Partners */}
          {showRiders && parsedRiders.map((rider) => {
            const isOnline = rider.isOnline;
            const riderType = isOnline ? 'rider-online' : 'rider-offline';
            const statusLabel = isOnline ? 'ONLINE' : 'OFFLINE';

            return (
              <Marker
                key={`marker-rider-${rider.id}`}
                position={[rider.lat, rider.lng]}
                icon={buildSvgMarker(riderType, rider.name)}
              >
                <Popup>
                  <div className="p-3 text-left space-y-1 bg-slate-950 font-sans text-xs text-white">
                    <p className="font-black text-slate-100 flex items-center gap-1">
                      <span>🏍️ {rider.name}</span>
                      <span className={`px-1.5 py-0.2 ml-1 text-[8px] rounded font-black ${isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                        {statusLabel}
                      </span>
                    </p>
                    <p className="text-[10px] text-slate-350">📞 Contact: {rider.phone || '9876543210'}</p>
                    
                    {/* Instantly allow manual matching logic */}
                    {activeOrder && !activeOrder.riderId && (
                      <button
                        type="button"
                        onClick={() => {
                          onDispatchOrderToRider(activeOrder.id, rider.id);
                        }}
                        className="w-full mt-2.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-[9px] font-black uppercase tracking-widest text-center cursor-pointer transition-transform duration-700 active:scale-95"
                      >
                        ⚡ Dispatch selected item
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* 3. Sleek Floating Telemetry Diagnostic Widget (HUD Overlay) */}
        <div className="absolute top-4 left-4 z-[500] pointer-events-auto bg-slate-950/90 backdrop-blur-md border border-white/10 p-4.5 rounded-3xl max-w-xs font-sans text-left space-y-3.5 shadow-2xl">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h5 className="text-[9.5px] font-black uppercase text-yellow-400 tracking-wider flex items-center gap-1.5">
              <MapIcon className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
              <span>Real-Time Dispatch HUD</span>
            </h5>
            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase rounded border border-indigo-500/10">
              Live Feed
            </span>
          </div>

          <div className="space-y-2">
            {/* Hotspots pending */}
            <div className="flex justify-between items-center text-[10.5px]">
              <span className="text-slate-400 font-semibold uppercase">Pending Hotspots:</span>
              <span className="font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/10">
                {heatDiagnostics.totalHotspots} active zones
              </span>
            </div>

            {/* Total Fleet stats */}
            <div className="flex justify-between items-center text-[10.5px]">
              <span className="text-slate-400 font-semibold uppercase">Active Fleet count:</span>
              <span className="font-bold text-white">
                {riders.filter(r => r.isOnline).length} Online / {riders.length} Total
              </span>
            </div>

            {/* Selection indicators */}
            {activeOrder ? (
              <div className="pt-2 border-t border-white/5 space-y-1.5">
                <div className="bg-slate-900 border border-indigo-500/20 p-2.5 rounded-2xl space-y-1">
                  <p className="text-[8.5px] font-black text-indigo-400 uppercase tracking-widest">Focused Order Matching</p>
                  <p className="text-[10px] font-black text-white truncate">#{activeOrder.id.toUpperCase()}</p>
                  
                  <div className="flex justify-between items-center text-[9px] pt-1.5 border-t border-white/5 text-slate-400">
                    <span>Nearest Pilot:</span>
                    <span className="font-extrabold text-emerald-400">{heatDiagnostics.nearestRiderName}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-slate-400">
                    <span>Aviation distance:</span>
                    <span className="font-mono text-white">{heatDiagnostics.nearestDistanceStr}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-2.5 border-t border-white/5 flex items-center gap-1.5 text-[8.5px] font-black text-slate-420 uppercase leading-relaxed">
                <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
                <span>Select any pending stream from sidebar for matching matrix metrics.</span>
              </div>
            )}
          </div>
        </div>

        {/* 4. Sleek bottom mini legend bar Overlay */}
        <div className="absolute bottom-4 right-4 z-[500] pointer-events-none bg-slate-950/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-4 text-[8.5px] font-black uppercase text-slate-300 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 border border-white/10" />
            <span>Store</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white/10 animate-pulse" />
            <span>Customer</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white/10" />
            <span>Online Rider</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500 border border-white/10" />
            <span>Heat Center</span>
          </div>
        </div>

      </div>
    </div>
  );
}
