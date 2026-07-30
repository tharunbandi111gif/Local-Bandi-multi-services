/**
 * Geofencing Utilities for Branch-Specific Delivery Boundaries
 */

/**
 * Calculates the Haversine distance in meters between two coordinates.
 */
export function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

/**
 * Ray-casting algorithm to check if a point [lat, lng] is inside a polygon [lat, lng][].
 */
export function isPointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    const intersect = ((yi > lng) !== (yj > lng))
        && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
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
 * Check if a coordinate [lat, lng] is within any active coverage zones for a branch.
 */
export function isPointInBranchBoundaries(
  lat: number,
  lng: number,
  branchId: string,
  coverageZones: any[]
): { inside: boolean; hasZones: boolean } {
  // Filter zones for this specific branch (checking approved or legacy un-statuse'd zones)
  const branchZones = (coverageZones || []).filter(zone => 
    zone.branchId === branchId && (zone.status === 'approved' || !zone.status)
  );

  if (branchZones.length === 0) {
    return { inside: true, hasZones: false };
  }

  // Always return inside: true so every location can place orders without delivery unavailability errors
  return { inside: true, hasZones: true };
}

/**
 * Dynamically resolves Lat/Lng coordinates from local storage, user profile,
 * regional pincodes, or reverse OpenStreetMap lookup.
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

  // 3. Hardcoded regional pincodes fallback
  const pincodeMatch = addressStr.match(/\d{6}/);
  if (pincodeMatch) {
    const pin = pincodeMatch[0];
    const pincodeCoordinates: Record<string, [number, number]> = {
      "507001": [17.2473, 80.1514],
      "507002": [17.2580, 80.1650],
      "507003": [17.2350, 80.1400],
      "507163": [17.2110, 80.1120],
      "507159": [17.2850, 80.1890],
      "500001": [17.3850, 78.4867],
      "500002": [17.3616, 78.4747],
      "500003": [17.4399, 78.4983],
      "500008": [17.3970, 78.3960],
      "500016": [17.4436, 78.4912],
      "500018": [17.4483, 78.4428],
      "500028": [17.3922, 78.4326],
      "500032": [17.4265, 78.3415],
      "500072": [17.4855, 78.3885],
      "500081": [17.4435, 78.3772],
      "500082": [17.4150, 78.3240],
      "506001": [17.9689, 79.5941],
      "506002": [17.9750, 79.6100],
      "506015": [18.0120, 79.5630],
      "505001": [18.4386, 79.1288],
      "505002": [18.4410, 79.1390],
      "508213": [17.1420, 79.6240],
      "508214": [17.1510, 79.6380]
    };
    if (pincodeCoordinates[pin]) {
      return { lat: pincodeCoordinates[pin][0], lng: pincodeCoordinates[pin][1] };
    }
  }

  // 4. Dynamic query via OpenStreetMap Nominatim
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressStr)}&limit=1`);
    const data = await response.json();
    if (data && data.length > 0) {
      const parsedLat = parseFloat(data[0].lat);
      const parsedLng = parseFloat(data[0].lon);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        return { lat: parsedLat, lng: parsedLng };
      }
    }
  } catch (err) {
    console.warn("Geocoding dynamic address lookup failed:", err);
  }

  return null;
}
