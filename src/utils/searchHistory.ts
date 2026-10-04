import { SearchHistoryItem } from '../types';

const STORAGE_KEY = 'lokal_search_history';
const LEGACY_KEY = 'recentSearches';
const MAX_HISTORY = 5;

export function getSearchHistory(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => {
          if (typeof item === 'string') {
            return {
              id: item,
              query: item,
              type: 'general' as const,
              timestamp: Date.now()
            };
          }
          return item;
        }).slice(0, MAX_HISTORY);
      }
    }

    // Check legacy key
    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    if (legacyRaw) {
      const parsedLegacy = JSON.parse(legacyRaw);
      if (Array.isArray(parsedLegacy)) {
        const migrated: SearchHistoryItem[] = parsedLegacy.map((term: string) => ({
          id: term,
          query: term,
          type: 'general' as const,
          timestamp: Date.now()
        })).slice(0, MAX_HISTORY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch (err) {
    console.error('Failed to read search history:', err);
  }
  return [];
}

export function addSearchHistory(
  query: string, 
  type: 'store' | 'product' | 'category' | 'general' = 'general',
  targetName?: string
): SearchHistoryItem[] {
  const trimmed = query.trim();
  if (!trimmed) return getSearchHistory();

  try {
    const existing = getSearchHistory();
    // Deduplicate case-insensitively
    const filtered = existing.filter(item => item.query.toLowerCase() !== trimmed.toLowerCase());
    const newItem: SearchHistoryItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      query: trimmed,
      type,
      targetName,
      timestamp: Date.now()
    };
    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(LEGACY_KEY, JSON.stringify(updated.map(i => i.query)));
    window.dispatchEvent(new CustomEvent('search_history_updated', { detail: updated }));
    return updated;
  } catch (err) {
    console.error('Failed to save search history:', err);
    return [];
  }
}

export function removeSearchHistoryItem(identifier: string): SearchHistoryItem[] {
  try {
    const existing = getSearchHistory();
    const updated = existing.filter(item => item.id !== identifier && item.query !== identifier);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(LEGACY_KEY, JSON.stringify(updated.map(i => i.query)));
    window.dispatchEvent(new CustomEvent('search_history_updated', { detail: updated }));
    return updated;
  } catch (err) {
    console.error('Failed to remove search history item:', err);
    return [];
  }
}

export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_KEY);
    window.dispatchEvent(new CustomEvent('search_history_updated', { detail: [] }));
  } catch (err) {
    console.error('Failed to clear search history:', err);
  }
}
