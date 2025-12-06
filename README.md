# Summit Secure

Client files that never hit your inbox. Ever.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/summitsecure)

> **🚨 SECURITY UPDATE:** Fully patched against CVE-2025-55182 and CVE-2025-66478 (Next.js RCE vulnerabilities)

A production-grade, visually stunning client file drop portal for accountants, attorneys, and consultants. Built with Next.js 15, Supabase, and Tailwind CSS.

## ✨ Features

- **🔐 Secure Authentication** - Magic link + Google OAuth
- **📁 Drag & Drop Uploads** - Professional file upload experience
- **🔒 File Locking System** - TOTP-based unlock flow
- **📊 Real-time Dashboard** - Live file activity monitoring
- **🎨 Custom Branding** - White-label client portals
- **📱 Mobile Responsive** - Works perfectly on all devices
- **⚡ Lightning Fast** - Optimized for performance
- **🌐 Netlify Ready** - One-click deployment

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Netlify account (for deployment)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd summitsecure
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings → API and copy your project URL and anon key
3. Go to Authentication → Providers and enable Google OAuth
4. Set up your database schema by running the SQL in `supabase/migrations/20241206000001_initial_schema.sql`

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Configure Authentication

In your Supabase dashboard:

1. **Authentication → Settings**
   - Site URL: `https://summitsecure.netlify.app`
   - Redirect URLs: `https://summitsecure.netlify.app/auth/callback`

2. **Authentication → Providers → Google**
   - Enable Google provider
   - Add your Google OAuth credentials

### 5. Run Database Migrations

Execute the SQL in `supabase/migrations/20241206000001_initial_schema.sql` in your Supabase SQL editor.

### 6. Seed Fake Data (Optional)

For development, you can seed fake data:

```bash
# In your browser console after logging in
import { seedDatabase } from '/src/lib/seed.ts'
await seedDatabase()
```

### 7. Start Development Server

```bash
npm run dev
```

Visit [https://summitsecure.netlify.app](https://summitsecure.netlify.app)

## 📦 Project Structure

```
├── app/                          # Next.js 15 app directory
│   ├── (marketing)/             # Public pages (landing, auth)
│   ├── (app)/                   # Protected pages (dashboard, clients)
│   └── layout.tsx               # Root layout with providers
├── components/                  # Reusable UI components
│   ├── ui/                      # shadcn/ui components
│   └── providers.tsx            # App providers (auth, toast)
├── lib/                         # Utility libraries
│   ├── supabase.ts              # Supabase client & types
│   ├── utils.ts                 # Helper functions
│   └── seed.ts                  # Fake data generation
├── supabase/                    # Database schema & migrations
│   └── migrations/              # SQL migration files
├── public/                      # Static assets
└── netlify.toml                 # Netlify deployment config
```

## 🎨 Design System

- **Colors**: Dark theme with blue (#2563EB) primary and amber (#F59E0B) accent
- **Typography**: Inter font family
- **Components**: shadcn/ui + Radix UI primitives
- **Animations**: Framer Motion for micro-interactions
- **Icons**: Lucide React

## 🚀 Deployment to Netlify

### One-Click Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/summitsecure)

### Manual Deployment

1. **Connect Repository**
   - Push your code to GitHub/GitLab
   - Connect repository to Netlify

2. **Environment Variables**
   In Netlify dashboard → Site settings → Environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next` (should auto-detect)
   - Node version: 20

4. **Domain Setup**
   - Add custom domain in Netlify dashboard
   - Update Supabase redirect URLs to production domain

5. **Update Supabase Auth**
   In Supabase dashboard:
   - Site URL: `https://yourdomain.com`
   - Redirect URLs: `https://yourdomain.com/auth/callback`

## 🔧 API Reference

### Authentication Endpoints

- `POST /auth/signin` - Magic link sign-in
- `POST /auth/oauth/google` - Google OAuth
- `POST /auth/callback` - Auth callback handler

### File Operations

- `POST /api/upload` - File upload
- `GET /api/files` - List files
- `POST /api/files/:id/unlock` - Unlock files

### Database Tables

- `users` - User accounts
- `firms` - Accounting firms
- `clients` - Client records
- `files` - Uploaded files
- `audit_log` - Activity tracking
- `branding_settings` - Firm branding

## 🎵 Audio & Animations

The app includes subtle sound effects and animations:

- **Success chime** on file uploads
- **Framer Motion** transitions
- **Confetti** animation on upload completion
- **Loading skeletons** for better UX

## 🔒 Security Features

- **Row Level Security** (RLS) on all database tables
- **End-to-end encryption** for file storage
- **Audit logging** for all actions
- **TOTP-based file unlocking**
- **Password-protected portals** (optional)

## 📊 Real-time Updates

Supabase realtime subscriptions provide live updates for:

- New file uploads
- File unlock events
- Client activity
- Audit log entries

## 🧪 Testing

```bash
# Run tests
npm test

# E2E testing with Playwright
npm run test:e2e

# Lint code
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder
- **Issues**: Use GitHub Issues
- **Discussions**: GitHub Discussions for questions

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Supabase](https://supabase.com/) - Backend as a service
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Framer Motion](https://framer.com/motion) - Animation library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

## 🔒 Security Checklist (Post-Upgrade)

After upgrading, run these commands to ensure security:

```bash
# Audit dependencies for vulnerabilities
npm audit

# Fix any audit issues
npm audit fix

# Run security linting
npm run lint

# Test all endpoints for RSC compatibility
curl -I https://summitsecure.netlify.app/api/auth/callback
curl -I https://summitsecure.netlify.app/dashboard
curl -I https://summitsecure.netlify.app/drop/test-share-id
```

### ✅ Security Features Implemented

- **Next.js 16.0.7** with React Compiler enabled
- **React 19.2.1** with hardened RSC implementation
- **Enhanced CSP headers** with strict origin policies
- **X-Frame-Options: DENY** to prevent clickjacking
- **Row Level Security** on all Supabase tables
- **End-to-end encryption** for file storage
- **Secure auth callbacks** with proper validation
- **Environment variable validation** for production safety

### 🛡️ Production Security Headers

```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' *.supabase.co; frame-ancestors 'none';
Referrer-Policy: strict-origin-when-cross-origin
```

Built with ❤️ for accountants, attorneys, and consultants who deserve better file sharing.