import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, Star, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { Service, Review } from '../types';
import ReviewsSection from './ReviewsSection';
import { validateServiceGeofence, getServiceOperationalRadiusKm } from '../lib/geofencing';

interface ServiceBookingProps {
  service: Service;
  onBack: () => void;
  onBook: (selectedDateText: string, selectedTimeSlotText: string) => void;
  isAdmin?: boolean;
  location: string;
  onUpdateLocation: (newLoc: string) => void;
  currentBranch?: any;
  coverageZones?: any[];
  userCoords?: { lat: number; lng: number } | null;
  onOpenLocationPicker?: () => void;
}

export default function ServiceBooking({ service, onBack, onBook, isAdmin = false, location, onUpdateLocation, currentBranch, coverageZones = [], userCoords, onOpenLocationPicker }: ServiceBookingProps) {
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState(-1);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editedAddress, setEditedAddress] = useState(location || '');

  const serviceRadiusKm = getServiceOperationalRadiusKm(currentBranch, service.category || 'services');
  const serviceGeo = userCoords
    ? validateServiceGeofence({
        lat: userCoords.lat,
        lng: userCoords.lng,
        branch: currentBranch,
        coverageZones,
        serviceId: service.category || 'services',
      })
    : null;
  const isBookingBlocked = Boolean(serviceGeo && !serviceGeo.eligible);

  useEffect(() => {
    setEditedAddress(location || '');
  }, [location]);
  const [localReviews, setLocalReviews] = useState<Review[]>(service.reviews || [
    { id: 'r1', userName: 'Kiran T.', rating: 5, comment: 'Very professional service. Highly recommended!', date: '3 days ago' },
    { id: 'r2', userName: 'Sneha L.', rating: 4, comment: 'Arrived on time and fixed the issue quickly. Good behavior.', date: '2 weeks ago' },
    { id: 'r3', userName: 'Amit P.', rating: 5, comment: 'Excellent work. Highly skilled professional.', date: '1 month ago' }
  ]);

  const handleAddReview = (rating: number, comment: string) => {
    const newReview: Review = {
      id: Math.random().toString(36).substr(2, 9),
      userName: 'You',
      rating,
      comment,
      date: 'Just now'
    };
    setLocalReviews([newReview, ...localReviews]);
  };

  const handleDeleteReview = (id: string) => {
    setLocalReviews(prev => prev.filter(r => r.id !== id));
  };

  const handleEditReview = (id: string, updatedComment: string, updatedRating: number) => {
    setLocalReviews(prev => prev.map(r => r.id === id ? { ...r, comment: updatedComment, rating: updatedRating } : r));
  };

  const generateDates = () => {
    const dates = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Show dates from today until 1 month (30 days) on calendar
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push({
        day: i === 0 ? 'Today' : days[d.getDay()],
        date: `${d.getDate()} ${months[d.getMonth()]}`,
        fullDate: d.toDateString()
      });
    }
    return dates;
  };

  const dates = generateDates();

  const getDayStatus = (dayIndex: number) => {
    if (dayIndex === 0) return 'limited';
    if (dayIndex % 2 === 0) return 'available';
    return 'crowded';
  };

  const getTimesForDate = (dateIndex: number) => {
    // 3-hour slots from 9:00 AM to 9:00 PM
    const baseTimes = [
      { time: '09:00 AM - 12:00 PM', startHour: 9, label: 'Morning Slot' },
      { time: '12:00 PM - 03:00 PM', startHour: 12, label: 'Noon Slot' },
      { time: '03:00 PM - 06:00 PM', startHour: 15, label: 'Afternoon Slot' },
      { time: '06:00 PM - 09:00 PM', startHour: 18, label: 'Evening Slot' },
    ];

    const now = new Date();
    // Use decimal hours for precise comparison (e.g. 2:30 PM is 14.5 hours)
    const currentTotalHours = now.getHours() + (now.getMinutes() / 60);

    return baseTimes.map((t, i) => {
      let isAvailable = true;
      let status: 'Available' | 'Full' | 'Limited' = 'Available';

      // Today (dateIndex === 0): Show slots after 2 hours at order time.
      if (dateIndex === 0) {
        if (t.startHour < currentTotalHours + 2) {
          isAvailable = false;
          status = 'Full';
        }
      }

      // Add default deterministic availability variation for other days
      if (isAvailable && dateIndex > 0) {
        const seed = dateIndex * 5 + i;
        const rand = (seed * 9301 + 49297) % 233280 / 233280;
        if (rand > 0.85) {
          status = 'Full';
          isAvailable = false;
        } else if (rand > 0.6) {
          status = 'Limited';
        }
      }

      return {
        time: t.time,
        label: t.label,
        status,
        available: isAvailable,
        startHour: t.startHour,
      };
    });
  };

  const currentTimes = getTimesForDate(selectedDate);
  const morningSlots = currentTimes.filter(t => t.time.includes('09:00 AM'));
  const afternoonSlots = currentTimes.filter(t => t.time.includes('12:00 PM') || t.time.includes('03:00 PM'));
  const eveningSlots = currentTimes.filter(t => t.time.includes('06:00 PM'));

  const SlotList = ({ slots, title }: { slots: typeof currentTimes, title: string }) => (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4 ml-1">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">{title}</h4>
        <div className="h-px flex-1 bg-gray-100"></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {slots.map((t) => {
          const globalIndex = currentTimes.findIndex(item => item.time === t.time);
          const isSelected = selectedTime === globalIndex;
          
          return (
            <button
              key={t.time}
              disabled={!t.available}
              onClick={() => setSelectedTime(globalIndex)}
              className={`flex flex-col p-4 rounded-[2rem] border-2 transition-all relative group overflow-hidden ${
                isSelected 
                ? 'bg-gray-900 border-gray-900 text-white shadow-xl shadow-gray-200 active:scale-95' 
                : !t.available
                ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed grayscale'
                : 'bg-white border-gray-100 text-gray-600 hover:border-yellow-200 active:scale-95'
              }`}
            >
              <div className="flex justify-between items-center mb-1 w-full">
                <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${isSelected ? 'text-white/60' : !t.available ? 'text-gray-300' : 'text-gray-400'}`}>
                  {t.label}
                </span>
                {t.status === 'Limited' && (
                  <span className={`text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${isSelected ? 'bg-white/20 text-white' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>Limited</span>
                )}
                {t.status === 'Full' && (
                  <span className="text-[7px] font-black bg-rose-50 text-rose-500 border border-rose-100 px-2 py-0.5 rounded-full uppercase tracking-tighter">Full</span>
                )}
              </div>
              <span className="text-base font-black">{t.time}</span>
              
              {!t.available && (
                <div className="absolute inset-0 bg-white/40 flex items-center justify-center backdrop-blur-[1px]">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest rotate-[-15deg] border-2 border-gray-200 px-2 rounded-lg">Reserved</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="h-full w-full bg-white flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="relative h-48 shrink-0">
        {service.image && <img src={service.image} className="w-full h-full object-cover" alt={service.name} />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute top-0 inset-x-0 p-6 pt-12 flex items-center justify-between">
          <button onClick={onBack} className="p-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1 bg-yellow-400 px-3 py-1 rounded-xl shadow-lg shadow-yellow-400/20">
              <Star className="w-3.5 h-3.5 text-gray-900 fill-gray-900" />
              <span className="text-xs font-black text-gray-900">
                {localReviews.length > 0 
                  ? (localReviews.reduce((acc, r) => acc + r.rating, 0) / localReviews.length).toFixed(1)
                  : 'New'}
              </span>
            </div>
            <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">•</span>
            <span className="text-white font-black text-[10px] uppercase tracking-widest">{localReviews.length} Reviews</span>
            <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">•</span>
            <span className="text-white font-black text-[10px] uppercase tracking-widest">{service.bookings || '500'}+ Bookings</span>
          </div>
          <h2 className="text-3xl font-black text-white leading-tight">{service.name}</h2>
        </div>
      </div>

      <div className="flex-1 px-6 py-8 space-y-8 pb-32">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-gray-900">Select Date</h3>
            <Calendar className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {dates.map((d, i) => (
              <button
                key={i}
                onClick={() => setSelectedDate(i)}
                className={`min-w-[80px] flex flex-col items-center p-4 rounded-3xl border-2 transition-all active:scale-95 ${
                  selectedDate === i 
                  ? 'bg-yellow-400 border-yellow-400 shadow-lg shadow-yellow-100' 
                  : 'bg-white border-gray-100'
                }`}
              >
                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${selectedDate === i ? 'text-gray-900/60' : 'text-gray-400'}`}>
                  {d.day}
                </span>
                <span className={`text-sm font-black whitespace-nowrap ${selectedDate === i ? 'text-gray-900' : 'text-gray-900'}`}>{d.date}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-[2rem] flex items-start gap-3.5 shadow-sm">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-[10px] font-black uppercase text-amber-800 tracking-widest leading-none">Booking Policy & Assurance</h4>
            <p className="text-xs text-amber-800/80 font-bold leading-relaxed">
              If our service partner is not available today, your booking will be prioritized and automatically confirmed for <span className="font-extrabold text-amber-900 border-b border-amber-300">tomorrow morning (9:00 AM)</span>. They will complete your requests directly. Thank you for your patience!
            </p>
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-gray-900">Available Slots</h3>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          <SlotList slots={morningSlots} title="Morning" />
          <SlotList slots={afternoonSlots} title="Afternoon" />
          <SlotList slots={eveningSlots} title="Evening" />
        </section>

        <section className="bg-gray-50 border-2 border-gray-100 p-6 rounded-[2.5rem] relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-black text-gray-900 mb-1">Service Location</h3>
              {!isEditingAddress && (
                <button 
                  type="button"
                  onClick={() => {
                    setEditedAddress(location || '');
                    setIsEditingAddress(true);
                  }}
                  className="text-yellow-650 text-[10px] font-black uppercase tracking-widest bg-yellow-100 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-yellow-200 transition-colors"
                >
                  Change
                </button>
              )}
            </div>
            {isEditingAddress ? (
              <div className="space-y-3">
                <textarea
                  value={editedAddress}
                  onChange={(e) => setEditedAddress(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-sans min-h-[60px]"
                  placeholder="Enter complete building name, plot, sector or street..."
                />
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      if (editedAddress.trim() === '') return;
                      onUpdateLocation?.(editedAddress);
                      setIsEditingAddress(false);
                    }}
                    className="py-2 px-4 bg-yellow-400 text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer hover:bg-yellow-500"
                  >
                    Save
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsEditingAddress(false)}
                    className="py-2 px-4 bg-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer hover:bg-gray-305"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 font-bold leading-relaxed">{location || 'No address specified. Click Change to set address.'}</p>
            )}
          </div>
          <div className="flex items-center gap-4 pt-4 mt-4 border-t border-gray-200/50 relative z-10">
            <div className={`p-2 rounded-xl ${isBookingBlocked ? 'bg-rose-100' : 'bg-green-100'}`}>
              <ShieldCheck className={`w-5 h-5 ${isBookingBlocked ? 'text-rose-600' : 'text-green-600'}`} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                {isBookingBlocked ? 'Outside Service Radius' : `Verified Pro • ${serviceRadiusKm} km Operational Radius`}
              </p>
              <p className={`text-[10px] font-bold ${isBookingBlocked ? 'text-rose-600' : 'text-gray-500'}`}>
                {isBookingBlocked ? serviceGeo?.reason : '100% Satisfaction Guarantee'}
              </p>
              {isBookingBlocked && onOpenLocationPicker && (
                <button
                  type="button"
                  onClick={onOpenLocationPicker}
                  className="mt-2 px-3 py-1 bg-rose-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer"
                >
                  Change Delivery Location
                </button>
              )}
            </div>
          </div>
          <MapPin className="absolute -right-4 -bottom-4 w-24 h-24 text-gray-100/30 rotate-12" />
        </section>

        <ReviewsSection 
          reviews={localReviews} 
          onAddReview={handleAddReview} 
          isAdmin={isAdmin}
          onDeleteReview={handleDeleteReview}
          onEditReview={handleEditReview}
        />
      </div>

      <div className="p-6 bg-white border-t border-gray-100 fixed bottom-0 inset-x-0 z-20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estimated Charge</span>
            <p className="text-2xl font-black text-gray-900">₹{service.price}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Pay after service</span>
          </div>
        </div>
        <button 
          onClick={() => {
            if (isBookingBlocked) {
              onOpenLocationPicker?.();
              return;
            }
            if (selectedTime !== -1) {
              const dObj = dates[selectedDate];
              const tObj = currentTimes[selectedTime];
              onBook(`${dObj.day}, ${dObj.date}`, tObj.time);
            }
          }}
          disabled={selectedTime === -1 || isBookingBlocked}
          className={`w-full py-5 rounded-[2rem] font-black shadow-xl transition-all ${
            selectedTime === -1 || isBookingBlocked
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
              : 'bg-yellow-400 text-gray-900 shadow-yellow-200 active:scale-95'
          }`}
        >
          {isBookingBlocked ? 'Outside Operational Boundary — Change Location' : selectedTime === -1 ? 'Select a Time Slot' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  );
}
