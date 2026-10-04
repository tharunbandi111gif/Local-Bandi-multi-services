import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, 
  X, 
  FileText, 
  Receipt, 
  Share2, 
  Copy, 
  Check, 
  Download, 
  Store, 
  MapPin, 
  Phone, 
  Calendar, 
  CreditCard, 
  ShieldCheck, 
  Sparkles,
  QrCode,
  Bike
} from 'lucide-react';
import { 
  InvoiceOrderData, 
  getOrGenerateInvoiceNo, 
  parseOrderDate, 
  ensureOrderInvoicePersisted, 
  printInvoiceRealtime, 
  buildWhatsAppReceiptText,
  OFFICIAL_LOCAL_BANDI_LOGO_SVG 
} from '../lib/invoicePrintService';

interface RealtimeOrderBillModalProps {
  order: InvoiceOrderData | null;
  isOpen: boolean;
  onClose: () => void;
  defaultFormat?: 'a4' | 'thermal';
}

export default function RealtimeOrderBillModal({
  order,
  isOpen,
  onClose,
  defaultFormat = 'a4'
}: RealtimeOrderBillModalProps) {
  const [format, setFormat] = useState<'a4' | 'thermal'>(defaultFormat);
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (order && isOpen) {
      // Ensure the invoice number is stored in Firestore
      ensureOrderInvoicePersisted(order);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const invoiceNo = getOrGenerateInvoiceNo(order);
  const dateObj = parseOrderDate(order);
  const formattedDate = dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = dateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const rawItems: any[] = Array.isArray(order.orderItems) ? order.orderItems : (Array.isArray(order.items) ? order.items : []);
  const items = rawItems.map((it: any) => ({
    name: it.name || it.title || 'Product Item',
    quantity: Number(it.quantity || 1),
    price: Number(it.price || 0),
    unit: it.unit || '',
    category: it.category || ''
  }));

  const subtotal = items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  const distanceKm = Number(order.distanceKm ?? order.deliveryDistanceKm ?? 2.5);
  const calculatedFeeFromDist = distanceKm <= 3 ? 25 : 25 + Math.ceil(distanceKm - 3) * 10;
  const deliveryFee = Number(order.deliveryFee ?? order.deliveryCharge ?? calculatedFeeFromDist);
  const platformFee = Number(order.platformFee ?? order.handlingFee ?? 5);
  const discount = Number(order.discount ?? 0);
  const tip = Number(order.tip ?? 0);
  const grandTotal = Number(order.total ?? order.totalPrice ?? (subtotal + deliveryFee + platformFee - discount + tip));

  const customerName = order.customerName || order.userName || 'Valued Customer';
  const customerPhone = order.customerPhone || order.phone || order.userPhone || 'Registered Mobile';
  const customerAddress = order.customerAddress || order.address || (typeof order.deliveryLocation === 'string' ? order.deliveryLocation : 'Khammam, Telangana');

  const vendorName = order.vendorName || 'Local Bandi Store / Central Hub';
  const branchName = order.branchName || 'Khammam Central Branch';
  const riderName = order.deliveryPartnerName || order.riderName || 'Express Dispatcher';

  const paymentMethod = (order.paymentMethod || order.paymentType || 'Cash on Delivery').toUpperCase();
  const isCOD = paymentMethod.includes('COD') || paymentMethod.includes('CASH');
  const paymentStatus = order.paymentStatus || (isCOD ? 'COD Pending' : 'Paid Online');

  const handlePrint = async () => {
    setIsPrinting(true);
    await printInvoiceRealtime(order, format);
    setTimeout(() => setIsPrinting(false), 800);
  };

  const handleCopyText = async () => {
    const text = buildWhatsAppReceiptText(order);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = buildWhatsAppReceiptText(order);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900"
        >
          {/* Modal Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black tracking-tight">Official Order Bill</h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                    {invoiceNo}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-semibold">
                  Local Bandi Multi Services &bull; Order #{order.id?.slice(-8).toUpperCase()}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Format Switcher */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
              <button
                type="button"
                onClick={() => setFormat('a4')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  format === 'a4'
                    ? 'bg-slate-900 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Standard A4
              </button>
              <button
                type="button"
                onClick={() => setFormat('thermal')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  format === 'thermal'
                    ? 'bg-slate-900 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                Thermal Slip (80mm)
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyText}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>

              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                WhatsApp
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={isPrinting}
                className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-amber-400/20 active:scale-95 disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                {isPrinting ? 'Printing...' : 'Print Bill'}
              </button>
            </div>
          </div>

          {/* Bill Preview Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
            {format === 'a4' ? (
              /* A4 Tax Invoice Preview */
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6">
                {/* Brand Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-900">
                  <div className="flex items-center gap-3.5">
                    <div 
                      className="w-12 h-12 flex-shrink-0"
                      dangerouslySetInnerHTML={{ __html: OFFICIAL_LOCAL_BANDI_LOGO_SVG }}
                    />
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                        Local Bandi Multi Services
                      </h1>
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mt-0.5">
                        Smart Hyperlocal Logistics & Commercial Hub
                      </p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Wyra Road, Khammam, Telangana 507001<br />
                        GSTIN: <span className="font-bold text-slate-700">36AABCL1234F1Z5</span> &bull; Ph: +91 8790729816
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-lg font-black text-slate-900 uppercase tracking-wide">TAX INVOICE</div>
                    <div className="text-sm font-black text-amber-600 font-mono mt-0.5">{invoiceNo}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Order Ref: #{order.id?.slice(-8).toUpperCase()}</div>
                    <div className="mt-2">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isCOD ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                    <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> Billed To
                    </div>
                    <p className="text-xs font-black text-slate-900">{customerName}</p>
                    <p className="text-xs text-slate-600">📱 {customerPhone}</p>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{customerAddress}</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                    <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5 flex items-center gap-1">
                      <Store className="w-3 h-3 text-slate-400" /> Fulfilled By
                    </div>
                    <p className="text-xs font-black text-slate-900">{vendorName}</p>
                    <p className="text-xs text-slate-600">Hub: {branchName}</p>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <Bike className="w-3 h-3 text-indigo-500" /> {riderName}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                    <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" /> Payment & Date
                    </div>
                    <p className="text-xs font-bold text-slate-900">{formattedDate} {formattedTime}</p>
                    <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                      <CreditCard className="w-3 h-3 text-slate-400" /> {paymentMethod}
                    </p>
                    {order.transactionId && (
                      <p className="text-[10px] font-mono text-slate-500 mt-1 truncate">Txn: {order.transactionId}</p>
                    )}
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                        <th className="py-2.5 px-3 rounded-l-xl w-8">#</th>
                        <th className="py-2.5 px-3">Item Description</th>
                        <th className="py-2.5 px-3 text-center w-16">Qty</th>
                        <th className="py-2.5 px-3 text-right w-24">Price (₹)</th>
                        <th className="py-2.5 px-3 text-right rounded-r-xl w-24">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-black text-slate-900">{it.name}</span>
                            {it.unit && <span className="text-slate-400 text-[10px] ml-1">({it.unit})</span>}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800">{it.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">₹{it.price}</td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900">₹{it.price * it.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary */}
                <div className="flex justify-end pt-2">
                  <div className="w-full sm:w-72 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Items Subtotal:</span>
                      <span className="font-bold text-slate-900">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Delivery & Logistics ({distanceKm} km):</span>
                      <span>{deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${deliveryFee}`}</span>
                    </div>
                    {platformFee > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Packaging & Platform Fee:</span>
                        <span>₹{platformFee}</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>Promotional Discount:</span>
                        <span>-₹{discount}</span>
                      </div>
                    )}
                    {tip > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Rider Tip:</span>
                        <span>₹{tip}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-sm font-black text-slate-900">
                      <span>Total Amount Payable:</span>
                      <span className="text-base text-amber-600">₹{grandTotal}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="pt-4 border-t border-dashed border-slate-200 text-center text-[10px] text-slate-400 leading-relaxed">
                  <p>This is a computer-generated tax invoice and requires no signature.</p>
                  <p>Support: <span className="text-slate-600 font-bold">support@localbandi.com</span> &bull; Helpline: <span className="text-slate-600 font-bold">+91 8790729816</span></p>
                </div>
              </div>
            ) : (
              /* 80mm Thermal POS Slip Preview */
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-sm mx-auto font-mono text-xs text-slate-900 space-y-4">
                <div className="text-center space-y-1">
                  <div 
                    className="w-10 h-10 mx-auto mb-1 flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: OFFICIAL_LOCAL_BANDI_LOGO_SVG }}
                  />
                  <div className="text-sm font-black uppercase tracking-wider">LOCAL BANDI MULTI SERVICES</div>
                  <div className="text-[10px] font-bold text-slate-600">SMART HYPERLOCAL LOGISTICS • KHAMMAM</div>
                  <div className="text-[9px] text-slate-500">Wyra Road, Khammam, Telangana 507001</div>
                  <div className="text-[9px] font-bold text-slate-700">Ph: +91 8790729816 | GST: 36AABCL1234F1Z5</div>
                </div>

                <div className="border-t-2 border-slate-900 border-dashed pt-2 space-y-1 text-[11px]">
                  <div className="text-center font-bold pb-1">RETAIL DELIVERY BILL</div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice No:</span>
                    <span className="font-bold">{invoiceNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order Ref:</span>
                    <span>#{order.id?.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date & Time:</span>
                    <span>{formattedDate} {formattedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment:</span>
                    <span className="font-bold">{paymentMethod} ({paymentStatus})</span>
                  </div>
                </div>

                <div className="border-t border-slate-300 border-dashed pt-2 space-y-1 text-[10px]">
                  <div className="font-bold">CUSTOMER:</div>
                  <div>{customerName} (📞 {customerPhone})</div>
                  <div className="text-slate-500 truncate">{customerAddress}</div>
                  <div className="text-slate-600 pt-1">Merchant: {vendorName}</div>
                  <div className="text-slate-600">Rider: {riderName}</div>
                  <div className="text-slate-600 font-bold">Distance: {distanceKm} km (Calculated)</div>
                </div>

                {/* Items */}
                <div className="border-t-2 border-slate-900 border-dashed pt-2">
                  <div className="flex justify-between text-[10px] font-black uppercase pb-1 border-b border-slate-200">
                    <span className="w-1/2">ITEM</span>
                    <span className="w-1/4 text-center">QTY</span>
                    <span className="w-1/4 text-right">AMT (₹)</span>
                  </div>
                  <div className="divide-y divide-slate-100 py-1">
                    {items.map((it, idx) => (
                      <div key={idx} className="flex justify-between py-1 text-[11px]">
                        <span className="w-1/2 truncate">{it.name}</span>
                        <span className="w-1/4 text-center">x{it.quantity}</span>
                        <span className="w-1/4 text-right font-bold">₹{it.price * it.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="border-t border-slate-300 border-dashed pt-2 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery ({distanceKm} km):</span>
                    <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                  </div>
                  {platformFee > 0 && (
                    <div className="flex justify-between">
                      <span>Platform/Packaging:</span>
                      <span>₹{platformFee}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Discount:</span>
                      <span>-₹${discount}</span>
                    </div>
                  )}
                  {tip > 0 && (
                    <div className="flex justify-between">
                      <span>Rider Tip:</span>
                      <span>₹{tip}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t-2 border-slate-900 font-black text-sm">
                    <span>TOTAL:</span>
                    <span>₹{grandTotal}</span>
                  </div>
                </div>

                <div className="border-t border-slate-300 border-dashed pt-3 text-center text-[9px] text-slate-500 space-y-1">
                  <div className="font-bold uppercase">*** THANK YOU FOR ORDERING ***</div>
                  <div>Empowering Local Khammam Merchants</div>
                  <div>Helpline: +91 8790729816</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
