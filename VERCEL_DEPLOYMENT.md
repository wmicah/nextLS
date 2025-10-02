# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Database**: Set up a PostgreSQL database (Vercel Postgres, Supabase, or external)

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js framework

### 2. Environment Variables

Set these environment variables in Vercel Dashboard → Project Settings → Environment Variables:

#### Required Variables:

```
DATABASE_URL=postgresql://username:password@host:port/database
KINDE_CLIENT_ID=your_kinde_client_id
KINDE_CLIENT_SECRET=your_kinde_client_secret
KINDE_ISSUER_URL=https://your-domain.kinde.com
KINDE_SITE_URL=https://your-app.vercel.app
KINDE_LOGOUT_REDIRECT_URL=https://your-app.vercel.app
KINDE_LOGIN_REDIRECT_URL=https://your-app.vercel.app
JWT_SECRET=your_jwt_secret_key_here
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

#### Optional Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
RESEND_API_KEY=your_resend_api_key
OPENAI_API_KEY=your_openai_api_key_here
LESSON_REMINDER_SECRET=cf87d4e0a4968d3ae8f1c62d1d824d573271dc8e6e2d7263c6d051ee6af485fd
```

### 3. Database Setup

#### Option A: Vercel Postgres (Recommended)

1. In Vercel Dashboard → Storage → Create Database → Postgres
2. Copy the connection string to `DATABASE_URL`
3. Run migrations: `npx prisma db push` or set up automatic migrations

#### Option B: External Database

- Use Supabase, Railway, or any PostgreSQL provider
- Update `DATABASE_URL` with your connection string

### 4. Build Configuration

The project is already configured with:

- ✅ `vercel.json` - Vercel-specific settings
- ✅ `next.config.ts` - Next.js configuration optimized for production
- ✅ `.vercelignore` - Files to exclude from deployment
- ✅ Proper build scripts in `package.json`

### 5. Deploy

1. Push your code to GitHub
2. Vercel will automatically build and deploy
3. Check the deployment logs for any issues

## Post-Deployment

### 1. Update Kinde Configuration

1. Go to your Kinde dashboard
2. Update redirect URLs to your Vercel domain
3. Update allowed origins

### 2. Database Migrations

If using external database, run:

```bash
npx prisma db push
```

### 3. Test Your Application

1. Visit your Vercel URL
2. Test authentication flow
3. Test database connections
4. Test file uploads (if using UploadThing)

## Troubleshooting

### Common Issues:

1. **Build Failures**

   - Check environment variables are set
   - Verify all dependencies are in `package.json`
   - Check build logs in Vercel dashboard

2. **Database Connection Issues**

   - Verify `DATABASE_URL` is correct
   - Check database allows connections from Vercel IPs
   - Ensure database is accessible from internet

3. **Authentication Issues**

   - Update Kinde redirect URLs to Vercel domain
   - Verify `KINDE_SITE_URL` matches your Vercel URL

4. **File Upload Issues**
   - Verify UploadThing configuration
   - Check CORS settings

### Performance Optimization:

1. **Image Optimization**: Already configured in `next.config.ts`
2. **Bundle Analysis**: Run `npm run build:analyze` locally
3. **Caching**: API routes have proper cache headers

## Environment-Specific URLs

Update these URLs for production:

- `KINDE_SITE_URL`
- `KINDE_LOGOUT_REDIRECT_URL`
- `KINDE_LOGIN_REDIRECT_URL`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`

Replace `https://your-app.vercel.app` with your actual Vercel domain.

## Security Checklist

- ✅ Security headers configured in `next.config.ts`
- ✅ Environment variables properly set
- ✅ Database credentials secured
- ✅ API keys not exposed in client-side code
- ✅ CORS properly configured

## Monitoring

Consider adding:

- Vercel Analytics
- Error tracking (Sentry)
- Performance monitoring
- Uptime monitoring

Your application is now ready for production deployment on Vercel! 🚀






