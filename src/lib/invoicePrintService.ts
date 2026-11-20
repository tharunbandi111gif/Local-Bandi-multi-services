// Invoice & Real-Time Bill Printing Service for Local Bandi Multi Services
import { db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';

/**
 * Official vector brand logo for Local Bandi Multi Services
 * Self-contained crisp SVG vector ensuring optimal print fidelity across all POS thermal & A4 laser printers
 */
export const OFFICIAL_LOCAL_BANDI_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="56" height="56" style="display:inline-block; vertical-align:middle; flex-shrink:0;">
  <defs>
    <linearGradient id="lbGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#lbGoldGrad)" stroke="#fef08a" stroke-width="12"/>
  <circle cx="256" cy="256" r="190" fill="#0f172a"/>
  <!-- Stylized LB Brand Mark -->
  <path d="M 160 160 L 160 352 L 230 352 L 230 315 L 198 315 L 198 160 Z" fill="#facc15"/>
  <path d="M 250 160 L 315 160 C 345 160 365 178 365 205 C 365 222 355 238 335 246 C 360 255 372 274 372 298 C 372 330 348 352 315 352 L 250 352 Z M 288 200 L 288 236 L 312 236 C 324 236 332 228 332 218 C 332 208 324 200 312 200 Z M 288 276 L 288 314 L 315 314 C 328 314 336 306 336 295 C 336 284 328 276 315 276 Z" fill="#facc15"/>
</svg>`;

export interface InvoiceOrderData {
  id: string;
  invoiceNo?: string;
  invoiceDate?: string;
  customerName?: string;
  userName?: string;
  customerPhone?: string;
  phone?: string;
  userPhone?: string;
  customerAddress?: string;
  address?: string;
  deliveryLocation?: any;
  vendorName?: string;
  vendorPhone?: string;
  vendorAddress?: string;
  pickupLocation?: any;
  branchName?: string;
  branchId?: string;
  deliveryPartnerName?: string;
  riderName?: string;
  deliveryPartnerPhone?: string;
  riderPhone?: string;
  status?: string;
  orderStatus?: string;
  createdAt?: any;
  timestamp?: any;
  date?: any;
  paymentMethod?: string;
  paymentType?: string;
  paymentStatus?: string;
  transactionId?: string;
  orderItems?: Array<{
    id?: string;
    name: string;
    quantity: number;
    price: number;
    unit?: string;
    category?: string;
    notes?: string;
  }>;
  items?: Array<any> | number;
  subtotal?: number;
  deliveryFee?: number;
  deliveryCharge?: number;
  distanceKm?: number;
  deliveryDistanceKm?: number;
  deliveryBreakdown?: string;
  platformFee?: number;
  handlingFee?: number;
  taxes?: number;
  discount?: number;
  tip?: number;
  total?: number;
  totalPrice?: number;
  customerInstructions?: string;
  deliveryInstructions?: string;
}

/**
 * Deterministically generates or formats an invoice number from an order
 */
export function getOrGenerateInvoiceNo(order: InvoiceOrderData): string {
  if (order.invoiceNo && order.invoiceNo.trim().length > 0) {
    return order.invoiceNo;
  }
  const dateObj = parseOrderDate(order);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const cleanId = (order.id || 'ORD000').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const shortId = cleanId.length > 6 ? cleanId.slice(-6) : cleanId.padStart(6, '0');
  return `INV-${year}${month}-${shortId}`;
}

export function parseOrderDate(order: InvoiceOrderData): Date {
  const raw = order.createdAt || order.timestamp || order.date;
  if (!raw) return new Date();
  if (raw instanceof Date) return raw;
  if (typeof raw === 'object' && typeof raw.seconds === 'number') {
    return new Date(raw.seconds * 1000);
  }
  if (typeof raw === 'string') {
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

/**
 * Ensures the invoice number is stored back in Firestore if not already present
 */
export async function ensureOrderInvoicePersisted(order: InvoiceOrderData): Promise<string> {
  const invNo = getOrGenerateInvoiceNo(order);
  if (!order.invoiceNo && order.id && db) {
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        invoiceNo: invNo,
        invoiceDate: new Date().toISOString()
      });
      order.invoiceNo = invNo;
    } catch (err) {
      console.warn('Could not persist invoice number to Firestore:', err);
    }
  }
  return invNo;
}

/**
 * Builds printable HTML document for A4 Standard Tax Invoice or 80mm Thermal POS Slip
 */
export function buildInvoiceHTML(order: InvoiceOrderData, format: 'a4' | 'thermal' = 'a4'): string {
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
  // Default delivery fee calculation following the official rule: ₹25 up to 3 km, ₹25 + ₹10/km above
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
  const riderName = order.deliveryPartnerName || order.riderName || 'Local Express Dispatcher';

  const paymentMethod = (order.paymentMethod || order.paymentType || 'Cash on Delivery').toUpperCase();
  const isCOD = paymentMethod.includes('COD') || paymentMethod.includes('CASH');
  const paymentStatus = order.paymentStatus || (isCOD ? 'COD Pending' : 'Paid Online');

  if (format === 'thermal') {
    // 80mm (approx 3 inch) POS Slip Format
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt - ${invoiceNo}</title>
  <style>
    @page {
      margin: 0;
      size: 80mm auto;
    }
    body {
      font-family: 'Courier New', Courier, monospace, -apple-system, sans-serif;
      width: 76mm;
      margin: 0 auto;
      padding: 10px 4px;
      color: #000;
      font-size: 11px;
      line-height: 1.35;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .title { font-size: 13px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; margin: 3px 0 0 0; }
    .subtitle { font-size: 9px; margin: 2px 0 6px; }
    .dashed-line { border-top: 1px dashed #000; margin: 6px 0; }
    .double-line { border-top: 2px solid #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
    .item-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px; }
    .item-name { width: 55%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .item-qty { width: 15%; text-align: center; }
    .item-total { width: 30%; text-align: right; }
    .grand-total { font-size: 13px; font-weight: 900; }
    .footer { font-size: 9px; text-align: center; margin-top: 10px; }
    @media print {
      body { width: 76mm; padding: 4px; }
    }
  </style>
</head>
<body>
  <div class="text-center">
    <div style="margin: 0 auto 6px auto; display: flex; justify-content: center;">
      ${OFFICIAL_LOCAL_BANDI_LOGO_SVG}
    </div>
    <div class="title">LOCAL BANDI MULTI SERVICES</div>
    <div class="subtitle">SMART HYPERLOCAL LOGISTICS • KHAMMAM</div>
    <div style="font-size: 9px;">Wyra Road, Khammam, Telangana 507001</div>
    <div style="font-size: 9px; font-weight: bold;">Ph: +91 8790729816 | GST: 36AABCL1234F1Z5</div>
  </div>

  <div class="double-line"></div>
  <div class="text-center font-bold" style="font-size: 11px;">RETAIL / DELIVERY INVOICE</div>
  <div class="dashed-line"></div>

  <div class="row"><span>Invoice No:</span><span class="font-bold">${invoiceNo}</span></div>
  <div class="row"><span>Order ID:</span><span>#${order.id?.slice(-8).toUpperCase()}</span></div>
  <div class="row"><span>Date:</span><span>${formattedDate} ${formattedTime}</span></div>
  <div class="row"><span>Pay Mode:</span><span class="font-bold">${paymentMethod}</span></div>
  <div class="row"><span>Pay Status:</span><span class="font-bold">${paymentStatus}</span></div>

  <div class="dashed-line"></div>
  <div class="font-bold" style="font-size: 10px;">CUSTOMER:</div>
  <div>${customerName}</div>
  <div>Ph: ${customerPhone}</div>
  <div style="font-size: 9px; color: #333;">Addr: ${customerAddress}</div>

  <div class="dashed-line"></div>
  <div class="row" style="font-size: 9px;"><span>STORE: ${vendorName}</span></div>
  <div class="row" style="font-size: 9px;"><span>RIDER: ${riderName}</span></div>
  <div class="row" style="font-size: 9px;"><span>DISTANCE: ${distanceKm} km (Calculated)</span></div>

  <div class="double-line"></div>
  <div class="item-row font-bold" style="font-size: 9px; text-transform: uppercase;">
    <span class="item-name">ITEM</span>
    <span class="item-qty">QTY</span>
    <span class="item-total">AMT (₹)</span>
  </div>
  <div class="dashed-line"></div>

  ${items.map(it => `
    <div class="item-row">
      <span class="item-name">${it.name}</span>
      <span class="item-qty">x${it.quantity}</span>
      <span class="item-total">₹${it.price * it.quantity}</span>
    </div>
  `).join('')}

  <div class="dashed-line"></div>
  <div class="row"><span>Items Subtotal:</span><span>₹${subtotal}</span></div>
  <div class="row"><span>Delivery Fee (${distanceKm} km):</span><span>${deliveryFee > 0 ? `₹${deliveryFee}` : 'FREE'}</span></div>
  ${platformFee > 0 ? `<div class="row"><span>Platform & Pack:</span><span>₹${platformFee}</span></div>` : ''}
  ${discount > 0 ? `<div class="row font-bold"><span>Discount:</span><span>-₹${discount}</span></div>` : ''}
  ${tip > 0 ? `<div class="row"><span>Rider Tip:</span><span>₹${tip}</span></div>` : ''}

  <div class="double-line"></div>
  <div class="row grand-total">
    <span>TOTAL PAYABLE:</span>
    <span>₹${grandTotal}</span>
  </div>
  <div class="double-line"></div>

  ${order.customerInstructions ? `
    <div style="font-size: 8px; margin: 4px 0;">
      <strong>Note:</strong> ${order.customerInstructions}
    </div>
  ` : ''}

  <div class="footer">
    <div>*** THANK YOU FOR ORDERING ***</div>
    <div>Empowering Local Khammam Merchants</div>
    <div>Support: localbharathkhammam@gmail.com</div>
    <div style="margin-top: 4px; font-size: 8px;">Computer Generated Tax Invoice</div>
  </div>
</body>
</html>
    `;
  }

  // Standard A4 Tax Invoice Format
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Tax Invoice - ${invoiceNo}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      font-size: 12px;
      line-height: 1.45;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 28px;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
      text-transform: uppercase;
      margin: 0;
    }
    .brand-subtitle {
      font-size: 11px;
      font-weight: 700;
      color: #d97706;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 2px 0 6px;
    }
    .meta-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .badge-paid {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }
    .badge-cod {
      background: #fffbeb;
      color: #d97706;
      border: 1px solid #fde68a;
    }
    .grid-info {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
    }
    .info-box-title {
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .info-box p {
      margin: 3px 0;
      font-size: 11.5px;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    table.items-table th {
      background: #0f172a;
      color: #ffffff;
      padding: 10px 12px;
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: left;
    }
    table.items-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11.5px;
    }
    table.items-table tr:nth-child(even) td {
      background: #fafafa;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .totals-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }
    .totals-table {
      width: 320px;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 5px 8px;
      font-size: 12px;
    }
    .grand-row td {
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
      padding: 8px;
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
    }
    .footer-note {
      border-top: 1px dashed #cbd5e1;
      padding-top: 16px;
      font-size: 10px;
      color: #64748b;
      text-align: center;
      line-height: 1.6;
    }
    @media print {
      body {
        padding: 0;
        background: transparent;
      }
      .invoice-card {
        border: none;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <table class="header-table">
      <tr>
        <td style="vertical-align: middle; width: 64%;">
          <div style="display: flex; align-items: center; gap: 14px;">
            ${OFFICIAL_LOCAL_BANDI_LOGO_SVG}
            <div>
              <div class="brand-title">Local Bandi Multi Services</div>
              <div class="brand-subtitle">Smart Hyperlocal Logistics & Commercial Hub</div>
              <div style="font-size: 11px; color: #475569; line-height: 1.4;">
                Central Logistics Office: Wyra Road, Khammam, Telangana 507001<br />
                GSTIN: <strong>36AABCL1234F1Z5</strong> &bull; Support: +91 8790729816
              </div>
            </div>
          </div>
        </td>
        <td style="vertical-align: top; text-align: right; width: 36%;">
          <div style="font-size: 18px; font-weight: 900; color: #0f172a; text-transform: uppercase;">TAX INVOICE</div>
          <div style="font-size: 13px; font-weight: 800; color: #d97706; margin: 2px 0;">${invoiceNo}</div>
          <div style="font-size: 11px; color: #64748b;">Order Ref: #${order.id?.slice(-8).toUpperCase()}</div>
          <div style="margin-top: 6px;">
            <span class="meta-badge ${isCOD ? 'badge-cod' : 'badge-paid'}">${paymentStatus}</span>
          </div>
        </td>
      </tr>
    </table>

    <div class="grid-info">
      <div class="info-box">
        <div class="info-box-title">Billed To (Customer)</div>
        <p><strong>${customerName}</strong></p>
        <p>📱 ${customerPhone}</p>
        <p style="color: #475569;">📍 ${customerAddress}</p>
      </div>

      <div class="info-box">
        <div class="info-box-title">Fulfilled By (Merchant)</div>
        <p><strong>${vendorName}</strong></p>
        <p>Hub: ${branchName}</p>
        <p>Category: Multi-Services Delivery</p>
        <p style="color: #475569;">Rider: <strong>${riderName}</strong></p>
      </div>

      <div class="info-box">
        <div class="info-box-title">Payment & Invoice Meta</div>
        <p>Invoice Date: <strong>${formattedDate}</strong></p>
        <p>Time: <strong>${formattedTime}</strong></p>
        <p>Payment Mode: <strong>${paymentMethod}</strong></p>
        ${order.transactionId ? `<p style="font-size: 10px; color: #64748b;">Txn ID: ${order.transactionId}</p>` : ''}
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%;">#</th>
          <th style="width: 50%;">Item Description</th>
          <th style="width: 15%; text-align: center;">Qty</th>
          <th style="width: 15%; text-align: right;">Unit Price (₹)</th>
          <th style="width: 15%; text-align: right;">Total Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((it, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>
              <strong>${it.name}</strong>
              ${it.unit ? `<span style="color:#64748b; font-size:10px;"> (${it.unit})</span>` : ''}
            </td>
            <td class="text-center font-bold">${it.quantity}</td>
            <td class="text-right">₹${it.price}</td>
            <td class="text-right font-bold">₹${it.price * it.quantity}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals-wrapper">
      <table class="totals-table">
        <tr>
          <td>Items Subtotal:</td>
          <td class="text-right font-bold">₹${subtotal}</td>
        </tr>
        <tr>
          <td>Delivery & Logistics (${distanceKm} km):</td>
          <td class="text-right">${deliveryFee === 0 ? '<span style="color:#059669;font-weight:bold;">FREE</span>' : `₹${deliveryFee}`}</td>
        </tr>
        ${platformFee > 0 ? `
          <tr>
            <td>Packaging & Handling:</td>
            <td class="text-right">₹${platformFee}</td>
          </tr>
        ` : ''}
        ${discount > 0 ? `
          <tr style="color: #dc2626; font-weight: bold;">
            <td>Promotional Discount:</td>
            <td class="text-right">-₹${discount}</td>
          </tr>
        ` : ''}
        ${tip > 0 ? `
          <tr>
            <td>Delivery Partner Tip:</td>
            <td class="text-right">₹${tip}</td>
          </tr>
        ` : ''}
        <tr class="grand-row">
          <td>Grand Total:</td>
          <td class="text-right">₹${grandTotal}</td>
        </tr>
      </table>
    </div>

    <div class="footer-note">
      <strong>Terms & Conditions:</strong><br />
      1. This is a computer-generated tax invoice and requires no physical signature.<br />
      2. All products are sourced and fulfilled directly by authorized partner merchants in Khammam.<br />
      3. For any grievance, return, or refund assistance, contact <strong>support@localbandimultiservices.in</strong> or call <strong>+91 8790729816</strong>.<br />
      Thank you for empowering your local Khammam community with Local Bandi Multi Services!
    </div>
  </div>
</body>
</html>
  `;
}

export const generateInvoiceHtml = buildInvoiceHTML;

/**
 * Executes a real-time print job without popup blockers using a hidden iframe
 */
export function printInvoiceRealtime(order: InvoiceOrderData, format: 'a4' | 'thermal' = 'a4'): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const html = buildInvoiceHTML(order, format);

      // Create a dedicated hidden printing iframe in the document
      const iframeId = 'lokal-invoice-print-frame';
      let iframe = document.getElementById(iframeId) as HTMLIFrameElement;
      if (iframe) {
        iframe.remove();
      }

      iframe = document.createElement('iframe');
      iframe.id = iframeId;
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.style.visibility = 'hidden';

      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!frameDoc || !iframe.contentWindow) {
        // Fallback to standard window print
        window.print();
        resolve(true);
        return;
      }

      frameDoc.open();
      frameDoc.write(html);
      frameDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve(true);
        } catch (e) {
          console.warn('Iframe print failed, falling back to window.print:', e);
          window.print();
          resolve(true);
        } finally {
          setTimeout(() => {
            try {
              iframe.remove();
            } catch {}
          }, 3000);
        }
      }, 350);
    } catch (err) {
      console.error('Real-time print error:', err);
      window.print();
      resolve(false);
    }
  });
}

/**
 * Formats a plain text receipt for WhatsApp or SMS sharing
 */
export function buildWhatsAppReceiptText(order: InvoiceOrderData): string {
  const invNo = getOrGenerateInvoiceNo(order);
  const dateObj = parseOrderDate(order);
  const formattedDate = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const rawItems: any[] = Array.isArray(order.orderItems) ? order.orderItems : (Array.isArray(order.items) ? order.items : []);
  const items = rawItems.map((it: any) => `• ${it.name} x${it.quantity || 1} = ₹${(it.price || 0) * (it.quantity || 1)}`).join('\n');
  const grandTotal = order.total ?? order.totalPrice ?? 0;

  return `🧾 *LOCAL BANDI MULTI SERVICES - OFFICIAL BILL*
━━━━━━━━━━━━━━━━━━━━━
📄 *Invoice No:* ${invNo}
📦 *Order ID:* #${order.id?.slice(-8).toUpperCase()}
📅 *Date:* ${formattedDate}
👤 *Customer:* ${order.customerName || order.userName || 'Customer'} (📞 ${order.customerPhone || order.phone || 'N/A'})
📍 *Address:* ${order.customerAddress || order.address || 'Khammam Delivery'}
🏪 *Merchant:* ${order.vendorName || 'Central Hub'}
🛵 *Rider:* ${order.deliveryPartnerName || order.riderName || 'Express Rider'}
💳 *Payment:* ${order.paymentMethod || 'COD'} (${order.paymentStatus || 'Status: Active'})
━━━━━━━━━━━━━━━━━━━━━
*ITEMS PURCHASED:*
${items}
━━━━━━━━━━━━━━━━━━━━━
💰 *GRAND TOTAL: ₹${grandTotal}*
━━━━━━━━━━━━━━━━━━━━━
Thank you for supporting Khammam local businesses!
Need help? Call +91 8790729816 or visit localbandimultiservices.in`;
}
