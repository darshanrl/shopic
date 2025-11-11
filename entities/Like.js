import { supabase } from '@/lib/supabase'

export const Like = {
  async list() {
    const { data, error } = await supabase
      .from('likes')
      .select('*')
    
    if (error) throw error
    return data || []
  },

  async create(payload) {
    const { data, error } = await supabase
      .from('likes')
      .insert(payload)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async toggle(entry_id, user_id) {
    // Check if like exists
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('entry_id', entry_id)
      .eq('user_id', user_id)
      .single()
    
    if (existingLike) {
      // Unlike
      await this.delete(existingLike.id)
      return { action: 'unliked' }
    } else {
      // Like
      const newLike = await this.create({ entry_id, user_id })
      return { action: 'liked', like: newLike }
    }
  }
}
