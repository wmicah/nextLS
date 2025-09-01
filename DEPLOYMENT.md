# 🚀 Production Deployment Guide

This guide will help you deploy your Next Level Softball application to production safely and efficiently.

## 📋 Prerequisites

- [ ] Production database (PostgreSQL)
- [ ] Domain name and SSL certificate
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] All tests passing

## 🔧 Environment Setup

### 1. Create Production Environment File

Copy `env.example` to `.env.production` and fill in your production values:

```bash
cp env.example .env.production
```

**Critical Environment Variables:**

```env
NODE_ENV=production
DATABASE_URL="postgresql://username:password@your-db-host:5432/database_name"
KINDE_CLIENT_ID="your_production_kinde_client_id"
KINDE_CLIENT_SECRET="your_production_kinde_client_secret"
KINDE_ISSUER_URL="https://your-domain.kinde.com"
KINDE_SITE_URL="https://your-domain.com"
KINDE_LOGOUT_REDIRECT_URL="https://your-domain.com"
KINDE_LOGIN_REDIRECT_URL="https://your-domain.com"
JWT_SECRET="your_very_long_jwt_secret_key_here"
UPLOADTHING_SECRET="your_production_uploadthing_secret"
UPLOADTHING_APP_ID="your_production_uploadthing_app_id"
RESEND_API_KEY="your_production_resend_api_key"
NEXTAUTH_SECRET="your_very_long_nextauth_secret_key_here"
NEXTAUTH_URL="https://your-domain.com"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### 2. Generate Secure Secrets

```bash
# Generate JWT secret (32+ characters)
openssl rand -base64 32

# Generate NextAuth secret (32+ characters)
openssl rand -base64 32
```

## 🗄️ Database Deployment

### 1. Production Database Setup

```bash
# Set production environment
export NODE_ENV=production

# Run migrations
npm run db:migrate

# Verify migration status
npm run db:status

# Generate Prisma client
npm run db:generate
```

### 2. Database Security Checklist

- [ ] Database user has minimal required permissions
- [ ] Database is not publicly accessible
- [ ] Connection uses SSL/TLS
- [ ] Regular backups configured
- [ ] Connection pooling configured

## 🏗️ Application Deployment

### 1. Build for Production

```bash
# Install dependencies
npm install --production

# Build the application
npm run build

# Verify build
npm run type-check
```

### 2. Start Production Server

```bash
# Start production server
npm run start:prod

# Or use PM2 for process management
pm2 start npm --name "nextls" -- run start:prod
```

## 🔒 Security Hardening

### 1. Security Headers (Already configured in next.config.ts)

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: origin-when-cross-origin
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000; includeSubDomains

### 2. Additional Security Measures

```bash
# Enable HTTPS only
# Set up SSL certificate (Let's Encrypt recommended)

# Configure firewall rules
# Only allow necessary ports (80, 443, 22)

# Set up rate limiting
# Configure fail2ban for SSH protection
```

### 3. Environment Security

- [ ] `.env.production` is not committed to git
- [ ] Production secrets are rotated regularly
- [ ] Access to production environment is restricted
- [ ] Logs don't contain sensitive information

## 📊 Monitoring & Health Checks

### 1. Health Check Endpoint

Your app now includes a health check endpoint at `/api/health`:

```bash
# Check application health
curl https://your-domain.com/api/health

# Run comprehensive health check
npm run health-check
```

### 2. Logging & Monitoring

```bash
# Check application logs
npm run logs

# Monitor memory usage
npm run health-check

# Set up external monitoring (optional):
# - Sentry for error tracking
# - DataDog for application monitoring
# - LogRocket for session replay
```

## 🚨 Error Handling & Recovery

### 1. Graceful Degradation

- Database connection failures are handled gracefully
- API endpoints return appropriate error codes
- User-friendly error messages (no stack traces in production)

### 2. Recovery Procedures

```bash
# Database connection issues
npm run db:migrate
npm run health-check

# Application crashes
pm2 restart nextls
npm run health-check

# Memory issues
pm2 restart nextls --max-memory-restart 1G
```

## 📈 Performance Optimization

### 1. Built-in Optimizations

- Image optimization with WebP/AVIF support
- Code splitting and lazy loading
- Bundle analysis available: `npm run build:analyze`
- Compression enabled
- Security headers optimized

### 2. Database Optimization

```bash
# Monitor slow queries
npm run db:studio

# Check database performance
npm run health-check
```

## 🔄 Deployment Workflow

### 1. Pre-deployment Checklist

- [ ] All tests passing: `npm test`
- [ ] Type checking: `npm run type-check`
- [ ] Linting: `npm run lint`
- [ ] Build successful: `npm run build`
- [ ] Environment variables configured
- [ ] Database migrations ready

### 2. Deployment Steps

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install dependencies
npm install --production

# 3. Run database migrations
npm run db:migrate

# 4. Build application
npm run build

# 5. Restart application
pm2 restart nextls

# 6. Verify deployment
npm run health-check
```

### 3. Rollback Procedure

```bash
# If issues occur, rollback to previous version
git checkout HEAD~1
npm install --production
npm run db:migrate
npm run build
pm2 restart nextls
npm run health-check
```

## 🧪 Post-Deployment Testing

### 1. Health Checks

```bash
# Run comprehensive health check
npm run health-check

# Test critical endpoints
curl https://your-domain.com/api/health
curl https://your-domain.com/
```

### 2. User Flow Testing

- [ ] User registration/login
- [ ] Dashboard loading
- [ ] Client management
- [ ] Video upload/playback
- [ ] Messaging system

## 📋 Maintenance

### 1. Regular Tasks

```bash
# Daily
npm run health-check

# Weekly
npm run db:status
npm run logs

# Monthly
npm update
npm audit fix
```

### 2. Backup Strategy

- Database backups (daily)
- Application logs (weekly)
- Configuration files (monthly)
- User uploads (daily)

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**

   - Check DATABASE_URL in environment
   - Verify database is running
   - Check firewall rules

2. **Build Failures**

   - Clear .next directory: `rm -rf .next`
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run type-check`

3. **Memory Issues**
   - Monitor with: `npm run health-check`
   - Restart with PM2: `pm2 restart nextls`
   - Check for memory leaks

### Support Commands

```bash
# View logs
npm run logs

# Check system status
npm run health-check

# Database status
npm run db:status

# Application info
pm2 show nextls
```

## 📞 Emergency Contacts

- **Database Issues**: Your database administrator
- **Domain/SSL Issues**: Your hosting provider
- **Application Issues**: Development team
- **Security Issues**: Security team (if applicable)

---

**Remember**: Always test in a staging environment before deploying to production!

## 🎯 Next Steps After Deployment

1. **Set up monitoring alerts** for critical failures
2. **Configure automated backups** for database and files
3. **Set up CI/CD pipeline** for automated deployments
4. **Implement user analytics** to track trial usage
5. **Set up error tracking** with Sentry or similar
6. **Configure performance monitoring** with DataDog or similar

---

**Good luck with your trial! 🚀**
