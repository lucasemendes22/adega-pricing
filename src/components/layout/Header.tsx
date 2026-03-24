import type { TabId } from '../../types';
import { useApp } from '../../context/AppContext';

const tabNames: Record<TabId, string> = {
  dashboard: 'Dashboard',
  config: 'Configuracao do Negocio',
  products: 'Cadastro de Produtos',
  margins: 'Analise de Margens',
  simulator: 'Simulador de Precos',
  calculator: 'Calculadora de Novo Produto',
};

interface HeaderProps {
  activeTab: TabId;
}

export function Header({ activeTab }: HeaderProps) {
  const { config } = useApp();

  return (
    <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <span className="text-text-muted text-sm">{config.storeName}</span>
        <span className="text-text-muted">/</span>
        <h2 className="font-display text-base font-semibold text-text">
          {tabNames[activeTab]}
        </h2>
      </div>

      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
          Dados salvos localmente
        </div>
      </div>
    </header>
  );
}
