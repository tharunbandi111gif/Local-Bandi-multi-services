import { 
  Milk, 
  Droplet, 
  Apple, 
  Beef, 
  Utensils, 
  ShoppingBag, 
  PhoneCall, 
  Briefcase, 
  Wrench, 
  Car, 
  Heart, 
  Scissors,
  Flower,
  Flame,
  HardHat,
  UserCheck,
  Store,
  Check,
  Building2,
  Home as HomeIcon,
  Search,
  Users,
  Sparkles,
  Cake,
  Landmark,
  UtensilsCrossed,
  HeartHandshake
} from 'lucide-react';
import { Category, Product, Service, Language, MarriageProfile } from './types';

export const CATEGORIES: Category[] = [
  { id: 'meat', name: 'Meat & Eggs', icon: 'Beef', color: 'bg-red-100' },
  { id: 'dairy', name: 'Dairy & Milk', icon: 'Milk', color: 'bg-blue-100' },
  { id: 'water', name: 'Pure Water', icon: 'Droplet', color: 'bg-cyan-100' },
  { id: 'fancy', name: 'Fancy & Clothes', icon: 'Shirt', color: 'bg-pink-100' },
  { id: 'veg', name: 'Healthy Veg', icon: 'Apple', color: 'bg-green-100' },
  { id: 'food', name: 'Family Food', icon: 'Utensils', color: 'bg-yellow-100' },
  { id: 'groceries', name: 'Groceries', icon: 'ShoppingBag', color: 'bg-emerald-50' },
  { id: 'maids', name: 'Maid & Cook', icon: 'UserCheck', color: 'bg-purple-100' },
  { id: 'mechanics', name: 'Mechanics (AC/Fridge)', icon: 'Wrench', color: 'bg-orange-100' },
  { id: 'construction', name: 'Construction & Work', icon: 'HardHat', color: 'bg-amber-100' },
  { id: 'care', name: 'Care & Child Takers', icon: 'Heart', color: 'bg-rose-50' },
  { id: 'marriage', name: 'Marriage Bureau', icon: 'HeartHandshake', color: 'bg-indigo-50' },
  { id: 'bakery', name: 'Bakery & Ice Cream', icon: 'Cake', color: 'bg-pink-50' },
  { id: 'pharmacy', name: 'Pharmacy & Health', icon: 'ShieldCheck', color: 'bg-rose-100' },
  { id: 'hospital_op', name: 'Hospital OP', icon: 'Stethoscope', color: 'bg-emerald-100' },
  { id: 'household', name: 'Household Essentials', icon: 'ShoppingBag', color: 'bg-slate-100' },
  { id: 'electronics', name: 'Electronics & Mobiles', icon: 'Smartphone', color: 'bg-indigo-100' },
  { id: 'services', name: 'Home Services', icon: 'Sparkles', color: 'bg-purple-50' },
  { id: 'emergency', name: 'Emergency Help', icon: 'AlertCircle', color: 'bg-rose-500 text-white' },
  { id: 'events', name: 'Events & Decor', icon: 'Flower', color: 'bg-fuchsia-100' },
  { id: 'religious', name: 'Pandith @ Priest', icon: 'Flower', color: 'bg-stone-100' },
  { id: 'temple', name: 'Hindu Temples', icon: 'Landmark', color: 'bg-orange-50' },
  { id: 'catering', name: 'Event Catering', icon: 'UtensilsCrossed', color: 'bg-yellow-50' },
  { id: 'jobs', name: 'Job Portal', icon: 'Briefcase', color: 'bg-blue-50' },
  { id: 'handicrafts', name: 'Natural Crafts', icon: 'Sparkles', color: 'bg-amber-50' },
  { id: 'travel', name: 'Travel & Trips', icon: 'Car', color: 'bg-gray-100' },
  { id: 'realestate', name: 'Real Estate', icon: 'Building2', color: 'bg-indigo-100' },
  { id: 'driving_school', name: 'Driving School', icon: 'Car', color: 'bg-blue-50' },
  { id: 'beauty_parlour', name: 'Beauty Parlour', icon: 'Scissors', color: 'bg-pink-100' },
  { id: 'agriculture', name: 'Agriculture & Farm', icon: 'Sparkles', color: 'bg-emerald-100' },
  { id: 'auto_garage', name: 'Auto & Bike Repair', icon: 'Wrench', color: 'bg-orange-100' },
  { id: 'education', name: 'Tuition & Coaching', icon: 'Briefcase', color: 'bg-blue-100' },
  { id: 'pets', name: 'Pet Care & Food', icon: 'Heart', color: 'bg-rose-100' },
  { id: 'sports', name: 'Sports & Fitness', icon: 'Sparkles', color: 'bg-amber-100' },
  { id: 'footwear', name: 'Shoes & Footwear', icon: 'ShoppingBag', color: 'bg-purple-100' },
  { id: 'chitfund', name: 'Chit Funds & Savings', icon: 'Landmark', color: 'bg-indigo-100' },
  { id: 'books', name: 'Books & Stationery', icon: 'ShoppingBag', color: 'bg-yellow-100' },
  { id: 'gifts', name: 'Gifts & Flowers', icon: 'Flower', color: 'bg-pink-100' },
  { id: 'sweets', name: 'Sweets & Namkeen', icon: 'Cake', color: 'bg-orange-50' },
];

export const REWARDS = [
  { id: 'icecream_cup', name: 'Ice Cream Cup', originalPrice: 15, rewardPrice: 1, img: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=100&h=100&fit=crop' },
  { id: 'fivestar', name: '5-Star Chocolate', originalPrice: 10, rewardPrice: 1, img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=100&h=100&fit=crop' },
  { id: 'munch', name: 'Munch Large', originalPrice: 15, rewardPrice: 1, img: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=100&h=100&fit=crop' },
  { id: 'sugar_500g', name: 'Sugar 1/2 KG', originalPrice: 28, rewardPrice: 1, img: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=100&h=100&fit=crop' },
  { id: 'oil_250ml', name: 'Cooking Oil 250ml', originalPrice: 40, rewardPrice: 1, img: 'https://images.unsplash.com/photo-1474979266404-7eaacbad88c5?w=100&h=100&fit=crop' },
  { id: 'pooja_samagri', name: 'Pooja Samagri Kit', originalPrice: 35, rewardPrice: 1, img: 'https://images.unsplash.com/photo-1582236371565-491d40a59719?w=100&h=100&fit=crop' },
  { id: 'sprite_500ml', name: 'Cool Drink 500ml', originalPrice: 40, rewardPrice: 1, img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=100&h=100&fit=crop' }
];

export const LANGUAGES: Language[] = [
  { code: 'en-IN', label: 'English', native: 'English' },
  { code: 'hi-IN', label: 'Hindi', native: 'हिन्दी' },
  { code: 'te-IN', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ta-IN', label: 'Tamil', native: 'தமிழ்' },
  { code: 'kn-IN', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml-IN', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'as-IN', label: 'Assamese', native: 'অসমীয়া' },
  { code: 'bn-IN', label: 'Bengali', native: 'বাংলা' },
  { code: 'brx-IN', label: 'Bodo', native: 'बर' },
  { code: 'doi-IN', label: 'Dogri', native: 'डोगरी' },
  { code: 'gu-IN', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ks-IN', label: 'Kashmiri', native: 'كٲشُر' },
  { code: 'gom-IN', label: 'Konkani', native: 'कोंकणी' },
  { code: 'mai-IN', label: 'Maithili', native: 'मैथिली' },
  { code: 'mni-IN', label: 'Manipuri', native: 'মৈতৈলোন' },
  { code: 'mr-IN', label: 'Marathi', native: 'मराठी' },
  { code: 'ne-IN', label: 'Nepali', native: 'नेपाली' },
  { code: 'or-IN', label: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'pa-IN', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'sa-IN', label: 'Sanskrit', native: 'संस्कृतम्' },
  { code: 'sat-IN', label: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'sd-IN', label: 'Sindhi', native: 'سنڌي' },
  { code: 'ur-IN', label: 'Urdu', native: 'اردو' },
  { code: 'tcy-IN', label: 'Tulu', native: 'ತುಳು' },
];

export const PRODUCTS: Product[] = [
  // MEAT & EGGS
  {
    id: 'm1',
    name: 'Fresh Chicken (With Skin)',
    price: 240,
    category: 'meat',
    image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&h=400&fit=crop',
    description: 'Freshly cut chicken with skin, perfect for traditional curries. 1kg.',
    stock: 5
  },
  {
    id: 'm2',
    name: 'Chicken Boneless',
    price: 380,
    category: 'meat',
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop',
    description: 'Tender, lean boneless chicken breast pieces. 1kg.',
    stock: 0
  },
  {
    id: 'm3',
    name: 'Skinless Chicken',
    price: 260,
    category: 'meat',
    image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&h=400&fit=crop',
    description: 'Freshly cut skinless chicken. 1kg.'
  },
  {
    id: 'm_mutton',
    name: 'Premium Mutton (Goat)',
    price: 850,
    category: 'meat',
    image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400&h=400&fit=crop',
    description: 'Fresh tender goat meat, cut to requirements. 1kg.'
  },
  {
    id: 'm4',
    name: 'Farm Fresh Eggs (12pk)',
    price: 84,
    category: 'meat',
    image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400&h=400&fit=crop',
    description: 'Organic brown eggs from free-range chickens.'
  },

  // FANCY & CLOTHES
  {
    id: 'c1',
    name: 'Pure Cotton Saree',
    price: 1500,
    category: 'fancy',
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&h=400&fit=crop',
    description: 'Beautiful hand-woven pure cotton saree for daily wear.'
  },
  {
    id: 'c2',
    name: 'Mens Formal Shirt',
    price: 899,
    category: 'fancy',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop',
    description: 'Premium slim fit formal shirt for office and occasions.'
  },
  {
    id: 'f_gold',
    name: '1 Gram Gold Chain',
    price: 1200,
    category: 'fancy',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop',
    description: 'Beautiful 1 gram gold plated necklace for functions.'
  },

  // GROCERIES
  {
    id: 'g1',
    name: 'Basmati Rice Premium',
    price: 120,
    category: 'groceries',
    subCategory: 'Staples',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop',
    description: 'Long grain aromatic basmati rice. 1kg.'
  },
  {
    id: 'g2',
    name: 'Ashirvaad Atta',
    price: 210,
    category: 'groceries',
    subCategory: 'Staples',
    image: 'https://plus.unsplash.com/premium_photo-1667030474693-6d0632f97029?w=400&h=400&fit=crop',
    description: 'Whole wheat flour for soft rotis. 5kg.'
  },
  {
    id: 'g_dal',
    name: 'Toor Dal Premium',
    price: 160,
    category: 'groceries',
    subCategory: 'Staples',
    image: 'https://images.unsplash.com/photo-1585996853880-927954a781f8?w=400&h=400&fit=crop',
    description: 'High quality cleaned Toor Dal. 1kg.'
  },
  {
    id: 'g3',
    name: 'Sunflower Oil',
    price: 155,
    category: 'groceries',
    subCategory: 'Cooking Essentials',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop',
    description: 'Refined healthy cooking oil. 1L.'
  },
  {
    id: 'g_spices',
    name: 'Garam Masala',
    price: 45,
    category: 'groceries',
    subCategory: 'Cooking Essentials',
    image: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=400&h=400&fit=crop',
    description: 'Authentic blend of spices for rich flavor. 50g.'
  },
  {
    id: 'g_kitchen',
    name: 'Dishwash Gel',
    price: 99,
    category: 'groceries',
    subCategory: 'Kitchen Needs',
    image: 'https://images.unsplash.com/photo-1584622781564-1d9876a13d00?w=400&h=400&fit=crop',
    description: 'Lemon fresh grease cutting dishwash gel. 500ml.'
  },
  {
    id: 'g_bath',
    name: 'Sandalwood Soap',
    price: 40,
    category: 'groceries',
    subCategory: 'Bathroom Needs',
    image: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=400&h=400&fit=crop',
    description: 'Pure sandalwood oil bath soap for glowing skin.'
  },
  {
    id: 'g_snacks',
    name: 'Masala Peanuts',
    price: 35,
    category: 'groceries',
    subCategory: 'Snacks',
    image: 'https://images.unsplash.com/photo-1599490659223-930b44aa107c?w=400&h=400&fit=crop',
    description: 'Crispy and spicy masala peanuts.'
  },
  {
    id: 'g_bev',
    name: 'Masala Tea Dust',
    price: 110,
    category: 'groceries',
    subCategory: 'Beverages',
    image: 'https://images.unsplash.com/photo-1544787210-282713df82ef?w=400&h=400&fit=crop',
    description: 'Strong CTC tea leaf blend. 250g.'
  },

  // DAIRY
  {
    id: 'd1',
    name: 'Pure Buffalo Milk 1L',
    price: 95,
    originalPrice: 120,
    category: 'dairy',
    image: 'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?w=400&h=400&fit=crop',
    description: 'Fresh, heavy buffalo milk delivered directly from the farm.'
  },
  {
    id: 'd2',
    name: 'Fresh Cow Milk 1L',
    price: 60,
    category: 'dairy',
    image: 'https://images.unsplash.com/photo-1550583724-125581dc28a1?w=400&h=400&fit=crop',
    description: 'Fresh cow milk delivered daily from local farms.'
  },
  {
    id: 'd3',
    name: 'Fresh Paneer 200g',
    price: 90,
    category: 'dairy',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=400&fit=crop',
    description: 'Soft and fresh cottage cheese.'
  },
  {
    id: 'b1',
    name: 'Fresh Pineapple Cake',
    price: 450,
    category: 'bakery',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
    description: 'Delicious eggless pineapple sponge cake with fresh cream.'
  },
  {
    id: 'b2',
    name: 'Vanilla Ice Cream 500ml',
    price: 150,
    category: 'bakery',
    image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9391?w=400&h=400&fit=crop',
    description: 'Creamy classic vanilla ice cream made with real milk.'
  },

  // WATER
  {
    id: 'w1',
    name: 'Daily Water (20L Tin)',
    price: 25,
    originalPrice: 35,
    category: 'water',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop',
    description: 'Purified mineral water in 20L cans. Safe and chilled.'
  },

  // VEG & FRUITS
  {
    id: 'vf1',
    name: 'Hybrid Tomatoes 1kg',
    price: 40,
    category: 'veg',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f02ac6d31?w=400&h=400&fit=crop',
    description: 'Fresh farm picked red tomatoes.'
  },
  {
    id: 'vf2',
    name: 'Shimla Apple 1kg',
    price: 180,
    category: 'veg',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop',
    description: 'Sweet and crunchy apples from Shimla.'
  },

  // FOOD
  {
    id: 'f1',
    name: 'Idly Sambar',
    price: 60,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&h=400&fit=crop',
    description: 'Fresh steamed Idlies with aromatic sambar and chutney.',
    hotelName: 'Sree Sai Tiffins'
  },
  {
    id: 'f2',
    name: 'Masala Dosa',
    price: 80,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&h=400&fit=crop',
    description: 'Crispy dosa with potato filling.',
    hotelName: 'Hotel Raghavendra'
  },
  {
    id: 'f3',
    name: 'Wada (2pcs)',
    price: 50,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&h=400&fit=crop',
    description: 'Deep fried crispy lentil donuts.',
    hotelName: 'Sree Sai Tiffins'
  },
  {
    id: 'f4',
    name: 'Chapati with Kurma',
    price: 70,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&h=400&fit=crop',
    description: 'Soft chapatis served with vegetable kurma.',
    hotelName: 'Amma Canteen'
  },
  {
    id: 'f5',
    name: 'Chicken Biryani',
    price: 250,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ef4a4f8?w=400&h=400&fit=crop',
    description: 'Authentic dum biryani with tender chicken.',
    hotelName: 'Paradise Biryani'
  },
  {
    id: 'f6',
    name: 'Rice with Veg Curry',
    price: 120,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=400&fit=crop',
    description: 'Steam rice served with daily special veg curry.',
    hotelName: 'Annapurna Meals'
  },
  {
    id: 'f7',
    name: 'Butter Chicken Curry',
    price: 180,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&h=400&fit=crop',
    description: 'Rich and creamy butter chicken gravy.',
    hotelName: 'Dhaba Express'
  },

  // TRAVEL & RENTALS
  {
    id: 't1',
    name: 'Sedan Car (Full Day)',
    price: 2500,
    category: 'travel',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=400&fit=crop',
    description: 'Comfortable sedan for city or outstation travel. Includes driver.'
  },
  {
    id: 't2',
    name: 'Professional Driver',
    price: 800,
    category: 'travel',
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&h=400&fit=crop',
    description: 'Experienced drivers for your personal vehicle. 8-hour shift.'
  },
  {
    id: 't3',
    name: 'Yatra Tour Bus',
    price: 1500,
    category: 'travel',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=400&fit=crop',
    description: 'Pilgrimage tour bus booking. AC semi-sleeper.'
  }
];

export const SERVICES: Service[] = [
  // MAIDS & COOKS
  {
    id: 's_maid',
    name: 'Professional Maid',
    price: 4000,
    category: 'maids',
    image: 'https://images.unsplash.com/photo-1584622781564-1d9876a13d00?w=400&h=400&fit=crop',
    description: 'Expert home cleaning, sweeping, and vessel washing. Monthly service.',
    rating: 4.8,
    bookings: 450
  },
  {
    id: 's_cook',
    name: 'Experienced Cook',
    price: 5000,
    category: 'maids',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop',
    description: 'Healthy and tasty home cooking. Specialized in local cuisine.',
    rating: 4.9,
    bookings: 320
  },

  // MECHANICS
  {
    id: 's1',
    name: 'AC Mechanic',
    price: 500,
    category: 'mechanics',
    image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=400&h=400&fit=crop',
    description: 'Repair and maintenance for all AC brands.',
    rating: 4.8,
    bookings: 1250
  },
  {
    id: 's_fridge',
    name: 'Fridge Mechanic',
    price: 450,
    category: 'mechanics',
    image: 'https://images.unsplash.com/photo-1571175432230-01c6cb512e0e?w=400&h=400&fit=crop',
    description: 'Expert repair for all refrigerator types and double-door models.',
    rating: 4.7,
    bookings: 840
  },
  {
    id: 's_cooler',
    name: 'Air Cooler Service',
    price: 300,
    category: 'mechanics',
    image: 'https://images.unsplash.com/photo-1585336139118-132f7f21503e?w=400&h=400&fit=crop',
    description: 'Cleaning and motor repair for air coolers.',
    rating: 4.6,
    bookings: 210
  },

  // CONSTRUCTION
  {
    id: 's8',
    name: 'Construction Worker',
    price: 800,
    category: 'construction',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f3366d4?w=400&h=400&fit=crop',
    description: 'Daily wage skilled construction labor for all masonry work.',
    rating: 4.5,
    bookings: 300
  },
  {
    id: 's_painter',
    name: 'Home Painter',
    price: 1500,
    category: 'construction',
    image: 'https://images.unsplash.com/photo-1589939705384-5185138a047a?w=400&h=400&fit=crop',
    description: 'Professional wall painting with finishing. Per room pricing.',
    rating: 4.8,
    bookings: 560
  },

  // CARE TAKERS
  {
    id: 'e_child',
    name: 'Child Care Taker',
    price: 600,
    category: 'care',
    image: 'https://images.unsplash.com/photo-1544333323-53721e869382?w=400&h=400&fit=crop',
    description: 'Verified professional child care help and babysitting.',
    rating: 4.9,
    bookings: 150
  },
  {
    id: 's_priest_h',
    name: 'Hindu Pandith @ Priest',
    price: 1100,
    category: 'religious',
    image: 'https://images.unsplash.com/photo-1544333323-53721e869382?w=400&h=400&fit=crop',
    description: 'Expert pandit for Satyanarayana Vratam, House Warming, and other pujas.',
    rating: 4.9,
    bookings: 120
  },
  {
    id: 's_priest_c',
    name: 'Christian Pandith @ Priest / Pastor',
    price: 1000,
    category: 'religious',
    image: 'https://images.unsplash.com/photo-1544333323-53721e869382?w=400&h=400&fit=crop',
    description: 'Foster fathers and pastors for house blessings, baptisms, and weddings.',
    rating: 4.8,
    bookings: 85
  },
  {
    id: 's_catering_l',
    name: 'Lokal Event Catering',
    price: 350,
    category: 'catering',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=400&fit=crop',
    description: 'Affordable and tasty catering for small to large events. Price per plate.',
    rating: 4.7,
    bookings: 210
  },
  {
    id: 'e_caretaker',
    name: 'Elderly Care Taker',
    price: 800,
    category: 'care',
    image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f2aa?w=400&h=400&fit=crop',
    description: 'Qualified caretakers for elderly or patients available for 12/24 hrs.',
    rating: 4.8,
    bookings: 280
  },

  // MARRIAGE BUREAU - Handled by dedicated MarriageBureau component

  // JOBS
  {
    id: 'j_hotel',
    name: 'Hotel Jobs Board',
    price: 0,
    category: 'jobs',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=400&fit=crop',
    description: 'Waiters, chefs, and housekeeping jobs in partner hotels.'
  },
  {
    id: 'j_delivery',
    name: 'Delivery Partner Jobs',
    price: 0,
    category: 'jobs',
    image: 'https://images.unsplash.com/photo-1531353826977-0941b327998f?w=400&h=400&fit=crop',
    description: 'Apply for local delivery jobs. Earn ₹500 - ₹1000 daily.'
  },
  {
    id: 'j_finance',
    name: 'Finance & Accounts',
    price: 0,
    category: 'jobs',
    image: 'https://images.unsplash.com/photo-1454165833767-02acd350c2b8?w=400&h=400&fit=crop',
    description: 'Accounting, billing, and office jobs in private companies.'
  },

  // OLD SERVICES (Keep some)
  {
    id: 's2',
    name: 'Plumber',
    price: 200,
    category: 'services',
    image: 'https://images.unsplash.com/photo-1504148455328-c15cc2c3ec7a?w=400&h=400&fit=crop',
    description: 'Pipe repair, leakage fixing and installation.',
    rating: 4.7,
    bookings: 2100,
    reviews: [
      { id: 'rp1', userName: 'Ramesh V.', rating: 5, comment: 'Solved a complex leakage problem that others couldn\'t.', date: '1 week ago' }
    ]
  },
  {
    id: 's3',
    name: 'Electrician',
    price: 300,
    category: 'services',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=400&fit=crop',
    description: 'Expert residential electrical repairs and installation.',
    rating: 4.9,
    bookings: 3400
  },
  {
    id: 's4',
    name: 'Carpenter',
    price: 400,
    category: 'services',
    image: 'https://images.unsplash.com/photo-1452860681190-38275e8ff5df?w=400&h=400&fit=crop',
    description: 'Furniture repair, assembly, and custom woodwork.',
    rating: 4.6,
    bookings: 850
  },
  {
    id: 's5',
    name: 'Appliance Repair',
    price: 450,
    category: 'services',
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=400&fit=crop',
    description: 'Washing machine, microwave, and fridge repair services.',
    rating: 4.8,
    bookings: 1100
  },
  {
    id: 's6',
    name: 'Pest Control',
    price: 899,
    category: 'services',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=400&fit=crop',
    description: 'Herbal and chemical pest control for homes and offices.',
    rating: 4.9,
    bookings: 920
  },
  {
    id: 's7',
    name: 'Deep Cleaning',
    price: 1500,
    category: 'services',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?w=400&h=400&fit=crop',
    description: 'Professional full home deep cleaning services.',
    rating: 4.7,
    bookings: 1500
  },
  {
    id: 's8_service',
    name: 'Construction Worker',
    price: 800,
    category: 'services',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f3366d4?w=400&h=400&fit=crop',
    description: 'Daily wage skilled construction labor.',
    rating: 4.5,
    bookings: 300
  },
  {
    id: 's9',
    name: 'Ceiling Specialist',
    price: 1200,
    category: 'services',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=400&fit=crop',
    description: 'False ceiling installation and repair.',
    rating: 4.8,
    bookings: 450
  },
  // DRIVING SCHOOL
  {
    id: 's_ds1',
    name: 'L-Board Driving School',
    price: 3500,
    category: 'driving_school',
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&h=400&fit=crop',
    description: 'Complete car driving course with license assistance. 15 days.',
    rating: 4.9,
    bookings: 210
  },
  {
    id: 's_ds2',
    name: '2-Wheeler Training',
    price: 1500,
    category: 'driving_school',
    image: 'https://images.unsplash.com/photo-1558981403-c5f91eb12388?w=400&h=400&fit=crop',
    description: 'Learn to ride a scooter or bike confidently. 7 days.',
    rating: 4.7,
    bookings: 150
  },
  // BEAUTY PARLOUR
  {
    id: 's_bp1',
    name: 'Bridal Makeup Package',
    price: 5000,
    category: 'beauty_parlour',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop',
    description: 'Full bridal makeup, hair styling and saree draping.',
    rating: 5.0,
    bookings: 85
  },
  {
    id: 's_bp2',
    name: 'Facial & Skin Care',
    price: 800,
    category: 'beauty_parlour',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=400&fit=crop',
    description: 'Gold facial and deep skin cleansing for glowing look.',
    rating: 4.8,
    bookings: 340
  },

  // FANCY & TOYS
  {
    id: 'f_gold_fancy',
    name: '1 Gram Gold Chain',
    price: 1200,
    category: 'fancy',
    subCategory: 'Fancy Items',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop',
    description: 'Beautiful 1 gram gold plated necklace for functions.'
  },
  {
    id: 'f_toy',
    name: 'Remote Control Car',
    price: 850,
    category: 'fancy',
    subCategory: 'Toys',
    image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=400&h=400&fit=crop',
    description: 'High speed remote control car for kids aged 5+.'
  },
  {
    id: 'f_bangles',
    name: 'Bridal Bangle Set',
    price: 450,
    category: 'fancy',
    subCategory: 'Fancy Items',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop',
    description: 'Traditional heavy stone work bangles.'
  },

  // EVENTS & SALON
  {
    id: 'es1',
    name: 'Home Haircut (Men)',
    price: 199,
    category: 'events',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop',
    description: 'Professional barber service at your doorstep.'
  },
  {
    id: 'es2',
    name: 'Makeup Artist',
    price: 2500,
    category: 'events',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop',
    description: 'Bridal and event makeup services.'
  },

  // NATURAL HAND CRAFTS
  {
    id: 'hc1',
    name: 'Natural Wild Honey',
    price: 350,
    category: 'handicrafts',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop',
    description: 'Pure, unprocessed wild honey harvested from natural hives.'
  },
  {
    id: 'hc2',
    name: 'Ganuga Natural Groundnut Oil',
    price: 260,
    category: 'handicrafts',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop',
    description: 'Cold-pressed (Ganuga) natural groundnut oil. No chemicals, pure and healthy. 1L.'
  },
  {
    id: 'hc3',
    name: 'Organic Turmeric Powder',
    price: 120,
    category: 'handicrafts',
    image: 'https://images.unsplash.com/photo-1615485240388-1dbde1561931?w=400&h=400&fit=crop',
    description: 'Hand-pounded high curcumin organic turmeric from local farms.'
  },
  {
    id: 'hc4',
    name: 'Handmade Neem Soap',
    price: 85,
    category: 'handicrafts',
    image: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=400&h=400&fit=crop',
    description: 'Therapeutic neem soap made with cold-pressed oils. Chemical-free.'
  }
];

export const MARRIAGE_PROFILES: MarriageProfile[] = [
  {
    id: 'mp1',
    userId: 'sample1',
    name: 'Rahul',
    surname: 'Verma',
    dob: '1995-06-15',
    height: "5'10\"",
    skinTone: 'Fair',
    education: 'B.Tech Computer Science',
    profession: 'Software Engineer',
    address: 'H.No 12-4, Gachibowli, Hyderabad',
    phone: '7416574197',
    siblings: '1 Younger Brother',
    siblingsStatus: 'Unmarried',
    fatherProfession: 'Retired Teacher',
    motherProfession: 'Homemaker',
    about: 'Simple, family-oriented person who loves photography.',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    gender: 'Male',
    religion: 'Hindu',
    maritalStatus: 'Unmarried',
    isApproved: true,
    age: '31',
    canViewSensisitve: false
  },
  {
    id: 'mp2',
    userId: 'sample2',
    name: 'Priyanka',
    surname: 'Reddy',
    dob: '1997-02-20',
    height: "5'4\"",
    skinTone: 'Fair',
    education: 'MBA Marketing',
    profession: 'Project Manager',
    address: 'Flat 402, Banjara Hills, Hyderabad',
    phone: '8887776660',
    siblings: '2 Elders Sisters',
    siblingsStatus: 'Married',
    fatherProfession: 'Business Owner',
    motherProfession: 'Social Worker',
    about: 'I am a career-oriented woman who values traditions.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    gender: 'Female',
    religion: 'Hindu',
    maritalStatus: 'Unmarried',
    isApproved: true,
    age: '27',
    canViewSensisitve: true
  }
];
