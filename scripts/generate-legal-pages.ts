import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { APP_LEGAL_POLICIES, LEGAL_ENTITIES, AppLegalDocument } from '../src/data/legalPolicies';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

function generateHtmlHead(title: string, description: string, canonicalUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
  <link rel="apple-touch-icon" href="/icon-192.png">
  <style>
    :root {
      --primary: #2563eb;
      --primary-dark: #1d4ed8;
      --text-main: #0f172a;
      --text-muted: #475569;
      --bg-page: #f8fafc;
      --bg-card: #ffffff;
      --border-color: #e2e8f0;
      --accent: #facc15;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.65;
      color: var(--text-main);
      background-color: var(--bg-page);
      -webkit-font-smoothing: antialiased;
      padding-bottom: 60px;
    }
    .top-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 14px 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-size: 13px;
      border-bottom: 2px solid #3b82f6;
    }
    .top-banner a {
      color: #60a5fa;
      text-decoration: none;
      font-weight: 600;
    }
    .top-banner a:hover {
      text-decoration: underline;
    }
    .container {
      max-width: 960px;
      margin: 32px auto;
      padding: 0 20px;
    }
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 36px;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
      margin-bottom: 24px;
    }
    @media (max-width: 640px) {
      .card {
        padding: 20px;
      }
    }
    .doc-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 6px 12px;
      border-radius: 9999px;
      border: 1px solid #bfdbfe;
      margin-bottom: 16px;
    }
    .doc-badge.terms {
      background: #faf5ff;
      color: #7e22ce;
      border-color: #e9d5ff;
    }
    h1 {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #0f172a;
      line-height: 1.25;
      margin-bottom: 12px;
    }
    @media (max-width: 640px) {
      h1 { font-size: 24px; }
    }
    .doc-sub {
      font-size: 16px;
      color: var(--text-muted);
      margin-bottom: 24px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      background: #f1f5f9;
      padding: 20px;
      border-radius: 12px;
      font-size: 13px;
      margin-bottom: 32px;
    }
    .meta-item strong {
      display: block;
      color: #64748b;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
    }
    .meta-item span {
      color: #0f172a;
      font-weight: 600;
      word-break: break-word;
    }
    .package-tag {
      background: #e2e8f0;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
    }
    h2 {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 36px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    h3 {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin-top: 20px;
      margin-bottom: 8px;
    }
    p {
      margin-bottom: 14px;
      color: #334155;
      font-size: 14.5px;
    }
    ul, ol {
      margin-left: 20px;
      margin-bottom: 16px;
      color: #334155;
      font-size: 14px;
    }
    li {
      margin-bottom: 6px;
    }
    .table-container {
      overflow-x: auto;
      margin: 16px 0 24px;
      border: 1px solid var(--border-color);
      border-radius: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13.5px;
      text-align: left;
    }
    th {
      background: #f8fafc;
      padding: 12px 14px;
      font-weight: 700;
      color: #475569;
      border-bottom: 1px solid var(--border-color);
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
    }
    td {
      padding: 12px 14px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
      color: #334155;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .highlight-box {
      background: #eff6ff;
      border-left: 4px solid #2563eb;
      padding: 16px 20px;
      border-radius: 0 10px 10px 0;
      margin: 20px 0;
      font-size: 14px;
    }
    .highlight-box.warning {
      background: #fffbeb;
      border-left-color: #f59e0b;
    }
    .highlight-box.alert {
      background: #fef2f2;
      border-left-color: #ef4444;
    }
    .btn-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 24px 0 12px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease;
      border: 1px solid transparent;
    }
    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }
    .btn-secondary {
      background: #ffffff;
      color: #334155;
      border-color: #cbd5e1;
    }
    .btn-secondary:hover {
      background: #f1f5f9;
    }
    .app-nav {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    .app-nav-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-right: 8px;
    }
    .app-nav a {
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 6px;
      text-decoration: none;
      color: #475569;
      background: #f1f5f9;
      transition: background 0.15s ease;
    }
    .app-nav a:hover, .app-nav a.active {
      background: #2563eb;
      color: #ffffff;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #64748b;
      margin-top: 40px;
      line-height: 1.8;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .top-banner, .btn-row, .app-nav, .no-print { display: none !important; }
      .card { border: none; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="top-banner">
    <div>
      <strong>Local Bandi Multi Services</strong> &bull; Official Google Play Compliance Portal
    </div>
    <div>
      <a href="/legal.html">Browse All 5 App Policies &rarr;</a>
    </div>
  </div>

  <div class="container">
`;
}

function generateHtmlFooter(): string {
  return `
    <div class="footer no-print">
      <p>&copy; 2026 ${LEGAL_ENTITIES.companyName}. All Rights Reserved.</p>
      <p>Official Grievance Officer: ${LEGAL_ENTITIES.grievanceOfficer} &bull; Email: <a href="mailto:${LEGAL_ENTITIES.contactEmail}">${LEGAL_ENTITIES.contactEmail}</a></p>
      <p style="margin-top: 8px;">
        <a href="/privacy-customer.html">Customer</a> &bull; 
        <a href="/privacy-delivery.html">Delivery</a> &bull; 
        <a href="/privacy-vendor.html">Vendor</a> &bull; 
        <a href="/privacy-branch.html">Branch Admin</a> &bull; 
        <a href="/privacy-admin.html">Master Admin</a> &bull;
        <a href="/legal.html">Compliance Hub</a>
      </p>
    </div>
  </div>

  <script>
    function copyCurrentUrl() {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert("Policy URL copied to clipboard for Google Play Console submission!");
      }).catch(() => {
        prompt("Copy this URL for Google Play Console:", window.location.href);
      });
    }
  </script>
</body>
</html>`;
}

function generateAppNav(currentAppKey: string, currentDoc: 'privacy' | 'terms'): string {
  const apps = [
    { key: 'customer', name: 'Customer App', priv: '/privacy-customer.html', term: '/terms-customer.html' },
    { key: 'delivery', name: 'Delivery Partner', priv: '/privacy-delivery.html', term: '/terms-delivery.html' },
    { key: 'vendor', name: 'Vendor App', priv: '/privacy-vendor.html', term: '/terms-vendor.html' },
    { key: 'branch', name: 'Branch Admin', priv: '/privacy-branch.html', term: '/terms-branch.html' },
    { key: 'admin', name: 'Master Admin', priv: '/privacy-admin.html', term: '/terms-admin.html' }
  ];

  return `
  <div class="app-nav no-print">
    <span class="app-nav-title">Select App:</span>
    ${apps.map(a => {
      const href = currentDoc === 'privacy' ? a.priv : a.term;
      const isActive = a.key === currentAppKey ? 'class="active"' : '';
      return `<a href="${href}" ${isActive}>${a.name}</a>`;
    }).join(' ')}
  </div>
  `;
}

// Generate Privacy Policy HTML for a single app
function generatePrivacyHtml(app: AppLegalDocument): string {
  const title = `${app.appName} - Privacy Policy | Local Bandi`;
  const desc = `Official Google Play Privacy Policy for ${app.appName} (${app.packageId}). Details data collection, GPS location, device storage, encryption, and account deletion policies.`;
  const canonicalUrl = `https://localbandimultiservices.in/privacy-${app.appKey}.html`;

  let content = generateHtmlHead(title, desc, canonicalUrl);
  content += generateAppNav(app.appKey, 'privacy');

  content += `
  <div class="card">
    <div class="doc-badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      Google Play Store Privacy Disclosure
    </div>

    <h1>${app.appName}</h1>
    <p class="doc-sub">Comprehensive Privacy Policy & Data Safety Declaration</p>

    <div class="meta-grid">
      <div class="meta-item">
        <strong>Application Role</strong>
        <span>${app.targetRole}</span>
      </div>
      <div class="meta-item">
        <strong>Android Package ID</strong>
        <span><span class="package-tag">${app.packageId}</span></span>
      </div>
      <div class="meta-item">
        <strong>Operating Entity</strong>
        <span>${LEGAL_ENTITIES.companyName}</span>
      </div>
      <div class="meta-item">
        <strong>Effective Date</strong>
        <span>${app.effectiveDate}</span>
      </div>
      <div class="meta-item">
        <strong>Last Updated</strong>
        <span>${app.lastUpdated}</span>
      </div>
      <div class="meta-item">
        <strong>Contact Email</strong>
        <span>${LEGAL_ENTITIES.contactEmail}</span>
      </div>
    </div>

    <div class="btn-row no-print">
      <button onclick="copyCurrentUrl()" class="btn btn-primary">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        Copy Link for Play Console
      </button>
      <a href="/terms-${app.appKey}.html" class="btn btn-secondary">
        View Terms &amp; Conditions &rarr;
      </a>
      <button onclick="window.print()" class="btn btn-secondary">
        Print / PDF
      </button>
    </div>

    <div class="highlight-box">
      <strong>Executive Statement:</strong> ${app.privacySummary}
    </div>

    <h2>1. Introduction &amp; Applicability</h2>
    <p>
      This Privacy Policy applies solely to the <strong>${app.appName}</strong> (Package ID: <code>${app.packageId}</code>) operated by <strong>${LEGAL_ENTITIES.companyName}</strong>. 
      It governs how we collect, store, safeguard, and process personal and operational telemetry data in full compliance with the 
      <strong>Google Play Developer Program Policies</strong>, the <strong>Information Technology Act, 2000 (India)</strong>, and the <strong>Digital Personal Data Protection Act (DPDPA)</strong>.
    </p>

    <h2>2. Data Collection by Category</h2>
    <p>Below is an itemized breakdown of all data collected through the <strong>${app.shortName}</strong> application:</p>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Data Category</th>
            <th>Specific Data Points Collected</th>
            <th>Primary Purpose &amp; Usage</th>
            <th>Optional / Mandatory</th>
            <th>Third-Party Processing</th>
          </tr>
        </thead>
        <tbody>
          ${app.dataCollection.map(dc => `
            <tr>
              <td><strong>${dc.category}</strong></td>
              <td>
                <ul style="margin: 0; padding-left: 14px; font-size: 12.5px;">
                  ${dc.dataPoints.map(dp => `<li>${dp}</li>`).join('')}
                </ul>
              </td>
              <td>${dc.purpose}</td>
              <td><span style="font-weight: 600; color: ${dc.isOptional ? '#10b981' : '#2563eb'}">${dc.isOptional ? 'Optional' : 'Mandatory'}</span></td>
              <td>${dc.sharedWithThirdParties ? '<span style="color:#f59e0b;font-weight:600;">Yes (Encrypted)</span>' : '<span style="color:#64748b;">No (Internal Only)</span>'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <h2>3. Android Sensitive Permissions Prominent Disclosures</h2>
    <p>In accordance with Google Play's Prominent Disclosure and User Consent requirements, here are the permissions required for core app functionality:</p>
    
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Android Permission</th>
            <th>Technical Description</th>
            <th>Prominent User Disclosure &amp; Justification</th>
          </tr>
        </thead>
        <tbody>
          ${app.permissionsUsed.map(p => `
            <tr>
              <td><code>${p.permission}</code></td>
              <td>${p.description}</td>
              <td>${p.rationale}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <h2>4. Data Storage, Retention &amp; Anonymization</h2>
    <p>We maintain strict retention limitations and military-grade cloud encryption:</p>
    <ul>
      <li><strong>Storage Infrastructure:</strong> ${app.storageAndRetention.storageProvider}</li>
      <li><strong>Encryption at Rest:</strong> ${app.storageAndRetention.encryptionAtRest}</li>
      <li><strong>Encryption in Transit:</strong> ${app.storageAndRetention.encryptionInTransit}</li>
      <li><strong>Data Retention Policy:</strong> ${app.storageAndRetention.retentionPolicy}</li>
      <li><strong>Data Anonymization:</strong> ${app.storageAndRetention.anonymization}</li>
    </ul>

    <h2>5. Technical Security Safeguards</h2>
    <p>We implement layered technical and organizational security controls to protect user data against unauthorized access, loss, or manipulation:</p>
    <ul>
      ${app.securityMeasures.map(sm => `<li>${sm}</li>`).join('')}
    </ul>

    <h2>6. Purpose Limitation &amp; Data Usage Policies</h2>
    <p>Our commitment to user privacy and ethical data handling:</p>
    <ul>
      ${app.usagePolicies.map(up => `<li>${up}</li>`).join('')}
    </ul>
    <div class="highlight-box alert">
      <strong>Zero Data Brokerage Guarantee:</strong> Local Bandi does NOT sell, rent, monetize, or trade personal data, customer contacts, merchant pricing secrets, or delivery partner tracking data with third-party data aggregators or advertising networks under any circumstances.
    </div>

    <h2>7. Third-Party Service Providers</h2>
    <p>We work with trusted industry leaders to deliver core application infrastructure. All data sharing is conducted over encrypted channels with zero data-scraping permissions:</p>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Service Provider</th>
            <th>Purpose</th>
            <th>Privacy Policy Reference</th>
          </tr>
        </thead>
        <tbody>
          ${app.thirdPartyServices.map(tp => `
            <tr>
              <td><strong>${tp.name}</strong></td>
              <td>${tp.purpose}</td>
              <td><a href="${tp.policyUrl}" target="_blank" rel="noopener noreferrer">${tp.policyUrl}</a></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <h2>8. Google Play Mandatory Data &amp; Account Deletion</h2>
    <p>
      In accordance with Google Play's 2024+ User Data Policy on Account Deletion, all registered users have the absolute right to request permanent deletion of their account and associated personal data.
    </p>

    <div class="highlight-box warning">
      <h3>In-App Deletion Procedure:</h3>
      <ol style="margin-left: 20px; font-size: 13.5px;">
        ${app.dataDeletionProcedure.inAppSteps.map(st => `<li>${st}</li>`).join('')}
      </ol>
      <h3 style="margin-top: 14px;">Direct Email Deletion Request:</h3>
      <p style="margin-bottom: 6px;">${app.dataDeletionProcedure.emailProcedure}</p>
      <p style="margin-bottom: 6px;"><strong>Scrubbing Timeline:</strong> ${app.dataDeletionProcedure.timeline}</p>
      <p style="margin-bottom: 0;"><strong>Legal Retention Exceptions:</strong> ${app.dataDeletionProcedure.retentionExceptions}</p>
    </div>

    <h2>9. Children's Privacy</h2>
    <p>
      The <strong>${app.appName}</strong> is not directed at or designed for children under 13 years of age (or under 18 years for commercial delivery and merchant operation). 
      We do not knowingly collect personal information from minors. If we discover that a minor has provided us with personal information without parental consent, we will delete such data immediately from our servers.
    </p>

    <h2>10. Updates &amp; Amendments</h2>
    <p>
      We may periodically update this Privacy Policy to reflect app feature additions, platform improvements, or statutory regulatory updates. 
      Any revisions will be posted directly to this URL with a refreshed "Last Updated" date. Continued use of the application following the posting of modifications indicates your acknowledgement of the revised terms.
    </p>

    <h2>11. Grievance Redressal &amp; Compliance Officer</h2>
    <p>
      For any inquiries, questions regarding this policy, requests to exercise your data rights, or statutory regulatory communications, please contact our designated Grievance Officer:
    </p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; font-size: 13.5px;">
      <p style="margin-bottom: 4px;"><strong>Grievance Officer:</strong> ${LEGAL_ENTITIES.grievanceOfficer}</p>
      <p style="margin-bottom: 4px;"><strong>Company:</strong> ${LEGAL_ENTITIES.companyName}</p>
      <p style="margin-bottom: 4px;"><strong>Official Email:</strong> <a href="mailto:${LEGAL_ENTITIES.contactEmail}">${LEGAL_ENTITIES.contactEmail}</a></p>
      <p style="margin-bottom: 4px;"><strong>Support Desk:</strong> <a href="mailto:${LEGAL_ENTITIES.supportEmail}">${LEGAL_ENTITIES.supportEmail}</a></p>
      <p style="margin-bottom: 0;"><strong>Office Address:</strong> ${LEGAL_ENTITIES.grievanceAddress}</p>
    </div>
  </div>
  `;

  content += generateHtmlFooter();
  return content;
}

// Generate Terms and Conditions HTML for a single app
function generateTermsHtml(app: AppLegalDocument): string {
  const title = `${app.appName} - Terms and Conditions | Local Bandi`;
  const desc = `Official Terms of Service and Operational Agreement for ${app.appName} (${app.packageId}).`;
  const canonicalUrl = `https://localbandimultiservices.in/terms-${app.appKey}.html`;

  let content = generateHtmlHead(title, desc, canonicalUrl);
  content += generateAppNav(app.appKey, 'terms');

  content += `
  <div class="card">
    <div class="doc-badge terms">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
      Official Operational Agreement &amp; Terms of Service
    </div>

    <h1>${app.appName}</h1>
    <p class="doc-sub">Master Terms of Service &amp; User Agreement</p>

    <div class="meta-grid">
      <div class="meta-item">
        <strong>App Role</strong>
        <span>${app.targetRole}</span>
      </div>
      <div class="meta-item">
        <strong>Android Package ID</strong>
        <span><span class="package-tag">${app.packageId}</span></span>
      </div>
      <div class="meta-item">
        <strong>Operating Entity</strong>
        <span>${LEGAL_ENTITIES.companyName}</span>
      </div>
      <div class="meta-item">
        <strong>Effective Date</strong>
        <span>${app.effectiveDate}</span>
      </div>
      <div class="meta-item">
        <strong>Version</strong>
        <span>${app.version}</span>
      </div>
      <div class="meta-item">
        <strong>Grievance Email</strong>
        <span>${LEGAL_ENTITIES.contactEmail}</span>
      </div>
    </div>

    <div class="btn-row no-print">
      <button onclick="copyCurrentUrl()" class="btn btn-primary">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        Copy Link for Play Console
      </button>
      <a href="/privacy-${app.appKey}.html" class="btn btn-secondary">
        View Privacy Policy &rarr;
      </a>
      <button onclick="window.print()" class="btn btn-secondary">
        Print / PDF
      </button>
    </div>

    <div class="highlight-box">
      <strong>Terms Summary:</strong> ${app.termsSummary}
    </div>

    <h2>1. Agreement to Terms</h2>
    <p>
      By downloading, installing, logging in, or operating the <strong>${app.appName}</strong> (Package ID: <code>${app.packageId}</code>), 
      you enter into a legally binding contract with <strong>${LEGAL_ENTITIES.companyName}</strong>. If you do not agree with any of these terms, 
      you must immediately discontinue using the application and uninstall it from your device.
    </p>

    <h2>2. Eligibility &amp; Account Obligations</h2>
    <ul>
      <li>You must possess the legal capacity to enter into binding agreements under applicable Indian laws.</li>
      <li>All information provided during onboarding (such as phone number, identity credentials, business registration, or banking details) must be genuine, true, and up to date.</li>
      <li>You are strictly responsible for maintaining the confidentiality of your authentication OTPs and session tokens. You must immediately notify Local Bandi if you suspect any unauthorized account access.</li>
    </ul>

    <h2>3. Application-Specific Operational Terms</h2>
    ${app.termsHighlights.map((th, idx) => `
      <h3>3.${idx + 1}. ${th.sectionTitle}</h3>
      <p>${th.content}</p>
      <ul>
        ${th.clauses.map(c => `<li>${c}</li>`).join('')}
      </ul>
    `).join('')}

    <h2>4. Intellectual Property Rights</h2>
    <p>
      The Local Bandi name, trademark, logos, user interfaces, proprietary software architecture, algorithms, and source code are the sole property of 
      <strong>${LEGAL_ENTITIES.companyName}</strong>. You are granted a limited, non-exclusive, non-transferable, revocable license to access the application solely for authorized platform use.
      Reverse engineering, decompiling, or scraping platform data is strictly prohibited and subject to civil and criminal penalties under the Information Technology Act, 2000.
    </p>

    <h2>5. Limitation of Liability &amp; Disclaimers</h2>
    <p>
      The platform services are provided on an "as is" and "as available" basis without warranties of any kind. 
      To the maximum extent permitted by law, ${LEGAL_ENTITIES.companyName} disclaims all warranties, express or implied. 
      In no event shall Local Bandi or its directors, founders, or officers be liable for indirect, incidental, punitive, or consequential damages resulting from app downtime, third-party network outages, road traffic delays, or unauthorized account access.
    </p>

    <h2>6. Termination of Access</h2>
    <p>
      Local Bandi reserves the right to suspend, freeze, or terminate your access to the <strong>${app.appName}</strong> at any time, with or without notice, in the event of:
    </p>
    <ul>
      <li>Violation of these Terms and Conditions or applicable laws.</li>
      <li>Fraudulent activity, GPS spoofing, or manipulation of order fulfillment.</li>
      <li>Customer harassment, abusive conduct, or failure to remit collected funds.</li>
    </ul>

    <h2>7. Governing Law &amp; Jurisdiction</h2>
    <p>
      These Terms and Conditions shall be governed by and construed in accordance with the laws of the Republic of India. 
      Any legal action, suit, or proceeding arising out of or related to these terms shall be subject to the exclusive jurisdiction of the competent courts located in Telangana / Andhra Pradesh, India.
    </p>

    <h2>8. Grievance Redressal &amp; Legal Notices</h2>
    <p>
      In accordance with Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, legal notices and grievances must be addressed to:
    </p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; font-size: 13.5px;">
      <p style="margin-bottom: 4px;"><strong>Grievance Officer:</strong> ${LEGAL_ENTITIES.grievanceOfficer}</p>
      <p style="margin-bottom: 4px;"><strong>Entity:</strong> ${LEGAL_ENTITIES.companyName}</p>
      <p style="margin-bottom: 4px;"><strong>Email:</strong> <a href="mailto:${LEGAL_ENTITIES.contactEmail}">${LEGAL_ENTITIES.contactEmail}</a></p>
      <p style="margin-bottom: 0;"><strong>Address:</strong> ${LEGAL_ENTITIES.grievanceAddress}</p>
    </div>
  </div>
  `;

  content += generateHtmlFooter();
  return content;
}

// Generate Unified Legal Compliance Hub
function generateLegalHubHtml(): string {
  const title = `Local Bandi Multi Services - Legal & Google Play Store Compliance Hub`;
  const desc = `Central legal portal for all 5 Local Bandi applications: Customer, Delivery Partner, Vendor, Branch Admin, and Master Admin. Official Privacy Policies and Terms & Conditions.`;
  const canonicalUrl = `https://localbandimultiservices.in/legal.html`;

  let content = generateHtmlHead(title, desc, canonicalUrl);

  content += `
  <div class="card" style="text-align: center; margin-bottom: 24px;">
    <div class="doc-badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      Local Bandi Legal &amp; Compliance Hub
    </div>
    <h1>5 Applications Legal Compliance Portal</h1>
    <p class="doc-sub" style="max-width: 680px; margin: 0 auto 20px;">
      Official, verified Privacy Policies, Terms &amp; Conditions, and Google Play Store Data Safety Disclosures tailored for each of the five standalone applications in the Local Bandi ecosystem.
    </p>
    <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
      <span class="package-tag">5 Verified Apps</span>
      <span class="package-tag">Google Play 2026 Compliant</span>
      <span class="package-tag">India DPDPA Ready</span>
      <span class="package-tag">PCI-DSS Gateways</span>
    </div>
  </div>

  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 32px;">
    ${Object.values(APP_LEGAL_POLICIES).map(app => `
      <div class="card" style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between; border-top: 4px solid ${app.accentColor};">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;">${app.targetRole}</span>
            <span class="package-tag">${app.appKey}</span>
          </div>
          <h2 style="font-size: 18px; margin: 0 0 8px; border: none; padding: 0;">${app.appName}</h2>
          <p style="font-size: 12.5px; color: #64748b; font-family: monospace; margin-bottom: 12px;">ID: ${app.packageId}</p>
          <p style="font-size: 13.5px; color: #334155; margin-bottom: 18px;">${app.privacySummary}</p>
        </div>
        
        <div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 14px; margin-top: 10px;">
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <a href="/privacy-${app.appKey}.html" class="btn btn-primary" style="justify-content: center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Privacy Policy URL
              </a>
              <a href="/terms-${app.appKey}.html" class="btn btn-secondary" style="justify-content: center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
                Terms &amp; Conditions
              </a>
              <button onclick="navigator.clipboard.writeText(window.location.origin + '/privacy-${app.appKey}.html').then(() => alert('Copied: ' + window.location.origin + '/privacy-${app.appKey}.html'))" class="btn btn-secondary" style="font-size: 11px; justify-content: center;">
                Copy Play Store URL
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('')}
  </div>

  <div class="card">
    <h2>Google Play Console Quick Links Summary Table</h2>
    <p>Below are the exact public URLs for each application to paste directly into the Google Play Console under <strong>Policy and programs &gt; Privacy policy</strong>:</p>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Application</th>
            <th>Package ID</th>
            <th>Direct Privacy Policy URL</th>
            <th>Terms &amp; Conditions URL</th>
          </tr>
        </thead>
        <tbody>
          ${Object.values(APP_LEGAL_POLICIES).map(app => `
            <tr>
              <td><strong>${app.appName}</strong></td>
              <td><code>${app.packageId}</code></td>
              <td><a href="/privacy-${app.appKey}.html" target="_blank">/privacy-${app.appKey}.html</a></td>
              <td><a href="/terms-${app.appKey}.html" target="_blank">/terms-${app.appKey}.html</a></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
  `;

  content += generateHtmlFooter();
  return content;
}

// Generate all files
function buildAllPages() {
  console.log('Generating Google Play Compliance HTML pages in /public...');

  for (const [key, app] of Object.entries(APP_LEGAL_POLICIES)) {
    const privHtml = generatePrivacyHtml(app);
    const privPath = path.join(publicDir, `privacy-${key}.html`);
    fs.writeFileSync(privPath, privHtml, 'utf8');
    console.log(`Generated: ${privPath}`);

    const termsHtml = generateTermsHtml(app);
    const termsPath = path.join(publicDir, `terms-${key}.html`);
    fs.writeFileSync(termsPath, termsHtml, 'utf8');
    console.log(`Generated: ${termsPath}`);
  }

  // Master legal hub
  const hubHtml = generateLegalHubHtml();
  const hubPath = path.join(publicDir, 'legal.html');
  fs.writeFileSync(hubPath, hubHtml, 'utf8');
  console.log(`Generated: ${hubPath}`);

  console.log('All 11 Google Play Compliance HTML pages successfully generated!');
}

buildAllPages();
