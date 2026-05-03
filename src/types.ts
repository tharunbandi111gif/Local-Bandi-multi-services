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
  | 'logistics';

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
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
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
  partnerPreferences?: PartnerPreferences;
}

export interface Service {
  id: string;
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
}

export interface DeliveryPartnerProfile {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  vehicleType: string;
  vehicleNumber?: string;
  status: 'Online' | 'Offline' | 'On Trip' | 'Banned' | 'Approved';
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
}

export interface VendorProfile {
  id: string;
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
}

export interface VendorOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  items: { name: string, quantity: number, price: number }[];
  totalAmount: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'PickedUp' | 'Delivered' | 'Cancelled';
  createdAt: string;
  paymentMethod: 'COD' | 'Online';
  deliveryType: 'Delivery' | 'Pickup';
}

export interface DeliveryOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  items: string[];
  amount: number;
  status: 'Pending' | 'Accepted' | 'PickedUp' | 'Delivered';
  pickupLocation: { lat: number, lng: number };
  deliveryLocation: { lat: number, lng: number };
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'partner' | 'admin';
  text: string;
  timestamp: string;
}

export interface SupportChat {
  partnerId: string;
  partnerName: string;
  messages: SupportMessage[];
  lastMessageTimestamp: string;
  unreadCount?: number;
}
