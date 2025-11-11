import { supabase } from '@/lib/supabase'

export const Notification = {
  async create(payload) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(payload)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async list(user_id) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async markAsRead(id) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async markAllAsRead(user_id) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user_id)
      .eq('is_read', false)
    
    if (error) throw error
  }
}
