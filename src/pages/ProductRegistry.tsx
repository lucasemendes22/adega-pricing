import { useState, useMemo } from 'react';
import { Plus, Search, Edit3, Trash2, X, Zap, PenLine } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCategory, type Product } from '../types';
import { calculateMarginBreakdown, calculateSellingPrice, formatCurrency, formatPercent, getTargetMargin } from '../lib/calculations';

const categories = ['Todos', ...Object.values(ProductCategory)] as const;

interface ProductForm {
  name: string;
  category: ProductCategory;
  supplier: string;
  costPrice: number;
  sellingPrice: number;
  isAutoPrice: boolean;
  unit: string;
  notes: string;
}

const emptyForm: ProductForm = {
  name: '', category: ProductCategory.VINHOS, supplier: '',
  costPrice: 0, sellingPrice: 0, isAutoPrice: true, unit: 'un', notes: '',
};

export function ProductRegistry() {
  const { config, products, addProduct, updateProduct, deleteProduct } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = categoryFilter === 'Todos' || p.category === categoryFilter;
      const matchSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.supplier.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, categoryFilter, search]);

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setForm({ name: p.name, category: p.category, supplier: p.supplier, costPrice: p.costPrice, sellingPrice: p.sellingPrice, isAutoPrice: p.isAutoPrice, unit: p.unit, notes: p.notes });
    setEditingId(p.id);
    setShowModal(true);
  };

  const handleSave = () => {
    const finalPrice = form.isAutoPrice
      ? calculateSellingPrice(form.costPrice, config, form.category)
      : form.sellingPrice;

    if (editingId) {
      updateProduct(editingId, { ...form, sellingPrice: finalPrice > 0 ? finalPrice : form.sellingPrice });
    } else {
      addProduct({ ...form, sellingPrice: finalPrice > 0 ? finalPrice : form.sellingPrice });
    }
    setShowModal(false);
  };

  const autoPrice = form.isAutoPrice ? calculateSellingPrice(form.costPrice, config, form.category) : null;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === cat
                  ? 'bg-gold-400/15 text-gold-400 border border-gold-400/30'
                  : 'bg-surface-el text-text-secondary border border-border hover:border-border-light'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-el border border-border rounded-lg py-2 pl-9 pr-3 text-sm text-text placeholder-text-muted focus:outline-none focus:border-gold-500/50 transition-colors"
            />
          </div>
          <button onClick={openNew} className="flex items-center gap-1.5 bg-gold-400 hover:bg-gold-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap">
            <Plus size={14} /> Novo Produto
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted text-xs uppercase tracking-wider bg-surface-el/50">
                <th className="px-5 py-3 font-medium">Produto</th>
                <th className="px-5 py-3 font-medium">Categoria</th>
                <th className="px-5 py-3 font-medium">Fornecedor</th>
                <th className="px-5 py-3 font-medium text-right">Custo</th>
                <th className="px-5 py-3 font-medium text-right">Venda</th>
                <th className="px-5 py-3 font-medium text-right">Margem</th>
                <th className="px-5 py-3 font-medium text-center">Status</th>
                <th className="px-5 py-3 font-medium text-center">Preco</th>
                <th className="px-5 py-3 font-medium text-right">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const breakdown = calculateMarginBreakdown(p, config);
                const target = getTargetMargin(config, p.category) * 100;
                const isBelow = breakdown.netMarginPercent < target;
                return (
                  <tr key={p.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-el/30'} hover:bg-surface-hover transition-colors`}>
                    <td className="px-5 py-3 text-text font-medium">{p.name}</td>
                    <td className="px-5 py-3 text-text-secondary">{p.category}</td>
                    <td className="px-5 py-3 text-text-secondary">{p.supplier}</td>
                    <td className="px-5 py-3 text-right font-mono text-text-secondary">{formatCurrency(p.costPrice)}</td>
                    <td className="px-5 py-3 text-right font-mono text-text font-medium">{formatCurrency(p.sellingPrice)}</td>
                    <td className={`px-5 py-3 text-right font-mono font-semibold ${isBelow ? 'text-rose' : 'text-emerald'}`}>
                      {formatPercent(breakdown.netMarginPercent)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        isBelow ? 'bg-rose/10 text-rose' : 'bg-emerald/10 text-emerald'
                      }`}>
                        {isBelow ? 'Abaixo' : 'OK'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {p.isAutoPrice ? (
                        <Zap size={14} className="text-gold-400 mx-auto" />
                      ) : (
                        <PenLine size={14} className="text-text-muted mx-auto" />
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-surface-el text-text-muted hover:text-gold-400 transition-colors">
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(p.id)}
                          className="p-1.5 rounded-md hover:bg-surface-el text-text-muted hover:text-rose transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-text-muted">
                    Nenhum produto encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-surface-el border border-border rounded-xl p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold text-text">Confirmar Exclusao</h3>
            <p className="text-sm text-text-secondary">Tem certeza que deseja excluir este produto?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg text-sm text-text-secondary border border-border hover:bg-surface-hover transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => { deleteProduct(confirmDelete); setConfirmDelete(null); }}
                className="px-4 py-2 rounded-lg text-sm bg-rose/20 text-rose border border-rose/30 hover:bg-rose/30 transition-colors font-medium"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-display text-lg font-semibold text-text">
                {editingId ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-text-muted hover:text-text transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">Nome</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-surface-el border border-border rounded-lg py-2 px-3 text-sm text-text focus:outline-none focus:border-gold-500/50 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">Categoria</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ProductCategory })}
                    className="w-full bg-surface-el border border-border rounded-lg py-2 px-3 text-sm text-text focus:outline-none focus:border-gold-500/50 transition-colors">
                    {Object.values(ProductCategory).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">Fornecedor</label>
                  <input type="text" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    className="w-full bg-surface-el border border-border rounded-lg py-2 px-3 text-sm text-text focus:outline-none focus:border-gold-500/50 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">Preco de Custo</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">R$</span>
                    <input type="number" step="0.01" value={form.costPrice || ''} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) || 0 })}
                      className="w-full bg-surface-el border border-border rounded-lg py-2 pl-9 pr-3 text-sm text-text focus:outline-none focus:border-gold-500/50 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">Unidade</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full bg-surface-el border border-border rounded-lg py-2 px-3 text-sm text-text focus:outline-none focus:border-gold-500/50 transition-colors">
                    <option value="un">Unidade</option>
                    <option value="kg">Kg</option>
                    <option value="L">Litro</option>
                    <option value="cx">Caixa</option>
                  </select>
                </div>

                {/* Auto/Manual Toggle */}
                <div className="col-span-2">
                  <label className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">Modo de Precificacao</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setForm({ ...form, isAutoPrice: true })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        form.isAutoPrice ? 'bg-gold-400/15 text-gold-400 border border-gold-400/30' : 'bg-surface-el text-text-secondary border border-border'
                      }`}
                    >
                      <Zap size={14} /> Automatico
                    </button>
                    <button
                      onClick={() => setForm({ ...form, isAutoPrice: false })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        !form.isAutoPrice ? 'bg-gold-400/15 text-gold-400 border border-gold-400/30' : 'bg-surface-el text-text-secondary border border-border'
                      }`}
                    >
                      <PenLine size={14} /> Manual
                    </button>
                  </div>
                </div>

                {form.isAutoPrice ? (
                  <div className="col-span-2 bg-surface-el/50 rounded-lg p-4 border border-gold-500/20">
                    <p className="text-xs text-text-muted mb-1">Preco Calculado Automaticamente</p>
                    <p className="text-2xl font-bold text-gold-400 font-display">
                      {autoPrice && autoPrice > 0 ? formatCurrency(autoPrice) : 'Impossivel calcular'}
                    </p>
                  </div>
                ) : (
                  <div className="col-span-2">
                    <label className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">Preco de Venda</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">R$</span>
                      <input type="number" step="0.01" value={form.sellingPrice || ''} onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) || 0 })}
                        className="w-full bg-surface-el border border-border rounded-lg py-2 pl-9 pr-3 text-sm text-text focus:outline-none focus:border-gold-500/50 transition-colors" />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-border flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm text-text-secondary border border-border hover:bg-surface-hover transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} className="px-5 py-2 rounded-lg text-sm bg-gold-400 hover:bg-gold-500 text-white font-semibold transition-colors">
                {editingId ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
