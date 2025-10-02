import { supabase } from '@/lib/supabase'

export const User = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      console.log('Auth error:', error);
      throw new Error('Not authenticated')
    }
    
    console.log('Getting user profile for:', user.email);
    
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.log('Profile error:', profileError);
      // If user doesn't exist in public.users, create them
      if (profileError.code === 'PGRST116') {
        console.log('Creating new user profile for:', user.email);
        const newProfile = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          profile_picture: user.user_metadata?.avatar_url,
          is_admin: user.email === 'darshanrl016@gmail.com' // Make this user admin
        }
        
        const { data: createdProfile, error: createError } = await supabase
          .from('users')
          .insert(newProfile)
          .select()
          .single()
        
        if (createError) {
          console.error('Error creating profile:', createError);
          throw createError;
        }
        console.log('Profile created successfully:', createdProfile);
        return { ...user, ...createdProfile }
      }
      throw profileError
    }
    console.log('Profile found:', profile);
    return { ...user, ...profile }
  },

  async list() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
    
    if (error) throw error
    return data
  },

  async getById(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  async login(email, password) {
    console.log('Attempting login for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('Login error:', error);
      throw error;
    }
    
    console.log('Auth successful, getting profile for:', data.user.email);
    
    // Get or create user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    if (profileError) {
      console.log('Profile error:', profileError);
      // If user doesn't exist in public.users, create them
      if (profileError.code === 'PGRST116') {
        console.log('Creating new user profile for:', data.user.email);
        const newProfile = {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
          profile_picture: data.user.user_metadata?.avatar_url,
          is_admin: data.user.email === 'darshanrl016@gmail.com' // Make this user admin
        }
        
        const { data: createdProfile, error: createError } = await supabase
          .from('users')
          .insert(newProfile)
          .select()
          .single()
        
        if (createError) {
          console.error('Error creating profile:', createError);
          throw createError;
        }
        console.log('Profile created successfully:', createdProfile);
        return { ...data.user, ...createdProfile }
      }
      throw profileError
    }
    
    console.log('Profile found:', profile);
    return { ...data.user, ...profile }
  },

  async signup(email, password, full_name) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name }
      }
    })
    
    if (error) throw error
    
    // Create user profile
    if (data.user) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name
        })
      
      if (insertError) console.error('Error creating profile:', insertError)
    }
    
    return data
  },

  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async update(id, userData) {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateTotalEarnings(userId) {
    // Calculate total earnings from certificates
    const { data: certificates, error: certError } = await supabase
      .from('certificates')
      .select('prize_amount')
      .eq('user_id', userId)
    
    if (certError) throw certError
    
    const totalEarnings = certificates.reduce((sum, cert) => sum + (cert.prize_amount || 0), 0)
    
    // Update user's total_earnings field
    const { data, error } = await supabase
      .from('users')
      .update({ total_earnings: totalEarnings })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },
}
