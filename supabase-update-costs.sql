-- ============================================
-- ATUALIZAR CUSTOS ESTIMADOS (rodar se ja tem as tabelas)
-- ============================================

UPDATE products SET cost_price = GREATEST(0, ROUND((selling_price * 0.473575 - 0.5)::numeric, 2)) WHERE category = 'Vinhos' AND selling_price > 0;
UPDATE products SET cost_price = GREATEST(0, ROUND((selling_price * 0.523575 - 0.5)::numeric, 2)) WHERE category = 'Cervejas' AND selling_price > 0;
UPDATE products SET cost_price = GREATEST(0, ROUND((selling_price * 0.423575 - 0.5)::numeric, 2)) WHERE category = 'Destilados' AND selling_price > 0;
UPDATE products SET cost_price = GREATEST(0, ROUND((selling_price * 0.423575 - 0.5)::numeric, 2)) WHERE category = 'Cachacas' AND selling_price > 0;
UPDATE products SET cost_price = GREATEST(0, ROUND((selling_price * 0.273575 - 0.5)::numeric, 2)) WHERE category = 'Drinks' AND selling_price > 0;
UPDATE products SET cost_price = GREATEST(0, ROUND((selling_price * 0.173575 - 0.5)::numeric, 2)) WHERE category = 'Doses' AND selling_price > 0;
UPDATE products SET cost_price = GREATEST(0, ROUND((selling_price * 0.473575 - 0.5)::numeric, 2)) WHERE category = 'Kits' AND selling_price > 0;
UPDATE products SET cost_price = GREATEST(0, ROUND((selling_price * 0.373575 - 0.5)::numeric, 2)) WHERE category = 'Energeticos' AND selling_price > 0;
UPDATE products SET cost_price = GREATEST(0, ROUND((selling_price * 0.373575 - 0.5)::numeric, 2)) WHERE category = 'Bebidas Nao Alcoolicas' AND selling_price > 0;
UPDATE products SET cost_price = GREATEST(0, ROUND((selling_price * 0.323575 - 0.5)::numeric, 2)) WHERE category = 'Salgadinhos' AND selling_price > 0;
UPDATE products SET cost_price = GREATEST(0, ROUND((selling_price * 0.473575 - 0.5)::numeric, 2)) WHERE category = 'Churrasco' AND selling_price > 0;
UPDATE products SET cost_price = GREATEST(0, ROUND((selling_price * 0.373575 - 0.5)::numeric, 2)) WHERE category = 'Tabacaria' AND selling_price > 0;
UPDATE products SET cost_price = GREATEST(0, ROUND((selling_price * 0.273575 - 0.5)::numeric, 2)) WHERE category = 'Acessorios' AND selling_price > 0;
UPDATE products SET cost_price = GREATEST(0, ROUND((selling_price * 0.623575 - 0.5)::numeric, 2)) WHERE category = 'Promocoes' AND selling_price > 0;
UPDATE products SET cost_price = GREATEST(0, ROUND((selling_price * 0.473575 - 0.5)::numeric, 2)) WHERE category = 'Outros' AND selling_price > 0;