# 🔑 Admin Management Guide

This guide explains how admin authentication works in your NextLS application and how to manage admin users.

## 🔍 **How Admin Authentication Works**

### 1. **Database Storage**

- Admin status is stored in the `users` table with the `isAdmin` boolean field
- When a user is created, `isAdmin` defaults to `false`
- Only users with `isAdmin: true` can access admin features

### 2. **Authentication Flow**

```
1. User logs in via Kinde Auth
2. System gets user ID from Kinde session
3. System queries database: SELECT isAdmin FROM users WHERE id = ?
4. If isAdmin = true, user gets admin access
5. If isAdmin = false, user gets "Access Denied"
```

### 3. **Protected Endpoints**

- `/api/health` - Health check endpoint (admin only)
- `/admin/monitoring` - Monitoring dashboard (admin only)

## 🛠️ **Managing Admin Users**

### **Method 1: Using the Admin Management Script**

```bash
# List current admin users
node scripts/manage-admins.js

# Make a user admin by email
node scripts/manage-admins.js --make-admin user@example.com

# Remove admin privileges
node scripts/manage-admins.js --remove-admin user@example.com

# List all users
node scripts/manage-admins.js --list-users
```

### **Method 2: Direct Database Access**

```sql
-- Make a user admin
UPDATE users SET "isAdmin" = true WHERE email = 'user@example.com';

-- Remove admin privileges
UPDATE users SET "isAdmin" = false WHERE email = 'user@example.com';

-- List all admins
SELECT email, name, "isAdmin" FROM users WHERE "isAdmin" = true;
```

### **Method 3: Using Prisma Studio**

```bash
# Open Prisma Studio
npm run db:studio

# Navigate to users table
# Find the user you want to make admin
# Edit the isAdmin field to true
```

## 🔧 **Admin Management Functions**

### **Check if User is Admin**

```typescript
import { isAdminUser } from "@/lib/security-config";

const isAdmin = await isAdminUser(userId);
if (isAdmin) {
  // User has admin privileges
}
```

### **Get All Admin Users**

```typescript
import { getAdminUsers } from "@/lib/admin-utils";

const admins = await getAdminUsers();
console.log(admins);
```

### **Make User Admin**

```typescript
import { makeUserAdmin } from "@/lib/admin-utils";

const user = await makeUserAdmin(userId);
console.log(`${user.email} is now an admin`);
```

## 🚨 **Security Considerations**

### **1. Admin Access Control**

- ✅ **DONE**: Health endpoint requires admin status
- ✅ **DONE**: Monitoring dashboard requires admin status
- ✅ **DONE**: Database queries verify admin status
- ✅ **DONE**: Fail-safe: denies access if database query fails

### **2. Admin User Management**

- 🔄 **TODO**: Add audit logging for admin changes
- 🔄 **TODO**: Add admin role expiration
- 🔄 **TODO**: Add admin session timeout
- 🔄 **TODO**: Add admin access logging

### **3. Production Security**

- 🔄 **TODO**: Add IP whitelist for admin functions
- 🔄 **TODO**: Add two-factor authentication for admin access
- 🔄 **TODO**: Add admin access notifications

## 📋 **Admin Management Checklist**

### **Initial Setup**

- [ ] Identify who should be admins
- [ ] Make first admin user
- [ ] Test admin access to monitoring dashboard
- [ ] Test admin access to health endpoint

### **Ongoing Management**

- [ ] Regularly review admin users
- [ ] Remove admin access for inactive users
- [ ] Monitor admin access logs
- [ ] Update admin permissions as needed

### **Security Maintenance**

- [ ] Audit admin user list monthly
- [ ] Review admin access logs
- [ ] Update admin management procedures
- [ ] Test admin access controls

## 🚀 **Quick Start Commands**

### **Make Your First Admin**

```bash
# 1. Find your user email
node scripts/manage-admins.js --list-users

# 2. Make yourself admin
node scripts/manage-admins.js --make-admin your-email@example.com

# 3. Test admin access
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/health
```

### **Verify Admin Status**

```bash
# Check current admins
node scripts/manage-admins.js

# Test admin access in browser
# Visit: http://localhost:3000/admin/monitoring
```

## 🔍 **Troubleshooting**

### **"Access Denied" Error**

1. Check if user is admin: `node scripts/manage-admins.js`
2. Verify user email in database
3. Check if user is logged in
4. Verify admin status in database

### **"Unauthorized" Error**

1. Check if user is logged in
2. Verify Kinde session is valid
3. Check if user exists in database
4. Verify database connection

### **Database Connection Issues**

1. Check DATABASE_URL environment variable
2. Verify database is running
3. Check Prisma connection
4. Run database migrations if needed

## 📞 **Support**

If you need help with admin management:

1. **Check the admin management script**: `node scripts/manage-admins.js`
2. **Review the security configuration**: `src/lib/security-config.ts`
3. **Check the admin utilities**: `src/lib/admin-utils.ts`
4. **Test admin access**: Visit `/admin/monitoring`

---

**Remember: Admin access is powerful - only give it to trusted users!** 🔑
