-- FIFO 재고 관리 시스템 테이블

-- 재고 품목 테이블
CREATE TABLE IF NOT EXISTS inventory_items (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  unit VARCHAR NOT NULL,
  safety_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
  reorder_point DECIMAL(10, 2) NOT NULL DEFAULT 0,
  max_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
  lead_time_days INTEGER NOT NULL DEFAULT 1,
  average_daily_cost DECIMAL(10, 2),
  total_quantity DECIMAL(10, 2) DEFAULT 0,
  total_value DECIMAL(12, 2) DEFAULT 0,
  weighted_average_cost DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 재고 로트 테이블
CREATE TABLE IF NOT EXISTS inventory_lots (
  id VARCHAR PRIMARY KEY,
  item_id VARCHAR NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  item_name VARCHAR NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  remaining_quantity DECIMAL(10, 2) NOT NULL,
  unit_cost DECIMAL(10, 2) NOT NULL,
  purchase_date TIMESTAMPTZ NOT NULL,
  expiry_date TIMESTAMPTZ,
  batch_number VARCHAR NOT NULL,
  supplier_id VARCHAR,
  warehouse_id VARCHAR DEFAULT 'DEFAULT',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT positive_quantity CHECK (quantity >= 0),
  CONSTRAINT positive_remaining CHECK (remaining_quantity >= 0),
  CONSTRAINT remaining_not_exceed CHECK (remaining_quantity <= quantity)
);

-- 재고 이동 테이블
CREATE TABLE IF NOT EXISTS inventory_movements (
  id VARCHAR PRIMARY KEY,
  item_id VARCHAR NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  lot_id VARCHAR REFERENCES inventory_lots(id) ON DELETE SET NULL,
  type VARCHAR NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT')),
  quantity DECIMAL(10, 2) NOT NULL,
  unit_cost DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(12, 2) NOT NULL,
  reason VARCHAR,
  reference_id VARCHAR,
  performed_by VARCHAR NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 재고 알림 테이블
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id VARCHAR PRIMARY KEY,
  item_id VARCHAR NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL CHECK (type IN ('LOW_STOCK', 'EXPIRY', 'OVERSTOCK', 'REORDER')),
  severity VARCHAR NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
  message TEXT NOT NULL,
  threshold DECIMAL(10, 2),
  current_value DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by VARCHAR
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_lots_item_id ON inventory_lots(item_id);
CREATE INDEX IF NOT EXISTS idx_lots_expiry ON inventory_lots(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lots_remaining ON inventory_lots(remaining_quantity) WHERE remaining_quantity > 0;
CREATE INDEX IF NOT EXISTS idx_movements_item_date ON inventory_movements(item_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_type ON inventory_movements(type);
CREATE INDEX IF NOT EXISTS idx_alerts_item_type ON inventory_alerts(item_id, type);
CREATE INDEX IF NOT EXISTS idx_alerts_unacknowledged ON inventory_alerts(created_at DESC) WHERE acknowledged_at IS NULL;

-- Row Level Security (RLS)
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 인증된 사용자만 접근 가능
CREATE POLICY "인증된 사용자는 재고 품목을 조회할 수 있다" ON inventory_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "관리자는 재고 품목을 관리할 수 있다" ON inventory_items
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.uid() = id 
      AND raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

CREATE POLICY "인증된 사용자는 재고 로트를 조회할 수 있다" ON inventory_lots
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "관리자는 재고 로트를 관리할 수 있다" ON inventory_lots
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.uid() = id 
      AND raw_user_meta_data->>'role' IN ('admin', 'manager', 'staff')
    )
  );

CREATE POLICY "인증된 사용자는 재고 이동을 조회할 수 있다" ON inventory_movements
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "직원은 재고 이동을 기록할 수 있다" ON inventory_movements
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.uid() = id 
      AND raw_user_meta_data->>'role' IN ('admin', 'manager', 'staff')
    )
  );

CREATE POLICY "인증된 사용자는 알림을 조회할 수 있다" ON inventory_alerts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "직원은 알림을 확인할 수 있다" ON inventory_alerts
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.uid() = id 
      AND raw_user_meta_data->>'role' IN ('admin', 'manager', 'staff')
    )
  );

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE
  ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_lots_updated_at BEFORE UPDATE
  ON inventory_lots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 함수: 재고 메트릭 업데이트
CREATE OR REPLACE FUNCTION update_inventory_metrics()
RETURNS TRIGGER AS $$
DECLARE
  v_total_quantity DECIMAL;
  v_total_value DECIMAL;
  v_weighted_avg_cost DECIMAL;
BEGIN
  -- 품목의 총 수량과 가치 계산
  SELECT 
    COALESCE(SUM(remaining_quantity), 0),
    COALESCE(SUM(remaining_quantity * unit_cost), 0)
  INTO v_total_quantity, v_total_value
  FROM inventory_lots
  WHERE item_id = COALESCE(NEW.item_id, OLD.item_id)
    AND remaining_quantity > 0;

  -- 가중평균원가 계산
  IF v_total_quantity > 0 THEN
    v_weighted_avg_cost := v_total_value / v_total_quantity;
  ELSE
    v_weighted_avg_cost := 0;
  END IF;

  -- 품목 테이블 업데이트
  UPDATE inventory_items
  SET 
    total_quantity = v_total_quantity,
    total_value = v_total_value,
    weighted_average_cost = v_weighted_avg_cost,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.item_id, OLD.item_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거: 로트 변경 시 메트릭 업데이트
CREATE TRIGGER update_metrics_on_lot_change
AFTER INSERT OR UPDATE OR DELETE ON inventory_lots
FOR EACH ROW EXECUTE FUNCTION update_inventory_metrics();

-- 트리거: 이동 기록 시 메트릭 업데이트
CREATE TRIGGER update_metrics_on_movement
AFTER INSERT ON inventory_movements
FOR EACH ROW EXECUTE FUNCTION update_inventory_metrics();

-- 뷰: 재고 현황 대시보드
CREATE OR REPLACE VIEW inventory_dashboard AS
SELECT 
  i.id,
  i.name,
  i.category,
  i.unit,
  i.total_quantity,
  i.total_value,
  i.weighted_average_cost,
  i.safety_stock,
  i.reorder_point,
  i.max_stock,
  CASE 
    WHEN i.total_quantity <= i.safety_stock * 0.2 THEN 'CRITICAL'
    WHEN i.total_quantity <= i.safety_stock THEN 'LOW'
    WHEN i.total_quantity >= i.max_stock * 1.5 THEN 'OVERSTOCK'
    ELSE 'NORMAL'
  END as stock_status,
  COUNT(DISTINCT l.id) as active_lots,
  MIN(l.expiry_date) as nearest_expiry
FROM inventory_items i
LEFT JOIN inventory_lots l ON i.id = l.item_id AND l.remaining_quantity > 0
GROUP BY i.id;

-- 샘플 데이터 (개발용)
-- INSERT INTO inventory_items (id, name, category, unit, safety_stock, reorder_point, max_stock, lead_time_days)
-- VALUES 
--   ('TOMATO', '토마토', '채소', 'kg', 30, 50, 200, 2),
--   ('ONION', '양파', '채소', 'kg', 40, 60, 250, 3),
--   ('RICE', '쌀', '곡물', 'kg', 100, 150, 500, 3),
--   ('BEEF', '소고기', '육류', 'kg', 20, 30, 100, 1),
--   ('MILK', '우유', '유제품', 'L', 20, 30, 100, 1);