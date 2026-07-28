import React, { useState, useEffect } from 'react';
import { MapPin, Search, Navigation, Clock, Star, Save, Home, Briefcase, Plus, X, Building, Activity, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, collection, onSnapshot } from 'firebase/firestore';

interface LocationSelectionProps {
  onSelect: (location: string) => void;
  userProfile?: any;
  currentLocation?: string;
}

export default function LocationSelection({ onSelect, userProfile, currentLocation: propCurrentLocation }: LocationSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showSaveAddressModal, setShowSaveAddressModal] = useState(false);
  const [selectedAddressToSave, setSelectedAddressToSave] = useState('');
  const [addressType, setAddressType] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [branches, setBranches] = useState<any[]>([]);
  
  const activeLocation = propCurrentLocation || localStorage.getItem('lokal_user_location') || '';

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'branches'), (snap) => {
      const bList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBranches(bList);
    }, (err) => {
      console.warn("Failed to subscribe to branches in LocationSelection (likely quota hit). Using default branch.");
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
          adminName: 'Tharun Bandi',
          contactPhone: '8790729816',
          vendorsCount: 15,
          ordersCount: 120,
          revenue: 45000,
          profitShare: 10
        }
      ]);
    });
    return () => unsub();
  }, []);

  // Score-based matching logic for branches based on a location reference
  const getBranchScore = (b: any, refLocation: string) => {
    if (!refLocation || refLocation === 'Select Location') return 0;
    const lowerLoc = refLocation.toLowerCase();
    const pincodeMatch = refLocation.match(/\d{6}/);
    const pincode = pincodeMatch ? pincodeMatch[0] : null;

    let score = 0;
    const branchName = (b.name || '').toLowerCase();
    const branchLoc = (b.location || '').toLowerCase();
    const branchCity = (b.city || '').toLowerCase();
    const branchDistrict = (b.district || '').toLowerCase();

    // Highest Priority: Pincode match
    if (pincode && b.pincodes?.includes(pincode)) score += 100;

    // High Priority: Exact location/name match
    if (lowerLoc === branchLoc || lowerLoc === branchName) score += 80;
    else if (lowerLoc.includes(branchLoc) || lowerLoc.includes(branchName)) score += 50;

    // Medium Priority: City/District match
    if (branchCity && lowerLoc.includes(branchCity)) score += 30;
    if (branchDistrict && lowerLoc.includes(branchDistrict)) score += 20;

    // Bonus: Reverse inclusion
    if (branchLoc.includes(lowerLoc) || branchName.includes(lowerLoc)) score += 40;

    return score;
  };

  const referenceLocation = searchQuery && searchQuery.length > 2 ? searchQuery : activeLocation;

  const scoredBranchesList = React.useMemo(() => {
    if (!branches || branches.length === 0) return [];
    return branches.map(b => {
      const score = getBranchScore(b, referenceLocation);
      return { ...b, matchScore: score };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [branches, referenceLocation]);

  // Simulation of a large Indian location database
  const indianLocations = [
    'Khammam, Telangana',
    'Indiranagar, Bangalore, Karnataka',
    'Hitech City, Hyderabad, Telangana',
    'Madhapur, Hyderabad, Telangana',
    'Gachibowli, Hyderabad, Telangana',
    'Bandra West, Mumbai, Maharashtra'
  ];

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      setLoading(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=8`);
        const data = await response.json();
        setSearchResults(data.map((item: any) => item.display_name));
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
          createdAt: new Date().toISOString()
        })
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
    'Indiranagar, Bangalore, Karnataka',
    'Powai, Mumbai, Maharashtra'
  ];

  const cityServiceStatus = [
    { name: 'Khammam', time: '10-25 mins', status: 'Super Fast' },
    { name: 'Hyderabad', time: '15-30 mins', status: 'High Demand' },
    { name: 'Bangalore', time: '20-40 mins', status: 'Available' },
    { name: 'Vijayawada', time: '30-50 mins', status: 'Limited' }
  ];

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en'
              }
            }
          );
          const data = await response.json();
          
          if (data && data.display_name) {
            onSelect(data.display_name);
          } else {
            onSelect(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          onSelect(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        let errorMsg = "Unable to retrieve your location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location access denied. Please enable it in settings.";
        }
        alert(errorMsg);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  return (
    <div className="h-full w-full bg-white flex flex-col p-6 pt-12 overflow-hidden scrollbar-hide">
      <div className="flex items-center justify-between mb-6">
        <div>
           <h2 className="text-2xl font-black text-gray-900 italic tracking-tighter">Delivery Location</h2>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select where you want your order</p>
        </div>
        <div className="w-10 h-10 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-100">
          <MapPin className="w-5 h-5 text-gray-900" />
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search for village, city, state..."
          className="w-full bg-gray-50 py-5 pl-14 pr-4 rounded-[2rem] font-black italic tracking-tight outline-none border-2 border-transparent focus:border-yellow-400 transition-all shadow-sm text-gray-900"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-8 scrollbar-hide">
        <section>
          <button
            id="btn-use-current-location"
            onClick={handleGetCurrentLocation}
            disabled={loading}
            className="w-full flex items-center gap-4 p-5 rounded-[2.5rem] bg-gray-900 text-white font-black uppercase tracking-wider text-xs active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-gray-200 group"
          >
            <div className={`p-2.5 rounded-2xl ${loading ? 'bg-indigo-500' : 'bg-yellow-400'} group-hover:rotate-12 transition-transform`}>
              <Navigation className={`w-5 h-5 ${loading ? 'text-white' : 'text-gray-900'} fill-current ${loading ? 'animate-pulse' : ''}`} />
            </div>
            <div className="flex flex-col items-start translate-y-[-1px]">
               <span className="text-xs">{loading ? 'Locating device...' : 'Use Current Live Location'}</span>
               {!loading && <span className="text-[8px] opacity-60">High Precision GPS</span>}
            </div>
          </button>
        </section>

        {/* Nearby Branches & Operational Status Section */}
        <section className="bg-slate-50/50 p-5 rounded-[2.5rem] border border-gray-100">
          <div className="flex items-center gap-2 mb-4 px-1">
            <Building className="w-4 h-4 text-indigo-600" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Nearby Branches & Status</h3>
            <span className="ml-auto flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          {scoredBranchesList.length === 0 ? (
            <div className="text-center py-6">
              <Activity className="w-5 h-5 text-indigo-500 animate-spin mx-auto mb-2" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Searching regional branches...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scoredBranchesList.map((branch) => {
                const isMatch = branch.matchScore > 0;
                const isOpen = branch.status === 'Active';
                
                return (
                  <div
                    key={branch.id}
                    onClick={() => {
                      const targetLoc = branch.location || `${branch.name}, ${branch.city || ''}`;
                      onSelect(targetLoc);
                      localStorage.setItem('lokal_branch_id', branch.id);
                    }}
                    className={`p-4 rounded-[2rem] border transition-all text-left group cursor-pointer ${
                      isMatch 
                        ? 'bg-white border-indigo-100 shadow-sm hover:border-indigo-400' 
                        : 'bg-white/80 border-gray-100 hover:border-gray-200 opacity-90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-black text-xs text-gray-950 truncate tracking-tight">{branch.name}</h4>
                          {isMatch && (
                            <span className="text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md">
                              Serving Area
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate mb-2">
                          {branch.city || 'HQ'}, {branch.district || 'Lokal'}
                        </p>
                        
                        {branch.pincodes && branch.pincodes.length > 0 && (
                          <p className="text-[8px] font-bold text-gray-400 bg-gray-50/50 inline-block px-2 py-0.5 rounded-lg border border-gray-100 italic">
                            Pins: {branch.pincodes.slice(0, 3).join(', ')}{branch.pincodes.length > 3 ? '...' : ''}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {isOpen ? (
                          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                            <span className="text-[9px] font-black uppercase tracking-wider">Open</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full border border-rose-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 inline-block" />
                            <span className="text-[9px] font-black uppercase tracking-wider">Offline</span>
                          </div>
                        )}
                        <span className="text-[9px] font-bold text-gray-400 leading-none">
                          {isOpen ? 'Super Fast Delivery' : 'Maintenance'}
                        </span>
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
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4 bg-indigo-50 inline-block px-4 py-1.5 rounded-full">Search Results</h3>
            <div className="space-y-3">
              {searchResults.map((loc, i) => (
                <div key={i} className="flex gap-2">
                  <button
                    id={`btn-search-result-${i}`}
                    onClick={() => onSelect(loc)}
                    className="flex-1 flex items-center gap-4 p-4 bg-white border border-gray-100 hover:border-yellow-400 hover:bg-yellow-50/50 rounded-[2rem] transition-all text-left group"
                  >
                    <div className="bg-gray-50 p-3 rounded-2xl group-hover:bg-white transition-colors border border-gray-50 group-hover:border-yellow-100 shadow-sm">
                      <MapPin className="w-5 h-5 text-gray-400 group-hover:text-yellow-600" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-black text-gray-900 truncate italic">{loc.split(',')[0]}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">{loc.split(',').slice(1).join(',').trim()}</p>
                    </div>
                  </button>
                  {userProfile && (
                     <button 
                       onClick={() => {
                         setSelectedAddressToSave(loc);
                         setShowSaveAddressModal(true);
                       }}
                       className="p-4 bg-indigo-50 text-indigo-600 rounded-[2rem] hover:bg-indigo-100 transition-colors"
                     >
                       <Save className="w-5 h-5" />
                     </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : (
          <>
            {(savedAddresses && savedAddresses.length > 0) && (
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 pl-2">Saved Addresses</h3>
                <div className="space-y-3">
                  {savedAddresses.map((addr: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => onSelect(addr.fullAddress)}
                      className="w-full flex items-start gap-4 p-4 hover:bg-gray-50 rounded-[2rem] transition-all text-left group border border-transparent hover:border-gray-100"
                    >
                      <div className="bg-gray-100 p-3 rounded-2xl group-hover:bg-yellow-100 transition-colors">
                        <MapPin className="w-5 h-5 text-gray-500 group-hover:text-yellow-600" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-black text-gray-900 italic tracking-tight">{addr.type || 'Other'}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">{addr.fullAddress}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 pl-2">Popular Serviceable Areas</h3>
              <div className="grid grid-cols-1 gap-3">
                {cityServiceStatus.map((city, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-[2rem] border border-gray-100/50 hover:bg-white transition-colors group cursor-pointer" onClick={() => handleSearch(city.name)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-gray-100 shadow-sm group-hover:bg-indigo-50 transition-colors">
                        <MapPin className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 italic tracking-tight">{city.name}</p>
                        <div className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider flex items-center gap-1">
                           <div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse" />
                           {city.status}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-black text-gray-900 tracking-tight">{city.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="pb-10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 pl-2">Recent Discoveries</h3>
              <div className="space-y-3">
                {recentLocations.map((loc, i) => (
                  <button
                    key={i}
                    onClick={() => onSelect(loc)}
                    className="w-full flex items-center gap-4 p-4 bg-gray-50/50 hover:bg-gray-100 rounded-[2.5rem] transition-all text-left text-gray-500 font-bold group"
                  >
                    <Clock className="w-5 h-5 opacity-30 group-hover:opacity-60 transition-opacity" />
                    <span className="text-[11px] uppercase tracking-wider font-black">{loc}</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
      
      <div className="pt-4 border-t border-gray-50 flex items-center justify-center">
         <button 
           onClick={() => onSelect('')}
           className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-rose-500 transition-colors py-2 px-6"
         >
           Cancel & Continue
         </button>
      </div>

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
                     { id: 'Other', icon: MapPin }
                   ].map(type => (
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
