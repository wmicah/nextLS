# NextLevel Coaching - Deployment Guide

## 🚀 **Domain Setup: nxlvlcoach.com**

### **1. Environment Variables**

Create a `.env.local` file with the following variables:

```env
# Database Configuration
DATABASE_URL="your_database_url_here"
DIRECT_URL="your_direct_database_url_here"

# Authentication (Kinde)
KINDE_CLIENT_ID="your_kinde_client_id"
KINDE_CLIENT_SECRET="your_kinde_client_secret"
KINDE_ISSUER_URL="https://your_kinde_domain.kinde.com"
KINDE_SITE_URL="https://nxlvlcoach.com"
KINDE_POST_LOGOUT_REDIRECT_URL="https://nxlvlcoach.com"
KINDE_POST_LOGIN_REDIRECT_URL="https://nxlvlcoach.com/auth-callback"

# Application Configuration
NEXT_PUBLIC_APP_URL="https://nxlvlcoach.com"
NEXT_PUBLIC_APP_NAME="NextLevel Coaching"
FROM_EMAIL="noreply@nxlvlcoach.com"
ADMIN_EMAIL="admin@nxlvlcoach.com"

# Resend Email Service
RESEND_API_KEY="your_resend_api_key_here"

# UploadThing
UPLOADTHING_SECRET="your_uploadthing_secret"
UPLOADTHING_APP_ID="your_uploadthing_app_id"

# OpenAI (for AI features)
OPENAI_API_KEY="your_openai_api_key"

# YouTube API (optional)
YOUTUBE_API_KEY="your_youtube_api_key"

# Analytics
NEXT_PUBLIC_GA_ID="your_google_analytics_id"
NEXT_PUBLIC_VERCEL_ANALYTICS_ID="your_vercel_analytics_id"

# Security
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="https://nxlvlcoach.com"

# Stripe (for payments)
STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key"
STRIPE_SECRET_KEY="your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"

# Development
NODE_ENV="production"
```

### **2. Resend Email Configuration**

#### **Step 1: Add Domain to Resend**

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click "Add Domain"
3. Enter: `nxlvlcoach.com`
4. Click "Add Domain"

#### **Step 2: Configure DNS Records**

Add these DNS records to your domain provider:

**SPF Record:**

```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

**DKIM Record:**

```
Type: TXT
Name: resend._domainkey
Value: [Provided by Resend]
TTL: 3600
```

**DMARC Record:**

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:admin@nxlvlcoach.com
TTL: 3600
```

#### **Step 3: Verify Domain**

1. Wait for DNS propagation (5-10 minutes)
2. Click "Verify Domain" in Resend dashboard
3. Once verified, you can send emails from `noreply@nxlvlcoach.com`

### **3. Vercel Deployment**

#### **Step 1: Connect Repository**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository containing NextLevel Coaching

#### **Step 2: Configure Environment Variables**

In Vercel dashboard, go to Project Settings > Environment Variables and add all variables from your `.env.local` file.

#### **Step 3: Set Custom Domain**

1. Go to Project Settings > Domains
2. Add `nxlvlcoach.com`
3. Configure DNS records as instructed by Vercel
4. Wait for SSL certificate to be issued

#### **Step 4: Deploy**

1. Push your code to the main branch
2. Vercel will automatically deploy
3. Your site will be available at `https://nxlvlcoach.com`

### **4. Database Setup**

#### **Step 1: Create Database**

1. Use a PostgreSQL database (Supabase, Railway, or Vercel Postgres)
2. Get your connection string
3. Add to environment variables

#### **Step 2: Run Migrations**

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed database
npx prisma db seed
```

### **5. Authentication Setup (Kinde)**

#### **Step 1: Configure Kinde**

1. Go to [Kinde Dashboard](https://app.kinde.com)
2. Create a new application
3. Set redirect URLs:
   - **Login redirect URL**: `https://nxlvlcoach.com/auth-callback`
   - **Logout redirect URL**: `https://nxlvlcoach.com`
   - **Allowed callback URLs**: `https://nxlvlcoach.com/auth-callback`

#### **Step 2: Update Environment Variables**

Add your Kinde credentials to the environment variables.

### **6. File Upload Setup (UploadThing)**

#### **Step 1: Create UploadThing Account**

1. Go to [UploadThing](https://uploadthing.com)
2. Create a new project
3. Get your API keys

#### **Step 2: Configure UploadThing**

1. Add your domain to allowed origins: `https://nxlvlcoach.com`
2. Update environment variables with your keys

### **7. Testing Your Deployment**

#### **Step 1: Test Email Service**

```bash
# Test email configuration
curl -X POST https://nxlvlcoach.com/api/test-email \
  -H "Content-Type: application/json"
```

#### **Step 2: Test Authentication**

1. Visit `https://nxlvlcoach.com`
2. Click "Sign Up" or "Sign In"
3. Complete the authentication flow
4. Verify role selection works

#### **Step 3: Test Core Features**

1. Create a coach account
2. Create a client account
3. Test client-coach connection
4. Test program creation and assignment
5. Test messaging system

### **8. Production Checklist**

#### **Security**

- [ ] All environment variables are set
- [ ] HTTPS is enabled
- [ ] Security headers are configured
- [ ] Rate limiting is active
- [ ] Bot detection is enabled

#### **Performance**

- [ ] Images are optimized
- [ ] Database queries are efficient
- [ ] Caching is configured
- [ ] CDN is active

#### **Monitoring**

- [ ] Analytics are configured
- [ ] Error tracking is active
- [ ] Performance monitoring is enabled
- [ ] Uptime monitoring is configured

### **9. Post-Deployment Tasks**

#### **Step 1: Update Social Media**

- Update all social media profiles with new domain
- Update bio links to point to `https://nxlvlcoach.com`

#### **Step 2: Update Marketing Materials**

- Update business cards
- Update email signatures
- Update website content
- Update documentation

#### **Step 3: SEO Optimization**

- Submit sitemap to Google Search Console
- Set up Google Analytics
- Configure search console
- Monitor search rankings

### **10. Maintenance**

#### **Regular Tasks**

- Monitor email deliverability
- Check database performance
- Update dependencies
- Monitor security alerts
- Backup data regularly

#### **Monitoring**

- Set up uptime monitoring
- Configure error alerts
- Monitor user feedback
- Track performance metrics

## 🎯 **Quick Start Commands**

```bash
# Install dependencies
npm install

# Set up environment
cp env.example .env.local
# Edit .env.local with your actual values

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📞 **Support**

If you encounter any issues during deployment:

1. Check the Vercel deployment logs
2. Verify all environment variables are set
3. Test email configuration
4. Check database connectivity
5. Verify domain DNS settings

## 🔗 **Useful Links**

- [Vercel Documentation](https://vercel.com/docs)
- [Resend Documentation](https://resend.com/docs)
- [Kinde Documentation](https://kinde.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

**NextLevel Coaching** - Professional Coaching Platform
Domain: `nxlvlcoach.com`
