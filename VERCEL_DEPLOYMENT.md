# ShoPic Vercel Deployment Guide

## 🚀 Deploy to Vercel

### Prerequisites

1. **GitHub Repository**
   - Push your ShoPic code to GitHub
   - Ensure all files are committed and pushed

2. **Supabase Project**
   - Have your Supabase project URL and anon key ready
   - Database should be set up with all tables and policies

### Step 1: Prepare for Deployment

1. **Update Environment Variables**
   ```bash
   # Copy your .env.local values - you'll need these for Vercel
   cat .env.local
   ```

2. **Build Configuration**
   - Vercel automatically detects Vite projects
   - Your `vite.config.js` should be properly configured
   - Build command: `npm run build`
   - Output directory: `dist`

### Step 2: Deploy to Vercel

#### Option A: Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Project Root**
   ```bash
   cd /Users/darshan/Desktop/base444/snapverse
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? `Y`
   - Which scope? Select your account
   - Link to existing project? `N` (for first deployment)
   - Project name: `snapverse` or your preferred name
   - In which directory is your code located? `./`
   - Want to override settings? `N` (Vercel auto-detects Vite)

#### Option B: Vercel Dashboard

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign up/login with GitHub

2. **Import Project**
   - Click "New Project"
   - Import from GitHub repository
   - Select your ShoPic repository

3. **Configure Build Settings**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Step 3: Configure Environment Variables

1. **In Vercel Dashboard:**
   - Go to Project Settings → Environment Variables
   - Add the following variables:

   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **For all environments:**
   - Production: ✅
   - Preview: ✅  
   - Development: ✅

### Step 4: Update Supabase Settings

1. **Authentication URLs**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your Vercel domain to allowed redirect URLs:
   ```
   https://your-app-name.vercel.app/dashboard
   https://your-app-name.vercel.app
   ```

2. **CORS Settings**
   - Add your Vercel domain to allowed origins if needed

### Step 5: Test Deployment

1. **Visit your deployed app**
   - Vercel will provide a URL like: `https://shopic-xyz.vercel.app`
   - Test all major features:
     - Login/Registration
     - Contest viewing
     - File uploads
     - Admin functions

2. **Check Console for Errors**
   - Open browser dev tools
   - Look for any environment variable or API errors

### Step 6: Custom Domain (Optional)

1. **Add Custom Domain**
   - In Vercel Dashboard → Domains
   - Add your custom domain
   - Update DNS records as instructed

2. **Update Supabase URLs**
   - Add custom domain to Supabase auth settings

## 🔧 Troubleshooting

### Common Issues:

1. **Environment Variables Not Working**
   - Ensure variables start with `VITE_`
   - Redeploy after adding environment variables

2. **Build Failures**
   - Check for TypeScript errors
   - Ensure all dependencies are in package.json
   - Check import paths are correct

3. **Authentication Issues**
   - Verify Supabase redirect URLs include your Vercel domain
   - Check environment variables are set correctly

4. **File Upload Issues**
   - Ensure Supabase storage policies allow uploads
   - Check CORS settings in Supabase

### Build Commands Reference:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## 📱 Post-Deployment Checklist

- [ ] App loads correctly
- [ ] Authentication works (Google OAuth + Email)
- [ ] Contest pages load
- [ ] File uploads work
- [ ] Admin functions accessible
- [ ] Database connections working
- [ ] All environment variables set
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active

## 🔄 Continuous Deployment

Vercel automatically redeploys when you push to your main branch:

1. **Make changes locally**
2. **Commit and push to GitHub**
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
3. **Vercel automatically deploys**

Your ShoPic app is now live and ready for college students to use! 🎉
