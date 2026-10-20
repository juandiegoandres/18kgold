-- 0003 · nota de Carlos en cada código de cliente (qué quiere, presupuesto…). Se le recuerda
-- cuando llega el diseño. Se aplica una sola vez con `wrangler d1 migrations apply`.
ALTER TABLE codigos ADD COLUMN nota TEXT NOT NULL DEFAULT '';
