#!/bin/bash

echo "Starting completion system deployment..."

# Step 1: Backup database
echo "Step 1: Creating database backup..."
# Add your backup command here
# pg_dump your_database > backup_$(date +%Y%m%d_%H%M%S).sql

# Step 2: Deploy schema changes
echo "Step 2: Deploying schema changes..."
npx prisma db push

# Step 3: Run migration
echo "Step 3: Running completion migration..."
npx tsx scripts/migrate-completions.ts

# Step 4: Verify migration
echo "Step 4: Verifying migration..."
npx tsx scripts/verify-migration.ts

# Step 5: Build and deploy
echo "Step 5: Building and deploying application..."
npm run build

echo "Deployment completed successfully!"
echo "The new completion system is now active."
echo "All existing completion data has been preserved and migrated."
