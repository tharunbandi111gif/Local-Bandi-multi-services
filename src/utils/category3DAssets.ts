/**
 * Local Bandi 3D Category & Service Visual Assets
 * High-depth, glossy, isometric 3D-styled SVG illustrations with multi-stop gradients,
 * embossed bevels, realistic shadows, and rich tactile depth for Android mobile screens.
 */

// Helper to generate 3D isometric SVG assets with depth layers
const create3DIconSvg = (
  gradientStart: string,
  gradientEnd: string,
  shadowColor: string,
  primaryEmojiOrShape: string,
  ambientGlow: string
): string => {
  const encoded = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <!-- Base 3D Claymorphic Tile Gradient -->
    <linearGradient id="tileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradientStart}"/>
      <stop offset="100%" stop-color="${gradientEnd}"/>
    </linearGradient>
    
    <!-- Top Specular Gloss Highlight -->
    <linearGradient id="glossHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8"/>
      <stop offset="40%" stop-color="#ffffff" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.0"/>
    </linearGradient>

    <!-- Bottom Depth Rim Gradient -->
    <linearGradient id="depthRim" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="${shadowColor}" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${shadowColor}" stop-opacity="0.0"/>
    </linearGradient>

    <!-- 3D Drop Shadow -->
    <filter id="clayShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="${shadowColor}" flood-opacity="0.38"/>
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.15"/>
    </filter>

    <filter id="iconGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Ambient Light Backing -->
  <circle cx="60" cy="60" r="48" fill="${ambientGlow}" opacity="0.4" />

  <!-- 3D Beveled Base Tile -->
  <rect x="14" y="14" width="92" height="92" rx="26" fill="url(#tileGrad)" filter="url(#clayShadow)"/>

  <!-- Bottom Rim Shadow for Physical Thickness -->
  <rect x="14" y="55" width="92" height="51" rx="26" fill="url(#depthRim)"/>

  <!-- Top Glass Highlight Rim -->
  <rect x="15" y="15" width="90" height="42" rx="25" fill="url(#glossHighlight)"/>

  <!-- Inner Soft Bevel Glow -->
  <rect x="16" y="16" width="88" height="88" rx="24" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-opacity="0.5"/>

  <!-- 3D Core Motif Visual -->
  <g filter="url(#iconGlow)">
    <text x="60" y="69" font-size="44" text-anchor="middle" dominant-baseline="middle" font-family="'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif">
      ${primaryEmojiOrShape}
    </text>
  </g>

  <!-- Specular Lens Flare Spot -->
  <ellipse cx="34" cy="30" rx="8" ry="4" fill="#ffffff" opacity="0.65" transform="rotate(-30 34 30)"/>
</svg>
  `.trim());

  return `data:image/svg+xml;utf8,${encoded}`;
};

export const CATEGORY_3D_ASSETS: Record<string, {
  image: string;
  gradient: string;
  shadow: string;
  accent: string;
  emoji: string;
}> = {
  meat: {
    image: create3DIconSvg('#ff6b6b', '#c92a2a', '#7a0916', '🥩', '#ffe3e3'),
    gradient: 'from-rose-500 to-red-700',
    shadow: 'shadow-rose-500/30',
    accent: '#e03131',
    emoji: '🥩'
  },
  dairy: {
    image: create3DIconSvg('#4dabf7', '#1971c2', '#0c3d69', '🥛', '#d0ebff'),
    gradient: 'from-blue-400 to-indigo-600',
    shadow: 'shadow-blue-500/30',
    accent: '#1971c2',
    emoji: '🥛'
  },
  water: {
    image: create3DIconSvg('#38d9a9', '#0ca678', '#08523c', '💧', '#c3fae8'),
    gradient: 'from-teal-400 to-emerald-600',
    shadow: 'shadow-teal-500/30',
    accent: '#0ca678',
    emoji: '💧'
  },
  fancy: {
    image: create3DIconSvg('#f06595', '#a61e4d', '#610526', '👗', '#fcc2d7'),
    gradient: 'from-pink-400 to-rose-600',
    shadow: 'shadow-pink-500/30',
    accent: '#a61e4d',
    emoji: '👗'
  },
  veg: {
    image: create3DIconSvg('#69db7c', '#2f9e44', '#155220', '🥦', '#d3f9d8'),
    gradient: 'from-green-400 to-emerald-600',
    shadow: 'shadow-green-500/30',
    accent: '#2f9e44',
    emoji: '🥦'
  },
  food: {
    image: create3DIconSvg('#ffa94d', '#e8590c', '#7d2600', '🍲', '#ffe8cc'),
    gradient: 'from-amber-400 to-orange-600',
    shadow: 'shadow-orange-500/30',
    accent: '#e8590c',
    emoji: '🍲'
  },
  groceries: {
    image: create3DIconSvg('#51cf66', '#2b8a3e', '#13471c', '🛒', '#d3f9d8'),
    gradient: 'from-emerald-400 to-green-700',
    shadow: 'shadow-emerald-500/30',
    accent: '#2b8a3e',
    emoji: '🛒'
  },
  maids: {
    image: create3DIconSvg('#cc5de8', '#862e9c', '#460d54', '🧹', '#f3d9fa'),
    gradient: 'from-purple-400 to-fuchsia-600',
    shadow: 'shadow-purple-500/30',
    accent: '#862e9c',
    emoji: '🧹'
  },
  mechanics: {
    image: create3DIconSvg('#ff922b', '#d9480f', '#731e00', '🔧', '#ffe8cc'),
    gradient: 'from-amber-500 to-orange-600',
    shadow: 'shadow-amber-500/30',
    accent: '#d9480f',
    emoji: '🔧'
  },
  construction: {
    image: create3DIconSvg('#fcc419', '#e67700', '#7a3e00', '🏗️', '#fff3bf'),
    gradient: 'from-yellow-400 to-amber-600',
    shadow: 'shadow-yellow-500/30',
    accent: '#e67700',
    emoji: '🏗️'
  },
  care: {
    image: create3DIconSvg('#ff8787', '#e03131', '#7a0e0e', '👶', '#ffe3e3'),
    gradient: 'from-rose-400 to-red-600',
    shadow: 'shadow-rose-500/30',
    accent: '#e03131',
    emoji: '👶'
  },
  marriage: {
    image: create3DIconSvg('#da77f2', '#9c36b5', '#490f57', '💍', '#f3d9fa'),
    gradient: 'from-fuchsia-500 to-purple-700',
    shadow: 'shadow-fuchsia-500/30',
    accent: '#9c36b5',
    emoji: '💍'
  },
  bakery: {
    image: create3DIconSvg('#faa2c1', '#c2255c', '#6e072f', '🎂', '#ffdeeb'),
    gradient: 'from-pink-400 to-rose-600',
    shadow: 'shadow-pink-500/30',
    accent: '#c2255c',
    emoji: '🎂'
  },
  pharmacy: {
    image: create3DIconSvg('#63e6be', '#12b886', '#06573e', '💊', '#c3fae8'),
    gradient: 'from-teal-400 to-emerald-600',
    shadow: 'shadow-teal-500/30',
    accent: '#12b886',
    emoji: '💊'
  },
  hospital_op: {
    image: create3DIconSvg('#4dabf7', '#228be6', '#0c4a85', '🩺', '#d0ebff'),
    gradient: 'from-sky-400 to-blue-600',
    shadow: 'shadow-sky-500/30',
    accent: '#228be6',
    emoji: '🩺'
  },
  household: {
    image: create3DIconSvg('#748ffc', '#4263eb', '#182b80', '🏠', '#dbe4ff'),
    gradient: 'from-indigo-400 to-blue-600',
    shadow: 'shadow-indigo-500/30',
    accent: '#4263eb',
    emoji: '🏠'
  },
  electronics: {
    image: create3DIconSvg('#91a7ff', '#4c6ef5', '#1a2e87', '📱', '#edf2ff'),
    gradient: 'from-blue-400 to-indigo-600',
    shadow: 'shadow-indigo-500/30',
    accent: '#4c6ef5',
    emoji: '📱'
  },
  services: {
    image: create3DIconSvg('#ffd43b', '#fab005', '#8a5c00', '✨', '#fff9db'),
    gradient: 'from-amber-300 to-yellow-500',
    shadow: 'shadow-amber-400/30',
    accent: '#fab005',
    emoji: '✨'
  },
  emergency: {
    image: create3DIconSvg('#ff6b6b', '#fa5252', '#820e0e', '🚨', '#ffe3e3'),
    gradient: 'from-red-500 to-rose-700',
    shadow: 'shadow-red-500/40',
    accent: '#fa5252',
    emoji: '🚨'
  },
  events: {
    image: create3DIconSvg('#f783ac', '#d6336c', '#6d082e', '🎉', '#ffdeeb'),
    gradient: 'from-fuchsia-400 to-pink-600',
    shadow: 'shadow-pink-500/30',
    accent: '#d6336c',
    emoji: '🎉'
  },
  religious: {
    image: create3DIconSvg('#ffd43b', '#f59f00', '#824e00', '🕉️', '#fff3bf'),
    gradient: 'from-amber-400 to-yellow-600',
    shadow: 'shadow-amber-500/30',
    accent: '#f59f00',
    emoji: '🕉️'
  },
  temple: {
    image: create3DIconSvg('#ff922b', '#fd7e14', '#8a3c00', '🛕', '#ffe8cc'),
    gradient: 'from-orange-400 to-amber-600',
    shadow: 'shadow-orange-500/30',
    accent: '#fd7e14',
    emoji: '🛕'
  },
  catering: {
    image: create3DIconSvg('#ffa94d', '#f76707', '#802a00', '👨‍🍳', '#ffe8cc'),
    gradient: 'from-amber-400 to-orange-600',
    shadow: 'shadow-orange-500/30',
    accent: '#f76707',
    emoji: '👨‍🍳'
  },
  jobs: {
    image: create3DIconSvg('#4dabf7', '#1c7ed6', '#09457a', '💼', '#d0ebff'),
    gradient: 'from-blue-400 to-sky-600',
    shadow: 'shadow-blue-500/30',
    accent: '#1c7ed6',
    emoji: '💼'
  },
  handicrafts: {
    image: create3DIconSvg('#ffc078', '#d9480f', '#6e1d00', '🏺', '#ffe8cc'),
    gradient: 'from-amber-400 to-orange-700',
    shadow: 'shadow-orange-500/30',
    accent: '#d9480f',
    emoji: '🏺'
  },
  travel: {
    image: create3DIconSvg('#3bc9db', '#1098ad', '#054e59', '🚗', '#c5f6fa'),
    gradient: 'from-cyan-400 to-teal-600',
    shadow: 'shadow-cyan-500/30',
    accent: '#1098ad',
    emoji: '🚗'
  },
  realestate: {
    image: create3DIconSvg('#748ffc', '#3b5bdb', '#142570', '🏢', '#dbe4ff'),
    gradient: 'from-indigo-400 to-blue-700',
    shadow: 'shadow-indigo-500/30',
    accent: '#3b5bdb',
    emoji: '🏢'
  },
  driving_school: {
    image: create3DIconSvg('#4dabf7', '#1971c2', '#093a69', '🚦', '#d0ebff'),
    gradient: 'from-sky-400 to-blue-600',
    shadow: 'shadow-blue-500/30',
    accent: '#1971c2',
    emoji: '🚦'
  },
  beauty_parlour: {
    image: create3DIconSvg('#f06595', '#c2255c', '#61092a', '💄', '#ffdeeb'),
    gradient: 'from-pink-400 to-rose-600',
    shadow: 'shadow-pink-500/30',
    accent: '#c2255c',
    emoji: '💄'
  },
  agriculture: {
    image: create3DIconSvg('#8ce99a', '#37b24d', '#135c20', '🌾', '#d3f9d8'),
    gradient: 'from-emerald-300 to-green-600',
    shadow: 'shadow-emerald-500/30',
    accent: '#37b24d',
    emoji: '🌾'
  },
  auto_garage: {
    image: create3DIconSvg('#adb5bd', '#495057', '#1b1d20', '🏍️', '#e9ecef'),
    gradient: 'from-slate-400 to-gray-700',
    shadow: 'shadow-gray-500/30',
    accent: '#495057',
    emoji: '🏍️'
  },
  education: {
    image: create3DIconSvg('#4dabf7', '#1c7ed6', '#0b4a82', '📚', '#d0ebff'),
    gradient: 'from-blue-400 to-indigo-600',
    shadow: 'shadow-blue-500/30',
    accent: '#1c7ed6',
    emoji: '📚'
  },
  pets: {
    image: create3DIconSvg('#ffa94d', '#e8590c', '#752500', '🐶', '#ffe8cc'),
    gradient: 'from-amber-400 to-orange-500',
    shadow: 'shadow-amber-500/30',
    accent: '#e8590c',
    emoji: '🐶'
  },
  sports: {
    image: create3DIconSvg('#69db7c', '#20c997', '#085e45', '⚽', '#c3fae8'),
    gradient: 'from-green-400 to-teal-500',
    shadow: 'shadow-green-500/30',
    accent: '#20c997',
    emoji: '⚽'
  },
  footwear: {
    image: create3DIconSvg('#b197fc', '#7950f2', '#361c8a', '👟', '#e5dbff'),
    gradient: 'from-purple-400 to-indigo-600',
    shadow: 'shadow-purple-500/30',
    accent: '#7950f2',
    emoji: '👟'
  },
  chitfund: {
    image: create3DIconSvg('#ffd43b', '#fab005', '#8a5c00', '💰', '#fff3bf'),
    gradient: 'from-yellow-400 to-amber-600',
    shadow: 'shadow-yellow-500/30',
    accent: '#fab005',
    emoji: '💰'
  },
  books: {
    image: create3DIconSvg('#69db7c', '#2f9e44', '#104d1c', '📖', '#d3f9d8'),
    gradient: 'from-emerald-400 to-green-600',
    shadow: 'shadow-emerald-500/30',
    accent: '#2f9e44',
    emoji: '📖'
  },
  gifts: {
    image: create3DIconSvg('#ff8787', '#fa5252', '#7a0e0e', '🎁', '#ffe3e3'),
    gradient: 'from-rose-400 to-red-600',
    shadow: 'shadow-rose-500/30',
    accent: '#fa5252',
    emoji: '🎁'
  },
  sweets: {
    image: create3DIconSvg('#ffa94d', '#f76707', '#802a00', '🍬', '#ffe8cc'),
    gradient: 'from-amber-400 to-orange-600',
    shadow: 'shadow-amber-500/30',
    accent: '#f76707',
    emoji: '🍬'
  }
};

export const getCategory3DAsset = (categoryId: string) => {
  const norm = (categoryId || '').toLowerCase().replace(/[\s-]+/g, '_');
  if (CATEGORY_3D_ASSETS[norm]) {
    return CATEGORY_3D_ASSETS[norm];
  }
  // Fallback 3D isometric asset
  return {
    image: create3DIconSvg('#6366f1', '#4338ca', '#231d6e', '🛍️', '#e0e7ff'),
    gradient: 'from-indigo-500 to-purple-700',
    shadow: 'shadow-indigo-500/30',
    accent: '#4f46e5',
    emoji: '🛍️'
  };
};
