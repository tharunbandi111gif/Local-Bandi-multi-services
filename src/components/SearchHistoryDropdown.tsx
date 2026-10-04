import React from 'react';
import { Clock, Store, Package, X, ArrowUpLeft, Trash2, Search } from 'lucide-react';
import { SearchHistoryItem } from '../types';

interface SearchHistoryDropdownProps {
  history: SearchHistoryItem[];
  onSelectSearch: (query: string) => void;
  onRemoveItem: (id: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
  className?: string;
}

export const SearchHistoryDropdown: React.FC<SearchHistoryDropdownProps> = ({
  history,
  onSelectSearch,
  onRemoveItem,
  onClearAll,
  className = ''
}) => {
  if (!history || history.length === 0) return null;

  return (
    <div 
      className={`absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100/90 z-50 overflow-hidden backdrop-blur-md p-3 animate-in fade-in slide-in-from-top-1 duration-150 ${className}`}
      onMouseDown={(e) => {
        // Prevent input blur before click registers
        e.preventDefault();
      }}
    >
      <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-gray-100 px-1">
        <div className="flex items-center gap-1.5 text-gray-500">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Recent Searches</span>
          <span className="text-[9px] font-bold text-gray-400">({history.length}/5)</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClearAll();
          }}
          className="text-[9.5px] font-bold text-gray-400 hover:text-rose-500 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded-lg hover:bg-rose-50"
        >
          <Trash2 className="w-3 h-3" />
          Clear All
        </button>
      </div>

      <div className="space-y-1">
        {history.map((item) => {
          const isStore = item.type === 'store';
          const isProduct = item.type === 'product';

          return (
            <div
              key={item.id}
              onClick={() => onSelectSearch(item.query)}
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-amber-50/60 active:bg-amber-100/70 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                  isStore ? 'bg-indigo-50 text-indigo-600' : isProduct ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {isStore ? (
                    <Store className="w-3.5 h-3.5" />
                  ) : isProduct ? (
                    <Package className="w-3.5 h-3.5" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-gray-800 truncate block group-hover:text-amber-900">
                    {item.query}
                  </span>
                  {item.targetName && (
                    <span className="text-[9px] text-gray-400 truncate block">
                      {item.targetName}
                    </span>
                  )}
                </div>

                {item.type && item.type !== 'general' && (
                  <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                    isStore ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.type}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={(e) => onRemoveItem(item.id, e)}
                  className="p-1 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                  title="Remove from history"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="text-gray-300 group-hover:text-amber-500 transition-colors">
                  <ArrowUpLeft className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
