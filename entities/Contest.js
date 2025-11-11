import { supabase } from '@/lib/supabase'

export const Contest = {
  async list(order = '-created_date', limit) {
    let query = supabase
      .from('contests')
      .select('*')
      .order('created_at', { ascending: order.startsWith('-') ? false : true })
    
    if (limit) {
      query = query.limit(limit)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return (data || []).map(contest => ({
      ...contest,
      max_photos_per_entry: contest.max_photos_per_entry || 1 // Default to 1 if not set
    }))
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return {
      ...data,
      max_photos_per_entry: data.max_photos_per_entry || 1 // Default to 1 if not set
    }
  },

  async create(contestData) {
    console.log('Contest.create called with data:', contestData);
    
    const { data, error } = await supabase
      .from('contests')
      .insert([{
        ...contestData,
        max_photos_per_entry: contestData.max_photos_per_entry || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Supabase error:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('contests')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('contests')
      .delete()
      .eq('id', id)
    
    if (error) throw error;
    return { success: true };
  }
}
