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
                const nextNo = latest && latest.length > 0 ? (parseInt(latest[0].order_number) || 1000) + 1 : 1001;
                
                const { data: order, error: orderErr } = await supabase.from('orders').insert([{
                    table_id: orderData.table_id,
                    order_type: orderData.order_type,
                    order_number: nextNo.toString(),
                    status: 'pending',
                    subtotal: orderData.items.reduce((sum, i) => sum + (i.price * i.quantity), 0), tax_amount: orderData.items.reduce((sum, i) => sum + (i.price * i.quantity), 0) * 0.08, total_amount: orderData.items.reduce((sum, i) => sum + (i.price * i.quantity), 0) * 1.08,
                    special_instructions: orderData.special_instructions
                }]).select();
                if (orderErr) throw orderErr;

                const items = orderData.items.map(i => ({
                    order_id: order[0].id,
                    menu_item_id: i.menu_item_id,
                    quantity: i.quantity,
                    unit_price: i.price,
                    total_price: i.price * i.quantity
                }));
                const { error: itemsErr } = await supabase.from('order_items').insert(items);
                if (itemsErr) throw itemsErr;

                // Mark table as occupied
                if (orderData.table_id) {
                    await this.updateTableStatus(orderData.table_id, 'occupied');
                }

                return order[0];
            },
            async getActiveOrders() {
                const { data, error } = await supabase.from('orders').select('*, order_items(*, menu_items(*)), tables(*)').in('status', ['pending', 'preparing', 'ready']).order('created_at', { ascending: true });
                if (error) throw error;
                return data;
            },
            async getOrderHistory() {
                // Return all orders to track the journey
                const { data, error } = await supabase.from('orders').select('*, order_items(*, menu_items(*)), tables(*)').order('created_at', { ascending: false });
                if (error) throw error;
                return data;
            },
            async updateOrderStatus(orderId, status, staffId = null) {
                const updatePayload = { status };
                if (staffId) updatePayload.staff_id = staffId;
                if (status === 'completed') updatePayload.completed_time = new Date().toISOString();

                const { data, error } = await supabase.from('orders').update(updatePayload).eq('id', orderId).select();
                if (error) throw error;
                if (status === 'completed' && data[0].table_id) {
                    await this.updateTableStatus(data[0].table_id, 'available');
                }
                return data[0];
            },
            async deleteOrder(orderId, tableId) {
                const { error } = await supabase.from('orders').delete().eq('id', orderId);
                if (error) throw error;
                if (tableId) {
                    await this.updateTableStatus(tableId, 'available');
                }
                return true;
            },
            async getStaff() {
                const { data, error } = await supabase.from('staff').select('*').order('name');
                if (error) throw error;
                return data;
            },
            async addTable(tableData) {
                const { data, error } = await supabase.from('tables').insert([{
                    table_number: tableData.table_number,
                    floor_zone: tableData.floor_zone || 'ground',
                    capacity: tableData.capacity || 4,
                    status: 'available'
                }]).select();
                if (error) throw error;
                return data[0];
            },
            async updateTable(id, tableData) {
                const { data, error } = await supabase.from('tables').update({
                    table_number: tableData.table_number,
                    floor_zone: tableData.floor_zone,
                    capacity: tableData.capacity
                }).eq('id', id).select();
                if (error) throw error;
                return data[0];
            },
            async deleteTable(id) {
                const { error } = await supabase.from('tables').delete().eq('id', id);
                if (error) throw error;
                return true;
            },
            async addCategory(categoryData) {
                const { data, error } = await supabase.from('menu_categories').insert([{
                    name: categoryData.name,
                    icon: categoryData.icon || 'star',
                    display_order: categoryData.display_order || 0,
                    is_active: categoryData.is_active !== undefined ? categoryData.is_active : true
                }]).select();
                if (error) throw error;
                return data[0];
            },
            async updateCategory(id, categoryData) {
                const { data, error } = await supabase.from('menu_categories').update({
                    name: categoryData.name,
                    icon: categoryData.icon,
                    display_order: categoryData.display_order,
                    is_active: categoryData.is_active
                }).eq('id', id).select();
                if (error) throw error;
                return data[0];
            },
            async deleteCategory(id) {
                const { error } = await supabase.from('menu_categories').delete().eq('id', id);
                if (error) throw error;
                return true;
            },
            async addMenuItem(itemData) {
                const { data, error } = await supabase.from('menu_items').insert([{
                    category_id: itemData.category_id,
                    name: itemData.name,
                    price: itemData.price,
                    image_url: itemData.image_url,
                    description: itemData.description || '',
                    is_available: itemData.is_available !== undefined ? itemData.is_available : true
                }]).select();
                if (error) throw error;
                return data[0];
            },
            async updateMenuItem(id, itemData) {
                const updatePayload = {};
                if (itemData.category_id !== undefined) updatePayload.category_id = itemData.category_id;
                if (itemData.name !== undefined) updatePayload.name = itemData.name;
                if (itemData.price !== undefined) updatePayload.price = itemData.price;
                if (itemData.image_url !== undefined) updatePayload.image_url = itemData.image_url;
                if (itemData.description !== undefined) updatePayload.description = itemData.description;
                if (itemData.is_available !== undefined) updatePayload.is_available = itemData.is_available;

                const { data, error } = await supabase.from('menu_items').update(updatePayload).eq('id', id).select();
                if (error) throw error;
                return data && data.length > 0 ? data[0] : null;
            },
            async addStaff(staffData) {
                const { data, error } = await supabase.from('staff').insert([{
                    full_name: staffData.full_name,
                    role: staffData.role || 'staff',
                    phone: staffData.phone || '',
                    email: staffData.email || '',
                    is_active: true
                }]).select();
                if (error) throw error;
                return data[0];
            },
            async updateStaff(id, staffData) {
                const { data, error } = await supabase.from('staff')
                    .update(staffData)
                    .eq('id', id)
                    .select();
                if (error) throw error;
                return data[0];
            },
            async deleteStaff(id) {
                const { error } = await supabase.from('staff').delete().eq('id', id);
                if (error) throw error;
                return true;
            }
        };
    }
})();

