import React, { useState } from 'react';
import { MapPin, Search, Navigation, Clock } from 'lucide-react';

interface LocationSelectionProps {
  onSelect: (location: string) => void;
}

export default function LocationSelection({ onSelect }: LocationSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);

  // Simulation of a large Indian location database
  const indianLocations = [
    'Hitech City, Hyderabad, Telangana',
    'Gachibowli, Hyderabad, Telangana',
    'Indiranagar, Bangalore, Karnataka',
    'Koramangala, Bangalore, Karnataka',
    'Powai, Mumbai, Maharashtra',
    'Bandra West, Mumbai, Maharashtra',
    'Chandni Chowk, New Delhi, Delhi',
    'Hauz Khas, New Delhi, Delhi',
    'Salt Lake, Kolkata, West Bengal',
    'Park Street, Kolkata, West Bengal',
    'Adyar, Chennai, Tamil Nadu',
    'T. Nagar, Chennai, Tamil Nadu',
    'Banjara Hills, Hyderabad, Telangana',
    'Jubilee Hills, Hyderabad, Telangana',
    'Kukatpally, Hyderabad, Telangana',
    'Madhapur, Hyderabad, Telangana',
    'Secunderabad, Telangana',
    'Warangal, Telangana',
    'Nizamabad, Telangana',
    'Karimnagar, Telangana',
    'Khammam, Telangana',
    'Ramagundam, Telangana',
    'Mahbubnagar, Telangana',
    'Nalgonda, Telangana',
    'Adilabad, Telangana',
    'Suryapet, Telangana',
    'Siddipet, Telangana',
    'Miryalaguda, Telangana',
    'Jagtial, Telangana',
    'Mancherial, Telangana',
    'Kothagudem, Telangana',
    'Kamareddy, Telangana',
    'Sangareddy, Telangana',
    'Bodhan, Telangana',
    'Vikarabad, Telangana',
    'Wanaparthy, Telangana',
    'Gadwal, Telangana',
    'Medak, Telangana',
    'Gudivada, Andhra Pradesh',
    'Tirupati, Andhra Pradesh',
    'Vijayawada, Andhra Pradesh',
    'Visakhapatnam, Andhra Pradesh',
    'Guntur, Andhra Pradesh',
    'Nellore, Andhra Pradesh',
    'Kurnool, Andhra Pradesh',
    'Rajahmundry, Andhra Pradesh',
    'Kakinada, Andhra Pradesh',
    'Kadapa, Andhra Pradesh',
    'Anantapur, Andhra Pradesh',
    'Vizianagaram, Andhra Pradesh',
    'Eluru, Andhra Pradesh',
    'Ongole, Andhra Pradesh',
    'Nandyal, Andhra Pradesh',
    'Machilipatnam, Andhra Pradesh',
    'Adoni, Andhra Pradesh',
    'Tenali, Andhra Pradesh',
    'Chittoor, Andhra Pradesh',
    'Hindupur, Andhra Pradesh',
    'Proddatur, Andhra Pradesh',
    'Bhimavaram, Andhra Pradesh',
    'Madanapalle, Andhra Pradesh',
    'Guntakal, Andhra Pradesh',
    'Dharmavaram, Andhra Pradesh',
    'Gudur, Andhra Pradesh',
    'Srikakulam, Andhra Pradesh',
    'Narasaraopet, Andhra Pradesh',
    'Rajampet, Andhra Pradesh',
    'Tadpatri, Andhra Pradesh',
    'Tadepalligudem, Andhra Pradesh',
    'Chilakaluripet, Andhra Pradesh',
    'Agra, Uttar Pradesh',
    'Aligarh, Uttar Pradesh',
    'Allahabad, Uttar Pradesh',
    'Ambedkar Nagar, Uttar Pradesh',
    'Amethi, Uttar Pradesh',
    'Amroha, Uttar Pradesh',
    'Auraiya, Uttar Pradesh',
    'Azamgarh, Uttar Pradesh',
    'Baghpat, Uttar Pradesh',
    'Bahraich, Uttar Pradesh',
    'Ballia, Uttar Pradesh',
    'Balrampur, Uttar Pradesh',
    'Banda, Uttar Pradesh',
    'Barabanki, Uttar Pradesh',
    'Bareilly, Uttar Pradesh',
    'Basti, Uttar Pradesh',
    'Bhadohi, Uttar Pradesh',
    'Bijnor, Uttar Pradesh',
    'Budaun, Uttar Pradesh',
    'Bulandshahr, Uttar Pradesh',
    'Chandauli, Uttar Pradesh',
    'Chitrakoot, Uttar Pradesh',
    'Deoria, Uttar Pradesh',
    'Etah, Uttar Pradesh',
    'Etawah, Uttar Pradesh',
    'Faizabad, Uttar Pradesh',
    'Farrukhabad, Uttar Pradesh',
    'Fatehpur, Uttar Pradesh',
    'Firozabad, Uttar Pradesh',
    'Gautam Buddha Nagar, Uttar Pradesh',
    'Ghaziabad, Uttar Pradesh',
    'Ghazipur, Uttar Pradesh',
    'Gonda, Uttar Pradesh',
    'Gorakhpur, Uttar Pradesh',
    'Hamirpur, Uttar Pradesh',
    'Hapur, Uttar Pradesh',
    'Hardoi, Uttar Pradesh',
    'Hathras, Uttar Pradesh',
    'Jalaun, Uttar Pradesh',
    'Jaunpur, Uttar Pradesh',
    'Jhansi, Uttar Pradesh',
    'Kannauj, Uttar Pradesh',
    'Kanpur Dehat, Uttar Pradesh',
    'Kanpur Nagar, Uttar Pradesh',
    'Kasganj, Uttar Pradesh',
    'Kaushambi, Uttar Pradesh',
    'Kheri, Uttar Pradesh',
    'Kushinagar, Uttar Pradesh',
    'Lalitpur, Uttar Pradesh',
    'Lucknow, Uttar Pradesh',
    'Maharajganj, Uttar Pradesh',
    'Mahoba, Uttar Pradesh',
    'Mainpuri, Uttar Pradesh',
    'Mathura, Uttar Pradesh',
    'Mau, Uttar Pradesh',
    'Meerut, Uttar Pradesh',
    'Mirzapur, Uttar Pradesh',
    'Moradabad, Uttar Pradesh',
    'Muzaffarnagar, Uttar Pradesh',
    'Pilibhit, Uttar Pradesh',
    'Pratapgarh, Uttar Pradesh',
    'RaeBareli, Uttar Pradesh',
    'Rampur, Uttar Pradesh',
    'Saharanpur, Uttar Pradesh',
    'Sambhal, Uttar Pradesh',
    'Sant Kabir Nagar, Uttar Pradesh',
    'Shahjahanpur, Uttar Pradesh',
    'Shamli, Uttar Pradesh',
    'Shravasti, Uttar Pradesh',
    'Siddharthnagar, Uttar Pradesh',
    'Sitapur, Uttar Pradesh',
    'Sonbhadra, Uttar Pradesh',
    'Sultanpur, Uttar Pradesh',
    'Unnao, Uttar Pradesh',
    'Varanasi, Uttar Pradesh'
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 1) {
      const filtered = indianLocations.filter(loc => 
        loc.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8); // Limit results for UI
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  const savedAddresses = [
    { id: 1, type: 'Home', address: 'B-402, Sunshine Apartments, Noida, UP' },
    { id: 2, type: 'Work', address: 'Level 5, Tower A, Cyber City, Gurgaon, Haryana' },
  ];

  const recentLocations = [
    'Indiranagar, Bangalore, Karnataka',
    'Powai, Mumbai, Maharashtra',
    'Chandni Chowk, Delhi'
  ];

  const cityServiceStatus = [
    { name: 'Hyderabad', time: '15-30 mins', status: 'High Demand' },
    { name: 'Bangalore', time: '20-40 mins', status: 'Available' },
    { name: 'Khammam', time: '10-25 mins', status: 'Super Fast' },
    { name: 'Warangal', time: '25-45 mins', status: 'Available' },
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
          // Using Nominatim (OpenStreetMap) for free reverse geocoding
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
          // Fallback to coordinates if API fails
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
    <div className="h-full w-full bg-white flex flex-col p-6 pt-12 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-900 italic tracking-tighter">Where should we deliver?</h2>
        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
          <MapPin className="w-4 h-4 text-gray-900" />
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search for village, city, state..."
          className="w-full bg-gray-50 py-4 pl-12 pr-4 rounded-3xl font-black italic tracking-tight outline-none border-2 border-transparent focus:border-yellow-400 transition-all shadow-sm"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-8 scrollbar-hide">
        <button
          id="btn-use-current-location"
          onClick={handleGetCurrentLocation}
          disabled={loading}
          className="w-full flex items-center gap-4 p-5 rounded-[2.5rem] bg-gray-900 text-white font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-gray-200"
        >
          <div className={`p-2 rounded-2xl ${loading ? 'bg-indigo-500' : 'bg-yellow-400'}`}>
            <Navigation className={`w-5 h-5 ${loading ? 'text-white' : 'text-gray-900'} fill-current ${loading ? 'animate-pulse' : ''}`} />
          </div>
          <span>{loading ? 'Locating device...' : 'Use Current Live Location'}</span>
        </button>

        {searchResults.length > 0 ? (
          <section className="animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4 bg-indigo-50 inline-block px-3 py-1 rounded-full">Search Results</h3>
            <div className="space-y-4">
              {searchResults.map((loc, i) => (
                <button
                  key={i}
                  id={`btn-search-result-${i}`}
                  onClick={() => onSelect(loc)}
                  className="w-full flex items-center gap-4 p-4 bg-white border border-gray-100 hover:border-yellow-400 hover:bg-yellow-50/50 rounded-[2rem] transition-all text-left group"
                >
                  <div className="bg-gray-50 p-3 rounded-2xl group-hover:bg-white transition-colors border border-gray-50 group-hover:border-yellow-100">
                    <MapPin className="w-5 h-5 text-gray-400 group-hover:text-yellow-600" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-black text-gray-900 truncate italic">{loc.split(',')[0]}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">{loc.split(',').slice(1).join(',').trim()}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <>
            <section>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 pl-2">Saved Addresses</h3>
              <div className="space-y-4">
                {savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => onSelect(addr.address)}
                    className="w-full flex items-start gap-4 p-4 hover:bg-gray-50 rounded-[2rem] transition-all text-left group border border-transparent hover:border-gray-100"
                  >
                    <div className="bg-gray-100 p-3 rounded-2xl group-hover:bg-yellow-100 transition-colors">
                      <MapPin className="w-5 h-5 text-gray-500 group-hover:text-yellow-600" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-black text-gray-900 italic">{addr.type}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">{addr.address}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 pl-2">City Wise Delivery Times</h3>
              <div className="grid grid-cols-1 gap-3">
                {cityServiceStatus.map((city, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-[2rem] border border-gray-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                        <MapPin className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 italic tracking-tight">{city.name}</p>
                        <p className="text-[9px] font-black uppercase text-indigo-600 tracking-widest">{city.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-gray-100 shadow-sm">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[10px] font-black text-gray-900 tracking-tighter">{city.time}</span>
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
                    className="w-full flex items-center gap-4 p-4 bg-gray-50/50 hover:bg-gray-100 rounded-[2rem] transition-all text-left text-gray-500 font-bold group"
                  >
                    <Clock className="w-5 h-5 opacity-30 group-hover:opacity-50" />
                    <span className="text-[11px] uppercase tracking-wide">{loc}</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
