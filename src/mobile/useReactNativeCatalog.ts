/**
 * React Native Hook: useReactNativeCatalog
 * Drop-in real-time catalog listener hook for React Native & mobile customer apps.
 * Automatically receives instant updates when Master Admin modifies categories or products.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ReactNativeCatalogService, RNCatalogOptions } from './reactNativeCatalogService';
import { Category, Product, Service } from '../types';

export interface UseReactNativeCatalogResult {
  categories: Category[];
  products: (Product | Service)[];
  isLoading: boolean;
  isCategoriesLoading: boolean;
  isProductsLoading: boolean;
  error: Error | null;
  lastUpdated: number;
  refetch: () => void;
}

export function useReactNativeCatalog(options: RNCatalogOptions = {}): UseReactNativeCatalogResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<(Product | Service)[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  const unsubCategoriesRef = useRef<(() => void) | null>(null);
  const unsubProductsRef = useRef<(() => void) | null>(null);

  const startListeners = useCallback(() => {
    setIsCategoriesLoading(true);
    setIsProductsLoading(true);
    setError(null);

    // Clean up previous listeners if any
    if (unsubCategoriesRef.current) unsubCategoriesRef.current();
    if (unsubProductsRef.current) unsubProductsRef.current();

    // 1. Subscribe to Categories in real-time
    unsubCategoriesRef.current = ReactNativeCatalogService.subscribeCategories(
      (newCategories) => {
        setCategories(newCategories);
        setIsCategoriesLoading(false);
        setLastUpdated(Date.now());
      },
      (err) => {
        setError(err);
        setIsCategoriesLoading(false);
      }
    );

    // 2. Subscribe to Products in real-time
    unsubProductsRef.current = ReactNativeCatalogService.subscribeProducts(
      options,
      (newProducts) => {
        setProducts(newProducts);
        setIsProductsLoading(false);
        setLastUpdated(Date.now());
      },
      (err) => {
        setError(err);
        setIsProductsLoading(false);
      }
    );
  }, [options.branchId, options.categoryId]);

  useEffect(() => {
    startListeners();

    return () => {
      if (unsubCategoriesRef.current) unsubCategoriesRef.current();
      if (unsubProductsRef.current) unsubProductsRef.current();
    };
  }, [startListeners]);

  return {
    categories,
    products,
    isLoading: isCategoriesLoading || isProductsLoading,
    isCategoriesLoading,
    isProductsLoading,
    error,
    lastUpdated,
    refetch: startListeners
  };
}
