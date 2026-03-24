export const TaxRegime = {
  SIMPLES_NACIONAL: 'SIMPLES_NACIONAL',
  LUCRO_PRESUMIDO: 'LUCRO_PRESUMIDO',
  LUCRO_REAL: 'LUCRO_REAL',
} as const;
export type TaxRegime = (typeof TaxRegime)[keyof typeof TaxRegime];

export const ProductCategory = {
  VINHOS: 'Vinhos',
  CERVEJAS: 'Cervejas',
  DESTILADOS: 'Destilados',
  CACHACAS: 'Cachacas',
  DRINKS: 'Drinks',
  DOSES: 'Doses',
  KITS: 'Kits',
  ENERGETICOS: 'Energeticos',
  BEBIDAS_NAO_ALCOOLICAS: 'Bebidas Nao Alcoolicas',
  SALGADINHOS: 'Salgadinhos',
  CHURRASCO: 'Churrasco',
  TABACARIA: 'Tabacaria',
  ACESSORIOS: 'Acessorios',
  PROMOCOES: 'Promocoes',
  OUTROS: 'Outros',
} as const;
export type ProductCategory = (typeof ProductCategory)[keyof typeof ProductCategory];

export interface SimplesNacionalConfig {
  regime: typeof TaxRegime.SIMPLES_NACIONAL;
  aliquotaEfetiva: number;
  rbt12: number;
}

export interface LucroPresumidoConfig {
  regime: typeof TaxRegime.LUCRO_PRESUMIDO;
  irpj: number;
  csll: number;
  pis: number;
  cofins: number;
  icms: number;
}

export interface LucroRealConfig {
  regime: typeof TaxRegime.LUCRO_REAL;
  irpj: number;
  csll: number;
  pis: number;
  cofins: number;
  icms: number;
}

export type TaxConfig = SimplesNacionalConfig | LucroPresumidoConfig | LucroRealConfig;

export interface FixedCost {
  id: string;
  name: string;
  monthlyCost: number;
}

export interface VariableCostRate {
  id: string;
  name: string;
  rate: number;
  isPercentage: boolean;
}

export interface PaymentMethodFee {
  id: string;
  name: string;
  fee: number;
  salesShare: number;
}

export interface CategoryMarginTarget {
  category: ProductCategory;
  targetMarginPercent: number;
}

export interface BusinessConfig {
  storeName: string;
  taxConfig: TaxConfig;
  fixedCosts: FixedCost[];
  variableCosts: VariableCostRate[];
  paymentFees: PaymentMethodFee[];
  estimatedMonthlySales: number;
  estimatedMonthlyUnitsSold: number;
  marginTargets: CategoryMarginTarget[];
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  supplier: string;
  costPrice: number;
  sellingPrice: number;
  isAutoPrice: boolean;
  unit: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SimulationScenario {
  id: string;
  name: string;
  adjustments: SimulationAdjustment[];
  createdAt: string;
}

export interface SimulationAdjustment {
  scope: 'all' | 'category' | 'product';
  categoryFilter?: ProductCategory;
  productId?: string;
  adjustType: 'percentage' | 'absolute';
  adjustValue: number;
}

export interface MarginBreakdown {
  revenue: number;
  costOfGoods: number;
  taxes: number;
  variableCosts: number;
  paymentFees: number;
  contributionMargin: number;
  contributionMarginPercent: number;
  fixedCostAllocation: number;
  netProfit: number;
  netMarginPercent: number;
}

export type TabId = 'dashboard' | 'config' | 'products' | 'margins' | 'simulator' | 'calculator';
