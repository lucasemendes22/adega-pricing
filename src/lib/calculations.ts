import {
  type TaxConfig,
  TaxRegime,
  type BusinessConfig,
  type ProductCategory,
  type Product,
  type MarginBreakdown,
} from '../types';

// Simples Nacional Anexo I (Comercio) - Tabela de Faixas
const SIMPLES_FAIXAS = [
  { limit: 180000, aliquota: 0.04, deduction: 0 },
  { limit: 360000, aliquota: 0.073, deduction: 5940 },
  { limit: 720000, aliquota: 0.095, deduction: 13860 },
  { limit: 1800000, aliquota: 0.107, deduction: 22500 },
  { limit: 3600000, aliquota: 0.143, deduction: 87300 },
  { limit: 4800000, aliquota: 0.19, deduction: 378000 },
];

export function calcularAliquotaEfetivaSimplesNacional(rbt12: number): number {
  if (rbt12 <= 0) return 0;
  const faixa = SIMPLES_FAIXAS.find((f) => rbt12 <= f.limit);
  if (!faixa) return 0.19; // acima do teto
  return (rbt12 * faixa.aliquota - faixa.deduction) / rbt12;
}

export function getEffectiveTaxRate(config: TaxConfig): number {
  if (config.regime === TaxRegime.SIMPLES_NACIONAL) {
    return config.aliquotaEfetiva;
  }
  if (config.regime === TaxRegime.LUCRO_PRESUMIDO) {
    return (config.irpj + config.csll + config.pis + config.cofins + config.icms) / 100;
  }
  return (config.pis + config.cofins + config.icms) / 100;
}

export function getTotalFixedCosts(config: BusinessConfig): number {
  return config.fixedCosts.reduce((sum, c) => sum + c.monthlyCost, 0);
}

export function getFixedCostPercent(config: BusinessConfig): number {
  if (config.estimatedMonthlySales <= 0) return 0;
  return getTotalFixedCosts(config) / config.estimatedMonthlySales;
}

export function getTotalVariableCostPercent(config: BusinessConfig): number {
  return config.variableCosts
    .filter((c) => c.isPercentage)
    .reduce((sum, c) => sum + c.rate / 100, 0);
}

export function getPerUnitVariableCost(config: BusinessConfig): number {
  return config.variableCosts
    .filter((c) => !c.isPercentage)
    .reduce((sum, c) => sum + c.rate, 0);
}

export function getWeightedPaymentFee(config: BusinessConfig): number {
  const totalShare = config.paymentFees.reduce((sum, p) => sum + p.salesShare, 0);
  if (totalShare <= 0) return 0;
  return config.paymentFees.reduce((sum, p) => sum + (p.fee / 100) * (p.salesShare / totalShare), 0);
}

export function getTargetMargin(config: BusinessConfig, category: ProductCategory): number {
  const target = config.marginTargets.find((t) => t.category === category);
  return target ? target.targetMarginPercent / 100 : 0.25;
}

export function calculateSellingPrice(
  costPrice: number,
  config: BusinessConfig,
  category: ProductCategory
): number {
  const taxRate = getEffectiveTaxRate(config.taxConfig);
  const fixedCostPct = getFixedCostPercent(config);
  const variableCostPct = getTotalVariableCostPercent(config);
  const paymentFeePct = getWeightedPaymentFee(config);
  const targetMargin = getTargetMargin(config, category);
  const perUnitCost = getPerUnitVariableCost(config);

  const adjustedCost = costPrice + perUnitCost;
  const markupDivisor = 1 - (taxRate + variableCostPct + paymentFeePct + fixedCostPct + targetMargin);

  if (markupDivisor <= 0) return -1;
  return adjustedCost / markupDivisor;
}

export function calculateMarginBreakdown(
  product: Product,
  config: BusinessConfig
): MarginBreakdown {
  const revenue = product.sellingPrice;
  const costOfGoods = product.costPrice;
  const taxRate = getEffectiveTaxRate(config.taxConfig);
  const taxes = revenue * taxRate;
  const variableCostPct = getTotalVariableCostPercent(config);
  const perUnitCost = getPerUnitVariableCost(config);
  const variableCosts = revenue * variableCostPct + perUnitCost;
  const paymentFeePct = getWeightedPaymentFee(config);
  const paymentFees = revenue * paymentFeePct;
  const contributionMargin = revenue - costOfGoods - taxes - variableCosts - paymentFees;
  const contributionMarginPercent = revenue > 0 ? (contributionMargin / revenue) * 100 : 0;

  const fixedCostAllocation =
    config.estimatedMonthlyUnitsSold > 0
      ? getTotalFixedCosts(config) / config.estimatedMonthlyUnitsSold
      : 0;

  const netProfit = contributionMargin - fixedCostAllocation;
  const netMarginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return {
    revenue,
    costOfGoods,
    taxes,
    variableCosts,
    paymentFees,
    contributionMargin,
    contributionMarginPercent,
    fixedCostAllocation,
    netProfit,
    netMarginPercent,
  };
}

export function calculateBreakEven(
  costPrice: number,
  sellingPrice: number,
  config: BusinessConfig
): { breakEvenUnits: number; breakEvenRevenue: number } {
  const taxRate = getEffectiveTaxRate(config.taxConfig);
  const variableCostPct = getTotalVariableCostPercent(config);
  const paymentFeePct = getWeightedPaymentFee(config);
  const perUnitCost = getPerUnitVariableCost(config);

  const contributionPerUnit =
    sellingPrice -
    costPrice -
    sellingPrice * taxRate -
    sellingPrice * variableCostPct -
    sellingPrice * paymentFeePct -
    perUnitCost;

  if (contributionPerUnit <= 0) {
    return { breakEvenUnits: -1, breakEvenRevenue: -1 };
  }

  const totalFixed = getTotalFixedCosts(config);
  const breakEvenUnits = Math.ceil(totalFixed / contributionPerUnit);
  const breakEvenRevenue = breakEvenUnits * sellingPrice;

  return { breakEvenUnits, breakEvenRevenue };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}
