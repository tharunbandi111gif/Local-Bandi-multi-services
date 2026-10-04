export interface DataFieldPolicy {
  category: string;
  dataPoints: string[];
  purpose: string;
  isOptional: boolean;
  sharedWithThirdParties: boolean;
}

export interface AppLegalDocument {
  appKey: 'customer' | 'delivery' | 'vendor' | 'branch' | 'admin';
  appName: string;
  shortName: string;
  packageId: string;
  playStoreTitle: string;
  targetRole: string;
  effectiveDate: string;
  lastUpdated: string;
  version: string;
  privacySummary: string;
  termsSummary: string;
  accentColor: string;
  
  // Specific data collection modules
  dataCollection: DataFieldPolicy[];
  
  // Specific Google Play Sensitive Permissions
  permissionsUsed: {
    permission: string;
    description: string;
    rationale: string;
  }[];
  
  // Storage & Security
  storageAndRetention: {
    storageProvider: string;
    encryptionAtRest: string;
    encryptionInTransit: string;
    retentionPolicy: string;
    anonymization: string;
  };
  
  // Security Measures
  securityMeasures: string[];
  
  // Data Usage Policies
  usagePolicies: string[];
  
  // Third-party processors
  thirdPartyServices: {
    name: string;
    purpose: string;
    policyUrl: string;
  }[];
  
  // Account & Data Deletion
  dataDeletionProcedure: {
    inAppSteps: string[];
    emailProcedure: string;
    retentionExceptions: string;
    timeline: string;
  };
  
  // Terms & Conditions Highlights
  termsHighlights: {
    sectionTitle: string;
    content: string;
    clauses: string[];
  }[];
}

export const LEGAL_ENTITIES = {
  companyName: "Local Bandi Multi Services Private Limited",
  brandName: "Local Bandi",
  tradeMark: "Local Bandi® Multi Services",
  contactEmail: "tharunbandi111@gmail.com",
  supportEmail: "support@localbandi.app",
  grievanceOfficer: "Tharun Bandi",
  grievanceAddress: "Local Bandi Multi Services Pvt. Ltd., Legal Compliance & Grievance Division, Telangana / Andhra Pradesh, India",
  effectiveDate: "September 25, 2026",
  lastUpdated: "September 25, 2026",
  websiteUrl: "https://localbandimultiservices.in"
};

export const APP_LEGAL_POLICIES: Record<string, AppLegalDocument> = {
  // ==========================================
  // 1. DELIVERY BOYS APP (DELIVERY PARTNER)
  // ==========================================
  delivery: {
    appKey: 'delivery',
    appName: "Local Bandi - Delivery Partner App",
    shortName: "Delivery Partner",
    packageId: "com.localbandi.delivery",
    playStoreTitle: "Local Bandi Delivery Partner (Rider)",
    targetRole: "Independent Delivery Contractors, Fleet Riders & Logistics Partners",
    effectiveDate: "September 25, 2026",
    lastUpdated: "September 25, 2026",
    version: "2.4.0-play",
    accentColor: "#2563eb", // blue-600
    privacySummary: "This Privacy Policy governs the collection, background GPS telemetry, device diagnostic data, financial earnings records, and strict data protection practices for delivery executives registered on the Local Bandi platform.",
    termsSummary: "These Terms and Conditions constitute an independent contractor agreement defining courier performance SLAs, roadside safety, cash-on-delivery handling, customer confidentiality, and payout mechanics.",
    
    dataCollection: [
      {
        category: "Precise & Background Geolocation",
        dataPoints: [
          "Continuous high-accuracy GPS coordinates (latitude, longitude, altitude)",
          "Background location tracking when app is minimized or phone screen is locked",
          "Movement velocity, heading, and transit acceleration metrics",
          "Timestamped check-ins at vendor storefront and customer doorstep"
        ],
        purpose: "Essential for assigning nearest orders, computing optimal route directions, showing live arrival ETA to customers and merchants, geofence trip verification, and computing trip distance for payout disbursement.",
        isOptional: false,
        sharedWithThirdParties: true
      },
      {
        category: "Camera, Photos & Documents",
        dataPoints: [
          "Camera capture of Proof of Delivery (POD) photos upon package handoff",
          "Government KYC identification (Driving License, Aadhaar Card, PAN)",
          "Vehicle registration certificate (RC) and insurance copy",
          "Driver profile photo for customer safety verification"
        ],
        purpose: "Mandatory for regulatory onboarding verification, identity confirmation, fraud prevention, and indisputable proof of successful order handoff.",
        isOptional: false,
        sharedWithThirdParties: false
      },
      {
        category: "Device Telemetry & Battery State",
        dataPoints: [
          "Battery percentage and charging status",
          "Device manufacturer, hardware model, Android OS version",
          "Network connectivity type (4G/5G/Wi-Fi) and signal strength",
          "App crash logs and runtime performance traces"
        ],
        purpose: "Prevents dispatching urgent deliveries to devices with low battery (<15%), ensures reliable push notification receipt, and optimizes offline map caching in low-connectivity rural zones.",
        isOptional: false,
        sharedWithThirdParties: false
      },
      {
        category: "Financial & Payout Ledger",
        dataPoints: [
          "Bank account number, Account Holder Name, IFSC code",
          "UPI Virtual Payment Address (VPA) for instant transfers",
          "Cash on Delivery (COD) collection logs and physical cash in hand balance",
          "Trip earnings, customer tips, promotional bonuses, and payout history"
        ],
        purpose: "Enables direct automated bank transfers, daily settlement of earnings, reconciliation of customer cash collections, and statutory tax reporting.",
        isOptional: false,
        sharedWithThirdParties: true
      },
      {
        category: "Telecommunication & Masked Contact",
        dataPoints: [
          "In-app phone call relay metadata (timestamps, call duration)",
          "In-app quick messaging transcripts between rider and customer/vendor"
        ],
        purpose: "Facilitates seamless navigation assistance and delivery coordination while masking real personal phone numbers to ensure rider and customer privacy.",
        isOptional: true,
        sharedWithThirdParties: true
      }
    ],
    
    permissionsUsed: [
      {
        permission: "ACCESS_BACKGROUND_LOCATION & ACCESS_FINE_LOCATION",
        description: "Continuous real-time GPS tracking during active shift hours.",
        rationale: "Google Play Prominent Disclosure: Local Bandi Delivery collects location data to enable live route tracking, calculate customer ETA, and assign nearby orders even when the app is closed or not in use, provided the rider is in 'Online' shift status."
      },
      {
        permission: "CAMERA",
        description: "Taking live photos of packages at delivery location and scanning QR codes.",
        rationale: "Required to record doorstep Proof of Delivery (POD) and scan merchant invoice QR codes."
      },
      {
        permission: "READ_MEDIA_IMAGES / READ_EXTERNAL_STORAGE",
        description: "Uploading KYC identity documents and vehicle papers.",
        rationale: "Required for driver partner onboarding, verification of driving eligibility, and license updates."
      },
      {
        permission: "POST_NOTIFICATIONS",
        description: "Real-time high-priority alerts for new order broadcasts.",
        rationale: "Required to notify riders of incoming pickup requests within their immediate radius."
      },
      {
        permission: "WAKE_LOCK & FOREGROUND_SERVICE_LOCATION",
        description: "Keeps navigation and GPS telemetry active during ongoing deliveries.",
        rationale: "Ensures delivery status and trip recording are not interrupted when the screen turns off during riding."
      }
    ],
    
    storageAndRetention: {
      storageProvider: "Google Cloud Firestore & Google Cloud Storage (Mumbai & Singapore Regions)",
      encryptionAtRest: "AES-256 military-grade disk and database encryption",
      encryptionInTransit: "TLS 1.3 / HTTPS with HSTS enforced",
      retentionPolicy: "Location track pings are retained for 90 days for dispute audit and safety compliance, after which they are aggregated into anonymized transit metrics. Financial ledgers are preserved for 7 years as mandated by Indian taxation laws.",
      anonymization: "Personal identifiers and customer delivery drop coordinates are scrubbed after order fulfillment cycle completion."
    },
    
    securityMeasures: [
      "Hardware-backed tokenized session management with automatic invalidation upon device change.",
      "Strict Firebase Security Rules ensuring delivery personnel can only query orders explicitly assigned to their driver ID.",
      "Anti-GPS-spoofing heuristics and mock-location detection to prevent dispatch manipulation.",
      "Masked customer contact numbers to prevent persistent personal data retention on rider phones.",
      "End-to-end audit trails for all cash handovers and digital wallet debits."
    ],
    
    usagePolicies: [
      "Location data is utilized solely for order matching, route navigation, and delivery proof.",
      "We strictly DO NOT sell, lease, or monetize delivery partner telematics or personal details with marketing brokers.",
      "Financial data is transmitted through encrypted RBI-compliant banking gateways for settlement.",
      "Riders have the unrestricted right to toggle 'Go Offline', instantly terminating all background location polling."
    ],
    
    thirdPartyServices: [
      {
        name: "Google Maps Platform",
        purpose: "Turn-by-turn navigation, geocoding, distance matrix calculation",
        policyUrl: "https://policies.google.com/privacy"
      },
      {
        name: "Firebase Cloud Messaging (Google)",
        purpose: "Instant push notification of order broadcasts",
        policyUrl: "https://firebase.google.com/support/privacy"
      },
      {
        name: "Razorpay / Cashfree Payments",
        purpose: "Automated payout disbursements and bank account validation",
        policyUrl: "https://razorpay.com/privacy/"
      }
    ],
    
    dataDeletionProcedure: {
      inAppSteps: [
        "Open Delivery Partner App -> Navigate to Profile tab.",
        "Select 'Partner Settings' -> Scroll to 'Security & Privacy'.",
        "Tap 'Request Account Closure & Data Erasure'.",
        "Confirm OTP verification. Your profile will be deactivated immediately."
      ],
      emailProcedure: "Email Tharun Bandi (Grievance Officer) at tharunbandi111@gmail.com with subject 'Delivery Partner Account Deletion - [Registered Phone Number]'. Deletion is completed within 7 business days.",
      retentionExceptions: "Regulatory transaction logs, tax invoices, and closed dispute records are maintained for statutory periods under the Indian Income Tax Act 1961.",
      timeline: "Personal data, selfie photos, vehicle photos, and location history are permanently scrubbed within 30 calendar days."
    },
    
    termsHighlights: [
      {
        sectionTitle: "Independent Contractor Relationship",
        content: "The delivery partner operates as an independent contractor and not as an employee of Local Bandi. Nothing in this agreement creates a partnership, joint venture, or agency relationship.",
        clauses: [
          "Delivery partners have the autonomy to choose when to log online and accept delivery dispatches.",
          "Partners are responsible for their own vehicle maintenance, fuel, statutory vehicle insurance, and valid driving license.",
          "Local Bandi provides platform dispatch mediation and fee collection services."
        ]
      },
      {
        sectionTitle: "Roadside Safety & Code of Conduct",
        content: "Safety and ethics are paramount during all fulfillment activities.",
        clauses: [
          "Riders must wear protective helmets and strictly adhere to all Motor Vehicles Act regulations.",
          "Zero tolerance policy for operating under the influence of alcohol or prohibited substances.",
          "Riders must maintain polite, professional behavior with merchant staff and end customers."
        ]
      },
      {
        sectionTitle: "Cash on Delivery (COD) & Wallet Settlement",
        content: "Management of physical cash collected from customers during COD deliveries.",
        clauses: [
          "All cash collected on behalf of merchants must be deposited or reconciled into the platform within 24 hours.",
          "Failure to remit collected COD funds constitutes a material breach and triggers automated account freezing.",
          "Delivery fees and tips are disbursed on a daily/weekly cycle directly to the registered bank account."
        ]
      },
      {
        sectionTitle: "Customer Privacy & Confidentiality",
        content: "Protection of consumer personal identifiable information.",
        clauses: [
          "Delivery partners are strictly prohibited from copying, saving, or sharing customer phone numbers or delivery addresses.",
          "Contacting a customer after an order has been completed for any reason is grounds for immediate lifetime termination and legal prosecution."
        ]
      }
    ]
  },

  // ==========================================
  // 2. CUSTOMER APP
  // ==========================================
  customer: {
    appKey: 'customer',
    appName: "Local Bandi - Customer App",
    shortName: "Customer",
    packageId: "com.localbandi.customer",
    playStoreTitle: "Local Bandi Multi Services: Groceries, Food & Care",
    targetRole: "End Consumers, Shoppers, Service Seekers & Patients",
    effectiveDate: "September 25, 2026",
    lastUpdated: "September 25, 2026",
    version: "2.4.0-play",
    accentColor: "#facc15", // yellow-400 / amber
    privacySummary: "This Privacy Policy details how Local Bandi collects, safeguards, and responsibly utilizes customer information when browsing local stores, ordering groceries/food, scheduling appointments, or booking home services.",
    termsSummary: "These Terms and Conditions govern your access to the Local Bandi consumer marketplace, ordering procedures, refund policies, payment guarantees, and community standards.",
    
    dataCollection: [
      {
        category: "Personal Identification & Contact",
        dataPoints: [
          "Full Name and Mobile Phone Number (OTP verified)",
          "Email Address for invoices and delivery confirmations",
          "Profile photo (optional, user uploaded)",
          "Communication preferences and preferred display language"
        ],
        purpose: "Creates your authenticated account, delivers order tracking updates via SMS/WhatsApp/Push, and transmits legal tax receipts.",
        isOptional: false,
        sharedWithThirdParties: false
      },
      {
        category: "Delivery Addresses & Geolocation",
        dataPoints: [
          "Saved delivery addresses (Home, Work, Other) with street name and landmark",
          "Precise GPS coordinates pinned on map during checkout",
          "Approximate device location when browsing to filter nearby stores within 5-10 km radius"
        ],
        purpose: "Enables hyperlocal merchant discovery, calculates accurate delivery distances, and guides delivery riders directly to your doorstep.",
        isOptional: false,
        sharedWithThirdParties: true
      },
      {
        category: "Order, Cart & Transaction History",
        dataPoints: [
          "Items added to cart, purchase history, past receipts",
          "Payment method chosen (UPI, NetBanking, Debit/Credit Card, COD)",
          "Payment gateway transaction reference IDs and payment status"
        ],
        purpose: "Fulfills orders, enables repeat re-ordering, manages customer service disputes, and facilitates automated refunds.",
        isOptional: false,
        sharedWithThirdParties: true
      },
      {
        category: "Healthcare & Special Service Data (Opt-In)",
        dataPoints: [
          "Hospital OP appointment booking details (Patient Name, Age, Department, Date)",
          "Marriage bureau preference criteria (Only if voluntarily engaged in Matrimony module)"
        ],
        purpose: "Enables doctor token registration and matchmaking consultations. Data is encrypted and treated with strict confidentiality.",
        isOptional: true,
        sharedWithThirdParties: true
      },
      {
        category: "Device Identifiers & App Analytics",
        dataPoints: [
          "Device model, operating system, unique device ID",
          "Push notification token (FCM)",
          "Interaction events (search terms, category views, button clicks)"
        ],
        purpose: "Used to detect technical bugs, send real-time order status notifications, and enhance search recommendation relevancy.",
        isOptional: false,
        sharedWithThirdParties: false
      }
    ],
    
    permissionsUsed: [
      {
        permission: "ACCESS_FINE_LOCATION & ACCESS_COARSE_LOCATION",
        description: "Detects your current neighborhood or delivery address.",
        rationale: "Used while the app is in use to list nearby restaurants, vegetable vendors, and grocery stores with exact delivery radius."
      },
      {
        permission: "POST_NOTIFICATIONS",
        description: "Sends live order tracking updates and delivery alerts.",
        rationale: "Alerts you when the merchant accepts your order, when the rider is en route, and when the order arrives."
      },
      {
        permission: "CAMERA / PHOTO_LIBRARY",
        description: "Optional profile picture or custom delivery landmark upload.",
        rationale: "Used only when you choose to take or upload a photo for profile personalization or customer care ticket."
      }
    ],
    
    storageAndRetention: {
      storageProvider: "Google Cloud Firestore (Mumbai Region)",
      encryptionAtRest: "AES-256 encryption on all stored database records",
      encryptionInTransit: "HTTPS / TLS 1.3 cryptographic transport",
      retentionPolicy: "Order records are retained as required by Indian consumer protection and GST regulations. Active customer cart and session caches are refreshed automatically.",
      anonymization: "Search queries and analytics logs are aggregated and unlinked from personal identity."
    },
    
    securityMeasures: [
      "Zero plain-text password architecture; all authentication is verified via secure OTP and cryptographic tokens.",
      "No storage of sensitive financial credentials: Credit/Debit card numbers, CVVs, and UPI PINs are NEVER stored on our servers.",
      "Strict data isolation: Customers can never query or view orders belonging to other platform users.",
      "Automated vulnerability scanning and continuous firewall protection on all API endpoints."
    ],
    
    usagePolicies: [
      "Data is used solely to facilitate consumer purchases, customer support, and delivery tracking.",
      "We strictly DO NOT sell or rent your personal information to third-party advertisers.",
      "You have total control to update your profile, remove saved addresses, or delete your account at any time."
    ],
    
    thirdPartyServices: [
      {
        name: "Google Maps Platform",
        purpose: "Address autocomplete, interactive map view, delivery routing",
        policyUrl: "https://policies.google.com/privacy"
      },
      {
        name: "Razorpay / Cashfree Payments",
        purpose: "RBI-authorized, PCI-DSS Level 1 payment processing",
        policyUrl: "https://razorpay.com/privacy/"
      },
      {
        name: "MSG91 / Fast2SMS",
        purpose: "High-speed transactional SMS OTP delivery",
        policyUrl: "https://msg91.com/privacy-policy"
      }
    ],
    
    dataDeletionProcedure: {
      inAppSteps: [
        "Open Customer App -> Tap on 'Profile' or 'Settings' tab.",
        "Scroll down to 'Privacy & Security'.",
        "Select 'Delete My Account & Personal Data'.",
        "Verify your mobile number via OTP. Your account and active sessions will be terminated immediately."
      ],
      emailProcedure: "Send an email from your registered email ID to tharunbandi111@gmail.com with the subject 'Account Deletion Request - Local Bandi Customer App'.",
      retentionExceptions: "Past invoices, GST tax audit data, and records of fulfilled orders must be retained for the statutory period mandated by law.",
      timeline: "Personal contact details, delivery addresses, and saved preferences are permanently scrubbed within 14 calendar days."
    },
    
    termsHighlights: [
      {
        sectionTitle: "Ordering & Hyperlocal Marketplace Role",
        content: "Local Bandi acts as a technology platform connecting consumers with independent local merchants and freelance delivery executives.",
        clauses: [
          "Item pricing, availability, and preparation quality are the primary responsibility of the respective merchant.",
          "Prices displayed on the platform are determined by vendors and may include applicable taxes and platform convenience fees.",
          "Images of dishes and groceries are for illustrative purposes; actual packaging may vary."
        ]
      },
      {
        sectionTitle: "Cancellation & Refund Policy",
        content: "Fair and transparent refund processes for customers.",
        clauses: [
          "Customers can cancel orders for 100% full refund before the vendor commences food preparation or packing.",
          "Once the merchant accepts the order and food prep starts, cancellations may be subject to a nominal compensation fee for prepared perishables.",
          "Instant UPI refunds are credited back to the source account within 0 to 24 hours. Credit/Debit card refunds appear within 3 to 7 banking days.",
          "If an incorrect, damaged, or spoiled item is delivered, photo proof submitted within 2 hours will initiate immediate replacement or full refund."
        ]
      },
      {
        sectionTitle: "Specialized Services (Hospital OP & Home Services)",
        content: "Terms governing healthcare tokens and home technician dispatches.",
        clauses: [
          "Hospital OP tokens represent appointment queue priority and do not guarantee immediate physician consultation in emergency situations.",
          "Home service technicians (plumbers, electricians) are independent professionals; service guarantees apply as specified per booking card."
        ]
      }
    ]
  },

  // ==========================================
  // 3. VENDOR & MERCHANT APP
  // ==========================================
  vendor: {
    appKey: 'vendor',
    appName: "Local Bandi - Vendor & Merchant App",
    shortName: "Vendor",
    packageId: "com.localbandi.vendor",
    playStoreTitle: "Local Bandi Vendor: Store, Menu & Orders",
    targetRole: "Store Owners, Restaurant Managers, Cloud Kitchens & Service Providers",
    effectiveDate: "September 25, 2026",
    lastUpdated: "September 25, 2026",
    version: "2.4.0-play",
    accentColor: "#10b981", // emerald-500
    privacySummary: "This Privacy Policy governs business data, regulatory food licenses (FSSAI/GST), product catalogs, financial bank settlement information, and operational metrics collected from registered vendors.",
    termsSummary: "These Terms and Conditions constitute a commercial vendor agreement defining merchant catalog standards, food hygiene compliance, order fulfillment SLAs, platform commission structures, and daily bank payouts.",
    
    dataCollection: [
      {
        category: "Business Identification & Statutory Licenses",
        dataPoints: [
          "Legal Business Name, Trade Name, Store Logo, Storefront Photograph",
          "Proprietor / Partner / Director Full Name, Phone, Email",
          "FSSAI Food Safety License Number and certificate copy (for food businesses)",
          "GSTIN Registration Certificate and Business PAN Card",
          "Shop & Establishment License or Trade License"
        ],
        purpose: "Mandatory for regulatory compliance under FSSAI regulations, business identity verification, tax invoicing, and merchant onboarding.",
        isOptional: false,
        sharedWithThirdParties: false
      },
      {
        category: "Store Geolocation & Contact Info",
        dataPoints: [
          "Exact physical store address, landmark, and postal code",
          "Precise latitude and longitude coordinates of store pickup counter",
          "Store operational hours, weekly holidays, and emergency contact numbers"
        ],
        purpose: "Enables discovery on customer app, defines local delivery zones (5-10 KM), and guides delivery riders directly to the pickup counter.",
        isOptional: false,
        sharedWithThirdParties: true
      },
      {
        category: "Banking & Daily Settlement Details",
        dataPoints: [
          "Bank Account Number and Name as per Bank Records",
          "IFSC Code and Branch Name",
          "Cancelled Cheque or Bank Passbook copy for verification",
          "Daily settlement ledger, net sales, platform commission deductions, and tax withholdings"
        ],
        purpose: "Facilitates automated daily/weekly NEFT/IMPS/UPI bank settlements for fulfilled customer orders.",
        isOptional: false,
        sharedWithThirdParties: true
      },
      {
        category: "Catalog, Pricing & Inventory",
        dataPoints: [
          "Product names, categories, descriptions, images, allergen tags",
          "Maximum Retail Price (MRP), discounted selling price, tax slabs",
          "Real-time stock availability toggle (In Stock / Out of Stock)",
          "Estimated food preparation time (prep time in minutes)"
        ],
        purpose: "Publishes your storefront menu on the customer app and calculates realistic delivery estimates.",
        isOptional: false,
        sharedWithThirdParties: true
      },
      {
        category: "Order Fulfillment Telemetry",
        dataPoints: [
          "Order acceptance turnaround time and rejection logs",
          "Food preparation timer adherence",
          "Rider handoff timestamps and OTP verification logs"
        ],
        purpose: "Ensures high fulfillment reliability, monitors delivery pipeline efficiency, and resolves fulfillment disputes.",
        isOptional: false,
        sharedWithThirdParties: false
      }
    ],
    
    permissionsUsed: [
      {
        permission: "ACCESS_FINE_LOCATION & ACCESS_COARSE_LOCATION",
        description: "Verifies the exact storefront GPS coordinates.",
        rationale: "Used during merchant onboarding to accurately pin the merchant location for delivery radius computation."
      },
      {
        permission: "CAMERA",
        description: "Capturing food and product photos, store license certificates.",
        rationale: "Allows merchants to photograph menu items and upload statutory license documents directly from their mobile camera."
      },
      {
        permission: "READ_MEDIA_IMAGES",
        description: "Selecting existing product and menu images from the device gallery.",
        rationale: "Enables merchants to upload branding logos and item catalog photographs."
      },
      {
        permission: "POST_NOTIFICATIONS & AUDIO_WAKE",
        description: "Loud chime notifications for incoming orders.",
        rationale: "Ensures kitchen staff are immediately alerted when a new customer order is placed."
      }
    ],
    
    storageAndRetention: {
      storageProvider: "Google Cloud Firestore & Cloud Storage (India Region)",
      encryptionAtRest: "AES-256 database-level encryption",
      encryptionInTransit: "TLS 1.3 cryptographic transport",
      retentionPolicy: "Business records, tax invoices, and settlement ledgers are retained for 8 years as required by Indian GST and company compliance laws.",
      anonymization: "Customer contact info transmitted for delivery coordination is automatically purged 24 hours post-fulfillment."
    },
    
    securityMeasures: [
      "Role-based access control ensuring merchant staff can only view and manage their assigned store branch.",
      "Bank account details masked on merchant dashboard to prevent unauthorized internal snooping.",
      "Immutable order ledger: once an order is settled, the financial split record cannot be altered retroactively.",
      "Two-factor authentication for bank account updates and critical payout credential changes."
    ],
    
    usagePolicies: [
      "Business and menu catalog data is published publicly to consumers to drive customer discovery and sales.",
      "Financial data is used strictly for bank settlement and tax withholding.",
      "We do not disclose vendor wholesale purchasing secrets or proprietary operational metrics."
    ],
    
    thirdPartyServices: [
      {
        name: "Razorpay / Banking Partners",
        purpose: "Automated vendor settlement disbursements and KYC verification",
        policyUrl: "https://razorpay.com/privacy/"
      },
      {
        name: "Google Cloud Platform",
        purpose: "Cloud data storage and image hosting",
        policyUrl: "https://cloud.google.com/terms/cloud-privacy-notice"
      }
    ],
    
    dataDeletionProcedure: {
      inAppSteps: [
        "Open Vendor App -> Go to Store Settings.",
        "Scroll to 'Merchant Agreement & Account Status'.",
        "Click 'Request Store Offboarding & Deletion'.",
        "Settle all pending orders and COD balances with the platform."
      ],
      emailProcedure: "Submit a formal store closure request to tharunbandi111@gmail.com with your Store ID, Registered Phone Number, and Trade License.",
      retentionExceptions: "GST invoices, completed order receipts, and tax records are retained in compliance with statutory Indian accounting obligations.",
      timeline: "Storefront listing is removed within 24 hours; non-statutory data is scrubbed within 30 days of final ledger settlement."
    },
    
    termsHighlights: [
      {
        sectionTitle: "Food Safety & Quality Compliance",
        content: "Merchants bear full statutory responsibility for the safety and hygiene of products sold.",
        clauses: [
          "Food business operators (FBOs) must hold an active, valid FSSAI license at all times.",
          "Selling expired, adulterated, misbranded, or spoiled items will result in immediate permanent delisting and reporting to regulatory authorities.",
          "Merchants must maintain hygienic food preparation and safe tamper-evident packaging."
        ]
      },
      {
        sectionTitle: "Pricing & Platform Commission",
        content: "Transparent pricing and agreed commission splits.",
        clauses: [
          "Menu prices on the platform must be consistent with or competitive with offline retail pricing.",
          "Local Bandi deducts the agreed platform commission fee per fulfilled order.",
          "Net settlements are disbursed to the merchant's verified bank account on the agreed schedule (T+1 or weekly)."
        ]
      },
      {
        sectionTitle: "Order Acceptance SLA",
        content: "Operational expectations for handling customer orders.",
        clauses: [
          "Merchants agree to accept or reject incoming orders within 3 minutes of broadcast.",
          "Repeated automatic timeouts or unauthorized order cancellations may affect store ranking and listing prominence."
        ]
      }
    ]
  },

  // ==========================================
  // 4. BRANCHES ADMIN APP
  // ==========================================
  branch: {
    appKey: 'branch',
    appName: "Local Bandi - Branch Admin App",
    shortName: "Branch Admin",
    packageId: "com.localbandi.branch",
    playStoreTitle: "Local Bandi Branch Admin: Franchise Operations",
    targetRole: "Franchise Operators, Zonal Branch Managers & Regional Supervisors",
    effectiveDate: "September 25, 2026",
    lastUpdated: "September 25, 2026",
    version: "2.4.0-play",
    accentColor: "#f59e0b", // amber-500
    privacySummary: "This Privacy Policy governs operational territory management, franchisee personnel credentials, regional fleet supervision, merchant onboarding approvals, and local ledger tracking for branch administrators.",
    termsSummary: "These Terms and Conditions govern regional franchise rights, territorial geofence management, operational service level agreements (SLAs), local revenue sharing, and administrative confidentiality.",
    
    dataCollection: [
      {
        category: "Franchisee Identification & Credentials",
        dataPoints: [
          "Branch Manager / Franchise Owner Name, Email, Phone Number",
          "Franchise Agreement Reference ID and authorized operational territory",
          "Government KYC documents of authorized branch administrator",
          "Designated zonal territory coordinates (lat/long boundary, radius in KM)"
        ],
        purpose: "Authenticates administrative access, links operational control to specific postal codes, and verifies franchise authorization.",
        isOptional: false,
        sharedWithThirdParties: false
      },
      {
        category: "Regional Operations & Fleet Monitoring",
        dataPoints: [
          "Zonal merchant verification and onboarding approval logs",
          "Local delivery partner attendance, live shift status, and zonal heatmap telemetry",
          "Territory order volume, dispatch velocity, and fulfillment success rates"
        ],
        purpose: "Enables effective localized management of supply and demand, resolves local logistical bottlenecks, and monitors fleet performance.",
        isOptional: false,
        sharedWithThirdParties: false
      },
      {
        category: "Branch Financial & Commission Ledger",
        dataPoints: [
          "Regional gross merchandise value (GMV) and transaction count",
          "Franchise commission earnings and regional revenue-share calculations",
          "Cash on Delivery reconciliation records for drivers in the territory",
          "Branch bank account details for regional payout disbursements"
        ],
        purpose: "Enables accurate calculation and settlement of franchise commission earnings and monitors regional cash collection.",
        isOptional: false,
        sharedWithThirdParties: true
      },
      {
        category: "Dispute & Quality Assurance Telemetry",
        dataPoints: [
          "Local customer complaint logs and resolution notes",
          "Vendor penalty records and hygiene audit reports",
          "Delivery partner incident tickets and escalation logs"
        ],
        purpose: "Maintains high quality standards and resolves localized consumer and merchant disputes.",
        isOptional: false,
        sharedWithThirdParties: false
      }
    ],
    
    permissionsUsed: [
      {
        permission: "ACCESS_FINE_LOCATION",
        description: "Calibrating and monitoring branch geofence boundary coordinates.",
        rationale: "Ensures the branch admin is supervising activities within their assigned territory."
      },
      {
        permission: "POST_NOTIFICATIONS",
        description: "High-priority operational alerts and escalation notices.",
        rationale: "Alerts branch managers to unassigned orders, driver shortages, or merchant complaints."
      },
      {
        permission: "READ_MEDIA_IMAGES / CAMERA",
        description: "Uploading physical merchant inspection photos and verification documents.",
        rationale: "Allows branch managers to perform in-person KYC audits of local merchant establishments."
      }
    ],
    
    storageAndRetention: {
      storageProvider: "Google Cloud Firestore (Encrypted Multi-Tenant Partitioning)",
      encryptionAtRest: "AES-256 military-grade encryption",
      encryptionInTransit: "TLS 1.3 / HTTPS with HSTS enforced",
      retentionPolicy: "Operational logs are preserved for the duration of the active franchise agreement plus 5 years for legal compliance.",
      anonymization: "End-customer identifiers are masked from branch staff view unless needed for an active escalatory dispute."
    },
    
    securityMeasures: [
      "Strict territory partitioning: Branch admins cannot access data, merchants, or orders outside their designated geofence.",
      "Hardware session binding and IP auditing to prevent unauthorized remote account sharing.",
      "Detailed audit logging for every merchant approval, driver activation, or commission query.",
      "Role-based privilege restrictions preventing alteration of master platform parameters."
    ],
    
    usagePolicies: [
      "Regional data is utilized solely for supervising local fulfillment, supporting partners, and tracking franchise earnings.",
      "Confidential merchant and customer data must never be exported or used for unauthorized commercial ventures.",
      "Franchise data access is revoked immediately upon termination of the franchise agreement."
    ],
    
    thirdPartyServices: [
      {
        name: "Google Maps Platform",
        purpose: "Zonal geofence visualization, route analysis, and dispatch heatmaps",
        policyUrl: "https://policies.google.com/privacy"
      },
      {
        name: "Firebase Cloud Infrastructure",
        purpose: "Multi-tenant real-time database synchronization",
        policyUrl: "https://firebase.google.com/support/privacy"
      }
    ],
    
    dataDeletionProcedure: {
      inAppSteps: [
        "Submit a formal territory relinquishment request through the Branch Portal settings.",
        "Finalize all regional driver COD reconciliations and pending dispute settlements.",
        "Master Admin initiates administrative deactivation and key revocation."
      ],
      emailProcedure: "Email Tharun Bandi at tharunbandi111@gmail.com with subject 'Branch Admin Offboarding & Data Deletion - [Branch Name]'.",
      retentionExceptions: "Statutory financial audit documents, regional revenue records, and dispute resolutions are retained for legal audit compliance.",
      timeline: "Access tokens revoked within 2 hours; personal administrator records archived/scrubbed within 30 days."
    },
    
    termsHighlights: [
      {
        sectionTitle: "Franchise Rights & Operational Territory",
        content: "Grants localized operational management authority within the designated geographic territory.",
        clauses: [
          "The branch manager is authorized to supervise operations strictly within the contracted geofence boundary.",
          "Encroachment into unauthorized territories or tampering with postal code boundaries is strictly prohibited.",
          "Franchisees must maintain minimum operational standards, active driver staffing, and responsive merchant support."
        ]
      },
      {
        sectionTitle: "Confidentiality & Non-Disclosure",
        content: "Protection of platform business intelligence and proprietary metrics.",
        clauses: [
          "Branch managers shall maintain strict secrecy regarding all merchant fees, driver pay formulas, and customer contact data.",
          "Using platform data to launch or aid a competing delivery or aggregator service is grounds for immediate termination and damages."
        ]
      },
      {
        sectionTitle: "Revenue Sharing & Dispute Resolution",
        content: "Transparent commission calculations and audit rights.",
        clauses: [
          "Branch commission splits are calculated automatically based on fulfilled orders within the territory.",
          "The Master Administration reserves the right to audit branch accounts and adjust fees in cases of unresolved customer complaints or fraud."
        ]
      }
    ]
  },

  // ==========================================
  // 5. MASTER ADMIN APP
  // ==========================================
  admin: {
    appKey: 'admin',
    appName: "Local Bandi - Master Admin Console",
    shortName: "Master Admin",
    packageId: "com.localbandi.admin",
    playStoreTitle: "Local Bandi Master Admin: Command Console",
    targetRole: "Executive Leadership, Chief Operating Officers & Platform Security Engineers",
    effectiveDate: "September 25, 2026",
    lastUpdated: "September 25, 2026",
    version: "2.4.0-play",
    accentColor: "#ef4444", // red-500
    privacySummary: "This Privacy Policy governs root administrative access, comprehensive system telemetry, platform-wide financial ledgers, audit trails, and data governance for executive controllers of Local Bandi.",
    termsSummary: "These Terms and Conditions define root administrative responsibilities, fiduciary compliance, strict zero-trust operational protocols, audit obligations, and database governance.",
    
    dataCollection: [
      {
        category: "Master Administrator Identity & Multi-Factor Auth",
        dataPoints: [
          "Executive Administrator Full Name, Enterprise Email, and Mobile Phone",
          "Cryptographic hardware key identifiers and Time-based One-Time Password (TOTP) tokens",
          "Administrative login IP address, browser fingerprint, and device telemetry"
        ],
        purpose: "Ensures unbreakable security, verifies identity before granting root access, and prevents credential compromise.",
        isOptional: false,
        sharedWithThirdParties: false
      },
      {
        category: "System-Wide Operational & Financial Telemetry",
        dataPoints: [
          "Aggregated platform transaction volume, GMV, fee collections, and tax liability ledgers",
          "Real-time database read/write throughput and Firestore API quota consumption",
          "Cloud infrastructure resource utilization and server response latencies"
        ],
        purpose: "Enables continuous platform stability, financial auditing, tax compliance, and cloud infrastructure capacity planning.",
        isOptional: false,
        sharedWithThirdParties: false
      },
      {
        category: "Immutable Audit Logs & Security Traces",
        dataPoints: [
          "Timestamped audit logs of all configuration changes, commission alterations, and rule updates",
          "User role elevation events and permission modification logs",
          "Emergency system kill-switch activation and maintenance trigger records"
        ],
        purpose: "Guarantees forensic accountability, prevents insider fraud, and satisfies strict regulatory audit mandates.",
        isOptional: false,
        sharedWithThirdParties: false
      }
    ],
    
    permissionsUsed: [
      {
        permission: "POST_NOTIFICATIONS",
        description: "Immediate critical alerts for system anomalies, security breaches, or server outages.",
        rationale: "Required for continuous monitoring of ecosystem health and rapid incident response."
      },
      {
        permission: "BIOMETRIC / FINGERPRINT",
        description: "Hardware biometric confirmation before executing high-privilege operations.",
        rationale: "Prevents unauthorized execution of irreversible system adjustments or mass payouts."
      }
    ],
    
    storageAndRetention: {
      storageProvider: "Google Cloud Platform (Secure Multi-Region Mirroring with Immutable Backups)",
      encryptionAtRest: "FIPS 140-2 Level 3 validated hardware-backed encryption",
      encryptionInTransit: "Strict TLS 1.3 with Certificate Pinning",
      retentionPolicy: "Administrative audit trails and ledger changes are immutable and preserved for 10 years to comply with financial regulatory mandates.",
      anonymization: "Access to raw personal data is strictly audited and subject to automated obfuscation."
    },
    
    securityMeasures: [
      "Zero-Trust Architecture: Every administrative request is verified for identity, device posture, and authorization.",
      "IP-allowlisting and geo-fencing for Master Admin access portals.",
      "Automated automated real-time alert triggers upon any unauthorized privilege escalation attempt.",
      "Continuous daily automated database snapshots and disaster recovery readiness."
    ],
    
    usagePolicies: [
      "Master Administrative access is exercised solely for platform reliability, security enforcement, and legal compliance.",
      "Direct modification of database records without an audit trail is technically blocked by system architecture.",
      "All platform governance actions are recorded permanently in tamper-evident logs."
    ],
    
    thirdPartyServices: [
      {
        name: "Google Cloud Platform & Firebase",
        purpose: "Core cloud infrastructure, hosting, database, and authentication",
        policyUrl: "https://cloud.google.com/terms/cloud-privacy-notice"
      },
      {
        name: "Twilio / SMS Gateway",
        purpose: "Administrative 2FA delivery and security alerts",
        policyUrl: "https://www.twilio.com/legal/privacy"
      }
    ],
    
    dataDeletionProcedure: {
      inAppSteps: [
        "Executive account retirement is managed through the platform Security Officer console.",
        "Administrative privileges are revoked and TOTP keys invalidated immediately."
      ],
      emailProcedure: "Direct communication with the Corporate Board / Founder at tharunbandi111@gmail.com.",
      retentionExceptions: "Administrative audit trails cannot be deleted due to financial integrity and legal compliance requirements.",
      timeline: "Active credentials revoked within 60 seconds; administrative records archived per statutory norms."
    },
    
    termsHighlights: [
      {
        sectionTitle: "Fiduciary Responsibility & System Integrity",
        content: "The Master Administrator holds a position of supreme trust and technical stewardship.",
        clauses: [
          "Administrators must act in good faith to protect consumer privacy, partner livelihoods, and system uptime.",
          "Unauthorized commercial exploitation of platform data is strictly forbidden and punishable under the IT Act 2000.",
          "Emergency intervention powers (suspension of bad actors, temporary halts) must be documented with justifiable cause."
        ]
      },
      {
        sectionTitle: "Security & Zero Compromise Policy",
        content: "Maintenance of the highest cryptographic and physical security standards.",
        clauses: [
          "Credentials must never be shared, stored in plain text, or accessed on unmanaged public devices.",
          "Any detected breach or unauthorized access attempt must be reported to the platform Grievance Officer immediately."
        ]
      }
    ]
  }
};
