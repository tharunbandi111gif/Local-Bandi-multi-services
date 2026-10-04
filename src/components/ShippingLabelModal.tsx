import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tag, Printer, X, Download, Check, Sparkles, MapPin, Phone, User, Package, AlertTriangle } from 'lucide-react';
import { generateShippingLabelHtml, printShippingLabelRealtime, ShippingLabelData } from '../lib/shippingLabelService';

interface ShippingLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ShippingLabelData | null;
}

export default function ShippingLabelModal({ isOpen, onClose, order }: ShippingLabelModalProps) {
  const [labelFormat, setLabelFormat] = useState<'4x6' | 'thermal'>('4x6');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen || !order) return null;

  const orderId = (order.id || 'LB-ORD-00000').toUpperCase();
  const customerName = order.customerName || order.userName || 'Customer';
  const customerPhone = order.customerPhone || order.phone || order.userPhone || '+91 98765 43210';
  const customerAddress = order.customerAddress || order.address || 'Khammam, Telangana';
  const vendorName = order.vendorName || 'Local Bandi Central Merchant';
  const branchName = order.branchName || 'Khammam Main Branch';
  const isCOD = (order.paymentMethod || order.paymentType || '').toUpperCase().includes('COD') || 
                (order.paymentMethod || '').toLowerCase() === 'cash_on_delivery' || 
                !order.paymentMethod;
  const totalAmount = order.total ?? order.totalPrice ?? 0;

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await printShippingLabelRealtime(order, labelFormat);
    } catch (e: any) {
      alert(e?.message || 'Failed to print shipping label. Please allow popups or use another browser.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadHtml = () => {
    const htmlContent = generateShippingLabelHtml(order, labelFormat);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ShippingLabel-${orderId}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-left"
          id="shipping_label_modal"
        >
          {/* Header */}
          <div className="p-6 bg-slate-950 border-b border-white/10 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-950" />
                  <span>Official Shipping Label</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-bold">
                  #{orderId}
                </span>
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Printable Parcel Shipping Label
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Controls Bar: Format Selector */}
          <div className="px-6 py-3 bg-slate-950/60 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Label Format:</span>
              <button
                onClick={() => setLabelFormat('4x6')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  labelFormat === '4x6'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                }`}
              >
                Standard 4" x 6"
              </button>
              <button
                onClick={() => setLabelFormat('thermal')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  labelFormat === 'thermal'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                }`}
              >
                80mm Thermal
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadHtml}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-white/10 text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Downloaded' : 'Export HTML'}</span>
              </button>
            </div>
          </div>

          {/* Modal Body: High Contrast Shipping Label Paper Simulation */}
          <div className="p-6 overflow-y-auto space-y-4 bg-slate-950/40">
            <div className="bg-white text-black p-5 rounded-2xl shadow-inner border-2 border-slate-300 space-y-4 max-w-md mx-auto font-sans">
              
              {/* Header Badge */}
              <div className="flex justify-between items-center border-b-2 border-black pb-2">
                <div>
                  <h4 className="text-base font-black uppercase tracking-tight text-black">Local Bandi Express</h4>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Hyperlocal Delivery Dispatch</p>
                </div>
                <div className="bg-black text-white text-[9px] font-black uppercase px-2.5 py-1 rounded">
                  {branchName}
                </div>
              </div>

              {/* Order ID & Barcode Representation */}
              <div className="text-center py-1 border-b-2 border-black bg-slate-50 rounded-lg p-2">
                <div className="text-[9px] font-black uppercase tracking-wider text-slate-500">Order ID &amp; Tracking Code</div>
                <div className="text-lg font-mono font-black tracking-wider text-black mt-0.5">#{orderId}</div>
                {/* Simulated Barcode Lines */}
                <div className="flex justify-center items-center gap-[2px] h-9 my-1">
                  {Array.from({ length: 42 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-black h-full"
                      style={{
                        width: (i % 5 === 0 ? '3px' : (i % 3 === 0 ? '2px' : '1px')),
                        opacity: (i % 7 === 0 ? 0.4 : 1)
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* SHIP TO (Customer Details - Highly Visible) */}
              <div className="border-2 border-black p-3.5 rounded-xl bg-amber-50/50">
                <div className="text-[9px] font-black uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-900" />
                  <span>SHIP TO (DELIVERY RECIPIENT):</span>
                </div>
                <div className="text-base font-black uppercase text-slate-950 tracking-tight">
                  {customerName}
                </div>
                <div className="text-xs font-black font-mono text-slate-900 mt-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{customerPhone}</span>
                </div>
                <div className="text-xs font-semibold text-slate-800 mt-1 leading-snug flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-700" />
                  <span>{customerAddress}</span>
                </div>
              </div>

              {/* SHIP FROM */}
              <div className="border border-black/30 p-2.5 rounded-lg text-[10px] bg-slate-50 flex justify-between gap-2">
                <div>
                  <div className="font-black uppercase text-slate-500 text-[8.5px]">SHIP FROM (MERCHANT):</div>
                  <div className="font-black text-slate-900">{vendorName}</div>
                </div>
                <div className="text-right">
                  <div className="font-black uppercase text-slate-500 text-[8.5px]">PAYMENT TYPE:</div>
                  <div className={`font-black uppercase ${isCOD ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {isCOD ? `COD - COLLECT ₹${totalAmount}` : 'PREPAID'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Helper Note */}
            <p className="text-[10px] text-slate-400 text-center">
              💡 Works with any standard thermal printer (80mm/4x6" label) or standard desktop paper printer.
            </p>
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 py-3.5 bg-amber-400 hover:bg-amber-350 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-amber-400/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>{isPrinting ? 'Preparing Label...' : 'Print Shipping Label Now'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
