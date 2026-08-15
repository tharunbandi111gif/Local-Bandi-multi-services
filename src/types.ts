export type Screen = 
  | 'splash' 
  | 'onboarding'
  | 'login' 
  | 'location' 
  | 'home' 
  | 'category' 
  | 'product' 
  | 'service' 
  | 'cart' 
  | 'payment' 
  | 'wishlist'
  | 'profile'
  | 'settings'
  | 'orders'
  | 'confirmation'
  | 'notifications'
  | 'privacy'
  | 'terms'
  | 'tracking'
  | 'delivery'
  | 'vendor'
  | 'marriageBureau'
  | 'realEstate'
  | 'tasks'
  | 'logistics'
  | 'branchManager';

export type LanguageCode = 
  | 'en-IN' | 'hi-IN' | 'te-IN' | 'ta-IN' | 'kn-IN' | 'ml-IN' 
  | 'as-IN' | 'bn-IN' | 'brx-IN' | 'doi-IN' | 'gu-IN' | 'ks-IN' 
  | 'gom-IN' | 'mai-IN' | 'mni-IN' | 'mr-IN' | 'ne-IN' | 'or-IN' 
  | 'pa-IN' | 'sa-IN' | 'sat-IN' | 'sd-IN' | 'ur-IN' | 'tcy-IN';

export interface Language {
  code: LanguageCode;
  label: string;
  native: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  image?: string;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  city?: string;
  district?: string;
  state?: string;
  adminId: string;
  adminName: string;
  status: 'Active' | 'Offline';
  joinDate: any;
  agreementExpiry: any;
  profitShare: number; // percentage
  contactPhone: string;
  adminEmail?: string;
  secPasscode?: string;
  vendorsCount: number;
  ordersCount: number;
  revenue: number;
  rating?: number;
  pincodes?: string[];
}

export interface Product {
  id: string;
  branchId?: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description: string;
  hotelName?: string;
  subCategory?: string;
  reviews?: Review[];
  stock?: number;
  unit?: string;
  isAvailable?: boolean;
}

export interface VendorProfile {
  id: string;
  branchId?: string;
  userId?: string;
  businessName: string;
  ownerName: string;
  phone: string;
  service: string;
  status: 'Approved' | 'Pending' | 'Terminated';
  isOnline: boolean;
  revenue: number;
  pendingPayout: number;
  itemsCount: number;
  rating: number;
  address?: string;
  location?: { area: string, city: string, pincode: string } | null;
  lastPayoutDate?: string;
  totalPaid?: number;
  photo?: string | null;
  documentPhoto?: string | null;
  gstNumber?: string | null;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  accessCode?: string;
}

export interface DeliveryPartnerProfile {
  id: string;
  branchId?: string;
  userId?: string;
  name: string;
  phone: string;
  vehicleType: string;
  vehicleNumber?: string;
  status: 'Online' | 'Offline' | 'On Trip' | 'Banned' | 'Approved' | 'Pending';
  isOnline: boolean;
  earnings: number;
  pendingPayout: number;
  rating: number;
  trips: number;
  cashInHand?: number; // Cash from COD orders
  remittanceRequests?: { id: string, amount: number, date: string, status: 'Pending' | 'Approved' | 'Rejected' }[];
  lastPayoutDate?: string;
  totalPaid?: number;
  photo?: string | null;
  documentPhoto?: string | null;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  accessCode?: string;
}

export interface Property {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  price: number;
  type: 'Sell' | 'Rent';
  category: string; // Residential, Commercial, Land, etc.
  description: string;
  image: string;
  images?: string[];
  location: {
    area: string;
    city: string;
    pincode: string;
    fullAddress?: string;
  };
  sellerPhone?: string;
  details: {
    sqft?: string;
    bedrooms?: string;
    bathrooms?: string;
    furnished?: 'Unfurnished' | 'Semi-furnished' | 'Fully-furnished';
    facing?: string;
  };
  isApproved: boolean;
  editCount?: number;
  createdAt: string;
}

export interface PartnerPreferences {
  ageMin?: string;
  ageMax?: string;
  heightMin?: string;
  religion?: string;
  education?: string;
  profession?: string;
}

export interface MarriageProfile {
  id: string;
  userId: string;
  name: string;
  surname: string;
  age: string;
  dob: string;
  height: string;
  skinTone: 'Fair' | 'Complexion' | 'Wheatish' | 'Other';
  education: string;
  profession: string;
  address: string;
  phone: string;
  siblings: string;
  siblingsStatus?: string;
  fatherName?: string;
  fatherProfession: string;
  motherName?: string;
  motherProfession: string;
  gothram?: string;
  star?: string;
  raasi?: string;
  nativePlace?: string;
  about?: string;
  image: string;
  gender: 'Male' | 'Female';
  religion?: string;
  caste?: string;
  maritalStatus?: 'Unmarried' | 'Married' | 'Divorced' | 'Widow' | 'Widower' | '3rd Marriage';
  isApproved: boolean;
  rejectionReason?: string;
  canViewSensisitve?: boolean; // Permission to see others sensitive info
  subscription?: {
    plan: 'free' | 'maintenance_59' | 'maintenance_99';
    expiryDate: string;
    visitsRemaining: number;
    totalVisitsBought: number;
    weeklyLikesCount: number;
    lastLikeResetDate: string;
  };
  partnerPreferences?: PartnerPreferences;
}

export interface Service {
  id: string;
  branchId?: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description: string;
  rating?: number;
  bookings?: number;
  subCategory?: string;
  reviews?: Review[];
}

export interface Address {
  id: string;
  label: string; // Home, Work, etc.
  recipientName?: string;
  phone?: string;
  address: string;
  pincode?: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
}

export interface CartItem extends Product {
  quantity: number;
  vendorId?: string;
  isMonthlySubscription?: boolean;
}


export interface VendorOrder {
  id: string;
  branchId?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  items: number;
  orderItems: { id: string, name: string, quantity: number, price: number, image?: string }[];
  total: number;
  status: 'Pending' | 'Preparing' | 'ReadyForPickup' | 'PickedUp' | 'Delivered' | 'Cancelled' | 'Editing' | 'Accepted' | 'Assigned';
  createdAt: string;
  paymentMethod: 'COD' | 'Online';
  deliveryType: 'Delivery' | 'Pickup';
  deliveryPartnerId?: string | null;
  deliveryPartnerName?: string | null;
  deliveryPartnerPhone?: string | null;
  customerInstructions?: string | null;
  deliveryInstructions?: string | null;
  notes?: string | null;
  instructions?: string | null;
}

export interface DeliveryOrder {
  id: string;
  branchId?: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  items: string[];
  amount: number;
  status: 'Pending' | 'Accepted' | 'PickedUp' | 'Delivered' | 'ReadyForPickup' | 'Assigned';
  pickupLocation: { lat: number, lng: number };
  deliveryLocation: { lat: number, lng: number };
  createdAt: string;
  vendorName?: string;
  vendorPhone?: string;
}

export interface SupportMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'partner' | 'admin' | 'bot';
  text: string;
  timestamp: any;
  careType?: string;
  imageUrl?: string;
}

export interface SupportChat {
  userId: string;
  userName: string;
  userEmail?: string;
  messages: SupportMessage[];
  lastMessageTimestamp: any;
  unreadCount?: number;
  partnerId?: string;
  partnerName?: string;
}

export type PartnerApplicationType = 'Vendor' | 'DeliveryPartner' | 'RealEstateSeller' | 'Franchise';

export interface PartnerApplication {
  id: string;
  userId: string;
  branchId?: string;
  type: PartnerApplicationType;
  fullName: string;
  phone: string;
  businessName?: string;
  businessType?: string;
  location: string;
  pincode?: string;
  gstNumber?: string | null;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  photo?: string | null;
  documentPhoto?: string | null;
  initialProduct?: any;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: any;
}

export interface PlatformSettings {
  id: string;
  allowBankTransfer: boolean;
  allowCashOnRegistration: boolean;
  registrationFee: number;
  upiId?: string;
  accountHolder?: string;
}

export interface PromoCode {
  id: string;
  branchId?: string; // Optional: restrict to specific branch
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  expiryDate: string;
  usageLimit?: number;
  usageCount: number;
  status: 'Active' | 'Inactive';
  description?: string;
  createdAt: any;
}

export type AdminRole = 'masterAdmin' | 'authorizedAdmin' | 'branchAdmin' | 'user';

export interface AuthorizedAdmin {
  id: string;
  phoneNumber: string;
  name?: string;
  role: 'masterAdmin' | 'authorizedAdmin';
  addedBy: string;
  addedAt: string;
  status: 'active' | 'revoked';
  notes?: string;
}

export interface AuthorizedAdminsConfig {
  primaryMasterAdmin: string;
  primaryPhoneNumbers: string[];
  authorizedPhones: string[];
  secondaryAdmins: AuthorizedAdmin[];
  updatedAt: any;
  updatedBy: string;
}
