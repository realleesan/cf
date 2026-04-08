(function() {
    if (window.__supabase_js_loaded) return;
    window.__supabase_js_loaded = true;

    const SUPABASE_URL = 'https://upqccnvdsovqrklbmsvw.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwcWNjbnZkc292cXJrbGJtc3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1Njk0MDEsImV4cCI6MjA5MTE0NTQwMX0.d1-H0TKBrVbXtMrfBc9OVU6KPvODd5f5OXp8Bzg4hXU';

    const initSupabase = () => {
        if (!window.supabase) return;
        if (!window.supabaseClient) {
            window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        }
        defineApi();
    };

    if (!window.supabase) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = initSupabase;
        document.head.appendChild(script);
    } else {
        initSupabase();
    }

    function defineApi() {
        const supabase = window.supabaseClient;
        if (!supabase) return;
        
        window.api = {
            async getCategories() {
                const { data, error } = await supabase.from('menu_categories').select('*').eq('is_active', true).order('display_order');
                if (error) throw error;
                return data;
            },
            async getMenuItems(categoryId) {
                let query = supabase.from('menu_items').select('*').eq('is_available', true);
                if (categoryId) query = query.eq('category_id', categoryId);
                const { data, error } = await query.order('name');
                if (error) throw error;
                return data;
            },
            async getTables() {
                const { data, error } = await supabase.from('tables').select('*').order('table_number');
                if (error) throw error;
                return data;
            },
            async updateTableStatus(tableId, status) {
                const { data, error } = await supabase.from('tables').update({ status }).eq('id', tableId).select();
                if (error) throw error;
                return data ? data[0] : null;
            },
            async createOrder(orderData) {
                const { data: latest } = await supabase.from('orders').select('order_number').order('created_at', { ascending: false }).limit(1);
                const nextNo = latest && latest.length > 0 ? latest[0].order_number + 1 : 1;
                
                const { data: order, error: orderErr } = await supabase.from('orders').insert([{
                    table_id: orderData.table_id,
                    order_type: orderData.order_type,
                    order_number: nextNo,
                    status: 'pending',
                    total_amount: orderData.items.reduce((sum, i) => sum + (i.price * i.quantity), 0) * 1.08,
                    special_instructions: orderData.special_instructions
                }]).select();
                if (orderErr) throw orderErr;

                const items = orderData.items.map(i => ({
                    order_id: order[0].id,
                    menu_item_id: i.menu_item_id,
                    quantity: i.quantity,
                    price: i.price
                }));
                const { error: itemsErr } = await supabase.from('order_items').insert(items);
                if (itemsErr) throw itemsErr;
                return order[0];
            },
            async getActiveOrders() {
                const { data, error } = await supabase.from('orders').select('*, order_items(*, menu_items(*)), tables(*)').in('status', ['pending', 'preparing', 'ready']).order('created_at', { ascending: true });
                if (error) throw error;
                return data;
            },
            async getOrderHistory() {
                const { data, error } = await supabase.from('orders').select('*, order_items(*, menu_items(*)), tables(*)').in('status', ['completed', 'cancelled']).order('created_at', { ascending: false });
                if (error) throw error;
                return data;
            },
            async updateOrderStatus(orderId, status) {
                const { data, error } = await supabase.from('orders').update({ status }).eq('id', orderId).select();
                if (error) throw error;
                if (status === 'completed' && data[0].table_id) {
                    await this.updateTableStatus(data[0].table_id, 'available');
                }
                return data[0];
            },
            async getStaff() {
                const { data, error } = await supabase.from('staff').select('*').order('name');
                if (error) throw error;
                return data;
            }
        };
    }
})();