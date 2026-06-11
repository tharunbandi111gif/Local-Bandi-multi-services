import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Stethoscope, X, Check } from 'lucide-react';

interface HospitalOPFormProps {
  prices: Record<string, { price: number; isActive: boolean }>;
  onBook: (data: any) => void;
  onClose?: () => void;
}

export const HospitalOPForm = ({ prices, onBook, onClose }: HospitalOPFormProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    hospitalName: '',
    reason: '',
    disease: '',
    dateTime: '',
    location: '',
    patientName: '',
    phone: ''
  });

  const appCharge = 20;
  const hospitalData = prices[formData.hospitalName];
  const basePrice = hospitalData?.price || 0;
  const totalAmount = basePrice + appCharge;

  const handleNext = () => {
    if (!formData.hospitalName || !formData.location || !formData.reason) {
      alert("Please fill basic details");
      return;
    }
    setStep(2);
  };

  const handleSubmit = () => {
    if (!formData.patientName || !formData.dateTime) {
      alert("Please fill patient details");
      return;
    }
    onBook({
      ...formData,
      amount: totalAmount,
      type: 'hospital_op',
      timestamp: new Date().toISOString()
    });
  };

  const activeHospitals = Object.entries(prices).filter(([_, data]) => data.isActive);

  return (
    <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
          <Stethoscope className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-gray-900 leading-tight">Patient OP Booking</h3>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">Local Bandi Health Care</p>
        </div>
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Choose Hospital</label>
            <select 
              value={formData.hospitalName}
              onChange={(e) => setFormData({...formData, hospitalName: e.target.value})}
              className="w-full bg-slate-50 border-none rounded-xl py-3.5 px-5 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-rose-200 transition-all appearance-none"
            >
              <option value="">Select Hospital</option>
              {activeHospitals.map(([h]) => <option key={h} value={h}>{h}</option>)}
            </select>
            {formData.hospitalName && !prices[formData.hospitalName]?.isActive && (
              <p className="text-[8px] text-rose-500 font-bold uppercase mt-1 px-1 flex items-center gap-1">
                <X className="w-2 h-2" />
                This hospital is currently offline
              </p>
            )}
          </div>
          
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Your Location</label>
            <input 
              type="text"
              placeholder="Your Village/Town"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full bg-slate-50 border-none rounded-xl py-3.5 px-5 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-rose-200 transition-all transition-all"
            />
          </div>

          <div className="space-y-1">
             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Reason / Symptoms</label>
             <input 
               type="text"
               placeholder="e.g. Fever, Body Pains, Checkup"
               value={formData.reason}
               onChange={(e) => setFormData({...formData, reason: e.target.value})}
               className="w-full bg-slate-50 border-none rounded-xl py-3.5 px-5 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-rose-200 transition-all font-bold"
             />
          </div>

          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-start gap-2.5">
            <div className="w-5 h-5 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-emerald-100">
               <Check className="w-3 h-3 text-emerald-500" />
            </div>
            <p className="text-[9px] font-bold text-emerald-700 leading-snug">
               Get <span className="font-black">5% benefit</span> on medical bills if booked with <span className="text-emerald-500 italic font-black">Local Bandi Multi Services</span>.
            </p>
          </div>

          <button 
            onClick={handleNext}
            className="w-full py-4.5 bg-gray-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] mt-2 active:scale-95 transition-all shadow-xl shadow-gray-200"
          >
            Enter Patient Info
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Patient Name</label>
            <input 
              type="text"
              placeholder="Patient Full Name"
              value={formData.patientName}
              onChange={(e) => setFormData({...formData, patientName: e.target.value})}
              className="w-full bg-slate-50 border-none rounded-xl py-3.5 px-5 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-rose-200 transition-all font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Preferred Date & Time</label>
            <input 
              type="datetime-local"
              value={formData.dateTime}
              onChange={(e) => setFormData({...formData, dateTime: e.target.value})}
              className="w-full bg-slate-50 border-none rounded-xl py-3.5 px-5 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-rose-200 transition-all font-bold"
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-2">
            <div className="flex justify-between items-center px-2">
               <span className="text-[10px] font-bold text-gray-400">Consultation Fee</span>
               <span className="text-xs font-black text-gray-900">₹{basePrice}</span>
            </div>
            <div className="flex justify-between items-center px-2 border-b border-gray-200 pb-2">
               <span className="text-[10px] font-bold text-gray-400 italic">App Handling Fee</span>
               <span className="text-xs font-black text-gray-900">₹{appCharge}</span>
            </div>
            <div className="flex justify-between items-center px-2 pt-1 font-black text-rose-600">
               <span className="text-[11px] uppercase tracking-wider">Total Booking Amount</span>
               <span className="text-lg italic">₹{totalAmount}</span>
            </div>
          </div>

          <div className="flex gap-2.5">
            <button 
              onClick={() => setStep(1)}
              className="flex-1 py-4.5 bg-gray-100 text-gray-500 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all"
            >
              Back
            </button>
            <button 
              onClick={handleSubmit}
              className="flex-[2] py-4.5 bg-rose-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-lg shadow-rose-200"
            >
              Confirm & Book OP
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
