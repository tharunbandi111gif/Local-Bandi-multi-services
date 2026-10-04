import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  MapPin, 
  Navigation, 
  Phone, 
  ExternalLink, 
  Store, 
  Check, 
  ShieldCheck, 
  Compass, 
  Layers, 
  Sparkles,
  Edit2,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface StoreMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: any;
  isAdmin?: boolean;
  userLocation?: { lat: number; lng: number } | null;
  onCoordinatesUpdated?: (storeId: string, lat: number, lng: number) => void;
}

// Custom store marker icon
const createStorePinIcon = (isOnline: boolean = true) => {
  return L.divIcon({
    className: 'custom-store-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;">
        <div style="
          width: 42px; 
          height: 42px; 
          border-radius: 14px; 
          background: ${isOnline ? '#10B981' : '#64748B'}; 
          border: 3px solid #FFFFFF; 
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.4); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: white;
          transform: translateY(-4px);
        ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
        <div style="
          width: 0; 
          height: 0; 
          border-left: 7px solid transparent; 
          border-right: 7px solid transparent; 
          border-top: 8px solid ${isOnline ? '#10B981' : '#64748B'}; 
          transform: translateY(-5px);
        "></div>
        <div style="
          width: 14px; 
          height: 6px; 
          background: rgba(0,0,0,0.25); 
          border-radius: 50%; 
          filter: blur(1px); 
          transform: translateY(-3px);
        "></div>
      </div>
    `,
    iconSize: [42, 52],
    iconAnchor: [21, 50],
    popupAnchor: [0, -48]
  });
};

// Component to handle map clicks for Admin re-pinning
function MapClickHandler({ 
  isAdmin, 
  onPinMove 
}: { 
  isAdmin: boolean; 
  onPinMove: (lat: number, lng: number) => void; 
}) {
  useMapEvents({
    click(e) {
      if (isAdmin) {
        onPinMove(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
      }
    }
  });
  return null;
}

// Component to center map smoothly
function MapCenterController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 16, { animate: true });
  }, [center[0], center[1], map]);
  return null;
}

export const StoreMapModal: React.FC<StoreMapModalProps> = ({
  isOpen,
  onClose,
  store,
  isAdmin = false,
  userLocation,
  onCoordinatesUpdated
}) => {
  if (!isOpen || !store) return null;

  // Resolve initial coordinates
  const getInitialCoords = (): [number, number] => {
    if (store.coordinates?.lat && store.coordinates?.lng) {
      return [Number(store.coordinates.lat), Number(store.coordinates.lng)];
    }
    if (store.lat && store.lng) {
      return [Number(store.lat), Number(store.lng)];
    }
    // Default fallback coordinates around Khammam Central (17.2473, 80.1514)
    // with small deterministic offset per store ID so multiple stores don't overlap exactly
    const hash = (store.id || 'store').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const offsetLat = ((hash % 17) - 8) * 0.0025;
    const offsetLng = (((hash * 3) % 19) - 9) * 0.0025;
    return [17.2473 + offsetLat, 80.1514 + offsetLng];
  };

  const initialCoords = getInitialCoords();
  const [currentCoords, setCurrentCoords] = useState<[number, number]>(initialCoords);
  const [mapStyle, setMapStyle] = useState<'osm' | 'satellite'>('osm');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [isPublicVisible, setIsPublicVisible] = useState<boolean>(store.showOnMap !== false);

  // Sync coords if store changes
  useEffect(() => {
    const coords = getInitialCoords();
    setCurrentCoords(coords);
    setIsPublicVisible(store.showOnMap !== false);
  }, [store?.id, store?.coordinates?.lat, store?.coordinates?.lng, store?.lat, store?.lng, store?.showOnMap]);

  const storeName = store.businessName || store.storeName || store.name || 'Merchant Store';
  const ownerName = store.ownerName || 'Verified Partner';
  const phone = store.phone || '9999999999';
  const address = store.address || store.location?.area || 'Khammam, Telangana';
  const isOnline = store.isOnline !== false;

  // Save new pin coordinates to Firestore (Admin only)
  const handleSaveCoordinates = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    try {
      const vendorDocRef = doc(db, 'vendors', store.id);
      await updateDoc(vendorDocRef, {
        coordinates: {
          lat: currentCoords[0],
          lng: currentCoords[1]
        },
        lat: currentCoords[0],
        lng: currentCoords[1],
        showOnMap: isPublicVisible,
        updatedAt: serverTimestamp()
      });

      onCoordinatesUpdated?.(store.id, currentCoords[0], currentCoords[1]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save store coordinates:", err);
      alert("Failed to update store coordinates. Please check your admin permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  // Copy GPS string to clipboard
  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${currentCoords[0]}, ${currentCoords[1]}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-slate-800/90 border-b border-slate-700/80 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
              isOnline ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'
            }`}>
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-black text-base leading-tight truncate max-w-[200px] sm:max-w-[280px]">
                  {storeName}
                </h3>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isOnline ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isOnline ? 'Open Now' : 'Closed'}
                </span>
              </div>
              <p className="text-slate-400 text-xs truncate max-w-[240px] sm:max-w-[320px]">
                {ownerName} • {store.service || 'Kirana & Essentials'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Admin Notification Banner */}
        {isAdmin && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-5 py-2 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Admin GPS Control: Tap map to reposition pin</span>
            </div>
            <span className="text-[10px] font-mono bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
              Authority Active
            </span>
          </div>
        )}

        {/* Interactive Map Area */}
        <div className="relative w-full h-72 sm:h-80 bg-slate-950">
          <MapContainer
            center={currentCoords}
            zoom={16}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url={mapStyle === 'osm' 
                ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              }
            />

            <MapCenterController center={currentCoords} />

            <Marker
              position={currentCoords}
              icon={createStorePinIcon(isOnline)}
            >
              <Popup>
                <div className="p-1 text-slate-900">
                  <h4 className="font-bold text-xs">{storeName}</h4>
                  <p className="text-[10px] text-slate-600">{address}</p>
                  <p className="text-[9px] font-mono text-emerald-700 font-bold mt-1">
                    {currentCoords[0].toFixed(5)}° N, {currentCoords[1].toFixed(5)}° E
                  </p>
                </div>
              </Popup>
            </Marker>

            <MapClickHandler 
              isAdmin={isAdmin} 
              onPinMove={(lat, lng) => setCurrentCoords([lat, lng])} 
            />
          </MapContainer>

          {/* Map Layer Switcher (Streets vs Satellite) */}
          <div className="absolute top-3 right-3 z-[400] flex bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg">
            <button
              onClick={() => setMapStyle('osm')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                mapStyle === 'osm' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Street
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                mapStyle === 'satellite' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
          </div>

          {/* Re-center Button */}
          <button
            onClick={() => setCurrentCoords(initialCoords)}
            title="Recenter to registered location"
            className="absolute bottom-3 right-3 z-[400] bg-slate-900/90 hover:bg-slate-800 text-white p-2 rounded-xl border border-slate-700/80 shadow-lg transition"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Coordinates Badge */}
          <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-xs text-white font-bold">
              {currentCoords[0].toFixed(5)}°, {currentCoords[1].toFixed(5)}°
            </span>
            <button
              onClick={handleCopyCoords}
              className="text-slate-400 hover:text-white transition p-0.5"
              title="Copy Coordinates"
            >
              {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Details & Location Info */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Store Physical Address</span>
            <p className="text-sm font-semibold text-slate-200 leading-snug">
              {address}
            </p>
          </div>

          {/* Admin Coordinate Adjustment Inputs */}
          {isAdmin && (
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" /> Fine-Tune GPS Coordinates
                </span>
                <button
                  type="button"
                  onClick={() => setIsPublicVisible(!isPublicVisible)}
                  className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg transition ${
                    isPublicVisible 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {isPublicVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>{isPublicVisible ? 'Publicly Visible' : 'Hidden on Map'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase text-slate-400 mb-1 block">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={currentCoords[0]}
                    onChange={(e) => setCurrentCoords([parseFloat(e.target.value) || 0, currentCoords[1]])}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase text-slate-400 mb-1 block">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={currentCoords[1]}
                    onChange={(e) => setCurrentCoords([currentCoords[0], parseFloat(e.target.value) || 0])}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400">Click anywhere on the map above to move pin marker.</span>
                <button
                  onClick={handleSaveCoordinates}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-950/20 transition cursor-pointer"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-slate-950" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-slate-950" />
                      <span>{isSaving ? 'Saving...' : 'Save Pin GPS'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Quick External Actions */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${currentCoords[0]},${currentCoords[1]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20"
            >
              <Navigation className="w-4 h-4" />
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>

            {phone && (
              <a
                href={`tel:${phone}`}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-2xl text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Call Store</span>
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StoreMapModal;
