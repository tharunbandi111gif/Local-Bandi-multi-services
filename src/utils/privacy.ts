/**
 * Privacy & Data Protection Utilities
 * Ensures phone numbers, emails, and sensitive identifiers are masked
 * across client interfaces, activity tracking, and audit dashboards.
 */

export function maskPhone(phone?: string | null): string {
  if (!phone) return '••••••••••';
  const clean = phone.replace(/\s+/g, '');
  if (clean.length <= 4) return '••••';
  
  // Format with country code if present (+91)
  if (clean.startsWith('+91')) {
    const raw = clean.slice(3);
    if (raw.length === 10) {
      return `+91 ${raw.slice(0, 2)}••••••${raw.slice(-2)}`;
    }
  }

  if (clean.length === 10) {
    return `${clean.slice(0, 2)}••••••${clean.slice(-2)}`;
  }

  // Generic masking: keep first 2 and last 2 characters
  const visiblePrefix = clean.slice(0, 2);
  const visibleSuffix = clean.slice(-2);
  const maskLength = Math.max(clean.length - 4, 4);
  return `${visiblePrefix}${'•'.repeat(maskLength)}${visibleSuffix}`;
}

export function maskEmail(email?: string | null): string {
  if (!email) return '••••••@••••';
  const parts = email.split('@');
  if (parts.length !== 2) return '••••@••••';

  const [username, domain] = parts;
  if (username.length <= 2) {
    return `${username[0]}•@${domain}`;
  }

  const prefix = username.slice(0, 2);
  const suffix = username.slice(-1);
  const maskedUsername = `${prefix}${'•'.repeat(Math.max(username.length - 3, 3))}${suffix}`;
  
  // Mask domain name partially if longer than 4 chars
  const domainParts = domain.split('.');
  if (domainParts.length >= 2) {
    const domainName = domainParts[0];
    const tld = domainParts.slice(1).join('.');
    const maskedDomain = domainName.length > 3
      ? `${domainName.slice(0, 1)}${'•'.repeat(domainName.length - 2)}${domainName.slice(-1)}.${tld}`
      : domain;
    return `${maskedUsername}@${maskedDomain}`;
  }

  return `${maskedUsername}@${domain}`;
}

export interface ActivityLogEntry {
  id?: string;
  eventType: 'login' | 'logout' | 'order_created' | 'order_status_change' | 'payment' | 'vendor_approval' | 'rider_approval' | 'service_toggle';
  userId?: string;
  maskedUserIdentifier: string;
  role?: string;
  branchId?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export function createPrivacySafeActivityLog(
  eventType: ActivityLogEntry['eventType'],
  user: { uid?: string; email?: string; phone?: string; role?: string } | null,
  metadata: Record<string, any> = {}
): ActivityLogEntry {
  const identifier = user?.phone 
    ? maskPhone(user.phone) 
    : user?.email 
      ? maskEmail(user.email) 
      : 'Anonymous User';

  // Scrub any sensitive data from metadata
  const sanitizedMeta: Record<string, any> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'string') {
      if (key.toLowerCase().includes('phone')) {
        sanitizedMeta[key] = maskPhone(value);
      } else if (key.toLowerCase().includes('email')) {
        sanitizedMeta[key] = maskEmail(value);
      } else if (key.toLowerCase().includes('pass') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('key')) {
        sanitizedMeta[key] = '••••••••';
      } else {
        sanitizedMeta[key] = value;
      }
    } else {
      sanitizedMeta[key] = value;
    }
  }

  return {
    eventType,
    userId: user?.uid ? `usr_${user.uid.slice(0, 8)}...` : undefined,
    maskedUserIdentifier: identifier,
    role: user?.role || 'user',
    timestamp: Date.now(),
    metadata: sanitizedMeta
  };
}
