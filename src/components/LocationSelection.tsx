import React, { useState, useEffect } from 'react';
import {
  MapPin, Search, Navigation, Clock, Save, Home, Briefcase,
  X, Building, Activity, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight
} from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, collection, onSnapshot } from 'firebase/firestore';
import { Branch } from '../types';
import {
  geocodeAddress,
  reverseGeocodeCoords,
  findBestBranchForCoords,
  getBranchCoordinates,
  getServiceOperationalRadiusKm,
  isServiceOnlineInBranch,
  validateServiceGeofence
} from '../lib/geofencing';
import { CATEGORIES } from '../constants';

interface LocationSelectionProps {
  onSelect: (
    location: string,
    coords?: { lat: number; lng: number } | null,
    source?: 'gps' | 'manual',
    branchId?: string
  ) => void;
  userProfile?: any;
  currentLocation?: string;
  branches?: Branch[];
  coverageZones?: any[];
  userCoords?: { lat: number; lng: number } | null;
}

interface CandidateValidation {
  address: string;
  coords: { lat: number; lng: number } | null;
  source: 'gps' | 'manual';
  matchedBranch: Branch | null;
  distanceKm: number;
  maxRadiusKm: number;
  inside: boolean;
  eligible: boolean;
  reason?: string;
  serviceStatuses: Array<{
    id: string;
    name: string;
    radiusKm: number;
    online: boolean;
    eligible: boolean;
  }>;
}

export default function LocationSelection({
  onSelect,
  userProfile,
  currentLocation: propCurrentLocation,
  branches: propBranches,
  coverageZones: propCoverageZones,
}: LocationSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showSaveAddressModal, setShowSaveAddressModal] = useState(false);
  const [selectedAddressToSave, setSelectedAddressToSave] = useState('');
  const [addressType, setAddressType] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [branches, setBranches] = useState<Branch[]>(propBranches || []);
  const [coverageZones, setCoverageZones] = useState<any[]>(propCoverageZones || []);
  const [candidate, setCandidate] = useState<CandidateValidation | null>(null);

  const activeLocation = propCurrentLocation || localStorage.getItem('lokal_user_location') || '';

  useEffect(() => {
    if (propBranches && propBranches.length > 0) {
      setBranches(propBranches);
    }
  }, [propBranches]);

  useEffect(() => {
    if (propCoverageZones && propCoverageZones.length > 0) {
      setCoverageZones(propCoverageZones);
    }
  }, [propCoverageZones]);

  useEffect(() => {
    if (!db) return;
    const unsubBranches = onSnapshot(
      collection(db, 'branches'),
      (snap) => {
        const bList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Branch));
        if (bList.length > 0) setBranches(bList);
      },
      () => {
        if (branches.length === 0) {
          setBranches([
            {
              id: 'khammam_main',
              name: 'Khammam Main Branch',
              location: 'Khammam Center',
              city: 'Khammam',
              district: 'Khammam',
              state: 'Telangana',
              pincodes: ['507001', '507002', '507003'],
              status: 'Active',
              adminId: 'default_admin',
              adminName: 'Tharun Bandi',
              contactPhone: '8790729816',
              vendorsCount: 15,
              ordersCount: 120,
              revenue: 45000,
              profitShare: 10,
              joinDate: new Date(),
              agreementExpiry: new Date(),
              deliveryRadius: 5,
            },
          ]);
        }
      }
    );

    const unsubZones = onSnapshot(
      collection(db, 'coverage_zones'),
      (snap) => {
        setCoverageZones(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => {}
    );

    return () => {
      unsubBranches();
      unsubZones();
    };
  }, []);

  // Score-based matching logic for branches based on a location reference
  const getBranchScore = (b: Branch, refLocation: string) => {
    if (!refLocation || refLocation === 'Select Location') return 0;
    const lowerLoc = refLocation.toLowerCase();
    const pincodeMatch = refLocation.match(/\d{6}/);
    const pincode = pincodeMatch ? pincodeMatch[0] : null;

    let score = 0;
    const branchName = (b.name || '').toLowerCase();
    const branchLoc = (b.location || '').toLowerCase();
    const branchCity = (b.city || '').toLowerCase();
    const branchDistrict = (b.district || '').toLowerCase();

    if (pincode && b.pincodes?.includes(pincode)) score += 100;
    if (lowerLoc === branchLoc || lowerLoc === branchName) score += 80;
    else if (lowerLoc.includes(branchLoc) || lowerLoc.includes(branchName)) score += 50;
    if (branchCity && lowerLoc.includes(branchCity)) score += 30;
    if (branchDistrict && lowerLoc.includes(branchDistrict)) score += 20;
    if (branchLoc.includes(lowerLoc) || branchName.includes(lowerLoc)) score += 40;

    return score;
  };

  const referenceLocation = searchQuery && searchQuery.length > 2 ? searchQuery : activeLocation;

  const scoredBranchesList = React.useMemo(() => {
    if (!branches || branches.length === 0) return [];
    return branches
      .map((b) => ({
        ...b,
        matchScore: getBranchScore(b, referenceLocation),
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [branches, referenceLocation]);

  const evaluateCandidateLocation = async (
    addressStr: string,
    explicitCoords?: { lat: number; lng: number } | null,
    source: 'gps' | 'manual' = 'manual',
    preferredBranch?: Branch | null
  ) => {
    if (!addressStr.trim()) return;
    setValidating(true);

    try {
      const coords = explicitCoords || (await geocodeAddress(addressStr));
      if (!coords) {
        setCandidate({
          address: addressStr,
          coords: null,
          source,
          matchedBranch: preferredBranch || branches[0] || null,
          distanceKm: 0,
          maxRadiusKm: preferredBranch?.deliveryRadius || 5,
          inside: false,
          eligible: false,
          reason:
            'Could not verify GPS coordinates for this address. Please pick a search suggestion, enter a 6-digit pincode, or tap "Use Current Live Location".',
          serviceStatuses: [],
        });
        return;
      }

      const bestMatch = preferredBranch
        ? (() => {
            const check = validateServiceGeofence({
              lat: coords.lat,
              lng: coords.lng,
              branch: preferredBranch,
              coverageZones,
            });
            return {
              branch: preferredBranch,
              distanceKm: check.distanceKm,
              inside: check.eligible,
              maxRadiusKm: check.maxRadiusKm,
            };
          })()
        : findBestBranchForCoords(coords.lat, coords.lng, branches, coverageZones);

      const targetBranch = bestMatch.branch;
      const coreCheckIds = ['food', 'groceries', 'meat', 'dairy', 'pharmacy', 'services', 'hospital_op'];
      const serviceStatuses = coreCheckIds
        .filter((id) => !targetBranch?.hiddenCategories?.includes(id) && targetBranch?.categoryConfigs?.[id]?.visible !== false)
        .map((id) => {
          const catMeta = CATEGORIES.find((c) => c.id === id);
          const svcCheck = validateServiceGeofence({
            lat: coords.lat,
            lng: coords.lng,
            branch: targetBranch,
            coverageZones,
            serviceId: id,
          });
          return {
            id,
            name: targetBranch?.categoryConfigs?.[id]?.name || catMeta?.name || id,
            radiusKm: getServiceOperationalRadiusKm(targetBranch, id),
            online: isServiceOnlineInBranch(targetBranch, id),
            eligible: svcCheck.eligible,
          };
        });

      const anyServiceEligible = serviceStatuses.some((s) => s.eligible);
      const isBranchActive = targetBranch ? targetBranch.status !== 'Offline' : true;
      const eligible = isBranchActive && (bestMatch.inside || anyServiceEligible);

      let reason: string | undefined;
      if (!isBranchActive && targetBranch) {
        reason = `${targetBranch.name} is currently Offline.`;
      } else if (!eligible && targetBranch) {
        reason = `This location is ${bestMatch.distanceKm} km away from ${targetBranch.name}, which exceeds the active ${bestMatch.maxRadiusKm} km operational service radius.`;
      }

      setCandidate({
        address: addressStr,
        coords,
        source,
        matchedBranch: targetBranch,
        distanceKm: bestMatch.distanceKm,
        maxRadiusKm: bestMatch.maxRadiusKm,
        inside: bestMatch.inside,
        eligible,
        reason,
        serviceStatuses,
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 1) {
      setLoading(true);
      try {
        const res = await fetch('/api/maps/places-autocomplete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: query }),
        });
        const data = await res.json();
        if (data.success && data.provider === 'google-maps-api' && data.predictions?.length) {
          setSearchResults(data.predictions.map((p: any) => p.description));
          return;
        }

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=8`
        );
        const osmData = await response.json();
        if (Array.isArray(osmData) && osmData.length > 0) {
          setSearchResults(osmData.map((item: any) => item.display_name));
        } else if (data.success && data.predictions?.length) {
          setSearchResults(data.predictions.map((p: any) => p.description));
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
      } finally {
        setLoading(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSaveToProfile = async () => {
    if (!userProfile?.id || !selectedAddressToSave) return;

    setLoading(true);
    try {
      const userRef = doc(db, 'users', userProfile.id);
      await updateDoc(userRef, {
        addresses: arrayUnion({
          id: Date.now().toString(),
          type: addressType,
          fullAddress: selectedAddressToSave,
          createdAt: new Date().toISOString(),
        }),
      });
      setShowSaveAddressModal(false);
      alert('Address saved to your profile!');
    } catch (err) {
      console.error('Error saving address:', err);
      alert('Failed to save address.');
    } finally {
      setLoading(false);
    }
  };

  const savedAddresses = userProfile?.addresses || [];

  const recentLocations = [
    'Khammam, Telangana',
    'Wyra Road, Khammam 507001',
    'Kothagudem, Telangana 507101',
  ];

  const cityServiceStatus = [
    { name: 'Khammam', time: '10-25 mins', status: 'Super Fast' },
    { name: 'Wyra', time: '15-30 mins', status: 'Active Hub' },
    { name: 'Kothagudem', time: '20-35 mins', status: 'Available' },
    { name: 'Madhira', time: '20-40 mins', status: 'Available' },
  ];

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const resolvedAddress = await reverseGeocodeCoords(latitude, longitude);
          await evaluateCandidateLocation(resolvedAddress, { lat: latitude, lng: longitude }, 'gps');
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          await evaluateCandidateLocation(
            `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            { lat: latitude, lng: longitude },
            'gps'
          );
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMsg = 'Unable to retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Location access denied. Please enable GPS permissions or search manually below.';
        }
        alert(errorMsg);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
    );
  };

  return (
    <div className="h-full w-full bg-white flex flex-col p-6 pt-12 overflow-hidden scrollbar-hide">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-black text-gray-900 italic tracking-tighter">Delivery Location</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            GPS auto-detect or manual override with boundary check
          </p>
        </div>
        <div className="w-10 h-10 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-100">
          <MapPin className="w-5 h-5 text-gray-900" />
        </div>
      </div>

      {/* Search + Quick Validate Manual Address Bar */}
      <div className="relative mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search street, pincode, village, city..."
            className="w-full bg-gray-50 py-4 pl-11 pr-4 rounded-[1.8rem] font-black italic tracking-tight outline-none border-2 border-transparent focus:border-yellow-400 transition-all shadow-sm text-xs text-gray-900"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        {searchQuery.trim().length > 2 && (
          <button
            type="button"
            onClick={() => evaluateCandidateLocation(searchQuery, null, 'manual')}
            disabled={validating}
            className="px-4 rounded-[1.8rem] bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider shrink-0 cursor-pointer active:scale-95 transition-all"
          >
            Check Area
          </button>
        )}
      </div>

      {/* Geofence Validation Card (Required before proceeding on selection) */}
      {(validating || candidate) && (
        <div
          className={`mb-4 p-4 rounded-3xl border-2 transition-all shrink-0 ${
            validating
              ? 'bg-slate-50 border-slate-200'
              : candidate?.eligible
              ? 'bg-emerald-50 border-emerald-300'
              : 'bg-rose-50 border-rose-300'
          }`}
        >
          {validating ? (
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-indigo-600 animate-spin" />
              <div>
                <p className="text-xs font-black text-slate-900 uppercase">Validating Service Boundaries...</p>
                <p className="text-[10px] font-bold text-slate-500">Checking branch geofence & per-service radii</p>
              </div>
            </div>
          ) : (
            candidate && (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    {candidate.eligible ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          candidate.eligible ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {candidate.eligible ? 'Serviceable Boundary Verified' : 'Outside Active Service Radius'}
                      </span>
                      <p className="text-xs font-black text-slate-900 mt-1 line-clamp-2">{candidate.address}</p>
                      <p className="text-[10px] font-bold text-slate-600 mt-0.5">
                        Nearest Hub: <span className="text-slate-900">{candidate.matchedBranch?.name || 'HQ'}</span> •{' '}
                        {candidate.coords ? `${candidate.distanceKm} km away` : 'Unresolved GPS'} (Max{' '}
                        {candidate.maxRadiusKm} km)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCandidate(null)}
                    className="p-1 rounded-full hover:bg-black/5 text-slate-400"
                    title="Dismiss check"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {candidate.reason && (
                  <p className="text-[11px] font-bold text-rose-800 bg-white/80 p-2.5 rounded-2xl border border-rose-200 leading-snug">
                    {candidate.reason}
                  </p>
                )}

                {candidate.serviceStatuses.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.serviceStatuses.map((s) => (
                      <span
                        key={s.id}
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${
                          s.eligible
                            ? 'bg-white text-emerald-700 border-emerald-200'
                            : 'bg-white/60 text-rose-600 border-rose-200'
                        }`}
                      >
                        {s.eligible ? '✓' : '✕'} {s.name} ({s.radiusKm}km)
                      </span>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  disabled={!candidate.eligible}
                  onClick={() => {
                    if (!candidate.eligible) return;
                    onSelect(
                      candidate.address,
                      candidate.coords,
                      candidate.source,
                      candidate.matchedBranch?.id
                    );
                  }}
                  className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    candidate.eligible
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg cursor-pointer active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {candidate.eligible ? (
                    <>
                      <span>Confirm Eligible Location & Proceed</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <span>Cannot Proceed — Select Address Inside Service Boundary</span>
                  )}
                </button>
              </div>
            )
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-6 scrollbar-hide">
        <section>
          <button
            id="btn-use-current-location"
            onClick={handleGetCurrentLocation}
            disabled={loading}
            className="w-full flex items-center gap-4 p-4 rounded-[2rem] bg-gray-900 text-white font-black uppercase tracking-wider text-xs active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-gray-200 group cursor-pointer"
          >
            <div
              className={`p-2.5 rounded-2xl ${loading ? 'bg-indigo-500' : 'bg-yellow-400'} group-hover:rotate-12 transition-transform`}
            >
              <Navigation
                className={`w-5 h-5 ${loading ? 'text-white' : 'text-gray-900'} fill-current ${loading ? 'animate-pulse' : ''}`}
              />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs">{loading ? 'Detecting Live GPS...' : 'Use Current Live Location'}</span>
              {!loading && <span className="text-[8px] opacity-60">Auto GPS + Active Boundary Check</span>}
            </div>
          </button>
        </section>

        {/* Nearby Branches & Operational Status Section */}
        <section className="bg-slate-50/50 p-4 rounded-[2rem] border border-gray-100">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Building className="w-4 h-4 text-indigo-600" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">
              Active Branches & Service Radii
            </h3>
            <span className="ml-auto flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          {scoredBranchesList.length === 0 ? (
            <div className="text-center py-6">
              <Activity className="w-5 h-5 text-indigo-500 animate-spin mx-auto mb-2" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">
                Searching regional branches...
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {scoredBranchesList.map((branch) => {
                const isMatch = branch.matchScore > 0;
                const isOpen = branch.status !== 'Offline';
                const bCoords = getBranchCoordinates(branch);
                const radiusKm = branch.deliveryRadius || 5;

                return (
                  <div
                    key={branch.id}
                    onClick={() => {
                      const targetLoc = branch.location || `${branch.name}, ${branch.city || ''}`;
                      evaluateCandidateLocation(targetLoc, bCoords, 'manual', branch);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all text-left group cursor-pointer ${
                      isMatch
                        ? 'bg-white border-indigo-200 shadow-sm hover:border-indigo-400'
                        : 'bg-white/80 border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-black text-xs text-gray-950 truncate tracking-tight">{branch.name}</h4>
                          <span className="text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md">
                            {radiusKm} km radius
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate mt-0.5">
                          {branch.city || 'HQ'}, {branch.district || 'Lokal'}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {isOpen ? (
                          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                            <span className="text-[9px] font-black uppercase tracking-wider">Open</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 inline-block" />
                            <span className="text-[9px] font-black uppercase tracking-wider">Offline</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {searchResults.length > 0 ? (
          <section className="animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-3 bg-indigo-50 inline-block px-4 py-1.5 rounded-full">
              Search Results (Tap to Validate Boundary)
            </h3>
            <div className="space-y-2.5">
              {searchResults.map((loc, i) => (
                <div key={i} className="flex gap-2">
                  <button
                    id={`btn-search-result-${i}`}
                    onClick={() => evaluateCandidateLocation(loc, null, 'manual')}
                    className="flex-1 flex items-center gap-3 p-3.5 bg-white border border-gray-100 hover:border-yellow-400 hover:bg-yellow-50/50 rounded-2xl transition-all text-left group cursor-pointer"
                  >
                    <div className="bg-gray-50 p-2.5 rounded-xl group-hover:bg-white transition-colors border border-gray-50 shadow-sm">
                      <MapPin className="w-4 h-4 text-gray-400 group-hover:text-yellow-600" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-black text-xs text-gray-900 truncate italic">{loc.split(',')[0]}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">
                        {loc.split(',').slice(1).join(',').trim()}
                      </p>
                    </div>
                  </button>
                  {userProfile && (
                    <button
                      onClick={() => {
                        setSelectedAddressToSave(loc);
                        setShowSaveAddressModal(true);
                      }}
                      className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : (
          <>
            {savedAddresses && savedAddresses.length > 0 && (
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 pl-2">
                  Saved Addresses
                </h3>
                <div className="space-y-2.5">
                  {savedAddresses.map((addr: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => evaluateCandidateLocation(addr.fullAddress, null, 'manual')}
                      className="w-full flex items-start gap-3 p-3.5 hover:bg-gray-50 rounded-2xl transition-all text-left group border border-gray-100 cursor-pointer"
                    >
                      <div className="bg-gray-100 p-2.5 rounded-xl group-hover:bg-yellow-100 transition-colors">
                        <MapPin className="w-4 h-4 text-gray-500 group-hover:text-yellow-600" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-black text-xs text-gray-900 italic tracking-tight">{addr.type || 'Other'}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">
                          {addr.fullAddress}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 pl-2">
                Serviceable Hubs
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {cityServiceStatus.map((city, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white transition-colors group cursor-pointer"
                    onClick={() => handleSearch(city.name)}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div>
                        <p className="text-xs font-black text-gray-900">{city.name}</p>
                        <p className="text-[9px] font-bold uppercase text-indigo-600">{city.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="pb-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 pl-2">
                Quick Select Regions
              </h3>
              <div className="space-y-2">
                {recentLocations.map((loc, i) => (
                  <button
                    key={i}
                    onClick={() => evaluateCandidateLocation(loc, null, 'manual')}
                    className="w-full flex items-center gap-3 p-3.5 bg-gray-50/70 hover:bg-gray-100 rounded-2xl transition-all text-left text-gray-600 font-bold group cursor-pointer"
                  >
                    <Clock className="w-4 h-4 opacity-40" />
                    <span className="text-[11px] uppercase tracking-wider font-black">{loc}</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {activeLocation && activeLocation !== 'Select Location' && (
        <div className="pt-3 border-t border-gray-100 flex items-center justify-center">
          <button
            onClick={() => onSelect('')}
            className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-rose-500 transition-colors py-2 px-6 cursor-pointer"
          >
            Keep Current Location & Return
          </button>
        </div>
      )}

      {/* Save Address Modal */}
      {showSaveAddressModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-gray-900 italic tracking-tighter">Save Address</h3>
              <button onClick={() => setShowSaveAddressModal(false)} className="p-2 bg-gray-100 rounded-xl">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Address Preview</p>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-600 leading-relaxed italic">{selectedAddressToSave}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Select Label</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Home', icon: Home },
                  { id: 'Work', icon: Briefcase },
                  { id: 'Other', icon: MapPin },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setAddressType(type.id as any)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      addressType === type.id
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                        : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-100'
                    }`}
                  >
                    <type.icon className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase">{type.id}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveToProfile}
              disabled={loading}
              className="w-full py-4 bg-gray-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save for Future Orders'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
