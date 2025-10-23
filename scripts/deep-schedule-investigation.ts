import { db } from "../src/db";

async function deepScheduleInvestigation() {
  console.log("🔍 Deep investigation of schedule conflicts...");
  
  try {
    // Get all events for October 2024 (based on the image showing "Tuesday, October")
    const octoberStart = new Date(2024, 9, 1); // October 2024
    const octoberEnd = new Date(2024, 9, 31, 23, 59, 59);
    
    const octoberEvents = await db.event.findMany({
      where: {
        date: {
          gte: octoberStart,
          lte: octoberEnd,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            archived: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    console.log(`📊 Events in October 2024: ${octoberEvents.length}`);
    
    if (octoberEvents.length > 0) {
      console.log("\n📅 All October events:");
      octoberEvents.forEach((event, index) => {
        const dateStr = event.date.toISOString();
        const timeStr = event.date.toTimeString().split(' ')[0];
        console.log(`  ${index + 1}. ${event.client?.name || 'Unknown'} - ${dateStr} (${timeStr}) - ${event.status}`);
      });
    }

    // Check specifically for 4:30 PM on any Tuesday in October
    console.log("\n🎯 Checking for 4:30 PM conflicts:");
    const targetTime = "16:30:00"; // 4:30 PM in 24-hour format
    
    const conflictingEvents = octoberEvents.filter(event => {
      const eventTime = event.date.toTimeString().split(' ')[0];
      return eventTime === targetTime;
    });

    if (conflictingEvents.length > 0) {
      console.log(`  ⚠️  Found ${conflictingEvents.length} events at 4:30 PM:`);
      conflictingEvents.forEach(event => {
        console.log(`    - ${event.client?.name || 'Unknown'} - ${event.date.toISOString()} - ${event.status}`);
      });
    } else {
      console.log("  ✅ No events found at 4:30 PM");
    }

    // Check for events within 30 minutes of 4:30 PM (potential time slot conflicts)
    console.log("\n🕐 Checking for events within 30 minutes of 4:30 PM:");
    const timeBuffer = 30 * 60 * 1000; // 30 minutes in milliseconds
    const targetDateTime = new Date(2024, 9, 1, 16, 30, 0); // October 1, 2024 at 4:30 PM
    
    const nearbyEvents = octoberEvents.filter(event => {
      const timeDiff = Math.abs(event.date.getTime() - targetDateTime.getTime());
      return timeDiff <= timeBuffer;
    });

    if (nearbyEvents.length > 0) {
      console.log(`  ⚠️  Found ${nearbyEvents.length} events within 30 minutes of 4:30 PM:`);
      nearbyEvents.forEach(event => {
        const timeStr = event.date.toTimeString().split(' ')[0];
        console.log(`    - ${event.client?.name || 'Unknown'} - ${timeStr} - ${event.status}`);
      });
    }

    // Check for any events that might be causing conflicts regardless of time
    console.log("\n🔍 Checking for any potential conflict sources:");
    
    // 1. Events with null client data
    const nullClientEvents = octoberEvents.filter(event => !event.client);
    if (nullClientEvents.length > 0) {
      console.log(`  ⚠️  ${nullClientEvents.length} events with null client data`);
    }

    // 2. Events with archived clients
    const archivedClientEvents = octoberEvents.filter(event => event.client?.archived);
    if (archivedClientEvents.length > 0) {
      console.log(`  ⚠️  ${archivedClientEvents.length} events with archived clients`);
    }

    // 3. Events with different statuses
    const statusCounts = octoberEvents.reduce((acc, event) => {
      acc[event.status] = (acc[event.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log("  📊 Events by status:");
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`    ${status}: ${count}`);
    });

    // 4. Check for duplicate events
    const duplicateEvents = octoberEvents.reduce((acc, event) => {
      const key = `${event.date.toISOString()}`;
      if (acc[key]) {
        acc[key].push(event);
      } else {
        acc[key] = [event];
      }
      return acc;
    }, {} as Record<string, any[]>);

    const actualDuplicates = Object.values(duplicateEvents).filter(events => events.length > 1);
    if (actualDuplicates.length > 0) {
      console.log(`  ⚠️  ${actualDuplicates.length} sets of duplicate events found`);
    }

    console.log("\n✅ Deep investigation complete!");

  } catch (error) {
    console.error("❌ Error during deep investigation:", error);
  } finally {
    await db.$disconnect();
  }
}

// Run the deep investigation
deepScheduleInvestigation();
