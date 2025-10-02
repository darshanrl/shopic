import { supabase } from '@/lib/supabase'

export const Entry = {
  async list(order = '-created_date', limit) {
    let query = supabase
      .from('entries')
      .select('*')
      .order('created_at', { ascending: order.startsWith('-') ? false : true })
    
    if (limit) {
      query = query.limit(limit)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  },

  async filter(query) {
    let supabaseQuery = supabase
      .from('entries')
      .select('*')
    
    if (query.user_id) {
      supabaseQuery = supabaseQuery.eq('user_id', query.user_id)
    }
    if (query.payment_status) {
      supabaseQuery = supabaseQuery.eq('payment_status', query.payment_status)
    }
    if (query.contest_id) {
      supabaseQuery = supabaseQuery.eq('contest_id', query.contest_id)
    }
    
    const { data, error } = await supabaseQuery
    
    if (error) throw error
    return data || []
  },

  async create(payload) {
    const { data, error } = await supabase
      .from('entries')
      .insert(payload)
      .select('*')
      .single()
    
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('entries')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        users!inner(email, full_name),
        contests(title)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}
