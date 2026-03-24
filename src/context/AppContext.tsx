import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { BusinessConfig, Product } from '../types';
import { defaultBusinessConfig, sampleProducts } from '../lib/defaults';
import { calculateSellingPrice } from '../lib/calculations';
import { supabase } from '../lib/supabase';

interface AppContextType {
  config: BusinessConfig;
  setConfig: (config: BusinessConfig | ((prev: BusinessConfig) => BusinessConfig)) => void;
  products: Product[];
  setProducts: (products: Product[] | ((prev: Product[]) => Product[])) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  recalculateAutoPrices: (cfg?: BusinessConfig) => void;
  loading: boolean;
  syncing: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

// DB row → app BusinessConfig
function rowToConfig(row: any): BusinessConfig {
  return {
    storeName: row.store_name,
    taxConfig: row.tax_config,
    fixedCosts: row.fixed_costs,
    variableCosts: row.variable_costs,
    paymentFees: row.payment_fees,
    estimatedMonthlySales: Number(row.estimated_monthly_sales),
    estimatedMonthlyUnitsSold: Number(row.estimated_monthly_units_sold),
    marginTargets: row.margin_targets,
  };
}

// App BusinessConfig → DB row
function configToRow(config: BusinessConfig) {
  return {
    store_name: config.storeName,
    tax_regime: config.taxConfig.regime,
    tax_config: config.taxConfig,
    fixed_costs: config.fixedCosts,
    variable_costs: config.variableCosts,
    payment_fees: config.paymentFees,
    estimated_monthly_sales: config.estimatedMonthlySales,
    estimated_monthly_units_sold: config.estimatedMonthlyUnitsSold,
    margin_targets: config.marginTargets,
  };
}

// DB row → app Product
function rowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    supplier: row.supplier,
    costPrice: Number(row.cost_price),
    sellingPrice: Number(row.selling_price),
    isAutoPrice: row.is_auto_price,
    unit: row.unit,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// App Product → DB row
function productToRow(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  return {
    name: product.name,
    category: product.category,
    supplier: product.supplier,
    cost_price: product.costPrice,
    selling_price: product.sellingPrice,
    is_auto_price: product.isAutoPrice,
    unit: product.unit,
    notes: product.notes,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<BusinessConfig>(defaultBusinessConfig);
  const [products, setProductsState] = useState<Product[]>(sampleProducts);
  const [configId, setConfigId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Load data from Supabase on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Load config
        const { data: configRows, error: configErr } = await supabase
          .from('business_config')
          .select('*')
          .limit(1);

        if (!configErr && configRows && configRows.length > 0) {
          if (!cancelled) {
            setConfigState(rowToConfig(configRows[0]));
            setConfigId(configRows[0].id);
          }
        }

        // Load products
        const { data: productRows, error: prodErr } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: true });

        if (!prodErr && productRows && productRows.length > 0) {
          if (!cancelled) {
            setProductsState(productRows.map(rowToProduct));
          }
        }
      } catch {
        console.warn('Supabase unavailable, using local defaults');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Sync config to Supabase (debounced)
  const syncConfig = useCallback(async (cfg: BusinessConfig) => {
    setSyncing(true);
    try {
      const row = configToRow(cfg);
      if (configId) {
        await supabase.from('business_config').update(row).eq('id', configId);
      } else {
        const { data } = await supabase.from('business_config').insert(row).select('id').single();
        if (data) setConfigId(data.id);
      }
    } catch { /* silent */ }
    setSyncing(false);
  }, [configId]);

  const setConfig = useCallback((configOrFn: BusinessConfig | ((prev: BusinessConfig) => BusinessConfig)) => {
    setConfigState((prev) => {
      const next = configOrFn instanceof Function ? configOrFn(prev) : configOrFn;
      syncConfig(next);
      return next;
    });
  }, [syncConfig]);

  const setProducts = useCallback((productsOrFn: Product[] | ((prev: Product[]) => Product[])) => {
    setProductsState((prev) => {
      const next = productsOrFn instanceof Function ? productsOrFn(prev) : productsOrFn;
      return next;
    });
  }, []);

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    setSyncing(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(productToRow(product))
        .select('*')
        .single();

      if (!error && data) {
        setProductsState((prev) => [...prev, rowToProduct(data)]);
      } else {
        // Fallback local
        const now = new Date().toISOString();
        const newProduct: Product = { ...product, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
        setProductsState((prev) => [...prev, newProduct]);
      }
    } catch {
      const now = new Date().toISOString();
      const newProduct: Product = { ...product, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
      setProductsState((prev) => [...prev, newProduct]);
    }
    setSyncing(false);
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    // Optimistic update
    setProductsState((prev) =>
      prev.map((p) => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
    );

    // Sync to DB
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.supplier !== undefined) dbUpdates.supplier = updates.supplier;
    if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;
    if (updates.sellingPrice !== undefined) dbUpdates.selling_price = updates.sellingPrice;
    if (updates.isAutoPrice !== undefined) dbUpdates.is_auto_price = updates.isAutoPrice;
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

    if (Object.keys(dbUpdates).length > 0) {
      try { await supabase.from('products').update(dbUpdates).eq('id', id); } catch { /* silent */ }
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    setProductsState((prev) => prev.filter((p) => p.id !== id));
    try { await supabase.from('products').delete().eq('id', id); } catch { /* silent */ }
  }, []);

  const recalculateAutoPrices = useCallback((cfg?: BusinessConfig) => {
    setProductsState((prev) => {
      const c = cfg || config;
      const updated = prev.map((p) => {
        if (!p.isAutoPrice) return p;
        const newPrice = calculateSellingPrice(p.costPrice, c, p.category);
        if (newPrice <= 0) return p;
        const updatedProduct = { ...p, sellingPrice: Math.round(newPrice * 100) / 100, updatedAt: new Date().toISOString() };
        // Sync each auto-priced product
        supabase.from('products').update({ selling_price: updatedProduct.sellingPrice }).eq('id', p.id).then(() => {});
        return updatedProduct;
      });
      return updated;
    });
  }, [config]);

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
        loading,
        syncing,
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
