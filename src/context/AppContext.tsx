import { createContext, useContext, type ReactNode } from 'react';
import type { BusinessConfig, Product } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { defaultBusinessConfig, sampleProducts } from '../lib/defaults';
import { calculateSellingPrice } from '../lib/calculations';

interface AppContextType {
  config: BusinessConfig;
  setConfig: (config: BusinessConfig | ((prev: BusinessConfig) => BusinessConfig)) => void;
  products: Product[];
  setProducts: (products: Product[] | ((prev: Product[]) => Product[])) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  recalculateAutoPrices: (cfg?: BusinessConfig) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useLocalStorage<BusinessConfig>('config', defaultBusinessConfig);
  const [products, setProducts] = useLocalStorage<Product[]>('products', sampleProducts);

  const addProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    setProducts((prev) => [...prev, newProduct]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const recalculateAutoPrices = (cfg?: BusinessConfig) => {
    const c = cfg || config;
    setProducts((prev) =>
      prev.map((p) => {
        if (!p.isAutoPrice) return p;
        const newPrice = calculateSellingPrice(p.costPrice, c, p.category);
        if (newPrice <= 0) return p;
        return { ...p, sellingPrice: Math.round(newPrice * 100) / 100, updatedAt: new Date().toISOString() };
      })
    );
  };

  return (
    <AppContext.Provider
      value={{
        config,
        setConfig,
        products,
        setProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        recalculateAutoPrices,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
