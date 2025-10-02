import { supabase } from '@/lib/supabase'

export const Comment = {
  async filter(query) {
    let supabaseQuery = supabase
      .from('comments')
      .select(`
        *,
        users!inner(email, full_name)
      `)
    
    if (query && query.entry_id) {
      supabaseQuery = supabaseQuery.eq('entry_id', query.entry_id)
    }
    
    const { data, error } = await supabaseQuery
    
    if (error) throw error
    return data || []
  },

  async create(payload) {
    const { data, error } = await supabase
      .from('comments')
      .insert(payload)
      .select(`
        *,
        users!inner(email, full_name)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('comments')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        users!inner(email, full_name)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}
