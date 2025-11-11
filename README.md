# ShoPic - Creative Contest Platform

A modern web application built with React, Vite, and Supabase for creative contests and community engagement.

## 🚀 Features

- **User Authentication**: Sign up/login with email and password
- **Contest Management**: Create, join, and manage photo/video contests
- **File Uploads**: Upload images and videos to Supabase Storage
- **Social Features**: Like, comment, and share creative content
- **Payment Integration**: Entry fees and prize management
- **Real-time Updates**: Live notifications and updates
- **Responsive Design**: Mobile-first design with glass morphism effects

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI Components**: shadcn/ui, Radix UI
- **Icons**: Lucide React
- **Styling**: Tailwind CSS with custom animations

## 📦 Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL schema from `database/schema.sql`
   - Create a storage bucket named `snapverse-files`
   - Set up Row Level Security policies

4. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Add your Supabase URL and anon key to `.env.local`

5. Start the development server:
   ```bash
   npm run dev
   ```

## 🗄 Database Schema

The application uses the following main tables:
- `users` - User profiles and authentication
- `contests` - Contest information and rules
- `entries` - User submissions to contests
- `likes` - User likes on entries
- `comments` - Comments on entries
- `notifications` - User notifications
- `certificates` - Winner certificates

## 🔐 Authentication

Supabase handles authentication with:
- Email/password signup and login
- Row Level Security (RLS) for data protection
- User profile management
- Session management

## 📁 File Storage

Files are stored in Supabase Storage with:
- Organized by category (uploads, payment_proofs, etc.)
- Automatic file naming with timestamps
- Public URL generation for media access
- File type validation

## 🎨 UI/UX Features

- Glass morphism design with backdrop blur
- Gradient borders and animations
- Responsive mobile-first layout
- Smooth transitions and micro-interactions
- Custom scrollbars and loading states
- Floating animations and pulse effects

## 🚀 Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to your preferred platform (Vercel, Netlify, etc.)

3. Configure environment variables in your deployment platform

## 📝 API Endpoints

The application uses Supabase's auto-generated REST API:
- Authentication: `supabase.auth`
- Database: `supabase.from('table_name')`
- Storage: `supabase.storage.from('bucket_name')`

## 🔧 Development

- Hot reload with Vite
- TypeScript support (optional)
- ESLint and Prettier configuration
- Component-based architecture
- Custom hooks for data fetching

## 📱 Mobile Support

- Responsive design for all screen sizes
- Touch-friendly interactions
- Mobile-optimized file uploads
- Progressive Web App features

## 🎯 Future Enhancements

- Real-time chat and messaging
- AI-powered content moderation
- Advanced analytics and insights
- Payment gateway integration
- Mobile app development
- Social media integration

