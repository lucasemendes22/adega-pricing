import { useState } from 'react';
import { Calculator, Plus, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCategory } from '../types';
import {
  calculateSellingPrice, calculateBreakEven, calculateMarginBreakdown,
  getEffectiveTaxRate, getTotalVariableCostPercent, getWeightedPaymentFee,
  getFixedCostPercent, getTargetMargin, formatCurrency, formatPercent,
} from '../lib/calculations';

export function NewProductCalculator() {
  const { config, addProduct } = useApp();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>(ProductCategory.VINHOS);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [customMargin, setCustomMargin] = useState<number | null>(null);
  const [manualPrice, setManualPrice] = useState<number | null>(null);
  const [added, setAdded] = useState(false);

  const targetMargin = customMargin !== null ? customMargin : getTargetMargin(config, category) * 100;

  // Temporarily override margin target for calculation
  const configWithCustomMargin = {
    ...config,
    marginTargets: config.marginTargets.map((t) =>
      t.category === category ? { ...t, targetMarginPercent: targetMargin } : t
    ),
  };

  const autoPrice = calculateSellingPrice(costPrice, configWithCustomMargin, category);
  const sellingPrice = manualPrice !== null ? manualPrice : (autoPrice > 0 ? autoPrice : 0);

  const mockProduct = {
    id: 'calc', name: name || 'Novo Produto', category, supplier: '',
    costPrice, sellingPrice, isAutoPrice: manualPrice === null,
    unit: 'un', notes: '', createdAt: '', updatedAt: '',
  };
  const breakdown = sellingPrice > 0 ? calculateMarginBreakdown(mockProduct, config) : null;
  const breakEven = sellingPrice > 0 ? calculateBreakEven(costPrice, sellingPrice, config) : null;

  // Cost decomposition for waterfall
  const taxRate = getEffectiveTaxRate(config.taxConfig);
  const varPct = getTotalVariableCostPercent(config);
  const payPct = getWeightedPaymentFee(config);
  const fixPct = getFixedCostPercent(config);

  const decomposition = sellingPrice > 0 ? [
    { label: 'Custo do Produto', value: costPrice, pct: (costPrice / sellingPrice) * 100, color: '#8e8ea0' },
    { label: 'Impostos', value: sellingPrice * taxRate, pct: taxRate * 100, color: '#fb7185' },
    { label: 'Custos Variaveis', value: breakdown?.variableCosts || 0, pct: varPct * 100, color: '#fbbf24' },
    { label: 'Taxas Pagamento', value: sellingPrice * payPct, pct: payPct * 100, color: '#38bdf8' },
    { label: 'Custos Fixos', value: breakdown?.fixedCostAllocation || 0, pct: fixPct * 100, color: '#b5505c' },
    { label: 'Lucro Liquido', value: breakdown?.netProfit || 0, pct: breakdown?.netMarginPercent || 0, color: '#34d399' },
  ] : [];

  const handleAddToRegistry = () => {
    addProduct({
      name: name || 'Novo Produto',
      category,
      supplier: '',
      costPrice,
      sellingPrice: Math.round(sellingPrice * 100) / 100,
      isAutoPrice: manualPrice === null,
      unit: 'un',
      notes: 'Adicionado pela calculadora',
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Input Panel */}
      <div className="lg:col-span-2 space-y-4">
        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Calculator size={16} className="text-gold-400" />
            <h3 className="font-display text-sm font-semibold text-text">Dados do Produto</h3>
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">Nome (opcional)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Vinho Malbec Reserva"
              className="w-full bg-surface-el border border-border rounded-lg py-2 px-3 text-sm text-text placeholder-text-muted focus:outline-none focus:border-gold-500/50 transition-colors" />
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">Categoria</label>
            <select value={category} onChange={(e) => { setCategory(e.target.value as ProductCategory); setCustomMargin(null); }}
              className="w-full bg-surface-el border border-border rounded-lg py-2 px-3 text-sm text-text focus:outline-none focus:border-gold-500/50 transition-colors">
              {Object.values(ProductCategory).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">Preco de Custo</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">R$</span>
              <input type="number" step="0.01" value={costPrice || ''} onChange={(e) => setCostPrice(Number(e.target.value) || 0)}
                className="w-full bg-surface-el border border-border rounded-lg py-2.5 pl-9 pr-3 text-sm text-text focus:outline-none focus:border-gold-500/50 transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">
              Margem Desejada (meta da categoria: {formatPercent(getTargetMargin(config, category) * 100)})
            </label>
            <div className="relative">
              <input type="number" step="0.5"
                value={customMargin !== null ? customMargin : getTargetMargin(config, category) * 100}
                onChange={(e) => setCustomMargin(Number(e.target.value))}
                className="w-full bg-surface-el border border-border rounded-lg py-2 px-3 pr-7 text-sm text-gold-400 font-mono focus:outline-none focus:border-gold-500/50 transition-colors" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">%</span>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <label className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">Ou defina um preco manual</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">R$</span>
              <input type="number" step="0.01" value={manualPrice ?? ''} placeholder="Deixe vazio para calcular"
                onChange={(e) => setManualPrice(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-surface-el border border-border rounded-lg py-2 pl-9 pr-3 text-sm text-text placeholder-text-muted focus:outline-none focus:border-gold-500/50 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Results Panel */}
      <div className="lg:col-span-3 space-y-4">
        {/* Big Price Display */}
        <div className="glass-card rounded-xl p-6 text-center relative overflow-hidden deco-pattern">
          <div className="absolute inset-0 bg-gradient-to-br from-gold-400/5 via-transparent to-wine-500/5" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted mb-2">Preco de Venda Sugerido</p>
            <p className="text-5xl font-bold font-display text-gold-gradient leading-none">
              {costPrice > 0 && sellingPrice > 0 ? formatCurrency(sellingPrice) : '—'}
            </p>
            {costPrice > 0 && sellingPrice > 0 && breakdown && (
              <p className="text-sm text-text-secondary mt-3">
                Margem liquida: <span className={`font-bold font-mono ${breakdown.netMarginPercent >= targetMargin ? 'text-emerald' : 'text-rose'}`}>
                  {formatPercent(breakdown.netMarginPercent)}
                </span>
                {' '}| Markup: <span className="font-bold font-mono text-gold-400">
                  {costPrice > 0 ? `${((sellingPrice / costPrice - 1) * 100).toFixed(0)}%` : '—'}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Cost Decomposition */}
        {decomposition.length > 0 && costPrice > 0 && (
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-display text-sm font-semibold text-text mb-4">Decomposicao do Preco</h3>
            <div className="space-y-3">
              {decomposition.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-text-secondary shrink-0">{item.label}</div>
                  <div className="flex-1 h-6 bg-surface-el rounded-md overflow-hidden relative">
                    <div
                      className="h-full rounded-md transition-all duration-500"
                      style={{
                        width: `${Math.max(2, Math.abs(item.value / sellingPrice) * 100)}%`,
                        backgroundColor: item.color,
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <div className="w-20 text-right text-xs font-mono text-text-secondary">{formatCurrency(item.value)}</div>
                  <div className="w-14 text-right text-xs font-mono text-text-muted">{formatPercent(Math.abs(item.pct))}</div>
                </div>
              ))}
            </div>

            {/* Visual bar total */}
            <div className="mt-4 flex h-3 rounded-full overflow-hidden">
              {decomposition.map((item) => (
                <div
                  key={item.label}
                  style={{ width: `${Math.max(1, Math.abs(item.value / sellingPrice) * 100)}%`, backgroundColor: item.color }}
                  title={`${item.label}: ${formatPercent(Math.abs(item.pct))}`}
                  className="transition-all duration-500"
                />
              ))}
            </div>
          </div>
        )}

        {/* Break Even */}
        {breakEven && breakEven.breakEvenUnits > 0 && (
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-display text-sm font-semibold text-text mb-3">Ponto de Equilibrio</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-el rounded-lg p-4 border border-border">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Unidades/Mes</p>
                <p className="text-2xl font-bold font-display text-gold-400">{breakEven.breakEvenUnits.toLocaleString('pt-BR')}</p>
              </div>
              <div className="bg-surface-el rounded-lg p-4 border border-border">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Receita Minima</p>
                <p className="text-2xl font-bold font-display text-gold-400">{formatCurrency(breakEven.breakEvenRevenue)}</p>
              </div>
            </div>
            <p className="text-xs text-text-muted mt-3">
              Para cobrir todos os custos fixos de {formatCurrency(config.fixedCosts.reduce((s, c) => s + c.monthlyCost, 0))}/mes
            </p>
          </div>
        )}

        {/* Add to Registry Button */}
        {costPrice > 0 && sellingPrice > 0 && (
          <button
            onClick={handleAddToRegistry}
            disabled={added}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              added
                ? 'bg-emerald/20 text-emerald border border-emerald/30'
                : 'bg-gold-400 hover:bg-gold-500 text-white'
            }`}
          >
            {added ? (
              <>Adicionado ao Cadastro!</>
            ) : (
              <>
                <Plus size={16} /> Adicionar ao Cadastro de Produtos <ArrowRight size={14} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
