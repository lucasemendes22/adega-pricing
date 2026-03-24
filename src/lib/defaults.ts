import {
  type BusinessConfig,
  TaxRegime,
  ProductCategory,
  type Product,
} from '../types';

export const defaultBusinessConfig: BusinessConfig = {
  storeName: 'Fonte Certa Adega',
  taxConfig: {
    regime: TaxRegime.SIMPLES_NACIONAL,
    aliquotaEfetiva: 0.06,
    rbt12: 360000,
  },
  fixedCosts: [
    { id: '1', name: 'Aluguel', monthlyCost: 3500 },
    { id: '2', name: 'Energia Eletrica', monthlyCost: 800 },
    { id: '3', name: 'Agua', monthlyCost: 150 },
    { id: '4', name: 'Internet/Telefone', monthlyCost: 200 },
    { id: '5', name: 'Folha de Pagamento', monthlyCost: 5000 },
    { id: '6', name: 'Contador', monthlyCost: 600 },
    { id: '7', name: 'Sistema/Software', monthlyCost: 150 },
    { id: '8', name: 'Outros', monthlyCost: 300 },
  ],
  variableCosts: [
    { id: '1', name: 'Embalagens', rate: 0.50, isPercentage: false },
    { id: '2', name: 'Perdas/Quebras', rate: 1.0, isPercentage: true },
  ],
  paymentFees: [
    { id: '1', name: 'Credito a Vista', fee: 2.99, salesShare: 30 },
    { id: '2', name: 'Credito Parcelado 2-6x', fee: 4.49, salesShare: 15 },
    { id: '3', name: 'Credito Parcelado 7-12x', fee: 5.99, salesShare: 5 },
    { id: '4', name: 'Debito', fee: 1.59, salesShare: 25 },
    { id: '5', name: 'PIX', fee: 0.00, salesShare: 20 },
    { id: '6', name: 'Dinheiro', fee: 0.00, salesShare: 5 },
  ],
  estimatedMonthlySales: 80000,
  estimatedMonthlyUnitsSold: 2000,
  marginTargets: [
    { category: ProductCategory.VINHOS, targetMarginPercent: 30 },
    { category: ProductCategory.CERVEJAS, targetMarginPercent: 25 },
    { category: ProductCategory.DESTILADOS, targetMarginPercent: 35 },
    { category: ProductCategory.CACHACAS, targetMarginPercent: 35 },
    { category: ProductCategory.DRINKS, targetMarginPercent: 50 },
    { category: ProductCategory.DOSES, targetMarginPercent: 60 },
    { category: ProductCategory.KITS, targetMarginPercent: 30 },
    { category: ProductCategory.ENERGETICOS, targetMarginPercent: 40 },
    { category: ProductCategory.BEBIDAS_NAO_ALCOOLICAS, targetMarginPercent: 40 },
    { category: ProductCategory.SALGADINHOS, targetMarginPercent: 45 },
    { category: ProductCategory.CHURRASCO, targetMarginPercent: 30 },
    { category: ProductCategory.TABACARIA, targetMarginPercent: 40 },
    { category: ProductCategory.ACESSORIOS, targetMarginPercent: 50 },
    { category: ProductCategory.PROMOCOES, targetMarginPercent: 15 },
    { category: ProductCategory.OUTROS, targetMarginPercent: 30 },
  ],
};

// Produtos vazios - dados reais vem do Supabase
export const sampleProducts: Product[] = [];
