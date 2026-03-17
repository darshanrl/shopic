-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Basic RLS Policies
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to site settings
CREATE POLICY "Public can view site settings" 
  ON site_settings FOR SELECT 
  USING (true);

-- Only admins can insert/update/delete settings
CREATE POLICY "Admins can manage site settings" 
  ON site_settings FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Insert default settings if they don't exist
INSERT INTO site_settings (setting_key, setting_value)
VALUES 
  ('about_us_text', 'ShoPic is a creative contest platform where photographers and artists showcase their talent, compete in exciting challenges, and win amazing prizes. Join our community of creative minds and turn your passion into rewards.'),
  ('contact_email_primary', 'darshanrl016@gmail.com'),
  ('contact_phone_primary', '8431469059'),
  ('contact_email_secondary', 'manjappagowda16@gmail.com')
ON CONFLICT (setting_key) DO NOTHING;
