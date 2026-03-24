import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { BusinessConfig } from './pages/BusinessConfig';
import { ProductRegistry } from './pages/ProductRegistry';
import { MarginAnalysis } from './pages/MarginAnalysis';
import { PriceSimulator } from './pages/PriceSimulator';
import { NewProductCalculator } from './pages/NewProductCalculator';
import type { TabId } from './types';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'config': return <BusinessConfig />;
      case 'products': return <ProductRegistry />;
      case 'margins': return <MarginAnalysis />;
      case 'simulator': return <PriceSimulator />;
      case 'calculator': return <NewProductCalculator />;
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="lg:ml-[240px] min-h-screen flex flex-col">
        <Header activeTab={activeTab} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="animate-fade-in" key={activeTab}>
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
