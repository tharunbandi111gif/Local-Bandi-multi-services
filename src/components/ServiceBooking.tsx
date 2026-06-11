import React, { useState } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, Star, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { Service, Review } from '../types';
import ReviewsSection from './ReviewsSection';

interface ServiceBookingProps {
  service: Service;
  onBack: () => void;
  onBook: () => void;
  isAdmin?: boolean;
}

export default function ServiceBooking({ service, onBack, onBook, isAdmin = false }: ServiceBookingProps) {
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState(-1);
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
    
    for (let i = 0; i < 7; i++) {
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
    // Generate semi-random but stable availability based on day index
    if (dayIndex === 0) return 'limited'; // Today is busy
    if (dayIndex % 2 === 0) return 'available';
    return 'crowded';
  };

  const getTimesForDate = (dateIndex: number) => {
    const baseTimes = [
      { time: '09:00 AM', label: 'Morning Slot' },
      { time: '10:30 AM', label: 'Mid Morning' },
      { time: '12:00 PM', label: 'Noon Slot' },
      { time: '02:00 PM', label: 'Early Afternoon' },
      { time: '04:00 PM', label: 'Late Afternoon' },
      { time: '06:00 PM', label: 'Evening Slot' },
      { time: '07:30 PM', label: 'Late Evening' },
    ];

    return baseTimes.map((t, i) => {
      // Deterministic randomness
      const seed = dateIndex * 7 + i;
      const rand = (seed * 9301 + 49297) % 233280 / 233280;
      
      let status: 'Available' | 'Full' | 'Limited' = 'Available';
      if (rand > 0.8) status = 'Full';
      else if (rand > 0.5) status = 'Limited';

      return {
        ...t,
        status,
        available: status !== 'Full'
      };
    });
  };

  const currentTimes = getTimesForDate(selectedDate);
  const morningSlots = currentTimes.filter(t => t.time.includes('AM') || t.time === '12:00 PM');
  const afternoonSlots = currentTimes.filter(t => t.time.includes('PM') && !morningSlots.includes(t) && parseInt(t.time) < 6);
  const eveningSlots = currentTimes.filter(t => t.time.includes('PM') && parseInt(t.time) >= 6 && t.time !== '12:00 PM');

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
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-black text-gray-900 mb-1">Service Location</h3>
              <p className="text-xs text-gray-500 font-bold max-w-[180px]">B-402, Sunshine Apartments, Noida Sector 62</p>
            </div>
            <button className="text-yellow-600 text-xs font-black uppercase tracking-widest bg-yellow-100 px-3 py-1.5 rounded-xl">Change</button>
          </div>
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200/50">
            <div className="bg-green-100 p-2 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Verified Pro</p>
              <p className="text-[10px] text-gray-500 font-bold">100% Satisfaction Guarantee</p>
            </div>
          </div>
          <MapPin className="absolute -right-4 -bottom-4 w-24 h-24 text-gray-100 rotate-12" />
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
          onClick={onBook}
          disabled={selectedTime === -1}
          className={`w-full py-5 rounded-[2rem] font-black shadow-xl transition-all ${
            selectedTime === -1 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
              : 'bg-yellow-400 text-gray-900 shadow-yellow-200 active:scale-95'
          }`}
        >
          {selectedTime === -1 ? 'Select a Time Slot' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  );
}
