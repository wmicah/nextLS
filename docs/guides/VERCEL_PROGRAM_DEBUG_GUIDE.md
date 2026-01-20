# NextLevel Coaching - Vercel Program Creation Debug Guide

## 🐛 **Common 400 Error Causes on Vercel**

### **1. Payload Size Limits**

- **Vercel Limit**: 4.5MB for request body
- **Local**: No strict limits
- **Solution**: Optimize program data before sending

### **2. Execution Timeout**

- **Vercel Limit**: 10 seconds for Hobby plan, 60 seconds for Pro
- **Local**: No timeout
- **Solution**: Break down complex programs

### **3. Database Connection Issues**

- **Vercel**: Cold starts can cause connection delays
- **Local**: Always warm connection
- **Solution**: Add connection pooling

### **4. Memory Limits**

- **Vercel**: 1GB for Hobby, 3GB for Pro
- **Local**: Your machine's RAM
- **Solution**: Optimize data structures

## 🔧 **Debugging Steps**

### **Step 1: Check Vercel Logs**

```bash
# Install Vercel CLI
npm i -g vercel

# View logs
vercel logs --follow
```

### **Step 2: Add Client-Side Validation**

```typescript
import {
  isProgramTooComplex,
  optimizeProgramData,
} from "@/lib/program-size-optimizer";

// Before creating program
const complexity = isProgramTooComplex(programData);
if (complexity.isTooComplex) {
  console.warn("Program too complex:", complexity.reasons);
  console.log("Suggestions:", complexity.suggestions);
  // Show user-friendly error
  return;
}

// Optimize data before sending
const optimizedData = optimizeProgramData(programData);
```

### **Step 3: Check Server Logs**

The updated program router now includes detailed logging:

- Payload size check
- Validation errors
- Database operation timing
- Specific error messages

### **Step 4: Test with Smaller Programs**

1. Create a simple 1-week program with 1 day and 1 drill
2. Gradually increase complexity
3. Find the breaking point

## 🚀 **Quick Fixes**

### **Fix 1: Reduce Program Complexity**

```typescript
// Limit program size
const MAX_WEEKS = 10;
const MAX_DAYS_PER_WEEK = 5;
const MAX_DRILLS_PER_DAY = 10;

if (weeks.length > MAX_WEEKS) {
  throw new Error(`Maximum ${MAX_WEEKS} weeks allowed`);
}
```

### **Fix 2: Optimize Data Before Sending**

```typescript
// Remove empty fields
const optimizedData = {
  ...data,
  weeks: data.weeks.map(week => ({
    ...week,
    days: week.days.map(day => ({
      ...day,
      drills: day.drills.map(drill => ({
        ...drill,
        // Remove empty strings
        description: drill.description || undefined,
        videoUrl: drill.videoUrl || undefined,
        notes: drill.notes || undefined,
      })),
    })),
  })),
};
```

### **Fix 3: Add Progress Indicators**

```typescript
// Show user what's happening
const createProgram = async data => {
  setStatus("Validating program...");
  const validation = validateProgramData(data);

  setStatus("Optimizing data...");
  const optimized = optimizeProgramData(data);

  setStatus("Creating program...");
  const result = await trpc.programs.create.mutate(optimized);

  setStatus("Complete!");
  return result;
};
```

## 📊 **Monitoring & Analytics**

### **Add Performance Tracking**

```typescript
// Track program creation metrics
const trackProgramCreation = data => {
  const stats = getProgramStats(data);
  const size = estimatePayloadSize(data);

  console.log("Program Stats:", stats);
  console.log("Payload Size:", formatSize(size));

  // Send to analytics
  analytics.track("program_creation_attempt", {
    weeks: stats.totalWeeks,
    days: stats.totalDays,
    drills: stats.totalDrills,
    size: size,
  });
};
```

## 🛠️ **Advanced Solutions**

### **Solution 1: Chunked Program Creation**

```typescript
// Create program in chunks
const createProgramChunked = async data => {
  // Create basic program first
  const program = await trpc.programs.createBasic.mutate({
    title: data.title,
    description: data.description,
    level: data.level,
    duration: data.duration,
  });

  // Add weeks in batches
  for (const week of data.weeks) {
    await trpc.programs.addWeek.mutate({
      programId: program.id,
      week: week,
    });
  }

  return program;
};
```

### **Solution 2: Background Processing**

```typescript
// Use Vercel's background functions
const createProgramAsync = async data => {
  // Queue the job
  await fetch("/api/programs/create-async", {
    method: "POST",
    body: JSON.stringify(data),
  });

  // Return immediately
  return { status: "queued", message: "Program creation started" };
};
```

### **Solution 3: Database Optimization**

```typescript
// Use transactions for better performance
const createProgramOptimized = async data => {
  return await db.$transaction(async tx => {
    const program = await tx.program.create({
      data: {
        title: data.title,
        // ... basic fields
      },
    });

    // Create weeks in parallel
    const weekPromises = data.weeks.map(week =>
      tx.programWeek.create({
        data: {
          programId: program.id,
          // ... week data
        },
      })
    );

    await Promise.all(weekPromises);
    return program;
  });
};
```

## 🔍 **Debugging Checklist**

- [ ] Check Vercel logs for specific error messages
- [ ] Verify payload size is under 4.5MB
- [ ] Test with smaller programs first
- [ ] Check database connection in Vercel
- [ ] Verify all required fields are present
- [ ] Check for circular references in data
- [ ] Validate all URLs and IDs
- [ ] Test with different browsers
- [ ] Check network tab for request details

## 📞 **Getting Help**

If issues persist:

1. Check Vercel dashboard for function logs
2. Use the debug utilities in `src/lib/program-debug-utils.ts`
3. Test with the program size optimizer
4. Consider upgrading Vercel plan for higher limits

---

**NextLevel Coaching** - Program Creation Debug Guide
