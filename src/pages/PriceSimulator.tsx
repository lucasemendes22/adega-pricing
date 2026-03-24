import { useState, useMemo } from 'react';
import { SlidersHorizontal, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCategory } from '../types';
import { calculateMarginBreakdown, formatCurrency, formatPercent, getTargetMargin } from '../lib/calculations';

type Scope = 'all' | 'category' | 'product';
type AdjustType = 'percentage' | 'absolute';

export function PriceSimulator() {
  const { config, products } = useApp();
  const [scope, setScope] = useState<Scope>('all');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory>(ProductCategory.VINHOS);
  const [productId, setProductId] = useState<string>(products[0]?.id || '');
  const [adjustType, setAdjustType] = useState<AdjustType>('percentage');
  const [adjustValue, setAdjustValue] = useState<number>(5);

  const simulation = useMemo(() => {
    const affectedProducts = products.filter((p) => {
      if (scope === 'all') return true;
      if (scope === 'category') return p.category === categoryFilter;
      return p.id === productId;
    });

    const results = affectedProducts.map((p) => {
      const currentBreakdown = calculateMarginBreakdown(p, config);
      const simPrice = adjustType === 'percentage'
        ? p.sellingPrice * (1 + adjustValue / 100)
        : p.sellingPrice + adjustValue;
      const simProduct = { ...p, sellingPrice: Math.max(0, simPrice) };
      const simBreakdown = calculateMarginBreakdown(simProduct, config);
      const target = getTargetMargin(config, p.category) * 100;

      return {
        product: p,
        currentPrice: p.sellingPrice,
        simPrice: Math.max(0, simPrice),
        currentMargin: currentBreakdown.netMarginPercent,
        simMargin: simBreakdown.netMarginPercent,
        currentProfit: currentBreakdown.netProfit,
        simProfit: simBreakdown.netProfit,
        target,
      };
    });

    const totalCurrentRevenue = results.reduce((s, r) => s + r.currentPrice, 0);
    const totalSimRevenue = results.reduce((s, r) => s + r.simPrice, 0);
    const avgCurrentMargin = results.length > 0 ? results.reduce((s, r) => s + r.currentMargin, 0) / results.length : 0;
    const avgSimMargin = results.length > 0 ? results.reduce((s, r) => s + r.simMargin, 0) / results.length : 0;
    const totalCurrentProfit = results.reduce((s, r) => s + r.currentProfit, 0);
    const totalSimProfit = results.reduce((s, r) => s + r.simProfit, 0);

    return { results, totalCurrentRevenue, totalSimRevenue, avgCurrentMargin, avgSimMargin, totalCurrentProfit, totalSimProfit };
  }, [config, products, scope, categoryFilter, productId, adjustType, adjustValue]);

  const revenueDelta = simulation.totalSimRevenue - simulation.totalCurrentRevenue;
  const marginDelta = simulation.avgSimMargin - simulation.avgCurrentMargin;
  const profitDelta = simulation.totalSimProfit - simulation.totalCurrentProfit;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="glass-card rounded-xl p-5 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <SlidersHorizontal size={16} className="text-gold-400" />
          <h3 className="font-display text-sm font-semibold text-text">Parametros da Simulacao</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Scope */}
          <div>
            <label className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">Escopo</label>
            <div className="flex gap-1.5">
              {([['all', 'Todos'], ['category', 'Categoria'], ['product', 'Produto']] as const).map(([val, label]) => (
                <button key={val} onClick={() => setScope(val)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    scope === val ? 'bg-gold-400/15 text-gold-400 border border-gold-400/30' : 'bg-surface-el text-text-secondary border border-border'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Category/Product selector */}
          {scope === 'category' && (
            <div>
              <label className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">Categoria</label>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as ProductCategory)}
                className="w-full bg-surface-el border border-border rounded-lg py-2 px-3 text-sm text-text focus:outline-none focus:border-gold-500/50 transition-colors">
                {Object.values(ProductCategory).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          {scope === 'product' && (
            <div>
              <label className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">Produto</label>
              <select value={productId} onChange={(e) => setProductId(e.target.value)}
                className="w-full bg-surface-el border border-border rounded-lg py-2 px-3 text-sm text-text focus:outline-none focus:border-gold-500/50 transition-colors">
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {/* Adjust type */}
          <div>
            <label className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">Tipo de Ajuste</label>
            <div className="flex gap-1.5">
              <button onClick={() => setAdjustType('percentage')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  adjustType === 'percentage' ? 'bg-gold-400/15 text-gold-400 border border-gold-400/30' : 'bg-surface-el text-text-secondary border border-border'
                }`}>Percentual %</button>
              <button onClick={() => setAdjustType('absolute')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  adjustType === 'absolute' ? 'bg-gold-400/15 text-gold-400 border border-gold-400/30' : 'bg-surface-el text-text-secondary border border-border'
                }`}>Valor R$</button>
            </div>
          </div>
        </div>

        {/* Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-text-muted uppercase tracking-wider">
              Ajuste: <span className="text-gold-400 font-bold font-mono">
                {adjustType === 'percentage' ? `${adjustValue > 0 ? '+' : ''}${adjustValue}%` : `${adjustValue > 0 ? '+' : ''}${formatCurrency(adjustValue)}`}
              </span>
            </label>
          </div>
          <input
            type="range"
            min={adjustType === 'percentage' ? -30 : -50}
            max={adjustType === 'percentage' ? 50 : 100}
            step={adjustType === 'percentage' ? 0.5 : 1}
            value={adjustValue}
            onChange={(e) => setAdjustValue(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #9a7a24 0%, #9a7a24 ${((adjustValue - (adjustType === 'percentage' ? -30 : -50)) / (adjustType === 'percentage' ? 80 : 150)) * 100}%, #e0e0e6 ${((adjustValue - (adjustType === 'percentage' ? -30 : -50)) / (adjustType === 'percentage' ? 80 : 150)) * 100}%, #e0e0e6 100%)`,
            }}
          />
          <div className="flex justify-between text-[10px] text-text-muted mt-1">
            <span>{adjustType === 'percentage' ? '-30%' : '-R$50'}</span>
            <span>0</span>
            <span>{adjustType === 'percentage' ? '+50%' : '+R$100'}</span>
          </div>
        </div>
      </div>

      {/* Impact Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger">
        {[
          { label: 'Impacto Receita', value: revenueDelta, format: formatCurrency, positive: revenueDelta >= 0 },
          { label: 'Impacto Margem', value: marginDelta, format: (v: number) => `${v > 0 ? '+' : ''}${formatPercent(v)}`, positive: marginDelta >= 0 },
          { label: 'Impacto Lucro/Produto', value: profitDelta, format: formatCurrency, positive: profitDelta >= 0 },
        ].map((item) => (
          <div key={item.label} className="glass-card rounded-xl p-5">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">{item.label}</p>
            <div className="flex items-center gap-2">
              {item.positive ? <TrendingUp size={18} className="text-emerald" /> : item.value === 0 ? <Minus size={18} className="text-text-muted" /> : <TrendingDown size={18} className="text-rose" />}
              <p className={`text-xl font-bold font-display ${item.positive ? 'text-emerald' : item.value === 0 ? 'text-text-muted' : 'text-rose'}`}>
                {item.value > 0 ? '+' : ''}{item.format(item.value)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Results Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-display text-sm font-semibold text-text">
            Resultado da Simulacao ({simulation.results.length} produtos)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted text-xs uppercase tracking-wider bg-surface-el/50">
                <th className="px-5 py-3 font-medium">Produto</th>
                <th className="px-5 py-3 font-medium text-right">Preco Atual</th>
                <th className="px-5 py-3 font-medium text-right">Preco Simulado</th>
                <th className="px-5 py-3 font-medium text-right">Margem Atual</th>
                <th className="px-5 py-3 font-medium text-right">Margem Simulada</th>
                <th className="px-5 py-3 font-medium text-right">Delta</th>
              </tr>
            </thead>
            <tbody>
              {simulation.results.map((r, i) => {
                const delta = r.simMargin - r.currentMargin;
                const simBelowTarget = r.simMargin < r.target;
                const wasOk = r.currentMargin >= r.target;
                const crossedBelow = wasOk && simBelowTarget;
                return (
                  <tr key={r.product.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-el/30'} ${crossedBelow ? 'bg-rose/5' : ''} hover:bg-surface-hover transition-colors`}>
                    <td className="px-5 py-3">
                      <span className="text-text font-medium">{r.product.name}</span>
                      <span className="text-text-muted text-xs ml-2">{r.product.category}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-text-secondary">{formatCurrency(r.currentPrice)}</td>
                    <td className="px-5 py-3 text-right font-mono text-gold-400 font-medium">{formatCurrency(r.simPrice)}</td>
                    <td className={`px-5 py-3 text-right font-mono ${r.currentMargin < r.target ? 'text-rose' : 'text-text-secondary'}`}>
                      {formatPercent(r.currentMargin)}
                    </td>
                    <td className={`px-5 py-3 text-right font-mono font-medium ${simBelowTarget ? 'text-rose' : 'text-emerald'}`}>
                      {formatPercent(r.simMargin)}
                    </td>
                    <td className={`px-5 py-3 text-right font-mono font-semibold ${delta > 0 ? 'text-emerald' : delta < 0 ? 'text-rose' : 'text-text-muted'}`}>
                      {delta > 0 ? '+' : ''}{formatPercent(delta)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
