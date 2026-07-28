import { Category, Product, Service, LanguageCode } from '../types';
import { getLocalizedCategoryName } from './localizedContent';

// Levenshtein distance calculation
export function levenshteinDistance(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const matrix: number[][] = [];
  for (let i = 0; i <= bl; i++) matrix[i] = [i];
  for (let j = 0; j <= al; j++) matrix[0][j] = j;

  for (let i = 1; i <= bl; i++) {
    for (let j = 1; j <= al; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bl][al];
}

// Common search spelling corrections & synonyms/transliteration dictionary
const SPELL_CORRECTIONS: Record<string, string> = {
  // Meats & Poultry
  'chiken': 'chicken',
  'chickn': 'chicken',
  'chkn': 'chicken',
  'chikn': 'chicken',
  'chk': 'chicken',
  'muttonn': 'mutton',
  'muton': 'mutton',
  'muttan': 'mutton',
  'eg': 'eggs',
  'egg': 'eggs',
  'egs': 'eggs',
  // Dairy & Milk
  'mlik': 'milk',
  'milkk': 'milk',
  'milik': 'milk',
  'paalu': 'milk',
  'palu': 'milk',
  'doodh': 'milk',
  'dudh': 'milk',
  'paner': 'paneer',
  'panner': 'paneer',
  'panir': 'paneer',
  // Vegetables
  'vegtables': 'veg',
  'vegitable': 'veg',
  'vgetables': 'veg',
  'sabji': 'veg',
  'sabzi': 'veg',
  'kura': 'veg',
  'kuragayalu': 'veg',
  // Water
  'watr': 'water',
  'wtr': 'water',
  'waterr': 'water',
  'neellu': 'water',
  'paani': 'water',
  'pani': 'water',
  // Food & Biryani
  'briyani': 'biryani',
  'biriyani': 'biryani',
  'birani': 'biryani',
  'curry': 'food',
  'tiffin': 'food',
  'tiffins': 'food',
  // Clothes & Fancy
  'sari': 'saree',
  'sare': 'saree',
  'saree': 'saree',
  'shirt': 'shirt',
  'dress': 'clothes',
  'gold': 'fancy',
  // Groceries
  'ric': 'rice',
  'ris': 'rice',
  'biyyam': 'rice',
  'chawal': 'rice',
  'dal': 'dal',
  'dall': 'dal',
  'papu': 'dal',
  'pappu': 'dal',
  'oil': 'oil',
  'oilu': 'oil',
  'tel': 'oil',
  'atta': 'atta',
  'godhuma': 'atta',
  // Services & Doctor
  'dockter': 'hospital',
  'doctr': 'doctor',
  'doc': 'doctor',
  'hspital': 'hospital',
  'op': 'hospital',
  'plumbr': 'mechanics',
  'plumber': 'mechanics',
  'mehanic': 'mechanics',
  'mecanic': 'mechanics',
  'marrige': 'marriage',
  'marage': 'marriage',
  'pelli': 'marriage',
  'shadi': 'marriage',
  'matrimoni': 'marriage',
  'bakry': 'bakery',
  'icream': 'ice cream',
  'iscream': 'ice cream'
};

export interface SmartSearchResult {
  filteredProducts: (Product | Service)[];
  filteredCategories: Category[];
  suggestedQuery: string | null;
  didYouMean: string | null;
  isCorrected: boolean;
}

export function performSmartSearch(
  query: string,
  products: (Product | Service)[],
  categories: Category[],
  language: LanguageCode = 'en-IN'
): SmartSearchResult {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return {
      filteredProducts: products,
      filteredCategories: categories,
      suggestedQuery: null,
      didYouMean: null,
      isCorrected: false
    };
  }

  // 1. Check direct spelling correction / alias
  let targetQuery = trimmed;
  let suggestedCorrection: string | null = null;

  if (SPELL_CORRECTIONS[trimmed]) {
    targetQuery = SPELL_CORRECTIONS[trimmed];
    suggestedCorrection = SPELL_CORRECTIONS[trimmed];
  } else {
    // Check individual token corrections
    const tokens = trimmed.split(/\s+/);
    const correctedTokens = tokens.map(t => SPELL_CORRECTIONS[t] || t);
    const joined = correctedTokens.join(' ');
    if (joined !== trimmed) {
      targetQuery = joined;
      suggestedCorrection = joined;
    }
  }

  // If no dictionary match, check fuzzy distance against category names & product names
  if (!suggestedCorrection && trimmed.length >= 3) {
    // Search best candidate among product names
    for (const p of products) {
      const pNameLower = (p.name || '').toLowerCase();
      const dist = levenshteinDistance(trimmed, pNameLower);
      if (dist > 0 && dist <= 2 && Math.abs(trimmed.length - pNameLower.length) <= 2) {
        suggestedCorrection = p.name;
        break;
      }
      // Check individual words
      const words = pNameLower.split(/\s+/);
      for (const w of words) {
        if (w.length >= 3) {
          const wDist = levenshteinDistance(trimmed, w);
          if (wDist > 0 && wDist <= 2) {
            suggestedCorrection = w;
            break;
          }
        }
      }
      if (suggestedCorrection) break;
    }

    if (!suggestedCorrection) {
      for (const cat of categories) {
        const catNameLower = cat.name.toLowerCase();
        const dist = levenshteinDistance(trimmed, catNameLower);
        if (dist > 0 && dist <= 2) {
          suggestedCorrection = cat.name;
          break;
        }
      }
    }
  }

  const effectiveSearchTerm = (suggestedCorrection || targetQuery).toLowerCase();

  // Filter Categories
  const filteredCategories = categories.filter(cat => {
    const enName = cat.name.toLowerCase();
    const locName = getLocalizedCategoryName(cat, language).toLowerCase();
    const catId = cat.id.toLowerCase();
    return (
      enName.includes(trimmed) ||
      locName.includes(trimmed) ||
      catId.includes(trimmed) ||
      enName.includes(effectiveSearchTerm) ||
      locName.includes(effectiveSearchTerm) ||
      levenshteinDistance(trimmed, enName) <= 2
    );
  });

  // Filter Products / Services
  const filteredProducts = products.filter(item => {
    const nameLower = (item.name || '').toLowerCase();
    const descLower = (item.description || '').toLowerCase();
    const catLower = (item.category || '').toLowerCase();
    const subCatLower = ((item as any).subCategory || '').toLowerCase();

    // Direct match with input query
    const directMatch =
      nameLower.includes(trimmed) ||
      descLower.includes(trimmed) ||
      catLower.includes(trimmed) ||
      subCatLower.includes(trimmed);

    if (directMatch) return true;

    // Match with corrected query term
    const correctedMatch =
      nameLower.includes(effectiveSearchTerm) ||
      descLower.includes(effectiveSearchTerm) ||
      catLower.includes(effectiveSearchTerm) ||
      subCatLower.includes(effectiveSearchTerm);

    if (correctedMatch) return true;

    // Fuzzy word match
    if (trimmed.length >= 3) {
      const words = nameLower.split(/\s+/);
      for (const w of words) {
        if (w.length >= 3 && levenshteinDistance(trimmed, w) <= 2) {
          return true;
        }
      }
    }

    return false;
  });

  const didYouMean = suggestedCorrection && suggestedCorrection.toLowerCase() !== trimmed
    ? suggestedCorrection
    : null;

  return {
    filteredProducts,
    filteredCategories,
    suggestedQuery: suggestedCorrection,
    didYouMean,
    isCorrected: !!didYouMean
  };
}
