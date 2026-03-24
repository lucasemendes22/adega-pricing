import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Package, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calculateMarginBreakdown, formatCurrency, formatPercent, getTargetMargin,
} from '../lib/calculations';
import { ProductCategory } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  Vinhos: '#9b3d4a',
  Cervejas: '#d4a843',
  Destilados: '#b8922e',
  Cachacas: '#7a611c',
  Drinks: '#38bdf8',
  Doses: '#a78bfa',
  Kits: '#f97316',
  Energeticos: '#22d3ee',
  'Bebidas Nao Alcoolicas': '#6ee7b7',
  Salgadinhos: '#34d399',
  Churrasco: '#fb7185',
  Tabacaria: '#94a3b8',
  Acessorios: '#e879f9',
  Promocoes: '#fbbf24',
  Outros: '#64748b',
};

export function Dashboard() {
  const { config, products } = useApp();

  const analysis = useMemo(() => {
    const breakdowns = products.map((p) => ({
      product: p,
      breakdown: calculateMarginBreakdown(p, config),
    }));

    const totalRevenue = breakdowns.reduce((s, b) => s + b.breakdown.revenue, 0);
    const weightedMargin = totalRevenue > 0
      ? breakdowns.reduce((s, b) => s + b.breakdown.netMarginPercent * (b.breakdown.revenue / totalRevenue), 0)
      : 0;

    const belowTarget = breakdowns.filter((b) => {
      const target = getTargetMargin(config, b.product.category) * 100;
      return b.breakdown.netMarginPercent < target;
    });

    const estimatedProfit = breakdowns.reduce((s, b) => s + b.breakdown.netProfit, 0);

    const categoryData = Object.values(ProductCategory).map((cat) => {
      const catProducts = breakdowns.filter((b) => b.product.category === cat);
      const catRevenue = catProducts.reduce((s, b) => s + b.breakdown.revenue, 0);
      const avgMargin = catProducts.length > 0
        ? catProducts.reduce((s, b) => s + b.breakdown.netMarginPercent, 0) / catProducts.length
        : 0;
      const target = getTargetMargin(config, cat) * 100;
      return { name: cat, margin: Number(avgMargin.toFixed(1)), target: Number(target.toFixed(1)), revenue: catRevenue, count: catProducts.length };
    });

    return { totalRevenue, weightedMargin, belowTarget, estimatedProfit, categoryData, breakdowns };
  }, [config, products]);

  const kpis = [
    { label: 'Total Produtos', value: products.length.toString(), icon: Package, color: 'text-sky' },
    { label: 'Margem Media', value: formatPercent(analysis.weightedMargin), icon: TrendingUp, color: analysis.weightedMargin >= 0 ? 'text-emerald' : 'text-rose' },
    { label: 'Abaixo da Meta', value: analysis.belowTarget.length.toString(), icon: AlertTriangle, color: analysis.belowTarget.length > 0 ? 'text-rose' : 'text-emerald' },
    { label: 'Lucro Est./Produto', value: formatCurrency(analysis.estimatedProfit / (products.length || 1)), icon: DollarSign, color: 'text-gold-400' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="glass-card rounded-xl p-5 relative overflow-hidden group hover:border-border-light transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gold-400/5 to-transparent rounded-bl-full" />
            <div className="flex items-start justify-between relative">
              <div>
                <p className="text-xs uppercase tracking-wider text-text-muted mb-2">{kpi.label}</p>
                <p className={`text-2xl font-bold font-display ${kpi.color}`}>{kpi.value}</p>
              </div>
              <kpi.icon size={20} className="text-text-muted" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Margin by Category Bar Chart */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5">
          <h3 className="font-display text-sm font-semibold text-text mb-4">Margem por Categoria (%)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analysis.categoryData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid #e0e0e6', borderRadius: 8, fontSize: 12, fontFamily: 'Montserrat', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                labelStyle={{ color: '#1a1a2e', fontWeight: 600 }}
                itemStyle={{ color: '#6b6b80' }}
              />
              <Bar dataKey="margin" name="Margem Real" fill="#d4a843" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" name="Meta" fill="#722f37" radius={[4, 4, 0, 0]} opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Pie */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-display text-sm font-semibold text-text mb-4">Receita por Categoria</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={analysis.categoryData.filter((d) => d.revenue > 0)}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                strokeWidth={2}
                stroke="#ffffff"
              >
                {analysis.categoryData.filter((d) => d.revenue > 0).map((entry) => (
                  <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#555'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid #e0e0e6', borderRadius: 8, fontSize: 12, fontFamily: 'Montserrat', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                formatter={(value) => formatCurrency(Number(value))}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-1 mt-2">
            {analysis.categoryData.filter((d) => d.revenue > 0).map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs text-text-secondary">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: CATEGORY_COLORS[d.name] }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      {analysis.belowTarget.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose" />
            <h3 className="font-display text-sm font-semibold text-text">
              Produtos Abaixo da Meta ({analysis.belowTarget.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Produto</th>
                  <th className="px-5 py-3 font-medium">Categoria</th>
                  <th className="px-5 py-3 font-medium text-right">Margem Real</th>
                  <th className="px-5 py-3 font-medium text-right">Meta</th>
                  <th className="px-5 py-3 font-medium text-right">Gap</th>
                </tr>
              </thead>
              <tbody>
                {analysis.belowTarget
                  .sort((a, b) => a.breakdown.netMarginPercent - b.breakdown.netMarginPercent)
                  .map((item, i) => {
                    const target = getTargetMargin(config, item.product.category) * 100;
                    const gap = item.breakdown.netMarginPercent - target;
                    return (
                      <tr key={item.product.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-el/50'}`}>
                        <td className="px-5 py-3 text-text">{item.product.name}</td>
                        <td className="px-5 py-3 text-text-secondary">{item.product.category}</td>
                        <td className="px-5 py-3 text-right text-rose font-mono">{formatPercent(item.breakdown.netMarginPercent)}</td>
                        <td className="px-5 py-3 text-right text-text-secondary font-mono">{formatPercent(target)}</td>
                        <td className="px-5 py-3 text-right text-rose font-mono font-semibold">{formatPercent(gap)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
