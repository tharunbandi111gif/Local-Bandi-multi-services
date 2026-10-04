/**
 * Official Delivery Charge & Distance Engine for Local Bandi Multi Services
 * 
 * Rules:
 * - Up to 3.0 km: Flat ₹25 delivery fee.
 * - Distances above 3.0 km: ₹25 for the first 3 km + ₹10 for each additional kilometer.
 * - Read-only / tamper-proof: Customers cannot manually alter or override the charge.
 */

export interface DeliveryCalculationResult {
  distanceKm: number;
  deliveryCharge: number;
  baseKm: number;
  baseCharge: number;
  additionalKm: number;
  additionalRatePerKm: number;
  additionalCharge: number;
  breakdownText: string;
}

/**
 * Calculates straight-line / route-adjusted distance in kilometers using the Haversine formula.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 2.5; // Default safe local Khammam hub distance
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Real-world road routing multiplier (~1.25x straight-line aviation distance)
  const roadFactor = 1.2;
  const distance = Number((R * c * roadFactor).toFixed(1));
  return Math.max(0.5, distance);
}

/**
 * Computes official delivery fee based on distance:
 * - Up to 3.0 km: Flat ₹25
 * - Above 3.0 km: ₹25 for the first 3 km + ₹10 for each additional kilometer
 */
export function calculateDeliveryCharge(distanceKmInput: number | string | undefined | null): number {
  const dist = Math.max(0.1, Number(distanceKmInput) || 2.5);
  
  if (dist <= 3.0) {
    return 25;
  }
  
  const additionalKm = dist - 3.0;
  // ₹25 for first 3 km + ₹10 for each additional km
  const additionalFee = Math.round(additionalKm * 10);
  return 25 + additionalFee;
}

/**
 * Returns complete calculation details and readable breakdown for UI and Invoices.
 */
export function getDeliveryBreakdown(distanceKmInput: number | string | undefined | null): DeliveryCalculationResult {
  const dist = Math.max(0.1, Number(distanceKmInput) || 2.5);
  const baseKm = 3.0;
  const baseCharge = 25;
  const additionalRatePerKm = 10;
  
  if (dist <= baseKm) {
    return {
      distanceKm: dist,
      deliveryCharge: baseCharge,
      baseKm,
      baseCharge,
      additionalKm: 0,
      additionalRatePerKm,
      additionalCharge: 0,
      breakdownText: `Flat ₹${baseCharge} (Up to 3.0 km)`
    };
  }
  
  const additionalKm = Number((dist - baseKm).toFixed(1));
  const additionalCharge = Math.round(additionalKm * additionalRatePerKm);
  const deliveryCharge = baseCharge + additionalCharge;
  
  return {
    distanceKm: dist,
    deliveryCharge,
    baseKm,
    baseCharge,
    additionalKm,
    additionalRatePerKm,
    additionalCharge,
    breakdownText: `₹${baseCharge} (first 3 km) + ₹${additionalCharge} (${additionalKm} km @ ₹${additionalRatePerKm}/km)`
  };
}

/**
 * Resolves distance between customer location and branch/store
 */
export function resolveOrderDistanceKm(
  customerLocation?: string | { lat: number; lng: number } | null,
  storeOrBranchLocation?: { lat?: number; lng?: number; coordinates?: { lat: number; lng: number } } | null
): number {
  // Store default (Khammam Central Hub: 17.2473, 80.1514)
  const storeLat = storeOrBranchLocation?.lat || storeOrBranchLocation?.coordinates?.lat || 17.2473;
  const storeLng = storeOrBranchLocation?.lng || storeOrBranchLocation?.coordinates?.lng || 80.1514;

  if (typeof customerLocation === 'object' && customerLocation !== null && 'lat' in customerLocation && 'lng' in customerLocation) {
    return calculateDistanceKm(storeLat, storeLng, customerLocation.lat, customerLocation.lng);
  }

  // Address string heuristics for local Khammam locations
  if (typeof customerLocation === 'string') {
    const lower = customerLocation.toLowerCase();
    if (lower.includes('wyra') || lower.includes('507165')) return 4.8;
    if (lower.includes('kothagudem') || lower.includes('507101')) return 12.5;
    if (lower.includes('palvancha')) return 14.0;
    if (lower.includes('sathupalli')) return 18.0;
    if (lower.includes('madhira')) return 15.0;
    if (lower.includes('clock tower') || lower.includes('main center') || lower.includes('507001')) return 1.8;
    if (lower.includes('rotary nagar') || lower.includes('khanapuram') || lower.includes('507002')) return 3.4;
    if (lower.includes('mamillagudem') || lower.includes('507003')) return 2.6;
    if (lower.includes('bapuji nagar') || lower.includes('mayuri center')) return 2.2;
    if (lower.includes('nayabazar') || lower.includes('bus stand')) return 2.0;
  }

  // Check saved coordinates in localStorage
  try {
    const savedLat = parseFloat(localStorage.getItem('lokal_user_lat') || '');
    const savedLng = parseFloat(localStorage.getItem('lokal_user_lng') || '');
    if (!isNaN(savedLat) && !isNaN(savedLng)) {
      return calculateDistanceKm(storeLat, storeLng, savedLat, savedLng);
    }
  } catch {
    // ignore
  }

  return 2.5; // Standard default local distance (under 3km flat ₹25)
}
