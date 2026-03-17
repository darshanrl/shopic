import { supabase } from '../lib/supabase';

export class SiteSetting {
  static async get(key) {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore "Row not found" errors and just return null
      console.error('Error fetching site setting:', key, error);
      throw error;
    }

    return data ? data.setting_value : null;
  }

  static async getAll() {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value');

    if (error) {
      console.error('Error fetching all site settings:', error);
      throw error;
    }

    // Convert array to a key-value object
    const settingsObj = {};
    if (data) {
        data.forEach(item => {
            settingsObj[item.setting_key] = item.setting_value;
        });
    }
    return settingsObj;
  }

  static async set(key, value) {
    // We use UPSERT since setting_key is UNIQUE
    const { data, error } = await supabase
      .from('site_settings')
      .upsert({ 
          setting_key: key, 
          setting_value: value,
          updated_at: new Date().toISOString()
      }, { onConflict: 'setting_key' })
      .select();

    if (error) {
      console.error('Error setting site setting:', key, error);
      throw error;
    }

    return data;
  }
}
