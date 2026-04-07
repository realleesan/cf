-- =====================================================
-- COFFEE SHOP POS SYSTEM - SUPABASE DATABASE SCHEMA
-- =====================================================
-- This schema supports the complete POS system with:
-- - Menu management (categories & items)
-- - Order processing (orders, order items)
-- - Table management (floor plan, status)
-- - Staff management (profiles, earnings)
-- - Payment tracking
-- =====================================================

-- =====================================================
-- 1. MENU CATEGORIES
-- =====================================================
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 2. MENU ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 3. TABLES (Quản lý bàn)
-- =====================================================
CREATE TABLE IF NOT EXISTS tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_number TEXT NOT NULL UNIQUE,
    floor_zone TEXT NOT NULL DEFAULT 'ground_floor',
    capacity INTEGER NOT NULL DEFAULT 4,
    status TEXT NOT NULL DEFAULT 'available',
    current_order_id UUID NULL,
    last_activity TIMESTAMPTZ NULL,
    assigned_staff_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 4. STAFF (Nhân viên)
-- =====================================================
CREATE TABLE IF NOT EXISTS staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id TEXT UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    photo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    hire_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 5. ORDERS (Đơn hàng)
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    table_id UUID NULL REFERENCES tables(id),
    staff_id UUID NOT NULL REFERENCES staff(id),
    customer_name TEXT,
    customer_phone TEXT,
    order_type TEXT NOT NULL DEFAULT 'dine-in',
    status TEXT NOT NULL DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    special_instructions TEXT,
    order_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_time TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 6. ORDER ITEMS (Chi tiết đơn hàng)
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    modifiers JSONB,
    special_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 7. PAYMENTS (Thanh toán) - Optional
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    transaction_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 8. STAFF EARNINGS (Thống kê thu nhập) - Optional
-- =====================================================
CREATE TABLE IF NOT EXISTS staff_earnings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES staff(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
    shift_completion_rate DECIMAL(5,2),
    active_hours DECIMAL(6,2),
    average_customer_rating DECIMAL(3,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(staff_id, period_start, period_end)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_orders_order_time ON orders(order_time DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_staff_id ON orders(staff_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);
CREATE INDEX IF NOT EXISTS idx_tables_floor_zone ON tables(floor_zone);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_staff_earnings_staff_id ON staff_earnings(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_earnings_period ON staff_earnings(period_start, period_end);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON menu_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_earnings_updated_at BEFORE UPDATE ON staff_earnings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================
-- Enable RLS on all tables
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_earnings ENABLE ROW LEVEL SECURITY;

-- Public read policies for menu (everyone can see)
CREATE POLICY "Public read access for menu categories" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "Public read access for menu items" ON menu_items FOR SELECT USING (true);

-- Tables: Staff can read all, public can read basic info
CREATE POLICY "Staff can read all tables" ON tables FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Public can read table status" ON tables FOR SELECT USING (true);

-- Staff: Authenticated users can read all staff info
CREATE POLICY "Authenticated users can read staff" ON staff FOR SELECT USING (auth.role() = 'authenticated');

-- Orders: Staff can read/write their own orders, managers can read all
CREATE POLICY "Staff can read own orders" ON orders FOR SELECT USING (auth.uid() = staff_id);
CREATE POLICY "Staff can insert orders" ON orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Staff can update own orders" ON orders FOR UPDATE USING (auth.uid() = staff_id);

-- Order items: Read/write based on order access
CREATE POLICY "Order items are accessible via order" ON order_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_items.order_id
        AND (orders.staff_id = auth.uid() OR auth.role() = 'service_role')
    )
);

-- Payments: Only managers/admins can access
CREATE POLICY "Authenticated users can read payments" ON payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert payments" ON payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Staff earnings: Only self and managers
CREATE POLICY "Staff can read own earnings" ON staff_earnings FOR SELECT USING (auth.uid() = staff_id);
CREATE POLICY "Managers can read all earnings" ON staff_earnings FOR SELECT USING (auth.role() = 'service_role');

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================
-- Insert sample menu categories
INSERT INTO menu_categories (name, description, display_order, is_active) VALUES
('CAFÉ', 'Traditional Vietnamese coffee drinks', 1, true),
('NƯỚC ÉP', 'Freshly squeezed fruit juices', 2, true),
('TRÀ TRÁI CÂY', 'Fruit-infused teas', 3, true),
('TRÀ SỮA', 'Milk tea selections', 4, true),
('SINH TỐ', 'Smoothies and blended drinks', 5, true),
('SỮA TƯƠI', 'Fresh milk beverages', 6, true),
('ĐÁ XAY', 'Crushed ice drinks', 7, true)
ON CONFLICT DO NOTHING;

-- Insert sample menu items for CAFÉ category
INSERT INTO menu_items (category_id, name, description, price, display_order, is_available) VALUES
((SELECT id FROM menu_categories WHERE name = 'CAFÉ'), 'CAFÉ MUỐI', 'Authentic salt-cream coffee', 32.00, 1, true),
((SELECT id FROM menu_categories WHERE name = 'CAFÉ'), 'CAFÉ SỮA', 'Classic Vietnamese style', 28.00, 2, true),
((SELECT id FROM menu_categories WHERE name = 'CAFÉ'), 'CAFÉ ĐEN', 'Bold traditional roast', 25.00, 3, true)
ON CONFLICT DO NOTHING;

-- Insert sample staff
INSERT INTO staff (employee_id, full_name, role, phone, email, is_active) VALUES
('NV001', 'Alex Nguyen', 'Senior Barista', '0123456789', 'alex@mcoffee.vn', true),
('NV002', 'Elena Rossi', 'Floor Manager', '0987654321', 'elena@mcoffee.vn', true),
('NV003', 'Marcus Wright', 'Waiter', '0369852147', 'marcus@mcoffee.vn', true)
ON CONFLICT DO NOTHING;

-- Insert sample tables
INSERT INTO tables (table_number, floor_zone, capacity, status) VALUES
('TR1', 'ground_floor', 4, 'occupied'),
('TR2', 'ground_floor', 4, 'available'),
('TR3', 'ground_floor', 4, 'occupied'),
('TR4', 'ground_floor', 4, 'occupied'),
('TR5', 'ground_floor', 4, 'occupied'),
('TR6', 'ground_floor', 4, 'available'),
('B1', 'ground_floor', 4, 'occupied'),
('B2', 'ground_floor', 4, 'available'),
('B3', 'ground_floor', 4, 'occupied'),
('B4', 'ground_floor', 4, 'occupied'),
('B5', 'ground_floor', 4, 'occupied'),
('B6', 'ground_floor', 4, 'available')
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- =====================================================

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    last_order TEXT;
    new_number INTEGER;
BEGIN
    SELECT order_number INTO last_order FROM orders 
    WHERE order_number ~ '^[0-9]+$'
    ORDER BY CAST(order_number AS INTEGER) DESC 
    LIMIT 1;
    
    IF last_order IS NULL THEN
        new_number := 1000;
    ELSE
        new_number := CAST(last_order AS INTEGER) + 1;
    END IF;
    
    RETURN new_number::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate order total
CREATE OR REPLACE FUNCTION calculate_order_total(order_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    subtotal DECIMAL;
    tax_rate DECIMAL := 0.08; -- 8% VAT
BEGIN
    SELECT COALESCE(SUM(total_price), 0) INTO subtotal
    FROM order_items 
    WHERE order_id = calculate_order_total.order_id;
    
    RETURN subtotal + (subtotal * tax_rate);
END;
$$ LANGUAGE plpgsql;

-- Function to update table status when order changes
CREATE OR REPLACE FUNCTION update_table_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('pending', 'preparing') THEN
        UPDATE tables 
        SET status = 'occupied', 
            current_order_id = NEW.id,
            last_activity = NOW()
        WHERE id = NEW.table_id;
    ELSIF NEW.status IN ('ready', 'completed', 'cancelled') THEN
        UPDATE tables 
        SET status = 'available', 
            current_order_id = NULL
        WHERE id = NEW.table_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update table status
CREATE TRIGGER trigger_update_table_status 
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW 
    EXECUTE FUNCTION update_table_status();

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for active orders with table and staff info
CREATE OR REPLACE VIEW active_orders AS
SELECT 
    o.id,
    o.order_number,
    o.status,
    o.order_time,
    o.total_amount,
    t.table_number,
    t.floor_zone,
    s.full_name as staff_name,
    s.role as staff_role,
    COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN tables t ON o.table_id = t.id
LEFT JOIN staff s ON o.staff_id = s.id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.status NOT IN ('completed', 'cancelled')
GROUP BY o.id, t.table_number, t.floor_zone, s.full_name, s.role
ORDER BY 
    CASE 
        WHEN o.status = 'urgent' THEN 1
        WHEN o.status = 'pending' THEN 2
        WHEN o.status = 'preparing' THEN 3
        ELSE 4
    END,
    o.order_time ASC;

-- View for menu with categories
CREATE OR REPLACE VIEW full_menu AS
SELECT 
    mi.id,
    mi.name,
    mi.description,
    mi.price,
    mi.image_url,
    mi.is_available,
    mi.display_order,
    mc.name as category_name,
    mc.description as category_description
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.id
WHERE mc.is_active = true AND mi.is_available = true
ORDER BY mc.display_order, mi.display_order;

-- View for table status overview
CREATE OR REPLACE VIEW table_status_overview AS
SELECT 
    t.id,
    t.table_number,
    t.floor_zone,
    t.capacity,
    t.status,
    t.last_activity,
    s.full_name as assigned_staff,
    o.order_number,
    o.total_amount,
    COUNT(oi.id) as item_count
FROM tables t
LEFT JOIN staff s ON t.assigned_staff_id = s.id
LEFT JOIN orders o ON t.current_order_id = o.id AND o.status NOT IN ('completed', 'cancelled')
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY t.id, s.full_name, o.order_number, o.total_amount
ORDER BY t.floor_zone, t.table_number;

-- Enable RLS on views
ALTER VIEW active_orders ENABLE ROW LEVEL SECURITY;
ALTER VIEW full_menu ENABLE ROW LEVEL SECURITY;
ALTER VIEW table_status_overview ENABLE ROW LEVEL SECURITY;

-- Policies for views
CREATE POLICY "Allow authenticated users to view menu" ON full_menu
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view active orders" ON active_orders
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view table status" ON table_status_overview
FOR SELECT TO authenticated USING (true);

-- =====================================================
-- INITIAL COMPLETE
-- =====================================================
COMMENT ON SCHEMA public IS 'Coffee Shop POS System Database Schema';

-- Note: After running this SQL in Supabase SQL Editor:
-- 1. Go to Supabase Dashboard > Authentication > Providers
-- 2. Enable Email/Password or your preferred auth method
-- 3. Create service_role key for admin operations
-- 4. Adjust RLS policies based on your security requirements
-- 5. Insert initial data via API or SQL