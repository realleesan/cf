// Supabase Client Configuration
// Sử dụng trực tiếp trong browser (không cần backend)
// ✅ HỆ THỐNG SAFE LOAD: KHÔNG BAO GIỜ XUNG ĐỘT, KHÔNG BAO GIỜ LỖI TRÙNG KHAI BÁO

(function() {
    if (window.__supabase_js_loaded) return;
    window.__supabase_js_loaded = true;

    // Supabase credentials
    const SUPABASE_URL = 'https://upqccnvdsovqrklbmsvw.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwcWNjbnZkc292cXJrbGJtc3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1Njk0MDEsImV4cCI6MjA5MTE0NTQwMX0.d1-H0TKBrVbXtMrfBc9OVU6KPvODd5f5OXp8Bzg4hXU';

    const initSupabase = () => {
        if (!window.supabase) {
            console.error('Supabase library not found even after loading.');
            return;
        }
        
        // Create Supabase client
        if (!window.supabaseClient) {
            window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        }
        
        defineApi();
    };

    // ✅ GỌI NẠP CDN TỰ ĐỘNG NẾU CHƯA CÓ
    if (!window.supabase) {
        console.info('✓ Tự động nạp Supabase CDN...');
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
            console.info('✓ Supabase CDN đã nạp xong.');
            initSupabase();
        };
        script.onerror = () => console.error('Lỗi khi nạp Supabase CDN');
        document.head.appendChild(script);
    } else {
        initSupabase();
    }

    function defineApi() {
        const supabase = window.supabaseClient;
        if (!supabase) return;

// API Functions - only define if not exists
if (typeof window.api === 'undefined') {
    var api;
    api = {
    // Menu
    async getCategories() {
        const { data, error } = await supabase
            .from('menu_categories')
            .select('*')
            .eq('is_active', true)
            .order('display_order');
        if (error) throw error;
        return data;
    },
    
    async getMenuItems(categoryId = null) {
        let query = supabase
            .from('menu_items')
            .select('*')
            .eq('is_available', true)
            .order('display_order');
        
        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },
    
    // Orders
    async getActiveOrders() {
        const { data, error } = await supabase
            .from('active_orders')
            .select('*')
            .order('order_time', { ascending: true });
        if (error) throw error;
        return data;
    },
    
    async getOrderHistory(limit = 50) {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                table:tables(table_number),
                staff:staff(full_name)
            `)
            .in('status', ['completed', 'cancelled'])
            .order('completed_time', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data;
    },
    
    async createOrder(orderData) {
        // Generate order number
        const { data: lastOrder } = await supabase
            .from('orders')
            .select('order_number')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        let orderNumber = '1001';
        if (lastOrder) {
            const lastNum = parseInt(lastOrder.order_number) || 1000;
            orderNumber = (lastNum + 1).toString();
        }
        
        // Calculate totals
        const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const taxAmount = subtotal * 0.08;
        const totalAmount = subtotal + taxAmount;
        
        // Create order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                order_number: orderNumber,
                table_id: orderData.table_id,
                staff_id: orderData.staff_id,
                order_type: orderData.order_type || 'dine-in',
                status: 'pending',
                subtotal,
                tax_amount: taxAmount,
                total_amount: totalAmount,
                special_instructions: orderData.special_instructions
            })
            .select()
            .single();
        
        if (orderError) throw orderError;
        
        // Create order items
        const orderItems = orderData.items.map(item => ({
            order_id: order.id,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity
        }));
        
        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);
        
        if (itemsError) throw itemsError;
        
        // Update table status
        if (orderData.table_id) {
            await supabase
                .from('tables')
                .update({ status: 'occupied', current_order_id: order.id })
                .eq('id', orderData.table_id);
        }
        
        return order;
    },
    
    async updateOrderStatus(orderId, status) {
        const updateData = { status };
        
        if (status === 'ready' || status === 'completed') {
            updateData.completed_time = new Date().toISOString();
        }
        
        const { data, error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId)
            .select()
            .single();
        
        if (error) throw error;
        
        // Update table to available if order completed
        if (status === 'ready' || status === 'completed' || status === 'cancelled') {
            const { data: order } = await supabase
                .from('orders')
                .select('table_id')
                .eq('id', orderId)
                .single();
            
            if (order?.table_id) {
                await supabase
                    .from('tables')
                    .update({ status: 'available', current_order_id: null })
                    .eq('id', order.table_id);
            }
        }
        
        return data;
    },
    
    // Tables
    async getTables() {
        const { data, error } = await supabase
            .from('table_status_overview')
            .select('*')
            .order('floor_zone', { ascending: true })
            .order('table_number', { ascending: true });
        if (error) throw error;
        return data;
    },
    
    // Staff
    async getStaff() {
        const { data, error } = await supabase
            .from('staff')
            .select('*')
            .eq('is_active', true)
            .order('full_name');
        if (error) throw error;
        return data;
    },
    
    async getStaffEarningsSummary() {
        const { data: staff, error: staffError } = await supabase
            .from('staff')
            .select('*')
            .eq('is_active', true);
        
        if (staffError) throw staffError;
        
        // Get recent earnings
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        
        const { data: earnings, error: earningsError } = await supabase
            .from('staff_earnings')
            .select('*')
            .gte('period_start', monthStart);
        
        if (earningsError) throw earningsError;
        
        // Combine
        return staff.map(s => {
            const staffEarnings = earnings?.filter(e => e.staff_id === s.id) || [];
            const totalEarnings = staffEarnings.reduce((sum, e) => sum + parseFloat(e.total_earnings || 0), 0);
            return { ...s, total_earnings: totalEarnings };
        });
    }
        };
        window.api = api;
    }
  }
})();