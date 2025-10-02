# ShoPic Setup Guide

## 🚀 Quick Start with Database Connection

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Choose your organization and fill in:
   - **Project Name**: `snapverse`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your location
4. Click "Create new project" (takes ~2 minutes)

### Step 2: Configure Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `database/schema.sql`
3. Paste it into the SQL Editor and click **Run**
4. This will create all necessary tables and security policies

### Step 3: Set up Google OAuth

1. In Supabase dashboard, go to **Authentication > Providers**
2. Enable **Google** provider
3. You'll need to create a Google OAuth app:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to **Credentials > Create Credentials > OAuth 2.0 Client ID**
   - Set authorized redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret to Supabase Google provider settings

### Step 4: Create Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Create a new bucket named `snapverse-files`
3. Make it **public** for file access
4. Set up storage policies (optional - for advanced users)

### Step 5: Update Environment Variables

1. In Supabase dashboard, go to **Settings > API**
2. Copy your **Project URL** and **anon public key**
3. Update `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 6: Test the Application

1. Save your `.env.local` file
2. Restart the development server:
   ```bash
   npm run dev
   ```
3. The app will now use real authentication and database!

## 🔧 Features Enabled

- ✅ **Google OAuth Login**
- ✅ **Email/Password Authentication** 
- ✅ **PostgreSQL Database**
- ✅ **File Storage**
- ✅ **Real-time Updates**
- ✅ **Row Level Security**

## 🎯 Next Steps

1. **Test Authentication**: Try signing up with Google or email
2. **Upload Contest Images**: Test the file upload functionality
3. **Create Sample Contests**: Add some test contests
4. **Invite Friends**: Share the app and test social features

## 🛠 Troubleshooting

### Authentication Issues
- Check Google OAuth redirect URI matches exactly
- Verify Supabase URL and keys are correct
- Check browser console for errors

### Database Issues
- Ensure schema was run successfully
- Check RLS policies are enabled
- Verify user permissions

### File Upload Issues
- Confirm storage bucket exists and is public
- Check file size limits
- Verify storage policies

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Verify all environment variables are set correctly

The app includes comprehensive error handling and will fall back to demo mode if database connection fails.
