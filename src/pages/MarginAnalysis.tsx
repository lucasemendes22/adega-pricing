import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCategory } from '../types';
import { calculateMarginBreakdown, formatCurrency, formatPercent, getTargetMargin } from '../lib/calculations';

export function MarginAnalysis() {
  const { config, products } = useApp();
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'name' | 'margin'>('margin');
  const [sortAsc, setSortAsc] = useState(true);

  const data = useMemo(() => {
    const breakdowns = products.map((p) => ({
      product: p,
      breakdown: calculateMarginBreakdown(p, config),
      target: getTargetMargin(config, p.category) * 100,
    }));

    const categoryData = Object.values(ProductCategory).map((cat) => {
      const catItems = breakdowns.filter((b) => b.product.category === cat);
      const avgMargin = catItems.length > 0 ? catItems.reduce((s, b) => s + b.breakdown.netMarginPercent, 0) / catItems.length : 0;
      const target = getTargetMargin(config, cat) * 100;
      return { name: cat, margem: Number(avgMargin.toFixed(1)), meta: Number(target.toFixed(1)), count: catItems.length };
    });

    const sorted = [...breakdowns].sort((a, b) => {
      if (sortField === 'name') return sortAsc ? a.product.name.localeCompare(b.product.name) : b.product.name.localeCompare(a.product.name);
      return sortAsc ? a.breakdown.netMarginPercent - b.breakdown.netMarginPercent : b.breakdown.netMarginPercent - a.breakdown.netMarginPercent;
    });

    const belowTarget = breakdowns.filter((b) => b.breakdown.netMarginPercent < b.target);

    return { categoryData, sorted, belowTarget };
  }, [config, products, sortField, sortAsc]);

  const toggleSort = (field: 'name' | 'margin') => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  return (
    <div className="space-y-6">
      {/* Category Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 stagger">
        {data.categoryData.map((cat) => {
          const isBelow = cat.margem < cat.meta;
          return (
            <div key={cat.name} className="glass-card rounded-xl p-4 text-center">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">{cat.name}</p>
              <p className={`text-xl font-bold font-display ${isBelow ? 'text-rose' : 'text-emerald'}`}>
                {formatPercent(cat.margem)}
              </p>
              <p className="text-[10px] text-text-muted mt-1">
                Meta: {formatPercent(cat.meta)} | {cat.count} prod.
              </p>
              <div className="mt-2 h-1 rounded-full bg-surface-hover overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isBelow ? 'bg-rose' : 'bg-emerald'}`}
                  style={{ width: `${Math.min(100, Math.max(0, (cat.margem / (cat.meta || 1)) * 100))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grouped Bar Chart */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-display text-sm font-semibold text-text mb-4">Margem Real vs Meta por Categoria</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.categoryData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" />
            <Tooltip
              contentStyle={{ background: '#15151e', border: '1px solid #232330', borderRadius: 8, fontSize: 12, fontFamily: 'DM Sans' }}
              labelStyle={{ color: '#eeeef2', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'DM Sans' }} />
            <Bar dataKey="margem" name="Margem Real" fill="#d4a843" radius={[4, 4, 0, 0]} />
            <Bar dataKey="meta" name="Meta" fill="#722f37" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Alerts */}
      {data.belowTarget.length > 0 && (
        <div className="bg-rose/5 border border-rose/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-rose mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-rose">
              {data.belowTarget.length} produto(s) abaixo da meta de margem
            </p>
            <p className="text-xs text-text-secondary mt-1">
              {data.belowTarget.map((b) => b.product.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Detailed Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-display text-sm font-semibold text-text">Decomposicao Detalhada de Margem</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted text-xs uppercase tracking-wider bg-surface-el/50">
                <th className="px-5 py-3 font-medium cursor-pointer hover:text-text transition-colors" onClick={() => toggleSort('name')}>
                  <span className="flex items-center gap-1">
                    Produto
                    {sortField === 'name' && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </span>
                </th>
                <th className="px-5 py-3 font-medium text-right">Receita</th>
                <th className="px-5 py-3 font-medium text-right">CMV</th>
                <th className="px-5 py-3 font-medium text-right">Impostos</th>
                <th className="px-5 py-3 font-medium text-right">Custos Var.</th>
                <th className="px-5 py-3 font-medium text-right">Taxas Pgto</th>
                <th className="px-5 py-3 font-medium text-right">MC</th>
                <th className="px-5 py-3 font-medium text-right">Custos Fix.</th>
                <th className="px-5 py-3 font-medium text-right cursor-pointer hover:text-text transition-colors" onClick={() => toggleSort('margin')}>
                  <span className="flex items-center gap-1 justify-end">
                    Margem Liq.
                    {sortField === 'margin' && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.sorted.map((item, i) => {
                const b = item.breakdown;
                const isBelow = b.netMarginPercent < item.target;
                const isExpanded = expandedProduct === item.product.id;
                return (
                  <>
                    <tr
                      key={item.product.id}
                      className={`border-t border-border cursor-pointer ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-el/30'} hover:bg-surface-hover transition-colors`}
                      onClick={() => setExpandedProduct(isExpanded ? null : item.product.id)}
                    >
                      <td className="px-5 py-3">
                        <div className="text-text font-medium">{item.product.name}</div>
                        <div className="text-[10px] text-text-muted">{item.product.category}</div>
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-text-secondary">{formatCurrency(b.revenue)}</td>
                      <td className="px-5 py-3 text-right font-mono text-text-secondary">{formatCurrency(b.costOfGoods)}</td>
                      <td className="px-5 py-3 text-right font-mono text-text-secondary">{formatCurrency(b.taxes)}</td>
                      <td className="px-5 py-3 text-right font-mono text-text-secondary">{formatCurrency(b.variableCosts)}</td>
                      <td className="px-5 py-3 text-right font-mono text-text-secondary">{formatCurrency(b.paymentFees)}</td>
                      <td className="px-5 py-3 text-right font-mono text-gold-400">{formatCurrency(b.contributionMargin)}</td>
                      <td className="px-5 py-3 text-right font-mono text-text-secondary">{formatCurrency(b.fixedCostAllocation)}</td>
                      <td className={`px-5 py-3 text-right font-mono font-bold ${isBelow ? 'text-rose' : 'text-emerald'}`}>
                        {formatPercent(b.netMarginPercent)}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${item.product.id}-detail`} className="bg-surface-el/50">
                        <td colSpan={9} className="px-5 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                              <span className="text-text-muted">Lucro Liquido</span>
                              <p className={`font-mono font-bold text-base ${b.netProfit >= 0 ? 'text-emerald' : 'text-rose'}`}>{formatCurrency(b.netProfit)}</p>
                            </div>
                            <div>
                              <span className="text-text-muted">Margem Contribuicao</span>
                              <p className="font-mono font-bold text-base text-gold-400">{formatPercent(b.contributionMarginPercent)}</p>
                            </div>
                            <div>
                              <span className="text-text-muted">Meta de Margem</span>
                              <p className="font-mono font-bold text-base text-text">{formatPercent(item.target)}</p>
                            </div>
                            <div>
                              <span className="text-text-muted">Gap vs Meta</span>
                              <p className={`font-mono font-bold text-base ${b.netMarginPercent >= item.target ? 'text-emerald' : 'text-rose'}`}>
                                {formatPercent(b.netMarginPercent - item.target)}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
