import { supabase } from '@/lib/supabase'

export const Certificate = {
  async list(user_id = null) {
    let query = supabase
      .from('certificates')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (user_id) {
      query = query.eq('user_id', user_id)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  },

  async create(certificateData) {
    const { data, error } = await supabase
      .from('certificates')
      .insert(certificateData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('certificates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('certificates')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async download(certificateId) {
    // This would typically generate and return a PDF download link
    const { data, error } = await supabase
      .from('certificates')
      .select('certificate_url')
      .eq('id', certificateId)
      .single()
    
    if (error) throw error
    return data?.certificate_url
  }
}

