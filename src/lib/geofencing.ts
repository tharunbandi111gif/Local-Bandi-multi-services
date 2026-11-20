import { Branch } from '../types';

/**
 * Geofencing Utilities for Branch-Specific & Per-Service Delivery Boundaries
 */

export const PINCODE_COORDINATES: Record<string, [number, number]> = {
  '507001': [17.2473, 80.1514],
  '507002': [17.2580, 80.1650],
  '507003': [17.2350, 80.1400],
  '507163': [17.2110, 80.1120],
  '507159': [17.2850, 80.1890],
  '507165': [17.1894, 80.3540], // Wyra
  '507101': [17.5516, 80.6174], // Kothagudem
  '507303': [17.2081, 80.8354], // Sathupally
  '507203': [16.9200, 80.3667], // Madhira
  '500001': [17.3850, 78.4867],
  '500002': [17.3616, 78.4747],
  '500003': [17.4399, 78.4983],
  '500008': [17.3970, 78.3960],
  '500016': [17.4436, 78.4912],
  '500018': [17.4483, 78.4428],
  '500028': [17.3922, 78.4326],
  '500032': [17.4265, 78.3415],
  '500072': [17.4855, 78.3885],
  '500081': [17.4435, 78.3772],
  '500082': [17.4150, 78.3240],
  '506001': [17.9689, 79.5941], // Warangal
  '506002': [17.9750, 79.6100],
  '506015': [18.0120, 79.5630],
  '505001': [18.4386, 79.1288], // Karimnagar
  '505002': [18.4410, 79.1390],
  '508213': [17.1420, 79.6240], // Suryapet
  '508214': [17.1510, 79.6380],
  '520001': [16.5062, 80.6480], // Vijayawada
  '560001': [12.9716, 77.5946], // Bangalore
  '560038': [12.9784, 77.6408], // Indiranagar
  '400001': [19.0760, 72.8777], // Mumbai
  '400076': [19.1176, 72.9060], // Powai
};

export const CITY_COORDINATES: Record<string, [number, number]> = {
  khammam: [17.2473, 80.1514],
  mamillagudem: [17.2510, 80.1450],
  wyra: [17.1894, 80.3540],
  kothagudem: [17.5516, 80.6174],
  sathupally: [17.2081, 80.8354],
  madhira: [16.9200, 80.3667],
  hyderabad: [17.3850, 78.4867],
  madhapur: [17.4483, 78.3915],
  'hitech city': [17.4435, 78.3772],
  gachibowli: [17.4401, 78.3489],
  warangal: [17.9689, 79.5941],
  karimnagar: [18.4386, 79.1288],
  suryapet: [17.1420, 79.6240],
  vijayawada: [16.5062, 80.6480],
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  indiranagar: [12.9784, 77.6408],
  mumbai: [19.0760, 72.8777],
  powai: [19.1176, 72.9060],
  bandra: [19.0596, 72.8295],
  chennai: [13.0827, 80.2707],
  delhi: [28.6139, 77.2090],
};

/**
 * Calculates the Haversine distance in meters between two coordinates.
 */
export function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

/**
 * Ray-casting algorithm to check if a point [lat, lng] is inside a polygon [lat, lng][].
 */
export function isPointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];

    const intersect = yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Check if a coordinate [lat, lng] is within a single custom coverage zone.
 */
export function isPointInCoverageZone(lat: number, lng: number, zone: any): boolean {
  if (!zone) return false;

  if (zone.type === 'circle') {
    if (!zone.center || zone.radius === undefined) return false;
    const distance = getHaversineDistance(lat, lng, zone.center[0], zone.center[1]);
    return distance <= zone.radius;
  }

  if (zone.type === 'rectangle') {
    const bounds = zone.bounds;
    if (!bounds || bounds.length < 4) return false;
    return isPointInPolygon(lat, lng, bounds);
  }

  if (zone.type === 'polygon') {
    const positions = zone.positions || zone.bounds;
    if (!positions || positions.length < 3) return false;
    return isPointInPolygon(lat, lng, positions);
  }

  return false;
}

/**
 * Resolves the authoritative geographic center [lat, lng] of a Branch.
 */
export function getBranchCoordinates(branch?: Partial<Branch> | null): { lat: number; lng: number } {
  if (branch) {
    if (branch.coordinates && typeof branch.coordinates.lat === 'number' && typeof branch.coordinates.lng === 'number') {
      return { lat: branch.coordinates.lat, lng: branch.coordinates.lng };
    }
    if (typeof branch.lat === 'number' && typeof branch.lng === 'number') {
      return { lat: branch.lat, lng: branch.lng };
    }
    if (Array.isArray(branch.pincodes)) {
      for (const pin of branch.pincodes) {
        const cleanPin = String(pin).trim();
        if (PINCODE_COORDINATES[cleanPin]) {
          return { lat: PINCODE_COORDINATES[cleanPin][0], lng: PINCODE_COORDINATES[cleanPin][1] };
        }
      }
    }
    const text = `${branch.name || ''} ${branch.city || ''} ${branch.location || ''} ${branch.id || ''}`.toLowerCase();
    for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
      if (text.includes(city)) {
        return { lat: coords[0], lng: coords[1] };
      }
    }
  }
  return { lat: 17.2473, lng: 80.1514 }; // Khammam default HQ
}

/**
 * Resolves the effective operational radius (in km) for a branch or specific service.
 */
export function getServiceOperationalRadiusKm(branch?: Partial<Branch> | null, serviceId?: string): number {
  const defaultRadius = Number(branch?.deliveryRadius) > 0 ? Number(branch?.deliveryRadius) : 5;
  if (!serviceId || !branch) return defaultRadius;

  const cfgRadius = branch.categoryConfigs?.[serviceId]?.radiusKm;
  if (typeof cfgRadius === 'number' && cfgRadius > 0) return cfgRadius;

  const mapRadius = branch.serviceRadii?.[serviceId];
  if (typeof mapRadius === 'number' && mapRadius > 0) return mapRadius;

  return defaultRadius;
}

/**
 * Checks whether a service/category is online & visible in a given branch.
 */
export function isServiceOnlineInBranch(branch?: Partial<Branch> | null, serviceId?: string): boolean {
  if (!branch) return true;
  if (branch.status === 'Offline') return false;
  if (!serviceId) return true;

  const disabledList = Array.isArray(branch.disabledServices) ? branch.disabledServices : [];
  if (disabledList.includes(serviceId)) return false;

  if (branch.serviceControls && branch.serviceControls[serviceId] === false) return false;

  const cfg = branch.categoryConfigs?.[serviceId];
  if (cfg) {
    if (cfg.online === false) return false;
    if (cfg.visible === false) return false;
  }

  if (Array.isArray(branch.hiddenCategories) && branch.hiddenCategories.includes(serviceId)) {
    return false;
  }

  return true;
}

/**
 * Checks if a coordinate [lat, lng] is within active boundaries (custom zones + operational radius)
 * for a branch and optional specific serviceId.
 */
export function isPointInBranchBoundaries(
  lat: number,
  lng: number,
  branchId: string,
  coverageZones: any[],
  branch?: Partial<Branch> | null,
  serviceId?: string
): { inside: boolean; hasZones: boolean; distanceKm: number; maxRadiusKm: number; matchedZoneName?: string } {
  const center = getBranchCoordinates(branch);
  const distanceKm = Number((getHaversineDistance(lat, lng, center.lat, center.lng) / 1000).toFixed(2));
  const maxRadiusKm = getServiceOperationalRadiusKm(branch, serviceId);

  const branchZones = (coverageZones || []).filter(
    (zone) =>
      zone.branchId === branchId &&
      (zone.status === 'approved' || !zone.status) &&
      (!zone.serviceId || !serviceId || zone.serviceId === serviceId)
  );

  // If a service-specific radius override is configured, strictly validate against that radius
  // unless an explicit service-scoped zone grants access.
  const hasExplicitServiceRadius = Boolean(
    serviceId &&
      (typeof branch?.categoryConfigs?.[serviceId]?.radiusKm === 'number' ||
        typeof branch?.serviceRadii?.[serviceId] === 'number')
  );

  if (branchZones.length > 0 && !hasExplicitServiceRadius) {
    const matchedZone = branchZones.find((zone) => isPointInCoverageZone(lat, lng, zone));
    if (matchedZone) {
      return {
        inside: true,
        hasZones: true,
        distanceKm,
        maxRadiusKm,
        matchedZoneName: matchedZone.name || 'Approved Delivery Zone',
      };
    }
    return {
      inside: false,
      hasZones: true,
      distanceKm,
      maxRadiusKm,
    };
  }

  // Also allow an explicit service-specific custom zone if one matches
  if (serviceId) {
    const serviceZone = branchZones.find((z) => z.serviceId === serviceId && isPointInCoverageZone(lat, lng, z));
    if (serviceZone) {
      return {
        inside: true,
        hasZones: true,
        distanceKm,
        maxRadiusKm,
        matchedZoneName: serviceZone.name || `${serviceId} Zone`,
      };
    }
  }

  return {
    inside: distanceKm <= maxRadiusKm,
    hasZones: branchZones.length > 0,
    distanceKm,
    maxRadiusKm,
  };
}

export interface ServiceGeofenceResult {
  eligible: boolean;
  distanceKm: number;
  maxRadiusKm: number;
  matchedZoneName?: string;
  branchOnline: boolean;
  serviceOnline: boolean;
  reason?: string;
  serviceId?: string;
}

/**
 * Validates whether a customer's coordinates are eligible for a specific service in a branch.
 */
export function validateServiceGeofence(params: {
  lat: number;
  lng: number;
  branch?: Partial<Branch> | null;
  coverageZones: any[];
  serviceId?: string;
}): ServiceGeofenceResult {
  const { lat, lng, branch, coverageZones, serviceId } = params;
  const branchOnline = branch?.status !== 'Offline';
  const serviceOnline = isServiceOnlineInBranch(branch, serviceId);
  const boundary = isPointInBranchBoundaries(
    lat,
    lng,
    branch?.id || 'khammam_main',
    coverageZones,
    branch,
    serviceId
  );

  if (!branchOnline) {
    return {
      eligible: false,
      distanceKm: boundary.distanceKm,
      maxRadiusKm: boundary.maxRadiusKm,
      branchOnline: false,
      serviceOnline,
      serviceId,
      reason: `${branch?.name || 'Branch'} is currently Offline.`,
    };
  }

  if (!serviceOnline) {
    return {
      eligible: false,
      distanceKm: boundary.distanceKm,
      maxRadiusKm: boundary.maxRadiusKm,
      branchOnline: true,
      serviceOnline: false,
      serviceId,
      reason: `Service "${serviceId}" is temporarily paused/offline in ${branch?.name || 'this branch'}.`,
    };
  }

  if (!boundary.inside) {
    return {
      eligible: false,
      distanceKm: boundary.distanceKm,
      maxRadiusKm: boundary.maxRadiusKm,
      branchOnline: true,
      serviceOnline: true,
      serviceId,
      reason: serviceId
        ? `"${serviceId}" is only available within ${boundary.maxRadiusKm} km of ${branch?.name || 'the branch'} (selected location is ${boundary.distanceKm} km away).`
        : `Selected location is ${boundary.distanceKm} km away — outside the ${boundary.maxRadiusKm} km operational radius of ${branch?.name || 'this branch'}.`,
    };
  }

  return {
    eligible: true,
    distanceKm: boundary.distanceKm,
    maxRadiusKm: boundary.maxRadiusKm,
    matchedZoneName: boundary.matchedZoneName,
    branchOnline: true,
    serviceOnline: true,
    serviceId,
  };
}

export interface OrderGeofenceResult {
  eligible: boolean;
  distanceKm: number;
  maxRadiusKm: number;
  blockingServices: Array<{
    serviceId: string;
    reason: string;
    distanceKm: number;
    maxRadiusKm: number;
  }>;
  reason?: string;
}

/**
 * Validates order placement against active branch status, per-service online toggles, and per-service radii.
 */
export function validateOrderGeofence(params: {
  lat: number;
  lng: number;
  branch?: Partial<Branch> | null;
  coverageZones: any[];
  serviceIds: string[];
}): OrderGeofenceResult {
  const { lat, lng, branch, coverageZones, serviceIds } = params;
  const uniqueServices = Array.from(new Set(serviceIds.filter(Boolean)));
  const targets = uniqueServices.length > 0 ? uniqueServices : ['groceries'];

  const blockingServices: OrderGeofenceResult['blockingServices'] = [];
  let maxDist = 0;
  let minRadius = getServiceOperationalRadiusKm(branch);

  for (const serviceId of targets) {
    const res = validateServiceGeofence({ lat, lng, branch, coverageZones, serviceId });
    maxDist = Math.max(maxDist, res.distanceKm);
    minRadius = Math.min(minRadius, res.maxRadiusKm);
    if (!res.eligible) {
      blockingServices.push({
        serviceId,
        reason: res.reason || 'Outside active service boundary',
        distanceKm: res.distanceKm,
        maxRadiusKm: res.maxRadiusKm,
      });
    }
  }

  return {
    eligible: blockingServices.length === 0,
    distanceKm: maxDist,
    maxRadiusKm: minRadius,
    blockingServices,
    reason: blockingServices[0]?.reason,
  };
}

/**
 * Finds the best active branch covering a coordinate (or nearest branch with distance & coverage status).
 */
export function findBestBranchForCoords(
  lat: number,
  lng: number,
  branches: Branch[],
  coverageZones: any[],
  serviceId?: string
): { branch: Branch | null; distanceKm: number; inside: boolean; maxRadiusKm: number } {
  if (!branches || branches.length === 0) {
    return { branch: null, distanceKm: 0, inside: false, maxRadiusKm: 5 };
  }

  const evaluated = branches.map((b) => {
    const boundary = isPointInBranchBoundaries(lat, lng, b.id, coverageZones, b, serviceId);
    const isActive = b.status !== 'Offline';
    return {
      branch: b,
      distanceKm: boundary.distanceKm,
      inside: boundary.inside && isActive,
      maxRadiusKm: boundary.maxRadiusKm,
      isActive,
    };
  });

  // Prefer active branches that cover the point, sorted by shortest distance
  const covering = evaluated.filter((e) => e.inside).sort((a, b) => a.distanceKm - b.distanceKm);
  if (covering.length > 0) {
    return {
      branch: covering[0].branch,
      distanceKm: covering[0].distanceKm,
      inside: true,
      maxRadiusKm: covering[0].maxRadiusKm,
    };
  }

  // Otherwise return nearest active branch (or nearest overall)
  const nearest = evaluated
    .sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return a.distanceKm - b.distanceKm;
    })[0];

  return {
    branch: nearest.branch,
    distanceKm: nearest.distanceKm,
    inside: false,
    maxRadiusKm: nearest.maxRadiusKm,
  };
}

/**
 * Geocodes a specific address string WITHOUT reading stale localStorage coords.
 * Used when validating a manual location override before confirming.
 */
export async function geocodeAddress(addressStr: string): Promise<{ lat: number; lng: number } | null> {
  if (!addressStr || addressStr === 'Select Location') return null;
  const trimmed = addressStr.trim();

  // 0. Direct "lat, lng" input
  const coordMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // 1. Pincode match
  const pincodeMatch = trimmed.match(/\d{6}/);
  if (pincodeMatch && PINCODE_COORDINATES[pincodeMatch[0]]) {
    const [lat, lng] = PINCODE_COORDINATES[pincodeMatch[0]];
    return { lat, lng };
  }

  // 2. Try backend /api/maps/geocode ONLY if backed by real Google Maps API
  try {
    const resp = await fetch('/api/maps/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: trimmed }),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.success && data.provider === 'google-maps-api' && data.location) {
        return { lat: Number(data.location.lat), lng: Number(data.location.lng) };
      }
    }
  } catch {
    // ignore and try Nominatim / lookup
  }

  // 3. Check known Indian cities/regions in string before OpenStreetMap
  const lower = trimmed.toLowerCase();
  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    if (lower.includes(city)) {
      return { lat: coords[0], lng: coords[1] };
    }
  }

  // 4. OpenStreetMap Nominatim lookup
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&countrycodes=in&limit=1`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      const parsedLat = parseFloat(data[0].lat);
      const parsedLng = parseFloat(data[0].lon);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        return { lat: parsedLat, lng: parsedLng };
      }
    }
  } catch (err) {
    console.warn('Geocoding dynamic address lookup failed:', err);
  }

  return null;
}

/**
 * Dynamically resolves Lat/Lng coordinates from local storage, user profile,
 * regional pincodes, or OpenStreetMap lookup.
 */
export async function getCoordsFromAddress(
  addressStr: string,
  userProfile?: any
): Promise<{ lat: number; lng: number } | null> {
  // 1. Try localStorage first
  const localLat = localStorage.getItem('lokal_user_lat');
  const localLng = localStorage.getItem('lokal_user_lng');
  if (localLat && localLng) {
    const parsedLat = parseFloat(localLat);
    const parsedLng = parseFloat(localLng);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      return { lat: parsedLat, lng: parsedLng };
    }
  }

  // 2. Try userProfile fields
  if (userProfile && userProfile.latitude && userProfile.longitude) {
    const parsedLat = parseFloat(userProfile.latitude);
    const parsedLng = parseFloat(userProfile.longitude);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      return { lat: parsedLat, lng: parsedLng };
    }
  }

  // 3. Explicit address geocode
  return geocodeAddress(addressStr);
}

/**
 * Reverse geocodes [lat, lng] into a human-readable address string.
 * Uses /api/maps/reverse-geocode only when backed by Google Maps API,
 * otherwise queries OpenStreetMap Nominatim for accurate real-world GPS resolution.
 */
export async function reverseGeocodeCoords(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch('/api/maps/reverse-geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.provider === 'google-maps-api' && data.formattedAddress) {
        return data.formattedAddress;
      }
    }
  } catch {
    // fallback to Nominatim
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const osmData = await response.json();
    if (osmData && osmData.display_name) {
      return osmData.display_name;
    }
  } catch {
    // fallback to raw coordinates
  }

  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
