import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Compass, MapPin, Bike, User, Store, Plus, Minus } from 'lucide-react';

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
}

function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, undefined, { animate: true });
  }, [center, map]);
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

export default function LiveMap({ riderLoc, vendorLoc, customerLoc, zoom = 15, interactive = true }: LiveMapProps) {
  const [mapZoom, setMapZoom] = useState(zoom);
  const center: [number, number] = riderLoc || vendorLoc || customerLoc || [17.2473, 80.1514]; // Default to Khammam
  
  // Simulated path between locations if they exist
  const path: [number, number][] = [];
  if (vendorLoc) path.push(vendorLoc);
  if (riderLoc) path.push(riderLoc);
  if (customerLoc) path.push(customerLoc);

  return (
    <div className="w-full h-full rounded-[2.5rem] overflow-hidden shadow-2xl relative border-4 border-white">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        dragging={interactive}
        scrollWheelZoom={interactive}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <ZoomControls />
        
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
        
        <MapUpdater center={center} zoom={mapZoom} />
      </MapContainer>

      {/* Map Overlays */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
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
