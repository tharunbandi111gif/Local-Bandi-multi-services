// Shipping Label Generator & Print Service for Local Bandi Multi Services
import { InvoiceOrderData } from './invoicePrintService';

export interface ShippingLabelData extends InvoiceOrderData {
  packageWeight?: string;
  trackingNumber?: string;
  routeCode?: string;
  barcodeValue?: string;
}

/**
 * Generates an SVG Barcode element (Code 128 style visual representation)
 */
function generateSvgBarcode(code: string): string {
  // Generate distinct bar pattern based on char codes
  const bars: string[] = [];
  let x = 10;
  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    const width1 = (charCode % 3) + 1.5;
    const width2 = ((charCode >> 1) % 3) + 1.2;
    const gap = ((charCode >> 2) % 2) + 1.8;
    
    bars.push(`<rect x="${x}" y="0" width="${width1}" height="45" fill="#0f172a" />`);
    x += width1 + gap;
    bars.push(`<rect x="${x}" y="0" width="${width2}" height="45" fill="#0f172a" />`);
    x += width2 + gap;
  }

  return `
    <svg viewBox="0 0 ${Math.max(x + 10, 260)} 45" width="100%" height="45" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      ${bars.join('')}
    </svg>
  `;
}

/**
 * Generate a quick QR Code SVG data representation
 */
function generateSvgQrCode(text: string): string {
  // SVG Mockup / Vector Grid QR representation with high density
  return `
    <svg viewBox="0 0 100 100" width="80" height="80" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:auto;">
      <rect width="100" height="100" fill="#ffffff"/>
      <!-- Corner 1 -->
      <rect x="5" y="5" width="28" height="28" fill="#0f172a" rx="3"/>
      <rect x="10" y="10" width="18" height="18" fill="#ffffff" rx="2"/>
      <rect x="14" y="14" width="10" height="10" fill="#0f172a" rx="1"/>
      <!-- Corner 2 -->
      <rect x="67" y="5" width="28" height="28" fill="#0f172a" rx="3"/>
      <rect x="72" y="10" width="18" height="18" fill="#ffffff" rx="2"/>
      <rect x="76" y="14" width="10" height="10" fill="#0f172a" rx="1"/>
      <!-- Corner 3 -->
      <rect x="5" y="67" width="28" height="28" fill="#0f172a" rx="3"/>
      <rect x="10" y="72" width="18" height="18" fill="#ffffff" rx="2"/>
      <rect x="14" y="76" width="10" height="10" fill="#0f172a" rx="1"/>
      <!-- Data Dots Matrix -->
      <rect x="38" y="8" width="6" height="6" fill="#0f172a"/>
      <rect x="48" y="8" width="6" height="6" fill="#0f172a"/>
      <rect x="58" y="8" width="6" height="6" fill="#0f172a"/>
      <rect x="38" y="18" width="6" height="6" fill="#0f172a"/>
      <rect x="50" y="22" width="8" height="6" fill="#0f172a"/>
      <rect x="8" y="38" width="6" height="6" fill="#0f172a"/>
      <rect x="18" y="44" width="6" height="6" fill="#0f172a"/>
      <rect x="28" y="38" width="6" height="6" fill="#0f172a"/>
      <rect x="38" y="38" width="10" height="10" fill="#0f172a"/>
      <rect x="52" y="38" width="8" height="8" fill="#0f172a"/>
      <rect x="64" y="38" width="8" height="8" fill="#0f172a"/>
      <rect x="76" y="38" width="16" height="8" fill="#0f172a"/>
      <rect x="38" y="52" width="8" height="8" fill="#0f172a"/>
      <rect x="50" y="50" width="12" height="12" fill="#0f172a"/>
      <rect x="66" y="52" width="6" height="6" fill="#0f172a"/>
      <rect x="76" y="50" width="8" height="8" fill="#0f172a"/>
      <rect x="88" y="52" width="6" height="6" fill="#0f172a"/>
      <rect x="38" y="66" width="6" height="6" fill="#0f172a"/>
      <rect x="48" y="66" width="8" height="8" fill="#0f172a"/>
      <rect x="60" y="66" width="6" height="6" fill="#0f172a"/>
      <rect x="70" y="66" width="10" height="6" fill="#0f172a"/>
      <rect x="84" y="66" width="8" height="6" fill="#0f172a"/>
      <rect x="38" y="78" width="8" height="8" fill="#0f172a"/>
      <rect x="50" y="80" width="6" height="6" fill="#0f172a"/>
      <rect x="60" y="78" width="10" height="6" fill="#0f172a"/>
      <rect x="74" y="78" width="8" height="8" fill="#0f172a"/>
      <rect x="86" y="78" width="6" height="6" fill="#0f172a"/>
      <rect x="38" y="88" width="12" height="6" fill="#0f172a"/>
      <rect x="54" y="88" width="8" height="6" fill="#0f172a"/>
      <rect x="66" y="88" width="8" height="6" fill="#0f172a"/>
      <rect x="78" y="88" width="14" height="6" fill="#0f172a"/>
    </svg>
  `;
}

/**
 * Builds HTML for a 4x6" adhesive parcel label or 80mm thermal shipping label
 */
export function generateShippingLabelHtml(order: ShippingLabelData, format: '4x6' | 'thermal' = '4x6'): string {
  const orderId = (order.id || 'LB-ORD-00000').toUpperCase();
  const trackingNumber = order.trackingNumber || `TRK-${orderId.replace(/[^A-Z0-9]/g, '').slice(-8)}`;
  const barcodeValue = `*${orderId}*`;
  
  const customerName = order.customerName || order.userName || 'Customer';
  const customerPhone = order.customerPhone || order.phone || order.userPhone || '+91 98765 43210';
  const customerAddress = order.customerAddress || order.address || 'Khammam, Telangana';
  
  const vendorName = order.vendorName || 'Local Bandi Central Merchant';
  const branchName = order.branchName || 'Khammam Main Branch';
  const vendorPhone = order.vendorPhone || '+91 94400 00000';
  const vendorAddress = order.vendorAddress || 'Wyra Road, Khammam, Telangana - 507001';
  
  const isCOD = (order.paymentMethod || order.paymentType || '').toUpperCase().includes('COD') || 
                (order.paymentMethod || '').toLowerCase() === 'cash_on_delivery' || 
                !order.paymentMethod;
  const totalAmount = order.total ?? order.totalPrice ?? 0;
  
  const rawItems: any[] = Array.isArray(order.orderItems) ? order.orderItems : (Array.isArray(order.items) ? order.items : []);
  const itemCount = rawItems.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  
  const orderDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const orderTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const isThermal = format === 'thermal';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Shipping Label #${orderId}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #000000;
      background: #ffffff;
      padding: ${isThermal ? '6px' : '16px'};
      width: 100%;
      max-width: ${isThermal ? '80mm' : '4in'};
      margin: 0 auto;
      font-size: 11px;
      line-height: 1.25;
    }
    @page {
      size: ${isThermal ? '80mm auto' : '4in 6in'};
      margin: 0;
    }
    @media print {
      body {
        padding: ${isThermal ? '4mm' : '6mm'};
        max-width: none;
      }
      .no-print {
        display: none !important;
      }
    }
    .label-wrapper {
      border: 2px solid #000000;
      border-radius: 4px;
      overflow: hidden;
      background: #ffffff;
    }
    .header-bar {
      background: #000000;
      color: #ffffff;
      padding: 6px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-title {
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .brand-subtitle {
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 1px;
      opacity: 0.9;
    }
    .hub-badge {
      background: #ffffff;
      color: #000000;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 8px;
      font-weight: 900;
      text-transform: uppercase;
    }
    .barcode-section {
      text-align: center;
      padding: 8px 12px 6px;
      border-bottom: 2px solid #000000;
      background: #fafafa;
    }
    .order-number {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 1.5px;
      margin-top: 4px;
      font-family: monospace;
    }
    .tracking-label {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      color: #333333;
    }
    .grid-row {
      display: flex;
      border-bottom: 1px solid #000000;
    }
    .col-half {
      flex: 1;
      padding: 6px 8px;
    }
    .col-half:first-child {
      border-right: 1px solid #000000;
    }
    .section-title {
      font-size: 8px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #444444;
      margin-bottom: 2px;
    }
    .ship-to-box {
      padding: 8px 10px;
      border-bottom: 2px solid #000000;
      background: #ffffff;
    }
    .customer-name {
      font-size: 14px;
      font-weight: 900;
      text-transform: uppercase;
      color: #000000;
      margin-bottom: 3px;
    }
    .customer-phone {
      font-size: 11px;
      font-weight: 900;
      font-family: monospace;
      margin-bottom: 4px;
    }
    .customer-address {
      font-size: 11px;
      font-weight: 600;
      line-height: 1.3;
      color: #111111;
    }
    .payment-indicator {
      padding: 8px 10px;
      text-align: center;
      border-bottom: 2px solid #000000;
      ${isCOD ? 'background: #000000; color: #ffffff;' : 'background: #f1f5f9; color: #000000;'}
    }
    .payment-badge-text {
      font-size: 13px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .cod-amount {
      font-size: 18px;
      font-weight: 900;
      margin-top: 2px;
      letter-spacing: 0.5px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
      border-bottom: 1px solid #000000;
    }
    .meta-table td {
      padding: 4px 8px;
      border-right: 1px solid #000000;
    }
    .meta-table td:last-child {
      border-right: none;
    }
    .meta-table strong {
      display: block;
      font-size: 10px;
      font-weight: 800;
    }
    .items-preview {
      padding: 6px 8px;
      border-bottom: 1px solid #000000;
      font-size: 9px;
      background: #fafafa;
    }
    .items-preview ul {
      list-style: none;
      padding-left: 0;
      margin-top: 3px;
    }
    .items-preview li {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1px;
    }
    .footer-row {
      padding: 6px 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
    }
    .instructions {
      font-size: 8px;
      color: #333333;
      max-width: 65%;
      line-height: 1.2;
    }
    .qr-container {
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="label-wrapper">
    <!-- Header -->
    <div class="header-bar">
      <div>
        <div class="brand-title">Local Bandi Express</div>
        <div class="brand-subtitle">Hyperlocal Logistics &bull; Telangana</div>
      </div>
      <div class="hub-badge">${branchName}</div>
    </div>

    <!-- Barcode & Order Identifier -->
    <div class="barcode-section">
      <div class="tracking-label">Order Identifier &amp; Tracking Code</div>
      ${generateSvgBarcode(orderId)}
      <div class="order-number">#${orderId}</div>
    </div>

    <!-- SHIP TO (Customer - Highest Visibility) -->
    <div class="ship-to-box">
      <div class="section-title">DELIVER TO (SHIP TO):</div>
      <div class="customer-name">${customerName}</div>
      <div class="customer-phone">📞 ${customerPhone}</div>
      <div class="customer-address">${customerAddress}</div>
      ${order.customerInstructions ? `<div style="font-size:9px; font-weight:bold; color:#d97706; margin-top:3px;">Note: ${order.customerInstructions}</div>` : ''}
    </div>

    <!-- SHIP FROM (Merchant / Branch) -->
    <div class="grid-row">
      <div class="col-half">
        <div class="section-title">SHIP FROM (MERCHANT):</div>
        <div style="font-size: 10px; font-weight: 800;">${vendorName}</div>
        <div style="font-size: 8.5px; color: #444;">${vendorAddress}</div>
        <div style="font-size: 8.5px; font-weight: 700;">Ph: ${vendorPhone}</div>
      </div>
      <div class="col-half">
        <div class="section-title">LOGISTICS ROUTING:</div>
        <div style="font-size: 10px; font-weight: 800;">Zone: ${order.routeCode || 'KHM-CENTRAL'}</div>
        <div style="font-size: 8.5px; color: #444;">Date: ${orderDate} &bull; ${orderTime}</div>
        <div style="font-size: 8.5px; font-weight: 700;">Partner: ${order.deliveryPartnerName || order.riderName || 'Local Express Fleet'}</div>
      </div>
    </div>

    <!-- PAYMENT INDICATOR -->
    <div class="payment-indicator">
      ${isCOD ? `
        <div class="payment-badge-text">⚠️ CASH ON DELIVERY (COD)</div>
        <div class="cod-amount">COLLECT: ₹${totalAmount}</div>
      ` : `
        <div class="payment-badge-text" style="color: #047857;">✅ PREPAID / ONLINE PAYMENT</div>
        <div style="font-size: 10px; font-weight: 700; color: #065f46;">Do NOT collect any cash from customer</div>
      `}
    </div>

    <!-- PACKAGE METADATA -->
    <table class="meta-table">
      <tr>
        <td>
          <span style="color:#666;">Total Items:</span>
          <strong>${itemCount || 1} Item(s)</strong>
        </td>
        <td>
          <span style="color:#666;">Parcel Class:</span>
          <strong>Standard Express</strong>
        </td>
        <td>
          <span style="color:#666;">Delivery Status:</span>
          <strong>${order.status || 'Active Delivery'}</strong>
        </td>
      </tr>
    </table>

    <!-- ITEM CONTENT MANIFEST PREVIEW -->
    <div class="items-preview">
      <div class="section-title">PACKAGE CONTENTS CHECKLIST:</div>
      <ul>
        ${rawItems.slice(0, 5).map((it: any) => `
          <li>
            <span>• ${it.name || it.title || 'Item'}</span>
            <strong>x${it.quantity || 1}</strong>
          </li>
        `).join('')}
        ${rawItems.length > 5 ? `<li style="font-style:italic; color:#666;">+ ${rawItems.length - 5} additional items inside parcel</li>` : ''}
      </ul>
    </div>

    <!-- FOOTER WITH QR & VERIFICATION -->
    <div class="footer-row">
      <div class="instructions">
        <strong>DRIVER INSTRUCTIONS:</strong> Verify package seal upon handover. Customer must confirm receipt via OTP or signature. Return undelivered parcels to merchant within 2 hours.
        <div style="font-size:7.5px; color:#666; margin-top:2px;">Support Helpline: +91 74165 74197 &bull; support@localbandimultiservices.in</div>
      </div>
      <div class="qr-container">
        ${generateSvgQrCode(orderId)}
        <div style="font-size: 7px; font-weight: 800; text-align: center; margin-top: 1px;">SCAN TO TRACK</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Direct Print Trigger using hidden IFrame (prevents popup blocker)
 */
export async function printShippingLabelRealtime(order: ShippingLabelData, format: '4x6' | 'thermal' = '4x6'): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const htmlContent = generateShippingLabelHtml(order, format);

      // Remove existing print frame if any
      const existingFrame = document.getElementById('shipping_label_print_frame');
      if (existingFrame) {
        existingFrame.remove();
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'shipping_label_print_frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.style.visibility = 'hidden';

      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!doc) {
        throw new Error('Unable to access hidden print document frame.');
      }

      doc.open();
      doc.write(htmlContent);
      doc.close();

      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            resolve();
          } catch (printErr) {
            console.warn('Iframe print error, falling back to window open:', printErr);
            const win = window.open('', '_blank');
            if (win) {
              win.document.write(htmlContent);
              win.document.close();
              win.print();
              resolve();
            } else {
              reject(new Error('Please enable popups to print shipping label.'));
            }
          }
        }, 350);
      };
    } catch (err) {
      reject(err);
    }
  });
}
