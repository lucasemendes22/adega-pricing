-- ============================================
-- ADEGA PRICING - Setup Supabase
-- Execute este SQL no SQL Editor do Supabase
-- Dashboard > SQL Editor > New Query
-- ============================================

-- Tabela de configuração do negócio
CREATE TABLE business_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text NOT NULL DEFAULT 'Minha Adega',
  tax_regime text NOT NULL DEFAULT 'SIMPLES_NACIONAL',
  tax_config jsonb NOT NULL DEFAULT '{}',
  fixed_costs jsonb NOT NULL DEFAULT '[]',
  variable_costs jsonb NOT NULL DEFAULT '[]',
  payment_fees jsonb NOT NULL DEFAULT '[]',
  estimated_monthly_sales numeric NOT NULL DEFAULT 80000,
  estimated_monthly_units_sold numeric NOT NULL DEFAULT 2000,
  margin_targets jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de produtos
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  supplier text NOT NULL DEFAULT '',
  cost_price numeric NOT NULL DEFAULT 0,
  selling_price numeric NOT NULL DEFAULT 0,
  is_auto_price boolean NOT NULL DEFAULT true,
  unit text NOT NULL DEFAULT 'un',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de cenários de simulação
CREATE TABLE simulation_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  adjustments jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE business_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_scenarios ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (sem auth para MVP)
CREATE POLICY "Allow all on business_config" ON business_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on simulation_scenarios" ON simulation_scenarios FOR ALL USING (true) WITH CHECK (true);

-- Trigger de updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_business_config_updated_at
  BEFORE UPDATE ON business_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED: Configuração padrão do negócio
-- ============================================
INSERT INTO business_config (
  store_name, tax_regime, tax_config, fixed_costs, variable_costs,
  payment_fees, estimated_monthly_sales, estimated_monthly_units_sold, margin_targets
) VALUES (
  'Minha Adega',
  'SIMPLES_NACIONAL',
  '{"regime": "SIMPLES_NACIONAL", "aliquotaEfetiva": 0.06, "rbt12": 360000}',
  '[
    {"id": "1", "name": "Aluguel", "monthlyCost": 3500},
    {"id": "2", "name": "Energia Eletrica", "monthlyCost": 800},
    {"id": "3", "name": "Agua", "monthlyCost": 150},
    {"id": "4", "name": "Internet/Telefone", "monthlyCost": 200},
    {"id": "5", "name": "Folha de Pagamento", "monthlyCost": 5000},
    {"id": "6", "name": "Contador", "monthlyCost": 600},
    {"id": "7", "name": "Sistema/Software", "monthlyCost": 150},
    {"id": "8", "name": "Outros", "monthlyCost": 300}
  ]',
  '[
    {"id": "1", "name": "Embalagens", "rate": 0.50, "isPercentage": false},
    {"id": "2", "name": "Perdas/Quebras", "rate": 1.0, "isPercentage": true}
  ]',
  '[
    {"id": "1", "name": "Credito a Vista", "fee": 2.99, "salesShare": 30},
    {"id": "2", "name": "Credito Parcelado 2-6x", "fee": 4.49, "salesShare": 15},
    {"id": "3", "name": "Credito Parcelado 7-12x", "fee": 5.99, "salesShare": 5},
    {"id": "4", "name": "Debito", "fee": 1.59, "salesShare": 25},
    {"id": "5", "name": "PIX", "fee": 0.00, "salesShare": 20},
    {"id": "6", "name": "Dinheiro", "fee": 0.00, "salesShare": 5}
  ]',
  80000,
  2000,
  '[
    {"category": "Vinhos", "targetMarginPercent": 30},
    {"category": "Cervejas", "targetMarginPercent": 25},
    {"category": "Destilados", "targetMarginPercent": 35},
    {"category": "Salgadinhos", "targetMarginPercent": 40},
    {"category": "Carnes", "targetMarginPercent": 20},
    {"category": "Outros", "targetMarginPercent": 30}
  ]'
);

-- ============================================
-- SEED: Produtos de exemplo
-- ============================================
INSERT INTO products (name, category, supplier, cost_price, selling_price, is_auto_price, unit) VALUES
  ('Vinho Casillero del Diablo', 'Vinhos', 'Distribuidora Bacchus', 32.00, 59.90, false, 'un'),
  ('Cerveja Heineken 600ml', 'Cervejas', 'Ambev', 5.80, 12.90, false, 'un'),
  ('Whisky Jack Daniels 1L', 'Destilados', 'Distribuidora Premium', 89.00, 169.90, false, 'un'),
  ('Amendoim Japones 500g', 'Salgadinhos', 'Distribuidora Snacks', 4.50, 12.90, false, 'un'),
  ('Picanha Bovina 1kg', 'Carnes', 'Frigorifico Boi Gordo', 55.00, 79.90, false, 'kg'),
  ('Cerveja Brahma Duplo Malte 350ml', 'Cervejas', 'Ambev', 2.10, 4.99, false, 'un'),
  ('Vodka Absolut 1L', 'Destilados', 'Distribuidora Premium', 42.00, 84.90, false, 'un'),
  ('Carvao Vegetal 4kg', 'Outros', 'Fornecedor Local', 12.00, 24.90, false, 'un');
