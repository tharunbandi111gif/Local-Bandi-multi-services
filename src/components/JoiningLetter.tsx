import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  CheckCircle2, 
  FileText,
  Smartphone,
  Stamp
} from 'lucide-react';
import { format } from 'date-fns';
import { LanguageCode } from '../types';
import { getLocalizedJoiningLetter } from '../utils/localizedContent';

interface JoiningLetterProps {
  partner: {
    name: string;
    type: 'vendor' | 'delivery' | string;
    phone: string;
    businessName?: string;
    service?: string;
    address?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    createdAt?: any;
    id: string;
  };
  onClose: () => void;
  language?: LanguageCode;
}

const JoiningLetter: React.FC<JoiningLetterProps> = ({ partner, onClose, language = 'en-IN' }) => {
  const letterRef = useRef<HTMLDivElement>(null);
  const content = getLocalizedJoiningLetter(partner, language);

  const handlePrint = () => {
    window.print();
  };

  const today = format(new Date(), 'dd MMMM yyyy');
  const partnerId = partner.id.toUpperCase();
  const joiningDate = partner.createdAt ? format(partner.createdAt.toDate(), 'dd MMMM yyyy') : today;

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl relative overflow-hidden my-auto"
      >
        {/* Toolbar */}
        <div className="bg-gray-900 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-yellow-400" />
            <h2 className="text-white text-xs font-black uppercase tracking-widest">{content.toolbarTitle}</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="p-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
              title="Print Letter"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 bg-yellow-400 text-gray-900 rounded-xl hover:bg-yellow-500 transition-all font-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Letter Container */}
        <div id="printable-letter" ref={letterRef} className="p-12 md:p-16 text-gray-800 font-serif leading-relaxed">
          {/* Letterhead */}
          <div className="flex justify-between items-start border-b-2 border-gray-100 pb-12 mb-12">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
                <span className="text-white text-3xl font-black italic">LB</span>
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tighter">LOKAL BHARATH</h1>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{content.brandSub}</p>
              </div>
            </div>
            <div className="text-right text-[10px] uppercase font-bold text-gray-400 leading-tight">
              <p>LB Logistics Hub, Sector 4</p>
              <p>Hyderabad, TS, India</p>
              <p>support@lokalbharath.com</p>
              <p>www.lokalbharath.com</p>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex justify-between mb-12 text-sm font-sans font-medium">
            <div>
              <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mb-1">{content.refNo}</p>
              <p className="text-gray-900">LB/EMP/{partner.type.substring(0, 3).toUpperCase()}/{partnerId.substring(2, 10)}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mb-1">{content.issueDate}</p>
              <p className="text-gray-900">{today}</p>
            </div>
          </div>

          {/* Recipient */}
          <div className="mb-12">
            <p className="text-gray-500 mb-2 italic">{content.toLabel}</p>
            <h3 className="text-2xl font-black text-gray-900 mb-1">{partner.name}</h3>
            {partner.businessName && (
              <p className="text-lg font-bold text-gray-700 italic border-l-4 border-yellow-400 pl-4 my-3">{partner.businessName}</p>
            )}
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <Smartphone className="w-3 h-3" /> {partner.phone}
            </p>
            <p className="text-sm font-bold text-gray-500 mt-1 max-w-sm">
              {partner.address || 'Registered local partner address on file.'}
            </p>
          </div>

          {/* Subject */}
          <div className="text-center mb-12">
            <h2 className="text-lg font-black text-gray-900 underline decoration-yellow-400 decoration-2 underline-offset-8 uppercase tracking-widest">
              {content.subject}
            </h2>
          </div>

          {/* Content Body */}
          <div className="space-y-6 text-base text-gray-700">
            <p>{content.dearText}</p>
            
            <p>{content.welcomeText}</p>

            <p>{content.bodyText}</p>

            <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 my-8 space-y-4 font-sans">
              <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">{content.particularsTitle}</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                 <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">{content.designationLabel}</label>
                    <p className="text-sm font-black text-gray-900">{content.designationValue}</p>
                 </div>
                 <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">{content.effectiveDateLabel}</label>
                    <p className="text-sm font-black text-gray-900">{joiningDate}</p>
                 </div>
                 <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">{content.statusLabel}</label>
                    <p className="text-xs font-black text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {content.statusValue}
                    </p>
                 </div>
                 <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">{content.tierLabel}</label>
                    <p className="text-sm font-black text-gray-900">{content.tierValue}</p>
                 </div>
              </div>
            </div>

            <p>{content.termsText}</p>

            <p>{content.bankText}</p>

            {/* Bank details on letter */}
            <div className="border-2 border-dashed border-gray-100 p-6 rounded-3xl grid grid-cols-3 gap-4 font-sans italic">
               <div>
                 <p className="text-[8px] font-black uppercase text-gray-400 leading-none mb-1">{content.bankNameLabel}</p>
                 <p className="text-[10px] font-black text-gray-700">{partner.bankName || 'XXXXXXXXXXXX'}</p>
               </div>
               <div className="col-span-2">
                 <p className="text-[8px] font-black uppercase text-gray-400 leading-none mb-1">{content.accountNoLabel}</p>
                 <p className="text-[10px] font-black text-gray-700 font-mono tracking-wider">{partner.accountNumber || '**** **** ****'}</p>
               </div>
            </div>

            <p className="mt-8 text-gray-600 italic">
               {content.closingText}
            </p>
          </div>

          {/* Footer Signature */}
          <div className="mt-16 flex justify-between items-end">
            <div className="space-y-4">
               <div className="flex flex-col items-center gap-1 opacity-80">
                 <div className="flex -space-x-4 mb-2">
                   <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center p-2 opacity-40">
                      <Stamp className="w-6 h-6 text-indigo-400" />
                   </div>
                   <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center p-2 transform rotate-12">
                      <ShieldCheck className="w-8 h-8 text-amber-500" />
                   </div>
                 </div>
                 <p className="text-[8px] font-black uppercase text-emerald-600 tracking-widest text-center">{content.verifiedBy}</p>
               </div>
            </div>

            <div className="text-center relative">
               <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-10">
                 <CheckCircle2 className="w-24 h-24 text-gray-900" />
               </div>
               <div className="mb-2 font-black text-xl italic text-blue-600">{content.ceoName}</div>
               <div className="w-48 h-0.5 bg-gray-200 mx-auto mb-2"></div>
               <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-none">{content.ceoTitle}</p>
               <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">{content.companyFull}</p>
            </div>
          </div>
        </div>

        {/* CSS for print */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-letter, #printable-letter * {
              visibility: visible;
            }
            #printable-letter {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 40px !important;
            }
            @page {
              size: A4;
              margin: 0;
            }
          }
        `}</style>
      </motion.div>
    </div>
  );
};

export default JoiningLetter;
