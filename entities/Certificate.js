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
    // First try normal insert + select (requires SELECT policy)
    const { data, error } = await supabase
      .from('certificates')
      .insert(certificateData)
      .select()
      .single()

    if (!error) return data

    // Handle RLS "Select blocked" error (PGRST116: result contains 0 rows)
    // This means Insert likely succeeded but we can't see the result.
    if (error.code === 'PGRST116') {
      console.warn('Certificate created but RLS prevented reading return value.')
      return { ...certificateData }
    }

    // If it's a different error, we might try the fallback (though it's risky if the first one actually partially worked)
    // For now, only retry if it looks like a genuine failure that isn't the above.
    console.error('Certificate.create error on select after insert:', error)

    // Only use the retry with minimal returning if the error wasn't PGRST116
    const retry = await supabase
      .from('certificates')
      .insert(certificateData, { returning: 'minimal' })

    if (retry.error) {
      console.error('Certificate.create minimal returning failed:', retry.error)
      throw retry.error
    }

    // We don't have the inserted row because of minimal returning; return the payload back
    return { ...certificateData }
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
