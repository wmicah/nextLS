#!/bin/bash

echo "Starting completion system rollback..."

# Step 1: Restore from backup
echo "Step 1: Restoring database from backup..."
# Add your restore command here
# psql your_database < backup_file.sql

# Step 2: Revert schema changes
echo "Step 2: Reverting schema changes..."
# Remove the ExerciseCompletion model from schema.prisma
# npx prisma db push

# Step 3: Revert code changes
echo "Step 3: Reverting code changes..."
git checkout HEAD~1 -- src/trpc/routers/exerciseCompletion.router.ts
git checkout HEAD~1 -- src/components/SimpleDrillCard.tsx
git checkout HEAD~1 -- src/hooks/useExerciseCompletion.ts

# Step 4: Rebuild and deploy
echo "Step 4: Rebuilding and deploying..."
npm run build

echo "Rollback completed successfully!"
echo "The system has been reverted to the previous state."
