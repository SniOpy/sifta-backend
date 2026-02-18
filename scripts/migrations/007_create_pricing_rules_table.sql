-- Migration: Table pricing_rules (grille tarifaire par ville / distance)
-- Date: 2026-02-07

CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city VARCHAR(100) NOT NULL,
  min_distance DECIMAL(10,2) NOT NULL,
  max_distance DECIMAL(10,2) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_min_distance_positive CHECK (min_distance >= 0),
  CONSTRAINT chk_max_distance_positive CHECK (max_distance > 0),
  CONSTRAINT chk_max_greater_than_min CHECK (max_distance > min_distance),
  CONSTRAINT chk_price_positive CHECK (price > 0),
  UNIQUE(city, min_distance, max_distance)
);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_city ON pricing_rules(city);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_city_range ON pricing_rules(city, min_distance, max_distance);

DROP TRIGGER IF EXISTS update_pricing_rules_updated_at ON pricing_rules;
CREATE TRIGGER update_pricing_rules_updated_at BEFORE UPDATE ON pricing_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO pricing_rules (city, min_distance, max_distance, price) VALUES
  ('Tanger', 0, 2, 20),
  ('Tanger', 2, 5, 25),
  ('Tanger', 5, 10, 30),
  ('Tanger', 10, 15, 40),
  ('Tanger', 15, 9999, 50)
ON CONFLICT (city, min_distance, max_distance) DO NOTHING;
