import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  QrCode, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  Store, 
  ExternalLink, 
  Sparkles, 
  Printer, 
  Smartphone,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import QRCode from 'qrcode';

interface MerchantQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId?: string;
  merchantName?: string;
  merchantBranch?: string;
  merchantPhone?: string;
  merchantAddress?: string;
  menuUrl?: string;
}

export const MerchantQRCodeModal: React.FC<MerchantQRCodeModalProps> = ({
  isOpen,
  onClose,
  vendorId = 'local-vendor-001',
  merchantName = 'Local Bandi Verified Merchant',
  merchantBranch = 'Khammam Main Branch',
  merchantPhone = '+91 87907 29816',
  merchantAddress = 'Bypass Road, Khammam, Telangana',
  menuUrl
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);

  // Compute canonical menu & quick ordering URL
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const targetUrl = menuUrl || `${origin}/?vendorId=${encodeURIComponent(vendorId)}&store=${encodeURIComponent(merchantName)}&ref=qr_quick_order`;

  useEffect(() => {
    if (!isOpen) return;
    setIsGenerating(true);

    QRCode.toDataURL(targetUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#090d16',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => {
        setQrDataUrl(url);
        setIsGenerating(false);
      })
      .catch((err) => {
        console.warn('QRCode generation fallback:', err);
        // Fallback to QR server API
        setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(targetUrl)}`);
        setIsGenerating(false);
      });
  }, [isOpen, targetUrl]);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${merchantName.replace(/\s+/g, '-').toLowerCase()}-order-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🛒 *Quick Ordering & Menu Access for ${merchantName}* on Local Bandi!\n\nTap this link or scan our store QR code to order fresh items directly:\n${targetUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10008] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md bg-slate-900 border border-amber-500/20 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col text-white relative"
      >
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950/60 border-b border-white/5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Merchant QR Code
                </h3>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[8px] font-black uppercase tracking-widest">
                  Live
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Quick Customer Ordering & Menu Access
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Merchant Profile Pill */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-white/5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-tight text-white flex items-center gap-1">
                  <span>{merchantName}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </h4>
                <p className="text-[9px] text-slate-400 font-bold">
                  {merchantBranch} &bull; ID: <span className="font-mono text-amber-400">{vendorId}</span>
                </p>
              </div>
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg text-slate-300 border border-white/5">
              30m Delivery
            </span>
          </div>

          {/* Standee QR Card */}
          <div className="bg-white text-slate-950 rounded-[2rem] p-5 shadow-2xl border-4 border-amber-400/80 flex flex-col items-center text-center space-y-3 relative group">
            {/* Top Standee Header */}
            <div className="w-full border-b border-slate-200 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-slate-950 flex items-center justify-center text-amber-400 font-black text-[9px]">
                  LB
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                  Local Bandi Multi Services
                </span>
              </div>
              <span className="text-[8px] font-bold uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                Instant Menu
              </span>
            </div>

            {/* QR Code Container */}
            <div className="w-56 h-56 bg-white p-2 rounded-2xl flex items-center justify-center relative shadow-inner">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                    Generating QR...
                  </span>
                </div>
              ) : (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${merchantName}`}
                  className="w-full h-full object-contain rounded-xl"
                />
              )}
            </div>

            {/* Scan Prompt Footer */}
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-900 flex items-center justify-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                <span>Scan with any Camera or UPI App</span>
              </p>
              <p className="text-[9px] font-bold text-slate-500">
                Browse catalog, select products & place direct order
              </p>
            </div>
          </div>

          {/* Quick Order Direct Link Bar */}
          <div className="space-y-1.5">
            <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400">
              Customer Direct Menu Link:
            </span>
            <div className="flex items-center gap-2 p-2 bg-slate-950 border border-white/10 rounded-xl">
              <span className="text-[10px] font-mono text-amber-300/90 truncate flex-1 px-1">
                {targetUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition active:scale-95 shrink-0 cursor-pointer"
                title="Copy Direct Link"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleDownloadQR}
              className="py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-[9px] uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition active:scale-95 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Download PNG</span>
            </button>

            <button
              onClick={handlePrint}
              className="py-2.5 px-3 bg-white/10 hover:bg-white/15 text-white font-black rounded-xl text-[9px] uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition active:scale-95 border border-white/10 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Print Standee</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-[9px] uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition active:scale-95 shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-white/5 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Customer App Deep-Link Enabled</span>
          </div>
          <span className="text-slate-500">Fast 30-min delivery</span>
        </div>
      </motion.div>
    </div>
  );
};

export default MerchantQRCodeModal;
