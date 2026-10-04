import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowRight,
  Database,
  Sparkles,
  Info,
  Check,
  FileText
} from 'lucide-react';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, VendorProfile } from '../types';
import { CATEGORIES } from '../constants';

interface BulkProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorProfile: VendorProfile | null;
  existingProducts: Product[];
  onImportComplete?: (imported: { added: number; updated: number }) => void;
}

export interface ParsedProductRow {
  rowNumber: number;
  id?: string;
  name: string;
  price: number;
  originalPrice?: number;
  stock: number;
  unit: string;
  category: string;
  description: string;
  image: string;
  isAvailable: boolean;
  status: 'new' | 'update' | 'error';
  existingProduct?: Product;
  errorMessage?: string;
}

const DEFAULT_FALLBACK_IMAGE = 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E';

/**
 * Robust CSV Line Parser
 * Handles escaped quotes (""), commas in quotes, and newline trimming
 */
export function parseCSVString(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentCell += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export function BulkProductImportModal({
  isOpen,
  onClose,
  vendorProfile,
  existingProducts,
  onImportComplete
}: BulkProductImportModalProps) {
  const [activeInputMode, setActiveInputMode] = useState<'upload' | 'paste'>('upload');
  const [csvRawText, setCsvRawText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [matchByName, setMatchByName] = useState(true);
  const [skipErrors, setSkipErrors] = useState(true);

  // Parsed and validated state
  const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'new' | 'update' | 'error'>('all');
  const [previewSearch, setPreviewSearch] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [importResult, setImportResult] = useState<{ added: number; updated: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean state when modal opens/closes
  const handleReset = () => {
    setCsvRawText('');
    setFileName(null);
    setParsedRows([]);
    setImportResult(null);
    setProgressPercent(0);
    setProgressMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleModalClose = () => {
    if (!isProcessing) {
      handleReset();
      onClose();
    }
  };

  // Download template CSV
  const handleDownloadTemplate = () => {
    const defaultCat = vendorProfile?.service || 'groceries';
    const csvContent = 
`ID,Name,Price,OriginalPrice,Stock,Unit,Category,Description,Image,Available
,Fresh Premium Apples,180,200,50,1 kg,fruits,Fresh farm-harvested crisp apples,,TRUE
,Basmati Rice Special 5kg,420,480,25,5 kg,${defaultCat},Aged aromatic long grain basmati rice,,TRUE
,Organic Whole Cow Milk,65,70,100,1 L,dairy,Fresh pasteurized morning cow milk,,TRUE
,Crispy Snack Mixture,45,50,80,200 g,snacks,Traditional spiced crispy namkeen mixture,,TRUE`;

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LocalBandi_Product_Import_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export current catalog as CSV
  const handleExportCatalog = () => {
    if (!existingProducts || existingProducts.length === 0) {
      alert("You don't have any products to export yet.");
      return;
    }

    const headers = ['ID', 'Name', 'Price', 'OriginalPrice', 'Stock', 'Unit', 'Category', 'Description', 'Image', 'Available'];
    const rows = existingProducts.map(p => {
      const escape = (str: any) => `"${String(str || '').replace(/"/g, '""')}"`;
      return [
        escape(p.id),
        escape(p.name),
        p.price || 0,
        p.originalPrice || '',
        p.stock ?? 100,
        escape(p.unit || '1 unit'),
        escape(p.category || vendorProfile?.service || 'groceries'),
        escape(p.description || ''),
        escape(p.image || ''),
        p.isAvailable !== false ? 'TRUE' : 'FALSE'
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${(vendorProfile?.businessName || 'My_Store').replace(/\s+/g, '_')}_Inventory_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Load sample data directly for quick testing
  const handleLoadSampleData = () => {
    const defaultCat = vendorProfile?.service || 'groceries';
    const sample = 
`ID,Name,Price,OriginalPrice,Stock,Unit,Category,Description,Image,Available
,Farm Fresh Bananas Robusta,55,65,40,1 dozen,fruits,Naturally ripened sweet bananas,,TRUE
,Golden Sona Masoori Rice,320,360,20,5 kg,${defaultCat},High quality polished everyday rice,,TRUE
,Pure Buffalo Ghee,340,380,15,500 ml,dairy,Aromatic granular pure buffalo ghee,,TRUE
,Crunchy Salted Peanuts,30,35,100,100 g,snacks,Roasted and lightly salted healthy snack,,TRUE`;
    setCsvRawText(sample);
    setFileName('sample_products.csv');
    processCsvText(sample);
  };

  // File Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvRawText(text);
      processCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      alert('Please upload a valid .csv file.');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvRawText(text);
      processCsvText(text);
    };
    reader.readAsText(file);
  };

  // Parse and validate rows
  const processCsvText = (rawText: string) => {
    if (!rawText.trim()) {
      setParsedRows([]);
      return;
    }

    const rows = parseCSVString(rawText);
    if (rows.length < 2) {
      alert('The CSV file does not contain enough data. It must have a header row and at least one product row.');
      setParsedRows([]);
      return;
    }

    const headerRow = rows[0].map(h => h.trim().toLowerCase());
    
    // Flexible header mapping
    const getColIndex = (aliases: string[]) => {
      return headerRow.findIndex(h => aliases.some(alias => h === alias || h.includes(alias)));
    };

    const idIdx = getColIndex(['id', 'sku', 'product_id', 'item_id', 'itemid']);
    const nameIdx = getColIndex(['name', 'product_name', 'item_name', 'title', 'item']);
    const priceIdx = getColIndex(['price', 'rate', 'cost', 'selling_price', 'mrp']);
    const originalPriceIdx = getColIndex(['originalprice', 'original_price', 'regular_price', 'mrp_price', 'strike_price']);
    const stockIdx = getColIndex(['stock', 'quantity', 'qty', 'inventory', 'count']);
    const unitIdx = getColIndex(['unit', 'measure', 'weight', 'size', 'package']);
    const categoryIdx = getColIndex(['category', 'cat', 'dept', 'department']);
    const descIdx = getColIndex(['description', 'desc', 'details', 'about']);
    const imageIdx = getColIndex(['image', 'photo', 'picture', 'url', 'image_url']);
    const availableIdx = getColIndex(['available', 'isavailable', 'is_available', 'active', 'in_stock']);

    if (nameIdx === -1 && priceIdx === -1) {
      alert("Could not identify 'Name' or 'Price' columns in the CSV. Please check header names or use the template.");
      setParsedRows([]);
      return;
    }

    const parsed: ParsedProductRow[] = [];

    // Process each data row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length === 0 || row.every(c => !c.trim())) continue;

      const rawId = idIdx !== -1 && row[idIdx] ? row[idIdx].trim() : '';
      const rawName = nameIdx !== -1 && row[nameIdx] ? row[nameIdx].trim() : '';
      const rawPriceStr = priceIdx !== -1 && row[priceIdx] ? row[priceIdx].replace(/[^0-9.]/g, '') : '';
      const rawPrice = parseFloat(rawPriceStr);
      
      const rawOrigPriceStr = originalPriceIdx !== -1 && row[originalPriceIdx] ? row[originalPriceIdx].replace(/[^0-9.]/g, '') : '';
      const rawOrigPrice = rawOrigPriceStr ? parseFloat(rawOrigPriceStr) : undefined;

      const rawStockStr = stockIdx !== -1 && row[stockIdx] ? row[stockIdx].replace(/[^0-9]/g, '') : '100';
      const rawStock = parseInt(rawStockStr, 10);

      const rawUnit = unitIdx !== -1 && row[unitIdx] ? row[unitIdx].trim() : '1 unit';
      const rawCategory = categoryIdx !== -1 && row[categoryIdx] ? row[categoryIdx].trim().toLowerCase() : (vendorProfile?.service || 'groceries');
      const rawDesc = descIdx !== -1 && row[descIdx] ? row[descIdx].trim() : '';
      const rawImage = imageIdx !== -1 && row[imageIdx] ? row[imageIdx].trim() : '';
      
      const rawAvailStr = availableIdx !== -1 && row[availableIdx] ? row[availableIdx].trim().toLowerCase() : 'true';
      const isAvailable = rawAvailStr !== 'false' && rawAvailStr !== 'no' && rawAvailStr !== '0';

      // Validation
      let status: 'new' | 'update' | 'error' = 'new';
      let errorMessage = '';
      let existingMatch: Product | undefined;

      if (!rawName) {
        status = 'error';
        errorMessage = 'Product name is required';
      } else if (isNaN(rawPrice) || rawPrice <= 0) {
        status = 'error';
        errorMessage = 'Valid price greater than ₹0 is required';
      } else {
        // Check if updating existing item by ID
        if (rawId) {
          existingMatch = existingProducts.find(p => p.id === rawId);
          if (existingMatch) {
            status = 'update';
          }
        }

        // If not matched by ID, check match by name if enabled
        if (!existingMatch && matchByName) {
          const matchByNameProduct = existingProducts.find(
            p => p.name.trim().toLowerCase() === rawName.toLowerCase()
          );
          if (matchByNameProduct) {
            existingMatch = matchByNameProduct;
            status = 'update';
          }
        }
      }

      parsed.push({
        rowNumber: i + 1,
        id: existingMatch ? existingMatch.id : (rawId || undefined),
        name: rawName,
        price: isNaN(rawPrice) ? 0 : rawPrice,
        originalPrice: rawOrigPrice && !isNaN(rawOrigPrice) ? rawOrigPrice : undefined,
        stock: isNaN(rawStock) ? 100 : Math.max(0, rawStock),
        unit: rawUnit || '1 unit',
        category: rawCategory || vendorProfile?.service || 'groceries',
        description: rawDesc,
        image: rawImage || (existingMatch?.image || DEFAULT_FALLBACK_IMAGE),
        isAvailable,
        status,
        existingProduct: existingMatch,
        errorMessage
      });
    }

    setParsedRows(parsed);
  };

  // Re-run matching if matchByName setting changes
  const handleToggleMatchByName = (checked: boolean) => {
    setMatchByName(checked);
    if (csvRawText) {
      setTimeout(() => processCsvText(csvRawText), 10);
    }
  };

  // Execute Firestore Batch Import
  const handleExecuteImport = async () => {
    if (!vendorProfile) {
      alert("Vendor profile not loaded. Please try again.");
      return;
    }

    const itemsToImport = parsedRows.filter(r => {
      if (r.status === 'error') return false;
      return true;
    });

    if (itemsToImport.length === 0) {
      alert("No valid products to import. Please check errors or add items.");
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMessage("Preparing batch records...");

    try {
      let totalAdded = 0;
      let totalUpdated = 0;

      // Firestore allows max 500 ops per writeBatch. We use chunks of 250 for safety.
      const CHUNK_SIZE = 250;
      const chunks: ParsedProductRow[][] = [];
      for (let i = 0; i < itemsToImport.length; i += CHUNK_SIZE) {
        chunks.push(itemsToImport.slice(i, i + CHUNK_SIZE));
      }

      for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
        const chunk = chunks[cIdx];
        const batch = writeBatch(db);

        chunk.forEach(item => {
          if (item.status === 'update' && item.id) {
            const docRef = doc(db, 'products', item.id);
            const updatePayload: any = {
              name: item.name,
              price: item.price,
              stock: item.stock,
              unit: item.unit,
              category: item.category,
              description: item.description || '',
              isAvailable: item.isAvailable,
              vendorId: vendorProfile.id,
              branchId: vendorProfile.branchId || 'main',
              updatedAt: serverTimestamp()
            };
            if (item.originalPrice) updatePayload.originalPrice = item.originalPrice;
            if (item.image && item.image !== DEFAULT_FALLBACK_IMAGE) updatePayload.image = item.image;
            
            batch.update(docRef, updatePayload);
            totalUpdated++;
          } else {
            // New product
            const productsCollection = collection(db, 'products');
            const newDocRef = item.id ? doc(db, 'products', item.id) : doc(productsCollection);
            const newProductPayload: any = {
              id: newDocRef.id,
              name: item.name,
              price: item.price,
              stock: item.stock,
              unit: item.unit,
              category: item.category,
              description: item.description || '',
              image: item.image || DEFAULT_FALLBACK_IMAGE,
              isAvailable: item.isAvailable,
              vendorId: vendorProfile.id,
              branchId: vendorProfile.branchId || 'main',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            if (item.originalPrice) newProductPayload.originalPrice = item.originalPrice;

            batch.set(newDocRef, newProductPayload);
            totalAdded++;
          }
        });

        setProgressPercent(Math.round(((cIdx + 1) / chunks.length) * 80) + 10);
        setProgressMessage(`Saving batch ${cIdx + 1} of ${chunks.length}...`);
        await batch.commit();
      }

      setProgressPercent(100);
      setProgressMessage("Import completed successfully!");
      setImportResult({ added: totalAdded, updated: totalUpdated });

      if (onImportComplete) {
        onImportComplete({ added: totalAdded, updated: totalUpdated });
      }
    } catch (err: any) {
      console.error("Bulk import failed:", err);
      handleFirestoreError(err, OperationType.WRITE, 'products');
      alert(`Bulk import encountered an error: ${err.message || 'Please check your connection and retry.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered rows for the preview table
  const filteredRows = parsedRows.filter(row => {
    if (filterTab === 'new' && row.status !== 'new') return false;
    if (filterTab === 'update' && row.status !== 'update') return false;
    if (filterTab === 'error' && row.status !== 'error') return false;

    if (previewSearch.trim()) {
      const q = previewSearch.toLowerCase();
      return (
        row.name.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        row.unit.toLowerCase().includes(q) ||
        (row.id && row.id.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const countNew = parsedRows.filter(r => r.status === 'new').length;
  const countUpdate = parsedRows.filter(r => r.status === 'update').length;
  const countError = parsedRows.filter(r => r.status === 'error').length;
  const countValid = countNew + countUpdate;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={handleModalClose} 
        className="fixed inset-0 bg-gray-950/70 backdrop-blur-md" 
      />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 25 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 25 }}
        className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh] my-auto"
      >
        {/* Header */}
        <div className="px-6 sm:px-8 pt-7 pb-5 border-b border-gray-100 flex items-start justify-between bg-gradient-to-r from-amber-50/50 via-white to-indigo-50/50">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight italic">
                Bulk Product Import (CSV)
              </h2>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[9px] font-black uppercase tracking-wider">
                Instant Multi-Update
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-500">
              Add multiple items at once or update existing stock and prices using a spreadsheet.
            </p>
          </div>

          <button 
            onClick={handleModalClose}
            disabled={isProcessing}
            className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar (Download Template & Export Catalog) */}
        <div className="px-6 sm:px-8 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 bg-white hover:bg-indigo-50 text-indigo-700 font-black rounded-xl border border-indigo-200 shadow-2xs flex items-center gap-1.5 transition-all text-[11px]"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              Download CSV Template
            </button>

            <button
              type="button"
              onClick={handleExportCatalog}
              className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-700 font-black rounded-xl border border-emerald-200 shadow-2xs flex items-center gap-1.5 transition-all text-[11px]"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              Export Current Catalog ({existingProducts.length})
            </button>

            <button
              type="button"
              onClick={handleLoadSampleData}
              className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-black rounded-xl text-[11px] flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Load Sample Demo Data
            </button>
          </div>

          <span className="text-[10px] font-bold text-gray-400">
            Current Store: <strong className="text-gray-700">{vendorProfile?.businessName || vendorProfile?.storeName || 'My Store'}</strong>
          </span>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Result Celebration View */}
          {importResult ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-10 text-center space-y-5"
            >
              <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-100">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900">Import Successful!</h3>
                <p className="text-sm font-semibold text-gray-500 mt-1">
                  Your store inventory has been updated in real-time.
                </p>
              </div>

              <div className="inline-flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200 text-left">
                <div className="px-4 border-r border-gray-200">
                  <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">New Items Added</span>
                  <span className="text-2xl font-black text-emerald-600">+{importResult.added}</span>
                </div>
                <div className="px-4">
                  <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Existing Updated</span>
                  <span className="text-2xl font-black text-indigo-600">~{importResult.updated}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl font-black text-xs uppercase tracking-wider transition-colors"
                >
                  Import Another File
                </button>
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-8 py-3.5 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl shadow-gray-200 transition-all"
                >
                  Close & View Store Inventory
                </button>
              </div>
            </motion.div>
          ) : parsedRows.length === 0 ? (
            /* Input Section (Upload or Paste) */
            <div className="space-y-5">
              {/* Input Mode Tabs */}
              <div className="flex bg-gray-100 p-1 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setActiveInputMode('upload')}
                  className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${
                    activeInputMode === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Upload .CSV File
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInputMode('paste')}
                  className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${
                    activeInputMode === 'paste' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Paste CSV Text
                </button>
              </div>

              {activeInputMode === 'upload' ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/20 hover:bg-indigo-50/40 rounded-[2rem] p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="w-16 h-16 rounded-3xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-indigo-100">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-base font-black text-gray-900">
                      Click to choose CSV file or drag and drop here
                    </p>
                    <p className="text-xs font-semibold text-gray-400 mt-1">
                      Supports comma-separated values exported from Excel, Google Sheets, or Numbers
                    </p>
                  </div>
                  <span className="px-4 py-1.5 bg-white border border-indigo-200 rounded-xl text-[10px] font-black uppercase text-indigo-700 tracking-wider shadow-2xs">
                    Browse File (.csv)
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
                      Paste Raw CSV Content
                    </label>
                    <span className="text-[10px] text-gray-400 font-semibold">Includes headers row</span>
                  </div>
                  <textarea
                    value={csvRawText}
                    onChange={(e) => setCsvRawText(e.target.value)}
                    placeholder="ID,Name,Price,Stock,Unit,Category&#10;,Fresh Tomatoes,40,100,1 kg,veg&#10;,Fresh Onions,35,80,1 kg,veg"
                    rows={8}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 font-mono text-xs text-gray-800 outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => processCsvText(csvRawText)}
                    disabled={!csvRawText.trim()}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Parse & Review Products
                  </button>
                </div>
              )}

              {/* Tips & Instructions */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-2 text-amber-900">
                <div className="flex items-center gap-2 font-black">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>How Bulk Import & Updates Work:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] font-medium text-amber-800 ml-1">
                  <li><strong>New Items:</strong> Leave the <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">ID</code> column blank to create a fresh product listing.</li>
                  <li><strong>Updating Existing Items:</strong> Keep the original product <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">ID</code> in the CSV. Any price, stock, or description changes will instantly update that existing product!</li>
                  <li><strong>Required Columns:</strong> <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">Name</code> and <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">Price</code>. Other columns (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">Stock</code>, <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">Unit</code>, <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">Category</code>) have smart defaults.</li>
                </ul>
              </div>
            </div>
          ) : (
            /* Live Preview & Validation Table View */
            <div className="space-y-5">
              {/* Summary Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Total Rows</span>
                  <span className="text-xl font-black text-gray-900">{parsedRows.length} items</span>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">New Products</span>
                  <span className="text-xl font-black text-emerald-700">+{countNew} to add</span>
                </div>
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">Existing Updates</span>
                  <span className="text-xl font-black text-indigo-700">~{countUpdate} to update</span>
                </div>
                <div className={`p-4 rounded-2xl border ${countError > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                  <span className="text-[10px] font-black uppercase tracking-wider block">Errors / Invalid</span>
                  <span className="text-xl font-black">{countError} rows</span>
                </div>
              </div>

              {/* Filter Tabs & Preview Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex bg-gray-100 p-1 rounded-2xl text-[11px] font-black overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setFilterTab('all')}
                    className={`px-3.5 py-1.5 rounded-xl transition-all ${filterTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                  >
                    All ({parsedRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('new')}
                    className={`px-3.5 py-1.5 rounded-xl transition-all ${filterTab === 'new' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'}`}
                  >
                    New ({countNew})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('update')}
                    className={`px-3.5 py-1.5 rounded-xl transition-all ${filterTab === 'update' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'}`}
                  >
                    Updates ({countUpdate})
                  </button>
                  {countError > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterTab('error')}
                      className={`px-3.5 py-1.5 rounded-xl transition-all ${filterTab === 'error' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}
                    >
                      Errors ({countError})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <input
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    placeholder="Search in preview..."
                    className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold outline-none focus:border-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors"
                  >
                    Re-upload
                  </button>
                </div>
              </div>

              {/* Match Options Toggles */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700 select-none">
                  <input
                    type="checkbox"
                    checked={matchByName}
                    onChange={(e) => handleToggleMatchByName(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span>Match existing items by exact product name if ID is blank</span>
                </label>

                {countError > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-800 select-none">
                    <input
                      type="checkbox"
                      checked={skipErrors}
                      onChange={(e) => setSkipErrors(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 border-gray-300 focus:ring-amber-500"
                    />
                    <span>Skip invalid rows and import {countValid} valid items</span>
                  </label>
                )}
              </div>

              {/* Scrollable Table */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Item Name</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Stock</th>
                      <th className="p-3">Unit</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Details / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-gray-400 font-bold">
                          No items match the current filter.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => {
                        const isUpdate = row.status === 'update';
                        const isError = row.status === 'error';
                        const oldItem = row.existingProduct;

                        return (
                          <tr key={row.rowNumber} className={isError ? 'bg-red-50/40' : isUpdate ? 'bg-indigo-50/20' : 'hover:bg-gray-50'}>
                            <td className="p-3 text-gray-400 text-[10px] font-mono">{row.rowNumber}</td>
                            <td className="p-3">
                              {isError ? (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 font-black rounded-md text-[9px] uppercase tracking-wider inline-flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Invalid
                                </span>
                              ) : isUpdate ? (
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 font-black rounded-md text-[9px] uppercase tracking-wider inline-flex items-center gap-1">
                                  <RefreshCw className="w-2.5 h-2.5" /> Update
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-black rounded-md text-[9px] uppercase tracking-wider inline-flex items-center gap-1">
                                  <Plus className="w-2.5 h-2.5" /> New
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-bold text-gray-900">
                              {row.name || <span className="text-red-400 italic">Empty Name</span>}
                            </td>
                            <td className="p-3 font-bold">
                              {isUpdate && oldItem && oldItem.price !== row.price ? (
                                <div className="flex items-center gap-1">
                                  <span className="line-through text-gray-400 text-[10px]">₹{oldItem.price}</span>
                                  <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
                                  <span className="text-indigo-600 font-black">₹{row.price}</span>
                                </div>
                              ) : (
                                <span>₹{row.price}</span>
                              )}
                            </td>
                            <td className="p-3">
                              {isUpdate && oldItem && oldItem.stock !== row.stock ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-400 text-[10px]">{oldItem.stock ?? 100}</span>
                                  <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
                                  <span className="text-indigo-600 font-bold">{row.stock}</span>
                                </div>
                              ) : (
                                <span>{row.stock}</span>
                              )}
                            </td>
                            <td className="p-3 text-gray-600">{row.unit}</td>
                            <td className="p-3 text-gray-600 capitalize">{row.category}</td>
                            <td className="p-3 text-[11px]">
                              {isError ? (
                                <span className="text-red-600 font-bold">{row.errorMessage}</span>
                              ) : isUpdate ? (
                                <span className="text-indigo-600 font-semibold text-[10px]">
                                  Matched: {oldItem?.name} ({row.id?.slice(0, 8)}...)
                                </span>
                              ) : (
                                <span className="text-emerald-600 text-[10px]">New listing</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Progress Bar while importing */}
          {isProcessing && (
            <div className="space-y-2 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
              <div className="flex items-center justify-between text-xs font-black text-indigo-900">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  {progressMessage}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-indigo-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-300" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleModalClose}
            disabled={isProcessing}
            className="px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-black text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          {parsedRows.length > 0 && !importResult && (
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isProcessing || (countValid === 0) || (countError > 0 && !skipErrors)}
              className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-indigo-200 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Importing to Store...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm Import ({countValid} Products)
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default BulkProductImportModal;
