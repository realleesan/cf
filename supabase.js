// Supabase client initialization
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'YOUR_SUPABASE_URL' // Replace with your Supabase project URL
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY' // Replace with your Supabase anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Authentication helper functions
export const auth = {
  // Sign in with email and password
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  getUser() {
    return supabase.auth.getUser()
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database helper functions
export const db = {
  // Menu
  async getMenuCategories() {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
    return { data, error }
  },

  async getMenuItems(categoryId = null) {
    let query = supabase
      .from('menu_items')
      .select(`
        *,
        menu_categories (
          name,
          description
        )
      `)
      .eq('is_available', true)
      .order('display_order')

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query
    return { data, error }
  },

  // Tables
  async getTables() {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('table_number')
    return { data, error }
  },

  async updateTableStatus(tableId, status, orderId = null) {
    const { data, error } = await supabase
      .from('tables')
      .update({
        status,
        current_order_id: orderId,
        last_activity: new Date().toISOString()
      })
      .eq('id', tableId)
    return { data, error }
  },

  // Orders
  async createOrder(orderData) {
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()
    return { data, error }
  },

  async getActiveOrders() {
    const { data, error } = await supabase
      .from('active_orders')
      .select('*')
    return { data, error }
  },

  async updateOrderStatus(orderId, status) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
    return { data, error }
  },

  // Order Items
  async createOrderItem(orderItemData) {
    const { data, error } = await supabase
      .from('order_items')
      .insert(orderItemData)
    return { data, error }
  },

  // Staff
  async getStaff() {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('is_active', true)
    return { data, error }
  },

  // Payments
  async createPayment(paymentData) {
    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
    return { data, error }
  },

  // Staff Earnings
  async getStaffEarnings(staffId) {
    const { data, error } = await supabase
      .from('staff_earnings')
      .select('*')
      .eq('staff_id', staffId)
      .order('period_end', { ascending: false })
    return { data, error }
  },

  // Order Items
  async getOrderItems(orderId) {
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        *,
        menu_items (
          name,
          image_url
        )
      `)
      .eq('order_id', orderId)
    return { data, error }
  }
}