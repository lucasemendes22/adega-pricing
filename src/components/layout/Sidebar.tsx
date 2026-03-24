import {
  LayoutDashboard,
  Settings,
  Package,
  TrendingUp,
  Calculator,
  PlusCircle,
  Wine,
  Menu,
  X,
} from 'lucide-react';
import type { TabId } from '../../types';

const tabs: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'config', label: 'Configuracao', icon: Settings },
  { id: 'products', label: 'Produtos', icon: Package },
  { id: 'margins', label: 'Margens', icon: TrendingUp },
  { id: 'simulator', label: 'Simulador', icon: Calculator },
  { id: 'calculator', label: 'Calculadora', icon: PlusCircle },
];

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ activeTab, onTabChange, isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-surface-el border border-border text-gold-400"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40 w-[240px]
          bg-surface border-r border-border
          flex flex-col
          transition-transform duration-300 ease-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo area */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/10">
              <Wine size={20} className="text-bg" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-text leading-tight">
                Adega
              </h1>
              <p className="text-[11px] uppercase tracking-[0.15em] text-gold-500 font-medium">
                Pricing
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200 relative group
                  ${
                    isActive
                      ? 'bg-gold-400/10 text-gold-400'
                      : 'text-text-secondary hover:text-text hover:bg-surface-el'
                  }
                `}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gold-400" />
                )}
                <Icon size={18} className={isActive ? 'text-gold-400' : 'text-text-muted group-hover:text-text-secondary'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer deco */}
        <div className="p-4 border-t border-border">
          <div className="deco-pattern rounded-lg p-3 text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
              Sistema de Precificacao
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
