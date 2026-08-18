// Clean, 100% copyright-free vector placeholder generator for Local Bandi Multi Services

export const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%236366f1'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23f1f5f9'/%3E%3Ccircle cx='50' cy='38' r='20' fill='%23cbd5e1'/%3E%3Cpath d='M 20 85 C 20 65 35 60 50 60 C 65 60 80 65 80 85 Z' fill='%2394a3b8'/%3E%3C/svg%3E";

export const LOCAL_BANDI_LOGO = "/src/assets/images/local_bandi_logo_1785784124975.jpg";

export function createSvgPlaceholder(title: string, bgGradientStart = '#fef3c7', bgGradientEnd = '#fde68a', textColor = '#78350f', iconEmoji = '🛍️'): string {
  const cleanTitle = encodeURIComponent(title.slice(0, 24));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradientStart}" />
        <stop offset="100%" stop-color="${bgGradientEnd}" />
      </linearGradient>
    </defs>
    <rect width="400" height="400" rx="32" fill="url(#grad)" />
    <circle cx="200" cy="170" r="80" fill="#ffffff" fill-opacity="0.6" />
    <text x="200" y="195" font-size="70" text-anchor="middle" font-family="system-ui, sans-serif">${iconEmoji}</text>
    <rect x="30" y="290" width="340" height="60" rx="16" fill="#0f172a" fill-opacity="0.85" />
    <text x="200" y="328" font-size="20" font-weight="900" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" letter-spacing="1">${cleanTitle}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Preset SVGs for standard catalog items
export const PLACEHOLDERS: Record<string, string> = {
  chicken: createSvgPlaceholder('Fresh Chicken', '#fee2e2', '#fca5a5', '#991b1b', '🍗'),
  mutton: createSvgPlaceholder('Fresh Mutton', '#fee2e2', '#f87171', '#7f1d1d', '🥩'),
  eggs: createSvgPlaceholder('Farm Eggs', '#fef3c7', '#fde047', '#854d0e', '🥚'),
  fish: createSvgPlaceholder('Fresh Fish', '#e0f2fe', '#7dd3fc', '#075985', '🐟'),
  saree: createSvgPlaceholder('Cotton Saree', '#fce7f3', '#f472b6', '#831843', '👗'),
  shirt: createSvgPlaceholder('Formal Shirt', '#e0e7ff', '#818cf8', '#312e81', '👔'),
  gold: createSvgPlaceholder('1g Gold Jewelry', '#fef08a', '#eab308', '#713f12', '💍'),
  rice: createSvgPlaceholder('Basmati Rice', '#ecfdf5', '#a7f3d0', '#064e3b', '🌾'),
  atta: createSvgPlaceholder('Fresh Atta', '#fef3c7', '#fde68a', '#78350f', '🥣'),
  dal: createSvgPlaceholder('Toor Dal', '#fef08a', '#facc15', '#713f12', '🍲'),
  oil: createSvgPlaceholder('Cooking Oil', '#fef9c3', '#fde047', '#713f12', '🌻'),
  spices: createSvgPlaceholder('Garam Masala', '#ffedd5', '#fb923c', '#7c2d12', '🌶️'),
  soap: createSvgPlaceholder('Sandal Soap', '#f0fdf4', '#86efac', '#14532d', '🧼'),
  dishwash: createSvgPlaceholder('Dishwash Gel', '#ecfdf5', '#34d399', '#064e3b', '🍋'),
  snacks: createSvgPlaceholder('Crispy Snacks', '#ffedd5', '#fdba74', '#7c2d12', '🥜'),
  milk: createSvgPlaceholder('Fresh Buffalo Milk', '#f0f9ff', '#bae6fd', '#0c4a6e', '🥛'),
  curd: createSvgPlaceholder('Thick Curd', '#f8fafc', '#e2e8f0', '#334155', '🥣'),
  paneer: createSvgPlaceholder('Fresh Paneer', '#fefce8', '#fef08a', '#713f12', '🧀'),
  ghee: createSvgPlaceholder('Pure Desi Ghee', '#fef08a', '#eab308', '#713f12', '🧈'),
  water: createSvgPlaceholder('20L Water Can', '#e0f2fe', '#38bdf8', '#0369a1', '💧'),
  tomato: createSvgPlaceholder('Fresh Tomatoes', '#fee2e2', '#ef4444', '#7f1d1d', '🍅'),
  onion: createSvgPlaceholder('Fresh Onions', '#f3e8ff', '#d8b4fe', '#581c87', '🧅'),
  potato: createSvgPlaceholder('Fresh Potatoes', '#fef3c7', '#fcd34d', '#78350f', '🥔'),
  fruits: createSvgPlaceholder('Fresh Fruit Basket', '#fef2f2', '#fca5a5', '#991b1b', '🍎'),
  cake: createSvgPlaceholder('Fresh Bakery Cake', '#fdf2f8', '#f472b6', '#831843', '🎂'),
  icecream: createSvgPlaceholder('Ice Cream Cup', '#ecfeff', '#67e8f9', '#164e63', '🍨'),
  biryani: createSvgPlaceholder('Hyderabadi Biryani', '#fff7ed', '#fb923c', '#7c2d12', '🍲'),
  meals: createSvgPlaceholder('South Indian Meals', '#fefce8', '#fde047', '#713f12', '🍱'),
  tiffin: createSvgPlaceholder('Fresh Tiffins / Dosa', '#fef3c7', '#fcd34d', '#78350f', '🥞'),
  general: createSvgPlaceholder('Local Bandi Product', '#f8fafc', '#cbd5e1', '#0f172a', '📦'),
  property: createSvgPlaceholder('Real Estate Property', '#e0e7ff', '#a5b4fc', '#312e81', '🏡'),
  matrimonyMale: createSvgPlaceholder('Groom Profile', '#e0f2fe', '#7dd3fc', '#0369a1', '🤵'),
  matrimonyFemale: createSvgPlaceholder('Bride Profile', '#fce7f3', '#f472b6', '#831843', '👰'),
};

export function getCleanPlaceholder(keyOrName: string, category?: string): string {
  const lower = (keyOrName || '').toLowerCase();
  const cat = (category || '').toLowerCase();

  for (const [key, val] of Object.entries(PLACEHOLDERS)) {
    if (lower.includes(key) || cat.includes(key)) {
      return val;
    }
  }

  return createSvgPlaceholder(keyOrName || 'Product', '#fef3c7', '#fde68a', '#78350f', '🛍️');
}
