import { useState } from 'react';
import { Plus, Trash2, CreditCard, Building, Percent, Target, DollarSign, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  TaxRegime,
  type FixedCost, type VariableCostRate, type PaymentMethodFee, type BusinessConfig as TBusinessConfig,
} from '../types';
import {
  calcularAliquotaEfetivaSimplesNacional, getEffectiveTaxRate,
  getTotalFixedCosts, formatCurrency, formatPercent, getWeightedPaymentFee,
} from '../lib/calculations';

function SectionCard({ title, icon: Icon, children, accent }: { title: string; icon: typeof Building; children: React.ReactNode; accent?: string }) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className={`px-5 py-4 border-b border-border flex items-center gap-2 ${accent || ''}`}>
        <Icon size={16} className="text-gold-400" />
        <h3 className="font-display text-sm font-semibold text-text">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InputField({ label, value, onChange, type = 'number', prefix, suffix, className = '' }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; prefix?: string; suffix?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-surface-el border border-border rounded-lg py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-colors ${prefix ? 'pl-9' : 'pl-3'} ${suffix ? 'pr-9' : 'pr-3'}`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">{suffix}</span>}
      </div>
    </div>
  );
}

export function BusinessConfig() {
  const { config, setConfig, recalculateAutoPrices } = useApp();
  const [showSaved, setShowSaved] = useState(false);

  const update = (partial: Partial<TBusinessConfig>) => {
    const next = { ...config, ...partial };
    setConfig(next);
    recalculateAutoPrices(next);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  // Tax regime handlers
  const setRegime = (regime: TaxRegime) => {
    if (regime === TaxRegime.SIMPLES_NACIONAL) {
      update({ taxConfig: { regime, aliquotaEfetiva: calcularAliquotaEfetivaSimplesNacional(config.taxConfig.regime === TaxRegime.SIMPLES_NACIONAL ? (config.taxConfig as any).rbt12 : 360000), rbt12: config.taxConfig.regime === TaxRegime.SIMPLES_NACIONAL ? (config.taxConfig as any).rbt12 : 360000 } });
    } else if (regime === TaxRegime.LUCRO_PRESUMIDO) {
      update({ taxConfig: { regime, irpj: 1.2, csll: 1.08, pis: 0.65, cofins: 3.0, icms: 18 } });
    } else {
      update({ taxConfig: { regime, irpj: 15, csll: 9, pis: 1.65, cofins: 7.6, icms: 18 } });
    }
  };

  // Fixed costs handlers
  const addFixedCost = () => {
    const newCost: FixedCost = { id: crypto.randomUUID(), name: '', monthlyCost: 0 };
    update({ fixedCosts: [...config.fixedCosts, newCost] });
  };
  const updateFixedCost = (id: string, field: keyof FixedCost, value: string | number) => {
    update({ fixedCosts: config.fixedCosts.map((c) => c.id === id ? { ...c, [field]: value } : c) });
  };
  const removeFixedCost = (id: string) => {
    update({ fixedCosts: config.fixedCosts.filter((c) => c.id !== id) });
  };

  // Variable costs handlers
  const addVariableCost = () => {
    const newCost: VariableCostRate = { id: crypto.randomUUID(), name: '', rate: 0, isPercentage: true };
    update({ variableCosts: [...config.variableCosts, newCost] });
  };
  const updateVariableCost = (id: string, field: keyof VariableCostRate, value: any) => {
    update({ variableCosts: config.variableCosts.map((c) => c.id === id ? { ...c, [field]: value } : c) });
  };
  const removeVariableCost = (id: string) => {
    update({ variableCosts: config.variableCosts.filter((c) => c.id !== id) });
  };

  // Payment fees handlers
  const addPaymentFee = () => {
    const newFee: PaymentMethodFee = { id: crypto.randomUUID(), name: '', fee: 0, salesShare: 0 };
    update({ paymentFees: [...config.paymentFees, newFee] });
  };
  const updatePaymentFee = (id: string, field: keyof PaymentMethodFee, value: any) => {
    update({ paymentFees: config.paymentFees.map((f) => f.id === id ? { ...f, [field]: value } : f) });
  };
  const removePaymentFee = (id: string) => {
    update({ paymentFees: config.paymentFees.filter((f) => f.id !== id) });
  };

  const effectiveTax = getEffectiveTaxRate(config.taxConfig) * 100;
  const weightedFee = getWeightedPaymentFee(config) * 100;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Save indicator */}
      {showSaved && (
        <div className="fixed top-20 right-6 bg-emerald/10 border border-emerald/30 text-emerald px-4 py-2 rounded-lg text-sm animate-fade-in z-50">
          Salvo automaticamente
        </div>
      )}

      {/* Store Name & Estimates */}
      <SectionCard title="Informacoes Gerais" icon={Building}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Nome da Loja"
            value={config.storeName}
            onChange={(v) => update({ storeName: v })}
            type="text"
          />
          <InputField
            label="Faturamento Mensal Estimado"
            value={config.estimatedMonthlySales}
            onChange={(v) => update({ estimatedMonthlySales: Number(v) || 0 })}
            prefix="R$"
          />
          <InputField
            label="Unidades Vendidas/Mes"
            value={config.estimatedMonthlyUnitsSold}
            onChange={(v) => update({ estimatedMonthlyUnitsSold: Number(v) || 0 })}
          />
        </div>
      </SectionCard>

      {/* Tax Regime */}
      <SectionCard title="Regime Tributario" icon={Percent}>
        <div className="space-y-4">
          {/* Regime selector */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: TaxRegime.SIMPLES_NACIONAL, label: 'Simples Nacional' },
              { value: TaxRegime.LUCRO_PRESUMIDO, label: 'Lucro Presumido' },
              { value: TaxRegime.LUCRO_REAL, label: 'Lucro Real' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRegime(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  config.taxConfig.regime === opt.value
                    ? 'bg-gold-400/15 text-gold-400 border border-gold-400/30'
                    : 'bg-surface-el text-text-secondary border border-border hover:border-border-light'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Simples Nacional fields */}
          {config.taxConfig.regime === TaxRegime.SIMPLES_NACIONAL && (() => {
            const tc = config.taxConfig as import('../types').SimplesNacionalConfig;
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-surface-el/50 rounded-lg border border-border">
                <InputField
                  label="Receita Bruta 12 meses (RBT12)"
                  value={tc.rbt12}
                  onChange={(v) => {
                    const rbt = Number(v) || 0;
                    const aliquota = calcularAliquotaEfetivaSimplesNacional(rbt);
                    update({ taxConfig: { regime: TaxRegime.SIMPLES_NACIONAL, rbt12: rbt, aliquotaEfetiva: aliquota } });
                  }}
                  prefix="R$"
                />
                <div>
                  <label className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">Aliquota Efetiva (auto)</label>
                  <div className="bg-surface border border-gold-500/20 rounded-lg py-2 px-3 text-lg font-bold text-gold-400 font-display">
                    {formatPercent(tc.aliquotaEfetiva * 100)}
                  </div>
                  <p className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
                    <Info size={10} /> Calculado automaticamente pelo Anexo I
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Lucro Presumido fields */}
          {config.taxConfig.regime === TaxRegime.LUCRO_PRESUMIDO && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-surface-el/50 rounded-lg border border-border">
              {(['irpj', 'csll', 'pis', 'cofins', 'icms'] as const).map((field) => (
                <InputField
                  key={field}
                  label={field.toUpperCase()}
                  value={(config.taxConfig as any)[field]}
                  onChange={(v) => update({ taxConfig: { ...config.taxConfig, [field]: Number(v) || 0 } as any })}
                  suffix="%"
                />
              ))}
            </div>
          )}

          {/* Lucro Real fields */}
          {config.taxConfig.regime === TaxRegime.LUCRO_REAL && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-surface-el/50 rounded-lg border border-border">
              {(['irpj', 'csll', 'pis', 'cofins', 'icms'] as const).map((field) => (
                <InputField
                  key={field}
                  label={field.toUpperCase()}
                  value={(config.taxConfig as any)[field]}
                  onChange={(v) => update({ taxConfig: { ...config.taxConfig, [field]: Number(v) || 0 } as any })}
                  suffix="%"
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-muted">Carga tributaria efetiva:</span>
            <span className="font-bold text-gold-400 font-mono">{formatPercent(effectiveTax)}</span>
          </div>
        </div>
      </SectionCard>

      {/* Fixed Costs */}
      <SectionCard title="Custos Fixos Mensais" icon={DollarSign}>
        <div className="space-y-2">
          {config.fixedCosts.map((cost) => (
            <div key={cost.id} className="flex items-center gap-3 group">
              <input
                type="text"
                value={cost.name}
                onChange={(e) => updateFixedCost(cost.id, 'name', e.target.value)}
                placeholder="Nome do custo"
                className="flex-1 bg-surface-el border border-border rounded-lg py-2 px-3 text-sm text-text placeholder-text-muted focus:outline-none focus:border-gold-500/50 transition-colors"
              />
              <div className="relative w-36">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">R$</span>
                <input
                  type="number"
                  value={cost.monthlyCost || ''}
                  onChange={(e) => updateFixedCost(cost.id, 'monthlyCost', Number(e.target.value) || 0)}
                  className="w-full bg-surface-el border border-border rounded-lg py-2 pl-9 pr-3 text-sm text-text text-right focus:outline-none focus:border-gold-500/50 transition-colors"
                />
              </div>
              <button onClick={() => removeFixedCost(cost.id)} className="p-2 text-text-muted hover:text-rose transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <button onClick={addFixedCost} className="flex items-center gap-1.5 text-sm text-gold-400 hover:text-gold-300 transition-colors">
              <Plus size={14} /> Adicionar Custo
            </button>
            <span className="text-sm font-mono">
              Total: <span className="font-bold text-gold-400">{formatCurrency(getTotalFixedCosts(config))}</span>
            </span>
          </div>
        </div>
      </SectionCard>

      {/* Variable Costs */}
      <SectionCard title="Custos Variaveis" icon={Percent}>
        <div className="space-y-2">
          {config.variableCosts.map((cost) => (
            <div key={cost.id} className="flex items-center gap-3 group">
              <input
                type="text"
                value={cost.name}
                onChange={(e) => updateVariableCost(cost.id, 'name', e.target.value)}
                placeholder="Nome"
                className="flex-1 bg-surface-el border border-border rounded-lg py-2 px-3 text-sm text-text placeholder-text-muted focus:outline-none focus:border-gold-500/50 transition-colors"
              />
              <input
                type="number"
                value={cost.rate || ''}
                onChange={(e) => updateVariableCost(cost.id, 'rate', Number(e.target.value) || 0)}
                className="w-24 bg-surface-el border border-border rounded-lg py-2 px-3 text-sm text-text text-right focus:outline-none focus:border-gold-500/50 transition-colors"
              />
              <button
                onClick={() => updateVariableCost(cost.id, 'isPercentage', !cost.isPercentage)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  cost.isPercentage
                    ? 'bg-gold-400/10 text-gold-400 border-gold-400/30'
                    : 'bg-surface-el text-text-secondary border-border'
                }`}
              >
                {cost.isPercentage ? '%' : 'R$/un'}
              </button>
              <button onClick={() => removeVariableCost(cost.id)} className="p-2 text-text-muted hover:text-rose transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button onClick={addVariableCost} className="flex items-center gap-1.5 text-sm text-gold-400 hover:text-gold-300 transition-colors pt-2">
            <Plus size={14} /> Adicionar Custo Variavel
          </button>
        </div>
      </SectionCard>

      {/* Payment Method Fees */}
      <SectionCard title="Taxas da Maquininha / Meios de Pagamento" icon={CreditCard}>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_100px_100px_32px] gap-3 text-xs text-text-muted uppercase tracking-wider mb-2 px-1">
            <span>Meio de Pagamento</span>
            <span className="text-right">Taxa %</span>
            <span className="text-right">% Vendas</span>
            <span></span>
          </div>
          {config.paymentFees.map((fee) => (
            <div key={fee.id} className="grid grid-cols-[1fr_100px_100px_32px] gap-3 items-center group">
              <input
                type="text"
                value={fee.name}
                onChange={(e) => updatePaymentFee(fee.id, 'name', e.target.value)}
                placeholder="Ex: Credito a Vista"
                className="bg-surface-el border border-border rounded-lg py-2 px-3 text-sm text-text placeholder-text-muted focus:outline-none focus:border-gold-500/50 transition-colors"
              />
              <div className="relative">
                <input
                  type="number"
                  value={fee.fee || ''}
                  onChange={(e) => updatePaymentFee(fee.id, 'fee', Number(e.target.value) || 0)}
                  step="0.01"
                  className="w-full bg-surface-el border border-border rounded-lg py-2 px-3 pr-7 text-sm text-text text-right focus:outline-none focus:border-gold-500/50 transition-colors"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted text-xs">%</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={fee.salesShare || ''}
                  onChange={(e) => updatePaymentFee(fee.id, 'salesShare', Number(e.target.value) || 0)}
                  className="w-full bg-surface-el border border-border rounded-lg py-2 px-3 pr-7 text-sm text-text text-right focus:outline-none focus:border-gold-500/50 transition-colors"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted text-xs">%</span>
              </div>
              <button onClick={() => removePaymentFee(fee.id)} className="p-2 text-text-muted hover:text-rose transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <button onClick={addPaymentFee} className="flex items-center gap-1.5 text-sm text-gold-400 hover:text-gold-300 transition-colors">
              <Plus size={14} /> Adicionar Meio de Pagamento
            </button>
            <span className="text-sm font-mono">
              Taxa Ponderada: <span className="font-bold text-gold-400">{formatPercent(weightedFee)}</span>
            </span>
          </div>
        </div>
      </SectionCard>

      {/* Margin Targets */}
      <SectionCard title="Metas de Margem por Categoria" icon={Target}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {config.marginTargets.map((mt) => (
            <div key={mt.category} className="flex items-center gap-3 bg-surface-el rounded-lg p-3 border border-border">
              <span className="text-sm text-text flex-1">{mt.category}</span>
              <div className="relative w-20">
                <input
                  type="number"
                  value={mt.targetMarginPercent || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    update({
                      marginTargets: config.marginTargets.map((t) =>
                        t.category === mt.category ? { ...t, targetMarginPercent: val } : t
                      ),
                    });
                  }}
                  className="w-full bg-surface border border-border rounded-lg py-1.5 px-2 pr-6 text-sm text-gold-400 text-right font-mono focus:outline-none focus:border-gold-500/50 transition-colors"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted text-xs">%</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
